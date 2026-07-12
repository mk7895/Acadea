import { Router, type IRouter } from "express";
import { SubmitContactBody } from "@workspace/api-zod";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { logger } from "../lib/logger";
import {
  sendContactEmails,
  sendScholarshipParentConsentEmail,
} from "../lib/mailer";
import { verifyTurnstileToken } from "../lib/turnstile";
import { hasDatabaseConfig } from "../lib/databaseConfig";

const router: IRouter = Router();
let nextSubmissionId = 1;
const SCHOLARSHIP_PARENT_CONSENT_VERSION = "2026-07-parent-consent-v1";
const SCHOLARSHIP_PARENT_CONSENT_EXPIRY_HOURS = 24 * 14;

type LocalSubmission = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  type: string;
  createdAt: string;
};

const localSubmissions: LocalSubmission[] = [];
const contactRequestSchema = SubmitContactBody.and(
  z.object({
    isAdultDeclared: z.boolean().optional(),
    parentEmail: z.string().email().optional(),
    parentFullName: z.string().trim().min(2).optional(),
    language: z.enum(["pl", "en"]).optional().default("pl"),
    privacyPolicyAcknowledged: z.boolean().optional(),
    termsAccepted: z.boolean().optional(),
    turnstileToken: z.string().min(1).optional(),
  }),
);
const parentConsentStatementSchema = z.object({
  acknowledgedPrivacyPolicy: z.boolean().refine((value) => value, {
    message: "Potwierdzenie zapoznania się z polityką prywatności jest wymagane.",
  }),
  confirmedAuthority: z.boolean().refine((value) => value, {
    message:
      "Potwierdzenie, że jesteś rodzicem lub opiekunem prawnym, jest wymagane.",
  }),
  confirmedContestParticipation: z.boolean().refine((value) => value, {
    message: "Potwierdzenie zgody na udział w konkursie jest wymagane.",
  }),
  relationshipToApplicant: z.string().trim().min(2),
  signatureName: z.string().trim().min(2),
  turnstileToken: z.string().min(1).optional(),
});

function getRequestOrigin(req: Parameters<typeof verifyTurnstileToken>[0]) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto ?? req.protocol;
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost ?? req.get("host");
  return `${protocol}://${host}`;
}

function buildParentConsentStatement(input: {
  applicantName: string;
  applicantEmail: string;
  language: "pl" | "en";
}) {
  if (input.language === "en") {
    return [
      "I declare that I am the parent or legal guardian of the candidate named below.",
      `Candidate: ${input.applicantName}`,
      `Candidate email: ${input.applicantEmail}`,
      "I consent to the minor's participation in the ACADEA Scholarship Competition 2026, submission of the application and processing of personal data necessary to run the competition and, if applicable, deliver support.",
      "I also confirm that I have read the competition terms and the ACADEA Privacy Policy.",
    ].join("\n");
  }

  return [
    "Oświadczam, że jestem rodzicem lub opiekunem prawnym kandydata wskazanego poniżej.",
    `Kandydat(ka): ${input.applicantName}`,
    `E-mail kandydata: ${input.applicantEmail}`,
    "Wyrażam zgodę na udział osoby niepełnoletniej w Konkursie Stypendialnym ACADEA 2026, przesłanie zgłoszenia oraz przetwarzanie danych osobowych niezbędnych do przeprowadzenia konkursu i ewentualnej realizacji wsparcia.",
    "Potwierdzam także, że zapoznałem(-am) się z regulaminem konkursu i polityką prywatności ACADEA.",
  ].join("\n");
}

function createParentConsentToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.length <= 2 ? local[0] ?? "*" : local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

