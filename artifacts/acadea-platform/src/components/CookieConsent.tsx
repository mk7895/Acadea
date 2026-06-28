import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  PLATFORM_COOKIE_CONSENT_COOKIE_NAME,
  deleteCookie,
  getCookie,
  setLongLivedCookie,
} from "@/lib/cookies";

type PlatformCookieConsent = {
  necessary: true;
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
};

const defaultDraft: DraftPreferences = {
  analytics: false,
  marketing: false,
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function serializeConsent(preferences: DraftPreferences): PlatformCookieConsent {
  return {
    necessary: true,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    consentedAt: new Date().toISOString(),
  };
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<PlatformCookieConsent | null>(null);
  const [draft, setDraft] = useState<DraftPreferences>(defaultDraft);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = getCookie(PLATFORM_COOKIE_CONSENT_COOKIE_NAME);
    if (!raw) {
      setLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PlatformCookieConsent;
      setConsent(parsed);
      setDraft({
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
      });
    } catch {
      deleteCookie(PLATFORM_COOKIE_CONSENT_COOKIE_NAME);
    } finally {
      setLoaded(true);
    }
  }, []);

  function persistConsent(nextDraft: DraftPreferences) {
    const nextConsent = serializeConsent(nextDraft);
    setConsent(nextConsent);
    setDraft(nextDraft);
    setLongLivedCookie(PLATFORM_COOKIE_CONSENT_COOKIE_NAME, JSON.stringify(nextConsent));
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
      acceptAll: () => persistConsent({ analytics: true, marketing: true }),
      rejectOptional: () => persistConsent(defaultDraft),
      saveDraft: () => persistConsent(draft),
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
            `app.acadea.org` używa niezbędnych cookies do działania logowania, bezpieczeństwa i ochrony formularzy.
            Opcjonalne cookies analityczne i marketingowe uruchamiamy dopiero po Twojej zgodzie.
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
            description="Obsługują logowanie, utrzymanie sesji, bezpieczeństwo formularzy oraz podstawowe działanie platformy."
            checked
            disabled
            onChange={() => undefined}
          />
          <CookieRow
            title="Analityczne"
            description="Pozwolą mierzyć ruch i korzystanie z panelu, gdy wdrożymy analitykę także dla aplikacji."
            checked={draft.analytics}
            onChange={(checked) => updateDraft({ analytics: checked })}
          />
          <CookieRow
            title="Marketingowe"
            description="Będą używane dopiero wtedy, gdy uruchomimy funkcje reklamowe lub remarketingowe dla platformy."
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
