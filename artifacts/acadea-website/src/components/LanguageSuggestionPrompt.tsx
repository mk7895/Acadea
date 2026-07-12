import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";
import { useCookieConsent } from "@/components/CookieConsent";
import {
  getStoredLanguagePreference,
  localizeFullPath,
  useLanguage,
  type Language,
} from "@/lib/i18n";
import { getCookie, setSessionCookie } from "@/lib/cookies";

const LANGUAGE_PROMPT_SESSION_COOKIE = "acadea_language_prompt_seen_v1";

function getBrowserPreferredLanguage(): Language | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const firstSupported = languages.find((value) => /^pl\b/i.test(value) || /^en\b/i.test(value));
  if (!firstSupported) {
    return null;
  }

  return /^pl\b/i.test(firstSupported) ? "pl" : "en";
}

export function LanguageSuggestionPrompt() {
  const { canUsePreferencesCookies } = useCookieConsent();
  const { language, setPreferredLanguage, t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  const suggestedLanguage = useMemo(() => getBrowserPreferredLanguage(), []);
  const shouldShow =
    canUsePreferencesCookies &&
    !dismissed &&
    suggestedLanguage &&
    suggestedLanguage !== language &&
    !getStoredLanguagePreference() &&
    getCookie(LANGUAGE_PROMPT_SESSION_COOKIE) !== "1";

  useEffect(() => {
    if (!canUsePreferencesCookies || getStoredLanguagePreference()) {
      return;
    }

    const suggested = getBrowserPreferredLanguage();
    if (suggested && suggested === language) {
      setPreferredLanguage(language);
    }
  }, [canUsePreferencesCookies, language, setPreferredLanguage]);

  if (!shouldShow || !suggestedLanguage) {
    return null;
  }

  const close = () => {
    setSessionCookie(LANGUAGE_PROMPT_SESSION_COOKIE, "1");
    setDismissed(true);
  };

  const targetPath = localizeFullPath(window.location.pathname + window.location.search + window.location.hash, suggestedLanguage);
  return (
    <div className="fixed inset-0 z-[88] flex items-end justify-center bg-primary/25 px-4 py-6 backdrop-blur-sm md:items-center">
      <div className="relative w-full max-w-lg rounded-[28px] border border-primary/10 bg-white p-6 shadow-2xl md:p-8">
        <button
          type="button"
          onClick={close}
          aria-label={t("Zamknij sugestię języka", "Close language suggestion")}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary"
        >
          <X size={18} />
        </button>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-accent">
          {t("Wersja językowa", "Language version")}
        </p>
        <h2 className="pr-8 text-2xl font-bold leading-tight text-primary md:text-3xl">
          {suggestedLanguage === "en"
            ? "Would you like to view ACADEA in English?"
            : "Czy chcesz przejść na polską wersję strony?"}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 md:text-base">
          {suggestedLanguage === "en"
            ? "Your browser suggests English. We can remember this choice if you continue with preference cookies enabled."
            : "Twoja przeglądarka sugeruje język polski. Możemy zapamiętać ten wybór, jeśli masz włączone cookies preferencji."}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href={targetPath}
            onClick={() => {
              setPreferredLanguage(suggestedLanguage);
              close();
            }}
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            {suggestedLanguage === "en" ? "Go to English version" : "Przejdź na wersję polską"}
          </Link>
          <button
            type="button"
            onClick={close}
            className="h-12 rounded-full border border-primary/15 px-6 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            {t("Zostań tutaj", "Stay here")}
          </button>
        </div>
      </div>
    </div>
  );
}
