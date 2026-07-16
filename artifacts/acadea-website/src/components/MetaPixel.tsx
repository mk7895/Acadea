import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useCookieConsent } from "@/components/CookieConsent";
import { deleteCookie } from "@/lib/cookies";

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID?.trim() ?? "";
const META_PIXEL_SCRIPT_ID = "acadea-meta-pixel";

type MetaPixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
  }
}

function ensureMetaPixelStub() {
  if (window.fbq) return window.fbq;

  const fbq: MetaPixelFunction = (...args: unknown[]) => {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
      return;
    }
    fbq.queue?.push(args);
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;
  return fbq;
}

function disableMetaPixel() {
  document.getElementById(META_PIXEL_SCRIPT_ID)?.remove();
  delete window.fbq;
  delete window._fbq;
  deleteCookie("_fbp");
  deleteCookie("_fbc");
}

export function MetaPixel() {
  const [location] = useLocation();
  const { consent } = useCookieConsent();
  const initializedRef = useRef(false);
  const canUseMarketing = Boolean(consent?.marketing && META_PIXEL_ID);

  useEffect(() => {
    if (!canUseMarketing) {
      initializedRef.current = false;
      disableMetaPixel();
      return;
    }

    const fbq = ensureMetaPixelStub();
    if (!document.getElementById(META_PIXEL_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = META_PIXEL_SCRIPT_ID;
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    }

    if (!initializedRef.current) {
      fbq("init", META_PIXEL_ID);
      initializedRef.current = true;
    }
  }, [canUseMarketing]);

  useEffect(() => {
    if (!canUseMarketing || !initializedRef.current) return;
    window.fbq?.("track", "PageView");
  }, [canUseMarketing, location]);

  return null;
}
