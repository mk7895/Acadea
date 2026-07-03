import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  PLATFORM_COOKIE_CONSENT_COOKIE_NAME,
  deleteCookie,
  getCookie,
  setLongLivedCookie,
} from "@/lib/cookies";

type PlatformCookieConsent = {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  consentedAt: string;
};

type DraftPreferences = Omit<PlatformCookieConsent, "necessary" | "consentedAt">;

type CookieConsentContextValue = {
  consent: PlatformCookieConsent | null;
  draft: DraftPreferences;
  isBannerVisible: boolean;
  isPreferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  updateDraft: (patch: Partial<DraftPreferences>) => void;
  acceptAll: () => void;
  rejectOptional: () => void;
  saveDraft: () => void;
  canUsePreferencesCookies: boolean;
};

const defaultDraft: DraftPreferences = {
  preferences: false,
  analytics: false,
  marketing: false,
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function serializeConsent(preferences: DraftPreferences): PlatformCookieConsent {
  return {
    necessary: true,
    preferences: preferences.preferences,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    consentedAt: new Date().toISOString(),
  };
}

function normalizeConsent(raw: unknown): PlatformCookieConsent {
  const parsed = (raw ?? {}) as Partial<PlatformCookieConsent>;
  return {
    necessary: true,
    preferences: Boolean(parsed.preferences),
    analytics: Boolean(parsed.analytics),
    marketing: Boolean(parsed.marketing),
    consentedAt:
      typeof parsed.consentedAt === "string" && parsed.consentedAt.length > 0
        ? parsed.consentedAt
        : new Date().toISOString(),
  };
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<PlatformCookieConsent | null>(null);
  const [draft, setDraft] = useState<DraftPreferences>(defaultDraft);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const primaryRaw = getCookie(PLATFORM_COOKIE_CONSENT_COOKIE_NAME);
    const fallbackRaw = getCookie(COOKIE_CONSENT_COOKIE_NAME);
    const raw = primaryRaw ?? fallbackRaw;
    if (!raw) {
      setLoaded(true);
      return;
    }

    try {
      const parsed = normalizeConsent(JSON.parse(raw));
      const serialized = JSON.stringify(parsed);
      setConsent(parsed);
      setDraft({
        preferences: Boolean(parsed.preferences),
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
      });
      if (primaryRaw !== serialized) {
        setLongLivedCookie(PLATFORM_COOKIE_CONSENT_COOKIE_NAME, serialized);
      }
      if (fallbackRaw !== serialized) {
        setLongLivedCookie(COOKIE_CONSENT_COOKIE_NAME, serialized);
      }
    } catch {
      deleteCookie(PLATFORM_COOKIE_CONSENT_COOKIE_NAME);
      deleteCookie(COOKIE_CONSENT_COOKIE_NAME);
    } finally {
      setLoaded(true);
    }
  }, []);

  function persistConsent(nextDraft: DraftPreferences) {
    const nextConsent = serializeConsent(nextDraft);
    const serializedConsent = JSON.stringify(nextConsent);
    setConsent(nextConsent);
    setDraft(nextDraft);
    setLongLivedCookie(PLATFORM_COOKIE_CONSENT_COOKIE_NAME, serializedConsent);
    setLongLivedCookie(COOKIE_CONSENT_COOKIE_NAME, serializedConsent);
    setIsPreferencesOpen(false);
  }

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      draft,
      isBannerVisible: loaded && !consent,
      isPreferencesOpen,
      openPreferences: () => setIsPreferencesOpen(true),
      closePreferences: () => setIsPreferencesOpen(false),
      updateDraft: (patch) => setDraft((current) => ({ ...current, ...patch })),
      acceptAll: () =>
        persistConsent({
          preferences: true,
          analytics: true,
          marketing: true,
        }),
      rejectOptional: () => persistConsent(defaultDraft),
      saveDraft: () => persistConsent(draft),
      canUsePreferencesCookies: Boolean(consent?.preferences),
    }),
    [consent, draft, isPreferencesOpen, loaded],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      <CookieConsentBanner />
      <CookiePreferencesModal />
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider.");
  }

  return context;
}

