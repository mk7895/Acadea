import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout/Layout";

// Pages
import Home from "@/pages/Home";
import HowItWorks from "@/pages/HowItWorks";
import Countries from "@/pages/Countries";
import CountryDetail from "@/pages/CountryDetail";
import AboutUs from "@/pages/AboutUs";
import Contact from "@/pages/Contact";
import Blog from "@/pages/Blog";
import Scholarship from "@/pages/Scholarship";
import ScholarshipForm from "@/pages/ScholarshipForm";
import Booking from "@/pages/Booking";
import MentorForm from "@/pages/MentorForm";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Regulamin from "@/pages/Regulamin";
import PlatformTerms from "@/pages/PlatformTerms";
import ArticlePage from "@/pages/ArticlePage";
import AdminArticles from "@/pages/AdminArticles";
import { CookieConsentProvider } from "@/components/CookieConsent";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

const queryClient = new QueryClient();

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
        <Route path="/umow-spotkanie" component={Booking} />
        <Route path="/mentoruj" component={MentorForm} />
        <Route path="/polityka-prywatnosci" component={PrivacyPolicy} />
        <Route path="/regulamin" component={Regulamin} />
        <Route path="/regulamin-platformy" component={PlatformTerms} />
        <Route path="/panel" component={AdminArticles} />
        <Route component={NotFound} />
      </Switch>
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
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </CookieConsentProvider>
    </QueryClientProvider>
  );
}

export default App;
