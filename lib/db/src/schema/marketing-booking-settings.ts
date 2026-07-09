import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export type MarketingBookingWeeklyRule = {
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type MarketingBookingAdditionalCalendar = {
  email: string;
  fullName?: string;
  refreshToken: string;
  inviteToEvents: boolean;
  connectedAt?: string;
};

export const marketingBookingSettingsTable = pgTable("marketing_booking_settings", {
  id: integer("id").primaryKey().default(1),
  timeZone: text("time_zone").notNull().default("Europe/Warsaw"),
  weeklySchedule: jsonb("weekly_schedule")
    .$type<MarketingBookingWeeklyRule[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  additionalCalendars: jsonb("additional_calendars")
    .$type<MarketingBookingAdditionalCalendar[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MarketingBookingSettings = typeof marketingBookingSettingsTable.$inferSelect;