router.get("/scholarship-parent-consents/:token", async (req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Baza danych nie jest dostępna." });
  }

  const token = req.params.token?.trim();
  if (!token) {
    return res.status(400).json({ error: "Brak tokenu formularza zgody." });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { db, scholarshipParentConsentsTable, scholarshipApplicationsTable } =
    await import("@workspace/db");

  const [row] = await db
    .select({
      applicantEmailSnapshot: scholarshipParentConsentsTable.applicantEmailSnapshot,
      applicantNameSnapshot: scholarshipParentConsentsTable.applicantNameSnapshot,
      consentStatementText: scholarshipParentConsentsTable.consentStatementText,
      openedAt: scholarshipParentConsentsTable.openedAt,
      parentEmail: scholarshipParentConsentsTable.parentEmail,
      parentFullName: scholarshipParentConsentsTable.parentFullName,
      signedAt: scholarshipParentConsentsTable.signedAt,
      status: scholarshipParentConsentsTable.status,
      tokenExpiresAt: scholarshipParentConsentsTable.tokenExpiresAt,
      applicationCreatedAt: scholarshipApplicationsTable.createdAt,
    })
    .from(scholarshipParentConsentsTable)
    .innerJoin(
      scholarshipApplicationsTable,
      eq(
        scholarshipParentConsentsTable.scholarshipApplicationId,
        scholarshipApplicationsTable.id,
      ),
    )
    .where(eq(scholarshipParentConsentsTable.tokenHash, tokenHash))
    .limit(1);

  if (!row) {
    return res.status(404).json({ error: "Nie znaleziono formularza zgody." });
  }

  const now = new Date();
  const isExpired = row.tokenExpiresAt.getTime() < now.getTime();
  const effectiveStatus =
    row.status === "pending" && isExpired ? "expired" : row.status;

  if (row.status === "pending" && isExpired) {
    await db
      .update(scholarshipParentConsentsTable)
      .set({ status: "expired" })
      .where(eq(scholarshipParentConsentsTable.tokenHash, tokenHash));
  } else if (!row.openedAt && row.status === "pending") {
    await db
      .update(scholarshipParentConsentsTable)
      .set({ openedAt: now })
      .where(eq(scholarshipParentConsentsTable.tokenHash, tokenHash));
  }

  return res.json({
    applicantEmail: row.applicantEmailSnapshot,
    applicantName: row.applicantNameSnapshot,
    applicationCreatedAt: row.applicationCreatedAt.toISOString(),
    consentStatementText: row.consentStatementText,
    expiresAt: row.tokenExpiresAt.toISOString(),
    parentEmailMasked: maskEmail(row.parentEmail),
    parentFullName: row.parentFullName,
    signedAt: row.signedAt ? row.signedAt.toISOString() : null,
    status: effectiveStatus,
  });
});

router.post("/scholarship-parent-consents/:token/sign", async (req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Baza danych nie jest dostępna." });
  }

  const token = req.params.token?.trim();
  if (!token) {
    return res.status(400).json({ error: "Brak tokenu formularza zgody." });
  }

  const parsed = parentConsentStatementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const turnstile = await verifyTurnstileToken(req, parsed.data.turnstileToken);
  if (!turnstile.ok) {
    return res.status(400).json({ error: turnstile.message });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { db, scholarshipApplicationsTable, scholarshipParentConsentsTable } =
    await import("@workspace/db");

  const [row] = await db
    .select()
    .from(scholarshipParentConsentsTable)
    .where(eq(scholarshipParentConsentsTable.tokenHash, tokenHash))
    .limit(1);

  if (!row) {
    return res.status(404).json({ error: "Nie znaleziono formularza zgody." });
  }

  const now = new Date();
  if (row.status === "signed") {
    return res.status(409).json({ error: "Ta zgoda została już podpisana." });
  }
  if (row.tokenExpiresAt.getTime() < now.getTime()) {
    await db
      .update(scholarshipParentConsentsTable)
      .set({ status: "expired" })
      .where(eq(scholarshipParentConsentsTable.id, row.id));
    await db
      .update(scholarshipApplicationsTable)
      .set({ parentConsentStatus: "expired" })
      .where(eq(scholarshipApplicationsTable.id, row.scholarshipApplicationId));
    return res.status(410).json({ error: "Link do formularza zgody wygasł." });
  }

  await db
    .update(scholarshipParentConsentsTable)
    .set({
      openedAt: row.openedAt ?? now,
      relationshipToApplicant: parsed.data.relationshipToApplicant,
      signatureIpAddress: req.ip || null,
      signatureName: parsed.data.signatureName,
      signatureUserAgent:
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : null,
      signedAt: now,
      status: "signed",
    })
    .where(eq(scholarshipParentConsentsTable.id, row.id));

  await db
    .update(scholarshipApplicationsTable)
    .set({
      parentConsentCompletedAt: now,
      parentConsentStatus: "signed",
    })
    .where(eq(scholarshipApplicationsTable.id, row.scholarshipApplicationId));

  return res.status(201).json({ ok: true, signedAt: now.toISOString() });
});

function shapeSubmissionResponse(row: {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  };
}

