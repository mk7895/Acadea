import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Slot = { start: string; end: string; label: string };

type DayGroup = {
  dateKey: string;
  label: string;
  slots: Slot[];
};

function groupByDay(slots: Slot[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const slot of slots) {
    const d = new Date(slot.start);
    const key = d.toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" });
    const label = d.toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Warsaw",
    });
    if (!map.has(key)) map.set(key, { dateKey: key, label, slots: [] });
    map.get(key)!.slots.push(slot);
  }
  return Array.from(map.values());
}

const TOPICS = [
  "Wybór uczelni i kierunku",
  "Program Stypendialny ACADEA",
  "Przygotowanie dokumentów",
  "Esej motywacyjny",
  "Wiza i zakwaterowanie",
  "Inne",
];

const steps = ["Termin", "Godzina", "Dane", "Potwierdzenie"];

export default function Booking() {
  const [step, setStep] = useState(0);
  const [days, setDays] = useState<DayGroup[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState("");

  const [selectedDay, setSelectedDay] = useState<DayGroup | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: TOPICS[0] });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ start: string; calendarLink?: string } | null>(null);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/booking/slots`)
      .then((r) => r.json())
      .then((data: { slots?: Slot[]; error?: string }) => {
        if (data.error) { setSlotsError(data.error); return; }
        setDays(groupByDay(data.slots ?? []));
      })
      .catch(() => setSlotsError("Nie udało się pobrać terminów. Spróbuj ponownie."))
      .finally(() => setLoadingSlots(false));
  }, []);

  const validateForm = () => {
    const err: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) err.name = "Wpisz imię i nazwisko.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "Podaj poprawny adres e-mail.";
    if (!form.topic) err.topic = "Wybierz temat.";
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!selectedSlot) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${BASE}/api/booking/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...selectedSlot, ...form }),
      });
      const data = await res.json() as { success?: boolean; start?: string; calendarLink?: string; error?: string };
      if (!data.success) { setSubmitError(data.error ?? "Błąd. Spróbuj ponownie."); return; }
      setConfirmed({ start: data.start ?? selectedSlot.start, calendarLink: data.calendarLink });
      setStep(3);
    } catch {
      setSubmitError("Błąd sieci. Sprawdź połączenie i spróbuj ponownie.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmedDate = confirmed
    ? new Date(confirmed.start).toLocaleString("pl-PL", {
        weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw",
      })
    : "";

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-5 uppercase tracking-widest">
            <Calendar size={13} />
            Bezpłatna konsultacja
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-3">
            Umów spotkanie
          </h1>
          <p className="text-gray-500 text-lg">
            Wybierz termin, a nasz doradca skontaktuje się z Tobą przez Zoom.
          </p>
        </motion.div>

        {/* Step progress */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-2 mb-10">
            {steps.slice(0, 3).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step ? "bg-primary text-white" : i === step ? "bg-primary text-white ring-4 ring-primary/20" : "bg-gray-200 text-gray-400"
                }`}>
                  {i < step ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${i === step ? "text-primary" : "text-gray-400"}`}>{s}</span>
                {i < 2 && <div className="w-8 sm:w-16 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
        >
          <AnimatePresence mode="wait">

            {/* ── STEP 0: Pick a day ─────────────────────────────────── */}
            {step === 0 && (
              <div>
                <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <Calendar size={20} /> Wybierz dzień
                </h2>
                {loadingSlots && (
                  <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
                    <Loader2 size={24} className="animate-spin" />
                    Ładowanie dostępnych terminów…
                  </div>
                )}
                {slotsError && (
                  <div className="text-red-500 text-center py-8">{slotsError}</div>
                )}
                {!loadingSlots && !slotsError && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {days.slice(0, 14).map((day) => (
                      <button
                        key={day.dateKey}
                        onClick={() => { setSelectedDay(day); setSelectedSlot(null); setStep(1); }}
                        className={`text-left p-4 rounded-xl border-2 transition-all hover:border-primary hover:bg-primary/4 ${
                          selectedDay?.dateKey === day.dateKey
                            ? "border-primary bg-primary/6"
                            : "border-gray-100"
                        }`}
                      >
                        <p className="font-semibold text-gray-800 capitalize text-sm">{day.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{day.slots.length} wolnych terminów</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 1: Pick a time ────────────────────────────────── */}
            {step === 1 && selectedDay && (
              <div>
                <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary mb-6 transition-colors">
                  <ArrowLeft size={15} /> Zmień dzień
                </button>
                <h2 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                  <Clock size={20} /> Wybierz godzinę
                </h2>
                <p className="text-sm text-gray-400 mb-6 capitalize">{selectedDay.label}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {selectedDay.slots.map((slot) => (
                    <button
                      key={slot.start}
                      onClick={() => { setSelectedSlot(slot); setStep(2); }}
                      className={`py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all hover:border-primary hover:bg-primary/4 ${
                        selectedSlot?.start === slot.start
                          ? "border-primary bg-primary/6 text-primary"
                          : "border-gray-100 text-gray-700"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 2: Fill details ───────────────────────────────── */}
            {step === 2 && selectedSlot && (
              <div>
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary mb-6 transition-colors">
                  <ArrowLeft size={15} /> Zmień godzinę
                </button>

                {/* Selected slot summary */}
                <div className="flex items-center gap-3 bg-primary/6 rounded-xl px-4 py-3 mb-6">
                  <Calendar size={18} className="text-primary shrink-0" />
                  <span className="text-sm font-semibold text-primary capitalize">
                    {selectedDay?.label} · {selectedSlot.label}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <User size={20} /> Twoje dane
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><User size={14} /> Imię i nazwisko *</span>
                    </label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jan Kowalski"
                      className={`rounded-xl ${formErrors.name ? "border-red-400" : ""}`}
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><Mail size={14} /> E-mail *</span>
                    </label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jan@example.com"
                      className={`rounded-xl ${formErrors.email ? "border-red-400" : ""}`}
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><Phone size={14} /> Telefon (opcjonalnie)</span>
                    </label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+48 600 000 000"
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Temat konsultacji *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TOPICS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm({ ...form, topic: t })}
                          className={`text-left px-3 py-2.5 rounded-xl text-sm border-2 transition-all ${
                            form.topic === t
                              ? "border-primary bg-primary/6 text-primary font-semibold"
                              : "border-gray-100 text-gray-600 hover:border-primary/40"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    {formErrors.topic && <p className="text-red-500 text-xs mt-1">{formErrors.topic}</p>}
                  </div>

                  {submitError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                      {submitError}
                    </div>
                  )}

                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full h-14 rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-base mt-2"
                  >
                    {submitting ? (
                      <><Loader2 size={18} className="animate-spin mr-2" /> Rezerwowanie…</>
                    ) : (
                      <>Zarezerwuj spotkanie <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>
                  <p className="text-center text-xs text-gray-400">
                    Otrzymasz potwierdzenie na podany adres e-mail.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 3: Confirmation ───────────────────────────────── */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-primary mb-2">Spotkanie zarezerwowane!</h2>
                <p className="text-gray-500 mb-6">
                  Cześć <strong>{form.name.split(" ")[0]}</strong>! Zarezerwowano spotkanie na:
                </p>
                <div className="bg-primary/6 rounded-2xl px-6 py-4 mb-6 inline-block">
                  <p className="font-bold text-primary capitalize text-lg">{confirmedDate}</p>
                  <p className="text-sm text-gray-500 mt-1">Konsultacja z doradcą ACADEA</p>
                </div>
                <p className="text-sm text-gray-400 mb-8">
                  Potwierdzenie zostało wysłane na <strong>{form.email}</strong>.<br />
                  Spotkanie odbędzie się przez Zoom — link znajdziesz w zaproszeniu.
                </p>
                {confirmed?.calendarLink && (
                  <a
                    href={confirmed.calendarLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white border-2 border-primary text-primary font-semibold px-6 py-3 rounded-full hover:bg-primary hover:text-white transition-all text-sm"
                  >
                    <Calendar size={16} /> Otwórz w Google Calendar
                  </a>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {/* Reassurance row */}
        {step < 3 && (
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-400">
            {["Bezpłatna konsultacja", "Zoom", "Bez zobowiązań"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-primary" /> {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
