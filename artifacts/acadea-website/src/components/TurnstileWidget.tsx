import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          language?: string;
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
    __acadeaTurnstileScriptPromise__?: Promise<void>;
  }
}

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";

function loadTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (window.__acadeaTurnstileScriptPromise__) {
    return window.__acadeaTurnstileScriptPromise__;
  }

  window.__acadeaTurnstileScriptPromise__ = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Turnstile script failed to load.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script failed to load."));
    document.head.appendChild(script);
  });

  return window.__acadeaTurnstileScriptPromise__;
}

type TurnstileWidgetProps = {
  onTokenChange: (token: string) => void;
  resetKey?: string | number;
  theme?: "light" | "dark" | "auto";
  className?: string;
};

export function TurnstileWidget({
  onTokenChange,
  resetKey,
  theme = "light",
  className,
}: TurnstileWidgetProps) {
  const containerId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      return;
    }

    let cancelled = false;

    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile) {
          return;
        }

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
          sitekey: TURNSTILE_SITE_KEY,
          theme,
          language: "pl",
          callback: (token) => onTokenChangeRef.current(token),
          "expired-callback": () => onTokenChangeRef.current(""),
          "error-callback": () => onTokenChangeRef.current(""),
        });
      })
      .catch(() => {
        onTokenChangeRef.current("");
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [containerId, theme]);

  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) {
      onTokenChangeRef.current("");
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) {
    return null;
  }

  return <div id={containerId} className={className} />;
}

export function isTurnstileEnabled() {
  return Boolean(TURNSTILE_SITE_KEY);
}
