import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n";

const translations: Record<string, string> = {
  "Ładowanie…": "Loading...",
  "Strona Główna": "Home",
  "Jak pomagamy": "How we help",
  "Kraje i Uczelnie": "Countries and universities",
  "Baza Wiedzy": "Knowledge Base",
  "Stypendia": "Scholarships",
  "Poznajmy się": "About us",
  "Kontakt": "Contact",
  "Bezpłatna konsultacja": "Free consultation",
  "Edukacja bez granic": "Education without borders",
  "Twoje miejsce": "Your place",
  "na": "at a",
  "światowej": "world-class",
  "uczelni czeka.": "university is waiting.",
  "Pomagamy dostać się na wymarzone uczelnie na całym świecie.": "We help students get into their dream universities around the world.",
  "Umów bezpłatną konsultację": "Book a free consultation",
  "25+ krajów w ofercie": "25+ countries covered",
  "99%+ skuteczność": "99%+ success rate",
  "0 zł dla stypendystów": "PLN 0 for scholarship recipients",
  "W czym pomożemy Tobie lub Twojemu Dziecku?": "How can we help you or your child?",
  "Aplikacja na studia to proces, który wymaga strategii. Przeprowadzimy Cię przez niego krok po kroku.": "University applications require a strategy. We guide you through the process step by step.",
  "Doradztwo uczelni": "University advising",
  "Egzaminy i certyfikaty": "Exams and certificates",
  "Przygotowanie dokumentów": "Document preparation",
  "Eseje, listy motywacyjne i CV": "Essays, motivation letters and CVs",
  "Tłumaczenia i formalności dokumentowe": "Translations and document formalities",
  "Formalności po przyjęciu i zakwaterowanie": "Post-offer formalities and accommodation",
  "Program Stypendialny ACADEA": "ACADEA Scholarship Programme",
  "Liczy się Twój potencjał, nie budżet.": "Your potential matters, not your budget.",
  "Aplikuj o stypendium": "Apply for a scholarship",
  "Jak to działa": "How it works",
  "Wybór uczelni": "University selection",
  "Dokumenty": "Documents",
  "Eseje i CV": "Essays and CVs",
  "Aplikacja": "Application",
  "Po przyjęciu": "After acceptance",
  "Kraje": "Countries",
  "Uczelnie": "Universities",
  "Zobacz kraje": "See countries",
  "Zobacz szczegóły": "See details",
  "O nas": "About us",
  "Kim jesteśmy": "Who we are",
  "Wyślij wiadomość": "Send message",
  "Imię i nazwisko": "Full name",
  "Adres email": "Email address",
  "Numer telefonu": "Phone number",
  "Numer telefonu jest za krótki": "Phone number is too short",
  "Imię jest wymagane": "Name is required",
  "Niepoprawny adres email": "Invalid email address",
  "Wiadomość musi mieć minimum 10 znaków": "Message must be at least 10 characters",
  "Zgoda na politykę prywatności jest wymagana": "Privacy policy consent is required",
  "Wiadomość": "Message",
  "Wysyłanie…": "Sending...",
  "Polityka Prywatności": "Privacy Policy",
  "Polityka prywatności": "Privacy Policy",
  "Regulamin": "Terms",
  "Regulamin Serwisu": "Website Terms",
  "Regulamin Platformy": "Platform Terms",
  "Regulamin platformy ACADEA": "ACADEA Platform Terms",
  "Regulamin Konkursu Stypendialnego ACADEA": "ACADEA Scholarship Competition Terms",
  "Regulamin Konkursu Stypendialnego ACADEA 2026": "ACADEA 2026 Scholarship Competition Terms",
  "Ostatnia aktualizacja: lipiec 2026": "Last updated: July 2026",
  "Ostatnia aktualizacja: styczeń 2025": "Last updated: January 2025",
  "Ostatnia aktualizacja: czerwiec 2026": "Last updated: June 2026",
  "Wersja obowiązująca od dnia publikacji w serwisie.": "Version effective from the date of publication on the website.",
  "Definicje": "Definitions",
  "Pojęcia ogólne": "General definitions",
  "Postanowienia ogólne": "General provisions",
  "Warunki używania Serwisu": "Website use conditions",
  "Warunki korzystania z formularzy i rezerwacji": "Forms and booking conditions",
  "Warunki świadczenia usługi Newsletter / Grupy WhatsApp": "Newsletter and WhatsApp group service terms",
  "Warunki komunikacji w Serwisie": "Website communication terms",
  "Gromadzenie danych o Usługobiorcach": "Collection of user data",
  "Prawa autorskie": "Copyright",
  "Zmiany Regulaminu": "Changes to the Terms",
  "Inspektor Ochrony Danych": "Data Protection Officer",
  "Rodzaje Plików Cookies": "Types of cookies",
  "Bezpieczeństwo składowania danych": "Data storage security",
  "Cele do których wykorzystywane są pliki Cookie": "Purposes for which cookies are used",
  "Cele i podstawy prawne przetwarzania danych osobowych": "Purposes and legal bases for personal data processing",
  "Pliki Cookies Serwisów zewnętrznych": "Third-party cookies",
  "Rodzaje gromadzonych danych": "Types of data collected",
  "Dostęp do danych osobowych przez podmioty trzecie": "Third-party access to personal data",
  "Prawa Użytkowników": "User rights",
  "Kontakt do Administratora": "Controller contact details",
  "Konto i dostęp": "Account and access",
  "Dokumenty, pliki i dane": "Documents, files and data",
  "Spotkania i mentoring": "Meetings and mentoring",
  "Zasady korzystania z Platformy": "Platform use rules",
  "Dostępność i integracje": "Availability and integrations",
  "Odpowiedzialność": "Liability",
  "Dane osobowe": "Personal data",
  "Reklamacje i kontakt": "Complaints and contact",
  "Zmiany Regulaminu Platformy": "Changes to the Platform Terms",
  "Prawo właściwe i spory": "Governing law and disputes",
  "Organizator i cel konkursu": "Organiser and purpose of the competition",
  "Uczestnicy i zgłoszenia": "Participants and applications",
  "Komisja": "Committee",
  "Punktacja": "Scoring",
  "Wybór stypendystów": "Selection of scholarship recipients",
  "Charakter wsparcia": "Nature of support",
  "Postanowienia końcowe": "Final provisions",
  "Kryterium": "Criterion",
  "Punkty": "Points",
  "Opis": "Description",
  "do 10 pkt": "up to 10 pts",
  "do 20 pkt": "up to 20 pts",
  "Średnia ocen za ostatni rok szkolny": "Average grade for the last school year",
  "Konkursy, nagrody, olimpiady lub publikacje": "Competitions, awards, olympiads or publications",
  "Najciekawsze rzeczy stworzone w wolnym czasie": "Most interesting things created in free time",
  "Dlaczego aplikujesz?": "Why are you applying?",
  "Aplikacja stypendialna": "Scholarship application",
  "Formularz zgłoszeniowy": "Application form",
  "Zgoda rodzica": "Parent consent",
  "Podpisz zgodę": "Sign consent",
  "Potwierdź zgodę": "Confirm consent",
  "Dziękujemy": "Thank you",
  "Zarezerwuj konsultację": "Book a consultation",
  "Kalendarz": "Calendar",
  "Wybierz termin": "Choose a time",
  "Potwierdzenie": "Confirmation",
  "Zarezerwuj spotkanie": "Book meeting",
  "Mentorzy": "Mentors",
  "Aplikuj jako mentor": "Apply as a mentor",
  "Nie znaleziono strony": "Page not found",
  "Wróć na stronę główną": "Back to home",
};

function translateText(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) {
    return value;
  }

  const translated = translations[compact];
  if (!translated) {
    return value;
  }

  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function rewrite(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  nodes.forEach((node) => {
    const next = translateText(node.data);
    if (next !== node.data) {
      node.data = next;
    }
  });

  document.querySelectorAll<HTMLElement>("[placeholder],[aria-label],[title]").forEach((element) => {
    for (const attr of ["placeholder", "aria-label", "title"]) {
      const value = element.getAttribute(attr);
      if (!value) continue;
      const next = translateText(value);
      if (next !== value) {
        element.setAttribute(attr, next);
      }
    }
  });
}

export function EnglishTextRewriter() {
  const { isEnglish } = useLanguage();
  const [location] = useLocation();

  useEffect(() => {
    if (!isEnglish) {
      return;
    }

    let frame = window.requestAnimationFrame(() => rewrite(document.body));
    const observer = new MutationObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => rewrite(document.body));
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title"],
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [isEnglish, location]);

  return null;
}
