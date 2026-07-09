import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getApiBase } from "@/lib/api-base";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/TurnstileWidget";
import {
  createArticleCategory,
  createArticleCategoryGroup,
  deleteArticleCategory,
  deleteArticleCategoryGroup,
  fetchAdminArticles,
  fetchAdminArticleTaxonomy,
  type ArticleEditorRecord,
} from "@/lib/article-api";
import {
  ARTICLE_CONTACT_FORM_MARKER,
  estimateReadMinutes,
  extractMarkdownHeadings,
  normalizeArticleSlug,
  normalizeCategorySlug,
  normalizeContactFormMarkers,
  normalizeTocItems,
  type ArticleCategoryGroup,
  type ArticleTocItem,
} from "@/lib/article-content";
import { DEFAULT_TIMEZONE, TIMEZONE_OPTIONS, isSupportedTimezone } from "@/lib/timezones";
import { useSeo } from "@/lib/seo";

const API_BASE = getApiBase();
const ADMIN_TOKEN_KEY = "acadea-admin-session";

type EditorState = {
  id?: number;
  sortOrder: number;
  category: string;
  categorySlugs: string[];
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  markdown: string;
  readMin: number;
  tocItems: ArticleTocItem[];
  relatedSlugs: string[];
  isPublished: boolean;
};

type GoogleConnectionState = {
  configured: boolean;
  connected: boolean;
  calendarAccessible: boolean;
  accountEmail: string | null;
  calendarId: string | null;
  status: "not_configured" | "not_connected" | "connected" | "error";
  reason?: string;
};

type AdminWeeklyScheduleRule = {
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

type AdminAdditionalCalendar = {
  email: string;
  fullName: string;
  inviteToEvents: boolean;
  connectedAt: string | null;
};

type BookingSettingsState = {
  storageReady?: boolean;
  timeZone: string;
  weeklySchedule: AdminWeeklyScheduleRule[];
  additionalCalendars: AdminAdditionalCalendar[];
};

const emptyEditor: EditorState = {
  sortOrder: 0,
  category: "Artykuł",
  categorySlugs: [],
  title: "",
  slug: "",
  excerpt: "",
  coverImage: "",
  markdown: "",
  readMin: 3,
  tocItems: [],
  relatedSlugs: [],
  isPublished: true,
};

const WEEKDAY_LABELS = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
];

const defaultWeeklySchedule: AdminWeeklyScheduleRule[] = [
  { weekday: 0, startTime: "09:00", endTime: "17:00", isActive: false },
  { weekday: 1, startTime: "09:00", endTime: "17:00", isActive: true },
  { weekday: 2, startTime: "09:00", endTime: "17:00", isActive: true },
  { weekday: 3, startTime: "09:00", endTime: "17:00", isActive: true },
  { weekday: 4, startTime: "09:00", endTime: "17:00", isActive: true },
  { weekday: 5, startTime: "09:00", endTime: "17:00", isActive: true },
  { weekday: 6, startTime: "09:00", endTime: "17:00", isActive: false },
];

function toEditorState(article: ArticleEditorRecord): EditorState {
  return {
    id: article.id,
    sortOrder: article.sortOrder,
    category: article.category,
    categorySlugs: article.categorySlugs,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    coverImage: article.coverImage,
    markdown: article.markdown,
    readMin: article.readMin,
    tocItems: normalizeTocItems(article.markdown, article.tocItems),
    relatedSlugs: article.relatedSlugs,
    isPublished: article.isPublished,
  };
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Nie udało się odczytać pliku."));
    reader.readAsDataURL(file);
  });
}

