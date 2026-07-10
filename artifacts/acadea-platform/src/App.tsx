import { useEffect, useMemo, useState } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import { apiFetch } from "@/lib/api";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/TurnstileWidget";
import { CookieConsentProvider, useCookieConsent } from "@/components/CookieConsent";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { getCookie, setLongLivedCookie } from "@/lib/cookies";

const TOKEN_KEY = "acadea-platform-session";
const TIMEZONE_COOKIE_NAME = "acadea_timezone";
const DASHBOARD_SECTION_COOKIE_PREFIX = "acadea_dashboard_section";
const DEFAULT_TIMEZONE = "Europe/Warsaw";
const TIMEZONE_OPTIONS = [
  { value: "Europe/Warsaw", label: "Polska" },
  { value: "Europe/London", label: "Wielka Brytania" },
  { value: "Europe/Paris", label: "Europa Zachodnia" },
  { value: "Europe/Berlin", label: "Niemcy" },
  { value: "Europe/Amsterdam", label: "Holandia" },
  { value: "Europe/Brussels", label: "Belgia" },
  { value: "Europe/Vienna", label: "Austria" },
  { value: "Europe/Madrid", label: "Hiszpania" },
  { value: "Europe/Rome", label: "Włochy" },
  { value: "Europe/Zurich", label: "Szwajcaria" },
  { value: "Europe/Stockholm", label: "Szwecja" },
  { value: "Europe/Copenhagen", label: "Dania" },
  { value: "Europe/Helsinki", label: "Finlandia" },
  { value: "Europe/Athens", label: "Grecja" },
  { value: "Europe/Istanbul", label: "Turcja" },
  { value: "Europe/Dublin", label: "Irlandia" },
  { value: "America/New_York", label: "USA Wschód" },
  { value: "America/Toronto", label: "Kanada Wschód" },
  { value: "America/Chicago", label: "USA Central" },
  { value: "America/Mexico_City", label: "Meksyk" },
  { value: "America/Denver", label: "USA Góry Skaliste" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Los_Angeles", label: "USA Zachód" },
  { value: "America/Vancouver", label: "Kanada Zachód" },
  { value: "America/Sao_Paulo", label: "Brazylia" },
  { value: "Asia/Dubai", label: "Zatoka Perska" },
  { value: "Asia/Jerusalem", label: "Izrael" },
  { value: "Asia/Riyadh", label: "Arabia Saudyjska" },
  { value: "Asia/Singapore", label: "Singapur" },
  { value: "Asia/Hong_Kong", label: "Hongkong" },
  { value: "Asia/Shanghai", label: "Chiny" },
  { value: "Asia/Tokyo", label: "Japonia" },
  { value: "Asia/Seoul", label: "Korea Południowa" },
  { value: "Asia/Kolkata", label: "Indie" },
  { value: "Australia/Sydney", label: "Australia" },
  { value: "Australia/Melbourne", label: "Australia Melbourne" },
  { value: "Australia/Perth", label: "Australia Perth" },
  { value: "Pacific/Auckland", label: "Nowa Zelandia" },
] as const;

type PlatformUser = {
  avatarUrl: string | null;
  email: string;
  fullName: string;
  id: number;
  notes: string | null;
  role: "admin" | "mentor" | "mentee";
  status: "active" | "pending" | "disabled";
};

type SessionPayload = {
  googleConnections: Array<{
    connectionType: string;
    externalEmail: string | null;
    status: string;
  }>;
  menteeProfile: Record<string, unknown> | null;
  mentorProfile: Record<string, unknown> | null;
  storage: {
    bucket: string | null;
    configured: boolean;
    endpoint: string | null;
  };
  user: PlatformUser;
};

type BootstrapStatus = {
  hasAdmin: boolean;
};

type Overview = {
  counts: {
    admins: number;
    guides: number;
    meetings: number;
    mentees: number;
    mentors: number;
    users: number;
  };
};

type LeadKind = "contact" | "mentor" | "scholarship" | "newsletter" | "booking";

type MaterialItemAction = "check_only" | "file_required" | "file_or_doc" | "check_or_file";
const MAX_MATERIAL_UPLOAD_BYTES = 15 * 1024 * 1024;

type MaterialRowEditor = {
  actionType: MaterialItemAction;
  alternativeOptions: string[];
  appliesToGuideIds: string[];
  anchorAfterKey?: string;
  country: string;
  displayKey?: string;
  docSeedMode?: "plain_text" | "source_tab";
  docTabPrompt?: string;
  docTabTitle?: string;
  guideId: string;
  level: "country" | "university" | "item";
  ownerUserId?: number | null;
  readOnly?: boolean;
  sourceDocumentId?: string;
  sourceTabId?: string;
  suggestedFilename?: string;
  task: string;
  university: string;
};

function platformGuideTypeLabel(value: string) {
  switch (value) {
    case "admin_template":
      return "Szablon uczelni ACADEA";
    case "mentor_blueprint":
      return "Szablon uczelni mentora";
    case "mentor_live":
      return "Uczelnia z mentorem";
    case "self_service_live":
      return "Uczelnia aktywna";
    default:
      return value;
  }
}

function materialTemplateTypeLabel(value: string) {
  switch (value) {
    case "passport_like":
      return "Wspólne dokumenty";
    case "essay_like":
      return "Eseje i zadania";
    case "offer_like":
      return "Po ofercie";
    default:
      return value;
  }
}

function isEssayMaterialTemplate(template: any) {
  return template?.templateType === "essay_like";
}

function isOfferMaterialTemplate(template: any) {
  return template?.templateType === "offer_like";
}

function materialItemActionLabel(value: MaterialItemAction) {
  switch (value) {
    case "check_only":
      return "Tylko checkbox";
    case "file_required":
      return "Tylko upload pliku";
    case "file_or_doc":
      return "Upload pliku lub Google Doc";
    case "check_or_file":
      return "Checkbox lub upload pliku";
    default:
      return value;
  }
}

function findTimezoneOption(value: string) {
  return TIMEZONE_OPTIONS.find((option) => option.value === value);
}

function getMaterialActionStatusMessage(actionKey: string | null) {
  if (!actionKey) {
    return "";
  }
  if (actionKey.endsWith(":upload")) {
    return "Trwa wgrywanie pliku do Google Drive. Nie zamykaj tej karty.";
  }
  if (actionKey.endsWith(":doc")) {
    return "Tworzenie zakładki w Essay Doc...";
  }
  if (actionKey.endsWith(":remove-file")) {
    return "Usuwanie pliku z tego elementu...";
  }
  if (actionKey.endsWith(":remove-doc")) {
    return "Usuwanie zakładki z Essay Doca...";
  }
  if (actionKey.endsWith(":check")) {
    return "Zapisywanie statusu wykonania...";
  }
  return "Zapisywanie zmiany...";
}

function FloatingStatus({ message }: { message: string }) {
  const [dismissedMessage, setDismissedMessage] = useState("");

  useEffect(() => {
    if (message && message !== dismissedMessage) {
      setDismissedMessage("");
    }
  }, [dismissedMessage, message]);

  if (!message || dismissedMessage === message) {
    return null;
  }

  return (
    <div className="floating-status" role="status" aria-live="polite">
      <div className="floating-status-body">{message}</div>
      <button
        aria-label="Ukryj komunikat"
        className="floating-status-close"
        onClick={() => setDismissedMessage(message)}
        type="button"
      >
        ×
      </button>
    </div>
  );
}

function ProgressCircle({
  completed,
  label,
  total,
}: {
  completed: number;
  label?: string;
  total: number;
}) {
  const isComplete = total > 0 && completed >= total;
  return (
    <div
      aria-label={label ?? `${completed}/${total}`}
      className={isComplete ? "progress-circle progress-circle-done" : "progress-circle"}
    >
      <span>{isComplete ? "✓" : `${completed}/${total}`}</span>
    </div>
  );
}

function CompletionDot({ completed }: { completed: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={completed ? "completion-dot completion-dot-done" : "completion-dot"}
    >
      {completed ? "✓" : ""}
    </span>
  );
}

type PlatformMeetingStatus =
  | "scheduled"
  | "cancelled"
  | "completed"
  | "no_show"
  | "rescheduled";

function formatMeetingStatusLabel(status: PlatformMeetingStatus | string) {
  switch (status) {
    case "scheduled":
      return "Zaplanowane";
    case "cancelled":
      return "Anulowane";
    case "completed":
      return "Odbyte";
    case "no_show":
      return "Nie odbyło się";
    case "rescheduled":
      return "Przełożone";
    default:
      return status;
  }
}

function formatMeetingDateRange(meeting: { endsAt: string; startsAt: string }, timeZone = "Europe/Warsaw") {
  const startsAt = new Date(meeting.startsAt);
  const endsAt = new Date(meeting.endsAt);
  const startDateLabel = startsAt.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    timeZone,
    weekday: "long",
    year: "numeric",
  });
  const startTimeLabel = startsAt.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
  const endTimeLabel = endsAt.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
  return `${startDateLabel}, ${startTimeLabel} - ${endTimeLabel}`;
}

function getMeetingCategory(meeting: any) {
  if (meeting.status === "cancelled") {
    return "cancelled";
  }
  if (new Date(meeting.endsAt).getTime() < Date.now()) {
    return "past";
  }
  return "upcoming";
}

function getMaterialItemCompleted(state: {
  completed?: boolean;
  completionMethod?: string | null;
  currentFileUrl?: string | null;
} | null | undefined) {
  if (!state) {
    return false;
  }
  if (state.currentFileUrl) {
    return true;
  }
  return Boolean(state.completed);
}

function countCompletedRows(rows: any[], templateId: number, materialItemStateMap: Map<string, any>) {
  const itemRows = rows.filter((row: any) => row.level === "item" && row.displayKey);
  const completed = itemRows.filter((row: any) =>
    getMaterialItemCompleted(materialItemStateMap.get(`${templateId}:${row.displayKey}`)),
  ).length;
  return {
    completed,
    total: itemRows.length,
  };
}

function getSuggestedOrCurrentFileLabel(row: any, state: any) {
  if (state?.currentFileName) {
    return state.currentFileName;
  }
  const suggested = typeof row?.suggestedFilename === "string" ? row.suggestedFilename.trim() : "";
  return suggested || "Otwórz plik";
}

function getUploadButtonLabel(row: any, state: any) {
  if (state?.currentFileUrl) {
    return "Zastąp plik";
  }
  return "Wgraj plik";
}

function getCompletionToggleLabel(state: any) {
  return getMaterialItemCompleted(state) ? "Oznaczone jako wykonane" : "Oznacz jako wykonane";
}

function getTemplateCompletionForGuide(template: any, guide: any, stateMap: Map<string, any>) {
  const rows = (template.visibleRows ?? []).filter((row: any) => row.level === "item" && rowAppliesToGuide(row, guide));
  return countCompletedRows(rows, Number(template.id), stateMap);
}

function getTemplateCompletion(template: any, stateMap: Map<string, any>) {
  return countCompletedRows(template.visibleRows ?? [], Number(template.id), stateMap);
}

function TimezoneSelect({
  label = "Strefa czasowa",
  onChange,
  value,
}: {
  label?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {TIMEZONE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function getMaterialDocSeedMode(
  row: Pick<MaterialRowEditor, "docSeedMode" | "sourceDocumentId" | "sourceTabId">,
) {
  if (row.docSeedMode === "plain_text" || row.docSeedMode === "source_tab") {
    return row.docSeedMode;
  }
  return row.sourceDocumentId?.trim() && row.sourceTabId?.trim() ? "source_tab" : "plain_text";
}

function normalizeMaterialKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getGuideTemplateId(guide: any) {
  return String(guide?.sourceGuideId ?? guide?.id ?? "");
}

function templateAppliesToGuide(template: any, guide: any) {
  const templateId = getGuideTemplateId(guide);
  const applies = Array.isArray(template?.appliesToGuideIds) ? template.appliesToGuideIds.map(String) : [];
  if (applies.includes(templateId)) {
    return true;
  }
  const rows = Array.isArray(template?.structure) ? template.structure : [];
  return rows.some((row: any) => {
    const rowApplies = Array.isArray(row?.appliesToGuideIds) ? row.appliesToGuideIds.map(String) : [];
    return rowApplies.includes(templateId);
  });
}

function rowAppliesToGuide(row: any, guide: any) {
  const templateId = getGuideTemplateId(guide);
  const applies = Array.isArray(row?.appliesToGuideIds) ? row.appliesToGuideIds.map(String) : [];
  return applies.includes(templateId);
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function formatUniversityNamesPreview(values: Array<string | null | undefined>, limit = 3) {
  const unique = uniqueStrings(values);
  if (!unique.length) {
    return "";
  }
  const visible = unique.slice(0, limit);
  const remaining = unique.length - visible.length;
  return remaining > 0 ? `${visible.join(" • ")} +${remaining}` : visible.join(" • ");
}

function formatGuidePrimaryLabel(guide: any) {
  const title = String(guide?.title ?? "").trim();
  const universityName = String(guide?.universityName ?? "").trim();
  return title || universityName || "Uczelnia";
}

function formatGuideSecondaryLabel(guide: any) {
  const title = String(guide?.title ?? "").trim();
  const universityName = String(guide?.universityName ?? "").trim();
  const country = String(guide?.country ?? "").trim();
  if (title && universityName && title !== universityName) {
    return [country, universityName].filter(Boolean).join(" • ");
  }
  return country;
}

function formatGuideSelectorLabel(guide: any) {
  const primary = formatGuidePrimaryLabel(guide);
  const secondary = formatGuideSecondaryLabel(guide);
  return secondary ? `${primary} • ${secondary}` : primary;
}

function renderMultilineText(value: string | null | undefined) {
  return String(value ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p className="muted multiline-paragraph" key={`${index}-${paragraph.slice(0, 24)}`}>
        {paragraph}
      </p>
    ));
}

function guideHasOffer(guide: any) {
  return guide?.offerStatus === "conditional" || guide?.offerStatus === "final";
}

function offerStatusLabel(value: string) {
  switch (value) {
    case "conditional":
      return "Oferta warunkowa";
    case "final":
      return "Oferta finalna";
    default:
      return "Brak oferty";
  }
}

function formatSlotDayLabel(value: string, timezone: string) {
  return new Date(value).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  });
}

function formatSlotDayKey(value: string, timezone: string) {
  return new Date(value).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  });
}

function formatSlotTimeLabel(value: string, timezone: string) {
  return new Date(value).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

function formatMonthKey(value: Date, timezone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      timeZone: timezone,
    })
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;
  return `${parts.year}-${parts.month}`;
}

