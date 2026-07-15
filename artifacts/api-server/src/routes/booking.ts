import { Router } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";
import { sendBookingEmails } from "../lib/mailer";
import { verifyTurnstileToken } from "../lib/turnstile";
import {
  getGoogleAccessTokenForRefreshToken,
  getGoogleAccountEmail,
  getGoogleCalendarId,
  googleApiRequest,
  googleApiRequestWithAccessToken,
  hasGoogleOAuthCredentials,
} from "../lib/google";
import { hasDatabaseConfig } from "../lib/databaseConfig";
import {
  DEFAULT_MARKETING_BOOKING_TIMEZONE,
  DEFAULT_WEEKLY_SCHEDULE,
  loadMarketingBookingSettings,
} from "../lib/marketingBookingSettings";

const router = Router();

const ZOOM_LINK = "https://nyu.zoom.us/j/5717075193";
const SLOT_DURATION_MS = 20 * 60 * 1000;
const QUICK_MENTOR_SLOT_DURATION_MS = 60 * 60 * 1000;
const BUSY_SLOT_LEAD_BUFFER_MS = 30 * 60 * 1000;
const BOOKING_LEAD_TIME_MS = 24 * 60 * 60 * 1000;
const BOOKING_WINDOW_DAYS = 90;
const PUBLIC_BOOKING_WEEKDAYS = 14;

type BookingSlot = { start: string; end: string; label: string };
type BusyWindow = { start: string; end: string };
type BookingMentorOption = { email: string; fullName: string };

type GoogleEventResponse = {
  error?: { message?: string };
  htmlLink?: string;
  id?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
};

function buildLocalSlots() {
  return buildSlotsFromBusy({ busy: [] });
}

function isOutsideLeadWindow(start: Date, now = new Date()) {
  return start.getTime() - now.getTime() >= BOOKING_LEAD_TIME_MS;
}

function parseMonthKey(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearRaw, monthRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

function addWeekdays(start: Date, weekdays: number) {
  const date = new Date(start);
  let counted = 0;

  while (counted < weekdays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      counted += 1;
    }
  }

  return date;
}

function getZonedDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: weekdayMap[parts.weekday] ?? date.getUTCDay(),
  };
}

function zonedDateTimeToUtc(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
  timeZone: string;
}) {
  const second = input.second ?? 0;
  let utcMs = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    second,
  );

  for (let index = 0; index < 4; index += 1) {
    const actual = getZonedDateParts(new Date(utcMs), input.timeZone);
    const desiredAsUtc = Date.UTC(
      input.year,
      input.month - 1,
      input.day,
      input.hour,
      input.minute,
      second,
    );
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const diff = desiredAsUtc - actualAsUtc;
    if (diff === 0) {
      break;
    }
    utcMs += diff;
  }

  return new Date(utcMs);
}

function toMinutes(value: string) {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

function isSlotInsideWorkingHours(
  cursor: Date,
  slotEnd: Date,
  schedule: Array<{ weekday: number; startTime: string; endTime: string; isActive: boolean }>,
) {
  const dayRules = schedule.filter((entry) => entry.weekday === cursor.getDay() && entry.isActive);
  if (!dayRules.length) {
    return false;
  }

  const slotStartMinutes = cursor.getHours() * 60 + cursor.getMinutes();
  const slotEndMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes();

  return dayRules.some((rule) => {
    const startMinutes = toMinutes(rule.startTime);
    const endMinutes = toMinutes(rule.endTime);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return false;
    }
    return slotStartMinutes >= startMinutes && slotEndMinutes <= endMinutes;
  });
}