export default function AdminArticles() {
  useSeo({
    title: "Panel artykułów | ACADEA",
    description: "Panel administracyjny artykułów ACADEA.",
    path: "/panel",
    noindex: true,
  });

  const querySecret = new URLSearchParams(window.location.search).get("secret")?.trim() ?? "";
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) ?? "");
  const [entryGranted, setEntryGranted] = useState(false);
  const [entryCheckComplete, setEntryCheckComplete] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginTurnstileToken, setLoginTurnstileToken] = useState("");
  const [loginTurnstileResetKey, setLoginTurnstileResetKey] = useState(0);
  const [articles, setArticles] = useState<ArticleEditorRecord[]>([]);
  const [taxonomyGroups, setTaxonomyGroups] = useState<ArticleCategoryGroup[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new">("new");
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"articles" | "calendar">("articles");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupSlug, setNewGroupSlug] = useState("");
  const [newCategoryGroupId, setNewCategoryGroupId] = useState<number | "">("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googleConnection, setGoogleConnection] = useState<GoogleConnectionState | null>(null);
  const [isCheckingGoogleConnection, setIsCheckingGoogleConnection] = useState(false);
  const [bookingSettings, setBookingSettings] = useState<BookingSettingsState>({
    storageReady: true,
    timeZone: DEFAULT_TIMEZONE,
    weeklySchedule: defaultWeeklySchedule,
    additionalCalendars: [],
  });
  const [isLoadingBookingSettings, setIsLoadingBookingSettings] = useState(false);
  const [isSavingBookingSettings, setIsSavingBookingSettings] = useState(false);
  const [isConnectingAdditionalGoogle, setIsConnectingAdditionalGoogle] = useState(false);
  const [inviteNewAdditionalCalendar, setInviteNewAdditionalCalendar] = useState(false);
  const markdownRef = useRef<HTMLTextAreaElement | null>(null);

  async function loadAdminData(currentToken: string) {
    const [rows, taxonomy] = await Promise.all([
      fetchAdminArticles(currentToken),
      fetchAdminArticleTaxonomy(currentToken),
    ]);

    setArticles(rows);
    setTaxonomyGroups(taxonomy.groups);
    return rows;
  }

  async function loadGoogleConnection(currentToken: string) {
    setIsCheckingGoogleConnection(true);

    try {
      const response = await fetch(`${API_BASE}/admin/google/auth/status`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = (await response.json().catch(() => ({}))) as
        | (GoogleConnectionState & { error?: string })
        | { error?: string };

      if (!response.ok) {
        setGoogleConnection(null);
        if ("error" in data && data.error) {
          setStatus(data.error);
        }
        return null;
      }

      setGoogleConnection(data as GoogleConnectionState);
      return data as GoogleConnectionState;
    } catch {
      setGoogleConnection(null);
      return null;
    } finally {
      setIsCheckingGoogleConnection(false);
    }
  }

  async function loadBookingSettings(currentToken: string) {
    setIsLoadingBookingSettings(true);

    try {
      const response = await fetch(`${API_BASE}/admin/booking-settings`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = (await response.json().catch(() => ({}))) as
        | BookingSettingsState
        | { error?: string };

      if (!response.ok) {
        if ("error" in data && data.error) {
          setStatus(data.error);
        }
        return null;
      }

      setBookingSettings({
        storageReady:
          typeof (data as BookingSettingsState).storageReady === "boolean"
            ? (data as BookingSettingsState).storageReady
            : true,
        timeZone:
          typeof (data as BookingSettingsState).timeZone === "string" &&
          isSupportedTimezone((data as BookingSettingsState).timeZone)
            ? (data as BookingSettingsState).timeZone
            : DEFAULT_TIMEZONE,
        weeklySchedule: Array.isArray((data as BookingSettingsState).weeklySchedule)
          ? (data as BookingSettingsState).weeklySchedule
          : defaultWeeklySchedule,
        additionalCalendars: Array.isArray((data as BookingSettingsState).additionalCalendars)
          ? (data as BookingSettingsState).additionalCalendars.map((entry) => ({
              ...entry,
              fullName: entry.fullName ?? "",
            }))
          : [],
      });
      return data as BookingSettingsState;
    } catch {
      return null;
    } finally {
      setIsLoadingBookingSettings(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess() {
      if (!querySecret) {
        if (!cancelled) {
          setAccessError("Brak kodu dostępu. Za 5 sekund nastąpi przekierowanie.");
          setEntryCheckComplete(true);
        }
        return;
      }

      const response = await fetch(`${API_BASE}/admin/auth/entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entrySecret: querySecret }),
      });

      if (!response.ok) {
        if (!cancelled) {
          setAccessError("Nieprawidłowy kod dostępu. Za 5 sekund nastąpi przekierowanie.");
          setEntryCheckComplete(true);
        }
        return;
      }

      if (!cancelled) {
        setEntryGranted(true);
      }

      if (token) {
        try {
          const statusResponse = await fetch(`${API_BASE}/admin/auth/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = (await statusResponse.json()) as { authenticated?: boolean };
          if (!data.authenticated) {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            if (!cancelled) {
              setToken("");
            }
          }
        } catch {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          if (!cancelled) {
            setToken("");
          }
        }
      }

      if (!cancelled) {
        setEntryCheckComplete(true);
      }
    }

    void verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [querySecret, token]);

  useEffect(() => {
    if (!accessError) return;
    const timeout = window.setTimeout(() => window.location.replace("/"), 5000);
    return () => window.clearTimeout(timeout);
  }, [accessError]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void loadAdminData(token)
      .then((rows) => {
        if (cancelled) return;
        if (selectedId === "new") return;
        const current = rows.find((row) => row.id === selectedId);
        if (current) {
          setEditor(toEditorState(current));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("Nie udało się pobrać artykułów.");
        }
      });

    void Promise.all([loadGoogleConnection(token), loadBookingSettings(token)]);

    return () => {
      cancelled = true;
    };
  }, [token, selectedId]);

  useEffect(() => {
    if (!token) return;

    function handleFocus() {
      void Promise.all([loadGoogleConnection(token), loadBookingSettings(token)]);
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [token]);

  const estimatedReadMin = useMemo(() => estimateReadMinutes(editor.markdown), [editor.markdown]);
  const sortedArticles = useMemo(
    () =>
      [...articles].sort((a, b) =>
        a.sortOrder === b.sortOrder ? a.title.localeCompare(b.title) : a.sortOrder - b.sortOrder,
      ),
    [articles],
  );
  const markdownHeadings = useMemo(() => extractMarkdownHeadings(editor.markdown), [editor.markdown]);

  function logout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken("");
    setStatus("");
    setEntryGranted(false);
    setPassword("");
    setLoginError("");
  }

  function startNewArticle() {
    setSelectedId("new");
    setEditor(emptyEditor);
    setStatus("");
  }

  function selectArticle(article: ArticleEditorRecord) {
    setSelectedId(article.id);
    setEditor(toEditorState(article));
    setStatus("");
  }

  function updateMarkdown(markdown: string) {
    setEditor((current) => ({
      ...current,
      markdown,
      tocItems: normalizeTocItems(markdown, current.tocItems),
    }));
  }

  function resetTocLabelsAndAnchors() {
    setEditor((current) => {
      const includeBySourceIndex = new Map(current.tocItems.map((item) => [item.sourceIndex, item.include]));
      return {
        ...current,
        tocItems: markdownHeadings.map((item) => ({
          ...item,
          label: item.sourceText,
          anchorId: normalizeCategorySlug(item.sourceText) || item.anchorId,
          include: includeBySourceIndex.get(item.sourceIndex) ?? item.include,
        })),
      };
    });
    setStatus("Nazwy i anchory w spisie treści zostały przywrócone do nagłówków.");
  }

  async function handleLogin() {
    setLoginError("");
    if (isTurnstileEnabled() && !loginTurnstileToken) {
      setLoginError("Potwierdź zabezpieczenie formularza logowania.");
      return;
    }

    const response = await fetch(`${API_BASE}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entrySecret: querySecret,
        password,
        turnstileToken: loginTurnstileToken,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { token?: string; error?: string };
    if (!response.ok || !data.token) {
      setLoginError(data.error ?? "Logowanie nie powiodło się.");
      setLoginTurnstileToken("");
      setLoginTurnstileResetKey((value) => value + 1);
      return;
    }

    localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    setToken(data.token);
    setPassword("");
    setLoginTurnstileToken("");
    setLoginTurnstileResetKey((value) => value + 1);
  }

  async function connectGoogle() {
    setStatus("");
    setIsConnectingGoogle(true);
    const popup = window.open("about:blank", "_blank", "noopener,noreferrer");

    try {
      const response = await fetch(`${API_BASE}/admin/google/auth/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json().catch(() => ({}))) as {
        authorizationUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.authorizationUrl) {
        popup?.close();
        setStatus(data.error ?? "Nie udało się rozpocząć połączenia Google.");
        return;
      }

      if (popup) {
        popup.location.href = data.authorizationUrl;
        popup.focus();
      } else {
        window.location.href = data.authorizationUrl;
      }

      setStatus("Otwarto okno logowania Google. Po zakończeniu wróć do panelu, a status połączenia odświeży się automatycznie.");
    } catch {
      popup?.close();
      setStatus("Nie udało się rozpocząć połączenia Google.");
    } finally {
      setIsConnectingGoogle(false);
    }
  }

  async function connectAdditionalGoogleCalendar() {
    setStatus("");
    setIsConnectingAdditionalGoogle(true);
    const popup = window.open("about:blank", "_blank", "noopener,noreferrer");

    try {
      const response = await fetch(`${API_BASE}/admin/google/calendar-connections/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteToEvents: inviteNewAdditionalCalendar,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        authorizationUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.authorizationUrl) {
        popup?.close();
        setStatus(data.error ?? "Nie udało się rozpocząć połączenia dodatkowego kalendarza.");
        return;
      }

      if (popup) {
        popup.location.href = data.authorizationUrl;
        popup.focus();
      } else {
        window.location.href = data.authorizationUrl;
      }

      setStatus("Otwarto okno logowania Google dla dodatkowego kalendarza. Po zakończeniu wróć do panelu.");
    } catch {
      popup?.close();
      setStatus("Nie udało się rozpocząć połączenia dodatkowego kalendarza.");
    } finally {
      setIsConnectingAdditionalGoogle(false);
    }
  }

  const googleBadge = useMemo(() => {
    if (isCheckingGoogleConnection && !googleConnection) {
      return {
        label: "Sprawdzanie Google…",
        className: "border-[#d8cfbf] bg-white text-[#7c6c56]",
      };
    }

    if (!googleConnection) {
      return {
        label: "Status Google nieznany",
        className: "border-[#e7dccf] bg-[#fcfbf8] text-[#7c6c56]",
      };
    }

    if (googleConnection.status === "connected") {
      return {
        label: "Google połączone",
        className: "border-green-200 bg-green-50 text-green-800",
      };
    }

    if (googleConnection.status === "not_connected") {
      return {
        label: "Google wymaga połączenia",
        className: "border-amber-200 bg-amber-50 text-amber-800",
      };
    }

    if (googleConnection.status === "not_configured") {
      return {
        label: "Google nie skonfigurowane",
        className: "border-red-200 bg-red-50 text-red-700",
      };
    }

    return {
      label: "Google wymaga ponownego połączenia",
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }, [googleConnection, isCheckingGoogleConnection]);

  async function saveArticle() {
    setIsSaving(true);
    setStatus("");

    const payload = {
      ...editor,
      slug: normalizeArticleSlug(editor.slug),
      markdown: normalizeContactFormMarkers(editor.markdown),
      tocItems: normalizeTocItems(editor.markdown, editor.tocItems),
    };

    const response = await fetch(
      editor.id ? `${API_BASE}/admin/articles/${editor.id}` : `${API_BASE}/admin/articles`,
      {
        method: editor.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = (await response.json().catch(() => ({}))) as ArticleEditorRecord & { error?: string };
    setIsSaving(false);

    if (!response.ok) {
      setStatus(data.error ?? "Nie udało się zapisać artykułu.");
      return;
    }

    const rows = await loadAdminData(token);
    setStatus("Artykuł zapisany.");
    const saved = rows.find((row) => row.id === data.id);
    if (saved) {
      setSelectedId(saved.id);
      setEditor(toEditorState(saved));
    }
  }

  async function saveBookingSettings() {
    setIsSavingBookingSettings(true);
    setStatus("");

    try {
      const response = await fetch(`${API_BASE}/admin/booking-settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingSettings),
      });

      const data = (await response.json().catch(() => ({}))) as
        | BookingSettingsState
        | { error?: string };

      if (!response.ok) {
        setStatus(("error" in data && data.error) || "Nie udało się zapisać ustawień kalendarza.");
        return;
      }

      setBookingSettings(data as BookingSettingsState);
      setStatus("Ustawienia kalendarza zostały zapisane.");
    } catch {
      setStatus("Nie udało się zapisać ustawień kalendarza.");
    } finally {
      setIsSavingBookingSettings(false);
    }
  }

  function updateBookingDayRules(
    weekday: number,
    updater: (rules: AdminWeeklyScheduleRule[]) => AdminWeeklyScheduleRule[],
  ) {
    setBookingSettings((current) => {
      const dayRules = current.weeklySchedule.filter((entry) => entry.weekday === weekday);
      const otherRules = current.weeklySchedule.filter((entry) => entry.weekday !== weekday);
      const nextRules = updater(dayRules).sort((left, right) => left.startTime.localeCompare(right.startTime));
      return {
        ...current,
        weeklySchedule: [...otherRules, ...nextRules].sort((left, right) =>
          left.weekday === right.weekday
            ? left.startTime.localeCompare(right.startTime)
            : left.weekday - right.weekday,
        ),
      };
    });
  }

  function removeAdditionalCalendar(email: string) {
    setBookingSettings((current) => ({
      ...current,
      additionalCalendars: current.additionalCalendars.filter((entry) => entry.email !== email),
    }));
  }

  async function deleteArticleRecord() {
    if (!editor.id) {
      startNewArticle();
      return;
    }

    if (!window.confirm("Usunąć ten artykuł?")) {
      return;
    }

    const response = await fetch(`${API_BASE}/admin/articles/${editor.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      setStatus("Nie udało się usunąć artykułu.");
      return;
    }

    await loadAdminData(token);
    setStatus("Artykuł usunięty.");
    startNewArticle();
  }

  async function uploadAsset(file: File) {
    const dataUrl = await fileToDataUrl(file);
    const response = await fetch(`${API_BASE}/admin/assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        dataUrl,
      }),
    });

    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      throw new Error(data.error ?? "Upload nie powiódł się.");
    }

    return data.url;
  }

  async function createGroup() {
    if (!newGroupName.trim()) {
      setStatus("Podaj nazwę grupy kategorii.");
      return;
    }

    await createArticleCategoryGroup(token, {
      name: newGroupName.trim(),
      slug: newGroupSlug.trim() || normalizeCategorySlug(newGroupName),
      sortOrder: taxonomyGroups.length,
    });
    const taxonomy = await fetchAdminArticleTaxonomy(token);
    setTaxonomyGroups(taxonomy.groups);
    setNewGroupName("");
    setNewGroupSlug("");
    setStatus("Dodano grupę kategorii.");
  }

  async function removeGroup(groupId: number) {
    if (!window.confirm("Usunąć tę grupę kategorii wraz z kategoriami w środku?")) {
      return;
    }

    await deleteArticleCategoryGroup(token, groupId);
    const taxonomy = await fetchAdminArticleTaxonomy(token);
    setTaxonomyGroups(taxonomy.groups);
    setEditor((current) => ({
      ...current,
      categorySlugs: current.categorySlugs.filter((slug) =>
        taxonomy.groups.some((group) => group.categories.some((category) => category.slug === slug)),
      ),
    }));
    setStatus("Usunięto grupę kategorii.");
  }

  async function createCategoryItem() {
    if (!newCategoryGroupId || !newCategoryName.trim()) {
      setStatus("Wybierz grupę i podaj nazwę kategorii.");
      return;
    }

    const group = taxonomyGroups.find((item) => item.id === newCategoryGroupId);
    if (!group) {
      setStatus("Nie znaleziono wybranej grupy kategorii.");
      return;
    }

    await createArticleCategory(token, {
      groupId: group.id,
      name: newCategoryName.trim(),
      slug: newCategorySlug.trim() || normalizeCategorySlug(newCategoryName),
      sortOrder: group.categories.length,
    });

    const taxonomy = await fetchAdminArticleTaxonomy(token);
    setTaxonomyGroups(taxonomy.groups);
    setNewCategoryGroupId("");
    setNewCategoryName("");
    setNewCategorySlug("");
    setStatus("Dodano kategorię.");
  }

  async function removeCategoryItem(categoryId: number) {
    if (!window.confirm("Usunąć tę kategorię?")) {
      return;
    }

    await deleteArticleCategory(token, categoryId);
    const taxonomy = await fetchAdminArticleTaxonomy(token);
    setTaxonomyGroups(taxonomy.groups);
    const remainingSlugs = new Set(
      taxonomy.groups.flatMap((group) => group.categories.map((category) => category.slug)),
    );
    setEditor((current) => ({
      ...current,
      categorySlugs: current.categorySlugs.filter((slug) => remainingSlugs.has(slug)),
    }));
    setStatus("Usunięto kategorię.");
  }

  if (!entryCheckComplete) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] px-4 pb-16 pt-28">
        <div className="mx-auto max-w-md rounded-[28px] border border-[#e7e1d6] bg-white p-8 text-center shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#9b8e78]">Panel redakcyjny</p>
          <h1 className="mb-3 text-3xl font-bold text-primary">Sprawdzanie dostępu</h1>
          <p className="text-sm text-gray-500">Chwila…</p>
        </div>
      </div>
    );
  }

  if (accessError && !entryGranted) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] px-4 pb-16 pt-28">
        <div className="mx-auto max-w-md rounded-[28px] border border-[#e7e1d6] bg-white p-8 text-center shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#9b8e78]">Panel redakcyjny</p>
          <h1 className="mb-3 text-3xl font-bold text-primary">Brak dostępu</h1>
          <p className="text-sm text-gray-500">{accessError}</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] px-4 pb-16 pt-28">
        <div className="mx-auto max-w-md rounded-[28px] border border-[#e7e1d6] bg-white p-8 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#9b8e78]">Panel redakcyjny</p>
          <h1 className="mb-3 text-3xl font-bold text-primary">Zaloguj się</h1>
          <p className="mb-6 text-sm text-gray-500">
            To wejście działa tylko pod ukrytym adresem i dodatkowo wymaga hasła administratora.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Hasło administratora"
            className="h-12 w-full rounded-2xl border border-[#ded7c9] px-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-5">
            <TurnstileWidget onTokenChange={setLoginTurnstileToken} resetKey={loginTurnstileResetKey} />
          </div>
          {loginError ? <p className="mt-3 text-sm text-red-600">{loginError}</p> : null}
          <button
            onClick={handleLogin}
            className="mt-5 h-12 w-full rounded-2xl bg-primary font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Wejdź do panelu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3ec] pb-12 pt-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-[28px] border border-[#e8e0d4] bg-white p-5 xl:sticky xl:top-28">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9b8e78]">Artykuły</p>
                <h2 className="text-2xl font-bold text-primary">Baza wiedzy</h2>
              </div>
              <button
                onClick={startNewArticle}
                className="shrink-0 rounded-full bg-accent px-4 py-2 font-semibold text-primary"
              >
                Nowy
              </button>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              {sortedArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => selectArticle(article)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                    selectedId === article.id
                      ? "border-primary bg-primary/5"
                      : "border-[#eee6d8] bg-[#fcfbf8] hover:border-primary/40"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#998b73]">{article.category}</span>
                    <span className={`text-[11px] font-semibold ${article.isPublished ? "text-green-700" : "text-amber-700"}`}>
                      {article.isPublished ? "Opublikowany" : "Szkic"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-snug text-primary">{article.title}</p>
                </button>
              ))}
            </div>
          </aside>

          <main className="rounded-[32px] border border-[#e8e0d4] bg-white p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#9b8e78]">Panel administracyjny</p>
                <h1 className="text-3xl font-bold text-primary">
                  {activeTab === "articles"
                    ? editor.id
                      ? "Edytuj artykuł"
                      : "Nowy artykuł"
                    : "Kalendarz i maile"}
                </h1>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("articles")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      activeTab === "articles"
                        ? "bg-primary text-white"
                        : "border border-[#d8cfbf] text-primary"
                    }`}
                  >
                    Artykuły
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("calendar")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      activeTab === "calendar"
                        ? "bg-primary text-white"
                        : "border border-[#d8cfbf] text-primary"
                    }`}
                  >
                    Kalendarz i maile
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {activeTab === "articles" ? (
                  <button onClick={deleteArticleRecord} className="rounded-full border border-red-200 px-5 py-3 font-semibold text-red-700">
                    Usuń
                  </button>
                ) : (
                  <button
                    onClick={saveBookingSettings}
                    disabled={isSavingBookingSettings}
                    className="rounded-full bg-primary px-6 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    {isSavingBookingSettings ? "Zapisywanie…" : "Zapisz ustawienia kalendarza"}
                  </button>
                )}
                <button onClick={logout} className="rounded-full border border-[#d8cfbf] px-5 py-3 font-semibold text-primary">
                  Wyloguj
                </button>
                {activeTab === "articles" ? (
                  <button
                    onClick={saveArticle}
                    disabled={isSaving}
                    className="rounded-full bg-primary px-6 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    {isSaving ? "Zapisywanie…" : "Zapisz artykuł"}
                  </button>
                ) : null}
              </div>
            </div>

            {status ? <p className="mb-5 text-sm text-primary">{status}</p> : null}
            {activeTab === "calendar" ? (
              <div className="space-y-6">
                <section className="rounded-[24px] border border-[#ece3d6] bg-[#fcfbf8] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-primary">Główne konto Google</h2>
                      <p className="mt-2 max-w-3xl text-sm text-[#7c6c56]">
                        To konto nadal wysyła zaproszenia, tworzy wydarzenia i nadaje im oficjalny organizer. Dodatkowe kalendarze poniżej służą tylko do sprawdzania dostępności, chyba że zaznaczysz ich zapraszanie do eventów.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${googleBadge.className}`}>
                          {googleBadge.label}
                        </span>
                        {googleConnection?.accountEmail ? (
                          <span className="text-sm text-[#7c6c56]">Konto: {googleConnection.accountEmail}</span>
                        ) : null}
                      </div>
                      {googleConnection?.reason ? (
                        <p className="mt-3 max-w-2xl text-sm text-[#8a5b2d]">{googleConnection.reason}</p>
                      ) : null}
                      {bookingSettings.storageReady === false ? (
                        <p className="mt-3 max-w-2xl text-sm text-[#8a5b2d]">
                          Baza nie ma jeszcze tabeli dla tych ustawień. Odczyt działa na wartościach domyślnych, ale zapis i dodawanie dodatkowych kalendarzy zadziała dopiero po wklejeniu SQL update do Cloud SQL.
                        </p>
                      ) : null}
                    </div>
                    <button
                      onClick={connectGoogle}
                      disabled={isConnectingGoogle}
                      className="rounded-full border border-[#d8cfbf] px-5 py-3 font-semibold text-primary disabled:opacity-60"
                    >
                      {isConnectingGoogle
                        ? "Łączenie Google…"
                        : googleConnection?.status === "connected"
                          ? "Połącz ponownie konto główne"
                          : "Połącz konto główne"}
                    </button>
                  </div>
                </section>

                <section className="rounded-[24px] border border-[#ece3d6] bg-[#fcfbf8] p-5">
                  <h2 className="text-xl font-bold text-primary">Godziny pracy</h2>
                  <p className="mt-2 text-sm text-[#7c6c56]">
                    To odpowiednik publicznej dostępności dla formularza na stronie głównej. Backend połączy te reguły z zajętością wszystkich podłączonych kalendarzy.
                  </p>
                  <div className="mt-5 max-w-md">
                    <label className="mb-2 block text-sm font-semibold text-primary">Strefa czasowa godzin pracy</label>
                    <select
                      value={bookingSettings.timeZone}
                      onChange={(e) =>
                        setBookingSettings((current) => ({
                          ...current,
                          timeZone: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-2xl border border-[#ded7c9] bg-white px-4"
                    >
                      {TIMEZONE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-sm text-gray-500">
                      Te godziny będą interpretowane właśnie w tej strefie czasowej, niezależnie od strefy użytkownika oglądającego formularz.
                    </p>
                  </div>
                  <div className="mt-5 space-y-4">
                    {WEEKDAY_LABELS.map((label, weekday) => {
                      const dayRules = bookingSettings.weeklySchedule
                        .filter((entry) => entry.weekday === weekday)
                        .sort((left, right) => left.startTime.localeCompare(right.startTime));
                      const hasActiveRule = dayRules.some((entry) => entry.isActive);

                      return (
                        <div key={weekday} className="rounded-2xl border border-[#ebe3d8] bg-white p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="font-semibold text-primary">{label}</p>
                              <p className="text-sm text-gray-500">{hasActiveRule ? "Dostępny" : "Niedostępny"}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateBookingDayRules(weekday, (rules) =>
                                    (rules.length ? rules : [{ weekday, startTime: "09:00", endTime: "17:00", isActive: false }]).map((rule) => ({
                                      ...rule,
                                      isActive: !hasActiveRule,
                                    })),
                                  )
                                }
                                className="rounded-full border border-[#d8cfbf] px-4 py-2 text-sm font-semibold text-primary"
                              >
                                {hasActiveRule ? "Wyłącz dzień" : "Włącz dzień"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateBookingDayRules(weekday, (rules) => [
                                    ...rules,
                                    { weekday, startTime: "09:00", endTime: "17:00", isActive: true },
                                  ])
                                }
                                className="rounded-full border border-[#d8cfbf] px-4 py-2 text-sm font-semibold text-primary"
                              >
                                Dodaj przedział
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            {dayRules.length ? dayRules.map((rule, index) => (
                              <div key={`${weekday}-${index}`} className="grid gap-3 md:grid-cols-4">
                                <input
                                  type="time"
                                  value={rule.startTime}
                                  onChange={(e) =>
                                    updateBookingDayRules(weekday, (rules) =>
                                      rules.map((entry, entryIndex) =>
                                        entryIndex === index ? { ...entry, startTime: e.target.value } : entry,
                                      ),
                                    )
                                  }
                                  className="h-11 rounded-2xl border border-[#ded7c9] px-4"
                                />
                                <input
                                  type="time"
                                  value={rule.endTime}
                                  onChange={(e) =>
                                    updateBookingDayRules(weekday, (rules) =>
                                      rules.map((entry, entryIndex) =>
                                        entryIndex === index ? { ...entry, endTime: e.target.value } : entry,
                                      ),
                                    )
                                  }
                                  className="h-11 rounded-2xl border border-[#ded7c9] px-4"
                                />
                                <select
                                  value={String(rule.isActive)}
                                  onChange={(e) =>
                                    updateBookingDayRules(weekday, (rules) =>
                                      rules.map((entry, entryIndex) =>
                                        entryIndex === index
                                          ? { ...entry, isActive: e.target.value === "true" }
                                          : entry,
                                      ),
                                    )
                                  }
                                  className="h-11 rounded-2xl border border-[#ded7c9] bg-white px-4"
                                >
                                  <option value="true">Aktywne</option>
                                  <option value="false">Nieaktywne</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateBookingDayRules(weekday, (rules) =>
                                      rules.filter((_, entryIndex) => entryIndex !== index),
                                    )
                                  }
                                  className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
                                >
                                  Usuń przedział
                                </button>
                              </div>
                            )) : (
                              <p className="text-sm text-gray-500">Brak przedziałów dla tego dnia.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-[24px] border border-[#ece3d6] bg-[#fcfbf8] p-5">
                  <h2 className="text-xl font-bold text-primary">Dodatkowe kalendarze do sprawdzania zajętości</h2>
                  <p className="mt-2 text-sm text-[#7c6c56]">
                    Podłącz tu dodatkowe konta Google, które mają blokować sloty w formularzu. Główne konto nadal pozostaje organizerem i źródłem maili, ale możesz zaznaczyć, że konkretne dodatkowe konto też ma dostać zaproszenie na event.
                  </p>

                  <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#ebe3d8] bg-white p-4 md:flex-row md:items-center md:justify-between">
                    <label className="inline-flex items-center gap-3 text-sm font-semibold text-primary">
                      <input
                        type="checkbox"
                        checked={inviteNewAdditionalCalendar}
                        onChange={(e) => setInviteNewAdditionalCalendar(e.target.checked)}
                      />
                      Zapraszaj to nowe konto do eventów tworzonych z głównego kalendarza
                    </label>
                    <button
                      type="button"
                      onClick={connectAdditionalGoogleCalendar}
                      disabled={isConnectingAdditionalGoogle}
                      className="rounded-full bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60"
                    >
                      {isConnectingAdditionalGoogle ? "Łączenie..." : "Dodaj dodatkowy kalendarz Google"}
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {bookingSettings.additionalCalendars.length ? (
                      bookingSettings.additionalCalendars.map((entry) => (
                        <div key={entry.email} className="rounded-2xl border border-[#ebe3d8] bg-white p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={entry.fullName}
                                onChange={(e) =>
                                  setBookingSettings((current) => ({
                                    ...current,
                                    additionalCalendars: current.additionalCalendars.map((calendar) =>
                                      calendar.email === entry.email
                                        ? { ...calendar, fullName: e.target.value }
                                        : calendar,
                                    ),
                                  }))
                                }
                                placeholder="Imię i nazwisko mentora"
                                className="mb-2 h-11 w-full rounded-2xl border border-[#ded7c9] px-4"
                              />
                              <p className="font-semibold text-primary">{entry.email}</p>
                              <p className="text-sm text-gray-500">
                                {entry.connectedAt
                                  ? `Połączono: ${new Date(entry.connectedAt).toLocaleString("pl-PL")}`
                                  : "Połączono"}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <label className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                                <input
                                  type="checkbox"
                                  checked={entry.inviteToEvents}
                                  onChange={(e) =>
                                    setBookingSettings((current) => ({
                                      ...current,
                                      additionalCalendars: current.additionalCalendars.map((calendar) =>
                                        calendar.email === entry.email
                                          ? { ...calendar, inviteToEvents: e.target.checked }
                                          : calendar,
                                      ),
                                    }))
                                  }
                                />
                                Zapraszaj do eventów
                              </label>
                              <button
                                type="button"
                                onClick={() => removeAdditionalCalendar(entry.email)}
                                className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
                              >
                                Usuń
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        {isLoadingBookingSettings
                          ? "Ładowanie kalendarzy..."
                          : "Brak dodatkowych kalendarzy. Na razie sprawdzana jest tylko dostępność głównego konta."}
                      </p>
                    )}
                  </div>
                </section>
              </div>
            ) : (
              <>
            <section className="mb-6 rounded-[24px] border border-[#ece3d6] bg-[#fcfbf8] p-5">
              <h2 className="mb-4 text-lg font-bold text-primary">Grupy kategorii i kategorie</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-primary">Nowa grupa kategorii</p>
                  <input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Np. Kraj"
                    className="h-11 w-full rounded-2xl border border-[#ded7c9] px-4"
                  />
                  <input
                    value={newGroupSlug}
                    onChange={(e) => setNewGroupSlug(e.target.value)}
                    placeholder="Opcjonalny slug, np. kraj"
                    className="h-11 w-full rounded-2xl border border-[#ded7c9] px-4"
                  />
                  <button onClick={createGroup} className="rounded-full border border-[#d8cfbf] px-4 py-2 text-sm font-semibold text-primary">
                    Dodaj grupę
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-primary">Nowa kategoria</p>
                  <select
                    value={newCategoryGroupId}
                    onChange={(e) => setNewCategoryGroupId(e.target.value ? Number(e.target.value) : "")}
                    className="h-11 w-full rounded-2xl border border-[#ded7c9] bg-white px-4"
                  >
                    <option value="">Wybierz grupę</option>
                    {taxonomyGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Np. Szwecja"
                    className="h-11 w-full rounded-2xl border border-[#ded7c9] px-4"
                  />
                  <input
                    value={newCategorySlug}
                    onChange={(e) => setNewCategorySlug(e.target.value)}
                    placeholder="Opcjonalny slug, np. szwecja"
                    className="h-11 w-full rounded-2xl border border-[#ded7c9] px-4"
                  />
                  <button onClick={createCategoryItem} className="rounded-full border border-[#d8cfbf] px-4 py-2 text-sm font-semibold text-primary">
                    Dodaj kategorię
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {taxonomyGroups.map((group) => (
                  <div key={group.id} className="rounded-2xl border border-[#ebe3d8] bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-primary">{group.name}</p>
                        <p className="text-xs text-gray-500">{group.slug}</p>
                      </div>
                      <button onClick={() => removeGroup(group.id)} className="text-sm font-semibold text-red-700">
                        Usuń grupę
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.categories.map((category) => (
                        <span key={category.id} className="inline-flex items-center gap-2 rounded-full border border-[#e5ddcf] bg-[#faf7f1] px-3 py-1.5 text-sm text-primary">
                          {category.name}
                          <button onClick={() => removeCategoryItem(category.id)} className="text-red-700">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-primary">Tytuł</span>
                <input
                  value={editor.title}
                  onChange={(e) => setEditor((current) => ({ ...current, title: e.target.value }))}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#ded7c9] px-4"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-primary">Slug</span>
                <input
                  value={editor.slug}
                  onChange={(e) => setEditor((current) => ({ ...current, slug: e.target.value }))}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#ded7c9] px-4"
                  placeholder="/nowy-artykul"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-primary">Główna etykieta kategorii</span>
                <input
                  value={editor.category}
                  onChange={(e) => setEditor((current) => ({ ...current, category: e.target.value }))}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#ded7c9] px-4"
                  placeholder="Np. Poradniki"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-primary">Kolejność</span>
                <input
                  type="number"
                  min={0}
                  value={editor.sortOrder}
                  onChange={(e) => setEditor((current) => ({ ...current, sortOrder: Number(e.target.value || 0) }))}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#ded7c9] px-4"
                />
              </label>
            </div>

            <section className="mt-5 rounded-[24px] border border-[#ece3d6] bg-[#fcfbf8] p-5">
              <h2 className="mb-4 text-lg font-bold text-primary">Kategorie artykułu</h2>
              <div className="space-y-4">
                {taxonomyGroups.map((group) => (
                  <div key={group.id}>
                    <p className="mb-2 text-sm font-semibold text-primary">{group.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.categories.map((category) => {
                        const checked = editor.categorySlugs.includes(category.slug);
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() =>
                              setEditor((current) => ({
                                ...current,
                                categorySlugs: checked
                                  ? current.categorySlugs.filter((slug) => slug !== category.slug)
                                  : [...current.categorySlugs, category.slug],
                              }))
                            }
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                              checked
                                ? "border-primary bg-primary text-white"
                                : "border-[#ddd4c5] bg-white text-gray-600 hover:border-primary hover:text-primary"
                            }`}
                          >
                            {category.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-primary">Lead / zajawka</span>
              <textarea
                value={editor.excerpt}
                onChange={(e) => setEditor((current) => ({ ...current, excerpt: e.target.value }))}
                className="mt-2 min-h-28 w-full rounded-2xl border border-[#ded7c9] px-4 py-3"
              />
            </label>

            <div className="mt-4 grid grid-cols-1 items-end gap-4 lg:grid-cols-[1fr_auto]">
              <label className="block">
                <span className="text-sm font-semibold text-primary">Zdjęcie główne</span>
                <input
                  value={editor.coverImage}
                  onChange={(e) => setEditor((current) => ({ ...current, coverImage: e.target.value }))}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#ded7c9] px-4"
                  placeholder="https://... lub upload poniżej"
                />
              </label>
              <label className="inline-flex h-12 cursor-pointer items-center justify-center rounded-2xl bg-[#f1ece2] px-5 font-semibold text-primary">
                Wgraj okładkę
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadAsset(file);
                      setEditor((current) => ({ ...current, coverImage: url }));
                      setStatus("Zdjęcie główne wgrane.");
                    } catch (error) {
                      setStatus(error instanceof Error ? error.message : "Upload nie powiódł się.");
                    } finally {
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-3 text-sm font-semibold text-primary">
                <input
                  type="checkbox"
                  checked={editor.isPublished}
                  onChange={(e) => setEditor((current) => ({ ...current, isPublished: e.target.checked }))}
                />
                Artykuł opublikowany
              </label>
              <label className="inline-flex items-center gap-3 text-sm font-semibold text-primary">
                <span>Czas czytania</span>
                <input
                  type="number"
                  min={1}
                  value={editor.readMin}
                  onChange={(e) => setEditor((current) => ({ ...current, readMin: Math.max(1, Number(e.target.value || 1)) }))}
                  className="h-10 w-24 rounded-xl border border-[#ded7c9] px-3 font-medium text-primary"
                />
                <span className="font-normal text-gray-500">min</span>
              </label>
              <button
                type="button"
                onClick={() => setEditor((current) => ({ ...current, readMin: estimatedReadMin }))}
                className="rounded-full border border-[#d8cfbf] px-4 py-2 text-sm font-semibold text-primary"
              >
                Użyj estymacji ({estimatedReadMin} min)
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-primary">Treść artykułu (Markdown)</span>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const snippet = `\n\n${ARTICLE_CONTACT_FORM_MARKER}\n\n`;
                        updateMarkdown(`${editor.markdown}${snippet}`);
                        markdownRef.current?.focus();
                      }}
                      className="rounded-full border border-[#d8cfbf] px-4 py-2 text-sm font-semibold text-primary"
                    >
                      Wstaw blok formularza
                    </button>
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-[#f1ece2] px-4 text-sm font-semibold text-primary">
                      Wgraj obraz do treści
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await uploadAsset(file);
                            updateMarkdown(`${editor.markdown}\n\n![${file.name}](${url})\n`);
                            setStatus("Obraz dodany do treści.");
                          } catch (error) {
                            setStatus(error instanceof Error ? error.message : "Upload nie powiódł się.");
                          } finally {
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <textarea
                  ref={markdownRef}
                  value={editor.markdown}
                  onChange={(e) => updateMarkdown(e.target.value)}
                  className="min-h-[540px] w-full rounded-[24px] border border-[#ded7c9] px-4 py-4 font-mono text-sm"
                  placeholder="# Tytuł artykułu"
                />
              </div>

              <div className="space-y-6">
                <section className="rounded-[24px] border border-[#ece3d6] bg-[#fcfbf8] p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-primary">Spis treści i anchors</h2>
                    {markdownHeadings.length > 0 ? (
                      <button
                        type="button"
                        onClick={resetTocLabelsAndAnchors}
                        className="inline-flex h-10 items-center justify-center rounded-full bg-[#f1ece2] px-4 text-sm font-semibold text-primary transition-colors hover:bg-[#e7dfd0]"
                      >
                        Resetuj nazwy i anchory
                      </button>
                    ) : null}
                  </div>
                  {markdownHeadings.length === 0 ? (
                    <p className="text-sm text-gray-500">Dodaj nagłówki `##`, `###` lub `####`, aby skonfigurować spis treści.</p>
                  ) : (
                    <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
                      {editor.tocItems.map((item, index) => (
                        <div key={`${item.sourceIndex}-${item.anchorId}`} className="rounded-2xl border border-[#ebe3d8] bg-white p-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-primary">{item.sourceText}</p>
                            <span className="text-xs text-gray-500">H{item.level}</span>
                          </div>
                          <label className="mb-3 inline-flex items-center gap-3 text-sm text-primary">
                            <input
                              type="checkbox"
                              checked={item.include}
                              onChange={(e) =>
                                setEditor((current) => ({
                                  ...current,
                                  tocItems: current.tocItems.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, include: e.target.checked } : entry,
                                  ),
                                }))
                              }
                            />
                            Pokaż w spisie treści
                          </label>
                          <div className="grid gap-3">
                            <input
                              value={item.label}
                              onChange={(e) =>
                                setEditor((current) => ({
                                  ...current,
                                  tocItems: current.tocItems.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, label: e.target.value } : entry,
                                  ),
                                }))
                              }
                              className="h-10 rounded-xl border border-[#ded7c9] px-3"
                              placeholder="Tytuł w spisie treści"
                            />
                            <input
                              value={item.anchorId}
                              onChange={(e) =>
                                setEditor((current) => ({
                                  ...current,
                                  tocItems: current.tocItems.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, anchorId: normalizeCategorySlug(e.target.value) || entry.anchorId }
                                      : entry,
                                  ),
                                }))
                              }
                              className="h-10 rounded-xl border border-[#ded7c9] px-3"
                              placeholder="anchor-id"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-[24px] border border-[#ece3d6] bg-[#fcfbf8] p-5">
                  <h2 className="mb-4 text-lg font-bold text-primary">czytaj również</h2>
                  <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                    {sortedArticles
                      .filter((article) => article.slug !== normalizeArticleSlug(editor.slug || "/"))
                      .map((article) => {
                        const checked = editor.relatedSlugs.includes(article.slug);
                        return (
                          <label key={article.id} className="flex items-start gap-3 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setEditor((current) => ({
                                  ...current,
                                  relatedSlugs: e.target.checked
                                    ? [...current.relatedSlugs, article.slug]
                                    : current.relatedSlugs.filter((value) => value !== article.slug),
                                }))
                              }
                            />
                            <span>
                              <span className="block font-semibold text-primary">{article.title}</span>
                              <span className="block text-gray-500">{article.slug}</span>
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </section>

                <section className="rounded-[24px] border border-[#ece3d6] bg-white p-5">
                  <h2 className="mb-4 text-lg font-bold text-primary">Podgląd</h2>
                  {editor.coverImage ? (
                    <div className="mb-4 aspect-[16/8] overflow-hidden rounded-2xl bg-gray-100">
                      <img src={editor.coverImage} alt={editor.title || "Okładka"} className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <h3 className="mb-3 text-2xl font-bold text-primary">{editor.title || "Nowy artykuł"}</h3>
                  <p className="mb-4 text-sm text-gray-500">{editor.excerpt}</p>
                  <div className="prose prose-sm max-w-none prose-headings:text-primary prose-a:text-primary">
                    <ReactMarkdown>{normalizeContactFormMarkers(editor.markdown) || "Podgląd pojawi się tutaj."}</ReactMarkdown>
                  </div>
                </section>
              </div>
            </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
