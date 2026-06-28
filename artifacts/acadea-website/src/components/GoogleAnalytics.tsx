import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useCookieConsent } from "@/components/CookieConsent";

const GOOGLE_TAG_ID = "G-BBGB8DRXDJ";
const GOOGLE_SCRIPT_ID = "acadea-google-tag";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtagStub() {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }
}

export function GoogleAnalytics() {
  const [location] = useLocation();
  const { consent } = useCookieConsent();
  const configuredRef = useRef(false);
  const isTrackingEnabledRoute = location !== "/panel";

  useEffect(() => {
    if (typeof window === "undefined" || !isTrackingEnabledRoute) {
      return;
    }

    ensureGtagStub();
    window.gtag?.("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      wait_for_update: 500,
    });

    if (document.getElementById(GOOGLE_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`;
    document.head.appendChild(script);

    return () => {
      script.remove();
      configuredRef.current = false;
    };
  }, [isTrackingEnabledRoute]);

  useEffect(() => {
    if (typeof window === "undefined" || !isTrackingEnabledRoute) {
      return;
    }

    ensureGtagStub();
    window.gtag?.("consent", "update", {
      analytics_storage: consent?.analytics ? "granted" : "denied",
      ad_storage: consent?.marketing ? "granted" : "denied",
      ad_user_data: consent?.marketing ? "granted" : "denied",
      ad_personalization: consent?.marketing ? "granted" : "denied",
    });
  }, [consent, isTrackingEnabledRoute]);

  useEffect(() => {
    if (typeof window === "undefined" || !isTrackingEnabledRoute || configuredRef.current) {
      return;
    }

    ensureGtagStub();
    window.gtag?.("js", new Date());
    window.gtag?.("config", GOOGLE_TAG_ID, {
      anonymize_ip: true,
      page_path: location,
    });
    configuredRef.current = true;
  }, [isTrackingEnabledRoute, location]);

  useEffect(() => {
    if (typeof window === "undefined" || !isTrackingEnabledRoute || !configuredRef.current) {
      return;
    }

    window.gtag?.("event", "page_view", {
      page_path: location,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [isTrackingEnabledRoute, location]);

  return null;
}
