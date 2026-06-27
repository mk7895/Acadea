import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  TIMEZONE_COOKIE_NAME,
  deleteCookie,
  getCookie,
  setLongLivedCookie,
} from "@/lib/cookies";

type CookieConsentPreferences = {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  consentedAt: string;
};

type DraftPreferences = Omit<CookieConsentPreferences, "necessary" | "consentedAt">;

type CookieConsentContextValue = {
  consent: CookieConsentPreferences | null;
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

function serializeConsent(preferences: DraftPreferences): CookieConsentPreferences {
  return {
    necessary: true,
    preferences: preferences.preferences,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    consentedAt: new Date().toISOString(),
  };
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsentPreferences | null>(null);
  const [draft, setDraft] = useState<DraftPreferences>(defaultDraft);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = getCookie(COOKIE_CONSENT_COOKIE_NAME);
    if (!raw) {
      setLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as CookieConsentPreferences;
      setConsent(parsed);
      setDraft({
        preferences: Boolean(parsed.preferences),
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
      });
    } catch {
      deleteCookie(COOKIE_CONSENT_COOKIE_NAME);
    } finally {
      setLoaded(true);
    }
  }, []);

  function persistConsent(nextDraft: DraftPreferences) {
    const nextConsent = serializeConsent(nextDraft);
    setConsent(nextConsent);
    setDraft(nextDraft);
    setLongLivedCookie(COOKIE_CONSENT_COOKIE_NAME, JSON.stringify(nextConsent));
    if (!nextConsent.preferences) {
      deleteCookie(TIMEZONE_COOKIE_NAME);
    }
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
    <div className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-4">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-[#e7decf] bg-white/98 shadow-2xl backdrop-blur p-6 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d806b] mb-2">
              Ustawienia cookies
            </p>
            <h2 className="text-2xl font-bold text-primary mb-2">Szanujemy Twoją prywatność</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Używamy niezbędnych cookies do działania strony oraz opcjonalnych cookies preferencji,
              analitycznych i marketingowych. Preferencje mogą zapamiętać np. wybraną strefę czasową.
              Więcej informacji znajdziesz w{" "}
              <Link href="/polityka-cookies" className="font-semibold text-primary hover:underline">
                polityce cookies
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <button
              onClick={rejectOptional}
              className="h-11 px-5 rounded-full border border-[#ddd3c1] text-primary font-semibold hover:bg-[#f6f1e7] transition-colors"
            >
              Odrzuć opcjonalne
            </button>
            <button
              onClick={openPreferences}
              className="h-11 px-5 rounded-full border border-[#ddd3c1] text-primary font-semibold hover:bg-[#f6f1e7] transition-colors"
            >
              Dostosuj
            </button>
            <button
              onClick={acceptAll}
              className="h-11 px-6 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
            >
              Akceptuj wszystkie
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CookiePreferencesModal() {
  const {
    isPreferencesOpen,
    closePreferences,
    draft,
    updateDraft,
    saveDraft,
    rejectOptional,
    acceptAll,
  } = useCookieConsent();

  if (!isPreferencesOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[95] bg-black/35 backdrop-blur-sm px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-[30px] border border-[#e7decf] bg-white shadow-2xl p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d806b] mb-2">
              Centrum preferencji
            </p>
            <h2 className="text-2xl font-bold text-primary">Wybierz kategorie cookies</h2>
          </div>
          <button
            onClick={closePreferences}
            className="text-sm text-gray-500 hover:text-primary transition-colors"
          >
            Zamknij
          </button>
        </div>

        <div className="space-y-4">
          <CookieRow
            title="Niezbędne"
            description="Odpowiadają za podstawowe działanie strony i zabezpieczenia formularzy. Są zawsze aktywne."
            checked
            disabled
            onChange={() => undefined}
          />
          <CookieRow
            title="Preferencje"
            description="Pozwalają zapamiętać np. wybraną strefę czasową przy rezerwacji konsultacji."
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
            description="Będą używane po wdrożeniu narzędzi reklamowych i remarketingowych."
            checked={draft.marketing}
            onChange={(checked) => updateDraft({ marketing: checked })}
          />
        </div>

        <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={rejectOptional}
            className="h-11 px-5 rounded-full border border-[#ddd3c1] text-primary font-semibold hover:bg-[#f6f1e7] transition-colors"
          >
            Tylko niezbędne
          </button>
          <button
            onClick={acceptAll}
            className="h-11 px-5 rounded-full border border-[#ddd3c1] text-primary font-semibold hover:bg-[#f6f1e7] transition-colors"
          >
            Wszystkie
          </button>
          <button
            onClick={saveDraft}
            className="h-11 px-6 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
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
    <div className="rounded-2xl border border-[#ece4d7] bg-[#fcfaf6] px-4 py-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="font-semibold text-primary">{title}</h3>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer mt-1">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-primary peer-disabled:bg-primary/70 transition-colors" />
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  );
}
