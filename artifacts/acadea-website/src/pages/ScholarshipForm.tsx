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
  Star,
  GraduationCap,
} from "lucide-react";
import { Link } from "wouter";
import { getApiBase } from "@/lib/api-base";

const API_BASE = getApiBase();

const MENTORS = [
  "Nikodem Ciomcia",
  "Krzysiek Sosnowski",
  "Gosia Słowikowska",
  "Mikołaj Błaszczyk",
  "Marlena Sołtysińska",
  "Mateusz Klepacki",
  "Amelia Kudasik",
  "Oskar Krawczyk",
  "Nie mam preferencji",
];

export default function ScholarshipForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    school: "",
    gradeYear: "",
    targetCountry: "",
    field: "",
    mentor: "",
    achievements: "",
    projects: "",
    motivation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Podaj imię i nazwisko.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Podaj poprawny e-mail.";
    if (!form.school.trim()) e.school = "Podaj nazwę szkoły lub liceum.";
    if (!form.field.trim()) e.field = "Napisz, co chcesz studiować.";
    if (!form.mentor) e.mentor = "Wybierz mentora (lub „Nie mam preferencji”).";
    if (!form.achievements.trim() || form.achievements.trim().length < 10) e.achievements = "Opisz swoje osiągnięcia (min. 10 znaków).";
    if (!form.motivation.trim() || form.motivation.trim().length < 20) e.motivation = "Napisz kilka zdań o sobie (min. 20 znaków).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
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
            form.gradeYear ? `Klasa / rok ukończenia: ${form.gradeYear}` : null,
            form.targetCountry ? `Docelowy kraj studiów: ${form.targetCountry}` : null,
            `Kierunek / dziedzina: ${form.field}`,
            `Preferowany mentor: ${form.mentor}`,
            `Osiągnięcia (konkursy, nagrody, olimpiady, publikacje): ${form.achievements}`,
            form.projects ? `Projekty stworzone w wolnym czasie: ${form.projects}` : null,
            `Motywacja: ${form.motivation}`,
          ]
            .filter(Boolean)
            .join("\n"),
          type: "scholarship",
        }),
      });
      const data = (await res.json()) as { id?: number; error?: string };
      if (!data.id) {
        setSubmitError(data.error ?? "Błąd. Spróbuj ponownie.");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Błąd sieci. Sprawdź połączenie i spróbuj ponownie.");
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
            Wypełnij formularz, a my zapoznamy się z Twoją historią. Nabór trwa do <strong className="text-primary">20 czerwca 2026</strong>.
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
                Dziękujemy, <strong>{form.name.split(" ")[0]}</strong>! Każde zgłoszenie rozpatrujemy indywidualnie i odezwiemy się do Ciebie po zakończeniu naboru.
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
                  Z którym mentorem chcesz pracować? *
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MENTORS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set("mentor", m)}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-2.5 ${
                        form.mentor === m
                          ? "border-primary bg-primary/6"
                          : "border-gray-100 hover:border-primary/30"
                      }`}
                    >
                      <span className={`shrink-0 ${form.mentor === m ? "text-primary" : "text-gray-300"}`}>
                        {m === "Nie mam preferencji" ? <Star size={16} /> : <GraduationCap size={16} />}
                      </span>
                      <span className={`font-semibold text-sm ${form.mentor === m ? "text-primary" : "text-gray-700"}`}>{m}</span>
                    </button>
                  ))}
                </div>
                {errors.mentor && <p className="text-red-500 text-xs mt-2">{errors.mentor}</p>}
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

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                  {submitError}
                </div>
              )}

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
                Każde zgłoszenie rozpatrujemy indywidualnie, z pełnym szacunkiem dla Twojej historii.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
