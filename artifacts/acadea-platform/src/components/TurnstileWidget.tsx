import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    __acadeaPlatformTurnstilePromise__?: Promise<void>;
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
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";

function loadScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (window.__acadeaPlatformTurnstilePromise__) {
    return window.__acadeaPlatformTurnstilePromise__;
  }

  window.__acadeaPlatformTurnstilePromise__ = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile failed to load."));
    document.head.appendChild(script);
  });

  return window.__acadeaPlatformTurnstilePromise__;
}

export function isTurnstileEnabled() {
  return Boolean(SITE_KEY);
}

export function TurnstileWidget({
  onTokenChange,
  resetKey,
}: {
  onTokenChange: (token: string) => void;
  resetKey?: string | number;
}) {
  const containerId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) {
      return;
    }

    let cancelled = false;
    void loadScript()
      .then(() => {
        if (!window.turnstile || cancelled) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
          sitekey: SITE_KEY,
          theme: "light",
          language: "pl",
          callback: onTokenChange,
          "expired-callback": () => onTokenChange(""),
          "error-callback": () => onTokenChange(""),
        });
      })
      .catch(() => onTokenChange(""));

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [containerId, onTokenChange]);

  useEffect(() => {
    if (resetKey !== undefined && widgetIdRef.current && window.turnstile) {
      onTokenChange("");
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [onTokenChange, resetKey]);

  if (!SITE_KEY) {
    return null;
  }

  return <div id={containerId} />;
}
