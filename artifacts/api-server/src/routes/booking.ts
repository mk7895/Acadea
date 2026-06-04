import { Router } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { z } from "zod";
import { logger } from "../lib/logger";
import { db, contactSubmissionsTable } from "@workspace/db";

const router = Router();

// Google Calendar connector – handles OAuth token injection automatically
const connectors = new ReplitConnectors();
const CALENDAR_ID = "primary";
const TZ = "Europe/Warsaw";
const ZOOM_LINK = "https://nyu.zoom.us/j/5717075193";

// ─── GET /api/booking/slots ──────────────────────────────────────────────────
// Returns available 1-hour slots for the next 14 weekdays (9:00–17:00 Warsaw)
router.get("/slots", async (req, res) => {
  try {
    const now = new Date();
    const to = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000); // 3 weeks out

    const fbRes = await connectors.proxy(
      "google-calendar",
      "/calendar/v3/freeBusy",
      {
        method: "POST",
        body: JSON.stringify({
          timeMin: now.toISOString(),
          timeMax: to.toISOString(),
          timeZone: TZ,
          items: [{ id: CALENDAR_ID }],
        }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const rawFb = await fbRes.text();
    if (!fbRes.ok) {
      logger.error({ status: fbRes.status, body: rawFb.slice(0, 400) }, "freebusy upstream error");
      return res.status(502).json({ error: "Błąd pobierania kalendarza." });
    }
    const fbData = JSON.parse(rawFb) as {
      calendars?: Record<string, { busy: { start: string; end: string }[] }>;
    };
    const busy = fbData.calendars?.[CALENDAR_ID]?.busy ?? [];

    // Build slots: weekdays, 09:00–17:00, hourly. Events are 20 min.
    const SLOT_DURATION_MS = 20 * 60 * 1000;
    const slots: { start: string; end: string; label: string }[] = [];
    const cursor = new Date(now);
    cursor.setMinutes(0, 0, 0);
    cursor.setHours(cursor.getHours() + 1); // at least 1h from now

    while (cursor < to && slots.length < 80) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) {
        const h = cursor.getHours();
        if (h >= 9 && h < 17) {
          const slotEnd = new Date(cursor.getTime() + SLOT_DURATION_MS);
          const overlaps = busy.some(({ start, end }) => {
            return cursor < new Date(end) && slotEnd > new Date(start);
          });
          if (!overlaps) {
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
      }
      cursor.setHours(cursor.getHours() + 1);
    }

    res.json({ slots });
  } catch (err) {
    logger.error({ err }, "booking/slots error");
    res.status(500).json({ error: "Nie udało się pobrać dostępnych terminów." });
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

  try {
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
      attendees: [{ email, displayName: name }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    };

    const eventRes = await connectors.proxy(
      "google-calendar",
      `/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
      {
        method: "POST",
        body: JSON.stringify(event),
        headers: { "Content-Type": "application/json" },
      },
    );

    const created = (await eventRes.json()) as {
      id?: string;
      error?: { message: string };
      start?: { dateTime: string };
      end?: { dateTime: string };
      htmlLink?: string;
    };

    if (created.error) {
      logger.error({ err: created.error }, "Google Calendar event creation failed");
      return res
        .status(500)
        .json({ error: "Nie udało się zarezerwować spotkania." });
    }

    // Save visitor to mailing list via contact_submissions
    try {
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
