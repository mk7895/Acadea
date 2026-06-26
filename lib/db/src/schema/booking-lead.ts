import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingLeadsTable = pgTable("booking_leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingLeadSchema = createInsertSchema(
  bookingLeadsTable,
).omit({
  id: true,
  createdAt: true,
});

export type InsertBookingLead = z.infer<typeof insertBookingLeadSchema>;
export type BookingLead = typeof bookingLeadsTable.$inferSelect;
