import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  CheckCircle2,
  ArrowRight,
  Loader2,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import { Link } from "wouter";
import { getApiBase } from "@/lib/api-base";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/TurnstileWidget";
import {
  SCHOLARSHIP_MENTOR_NAMES,
  SORTED_SCHOLARSHIP_MENTORS,
} from "@/data/scholarship-mentors";
import {
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebPageSchema,
  useSeo,
} from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

const API_BASE = getApiBase();

export default function ScholarshipForm() {
  const { language, isEnglish, localizePath, t } = useLanguage();
  useSeo({
    title: t("Aplikacja do konkursu stypendialnego | ACADEA", "Scholarship competition application | ACADEA"),
    description: t(
      "Wypełnij formularz zgłoszeniowy do Konkursu Stypendialnego ACADEA i opowiedz o swoich planach, osiągnięciach oraz motywacji.",
      "Complete the ACADEA Scholarship Competition application form and tell us about your plans, achievements and motivation.",
    ),
    path: localizePath("/stypendium/aplikacja"),
    keywords: isEnglish ? ["scholarship application form", "scholarship competition application", "ACADEA scholarship"] : ["formularz stypendium", "aplikacja stypendialna", "konkurs stypendialny ACADEA"],
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebPageSchema({
        path: localizePath("/stypendium/aplikacja"),
        title: t("Aplikacja do konkursu stypendialnego | ACADEA", "Scholarship competition application | ACADEA"),
        description: t(
          "Formularz zgłoszeniowy do programu stypendialnego ACADEA dla kandydatów aplikujących o wsparcie.",
          "Application form for candidates applying for ACADEA scholarship support.",
        ),
      }),
      createBreadcrumbSchema([
        { name: t("Strona Główna", "Home"), path: localizePath("/") },
        { name: t("Stypendia", "Scholarship"), path: localizePath("/stypendium") },
        { name: t("Aplikacja", "Application"), path: localizePath("/stypendium/aplikacja") },
      ]),
    ],
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    isAdultDeclared: "",
    parentEmail: "",
    parentFullName: "",
    school: "",
    averageGrade: "",
    gradeYear: "",
    targetCountry: "",
    field: "",
    firstMentor: "",
    secondMentor: "",
    thirdMentor: "",
    noMentorPreference: false,
    achievements: "",
    projects: "",
    motivation: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
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
    if (!form.isAdultDeclared) {
      e.isAdultDeclared = t("Wskaż, czy masz ukończone 18 lat.", "Tell us whether you are 18 or older.");
    }
    if (form.isAdultDeclared === "minor") {
      if (!form.parentFullName.trim() || form.parentFullName.trim().length < 2) {
        e.parentFullName = t("Podaj imię i nazwisko rodzica lub opiekuna prawnego.", "Enter the parent or legal guardian's full name.");
      }
      if (
        !form.parentEmail.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)
      ) {
        e.parentEmail = t("Podaj poprawny e-mail rodzica lub opiekuna prawnego.", "Enter a valid parent or legal guardian email address.");
      }
    }
    if (!form.school.trim()) e.school = t("Podaj nazwę szkoły lub liceum.", "Enter your school name.");
    if (!form.field.trim()) e.field = t("Napisz, co chcesz studiować.", "Tell us what you want to study.");
    if (!form.noMentorPreference) {
      if (!form.firstMentor) e.firstMentor = t("Wybierz mentora pierwszego wyboru.", "Choose your first-choice mentor.");
      if (!form.secondMentor) e.secondMentor = t("Wybierz mentora drugiego wyboru.", "Choose your second-choice mentor.");
      if (!form.thirdMentor) e.thirdMentor = t("Wybierz mentora trzeciego wyboru.", "Choose your third-choice mentor.");
      const picks = [form.firstMentor, form.secondMentor, form.thirdMentor].filter(Boolean);
      if (new Set(picks).size !== picks.length) {
        e.firstMentor = t("Każdy mentor w rankingu powinien być inny.", "Each mentor in your ranking should be different.");
      }
    }
    if (!form.achievements.trim() || form.achievements.trim().length < 10) e.achievements = t("Opisz swoje osiągnięcia (min. 10 znaków).", "Describe your achievements (minimum 10 characters).");
    if (!form.motivation.trim() || form.motivation.trim().length < 20) e.motivation = t("Napisz kilka zdań o sobie (min. 20 znaków).", "Write a few sentences about yourself (minimum 20 characters).");
    if (!termsAccepted) {
      e.termsAccepted = t(
        "Akceptacja regulaminu i potwierdzenie zapoznania się z polityką prywatności są wymagane.",
        "Accepting the terms and confirming that you have read the privacy policy is required.",
      );
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isTurnstileEnabled() && !turnstileToken) {
      setSubmitError(t("Potwierdź zabezpieczenie formularza przed wysłaniem zgłoszenia.", "Complete the form security check before submitting your application."));
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
          isAdultDeclared: form.isAdultDeclared === "adult",
          message: [
            "Zgłoszenie do Konkursu Stypendialnego ACADEA 2026",
            form.isAdultDeclared === "minor"
              ? "Status pełnoletności: kandydat(ka) niepełnoletni(a)"
              : "Status pełnoletności: kandydat(ka) pełnoletni(a)",
            form.isAdultDeclared === "minor"
              ? `Rodzic / opiekun prawny: ${form.parentFullName}`
              : null,
            form.isAdultDeclared === "minor"
              ? `E-mail rodzica / opiekuna prawnego: ${form.parentEmail}`
              : null,
            `Szkoła: ${form.school}`,
            form.averageGrade ? `Średnia ocen za ostatni rok szkolny: ${form.averageGrade}` : null,
            form.gradeYear ? `Klasa / rok ukończenia: ${form.gradeYear}` : null,
            form.targetCountry ? `Docelowy kraj studiów: ${form.targetCountry}` : null,
            `Kierunek / dziedzina: ${form.field}`,
            form.noMentorPreference
              ? "Ranking mentorów: brak preferencji"
              : [
                  `Mentor 1. wyboru: ${form.firstMentor}`,
                  `Mentor 2. wyboru: ${form.secondMentor}`,
                  `Mentor 3. wyboru: ${form.thirdMentor}`,
                ].join("\n"),
            `Osiągnięcia (konkursy, nagrody, olimpiady, publikacje): ${form.achievements}`,
            form.projects ? `Projekty stworzone w wolnym czasie: ${form.projects}` : null,
            `Motywacja: ${form.motivation}`,
            "Akceptacja regulaminu Konkursu Stypendialnego ACADEA 2026: tak",
            "Potwierdzenie zapoznania się z polityką prywatności: tak",
            "Oświadczenie dotyczące osoby niepełnoletniej: jeżeli kandydat jest niepełnoletni, zgłoszenie zostało przesłane za uprzednią zgodą rodzica lub opiekuna prawnego",
          ]
            .filter(Boolean)
            .join("\n"),
          parentEmail: form.isAdultDeclared === "minor" ? form.parentEmail : undefined,
          parentFullName: form.isAdultDeclared === "minor" ? form.parentFullName : undefined,
          privacyPolicyAcknowledged: true,
          termsAccepted: true,
          type: "scholarship",
          language,
          turnstileToken,
        }),
      });
      const data = (await res.json()) as { id?: number; error?: string };
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

  return (
    <div className="min-h-screen bg-gray-50 pt-28 md:pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 text-primary text-xs font-semibold mb-5 uppercase tracking-widest border border-accent/40">
            <Heart size={13} className="fill-accent text-accent" />
            {t("Konkurs Stypendialny ACADEA 2026", "ACADEA Scholarship Competition 2026")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-3">
            {t("Aplikuj o stypendium", "Apply for a scholarship")}
          </h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            {t(
              "Formularz jest przeznaczony dla osób, które w roku szkolnym 2026/2027 będą uczniami szkół średnich. Zgłoszenia rozpatrujemy z indywidualną uwagą dla każdej historii.",
              "This form is for people who will be upper-secondary school students in the 2026/2027 school year. We review every application with individual attention.",
            )}
          </p>
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
              <h2 className="text-2xl font-bold text-primary mb-2">{t("Zgłoszenie wysłane!", "Application sent!")}</h2>
              <p className="text-gray-500 mb-8">
                {t("Dziękujemy,", "Thank you,")} <strong>{form.name.split(" ")[0]}</strong>! {t("Zgłoszenie otrzymaliśmy", "We have received your application")}
                {form.isAdultDeclared === "minor"
                  ? t(`, a na adres ${form.parentEmail} wysłaliśmy link do zgody rodzica lub opiekuna prawnego.`, ` and we have sent a parent/legal guardian consent link to ${form.parentEmail}.`)
                  : "."}{" "}
                {t("Odezwiemy się do Ciebie po przejrzeniu aplikacji.", "We will contact you after reviewing your application.")}
              </p>
              <Link href={localizePath("/")}>
                <Button className="rounded-full bg-primary text-white hover:bg-primary/90 font-semibold px-8">
                  {t("Wróć na stronę główną", "Back to home")}
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6"
            >
              {/* Personal info */}
              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                  {t("Twoje dane", "Your details")}
                </h2>
                <div className="space-y-3">
                  <div>
                    <Input value={form.name} onChange={(e) => set("name", e.target.value)}
                      placeholder={`${t("Imię i nazwisko", "Full name")} *`} className={`rounded-xl ${errors.name ? "border-red-400" : ""}`} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                      placeholder="E-mail *" className={`rounded-xl ${errors.email ? "border-red-400" : ""}`} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                    placeholder={t("Telefon", "Phone")} className="rounded-xl" />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t("Czy w dniu wysłania zgłoszenia masz ukończone 18 lat?", "On the day you submit this application, are you 18 or older?")} *
                    </label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {[
                        { value: "adult", label: t("Tak, mam ukończone 18 lat", "Yes, I am 18 or older") },
                        { value: "minor", label: t("Nie, mam mniej niż 18 lat", "No, I am under 18") },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                            form.isAdultDeclared === option.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-200 bg-gray-50 text-gray-600"
                          }`}
                        >
                          <input
                            type="radio"
                            name="age-status"
                            value={option.value}
                            checked={form.isAdultDeclared === option.value}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                isAdultDeclared: event.target.value,
                                parentEmail:
                                  event.target.value === "minor"
                                    ? current.parentEmail
                                    : "",
                                parentFullName:
                                  event.target.value === "minor"
                                    ? current.parentFullName
                                    : "",
                              }))
                            }
                            className="mt-1 h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    {errors.isAdultDeclared ? (
                      <p className="text-red-500 text-xs mt-1">{errors.isAdultDeclared}</p>
                    ) : null}
                  </div>
                  {form.isAdultDeclared === "minor" ? (
                    <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 space-y-3">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {t(
                          "Dla osoby niepełnoletniej potrzebujemy kontaktu do rodzica lub opiekuna prawnego. Po wysłaniu zgłoszenia wyślemy na ten adres bezpieczny link do podpisania formularza zgody.",
                          "For a minor, we need contact details for a parent or legal guardian. After the application is submitted, we will send a secure consent form link to this address.",
                        )}
                      </p>
                      <div>
                        <Input
                          value={form.parentFullName}
                          onChange={(e) => set("parentFullName", e.target.value)}
                          placeholder={`${t("Imię i nazwisko rodzica / opiekuna prawnego", "Parent / legal guardian full name")} *`}
                          className={`rounded-xl ${errors.parentFullName ? "border-red-400" : ""}`}
                        />
                        {errors.parentFullName ? (
                          <p className="text-red-500 text-xs mt-1">{errors.parentFullName}</p>
                        ) : null}
                      </div>
                      <div>
                        <Input
                          type="email"
                          value={form.parentEmail}
                          onChange={(e) => set("parentEmail", e.target.value)}
                          placeholder={`${t("E-mail rodzica / opiekuna prawnego", "Parent / legal guardian email")} *`}
                          className={`rounded-xl ${errors.parentEmail ? "border-red-400" : ""}`}
                        />
                        {errors.parentEmail ? (
                          <p className="text-red-500 text-xs mt-1">{errors.parentEmail}</p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Education */}
              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                  {t("Edukacja i plany", "Education and plans")}
                </h2>
                <div className="space-y-3">
                  <div>
                    <Input value={form.school} onChange={(e) => set("school", e.target.value)}
                      placeholder={`${t("Szkoła / liceum", "School")} *`} className={`rounded-xl ${errors.school ? "border-red-400" : ""}`} />
                    {errors.school && <p className="text-red-500 text-xs mt-1">{errors.school}</p>}
                  </div>
                  <Input value={form.averageGrade} onChange={(e) => set("averageGrade", e.target.value)}
                    placeholder={t("Średnia ocen za ostatni rok szkolny, np. 5.17", "Average grade for the last school year, e.g. 5.17")} className="rounded-xl" />
                  <Input value={form.gradeYear} onChange={(e) => set("gradeYear", e.target.value)}
                    placeholder={t("Klasa lub planowany rok matury", "Year group or planned graduation year")} className="rounded-xl" />
                  <Input value={form.targetCountry} onChange={(e) => set("targetCountry", e.target.value)}
                    placeholder={t("Docelowy kraj studiów", "Target study country")} className="rounded-xl" />
                  <div>
                    <Input value={form.field} onChange={(e) => set("field", e.target.value)}
                      placeholder={`${t("Co chcesz studiować?", "What do you want to study?")} *`} className={`rounded-xl ${errors.field ? "border-red-400" : ""}`} />
                    {errors.field && <p className="text-red-500 text-xs mt-1">{errors.field}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Mentor */}
              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
                  {t("Uszereguj 3 mentorów w kolejności preferencji", "Rank 3 mentors in order of preference")}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {t(
                    "Dzięki temu łatwiej dopasujemy Ci osobę, która najlepiej odpowiada Twoim planom i stylowi pracy.",
                    "This helps us match you with someone who best fits your plans and working style.",
                  )}
                </p>

                <div className="space-y-4">
                  {[
                    { key: "firstMentor", label: t("1. wybór *", "1st choice *") },
                    { key: "secondMentor", label: t("2. wybór *", "2nd choice *") },
                    { key: "thirdMentor", label: t("3. wybór *", "3rd choice *") },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label}</label>
                      <div className="relative">
                        <select
                          value={form[field.key as keyof typeof form] as string}
                          onChange={(e) => set(field.key, e.target.value)}
                          disabled={form.noMentorPreference}
                          className={`flex h-12 w-full appearance-none rounded-xl border bg-gray-50 px-4 pr-10 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors[field.key] ? "border-red-400" : "border-gray-200"} ${form.noMentorPreference ? "opacity-60" : ""}`}
                        >
                          <option value="">{t("Wybierz mentora", "Choose a mentor")}</option>
                          {SCHOLARSHIP_MENTOR_NAMES.map((mentorName) => (
                            <option key={mentorName} value={mentorName}>
                              {mentorName}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                      {errors[field.key] && <p className="text-red-500 text-xs mt-1">{errors[field.key]}</p>}
                    </div>
                  ))}

                  <label className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 leading-relaxed">
                    <input
                      type="checkbox"
                      checked={form.noMentorPreference}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((current) => ({
                          ...current,
                          noMentorPreference: checked,
                          firstMentor: checked ? "" : current.firstMentor,
                          secondMentor: checked ? "" : current.secondMentor,
                          thirdMentor: checked ? "" : current.thirdMentor,
                        }));
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span>{t("Nie mam preferencji co do mentora lub mentorki.", "I do not have a mentor preference.")}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                  {SORTED_SCHOLARSHIP_MENTORS.map((mentor) => (
                    <div key={mentor.name} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                        <GraduationCap size={16} />
                        <span>{mentor.name}</span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{isEnglish ? mentor.descEn : mentor.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Achievements */}
              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">4</span>
                  {t("Osiągnięcia i projekty", "Achievements and projects")}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t("Konkursy, nagrody, olimpiady lub publikacje", "Competitions, awards, olympiads or publications")} *
                    </label>
                    <Textarea
                      value={form.achievements}
                      onChange={(e) => set("achievements", e.target.value)}
                      placeholder={t(
                        "Wymień swoje najważniejsze osiągnięcia — konkursy, nagrody, olimpiady, publikacje naukowe itp.",
                        "List your most important achievements: competitions, awards, olympiads, scientific publications, etc.",
                      )}
                      className={`rounded-xl min-h-[100px] resize-none ${errors.achievements ? "border-red-400" : ""}`}
                    />
                    {errors.achievements && <p className="text-red-500 text-xs mt-1">{errors.achievements}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t("Najciekawsze rzeczy, które udało Ci się stworzyć w wolnym czasie", "The most interesting things you have created in your free time")}
                    </label>
                    <Textarea
                      value={form.projects}
                      onChange={(e) => set("projects", e.target.value)}
                      placeholder={t(
                        "Projekty, strony, aplikacje, inicjatywy, organizacje… Dodaj linki, jeśli możesz.",
                        "Projects, websites, apps, initiatives, organisations... Add links if you can.",
                      )}
                      className="rounded-xl min-h-[100px] resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Motivation */}
              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">5</span>
                  {t("Dlaczego aplikujesz?", "Why are you applying?")}
                </h2>
                <div>
                  <Textarea
                    value={form.motivation}
                    onChange={(e) => set("motivation", e.target.value)}
                    placeholder={`${t(
                      "Opowiedz nam o sobie, swoich marzeniach i o tym, dlaczego stypendium ACADEA mogłoby zmienić Twoją sytuację.",
                      "Tell us about yourself, your dreams and why an ACADEA scholarship could change your situation.",
                    )} *`}
                    className={`rounded-xl min-h-[140px] resize-none ${errors.motivation ? "border-red-400" : ""}`}
                  />
                  {errors.motivation && <p className="text-red-500 text-xs mt-1">{errors.motivation}</p>}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="space-y-2">
                <label className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 leading-relaxed">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>
                    {t("Oświadczam, że zapoznałem(-am) się z", "I declare that I have read the")}{" "}
                    <Link
                      href={localizePath("/stypendium/regulamin")}
                      className="font-semibold text-primary hover:underline"
                    >
                      {t("Regulaminem Konkursu Stypendialnego ACADEA 2026", "ACADEA Scholarship Competition Terms 2026")}
                    </Link>{" "}
                    {t("i akceptuję jego postanowienia oraz zapoznałem(-am) się z", "and accept its provisions and have read the")}{" "}
                    <Link
                      href={localizePath("/polityka-prywatnosci")}
                      className="font-semibold text-primary hover:underline"
                    >
                      {t("Polityką Prywatności", "Privacy Policy")}
                    </Link>
                    . {t(
                      "Jeżeli jestem osobą niepełnoletnią, potwierdzam, że zgłoszenie składam za uprzednią zgodą rodzica lub opiekuna prawnego.",
                      "If I am a minor, I confirm that I submit this application with prior consent of my parent or legal guardian.",
                    )} *
                  </span>
                </label>
                {errors.termsAccepted ? (
                  <p className="text-red-500 text-xs">{errors.termsAccepted}</p>
                ) : null}
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                  {submitError}
                </div>
              )}

              <div className="space-y-2">
                <TurnstileWidget
                  onTokenChange={setTurnstileToken}
                  resetKey={turnstileResetKey}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-14 rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-base"
              >
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin mr-2" /> {t("Wysyłanie…", "Sending...")}</>
                ) : (
                  <>{t("Wyślij zgłoszenie", "Send application")} <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </Button>
              <p className="text-center text-xs text-gray-400">
                {t(
                  "Zgłoszenia rozpatrujemy indywidualnie. W przypadku osoby niepełnoletniej pełna aktywacja zgłoszenia wymaga podpisu rodzica lub opiekuna prawnego z linku wysłanego e-mailem.",
                  "We review applications individually. For a minor, full activation of the application requires a parent or legal guardian signature through the link sent by email.",
                )}
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
