import { useEffect, useMemo, useState } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import { apiFetch } from "@/lib/api";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/TurnstileWidget";

const TOKEN_KEY = "acadea-platform-session";

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

type MaterialRowEditor = {
  alternativeOptions: string[];
  appliesToGuideIds: string[];
  anchorAfterKey?: string;
  country: string;
  displayKey?: string;
  guideId: string;
  level: "country" | "university" | "item";
  ownerUserId?: number | null;
  readOnly?: boolean;
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
    default:
      return value;
  }
}

function normalizeMaterialKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function guessMaterialTemplateType(...values: Array<string | null | undefined>) {
  const haystack = values.join(" ").toLowerCase();
  const passportLikePatterns = [
    "paszport",
    "passport",
    "transcript",
    "swiadect",
    "świadect",
    "certificate",
    "certyfikat",
    "photo",
    "zdjec",
    "zdjęc",
    "diploma",
    "dyplom",
    "id",
    "dowod",
    "dowód",
    "birth certificate",
    "akt urodzenia",
  ];

  return passportLikePatterns.some((pattern) => haystack.includes(pattern))
    ? "passport_like"
    : "essay_like";
}

function buildDerivedMaterialTemplates(guides: any[], materialTemplates: any[]) {
  const existingTitles = new Set(
    materialTemplates.map((template: any) => normalizeMaterialKey(String(template.title ?? ""))),
  );
  const derived = new Map<string, any>();

  for (const guide of guides) {
    for (const item of guide.items ?? []) {
      const title = String(item.title ?? "").trim();
      if (!title) {
        continue;
      }

      const normalizedTitle = normalizeMaterialKey(title);
      if (!normalizedTitle || existingTitles.has(normalizedTitle)) {
        continue;
      }

      const entry =
        derived.get(normalizedTitle) ??
        {
          id: `derived-${normalizedTitle}`,
          title,
          description:
            item.description?.trim() ||
            "Ten kafel powstał automatycznie z wymagań przypisanych do Twoich uczelni.",
          templateType: guessMaterialTemplateType(title, item.sectionTitle, item.description),
          appliesToGuideIds: [],
          alternativeOptions: [],
          structure: [],
          guideId: null,
          isDerived: true,
        };

      if (!entry.appliesToGuideIds.includes(guide.id)) {
        entry.appliesToGuideIds.push(guide.id);
      }

      entry.structure.push({
        alternativeOptions: [],
        appliesToGuideIds: [String(guide.id)],
        country: guide.country,
        guideId: "",
        level: "item",
        task: title,
        university: guide.universityName,
      });
      derived.set(normalizedTitle, entry);
    }
  }

  return Array.from(derived.values());
}

function getGuideTemplateId(guide: any) {
  return String(guide?.sourceGuideId ?? guide?.id ?? "");
}

function templateAppliesToGuide(template: any, guide: any) {
  const templateId = getGuideTemplateId(guide);
  const applies = Array.isArray(template?.appliesToGuideIds) ? template.appliesToGuideIds.map(String) : [];
  return applies.length === 0 || applies.includes(templateId);
}

function rowAppliesToGuide(row: any, guide: any) {
  const templateId = getGuideTemplateId(guide);
  const applies = Array.isArray(row?.appliesToGuideIds) ? row.appliesToGuideIds.map(String) : [];
  return applies.length === 0 || applies.includes(templateId);
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

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
    return "Brak przypisanych uczelni";
  }

  const matchedGuides = allUniversityGuides.filter((entry) => appliesToIds.includes(String(entry.id)));
  const labels = matchedGuides.map((entry) => `${entry.country} • ${entry.universityName}`);
  return labels.length ? labels.join(" | ") : "Brak przypisanych uczelni";
}

