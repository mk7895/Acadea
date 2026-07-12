import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ARTICLE_PREFETCH_SESSION_COOKIE_NAME,
  COOKIE_CONSENT_COOKIE_NAME,
  PLATFORM_COOKIE_CONSENT_COOKIE_NAME,
  getCookie,
  TIMEZONE_COOKIE_NAME,
  deleteCookie,
  setLongLivedCookie,
} from "@/lib/cookies";
import { clearPublicArticleCache } from "@/lib/article-api";
import { useLanguage } from "@/lib/i18n";

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

function normalizeConsent(raw: unknown): CookieConsentPreferences {
  const parsed = (raw ?? {}) as Partial<CookieConsentPreferences>;
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
  const [consent, setConsent] = useState<CookieConsentPreferences | null>(null);
  const [draft, setDraft] = useState<DraftPreferences>(defaultDraft);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const primaryRaw = getCookie(COOKIE_CONSENT_COOKIE_NAME);
    const fallbackRaw = getCookie(PLATFORM_COOKIE_CONSENT_COOKIE_NAME);
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
        setLongLivedCookie(COOKIE_CONSENT_COOKIE_NAME, serialized);
      }
      if (fallbackRaw !== serialized) {
        setLongLivedCookie(PLATFORM_COOKIE_CONSENT_COOKIE_NAME, serialized);
      }
    } catch {
      deleteCookie(COOKIE_CONSENT_COOKIE_NAME);
      deleteCookie(PLATFORM_COOKIE_CONSENT_COOKIE_NAME);
    } finally {
      setLoaded(true);
    }
  }, []);

  function persistConsent(nextDraft: DraftPreferences) {
    const nextConsent = serializeConsent(nextDraft);
    const serializedConsent = JSON.stringify(nextConsent);
    setConsent(nextConsent);
    setDraft(nextDraft);
    setLongLivedCookie(COOKIE_CONSENT_COOKIE_NAME, serializedConsent);
    setLongLivedCookie(PLATFORM_COOKIE_CONSENT_COOKIE_NAME, serializedConsent);
    if (!nextConsent.preferences) {
      deleteCookie(TIMEZONE_COOKIE_NAME);
      deleteCookie(ARTICLE_PREFETCH_SESSION_COOKIE_NAME);
      clearPublicArticleCache();
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
  const { t } = useLanguage();

  if (!isBannerVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-4">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-[#e7decf] bg-white/98 shadow-2xl backdrop-blur p-6 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d806b] mb-2">
              {t("Ustawienia cookies", "Cookie settings")}
            </p>
            <h2 className="text-2xl font-bold text-primary mb-2">{t("Szanujemy Twoją prywatność", "We respect your privacy")}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t(
                "Używamy plików cookies niezbędnych do działania serwisu oraz, za Twoją zgodą, plików cookies preferencji, analitycznych i marketingowych. Możemy też zapamiętać w trakcie sesji zamknięcie komunikatów wyświetlanych na stronie. Do kategorii preferencji zaliczamy też szybsze wczytywanie listy artykułów w Bazie Wiedzy oraz tymczasowy cache tej listy w przeglądarce. Więcej informacji znajdziesz w polityce prywatności.",
                "We use cookies that are necessary for the website to work and, with your consent, preference, analytics and marketing cookies. We may also remember during a session that you closed website messages. Preference cookies also cover faster loading of the Knowledge Base article list and temporary browser caching of that list. You can find more information in the privacy policy.",
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <button
              onClick={rejectOptional}
              className="h-11 px-4 rounded-full border border-[#ddd3c1] text-primary text-sm leading-tight font-semibold hover:bg-[#f6f1e7] transition-colors"
            >
              {t("Odrzuć opcjonalne", "Reject optional")}
            </button>
            <button
              onClick={openPreferences}
              className="h-11 px-4 rounded-full border border-[#ddd3c1] text-primary text-sm leading-tight font-semibold hover:bg-[#f6f1e7] transition-colors"
            >
              {t("Dostosuj", "Customise")}
            </button>
            <button
              onClick={acceptAll}
              className="h-11 px-5 rounded-full bg-primary text-white text-sm leading-tight font-semibold hover:bg-primary/90 transition-colors"
            >
              {t("Akceptuj wszystkie", "Accept all")}
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
  const { t } = useLanguage();

  if (!isPreferencesOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[95] bg-black/35 backdrop-blur-sm px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-[30px] border border-[#e7decf] bg-white shadow-2xl p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d806b] mb-2">
              {t("Centrum preferencji", "Preference centre")}
            </p>
            <h2 className="text-2xl font-bold text-primary">{t("Wybierz kategorie cookies", "Choose cookie categories")}</h2>
          </div>
          <button
            onClick={closePreferences}
            className="text-sm text-gray-500 hover:text-primary transition-colors"
          >
            {t("Zamknij", "Close")}
          </button>
        </div>

        <div className="space-y-4">
          <CookieRow
            title={t("Niezbędne", "Necessary")}
            description={t(
              "Odpowiadają za podstawowe działanie strony, zgody cookies, zabezpieczenia formularzy oraz zapamiętanie zamknięcia komunikatów w trakcie sesji. Są zawsze aktywne.",
              "They support the basic operation of the website, cookie consent, form security and remembering closed messages during a session. They are always active.",
            )}
            checked
            disabled
            onChange={() => undefined}
          />
          <CookieRow
            title={t("Preferencje", "Preferences")}
            description={t(
              "Pozwalają zapamiętać ustawienia strony, takie jak wybrana strefa czasowa, uruchomić jednorazowe przyspieszenie wczytywania listy artykułów w Bazie Wiedzy podczas bieżącej sesji oraz przechować tymczasowy cache tej listy w przeglądarce.",
              "They remember website preferences such as the selected time zone, allow one-off faster loading of the Knowledge Base article list during the current session, and store a temporary cache of that list in the browser.",
            )}
            checked={draft.preferences}
            onChange={(checked) => updateDraft({ preferences: checked })}
          />
          <CookieRow
            title={t("Analityczne", "Analytics")}
            description={t(
              "Będą używane po wdrożeniu narzędzi analitycznych, aby mierzyć ruch i ulepszać stronę.",
              "They will be used after analytics tools are enabled to measure traffic and improve the website.",
            )}
            checked={draft.analytics}
            onChange={(checked) => updateDraft({ analytics: checked })}
          />
          <CookieRow
            title={t("Marketingowe", "Marketing")}
            description={t(
              "Będą używane po wdrożeniu narzędzi reklamowych, remarketingowych i pomiaru skuteczności komunikatów zachęcających do kontaktu.",
              "They will be used after advertising, remarketing and contact-message performance tools are enabled.",
            )}
            checked={draft.marketing}
            onChange={(checked) => updateDraft({ marketing: checked })}
          />
        </div>

        <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={rejectOptional}
            className="h-11 px-5 rounded-full border border-[#ddd3c1] text-primary font-semibold hover:bg-[#f6f1e7] transition-colors"
          >
            {t("Tylko niezbędne", "Necessary only")}
          </button>
          <button
            onClick={acceptAll}
            className="h-11 px-5 rounded-full border border-[#ddd3c1] text-primary font-semibold hover:bg-[#f6f1e7] transition-colors"
          >
            {t("Wszystkie", "All")}
          </button>
          <button
            onClick={saveDraft}
            className="h-11 px-6 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            {t("Zapisz wybór", "Save choices")}
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
