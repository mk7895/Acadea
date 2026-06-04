import { Switch, Route, Router as WouterRouter } from "wouter";
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
import Booking from "@/pages/Booking";
import MentorForm from "@/pages/MentorForm";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Regulamin from "@/pages/Regulamin";

const queryClient = new QueryClient();

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
        <Route path="/stypendium" component={Scholarship} />
        <Route path="/umow-spotkanie" component={Booking} />
        <Route path="/mentoruj" component={MentorForm} />
        <Route path="/polityka-prywatnosci" component={PrivacyPolicy} />
        <Route path="/regulamin" component={Regulamin} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