function shiftMonthKey(monthKey: string, offset: number) {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const base = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonthHeading(monthKey: string, timezone: string) {
  const [yearRaw, monthRaw] = monthKey.split("-");
  return new Date(Date.UTC(Number(yearRaw), Number(monthRaw) - 1, 1)).toLocaleDateString(
    "pl-PL",
    {
      month: "long",
      year: "numeric",
      timeZone: timezone,
    },
  );
}

function buildMonthCalendar(monthKey: string, timezone: string, availableCounts: Record<string, number>) {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingEmptyDays = firstDay.getUTCDay();
  const cells: Array<
    | { kind: "empty"; key: string }
    | {
        kind: "day";
        key: string;
        dateKey: string;
        dayNumber: number;
        availableCount: number;
      }
  > = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push({ kind: "empty", key: `empty-${monthKey}-${index}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      kind: "day",
      key: dateKey,
      dateKey,
      dayNumber: day,
      availableCount: availableCounts[dateKey] ?? 0,
    });
  }

  return cells;
}

function buildPlatformSlotGroups(
  slots: Array<{ end: string; start: string }>,
  timezone: string,
) {
  const groups = new Map<
    string,
    {
      dateKey: string;
      dayLabel: string;
      slots: Array<{ end: string; label: string; start: string }>;
    }
  >();

  for (const slot of slots) {
    const dateKey = formatSlotDayKey(slot.start, timezone);
    const current =
      groups.get(dateKey) ??
      {
        dateKey,
        dayLabel: formatSlotDayLabel(slot.start, timezone),
        slots: [],
      };
    current.slots.push({
      start: slot.start,
      end: slot.end,
      label: formatSlotTimeLabel(slot.start, timezone),
    });
    groups.set(dateKey, current);
  }

  return Array.from(groups.values());
}

function buildSlotDayIndex(
  slots: Array<{ end: string; start: string }>,
  timezone: string,
) {
  return buildPlatformSlotGroups(slots, timezone).reduce<
    Record<string, { dateKey: string; dayLabel: string; slots: Array<{ end: string; label: string; start: string }> }>
  >((accumulator, entry) => {
    accumulator[entry.dateKey] = entry;
    return accumulator;
  }, {});
}

const MINIMUM_NOTICE_HOUR_OPTIONS = [
  0, 3, 6, 9, 12, 15, 18, 21, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168,
];

const WEEKDAY_LABELS = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
];

function parseGuideMeta(value: string | null | undefined) {
  if (!value || !value.startsWith("__meta:")) {
    return {};
  }
  try {
    return JSON.parse(value.slice("__meta:".length));
  } catch {
    return {};
  }
}

function isItemGuide(guide: any) {
  if (typeof guide?.isItemGuide === "boolean") {
    return guide.isItemGuide;
  }
  const metadata = parseGuideMeta(guide?.driveFolderUrl);
  return (metadata as any).kind === "item_guide";
}

function formatGuideScopeLabel(guide: any, allUniversityGuides: any[]) {
  const appliesToIds = Array.isArray(guide?.itemGuideAppliesToGuideIds)
    ? guide.itemGuideAppliesToGuideIds.map((value: any) => String(value))
    : (() => {
        const metadata = parseGuideMeta(guide?.driveFolderUrl);
        return Array.isArray((metadata as any).appliesToGuideIds)
          ? (metadata as any).appliesToGuideIds.map((value: any) => String(value))
          : [];
      })();

  if (!appliesToIds.length) {
    return "Brak przypisanych przewodników";
  }

  const matchedGuides = allUniversityGuides.filter((entry) => appliesToIds.includes(String(entry.id)));
  if (!matchedGuides.length) {
    return "Brak przypisanych przewodników";
  }
  if (matchedGuides.length === 1) {
    return "1 przewodnik";
  }
  const mod10 = matchedGuides.length % 10;
  const mod100 = matchedGuides.length % 100;
  const noun = mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14) ? "przewodniki" : "przewodników";
  return `${matchedGuides.length} ${noun}`;
}

function countMaterialTemplateUniversityUsage(template: any, universityGuides: any[]) {
  const validGuideIds = new Set(universityGuides.map((guide) => String(guide.id)));
  return uniqueStrings((template?.appliesToGuideIds ?? []).map((value: any) => (validGuideIds.has(String(value)) ? String(value) : ""))).length;
}

function normalizePlatformSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function createEditorRowKey(prefix = "row") {
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyMaterialRow(): MaterialRowEditor {
  return {
    actionType: "check_only",
    alternativeOptions: [],
    appliesToGuideIds: [],
    anchorAfterKey: "",
    country: "",
    displayKey: createEditorRowKey("mentor"),
    docSeedMode: "plain_text",
    docTabPrompt: "",
    docTabTitle: "",
    guideId: "",
    level: "item",
    readOnly: false,
    sourceDocumentId: "",
    sourceTabId: "",
    suggestedFilename: "",
    task: "",
    university: "",
  };
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "brak";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pl-PL");
}

function renderLeadSummary(kind: LeadKind, lead: Record<string, unknown>) {
  const name = typeof lead.name === "string" && lead.name ? lead.name : "Brak imienia";
  const email = typeof lead.email === "string" && lead.email ? lead.email : "Brak e-maila";
  const message = typeof lead.message === "string" && lead.message ? lead.message : "";
  const phone = typeof lead.phone === "string" && lead.phone ? lead.phone : null;
  const type = typeof lead.type === "string" && lead.type ? lead.type : null;

  switch (kind) {
    case "newsletter":
      return {
        title: email,
        meta: name,
        body: message || "Zapis do newslettera bez dodatkowej wiadomości.",
      };
    case "booking":
      return {
        title: name,
        meta: [email, phone].filter(Boolean).join(" • "),
        body: message || "Lead z formularza umawiania konsultacji.",
      };
    case "mentor":
      return {
        title: name,
        meta: [email, phone].filter(Boolean).join(" • "),
        body: message || "Aplikacja mentorska bez dodatkowej treści.",
      };
    case "scholarship":
      return {
        title: name,
        meta: [email, phone].filter(Boolean).join(" • "),
        body: message || "Zgłoszenie stypendialne bez dodatkowej treści.",
      };
    case "contact":
    default:
      return {
        title: name,
        meta: [email, phone, type].filter(Boolean).join(" • "),
        body: message || "Wiadomość kontaktowa bez treści.",
      };
  }
}

function usePlatformSession() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setSession(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    apiFetch<SessionPayload>("/auth/me", undefined, token)
      .then((payload) => setSession(payload))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setSession(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  function login(nextToken: string) {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
  }

  async function logout() {
    if (token) {
      await apiFetch("/auth/logout", { method: "POST" }, token).catch(() => undefined);
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setSession(null);
  }

  return { loading, login, logout, session, token };
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  children: React.ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="app-shell">
      <div className="app-card">
        <div className="eyebrow">Platforma Acadea</div>
        <h1 className="hero-title">{title}</h1>
        <p className="muted">{subtitle}</p>
        <div style={{ marginTop: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [, navigate] = useLocation();
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [acceptedPlatformTerms, setAcceptedPlatformTerms] = useState(false);

  useEffect(() => {
    apiFetch<BootstrapStatus>("/bootstrap/status")
      .then(setBootstrapStatus)
      .catch((error: Error) => setStatus(error.message));
  }, []);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      const payload = await apiFetch<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          turnstileToken,
        }),
      });
      onLogin(payload.token);
      navigate("/");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zalogować.");
      setResetKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBootstrap(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      const payload = await apiFetch<{ token: string }>("/bootstrap/admin", {
        method: "POST",
        body: JSON.stringify({
          setupSecret,
          fullName,
          email,
          password,
        }),
      });
      onLogin(payload.token);
      navigate("/");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się utworzyć administratora.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    if (!acceptedPlatformTerms) {
      setStatus("Aby założyć konto, zaakceptuj Regulamin Platformy ACADEA.");
      return;
    }

    setSubmitting(true);
    setStatus("");
    try {
      const payload = await apiFetch<{ token: string }>("/auth/signup-mentee", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          email,
          password,
          turnstileToken,
          acceptedPlatformTerms,
        }),
      });
      onLogin(payload.token);
      navigate("/");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się utworzyć konta.");
      setResetKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  }

  const isBootstrap = bootstrapStatus?.hasAdmin === false;

  return (
    <AuthShell
      title={isBootstrap ? "Skonfiguruj pierwszego administratora" : "Zaloguj się do platformy"}
      subtitle={
        isBootstrap
          ? "To pierwsze uruchomienie platformy. Utwórz konto administratora, a potem z panelu dodasz mentorów i mentees."
          : mode === "signup"
            ? "Załóż konto mentee. Konta mentorów są dodawane przez administratora."
            : "Zaloguj się do panelu ACADEA."
      }
    >
      {!isBootstrap ? (
        <div className="button-row" style={{ marginBottom: 18 }}>
          <button
            className={`btn ${mode === "login" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setMode("login")}
            type="button"
          >
            Logowanie
          </button>
          <button
            className={`btn ${mode === "signup" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setMode("signup")}
            type="button"
          >
            Rejestracja mentee
          </button>
        </div>
      ) : null}
      <form className="stack" onSubmit={isBootstrap ? handleBootstrap : mode === "signup" ? handleSignup : handleLogin}>
        {isBootstrap && (
          <>
            <div className="field">
              <label>Setup secret</label>
              <input value={setupSecret} onChange={(event) => setSetupSecret(event.target.value)} />
            </div>
            <div className="field">
              <label>Imię i nazwisko</label>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
          </>
        )}
        {!isBootstrap && mode === "signup" ? (
          <div className="field">
            <label>Imię i nazwisko</label>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
        ) : null}
        <div className="field">
          <label>E-mail</label>
          <input value={email} type="email" onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className="field">
          <label>Hasło</label>
          <input value={password} type="password" onChange={(event) => setPassword(event.target.value)} />
        </div>
        {!isBootstrap && mode === "signup" ? (
          <label className="checkbox-card">
            <input
              checked={acceptedPlatformTerms}
              onChange={(event) => setAcceptedPlatformTerms(event.target.checked)}
              type="checkbox"
            />
            <span>
              Akceptuję{" "}
              <a href="https://acadea.org/regulamin-platformy" rel="noreferrer" target="_blank">
                Regulamin Platformy ACADEA
              </a>{" "}
              i potwierdzam, że zapoznałem/am się z polityką prywatności.
            </span>
          </label>
        ) : null}
        {!isBootstrap && (
          <TurnstileWidget onTokenChange={setTurnstileToken} resetKey={resetKey} />
        )}
        {status ? <div className="status">{status}</div> : null}
        <div className="button-row">
          <button className="btn btn-primary" disabled={submitting} type="submit">
            {isBootstrap ? "Utwórz administratora" : mode === "signup" ? "Załóż konto" : "Zaloguj się"}
          </button>
          {!isBootstrap && mode === "login" ? (
            <Link className="btn btn-secondary" href="/forgot-password">
              Nie pamiętasz hasła?
            </Link>
          ) : null}
        </div>
      </form>
    </AuthShell>
  );
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      await apiFetch("/auth/request-reset", {
        method: "POST",
        body: JSON.stringify({ email, turnstileToken }),
      });
      setStatus("Jeśli ten adres istnieje w bazie, wysłaliśmy link do zmiany hasła.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się wysłać linku.");
      setResetKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Ustaw nowe hasło"
      subtitle="Reset działa już przez e-mail i używa tego samego systemu bezpieczeństwa co reszta platformy."
    >
      <form className="stack" onSubmit={handleSubmit}>
        <div className="field">
          <label>E-mail konta</label>
          <input value={email} type="email" onChange={(event) => setEmail(event.target.value)} />
        </div>
        <TurnstileWidget onTokenChange={setTurnstileToken} resetKey={resetKey} />
        {status ? <div className="status">{status}</div> : null}
        <div className="button-row">
          <button className="btn btn-primary" disabled={submitting}>
            Wyślij link
          </button>
          <Link className="btn btn-secondary" href="/">
            Wróć do logowania
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

function ResetPasswordPage() {
  const query = new URLSearchParams(window.location.search);
  const token = query.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      await apiFetch("/auth/reset", {
        method: "POST",
        body: JSON.stringify({ token, password, turnstileToken }),
      });
      setStatus("Hasło zostało zmienione. Możesz wrócić do logowania.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zmienić hasła.");
      setResetKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Nowe hasło"
      subtitle="Link resetu jest tymczasowy i przygotowany już pod standardowy production flow."
    >
      <form className="stack" onSubmit={handleSubmit}>
        <div className="field">
          <label>Nowe hasło</label>
          <input value={password} type="password" onChange={(event) => setPassword(event.target.value)} />
        </div>
        <TurnstileWidget onTokenChange={setTurnstileToken} resetKey={resetKey} />
        {status ? <div className="status">{status}</div> : null}
        <div className="button-row">
          <button className="btn btn-primary" disabled={submitting || !token}>
            Zapisz hasło
          </button>
          <Link className="btn btn-secondary" href="/">
            Wróć
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

function Dashboard({
  session,
  token,
  onLogout,
}: {
  onLogout: () => Promise<void>;
  session: SessionPayload;
  token: string;
}) {
  const defaultSection =
    session.user.role === "mentee"
      ? "universities"
      : session.user.role === "mentor"
        ? "profile"
        : "overview";
  const sectionCookieName = `${DASHBOARD_SECTION_COOKIE_PREFIX}_${session.user.role}`;
  const [section, setSection] = useState(() => getCookie(sectionCookieName) ?? defaultSection);
  const [expandedMaterialTemplateIds, setExpandedMaterialTemplateIds] = useState<number[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileViewport, setMobileViewport] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 720 : false,
  );
  const [pendingCartCount, setPendingCartCount] = useState(0);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const syncViewport = () => setMobileViewport(window.innerWidth <= 720);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (mobileViewport) {
      setCartDrawerOpen(false);
    }
  }, [mobileViewport]);

  const menu = useMemo(() => {
    if (session.user.role === "admin") {
      return [
        ["overview", "Przegląd"],
        ["users", "Użytkownicy"],
        ["guides", "Szablony uczelni"],
        ["profile-designer", "Projektant Twoich Danych"],
        ["materials-designer", "Projektant Kafli Materiałów"],
        ["item-guides", "Wskazówki do Elementów"],
        ["products", "Produkty i Pakiety"],
        ["purchase-popups", "Popupy Zakupowe"],
        ["email-interpreter", "Interpreter Maili"],
        ["meetings", "Spotkania"],
        ["leads", "Leady"],
      ];
    }
    if (session.user.role === "mentor") {
      return [
        ["profile", "Profil"],
        ["availability", "Dostępność"],
        ["meetings", "Spotkania"],
      ];
    }
    return [
      ["universities", "Twoje Uczelnie"],
      ["packages", pendingCartCount ? `Pakiety (${pendingCartCount})` : "Pakiety"],
      ["emails", "Twoje Maile od Uczelni"],
      ["tips", "Twoje Wskazówki"],
      ["profile", "Twoje Dane"],
      ["materials", "Twoje Materiały"],
      ["essays", "Twoje Eseje"],
      ["mentors", "Mentorzy"],
      ["meetings", "Twoje Spotkania"],
      ["offers", "Twoje Oferty"],
    ];
  }, [pendingCartCount, session.user.role]);

  useEffect(() => {
    const allowedSections = new Set(menu.map(([value]) => value));
    if (!allowedSections.has(section)) {
      setSection(defaultSection);
      return;
    }
    setLongLivedCookie(sectionCookieName, section);
  }, [defaultSection, menu, section, sectionCookieName]);

  return (
    <div className="app-shell">
      <div className="dashboard">
        <div className="dashboard-topbar app-card" style={{ maxWidth: "none", margin: 0 }}>
          <div>
            <div className="eyebrow">Platforma Acadea</div>
            <h1 style={{ margin: "14px 0 8px", color: "#153f2c" }}>{session.user.fullName}</h1>
            <div className="muted">
              {session.user.role} • {session.user.email}
            </div>
          </div>
          <div className="button-row topbar-actions">
            {session.user.role === "mentee" && !mobileViewport ? (
              <button
                className={`cart-drawer-toggle ${cartDrawerOpen ? "is-open" : ""}`}
                onClick={() => {
                  setCartDrawerOpen((current) => !current);
                }}
                type="button"
              >
                <span>Koszyk</span>
                <strong>{pendingCartCount}</strong>
              </button>
            ) : null}
            <button
              aria-label={mobileMenuOpen ? "Zamknij menu" : "Otwórz menu"}
              className="btn btn-secondary mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((current) => !current)}
              type="button"
            >
              {mobileMenuOpen ? "×" : "☰"}
            </button>
            {!mobileViewport ? (
              <button className="btn btn-primary" onClick={() => void onLogout()}>
                Wyloguj
              </button>
            ) : null}
          </div>
        </div>
        {mobileMenuOpen ? (
          <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)} role="presentation">
            <div className="mobile-nav-sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
              <div className="mobile-nav-head">
                <div className="eyebrow">Platforma Acadea</div>
                <button className="mobile-nav-close" onClick={() => setMobileMenuOpen(false)} type="button">
                  ×
                </button>
              </div>
              <div className="mobile-nav-links">
                <div className="mobile-nav-actions">
                  {session.user.role === "mentee" ? (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setCartDrawerOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      type="button"
                    >
                      Koszyk ({pendingCartCount})
                    </button>
                  ) : null}
                  <button className="btn btn-primary" onClick={() => void onLogout()} type="button">
                    Wyloguj
                  </button>
                </div>
                {menu.map(([value, label]) => (
                  <button
                    key={`mobile-${value}`}
                    className={section === value ? "active" : ""}
                    onClick={() => {
                      setExpandedMaterialTemplateIds([]);
                      setSection(value);
                      setMobileMenuOpen(false);
                    }}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        <div className="dashboard-layout">
          <div className={`dashboard-card sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
            {menu.map(([value, label]) => (
              <button
                key={value}
                className={section === value ? "active" : ""}
                onClick={() => {
                  setExpandedMaterialTemplateIds([]);
                  setSection(value);
                  setMobileMenuOpen(false);
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="dashboard-main">
            <RoleSection
              expandedMaterialTemplateIds={expandedMaterialTemplateIds}
              onCartCountChange={setPendingCartCount}
              onCartDrawerChange={setCartDrawerOpen}
              cartDrawerOpen={cartDrawerOpen}
              mobileViewport={mobileViewport}
              onNavigateMentee={(nextSection, nextTemplateId) => {
                setSection(nextSection);
                setExpandedMaterialTemplateIds(
                  typeof nextTemplateId === "number" ? [nextTemplateId] : [],
                );
              }}
              section={section}
              session={session}
              token={token}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleSection({
  expandedMaterialTemplateIds,
  cartDrawerOpen,
  mobileViewport,
  onCartCountChange,
  onCartDrawerChange,
  onNavigateMentee,
  section,
  session,
  token,
}: {
  expandedMaterialTemplateIds: number[];
  cartDrawerOpen: boolean;
  mobileViewport: boolean;
  onCartCountChange: (count: number) => void;
  onCartDrawerChange: (open: boolean) => void;
  onNavigateMentee: (nextSection: string, nextTemplateId?: number | null) => void;
  section: string;
  session: SessionPayload;
  token: string;
}) {
  if (session.user.role === "admin") {
    return <AdminSection section={section} token={token} />;
  }
  if (session.user.role === "mentor") {
    return <MentorSection section={section} token={token} session={session} />;
  }
  return (
    <MenteeSection
      cartDrawerOpen={cartDrawerOpen}
      expandedMaterialTemplateIds={expandedMaterialTemplateIds}
      mobileViewport={mobileViewport}
      onNavigate={onNavigateMentee}
      onCartCountChange={onCartCountChange}
      onCartDrawerChange={onCartDrawerChange}
      section={section}
      token={token}
    />
  );
}

function AdminSection({
  section,
  token,
}: {
  section: string;
  token: string;
}) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [mentorProfiles, setMentorProfiles] = useState<any[]>([]);
  const [menteeProfiles, setMenteeProfiles] = useState<any[]>([]);
  const [tipAccessByMentee, setTipAccessByMentee] = useState<any[]>([]);
  const [mentorDriveDrafts, setMentorDriveDrafts] = useState<Record<string, string>>({});
  const [menteeLimitDrafts, setMenteeLimitDrafts] = useState<Record<string, {
    disabledHintGuideTemplateIds: string[];
    emailInboxEnabled: boolean;
    maxActiveGuideCount: number;
    maxHintGuideCount: number;
    maxStorageMb: number;
  }>>({});
  const [mentorAssignments, setMentorAssignments] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [profileFields, setProfileFields] = useState<any[]>([]);
  const [materialTemplates, setMaterialTemplates] = useState<any[]>([]);
  const [adminMeetings, setAdminMeetings] = useState<any[]>([]);
  const [adminMeetingFilter, setAdminMeetingFilter] = useState<"all" | "upcoming" | "past" | "cancelled">("all");
  const [leadType, setLeadType] = useState<LeadKind>("contact");
  const [leads, setLeads] = useState<any[]>([]);
  const [leadCounts, setLeadCounts] = useState<Record<LeadKind, number>>({
    booking: 0,
    contact: 0,
    mentor: 0,
    newsletter: 0,
    scholarship: 0,
  });
  const [status, setStatus] = useState("");
  const [leadDeletingId, setLeadDeletingId] = useState<number | null>(null);
  const [meetingDeletingId, setMeetingDeletingId] = useState<number | null>(null);
  const [userActionId, setUserActionId] = useState<number | null>(null);
  const [guideActionId, setGuideActionId] = useState<number | null>(null);
  const [designerActionId, setDesignerActionId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "mentor",
    status: "active",
  });
  const [accessForm, setAccessForm] = useState({
    menteeUserId: "",
    mentorUserId: "",
  });
  const [editingGuideId, setEditingGuideId] = useState<string>("new");
  const [guideForm, setGuideForm] = useState({
    guideType: "admin_template",
    status: "draft",
    title: "",
    slug: "",
    country: "",
    universityName: "",
    emailSenderDomainsText: "",
    summary: "",
    descriptionMarkdown: "",
    menteeUserId: "",
    sourceGuideId: "",
    driveFolderUrl: "",
    isVisibleToUnapprovedUsers: false,
    itemsText: "Checklist|Personal statement|Napisz pierwszy szkic eseju|document_template",
  });
  const [fieldEditorId, setFieldEditorId] = useState<string>("new");
  const [profileFieldForm, setProfileFieldForm] = useState({
    key: "",
    label: "",
    description: "",
    fieldType: "text",
    sectionTitle: "Dane podstawowe",
    placeholder: "",
    isRequired: false,
    sortOrder: 0,
  });
  const [materialEditorId, setMaterialEditorId] = useState<string>("new");
  const [itemGuideEditorId, setItemGuideEditorId] = useState<string>("new");
  const [guideImportJson, setGuideImportJson] = useState("");
  const [guideImporting, setGuideImporting] = useState(false);
  const [assistantBundleLoading, setAssistantBundleLoading] = useState(false);
  const [assistantBundle, setAssistantBundle] = useState<null | {
    context: unknown;
    promptTemplate: string;
    schema: unknown;
  }>(null);
  const [masterTemplateDoc, setMasterTemplateDoc] = useState<null | {
    documentId: string;
    tabs: Array<{ tabId: string; title: string; url: string }>;
    title: string;
    url: string;
  }>(null);
  const [masterTemplateDocLoading, setMasterTemplateDocLoading] = useState(false);
  const [masterTemplateActionKey, setMasterTemplateActionKey] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [popupConfigs, setPopupConfigs] = useState<any[]>([]);
  const [productEditorId, setProductEditorId] = useState<string>("new");
  const [productForm, setProductForm] = useState({
    title: "",
    slug: "",
    summary: "",
    description: "",
    imageUrl: "",
    stripePriceId: "",
    stripeProductId: "",
    currency: "PLN",
    priceCents: 0,
    productType: "bundle",
    isPackage: true,
    guideSlotDelta: 0,
    hintSlotDelta: 0,
    storageMbDelta: 0,
    enablesEmailInbox: false,
    mentorUserId: "",
    includedProductIds: [] as string[],
    isActive: true,
  });
  const [popupDrafts, setPopupDrafts] = useState<Record<string, {
    body: string;
    contextData: string;
    contextType: string;
    displayConditions: string;
    isActive: boolean;
    primaryCtaLabel: string;
    recommendedProductIds: string[];
    secondaryCtaLabel: string;
    title: string;
  }>>({});
  const [popupImportJson, setPopupImportJson] = useState("");
  const [popupCreatorForm, setPopupCreatorForm] = useState({
    actionType: "after_material_upload",
    body: "",
    conditionType: "none",
    guideId: "",
    isActive: true,
    materialRowKey: "",
    mentorUserId: "",
    primaryCtaLabel: "Kup sugerowany pakiet",
    recommendedProductIds: [] as string[],
    secondaryCtaLabel: "Zobacz pakiety",
    templateId: "",
    title: "",
  });
  const [emailClassifierRules, setEmailClassifierRules] = useState<any[]>([]);
  const [emailRuleEditorId, setEmailRuleEditorId] = useState<string>("new");
  const [emailRuleImportJson, setEmailRuleImportJson] = useState("");
  const [emailRuleForm, setEmailRuleForm] = useState({
    actionRequired: false,
    actionSummary: "",
    classification: "info_only",
    isActive: true,
    matchField: "subject_and_snippet",
    name: "",
    pattern: "",
    requiresManualReview: false,
    sortOrder: 0,
  });
  const [itemGuideForm, setItemGuideForm] = useState({
    appliesToGuideIds: [] as string[],
    title: "",
    slug: "",
    summary: "",
    descriptionMarkdown: "",
    status: "draft",
  });
  const [materialForm, setMaterialForm] = useState({
    title: "",
    description: "",
    templateType: "passport_like",
    guideId: "",
    appliesToGuideIds: [] as string[],
    rows: [createEmptyMaterialRow()] as MaterialRowEditor[],
    isActive: true,
  });

  const mentorUsers = users.filter((user) => user.role === "mentor");
  const menteeUsers = users.filter((user) => user.role === "mentee");
  const adminUsers = users.filter((user) => user.role === "admin");
  const materialGuideTemplates = guides.filter(
    (guide) => guide.guideType === "admin_template" && !guide.sourceGuideId && !isItemGuide(guide),
  );
  const editableGuideTemplates = guides.filter(
    (guide) =>
      (guide.guideType === "admin_template" || guide.guideType === "mentor_blueprint") &&
      !guide.sourceGuideId &&
      !isItemGuide(guide),
  );
  const itemGuides = guides.filter(
    (guide) =>
      (guide.guideType === "admin_template" || guide.guideType === "mentor_blueprint") &&
      (!Array.isArray(guide.items) || guide.items.length === 0) &&
      isItemGuide(guide),
  );

  function serializeGuideItemsToText(items: any[] = []) {
    return items
      .map((item, index) =>
        [
          item.sectionTitle || "Checklist",
          item.title || `Pozycja ${index + 1}`,
          item.description || "",
          item.itemType || "todo",
        ].join("|"),
      )
      .join("\n");
  }

  function parseGuideItemsFromText(text: string) {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [sectionTitle, title, description = "", itemType = "todo"] = line.split("|");
        return {
          sortOrder: index,
          sectionTitle: sectionTitle || "Checklist",
          title: title || line,
          description,
          itemType,
          suggestedFilename: "",
          externalUrl: "",
          linkedGuideItemId: null,
          isRequired: true,
          isCompleted: false,
          fileUrl: "",
        };
      });
  }

  function resetGuideForm() {
    setEditingGuideId("new");
    setGuideForm({
      guideType: "admin_template",
      status: "draft",
      title: "",
      slug: "",
      country: "",
      universityName: "",
      emailSenderDomainsText: "",
      summary: "",
      descriptionMarkdown: "",
      menteeUserId: "",
      sourceGuideId: "",
      driveFolderUrl: "",
      isVisibleToUnapprovedUsers: false,
      itemsText: "Checklist|Personal statement|Napisz pierwszy szkic eseju|document_template",
    });
  }

  function loadGuideIntoEditor(guide: any) {
    setEditingGuideId(String(guide.id));
    setGuideForm({
      guideType: guide.guideType ?? "admin_template",
      status: guide.status ?? "draft",
      title: guide.title ?? "",
      slug: guide.slug ?? "",
      country: guide.country ?? "",
      universityName: guide.universityName ?? "",
      emailSenderDomainsText: Array.isArray(guide.emailSenderDomains) ? guide.emailSenderDomains.join("\n") : "",
      summary: guide.summary ?? "",
      descriptionMarkdown: guide.descriptionMarkdown ?? "",
      menteeUserId: guide.menteeUserId ? String(guide.menteeUserId) : "",
      sourceGuideId: guide.sourceGuideId ? String(guide.sourceGuideId) : "",
      driveFolderUrl: guide.driveFolderUrl ?? "",
      isVisibleToUnapprovedUsers: Boolean(guide.isVisibleToUnapprovedUsers),
      itemsText: serializeGuideItemsToText(guide.items),
    });
  }

  async function refreshLeadState(selectedKind: LeadKind) {
    const [selectedRows, countEntries] = await Promise.all([
      apiFetch<any[]>(`/admin/leads/${selectedKind}`, undefined, token),
      Promise.all(
        (["contact", "mentor", "scholarship", "newsletter", "booking"] as LeadKind[]).map(async (kind) => {
          const rows = await apiFetch<any[]>(`/admin/leads/${kind}`, undefined, token);
          return [kind, rows.length] as const;
        }),
      ),
    ]);

    setLeads(selectedRows);
    setLeadCounts(
      countEntries.reduce(
        (accumulator, [kind, count]) => {
          accumulator[kind] = count;
          return accumulator;
        },
        {
          booking: 0,
          contact: 0,
          mentor: 0,
          newsletter: 0,
          scholarship: 0,
        } as Record<LeadKind, number>,
      ),
    );
  }

  async function refreshUsers() {
    const payload = await apiFetch<{
      menteeProfiles: any[];
      mentorAssignments: any[];
      mentorProfiles: any[];
      tipAccessByMentee: any[];
      users: any[];
    }>("/admin/users", undefined, token);
    setUsers(payload.users);
    setMentorProfiles(payload.mentorProfiles);
    setMenteeProfiles(payload.menteeProfiles);
    setMentorAssignments(payload.mentorAssignments);
    setTipAccessByMentee(payload.tipAccessByMentee ?? []);
    setMenteeLimitDrafts(
      Object.fromEntries(
        (payload.menteeProfiles ?? []).map((profile: any) => [
          String(profile.userId),
          {
            disabledHintGuideTemplateIds: Array.isArray(profile.disabledHintGuideTemplateIds)
              ? profile.disabledHintGuideTemplateIds.map((value: any) => String(value))
              : [],
            emailInboxEnabled: Boolean(profile.emailInboxEnabled),
            maxActiveGuideCount: Number(profile.maxActiveGuideCount ?? 1),
            maxHintGuideCount: Number(profile.maxHintGuideCount ?? 1),
            maxStorageMb: Number(profile.maxStorageMb ?? 100),
          },
        ]),
      ),
    );
  }

  async function refreshGuides() {
    const payload = await apiFetch<any[]>("/admin/guides", undefined, token);
    setGuides(payload);
  }

  async function refreshDesigner() {
    const [fieldsPayload, materialsPayload, masterDocPayload] = await Promise.all([
      apiFetch<any[]>("/admin/profile-fields", undefined, token),
      apiFetch<any[]>("/admin/material-templates", undefined, token),
      apiFetch<any>("/admin/google-doc-master", undefined, token),
    ]);
    setProfileFields(fieldsPayload);
    setMaterialTemplates(materialsPayload);
    setMasterTemplateDoc(masterDocPayload);
  }

  async function refreshCommerceDesigner() {
    const [productsPayload, popupPayload, emailRulePayload] = await Promise.all([
      apiFetch<any[]>("/admin/products", undefined, token),
      apiFetch<any[]>("/admin/popup-configs", undefined, token),
      apiFetch<any[]>("/admin/email-classifier-rules", undefined, token),
    ]);
    setProducts(productsPayload);
    setPopupConfigs(popupPayload);
    setEmailClassifierRules(emailRulePayload);
    setPopupDrafts(
      Object.fromEntries(
        (popupPayload ?? []).map((popup: any) => [
          popup.key,
          {
            body: popup.body ?? "",
            contextData: JSON.stringify(popup.contextData ?? {}, null, 2),
            contextType: popup.contextType ?? "generic",
            displayConditions: JSON.stringify(popup.displayConditions ?? {}, null, 2),
            isActive: Boolean(popup.isActive),
            primaryCtaLabel: popup.primaryCtaLabel ?? "Kup sugerowany pakiet",
            recommendedProductIds: Array.isArray(popup.recommendedProductIds)
              ? popup.recommendedProductIds.map((value: any) => String(value))
              : [],
            secondaryCtaLabel: popup.secondaryCtaLabel ?? "Zobacz pakiety",
            title: popup.title ?? "",
          },
        ]),
      ),
    );
  }

  async function refreshAdminMeetings() {
    const payload = await apiFetch<any[]>("/admin/meetings", undefined, token);
    setAdminMeetings(payload);
  }

  async function refreshMasterTemplateDoc() {
    setMasterTemplateDocLoading(true);
    try {
      const payload = await apiFetch<any>("/admin/google-doc-master", undefined, token);
      setMasterTemplateDoc(payload);
      return payload;
    } finally {
      setMasterTemplateDocLoading(false);
    }
  }

  async function createMasterTemplateTabForRow(index: number) {
    const row = materialForm.rows[index];
    if (!row || row.actionType !== "file_or_doc") {
      setStatus("Ten wiersz nie obsługuje Google Doc.");
      return;
    }

    setMasterTemplateActionKey(row.displayKey ?? `row-${index}`);
    setStatus("");
    try {
      const payload = await apiFetch<any>(
        "/admin/google-doc-master/tabs",
        {
          method: "POST",
          body: JSON.stringify({
            initialText: row.docTabPrompt ?? "",
            title: row.docTabTitle?.trim() || row.task?.trim() || `Template ${index + 1}`,
          }),
        },
        token,
      );
      setMasterTemplateDoc({
        documentId: payload.documentId,
        tabs: payload.tabs ?? [],
        title: payload.title,
        url: payload.url,
      });
      setMaterialForm((current) => ({
        ...current,
        rows: current.rows.map((entry, rowIndex) =>
          rowIndex === index
            ? {
                ...entry,
                docSeedMode: "source_tab",
                sourceDocumentId: payload.documentId,
                sourceTabId: payload.tab?.tabId ?? "",
              }
            : entry,
        ),
      }));
      setStatus("Utworzono template tab w master Doc i przypięto go do tego wiersza.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się utworzyć template taba.");
    } finally {
      setMasterTemplateActionKey(null);
    }
  }

  function resetProfileFieldForm() {
    setFieldEditorId("new");
    setProfileFieldForm({
      key: "",
      label: "",
      description: "",
      fieldType: "text",
      sectionTitle: "Dane podstawowe",
      placeholder: "",
      isRequired: false,
      sortOrder: 0,
    });
  }

  function loadProfileFieldIntoEditor(field: any) {
    setFieldEditorId(String(field.id));
    setProfileFieldForm({
      key: field.key ?? "",
      label: field.label ?? "",
      description: field.description ?? "",
      fieldType: field.fieldType ?? "text",
      sectionTitle: field.sectionTitle ?? "Dane podstawowe",
      placeholder: field.placeholder ?? "",
      isRequired: Boolean(field.isRequired),
      sortOrder: field.sortOrder ?? 0,
    });
  }

  function resetMaterialForm() {
    setMaterialEditorId("new");
    setMaterialForm({
      title: "",
      description: "",
      templateType: "passport_like",
      guideId: "",
      appliesToGuideIds: [],
      rows: [createEmptyMaterialRow()],
      isActive: true,
    });
  }

  function resetItemGuideForm() {
    setItemGuideEditorId("new");
    setItemGuideForm({
      appliesToGuideIds: [],
      title: "",
      slug: "",
      summary: "",
      descriptionMarkdown: "",
      status: "draft",
    });
  }

  function loadItemGuideIntoEditor(guide: any) {
    setItemGuideEditorId(String(guide.id));
    setItemGuideForm({
      appliesToGuideIds: Array.isArray(guide.itemGuideAppliesToGuideIds)
        ? guide.itemGuideAppliesToGuideIds.map((value: any) => String(value))
        : (() => {
            const metadata = parseGuideMeta(guide.driveFolderUrl);
            return Array.isArray((metadata as any).appliesToGuideIds)
              ? (metadata as any).appliesToGuideIds.map((value: any) => String(value))
              : [];
          })(),
      title: guide.title ?? "",
      slug: guide.slug ?? "",
      summary: guide.summary ?? "",
      descriptionMarkdown: guide.descriptionMarkdown ?? "",
      status: guide.status ?? "draft",
    });
  }

  function loadMaterialIntoEditor(material: any) {
    setMaterialEditorId(String(material.id));
    setMaterialForm({
      title: material.title ?? "",
      description: material.description ?? "",
      templateType: material.templateType ?? "passport_like",
      guideId: material.guideId ? String(material.guideId) : "",
      appliesToGuideIds: (material.appliesToGuideIds ?? []).map((id: number) => String(id)),
      rows: (material.structure ?? []).length
        ? (material.structure ?? []).map((row: any) => ({
            actionType: row.actionType ?? "check_only",
            alternativeOptions: Array.isArray(row.alternativeOptions) ? row.alternativeOptions.filter(Boolean) : [],
            appliesToGuideIds: Array.isArray(row.appliesToGuideIds) ? row.appliesToGuideIds.map((id: any) => String(id)) : [],
            country: row.country ?? "",
            docSeedMode:
              row.sourceDocumentId && row.sourceTabId ? "source_tab" : "plain_text",
            guideId: row.guideId ? String(row.guideId) : "",
            docTabPrompt: row.docTabPrompt ?? "",
            docTabTitle: row.docTabTitle ?? "",
            displayKey: row.displayKey ?? createEditorRowKey("material"),
            level: row.level === "country" || row.level === "university" || row.level === "item" ? row.level : "item",
            ownerUserId: row.ownerUserId ?? null,
            sourceDocumentId: row.sourceDocumentId ?? "",
            sourceTabId: row.sourceTabId ?? "",
            suggestedFilename: row.suggestedFilename ?? "",
            task: row.task ?? "",
            university: row.university ?? "",
          }))
        : [createEmptyMaterialRow()],
      isActive: Boolean(material.isActive),
    });
  }

  function resetProductForm() {
    setProductEditorId("new");
    setProductForm({
      title: "",
      slug: "",
      summary: "",
      description: "",
      imageUrl: "",
      stripePriceId: "",
      stripeProductId: "",
      currency: "PLN",
      priceCents: 0,
      productType: "bundle",
      isPackage: true,
      guideSlotDelta: 0,
      hintSlotDelta: 0,
      storageMbDelta: 0,
      enablesEmailInbox: false,
      mentorUserId: "",
      includedProductIds: [],
      isActive: true,
    });
  }

  function loadProductIntoEditor(product: any) {
    setProductEditorId(String(product.id));
    setProductForm({
      title: product.title ?? "",
      slug: product.slug ?? "",
      summary: product.summary ?? "",
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
      stripePriceId: product.stripePriceId ?? "",
      stripeProductId: product.stripeProductId ?? "",
      currency: product.currency ?? "PLN",
      priceCents: Number(product.priceCents ?? 0),
      productType: product.productType ?? "bundle",
      isPackage: Boolean(product.isPackage),
      guideSlotDelta: Number(product.guideSlotDelta ?? 0),
      hintSlotDelta: Number(product.hintSlotDelta ?? 0),
      storageMbDelta: Number(product.storageMbDelta ?? 0),
      enablesEmailInbox: Boolean(product.enablesEmailInbox),
      mentorUserId: product.mentorUserId ? String(product.mentorUserId) : "",
      includedProductIds: Array.isArray(product.includedProductIds)
        ? product.includedProductIds.map((value: any) => String(value))
        : [],
      isActive: Boolean(product.isActive),
    });
  }

  function updateMaterialRow(index: number, updater: (row: MaterialRowEditor) => MaterialRowEditor) {
    setMaterialForm((current) => ({
      ...current,
      rows: current.rows.map((row, rowIndex) => (rowIndex === index ? updater(row) : row)),
    }));
  }

  function addMaterialRow(index?: number) {
    setMaterialForm((current) => {
      const nextRows = [...current.rows];
      const insertionIndex = typeof index === "number" ? index : nextRows.length;
      nextRows.splice(insertionIndex, 0, createEmptyMaterialRow());
      return {
        ...current,
        rows: nextRows,
      };
    });
  }

  function removeMaterialRow(index: number) {
    setMaterialForm((current) => ({
      ...current,
      rows: current.rows.length === 1 ? [createEmptyMaterialRow()] : current.rows.filter((_, rowIndex) => rowIndex !== index),
    }));
  }

  function moveMaterialRow(index: number, direction: -1 | 1) {
    setMaterialForm((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.rows.length) {
        return current;
      }
      const nextRows = [...current.rows];
      const [moved] = nextRows.splice(index, 1);
      nextRows.splice(targetIndex, 0, moved);
      return {
        ...current,
        rows: nextRows,
      };
    });
  }

  useEffect(() => {
    if (section === "overview") {
      void apiFetch<Overview>("/admin/overview", undefined, token)
        .then(setOverview)
        .catch((error) => setStatus(error.message));
    }
    if (section === "users") {
      void refreshUsers().catch((error) => setStatus(error.message));
    }
    if (section === "guides") {
      void refreshGuides().catch((error) => setStatus(error.message));
    }
    if (section === "profile-designer" || section === "materials-designer" || section === "item-guides") {
      void Promise.all([refreshGuides(), refreshDesigner()]).catch((error) => setStatus(error.message));
    }
    if (section === "products" || section === "purchase-popups") {
      void Promise.all([refreshUsers(), refreshCommerceDesigner()]).catch((error) => setStatus(error.message));
    }
    if (section === "leads") {
      void refreshLeadState(leadType).catch((error) => setStatus(error.message));
    }
    if (section === "meetings") {
      void refreshAdminMeetings().catch((error) => setStatus(error.message));
    }
  }, [leadType, section, token]);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    try {
      await apiFetch("/admin/users", { method: "POST", body: JSON.stringify(userForm) }, token);
      setUserForm({ email: "", fullName: "", password: "", role: "mentor", status: "active" });
      await refreshUsers();
      setStatus("Użytkownik został utworzony.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się utworzyć użytkownika.");
    }
  }

  async function runUserAction(userId: number, action: () => Promise<void>, message: string) {
    setUserActionId(userId);
    setStatus("");
    try {
      await action();
      await refreshUsers();
      setStatus(message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać zmian.");
    } finally {
      setUserActionId(null);
    }
  }

  async function runGuideAction(guideId: number, action: () => Promise<void>, message: string) {
    setGuideActionId(guideId);
    setStatus("");
    try {
      await action();
      await Promise.all([refreshGuides(), refreshUsers()]);
      setStatus(message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać zmian.");
    } finally {
      setGuideActionId(null);
    }
  }

  async function saveGuide(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    const payload = {
      guideType: guideForm.guideType,
      status: guideForm.status,
      title: guideForm.title,
      slug: guideForm.slug,
      country: guideForm.country,
      universityName: guideForm.universityName,
      emailSenderDomains: guideForm.emailSenderDomainsText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      summary: guideForm.summary,
      descriptionMarkdown: guideForm.descriptionMarkdown,
      estimatedReadMin: 8,
      menteeUserId: guideForm.menteeUserId ? Number(guideForm.menteeUserId) : null,
      sourceGuideId: guideForm.sourceGuideId ? Number(guideForm.sourceGuideId) : null,
      driveFolderUrl: guideForm.driveFolderUrl,
      isVisibleToUnapprovedUsers: guideForm.isVisibleToUnapprovedUsers,
      items: [],
    };

    try {
      if (editingGuideId === "new") {
        const created = await apiFetch<any>("/admin/guides", { method: "POST", body: JSON.stringify(payload) }, token);
        await refreshGuides();
        loadGuideIntoEditor(created);
        setStatus("Przewodnik został utworzony.");
        return;
      }

      const updated = await apiFetch<any>(`/admin/guides/${editingGuideId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }, token);
      await refreshGuides();
      loadGuideIntoEditor(updated);
      setStatus("Przewodnik został zaktualizowany.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać przewodnika.");
    }
  }

  async function saveProfileField(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    const payload = {
      ...profileFieldForm,
      sortOrder: Number(profileFieldForm.sortOrder),
    };
    try {
      if (fieldEditorId === "new") {
        await apiFetch("/admin/profile-fields", { method: "POST", body: JSON.stringify(payload) }, token);
        await refreshDesigner();
        resetProfileFieldForm();
        setStatus("Pole formularza zostało dodane.");
        return;
      }
      await apiFetch(`/admin/profile-fields/${fieldEditorId}`, { method: "PUT", body: JSON.stringify(payload) }, token);
      await refreshDesigner();
      setStatus("Pole formularza zostało zaktualizowane.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać pola formularza.");
    }
  }

  async function saveMaterialTemplate(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    const appliesToGuideIds = materialForm.appliesToGuideIds
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
    const allowedGuideIds = new Set(appliesToGuideIds);
    const structure = materialForm.rows
      .map((row) => ({
        actionType: row.actionType,
        alternativeOptions: row.alternativeOptions.filter(Boolean),
        appliesToGuideIds: row.appliesToGuideIds
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0 && allowedGuideIds.has(value)),
        country: row.country.trim(),
        displayKey: row.displayKey || createEditorRowKey("material"),
        docTabPrompt: row.docTabPrompt?.trim() || "",
        docTabTitle: row.docTabTitle?.trim() || "",
        guideId: row.level === "item" && row.guideId ? Number(row.guideId) : null,
        level: row.level,
        ownerUserId: row.ownerUserId ?? null,
        sourceDocumentId: row.sourceDocumentId?.trim() || "",
        sourceTabId: row.sourceTabId?.trim() || "",
        suggestedFilename: row.suggestedFilename?.trim() || "",
        task: row.level === "item" ? row.task.trim() : "",
        university: row.level === "country" ? "" : row.university.trim(),
      }))
      .filter((row) => row.country || row.university || row.task);
    const payload = {
      title: materialForm.title,
      description: materialForm.description,
      templateType: materialForm.templateType,
      guideId: materialForm.guideId ? Number(materialForm.guideId) : null,
      appliesToGuideIds,
      structure,
      alternativeOptions: [],
      isActive: materialForm.isActive,
    };
    try {
      if (materialEditorId === "new") {
        await apiFetch("/admin/material-templates", { method: "POST", body: JSON.stringify(payload) }, token);
        await refreshDesigner();
        resetMaterialForm();
        setStatus("Szablon materiału został dodany.");
        return;
      }
      await apiFetch(`/admin/material-templates/${materialEditorId}`, { method: "PUT", body: JSON.stringify(payload) }, token);
      await refreshDesigner();
      setStatus("Szablon materiału został zaktualizowany.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać szablonu materiału.");
    }
  }

  async function importGuideBlueprintFromJson(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");

    let payload: unknown;
    try {
      payload = JSON.parse(guideImportJson);
    } catch {
      setStatus("Wklej poprawny JSON przewodnika.");
      return;
    }

    setGuideImporting(true);
    try {
      const result = await apiFetch<{ importedGuideTitle: string }>("/admin/import-guide-blueprint", {
        method: "POST",
        body: JSON.stringify(payload),
      }, token);
      await Promise.all([refreshGuides(), refreshDesigner()]);
      setGuideImportJson("");
      setStatus(`Zaimportowano przewodnik: ${result.importedGuideTitle}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zaimportować przewodnika.");
    } finally {
      setGuideImporting(false);
    }
  }

  async function loadGuideBlueprintAssistantBundle() {
    setAssistantBundleLoading(true);
    setStatus("");
    try {
      const payload = await apiFetch<{
        context: unknown;
        promptTemplate: string;
        schema: unknown;
      }>("/admin/guide-blueprint-assistant", undefined, token);
      setAssistantBundle(payload);
      setStatus("Wygenerowano aktualny kontekst dla tworzenia blueprintów.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się wygenerować kontekstu blueprintów.");
    } finally {
      setAssistantBundleLoading(false);
    }
  }

  async function copyGuideBlueprintPrompt() {
    if (!assistantBundle) {
      return;
    }
    try {
      await navigator.clipboard.writeText(assistantBundle.promptTemplate);
      setStatus("Skopiowano cały prompt do schowka.");
    } catch {
      setStatus("Nie udało się skopiować promptu do schowka.");
    }
  }

  async function saveItemGuide(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    const selectedGuideIds = itemGuideForm.appliesToGuideIds
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (!selectedGuideIds.length) {
      setStatus("Wybierz przynajmniej jedną uczelnię dla tych wskazówek.");
      return;
    }
    const selectedGuides = materialGuideTemplates.filter((guide) => selectedGuideIds.includes(Number(guide.id)));
    const firstGuide = selectedGuides[0];
    if (!firstGuide) {
      setStatus("Nie udało się dopasować wybranych uczelni do wskazówek.");
      return;
    }

    const payload = {
      guideType: "admin_template",
      status: itemGuideForm.status,
      title: itemGuideForm.title,
      slug: itemGuideForm.slug || itemGuideForm.title,
      country: firstGuide.country,
      universityName: firstGuide.universityName,
      summary: itemGuideForm.summary,
      descriptionMarkdown: itemGuideForm.descriptionMarkdown,
      estimatedReadMin: 8,
      menteeUserId: null,
      sourceGuideId: null,
      driveFolderUrl: `__meta:${JSON.stringify({
        appliesToGuideIds: selectedGuideIds,
        kind: "item_guide",
      })}`,
      isVisibleToUnapprovedUsers: false,
      items: [],
    };

    try {
      if (itemGuideEditorId === "new") {
        await apiFetch("/admin/guides", { method: "POST", body: JSON.stringify(payload) }, token);
        await refreshGuides();
        resetItemGuideForm();
        setStatus("Wskazówki do elementu zostały dodane.");
        return;
      }

      await apiFetch(`/admin/guides/${itemGuideEditorId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }, token);
      await refreshGuides();
      setStatus("Wskazówki do elementu zostały zaktualizowane.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać wskazówek.");
    }
  }

  async function deleteLead(id: number) {
    setLeadDeletingId(id);
    setStatus("");
    try {
      await apiFetch(`/admin/leads/${leadType}/${id}`, { method: "DELETE" }, token);
      await refreshLeadState(leadType);
      setStatus("Rekord został usunięty.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się usunąć rekordu.");
    } finally {
      setLeadDeletingId(null);
    }
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    const payload = {
      ...productForm,
      mentorUserId: productForm.mentorUserId ? Number(productForm.mentorUserId) : null,
      priceCents: Number(productForm.priceCents),
      guideSlotDelta: Number(productForm.guideSlotDelta),
      hintSlotDelta: Number(productForm.hintSlotDelta),
      storageMbDelta: Number(productForm.storageMbDelta),
      includedProductIds: productForm.includedProductIds
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    };
    try {
      if (productEditorId === "new") {
        await apiFetch("/admin/products", { method: "POST", body: JSON.stringify(payload) }, token);
        await refreshCommerceDesigner();
        resetProductForm();
        setStatus("Produkt został dodany.");
        return;
      }
      await apiFetch(`/admin/products/${productEditorId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }, token);
      await refreshCommerceDesigner();
      setStatus("Produkt został zaktualizowany.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać produktu.");
    }
  }

  async function deleteProduct(productId: number) {
    setStatus("");
    try {
      await apiFetch(`/admin/products/${productId}`, { method: "DELETE" }, token);
      await refreshCommerceDesigner();
      if (String(productId) === productEditorId) {
        resetProductForm();
      }
      setStatus("Produkt został usunięty.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się usunąć produktu.");
    }
  }

  async function syncProductToStripe(productId: number) {
    setStatus("");
    try {
      await apiFetch(`/admin/products/${productId}/stripe-sync`, { method: "POST" }, token);
      await refreshCommerceDesigner();
      setStatus("Produkt został zsynchronizowany ze Stripe.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zsynchronizować produktu ze Stripe.");
    }
  }

  async function savePopupConfig(key: string) {
    const draft = popupDrafts[key];
    if (!draft) {
      return;
    }
    setStatus("");
    try {
      await apiFetch(`/admin/popup-configs/${key}`, {
        method: "PUT",
        body: JSON.stringify({
          body: draft.body,
          contextData: draft.contextData.trim() ? JSON.parse(draft.contextData) : {},
          contextType: draft.contextType,
          displayConditions: draft.displayConditions.trim() ? JSON.parse(draft.displayConditions) : {},
          isActive: draft.isActive,
          primaryCtaLabel: draft.primaryCtaLabel,
          recommendedProductIds: draft.recommendedProductIds
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0),
          secondaryCtaLabel: draft.secondaryCtaLabel,
          title: draft.title,
        }),
      }, token);
      await refreshCommerceDesigner();
      setStatus("Popup zakupowy został zapisany.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać popupu.");
    }
  }

  async function importPopupConfigs() {
    setStatus("");
    try {
      const parsed = JSON.parse(popupImportJson);
      await apiFetch("/admin/popup-configs/import", {
        method: "POST",
        body: JSON.stringify(parsed),
      }, token);
      await refreshCommerceDesigner();
      setStatus("Popupy zostały zaimportowane.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zaimportować popupów.");
    }
  }

  function buildPopupKeyFromCreator() {
    if (popupCreatorForm.actionType === "mentor_locked") {
      return popupCreatorForm.mentorUserId
        ? `context:mentor_locked:mentor:${popupCreatorForm.mentorUserId}`
        : "mentor_locked";
    }
    if (popupCreatorForm.actionType === "after_guide_add") {
      return popupCreatorForm.guideId
        ? `context:after_guide_add:guide:${popupCreatorForm.guideId}`
        : "context:after_guide_add:any";
    }
    if (popupCreatorForm.actionType === "after_hint_add") {
      return popupCreatorForm.guideId
        ? `context:after_hint_add:guide:${popupCreatorForm.guideId}`
        : "context:after_hint_add:any";
    }
    const templateId = popupCreatorForm.templateId || "any";
    if (popupCreatorForm.materialRowKey) {
      return `context:${popupCreatorForm.actionType}:template:${templateId}:row:${popupCreatorForm.materialRowKey}`;
    }
    return templateId === "any"
      ? `context:${popupCreatorForm.actionType}:any`
      : `context:${popupCreatorForm.actionType}:template:${templateId}`;
  }

  async function createPopupFromBuilder() {
    setStatus("");
    try {
      const key = buildPopupKeyFromCreator();
      const displayConditions =
        popupCreatorForm.conditionType === "none"
          ? {}
          : popupCreatorForm.conditionType === "hint_limit_reached"
            ? { requiresHintLimitReached: true }
            : popupCreatorForm.conditionType === "guide_limit_reached"
              ? { requiresGuideLimitReached: true }
              : popupCreatorForm.conditionType === "email_locked"
                ? { requiresEmailInboxDisabled: true }
                : popupCreatorForm.conditionType === "mentor_locked"
                  ? { requiresMentorUnassigned: true }
                  : {};
      const contextData: Record<string, unknown> = {};
      if (popupCreatorForm.templateId) {
        contextData.templateId = Number(popupCreatorForm.templateId);
      }
      if (popupCreatorForm.materialRowKey) {
        contextData.rowKey = popupCreatorForm.materialRowKey;
      }
      if (popupCreatorForm.guideId) {
        contextData.guideId = Number(popupCreatorForm.guideId);
      }
      if (popupCreatorForm.mentorUserId) {
        contextData.mentorUserId = Number(popupCreatorForm.mentorUserId);
      }
      await apiFetch(`/admin/popup-configs/${encodeURIComponent(key)}`, {
        method: "PUT",
        body: JSON.stringify({
          body: popupCreatorForm.body,
          contextData,
          contextType: popupCreatorForm.actionType,
          displayConditions,
          isActive: popupCreatorForm.isActive,
          primaryCtaLabel: popupCreatorForm.primaryCtaLabel,
          recommendedProductIds: popupCreatorForm.recommendedProductIds.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0),
          secondaryCtaLabel: popupCreatorForm.secondaryCtaLabel,
          title: popupCreatorForm.title,
        }),
      }, token);
      await refreshCommerceDesigner();
      setStatus("Nowy popup został utworzony.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się utworzyć popupu.");
    }
  }

  function resetEmailRuleForm() {
    setEmailRuleEditorId("new");
    setEmailRuleForm({
      actionRequired: false,
      actionSummary: "",
      classification: "info_only",
      isActive: true,
      matchField: "subject_and_snippet",
      name: "",
      pattern: "",
      requiresManualReview: false,
      sortOrder: 0,
    });
  }

  function loadEmailRuleIntoEditor(rule: any) {
    setEmailRuleEditorId(String(rule.id));
    setEmailRuleForm({
      actionRequired: Boolean(rule.actionRequired),
      actionSummary: rule.actionSummary ?? "",
      classification: rule.classification ?? "info_only",
      isActive: Boolean(rule.isActive),
      matchField: rule.matchField ?? "subject_and_snippet",
      name: rule.name ?? "",
      pattern: rule.pattern ?? "",
      requiresManualReview: Boolean(rule.requiresManualReview),
      sortOrder: Number(rule.sortOrder ?? 0),
    });
  }

  async function saveEmailClassifierRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    try {
      const endpoint = emailRuleEditorId === "new"
        ? "/admin/email-classifier-rules"
        : `/admin/email-classifier-rules/${emailRuleEditorId}`;
      await apiFetch(endpoint, {
        method: emailRuleEditorId === "new" ? "POST" : "PUT",
        body: JSON.stringify(emailRuleForm),
      }, token);
      await refreshCommerceDesigner();
      resetEmailRuleForm();
      setStatus("Reguła interpretera maili została zapisana.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać reguły interpretera.");
    }
  }

  async function deleteEmailClassifierRule(ruleId: number) {
    setStatus("");
    try {
      await apiFetch(`/admin/email-classifier-rules/${ruleId}`, { method: "DELETE" }, token);
      await refreshCommerceDesigner();
      if (emailRuleEditorId === String(ruleId)) {
        resetEmailRuleForm();
      }
      setStatus("Reguła interpretera maili została usunięta.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się usunąć reguły interpretera.");
    }
  }

  async function importEmailClassifierRules() {
    setStatus("");
    try {
      const parsed = JSON.parse(emailRuleImportJson);
      await apiFetch("/admin/email-classifier-rules/import", {
        method: "POST",
        body: JSON.stringify(parsed),
      }, token);
      await refreshCommerceDesigner();
      setStatus("Reguły interpretera maili zostały zaimportowane.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zaimportować reguł interpretera.");
    }
  }

  async function saveMenteeLimits(userId: number) {
    const draft = menteeLimitDrafts[String(userId)];
    if (!draft) {
      return;
    }
    await runUserAction(
      userId,
      async () => {
        await apiFetch(`/admin/mentees/${userId}/settings`, {
          method: "PATCH",
          body: JSON.stringify({
            disabledHintGuideTemplateIds: draft.disabledHintGuideTemplateIds
              .map((value) => Number(value))
              .filter((value) => Number.isFinite(value) && value > 0),
            emailInboxEnabled: Boolean(draft.emailInboxEnabled),
            maxActiveGuideCount: Number(draft.maxActiveGuideCount),
            maxHintGuideCount: Number(draft.maxHintGuideCount),
            maxStorageMb: Number(draft.maxStorageMb),
          }),
        }, token);
      },
      "Limity i dostęp do wskazówek zostały zapisane.",
    );
  }

  async function saveMentorDriveFolder(userId: number) {
    const draft = mentorDriveDrafts[String(userId)] ?? "";
    await runUserAction(
      userId,
      async () => {
        await apiFetch(`/admin/mentors/${userId}/profile`, {
          method: "PATCH",
          body: JSON.stringify({
            googleDriveFolderUrl: draft,
          }),
        }, token);
      },
      "Folder Google Drive mentora został zapisany.",
    );
  }

  async function generateMentorDriveFolder(userId: number) {
    await runUserAction(
      userId,
      async () => {
        const created = await apiFetch<{ folderUrl: string }>(`/admin/mentors/${userId}/google-drive-folder`, {
          method: "POST",
        }, token);
        setMentorDriveDrafts((current) => ({
          ...current,
          [String(userId)]: created.folderUrl ?? current[String(userId)] ?? "",
        }));
      },
      "Folder Google Drive mentora został utworzony.",
    );
  }

  async function deleteAdminMeeting(meetingId: number) {
    setMeetingDeletingId(meetingId);
    setStatus("");
    try {
      await apiFetch(`/admin/meetings/${meetingId}`, { method: "DELETE" }, token);
      await refreshAdminMeetings();
      setStatus("Spotkanie zostało całkowicie usunięte z systemu.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się usunąć spotkania.");
    } finally {
      setMeetingDeletingId(null);
    }
  }

  const mentorProfileMap = new Map(mentorProfiles.map((profile) => [profile.userId, profile]));
  const menteeProfileMap = new Map(menteeProfiles.map((profile) => [profile.userId, profile]));
  const tipAccessMap = new Map(tipAccessByMentee.map((entry) => [entry.menteeUserId, entry]));
  const filteredAdminMeetings = adminMeetings.filter((meeting) => {
    if (adminMeetingFilter === "all") {
      return true;
    }
    return getMeetingCategory(meeting) === adminMeetingFilter;
  });

  return (
    <>
      <FloatingStatus message={status} />
      {section === "overview" && overview ? (
        <div className="dashboard-card">
          <h2>Przegląd platformy</h2>
          <p className="muted">Najważniejsze dane operacyjne i aktualny stan panelu administracyjnego.</p>
          <div className="stats-grid" style={{ marginTop: 18 }}>
            {Object.entries(overview.counts).map(([key, value]) => (
              <div className="stat" key={key}>
                <div className="small muted">{key}</div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {section === "users" ? (
        <div className="stack">
          <div className="split">
            <div className="dashboard-card panel-scroll">
              <h2>Dodaj użytkownika</h2>
              <form className="stack" onSubmit={createUser}>
                <div className="field">
                  <label>Imię i nazwisko</label>
                  <input value={userForm.fullName} onChange={(event) => setUserForm((current) => ({ ...current, fullName: event.target.value }))} />
                </div>
                <div className="field">
                  <label>E-mail</label>
                  <input value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} />
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Rola</label>
                    <select value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}>
                      <option value="mentor">mentor</option>
                      <option value="mentee">mentee</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Status</label>
                    <select value={userForm.status} onChange={(event) => setUserForm((current) => ({ ...current, status: event.target.value }))}>
                      <option value="active">active</option>
                      <option value="pending">pending</option>
                      <option value="disabled">disabled</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Hasło startowe</label>
                  <input value={userForm.password} type="password" onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} />
                </div>
                <button className="btn btn-primary">Dodaj użytkownika</button>
              </form>
            </div>
            <div className="dashboard-card panel-scroll">
              <h2>Dostęp mentor → mentee</h2>
              <form
                className="stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!accessForm.menteeUserId || !accessForm.mentorUserId) {
                    setStatus("Wybierz mentee i mentora.");
                    return;
                  }
                  void runUserAction(
                    Number(accessForm.menteeUserId),
                    async () => {
                      await apiFetch("/admin/mentor-access", {
                        method: "POST",
                        body: JSON.stringify({
                          menteeUserId: Number(accessForm.menteeUserId),
                          mentorUserId: Number(accessForm.mentorUserId),
                        }),
                      }, token);
                    },
                    "Dostęp mentora został nadany.",
                  );
                }}
              >
                <div className="field">
                  <label>Mentee</label>
                  <select value={accessForm.menteeUserId} onChange={(event) => setAccessForm((current) => ({ ...current, menteeUserId: event.target.value }))}>
                    <option value="">Wybierz mentee</option>
                    {menteeUsers.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Mentor</label>
                  <select value={accessForm.mentorUserId} onChange={(event) => setAccessForm((current) => ({ ...current, mentorUserId: event.target.value }))}>
                    <option value="">Wybierz mentora</option>
                    {mentorUsers.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-primary">Nadaj dostęp</button>
              </form>
              <div className="list" style={{ marginTop: 18 }}>
                {mentorAssignments.map((assignment) => {
                  const mentee = users.find((user) => user.id === assignment.menteeUserId);
                  const mentor = users.find((user) => user.id === assignment.mentorUserId);
                  return (
                    <div className="list-item" key={assignment.id}>
                      <header>
                        <div>
                          <h3>{mentor?.fullName ?? `Mentor #${assignment.mentorUserId}`}</h3>
                          <div className="muted small">dla {mentee?.fullName ?? `Mentee #${assignment.menteeUserId}`}</div>
                        </div>
                        <button
                          className="btn btn-secondary"
                          disabled={userActionId === assignment.menteeUserId}
                          onClick={() =>
                            void runUserAction(
                              assignment.menteeUserId,
                              async () => {
                                await apiFetch(`/admin/mentor-access/${assignment.id}`, { method: "DELETE" }, token);
                              },
                              "Dostęp mentora został usunięty.",
                            )
                          }
                          type="button"
                        >
                          Usuń
                        </button>
                      </header>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="dashboard-card panel-scroll">
            <h2>Użytkownicy</h2>
            <div className="list">
              {[...adminUsers, ...mentorUsers, ...menteeUsers].map((user) => {
                const mentorProfile = mentorProfileMap.get(user.id);
                const menteeProfile = menteeProfileMap.get(user.id);
                const tipAccess = tipAccessMap.get(user.id);
                const mentorDriveDraft = mentorDriveDrafts[String(user.id)] ?? (mentorProfile?.googleDriveFolderUrl ?? "");
                const menteeLimitDraft = menteeLimitDrafts[String(user.id)] ?? {
                  disabledHintGuideTemplateIds: [],
                  emailInboxEnabled: Boolean(menteeProfile?.emailInboxEnabled),
                  maxActiveGuideCount: Number(menteeProfile?.maxActiveGuideCount ?? 1),
                  maxHintGuideCount: Number(menteeProfile?.maxHintGuideCount ?? 1),
                  maxStorageMb: Number(menteeProfile?.maxStorageMb ?? 100),
                };
                const mentorApproved = Boolean(mentorProfile?.adminApproved);
                const menteeApproved = Boolean(menteeProfile?.adminApproved);

                return (
                  <div className="list-item" key={user.id}>
                    <header>
                      <div>
                        <h3>{user.fullName}</h3>
                        <div className="muted small">{user.email}</div>
                      </div>
                      <span className="badge">
                        {user.role} • {user.status}
                      </span>
                    </header>
                    {user.role === "mentor" ? (
                      <>
                        <p className="muted">Akceptacja mentora: <strong>{mentorApproved ? "tak" : "nie"}</strong>.</p>
                        <div className="field" style={{ marginTop: 12 }}>
                          <label>Folder Google Drive mentora</label>
                          <input
                            placeholder="To pole ustawia administrator"
                            value={mentorDriveDraft}
                            onChange={(event) =>
                              setMentorDriveDrafts((current) => ({
                                ...current,
                                [String(user.id)]: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </>
                    ) : null}
                    {user.role === "mentee" ? (
                      <>
                        <p className="muted">Akceptacja mentee: <strong>{menteeApproved ? "tak" : "nie"}</strong>.</p>
                        <div className="grid-2" style={{ marginTop: 12 }}>
                          <div className="field">
                            <label>Limit aktywnych programów / przewodników</label>
                            <input
                              min={1}
                              type="number"
                              value={menteeLimitDraft.maxActiveGuideCount}
                              onChange={(event) =>
                                setMenteeLimitDrafts((current) => ({
                                  ...current,
                                  [String(user.id)]: {
                                    ...menteeLimitDraft,
                                    maxActiveGuideCount: Number(event.target.value),
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Limit uczelni z dostępem do wskazówek</label>
                            <input
                              min={0}
                              type="number"
                              value={menteeLimitDraft.maxHintGuideCount}
                              onChange={(event) =>
                                setMenteeLimitDrafts((current) => ({
                                  ...current,
                                  [String(user.id)]: {
                                    ...menteeLimitDraft,
                                    maxHintGuideCount: Number(event.target.value),
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="grid-2" style={{ marginTop: 12 }}>
                          <div className="field">
                            <label>Limit miejsca na pliki (MB)</label>
                            <input
                              min={10}
                              type="number"
                              value={menteeLimitDraft.maxStorageMb}
                              onChange={(event) =>
                                setMenteeLimitDrafts((current) => ({
                                  ...current,
                                  [String(user.id)]: {
                                    ...menteeLimitDraft,
                                    maxStorageMb: Number(event.target.value),
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Dostęp do maili uczelni</label>
                            <select
                              value={String(menteeLimitDraft.emailInboxEnabled)}
                              onChange={(event) =>
                                setMenteeLimitDrafts((current) => ({
                                  ...current,
                                  [String(user.id)]: {
                                    ...menteeLimitDraft,
                                    emailInboxEnabled: event.target.value === "true",
                                  },
                                }))
                              }
                            >
                              <option value="false">zablokowany</option>
                              <option value="true">odblokowany</option>
                            </select>
                          </div>
                        </div>
                        <div className="stack" style={{ marginTop: 10 }}>
                          <div className="muted small">
                            Aktywny dostęp do wskazówek: {(tipAccess?.guides ?? []).length} / {menteeLimitDraft.maxHintGuideCount}
                          </div>
                          {(tipAccess?.guides ?? []).length ? (
                            <div className="list">
                              {(tipAccess?.guides ?? []).map((guide: any) => (
                                <div className="list-item" key={`tip-access-${user.id}-${guide.id}`}>
                                  <header>
                                    <div>
                                      <h3>{formatGuidePrimaryLabel(guide)}</h3>
                                      <div className="muted small">{formatGuideSecondaryLabel(guide)}</div>
                                    </div>
                                    <button
                                      className="btn btn-secondary"
                                      disabled={userActionId === user.id}
                                      onClick={() =>
                                        void runUserAction(
                                          user.id,
                                          async () => {
                                            const nextDisabledIds = Array.from(
                                              new Set([
                                                ...menteeLimitDraft.disabledHintGuideTemplateIds,
                                                String(guide.id),
                                              ]),
                                            );
                                            await apiFetch(`/admin/mentees/${user.id}/settings`, {
                                              method: "PATCH",
                                              body: JSON.stringify({
                                                disabledHintGuideTemplateIds: nextDisabledIds
                                                  .map((value) => Number(value))
                                                  .filter((value) => Number.isFinite(value) && value > 0),
                                                emailInboxEnabled: Boolean(menteeLimitDraft.emailInboxEnabled),
                                                maxActiveGuideCount: Number(menteeLimitDraft.maxActiveGuideCount),
                                                maxHintGuideCount: Number(menteeLimitDraft.maxHintGuideCount),
                                                maxStorageMb: Number(menteeLimitDraft.maxStorageMb),
                                              }),
                                            }, token);
                                          },
                                          "Dostęp do wskazówek został usunięty dla tego programu / przewodnika.",
                                        )
                                      }
                                      type="button"
                                    >
                                      Usuń dostęp do wskazówek
                                    </button>
                                  </header>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="small muted">Ten mentee nie ma obecnie aktywnego dostępu do wskazówek żadnego programu / przewodnika.</div>
                          )}
                        </div>
                      </>
                    ) : null}
                    <div className="button-row">
                      {user.role === "mentor" ? (
                        <button
                          className="btn btn-secondary"
                          disabled={userActionId === user.id}
                          onClick={() => void saveMentorDriveFolder(user.id)}
                          type="button"
                        >
                          Zapisz folder Drive
                        </button>
                      ) : null}
                      {user.role === "mentor" ? (
                        <button
                          className="btn btn-secondary"
                          disabled={userActionId === user.id}
                          onClick={() => void generateMentorDriveFolder(user.id)}
                          type="button"
                        >
                          Wygeneruj folder mentora
                        </button>
                      ) : null}
                      {user.role === "mentor" ? (
                        <button
                          className="btn btn-secondary"
                          disabled={userActionId === user.id}
                          onClick={() =>
                            void runUserAction(
                              user.id,
                              async () => {
                                await apiFetch(`/admin/mentors/${user.id}/approve`, {
                                  method: "PATCH",
                                  body: JSON.stringify({ approved: !mentorApproved }),
                                }, token);
                              },
                              mentorApproved ? "Mentor został cofnięty do oczekujących." : "Mentor został zaakceptowany.",
                            )
                          }
                          type="button"
                        >
                          {mentorApproved ? "Cofnij akceptację" : "Akceptuj mentora"}
                        </button>
                      ) : null}
                      {user.role === "mentee" ? (
                        <button
                          className="btn btn-secondary"
                          disabled={userActionId === user.id}
                          onClick={() => void saveMenteeLimits(user.id)}
                          type="button"
                        >
                          Zapisz limity i wskazówki
                        </button>
                      ) : null}
                      {user.role === "mentee" ? (
                        <button
                          className="btn btn-secondary"
                          disabled={userActionId === user.id}
                          onClick={() =>
                            void runUserAction(
                              user.id,
                              async () => {
                                await apiFetch(`/admin/mentees/${user.id}/approve`, {
                                  method: "PATCH",
                                  body: JSON.stringify({ approved: !menteeApproved }),
                                }, token);
                              },
                              menteeApproved ? "Mentee został cofnięty do oczekujących." : "Mentee został zaakceptowany.",
                            )
                          }
                          type="button"
                        >
                          {menteeApproved ? "Cofnij akceptację" : "Akceptuj mentee"}
                        </button>
                      ) : null}
                      {user.role !== "admin" ? (
                        <button
                          className="btn btn-secondary"
                          disabled={userActionId === user.id}
                          onClick={() =>
                            void runUserAction(
                              user.id,
                              async () => {
                                await apiFetch(`/admin/users/${user.id}`, {
                                  method: "PUT",
                                  body: JSON.stringify({
                                    fullName: user.fullName,
                                    status: user.status === "disabled" ? "active" : "disabled",
                                    notes: user.notes ?? "",
                                    avatarUrl: user.avatarUrl ?? "",
                                  }),
                                }, token);
                              },
                              user.status === "disabled" ? "Konto zostało ponownie aktywowane." : "Konto zostało wyłączone.",
                            )
                          }
                          type="button"
                        >
                          {user.status === "disabled" ? "Włącz konto" : "Wyłącz konto"}
                        </button>
                      ) : null}
                      {user.role !== "admin" ? (
                        <button
                          className="btn btn-secondary"
                          disabled={userActionId === user.id}
                          onClick={() =>
                            void runUserAction(
                              user.id,
                              async () => {
                                await apiFetch(`/admin/users/${user.id}`, { method: "DELETE" }, token);
                              },
                              "Konto zostało usunięte.",
                            )
                          }
                          type="button"
                        >
                          Usuń konto
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
      {section === "guides" ? (
        <div className="stack">
          <div className="split">
            <div className="dashboard-card panel-scroll">
              <h2>{editingGuideId === "new" ? "Nowy szablon uczelni" : "Edytor szablonu uczelni"}</h2>
              <form className="stack" onSubmit={saveGuide}>
                <div className="grid-2">
                  <div className="field">
                    <label>Tytuł</label>
                    <input value={guideForm.title} onChange={(event) => setGuideForm((current) => ({ ...current, title: event.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Slug</label>
                    <input value={guideForm.slug} onChange={(event) => setGuideForm((current) => ({ ...current, slug: event.target.value }))} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Rodzaj szablonu</label>
                    <select value={guideForm.guideType} onChange={(event) => setGuideForm((current) => ({ ...current, guideType: event.target.value }))}>
                      <option value="admin_template">Szablon ACADEA</option>
                      <option value="mentor_blueprint">Szablon mentora</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Status</label>
                    <select value={guideForm.status} onChange={(event) => setGuideForm((current) => ({ ...current, status: event.target.value }))}>
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                      <option value="archived">archived</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Kraj</label>
                    <input value={guideForm.country} onChange={(event) => setGuideForm((current) => ({ ...current, country: event.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Uczelnia</label>
                    <input value={guideForm.universityName} onChange={(event) => setGuideForm((current) => ({ ...current, universityName: event.target.value }))} />
                  </div>
                </div>
                <div className="field">
                  <label>Widoczny przed akceptacją</label>
                  <select
                    value={String(guideForm.isVisibleToUnapprovedUsers)}
                    onChange={(event) =>
                      setGuideForm((current) => ({
                        ...current,
                        isVisibleToUnapprovedUsers: event.target.value === "true",
                      }))
                    }
                  >
                    <option value="false">nie</option>
                    <option value="true">tak</option>
                  </select>
                </div>
                <div className="field">
                  <label>Krótki opis</label>
                  <textarea value={guideForm.summary} onChange={(event) => setGuideForm((current) => ({ ...current, summary: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Opis / treść</label>
                  <textarea value={guideForm.descriptionMarkdown} onChange={(event) => setGuideForm((current) => ({ ...current, descriptionMarkdown: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Domeny maili uczelni / programu</label>
                  <textarea
                    placeholder="@uva.nl&#10;admissions.eur.nl&#10;tilburguniversity.edu"
                    value={guideForm.emailSenderDomainsText}
                    onChange={(event) => setGuideForm((current) => ({ ...current, emailSenderDomainsText: event.target.value }))}
                  />
                  <div className="small muted">
                    Po jednej domenie w linii. Te domeny są używane w zakładce Twoje Maile od Uczelni.
                  </div>
                </div>
                <div className="field">
                  <label>Zakres tego szablonu</label>
                  <div className="status">
                    Wymagania i materiały budujesz już wyłącznie w projektancie kafli materiałów. Tutaj ustawiasz tylko metadane uczelni oraz opis.
                  </div>
                </div>
                <div className="button-row">
                  <button className="btn btn-primary">{editingGuideId === "new" ? "Utwórz szablon uczelni" : "Zapisz zmiany"}</button>
                  <button className="btn btn-secondary" onClick={resetGuideForm} type="button">
                    Wyczyść formularz
                  </button>
                </div>
              </form>
              {editingGuideId !== "new" ? (
                <div className="stack" style={{ marginTop: 18 }}>
                  <h3 style={{ margin: 0, color: "#153f2c" }}>Powiąż uczelnię z istniejącymi kaflami materiałów</h3>
                  <p className="muted" style={{ margin: 0 }}>
                    Tutaj przypisujesz tę uczelnię do kafli takich jak paszport, personal essay, recommendation letters i podobnych.
                  </p>
                  <div className="list">
                    {materialTemplates.map((template) => {
                      const linkedIds: number[] = template.appliesToGuideIds ?? [];
                      const isLinked = linkedIds.includes(Number(editingGuideId));
                      return (
                        <div className="list-item" key={`material-link-${template.id}`}>
                          <header>
                            <div>
                              <h3>{template.title}</h3>
                            </div>
                            <button
                              className="btn btn-secondary"
                              disabled={guideActionId === template.id}
                              onClick={() =>
                                void runGuideAction(
                                  template.id,
                                  async () => {
                                    const nextIds = isLinked
                                      ? linkedIds.filter((id: number) => id !== Number(editingGuideId))
                                      : [...linkedIds, Number(editingGuideId)];
                                    await apiFetch(`/admin/material-templates/${template.id}`, {
                                      method: "PUT",
                                      body: JSON.stringify({
                                        title: template.title,
                                        description: template.description ?? "",
                                        templateType: template.templateType,
                                        guideId: template.guideId ?? null,
                                        appliesToGuideIds: nextIds,
                                        structure: template.structure ?? [],
                                        alternativeOptions: template.alternativeOptions ?? [],
                                        isActive: Boolean(template.isActive),
                                      }),
                                    }, token);
                                    await refreshDesigner();
                                  },
                                  isLinked ? "Uczelnia została odpięta od kafla." : "Uczelnia została dodana do kafla.",
                                )
                              }
                              type="button"
                            >
                              {isLinked ? "Odepnij uczelnię" : "Dodaj uczelnię do kafla"}
                            </button>
                          </header>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="dashboard-card panel-scroll">
              <h2>Szablony uczelni w systemie</h2>
              <div className="list">
                {editableGuideTemplates.map((guide) => (
                  <div className="list-item" key={guide.id}>
                    <header>
                      <div>
                        <h3>{guide.title}</h3>
                        <div className="muted small">
                          {formatGuideSecondaryLabel(guide)}
                        </div>
                      </div>
                      <span className="badge">
                        {platformGuideTypeLabel(guide.guideType)} • {guide.status}
                      </span>
                    </header>
                    <p className="muted">{guide.summary}</p>
                    <div className="button-row" style={{ marginTop: 12 }}>
                      <button className="btn btn-secondary" onClick={() => loadGuideIntoEditor(guide)} type="button">
                        Edytuj
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={guideActionId === guide.id}
                        onClick={() =>
                          void runGuideAction(
                            guide.id,
                            async () => {
                              await apiFetch(`/admin/guides/${guide.id}`, { method: "DELETE" }, token);
                              if (editingGuideId === String(guide.id)) {
                                resetGuideForm();
                              }
                            },
                            "Przewodnik został usunięty.",
                          )
                        }
                        type="button"
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {section === "profile-designer" ? (
        <div className="stack">
          <div className="split">
            <div className="dashboard-card panel-scroll">
              <h2>Projektant formularza „Twoje Dane”</h2>
              <form className="stack" onSubmit={saveProfileField}>
                <div className="grid-2">
                  <div className="field">
                    <label>Klucz pola</label>
                    <input value={profileFieldForm.key} onChange={(event) => setProfileFieldForm((current) => ({ ...current, key: event.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Etykieta</label>
                    <input value={profileFieldForm.label} onChange={(event) => setProfileFieldForm((current) => ({ ...current, label: event.target.value }))} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Sekcja</label>
                    <input value={profileFieldForm.sectionTitle} onChange={(event) => setProfileFieldForm((current) => ({ ...current, sectionTitle: event.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Typ pola</label>
                    <select value={profileFieldForm.fieldType} onChange={(event) => setProfileFieldForm((current) => ({ ...current, fieldType: event.target.value }))}>
                      <option value="text">text</option>
                      <option value="textarea">textarea</option>
                      <option value="date">date</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Placeholder</label>
                    <input value={profileFieldForm.placeholder} onChange={(event) => setProfileFieldForm((current) => ({ ...current, placeholder: event.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Sortowanie</label>
                    <input type="number" value={profileFieldForm.sortOrder} onChange={(event) => setProfileFieldForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
                  </div>
                </div>
                <div className="field">
                  <label>Opis</label>
                  <textarea value={profileFieldForm.description} onChange={(event) => setProfileFieldForm((current) => ({ ...current, description: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Wymagane</label>
                  <select value={String(profileFieldForm.isRequired)} onChange={(event) => setProfileFieldForm((current) => ({ ...current, isRequired: event.target.value === "true" }))}>
                    <option value="false">nie</option>
                    <option value="true">tak</option>
                  </select>
                </div>
                <div className="button-row">
                  <button className="btn btn-primary">{fieldEditorId === "new" ? "Dodaj pole" : "Zapisz pole"}</button>
                  <button className="btn btn-secondary" onClick={resetProfileFieldForm} type="button">
                    Nowe pole
                  </button>
                </div>
              </form>
            </div>
            <div className="dashboard-card">
              <h2>Pola formularza</h2>
              <div className="list">
                {profileFields.map((field) => (
                  <div className="list-item" key={field.id}>
                    <header>
                      <div>
                        <h3>{field.label}</h3>
                        <div className="muted small">{field.sectionTitle} • {field.fieldType} • {field.key}</div>
                      </div>
                      <span className="badge">{field.isRequired ? "required" : "optional"}</span>
                    </header>
                    <p className="muted">{field.description}</p>
                    <div className="button-row">
                      <button className="btn btn-secondary" onClick={() => loadProfileFieldIntoEditor(field)} type="button">
                        Edytuj
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={designerActionId === field.id}
                        onClick={async () => {
                          setDesignerActionId(field.id);
                          try {
                            await apiFetch(`/admin/profile-fields/${field.id}`, { method: "DELETE" }, token);
                            await refreshDesigner();
                            if (fieldEditorId === String(field.id)) {
                              resetProfileFieldForm();
                            }
                            setStatus("Pole formularza zostało usunięte.");
                          } catch (error) {
                            setStatus(error instanceof Error ? error.message : "Nie udało się usunąć pola formularza.");
                          } finally {
                            setDesignerActionId(null);
                          }
                        }}
                        type="button"
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {section === "materials-designer" ? (
        <div className="split">
          <div className="dashboard-card panel-scroll">
            <h2>Projektant Kafli Materiałów</h2>
            <p className="muted">
              Tutaj tworzysz kafle materiałów widoczne u mentee. Najpierw zakładasz kafel, potem zaznaczasz, dla których uczelni ma się pokazywać.
            </p>
            <div className="button-row" style={{ marginBottom: 12 }}>
              <button
                className="btn btn-secondary"
                disabled={masterTemplateDocLoading}
                onClick={() => void refreshMasterTemplateDoc()}
                type="button"
              >
                {masterTemplateDocLoading ? "Ładowanie master Doc..." : "Odśwież master Doc"}
              </button>
              {masterTemplateDoc?.url ? (
                <a className="btn btn-secondary" href={masterTemplateDoc.url} rel="noreferrer" target="_blank">
                  Otwórz master Doc
                </a>
              ) : null}
            </div>
            {masterTemplateDoc ? (
              <p className="muted small" style={{ marginTop: 0 }}>
                Master Doc: {masterTemplateDoc.title} • {masterTemplateDoc.tabs.length} zakładek
              </p>
            ) : null}
            <form className="stack" onSubmit={importGuideBlueprintFromJson} style={{ marginBottom: 24 }}>
              <div className="field">
                <label>Import przewodnika z JSON</label>
                <textarea
                  placeholder="Wklej blueprint JSON przewodnika wygenerowany według schematu importu."
                  rows={10}
                  value={guideImportJson}
                  onChange={(event) => setGuideImportJson(event.target.value)}
                />
                <div className="small muted">
                  Import utworzy albo zaktualizuje przewodnik, wskazówki do elementów i kafle materiałów. Potem wszystko dalej edytujesz normalnie w panelu.
                </div>
              </div>
              <div className="button-row">
                <button className="btn btn-secondary" disabled={guideImporting || !guideImportJson.trim()}>
                  {guideImporting ? "Importowanie..." : "Importuj JSON przewodnika"}
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={assistantBundleLoading}
                  onClick={() => void loadGuideBlueprintAssistantBundle()}
                  type="button"
                >
                  {assistantBundleLoading ? "Generowanie..." : "Generuj schema/prompt/context"}
                </button>
              </div>
            </form>
            {assistantBundle ? (
              <div className="stack" style={{ marginBottom: 24 }}>
                <div className="field">
                  <div className="button-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ marginBottom: 0 }}>Prompt dla ChatGPT</label>
                    <button className="btn btn-secondary" onClick={() => void copyGuideBlueprintPrompt()} type="button">
                      Kopiuj cały prompt
                    </button>
                  </div>
                  <textarea readOnly rows={10} value={assistantBundle.promptTemplate} />
                </div>
                <div className="field">
                  <label>Schema / zasady importu</label>
                  <textarea readOnly rows={10} value={JSON.stringify(assistantBundle.schema, null, 2)} />
                </div>
                <div className="field">
                  <label>Aktualny kontekst bazy</label>
                  <textarea readOnly rows={12} value={JSON.stringify(assistantBundle.context, null, 2)} />
                </div>
              </div>
            ) : null}
            <form className="stack" onSubmit={saveMaterialTemplate}>
              <div className="grid-2">
                <div className="field">
                  <label>Nazwa kafla</label>
                  <input value={materialForm.title} onChange={(event) => setMaterialForm((current) => ({ ...current, title: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Typ</label>
                  <select value={materialForm.templateType} onChange={(event) => setMaterialForm((current) => ({ ...current, templateType: event.target.value }))}>
                    <option value="passport_like">Wspólne dokumenty</option>
                    <option value="essay_like">Eseje i zadania</option>
                    <option value="offer_like">Po ofercie</option>
                  </select>
                </div>
              </div>
              <label className="checkbox-card">
                <input
                  checked={materialForm.templateType === "essay_like"}
                  type="checkbox"
                  onChange={(event) =>
                    setMaterialForm((current) => ({
                      ...current,
                      templateType: event.target.checked ? "essay_like" : "passport_like",
                    }))
                  }
                />
                <span>
                  Ten kafel jest esejowy.
                  <br />
                  Pokaż go w zakładce <strong>Twoje Eseje</strong> zamiast w <strong>Twoje Materiały</strong>.
                </span>
              </label>
              <label className="checkbox-card">
                <input
                  checked={materialForm.templateType === "offer_like"}
                  type="checkbox"
                  onChange={(event) =>
                    setMaterialForm((current) => ({
                      ...current,
                      templateType: event.target.checked ? "offer_like" : "passport_like",
                    }))
                  }
                />
                <span>
                  Ten kafel dotyczy działań po otrzymaniu oferty.
                  <br />
                  Pokaż go w zakładce <strong>Twoje Oferty</strong> zamiast w <strong>Twoje Materiały</strong>.
                </span>
              </label>
              <div className="field">
                <label>Opis</label>
                <textarea value={materialForm.description} onChange={(event) => setMaterialForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <div className="field">
                <label>Ogólne wskazówki dla całego kafla (opcjonalnie)</label>
                <select value={materialForm.guideId} onChange={(event) => setMaterialForm((current) => ({ ...current, guideId: event.target.value }))}>
                  <option value="">Brak</option>
                  {itemGuides.map((guide) => (
                    <option key={guide.id} value={String(guide.id)}>
                      {guide.title} • {formatGuideScopeLabel(guide, materialGuideTemplates)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Do których programów / przewodników ten kafel się stosuje</label>
                <div className="list">
                  {materialGuideTemplates.map((guide) => {
                    const checked = materialForm.appliesToGuideIds.includes(String(guide.id));
                    return (
                      <label className="selector-option" key={`material-guide-checkbox-${guide.id}`}>
                        <input
                          checked={checked}
                          type="checkbox"
                          onChange={() =>
                            setMaterialForm((current) => ({
                              ...current,
                              appliesToGuideIds: checked
                                ? current.appliesToGuideIds.filter((id) => id !== String(guide.id))
                                : [...current.appliesToGuideIds, String(guide.id)],
                            }))
                          }
                        />
                                <span className="selector-copy">
                                  <strong>{formatGuidePrimaryLabel(guide)}</strong>
                                  <span className="small muted" style={{ display: "block" }}>{formatGuideSecondaryLabel(guide)}</span>
                                </span>
                              </label>
                            );
                          })}
                </div>
              </div>
              <div className="field">
                <label>Wiersze wewnątrz kafla</label>
                <div className="stack">
                  {materialForm.rows.map((row, index) => {
                    const allowedGuideIds = new Set(materialForm.appliesToGuideIds);
                    const rowGuideChoices = materialGuideTemplates.filter((guide) => allowedGuideIds.has(String(guide.id)));
                    return (
                      <div className="list-item" key={`material-row-${index}`}>
                        <header>
                          <div>
                            <h3>Wiersz {index + 1}</h3>
                            <div className="muted small">Każdy wiersz może dotyczyć wielu uczelni z tego kafla i mieć własne wskazówki.</div>
                          </div>
                          <div className="button-row row-tools">
                            <button className="btn btn-secondary btn-compact btn-icon" onClick={() => moveMaterialRow(index, -1)} type="button" title="Przesuń w górę">↑</button>
                            <button className="btn btn-secondary btn-compact btn-icon" onClick={() => moveMaterialRow(index, 1)} type="button" title="Przesuń w dół">↓</button>
                            <button className="btn btn-secondary btn-compact" onClick={() => addMaterialRow(index)} type="button">Dodaj nad</button>
                            <button className="btn btn-secondary btn-compact" onClick={() => addMaterialRow(index + 1)} type="button">Dodaj pod</button>
                            <button className="btn btn-secondary btn-compact" onClick={() => removeMaterialRow(index)} type="button">Usuń</button>
                          </div>
                        </header>
                        <div className="field">
                          <label>Do których programów / przewodników ten wiersz jest wymagany</label>
                          <div className="list">
                            {rowGuideChoices.map((guide) => {
                              const checked = row.appliesToGuideIds.includes(String(guide.id));
                              return (
                                <label className="selector-option" key={`row-guide-assignment-${index}-${guide.id}`}>
                                  <input
                                    checked={checked}
                                    type="checkbox"
                                    onChange={() =>
                                      updateMaterialRow(index, (current) => ({
                                        ...current,
                                        appliesToGuideIds: checked
                                          ? current.appliesToGuideIds.filter((id) => id !== String(guide.id))
                                          : [...current.appliesToGuideIds, String(guide.id)],
                                      }))
                                    }
                                  />
                                  <span className="selector-copy">
                                    <strong>{formatGuidePrimaryLabel(guide)}</strong>
                                    <span className="small muted" style={{ display: "block" }}>{formatGuideSecondaryLabel(guide)}</span>
                                  </span>
                                </label>
                              );
                            })}
                            {!rowGuideChoices.length ? <div className="small muted">Najpierw przypisz uczelnie do całego kafla.</div> : null}
                          </div>
                        </div>
                        <div className="field">
                          <label>Poziom formatowania</label>
                          <select
                            value={row.level}
                            onChange={(event) =>
                              updateMaterialRow(index, (current) => ({
                                ...current,
                                country: event.target.value === "country" ? current.country : "",
                                guideId: event.target.value === "item" ? current.guideId : "",
                                level: event.target.value as MaterialRowEditor["level"],
                                task: event.target.value === "item" ? current.task : "",
                                university: event.target.value === "university" ? current.university : "",
                              }))
                            }
                          >
                            <option value="country">Kraj</option>
                            <option value="university">Uczelnia</option>
                            <option value="item">Element / zadanie</option>
                          </select>
                        </div>
                        {row.level === "country" ? (
                          <div className="field">
                            <label>Kraj</label>
                            <input
                              value={row.country}
                              onChange={(event) =>
                                updateMaterialRow(index, (current) => ({
                                  ...current,
                                  country: event.target.value,
                                }))
                              }
                            />
                          </div>
                        ) : null}
                        {row.level === "university" ? (
                          <div className="field">
                            <label>Uczelnia</label>
                            <input
                              value={row.university}
                              onChange={(event) =>
                                updateMaterialRow(index, (current) => ({
                                  ...current,
                                  university: event.target.value,
                                }))
                              }
                            />
                          </div>
                        ) : null}
                        {row.level === "item" ? (
                          <>
                            <div className="field">
                              <label>Nazwa elementu / zadania</label>
                              <input
                                value={row.task}
                                onChange={(event) =>
                                  updateMaterialRow(index, (current) => ({
                                    ...current,
                                    task: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="field">
                              <label>Typ akcji dla mentee</label>
                              <select
                                value={row.actionType}
                                onChange={(event) =>
                                  updateMaterialRow(index, (current) => ({
                                    ...current,
                                    actionType: event.target.value as MaterialItemAction,
                                  }))
                                }
                              >
                                <option value="check_only">Tylko checkbox</option>
                                <option value="file_required">Tylko upload pliku</option>
                                <option value="file_or_doc">Upload pliku lub Google Doc</option>
                                <option value="check_or_file">Checkbox lub upload pliku</option>
                              </select>
                            </div>
                            <div className="field">
                              <label>Sugerowana nazwa pliku (opcjonalnie)</label>
                              <input
                                value={row.suggestedFilename ?? ""}
                                onChange={(event) =>
                                  updateMaterialRow(index, (current) => ({
                                    ...current,
                                    suggestedFilename: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            {row.actionType === "file_or_doc" ? (
                              <>
                                <div className="field">
                                  <label>Tytuł zakładki w Essay Doc</label>
                                  <input
                                    value={row.docTabTitle ?? ""}
                                    onChange={(event) =>
                                      updateMaterialRow(index, (current) => ({
                                        ...current,
                                        docTabTitle: event.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="field">
                                  <label>Źródło treści nowej zakładki</label>
                                  <select
                                    value={getMaterialDocSeedMode(row)}
                                    onChange={(event) =>
                                      updateMaterialRow(index, (current) =>
                                        event.target.value === "source_tab"
                                          ? {
                                              ...current,
                                              docSeedMode: "source_tab",
                                              docTabPrompt: "",
                                            }
                                          : {
                                              ...current,
                                              docSeedMode: "plain_text",
                                              sourceDocumentId: "",
                                              sourceTabId: "",
                                            },
                                      )
                                    }
                                  >
                                    <option value="plain_text">Plain text / prompt</option>
                                    <option value="source_tab">Kopia z istniejącej zakładki Google Docs</option>
                                  </select>
                                </div>
                                {getMaterialDocSeedMode(row) === "source_tab" ? (
                                  <>
                                    <div className="button-row" style={{ marginBottom: 8 }}>
                                      <button
                                        className="btn btn-secondary"
                                        disabled={masterTemplateActionKey === (row.displayKey ?? `row-${index}`)}
                                        onClick={() => void createMasterTemplateTabForRow(index)}
                                        type="button"
                                      >
                                        {masterTemplateActionKey === (row.displayKey ?? `row-${index}`)
                                          ? "Tworzenie template taba..."
                                          : "Utwórz template tab z tego wiersza"}
                                      </button>
                                      {masterTemplateDoc?.url ? (
                                        <a className="btn btn-secondary" href={masterTemplateDoc.url} rel="noreferrer" target="_blank">
                                          Otwórz master Doc
                                        </a>
                                      ) : null}
                                    </div>
                                    {masterTemplateDoc?.tabs?.length ? (
                                      <div className="field">
                                        <label>Wybierz source tab z master Doc</label>
                                        <select
                                          value={row.sourceTabId ?? ""}
                                          onChange={(event) =>
                                            updateMaterialRow(index, (current) => ({
                                              ...current,
                                              docSeedMode: "source_tab",
                                              sourceDocumentId: masterTemplateDoc.documentId,
                                              sourceTabId: event.target.value,
                                            }))
                                          }
                                        >
                                          <option value="">Wybierz zakładkę</option>
                                          {masterTemplateDoc.tabs.map((tab) => (
                                            <option key={tab.tabId} value={tab.tabId}>
                                              {tab.title}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    ) : null}
                                    <div className="field">
                                      <label>Source document ID</label>
                                      <input
                                        value={row.sourceDocumentId ?? ""}
                                        onChange={(event) =>
                                          updateMaterialRow(index, (current) => ({
                                            ...current,
                                            sourceDocumentId: event.target.value,
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="field">
                                      <label>Source tab ID</label>
                                      <input
                                        value={row.sourceTabId ?? ""}
                                        onChange={(event) =>
                                          updateMaterialRow(index, (current) => ({
                                            ...current,
                                            sourceTabId: event.target.value,
                                          }))
                                        }
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <div className="field">
                                  <label>Tekst startowy / prompt na początku zakładki</label>
                                  <textarea
                                    value={row.docTabPrompt ?? ""}
                                    onChange={(event) =>
                                      updateMaterialRow(index, (current) => ({
                                        ...current,
                                        docTabPrompt: event.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                )}
                              </>
                            ) : null}
                            <div className="field">
                              <label>Link do wskazówek</label>
                              <select
                                value={row.guideId}
                                onChange={(event) =>
                                  updateMaterialRow(index, (current) => ({
                                    ...current,
                                    guideId: event.target.value,
                                  }))
                                }
                              >
                                <option value="">Brak</option>
                                {itemGuides.map((guide) => (
                                  <option key={`row-guide-${guide.id}`} value={String(guide.id)}>
                                    {guide.title} • {formatGuideScopeLabel(guide, materialGuideTemplates)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="field">
                              <label>Alternatywne sposoby wykonania, po jednej opcji w linii</label>
                              <textarea
                                value={row.alternativeOptions.join("\n")}
                                onChange={(event) =>
                                  updateMaterialRow(index, (current) => ({
                                    ...current,
                                    alternativeOptions: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                                  }))
                                }
                              />
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <div className="button-row" style={{ marginTop: 12 }}>
                  <button className="btn btn-secondary" onClick={() => addMaterialRow()} type="button">Dodaj nowy wiersz na końcu</button>
                </div>
              </div>
              <div className="field">
                <label>Aktywny</label>
                <select value={String(materialForm.isActive)} onChange={(event) => setMaterialForm((current) => ({ ...current, isActive: event.target.value === "true" }))}>
                  <option value="true">tak</option>
                  <option value="false">nie</option>
                </select>
              </div>
              <div className="button-row">
                <button className="btn btn-primary">{materialEditorId === "new" ? "Dodaj materiał" : "Zapisz materiał"}</button>
                <button className="btn btn-secondary" onClick={resetMaterialForm} type="button">Nowy materiał</button>
              </div>
            </form>
          </div>
          <div className="dashboard-card panel-scroll">
            <h2>Szablony materiałów</h2>
            <div className="list">
              {materialTemplates.map((template) => (
                <div className="list-item" key={template.id}>
                  <header>
                    <div>
                      <h3>{template.title}</h3>
                      <div className="muted small">
                        {materialTemplateTypeLabel(template.templateType)} • {countMaterialTemplateUniversityUsage(template, materialGuideTemplates)} powiązań przewodników
                      </div>
                    </div>
                    <span className="badge">{template.isActive ? "active" : "inactive"}</span>
                  </header>
                  <p className="muted">{template.description}</p>
                  <div className="button-row">
                    <button className="btn btn-secondary" onClick={() => loadMaterialIntoEditor(template)} type="button">Edytuj</button>
                    <button
                      className="btn btn-secondary"
                      disabled={designerActionId === template.id}
                      onClick={async () => {
                        setDesignerActionId(template.id);
                        try {
                          await apiFetch(`/admin/material-templates/${template.id}`, { method: "DELETE" }, token);
                          await refreshDesigner();
                          if (materialEditorId === String(template.id)) {
                            resetMaterialForm();
                          }
                          setStatus("Szablon materiału został usunięty.");
                        } catch (error) {
                          setStatus(error instanceof Error ? error.message : "Nie udało się usunąć szablonu materiału.");
                        } finally {
                          setDesignerActionId(null);
                        }
                      }}
                      type="button"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {section === "item-guides" ? (
        <div className="split">
          <div className="dashboard-card panel-scroll">
            <h2>Wskazówki do Elementów</h2>
            <p className="muted">Tutaj tworzysz osobne treści pomocnicze, które potem można podpiąć do konkretnego wiersza w kaflu materiałów.</p>
            <form className="stack" onSubmit={saveItemGuide}>
              <div className="field">
                <label>Do których programów / przewodników te wskazówki mają się odnosić</label>
                <div className="selector-grid">
                  {materialGuideTemplates.map((guide) => {
                    const checked = itemGuideForm.appliesToGuideIds.includes(String(guide.id));
                    return (
                      <label className="selector-option" key={`item-guide-apply-${guide.id}`}>
                        <input
                          checked={checked}
                          onChange={() =>
                            setItemGuideForm((current) => ({
                              ...current,
                              appliesToGuideIds: checked
                                ? current.appliesToGuideIds.filter((id) => id !== String(guide.id))
                                : [...current.appliesToGuideIds, String(guide.id)],
                            }))
                          }
                          type="checkbox"
                        />
                        <div className="selector-copy">
                          <strong>{formatGuidePrimaryLabel(guide)}</strong>
                          <span className="small muted">{formatGuideSecondaryLabel(guide)}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Tytuł wskazówek</label>
                  <input value={itemGuideForm.title} onChange={(event) => setItemGuideForm((current) => ({ ...current, title: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Slug</label>
                  <input value={itemGuideForm.slug} onChange={(event) => setItemGuideForm((current) => ({ ...current, slug: event.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Krótki opis</label>
                <textarea value={itemGuideForm.summary} onChange={(event) => setItemGuideForm((current) => ({ ...current, summary: event.target.value }))} />
              </div>
              <div className="field">
                <label>Treść wskazówek</label>
                <textarea value={itemGuideForm.descriptionMarkdown} onChange={(event) => setItemGuideForm((current) => ({ ...current, descriptionMarkdown: event.target.value }))} />
              </div>
              <div className="field">
                <label>Status</label>
                <select value={itemGuideForm.status} onChange={(event) => setItemGuideForm((current) => ({ ...current, status: event.target.value }))}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
              </div>
              <div className="button-row">
                <button className="btn btn-primary">{itemGuideEditorId === "new" ? "Dodaj wskazówki" : "Zapisz wskazówki"}</button>
                <button className="btn btn-secondary" onClick={resetItemGuideForm} type="button">Nowe wskazówki</button>
              </div>
            </form>
          </div>
          <div className="dashboard-card">
            <h2>Istniejące wskazówki</h2>
            <div className="list">
              {itemGuides.map((guide) => (
                <div className="list-item" key={guide.id}>
                  <header>
                    <div>
                      <h3>{guide.title}</h3>
                      <div className="muted small">{formatGuideScopeLabel(guide, materialGuideTemplates)}</div>
                    </div>
                    <span className="badge">{guide.status}</span>
                  </header>
                  <p className="muted">{guide.summary}</p>
                  <div className="button-row">
                    <button className="btn btn-secondary" onClick={() => loadItemGuideIntoEditor(guide)} type="button">Edytuj</button>
                    <button
                      className="btn btn-secondary"
                      disabled={guideActionId === guide.id}
                      onClick={() =>
                        void runGuideAction(
                          guide.id,
                          async () => {
                            await apiFetch(`/admin/guides/${guide.id}`, { method: "DELETE" }, token);
                            if (itemGuideEditorId === String(guide.id)) {
                              resetItemGuideForm();
                            }
                          },
                          "Wskazówki zostały usunięte.",
                        )
                      }
                      type="button"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {section === "products" ? (
        <div className="split">
          <div className="dashboard-card panel-scroll">
            <h2>Produkty i Pakiety</h2>
            <p className="muted">Tutaj budujesz pojedyncze usługi i pakiety sprzedażowe używane przez popupy oraz zakładkę Pakiety u mentee.</p>
            <form className="stack" onSubmit={saveProduct}>
              <div className="grid-2">
                <div className="field">
                  <label>Tytuł</label>
                  <input value={productForm.title} onChange={(event) => setProductForm((current) => ({ ...current, title: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Slug</label>
                  <input value={productForm.slug} onChange={(event) => setProductForm((current) => ({ ...current, slug: event.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Typ produktu</label>
                  <select value={productForm.productType} onChange={(event) => setProductForm((current) => ({ ...current, productType: event.target.value }))}>
                    <option value="bundle">Pakiet</option>
                    <option value="guide_slot">Dodatkowy program</option>
                    <option value="hint_slot">Dodatkowe wskazówki</option>
                    <option value="email_inbox_access">Dostęp do maili uczelni</option>
                    <option value="mentor_access">Dostęp do mentora</option>
                    <option value="storage_boost">Więcej miejsca</option>
                  </select>
                </div>
                <div className="field">
                  <label>Czy to pakiet widoczny dla mentee</label>
                  <select value={String(productForm.isPackage)} onChange={(event) => setProductForm((current) => ({ ...current, isPackage: event.target.value === "true" }))}>
                    <option value="true">tak</option>
                    <option value="false">nie</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Krótki opis</label>
                <textarea value={productForm.summary} onChange={(event) => setProductForm((current) => ({ ...current, summary: event.target.value }))} />
              </div>
              <div className="field">
                <label>Opis</label>
                <textarea value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>URL zdjęcia</label>
                  <input value={productForm.imageUrl} onChange={(event) => setProductForm((current) => ({ ...current, imageUrl: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Waluta</label>
                  <input value={productForm.currency} onChange={(event) => setProductForm((current) => ({ ...current, currency: event.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Cena w groszach / centach</label>
                  <input min={0} type="number" value={productForm.priceCents} onChange={(event) => setProductForm((current) => ({ ...current, priceCents: Number(event.target.value) }))} />
                </div>
                <div className="field">
                  <label>Stripe Price ID</label>
                  <input value={productForm.stripePriceId} onChange={(event) => setProductForm((current) => ({ ...current, stripePriceId: event.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Stripe Product ID</label>
                  <input value={productForm.stripeProductId} onChange={(event) => setProductForm((current) => ({ ...current, stripeProductId: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Mentor powiązany z produktem</label>
                  <select value={productForm.mentorUserId} onChange={(event) => setProductForm((current) => ({ ...current, mentorUserId: event.target.value }))}>
                    <option value="">Brak</option>
                    {mentorUsers.map((mentor) => (
                      <option key={`product-mentor-${mentor.id}`} value={String(mentor.id)}>
                        {mentor.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>+ programy</label>
                  <input min={0} type="number" value={productForm.guideSlotDelta} onChange={(event) => setProductForm((current) => ({ ...current, guideSlotDelta: Number(event.target.value) }))} />
                </div>
                <div className="field">
                  <label>+ wskazówki</label>
                  <input min={0} type="number" value={productForm.hintSlotDelta} onChange={(event) => setProductForm((current) => ({ ...current, hintSlotDelta: Number(event.target.value) }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>+ miejsce na dysku (MB)</label>
                  <input min={0} type="number" value={productForm.storageMbDelta} onChange={(event) => setProductForm((current) => ({ ...current, storageMbDelta: Number(event.target.value) }))} />
                </div>
                <div className="field">
                  <label>Daje dostęp do maili uczelni</label>
                  <select value={String(productForm.enablesEmailInbox)} onChange={(event) => setProductForm((current) => ({ ...current, enablesEmailInbox: event.target.value === "true" }))}>
                    <option value="false">nie</option>
                    <option value="true">tak</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Produkty zawarte w pakiecie</label>
                <div className="selector-grid">
                  {products
                    .filter((product) => String(product.id) !== productEditorId)
                    .map((product) => {
                      const checked = productForm.includedProductIds.includes(String(product.id));
                      return (
                        <label className="selector-option" key={`product-include-${product.id}`}>
                          <input
                            checked={checked}
                            type="checkbox"
                            onChange={() =>
                              setProductForm((current) => ({
                                ...current,
                                includedProductIds: checked
                                  ? current.includedProductIds.filter((id) => id !== String(product.id))
                                  : [...current.includedProductIds, String(product.id)],
                              }))
                            }
                          />
                          <div className="selector-copy">
                            <strong>{product.title}</strong>
                            <span className="small muted">{product.productType}</span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
              <div className="field">
                <label>Aktywny</label>
                <select value={String(productForm.isActive)} onChange={(event) => setProductForm((current) => ({ ...current, isActive: event.target.value === "true" }))}>
                  <option value="true">tak</option>
                  <option value="false">nie</option>
                </select>
              </div>
              <div className="button-row">
                <button className="btn btn-primary">{productEditorId === "new" ? "Dodaj produkt" : "Zapisz produkt"}</button>
                <button className="btn btn-secondary" onClick={resetProductForm} type="button">Nowy produkt</button>
              </div>
            </form>
          </div>
          <div className="dashboard-card panel-scroll">
            <h2>Istniejące produkty</h2>
            <div className="list">
              {products.map((product) => (
                <div className="list-item" key={product.id}>
                  <header>
                    <div>
                      <h3>{product.title}</h3>
                      <div className="muted small">
                        {product.productType} • {(Number(product.priceCents ?? 0) / 100).toFixed(2)} {product.currency}
                      </div>
                    </div>
                    <span className="badge">{product.isActive ? "active" : "inactive"}</span>
                  </header>
                  <p className="muted">{product.summary}</p>
                  <div className="button-row">
                    <button className="btn btn-secondary" onClick={() => loadProductIntoEditor(product)} type="button">Edytuj</button>
                    <button className="btn btn-secondary" onClick={() => void syncProductToStripe(product.id)} type="button">Sync do Stripe</button>
                    <button className="btn btn-secondary" onClick={() => void deleteProduct(product.id)} type="button">Usuń</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {section === "purchase-popups" ? (
        <div className="dashboard-card">
          <h2>Popupy Zakupowe</h2>
          <p className="muted">Tutaj podłączasz popupy do produktów, możesz budować je ręcznie na bazie kafli, itemów, programów i mentorów, a także importować wiele popupów naraz przez JSON.</p>
          <div className="dashboard-card" style={{ marginTop: 18 }}>
            <h3 style={{ marginTop: 0 }}>Nowy popup z kreatora</h3>
            <div className="stack">
              <div className="grid-2">
                <div className="field">
                  <label>Typ akcji</label>
                  <select value={popupCreatorForm.actionType} onChange={(event) => setPopupCreatorForm((current) => ({ ...current, actionType: event.target.value }))}>
                    <option value="after_material_upload">Po uploadzie pliku</option>
                    <option value="after_material_check">Po oznaczeniu jako wykonane</option>
                    <option value="after_doc_tab_create">Po utworzeniu zakładki Essay Doc</option>
                    <option value="after_guide_add">Po dodaniu programu</option>
                    <option value="after_hint_add">Po dodaniu wskazówek</option>
                    <option value="mentor_locked">Kliknięcie Dodaj mentora</option>
                  </select>
                </div>
                <div className="field">
                  <label>Warunek niewyświetlania / wyświetlania</label>
                  <select value={popupCreatorForm.conditionType} onChange={(event) => setPopupCreatorForm((current) => ({ ...current, conditionType: event.target.value }))}>
                    <option value="none">Brak dodatkowego warunku</option>
                    <option value="guide_limit_reached">Pokaż tylko przy wyczerpanym limicie programów</option>
                    <option value="hint_limit_reached">Pokaż tylko przy wyczerpanym limicie wskazówek</option>
                    <option value="email_locked">Pokaż tylko bez dostępu do maili uczelni</option>
                    <option value="mentor_locked">Pokaż tylko bez dostępu do mentora</option>
                  </select>
                </div>
              </div>
              {["after_material_upload", "after_material_check", "after_doc_tab_create"].includes(popupCreatorForm.actionType) ? (
                <div className="grid-2">
                  <div className="field">
                    <label>Kafelek materiałów</label>
                    <select value={popupCreatorForm.templateId} onChange={(event) => setPopupCreatorForm((current) => ({ ...current, templateId: event.target.value, materialRowKey: "" }))}>
                      <option value="">Dowolny kafelek</option>
                      {materialTemplates.map((template: any) => (
                        <option key={`popup-template-${template.id}`} value={String(template.id)}>{template.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Item w kafelku</label>
                    <select value={popupCreatorForm.materialRowKey} onChange={(event) => setPopupCreatorForm((current) => ({ ...current, materialRowKey: event.target.value }))}>
                      <option value="">Dowolny item</option>
                      {((materialTemplates.find((template: any) => String(template.id) === popupCreatorForm.templateId)?.structure ?? []) as any[])
                        .filter((row: any) => row.level === "item" && row.displayKey)
                        .map((row: any) => (
                          <option key={`popup-row-${row.displayKey}`} value={row.displayKey}>{row.task || row.displayKey}</option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : null}
              {["after_guide_add", "after_hint_add"].includes(popupCreatorForm.actionType) ? (
                <div className="field">
                  <label>Program</label>
                  <select value={popupCreatorForm.guideId} onChange={(event) => setPopupCreatorForm((current) => ({ ...current, guideId: event.target.value }))}>
                    <option value="">Dowolny program</option>
                    {editableGuideTemplates.map((guide: any) => (
                      <option key={`popup-guide-${guide.id}`} value={String(guide.id)}>{guide.title}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              {popupCreatorForm.actionType === "mentor_locked" ? (
                <div className="field">
                  <label>Mentor</label>
                  <select value={popupCreatorForm.mentorUserId} onChange={(event) => setPopupCreatorForm((current) => ({ ...current, mentorUserId: event.target.value }))}>
                    <option value="">Domyślny popup dla mentorów</option>
                    {mentorUsers.map((mentor) => (
                      <option key={`popup-mentor-${mentor.id}`} value={String(mentor.id)}>{mentor.fullName}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="field">
                <label>Tytuł</label>
                <input value={popupCreatorForm.title} onChange={(event) => setPopupCreatorForm((current) => ({ ...current, title: event.target.value }))} />
              </div>
              <div className="field">
                <label>Treść</label>
                <textarea value={popupCreatorForm.body} onChange={(event) => setPopupCreatorForm((current) => ({ ...current, body: event.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Główny przycisk</label>
                  <input value={popupCreatorForm.primaryCtaLabel} onChange={(event) => setPopupCreatorForm((current) => ({ ...current, primaryCtaLabel: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Drugi przycisk</label>
                  <input value={popupCreatorForm.secondaryCtaLabel} onChange={(event) => setPopupCreatorForm((current) => ({ ...current, secondaryCtaLabel: event.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Produkty sugerowane</label>
                <div className="selector-grid">
                  {products.map((product) => {
                    const checked = popupCreatorForm.recommendedProductIds.includes(String(product.id));
                    return (
                      <label className="selector-option" key={`popup-builder-${product.id}`}>
                        <input
                          checked={checked}
                          type="checkbox"
                          onChange={() =>
                            setPopupCreatorForm((current) => ({
                              ...current,
                              recommendedProductIds: checked
                                ? current.recommendedProductIds.filter((id) => id !== String(product.id))
                                : [...current.recommendedProductIds, String(product.id)],
                            }))
                          }
                        />
                        <div className="selector-copy">
                          <strong>{product.title}</strong>
                          <span className="small muted">{product.productType}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="button-row">
                <button className="btn btn-primary" onClick={() => void createPopupFromBuilder()} type="button">Utwórz popup</button>
              </div>
            </div>
          </div>
          <div className="stack" style={{ marginTop: 18, marginBottom: 18 }}>
            <div className="field">
              <label>Import popupów z JSON</label>
              <textarea
                placeholder='{"popups":[{"key":"context:after_material_upload:template:24:row:item-1","title":"Sprawdź dokument z mentorem","body":"Po uploadzie możesz od razu dokupić konsultację.","primaryCtaLabel":"Kup konsultację","secondaryCtaLabel":"Zobacz pakiety","recommendedProductIds":[1],"isActive":true}]}'
                value={popupImportJson}
                onChange={(event) => setPopupImportJson(event.target.value)}
              />
            </div>
            <div className="button-row">
              <button className="btn btn-primary" onClick={() => void importPopupConfigs()} type="button">Importuj popupy</button>
            </div>
          </div>
          <div className="list">
            {popupConfigs.map((popup) => {
              const draft = popupDrafts[popup.key] ?? {
                body: "",
                isActive: true,
                primaryCtaLabel: "Kup sugerowany pakiet",
                recommendedProductIds: [],
                secondaryCtaLabel: "Zobacz pakiety",
                title: "",
              };
              return (
                <div className="list-item" key={popup.key}>
                  <header>
                    <div>
                      <h3>{popup.key}</h3>
                      <div className="muted small">
                        {popup.key.startsWith("context:")
                          ? "Popup kontekstowy wywoływany po określonej akcji"
                          : "Konfiguracja popupu zakupowego"}
                      </div>
                    </div>
                    <span className="badge">{draft.isActive ? "active" : "inactive"}</span>
                  </header>
                  <div className="stack" style={{ marginTop: 12 }}>
                    <div className="grid-2">
                      <div className="field">
                        <label>Typ kontekstu</label>
                        <input value={draft.contextType} onChange={(event) => setPopupDrafts((current) => ({ ...current, [popup.key]: { ...draft, contextType: event.target.value } }))} />
                      </div>
                      <div className="field">
                        <label>Aktywny</label>
                        <select value={String(draft.isActive)} onChange={(event) => setPopupDrafts((current) => ({ ...current, [popup.key]: { ...draft, isActive: event.target.value === "true" } }))}>
                          <option value="true">tak</option>
                          <option value="false">nie</option>
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <label>Tytuł</label>
                      <input value={draft.title} onChange={(event) => setPopupDrafts((current) => ({ ...current, [popup.key]: { ...draft, title: event.target.value } }))} />
                    </div>
                    <div className="field">
                      <label>Treść</label>
                      <textarea value={draft.body} onChange={(event) => setPopupDrafts((current) => ({ ...current, [popup.key]: { ...draft, body: event.target.value } }))} />
                    </div>
                    <div className="grid-2">
                      <div className="field">
                        <label>Główny przycisk</label>
                        <input value={draft.primaryCtaLabel} onChange={(event) => setPopupDrafts((current) => ({ ...current, [popup.key]: { ...draft, primaryCtaLabel: event.target.value } }))} />
                      </div>
                      <div className="field">
                        <label>Drugi przycisk</label>
                        <input value={draft.secondaryCtaLabel} onChange={(event) => setPopupDrafts((current) => ({ ...current, [popup.key]: { ...draft, secondaryCtaLabel: event.target.value } }))} />
                      </div>
                    </div>
                    <div className="field">
                      <label>Sugerowane produkty</label>
                      <div className="selector-grid">
                        {products.map((product) => {
                          const checked = draft.recommendedProductIds.includes(String(product.id));
                          return (
                            <label className="selector-option" key={`popup-${popup.key}-${product.id}`}>
                              <input
                                checked={checked}
                                type="checkbox"
                                onChange={() =>
                                  setPopupDrafts((current) => ({
                                    ...current,
                                    [popup.key]: {
                                      ...draft,
                                      recommendedProductIds: checked
                                        ? draft.recommendedProductIds.filter((id) => id !== String(product.id))
                                        : [...draft.recommendedProductIds, String(product.id)],
                                    },
                                  }))
                                }
                              />
                              <div className="selector-copy">
                                <strong>{product.title}</strong>
                                <span className="small muted">{product.productType}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="field">
                      <label>Dane kontekstu (JSON)</label>
                      <textarea value={draft.contextData} onChange={(event) => setPopupDrafts((current) => ({ ...current, [popup.key]: { ...draft, contextData: event.target.value } }))} />
                    </div>
                    <div className="field">
                      <label>Warunki wyświetlenia (JSON)</label>
                      <textarea value={draft.displayConditions} onChange={(event) => setPopupDrafts((current) => ({ ...current, [popup.key]: { ...draft, displayConditions: event.target.value } }))} />
                    </div>
                    <div className="button-row">
                      <button className="btn btn-primary" onClick={() => void savePopupConfig(popup.key)} type="button">Zapisz popup</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {section === "email-interpreter" ? (
        <div className="split">
          <div className="dashboard-card panel-scroll">
            <h2>Interpreter Maili</h2>
            <p className="muted">Tutaj edytujesz reguły NLP / regex używane do klasyfikowania maili z uczelni. Reguły są sprawdzane od góry według sortOrder.</p>
            <form className="stack" onSubmit={saveEmailClassifierRule}>
              <div className="grid-2">
                <div className="field">
                  <label>Nazwa reguły</label>
                  <input value={emailRuleForm.name} onChange={(event) => setEmailRuleForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Sort order</label>
                  <input min={0} type="number" value={emailRuleForm.sortOrder} onChange={(event) => setEmailRuleForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
                </div>
              </div>
              <div className="field">
                <label>Pattern regex</label>
                <textarea value={emailRuleForm.pattern} onChange={(event) => setEmailRuleForm((current) => ({ ...current, pattern: event.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Pole dopasowania</label>
                  <select value={emailRuleForm.matchField} onChange={(event) => setEmailRuleForm((current) => ({ ...current, matchField: event.target.value }))}>
                    <option value="subject_and_snippet">Temat + snippet</option>
                    <option value="subject">Temat</option>
                    <option value="snippet">Snippet</option>
                    <option value="from_email">Adres nadawcy</option>
                  </select>
                </div>
                <div className="field">
                  <label>Klasyfikacja</label>
                  <input value={emailRuleForm.classification} onChange={(event) => setEmailRuleForm((current) => ({ ...current, classification: event.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Podsumowanie dla mentee</label>
                <textarea value={emailRuleForm.actionSummary} onChange={(event) => setEmailRuleForm((current) => ({ ...current, actionSummary: event.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Wymaga działania</label>
                  <select value={String(emailRuleForm.actionRequired)} onChange={(event) => setEmailRuleForm((current) => ({ ...current, actionRequired: event.target.value === "true" }))}>
                    <option value="false">nie</option>
                    <option value="true">tak</option>
                  </select>
                </div>
                <div className="field">
                  <label>Wymaga manual review</label>
                  <select value={String(emailRuleForm.requiresManualReview)} onChange={(event) => setEmailRuleForm((current) => ({ ...current, requiresManualReview: event.target.value === "true" }))}>
                    <option value="false">nie</option>
                    <option value="true">tak</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Aktywna</label>
                <select value={String(emailRuleForm.isActive)} onChange={(event) => setEmailRuleForm((current) => ({ ...current, isActive: event.target.value === "true" }))}>
                  <option value="true">tak</option>
                  <option value="false">nie</option>
                </select>
              </div>
              <div className="button-row">
                <button className="btn btn-primary">{emailRuleEditorId === "new" ? "Dodaj regułę" : "Zapisz regułę"}</button>
                <button className="btn btn-secondary" onClick={resetEmailRuleForm} type="button">Nowa reguła</button>
              </div>
            </form>
            <div className="field" style={{ marginTop: 18 }}>
              <label>Import reguł z JSON</label>
              <textarea value={emailRuleImportJson} onChange={(event) => setEmailRuleImportJson(event.target.value)} placeholder='{"rules":[{"name":"Portal access","pattern":"osiris|sis|olaf","matchField":"subject_and_snippet","classification":"portal_access","actionRequired":true,"actionSummary":"Wiadomość wygląda na dostęp do portalu.","requiresManualReview":false,"sortOrder":10,"isActive":true}]}' />
            </div>
            <div className="button-row" style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={() => void importEmailClassifierRules()} type="button">Importuj reguły</button>
            </div>
          </div>
          <div className="dashboard-card panel-scroll">
            <h2>Istniejące reguły</h2>
            <div className="list">
              {emailClassifierRules.map((rule) => (
                <div className="list-item" key={rule.id}>
                  <header>
                    <div>
                      <h3>{rule.name}</h3>
                      <div className="muted small">{rule.classification} • {rule.matchField} • sort {rule.sortOrder}</div>
                    </div>
                    <span className="badge">{rule.isActive ? "active" : "inactive"}</span>
                  </header>
                  <div className="small muted">{rule.pattern}</div>
                  <p className="muted">{rule.actionSummary}</p>
                  <div className="button-row">
                    <button className="btn btn-secondary" onClick={() => loadEmailRuleIntoEditor(rule)} type="button">Edytuj</button>
                    <button className="btn btn-secondary" onClick={() => void deleteEmailClassifierRule(rule.id)} type="button">Usuń</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {section === "meetings" ? (
        <div className="dashboard-card">
          <h2>Wszystkie spotkania</h2>
          <p className="muted">Tutaj widzisz wszystkie spotkania w systemie. Usunięcie z tego miejsca kasuje rekord całkowicie z bazy.</p>
          <div className="button-row" style={{ marginTop: 16 }}>
            {([
              ["all", "Wszystkie"],
              ["upcoming", "Nadchodzące"],
              ["past", "Po czasie"],
              ["cancelled", "Anulowane"],
            ] as const).map(([value, label]) => (
              <button
                className={adminMeetingFilter === value ? "btn btn-primary" : "btn btn-secondary"}
                key={value}
                onClick={() => setAdminMeetingFilter(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="list" style={{ marginTop: 18 }}>
            {filteredAdminMeetings.map((meeting) => (
              <div className="list-item" key={meeting.id}>
                <header>
                  <div>
                    <h3>{meeting.title}</h3>
                    <div className="muted small">
                      Mentor: {meeting.mentorName || "brak"} • Mentee: {meeting.menteeName || "brak"}
                    </div>
                    <div className="muted small">
                      {formatMeetingDateRange(meeting, meeting.timezone || "Europe/Warsaw")}
                    </div>
                  </div>
                  <span className="badge">{formatMeetingStatusLabel(meeting.status)}</span>
                </header>
                {meeting.description ? <p className="muted">{meeting.description}</p> : null}
                <div className="button-row" style={{ marginTop: 12 }}>
                  {meeting.meetingUrl ? (
                    <a className="btn btn-secondary" href={meeting.meetingUrl} target="_blank" rel="noreferrer">
                      Otwórz spotkanie
                    </a>
                  ) : null}
                  <button
                    className="btn btn-secondary"
                    disabled={meetingDeletingId === meeting.id}
                    onClick={() => void deleteAdminMeeting(meeting.id)}
                    type="button"
                  >
                    Usuń z bazy
                  </button>
                </div>
                {meeting.meetingContactValue ? (
                  <div className="small muted" style={{ marginTop: 8, wordBreak: "break-all" }}>
                    {meeting.meetingContactValue}
                  </div>
                ) : null}
                {meeting.status === "cancelled" ? (
                  <div className="small muted" style={{ marginTop: 8 }}>
                    Anulował: {meeting.cancelledByRole || "nieznany"} • {meeting.cancelledMinutesBeforeStart ?? 0} min przed startem
                  </div>
                ) : null}
                {meeting.isSuspicious ? (
                  <div className="status" style={{ marginTop: 12 }}>
                    Rozbieżność: mentor i mentee inaczej oznaczyli, czy spotkanie się odbyło.
                  </div>
                ) : null}
              </div>
            ))}
            {!filteredAdminMeetings.length ? <div className="status">Brak spotkań w tej kategorii.</div> : null}
          </div>
        </div>
      ) : null}
      {section === "leads" ? (
        <div className="dashboard-card">
          <h2>Leady i formularze</h2>
          <div className="button-row" style={{ marginBottom: 16 }}>
            {(["contact", "mentor", "scholarship", "newsletter", "booking"] as LeadKind[]).map((value) => (
              <button className="btn btn-secondary" key={value} onClick={() => setLeadType(value)} type="button">
                {value} ({leadCounts[value]})
              </button>
            ))}
          </div>
          {!leads.length ? (
            <div className="list-item">
              <h3 style={{ marginTop: 0 }}>Brak rekordów</h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                Obecnie nie ma jeszcze żadnych leadów dla kategorii <strong>{leadType}</strong>.
              </p>
            </div>
          ) : null}
          <div className="list">
            {leads.map((lead, index) => (
              <div className="list-item" key={lead.id ?? index}>
                {(() => {
                  const summary = renderLeadSummary(leadType, lead);
                  return (
                    <>
                      <header>
                        <div>
                          <h3>{summary.title}</h3>
                          <div className="muted small">{summary.meta}</div>
                        </div>
                        <div className="button-row" style={{ justifyContent: "flex-end" }}>
                          <span className="badge">{formatDate(typeof lead.createdAt === "string" ? lead.createdAt : null)}</span>
                          {typeof lead.id === "number" ? (
                            <button
                              className="btn btn-secondary"
                              disabled={leadDeletingId === lead.id}
                              onClick={() => void deleteLead(lead.id)}
                              type="button"
                            >
                              Usuń
                            </button>
                          ) : null}
                        </div>
                      </header>
                      <p className="muted">{summary.body}</p>
                      <details className="small">
                        <summary>Zobacz pełny rekord</summary>
                        <pre style={{ margin: "10px 0 0", whiteSpace: "pre-wrap" }}>{JSON.stringify(lead, null, 2)}</pre>
                      </details>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function MentorSection({
  section,
  token,
  session,
}: {
  section: string;
  session: SessionPayload;
  token: string;
}) {
  const [googleConnections, setGoogleConnections] = useState<any[]>(
    session.googleConnections ?? [],
  );
  const [profile, setProfile] = useState<any>({
    availabilityOverrides: [],
    bio: "",
    bookingWindowDays: 30,
    googleDriveFolderUrl: "",
    headline: "",
    meetingLink: "",
    meetingMethod: "zoom_link",
    minimumNoticeHours: 24,
    rescheduleNoticeHours: 24,
    timezone: "Europe/Warsaw",
    whatsappNumber: "",
    ...(session.mentorProfile ?? {}),
  });
  const [availability, setAvailability] = useState([
    { weekday: 0, startTime: "09:00", endTime: "18:00", isActive: true },
    { weekday: 1, startTime: "09:00", endTime: "18:00", isActive: true },
    { weekday: 2, startTime: "09:00", endTime: "18:00", isActive: true },
    { weekday: 3, startTime: "09:00", endTime: "18:00", isActive: true },
    { weekday: 4, startTime: "09:00", endTime: "18:00", isActive: true },
    { weekday: 5, startTime: "09:00", endTime: "18:00", isActive: true },
    { weekday: 6, startTime: "09:00", endTime: "18:00", isActive: true },
  ]);
  const [availabilityOverrides, setAvailabilityOverrides] = useState<
    Array<{
      date: string;
      isBlocked?: boolean;
      ranges?: Array<{ startTime: string; endTime: string; isActive?: boolean }>;
    }>
  >([]);
  const [availabilityMonth, setAvailabilityMonth] = useState(() =>
    formatMonthKey(new Date(), "Europe/Warsaw"),
  );
  const [selectedOverrideDate, setSelectedOverrideDate] = useState<string | null>(null);
  const [universities, setUniversities] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [sourceGuides, setSourceGuides] = useState<any[]>([]);
  const [mentorMaterialTemplates, setMentorMaterialTemplates] = useState<any[]>([]);
  const [mentorItemGuides, setMentorItemGuides] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [meetingActionId, setMeetingActionId] = useState<string | null>(null);
  const [meetingNoteDrafts, setMeetingNoteDrafts] = useState<Record<number, string>>({});
  const [mentorMeetingFilter, setMentorMeetingFilter] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [editingUniversityId, setEditingUniversityId] = useState<number | null>(null);
  const [universityForm, setUniversityForm] = useState({ country: "", universityName: "", programName: "", summary: "" });
  const [guideForm, setGuideForm] = useState({
    guideType: "mentor_blueprint",
    status: "draft",
    sourceGuideId: "",
    title: "",
    summary: "",
    descriptionMarkdown: "",
  });
  const [mentorMaterialEditorId, setMentorMaterialEditorId] = useState<string>("");
  const [mentorMaterialRows, setMentorMaterialRows] = useState<MaterialRowEditor[]>([]);
  const dedupedSourceGuides = useMemo(() => sourceGuides, [sourceGuides]);
  const selectedMentorMaterialTemplate = useMemo(
    () => mentorMaterialTemplates.find((template) => String(template.id) === mentorMaterialEditorId) ?? null,
    [mentorMaterialEditorId, mentorMaterialTemplates],
  );
  const mentorHintScopeGuides = useMemo(() => {
    const byId = new Map<string, any>();
    [...dedupedSourceGuides, ...guides].forEach((guide) => {
      byId.set(String(guide.id), guide);
    });
    return Array.from(byId.values());
  }, [dedupedSourceGuides, guides]);
  const mentorMaterialDisplayRows = useMemo(() => {
    if (!selectedMentorMaterialTemplate) {
      return [] as MaterialRowEditor[];
    }

    const templateRows = Array.isArray(selectedMentorMaterialTemplate.structure) ? selectedMentorMaterialTemplate.structure : [];
    const adminRows = templateRows
      .filter((row: any) => Number(row?.ownerUserId ?? 0) !== Number(session.user.id))
      .map((row: any, index: number) => ({
        alternativeOptions: Array.isArray(row.alternativeOptions) ? row.alternativeOptions.filter(Boolean) : [],
        anchorAfterKey: "",
        appliesToGuideIds: Array.isArray(row.appliesToGuideIds) ? row.appliesToGuideIds.map((id: any) => String(id)) : [],
        country: row.country ?? "",
        displayKey: `admin:${index}`,
        guideId: row.guideId ? String(row.guideId) : "",
        level: row.level === "country" || row.level === "university" || row.level === "item" ? row.level : "item",
        ownerUserId: row.ownerUserId ?? null,
        readOnly: true,
        task: row.task ?? "",
        university: row.university ?? "",
      }));

    const mentorRows = mentorMaterialRows.map((row, index) => ({
      ...row,
      displayKey: row.displayKey || `mentor:${index}`,
      ownerUserId: session.user.id,
      readOnly: false,
    }));

    const rowsByAnchor = new Map<string, MaterialRowEditor[]>();
    for (const row of mentorRows) {
      const anchor = row.anchorAfterKey ?? "";
      const current = rowsByAnchor.get(anchor) ?? [];
      current.push(row);
      rowsByAnchor.set(anchor, current);
    }

    const merged: MaterialRowEditor[] = [...(rowsByAnchor.get("") ?? [])];
    for (const adminRow of adminRows) {
      merged.push(adminRow);
      merged.push(...(rowsByAnchor.get(adminRow.displayKey ?? "") ?? []));
    }
    return merged;
  }, [mentorMaterialRows, selectedMentorMaterialTemplate, session.user.id]);

  async function loadMentorProfileContext() {
    const payload = await apiFetch<any>("/mentor/profile", undefined, token);
    setProfile({
      availabilityOverrides: [],
      bio: "",
      bookingWindowDays: 30,
      headline: "",
      meetingLink: "",
      meetingMethod: "zoom_link",
      minimumNoticeHours: 24,
      rescheduleNoticeHours: 24,
      timezone: "Europe/Warsaw",
      whatsappNumber: "",
      ...(payload.profile ?? {}),
    });
    setAvailabilityOverrides(payload.profile?.availabilityOverrides ?? []);
    setUniversities(payload.universities ?? []);
    setAvailability((current) =>
      payload.availability?.length ? payload.availability : current,
    );
    setGoogleConnections(payload.googleConnections ?? []);
  }

  async function refreshMentorMeetings() {
    const payload = await apiFetch<any[]>("/mentor/meetings", undefined, token);
    setMeetings(payload);
    setMeetingNoteDrafts(
      Object.fromEntries(
        payload.map((meeting: any) => [meeting.id, String(meeting.mentorNotes ?? "")]),
      ),
    );
  }

  const calendarConnection = googleConnections.find(
    (connection) => connection.connectionType === "calendar",
  );
  const mentorTimezone = profile.timezone || "Europe/Warsaw";
  const mentorTodayKey = useMemo(
    () => formatSlotDayKey(new Date().toISOString(), mentorTimezone),
    [mentorTimezone],
  );
  const overrideCountByDate = useMemo(
    () =>
      availabilityOverrides.reduce<Record<string, number>>((accumulator, entry) => {
        accumulator[entry.date] =
          entry.isBlocked
            ? 1
            : (entry.ranges ?? []).filter((range) => range.isActive !== false).length;
        return accumulator;
      }, {}),
    [availabilityOverrides],
  );
  const availabilityMonthCells = useMemo(
    () => buildMonthCalendar(availabilityMonth, mentorTimezone, overrideCountByDate),
    [availabilityMonth, mentorTimezone, overrideCountByDate],
  );
  const selectedOverride = useMemo(
    () =>
      availabilityOverrides.find((entry) => entry.date === selectedOverrideDate) ?? {
        date: selectedOverrideDate ?? "",
        isBlocked: false,
        ranges: [{ startTime: "09:00", endTime: "18:00", isActive: true }],
      },
    [availabilityOverrides, selectedOverrideDate],
  );
  const filteredMentorMeetings = meetings.filter((meeting) => getMeetingCategory(meeting) === mentorMeetingFilter);

  useEffect(() => {
    if (section === "profile" || section === "availability") {
      void loadMentorProfileContext().catch((error) => setStatus(error.message));
    }
    if (section === "guides") {
      void Promise.all([
        apiFetch<any[]>("/mentor/guides", undefined, token).then(setGuides),
        apiFetch<any[]>("/mentor/source-guides", undefined, token).then(setSourceGuides),
      ]).catch((error) => setStatus(error.message));
    }
    if (section === "materials") {
      void Promise.all([
        apiFetch<any[]>("/mentor/guides", undefined, token).then(setGuides),
        apiFetch<any>("/mentor/material-templates", undefined, token).then((payload) => {
          setMentorMaterialTemplates(payload.templates ?? []);
        }),
        apiFetch<any[]>("/mentor/item-guides", undefined, token).then(setMentorItemGuides),
      ]).catch((error) => setStatus(error.message));
    }
    if (section === "meetings") {
      void refreshMentorMeetings().catch((error) => setStatus(error.message));
    }
  }, [section, token]);

  useEffect(() => {
    setAvailabilityMonth(formatMonthKey(new Date(), mentorTimezone));
  }, [mentorTimezone]);

  useEffect(() => {
    const monthDayKeys = availabilityMonthCells
      .filter((entry): entry is Extract<(typeof availabilityMonthCells)[number], { kind: "day" }> => entry.kind === "day")
      .filter((entry) => entry.dateKey >= mentorTodayKey)
      .map((entry) => entry.dateKey);
    if (!monthDayKeys.length) {
      return;
    }
    if (!selectedOverrideDate || !monthDayKeys.includes(selectedOverrideDate)) {
      setSelectedOverrideDate(monthDayKeys[0]);
    }
  }, [availabilityMonthCells, mentorTodayKey, selectedOverrideDate]);

  useEffect(() => {
    if (section !== "profile" && section !== "availability") {
      return undefined;
    }

    const handleFocus = () => {
      void loadMentorProfileContext().catch((error) => setStatus(error.message));
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [section, token]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    try {
      await apiFetch("/mentor/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...profile,
          meetingMethod: profile.meetingMethod || "zoom_link",
          meetingLink: profile.meetingMethod === "whatsapp" || profile.meetingMethod === "google_meet" ? "" : (profile.meetingLink || ""),
          timezone: profile.timezone || "Europe/Warsaw",
          whatsappNumber: profile.meetingMethod === "whatsapp" ? (profile.whatsappNumber || "") : "",
        }),
      }, token);
      setStatus("Profil mentora zapisany.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać profilu.");
    }
  }

  async function saveAvailability() {
    setStatus("");
    try {
      await apiFetch("/mentor/availability", {
        method: "PUT",
        body: JSON.stringify({
          rules: availability,
          overrides: availabilityOverrides,
          bookingWindowDays: Number(profile.bookingWindowDays ?? 30),
          minimumNoticeHours: Number(profile.minimumNoticeHours ?? 24),
          rescheduleNoticeHours: Number(profile.rescheduleNoticeHours ?? 24),
        }),
      }, token);
      setStatus("Dostępność została zapisana.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać dostępności.");
    }
  }

  function updateDayRules(
    weekday: number,
    updater: (rules: Array<{ weekday: number; startTime: string; endTime: string; isActive: boolean }>) => Array<{
      weekday: number;
      startTime: string;
      endTime: string;
      isActive: boolean;
    }>,
  ) {
    setAvailability((current) => {
      const dayRules = current.filter((entry) => entry.weekday === weekday);
      const otherRules = current.filter((entry) => entry.weekday !== weekday);
      return [...otherRules, ...updater(dayRules)].sort((left, right) =>
        left.weekday === right.weekday
          ? left.startTime.localeCompare(right.startTime)
          : left.weekday - right.weekday,
      );
    });
  }

  function updateOverride(
    date: string,
    updater: (entry: {
      date: string;
      isBlocked?: boolean;
      ranges?: Array<{ startTime: string; endTime: string; isActive?: boolean }>;
    }) => {
      date: string;
      isBlocked?: boolean;
      ranges?: Array<{ startTime: string; endTime: string; isActive?: boolean }>;
    },
  ) {
    setAvailabilityOverrides((current) => {
      const existing =
        current.find((entry) => entry.date === date) ?? {
          date,
          isBlocked: false,
          ranges: [{ startTime: "09:00", endTime: "18:00", isActive: true }],
        };
      const updated = updater(existing);
      const rest = current.filter((entry) => entry.date !== date);
      const hasActiveRanges = (updated.ranges ?? []).some((range) => range.isActive !== false);
      if (!updated.isBlocked && !hasActiveRanges) {
        return rest.sort((left, right) => left.date.localeCompare(right.date));
      }
      return [...rest, updated].sort((left, right) => left.date.localeCompare(right.date));
    });
  }

  async function connectGoogleCalendar() {
    setStatus("");
    try {
      const payload = await apiFetch<{ authUrl: string }>(
        "/mentor/google-connections/calendar/start",
        {
          method: "POST",
        },
        token,
      );
      window.open(payload.authUrl, "_blank", "noopener,noreferrer");
      setStatus(
        "Otworzyliśmy Google OAuth w nowej karcie. Po zakończeniu wróć tutaj, a panel odświeży status połączenia.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Nie udało się rozpocząć łączenia Google Calendar.",
      );
    }
  }

  async function disconnectGoogleCalendar() {
    setStatus("");
    try {
      await apiFetch("/mentor/google-connections/calendar", { method: "DELETE" }, token);
      await loadMentorProfileContext();
      setStatus("Połączenie Google Calendar zostało odłączone.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Nie udało się odłączyć Google Calendar.",
      );
    }
  }

  async function cancelMentorMeeting(meetingId: number) {
    setMeetingActionId(`${meetingId}:cancel`);
    setStatus("");
    try {
      await apiFetch(`/mentor/meetings/${meetingId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "" }),
      }, token);
      await refreshMentorMeetings();
      setStatus("Spotkanie zostało anulowane.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się anulować spotkania.");
    } finally {
      setMeetingActionId(null);
    }
  }

  async function markMentorMeetingOccurred(meetingId: number, occurred: boolean) {
    setMeetingActionId(`${meetingId}:occurred:${occurred ? "yes" : "no"}`);
    setStatus("");
    try {
      await apiFetch(`/mentor/meetings/${meetingId}/occurred`, {
        method: "PATCH",
        body: JSON.stringify({ occurred }),
      }, token);
      await refreshMentorMeetings();
      setStatus(occurred ? "Oznaczono, że spotkanie się odbyło." : "Oznaczono, że spotkanie się nie odbyło.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać statusu spotkania.");
    } finally {
      setMeetingActionId(null);
    }
  }

  async function saveMentorMeetingNotes(meetingId: number, mentorNotes: string) {
    setMeetingActionId(`${meetingId}:notes`);
    setStatus("");
    try {
      await apiFetch(`/mentor/meetings/${meetingId}`, {
        method: "PATCH",
        body: JSON.stringify({ mentorNotes }),
      }, token);
      await refreshMentorMeetings();
      setStatus("Notatki do spotkania zostały zapisane.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać notatek.");
    } finally {
      setMeetingActionId(null);
    }
  }

  async function addUniversity(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    try {
      const payload = {
        country: universityForm.country,
        universityName: universityForm.universityName,
        programName: universityForm.programName,
        summary: universityForm.summary,
      };
      const created = await apiFetch<any>(editingUniversityId ? `/mentor/universities/${editingUniversityId}` : "/mentor/universities", {
        method: editingUniversityId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }, token);
      setUniversities((current) =>
        editingUniversityId
          ? current.map((entry) => (entry.id === editingUniversityId ? created : entry))
          : [...current, created],
      );
      setUniversityForm({ country: "", universityName: "", programName: "", summary: "" });
      setEditingUniversityId(null);
      setStatus(editingUniversityId ? "Wpis uczelni został zaktualizowany." : "Dodano uczelnię do profilu.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać wpisu uczelni.");
    }
  }

  async function deleteUniversity(id: number) {
    setStatus("");
    try {
      await apiFetch(`/mentor/universities/${id}`, { method: "DELETE" }, token);
      setUniversities((current) => current.filter((entry) => entry.id !== id));
      if (editingUniversityId === id) {
        setEditingUniversityId(null);
        setUniversityForm({ country: "", universityName: "", programName: "", summary: "" });
      }
      setStatus("Wpis uczelni został usunięty.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się usunąć wpisu uczelni.");
    }
  }

  function editUniversity(university: any) {
    setEditingUniversityId(university.id);
    setUniversityForm({
      country: university.country ?? "",
      universityName: university.universityName ?? "",
      programName: university.programName ?? "",
      summary: university.summary ?? "",
    });
  }

  async function createGuide(event: React.FormEvent) {
    event.preventDefault();
    const sourceGuide = dedupedSourceGuides.find((guide) => String(guide.id) === guideForm.sourceGuideId);
    if (!sourceGuide) {
      setStatus("Wybierz bazową uczelnię dla tego case'u mentora.");
      return;
    }
    const computedSlug = normalizePlatformSlug(`${sourceGuide.slug ?? sourceGuide.universityName}-${guideForm.title}`);

    try {
      const created = await apiFetch<any>("/mentor/guides", {
        method: "POST",
        body: JSON.stringify({
          guideType: "mentor_blueprint",
          status: guideForm.status,
          title: guideForm.title,
          slug: computedSlug,
          country: sourceGuide.country,
          universityName: sourceGuide.universityName,
          summary: guideForm.summary,
          descriptionMarkdown: guideForm.descriptionMarkdown,
          estimatedReadMin: 8,
          sourceGuideId: Number(guideForm.sourceGuideId),
          menteeUserId: null,
          driveFolderUrl: "",
          isVisibleToUnapprovedUsers: false,
          items: [],
        }),
      }, token);
      setGuides((current) => [created, ...current]);
      setGuideForm({
        guideType: "mentor_blueprint",
        status: "draft",
        sourceGuideId: "",
        title: "",
        summary: "",
        descriptionMarkdown: "",
      });
      setStatus("Case mentora został utworzony.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się utworzyć przewodnika.");
    }
  }

  function loadMentorMaterialTemplate(template: any) {
    setMentorMaterialEditorId(String(template.id));
    const templateRows = Array.isArray(template.structure) ? template.structure : [];
    let lastAdminKey = "";
    let adminIndex = -1;
    setMentorMaterialRows(
      templateRows
        .map((row: any) => {
          const isMentorRow = Number(row.ownerUserId ?? 0) === Number(session.user.id);
          if (!isMentorRow) {
            adminIndex += 1;
            lastAdminKey = `admin:${adminIndex}`;
            return null;
          }
          return {
            actionType: row.actionType ?? "check_only",
            alternativeOptions: Array.isArray(row.alternativeOptions) ? row.alternativeOptions.filter(Boolean) : [],
            anchorAfterKey: typeof row.anchorAfterKey === "string" ? row.anchorAfterKey : lastAdminKey,
            appliesToGuideIds: Array.isArray(row.appliesToGuideIds) ? row.appliesToGuideIds.map((id: any) => String(id)) : [],
            country: row.country ?? "",
            displayKey: typeof row.displayKey === "string" && row.displayKey ? row.displayKey : createEditorRowKey("mentor"),
            docSeedMode: row.sourceDocumentId && row.sourceTabId ? "source_tab" : "plain_text",
            docTabPrompt: row.docTabPrompt ?? "",
            docTabTitle: row.docTabTitle ?? "",
            guideId: row.guideId ? String(row.guideId) : "",
            level: row.level === "country" || row.level === "university" || row.level === "item" ? row.level : "item",
            ownerUserId: row.ownerUserId ?? session.user.id,
            readOnly: false,
            sourceDocumentId: row.sourceDocumentId ?? "",
            sourceTabId: row.sourceTabId ?? "",
            suggestedFilename: row.suggestedFilename ?? "",
            task: row.task ?? "",
            university: row.university ?? "",
          } satisfies MaterialRowEditor;
        })
        .filter(Boolean)
        .map((row: any) => ({
          ...row,
        })),
    );
  }

  async function saveMentorMaterialRows() {
    if (!mentorMaterialEditorId) {
      setStatus("Wybierz najpierw kafel materiałów.");
      return;
    }
    setStatus("");
    try {
      await apiFetch(`/mentor/material-templates/${mentorMaterialEditorId}/rows`, {
        method: "PUT",
        body: JSON.stringify({ rows: mentorMaterialRows }),
      }, token);
      const [templatePayload, itemGuidesPayload] = await Promise.all([
        apiFetch<any>("/mentor/material-templates", undefined, token),
        apiFetch<any[]>("/mentor/item-guides", undefined, token),
      ]);
      setMentorMaterialTemplates(templatePayload.templates ?? []);
      setMentorItemGuides(itemGuidesPayload ?? []);
      setStatus("Twoje wiersze w kaflu materiałów zostały zapisane.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać wierszy materiałów.");
    }
  }

  function addMentorRowAtAnchor(anchorAfterKey: string) {
    setMentorMaterialRows((current) => [
      ...current,
      {
        ...createEmptyMaterialRow(),
        anchorAfterKey,
      },
    ]);
  }

  function updateMentorRow(index: number, updater: (row: MaterialRowEditor) => MaterialRowEditor) {
    setMentorMaterialRows((current) => current.map((row, rowIndex) => (rowIndex === index ? updater(row) : row)));
  }

  function rebuildMentorRowsFromDisplay(rows: MaterialRowEditor[]) {
    let lastAdminKey = "";
    const rebuilt: MaterialRowEditor[] = [];
    for (const row of rows) {
      if (row.readOnly) {
        lastAdminKey = row.displayKey ?? lastAdminKey;
        continue;
      }
      rebuilt.push({
        ...row,
        anchorAfterKey: lastAdminKey,
        displayKey: row.displayKey || createEditorRowKey("mentor"),
        ownerUserId: session.user.id,
        readOnly: false,
      });
    }
    return rebuilt;
  }

  function moveMentorRow(displayKey: string, direction: -1 | 1) {
    const index = mentorMaterialDisplayRows.findIndex((row) => row.displayKey === displayKey);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= mentorMaterialDisplayRows.length) {
      return;
    }
    const nextRows = [...mentorMaterialDisplayRows];
    const [moved] = nextRows.splice(index, 1);
    nextRows.splice(targetIndex, 0, moved);
    setMentorMaterialRows(rebuildMentorRowsFromDisplay(nextRows));
  }

  function removeMentorRow(displayKey: string) {
    const nextRows = mentorMaterialDisplayRows.filter((row) => row.displayKey !== displayKey);
    setMentorMaterialRows(rebuildMentorRowsFromDisplay(nextRows));
  }

  return (
    <>
      <FloatingStatus message={status} />
      {section === "overview" ? (
        <div className="dashboard-card">
          <h2>Mentor dashboard</h2>
          <p className="muted">Tutaj zarządzasz profilem, przewodnikami, dostępnością i spotkaniami.</p>
          <div className="tile-grid" style={{ marginTop: 18 }}>
            <div className="tile">
              <div className="small muted">Połączenia Google</div>
              <strong>{session.googleConnections.length}</strong>
            </div>
            <div className="tile">
              <div className="small muted">Domyślny czas spotkania</div>
              <strong>30 min</strong>
            </div>
          </div>
        </div>
      ) : null}
      {section === "profile" ? (
        <div className="split">
          <div className="dashboard-card">
            <h2>Profil mentora</h2>
            <form className="stack" onSubmit={saveProfile}>
              <div className="field">
                <label>Headline</label>
                <input value={profile.headline ?? ""} onChange={(event) => setProfile((current: any) => ({ ...current, headline: event.target.value }))} />
              </div>
              <div className="field">
                <label>Bio</label>
                <textarea value={profile.bio ?? ""} onChange={(event) => setProfile((current: any) => ({ ...current, bio: event.target.value }))} />
              </div>
              <div className="grid-2">
                <TimezoneSelect
                  label="Strefa czasowa"
                  value={profile.timezone ?? "Europe/Warsaw"}
                  onChange={(value) => setProfile((current: any) => ({ ...current, timezone: value }))}
                />
                <div className="field">
                  <label>Metoda spotkań</label>
                  <select value={profile.meetingMethod ?? "zoom_link"} onChange={(event) => setProfile((current: any) => ({ ...current, meetingMethod: event.target.value }))}>
                    <option value="zoom_link">Stały link Zoom</option>
                    <option value="teams_link">Stały link Teams</option>
                    <option value="google_meet">Auto Google Meet</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="custom">Inna metoda</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>{profile.meetingMethod === "whatsapp" ? "Numer WhatsApp" : "Link spotkań"}</label>
                {profile.meetingMethod === "google_meet" ? (
                  <div className="small muted">Przy metodzie Auto Google Meet link będzie tworzony automatycznie po podpięciu Google OAuth.</div>
                ) : (
                  <input
                    value={profile.meetingMethod === "whatsapp" ? (profile.whatsappNumber ?? "") : (profile.meetingLink ?? "")}
                    onChange={(event) =>
                      setProfile((current: any) => ({
                        ...current,
                        meetingLink: current.meetingMethod === "whatsapp" ? (current.meetingLink ?? "") : event.target.value,
                        whatsappNumber: current.meetingMethod === "whatsapp" ? event.target.value : (current.whatsappNumber ?? ""),
                      }))
                    }
                  />
                )}
              </div>
              <button className="btn btn-primary">Zapisz profil</button>
            </form>
          </div>
          <div className="dashboard-card">
            <h2>Uczelnie i programy</h2>
            <form className="stack" onSubmit={addUniversity}>
              <div className="field">
                <label>Kraj</label>
                <input value={universityForm.country} onChange={(event) => setUniversityForm((current) => ({ ...current, country: event.target.value }))} />
              </div>
              <div className="field">
                <label>Uczelnia</label>
                <input value={universityForm.universityName} onChange={(event) => setUniversityForm((current) => ({ ...current, universityName: event.target.value }))} />
              </div>
              <div className="field">
                <label>Program</label>
                <input value={universityForm.programName} onChange={(event) => setUniversityForm((current) => ({ ...current, programName: event.target.value }))} />
              </div>
              <div className="field">
                <label>Krótki opis</label>
                <textarea value={universityForm.summary} onChange={(event) => setUniversityForm((current) => ({ ...current, summary: event.target.value }))} />
              </div>
              <div className="button-row">
                <button className="btn btn-primary">{editingUniversityId ? "Zapisz zmiany" : "Dodaj wpis"}</button>
                {editingUniversityId ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditingUniversityId(null);
                      setUniversityForm({ country: "", universityName: "", programName: "", summary: "" });
                    }}
                    type="button"
                  >
                    Anuluj edycję
                  </button>
                ) : null}
              </div>
            </form>
            <div className="list" style={{ marginTop: 18 }}>
              {universities.map((university) => (
                <div className="list-item" key={university.id}>
                  <header>
                    <div>
                      <h3>{university.universityName}</h3>
                      <div className="muted small">
                        {university.country}
                        {university.programName ? ` • ${university.programName}` : ""}
                      </div>
                    </div>
                    <div className="button-row">
                      <button className="btn btn-secondary" onClick={() => editUniversity(university)} type="button">
                        Edytuj
                      </button>
                      <button className="btn btn-secondary" onClick={() => void deleteUniversity(university.id)} type="button">
                        Usuń
                      </button>
                    </div>
                  </header>
                  <p className="muted">{university.summary}</p>
                </div>
              ))}
            </div>
            <div className="list-item" style={{ marginTop: 18 }}>
              <h3>Podgląd profilu u mentee</h3>
              <div className="small muted" style={{ marginBottom: 10 }}>
                Tak ten profil będzie widoczny po stronie mentee.
              </div>
              <div className="tile">
                <div className="material-summary-row" style={{ alignItems: "flex-start" }}>
                  <div>
                    <strong>{session.user.fullName}</strong>
                    <div className="small muted" style={{ marginTop: 6 }}>{profile.headline || "Brak headline"}</div>
                  </div>
                  <span className="badge">{profile.adminApproved ? "approved" : "preview"}</span>
                </div>
                <div style={{ marginTop: 12 }}>{renderMultilineText(profile.bio)}</div>
                {universities.length ? (
                  <div className="tile-grid tile-grid-two compact-guide-grid" style={{ marginTop: 12 }}>
                    {universities.map((university) => (
                      <div className="tile compact-guide-tile" key={`mentor-preview-${university.id}`}>
                        <strong>{university.programName ? `${university.programName} - ${university.universityName}` : university.universityName}</strong>
                        <div className="small muted" style={{ marginTop: 6 }}>{university.country}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {section === "availability" ? (
        <div className="dashboard-card">
          <h2>Dostępność mentora</h2>
          <p className="muted">
            Ustaw tygodniowe reguły jak w Calendly, a potem nanoś wyjątki dla konkretnych dni w kalendarzu miesiąca. Backend połączy te reguły z Twoim prawdziwym Google Calendar.
          </p>
          <div className="status" style={{ marginTop: 16 }}>
            Google Calendar:{" "}
            <strong>
              {calendarConnection?.status === "connected"
                ? `połączony${
                    calendarConnection.externalEmail
                      ? ` (${calendarConnection.externalEmail})`
                      : ""
                  }`
                : "niepołączony"}
            </strong>
            . Przy połączeniu mentee będą mogli rezerwować realne sloty z Twojego kalendarza, a potwierdzenia polecą z Twojego Gmaila.
          </div>
          <div className="button-row" style={{ marginTop: 14, marginBottom: 10 }}>
            {calendarConnection?.status === "connected" ? (
              <button
                className="btn btn-secondary"
                onClick={() => void disconnectGoogleCalendar()}
                type="button"
              >
                Odłącz Google Calendar
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => void connectGoogleCalendar()}
                type="button"
              >
                Połącz Google Calendar
              </button>
            )}
          </div>
          <div className="grid-2" style={{ marginTop: 18 }}>
            <div className="field">
              <label>Jak daleko w przyszłość można rezerwować</label>
              <select
                value={String(profile.bookingWindowDays ?? 30)}
                onChange={(event) =>
                  setProfile((current: any) => ({
                    ...current,
                    bookingWindowDays: Number(event.target.value),
                  }))
                }
              >
                {[7, 14, 21, 30, 45, 60, 90, 120, 180].map((value) => (
                  <option key={value} value={value}>
                    {value} dni
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Minimalny czas przed spotkaniem</label>
              <select
                value={String(profile.minimumNoticeHours ?? 24)}
                onChange={(event) =>
                  setProfile((current: any) => ({
                    ...current,
                    minimumNoticeHours: Number(event.target.value),
                  }))
                }
              >
                {MINIMUM_NOTICE_HOUR_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value < 24 ? `${value} h` : value % 24 === 0 ? `${value / 24} dni` : `${value} h`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field" style={{ marginTop: 18 }}>
            <label>Jak późno mentee może przełożyć spotkanie</label>
            <select
              value={String(profile.rescheduleNoticeHours ?? 24)}
              onChange={(event) =>
                setProfile((current: any) => ({
                  ...current,
                  rescheduleNoticeHours: Number(event.target.value),
                }))
              }
            >
              {MINIMUM_NOTICE_HOUR_OPTIONS.map((value) => (
                <option key={`reschedule-${value}`} value={value}>
                  {value < 24 ? `${value} h` : value % 24 === 0 ? `${value / 24} dni` : `${value} h`}
                </option>
              ))}
            </select>
          </div>

          <div className="list" style={{ marginTop: 18 }}>
            {WEEKDAY_LABELS.map((label, weekday) => {
              const dayRules = availability
                .filter((entry) => entry.weekday === weekday)
                .sort((left, right) => left.startTime.localeCompare(right.startTime));
              const hasActiveRule = dayRules.some((entry) => entry.isActive);

              return (
                <div className="list-item" key={weekday}>
                  <header>
                    <div>
                      <h3>{label}</h3>
                      <div className="muted small">
                        {hasActiveRule ? "Dostępny" : "Niedostępny"}
                      </div>
                    </div>
                    <div className="button-row">
                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          updateDayRules(weekday, (rules) =>
                            (rules.length ? rules : [{ weekday, startTime: "09:00", endTime: "18:00", isActive: false }]).map((rule) => ({
                              ...rule,
                              isActive: !hasActiveRule,
                            })),
                          )
                        }
                        type="button"
                      >
                        {hasActiveRule ? "Wyłącz dzień" : "Włącz dzień"}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          updateDayRules(weekday, (rules) => [
                            ...rules,
                            { weekday, startTime: "09:00", endTime: "18:00", isActive: true },
                          ])
                        }
                        type="button"
                      >
                        Dodaj przedział
                      </button>
                    </div>
                  </header>

                  <div className="stack" style={{ marginTop: 14 }}>
                    {dayRules.length ? dayRules.map((rule, index) => (
                      <div className="grid-2" key={`${weekday}-${index}`}>
                        <div className="field">
                          <label>Od</label>
                          <input
                            type="time"
                            value={rule.startTime}
                            onChange={(event) =>
                              updateDayRules(weekday, (rules) =>
                                rules.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, startTime: event.target.value } : entry,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="field">
                          <label>Do</label>
                          <input
                            type="time"
                            value={rule.endTime}
                            onChange={(event) =>
                              updateDayRules(weekday, (rules) =>
                                rules.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, endTime: event.target.value } : entry,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="field">
                          <label>Aktywne</label>
                          <select
                            value={String(rule.isActive)}
                            onChange={(event) =>
                              updateDayRules(weekday, (rules) =>
                                rules.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, isActive: event.target.value === "true" } : entry,
                                ),
                              )
                            }
                          >
                            <option value="true">tak</option>
                            <option value="false">nie</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>Usuń</label>
                          <button
                            className="btn btn-secondary"
                            onClick={() =>
                              updateDayRules(weekday, (rules) =>
                                rules.filter((_, entryIndex) => entryIndex !== index),
                              )
                            }
                            type="button"
                          >
                            Usuń przedział
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="small muted">Brak przedziałów dla tego dnia.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="split" style={{ marginTop: 22 }}>
            <div className="dashboard-card">
              <h3>Override’y dla konkretnych dni</h3>
              <div className="button-row" style={{ marginTop: 10, marginBottom: 12 }}>
                <button
                  className="btn btn-secondary"
                  disabled={availabilityMonth <= formatMonthKey(new Date(), mentorTimezone)}
                  onClick={() => setAvailabilityMonth((current) => shiftMonthKey(current, -1))}
                  type="button"
                >
                  Poprzedni miesiąc
                </button>
                <strong style={{ textTransform: "capitalize" }}>{formatMonthHeading(availabilityMonth, mentorTimezone)}</strong>
                <button
                  className="btn btn-secondary"
                  onClick={() => setAvailabilityMonth((current) => shiftMonthKey(current, 1))}
                  type="button"
                >
                  Następny miesiąc
                </button>
              </div>
              <div className="small muted" style={{ marginBottom: 12 }}>
                Kliknij dzień, aby ustawić wyjątek od tygodniowych reguł.
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: 8,
                }}
              >
                {["nd", "pn", "wt", "śr", "czw", "pt", "sob"].map((label) => (
                  <div className="small muted" key={label} style={{ textAlign: "center" }}>
                    {label}
                  </div>
                ))}
                {availabilityMonthCells.map((cell) =>
                  cell.kind === "empty" ? (
                    <div key={cell.key} />
                  ) : (
                    <button
                      className={selectedOverrideDate === cell.dateKey ? "btn btn-primary" : "btn btn-secondary"}
                      disabled={cell.dateKey < mentorTodayKey}
                      key={cell.key}
                      onClick={() => setSelectedOverrideDate(cell.dateKey)}
                      style={{
                        minHeight: 64,
                        padding: "10px 8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          cell.availableCount > 0 && selectedOverrideDate !== cell.dateKey
                            ? "#fff3df"
                            : undefined,
                        borderColor:
                          cell.availableCount > 0 && selectedOverrideDate !== cell.dateKey
                            ? "#f0c36a"
                            : undefined,
                        color:
                          cell.availableCount > 0 && selectedOverrideDate !== cell.dateKey
                            ? "#9a6a06"
                            : undefined,
                      }}
                      type="button"
                    >
                      <strong>{cell.dayNumber}</strong>
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <h3>Wybrany dzień</h3>
              {selectedOverrideDate ? (
                <div className="stack" style={{ marginTop: 10 }}>
                  <div className="small muted">{selectedOverrideDate}</div>
                  <div className="field">
                    <label>Tryb dnia</label>
                    <select
                      value={selectedOverride.isBlocked ? "blocked" : "custom"}
                      onChange={(event) =>
                        updateOverride(selectedOverrideDate, (entry) => ({
                          ...entry,
                          isBlocked: event.target.value === "blocked",
                          ranges:
                            event.target.value === "blocked"
                              ? []
                              : entry.ranges?.length
                                ? entry.ranges
                                : [{ startTime: "09:00", endTime: "18:00", isActive: true }],
                        }))
                      }
                    >
                      <option value="custom">Własne godziny</option>
                      <option value="blocked">Niedostępny cały dzień</option>
                    </select>
                  </div>

                  {!selectedOverride.isBlocked ? (
                    <>
                      {(selectedOverride.ranges ?? []).map((range, index) => (
                        <div className="grid-2" key={`${selectedOverrideDate}-${index}`}>
                          <div className="field">
                            <label>Od</label>
                            <input
                              type="time"
                              value={range.startTime}
                              onChange={(event) =>
                                updateOverride(selectedOverrideDate, (entry) => ({
                                  ...entry,
                                  isBlocked: false,
                                  ranges: (entry.ranges ?? []).map((currentRange, currentIndex) =>
                                    currentIndex === index
                                      ? { ...currentRange, startTime: event.target.value }
                                      : currentRange,
                                  ),
                                }))
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Do</label>
                            <input
                              type="time"
                              value={range.endTime}
                              onChange={(event) =>
                                updateOverride(selectedOverrideDate, (entry) => ({
                                  ...entry,
                                  isBlocked: false,
                                  ranges: (entry.ranges ?? []).map((currentRange, currentIndex) =>
                                    currentIndex === index
                                      ? { ...currentRange, endTime: event.target.value }
                                      : currentRange,
                                  ),
                                }))
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Aktywne</label>
                            <select
                              value={String(range.isActive !== false)}
                              onChange={(event) =>
                                updateOverride(selectedOverrideDate, (entry) => ({
                                  ...entry,
                                  isBlocked: false,
                                  ranges: (entry.ranges ?? []).map((currentRange, currentIndex) =>
                                    currentIndex === index
                                      ? { ...currentRange, isActive: event.target.value === "true" }
                                      : currentRange,
                                  ),
                                }))
                              }
                            >
                              <option value="true">tak</option>
                              <option value="false">nie</option>
                            </select>
                          </div>
                          <div className="field">
                            <label>Usuń</label>
                            <button
                              className="btn btn-secondary"
                              onClick={() =>
                                updateOverride(selectedOverrideDate, (entry) => ({
                                  ...entry,
                                  isBlocked: false,
                                  ranges: (entry.ranges ?? []).filter((_, currentIndex) => currentIndex !== index),
                                }))
                              }
                              type="button"
                            >
                              Usuń przedział
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="button-row">
                        <button
                          className="btn btn-secondary"
                          onClick={() =>
                            updateOverride(selectedOverrideDate, (entry) => ({
                              ...entry,
                              isBlocked: false,
                              ranges: [
                                ...(entry.ranges ?? []),
                                { startTime: "09:00", endTime: "18:00", isActive: true },
                              ],
                            }))
                          }
                          type="button"
                        >
                          Dodaj przedział
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="status">Ten dzień będzie całkowicie niedostępny niezależnie od reguł tygodniowych.</div>
                  )}

                  <div className="button-row">
                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        setAvailabilityOverrides((current) =>
                          current.filter((entry) => entry.date !== selectedOverrideDate),
                        )
                      }
                      type="button"
                    >
                      Usuń override
                    </button>
                  </div>
                </div>
              ) : (
                <div className="small muted">Wybierz dzień w kalendarzu.</div>
              )}
            </div>
          </div>
          <div className="button-row" style={{ marginTop: 18 }}>
            <button className="btn btn-primary" onClick={() => void saveAvailability()} type="button">
              Zapisz dostępność
            </button>
          </div>
        </div>
      ) : null}
      {section === "guides" ? (
        <div className="split">
          <div className="dashboard-card">
            <h2>Nowy case mentora</h2>
            <form className="stack" onSubmit={createGuide}>
              <div className="field">
                <label>Uczelnia bazowa</label>
                <select value={guideForm.sourceGuideId} onChange={(event) => setGuideForm((current) => ({ ...current, sourceGuideId: event.target.value }))}>
                  <option value="">Wybierz istniejącą uczelnię</option>
                  {dedupedSourceGuides.map((guide) => (
                      <option key={guide.id} value={String(guide.id)}>
                        {formatGuideSecondaryLabel(guide)}
                      </option>
                    ))}
                </select>
              </div>
              <div className="field">
                <label>Własna nazwa case'u</label>
                <input value={guideForm.title} onChange={(event) => setGuideForm((current) => ({ ...current, title: event.target.value }))} />
              </div>
              <div className="small muted">
                Slug utworzy się automatycznie na podstawie wybranej uczelni i nazwy case&apos;u.
              </div>
              <div className="field">
                <label>Krótki opis</label>
                <textarea value={guideForm.summary} onChange={(event) => setGuideForm((current) => ({ ...current, summary: event.target.value }))} />
              </div>
              <div className="field">
                <label>Opis case'u</label>
                <textarea value={guideForm.descriptionMarkdown} onChange={(event) => setGuideForm((current) => ({ ...current, descriptionMarkdown: event.target.value }))} />
              </div>
              <div className="status">
                Same wymagania i materiały dodajesz później przez kafle materiałów. Tutaj tworzysz tylko własny case dla istniejącej uczelni.
              </div>
              <button className="btn btn-primary">Utwórz case mentora</button>
            </form>
          </div>
          <div className="dashboard-card">
            <h2>Twoje case'y</h2>
            <div className="list">
              {guides.map((guide) => (
                <div className="list-item" key={guide.id}>
                  <header>
                    <div>
                      <h3>{guide.title}</h3>
                      <div className="muted small">
                        {formatGuideSelectorLabel(guide)}
                      </div>
                    </div>
                    <span className="badge">
                      {guide.guideType} • {guide.status}
                    </span>
                  </header>
                  <p className="muted">{guide.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {section === "materials" ? (
        <div className="split">
          <div className="dashboard-card">
            <h2>Kafle materiałów mentora</h2>
            <p className="muted">Wybierz istniejący kafel i dopisz do niego własne wiersze tylko dla swoich uczelni.</p>
            <div className="list">
              {mentorMaterialTemplates.map((template) => (
                <div className="list-item" key={template.id}>
                  <header>
                    <div>
                      <h3>{template.title}</h3>
                      <div className="muted small">{materialTemplateTypeLabel(template.templateType)}</div>
                    </div>
                    <button className="btn btn-secondary" onClick={() => loadMentorMaterialTemplate(template)} type="button">
                      Edytuj wiersze
                    </button>
                  </header>
                  <p className="muted">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="dashboard-card">
            <h2>Układ wybranego kafla</h2>
            {!mentorMaterialEditorId ? (
              <div className="status">Wybierz najpierw kafel materiałów z lewej strony.</div>
            ) : (
              <div className="stack">
                {mentorMaterialDisplayRows.map((row, displayIndex) => {
                  const mentorIndex = row.readOnly ? -1 : mentorMaterialRows.findIndex((entry) => entry.displayKey === row.displayKey);
                  return (
                  <div className="list-item" key={row.displayKey || `mentor-row-${displayIndex}`}>
                    <header>
                      <div>
                        <h3>{row.readOnly ? `Wiersz admina ${displayIndex + 1}` : `Twój wiersz ${mentorIndex + 1}`}</h3>
                        <div className="muted small">{row.readOnly ? "Ten wiersz pochodzi z głównego kafla i jest tylko do podglądu." : "Możesz edytować tylko własne wiersze."}</div>
                      </div>
                      <div className="button-row row-tools">
                        <button className="btn btn-secondary btn-compact" onClick={() => addMentorRowAtAnchor(row.anchorAfterKey ?? "")} type="button">Dodaj przed</button>
                        <button className="btn btn-secondary btn-compact" onClick={() => addMentorRowAtAnchor(row.displayKey ?? "")} type="button">Dodaj pod</button>
                        {!row.readOnly ? (
                          <>
                            <button className="btn btn-secondary btn-compact btn-icon" onClick={() => moveMentorRow(row.displayKey ?? "", -1)} type="button" title="Przesuń w górę">↑</button>
                            <button className="btn btn-secondary btn-compact btn-icon" onClick={() => moveMentorRow(row.displayKey ?? "", 1)} type="button" title="Przesuń w dół">↓</button>
                            <button className="btn btn-secondary btn-compact" onClick={() => removeMentorRow(row.displayKey ?? "")} type="button">Usuń</button>
                          </>
                        ) : null}
                      </div>
                    </header>
                    <div className="field">
                      <label>Do których Twoich uczelni ten wiersz należy</label>
                      <div className="list">
                        {guides.filter((guide) => guide.guideType === "mentor_blueprint").map((guide) => {
                          const checked = row.appliesToGuideIds.includes(String(guide.id));
                          return (
                            <label className="list-item" key={`mentor-row-guide-${displayIndex}-${guide.id}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <input
                                disabled={row.readOnly}
                                checked={checked}
                                type="checkbox"
                                onChange={() =>
                                  updateMentorRow(mentorIndex, (entry) =>
                                        ({
                                            ...entry,
                                            appliesToGuideIds: checked
                                              ? entry.appliesToGuideIds.filter((id) => id !== String(guide.id))
                                              : [...entry.appliesToGuideIds, String(guide.id)],
                                          }))
                                }
                              />
                              <span>{guide.universityName} • {guide.title}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="field">
                      <label>Poziom</label>
                      <select
                        disabled={row.readOnly}
                        value={row.level}
                        onChange={(event) =>
                          updateMentorRow(mentorIndex, (entry) => ({ ...entry, level: event.target.value as MaterialRowEditor["level"] }))
                        }
                      >
                        <option value="country">Kraj</option>
                        <option value="university">Uczelnia</option>
                        <option value="item">Element / zadanie</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Kraj</label>
                      <input
                        disabled={row.readOnly}
                        value={row.country}
                        onChange={(event) => updateMentorRow(mentorIndex, (entry) => ({ ...entry, country: event.target.value }))}
                      />
                    </div>
                    {row.level !== "country" ? (
                      <div className="field">
                        <label>Uczelnia</label>
                        <input
                          disabled={row.readOnly}
                          value={row.university}
                          onChange={(event) => updateMentorRow(mentorIndex, (entry) => ({ ...entry, university: event.target.value }))}
                        />
                      </div>
                    ) : null}
                    {row.level === "item" ? (
                      <>
                        <div className="field">
                          <label>Nazwa elementu / zadania</label>
                          <input
                            disabled={row.readOnly}
                            value={row.task}
                            onChange={(event) => updateMentorRow(mentorIndex, (entry) => ({ ...entry, task: event.target.value }))}
                          />
                        </div>
                        <div className="field">
                          <label>Typ akcji dla mentee</label>
                          <select
                            disabled={row.readOnly}
                            value={row.actionType}
                            onChange={(event) => updateMentorRow(mentorIndex, (entry) => ({ ...entry, actionType: event.target.value as MaterialItemAction }))}
                          >
                            <option value="check_only">Tylko checkbox</option>
                            <option value="file_required">Tylko upload pliku</option>
                            <option value="file_or_doc">Upload pliku lub Google Doc</option>
                            <option value="check_or_file">Checkbox lub upload pliku</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>Sugerowana nazwa pliku (opcjonalnie)</label>
                          <input
                            disabled={row.readOnly}
                            value={row.suggestedFilename ?? ""}
                            onChange={(event) => updateMentorRow(mentorIndex, (entry) => ({ ...entry, suggestedFilename: event.target.value }))}
                          />
                        </div>
                        {row.actionType === "file_or_doc" ? (
                          <>
                            <div className="field">
                              <label>Tytuł zakładki w Essay Doc</label>
                              <input
                                disabled={row.readOnly}
                                value={row.docTabTitle ?? ""}
                                  onChange={(event) => updateMentorRow(mentorIndex, (entry) => ({ ...entry, docTabTitle: event.target.value }))}
                              />
                            </div>
                            <div className="field">
                              <label>Źródło treści nowej zakładki</label>
                              <select
                                disabled={row.readOnly}
                                value={getMaterialDocSeedMode(row)}
                                onChange={(event) =>
                                  updateMentorRow(mentorIndex, (entry) =>
                                    event.target.value === "source_tab"
                                      ? {
                                          ...entry,
                                          docSeedMode: "source_tab",
                                          docTabPrompt: "",
                                        }
                                      : {
                                          ...entry,
                                          docSeedMode: "plain_text",
                                          sourceDocumentId: "",
                                          sourceTabId: "",
                                        },
                                  )
                                }
                              >
                                <option value="plain_text">Plain text / prompt</option>
                                <option value="source_tab">Kopia z istniejącej zakładki Google Docs</option>
                              </select>
                            </div>
                            {getMaterialDocSeedMode(row) === "source_tab" ? (
                              <>
                                <div className="field">
                                  <label>Source document ID</label>
                                  <input
                                    disabled={row.readOnly}
                                    value={row.sourceDocumentId ?? ""}
                                    onChange={(event) => updateMentorRow(mentorIndex, (entry) => ({ ...entry, sourceDocumentId: event.target.value }))}
                                  />
                                </div>
                                <div className="field">
                                  <label>Source tab ID</label>
                                  <input
                                    disabled={row.readOnly}
                                    value={row.sourceTabId ?? ""}
                                    onChange={(event) => updateMentorRow(mentorIndex, (entry) => ({ ...entry, sourceTabId: event.target.value }))}
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="field">
                                <label>Tekst startowy / prompt na początku zakładki</label>
                                <textarea
                                  disabled={row.readOnly}
                                  value={row.docTabPrompt ?? ""}
                                  onChange={(event) => updateMentorRow(mentorIndex, (entry) => ({ ...entry, docTabPrompt: event.target.value }))}
                                />
                              </div>
                            )}
                          </>
                        ) : null}
                        <div className="field">
                          <label>Link do wskazówek</label>
                          <select
                            disabled={row.readOnly}
                            value={row.guideId}
                            onChange={(event) => updateMentorRow(mentorIndex, (entry) => ({ ...entry, guideId: event.target.value }))}
                          >
                            <option value="">Brak</option>
                            {mentorItemGuides.map((guide: any) => (
                              <option key={`mentor-item-guide-${guide.id}`} value={String(guide.id)}>
                                {guide.title} • {formatGuideScopeLabel(guide, mentorHintScopeGuides)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="field">
                          <label>Alternatywne sposoby wykonania, po jednej opcji w linii</label>
                          <textarea
                            disabled={row.readOnly}
                            value={row.alternativeOptions.join("\n")}
                            onChange={(event) =>
                              updateMentorRow(mentorIndex, (entry) => ({
                                ...entry,
                                alternativeOptions: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                              }))
                            }
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                  );
                })}
                <div className="button-row">
                  <button className="btn btn-secondary btn-compact" onClick={() => addMentorRowAtAnchor("")} type="button">Dodaj wiersz na górze</button>
                  <button className="btn btn-secondary btn-compact" onClick={() => addMentorRowAtAnchor(mentorMaterialDisplayRows.filter((row) => row.readOnly).slice(-1)[0]?.displayKey ?? "")} type="button">Dodaj wiersz na końcu</button>
                  <button className="btn btn-primary" onClick={() => void saveMentorMaterialRows()} type="button">Zapisz wiersze</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
      {section === "meetings" ? (
        <div className="dashboard-card">
          <h2>Spotkania mentora</h2>
          <p className="muted">Tutaj widzisz nadchodzące, odbyte i anulowane spotkania wraz z pełnym linkiem do wejścia.</p>
          <div className="button-row" style={{ marginTop: 16 }}>
            {([
              ["upcoming", "Nadchodzące"],
              ["past", "Po czasie"],
              ["cancelled", "Anulowane"],
            ] as const).map(([value, label]) => (
              <button
                className={mentorMeetingFilter === value ? "btn btn-primary" : "btn btn-secondary"}
                key={value}
                onClick={() => setMentorMeetingFilter(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="list" style={{ marginTop: 18 }}>
            {filteredMentorMeetings.map((meeting) => (
              <div className="list-item" key={meeting.id}>
                <header>
                  <div>
                    <h3>{meeting.title}</h3>
                    <div className="muted small">{meeting.menteeName ? `Mentee: ${meeting.menteeName}` : null}</div>
                    <div className="muted small">{formatMeetingDateRange(meeting, meeting.timezone || "Europe/Warsaw")}</div>
                  </div>
                  <span className="badge">{formatMeetingStatusLabel(meeting.status)}</span>
                </header>
                {meeting.description ? <p className="muted">{meeting.description}</p> : null}
                <div className="button-row" style={{ marginTop: 12 }}>
                  {meeting.meetingUrl ? (
                    <a className="btn btn-secondary" href={meeting.meetingUrl} target="_blank" rel="noreferrer">
                      Otwórz spotkanie
                    </a>
                  ) : null}
                  {meeting.canCancel ? (
                    <button
                      className="btn btn-secondary"
                      disabled={meetingActionId === `${meeting.id}:cancel`}
                      onClick={() => void cancelMentorMeeting(meeting.id)}
                      type="button"
                    >
                      Anuluj spotkanie
                    </button>
                  ) : null}
                </div>
                {meeting.meetingContactValue ? (
                  <div className="small muted" style={{ marginTop: 8, wordBreak: "break-all" }}>
                    {meeting.meetingContactValue}
                  </div>
                ) : null}
                {meeting.status === "cancelled" ? (
                  <div className="small muted" style={{ marginTop: 8 }}>
                    Anulował: {meeting.cancelledByRole || "nieznany"} • {meeting.cancelledMinutesBeforeStart ?? 0} min przed startem
                  </div>
                ) : null}
                {meeting.rescheduleCount ? (
                  <div className="small muted" style={{ marginTop: 8 }}>
                    Przełożone {meeting.rescheduleCount} raz • poprzedni termin: {meeting.rescheduledFromStartsAt ? formatMeetingDateRange({ startsAt: meeting.rescheduledFromStartsAt, endsAt: meeting.rescheduledFromEndsAt || meeting.rescheduledFromStartsAt }, meeting.timezone || "Europe/Warsaw") : "brak"}
                  </div>
                ) : null}
                {meeting.canMarkOccurred ? (
                  <div className="button-row" style={{ marginTop: 12 }}>
                    <button
                      className="btn btn-secondary"
                      disabled={meetingActionId === `${meeting.id}:occurred:yes`}
                      onClick={() => void markMentorMeetingOccurred(meeting.id, true)}
                      type="button"
                    >
                      Spotkanie się odbyło
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={meetingActionId === `${meeting.id}:occurred:no`}
                      onClick={() => void markMentorMeetingOccurred(meeting.id, false)}
                      type="button"
                    >
                      Spotkanie się nie odbyło
                    </button>
                  </div>
                ) : null}
                <div className="field" style={{ marginTop: 12 }}>
                  <label>Notatki mentora do spotkania</label>
                  <textarea
                    placeholder="Tutaj możesz dopisać notatki przed lub po spotkaniu."
                    value={meetingNoteDrafts[meeting.id] ?? ""}
                    onChange={(event) =>
                      setMeetingNoteDrafts((current) => ({
                        ...current,
                        [meeting.id]: event.target.value,
                      }))
                    }
                  />
                  <div className="button-row">
                    <button
                      className="btn btn-secondary"
                      disabled={meetingActionId === `${meeting.id}:notes`}
                      onClick={() => void saveMentorMeetingNotes(meeting.id, meetingNoteDrafts[meeting.id] ?? "")}
                      type="button"
                    >
                      Zapisz notatki
                    </button>
                  </div>
                </div>
                {meeting.isSuspicious ? (
                  <div className="status" style={{ marginTop: 12 }}>
                    Rozbieżność: mentor i mentee inaczej oznaczyli, czy spotkanie się odbyło.
                  </div>
                ) : null}
              </div>
            ))}
            {!filteredMentorMeetings.length ? <div className="status">Brak spotkań w tej kategorii.</div> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function MenteeSection({
  cartDrawerOpen,
  expandedMaterialTemplateIds,
  mobileViewport,
  onNavigate,
  onCartCountChange,
  onCartDrawerChange,
  section,
  token,
}: {
  cartDrawerOpen: boolean;
  expandedMaterialTemplateIds: number[];
  mobileViewport: boolean;
  onNavigate: (nextSection: string, nextTemplateId?: number | null) => void;
  onCartCountChange: (count: number) => void;
  onCartDrawerChange: (open: boolean) => void;
  section: string;
  token: string;
}) {
  const { canUsePreferencesCookies } = useCookieConsent();
  const [overview, setOverview] = useState<any>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [mentorSlots, setMentorSlots] = useState<Array<{ end: string; start: string }>>([]);
  const [mentorSlotsConnectionReady, setMentorSlotsConnectionReady] = useState(true);
  const [mentorSlotsLoading, setMentorSlotsLoading] = useState(false);
  const [mentorSlotsTimezone, setMentorSlotsTimezone] = useState("Europe/Warsaw");
  const [mentorSlotsMonth, setMentorSlotsMonth] = useState(
    formatMonthKey(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Warsaw"),
  );
  const [selectedMentorDayKey, setSelectedMentorDayKey] = useState<string | null>(null);
  const [publicGuides, setPublicGuides] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [availableGuideCountryFilter, setAvailableGuideCountryFilter] = useState("all");
  const [availableGuideUniversityFilter, setAvailableGuideUniversityFilter] = useState("all");
  const [openHintGuide, setOpenHintGuide] = useState<any | null>(null);
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [purchasePopup, setPurchasePopup] = useState<null | {
    body: string;
    key?: string;
    primaryCtaLabel: string;
    recommendedProductIds?: number[];
    secondaryCtaLabel?: string;
    title: string;
  }>(null);
  const [materialActionKey, setMaterialActionKey] = useState<string | null>(null);
  const [meetingActionKey, setMeetingActionKey] = useState<string | null>(null);
  const [meetingFilter, setMeetingFilter] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [meetingNoteDrafts, setMeetingNoteDrafts] = useState<Record<number, string>>({});
  const [meetingTurnstileToken, setMeetingTurnstileToken] = useState("");
  const [meetingTurnstileResetKey, setMeetingTurnstileResetKey] = useState(0);
  const [openMaterialTemplateIds, setOpenMaterialTemplateIds] = useState<number[]>(expandedMaterialTemplateIds);
  const [openEssayTileKeys, setOpenEssayTileKeys] = useState<string[]>([]);
  const [openMaterialItemKeys, setOpenMaterialItemKeys] = useState<string[]>([]);
  const [viewerTimezone, setViewerTimezone] = useState(() => {
    const saved = getCookie(TIMEZONE_COOKIE_NAME);
    return saved && findTimezoneOption(saved) ? saved : DEFAULT_TIMEZONE;
  });
  const [rescheduleMeetingId, setRescheduleMeetingId] = useState<number | null>(null);
  const [rescheduleMonth, setRescheduleMonth] = useState(
    formatMonthKey(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Warsaw"),
  );
  const [rescheduleSlots, setRescheduleSlots] = useState<Array<{ end: string; start: string }>>([]);
  const [rescheduleSlotsTimezone, setRescheduleSlotsTimezone] = useState("Europe/Warsaw");
  const [rescheduleSlotsConnectionReady, setRescheduleSlotsConnectionReady] = useState(true);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [selectedRescheduleDayKey, setSelectedRescheduleDayKey] = useState<string | null>(null);
  const [rescheduleDraft, setRescheduleDraft] = useState({ startsAt: "", endsAt: "", timezone: DEFAULT_TIMEZONE });
  const [meetingForm, setMeetingForm] = useState({
    mentorUserId: "",
    title: "Spotkanie mentoringowe",
    description: "",
    startsAt: "",
    endsAt: "",
    timezone: DEFAULT_TIMEZONE,
    method: "zoom_link",
    meetingUrl: "",
  });
  type MaterialItemState = {
    completed?: boolean;
    completionMethod?: string | null;
    currentFileName?: string | null;
    currentFileUrl?: string | null;
    googleDocTabTitle?: string | null;
    googleDocTabUrl?: string | null;
  };

  const profileFields = overview?.profileFields ?? [];
  const assignedMentors = overview?.assignedMentors ?? [];
  const availableGuideTemplates = overview?.availableGuideTemplates ?? [];
  const availableGuideCountryOptions = useMemo(
    () =>
      uniqueStrings(availableGuideTemplates.map((guide: any) => guide.country))
        .sort((left, right) => left.localeCompare(right, "pl")),
    [availableGuideTemplates],
  );
  const availableGuideUniversityOptions = useMemo(() => {
    const scopedGuides = availableGuideTemplates.filter((guide: any) =>
      availableGuideCountryFilter === "all" ? true : guide.country === availableGuideCountryFilter,
    );
    return uniqueStrings(scopedGuides.map((guide: any) => guide.universityName || formatGuidePrimaryLabel(guide)))
      .sort((left, right) => left.localeCompare(right, "pl"));
  }, [availableGuideCountryFilter, availableGuideTemplates]);
  const filteredAvailableGuideTemplates = useMemo(
    () =>
      availableGuideTemplates.filter((guide: any) => {
        if (availableGuideCountryFilter !== "all" && guide.country !== availableGuideCountryFilter) {
          return false;
        }
        const universityLabel = guide.universityName || formatGuidePrimaryLabel(guide);
        if (availableGuideUniversityFilter !== "all" && universityLabel !== availableGuideUniversityFilter) {
          return false;
        }
        return true;
      }),
    [availableGuideCountryFilter, availableGuideTemplates, availableGuideUniversityFilter],
  );
  const guideLimits = overview?.guideLimits ?? { emailInboxEnabled: false, maxActiveGuideCount: 1, maxHintGuideCount: 1, maxStorageMb: 100 };
  const materialTemplates = overview?.materialTemplates ?? [];
  const materialItemStates = overview?.materialItemStates ?? [];
  const googleWorkspace = overview?.googleWorkspace ?? {};
  const googleConnections = overview?.googleConnections ?? [];
  const hintGuides = overview?.hintGuides ?? [];
  const packages = overview?.packages ?? [];
  const cartItems = overview?.cartItems ?? [];
  const purchasePopups = overview?.purchasePopups ?? {};
  const storageSummary = overview?.storage ?? {
    cleanupDueAt: null,
    isOverLimit: false,
    lastAutoCleanupAt: null,
    limitExceededAt: null,
    maxStorageMb: 100,
    usedBytes: 0,
    usedMb: 0,
  };
  const universityEmails = overview?.universityEmails ?? [];
  const hintEligibleTemplateIds = (overview?.hintEligibleTemplateIds ?? []).map(String);
  const tipAccessGuides = overview?.tipAccessGuides ?? [];
  const hintGuideMap = new Map((hintGuides ?? []).map((guide: any) => [String(guide.id), guide]));
  const hintScopeGuides = [
    ...(overview?.assignedGuideTemplates ?? []),
    ...availableGuideTemplates,
    ...(guides ?? []).map((guide: any) => ({
      id: guide.sourceGuideId ?? guide.id,
      country: guide.country,
      universityName: guide.universityName,
    })),
  ].filter((guide: any, index: number, array: any[]) => array.findIndex((entry) => String(entry.id) === String(guide.id)) === index);
  const selectedMentor = assignedMentors.find(
    (mentor: any) => String(mentor.mentorId) === String(meetingForm.mentorUserId),
  );
  const rescheduleMeeting = (overview?.meetings ?? []).find((meeting: any) => meeting.id === rescheduleMeetingId) ?? null;
  const rescheduleMentor = rescheduleMeeting
    ? assignedMentors.find((mentor: any) => mentor.mentorId === rescheduleMeeting.mentorUserId) ?? null
    : null;
  const selectedMentorMaxMonth = selectedMentor
    ? formatMonthKey(
        new Date(
          Date.now() +
            Number(selectedMentor.bookingWindowDays ?? 30) * 24 * 60 * 60 * 1000,
        ),
        viewerTimezone,
      )
    : null;
  const mentorSlotDayIndex = useMemo(
    () => buildSlotDayIndex(mentorSlots, viewerTimezone),
    [mentorSlots, viewerTimezone],
  );
  const mentorSlotCounts = useMemo(
    () =>
      Object.fromEntries(
        Object.values(mentorSlotDayIndex).map((entry) => [entry.dateKey, entry.slots.length]),
      ),
    [mentorSlotDayIndex],
  );
  const mentorMonthCells = useMemo(
    () => buildMonthCalendar(mentorSlotsMonth, viewerTimezone, mentorSlotCounts),
    [mentorSlotCounts, mentorSlotsMonth, viewerTimezone],
  );
  const selectedMentorDay = selectedMentorDayKey
    ? mentorSlotDayIndex[selectedMentorDayKey] ?? null
    : null;
  const rescheduleSlotDayIndex = useMemo(
    () => buildSlotDayIndex(rescheduleSlots, viewerTimezone),
    [rescheduleSlots, viewerTimezone],
  );
  const rescheduleSlotCounts = useMemo(
    () =>
      Object.fromEntries(
        Object.values(rescheduleSlotDayIndex).map((entry) => [entry.dateKey, entry.slots.length]),
      ),
    [rescheduleSlotDayIndex],
  );
  const rescheduleMonthCells = useMemo(
    () => buildMonthCalendar(rescheduleMonth, viewerTimezone, rescheduleSlotCounts),
    [rescheduleMonth, rescheduleSlotCounts, viewerTimezone],
  );
  const selectedRescheduleDay = selectedRescheduleDayKey
    ? rescheduleSlotDayIndex[selectedRescheduleDayKey] ?? null
    : null;
  const filteredMenteeMeetings = (overview?.meetings ?? []).filter((meeting: any) => getMeetingCategory(meeting) === meetingFilter);
  const visibleMaterialTemplates = (materialTemplates ?? [])
    .map((template: any) => {
      const visibleRows = Array.isArray(template.structure)
        ? template.structure.filter((row: any) =>
            (guides ?? []).some((guide: any) => rowAppliesToGuide(row, guide)),
          )
        : [];
      return {
        ...template,
        visibleRows,
      };
    })
    .filter((template: any) => {
      const hasVisibleRows = (template.visibleRows ?? []).some((row: any) => row.level === "item");
      return hasVisibleRows;
    });
  const materialItemStateMap = new Map<string, MaterialItemState>(
    materialItemStates.map((entry: any) => [`${entry.templateId}:${entry.rowKey}`, entry]),
  );
  const guideMaterialsMap = new Map(
    (guides ?? []).map((guide: any) => [
      guide.id,
      visibleMaterialTemplates
        .filter((template: any) =>
          templateAppliesToGuide(template, guide) && (!isOfferMaterialTemplate(template) || guideHasOffer(guide)),
        )
        .map((template: any) => ({
          ...template,
          visibleRows: (template.visibleRows ?? []).filter((row: any) => rowAppliesToGuide(row, guide)),
        }))
        .filter((template: any) => (template.visibleRows ?? []).some((row: any) => row.level === "item")),
    ]),
  );
  const offeredGuides = (guides ?? []).filter((guide: any) => guideHasOffer(guide));
  const visibleEssayTemplates = visibleMaterialTemplates.filter((template: any) => isEssayMaterialTemplate(template));
  const visibleOfferTemplates = visibleMaterialTemplates
    .filter((template: any) => isOfferMaterialTemplate(template))
    .map((template: any) => ({
      ...template,
      visibleRows: (template.visibleRows ?? []).filter((row: any) =>
        offeredGuides.some((guide: any) => rowAppliesToGuide(row, guide)),
      ),
    }))
    .filter((template: any) => (template.visibleRows ?? []).some((row: any) => row.level === "item"));
  const visibleDocumentTemplates = visibleMaterialTemplates.filter(
    (template: any) => !isEssayMaterialTemplate(template) && !isOfferMaterialTemplate(template),
  );
  const activeGuideSourceIds = new Set(
    (guides ?? [])
      .map((guide: any) => Number(guide.sourceGuideId ?? guide.id))
      .filter((value: number) => Number.isFinite(value)),
  );
  const hintAccessSourceIds = new Set(
    (tipAccessGuides ?? [])
      .map((guide: any) => Number(guide.sourceGuideId ?? guide.id))
      .filter((value: number) => Number.isFinite(value)),
  );
  const activeGuideHintCards = (guides ?? []).map((guide: any) => ({
    guide,
    hasHintAccess: hintAccessSourceIds.has(Number(guide.sourceGuideId ?? guide.id)),
    sourceId: Number(guide.sourceGuideId ?? guide.id),
  }));
  const tipProgramCards = (guides ?? []).map((guide: any) => {
    const sourceId = Number(guide.sourceGuideId ?? guide.id);
    const hasHintAccess = hintAccessSourceIds.has(sourceId);
    const items = visibleMaterialTemplates.flatMap((template: any) =>
      (template.visibleRows ?? [])
        .filter((row: any) =>
          row.level === "item" &&
          row.guideId &&
          hintGuideMap.has(String(row.guideId)) &&
          rowAppliesToGuide(row, guide),
        )
        .map((row: any) => ({
          hintGuide: hintGuideMap.get(String(row.guideId)),
          key: `${guide.id}:${template.id}:${row.displayKey}`,
          task: row.task,
          templateTitle: template.title,
        })),
    );
    return {
      guide,
      hasHintAccess,
      items,
      lockedItemCount: hasHintAccess ? 0 : items.length,
      sourceId,
    };
  });
  const accessibleTipProgramCards = tipProgramCards.filter((entry: any) => entry.hasHintAccess && entry.items.length);
  const lockedTipProgramCards = tipProgramCards.filter((entry: any) => !entry.hasHintAccess);
  const cartCount = cartItems.reduce((sum: number, item: any) => sum + Number(item.quantity ?? 0), 0);

  useEffect(() => {
    onCartCountChange(cartCount);
  }, [cartCount, onCartCountChange]);

  useEffect(() => {
    if (
      availableGuideUniversityFilter !== "all"
      && !availableGuideUniversityOptions.includes(availableGuideUniversityFilter)
    ) {
      setAvailableGuideUniversityFilter("all");
    }
  }, [availableGuideUniversityFilter, availableGuideUniversityOptions]);

  function openPurchaseShell(title: string, body: string, primaryCtaLabel = "Kup sugerowany pakiet", key?: string) {
    const popupConfig = key ? purchasePopups[key] : null;
    setPurchasePopup({
      body: popupConfig?.body ?? body,
      key,
      primaryCtaLabel: popupConfig?.primaryCtaLabel ?? primaryCtaLabel,
      recommendedProductIds: Array.isArray(popupConfig?.recommendedProductIds) ? popupConfig.recommendedProductIds : [],
      secondaryCtaLabel: popupConfig?.secondaryCtaLabel ?? "Zobacz pakiety",
      title: popupConfig?.title ?? title,
    });
  }

  function popupConditionsSatisfied(popupConfig: any) {
    const conditions = popupConfig?.displayConditions ?? {};
    if (conditions.requiresGuideLimitReached && canAddAnotherGuide()) {
      return false;
    }
    if (conditions.requiresHintLimitReached && canAddAnotherHintGuide()) {
      return false;
    }
    if (conditions.requiresEmailInboxDisabled && guideLimits.emailInboxEnabled) {
      return false;
    }
    return true;
  }

  function maybeOpenContextualPopup(keys: string[]) {
    const match = keys.find((key) => Boolean(purchasePopups[key]?.isActive) && popupConditionsSatisfied(purchasePopups[key]));
    if (!match) {
      return false;
    }
    openPurchaseShell(
      purchasePopups[match]?.title ?? "Rozszerzenie dostępu",
      purchasePopups[match]?.body ?? "",
      purchasePopups[match]?.primaryCtaLabel ?? "Kup sugerowany pakiet",
      match,
    );
    return true;
  }

  function canAddAnotherGuide() {
    return (guides ?? []).length < Number(guideLimits.maxActiveGuideCount ?? 1);
  }

  function canAddAnotherHintGuide() {
    return (tipAccessGuides ?? []).length < Number(guideLimits.maxHintGuideCount ?? 0);
  }

  async function refreshOverview() {
    const payload = await apiFetch<any>("/mentee/overview", undefined, token);
    setOverview(payload);
    setGuides(payload.guides ?? []);
    setMeetingNoteDrafts(
      Object.fromEntries(
        (payload.meetings ?? []).map((meeting: any) => [meeting.id, String(meeting.menteeNotes ?? "")]),
      ),
    );
    const nextValues: Record<string, string> = {};
    const responses = new Map<number, string>((payload.profileResponses ?? []).map((entry: any) => [entry.fieldId, String(entry.value ?? "")]));
    for (const field of payload.profileFields ?? []) {
      nextValues[String(field.id)] = responses.get(field.id) ?? "";
    }
    setProfileValues(nextValues);
    return payload;
  }
  useEffect(() => {
    if (canUsePreferencesCookies) {
      setLongLivedCookie(TIMEZONE_COOKIE_NAME, viewerTimezone);
    }
  }, [canUsePreferencesCookies, viewerTimezone]);

  useEffect(() => {
    setOpenMaterialTemplateIds(
      expandedMaterialTemplateIds.length ? Array.from(new Set(expandedMaterialTemplateIds)) : [],
    );
    setOpenEssayTileKeys([]);
    setOpenMaterialItemKeys([]);
  }, [expandedMaterialTemplateIds, section]);

  useEffect(() => {
    if (section === "universities" || section === "materials" || section === "offers" || section === "essays" || section === "profile" || section === "meetings" || section === "mentors" || section === "emails" || section === "packages") {
      void refreshOverview().catch((error) => setStatus(error.message));
    }
    if (section === "mentors") {
      void apiFetch<any[]>("/public/mentors").then(setMentors).catch((error) => setStatus(error.message));
    }
    if (section === "universities" || section === "materials" || section === "offers" || section === "essays") {
      void apiFetch<any[]>("/public/guides").then(setPublicGuides).catch((error) => setStatus(error.message));
    }
  }, [section, token]);

  useEffect(() => {
    if (section !== "mentors" || !meetingForm.mentorUserId) {
      return;
    }

    const mentor = assignedMentors.find(
      (entry: any) => String(entry.mentorId) === String(meetingForm.mentorUserId),
    );
    if (!mentor?.googleCalendarConnected) {
      setMentorSlots([]);
      setMentorSlotsConnectionReady(false);
      setSelectedMentorDayKey(null);
      setMentorSlotsTimezone(mentor?.timezone || "Europe/Warsaw");
      return;
    }

    setMentorSlotsLoading(true);
    void apiFetch<{
      connectionReady: boolean;
      slots: Array<{ end: string; start: string }>;
      timezone: string;
    }>(
      `/mentee/mentor-slots?mentorUserId=${encodeURIComponent(meetingForm.mentorUserId)}&month=${encodeURIComponent(mentorSlotsMonth)}`,
      undefined,
      token,
    )
      .then((payload) => {
        setMentorSlots(payload.slots ?? []);
        setMentorSlotsConnectionReady(payload.connectionReady !== false);
        setMentorSlotsTimezone(payload.timezone || mentor.timezone || "Europe/Warsaw");
      })
      .catch((error) => setStatus(error.message))
      .finally(() => setMentorSlotsLoading(false));
  }, [assignedMentors, meetingForm.mentorUserId, mentorSlotsMonth, section, token]);

  useEffect(() => {
    if (section !== "meetings" || !rescheduleMeeting || !rescheduleMentor) {
      return;
    }
    if (!rescheduleMentor.googleCalendarConnected) {
      setRescheduleSlots([]);
      setRescheduleSlotsConnectionReady(false);
      setRescheduleSlotsTimezone(rescheduleMentor.timezone || "Europe/Warsaw");
      return;
    }
    setRescheduleSlotsLoading(true);
    void apiFetch<{
      connectionReady: boolean;
      slots: Array<{ end: string; start: string }>;
      timezone: string;
    }>(
      `/mentee/mentor-slots?mentorUserId=${encodeURIComponent(rescheduleMeeting.mentorUserId)}&month=${encodeURIComponent(rescheduleMonth)}`,
      undefined,
      token,
    )
      .then((payload) => {
        setRescheduleSlots(payload.slots ?? []);
        setRescheduleSlotsConnectionReady(payload.connectionReady !== false);
        setRescheduleSlotsTimezone(payload.timezone || rescheduleMentor.timezone || "Europe/Warsaw");
      })
      .catch((error) => setStatus(error.message))
      .finally(() => setRescheduleSlotsLoading(false));
  }, [rescheduleMeeting, rescheduleMentor, rescheduleMonth, section, token]);

  useEffect(() => {
    setSelectedMentorDayKey(null);
    setMeetingForm((current) => ({
      ...current,
      startsAt: "",
      endsAt: "",
      timezone: viewerTimezone,
    }));
  }, [meetingForm.mentorUserId, mentorSlotsMonth, viewerTimezone]);

  useEffect(() => {
    if (!rescheduleMeetingId) {
      setSelectedRescheduleDayKey(null);
      setRescheduleDraft({ startsAt: "", endsAt: "", timezone: viewerTimezone });
      return;
    }
    setSelectedRescheduleDayKey(null);
    setRescheduleDraft({ startsAt: "", endsAt: "", timezone: viewerTimezone });
  }, [rescheduleMeetingId, rescheduleMonth, viewerTimezone]);

  async function requestMeeting(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    if (isTurnstileEnabled() && !meetingTurnstileToken) {
      setStatus("Potwierdź zabezpieczenie formularza przed rezerwacją spotkania.");
      return;
    }
    try {
      await apiFetch("/mentee/meetings", {
        method: "POST",
        body: JSON.stringify({
          ...meetingForm,
          mentorUserId: Number(meetingForm.mentorUserId),
          startsAt: new Date(meetingForm.startsAt).toISOString(),
          endsAt: new Date(meetingForm.endsAt).toISOString(),
          turnstileToken: meetingTurnstileToken,
        }),
      }, token);
      await refreshOverview();
      setStatus("Spotkanie zostało zarezerwowane.");
      setMeetingTurnstileToken("");
      setMeetingTurnstileResetKey((current) => current + 1);
      setMeetingForm((current) => ({
        ...current,
        description: "",
        endsAt: "",
        startsAt: "",
      }));
    } catch (error) {
      setMeetingTurnstileToken("");
      setMeetingTurnstileResetKey((current) => current + 1);
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać spotkania.");
    }
  }

  async function cancelMenteeMeeting(meetingId: number) {
    setMeetingActionKey(`${meetingId}:cancel`);
    setStatus("");
    try {
      await apiFetch(`/mentee/meetings/${meetingId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "" }),
      }, token);
      await refreshOverview();
      setStatus("Spotkanie zostało anulowane.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się anulować spotkania.");
    } finally {
      setMeetingActionKey(null);
    }
  }

  async function saveMeetingReschedule(meetingId: number) {
    if (!rescheduleDraft.startsAt || !rescheduleDraft.endsAt) {
      setStatus("Wybierz nowy termin spotkania.");
      return;
    }
    setMeetingActionKey(`${meetingId}:reschedule`);
    setStatus("");
    try {
      await apiFetch(`/mentee/meetings/${meetingId}/reschedule`, {
        method: "PATCH",
        body: JSON.stringify({
          ...rescheduleDraft,
          endsAt: new Date(rescheduleDraft.endsAt).toISOString(),
          startsAt: new Date(rescheduleDraft.startsAt).toISOString(),
        }),
      }, token);
      await refreshOverview();
      setRescheduleMeetingId(null);
      setStatus("Spotkanie zostało przełożone.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się przełożyć spotkania.");
    } finally {
      setMeetingActionKey(null);
    }
  }

  async function markMenteeMeetingOccurred(meetingId: number, occurred: boolean) {
    setMeetingActionKey(`${meetingId}:occurred:${occurred ? "yes" : "no"}`);
    setStatus("");
    try {
      await apiFetch(`/mentee/meetings/${meetingId}/occurred`, {
        method: "PATCH",
        body: JSON.stringify({ occurred }),
      }, token);
      await refreshOverview();
      setStatus(occurred ? "Oznaczono, że spotkanie się odbyło." : "Oznaczono, że spotkanie się nie odbyło.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać statusu spotkania.");
    } finally {
      setMeetingActionKey(null);
    }
  }

  async function saveProfileResponses(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    try {
      await apiFetch("/mentee/profile-responses", {
        method: "PUT",
        body: JSON.stringify({
          responses: profileFields.map((field: any) => ({
            fieldId: field.id,
            value: profileValues[String(field.id)] ?? "",
          })),
        }),
      }, token);
      setStatus("Twoje dane zostały zapisane.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać danych.");
    }
  }

  async function adoptUniversity(templateId: number) {
    setStatus("");
    if (!canAddAnotherGuide()) {
      openPurchaseShell(
        "Limit programów został wykorzystany",
        "Masz już wykorzystany obecny limit aktywnych programów. Możesz dokupić dostęp do większej liczby programów w zakładce Pakiety.",
        "Kup więcej programów",
        "guide_limit",
      );
      return;
    }
    try {
      await apiFetch(`/mentee/guides/${templateId}/adopt`, { method: "POST" }, token);
      await refreshOverview();
      setStatus("Uczelnia została dodana do Twojego panelu.");
      maybeOpenContextualPopup([
        `context:after_guide_add:guide:${templateId}`,
        "context:after_guide_add:any",
      ]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się dodać uczelni.");
    }
  }

  async function resignUniversity(guideId: number) {
    setStatus("");
    try {
      await apiFetch(`/mentee/guides/${guideId}/resign`, { method: "PATCH" }, token);
      await refreshOverview();
      setStatus("Uczelnia została usunięta z Twojego panelu.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się usunąć uczelni.");
    }
  }

  async function enableHintAccess(templateGuideId: number) {
    setStatus("");
    if (!canAddAnotherHintGuide()) {
      openPurchaseShell(
        "Limit wskazówek został wykorzystany",
        "Masz już wykorzystany obecny limit aktywnych wskazówek. Możesz dokupić większy pakiet wskazówek w zakładce Pakiety.",
        "Kup więcej wskazówek",
        "hint_limit",
      );
      return;
    }
    try {
      await apiFetch(`/mentee/guides/${templateGuideId}/hint-access`, { method: "PUT" }, token);
      await refreshOverview();
      setStatus("Dostęp do wskazówek został dodany.");
      maybeOpenContextualPopup([
        `context:after_hint_add:guide:${templateGuideId}`,
        "context:after_hint_add:any",
      ]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się dodać wskazówek.");
    }
  }

  async function saveMenteeMeetingNotes(meetingId: number, menteeNotes: string) {
    setMeetingActionKey(`${meetingId}:notes`);
    setStatus("");
    try {
      await apiFetch(`/mentee/meetings/${meetingId}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ menteeNotes }),
      }, token);
      await refreshOverview();
      setStatus("Notatki do spotkania zostały zapisane.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać notatek.");
    } finally {
      setMeetingActionKey(null);
    }
  }

  async function addProductToCart(productId: number) {
    setStatus("");
    try {
      await apiFetch("/mentee/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      }, token);
      await refreshOverview();
      onCartDrawerChange(true);
      setStatus("Produkt został dodany do koszyka.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się dodać produktu do koszyka.");
    }
  }

  async function removeProductFromCart(productId: number) {
    setStatus("");
    try {
      await apiFetch(`/mentee/cart/items/${productId}`, { method: "DELETE" }, token);
      await refreshOverview();
      setStatus("Produkt został usunięty z koszyka.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się usunąć produktu z koszyka.");
    }
  }

  async function checkoutCart() {
    setStatus("");
    try {
      const payload = await apiFetch<any>("/mentee/cart/checkout", { method: "POST" }, token);
      if (payload?.checkoutMode === "stripe" && payload?.url) {
        window.location.href = payload.url;
        return;
      }
      await refreshOverview();
      onCartDrawerChange(false);
      setStatus("Zakup został zastosowany do konta testowego.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się rozpocząć checkoutu.");
    }
  }

  async function connectUniversityEmailInbox() {
    setStatus("");
    try {
      const payload = await apiFetch<any>("/mentee/google-connections/gmail_readonly/start", { method: "POST" }, token);
      if (payload?.authUrl) {
        window.location.href = payload.authUrl;
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się rozpocząć łączenia Gmaila.");
    }
  }

  async function disconnectUniversityEmailInbox() {
    setStatus("");
    try {
      await apiFetch("/mentee/google-connections/gmail_readonly", { method: "DELETE" }, token);
      await refreshOverview();
      setStatus("Połączenie Gmail zostało odłączone.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się odłączyć Gmaila.");
    }
  }

  async function refreshUniversityEmails() {
    setStatus("");
    try {
      const payload = await apiFetch<any>("/mentee/university-emails/refresh", { method: "POST" }, token);
      await refreshOverview();
      const imported = Number(payload?.imported ?? 0);
      const matched = Number(payload?.matched ?? 0);
      const scanned = Number(payload?.scannedMessages ?? 0);
      const connectedEmail = payload?.connectedEmail ? ` (${payload.connectedEmail})` : "";
      setStatus(
        imported > 0
          ? `Skrzynka uczelni została odświeżona${connectedEmail}. Zaimportowano ${imported} wiadomości.`
          : `Skrzynka uczelni została odświeżona${connectedEmail}. Przeskanowano ${scanned} wiadomości, dopasowano ${matched}, zaimportowano ${imported}.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się odświeżyć maili uczelni.");
    }
  }

  async function updateGuideOfferStatus(guideId: number, offerStatus: "none" | "conditional" | "final") {
    setMaterialActionKey(`guide:${guideId}:offer:${offerStatus}`);
    setStatus("");
    try {
      await apiFetch(`/mentee/guides/${guideId}/offer-status`, {
        method: "PATCH",
        body: JSON.stringify({ offerStatus }),
      }, token);
      await refreshOverview();
      setStatus(
        offerStatus === "none"
          ? "Status oferty został wyczyszczony."
          : offerStatus === "conditional"
            ? "Zapisano, że masz ofertę warunkową."
            : "Zapisano, że masz ofertę finalną.",
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać statusu oferty.");
    } finally {
      setMaterialActionKey(null);
    }
  }

  async function toggleMaterialCheck(templateId: number, rowKey: string, completed: boolean) {
    setMaterialActionKey(`${templateId}:${rowKey}:check`);
    setStatus("");
    try {
      await apiFetch("/mentee/material-items/check", {
        method: "POST",
        body: JSON.stringify({
          completed,
          rowKey,
          templateId,
        }),
      }, token);
      await refreshOverview();
      setStatus(completed ? "Element został oznaczony jako wykonany." : "Element został odznaczony.");
      if (completed) {
        maybeOpenContextualPopup([
          `context:after_material_check:template:${templateId}:row:${rowKey}`,
          `context:after_material_check:template:${templateId}`,
          "context:after_material_check:any",
        ]);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać statusu elementu.");
    } finally {
      setMaterialActionKey(null);
    }
  }

  async function uploadMaterialFile(templateId: number, rowKey: string, file: File) {
    if (file.size > MAX_MATERIAL_UPLOAD_BYTES) {
      setStatus("Plik jest zbyt duży. Maksymalny rozmiar uploadu to 15 MB.");
      return;
    }

    setMaterialActionKey(`${templateId}:${rowKey}:upload`);
    setStatus(`Wgrywanie pliku "${file.name}" do Google Drive...`);
    try {
      const base64Content = await fileToBase64(file);
      await apiFetch("/mentee/material-items/upload", {
        method: "POST",
        body: JSON.stringify({
          base64Content,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          rowKey,
          templateId,
        }),
      }, token);
      await refreshOverview();
      setStatus("Plik został wgrany do Twojego folderu Google Drive.");
      maybeOpenContextualPopup([
        `context:after_material_upload:template:${templateId}:row:${rowKey}`,
        `context:after_material_upload:template:${templateId}`,
        "context:after_material_upload:any",
      ]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się wgrać pliku.");
    } finally {
      setMaterialActionKey(null);
    }
  }

  async function createMaterialDocTab(templateId: number, rowKey: string) {
    setMaterialActionKey(`${templateId}:${rowKey}:doc`);
    setStatus("");
    try {
      await apiFetch("/mentee/material-items/create-doc-tab", {
        method: "POST",
        body: JSON.stringify({
          rowKey,
          templateId,
        }),
      }, token);
      await refreshOverview();
      setStatus("Nowa zakładka została dodana do Essay Doc.");
      maybeOpenContextualPopup([
        `context:after_doc_tab_create:template:${templateId}:row:${rowKey}`,
        `context:after_doc_tab_create:template:${templateId}`,
        "context:after_doc_tab_create:any",
      ]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się utworzyć zakładki w Essay Doc.");
    } finally {
      setMaterialActionKey(null);
    }
  }

  async function removeMaterialFile(templateId: number, rowKey: string) {
    setMaterialActionKey(`${templateId}:${rowKey}:remove-file`);
    setStatus("");
    try {
      await apiFetch("/mentee/material-items/remove-file", {
        method: "POST",
        body: JSON.stringify({
          rowKey,
          templateId,
        }),
      }, token);
      await refreshOverview();
      setStatus("Plik został odłączony od tego elementu i przeniesiony do kosza Google Drive.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się usunąć pliku.");
    } finally {
      setMaterialActionKey(null);
    }
  }

  async function removeMaterialDocTab(templateId: number, rowKey: string) {
    setMaterialActionKey(`${templateId}:${rowKey}:remove-doc`);
    setStatus("");
    try {
      await apiFetch("/mentee/material-items/remove-doc-tab", {
        method: "POST",
        body: JSON.stringify({
          rowKey,
          templateId,
        }),
      }, token);
      await refreshOverview();
      setStatus("Zakładka została usunięta z Essay Doca.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się usunąć zakładki.");
    } finally {
      setMaterialActionKey(null);
    }
  }

  function getTemplateDestinationSection(template: any) {
    if (isEssayMaterialTemplate(template)) {
      return "essays";
    }
    if (isOfferMaterialTemplate(template)) {
      return "offers";
    }
    return "materials";
  }

  function renderMaterialItemRow(
    template: any,
    row: any,
    key: string,
    options?: { showConnectedGuideCount?: boolean; collapsibleKey?: string },
  ) {
    const applicableGuides = guides.filter((guide: any) => rowAppliesToGuide(row, guide));
    const universityNames = uniqueStrings(applicableGuides.map((guide: any) => formatGuidePrimaryLabel(guide)));
    const headline = row.task || "Zadanie";
    const showHints =
      row.guideId &&
      applicableGuides.some((guide: any) => hintEligibleTemplateIds.includes(getGuideTemplateId(guide)));
    const hintGuide = row.guideId ? hintGuideMap.get(String(row.guideId)) : null;
    const canPersistAction = Number.isFinite(Number(template.id)) && Boolean(row.displayKey);
    const state = materialItemStateMap.get(`${template.id}:${row.displayKey}`);
    const actionType = (row.actionType ?? "check_only") as MaterialItemAction;
    const actionPrefix = `${template.id}:${row.displayKey}`;
    const hasHintAccess = Boolean(showHints && hintGuide);
    const hintExists = Boolean(row.guideId && hintGuide);
    const hintButtonLabel = hasHintAccess
      ? "Otwórz wskazówki"
      : hintExists
        ? "Odblokuj wskazówki"
        : "Brak wskazówek";

    const content = (
      <>
        {options?.showConnectedGuideCount ? (
          <div className="small muted">
            {universityNames.length || 1} {(universityNames.length || 1) === 1 ? "przewodnik powiązany" : "przewodniki powiązane"}
          </div>
        ) : null}
        {universityNames.length ? (
          <div className="small muted">{formatUniversityNamesPreview(universityNames)}</div>
        ) : null}
        <div className="stack material-actions" style={{ marginTop: 12 }}>
          <div className="button-row material-actions-row">
            <button
              className="btn btn-secondary"
              disabled={!hintExists}
              onClick={() => {
                if (hasHintAccess && hintGuide) {
                  setOpenHintGuide(hintGuide);
                  return;
                }
                if (hintExists) {
                  openPurchaseShell(
                    "Wskazówki są poza Twoim obecnym pakietem",
                    "Masz dostęp do programu, ale nie do wskazówek dla tego programu. Możesz je odblokować z poziomu zakładki Pakiety.",
                    "Odblokuj wskazówki",
                    "hint_locked",
                  );
                }
              }}
              type="button"
            >
              {hintButtonLabel}
            </button>
            {(actionType === "file_required"
              || actionType === "check_or_file"
              || (actionType === "file_or_doc" && !state?.googleDocTabUrl)) ? (
              <label className="btn btn-secondary material-file-button" style={{ cursor: "pointer" }}>
                {getUploadButtonLabel(row, state)}
                <input
                  hidden
                  disabled={!canPersistAction || materialActionKey === `${actionPrefix}:upload`}
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.currentTarget.value = "";
                    if (file && canPersistAction) {
                      void uploadMaterialFile(Number(template.id), row.displayKey, file);
                    }
                  }}
                />
              </label>
            ) : null}
          </div>
          {state?.currentFileUrl ? (
            <div className="button-row material-actions-row">
              <a className="btn btn-secondary" href={state.currentFileUrl} target="_blank" rel="noreferrer">
                {getSuggestedOrCurrentFileLabel(row, state)}
              </a>
              <button
                className="btn btn-secondary"
                disabled={!canPersistAction || materialActionKey === `${actionPrefix}:remove-file`}
                onClick={() => {
                  if (canPersistAction) {
                    void removeMaterialFile(Number(template.id), row.displayKey);
                  }
                }}
                type="button"
              >
                Usuń plik
              </button>
            </div>
          ) : null}
          {state?.googleDocTabUrl ? (
            <div className="button-row material-actions-row">
              <a className="btn btn-secondary" href={state.googleDocTabUrl} target="_blank" rel="noreferrer">
                {state.googleDocTabTitle || "Otwórz zakładkę"}
              </a>
              <button
                className="btn btn-secondary"
                disabled={!canPersistAction || materialActionKey === `${actionPrefix}:remove-doc`}
                onClick={() => {
                  if (canPersistAction) {
                    void removeMaterialDocTab(Number(template.id), row.displayKey);
                  }
                }}
                type="button"
              >
                Usuń zakładkę
              </button>
            </div>
          ) : null}
          {actionType === "file_or_doc" && !state?.googleDocTabUrl ? (
            <button
              className="btn btn-secondary"
              disabled={!canPersistAction || materialActionKey === `${actionPrefix}:doc`}
              onClick={() => {
                if (canPersistAction) {
                  void createMaterialDocTab(Number(template.id), row.displayKey);
                }
              }}
              type="button"
            >
              Utwórz zakładkę w Essay Doc
            </button>
          ) : null}
          {(actionType === "check_only"
            || (actionType === "check_or_file" && !state?.currentFileUrl)
            || (actionType === "file_or_doc" && Boolean(state?.googleDocTabUrl))) ? (
            <button
              className="btn btn-secondary"
              disabled={!canPersistAction || materialActionKey === `${actionPrefix}:check`}
              onClick={() => {
                if (canPersistAction) {
                  void toggleMaterialCheck(
                    Number(template.id),
                    row.displayKey,
                    !(state?.completed && state?.completionMethod === "checkbox"),
                  );
                }
              }}
              type="button"
            >
              {getCompletionToggleLabel(state)}
            </button>
          ) : null}
        </div>
      </>
    );

    if (options?.collapsibleKey) {
      const collapsibleKey = options.collapsibleKey;
      return (
        <details
          className="list-item nested-detail material-row material-row-item"
          key={key}
          onToggle={(event) => {
            const nextOpen = (event.currentTarget as HTMLDetailsElement).open;
            setOpenMaterialItemKeys((current) =>
              nextOpen
                ? (current.includes(collapsibleKey) ? current : [...current, collapsibleKey])
                : current.filter((value) => value !== collapsibleKey),
            );
          }}
          open={openMaterialItemKeys.includes(collapsibleKey)}
        >
          <summary>
            <div className="material-summary-row">
              <h3>{headline}</h3>
              <CompletionDot completed={getMaterialItemCompleted(state)} />
            </div>
          </summary>
          <div className="collapsible-body">
            <div className="collapsible-body-inner" style={{ marginTop: 12 }}>
              {content}
            </div>
          </div>
        </details>
      );
    }

    return (
      <div className="list-item material-row material-row-item" key={key}>
        <div className="material-summary-row">
          <h3>{headline}</h3>
          <CompletionDot completed={getMaterialItemCompleted(state)} />
        </div>
        {content}
      </div>
    );
  }

  function renderEssayTemplateTile(template: any) {
    const sections: Array<{
      country: string;
      tiles: Array<{ key: string; title: string; rows: any[]; subtitle: string; kind: "university" | "item" }>;
    }> = [];
    const ensureSection = (country: string) => {
      const normalizedCountry = country || "Inne";
      let section = sections.find((entry) => entry.country === normalizedCountry);
      if (!section) {
        section = { country: normalizedCountry, tiles: [] };
        sections.push(section);
      }
      return section;
    };

    let currentCountry = "";
    let currentUniversityTile: {
      key: string;
      title: string;
      rows: any[];
      subtitle: string;
      kind: "university" | "item";
    } | null = null;

    (template.visibleRows ?? []).forEach((row: any, index: number) => {
      const applicableGuides = guides.filter((guide: any) => rowAppliesToGuide(row, guide));
      const universityNames = uniqueStrings(applicableGuides.map((guide: any) => formatGuidePrimaryLabel(guide)));
      const countryNames = uniqueStrings(applicableGuides.map((guide: any) => guide.country));

      if (row.level === "country") {
        currentCountry = row.country || countryNames[0] || "Inne";
        currentUniversityTile = null;
        ensureSection(currentCountry);
        return;
      }

      if (row.level === "university") {
        const title = row.university || universityNames[0] || "Uczelnia";
        const section = ensureSection(currentCountry || countryNames[0] || "Inne");
        currentUniversityTile = {
          key: `${template.id}-essay-university-${index}`,
          title,
          rows: [],
          subtitle: "",
          kind: "university",
        };
        section.tiles.push(currentUniversityTile);
        return;
      }

      if (row.level !== "item") {
        return;
      }

      if (currentUniversityTile) {
        currentUniversityTile.rows.push(row);
        return;
      }

      const section = ensureSection(currentCountry || row.country || countryNames[0] || "Inne");
      section.tiles.push({
        key: `${template.id}-essay-item-${index}`,
        title: row.task || "Zadanie",
        rows: [row],
        subtitle: `${universityNames.length || 1} ${universityNames.length === 1 ? "przewodnik powiązany" : "przewodniki powiązane"}`,
        kind: "item",
      });
    });

    const visibleSections = sections
      .map((section) => ({
        ...section,
        tiles: section.tiles.filter((tile) => tile.rows.some((row: any) => row.level === "item")),
      }))
      .filter((section) => section.tiles.length > 0);

    return (
      <div className="stack" key={`essay-template-${template.id}`} style={{ marginTop: 18 }}>
        {template.description ? <p className="muted">{template.description}</p> : null}
        {visibleSections.map((section) => (
          <div className="essay-country-section" key={`${template.id}-${section.country}`}>
            <div className="material-heading material-heading-country">
              <h3>{section.country}</h3>
            </div>
            <div className="tile-grid tile-grid-two" style={{ marginTop: 12 }}>
              {section.tiles.map((tile) => {
                const progress = countCompletedRows(tile.rows, Number(template.id), materialItemStateMap);
                const itemKeys = tile.rows.map((_: any, rowIndex: number) => `${tile.key}-item-${rowIndex}`);
                return (
                  <details
                    className="tile tile-detail"
                    key={tile.key}
                    onToggle={(event) => {
                      const nextOpen = (event.currentTarget as HTMLDetailsElement).open;
                      setOpenEssayTileKeys((current) =>
                        nextOpen
                          ? (current.includes(tile.key) ? current : [...current, tile.key])
                          : current.filter((value) => value !== tile.key),
                      );
                      if (nextOpen) {
                        setOpenMaterialItemKeys((current) => Array.from(new Set([...current, ...itemKeys])));
                      }
                    }}
                    open={openEssayTileKeys.includes(tile.key)}
                  >
                    <summary>
                      <div className="material-summary-row">
                        <div>
                          <strong>{tile.title}</strong>
                          {tile.subtitle ? <div className="small muted">{tile.subtitle}</div> : null}
                        </div>
                        <ProgressCircle completed={progress.completed} total={progress.total} />
                      </div>
                    </summary>
                    <div className="collapsible-body">
                      <div className="collapsible-body-inner">
                        <div className="list" style={{ marginTop: 12 }}>
                          {tile.rows.map((row: any, rowIndex: number) =>
                            renderMaterialItemRow(template, row, `${tile.key}-row-${rowIndex}`, {
                              showConnectedGuideCount: tile.kind === "item",
                              collapsibleKey: `${tile.key}-item-${rowIndex}`,
                            }),
                          )}
                        </div>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderMaterialTemplateTile(template: any) {
    const connectedGuides = guides.filter((guide: any) =>
      templateAppliesToGuide(template, guide) && (!isOfferMaterialTemplate(template) || guideHasOffer(guide)),
    );
    return (
      <details
        className="tile tile-detail"
        key={template.id}
        onToggle={(event) => {
          const nextOpen = (event.currentTarget as HTMLDetailsElement).open;
          const templateId = Number(template.id);
          const itemKeys = (template.visibleRows ?? [])
            .map((row: any, index: number) => (row.level === "item" ? `${template.id}-item-${index}` : null))
            .filter(Boolean) as string[];
          setOpenMaterialTemplateIds((current) =>
            nextOpen
              ? (current.includes(templateId) ? current : [...current, templateId])
              : current.filter((value) => value !== templateId),
          );
          if (nextOpen) {
            setOpenMaterialItemKeys((current) => Array.from(new Set([...current, ...itemKeys])));
          }
        }}
        open={openMaterialTemplateIds.includes(Number(template.id))}
      >
        <summary>
          <div className="material-summary-row">
            <div>
              <strong>{template.title}</strong>
              <div className="small muted">
                {connectedGuides.length} powiązanych przewodników
              </div>
            </div>
            {(() => {
              const progress = getTemplateCompletion(template, materialItemStateMap);
              return <ProgressCircle completed={progress.completed} total={progress.total} />;
            })()}
          </div>
        </summary>
        <div className="collapsible-body">
          <div className="collapsible-body-inner" style={{ marginTop: 12 }}>
            <p className="muted">{template.description}</p>
            {(template.alternativeOptions ?? []).length ? (
              <div className="list" style={{ marginTop: 12 }}>
                {(template.alternativeOptions ?? []).map((option: string, index: number) => (
                  <div className="list-item" key={`${template.id}-${index}`}>
                    <h3>Alternatywa</h3>
                    <p className="muted">{option}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {(template.visibleRows ?? []).length ? (
              <div className="list" style={{ marginTop: 12 }}>
                {(template.visibleRows ?? []).map((row: any, index: number) => {
                  const applicableGuides = guides.filter((guide: any) => rowAppliesToGuide(row, guide));
                  const universityNames = uniqueStrings(applicableGuides.map((guide: any) => formatGuidePrimaryLabel(guide)));
                  const countryNames = uniqueStrings(applicableGuides.map((guide: any) => guide.country));
                  const headline =
                    row.level === "country"
                      ? (row.country || countryNames[0] || "Kraj")
                      : row.level === "university"
                        ? (row.university || universityNames[0] || "Uczelnia")
                        : (row.task || "Zadanie");
                  const showHints =
                    row.guideId &&
                    applicableGuides.some((guide: any) => hintEligibleTemplateIds.includes(getGuideTemplateId(guide)));
                  const hintGuide = row.guideId ? hintGuideMap.get(String(row.guideId)) : null;
                  if (row.level === "country") {
                    return (
                      <div className="material-heading material-heading-country" key={`${template.id}-row-${index}`}>
                        <h3>{headline}</h3>
                      </div>
                    );
                  }
                  if (row.level === "university") {
                    return (
                      <div className="material-heading material-heading-university" key={`${template.id}-row-${index}`}>
                        <h3>{headline}</h3>
                      </div>
                    );
                  }
                  return renderMaterialItemRow(template, row, `${template.id}-row-${index}`, {
                    collapsibleKey: `${template.id}-item-${index}`,
                  });
                })}
              </div>
            ) : null}
          </div>
        </div>
      </details>
    );
  }

  function renderMaterialSectionCard(
    heading: string,
    intro: string,
    templates: any[],
    emptyMessage: string,
  ) {
    return (
      <div className="stack">
        <div className="dashboard-card">
          <h2>{heading}</h2>
          <p className="muted">{intro}</p>
          {googleWorkspace?.folderUrl || googleWorkspace?.essayDocUrl ? (
            <div className="button-row" style={{ marginTop: 16 }}>
              {googleWorkspace?.folderUrl ? (
                <a className="btn btn-secondary" href={googleWorkspace.folderUrl} target="_blank" rel="noreferrer">
                  Otwórz folder Google Drive
                </a>
              ) : null}
              {googleWorkspace?.essayDocUrl ? (
                <a className="btn btn-secondary" href={googleWorkspace.essayDocUrl} target="_blank" rel="noreferrer">
                  Otwórz Essay Doc
                </a>
              ) : null}
            </div>
          ) : null}
          {templates.length ? (
            heading === "Twoje Eseje" ? (
              <div className="stack">
                {templates.map((template: any) => renderEssayTemplateTile(template))}
              </div>
            ) : (
              <div className="tile-grid tile-grid-two" style={{ marginTop: 18 }}>
                {templates.map((template: any) => renderMaterialTemplateTile(template))}
              </div>
            )
          ) : (
            <div className="status" style={{ marginTop: 18 }}>{emptyMessage}</div>
          )}
        </div>
      </div>
    );
  }

  function renderOfferStatusPicker() {
    return (
      <div className="list" style={{ marginTop: 18 }}>
        {guides.map((guide: any) => {
          const currentStatus = String(guide.offerStatus ?? "none");
          const actionPrefix = `guide:${guide.id}:offer:`;
          return (
            <div className="list-item" key={`offer-guide-${guide.id}`}>
              <header>
                <div>
                  <h3>{formatGuidePrimaryLabel(guide)}</h3>
                  <div className="muted small">{formatGuideSecondaryLabel(guide)}</div>
                </div>
                <span className="badge">{offerStatusLabel(currentStatus)}</span>
              </header>
              <div className="button-row" style={{ marginTop: 12 }}>
                <button
                  className={currentStatus === "none" ? "btn btn-primary" : "btn btn-secondary"}
                  disabled={materialActionKey === `${actionPrefix}none`}
                  onClick={() => void updateGuideOfferStatus(guide.id, "none")}
                  type="button"
                >
                  Brak oferty
                </button>
                <button
                  className={currentStatus === "conditional" ? "btn btn-primary" : "btn btn-secondary"}
                  disabled={materialActionKey === `${actionPrefix}conditional`}
                  onClick={() => void updateGuideOfferStatus(guide.id, "conditional")}
                  type="button"
                >
                  Oferta warunkowa
                </button>
                <button
                  className={currentStatus === "final" ? "btn btn-primary" : "btn btn-secondary"}
                  disabled={materialActionKey === `${actionPrefix}final`}
                  onClick={() => void updateGuideOfferStatus(guide.id, "final")}
                  type="button"
                >
                  Oferta finalna
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <FloatingStatus message={status || getMaterialActionStatusMessage(materialActionKey)} />
      {section === "universities" && overview ? (
        <div className="stack">
          <div className="dashboard-card">
            <h2>Twoje Uczelnie</h2>
            <p className="muted">Tutaj widzisz swoje aktywne uczelnie. Po kliknięciu kafla otwierasz checklistę i wymagania przypisane do tej konkretnej aplikacji.</p>
            <div className="status" style={{ marginTop: 16 }}>
              Możesz mieć jednocześnie do <strong>{guideLimits.maxActiveGuideCount}</strong> aktywnych programów.
            </div>
            <div className="tile-grid tile-grid-two" style={{ marginTop: 18 }}>
              {guides.map((guide: any) => (
                <details className="tile tile-detail" key={guide.id}>
                  <summary>
                    <strong>{formatGuidePrimaryLabel(guide)}</strong>
                  </summary>
                  <div className="collapsible-body">
                    <div className="collapsible-body-inner" style={{ marginTop: 12 }}>
                      <p className="muted">{guide.summary}</p>
                      {guide.descriptionMarkdown ? (
                        <div className="status" style={{ marginBottom: 12 }}>
                          {guide.descriptionMarkdown}
                        </div>
                      ) : null}
                      <div className="button-row" style={{ marginBottom: 12 }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => void resignUniversity(guide.id)}
                          type="button"
                        >
                          Zrezygnuj z tej uczelni
                        </button>
                      </div>
                      {guideMaterialsMap.get(guide.id)?.length ? (
                        <div className="list">
                          {guideMaterialsMap.get(guide.id)?.map((template: any) => (
                            <details
                              className="list-item nested-detail"
                              key={`${guide.id}-${template.id}`}
                              onToggle={(event) => {
                                const nextOpen = (event.currentTarget as HTMLDetailsElement).open;
                                const itemKeys = (template.visibleRows ?? [])
                                  .map((row: any, index: number) => (row.level === "item" ? `${guide.id}-${template.id}-item-${index}` : null))
                                  .filter(Boolean) as string[];
                                if (nextOpen) {
                                  setOpenMaterialItemKeys((current) => Array.from(new Set([...current, ...itemKeys])));
                                }
                              }}
                            >
                            <summary>
                              <div className="material-summary-row">
                                <h3>{template.title}</h3>
                                {(() => {
                                  const progress = getTemplateCompletionForGuide(template, guide, materialItemStateMap);
                                  return <ProgressCircle completed={progress.completed} total={progress.total} />;
                                })()}
                              </div>
                            </summary>
                              <div className="collapsible-body">
                                <div className="collapsible-body-inner">
                                  {template.description ? <p className="muted" style={{ marginTop: 10 }}>{template.description}</p> : null}
                                  {template.visibleRows?.length ? (
                                    <div className="list" style={{ marginTop: 10 }}>
                                      {template.visibleRows
                                        .filter((row: any) => row.level === "item")
                                        .map((row: any, index: number) => {
                                          const applicableGuides = guides.filter((entry: any) => rowAppliesToGuide(row, entry));
                                          const universityNames = uniqueStrings(applicableGuides.map((entry: any) => formatGuidePrimaryLabel(entry)));
                                          const showHints = row.guideId && hintEligibleTemplateIds.includes(getGuideTemplateId(guide));
                                          const hintGuide = row.guideId ? hintGuideMap.get(String(row.guideId)) : null;
                                          const hintExists = Boolean(row.guideId && hintGuide);
                                          return (
                                            <details
                                              className="list-item nested-detail material-row material-row-item"
                                              key={`${guide.id}-${template.id}-row-${index}`}
                                              onToggle={(event) => {
                                                const nextOpen = (event.currentTarget as HTMLDetailsElement).open;
                                                const collapsibleKey = `${guide.id}-${template.id}-item-${index}`;
                                                setOpenMaterialItemKeys((current) =>
                                                  nextOpen
                                                    ? (current.includes(collapsibleKey) ? current : [...current, collapsibleKey])
                                                    : current.filter((value) => value !== collapsibleKey),
                                                );
                                              }}
                                              open={openMaterialItemKeys.includes(`${guide.id}-${template.id}-item-${index}`)}
                                            >
                                              <summary>
                                                <div className="material-summary-row">
                                                  <h3>{row.task || "Zadanie"}</h3>
                                                  <CompletionDot
                                                    completed={getMaterialItemCompleted(
                                                      materialItemStateMap.get(`${template.id}:${row.displayKey}`),
                                                    )}
                                                  />
                                                </div>
                                              </summary>
                                              <div className="collapsible-body">
                                                <div className="collapsible-body-inner" style={{ marginTop: 12 }}>
                                                  {universityNames.length ? (
                                                    <div className="small muted">{formatUniversityNamesPreview(universityNames)}</div>
                                                  ) : null}
                                                  <div className="button-row" style={{ marginTop: 8 }}>
                                                    <button
                                                      className="btn btn-secondary"
                                                      disabled={!hintExists}
                                                      onClick={() => {
                                                        if (showHints && hintGuide) {
                                                          setOpenHintGuide(hintGuide);
                                                          return;
                                                        }
                                                        if (hintExists) {
                                                          openPurchaseShell(
                                                            "Wskazówki są poza Twoim obecnym pakietem",
                                                            "Masz dostęp do programu, ale nie do wskazówek dla tego programu. Możesz je odblokować z poziomu zakładki Pakiety.",
                                                            "Odblokuj wskazówki",
                                                            "hint_locked",
                                                          );
                                                        }
                                                      }}
                                                      type="button"
                                                    >
                                                      {showHints ? "Pokaż wskazówkę" : hintExists ? "Odblokuj wskazówki" : "Brak wskazówek"}
                                                    </button>
                                                    <button
                                                      className="btn btn-secondary"
                                                      onClick={() => onNavigate(getTemplateDestinationSection(template), Number(template.id))}
                                                      type="button"
                                                    >
                                                      {isEssayMaterialTemplate(template)
                                                        ? "Pokaż w Twoje Eseje"
                                                        : isOfferMaterialTemplate(template)
                                                          ? "Pokaż w Twoje Oferty"
                                                          : "Pokaż w Twoje Materiały"}
                                                    </button>
                                                  </div>
                                                  {row.alternativeOptions?.length ? (
                                                    <div className="small muted" style={{ marginTop: 6 }}>
                                                      Alternatywnie: {row.alternativeOptions.join(" • ")}
                                                    </div>
                                                  ) : null}
                                                </div>
                                              </div>
                                            </details>
                                          );
                                        })}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </details>
                          ))}
                        </div>
                      ) : (
                        <div className="status">Dla tej uczelni nie ma jeszcze przypiętych materiałów.</div>
                      )}
                    </div>
                  </div>
                </details>
              ))}
            </div>
            {!guides.length ? <div className="status">Nie masz jeszcze żadnej aktywnej uczelni.</div> : null}
          </div>
          <div className="dashboard-card">
            <h2>Dostęp do wskazówek</h2>
            <p className="muted">
              Wskazówki są aktywne maksymalnie dla <strong>{guideLimits.maxHintGuideCount}</strong> programów.
            </p>
            {activeGuideHintCards.length ? (
              <div className="tile-grid tile-grid-two compact-guide-grid" style={{ marginTop: 16 }}>
                {activeGuideHintCards.map(({ guide, hasHintAccess }: any) => (
                  <div
                    className={`tile compact-guide-tile ${hasHintAccess ? "" : "locked-guide-tile"}`}
                    key={`tip-access-guide-${guide.id}`}
                  >
                    <strong>{formatGuidePrimaryLabel(guide)}</strong>
                    <div className="small muted" style={{ marginTop: 6 }}>{formatGuideSecondaryLabel(guide)}</div>
                    <div className="guide-access-card-actions">
                      {hasHintAccess ? (
                        <button className="btn btn-secondary btn-compact" onClick={() => onNavigate("tips")} type="button">
                          Wyświetl wskazówki
                        </button>
                      ) : (
                        <>
                          <div className="small muted hint-access-note">
                            Brak dostępu do wskazówek
                          </div>
                          <button
                            className="btn btn-secondary btn-compact"
                            onClick={() => void enableHintAccess(Number(guide.sourceGuideId ?? guide.id))}
                            type="button"
                          >
                            Dodaj wskazówki
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="small muted" style={{ marginTop: 12 }}>
                Obecnie nie masz aktywnego dostępu do wskazówek żadnego programu.
              </div>
            )}
          </div>
          {availableGuideTemplates.length ? (
            <div className="dashboard-card panel-scroll">
              <h2>Dodaj kolejną uczelnię</h2>
              <p className="muted">Te uczelnie ACADEA możesz samodzielnie dodać do swojego panelu.</p>
              <div
                className="button-row"
                style={{ alignItems: "end", flexWrap: "wrap", gap: 12, marginTop: 18 }}
              >
                <div className="field" style={{ flex: "1 1 220px", marginBottom: 0 }}>
                  <label>Filtruj po kraju</label>
                  <select
                    value={availableGuideCountryFilter}
                    onChange={(event) => setAvailableGuideCountryFilter(event.target.value)}
                  >
                    <option value="all">Wszystkie kraje</option>
                    {availableGuideCountryOptions.map((country) => (
                      <option key={`available-country-${country}`} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ flex: "1 1 260px", marginBottom: 0 }}>
                  <label>Filtruj po uczelni</label>
                  <select
                    value={availableGuideUniversityFilter}
                    onChange={(event) => setAvailableGuideUniversityFilter(event.target.value)}
                  >
                    <option value="all">Wszystkie uczelnie</option>
                    {availableGuideUniversityOptions.map((university) => (
                      <option key={`available-university-${university}`} value={university}>{university}</option>
                    ))}
                  </select>
                </div>
                {(availableGuideCountryFilter !== "all" || availableGuideUniversityFilter !== "all") ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setAvailableGuideCountryFilter("all");
                      setAvailableGuideUniversityFilter("all");
                    }}
                    type="button"
                  >
                    Wyczyść filtry
                  </button>
                ) : null}
              </div>
              <div className="small muted" style={{ marginTop: 10 }}>
                Pokazano {filteredAvailableGuideTemplates.length} z {availableGuideTemplates.length} dostępnych programów.
              </div>
              <div className="tile-grid tile-grid-two" style={{ marginTop: 18 }}>
                {filteredAvailableGuideTemplates.map((guide: any) => (
                  <div className="tile" key={`available-${guide.id}`}>
                    <strong>{formatGuidePrimaryLabel(guide)}</strong>
                    <div className="small muted" style={{ marginTop: 6 }}>{formatGuideSecondaryLabel(guide)}</div>
                    <p className="muted" style={{ marginTop: 12 }}>{guide.summary}</p>
                    <div className="button-row" style={{ marginTop: 14 }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => void adoptUniversity(guide.id)}
                        type="button"
                      >
                        Dodaj uczelnię
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {!filteredAvailableGuideTemplates.length ? (
                <div className="status" style={{ marginTop: 16 }}>
                  Brak programów pasujących do wybranych filtrów.
                </div>
              ) : null}
            </div>
          ) : null}
          {!(overview.profile as any)?.adminApproved ? (
            <div className="dashboard-card">
              <h2>Podgląd przed pełnym dostępem</h2>
              <p className="muted">Dopóki administrator nie zatwierdzi Twojego konta albo nie nada Ci dostępu do konkretnych uczelni, widzisz tylko ograniczony podgląd dostępnych opcji.</p>
              <div className="list" style={{ marginTop: 16 }}>
                {publicGuides.map((guide) => (
                  <div className="list-item" key={guide.id}>
                    <h3>{guide.title}</h3>
                    <div className="muted small">
                      {formatGuideSecondaryLabel(guide)}
                    </div>
                    <p className="muted">{guide.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {section === "mentors" ? (
        <div className="split">
          <div className="dashboard-card">
            <h2>Mentorzy</h2>
            <p className="muted">Tutaj widzisz profile mentorów. Spotkanie możesz umawiać tylko z tymi, do których administrator nadał Ci dostęp.</p>
            <div className="list">
              {mentors.map((mentor) => (
                <div className="list-item" key={mentor.id}>
                  <header>
                    <div>
                      <h3>{mentor.fullName}</h3>
                      <div className="muted small">{mentor.headline}</div>
                    </div>
                    <span className="badge">{mentor.approved ? "approved" : "preview"}</span>
                  </header>
                  <div style={{ marginTop: 8 }}>{renderMultilineText(mentor.bio)}</div>
                  {mentor.universities?.length ? (
                    <div className="stack" style={{ marginTop: 12 }}>
                      <div className="small muted">Programy i uczelnie</div>
                      <div className="tile-grid tile-grid-two compact-guide-grid mentor-program-grid">
                        {mentor.universities.map((university: any) => (
                          <div className="tile compact-guide-tile mentor-program-tile" key={`mentor-university-${mentor.id}-${university.id}`}>
                            <strong>
                              {university.programName?.trim()
                                ? `${university.programName} - ${university.universityName}`
                                : university.universityName}
                            </strong>
                            <div className="small muted" style={{ marginTop: 6 }}>{university.country}</div>
                            {university.summary ? (
                              <div className="small muted" style={{ marginTop: 8 }}>{university.summary}</div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="small muted" style={{ marginTop: 8 }}>
                    {mentor.googleCalendarConnected
                      ? `Google Calendar podłączony${mentor.googleCalendarEmail ? ` • ${mentor.googleCalendarEmail}` : ""}`
                      : "Google Calendar jeszcze niepodłączony"}
                  </div>
                  {assignedMentors.some((assignedMentor: any) => assignedMentor.mentorId === mentor.id) ? (
                    <div className="button-row">
                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          setMeetingForm((current) => ({
                            ...current,
                            meetingUrl: mentor.meetingLink ?? "",
                            method: mentor.meetingMethod ?? "zoom_link",
                            mentorUserId: String(mentor.id),
                            timezone: mentor.timezone || "Europe/Warsaw",
                          }))
                        }
                        type="button"
                      >
                        Wybierz do spotkania
                      </button>
                    </div>
                  ) : (
                    <div className="button-row">
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          const opened = maybeOpenContextualPopup([
                            `context:mentor_locked:mentor:${mentor.id}`,
                            "mentor_locked",
                          ]);
                          if (!opened) {
                            openPurchaseShell(
                              "Ten mentor wymaga odrębnego dostępu",
                              "Aby umawiać spotkania z tym mentorem, dodaj odpowiedni pakiet lub dostęp mentorski w zakładce Pakiety.",
                              "Kup dostęp do mentora",
                              "mentor_locked",
                            );
                          }
                        }}
                        type="button"
                      >
                        Dodaj mentora
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="dashboard-card">
            <h2>Umów spotkanie</h2>
            <form className="stack" onSubmit={requestMeeting}>
              <TimezoneSelect
                label="Strefa czasowa"
                value={viewerTimezone}
                onChange={(value) => {
                  setViewerTimezone(value);
                  setMentorSlotsMonth(formatMonthKey(new Date(), value));
                }}
              />
              <div className="field">
                <label>Przydzielony mentor</label>
                <select
                  value={meetingForm.mentorUserId}
                  onChange={(event) => {
                    const mentor = assignedMentors.find(
                      (entry: any) => String(entry.mentorId) === event.target.value,
                    );
                    setMeetingForm((current) => ({
                      ...current,
                      meetingUrl: mentor?.meetingLink ?? "",
                      method: mentor?.meetingMethod ?? "zoom_link",
                      mentorUserId: event.target.value,
                      timezone: mentor?.timezone || "Europe/Warsaw",
                    }));
                  }}
                >
                  <option value="">Wybierz mentora</option>
                  {assignedMentors.map((mentor: any) => (
                    <option key={mentor.mentorId} value={String(mentor.mentorId)}>
                      {mentor.fullName}
                    </option>
                  ))}
                </select>
              </div>
              {selectedMentor?.googleCalendarConnected ? (
                <div className="stack">
                  <div className="small muted">
                    Sloty pokazane w Twojej strefie czasowej: <strong>{viewerTimezone}</strong>. Kalendarz mentora działa w strefie: <strong>{mentorSlotsTimezone}</strong>.
                  </div>
                  {mentorSlotsLoading ? (
                    <div className="status">Ładujemy dostępne sloty mentora…</div>
                  ) : !mentorSlotsConnectionReady ? (
                    <div className="status">
                      Mentor połączył konto Google, ale platforma nie odczytała jeszcze jego głównego kalendarza. Odśwież stronę za chwilę lub poproś mentora o ponowne połączenie, jeśli problem nie zniknie.
                    </div>
                  ) : (
                    <div className="stack">
                      <div className="button-row" style={{ justifyContent: "space-between" }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setMentorSlotsMonth((current) => shiftMonthKey(current, -1))}
                          disabled={mentorSlotsMonth <= formatMonthKey(new Date(), viewerTimezone)}
                          type="button"
                        >
                          Poprzedni miesiąc
                        </button>
                        <strong style={{ textTransform: "capitalize" }}>
                          {formatMonthHeading(mentorSlotsMonth, viewerTimezone)}
                        </strong>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setMentorSlotsMonth((current) => shiftMonthKey(current, 1))}
                          disabled={Boolean(selectedMentorMaxMonth && mentorSlotsMonth >= selectedMentorMaxMonth)}
                          type="button"
                        >
                          Następny miesiąc
                        </button>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                          gap: 8,
                        }}
                      >
                        {["nd", "pn", "wt", "śr", "czw", "pt", "sob"].map((label) => (
                          <div className="small muted" key={label} style={{ textAlign: "center" }}>
                            {label}
                          </div>
                        ))}
                        {mentorMonthCells.map((cell) =>
                          cell.kind === "empty" ? (
                            <div key={cell.key} />
                          ) : (
                            <button
                              className={selectedMentorDayKey === cell.dateKey ? "btn btn-primary" : "btn btn-secondary"}
                              disabled={cell.availableCount === 0}
                              key={cell.key}
                              onClick={() => setSelectedMentorDayKey(cell.dateKey)}
                              style={{
                                minHeight: 64,
                                padding: "10px 8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: cell.availableCount === 0 ? 0.5 : 1,
                              }}
                              type="button"
                            >
                              <strong>{cell.dayNumber}</strong>
                            </button>
                          ),
                        )}
                      </div>

                      {selectedMentorDay ? (
                        <div className="list-item">
                          <h3 style={{ marginBottom: 10 }}>{selectedMentorDay.dayLabel}</h3>
                          <div className="button-row">
                            {selectedMentorDay.slots.map((slot) => {
                              const isSelected =
                                meetingForm.startsAt === slot.start &&
                                meetingForm.endsAt === slot.end;
                              return (
                                <button
                                  className={isSelected ? "btn btn-primary" : "btn btn-secondary"}
                                  key={slot.start}
                                  onClick={() =>
                                    setMeetingForm((current) => ({
                                      ...current,
                                      endsAt: slot.end,
                                      startsAt: slot.start,
                                    }))
                                  }
                                  type="button"
                                >
                                  {slot.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="status">
                          Wybierz najpierw konkretny dzień w kalendarzu, aby zobaczyć godziny.
                        </div>
                      )}

                      {!Object.keys(mentorSlotDayIndex).length ? (
                        <div className="status">W tym miesiącu nie ma jeszcze wolnych slotów tego mentora.</div>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}
              {selectedMentor && !selectedMentor.googleCalendarConnected ? (
                <div className="grid-2">
                  <div className="field">
                    <label>Start</label>
                    <input type="datetime-local" value={meetingForm.startsAt} onChange={(event) => setMeetingForm((current) => ({ ...current, startsAt: event.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Koniec</label>
                    <input type="datetime-local" value={meetingForm.endsAt} onChange={(event) => setMeetingForm((current) => ({ ...current, endsAt: event.target.value }))} />
                  </div>
                </div>
              ) : null}
              {selectedMentor ? (
                <div className="field">
                  <label>Opis spotkania</label>
                  <textarea value={meetingForm.description} onChange={(event) => setMeetingForm((current) => ({ ...current, description: event.target.value }))} />
                </div>
              ) : null}
              <div className="stack" style={{ gap: 8 }}>
                <TurnstileWidget onTokenChange={setMeetingTurnstileToken} resetKey={meetingTurnstileResetKey} />
                {isTurnstileEnabled() ? (
                  <div className="small muted">
                    Krótkie potwierdzenie antybotowe przed wysłaniem rezerwacji.
                  </div>
                ) : null}
              </div>
              <button className="btn btn-primary" disabled={!meetingForm.mentorUserId || !meetingForm.startsAt || !meetingForm.endsAt}>
                {selectedMentor?.googleCalendarConnected ? "Zarezerwuj spotkanie" : "Zapisz prośbę o spotkanie"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      {section === "meetings" && overview ? (
        <div className="dashboard-card">
          <h2>Twoje spotkania</h2>
          <div className="button-row" style={{ marginTop: 16 }}>
            {([
              ["upcoming", "Nadchodzące"],
              ["past", "Po czasie"],
              ["cancelled", "Anulowane"],
            ] as const).map(([value, label]) => (
              <button
                className={meetingFilter === value ? "btn btn-primary" : "btn btn-secondary"}
                key={value}
                onClick={() => {
                  setMeetingFilter(value);
                  setRescheduleMeetingId(null);
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="list" style={{ marginTop: 16 }}>
            {filteredMenteeMeetings.map((meeting: any) => (
              <div className="list-item" key={meeting.id}>
                <header>
                  <div>
                    <h3>{meeting.title}</h3>
                    <div className="muted small">{meeting.mentorName ? `Mentor: ${meeting.mentorName}` : null}</div>
                    <div className="muted small">{formatMeetingDateRange(meeting, meeting.timezone || "Europe/Warsaw")}</div>
                  </div>
                  <span className="badge">{formatMeetingStatusLabel(meeting.status)}</span>
                </header>
                {meeting.description ? <p className="muted">{meeting.description}</p> : null}
                <div className="button-row" style={{ marginTop: 12 }}>
                  {meeting.meetingUrl ? (
                    <a className="btn btn-secondary" href={meeting.meetingUrl} target="_blank" rel="noreferrer">
                      Otwórz spotkanie
                    </a>
                  ) : null}
                  {meeting.canCancel ? (
                    <button
                      className="btn btn-secondary"
                      disabled={meetingActionKey === `${meeting.id}:cancel`}
                      onClick={() => void cancelMenteeMeeting(meeting.id)}
                      type="button"
                    >
                      Anuluj spotkanie
                    </button>
                  ) : null}
                  {meeting.canCancel && (meeting.rescheduleCount ?? 0) < 1 ? (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setRescheduleMeetingId((current) => (current === meeting.id ? null : meeting.id));
                        setRescheduleMonth(formatMonthKey(new Date(), viewerTimezone));
                      }}
                      type="button"
                    >
                      Przełóż spotkanie
                    </button>
                  ) : null}
                </div>
                {meeting.meetingContactValue ? (
                  <div className="small muted" style={{ marginTop: 8, wordBreak: "break-all" }}>
                    {meeting.meetingContactValue}
                  </div>
                ) : null}
                {meeting.status === "cancelled" ? (
                  <div className="small muted" style={{ marginTop: 8 }}>
                    Anulował: {meeting.cancelledByRole || "nieznany"} • {meeting.cancelledMinutesBeforeStart ?? 0} min przed startem
                  </div>
                ) : null}
                {meeting.rescheduleCount ? (
                  <div className="small muted" style={{ marginTop: 8 }}>
                    Spotkanie zostało przełożone {meeting.rescheduleCount} raz.
                  </div>
                ) : null}
                {meeting.id === rescheduleMeetingId ? (
                  <div className="stack" style={{ marginTop: 16 }}>
                    {rescheduleMentor?.googleCalendarConnected ? (
                      <>
                        {rescheduleSlotsLoading ? (
                          <div className="status">Ładujemy nowe terminy mentora…</div>
                        ) : !rescheduleSlotsConnectionReady ? (
                          <div className="status">Mentor nie ma obecnie gotowych slotów do automatycznego przełożenia.</div>
                        ) : (
                          <>
                            <div className="button-row" style={{ justifyContent: "space-between" }}>
                              <button className="btn btn-secondary" onClick={() => setRescheduleMonth((current) => shiftMonthKey(current, -1))} type="button">
                                Poprzedni miesiąc
                              </button>
                              <strong style={{ textTransform: "capitalize" }}>{formatMonthHeading(rescheduleMonth, viewerTimezone)}</strong>
                              <button className="btn btn-secondary" onClick={() => setRescheduleMonth((current) => shiftMonthKey(current, 1))} type="button">
                                Następny miesiąc
                              </button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 8 }}>
                              {["nd", "pn", "wt", "śr", "czw", "pt", "sob"].map((label) => (
                                <div className="small muted" key={label} style={{ textAlign: "center" }}>{label}</div>
                              ))}
                              {rescheduleMonthCells.map((cell) =>
                                cell.kind === "empty" ? (
                                  <div key={cell.key} />
                                ) : (
                                  <button
                                    className={selectedRescheduleDayKey === cell.dateKey ? "btn btn-primary" : "btn btn-secondary"}
                                    disabled={cell.availableCount === 0}
                                    key={cell.key}
                                    onClick={() => setSelectedRescheduleDayKey(cell.dateKey)}
                                    type="button"
                                  >
                                    {cell.dayNumber}
                                  </button>
                                ),
                              )}
                            </div>
                            {selectedRescheduleDay ? (
                              <div className="button-row">
                                {selectedRescheduleDay.slots.map((slot) => {
                                  const isSelected = rescheduleDraft.startsAt === slot.start && rescheduleDraft.endsAt === slot.end;
                                  return (
                                    <button
                                      className={isSelected ? "btn btn-primary" : "btn btn-secondary"}
                                      key={slot.start}
                                      onClick={() => setRescheduleDraft({ endsAt: slot.end, startsAt: slot.start, timezone: viewerTimezone })}
                                      type="button"
                                    >
                                      {slot.label}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="grid-2">
                        <div className="field">
                          <label>Nowy start</label>
                          <input type="datetime-local" value={rescheduleDraft.startsAt} onChange={(event) => setRescheduleDraft((current) => ({ ...current, startsAt: event.target.value }))} />
                        </div>
                        <div className="field">
                          <label>Nowy koniec</label>
                          <input type="datetime-local" value={rescheduleDraft.endsAt} onChange={(event) => setRescheduleDraft((current) => ({ ...current, endsAt: event.target.value }))} />
                        </div>
                      </div>
                    )}
                    <div className="button-row">
                      <button
                        className="btn btn-primary"
                        disabled={meetingActionKey === `${meeting.id}:reschedule`}
                        onClick={() => void saveMeetingReschedule(meeting.id)}
                        type="button"
                      >
                        Zapisz nowy termin
                      </button>
                      <button className="btn btn-secondary" onClick={() => setRescheduleMeetingId(null)} type="button">
                        Anuluj zmianę
                      </button>
                    </div>
                  </div>
                ) : null}
                {meeting.canMarkOccurred ? (
                  <div className="button-row" style={{ marginTop: 12 }}>
                    <button
                      className="btn btn-secondary"
                      disabled={meetingActionKey === `${meeting.id}:occurred:yes`}
                      onClick={() => void markMenteeMeetingOccurred(meeting.id, true)}
                      type="button"
                    >
                      Spotkanie się odbyło
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={meetingActionKey === `${meeting.id}:occurred:no`}
                      onClick={() => void markMenteeMeetingOccurred(meeting.id, false)}
                      type="button"
                    >
                      Spotkanie się nie odbyło
                    </button>
                  </div>
                ) : null}
                <div className="field" style={{ marginTop: 12 }}>
                  <label>Twoje notatki do spotkania</label>
                  <textarea
                    placeholder="Tutaj możesz zapisać własne notatki przed albo po spotkaniu."
                    value={meetingNoteDrafts[meeting.id] ?? ""}
                    onChange={(event) =>
                      setMeetingNoteDrafts((current) => ({
                        ...current,
                        [meeting.id]: event.target.value,
                      }))
                    }
                  />
                  <div className="button-row">
                    <button
                      className="btn btn-secondary"
                      disabled={meetingActionKey === `${meeting.id}:notes`}
                      onClick={() => void saveMenteeMeetingNotes(meeting.id, meetingNoteDrafts[meeting.id] ?? "")}
                      type="button"
                    >
                      Zapisz notatki
                    </button>
                  </div>
                </div>
                {meeting.isSuspicious ? (
                  <div className="status" style={{ marginTop: 12 }}>
                    Rozbieżność: Ty i mentor inaczej oznaczyliście, czy spotkanie się odbyło.
                  </div>
                ) : null}
              </div>
            ))}
            {!filteredMenteeMeetings.length ? <div className="status">Brak spotkań w tej kategorii.</div> : null}
          </div>
        </div>
      ) : null}
      {section === "profile" && overview ? (
        <div className="dashboard-card">
          <h2>Twoje Dane</h2>
          <p className="muted">To jest pełny formularz danych aplikacyjnych. Administrator może z czasem dodawać tutaj kolejne pola wymagane przez uczelnie.</p>
          <form className="stack" onSubmit={saveProfileResponses} style={{ marginTop: 18 }}>
            {Array.from(new Set(profileFields.map((field: any) => String(field.sectionTitle)))) .map((sectionTitle: string) => (
              <div className="stack" key={sectionTitle} style={{ paddingTop: 4 }}>
                <h3 style={{ margin: "0 0 6px", color: "#153f2c" }}>{sectionTitle}</h3>
                {profileFields
                  .filter((field: any) => field.sectionTitle === sectionTitle)
                  .map((field: any) => (
                    <div className="field" key={field.id}>
                      <label>{field.label}{field.isRequired ? " *" : ""}</label>
                      {field.fieldType === "textarea" ? (
                        <textarea
                          placeholder={field.placeholder ?? ""}
                          value={profileValues[String(field.id)] ?? ""}
                          onChange={(event) => setProfileValues((current) => ({ ...current, [String(field.id)]: event.target.value }))}
                        />
                      ) : (
                        <input
                          type={field.fieldType === "date" ? "date" : "text"}
                          placeholder={field.placeholder ?? ""}
                          value={profileValues[String(field.id)] ?? ""}
                          onChange={(event) => setProfileValues((current) => ({ ...current, [String(field.id)]: event.target.value }))}
                        />
                      )}
                      {field.description ? <div className="small muted">{field.description}</div> : null}
                    </div>
                  ))}
              </div>
            ))}
            <button className="btn btn-primary">Zapisz Twoje Dane</button>
          </form>
        </div>
      ) : null}
      {section === "offers" && overview ? (
        <div className="stack">
          <div className="dashboard-card">
            <h2>Twoje Oferty</h2>
            <p className="muted">
              Najpierw zaznacz, z których programów masz już ofertę warunkową albo finalną. Dopiero wtedy poniżej pokażą się dalsze kroki po ofercie.
            </p>
            {guides.length ? (
              renderOfferStatusPicker()
            ) : (
              <div className="status" style={{ marginTop: 18 }}>
                Nie masz jeszcze żadnych aktywnych programów w panelu.
              </div>
            )}
          </div>
          <div className="dashboard-card">
            <h2>Kroki Po Ofercie</h2>
            <p className="muted">
              Tutaj zbierają się zadania, które wykonujesz dopiero po otrzymaniu oferty warunkowej albo finalnej: akceptacja miejsca, dokumenty po ofercie, opłaty, enrollment i podobne formalności.
            </p>
            {googleWorkspace?.folderUrl || googleWorkspace?.essayDocUrl ? (
              <div className="button-row" style={{ marginTop: 16 }}>
                {googleWorkspace?.folderUrl ? (
                  <a className="btn btn-secondary" href={googleWorkspace.folderUrl} target="_blank" rel="noreferrer">
                    Otwórz folder Google Drive
                  </a>
                ) : null}
                {googleWorkspace?.essayDocUrl ? (
                  <a className="btn btn-secondary" href={googleWorkspace.essayDocUrl} target="_blank" rel="noreferrer">
                    Otwórz Essay Doc
                  </a>
                ) : null}
              </div>
            ) : null}
            {visibleOfferTemplates.length ? (
              <div className="tile-grid tile-grid-two" style={{ marginTop: 18 }}>
                {visibleOfferTemplates.map((template: any) => renderMaterialTemplateTile(template))}
              </div>
            ) : (
              <div className="status" style={{ marginTop: 18 }}>
                Zaznacz najpierw ofertę przy konkretnym programie, aby zobaczyć dalsze kroki po ofercie.
              </div>
            )}
          </div>
        </div>
      ) : null}
      {section === "emails" ? (
        <div className="dashboard-card locked-panel-card">
          <h2>Twoje Maile od Uczelni</h2>
          <p className="muted">
            Ten moduł monitoruje wiadomości z domen uczelni przypisanych do Twoich aktywnych programów i podpowiada, czy trzeba coś zrobić dalej.
          </p>
          {!guideLimits.emailInboxEnabled ? (
            <div className="locked-panel-shell">
              <div className="locked-panel-content">
                <h3>Dostęp zablokowany</h3>
                <p className="muted">
                  Ta funkcja wymaga osobnego pakietu. Po odblokowaniu połączysz konto Google i zobaczysz maile z uczelni oraz ich automatyczną analizę.
                </p>
                <div className="button-row" style={{ justifyContent: "center" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      openPurchaseShell(
                        "Odblokuj maile od uczelni",
                        "Ten moduł pozwoli połączyć Gmail, śledzić wiadomości z uczelni i pokazywać, co z nich wynika dla Twojej aplikacji.",
                        "Kup dostęp do maili uczelni",
                        "email_locked",
                      )
                    }
                    type="button"
                  >
                    Odblokuj dostęp
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="stack" style={{ marginTop: 18 }}>
              <div className="status">
                {(() => {
                  const gmailConnection = googleConnections.find(
                    (connection: any) => connection.connectionType === "gmail_readonly" && connection.status === "connected",
                  );
                  return (
                    <>
                      Status połączenia Gmail: <strong>{gmailConnection ? "połączono" : "nie połączono"}</strong>
                      {gmailConnection?.externalEmail ? ` (${gmailConnection.externalEmail})` : ""}
                    </>
                  );
                })()}
              </div>
              <div className="button-row">
                {googleConnections.some((connection: any) => connection.connectionType === "gmail_readonly" && connection.status === "connected") ? (
                  <>
                    <button className="btn btn-primary" onClick={() => void refreshUniversityEmails()} type="button">
                      Odśwież maile
                    </button>
                    <button className="btn btn-secondary" onClick={() => void disconnectUniversityEmailInbox()} type="button">
                      Odłącz Gmail
                    </button>
                  </>
                ) : (
                  <button className="btn btn-primary" onClick={() => void connectUniversityEmailInbox()} type="button">
                    Połącz Gmail
                  </button>
                )}
              </div>
              <div className="list">
                {universityEmails.length ? (
                  universityEmails.map((email: any) => (
                    <div className="list-item" key={email.id}>
                      <header>
                        <div>
                          <h3>{email.subject || "(bez tematu)"}</h3>
                          <div className="muted small">{email.fromEmail || email.fromName || "Nieznany nadawca"}</div>
                        </div>
                        <span className="badge">{email.classification}</span>
                      </header>
                      <p className="muted">{email.snippet}</p>
                      <div className="small">
                        {email.actionRequired ? "Wymagane działanie" : "Informacyjnie"} • {email.actionSummary}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="status">Po połączeniu Gmaila i odświeżeniu tutaj pokażą się wiadomości z uczelni.</div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
      {section === "tips" ? (
        <div className="stack">
          <div className="dashboard-card">
            <h2>Twoje Wskazówki</h2>
            <p className="muted">
              Tutaj zbierają się wszystkie programy, dla których masz dostęp do wskazówek, oraz te, które możesz jeszcze odblokować.
            </p>
            <div className="status" style={{ marginTop: 16 }}>
              Aktywne wskazówki dla <strong>{accessibleTipProgramCards.length}</strong> programów.
              {" "}
              Bez dostępu pozostaje <strong>{lockedTipProgramCards.length}</strong> programów.
            </div>
          </div>
          <div className="dashboard-card">
            <h3 style={{ marginTop: 0 }}>Programy z aktywnymi wskazówkami</h3>
            {accessibleTipProgramCards.length ? (
              <div className="tile-grid tile-grid-two compact-guide-grid" style={{ marginTop: 16 }}>
                {accessibleTipProgramCards.map((entry: any) => (
                  <div className="tile compact-guide-tile tip-program-tile" key={`tips-program-${entry.guide.id}`}>
                    <strong>{formatGuidePrimaryLabel(entry.guide)}</strong>
                    <div className="small muted" style={{ marginTop: 6 }}>{formatGuideSecondaryLabel(entry.guide)}</div>
                    <div className="small muted" style={{ marginTop: 8 }}>
                      {entry.items.length} {entry.items.length === 1 ? "powiązana wskazówka" : "powiązane wskazówki"}
                    </div>
                    <div className="list" style={{ marginTop: 12 }}>
                      {entry.items.map((item: any) => (
                        <div className="list-item compact-tip-item" key={item.key}>
                          <div>
                            <strong>{item.task}</strong>
                            <div className="small muted">{item.templateTitle}</div>
                          </div>
                          <button
                            className="btn btn-secondary btn-compact"
                            onClick={() => setOpenHintGuide(item.hintGuide)}
                            type="button"
                          >
                            Otwórz wskazówki
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="status" style={{ marginTop: 16 }}>Nie masz jeszcze aktywnego dostępu do wskazówek żadnego programu.</div>
            )}
          </div>
          <div className="dashboard-card">
            <h3 style={{ marginTop: 0 }}>Programy bez dostępu do wskazówek</h3>
            {lockedTipProgramCards.length ? (
              <div className="tile-grid tile-grid-two compact-guide-grid" style={{ marginTop: 16 }}>
                {lockedTipProgramCards.map((entry: any) => (
                  <div className="tile compact-guide-tile locked-guide-tile" key={`tips-locked-${entry.guide.id}`}>
                    <strong>{formatGuidePrimaryLabel(entry.guide)}</strong>
                    <div className="small muted" style={{ marginTop: 6 }}>{formatGuideSecondaryLabel(entry.guide)}</div>
                    <div className="small muted hint-access-note" style={{ marginTop: 12 }}>
                      {entry.lockedItemCount
                        ? `${entry.lockedItemCount} ${(entry.lockedItemCount === 1 ? "krok ma" : "kroki mają")} dostępne wskazówki po odblokowaniu`
                        : "Brak dostępu do wskazówek"}
                    </div>
                    <div className="button-row" style={{ marginTop: 12 }}>
                      <button
                        className="btn btn-secondary btn-compact"
                        onClick={() => void enableHintAccess(Number(entry.guide.sourceGuideId ?? entry.guide.id))}
                        type="button"
                      >
                        Dodaj wskazówki
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="status" style={{ marginTop: 16 }}>Masz już dostęp do wskazówek wszystkich swoich aktywnych programów.</div>
            )}
          </div>
        </div>
      ) : null}
      {section === "packages" ? (
        <div className="dashboard-card">
          <h2>Pakiety</h2>
          <p className="muted">
            Tutaj możesz dokupić większy limit programów, wskazówek, dostęp do mentorów, maile uczelni i więcej miejsca na pliki.
          </p>
          <div className="status" style={{ marginTop: 16 }}>
            Obecny limit: <strong>{guideLimits.maxActiveGuideCount}</strong> programów, <strong>{guideLimits.maxHintGuideCount}</strong> wskazówek, <strong>{guideLimits.maxStorageMb} MB</strong> miejsca.
            Wykorzystane miejsce: <strong>{storageSummary.usedMb} MB</strong>.
          </div>
          {storageSummary.isOverLimit ? (
            <div className="status" style={{ marginTop: 12 }}>
              {storageSummary.cleanupDueAt
                ? `Przekroczono limit miejsca. Masz czas do ${formatDate(storageSummary.cleanupDueAt)} na usunięcie plików. Po tym terminie najnowsze pliki z folderu Google Drive będą automatycznie przenoszone do kosza, z wyłączeniem Essay Doc.`
                : "Przekroczono limit miejsca. System przygotowuje automatyczny cleanup najnowszych plików z wyłączeniem Essay Doc."}
            </div>
          ) : null}
          <div className="tile-grid tile-grid-two" style={{ marginTop: 18 }}>
            {packages.map((item: any) => {
              const inCart = cartItems.some((cartItem: any) => Number(cartItem.productId) === Number(item.id));
              return (
                <div className="tile" key={item.id}>
                  {item.imageUrl ? <img alt={item.title} src={item.imageUrl} style={{ width: "100%", borderRadius: 18, marginBottom: 12, objectFit: "cover", maxHeight: 180 }} /> : null}
                  <strong>{item.title}</strong>
                  <p className="muted" style={{ marginTop: 12 }}>{item.summary || item.description}</p>
                  <div className="small muted">
                    {(Number(item.priceCents ?? 0) / 100).toFixed(2)} {item.currency}
                  </div>
                  <div className="button-row" style={{ marginTop: 16 }}>
                    {inCart ? (
                      <button className="btn btn-secondary" onClick={() => void removeProductFromCart(item.id)} type="button">
                        Usuń z koszyka
                      </button>
                    ) : (
                      <button className="btn btn-primary" onClick={() => void addProductToCart(item.id)} type="button">
                        Dodaj do koszyka
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="dashboard-card" style={{ marginTop: 22 }}>
            <h3 style={{ marginTop: 0 }}>Koszyk</h3>
            {cartItems.length ? (
              <div className="stack">
                <div className="list">
                  {cartItems.map((cartItem: any) => {
                    const product = packages.find((entry: any) => Number(entry.id) === Number(cartItem.productId));
                    return (
                      <div className="list-item" key={`cart-${cartItem.productId}`}>
                        <header>
                          <div>
                            <h3>{product?.title ?? `Produkt #${cartItem.productId}`}</h3>
                            <div className="muted small">Ilość: {cartItem.quantity}</div>
                          </div>
                          <button className="btn btn-secondary" onClick={() => void removeProductFromCart(cartItem.productId)} type="button">
                            Usuń
                          </button>
                        </header>
                      </div>
                    );
                  })}
                </div>
                <div className="button-row">
                  <button className="btn btn-primary" onClick={() => void checkoutCart()} type="button">
                    Przejdź do płatności
                  </button>
                </div>
              </div>
            ) : (
              <div className="status">Koszyk jest pusty.</div>
            )}
          </div>
        </div>
      ) : null}
      <aside className={`cart-side-panel ${cartDrawerOpen ? "is-open" : ""} ${mobileViewport ? "is-mobile" : ""}`}>
        {mobileViewport ? (
          <button className="cart-side-panel-backdrop" onClick={() => onCartDrawerChange(false)} type="button" />
        ) : null}
        <div className="cart-side-panel-card">
          <div className="cart-side-panel-head">
            <div>
              <div className="eyebrow">Koszyk</div>
              <h3>{cartCount ? `Wybrane produkty (${cartCount})` : "Koszyk jest pusty"}</h3>
            </div>
            <button className="cart-side-panel-close" onClick={() => onCartDrawerChange(false)} type="button">
              ×
            </button>
          </div>
          {cartItems.length ? (
            <div className="stack">
              <div className="list">
                {cartItems.map((cartItem: any) => {
                  const product = packages.find((entry: any) => Number(entry.id) === Number(cartItem.productId));
                  return (
                    <div className="list-item" key={`drawer-cart-${cartItem.productId}`}>
                      <header>
                        <div>
                          <h3>{product?.title ?? `Produkt #${cartItem.productId}`}</h3>
                          <div className="muted small">Ilość: {cartItem.quantity}</div>
                        </div>
                        <button className="btn btn-secondary btn-compact" onClick={() => void removeProductFromCart(cartItem.productId)} type="button">
                          Usuń
                        </button>
                      </header>
                    </div>
                  );
                })}
              </div>
              <div className="button-row">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onNavigate("packages");
                    onCartDrawerChange(false);
                  }}
                  type="button"
                >
                  Podsumowanie pakietów
                </button>
                <button className="btn btn-secondary" onClick={() => void checkoutCart()} type="button">
                  Przejdź do płatności
                </button>
              </div>
            </div>
          ) : (
            <div className="status" style={{ marginTop: 16 }}>Dodane produkty pojawią się tutaj od razu po kliknięciu.</div>
          )}
        </div>
      </aside>
      {section === "essays" && overview
        ? renderMaterialSectionCard(
            "Twoje Eseje",
            "Tutaj zbierają się wszystkie eseje i zadania pisemne powiązane z Twoimi uczelniami. Nadal możesz otwierać wskazówki, wgrywać pliki i tworzyć zakładki w Essay Doc.",
            visibleEssayTemplates,
            "Nie masz jeszcze żadnych aktywnych esejów.",
          )
        : null}
      {section === "materials" && overview
        ? renderMaterialSectionCard(
            "Twoje Materiały",
            "Tutaj zbierają się wszystkie dokumenty i pozostałe materiały wymagane przez Twoje uczelnie. Eseje zostały przeniesione do osobnej zakładki Twoje Eseje.",
            visibleDocumentTemplates,
            "Nie ma jeszcze żadnych materiałów przypisanych do Twoich uczelni.",
          )
        : null}
      {purchasePopup ? (
        <div className="modal-backdrop" onClick={() => setPurchasePopup(null)} role="presentation">
          <div className="modal-card purchase-modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <button className="purchase-modal-close" onClick={() => setPurchasePopup(null)} type="button">
              ×
            </button>
            <div className="eyebrow">Rozszerzenie dostępu</div>
            <h2 style={{ margin: "14px 0 8px", color: "#153f2c" }}>{purchasePopup.title}</h2>
            <p className="muted">{purchasePopup.body}</p>
            <div className="button-row" style={{ marginTop: 18 }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const recommendedProductId = purchasePopup.recommendedProductIds?.[0];
                  if (recommendedProductId) {
                    void addProductToCart(recommendedProductId);
                  }
                  setPurchasePopup(null);
                }}
                type="button"
              >
                {purchasePopup.primaryCtaLabel}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setPurchasePopup(null);
                  onNavigate("packages");
                  onCartDrawerChange(true);
                }}
                type="button"
              >
                {purchasePopup.secondaryCtaLabel ?? "Przejdź do pakietów"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {openHintGuide ? (
        <div className="modal-backdrop" onClick={() => setOpenHintGuide(null)} role="presentation">
          <div className="modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="button-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="eyebrow">Wskazówki</div>
                <h2 style={{ margin: "12px 0 6px", color: "#153f2c" }}>{openHintGuide.title}</h2>
                <div className="small muted">{formatGuideScopeLabel(openHintGuide, hintScopeGuides)}</div>
              </div>
              <button className="btn btn-secondary" onClick={() => setOpenHintGuide(null)} type="button">
                Zamknij
              </button>
            </div>
            {openHintGuide.summary ? (
              <div className="status" style={{ marginTop: 16 }}>
                {openHintGuide.summary}
              </div>
            ) : null}
            <div className="modal-body" style={{ marginTop: 16 }}>
              {openHintGuide.descriptionMarkdown || "Brak treści wskazówek."}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function AppRouter() {
  const session = usePlatformSession();

  if (session.loading) {
    return (
      <AuthShell title="Ładowanie platformy" subtitle="Sprawdzam sesję i przygotowuję odpowiedni panel roli.">
        <div className="status">Chwila…</div>
      </AuthShell>
    );
  }

  return (
    <Switch>
      <Route path="/forgot-password">
        <ForgotPasswordPage />
      </Route>
      <Route path="/reset-password">
        <ResetPasswordPage />
      </Route>
      <Route path="/">
        {session.session && session.token ? (
          <Dashboard onLogout={session.logout} session={session.session} token={session.token} />
        ) : (
          <LoginPage onLogin={session.login} />
        )}
      </Route>
    </Switch>
  );
}

function PlatformSeoManager() {
  const [location] = useLocation();

  useEffect(() => {
    const robotsMeta =
      document.querySelector('meta[name="robots"]') ??
      (() => {
        const meta = document.createElement("meta");
        meta.setAttribute("name", "robots");
        document.head.appendChild(meta);
        return meta;
      })();

    if (location === "/") {
      document.title = "Platforma Acadea";
      robotsMeta.setAttribute("content", "index, follow");
      return;
    }

    if (location === "/forgot-password") {
      document.title = "Reset hasła | Platforma Acadea";
      robotsMeta.setAttribute("content", "noindex, nofollow");
      return;
    }

    if (location === "/reset-password") {
      document.title = "Ustaw nowe hasło | Platforma Acadea";
      robotsMeta.setAttribute("content", "noindex, nofollow");
      return;
    }

    document.title = "Platforma Acadea";
    robotsMeta.setAttribute("content", "noindex, nofollow");
  }, [location]);

  return null;
}

export default function App() {
  return (
    <CookieConsentProvider>
      <GoogleAnalytics />
      <PlatformSeoManager />
      <AppRouter />
    </CookieConsentProvider>
  );
}
