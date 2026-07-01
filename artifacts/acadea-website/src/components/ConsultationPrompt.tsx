import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, X } from "lucide-react";

const PROMPT_DELAY_MS = 150_000;
const PROMPT_SESSION_KEY = "acadea_consultation_prompt_seen_v1";
const ACTIVE_TIME_KEY = "acadea_consultation_active_time_ms_v1";
const EXIT_INTENT_MIN_ACTIVE_MS = 30_000;

const excludedPathPrefixes = [
  "/kontakt",
  "/umow-spotkanie",
  "/stypendium/aplikacja",
  "/stypendium/regulamin",
  "/mentoruj",
  "/panel",
  "/regulamin",
  "/regulamin-platformy",
  "/polityka-prywatnosci",
];

function hasSeenPrompt() {
  try {
    return window.sessionStorage.getItem(PROMPT_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberPromptSeen() {
  try {
    window.sessionStorage.setItem(PROMPT_SESSION_KEY, "1");
  } catch {
    // Session storage can be blocked; the popup still works without persistence.
  }
}

function getAccumulatedActiveTime() {
  try {
    return Number(window.sessionStorage.getItem(ACTIVE_TIME_KEY) ?? "0");
  } catch {
    return 0;
  }
}

function storeAccumulatedActiveTime(value: number) {
  try {
    window.sessionStorage.setItem(ACTIVE_TIME_KEY, String(value));
  } catch {
    // Session storage can be blocked; the popup still works without persistence.
  }
}

export function ConsultationPrompt() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const pageEnteredAtRef = useRef<number>(Date.now());
  const shouldShowOnPath = useMemo(
    () => !excludedPathPrefixes.some((prefix) => location.startsWith(prefix)),
    [location],
  );

  useEffect(() => {
    pageEnteredAtRef.current = Date.now();
    return () => {
      storeAccumulatedActiveTime(getAccumulatedActiveTime() + (Date.now() - pageEnteredAtRef.current));
    };
  }, [location]);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    if (!shouldShowOnPath || hasSeenPrompt()) {
      return undefined;
    }

    const showPrompt = () => {
      if (!hasSeenPrompt()) {
        setIsOpen(true);
      }
    };

    const timer = window.setTimeout(showPrompt, PROMPT_DELAY_MS);

    const handleExitIntent = (event: MouseEvent) => {
      if (event.relatedTarget) {
        return;
      }

      const totalActiveTime = getAccumulatedActiveTime() + (Date.now() - pageEnteredAtRef.current);
      if (totalActiveTime >= EXIT_INTENT_MIN_ACTIVE_MS) {
        showPrompt();
      }
    };

    document.addEventListener("mouseout", handleExitIntent);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", handleExitIntent);
    };
  }, [shouldShowOnPath, location]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        rememberPromptSeen();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const closePrompt = () => {
    rememberPromptSeen();
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-primary/30 px-4 py-6 backdrop-blur-sm md:items-center">
      <div className="relative w-full max-w-lg rounded-[28px] border border-primary/10 bg-white p-6 shadow-2xl md:p-8">
        <button
          type="button"
          onClick={closePrompt}
          aria-label="Zamknij popup"
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary"
        >
          <X size={18} />
        </button>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-accent">
          Czy wiesz, że?
        </p>
        <h2 className="pr-8 text-2xl font-bold leading-tight text-primary md:text-3xl">
          Eksperci ACADEA setki razy z sukcesem przeszli proces aplikacji na studia.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 md:text-base">
          Daj sobie pomóc. Wypełnij formularz, a skontaktujemy się z Tobą i pomożemy zaplanować kolejne kroki.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/umow-spotkanie"
            onClick={closePrompt}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            Wypełnij formularz
            <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            onClick={closePrompt}
            className="h-12 rounded-full border border-primary/15 px-6 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            Może później
          </button>
        </div>
      </div>
    </div>
  );
}
