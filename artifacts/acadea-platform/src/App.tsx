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

  const isBootstrap = bootstrapStatus?.hasAdmin === false;

  return (
    <AuthShell
      title={isBootstrap ? "Skonfiguruj pierwszego administratora" : "Zaloguj się do platformy"}
      subtitle={
        isBootstrap
          ? "To pierwsze uruchomienie platformy. Utwórz konto administratora, a potem z panelu dodasz mentorów i mentees."
          : "Shell platformy jest już gotowy pod role admina, mentora i mentee, a integracje Google można później podpiąć bez zmiany architektury."
      }
    >
      <form className="stack" onSubmit={isBootstrap ? handleBootstrap : handleLogin}>
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
            {isBootstrap ? "Utwórz administratora" : "Zaloguj się"}
          </button>
          {!isBootstrap ? (
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
  const [section, setSection] = useState("overview");

  const menu = useMemo(() => {
    if (session.user.role === "admin") {
      return [
        ["overview", "Przegląd"],
        ["users", "Użytkownicy"],
        ["guides", "Przewodniki"],
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
      ["overview", "Przegląd"],
      ["mentors", "Mentorzy"],
      ["guides", "Przewodniki"],
      ["meetings", "Spotkania"],
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
    return <AdminSection section={section} token={token} session={session} />;
  }
  if (session.user.role === "mentor") {
    return <MentorSection section={section} token={token} session={session} />;
  }
  return <MenteeSection section={section} token={token} session={session} />;
}

function AdminSection({
  section,
  token,
  session,
}: {
  section: string;
  session: SessionPayload;
  token: string;
}) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
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
  const [userForm, setUserForm] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "mentor",
    status: "active",
  });

  useEffect(() => {
    if (section === "overview") {
      void apiFetch<Overview>("/admin/overview", undefined, token).then(setOverview).catch((error) => setStatus(error.message));
    }
    if (section === "users") {
      void apiFetch<{ users: any[] }>("/admin/users", undefined, token)
        .then((payload) => setUsers(payload.users))
        .catch((error) => setStatus(error.message));
    }
    if (section === "guides") {
      void apiFetch<any[]>("/admin/guides", undefined, token).then(setGuides).catch((error) => setStatus(error.message));
    }
    if (section === "leads") {
      void Promise.all([
        apiFetch<any[]>(`/admin/leads/${leadType}`, undefined, token),
        Promise.all(
          (["contact", "mentor", "scholarship", "newsletter", "booking"] as LeadKind[]).map(async (kind) => {
            const rows = await apiFetch<any[]>(`/admin/leads/${kind}`, undefined, token);
            return [kind, rows.length] as const;
          }),
        ),
      ])
        .then(([selectedRows, countEntries]) => {
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
        })
        .catch((error) => setStatus(error.message));
    }
  }, [leadType, section, token]);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    try {
      await apiFetch("/admin/users", { method: "POST", body: JSON.stringify(userForm) }, token);
      setUserForm({ email: "", fullName: "", password: "", role: "mentor", status: "active" });
      const refreshed = await apiFetch<{ users: any[] }>("/admin/users", undefined, token);
      setUsers(refreshed.users);
      setStatus("Użytkownik został utworzony.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się utworzyć użytkownika.");
    }
  }

  return (
    <>
      {status ? <div className="status">{status}</div> : null}
      {section === "overview" && overview ? (
        <div className="dashboard-card">
          <h2>Przegląd platformy</h2>
          <p className="muted">
            Ten shell ma już osobne role, osobne bazy danych dla aktywności, oraz warstwę pod późniejsze Google Calendar, Drive i Meet.
          </p>
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
        <div className="split">
          <div className="dashboard-card">
            <h2>Utwórz konto</h2>
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
            <h2>Obecni użytkownicy</h2>
            <div className="list">
              {users.map((user) => (
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
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {section === "guides" ? (
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
              </div>
            ))}
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
                        <span className="badge">{formatDate(typeof lead.createdAt === "string" ? lead.createdAt : null)}</span>
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
      <div className="dashboard-card">
        <h2>Stan infrastruktury</h2>
        <p className="muted">
          R2: {session.storage.configured ? `gotowe (${session.storage.bucket})` : "jeszcze niepodpięte"}.
        </p>
      </div>
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
          <p className="muted">
            Masz już miejsce na bio, uczelnie, dostępność, blueprinty guide’ów, statusy spotkań i przygotowane rekordy pod Google Calendar, Drive oraz auto-generated Meet.
          </p>
          <div className="tile-grid" style={{ marginTop: 18 }}>
            <div className="tile">
              <div className="small muted">Połączenia Google</div>
              <strong>{session.googleConnections.length}</strong>
            </div>
            <div className="tile">
              <div className="small muted">Domyślny czas spotkania</div>
              <strong>30 min</strong>
            </div>
            <div className="tile">
              <div className="small muted">R2 gotowe</div>
              <strong>{session.storage.configured ? "tak" : "nie"}</strong>
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
  session,
}: {
  section: string;
  session: SessionPayload;
  token: string;
}) {
  const [overview, setOverview] = useState<any>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
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

  const selectedMentor = mentors.find(
    (mentor) => String(mentor.id) === String(meetingForm.mentorUserId),
  );

  useEffect(() => {
    if (section === "overview" || section === "guides" || section === "meetings") {
      void apiFetch<any>("/mentee/overview", undefined, token).then((payload) => {
        setOverview(payload);
        setGuides(payload.guides ?? []);
      }).catch((error) => setStatus(error.message));
    }
    if (section === "mentors") {
      void apiFetch<any[]>("/public/mentors").then(setMentors).catch((error) => setStatus(error.message));
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
      setStatus("Spotkanie zostało zapisane w shellu platformy.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nie udało się zapisać spotkania.");
    }
  }

  return (
    <>
      {status ? <div className="status">{status}</div> : null}
      {section === "overview" && overview ? (
        <div className="dashboard-card">
          <h2>Twoje konto mentee</h2>
          <p className="muted">
            Jeśli administrator już Cię zatwierdził, możesz umawiać spotkania, adoptować adminowe guide’y i później przejść do pełnej współpracy z mentorem bez zmiany modelu danych.
          </p>
          <div className="tile-grid" style={{ marginTop: 18 }}>
            <div className="tile">
              <div className="small muted">Przewodniki</div>
              <strong>{overview.guides?.length ?? 0}</strong>
            </div>
            <div className="tile">
              <div className="small muted">Spotkania</div>
              <strong>{overview.meetings?.length ?? 0}</strong>
            </div>
            <div className="tile">
              <div className="small muted">Akceptacja admina</div>
              <strong>{String((overview.profile as any)?.adminApproved ?? false)}</strong>
            </div>
          </div>
        </div>
      ) : null}
      {section === "mentors" ? (
        <div className="split">
          <div className="dashboard-card">
            <h2>Mentorzy</h2>
            <p className="muted">
              Ten etap jest tymczasowy: teraz zapisujesz prośbę o spotkanie ręcznie, a po wdrożeniu Google Calendar/OAuth to miejsce zostanie podmienione na prawdziwe wolne sloty mentorów.
            </p>
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
                      Wybierz tego mentora
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="dashboard-card">
            <h2>Umów spotkanie</h2>
            <form className="stack" onSubmit={requestMeeting}>
              <div className="field">
                <label>Mentor</label>
                <select
                  value={meetingForm.mentorUserId}
                  onChange={(event) => setMeetingForm((current) => ({ ...current, mentorUserId: event.target.value }))}
                >
                  <option value="">Wybierz mentora</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.id} value={String(mentor.id)}>
                      {mentor.fullName}
                    </option>
                  ))}
                </select>
              </div>
              {selectedMentor ? (
                <div className="status">
                  Wybrany mentor: <strong>{selectedMentor.fullName}</strong>. Po wdrożeniu integracji Google to tutaj pojawią się jego rzeczywiste wolne terminy.
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
      {section === "guides" ? (
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
              </div>
            ))}
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
