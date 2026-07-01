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
} from "lucide-react";
import { Link } from "wouter";
import { getApiBase } from "@/lib/api-base";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/TurnstileWidget";

const API_BASE = getApiBase();

const MENTORS = [
  {
    name: "Nikodem Ciomcia",
    desc: "Wspiera kandydatów, którzy chcą połączyć ambitne cele z dobrze ułożoną strategią aplikacyjną.",
  },
  {
    name: "Krzysztof Sosnowski",
    desc: "Pomaga uporządkować proces aplikacyjny i przełożyć zainteresowania na mocny, spójny profil kandydata.",
  },
  {
    name: "Małgorzata Słowikowska",
    desc: "Wnosi dużo uważności na historię ucznia, motywację i to, jak dobrze pokazać własny potencjał.",
  },
  {
    name: "Mikołaj Błaszczyk",
    desc: "Pomaga kandydatom budować pewność w decyzjach dotyczących kierunku, uczelni i dalszych kroków.",
  },
  {
    name: "Marlena Sołtysińska",
    desc: "Absolwentka UCL i NYU. Od lat wspiera uczniów w planowaniu ścieżki i świadomym wyborze kolejnych etapów.",
  },
  {
    name: "Mateusz Klepacki",
    desc: "Absolwent LSE i NYU. Pomaga kandydatom przełożyć ambicję i osiągnięcia na konkretną strategię aplikacyjną.",
  },
  {
    name: "Amelia Kudasik",
    desc: "Wspiera osoby, które chcą rozwijać swój profil w sposób uporządkowany i autentyczny.",
  },
  {
    name: "Oskar Krawczyk",
    desc: "Pomaga kandydatom uchwycić najmocniejsze strony ich historii i dobrze je pokazać w aplikacji.",
  },
] as const;

const MENTOR_NAMES = MENTORS.map((mentor) => mentor.name);