router.post("/contact", async (req, res) => {
  const parsed = contactRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const turnstile = await verifyTurnstileToken(req, parsed.data.turnstileToken);
  if (!turnstile.ok) {
    return res.status(400).json({ error: turnstile.message });
  }

  if (parsed.data.type === "scholarship") {
    if (!parsed.data.termsAccepted || !parsed.data.privacyPolicyAcknowledged) {
      return res.status(422).json({
        error:
          "Akceptacja regulaminu i potwierdzenie zapoznania się z polityką prywatności są wymagane.",
      });
    }
    if (typeof parsed.data.isAdultDeclared !== "boolean") {
      return res.status(422).json({
        error:
          "Musisz wskazać, czy w dniu wysłania zgłoszenia masz ukończone 18 lat.",
      });
    }
    if (
      !parsed.data.isAdultDeclared &&
      (!parsed.data.parentEmail || !parsed.data.parentFullName)
    ) {
      return res.status(422).json({
        error:
          "Dla osoby niepełnoletniej wymagane są e-mail oraz imię i nazwisko rodzica lub opiekuna prawnego.",
      });
    }
  }

  if (hasDatabaseConfig()) {
    const {
      db,
      contactSubmissionsTable,
      insertContactSchema,
      mentorApplicationsTable,
      insertMentorApplicationSchema,
      scholarshipApplicationsTable,
      insertScholarshipApplicationSchema,
      scholarshipParentConsentsTable,
      newsletterSignupsTable,
      insertNewsletterSignupSchema,
    } = await import("@workspace/db");

    const config =
      parsed.data.type === "mentor_application" || parsed.data.type === "mentor"
        ? {
            table: mentorApplicationsTable,
            schema: insertMentorApplicationSchema,
          }
        : parsed.data.type === "scholarship"
          ? {
              table: scholarshipApplicationsTable,
              schema: insertScholarshipApplicationSchema,
            }
          : parsed.data.type === "newsletter"
            ? {
                table: newsletterSignupsTable,
                schema: insertNewsletterSignupSchema,
              }
            : {
                table: contactSubmissionsTable,
                schema: insertContactSchema,
              };

    const insertPayload =
      parsed.data.type === "scholarship"
        ? {
            name: parsed.data.name,
            email: parsed.data.email,
            phone: parsed.data.phone,
            message: parsed.data.message,
            isAdultDeclared: parsed.data.isAdultDeclared,
            parentConsentCompletedAt: null,
            parentConsentStatus: parsed.data.isAdultDeclared ? "not_required" : "pending",
            parentEmail: parsed.data.parentEmail ?? null,
            parentFullName: parsed.data.parentFullName ?? null,
            privacyPolicyAcknowledgedAt: parsed.data.privacyPolicyAcknowledged
              ? new Date()
              : null,
            requiresParentConsent: !parsed.data.isAdultDeclared,
            termsAcceptedAt: parsed.data.termsAccepted ? new Date() : null,
          }
        : {
            name: parsed.data.name,
            email: parsed.data.email,
            phone: parsed.data.phone,
            message: parsed.data.message,
          };

    const insert = config.schema.safeParse(insertPayload);
    if (!insert.success) {
      return res.status(422).json({ error: insert.error.message });
    }

    const [row] = await db
      .insert(config.table)
      .values(insert.data)
      .returning();

    if (
      parsed.data.type === "scholarship" &&
      parsed.data.isAdultDeclared === false &&
      parsed.data.parentEmail &&
      parsed.data.parentFullName
    ) {
      const { token, tokenHash } = createParentConsentToken();
      const tokenExpiresAt = new Date(
        Date.now() + SCHOLARSHIP_PARENT_CONSENT_EXPIRY_HOURS * 60 * 60 * 1000,
      );
      const consentStatementText = buildParentConsentStatement({
        applicantEmail: row.email,
        applicantName: row.name,
        language: parsed.data.language,
      });

      await db.insert(scholarshipParentConsentsTable).values({
        applicantEmailSnapshot: row.email,
        applicantNameSnapshot: row.name,
        consentStatementText,
        consentStatementVersion: SCHOLARSHIP_PARENT_CONSENT_VERSION,
        parentEmail: parsed.data.parentEmail,
        parentFullName: parsed.data.parentFullName,
        scholarshipApplicationId: row.id,
        status: "pending",
        tokenExpiresAt,
        tokenHash,
      });

      const origin =
        process.env.PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? getRequestOrigin(req);
      const consentPath =
        parsed.data.language === "en"
          ? "/en/scholarship/parent-consent"
          : "/stypendium/zgoda-rodzica";
      const consentUrl = `${origin}${consentPath}?token=${encodeURIComponent(token)}`;

      void sendScholarshipParentConsentEmail({
        applicantName: row.name,
        consentUrl,
        expiresAt: tokenExpiresAt,
        language: parsed.data.language,
        parentEmail: parsed.data.parentEmail,
        parentFullName: parsed.data.parentFullName,
      });
    }

    void sendContactEmails({
      name: row.name,
      email: row.email,
      phone: parsed.data.phone ?? null,
      message: row.message,
      type: parsed.data.type,
      language: parsed.data.language,
    });

    return res.status(201).json({
      ...shapeSubmissionResponse(row),
      parentConsentStatus:
        parsed.data.type === "scholarship" && parsed.data.isAdultDeclared === false
          ? "pending"
          : parsed.data.type === "scholarship"
            ? "not_required"
            : undefined,
      type: parsed.data.type,
    });
  }

  if (parsed.data.type === "scholarship" && parsed.data.isAdultDeclared === false) {
    return res.status(503).json({
      error:
        "Formularz dla osoby niepełnoletniej wymaga aktywnej konfiguracji bazy danych po stronie serwera.",
    });
  }

  const row: LocalSubmission = {
    id: nextSubmissionId++,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    message: parsed.data.message,
    type: parsed.data.type,
    createdAt: new Date().toISOString(),
  };
  localSubmissions.push(row);
  logger.warn(
    { submissionId: row.id, type: row.type },
    "Database config not set; storing contact submission in memory only",
  );

  void sendContactEmails({
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    type: row.type,
    language: parsed.data.language,
  });

  return res.status(201).json(row);
});

export default router;
