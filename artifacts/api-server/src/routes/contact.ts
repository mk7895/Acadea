import { Router, type IRouter } from "express";
import { SubmitContactBody } from "@workspace/api-zod";
import { z } from "zod";
import { logger } from "../lib/logger";
import { sendContactEmails } from "../lib/mailer";
import { verifyTurnstileToken } from "../lib/turnstile";
import { hasDatabaseConfig } from "../lib/databaseConfig";

const router: IRouter = Router();
let nextSubmissionId = 1;

type LocalSubmission = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  type: string;
  createdAt: string;
};

const localSubmissions: LocalSubmission[] = [];
const contactRequestSchema = SubmitContactBody.and(
  z.object({
    turnstileToken: z.string().min(1).optional(),
  }),
);

function shapeSubmissionResponse(row: {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  };
}

router.post("/contact", async (req, res) => {
  const parsed = contactRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: parsed.error.message });
    return;
  }

  const turnstile = await verifyTurnstileToken(req, parsed.data.turnstileToken);
  if (!turnstile.ok) {
    res.status(400).json({ error: turnstile.message });
    return;
  }

  if (hasDatabaseConfig()) {
    const {
      db,
      contactSubmissionsTable,
      insertContactSchema,
      mentorApplicationsTable,
      insertMentorApplicationSchema,
      scholarshipApplicationsTable,
      insertScholarshipApplicationSchema,
      newsletterSignupsTable,
      insertNewsletterSignupSchema,
    } = await import("@workspace/db");

    const config =
      parsed.data.type === "mentor_application" || parsed.data.type === "mentor"
        ? {
            table: mentorApplicationsTable,
            schema: insertMentorApplicationSchema,
          }
        : parsed.data.type === "scholarship"
          ? {
              table: scholarshipApplicationsTable,
              schema: insertScholarshipApplicationSchema,
            }
          : parsed.data.type === "newsletter"
            ? {
                table: newsletterSignupsTable,
                schema: insertNewsletterSignupSchema,
              }
            : {
                table: contactSubmissionsTable,
                schema: insertContactSchema,
              };

    const insert = config.schema.safeParse({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message,
    });
    if (!insert.success) {
      res.status(422).json({ error: insert.error.message });
      return;
    }

    const [row] = await db
      .insert(config.table)
      .values(insert.data)
      .returning();

    res.status(201).json({
      ...shapeSubmissionResponse(row),
      type: parsed.data.type,
    });

    void sendContactEmails({
      name: row.name,
      email: row.email,
      phone: parsed.data.phone ?? null,
      message: row.message,
      type: parsed.data.type,
    });
    return;
  }

  const row: LocalSubmission = {
    id: nextSubmissionId++,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    message: parsed.data.message,
    type: parsed.data.type,
    createdAt: new Date().toISOString(),
  };
  localSubmissions.push(row);
  logger.warn(
    { submissionId: row.id, type: row.type },
    "Database config not set; storing contact submission in memory only",
  );

  void sendContactEmails({
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    type: row.type,
  });

  res.status(201).json(row);
});

export default router;