function countMaterialTemplateUniversityUsage(template: any, universityGuides: any[]) {
  const validGuideMap = new Map(
    universityGuides.map((guide) => [String(guide.id), `${guide.country}|||${guide.universityName}`]),
  );
  return Array.from(
    new Set(
      (template?.appliesToGuideIds ?? [])
        .map((value: any) => String(value))
        .map((value: string) => validGuideMap.get(value) ?? null)
        .filter((value: string | null): value is string => Boolean(value)),
    ),
  ).length;
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

function createEmptyMaterialRow(): MaterialRowEditor {
  return {
    alternativeOptions: [],
    appliesToGuideIds: [],
    anchorAfterKey: "",
    country: "",
    displayKey: "",
    guideId: "",
    level: "item",
    readOnly: false,
    task: "",
    university: "",
  };
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
        <div className="eyebrow">ACADEA Platform</div>
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
  const defaultSection = session.user.role === "mentee" ? "universities" : "overview";
  const [section, setSection] = useState(defaultSection);

  const menu = useMemo(() => {
    if (session.user.role === "admin") {
      return [
        ["overview", "Przegląd"],
        ["users", "Użytkownicy"],
        ["guides", "Szablony uczelni"],
        ["profile-designer", "Projektant Twoich Danych"],
        ["materials-designer", "Projektant Kafli Materiałów"],
        ["item-guides", "Wskazówki do Elementów"],
        ["leads", "Leady"],
      ];
    }
    if (session.user.role === "mentor") {
      return [
        ["overview", "Przegląd"],
        ["profile", "Profil"],
        ["availability", "Dostępność"],
        ["guides", "Przewodniki"],
        ["materials", "Kafle materiałów"],
        ["meetings", "Spotkania"],
      ];
    }
    return [
      ["universities", "Twoje Uczelnie"],
      ["mentors", "Mentorzy"],
      ["meetings", "Twoje Spotkania"],
      ["profile", "Twoje Dane"],
      ["materials", "Twoje Materiały"],
    ];
  }, [session.user.role]);

  return (
    <div className="app-shell">
      <div className="dashboard">
        <div className="dashboard-topbar app-card" style={{ maxWidth: "none", margin: 0 }}>
          <div>
            <div className="eyebrow">ACADEA Platform</div>
            <h1 style={{ margin: "14px 0 8px", color: "#153f2c" }}>{session.user.fullName}</h1>
            <div className="muted">
              {session.user.role} • {session.user.email}
            </div>
          </div>
          <div className="button-row">
            <a className="btn btn-secondary" href="https://acadea.org" target="_blank" rel="noreferrer">
              Marketing site
            </a>
            <button className="btn btn-primary" onClick={() => void onLogout()}>
              Wyloguj
            </button>
          </div>
        </div>
        <div className="dashboard-layout">
          <div className="dashboard-card sidebar">
            {menu.map(([value, label]) => (
              <button
                key={value}
                className={section === value ? "active" : ""}
                onClick={() => setSection(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="dashboard-main">
            <RoleSection section={section} session={session} token={token} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleSection({
  section,
  session,
  token,
}: {
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
  return <MenteeSection section={section} token={token} />;
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
    maxActiveGuideCount: number;
    maxHintGuideCount: number;
  }>>({});
  const [mentorAssignments, setMentorAssignments] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [profileFields, setProfileFields] = useState<any[]>([]);
  const [materialTemplates, setMaterialTemplates] = useState<any[]>([]);
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
    rows: [
      {
        ...createEmptyMaterialRow(),
        appliesToGuideIds: [],
        country: "Polska",
        task: "Personal statement",
        university: "University College London",
      },
    ] as MaterialRowEditor[],
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
            maxActiveGuideCount: Number(profile.maxActiveGuideCount ?? 3),
            maxHintGuideCount: Number(profile.maxHintGuideCount ?? 3),
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
    const [fieldsPayload, materialsPayload] = await Promise.all([
      apiFetch<any[]>("/admin/profile-fields", undefined, token),
      apiFetch<any[]>("/admin/material-templates", undefined, token),
    ]);
    setProfileFields(fieldsPayload);
    setMaterialTemplates(materialsPayload);
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
      rows: [
        {
          ...createEmptyMaterialRow(),
          country: "Polska",
          task: "Personal statement",
          university: "University College London",
        },
      ],
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
            alternativeOptions: Array.isArray(row.alternativeOptions) ? row.alternativeOptions.filter(Boolean) : [],
            appliesToGuideIds: Array.isArray(row.appliesToGuideIds) ? row.appliesToGuideIds.map((id: any) => String(id)) : [],
            country: row.country ?? "",
            guideId: row.guideId ? String(row.guideId) : "",
            level: row.level === "country" || row.level === "university" || row.level === "item" ? row.level : "item",
            ownerUserId: row.ownerUserId ?? null,
            task: row.task ?? "",
            university: row.university ?? "",
          }))
        : [createEmptyMaterialRow()],
      isActive: Boolean(material.isActive),
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
    if (section === "leads") {
      void refreshLeadState(leadType).catch((error) => setStatus(error.message));
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
        alternativeOptions: row.alternativeOptions.filter(Boolean),
        appliesToGuideIds: row.appliesToGuideIds
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0 && allowedGuideIds.has(value)),
        country: row.country.trim(),
        guideId: row.level === "item" && row.guideId ? Number(row.guideId) : null,
        level: row.level,
        ownerUserId: row.ownerUserId ?? null,
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
            maxActiveGuideCount: Number(draft.maxActiveGuideCount),
            maxHintGuideCount: Number(draft.maxHintGuideCount),
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

  const mentorProfileMap = new Map(mentorProfiles.map((profile) => [profile.userId, profile]));
  const menteeProfileMap = new Map(menteeProfiles.map((profile) => [profile.userId, profile]));
  const tipAccessMap = new Map(tipAccessByMentee.map((entry) => [entry.menteeUserId, entry]));

  return (
    <>
      {status ? <div className="status">{status}</div> : null}
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
                  maxActiveGuideCount: Number(menteeProfile?.maxActiveGuideCount ?? 3),
                  maxHintGuideCount: Number(menteeProfile?.maxHintGuideCount ?? 3),
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
                            <label>Limit aktywnych uczelni</label>
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
                                      <h3>{guide.universityName}</h3>
                                      <div className="muted small">{guide.country} • {guide.universityName}</div>
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
                                                maxActiveGuideCount: Number(menteeLimitDraft.maxActiveGuideCount),
                                                maxHintGuideCount: Number(menteeLimitDraft.maxHintGuideCount),
                                              }),
                                            }, token);
                                          },
                                          "Dostęp do wskazówek został usunięty dla tej uczelni.",
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
                            <div className="small muted">Ten mentee nie ma obecnie aktywnego dostępu do wskazówek żadnej uczelni.</div>
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
                          {guide.country} • {guide.universityName}
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
                  </select>
                </div>
              </div>
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
                <label>Do których uczelni ten kafel się stosuje</label>
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
                          <strong>{guide.universityName}</strong>
                          <span className="small muted" style={{ display: "block" }}>{guide.country} • {guide.universityName}</span>
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
                          <div className="button-row">
                            <button className="btn btn-secondary" onClick={() => moveMaterialRow(index, -1)} type="button">W górę</button>
                            <button className="btn btn-secondary" onClick={() => moveMaterialRow(index, 1)} type="button">W dół</button>
                            <button className="btn btn-secondary" onClick={() => addMaterialRow(index)} type="button">Dodaj nad</button>
                            <button className="btn btn-secondary" onClick={() => addMaterialRow(index + 1)} type="button">Dodaj pod</button>
                            <button className="btn btn-secondary" onClick={() => removeMaterialRow(index)} type="button">Usuń</button>
                          </div>
                        </header>
                        <div className="field">
                          <label>Do których uczelni ten wiersz jest wymagany</label>
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
                                    <strong>{guide.universityName}</strong>
                                    <span className="small muted" style={{ display: "block" }}>{guide.country} • {guide.universityName}</span>
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
                        {materialTemplateTypeLabel(template.templateType)} • {countMaterialTemplateUniversityUsage(template, materialGuideTemplates)} powiązań uczelni
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
                <label>Do których uczelni te wskazówki mają się odnosić</label>
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
                          <strong>{guide.universityName}</strong>
                          <span>{guide.country} • {guide.universityName}</span>
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
                W produkcyjnej bazie Render obecnie nie ma jeszcze żadnych wpisów dla kategorii <strong>{leadType}</strong>.
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
  const [profile, setProfile] = useState<any>({
    bio: "",
    googleDriveFolderUrl: "",
    headline: "",
    meetingLink: "",
    meetingMethod: "zoom_link",
    timezone: "Europe/Warsaw",
    whatsappNumber: "",
    ...(session.mentorProfile ?? {}),
  });
  const [availability, setAvailability] = useState([{ weekday: 1, startTime: "16:00", endTime: "18:00", isActive: true }]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [sourceGuides, setSourceGuides] = useState<any[]>([]);
  const [mentorMaterialTemplates, setMentorMaterialTemplates] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [status, setStatus] = useState("");
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
  const [mentorMaterialRows, setMentorMaterialRows] = useState<MaterialRowEditor[]>([createEmptyMaterialRow()]);
  const dedupedSourceGuides = useMemo(() => {
    const map = new Map<string, any>();
    for (const guide of sourceGuides) {
      const key = `${normalizePlatformSlug(guide.country ?? "")}::${normalizePlatformSlug(guide.universityName ?? "")}`;
      if (!map.has(key)) {
        map.set(key, guide);
      }
    }
    return Array.from(map.values());
  }, [sourceGuides]);
  const selectedMentorMaterialTemplate = useMemo(
    () => mentorMaterialTemplates.find((template) => String(template.id) === mentorMaterialEditorId) ?? null,
    [mentorMaterialEditorId, mentorMaterialTemplates],
  );
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
      displayKey: `mentor:${index}`,
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

  useEffect(() => {
    if (section === "profile" || section === "availability") {
      void apiFetch<any>("/mentor/profile", undefined, token)
        .then((payload) => {
          setProfile({
            bio: "",
            headline: "",
            meetingLink: "",
            meetingMethod: "zoom_link",
            timezone: "Europe/Warsaw",
            whatsappNumber: "",
            ...(payload.profile ?? {}),
          });
          setUniversities(payload.universities ?? []);
          setAvailability(payload.availability?.length ? payload.availability : availability);
        })
        .catch((error) => setStatus(error.message));
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
        apiFetch<any>("/mentor/material-templates", undefined, token).then((payload) => setMentorMaterialTemplates(payload.templates ?? [])),
      ]).catch((error) => setStatus(error.message));
    }
    if (section === "meetings") {
      void apiFetch<any[]>("/mentor/meetings", undefined, token).then(setMeetings).catch((error) => setStatus(error.message));
    }
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
        body: JSON.stringify({ rules: availability }),
      }, token);
      setStatus("Dostępność została zapisana.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać dostępności.");
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
            alternativeOptions: Array.isArray(row.alternativeOptions) ? row.alternativeOptions.filter(Boolean) : [],
            anchorAfterKey: typeof row.anchorAfterKey === "string" ? row.anchorAfterKey : lastAdminKey,
            appliesToGuideIds: Array.isArray(row.appliesToGuideIds) ? row.appliesToGuideIds.map((id: any) => String(id)) : [],
            country: row.country ?? "",
            displayKey: "",
            guideId: row.guideId ? String(row.guideId) : "",
            level: row.level === "country" || row.level === "university" || row.level === "item" ? row.level : "item",
            ownerUserId: row.ownerUserId ?? session.user.id,
            readOnly: false,
            task: row.task ?? "",
            university: row.university ?? "",
          } satisfies MaterialRowEditor;
        })
        .filter(Boolean)
        .map((row: any) => ({
          ...row,
        })) || [createEmptyMaterialRow()],
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
      const payload = await apiFetch<any>("/mentor/material-templates", undefined, token);
      setMentorMaterialTemplates(payload.templates ?? []);
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

  return (
    <>
      {status ? <div className="status">{status}</div> : null}
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
                <div className="field">
                  <label>Strefa czasowa</label>
                  <input value={profile.timezone ?? "Europe/Warsaw"} onChange={(event) => setProfile((current: any) => ({ ...current, timezone: event.target.value }))} />
                </div>
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
          </div>
        </div>
      ) : null}
      {section === "availability" ? (
        <div className="dashboard-card">
          <h2>Dostępność mentora</h2>
          <p className="muted">
            Te reguły są już zapisane osobno w bazie. Po podpięciu prawdziwego Google Calendar backend będzie na nich opierał sprawdzanie wolnych slotów.
          </p>
          <div className="list" style={{ marginTop: 18 }}>
            {availability.map((rule, index) => (
              <div className="grid-2" key={index}>
                <div className="field">
                  <label>Dzień tygodnia (0-6)</label>
                  <input
                    type="number"
                    value={rule.weekday}
                    onChange={(event) =>
                      setAvailability((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, weekday: Number(event.target.value) } : entry,
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
                      setAvailability((current) =>
                        current.map((entry, entryIndex) =>
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
                  <label>Od</label>
                  <input
                    value={rule.startTime}
                    onChange={(event) =>
                      setAvailability((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, startTime: event.target.value } : entry,
                        ),
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>Do</label>
                  <input
                    value={rule.endTime}
                    onChange={(event) =>
                      setAvailability((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, endTime: event.target.value } : entry,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="button-row" style={{ marginTop: 18 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setAvailability((current) => [...current, { weekday: 1, startTime: "16:00", endTime: "18:00", isActive: true }])}
              type="button"
            >
              Dodaj regułę
            </button>
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
                        {guide.universityName} • {guide.country}
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
                        {guide.country} • {guide.universityName}
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
                      <div className="button-row">
                        <button className="btn btn-secondary" onClick={() => addMentorRowAtAnchor(row.anchorAfterKey ?? "")} type="button">Dodaj przed</button>
                        <button className="btn btn-secondary" onClick={() => addMentorRowAtAnchor(row.displayKey ?? "")} type="button">Dodaj pod</button>
                        {!row.readOnly ? (
                          <button className="btn btn-secondary" onClick={() => setMentorMaterialRows((current) => current.filter((_, rowIndex) => rowIndex !== mentorIndex) || [createEmptyMaterialRow()])} type="button">Usuń</button>
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
                          <label>Link do wskazówek</label>
                          <select
                            disabled={row.readOnly}
                            value={row.guideId}
                            onChange={(event) => updateMentorRow(mentorIndex, (entry) => ({ ...entry, guideId: event.target.value }))}
                          >
                            <option value="">Brak</option>
                            {guides.filter((guide) => guide.guideType === "mentor_blueprint").map((guide) => (
                              <option key={`mentor-item-guide-${guide.id}`} value={String(guide.id)}>
                                {guide.universityName} • {guide.title}
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
                  <button className="btn btn-secondary" onClick={() => addMentorRowAtAnchor("")} type="button">Dodaj wiersz na górze</button>
                  <button className="btn btn-secondary" onClick={() => addMentorRowAtAnchor(mentorMaterialDisplayRows.filter((row) => row.readOnly).slice(-1)[0]?.displayKey ?? "")} type="button">Dodaj wiersz na końcu</button>
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
          <p className="muted">Domyślny czas spotkania to 30 minut, ale przy każdym wpisie możesz potem zanotować faktyczny czas trwania i status.</p>
          <div className="list" style={{ marginTop: 18 }}>
            {meetings.map((meeting) => (
              <div className="list-item" key={meeting.id}>
                <header>
                  <div>
                    <h3>{meeting.title}</h3>
                    <div className="muted small">{new Date(meeting.startsAt).toLocaleString("pl-PL")}</div>
                  </div>
                  <span className="badge">{meeting.status}</span>
                </header>
                <p className="muted">{meeting.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function MenteeSection({
  section,
  token,
}: {
  section: string;
  token: string;
}) {
  const [overview, setOverview] = useState<any>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [publicGuides, setPublicGuides] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [openHintGuide, setOpenHintGuide] = useState<any | null>(null);
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [meetingForm, setMeetingForm] = useState({
    mentorUserId: "",
    title: "Spotkanie mentoringowe",
    description: "",
    startsAt: "",
    endsAt: "",
    timezone: "Europe/Warsaw",
    method: "zoom_link",
    meetingUrl: "",
  });

  const profileFields = overview?.profileFields ?? [];
  const assignedMentors = overview?.assignedMentors ?? [];
  const availableGuideTemplates = overview?.availableGuideTemplates ?? [];
  const guideLimits = overview?.guideLimits ?? { maxActiveGuideCount: 3, maxHintGuideCount: 3 };
  const materialTemplates = overview?.materialTemplates ?? [];
  const hintGuides = overview?.hintGuides ?? [];
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
  const derivedMaterialTemplates = buildDerivedMaterialTemplates(guides ?? [], materialTemplates ?? []);
  const visibleMaterialTemplates = [
    ...(materialTemplates ?? []),
    ...derivedMaterialTemplates,
  ];
  const guideMaterialsMap = new Map(
    (guides ?? []).map((guide: any) => [
      guide.id,
      visibleMaterialTemplates
        .filter((template: any) => templateAppliesToGuide(template, guide))
        .map((template: any) => ({
          ...template,
          visibleRows: Array.isArray(template.structure)
            ? template.structure.filter((row: any) => rowAppliesToGuide(row, guide))
            : [],
        })),
    ]),
  );
  useEffect(() => {
    if (section === "universities" || section === "materials" || section === "profile" || section === "meetings") {
      void apiFetch<any>("/mentee/overview", undefined, token).then((payload) => {
        setOverview(payload);
        setGuides(payload.guides ?? []);
        const nextValues: Record<string, string> = {};
        const responses = new Map<number, string>((payload.profileResponses ?? []).map((entry: any) => [entry.fieldId, String(entry.value ?? "")]));
        for (const field of payload.profileFields ?? []) {
          nextValues[String(field.id)] = responses.get(field.id) ?? "";
        }
        setProfileValues(nextValues);
      }).catch((error) => setStatus(error.message));
    }
    if (section === "mentors") {
      void apiFetch<any[]>("/public/mentors").then(setMentors).catch((error) => setStatus(error.message));
    }
    if (section === "universities" || section === "materials") {
      void apiFetch<any[]>("/public/guides").then(setPublicGuides).catch((error) => setStatus(error.message));
    }
  }, [section, token]);

  async function requestMeeting(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    try {
      await apiFetch("/mentee/meetings", {
        method: "POST",
        body: JSON.stringify({
          ...meetingForm,
          mentorUserId: Number(meetingForm.mentorUserId),
          startsAt: new Date(meetingForm.startsAt).toISOString(),
          endsAt: new Date(meetingForm.endsAt).toISOString(),
        }),
      }, token);
      setStatus("Prośba o spotkanie została zapisana.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać spotkania.");
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
    try {
      await apiFetch(`/mentee/guides/${templateId}/adopt`, { method: "POST" }, token);
      const payload = await apiFetch<any>("/mentee/overview", undefined, token);
      setOverview(payload);
      setGuides(payload.guides ?? []);
      setStatus("Uczelnia została dodana do Twojego panelu.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się dodać uczelni.");
    }
  }

  async function resignUniversity(guideId: number) {
    setStatus("");
    try {
      await apiFetch(`/mentee/guides/${guideId}/resign`, { method: "PATCH" }, token);
      const payload = await apiFetch<any>("/mentee/overview", undefined, token);
      setOverview(payload);
      setGuides(payload.guides ?? []);
      setStatus("Uczelnia została usunięta z Twojego panelu.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się usunąć uczelni.");
    }
  }

  return (
    <>
      {status ? <div className="status">{status}</div> : null}
      {section === "universities" && overview ? (
        <div className="stack">
          <div className="dashboard-card">
            <h2>Dostęp do wskazówek</h2>
            <p className="muted">
              Możesz mieć jednocześnie do <strong>{guideLimits.maxActiveGuideCount}</strong> aktywnych uczelni.
              Wskazówki są aktywne maksymalnie dla <strong>{guideLimits.maxHintGuideCount}</strong> uczelni.
            </p>
            {tipAccessGuides.length ? (
              <div className="list" style={{ marginTop: 16 }}>
                {tipAccessGuides.map((guide: any) => (
                  <div className="list-item" key={`tip-access-guide-${guide.id}`}>
                    <h3>{guide.universityName}</h3>
                    <div className="small muted">{guide.country} • {guide.universityName}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="small muted" style={{ marginTop: 12 }}>
                Obecnie nie masz aktywnego dostępu do wskazówek żadnej uczelni.
              </div>
            )}
          </div>
          <div className="dashboard-card">
            <h2>Twoje Uczelnie</h2>
            <p className="muted">Tutaj widzisz swoje aktywne uczelnie. Po kliknięciu kafla otwierasz checklistę i wymagania przypisane do tej konkretnej aplikacji.</p>
            <div className="tile-grid" style={{ marginTop: 18 }}>
              {guides.map((guide: any) => (
                <details className="tile tile-detail" key={guide.id}>
                  <summary>
                    <strong>{guide.universityName}</strong>
                    <div className="small muted">{guide.country}</div>
                    <div className="small muted">{guide.title}</div>
                  </summary>
                  <div style={{ marginTop: 12 }}>
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
                          <details className="list-item nested-detail" key={`${guide.id}-${template.id}`}>
                            <summary>
                              <h3>{template.title}</h3>
                            </summary>
                            {template.description ? <p className="muted" style={{ marginTop: 10 }}>{template.description}</p> : null}
                            {template.visibleRows?.length ? (
                              <div className="list" style={{ marginTop: 10 }}>
                                {template.visibleRows
                                  .filter((row: any) => row.level === "item")
                                  .map((row: any, index: number) => {
                                    const applicableGuides = guides.filter((entry: any) => rowAppliesToGuide(row, entry));
                                    const universityNames = uniqueStrings(applicableGuides.map((entry: any) => entry.universityName));
                                    const showHints = row.guideId && hintEligibleTemplateIds.includes(getGuideTemplateId(guide));
                                    const hintGuide = row.guideId ? hintGuideMap.get(String(row.guideId)) : null;
                                    return (
                                      <div className="list-item" key={`${guide.id}-${template.id}-row-${index}`}>
                                        <h3>{row.task || "Zadanie"}</h3>
                                        {universityNames.length ? (
                                          <div className="small muted">{universityNames.join(" • ")}</div>
                                        ) : null}
                                        {showHints && hintGuide ? (
                                          <div className="button-row" style={{ marginTop: 8 }}>
                                            <button
                                              className="btn btn-secondary"
                                              onClick={() => setOpenHintGuide(hintGuide)}
                                              type="button"
                                            >
                                              Otwórz wskazówki
                                            </button>
                                          </div>
                                        ) : null}
                                        {row.alternativeOptions?.length ? (
                                          <div className="small muted" style={{ marginTop: 6 }}>
                                            Alternatywnie: {row.alternativeOptions.join(" • ")}
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                              </div>
                            ) : null}
                          </details>
                        ))}
                      </div>
                    ) : (guide.items ?? []).length ? (
                      <div className="list">
                        {(guide.items ?? []).map((item: any) => (
                          <div className="list-item" key={item.id ?? `${guide.id}-${item.title}`}>
                            <h3>{item.title}</h3>
                            <div className="muted small">{item.sectionTitle} • {item.itemType}</div>
                            <p className="muted">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="status">Dla tej uczelni nie ma jeszcze przypiętych materiałów.</div>
                    )}
                  </div>
                </details>
              ))}
            </div>
            {!guides.length ? <div className="status">Nie masz jeszcze żadnej aktywnej uczelni.</div> : null}
          </div>
          {availableGuideTemplates.length ? (
            <div className="dashboard-card panel-scroll">
              <h2>Dodaj kolejną uczelnię</h2>
              <p className="muted">Te uczelnie ACADEA możesz samodzielnie dodać do swojego panelu.</p>
              <div className="tile-grid" style={{ marginTop: 18 }}>
                {availableGuideTemplates.map((guide: any) => (
                  <div className="tile" key={`available-${guide.id}`}>
                    <strong>{guide.universityName}</strong>
                    <div className="small muted">{guide.country}</div>
                    <div className="small muted" style={{ marginTop: 4 }}>{guide.title}</div>
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
                      {guide.country} • {guide.universityName}
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
                  <p className="muted">{mentor.bio}</p>
                  {assignedMentors.some((assignedMentor: any) => assignedMentor.mentorId === mentor.id) ? (
                    <div className="button-row">
                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          setMeetingForm((current) => ({
                            ...current,
                            mentorUserId: String(mentor.id),
                          }))
                        }
                        type="button"
                      >
                        Wybierz do spotkania
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="dashboard-card">
            <h2>Umów spotkanie</h2>
            <form className="stack" onSubmit={requestMeeting}>
              <div className="field">
                <label>Przydzielony mentor</label>
                <select
                  value={meetingForm.mentorUserId}
                  onChange={(event) => setMeetingForm((current) => ({ ...current, mentorUserId: event.target.value }))}
                >
                  <option value="">Wybierz mentora</option>
                  {assignedMentors.map((mentor: any) => (
                    <option key={mentor.mentorId} value={String(mentor.mentorId)}>
                      {mentor.fullName}
                    </option>
                  ))}
                </select>
              </div>
              {selectedMentor ? (
                <div className="status">
                  Wybrany mentor: <strong>{selectedMentor.fullName}</strong>. Na tym etapie zapisujesz prośbę o spotkanie.
                </div>
              ) : null}
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
              <div className="field">
                <label>Opis spotkania</label>
                <textarea value={meetingForm.description} onChange={(event) => setMeetingForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <button className="btn btn-primary">Zapisz prośbę o spotkanie</button>
            </form>
          </div>
        </div>
      ) : null}
      {section === "meetings" && overview ? (
        <div className="dashboard-card">
          <h2>Twoje spotkania</h2>
          <div className="list">
            {(overview.meetings ?? []).map((meeting: any) => (
              <div className="list-item" key={meeting.id}>
                <header>
                  <div>
                    <h3>{meeting.title}</h3>
                    <div className="muted small">{new Date(meeting.startsAt).toLocaleString("pl-PL")}</div>
                  </div>
                  <span className="badge">{meeting.status}</span>
                </header>
                <p className="muted">{meeting.description}</p>
              </div>
            ))}
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
      {section === "materials" && overview ? (
        <div className="stack">
          <div className="dashboard-card">
            <h2>Twoje Materiały</h2>
            <p className="muted">Tutaj zbierają się wszystkie materiały wymagane przez Twoje uczelnie. Dokumenty wspólne są łączone razem, a eseje i zadania pokazują, do których krajów i uczelni należą.</p>
            <div className="tile-grid" style={{ marginTop: 18 }}>
              {visibleMaterialTemplates.map((template: any) => (
                <details className="tile tile-detail" key={template.id}>
                  <summary>
                    <strong>{template.title}</strong>
                    <div className="small muted">
                      {guides.filter((guide: any) => templateAppliesToGuide(template, guide)).length} uczelni powiązanych
                    </div>
                  </summary>
                  <div style={{ marginTop: 12 }}>
                    <p className="muted">{template.description}</p>
                    <div className="status">
                      Placeholder upload box. W następnym etapie podmienimy to na Google Drive / pliki użytkownika.
                    </div>
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
                    {(template.structure ?? []).length ? (
                      <div className="list" style={{ marginTop: 12 }}>
                        {(template.structure ?? []).map((row: any, index: number) => {
                          const applicableGuides = guides.filter((guide: any) => rowAppliesToGuide(row, guide));
                          const universityNames = uniqueStrings(applicableGuides.map((guide: any) => guide.universityName));
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
                          return (
                            <div className="list-item material-row material-row-item" key={`${template.id}-row-${index}`}>
                              <h3>{headline}</h3>
                              {universityNames.length ? (
                                <div className="small muted">{universityNames.join(" • ")}</div>
                              ) : null}
                              {Array.isArray(row.alternativeOptions) && row.alternativeOptions.length ? (
                                <div className="small muted" style={{ marginTop: 8 }}>
                                  Alternatywnie: {row.alternativeOptions.join(" • ")}
                                </div>
                              ) : null}
                              {showHints && hintGuide ? (
                                <div className="button-row" style={{ marginTop: 8 }}>
                                  <button
                                    className="btn btn-secondary"
                                    onClick={() => setOpenHintGuide(hintGuide)}
                                    type="button"
                                  >
                                    Otwórz wskazówki
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    {template.guideId ? (
                      <details className="small" style={{ marginTop: 12 }}>
                        <summary>Otwórz wskazówki do tego materiału</summary>
                        <div className="muted" style={{ marginTop: 8 }}>
                          Ten materiał ma podpięte dodatkowe wskazówki. Docelowo to będzie popup z pełną treścią.
                        </div>
                      </details>
                    ) : null}
                  </div>
                </details>
              ))}
            </div>
            {!visibleMaterialTemplates.length ? (
              <div className="status">Nie ma jeszcze żadnych materiałów przypisanych do Twoich uczelni.</div>
            ) : null}
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

export default function App() {
  return <AppRouter />;
}
