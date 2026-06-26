import type { Request } from "express";
import { logger } from "./logger";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function getClientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim();
  }

  if (Array.isArray(forwarded)) {
    return forwarded[0]?.split(",")[0]?.trim();
  }

  return req.socket.remoteAddress;
}

export async function verifyTurnstileToken(req: Request, token: string | undefined) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    logger.warn("TURNSTILE_SECRET_KEY not set; skipping Turnstile verification");
    return { ok: true as const, skipped: true as const };
  }

  if (!token) {
    return { ok: false as const, message: "Potwierdź, że nie jesteś botem." };
  }

  try {
    const formData = new URLSearchParams();
    formData.set("secret", secret);
    formData.set("response", token);

    const remoteip = getClientIp(req);
    if (remoteip) {
      formData.set("remoteip", remoteip);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (!response.ok || !data.success) {
      logger.warn(
        { status: response.status, errorCodes: data["error-codes"] ?? [] },
        "Turnstile verification failed",
      );
      return { ok: false as const, message: "Nie udało się potwierdzić zabezpieczenia formularza." };
    }

    return { ok: true as const, skipped: false as const };
  } catch (err) {
    logger.warn({ err }, "Turnstile verification request failed");
    return { ok: false as const, message: "Nie udało się zweryfikować formularza. Spróbuj ponownie." };
  }
}
