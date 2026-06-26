import { Router, type IRouter } from "express";
import { SubmitContactBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { sendContactEmails } from "../lib/mailer";

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

router.post("/contact", async (req, res) => {
  const parsed = SubmitContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: parsed.error.message });
    return;
  }

  if (process.env.DATABASE_URL) {
    const { db, contactSubmissionsTable, insertContactSchema } = await import(
      "@workspace/db"
    );
    const insert = insertContactSchema.safeParse(parsed.data);
    if (!insert.success) {
      res.status(422).json({ error: insert.error.message });
      return;
    }

    const [row] = await db
      .insert(contactSubmissionsTable)
      .values(insert.data)
      .returning();

    res.status(201).json({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? null,
      message: row.message,
      type: row.type,
      createdAt: row.createdAt.toISOString(),
    });

    void sendContactEmails({
      name: row.name,
      email: row.email,
      phone: row.phone ?? null,
      message: row.message,
      type: row.type,
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
    "DATABASE_URL not set; storing contact submission in memory only",
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
