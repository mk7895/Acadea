import { Suspense, lazy, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";

import { CookieConsentProvider } from "@/components/CookieConsent";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { ConsultationPrompt } from "@/components/ConsultationPrompt";

const queryClient = new QueryClient();
const Home = lazy(() => import("@/pages/Home"));
const HowItWorks = lazy(() => import("@/pages/HowItWorks"));
const Countries = lazy(() => import("@/pages/Countries"));
const CountryDetail = lazy(() => import("@/pages/CountryDetail"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const Contact = lazy(() => import("@/pages/Contact"));
const Blog = lazy(() => import("@/pages/Blog"));
const Scholarship = lazy(() => import("@/pages/Scholarship"));
const ScholarshipForm = lazy(() => import("@/pages/ScholarshipForm"));
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
          <Route path="/jak-to-dziala" component={HowItWorks} />
          <Route path="/kraje" component={Countries} />
          <Route path="/kraje/:slug" component={CountryDetail} />
          <Route path="/o-nas" component={AboutUs} />
          <Route path="/kontakt" component={Contact} />
          <Route path="/baza-wiedzy" component={Blog} />
          <Route path="/baza-wiedzy/:slug" component={ArticlePage} />
          <Route path="/stypendium" component={Scholarship} />
          <Route path="/stypendium/aplikacja" component={ScholarshipForm} />
          <Route path="/stypendium/regulamin" component={ScholarshipTerms} />
          <Route path="/umow-spotkanie" component={Booking} />
          <Route path="/mentoruj" component={MentorForm} />
          <Route path="/polityka-prywatnosci" component={PrivacyPolicy} />
          <Route path="/regulamin" component={Regulamin} />
          <Route path="/regulamin-platformy" component={PlatformTerms} />
          <Route path="/panel" component={AdminArticles} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CookieConsentProvider>
        <GoogleAnalytics />
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ScrollManager />
            <Router />
            <ConsultationPrompt />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </CookieConsentProvider>
    </QueryClientProvider>
  );
}

export default App;