export default function ScholarshipForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
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
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Podaj imię i nazwisko.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Podaj poprawny e-mail.";
    if (!form.school.trim()) e.school = "Podaj nazwę szkoły lub liceum.";
    if (!form.field.trim()) e.field = "Napisz, co chcesz studiować.";
    if (!form.noMentorPreference) {
      if (!form.firstMentor) e.firstMentor = "Wybierz mentora pierwszego wyboru.";
      if (!form.secondMentor) e.secondMentor = "Wybierz mentora drugiego wyboru.";
      if (!form.thirdMentor) e.thirdMentor = "Wybierz mentora trzeciego wyboru.";
      const picks = [form.firstMentor, form.secondMentor, form.thirdMentor].filter(Boolean);
      if (new Set(picks).size !== picks.length) {
        e.firstMentor = "Każdy mentor w rankingu powinien być inny.";
      }
    }
    if (!form.achievements.trim() || form.achievements.trim().length < 10) e.achievements = "Opisz swoje osiągnięcia (min. 10 znaków).";
    if (!form.motivation.trim() || form.motivation.trim().length < 20) e.motivation = "Napisz kilka zdań o sobie (min. 20 znaków).";
    if (!consent) e.consent = "Zgoda na politykę prywatności jest wymagana.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isTurnstileEnabled() && !turnstileToken) {
      setSubmitError("Potwierdź zabezpieczenie formularza przed wysłaniem zgłoszenia.");
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
            "Zgłoszenie do Konkursu Stypendialnego ACADEA 2026",
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
            "Zgoda na politykę prywatności: tak",
          ]
            .filter(Boolean)
            .join("\n"),
          type: "scholarship",
          turnstileToken,
        }),
      });
      const data = (await res.json()) as { id?: number; error?: string };
      if (!data.id) {
        setSubmitError(data.error ?? "Błąd. Spróbuj ponownie.");
        setTurnstileToken("");
        setTurnstileResetKey((value) => value + 1);
        return;
      }
      setSubmitted(true);
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } catch {
      setSubmitError("Błąd sieci. Sprawdź połączenie i spróbuj ponownie.");
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
            Konkurs Stypendialny ACADEA 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-3">
            Aplikuj o stypendium
          </h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            Wypełnij formularz. Zgłoszenia rozpatrujemy z indywidualną uwagą dla każdej historii.
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
              <h2 className="text-2xl font-bold text-primary mb-2">Zgłoszenie wysłane!</h2>
              <p className="text-gray-500 mb-8">
                Dziękujemy, <strong>{form.name.split(" ")[0]}</strong>! Zgłoszenie otrzymaliśmy i odezwiemy się do Ciebie po jego przejrzeniu.
              </p>
              <Link href="/">
                <Button className="rounded-full bg-primary text-white hover:bg-primary/90 font-semibold px-8">
                  Wróć na stronę główną
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
                  Twoje dane
                </h2>
                <div className="space-y-3">
                  <div>
                    <Input value={form.name} onChange={(e) => set("name", e.target.value)}
                      placeholder="Imię i nazwisko *" className={`rounded-xl ${errors.name ? "border-red-400" : ""}`} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                      placeholder="E-mail *" className={`rounded-xl ${errors.email ? "border-red-400" : ""}`} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                    placeholder="Telefon (opcjonalnie)" className="rounded-xl" />
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Education */}
              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                  Edukacja i plany
                </h2>
                <div className="space-y-3">
                  <div>
                    <Input value={form.school} onChange={(e) => set("school", e.target.value)}
                      placeholder="Szkoła / liceum *" className={`rounded-xl ${errors.school ? "border-red-400" : ""}`} />
                    {errors.school && <p className="text-red-500 text-xs mt-1">{errors.school}</p>}
                  </div>
                  <Input value={form.averageGrade} onChange={(e) => set("averageGrade", e.target.value)}
                    placeholder="Średnia ocen za ostatni rok szkolny, np. 5.17" className="rounded-xl" />
                  <Input value={form.gradeYear} onChange={(e) => set("gradeYear", e.target.value)}
                    placeholder="Klasa lub planowany rok matury (opcjonalnie)" className="rounded-xl" />
                  <Input value={form.targetCountry} onChange={(e) => set("targetCountry", e.target.value)}
                    placeholder="Docelowy kraj studiów (opcjonalnie)" className="rounded-xl" />
                  <div>
                    <Input value={form.field} onChange={(e) => set("field", e.target.value)}
                      placeholder="Co chcesz studiować? *" className={`rounded-xl ${errors.field ? "border-red-400" : ""}`} />
                    {errors.field && <p className="text-red-500 text-xs mt-1">{errors.field}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Mentor */}
              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
                  Uszereguj 3 mentorów w kolejności preferencji
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Dzięki temu łatwiej dopasujemy Ci osobę, która najlepiej odpowiada Twoim planom i stylowi pracy.
                </p>

                <div className="space-y-4">
                  {[
                    { key: "firstMentor", label: "1. wybór *" },
                    { key: "secondMentor", label: "2. wybór *" },
                    { key: "thirdMentor", label: "3. wybór *" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label}</label>
                      <select
                        value={form[field.key as keyof typeof form] as string}
                        onChange={(e) => set(field.key, e.target.value)}
                        disabled={form.noMentorPreference}
                        className={`flex h-12 w-full rounded-xl border bg-white px-4 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors[field.key] ? "border-red-400" : "border-gray-200"} ${form.noMentorPreference ? "opacity-60" : ""}`}
                      >
                        <option value="">Wybierz mentora</option>
                        {MENTOR_NAMES.map((mentorName) => (
                          <option key={mentorName} value={mentorName}>
                            {mentorName}
                          </option>
                        ))}
                      </select>
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
                    <span>Nie mam preferencji co do mentora lub mentorki.</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                  {MENTORS.map((mentor) => (
                    <div key={mentor.name} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                        <GraduationCap size={16} />
                        <span>{mentor.name}</span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{mentor.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Achievements */}
              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">4</span>
                  Osiągnięcia i projekty
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Konkursy, nagrody, olimpiady lub publikacje *
                    </label>
                    <Textarea
                      value={form.achievements}
                      onChange={(e) => set("achievements", e.target.value)}
                      placeholder="Wymień swoje najważniejsze osiągnięcia — konkursy, nagrody, olimpiady, publikacje naukowe itp."
                      className={`rounded-xl min-h-[100px] resize-none ${errors.achievements ? "border-red-400" : ""}`}
                    />
                    {errors.achievements && <p className="text-red-500 text-xs mt-1">{errors.achievements}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Najciekawsze rzeczy, które udało Ci się stworzyć w wolnym czasie
                    </label>
                    <Textarea
                      value={form.projects}
                      onChange={(e) => set("projects", e.target.value)}
                      placeholder="Projekty, strony, aplikacje, inicjatywy, organizacje… Dodaj linki, jeśli możesz."
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
                  Dlaczego aplikujesz?
                </h2>
                <div>
                  <Textarea
                    value={form.motivation}
                    onChange={(e) => set("motivation", e.target.value)}
                    placeholder="Opowiedz nam o sobie, swoich marzeniach i o tym, dlaczego stypendium ACADEA mogłoby zmienić Twoją sytuację. *"
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
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>
                    Wyrażam zgodę na przetwarzanie moich danych osobowych zgodnie z{" "}
                    <Link href="/polityka-prywatnosci" className="font-semibold text-primary hover:underline">
                      polityką prywatności
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
                  <><Loader2 size={18} className="animate-spin mr-2" /> Wysyłanie…</>
                ) : (
                  <>Wyślij zgłoszenie <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </Button>
              <p className="text-center text-xs text-gray-400">
                Wypełnij formularz. Zgłoszenia rozpatrujemy z indywidualną uwagą dla każdej historii.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
