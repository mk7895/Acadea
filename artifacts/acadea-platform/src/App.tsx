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
        ["guides", "Uczelnie i guide'y"],
        ["designer", "Projektant"],
        ["leads", "Leady"],
      ];
    }
    if (session.user.role === "mentor") {
      return [
        ["overview", "Przegląd"],
        ["profile", "Profil"],
        ["availability", "Dostępność"],
        ["guides", "Przewodniki"],
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
  const [mentorAssignments, setMentorAssignments] = useState<any[]>([]);
  const [guideAssignments, setGuideAssignments] = useState<any[]>([]);
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
  const [guideAccessForm, setGuideAccessForm] = useState({
    guideId: "",
    menteeUserId: "",
  });
  const [guideCloneForm, setGuideCloneForm] = useState({
    guideId: "",
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
    estimatedReadMin: 8,
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
  const [materialForm, setMaterialForm] = useState({
    title: "",
    description: "",
    templateType: "passport_like",
    guideId: "",
    appliesToGuideIdsText: "",
    structureText:
      "Polska > University College London > Personal statement\nPolska > University College London > Recommendation letter",
    alternativeOptionsText: "dodane bezpośrednio do systemu uczelni\nomówione z mentorem",
    isActive: true,
  });

  const mentorUsers = users.filter((user) => user.role === "mentor");
  const menteeUsers = users.filter((user) => user.role === "mentee");
  const adminUsers = users.filter((user) => user.role === "admin");

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
      estimatedReadMin: 8,
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
      estimatedReadMin: guide.estimatedReadMin ?? 8,
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
      guideAssignments: any[];
      menteeProfiles: any[];
      mentorAssignments: any[];
      mentorProfiles: any[];
      users: any[];
    }>("/admin/users", undefined, token);
    setUsers(payload.users);
    setMentorProfiles(payload.mentorProfiles);
    setMenteeProfiles(payload.menteeProfiles);
    setMentorAssignments(payload.mentorAssignments);
    setGuideAssignments(payload.guideAssignments);
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
      appliesToGuideIdsText: "",
      structureText:
        "Polska > University College London > Personal statement\nPolska > University College London > Recommendation letter",
      alternativeOptionsText: "dodane bezpośrednio do systemu uczelni\nomówione z mentorem",
      isActive: true,
    });
  }

  function loadMaterialIntoEditor(material: any) {
    setMaterialEditorId(String(material.id));
    setMaterialForm({
      title: material.title ?? "",
      description: material.description ?? "",
      templateType: material.templateType ?? "passport_like",
      guideId: material.guideId ? String(material.guideId) : "",
      appliesToGuideIdsText: (material.appliesToGuideIds ?? []).join(", "),
      structureText: (material.structure ?? [])
        .map((row: any) => [row.country, row.university, row.task].filter(Boolean).join(" > "))
        .join("\n"),
      alternativeOptionsText: (material.alternativeOptions ?? []).join("\n"),
      isActive: Boolean(material.isActive),
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
    if (section === "designer") {
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
      estimatedReadMin: Number(guideForm.estimatedReadMin),
      menteeUserId: guideForm.menteeUserId ? Number(guideForm.menteeUserId) : null,
      sourceGuideId: guideForm.sourceGuideId ? Number(guideForm.sourceGuideId) : null,
      driveFolderUrl: guideForm.driveFolderUrl,
      isVisibleToUnapprovedUsers: guideForm.isVisibleToUnapprovedUsers,
      items: parseGuideItemsFromText(guideForm.itemsText),
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
    const appliesToGuideIds = materialForm.appliesToGuideIdsText
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);
    const structure = materialForm.structureText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [country = "", university = "", task = ""] = line.split(">").map((part) => part.trim());
        return { country, university, task };
      });
    const alternativeOptions = materialForm.alternativeOptionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const payload = {
      title: materialForm.title,
      description: materialForm.description,
      templateType: materialForm.templateType,
      guideId: materialForm.guideId ? Number(materialForm.guideId) : null,
      appliesToGuideIds,
      structure,
      alternativeOptions,
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

  const mentorProfileMap = new Map(mentorProfiles.map((profile) => [profile.userId, profile]));
  const menteeProfileMap = new Map(menteeProfiles.map((profile) => [profile.userId, profile]));

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
            <div className="dashboard-card">
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
            <div className="dashboard-card">
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
          <div className="dashboard-card">
            <h2>Użytkownicy</h2>
            <div className="list">
              {[...adminUsers, ...mentorUsers, ...menteeUsers].map((user) => {
                const mentorProfile = mentorProfileMap.get(user.id);
                const menteeProfile = menteeProfileMap.get(user.id);
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
                      <p className="muted">Akceptacja mentora: <strong>{mentorApproved ? "tak" : "nie"}</strong>.</p>
                    ) : null}
                    {user.role === "mentee" ? (
                      <p className="muted">Akceptacja mentee: <strong>{menteeApproved ? "tak" : "nie"}</strong>.</p>
                    ) : null}
                    <div className="button-row">
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
            <div className="dashboard-card">
              <h2>{editingGuideId === "new" ? "Nowy przewodnik" : "Edytor przewodnika"}</h2>
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
                    <label>Typ</label>
                    <select value={guideForm.guideType} onChange={(event) => setGuideForm((current) => ({ ...current, guideType: event.target.value }))}>
                      <option value="admin_template">admin_template</option>
                      <option value="mentor_blueprint">mentor_blueprint</option>
                      <option value="mentor_live">mentor_live</option>
                      <option value="self_service_live">self_service_live</option>
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
                <div className="grid-2">
                  <div className="field">
                    <label>Czas czytania (min)</label>
                    <input
                      min={1}
                      type="number"
                      value={guideForm.estimatedReadMin}
                      onChange={(event) => setGuideForm((current) => ({ ...current, estimatedReadMin: Number(event.target.value) }))}
                    />
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
                  <label>Checklist lines: sekcja|tytuł|opis|typ</label>
                  <textarea value={guideForm.itemsText} onChange={(event) => setGuideForm((current) => ({ ...current, itemsText: event.target.value }))} />
                </div>
                <div className="button-row">
                  <button className="btn btn-primary">{editingGuideId === "new" ? "Utwórz przewodnik" : "Zapisz zmiany"}</button>
                  <button className="btn btn-secondary" onClick={resetGuideForm} type="button">
                    Wyczyść formularz
                  </button>
                </div>
              </form>
            </div>
            <div className="dashboard-card">
              <h2>Dostęp do przewodników</h2>
              <form
                className="stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!guideAccessForm.guideId || !guideAccessForm.menteeUserId) {
                    setStatus("Wybierz przewodnik i mentee.");
                    return;
                  }
                  void runGuideAction(
                    Number(guideAccessForm.guideId),
                    async () => {
                      await apiFetch("/admin/guide-access", {
                        method: "POST",
                        body: JSON.stringify({
                          guideId: Number(guideAccessForm.guideId),
                          menteeUserId: Number(guideAccessForm.menteeUserId),
                        }),
                      }, token);
                    },
                    "Dostęp do przewodnika został nadany.",
                  );
                }}
              >
                <div className="field">
                  <label>Przewodnik</label>
                  <select value={guideAccessForm.guideId} onChange={(event) => setGuideAccessForm((current) => ({ ...current, guideId: event.target.value }))}>
                    <option value="">Wybierz przewodnik</option>
                    {guides
                      .filter((guide) => guide.guideType === "admin_template" || guide.guideType === "mentor_blueprint")
                      .map((guide) => (
                        <option key={guide.id} value={String(guide.id)}>
                          {guide.title}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="field">
                  <label>Mentee</label>
                  <select value={guideAccessForm.menteeUserId} onChange={(event) => setGuideAccessForm((current) => ({ ...current, menteeUserId: event.target.value }))}>
                    <option value="">Wybierz mentee</option>
                    {menteeUsers.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-primary">Nadaj dostęp</button>
              </form>
              <div className="list" style={{ marginTop: 18 }}>
                {guideAssignments.map((assignment) => {
                  const guide = guides.find((entry) => entry.id === assignment.guideId);
                  const mentee = users.find((user) => user.id === assignment.menteeUserId);
                  return (
                    <div className="list-item" key={assignment.id}>
                      <header>
                        <div>
                          <h3>{guide?.title ?? `Guide #${assignment.guideId}`}</h3>
                          <div className="muted small">dla {mentee?.fullName ?? `Mentee #${assignment.menteeUserId}`}</div>
                        </div>
                        <button
                          className="btn btn-secondary"
                          disabled={guideActionId === assignment.guideId}
                          onClick={() =>
                            void runGuideAction(
                              assignment.guideId,
                              async () => {
                                await apiFetch(`/admin/guide-access/${assignment.id}`, { method: "DELETE" }, token);
                              },
                              "Dostęp do przewodnika został usunięty.",
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
          <div className="split">
            <div className="dashboard-card">
              <h2>Nadaj gotowy guide mentee</h2>
              <form
                className="stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!guideCloneForm.guideId || !guideCloneForm.menteeUserId) {
                    setStatus("Wybierz przewodnik i mentee.");
                    return;
                  }
                  void runGuideAction(
                    Number(guideCloneForm.guideId),
                    async () => {
                      await apiFetch(`/admin/guides/${guideCloneForm.guideId}/assign`, {
                        method: "POST",
                        body: JSON.stringify({
                          menteeUserId: Number(guideCloneForm.menteeUserId),
                          mentorUserId: guideCloneForm.mentorUserId ? Number(guideCloneForm.mentorUserId) : null,
                        }),
                      }, token);
                    },
                    "Guide został skopiowany do mentee.",
                  );
                }}
              >
                <div className="field">
                  <label>Źródłowy przewodnik</label>
                  <select value={guideCloneForm.guideId} onChange={(event) => setGuideCloneForm((current) => ({ ...current, guideId: event.target.value }))}>
                    <option value="">Wybierz przewodnik</option>
                    {guides.map((guide) => (
                      <option key={guide.id} value={String(guide.id)}>
                        {guide.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Mentee</label>
                  <select value={guideCloneForm.menteeUserId} onChange={(event) => setGuideCloneForm((current) => ({ ...current, menteeUserId: event.target.value }))}>
                    <option value="">Wybierz mentee</option>
                    {menteeUsers.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Mentor docelowy (opcjonalnie)</label>
                  <select value={guideCloneForm.mentorUserId} onChange={(event) => setGuideCloneForm((current) => ({ ...current, mentorUserId: event.target.value }))}>
                    <option value="">Brak mentora</option>
                    {mentorUsers.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-primary">Przydziel guide</button>
              </form>
            </div>
            <div className="dashboard-card">
              <h2>Przewodniki w systemie</h2>
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
                    <div className="small muted">{guide.items?.length ?? 0} pozycji checklisty • {guide.estimatedReadMin} min czytania</div>
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
      {section === "designer" ? (
        <div className="stack">
          <div className="split">
            <div className="dashboard-card">
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
          <div className="split">
            <div className="dashboard-card">
              <h2>Projektant „Twoich Materiałów”</h2>
              <form className="stack" onSubmit={saveMaterialTemplate}>
                <div className="grid-2">
                  <div className="field">
                    <label>Nazwa tile’a</label>
                    <input value={materialForm.title} onChange={(event) => setMaterialForm((current) => ({ ...current, title: event.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Typ</label>
                    <select value={materialForm.templateType} onChange={(event) => setMaterialForm((current) => ({ ...current, templateType: event.target.value }))}>
                      <option value="passport_like">passport_like</option>
                      <option value="essay_like">essay_like</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Opis</label>
                  <textarea value={materialForm.description} onChange={(event) => setMaterialForm((current) => ({ ...current, description: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Powiązany guide pomocniczy (opcjonalnie)</label>
                  <select value={materialForm.guideId} onChange={(event) => setMaterialForm((current) => ({ ...current, guideId: event.target.value }))}>
                    <option value="">Brak</option>
                    {guides.map((guide) => (
                      <option key={guide.id} value={String(guide.id)}>
                        #{guide.id} {guide.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>ID guide’ów, do których materiał się stosuje (po przecinku)</label>
                  <input value={materialForm.appliesToGuideIdsText} onChange={(event) => setMaterialForm((current) => ({ ...current, appliesToGuideIdsText: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Struktura materiału, linie w formacie: kraj &gt; uczelnia &gt; zadanie</label>
                  <textarea value={materialForm.structureText} onChange={(event) => setMaterialForm((current) => ({ ...current, structureText: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Alternatywne oznaczenia wykonania, po jednej opcji w linii</label>
                  <textarea value={materialForm.alternativeOptionsText} onChange={(event) => setMaterialForm((current) => ({ ...current, alternativeOptionsText: event.target.value }))} />
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
                  <button className="btn btn-secondary" onClick={resetMaterialForm} type="button">
                    Nowy materiał
                  </button>
                </div>
              </form>
            </div>
            <div className="dashboard-card">
              <h2>Szablony materiałów</h2>
              <div className="list">
                {materialTemplates.map((template) => (
                  <div className="list-item" key={template.id}>
                    <header>
                      <div>
                        <h3>{template.title}</h3>
                        <div className="muted small">{template.templateType} • {(template.appliesToGuideIds ?? []).length} powiązań guide</div>
                      </div>
                      <span className="badge">{template.isActive ? "active" : "inactive"}</span>
                    </header>
                    <p className="muted">{template.description}</p>
                    <div className="button-row">
                      <button className="btn btn-secondary" onClick={() => loadMaterialIntoEditor(template)} type="button">
                        Edytuj
                      </button>
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
  const [profile, setProfile] = useState<any>(session.mentorProfile ?? {});
  const [availability, setAvailability] = useState([{ weekday: 1, startTime: "16:00", endTime: "18:00", isActive: true }]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [universityForm, setUniversityForm] = useState({ country: "", universityName: "", programName: "", summary: "" });
  const [guideForm, setGuideForm] = useState({
    guideType: "mentor_blueprint",
    status: "draft",
    title: "",
    slug: "",
    country: "",
    universityName: "",
    summary: "",
    descriptionMarkdown: "",
    estimatedReadMin: 8,
    itemsText: "Checklist|Personal statement|Napisz pierwszy szkic eseju\ntodo",
  });

  useEffect(() => {
    if (section === "profile" || section === "availability") {
      void apiFetch<any>("/mentor/profile", undefined, token)
        .then((payload) => {
          setProfile(payload.profile ?? {});
          setUniversities(payload.universities ?? []);
          setAvailability(payload.availability?.length ? payload.availability : availability);
        })
        .catch((error) => setStatus(error.message));
    }
    if (section === "guides") {
      void apiFetch<any[]>("/mentor/guides", undefined, token).then(setGuides).catch((error) => setStatus(error.message));
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
          timezone: profile.timezone || "Europe/Warsaw",
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
      const created = await apiFetch<any>("/mentor/universities", {
        method: "POST",
        body: JSON.stringify(universityForm),
      }, token);
      setUniversities((current) => [...current, created]);
      setUniversityForm({ country: "", universityName: "", programName: "", summary: "" });
      setStatus("Dodano uczelnię do profilu.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się dodać uczelni.");
    }
  }

  async function createGuide(event: React.FormEvent) {
    event.preventDefault();
    const items = guideForm.itemsText
      .split("\n")
      .map((line, index) => line.trim())
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

    try {
      const created = await apiFetch<any>("/mentor/guides", {
        method: "POST",
        body: JSON.stringify({
          ...guideForm,
          items,
        }),
      }, token);
      setGuides((current) => [created, ...current]);
      setStatus("Przewodnik został utworzony.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się utworzyć przewodnika.");
    }
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
                <label>Link spotkań</label>
                <input value={profile.meetingLink ?? ""} onChange={(event) => setProfile((current: any) => ({ ...current, meetingLink: event.target.value }))} />
              </div>
              <div className="field">
                <label>Folder Google Drive mentora</label>
                <input value={profile.googleDriveFolderUrl ?? ""} onChange={(event) => setProfile((current: any) => ({ ...current, googleDriveFolderUrl: event.target.value }))} />
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
              <button className="btn btn-primary">Dodaj wpis</button>
            </form>
            <div className="list" style={{ marginTop: 18 }}>
              {universities.map((university) => (
                <div className="list-item" key={university.id}>
                  <h3>{university.universityName}</h3>
                  <div className="muted small">{university.country}</div>
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
            <h2>Nowy blueprint aplikacji</h2>
            <form className="stack" onSubmit={createGuide}>
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
                  <label>Kraj</label>
                  <input value={guideForm.country} onChange={(event) => setGuideForm((current) => ({ ...current, country: event.target.value }))} />
                </div>
                <div className="field">
                  <label>Uczelnia</label>
                  <input value={guideForm.universityName} onChange={(event) => setGuideForm((current) => ({ ...current, universityName: event.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Opis</label>
                <textarea value={guideForm.descriptionMarkdown} onChange={(event) => setGuideForm((current) => ({ ...current, descriptionMarkdown: event.target.value }))} />
              </div>
              <div className="field">
                <label>Checklist lines: sekcja|tytuł|opis|typ</label>
                <textarea value={guideForm.itemsText} onChange={(event) => setGuideForm((current) => ({ ...current, itemsText: event.target.value }))} />
              </div>
              <button className="btn btn-primary">Utwórz blueprint</button>
            </form>
          </div>
          <div className="dashboard-card">
            <h2>Twoje przewodniki</h2>
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
                  <div className="small muted">{guide.items?.length ?? 0} pozycji checklisty</div>
                </div>
              ))}
            </div>
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
  const assignedGuideTemplates = overview?.assignedGuideTemplates ?? [];
  const materialTemplates = overview?.materialTemplates ?? [];
  const selectedMentor = assignedMentors.find(
    (mentor: any) => String(mentor.mentorId) === String(meetingForm.mentorUserId),
  );
  const universityTiles = [
    ...(assignedGuideTemplates ?? []),
    ...(guides ?? []),
  ].filter(
    (guide: any, index: number, array: any[]) =>
      array.findIndex((entry) => entry.id === guide.id) === index,
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

  return (
    <>
      {status ? <div className="status">{status}</div> : null}
      {section === "universities" && overview ? (
        <div className="stack">
          <div className="dashboard-card">
            <h2>Twoje Uczelnie</h2>
            <p className="muted">Każda karta odpowiada jednej uczelni lub jednemu przydzielonemu guide’owi. Po kliknięciu otwierasz checklistę i materiały przypisane do tej konkretnej ścieżki aplikacyjnej.</p>
            <div className="tile-grid" style={{ marginTop: 18 }}>
              {universityTiles.map((guide: any) => (
                <details className="tile tile-detail" key={guide.id}>
                  <summary>
                    <strong>{guide.universityName}</strong>
                    <div className="small muted">{guide.country}</div>
                    <div className="small muted">{guide.title}</div>
                  </summary>
                  <div style={{ marginTop: 12 }}>
                    <p className="muted">{guide.summary}</p>
                    <div className="list">
                      {(guide.items ?? []).map((item: any) => (
                        <div className="list-item" key={item.id ?? `${guide.id}-${item.title}`}>
                          <h3>{item.title}</h3>
                          <div className="muted small">{item.sectionTitle} • {item.itemType}</div>
                          <p className="muted">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
          {!(overview.profile as any)?.adminApproved ? (
            <div className="dashboard-card">
              <h2>Preview przed pełnym dostępem</h2>
              <p className="muted">Dopóki administrator nie zatwierdzi Twojego konta lub nie nada konkretnych dostępów, widzisz tylko ograniczony podgląd guide’ów.</p>
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
                  Wybrany mentor: <strong>{selectedMentor.fullName}</strong>. Na tym etapie zapisujesz prośbę o spotkanie, a po integracji Google pojawią się tu realne sloty kalendarzowe.
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
            <p className="muted">Tutaj masz agregat materiałów z przypisanych uczelni. Passport-like są współdzielone między uczelniami, a essay-like pokazują strukturę per kraj/uczelnia/zadanie.</p>
            <div className="tile-grid" style={{ marginTop: 18 }}>
              {materialTemplates.map((template: any) => (
                <details className="tile tile-detail" key={template.id}>
                  <summary>
                    <strong>{template.title}</strong>
                    <div className="small muted">{template.templateType}</div>
                    <div className="small muted">{(template.appliesToGuideIds ?? []).length} uczelni powiązanych</div>
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
                        {(template.structure ?? []).map((row: any, index: number) => (
                          <div className="list-item" key={`${template.id}-row-${index}`}>
                            <h3>{row.task || "Zadanie"}</h3>
                            <div className="small muted">
                              {[row.country, row.university].filter(Boolean).join(" • ")}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {template.guideId ? (
                      <details className="small" style={{ marginTop: 12 }}>
                        <summary>Otwórz wskazówki do tego materiału</summary>
                        <div className="muted" style={{ marginTop: 8 }}>
                          Ten materiał ma podpięty guide pomocniczy `#{template.guideId}`. Docelowo to będzie popup z pełną treścią wskazówek.
                        </div>
                      </details>
                    ) : null}
                  </div>
                </details>
              ))}
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
