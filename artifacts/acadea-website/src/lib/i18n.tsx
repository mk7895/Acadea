import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useLocation } from "wouter";
import { getCookie, setLongLivedCookie } from "@/lib/cookies";

export type Language = "pl" | "en";
export type LanguageRouteAlternates = Record<Language, string>;

export const LANGUAGE_COOKIE_NAME = "acadea_language";

const plToEnPath: Record<string, string> = {
  "/": "/en",
  "/jak-to-dziala": "/en/how-it-works",
  "/kraje": "/en/countries",
  "/o-nas": "/en/about-us",
  "/kontakt": "/en/contact",
  "/baza-wiedzy": "/en/knowledge-base",
  "/stypendium": "/en/scholarship",
  "/stypendium/aplikacja": "/en/scholarship/application",
  "/stypendium/zgoda-rodzica": "/en/scholarship/parent-consent",
  "/stypendium/regulamin": "/en/scholarship/terms",
  "/umow-spotkanie": "/en/book-consultation",
  "/mentoruj": "/en/become-a-mentor",
  "/polityka-prywatnosci": "/en/privacy-policy",
  "/regulamin": "/en/terms",
  "/regulamin-platformy": "/en/platform-terms",
  "/panel": "/panel",
};

const enToPlPath: Record<string, string> = Object.fromEntries(
  Object.entries(plToEnPath).map(([pl, en]) => [en, pl]),
);

export const englishRouteAliases: Array<{ en: string; pl: string }> = Object.entries(plToEnPath)
  .filter(([, en]) => en !== "/panel")
  .map(([pl, en]) => ({ en, pl }));

export const enToPlStaticPath = enToPlPath;
export const plToEnStaticPath = plToEnPath;

type LanguageContextValue = {
  language: Language;
  isEnglish: boolean;
  localizePath: (path: string, targetLanguage?: Language) => string;
  switchLanguagePath: (targetLanguage: Language) => string;
  setRouteLanguageAlternates: Dispatch<SetStateAction<LanguageRouteAlternates | null>>;
  setPreferredLanguage: (language: Language) => void;
  t: (pl: string, en: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function splitPath(path: string) {
  const [pathnameWithSearch, hash = ""] = path.split("#");
  const [pathname, search = ""] = pathnameWithSearch.split("?");
  return {
    pathname: pathname || "/",
    search: search ? `?${search}` : "",
    hash: hash ? `#${hash}` : "",
  };
}

function addTrailingSlash(pathname: string) {
  if (pathname === "/" || /\/[^/]+\.[^/]+$/.test(pathname)) {
    return pathname;
  }

  return `${pathname.replace(/\/+$/, "")}/`;
}

export function getLanguageFromPath(pathname: string): Language {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "pl";
}

function normalizeEnglishPath(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/en";
}

export function localizePathname(pathname: string, targetLanguage: Language) {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  if (targetLanguage === "en") {
    if (normalized === "/baza-wiedzy" || normalized.startsWith("/baza-wiedzy/")) {
      return normalized.replace(/^\/baza-wiedzy/, "/en/knowledge-base");
    }
    if (normalized.startsWith("/kraje/")) {
      return normalized.replace(/^\/kraje/, "/en/countries");
    }
    if (normalized.startsWith("/umow-spotkanie/")) {
      return normalized.replace(/^\/umow-spotkanie/, "/en/book-consultation");
    }
    return plToEnPath[normalized] ?? (normalized.startsWith("/en") ? normalized : "/en");
  }

  const englishNormalized = normalizeEnglishPath(normalized);
  if (englishNormalized === "/en/knowledge-base" || englishNormalized.startsWith("/en/knowledge-base/")) {
    return englishNormalized.replace(/^\/en\/knowledge-base/, "/baza-wiedzy");
  }
  if (englishNormalized.startsWith("/en/countries/")) {
    return englishNormalized.replace(/^\/en\/countries/, "/kraje");
  }
  if (englishNormalized.startsWith("/en/book-consultation/")) {
    return englishNormalized.replace(/^\/en\/book-consultation/, "/umow-spotkanie");
  }
  return enToPlPath[englishNormalized] ?? (normalized.startsWith("/en") ? "/" : normalized);
}

export function localizeFullPath(path: string, targetLanguage: Language) {
  const { pathname, search, hash } = splitPath(path);
  return `${addTrailingSlash(localizePathname(pathname, targetLanguage))}${search}${hash}`;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }
  return context;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [routeLanguageAlternates, setRouteLanguageAlternates] =
    useState<LanguageRouteAlternates | null>(null);
  const language = getLanguageFromPath(splitPath(location).pathname);

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en-GB" : "pl";
  }, [language]);

  useEffect(() => {
    setRouteLanguageAlternates(null);
  }, [location]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      isEnglish: language === "en",
      localizePath: (path, targetLanguage = language) => localizeFullPath(path, targetLanguage),
      switchLanguagePath: (targetLanguage) =>
        routeLanguageAlternates
          ? localizeFullPath(routeLanguageAlternates[targetLanguage], targetLanguage)
          : localizeFullPath(location, targetLanguage),
      setRouteLanguageAlternates,
      setPreferredLanguage: (nextLanguage) => setLongLivedCookie(LANGUAGE_COOKIE_NAME, nextLanguage),
      t: (pl, en) => (language === "en" ? en : pl),
    }),
    [language, location, routeLanguageAlternates],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function getStoredLanguagePreference(): Language | null {
  const stored = getCookie(LANGUAGE_COOKIE_NAME);
  return stored === "pl" || stored === "en" ? stored : null;
}