function CookieConsentBanner() {
  const { isBannerVisible, acceptAll, rejectOptional, openPreferences } = useCookieConsent();

  if (!isBannerVisible) {
    return null;
  }

  return (
    <div className="cookie-banner-wrap">
      <div className="cookie-banner-card">
        <div className="cookie-banner-copy">
          <p className="eyebrow cookie-eyebrow">Ustawienia cookies</p>
          <h2>Szanujemy Twoją prywatność</h2>
          <p>
            Używamy plików cookies niezbędnych do działania serwisu oraz, za Twoją zgodą,
            plików cookies preferencji, analitycznych i marketingowych. Możemy też zapamiętać
            w trakcie sesji zamknięcie komunikatów wyświetlanych na stronie. Do kategorii
            preferencji zaliczamy też szybsze wczytywanie listy artykułów w Bazie Wiedzy oraz
            tymczasowy cache tej listy w przeglądarce. Więcej informacji znajdziesz w polityce
            prywatności.
          </p>
        </div>
        <div className="cookie-banner-actions">
          <button onClick={rejectOptional} className="btn btn-secondary" type="button">
            Odrzuć opcjonalne
          </button>
          <button onClick={openPreferences} className="btn btn-secondary" type="button">
            Dostosuj
          </button>
          <button onClick={acceptAll} className="btn btn-primary" type="button">
            Akceptuj wszystkie
          </button>
        </div>
      </div>
    </div>
  );
}

function CookiePreferencesModal() {
  const { isPreferencesOpen, closePreferences, draft, updateDraft, saveDraft, rejectOptional, acceptAll } =
    useCookieConsent();

  if (!isPreferencesOpen) {
    return null;
  }

  return (
    <div className="cookie-modal-wrap">
      <div className="cookie-modal-card">
        <div className="cookie-modal-head">
          <div>
            <p className="eyebrow cookie-eyebrow">Centrum preferencji</p>
            <h2>Wybierz kategorie cookies</h2>
          </div>
          <button onClick={closePreferences} className="cookie-close-button" type="button">
            Zamknij
          </button>
        </div>
        <div className="cookie-rows">
          <CookieRow
            title="Niezbędne"
            description="Odpowiadają za podstawowe działanie strony, zgody cookies, zabezpieczenia formularzy oraz zapamiętanie zamknięcia komunikatów w trakcie sesji. Są zawsze aktywne."
            checked
            disabled
            onChange={() => undefined}
          />
          <CookieRow
            title="Preferencje"
            description="Pozwalają zapamiętać ustawienia strony, takie jak wybrana strefa czasowa, uruchomić jednorazowe przyspieszenie wczytywania listy artykułów w Bazie Wiedzy podczas bieżącej sesji oraz przechować tymczasowy cache tej listy w przeglądarce."
            checked={draft.preferences}
            onChange={(checked) => updateDraft({ preferences: checked })}
          />
          <CookieRow
            title="Analityczne"
            description="Będą używane po wdrożeniu narzędzi analitycznych, aby mierzyć ruch i ulepszać stronę."
            checked={draft.analytics}
            onChange={(checked) => updateDraft({ analytics: checked })}
          />
          <CookieRow
            title="Marketingowe"
            description="Będą używane po wdrożeniu narzędzi reklamowych, remarketingowych i pomiaru skuteczności komunikatów zachęcających do kontaktu."
            checked={draft.marketing}
            onChange={(checked) => updateDraft({ marketing: checked })}
          />
        </div>
        <div className="cookie-banner-actions">
          <button onClick={rejectOptional} className="btn btn-secondary" type="button">
            Tylko niezbędne
          </button>
          <button onClick={acceptAll} className="btn btn-secondary" type="button">
            Wszystkie
          </button>
          <button onClick={saveDraft} className="btn btn-primary" type="button">
            Zapisz wybór
          </button>
        </div>
      </div>
    </div>
  );
}

function CookieRow({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="cookie-row">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <label className={`cookie-toggle ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}`}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span />
      </label>
    </div>
  );
}
