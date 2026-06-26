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

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const COUNTRIES = [
  "Wielka Brytania", "Holandia", "Niemcy", "Francja", "Szwajcaria",
  "Szwecja", "Dania", "USA", "Kanada", "Australia", "Singapur", "Japonia",
  "Korea Południowa", "Irlandia", "Belgia", "Austria", "Inne",
];

const ROLES = [
  { id: "paid", label: "Płatne sesje mentoringowe", icon: <Briefcase size={18} />, desc: "Chcę pracować z kandydatami i otrzymywać wynagrodzenie za sesje." },
  { id: "volunteer", label: "Wolontariat", icon: <Heart size={18} />, desc: "Chcę pomagać bezpłatnie — z pasji i chęci przekazania wiedzy." },
  { id: "both", label: "Jedno i drugie", icon: <CheckCircle2 size={18} />, desc: "Jestem otwarty/a na oba modele." },
];

type Role = "paid" | "volunteer" | "both" | "";

export default function MentorForm() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    university: "", country: "", field: "", graduationYear: "",
    role: "" as Role,
    hoursPerWeek: "", motivation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Podaj imię i nazwisko.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Podaj poprawny e-mail.";
    if (!form.university.trim()) e.university = "Podaj nazwę uczelni.";
    if (!form.country) e.country = "Wybierz kraj.";
    if (!form.field.trim()) e.field = "Podaj kierunek studiów.";
    if (!form.role) e.role = "Wybierz preferowany model współpracy.";
    if (!form.motivation.trim() || form.motivation.trim().length < 20) e.motivation = "Napisz kilka zdań o sobie (min. 20 znaków).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          message: [
            `Uczelnia: ${form.university} (${form.country})`,
            `Kierunek: ${form.field}`,
            form.graduationYear ? `Rok ukończenia: ${form.graduationYear}` : null,
            `Model: ${form.role}`,
            form.hoursPerWeek ? `Dostępność: ${form.hoursPerWeek} h/tydzień` : null,
            `Motywacja: ${form.motivation}`,
          ].filter(Boolean).join("\n"),
          type: "mentor_application",
        }),
      });
      const data = await res.json() as { id?: number; error?: string };
      if (!data.id) { setSubmitError(data.error ?? "Błąd. Spróbuj ponownie."); return; }
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-5 uppercase tracking-widest">
            <Users size={13} />
            Dołącz do zespołu
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-3">
            Mentoruj z ACADEA
          </h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            Studiujesz za granicą lub masz już dyplom zagranicznej uczelni? Pomóż kolejnym rocznikom — jako mentor płatny lub wolontariusz.
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { icon: <CheckCircle2 size={16} className="text-primary" />, text: "Elastyczny grafik" },
            { icon: <Users size={16} className="text-primary" />, text: "Realny wpływ" },
            { icon: <GraduationCap size={16} className="text-primary" />, text: "Praca lub wolontariat" },
          ].map((b) => (
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
              <h2 className="text-2xl font-bold text-primary mb-2">Aplikacja wysłana!</h2>
              <p className="text-gray-500 mb-8">
                Dziękujemy, <strong>{form.name.split(" ")[0]}</strong>! Skontaktujemy się z Tobą w ciągu kilku dni roboczych.
              </p>
              <Link href="/">
                <Button className="rounded-full bg-primary text-white hover:bg-primary/90 font-semibold px-8">
                  Wróć na stronę główną
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
              {/* Personal info */}
              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                  Twoje dane
                </h2>
                <div className="space-y-3">
                  <div>
                    <Input value={form.name} onChange={e => set("name", e.target.value)}
                      placeholder="Imię i nazwisko *" className={`rounded-xl ${errors.name ? "border-red-400" : ""}`} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                      placeholder="E-mail *" className={`rounded-xl ${errors.email ? "border-red-400" : ""}`} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <Input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                    placeholder="Telefon (opcjonalnie)" className="rounded-xl" />
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Academic background */}
              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                  Studia za granicą
                </h2>
                <div className="space-y-3">
                  <div>
                    <Input value={form.university} onChange={e => set("university", e.target.value)}
                      placeholder="Nazwa uczelni *" className={`rounded-xl ${errors.university ? "border-red-400" : ""}`} />
                    {errors.university && <p className="text-red-500 text-xs mt-1">{errors.university}</p>}
                  </div>
                  <div>
                    <select
                      value={form.country}
                      onChange={e => set("country", e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.country ? "border-red-400" : "border-input"}`}
                    >
                      <option value="">Kraj uczelni *</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                  </div>
                  <div>
                    <Input value={form.field} onChange={e => set("field", e.target.value)}
                      placeholder="Kierunek studiów *" className={`rounded-xl ${errors.field ? "border-red-400" : ""}`} />
                    {errors.field && <p className="text-red-500 text-xs mt-1">{errors.field}</p>}
                  </div>
                  <Input value={form.graduationYear} onChange={e => set("graduationYear", e.target.value)}
                    placeholder="Rok ukończenia lub planowany rok (opcjonalnie)" className="rounded-xl" />
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Role preference */}
              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
                  Model współpracy *
                </h2>
                <div className="space-y-2">
                  {ROLES.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => set("role", r.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                        form.role === r.id
                          ? "border-primary bg-primary/6"
                          : "border-gray-100 hover:border-primary/30"
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

              {/* Availability & motivation */}
              <div>
                <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">4</span>
                  Kilka słów o sobie
                </h2>
                <div className="space-y-3">
                  <Input value={form.hoursPerWeek} onChange={e => set("hoursPerWeek", e.target.value)}
                    placeholder="Ile godzin tygodniowo możesz poświęcić? (opcjonalnie)" className="rounded-xl" />
                  <div>
                    <Textarea
                      value={form.motivation}
                      onChange={e => set("motivation", e.target.value)}
                      placeholder="Dlaczego chcesz zostać mentorem ACADEA? Co możesz wnieść? *"
                      className={`rounded-xl min-h-[120px] resize-none ${errors.motivation ? "border-red-400" : ""}`}
                    />
                    {errors.motivation && <p className="text-red-500 text-xs mt-1">{errors.motivation}</p>}
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                  {submitError}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-14 rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-base"
              >
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin mr-2" /> Wysyłanie…</>
                ) : (
                  <>Wyślij aplikację <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </Button>
              <p className="text-center text-xs text-gray-400">
                Skontaktujemy się z Tobą w ciągu kilku dni roboczych.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
