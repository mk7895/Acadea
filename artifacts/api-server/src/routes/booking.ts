import { Router } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";
import { sendBookingEmails } from "../lib/mailer";
import {
  getGoogleAccountEmail,
  getGoogleCalendarId,
  googleApiRequest,
  hasGoogleOAuthCredentials,
} from "../lib/google";

const router = Router();

const TZ = "Europe/Warsaw";
const ZOOM_LINK = "https://nyu.zoom.us/j/5717075193";
const SLOT_DURATION_MS = 20 * 60 * 1000;

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
  return buildSlotsFromBusy([]);
}

function buildSlotsFromBusy(busy: BusyWindow[]) {
  const now = new Date();
  const to = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
  const slots: BookingSlot[] = [];
  const cursor = new Date(now);

  cursor.setMinutes(0, 0, 0);
  cursor.setHours(cursor.getHours() + 1);

  while (cursor < to && slots.length < 80) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      const hour = cursor.getHours();
      if (hour >= 9 && hour < 17) {
        const slotEnd = new Date(cursor.getTime() + SLOT_DURATION_MS);
        const overlaps = busy.some(({ start, end }) => {
          return cursor < new Date(end) && slotEnd > new Date(start);
        });
        if (overlaps) {
          cursor.setHours(cursor.getHours() + 1);
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

    cursor.setHours(cursor.getHours() + 1);
  }

  return slots;
}

// ─── GET /api/booking/slots ──────────────────────────────────────────────────
// Returns available 1-hour slots for the next 14 weekdays (9:00–17:00 Warsaw)
router.get("/slots", async (req, res) => {
  if (!(await hasGoogleOAuthCredentials())) {
    logger.warn(
      "Replit connector identity unavailable; serving local development booking slots",
    );
    return res.json({ slots: buildLocalSlots(), mode: "local" });
  }

  try {
    const calendarId = getGoogleCalendarId();
    const now = new Date();
    const to = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000); // 3 weeks out

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
    const slots = buildSlotsFromBusy(busy);
    return res.json({ slots });
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
});

router.post("/create", async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Nieprawidłowe dane", details: parsed.error.flatten() });
  }
  const { start, end, name, email, phone, topic } = parsed.data;

  if (!(await hasGoogleOAuthCredentials())) {
    logger.warn(
      { start, email },
      "Replit connector identity unavailable; confirming local development booking without calendar sync",
    );

    if (process.env.DATABASE_URL) {
      try {
        const { db, contactSubmissionsTable } = await import("@workspace/db");
        await db.insert(contactSubmissionsTable).values({
          name,
          email,
          phone: phone ?? null,
          message: `Temat: ${topic}\nTryb: local-dev booking`,
          type: "booking",
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
    if (process.env.DATABASE_URL) {
      try {
        const { db, contactSubmissionsTable } = await import("@workspace/db");
        await db.insert(contactSubmissionsTable).values({
          name,
          email,
          phone: phone ?? null,
          message: `Temat: ${topic}`,
          type: "booking",
        });
      } catch (dbErr) {
        logger.warn({ err: dbErr }, "mailing list save failed (non-fatal)");
      }
    } else {
      logger.warn(
        "DATABASE_URL not set; skipping booking lead persistence",
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
