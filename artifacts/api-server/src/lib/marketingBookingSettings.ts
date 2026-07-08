import { eq } from "drizzle-orm";
import { hasDatabaseConfig } from "./databaseConfig";

export type WeeklyRule = {
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type AdditionalCalendar = {
  email: string;
  refreshToken: string;
  inviteToEvents: boolean;
  connectedAt?: string;
};

export const DEFAULT_WEEKLY_SCHEDULE: WeeklyRule[] = [
  { weekday: 0, startTime: "09:00", endTime: "17:00", isActive: false },
  { weekday: 1, startTime: "09:00", endTime: "17:00", isActive: true },
  { weekday: 2, startTime: "09:00", endTime: "17:00", isActive: true },
  { weekday: 3, startTime: "09:00", endTime: "17:00", isActive: true },
  { weekday: 4, startTime: "09:00", endTime: "17:00", isActive: true },
  { weekday: 5, startTime: "09:00", endTime: "17:00", isActive: true },
  { weekday: 6, startTime: "09:00", endTime: "17:00", isActive: false },
];

const TIME_PATTERN = /^\d{2}:\d{2}$/;

function normalizeWeeklyScheduleValue(input: unknown): WeeklyRule[] {
  if (!Array.isArray(input)) {
    return DEFAULT_WEEKLY_SCHEDULE.map((entry) => ({ ...entry }));
  }

  const normalized = input
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Record<string, unknown>;
      const weekday = Number(candidate.weekday);
      const startTime = String(candidate.startTime ?? "").trim();
      const endTime = String(candidate.endTime ?? "").trim();
      const isActive = Boolean(candidate.isActive);

      if (
        !Number.isInteger(weekday) ||
        weekday < 0 ||
        weekday > 6 ||
        !TIME_PATTERN.test(startTime) ||
        !TIME_PATTERN.test(endTime)
      ) {
        return null;
      }

      return { weekday, startTime, endTime, isActive };
    })
    .filter((entry): entry is WeeklyRule => Boolean(entry))
    .sort((left, right) =>
      left.weekday === right.weekday
        ? left.startTime.localeCompare(right.startTime)
        : left.weekday - right.weekday,
    );

  return normalized.length ? normalized : DEFAULT_WEEKLY_SCHEDULE.map((entry) => ({ ...entry }));
}

function normalizeAdditionalCalendarsValue(input: unknown): AdditionalCalendar[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized: AdditionalCalendar[] = [];

  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;
    const candidate = entry as Record<string, unknown>;
    const email = String(candidate.email ?? "").trim().toLowerCase();
    const refreshToken = String(candidate.refreshToken ?? "").trim();
    const inviteToEvents = Boolean(candidate.inviteToEvents);
    const connectedAt = String(candidate.connectedAt ?? "").trim();

    if (!email || !refreshToken) {
      continue;
    }

    normalized.push({
      email,
      refreshToken,
      inviteToEvents,
      connectedAt: connectedAt || undefined,
    });
  }

  return normalized;
}

export async function loadMarketingBookingSettings() {
  if (!hasDatabaseConfig()) {
    return {
      weeklySchedule: DEFAULT_WEEKLY_SCHEDULE.map((entry) => ({ ...entry })),
      additionalCalendars: [] as AdditionalCalendar[],
    };
  }

  const { db } = await import("@workspace/db");
  const schema = await import("@workspace/db/schema");
  const marketingBookingSettingsTable = schema.marketingBookingSettingsTable;
  const [row] = await db
    .select()
    .from(marketingBookingSettingsTable)
    .where(eq(marketingBookingSettingsTable.id, 1))
    .limit(1);

  return {
    weeklySchedule: normalizeWeeklyScheduleValue(row?.weeklySchedule),
    additionalCalendars: normalizeAdditionalCalendarsValue(row?.additionalCalendars),
  };
}

export async function saveMarketingBookingSettings(input: {
  weeklySchedule: WeeklyRule[];
  additionalCalendars: AdditionalCalendar[];
}) {
  if (!hasDatabaseConfig()) {
    throw new Error("Database not configured.");
  }

  const { db } = await import("@workspace/db");
  const schema = await import("@workspace/db/schema");
  const marketingBookingSettingsTable = schema.marketingBookingSettingsTable;
  const weeklySchedule = normalizeWeeklyScheduleValue(input.weeklySchedule);
  const additionalCalendars = normalizeAdditionalCalendarsValue(input.additionalCalendars);

  await db
    .insert(marketingBookingSettingsTable)
    .values({
      id: 1,
      weeklySchedule,
      additionalCalendars,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: marketingBookingSettingsTable.id,
      set: {
        weeklySchedule,
        additionalCalendars,
        updatedAt: new Date(),
      },
    });

  return { weeklySchedule, additionalCalendars };
}

export async function upsertMarketingAdditionalCalendar(input: {
  email: string;
  refreshToken: string;
  inviteToEvents: boolean;
}) {
  const current = await loadMarketingBookingSettings();
  const email = input.email.trim().toLowerCase();
  const additionalCalendars = [
    ...current.additionalCalendars.filter((entry) => entry.email !== email),
    {
      email,
      refreshToken: input.refreshToken,
      inviteToEvents: input.inviteToEvents,
      connectedAt: new Date().toISOString(),
    },
  ].sort((left, right) => left.email.localeCompare(right.email));

  return saveMarketingBookingSettings({
    weeklySchedule: current.weeklySchedule,
    additionalCalendars,
  });
}
