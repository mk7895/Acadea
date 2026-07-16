import { Suspense, lazy, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";

import { CookieConsentProvider } from "@/components/CookieConsent";
import { useCookieConsent } from "@/components/CookieConsent";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { MetaPixel } from "@/components/MetaPixel";
import { ConsultationPrompt } from "@/components/ConsultationPrompt";
import { LanguageSuggestionPrompt } from "@/components/LanguageSuggestionPrompt";
import { EnglishTextRewriter } from "@/components/EnglishTextRewriter";
import Home from "@/pages/Home";
import {
  ARTICLE_PREFETCH_SESSION_COOKIE_NAME,
  getCookie,
  setSessionCookie,
} from "@/lib/cookies";
import { LanguageProvider, useLanguage } from "@/lib/i18n";

const queryClient = new QueryClient();
const HowItWorks = lazy(() => import("@/pages/HowItWorks"));
const Countries = lazy(() => import("@/pages/Countries"));
const CountryDetail = lazy(() => import("@/pages/CountryDetail"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const Contact = lazy(() => import("@/pages/Contact"));
const Blog = lazy(() => import("@/pages/Blog"));
const Scholarship = lazy(() => import("@/pages/Scholarship"));
const ScholarshipForm = lazy(() => import("@/pages/ScholarshipForm"));
const ScholarshipParentConsent = lazy(() => import("@/pages/ScholarshipParentConsent"));
const ScholarshipTerms = lazy(() => import("@/pages/ScholarshipTerms"));
const Booking = lazy(() => import("@/pages/Booking"));
const MentorForm = lazy(() => import("@/pages/MentorForm"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const Regulamin = lazy(() => import("@/pages/Regulamin"));
const PlatformTerms = lazy(() => import("@/pages/PlatformTerms"));
const ArticlePage = lazy(() => import("@/pages/ArticlePage"));
const AdminArticles = lazy(() => import("@/pages/AdminArticles"));
const NotFound = lazy(() => import("@/pages/not-found"));

function ScrollManager() {
  const [location] = useLocation();

  useEffect(() => {
    const scrollToDestination = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash) {
        const target = document.getElementById(hash);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    let raf1 = 0;
    let raf2 = 0;

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(scrollToDestination);
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [location]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash) return;

      const target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}

function Router() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center px-4 pt-28 text-center text-gray-500">
            Ładowanie…
          </div>
        }
      >
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/en" component={Home} />
          <Route path="/jak-to-dziala" component={HowItWorks} />
          <Route path="/en/how-it-works" component={HowItWorks} />
          <Route path="/kraje" component={Countries} />
          <Route path="/en/countries" component={Countries} />
          <Route path="/kraje/:slug" component={CountryDetail} />
          <Route path="/en/countries/:slug" component={CountryDetail} />
          <Route path="/o-nas" component={AboutUs} />
          <Route path="/en/about-us" component={AboutUs} />
          <Route path="/kontakt" component={Contact} />
          <Route path="/en/contact" component={Contact} />
          <Route path="/baza-wiedzy" component={Blog} />
          <Route path="/en/knowledge-base" component={Blog} />
          <Route path="/baza-wiedzy/:slug" component={ArticlePage} />
          <Route path="/en/knowledge-base/:slug" component={ArticlePage} />
          <Route path="/stypendium" component={Scholarship} />
          <Route path="/en/scholarship" component={Scholarship} />
          <Route path="/stypendium/aplikacja" component={ScholarshipForm} />
          <Route path="/en/scholarship/application" component={ScholarshipForm} />
          <Route path="/stypendium/zgoda-rodzica" component={ScholarshipParentConsent} />
          <Route path="/en/scholarship/parent-consent" component={ScholarshipParentConsent} />
          <Route path="/stypendium/regulamin" component={ScholarshipTerms} />
          <Route path="/en/scholarship/terms" component={ScholarshipTerms} />
          <Route path="/umow-spotkanie/:mentorSlug" component={Booking} />
          <Route path="/en/book-consultation/:mentorSlug" component={Booking} />
          <Route path="/umow-spotkanie" component={Booking} />
          <Route path="/en/book-consultation" component={Booking} />
          <Route path="/mentoruj" component={MentorForm} />
          <Route path="/en/become-a-mentor" component={MentorForm} />
          <Route path="/polityka-prywatnosci" component={PrivacyPolicy} />
          <Route path="/en/privacy-policy" component={PrivacyPolicy} />
          <Route path="/regulamin" component={Regulamin} />
          <Route path="/en/terms" component={Regulamin} />
          <Route path="/regulamin-platformy" component={PlatformTerms} />
          <Route path="/en/platform-terms" component={PlatformTerms} />
          <Route path="/panel" component={AdminArticles} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function PublicArticlePrefetch() {
  const { canUsePreferencesCookies } = useCookieConsent();
  const { language } = useLanguage();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!canUsePreferencesCookies) {
      return;
    }

    if (getCookie(ARTICLE_PREFETCH_SESSION_COOKIE_NAME) === "1") {
      return;
    }

    const browserWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const prefetch = () => {
      // Mark the session before the network call so route changes do not trigger duplicate preloads.
      setSessionCookie(ARTICLE_PREFETCH_SESSION_COOKIE_NAME, "1");
      void import("@/lib/article-api").then(({ prefetchPublicArticleIndex }) =>
        prefetchPublicArticleIndex(language),
      );
    };

    if (browserWindow.requestIdleCallback) {
      const callbackId = browserWindow.requestIdleCallback(prefetch, { timeout: 2000 });
      return () => browserWindow.cancelIdleCallback?.(callbackId);
    }

    const timeoutId = globalThis.setTimeout(prefetch, 1200);
    return () => globalThis.clearTimeout(timeoutId);
  }, [canUsePreferencesCookies, language]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <LanguageProvider>
          <CookieConsentProvider>
            <GoogleAnalytics />
            <MetaPixel />
            <TooltipProvider>
              <PublicArticlePrefetch />
              <EnglishTextRewriter />
              <ScrollManager />
              <Router />
              <ConsultationPrompt />
              <LanguageSuggestionPrompt />
              <Toaster />
            </TooltipProvider>
          </CookieConsentProvider>
        </LanguageProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