function buildSlotsFromBusy(input: {
  busy: BusyWindow[];
  month?: { month: number; year: number } | null;
  slotDurationMs?: number;
  weeklySchedule?: Array<{ weekday: number; startTime: string; endTime: string; isActive: boolean }>;
  timeZone?: string;
}) {
  const now = new Date();
  const timeZone = input.timeZone ?? DEFAULT_MARKETING_BOOKING_TIMEZONE;
  const busy = input.busy;
  const slotDurationMs = input.slotDurationMs ?? SLOT_DURATION_MS;
  const weeklySchedule = input.weeklySchedule?.length ? input.weeklySchedule : DEFAULT_WEEKLY_SCHEDULE;
  const slots: BookingSlot[] = [];
  const currentLocal = getZonedDateParts(now, timeZone);
  const localStartDate = new Date(
    Date.UTC(currentLocal.year, currentLocal.month - 1, currentLocal.day),
  );
  const bookingWindowEnd = new Date(
    localStartDate.getTime() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  let rangeStart = localStartDate;
  let rangeEnd = addWeekdays(now, PUBLIC_BOOKING_WEEKDAYS);
  if (input.month) {
    rangeStart = new Date(Date.UTC(input.month.year, input.month.month - 1, 1));
    rangeEnd = new Date(Date.UTC(input.month.year, input.month.month, 1));
  }

  const startMs = Math.max(rangeStart.getTime(), localStartDate.getTime());
  const endMs = Math.min(rangeEnd.getTime(), bookingWindowEnd.getTime());
  if (endMs <= startMs) {
    return [];
  }

  for (
    let currentMs = startMs;
    currentMs < endMs && slots.length < 300;
    currentMs += 24 * 60 * 60 * 1000
  ) {
    const localDate = new Date(currentMs);
    const year = localDate.getUTCFullYear();
    const month = localDate.getUTCMonth() + 1;
    const day = localDate.getUTCDate();
    const weekday = localDate.getUTCDay();
    const matchingRules = weeklySchedule.filter(
      (rule) => rule.isActive && rule.weekday === weekday,
    );

    for (const rule of matchingRules) {
      const startMinutes = toMinutes(rule.startTime);
      const endMinutes = toMinutes(rule.endTime);
      if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
        continue;
      }

      let cursorMinutes = startMinutes;
      while (cursorMinutes + slotDurationMs / 60000 <= endMinutes && slots.length < 300) {
        const slotStart = zonedDateTimeToUtc({
          year,
          month,
          day,
          hour: Math.floor(cursorMinutes / 60),
          minute: cursorMinutes % 60,
          timeZone,
        });
        const slotEnd = new Date(slotStart.getTime() + slotDurationMs);

        if (!isOutsideLeadWindow(slotStart, now)) {
          cursorMinutes += 30;
          continue;
        }

        const overlaps = busy.some(({ start, end }) => {
          const busyStart = new Date(start);
          const busyEnd = new Date(end);
          const protectedStart = new Date(busyStart.getTime() - BUSY_SLOT_LEAD_BUFFER_MS);

          return slotStart < busyEnd && slotEnd > protectedStart;
        });
        if (!overlaps) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            label: slotStart.toLocaleTimeString("pl-PL", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone,
            }),
          });
        }

        cursorMinutes += 30;
      }
    }
  }

  return slots;
}

function getBookingMentorOptions(
  additionalCalendars: Array<{ email: string; fullName?: string }>,
): BookingMentorOption[] {
  return additionalCalendars
    .map((entry) => ({
      email: entry.email,
      fullName: entry.fullName?.trim() || entry.email,
    }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "pl"));
}

function getBookingMentorSlug(email: string) {
  return email.trim().toLowerCase().split("@", 1)[0] ?? "";
}

function findBookingMentorBySlug<T extends { email: string }>(
  additionalCalendars: T[],
  slug: string,
) {
  const matches = additionalCalendars.filter((entry) => getBookingMentorSlug(entry.email) === slug);
  return matches.length === 1 ? matches[0] : null;
}

function toPublicBookingMentor(entry: { email: string; fullName?: string } | null): BookingMentorOption | null {
  if (!entry) {
    return null;
  }

  return {
    email: entry.email,
    fullName: entry.fullName?.trim() || entry.email,
  };
}

