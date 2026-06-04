import { Router, type IRouter } from "express";
import { db, contactSubmissionsTable, insertContactSchema } from "@workspace/db";
import { SubmitContactBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/contact", async (req, res) => {
  const parsed = SubmitContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: parsed.error.message });
    return;
  }

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
});

export default router;
