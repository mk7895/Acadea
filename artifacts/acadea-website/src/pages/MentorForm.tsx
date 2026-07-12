import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Heart,
  Briefcase,
} from "lucide-react";
import { Link } from "wouter";
import { getApiBase } from "@/lib/api-base";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/TurnstileWidget";
import {
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebPageSchema,
  useSeo,
} from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

const API_BASE = getApiBase();

type Role = "paid" | "volunteer" | "both" | "";

export default function MentorForm() {
  const { language, isEnglish, localizePath, t } = useLanguage();

  const countries = isEnglish
    ? [
        "United Kingdom", "Netherlands", "Germany", "France", "Switzerland",
        "Sweden", "Denmark", "USA", "Canada", "Australia", "Singapore", "Japan",
        "South Korea", "Ireland", "Belgium", "Austria", "Other",
      ]
    : [
        "Wielka Brytania", "Holandia", "Niemcy", "Francja", "Szwajcaria",
        "Szwecja", "Dania", "USA", "Kanada", "Australia", "Singapur", "Japonia",
        "Korea Południowa", "Irlandia", "Belgia", "Austria", "Inne",
      ];

  const roles = [
    {
      id: "paid" as const,
      label: t("Płatne sesje mentoringowe", "Paid mentoring sessions"),
      icon: <Briefcase size={18} />,
      desc: t(
        "Chcę pracować z kandydatami i otrzymywać wynagrodzenie za sesje.",
        "I want to work with candidates and receive payment for sessions.",
      ),
    },
    {
      id: "volunteer" as const,
      label: t("Wolontariat", "Volunteering"),
      icon: <Heart size={18} />,
      desc: t(
        "Chcę pomagać bezpłatnie — z pasji i chęci przekazania wiedzy.",
        "I want to help free of charge - out of passion and a wish to share knowledge.",
      ),
    },
    {
      id: "both" as const,
      label: t("Jedno i drugie", "Both"),
      icon: <CheckCircle2 size={18} />,
      desc: t(
        "Jestem otwarty/a na oba modele.",
        "I am open to both models.",
      ),
    },
  ];

  useSeo({
    title: t("Dołącz do zespołu mentorów | ACADEA", "Join the mentor team | ACADEA"),
    description: t(
      "Aplikuj do zespołu ACADEA jako mentor lub wolontariusz i wspieraj kandydatów aplikujących na studia za granicą.",
      "Apply to the ACADEA team as a mentor or volunteer and support candidates applying to study abroad.",
    ),
    path: localizePath("/mentoruj"),
    keywords: isEnglish
      ? ["ACADEA mentor", "join mentor team", "study abroad mentoring"]
      : ["mentor ACADEA", "dołącz do zespołu", "mentoring studia za granicą"],
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebPageSchema({
        path: localizePath("/mentoruj"),
        title: t("Dołącz do zespołu mentorów | ACADEA", "Join the mentor team | ACADEA"),
        description: t(
          "Formularz zgłoszeniowy dla osób, które chcą współpracować z ACADEA jako mentorzy lub wolontariusze.",
          "Application form for people who want to cooperate with ACADEA as mentors or volunteers.",
        ),
      }),
      createBreadcrumbSchema([
        { name: t("Strona Główna", "Home"), path: localizePath("/") },
        { name: t("Mentoruj", "Become a mentor"), path: localizePath("/mentoruj") },
      ]),
    ],
  });

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    university: "", country: "", field: "", graduationYear: "",
    role: "" as Role,
    hoursPerWeek: "", motivation: "",
  });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = t("Podaj imię i nazwisko.", "Enter your full name.");
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t("Podaj poprawny e-mail.", "Enter a valid email address.");
    if (!form.university.trim()) e.university = t("Podaj nazwę uczelni.", "Enter the university name.");
    if (!form.country) e.country = t("Wybierz kraj.", "Choose a country.");
    if (!form.field.trim()) e.field = t("Podaj kierunek studiów.", "Enter your degree programme.");
    if (!form.role) e.role = t("Wybierz preferowany model współpracy.", "Choose your preferred cooperation model.");
    if (!form.motivation.trim() || form.motivation.trim().length < 20) {
      e.motivation = t("Napisz kilka zdań o sobie (min. 20 znaków).", "Write a few sentences about yourself (at least 20 characters).");
    }
    if (!consent) e.consent = t("Zgoda na politykę prywatności jest wymagana.", "Privacy policy consent is required.");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (isTurnstileEnabled() && !turnstileToken) {
      setSubmitError(t("Potwierdź zabezpieczenie formularza przed wysłaniem aplikacji.", "Complete the security check before submitting the application."));
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          message: [
            `${t("Uczelnia", "University")}: ${form.university} (${form.country})`,
            `${t("Kierunek", "Degree programme")}: ${form.field}`,
            form.graduationYear ? `${t("Rok ukończenia", "Graduation year")}: ${form.graduationYear}` : null,
            `${t("Model", "Cooperation model")}: ${form.role}`,
            form.hoursPerWeek ? `${t("Dostępność", "Availability")}: ${form.hoursPerWeek} ${t("h/tydzień", "hours/week")}` : null,
            `${t("Motywacja", "Motivation")}: ${form.motivation}`,
            `${t("Zgoda na politykę prywatności", "Privacy policy consent")}: ${t("tak", "yes")}`,
          ].filter(Boolean).join("\n"),
          type: "mentor_application",
          language,
          turnstileToken,
        }),
      });
      const data = await res.json() as { id?: number; error?: string };
      if (!data.id) {
        setSubmitError(data.error ?? t("Błąd. Spróbuj ponownie.", "Something went wrong. Please try again."));
        setTurnstileToken("");
        setTurnstileResetKey((value) => value + 1);
        return;
      }
      setSubmitted(true);
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } catch {
      setSubmitError(t("Błąd sieci. Sprawdź połączenie i spróbuj ponownie.", "Network error. Check your connection and try again."));
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    { icon: <CheckCircle2 size={16} className="text-primary" />, text: t("Elastyczny grafik", "Flexible schedule") },
    { icon: <Users size={16} className="text-primary" />, text: t("Realny wpływ", "Real impact") },
    { icon: <GraduationCap size={16} className="text-primary" />, text: t("Praca lub wolontariat", "Paid or volunteer") },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-28 md:pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-5 uppercase tracking-widest">
            <Users size={13} />
            {t("Dołącz do zespołu", "Join the team")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-3">
            {t("Mentoruj z ACADEA", "Mentor with ACADEA")}
          </h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
              {t(
              "Studiujesz za granicą lub masz już dyplom zagranicznej uczelni? Pomóż kolejnym rocznikom — jako mentor płatny lub wolontariusz.",
              "Do you study abroad or already have a degree from a foreign university? Help the next year groups - as a paid mentor or as a volunteer.",
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {benefits.map((b) => (
            <div key={b.text} className="bg-white rounded-xl border border-gray-100 px-3 py-3 flex flex-col items-center gap-1.5 text-center shadow-sm">
              {b.icon}
              <span className="text-xs font-semibold text-gray-700">{b.text}</span>
            </div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">
            {t("Aplikacja wysłana!", "Application submitted!")}
              </h2>
              <p className="text-gray-500 mb-8">
                {t(
                  `Dziękujemy, ${form.name.split(" ")[0]}! Skontaktujemy się z Tobą w ciągu kilku dni roboczych.`,
                  `Thank you, ${form.name.split(" ")[0]}! We will get back to you within a few working days.`,
                )}
              </p>
              <Link href={localizePath("/")}>
                <Button className="rounded-full bg-primary text-white hover:bg-primary/90 font-semibold px-8">
                  {t("Wróć na stronę główną", "Back to home")}
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6"
            >
              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                  {t("Twoje dane", "Your details")}
                </h2>
                <div className="space-y-3">
                  <div>
                    <Input value={form.name} onChange={(e) => set("name", e.target.value)}
                      placeholder={t("Imie i nazwisko *", "Full name *")} className={`rounded-xl ${errors.name ? "border-red-400" : ""}`} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                      placeholder={t("E-mail *", "Email *")} className={`rounded-xl ${errors.email ? "border-red-400" : ""}`} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                    placeholder={t("Telefon (opcjonalnie)", "Phone (optional)")} className="rounded-xl" />
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                  {t("Studia za granicą", "Study abroad background")}
                </h2>
                <div className="space-y-3">
                  <div>
                    <Input value={form.university} onChange={(e) => set("university", e.target.value)}
                      placeholder={t("Nazwa uczelni *", "University name *")} className={`rounded-xl ${errors.university ? "border-red-400" : ""}`} />
                    {errors.university && <p className="text-red-500 text-xs mt-1">{errors.university}</p>}
                  </div>
                  <div>
                    <select
                      value={form.country}
                      onChange={(e) => set("country", e.target.value)}
                      className={`flex h-9 w-full appearance-none rounded-xl border bg-transparent px-3 py-1 pr-10 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 md:text-sm ${
                        form.country ? "text-foreground" : "text-muted-foreground"
                      } ${errors.country ? "border-red-400" : "border-input"}`}
                    >
                      <option value="">{t("Kraj uczelni *", "Country *")}</option>
                      {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                  </div>
                  <div>
                    <Input value={form.field} onChange={(e) => set("field", e.target.value)}
                      placeholder={t("Kierunek studiów *", "Degree programme *")} className={`rounded-xl ${errors.field ? "border-red-400" : ""}`} />
                    {errors.field && <p className="text-red-500 text-xs mt-1">{errors.field}</p>}
                  </div>
                  <Input value={form.graduationYear} onChange={(e) => set("graduationYear", e.target.value)}
                    placeholder={t("Rok ukończenia lub planowany rok (opcjonalnie)", "Graduation year or expected year (optional)")} className="rounded-xl" />
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
                  {t("Model współpracy *", "Cooperation model *")}
                </h2>
                <div className="space-y-2">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => set("role", r.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                        form.role === r.id ? "border-primary bg-primary/6" : "border-gray-100 hover:border-primary/30"
                      }`}
                    >
                      <span className={`mt-0.5 shrink-0 ${form.role === r.id ? "text-primary" : "text-gray-400"}`}>{r.icon}</span>
                      <div>
                        <p className={`font-semibold text-sm ${form.role === r.id ? "text-primary" : "text-gray-700"}`}>{r.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                  {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">4</span>
                  {t("Kilka słów o sobie", "A few words about you")}
                </h2>
                <div className="space-y-3">
                  <Input value={form.hoursPerWeek} onChange={(e) => set("hoursPerWeek", e.target.value)}
                    placeholder={t("Ile godzin tygodniowo możesz poświęcić? (opcjonalnie)", "How many hours per week can you commit? (optional)")} className="rounded-xl" />
                  <div>
                    <Textarea
                      value={form.motivation}
                      onChange={(e) => set("motivation", e.target.value)}
                      placeholder={t("Dlaczego chcesz zostać mentorem ACADEA? Co możesz wnieść? *", "Why would you like to mentor with ACADEA? What could you bring? *")}
                      className={`rounded-xl min-h-[120px] resize-none ${errors.motivation ? "border-red-400" : ""}`}
                    />
                    {errors.motivation && <p className="text-red-500 text-xs mt-1">{errors.motivation}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="space-y-2">
                <label className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 leading-relaxed">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>
                    {t("Wyrażam zgodę na przetwarzanie moich danych osobowych zgodnie z", "I agree to the processing of my personal data in accordance with")}{" "}
                    <Link href={localizePath("/polityka-prywatnosci")} className="font-semibold text-primary hover:underline">
                      {t("polityką prywatności", "the privacy policy")}
                    </Link>
                    .
                  </span>
                </label>
                {errors.consent && <p className="text-red-500 text-xs">{errors.consent}</p>}
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                  {submitError}
                </div>
              )}

              <div className="space-y-2">
                <TurnstileWidget onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-14 rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-base"
              >
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin mr-2" /> {t("Wysyłanie…", "Sending...")}</>
                ) : (
                  <>{t("Wyślij aplikację", "Submit application")} <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </Button>
              <p className="text-center text-xs text-gray-400">
                {t("Skontaktujemy się z Tobą w ciągu kilku dni roboczych.", "We will get back to you within a few working days.")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