// ─── GET /api/booking/slots ──────────────────────────────────────────────────
// Returns available 1-hour slots for the next 14 weekdays (9:00–17:00 Warsaw)
router.get("/slots", async (req, res) => {
  const requestedMonth = parseMonthKey(
    typeof req.query.month === "string" ? req.query.month : undefined,
  );
  if (req.query.month !== undefined && !requestedMonth) {
    return res.status(400).json({ error: "Nieprawidłowy miesiąc." });
  }

  let bookingSettings: Awaited<ReturnType<typeof loadMarketingBookingSettings>>;
  try {
    bookingSettings = await loadMarketingBookingSettings();
  } catch (error) {
    logger.error({ err: error }, "booking settings load failed");
    return res.status(500).json({ error: "Nie udało się odczytać ustawień rezerwacji. Spróbuj ponownie." });
  }
  const mentors = getBookingMentorOptions(bookingSettings.additionalCalendars);
  const requestedMentorEmail =
    typeof req.query.mentorEmail === "string" ? req.query.mentorEmail.trim().toLowerCase() : "";
  const requestedMentorSlug =
    typeof req.query.mentorSlug === "string" ? req.query.mentorSlug.trim().toLowerCase() : "";
  if (requestedMentorEmail && requestedMentorSlug) {
    return res.status(400).json({ error: "Wybierz mentora tylko w jeden sposób." });
  }
  const selectedMentor =
    (requestedMentorEmail
      ? bookingSettings.additionalCalendars.find((entry) => entry.email === requestedMentorEmail)
      : requestedMentorSlug
        ? findBookingMentorBySlug(bookingSettings.additionalCalendars, requestedMentorSlug)
      : null) ?? null;

  if ((requestedMentorEmail || requestedMentorSlug) && !selectedMentor) {
    return res.status(404).json({ error: "Wybrany mentor nie jest dostępny." });
  }
  const slotDurationMs = requestedMentorSlug ? QUICK_MENTOR_SLOT_DURATION_MS : SLOT_DURATION_MS;

  if (!(await hasGoogleOAuthCredentials())) {
    logger.warn(
      "Calendar connector credentials unavailable; serving local development booking slots",
    );
    return res.json({
      slots: buildSlotsFromBusy({
        busy: [],
        month: requestedMonth,
        slotDurationMs,
        timeZone: bookingSettings.timeZone,
        weeklySchedule: bookingSettings.weeklySchedule,
      }),
      mentors,
      selectedMentorEmail: selectedMentor?.email ?? null,
      selectedMentor: toPublicBookingMentor(selectedMentor),
      mode: "local",
      timezone: bookingSettings.timeZone,
    });
  }

  try {
    const calendarId = getGoogleCalendarId();
    const now = new Date();
    const to = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const fbRes = await googleApiRequest("/calendar/v3/freeBusy", {
      method: "POST",
      body: JSON.stringify({
        timeMin: now.toISOString(),
        timeMax: to.toISOString(),
        timeZone: bookingSettings.timeZone,
        items: [{ id: calendarId }],
      }),
    });

    const rawFb = await fbRes.text();
    if (!fbRes.ok) {
      logger.error({ status: fbRes.status, body: rawFb.slice(0, 400) }, "freebusy upstream error");
      return res.status(502).json({ error: "Błąd pobierania kalendarza." });
    }
    const fbData = JSON.parse(rawFb) as {
      calendars?: Record<string, { busy: { start: string; end: string }[] }>;
    };
    const busy = [...(fbData.calendars?.[calendarId]?.busy ?? [])];

    const calendarsToCheck = selectedMentor ? [selectedMentor] : [];

    const additionalBusyWindows = await Promise.all(
      calendarsToCheck.map(async (entry) => {
        try {
          const accessToken = await getGoogleAccessTokenForRefreshToken(entry.refreshToken);
          const response = await googleApiRequestWithAccessToken(accessToken, "/calendar/v3/freeBusy", {
            method: "POST",
            body: JSON.stringify({
              timeMin: now.toISOString(),
              timeMax: to.toISOString(),
              timeZone: bookingSettings.timeZone,
              items: [{ id: entry.email }],
            }),
          });

          const payload = (await response.json().catch(() => ({}))) as {
            calendars?: Record<string, { busy: { start: string; end: string }[] }>;
          };

          if (!response.ok) {
            logger.warn({ email: entry.email, status: response.status }, "secondary calendar freeBusy failed");
            return [];
          }

          return payload.calendars?.[entry.email]?.busy ?? [];
        } catch (error) {
          logger.warn({ err: error, email: entry.email }, "secondary calendar busy scan failed");
          return [];
        }
      }),
    );

    const slots = buildSlotsFromBusy({
      busy: [...busy, ...additionalBusyWindows.flat()],
      month: requestedMonth,
      slotDurationMs,
      timeZone: bookingSettings.timeZone,
      weeklySchedule: bookingSettings.weeklySchedule,
    });
    return res.json({
      slots,
      mentors,
      selectedMentorEmail: selectedMentor?.email ?? null,
      selectedMentor: toPublicBookingMentor(selectedMentor),
      timezone: bookingSettings.timeZone,
    });
  } catch (err) {
    logger.error({ err }, "booking/slots error");
    return res
      .status(500)
      .json({ error: "Nie udało się pobrać dostępnych terminów." });
  }
});

