import { Router } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";
import { sendBookingEmails } from "../lib/mailer";
import { verifyTurnstileToken } from "../lib/turnstile";
import {
  getGoogleAccountEmail,
  getGoogleCalendarId,
  googleApiRequest,
  hasGoogleOAuthCredentials,
} from "../lib/google";
import { hasDatabaseConfig } from "../lib/databaseConfig";

const router = Router();

const TZ = "Europe/Warsaw";
const ZOOM_LINK = "https://nyu.zoom.us/j/5717075193";
const SLOT_DURATION_MS = 20 * 60 * 1000;
const BOOKING_LEAD_TIME_MS = 24 * 60 * 60 * 1000;
const BOOKING_WINDOW_DAYS = 90;
const PUBLIC_BOOKING_WEEKDAYS = 14;

type BookingSlot = { start: string; end: string; label: string };
type BusyWindow = { start: string; end: string };

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

function buildSlotsFromBusy(input: {
  busy: BusyWindow[];
  month?: { month: number; year: number } | null;
}) {
  const now = new Date();
  const bookingWindowEnd = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const busy = input.busy;
  const slots: BookingSlot[] = [];
  const cursor = input.month
    ? new Date(Date.UTC(input.month.year, input.month.month - 1, 1, 0, 0, 0, 0))
    : new Date(now);

  if (!input.month) {
    cursor.setMinutes(0, 0, 0);
    cursor.setHours(cursor.getHours() + 1);
  }

  const rangeEnd = input.month
    ? new Date(Date.UTC(input.month.year, input.month.month, 1, 0, 0, 0, 0))
    : addWeekdays(now, PUBLIC_BOOKING_WEEKDAYS);

  while (cursor < rangeEnd && cursor < bookingWindowEnd && slots.length < 300) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      const hour = cursor.getHours();
      if (hour >= 9 && hour < 17) {
        const slotEnd = new Date(cursor.getTime() + SLOT_DURATION_MS);
        if (!isOutsideLeadWindow(cursor, now)) {
          cursor.setHours(cursor.getHours() + 1);
          continue;
        }
        const overlaps = busy.some(({ start, end }) => {
          return cursor < new Date(end) && slotEnd > new Date(start);
        });
        if (overlaps) {
          cursor.setMinutes(cursor.getMinutes() + 30);
          continue;
        }
        const label = cursor.toLocaleTimeString("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: TZ,
        });
        slots.push({
          start: cursor.toISOString(),
          end: slotEnd.toISOString(),
          label,
        });
      }
    }

    cursor.setMinutes(cursor.getMinutes() + 30);
  }

  return slots;
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

  if (!(await hasGoogleOAuthCredentials())) {
    logger.warn(
      "Calendar connector credentials unavailable; serving local development booking slots",
    );
    return res.json({
      slots: buildSlotsFromBusy({ busy: [], month: requestedMonth }),
      mode: "local",
      timezone: TZ,
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
        timeZone: TZ,
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
    const busy = fbData.calendars?.[calendarId]?.busy ?? [];
    const slots = buildSlotsFromBusy({ busy, month: requestedMonth });
    return res.json({ slots, timezone: TZ });
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
  turnstileToken: z.string().min(1).optional(),
});

router.post("/create", async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Nieprawidłowe dane", details: parsed.error.flatten() });
  }
  const { start, end, name, email, phone, topic } = parsed.data;
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

  const turnstile = await verifyTurnstileToken(req, parsed.data.turnstileToken);
  if (!turnstile.ok) {
    return res.status(400).json({ error: turnstile.message });
  }

  if (!(await hasGoogleOAuthCredentials())) {
    logger.warn(
      { start, email },
      "Calendar connector credentials unavailable; confirming local development booking without calendar sync",
    );

    if (hasDatabaseConfig()) {
      try {
        const { db, bookingLeadsTable } = await import("@workspace/db");
        await db.insert(bookingLeadsTable).values({
          name,
          email,
          phone: phone ?? null,
          message: `Temat: ${topic}\nTryb: local-dev booking`,
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
      zoomLink: ZOOM_LINK,
      mode: "local",
    });
  }

  try {
    const calendarId = getGoogleCalendarId();
    const organizerEmail = await getGoogleAccountEmail();
    const attendees = [
      { email, displayName: name },
      ...(organizerEmail && organizerEmail !== email
        ? [{ email: organizerEmail, displayName: "ACADEA" }]
        : []),
    ];

    const event = {
      summary: `Konsultacja ACADEA — ${name}`,
      description: [
        `Temat: ${topic}`,
        `Email: ${email}`,
        phone ? `Telefon: ${phone}` : null,
        "",
        `Dołącz do spotkania przez Zoom: ${ZOOM_LINK}`,
        "",
        "Spotkanie umówione przez formularz na stronie acadea.org",
      ]
        .filter(Boolean)
        .join("\n"),
      location: ZOOM_LINK,
      start: { dateTime: start, timeZone: TZ },
      end: { dateTime: end, timeZone: TZ },
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
          message: `Temat: ${topic}`,
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
      zoomLink: ZOOM_LINK,
    });

    return res.json({
      success: true,
      eventId: created.id,
      start: created.start?.dateTime,
      end: created.end?.dateTime,
      calendarLink: created.htmlLink,
      zoomLink: ZOOM_LINK,
    });
  } catch (err) {
    logger.error({ err }, "booking/create error");
    return res.status(500).json({ error: "Błąd serwera. Spróbuj ponownie." });
  }
});

export default router;
