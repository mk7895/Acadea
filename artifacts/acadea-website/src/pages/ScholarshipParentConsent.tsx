import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebPageSchema,
  useSeo,
} from "@/lib/seo";
import { getApiBase } from "@/lib/api-base";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/TurnstileWidget";
import { useLanguage } from "@/lib/i18n";

const API_BASE = getApiBase();

type ParentConsentPayload = {
  applicantEmail: string;
  applicantName: string;
  applicationCreatedAt: string;
  consentStatementText: string;
  expiresAt: string;
  parentEmailMasked: string;
  parentFullName: string;
  signedAt: string | null;
  status: "pending" | "signed" | "expired";
};

export default function ScholarshipParentConsent() {
  const [location] = useLocation();
  const { isEnglish, localizePath, t } = useLanguage();
  const locale = isEnglish ? "en-GB" : "pl-PL";
  const token = useMemo(() => {
    const query = location.includes("?") ? location.slice(location.indexOf("?")) : "";
    const params = new URLSearchParams(query);
    return params.get("token")?.trim() ?? "";
  }, [location]);

  useSeo({
    title: t("Zgoda rodzica lub opiekuna | ACADEA", "Parent or guardian consent | ACADEA"),
    description: t(
      "Bezpieczny formularz potwierdzenia zgody rodzica lub opiekuna prawnego na udział osoby niepełnoletniej w Konkursie Stypendialnym ACADEA.",
      "Secure form for confirming parent or legal guardian consent for a minor's participation in the ACADEA Scholarship Competition.",
    ),
    path: localizePath("/stypendium/zgoda-rodzica"),
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebPageSchema({
        path: localizePath("/stypendium/zgoda-rodzica"),
        title: t("Zgoda rodzica lub opiekuna | ACADEA", "Parent or guardian consent | ACADEA"),
        description: t(
          "Formularz potwierdzenia zgody rodzica lub opiekuna prawnego dla zgłoszenia stypendialnego ACADEA.",
          "Parent or legal guardian consent form for an ACADEA scholarship application.",
        ),
      }),
      createBreadcrumbSchema([
        { name: t("Strona Główna", "Home"), path: localizePath("/") },
        { name: t("Stypendia", "Scholarship"), path: localizePath("/stypendium") },
        { name: t("Zgoda rodzica lub opiekuna", "Parent or guardian consent"), path: localizePath("/stypendium/zgoda-rodzica") },
      ]),
    ],
  });

  const [data, setData] = useState<ParentConsentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [form, setForm] = useState({
    relationshipToApplicant: "",
    signatureName: "",
    acknowledgedPrivacyPolicy: false,
    confirmedAuthority: false,
    confirmedContestParticipation: false,
  });

  useEffect(() => {
    if (!token) {
      setLoadError(t("Brak tokenu formularza zgody.", "Missing consent form token."));
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError("");

    fetch(`${API_BASE}/scholarship-parent-consents/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as
          | ParentConsentPayload
          | { error?: string };
        if (!response.ok) {
          throw new Error("error" in payload ? payload.error ?? t("Nie udało się wczytać formularza.", "Could not load the form.") : t("Nie udało się wczytać formularza.", "Could not load the form."));
        }
        return payload as ParentConsentPayload;
      })
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setForm((current) => ({
          ...current,
          signatureName: payload.parentFullName,
        }));
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !data) return;
    if (
      !form.relationshipToApplicant.trim() ||
      !form.signatureName.trim() ||
      !form.acknowledgedPrivacyPolicy ||
      !form.confirmedAuthority ||
      !form.confirmedContestParticipation
    ) {
      setSubmitError(t("Uzupełnij wszystkie wymagane pola i potwierdzenia.", "Complete all required fields and confirmations."));
      return;
    }
    if (isTurnstileEnabled() && !turnstileToken) {
      setSubmitError(t("Potwierdź zabezpieczenie formularza przed podpisaniem zgody.", "Complete the form security check before signing the consent."));
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(
        `${API_BASE}/scholarship-parent-consents/${encodeURIComponent(token)}/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            turnstileToken,
          }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? t("Nie udało się podpisać formularza.", "Could not sign the form."));
      }
      setSubmitted(true);
      setData((current) =>
        current
          ? {
              ...current,
              signedAt: new Date().toISOString(),
              status: "signed",
            }
          : current,
      );
      setTurnstileToken("");
      setTurnstileResetKey((current) => current + 1);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : t("Nie udało się podpisać formularza.", "Could not sign the form."),
      );
      setTurnstileToken("");
      setTurnstileResetKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20 md:pt-32">
      <div className="container mx-auto max-w-2xl px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <ShieldCheck size={14} className="text-accent" />
              {t("Konkurs Stypendialny ACADEA 2026", "ACADEA Scholarship Competition 2026")}
            </div>
            <h1 className="mb-3 text-4xl font-bold text-primary md:text-5xl">
              {t("Zgoda rodzica lub opiekuna", "Parent or guardian consent")}
            </h1>
            <p className="mx-auto max-w-lg text-lg text-gray-500">
              {t(
                "To bezpieczny formularz potwierdzenia udziału osoby niepełnoletniej w konkursie stypendialnym ACADEA.",
                "This secure form confirms a minor's participation in the ACADEA Scholarship Competition.",
              )}
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <Loader2 size={18} className="mr-2 animate-spin" /> {t("Ładowanie formularza…", "Loading form...")}
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <AlertTriangle size={16} />
                  {t("Nie udało się otworzyć formularza", "Could not open the form")}
                </div>
                <p>{loadError}</p>
              </div>
            ) : data?.status === "expired" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <AlertTriangle size={16} />
                  {t("Link wygasł", "The link has expired")}
                </div>
                <p>
                  {t(
                    "Ten link do formularza zgody wygasł. Jeśli zgoda nadal jest potrzebna, prosimy o kontakt z zespołem ACADEA pod adresem",
                    "This consent form link has expired. If consent is still needed, please contact the ACADEA team at",
                  )}{" "}
                  <a className="font-semibold text-primary hover:underline" href="mailto:contact@acadea.org">
                    contact@acadea.org
                  </a>
                  .
                </p>
              </div>
            ) : data?.status === "signed" || submitted ? (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 size={40} className="text-primary" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-primary">{t("Zgoda została podpisana", "Consent has been signed")}</h2>
                <p className="mb-8 text-gray-500">
                  {t("Dziękujemy. Zgoda rodzica lub opiekuna prawnego dla aplikacji", "Thank you. Parent or legal guardian consent for the application of")}{" "}
                  <strong>{data?.applicantName}</strong> {t("została zapisana.", "has been saved.")}
                </p>
                <Link href={localizePath("/")}>
                  <Button className="rounded-full bg-primary px-8 font-semibold text-white hover:bg-primary/90">
                    {t("Wróć na stronę główną", "Back to home")}
                  </Button>
                </Link>
              </div>
            ) : data ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-700">
                  <div className="mb-2 font-semibold text-primary">{t("Dane zgłoszenia", "Application details")}</div>
                  <p>
                    {t("Kandydat(ka):", "Candidate:")} <strong>{data.applicantName}</strong>
                  </p>
                  <p>
                    {t("E-mail kandydata:", "Candidate email:")} <strong>{data.applicantEmail}</strong>
                  </p>
                  <p>
                    {t("Formularz wysłano:", "Form submitted:")}{" "}
                    <strong>{new Date(data.applicationCreatedAt).toLocaleString(locale)}</strong>
                  </p>
                  <p>
                    {t("Link został wysłany na adres:", "Link sent to:")} <strong>{data.parentEmailMasked}</strong>
                  </p>
                  <p>
                    {t("Link ważny do:", "Link valid until:")}{" "}
                    <strong>{new Date(data.expiresAt).toLocaleString(locale)}</strong>
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <h2 className="mb-3 text-base font-bold text-primary">
                    {t("Treść oświadczenia", "Consent statement")}
                  </h2>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {data.consentStatementText}
                  </div>
                </div>

                <div className="space-y-3">
                  <Input
                    value={form.relationshipToApplicant}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        relationshipToApplicant: event.target.value,
                      }))
                    }
                    placeholder={`${t("Relacja do kandydata, np. mama, tata, opiekunka prawna", "Relationship to the candidate, e.g. mother, father, legal guardian")} *`}
                    className="rounded-xl"
                  />
                  <Input
                    value={form.signatureName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        signatureName: event.target.value,
                      }))
                    }
                    placeholder={`${t("Imię i nazwisko składającego oświadczenie", "Full name of the person signing")} *`}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: "confirmedAuthority",
                      label:
                        t("Potwierdzam, że jestem rodzicem lub opiekunem prawnym osoby wskazanej w formularzu. *", "I confirm that I am the parent or legal guardian of the person named in the form. *"),
                    },
                    {
                      key: "confirmedContestParticipation",
                      label:
                        t("Wyrażam zgodę na udział osoby niepełnoletniej w Konkursie Stypendialnym ACADEA 2026 oraz na przetwarzanie danych niezbędnych do przeprowadzenia konkursu. *", "I consent to the minor's participation in the ACADEA Scholarship Competition 2026 and to the processing of data required to run the competition. *"),
                    },
                    {
                      key: "acknowledgedPrivacyPolicy",
                      label:
                        t("Potwierdzam, że zapoznałem(-am) się z polityką prywatności ACADEA. *", "I confirm that I have read the ACADEA Privacy Policy. *"),
                    },
                  ].map((entry) => (
                    <label
                      key={entry.key}
                      className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(form[entry.key as keyof typeof form])}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [entry.key]: event.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>
                        {entry.key === "acknowledgedPrivacyPolicy" ? (
                          <>
                            {t("Potwierdzam, że zapoznałem(-am) się z", "I confirm that I have read the")}{" "}
                            <Link
                              href={localizePath("/polityka-prywatnosci")}
                              className="font-semibold text-primary hover:underline"
                            >
                              {t("polityką prywatności ACADEA", "ACADEA Privacy Policy")}
                            </Link>
                            . *
                          </>
                        ) : (
                          entry.label
                        )}
                      </span>
                    </label>
                  ))}
                </div>

                {submitError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {submitError}
                  </div>
                ) : null}

                <TurnstileWidget
                  onTokenChange={setTurnstileToken}
                  resetKey={turnstileResetKey}
                />

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-14 w-full rounded-full bg-primary text-base font-bold text-white hover:bg-primary/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" /> {t("Zapisywanie podpisu…", "Saving signature...")}
                    </>
                  ) : (
                    <>
                      {t("Podpisz zgodę", "Sign consent")} <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