// ─── POST /api/booking/create ────────────────────────────────────────────────
const CreateSchema = z.object({
  start: z.string(),
  end: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  topic: z.string().min(2),
  mentorEmail: z.string().email().optional(),
  mentorSlug: z.string().trim().min(1).max(160).optional(),
  language: z.enum(["pl", "en"]).optional().default("pl"),
  turnstileToken: z.string().min(1).optional(),
});

router.post("/create", async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Nieprawidłowe dane", details: parsed.error.flatten() });
  }
  const { start, end, name, email, phone, topic, mentorEmail, mentorSlug, language } = parsed.data;
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
    return res.status(400).json({ error: "Nieprawidłowy termin spotkania." });
  }

  if (!isOutsideLeadWindow(startDate)) {
    return res.status(400).json({
      error: "Można rezerwować tylko terminy oddalone o co najmniej 24 godziny.",
    });
  }

  let bookingSettings: Awaited<ReturnType<typeof loadMarketingBookingSettings>>;
  try {
    bookingSettings = await loadMarketingBookingSettings();
  } catch (error) {
    logger.error({ err: error }, "booking settings load failed");
    return res.status(500).json({ error: "Nie udało się odczytać ustawień rezerwacji. Spróbuj ponownie." });
  }
  const normalizedMentorEmail = mentorEmail?.trim().toLowerCase();
  const normalizedMentorSlug = mentorSlug?.trim().toLowerCase();
  const selectedMentorFromSlug = normalizedMentorSlug
    ? findBookingMentorBySlug(bookingSettings.additionalCalendars, normalizedMentorSlug)
    : null;
  const selectedMentor = selectedMentorFromSlug ?? (normalizedMentorEmail
    ? bookingSettings.additionalCalendars.find((entry) => entry.email === normalizedMentorEmail) ?? null
    : null);

  if (normalizedMentorSlug && !selectedMentorFromSlug) {
    return res.status(400).json({ error: "Link rezerwacji mentora jest nieaktualny." });
  }

  if ((normalizedMentorEmail || normalizedMentorSlug) && !selectedMentor) {
    return res.status(400).json({ error: "Wybrany mentor nie jest już dostępny. Wybierz inną osobę." });
  }

  if (selectedMentorFromSlug && normalizedMentorEmail && selectedMentorFromSlug.email !== normalizedMentorEmail) {
    return res.status(400).json({ error: "Wybrany mentor nie odpowiada linkowi rezerwacji." });
  }

  if (normalizedMentorSlug && endDate.getTime() - startDate.getTime() !== QUICK_MENTOR_SLOT_DURATION_MS) {
    return res.status(400).json({ error: "Spotkanie z linku mentora musi trwać godzinę." });
  }

  const zoomLink = selectedMentor?.zoomMeetingUrl ?? ZOOM_LINK;

  const turnstile = await verifyTurnstileToken(req, parsed.data.turnstileToken);
  if (!turnstile.ok) {
    return res.status(400).json({ error: turnstile.message });
  }

  if (!(await hasGoogleOAuthCredentials())) {
    logger.warn(
      { start, email, mentorEmail: normalizedMentorEmail },
      "Calendar connector credentials unavailable; confirming local development booking without calendar sync",
    );

    if (hasDatabaseConfig()) {
      try {
        const { db, bookingLeadsTable } = await import("@workspace/db");
        await db.insert(bookingLeadsTable).values({
          name,
          email,
          phone: phone ?? null,
          message: `Temat: ${topic}${selectedMentor ? `\nMentor: ${selectedMentor.fullName?.trim() || selectedMentor.email}` : ""}\nTryb: local-dev booking`,
        });
      } catch (dbErr) {
        logger.warn({ err: dbErr }, "mailing list save failed (non-fatal)");
      }
    }

    return res.json({
      success: true,
      eventId: `local-${Date.now()}`,
      start,
      end,
      calendarLink: undefined,
      zoomLink,
      mode: "local",
    });
  }

  try {
    const calendarId = getGoogleCalendarId();
    const organizerEmail = await getGoogleAccountEmail();
    const invitedAdditionalEmails = selectedMentor
      ? selectedMentor.inviteToEvents
        ? [selectedMentor.email]
        : []
      : [];
    const attendeeEmails = Array.from(
      new Set(
        [email, organizerEmail, ...invitedAdditionalEmails]
          .filter((value): value is string => Boolean(value && value.trim()))
          .map((value) => value.trim().toLowerCase()),
      ),
    );
    const attendees = [
      ...attendeeEmails.map((attendeeEmail) => ({
        email: attendeeEmail,
        displayName:
          attendeeEmail === email ? name : attendeeEmail === organizerEmail ? "ACADEA" : attendeeEmail,
      })),
    ];
    const eventDescription = language === "en"
      ? [
          `Topic: ${topic}`,
          phone ? `Phone: ${phone}` : null,
          selectedMentor ? `Selected mentor: ${selectedMentor.fullName?.trim() || selectedMentor.email}` : null,
          "Candidate contact details are available in the event guest list.",
          "The Zoom link is in the event location.",
          "Booked through the ACADEA website.",
        ]
      : [
          `Temat: ${topic}`,
          phone ? `Telefon: ${phone}` : null,
          selectedMentor ? `Wybrany mentor: ${selectedMentor.fullName?.trim() || selectedMentor.email}` : null,
          "Dane kontaktowe osoby rezerwującej są dostępne na liście gości wydarzenia.",
          "Link Zoom znajduje się w lokalizacji wydarzenia.",
          "Spotkanie umówione przez stronę ACADEA.",
        ];

    const event = {
      summary: `Konsultacja ACADEA — ${name}`,
      description: eventDescription
        .filter(Boolean)
        .join("\n"),
      location: zoomLink,
      start: { dateTime: start, timeZone: bookingSettings.timeZone },
      end: { dateTime: end, timeZone: bookingSettings.timeZone },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    };

    const eventRes = await googleApiRequest(
      `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
      {
        method: "POST",
        body: JSON.stringify(event),
      },
    );

    const created = (await eventRes.json()) as GoogleEventResponse;

    if (!eventRes.ok || created.error) {
      logger.error(
        { status: eventRes.status, err: created.error },
        "Google Calendar event creation failed",
      );
      return res
        .status(500)
        .json({ error: "Nie udało się zarezerwować spotkania." });
    }

    // Save visitor to mailing list via contact_submissions
    if (hasDatabaseConfig()) {
      try {
        const { db, bookingLeadsTable } = await import("@workspace/db");
        await db.insert(bookingLeadsTable).values({
          name,
          email,
          phone: phone ?? null,
          message: `Temat: ${topic}${selectedMentor ? `\nMentor: ${selectedMentor.fullName?.trim() || selectedMentor.email}` : ""}`,
        });
      } catch (dbErr) {
        logger.warn({ err: dbErr }, "mailing list save failed (non-fatal)");
      }
    } else {
      logger.warn(
        "Database config not set; skipping booking lead persistence",
      );
    }

    void sendBookingEmails({
      name,
      email,
      phone: phone ?? null,
      topic,
      start,
      end,
      zoomLink,
      language,
    });

    return res.json({
      success: true,
      eventId: created.id,
      start: created.start?.dateTime,
      end: created.end?.dateTime,
      calendarLink: created.htmlLink,
      zoomLink,
    });
  } catch (err) {
    logger.error({ err }, "booking/create error");
    return res.status(500).json({ error: "Błąd serwera. Spróbuj ponownie." });
  }
});

export default router;
