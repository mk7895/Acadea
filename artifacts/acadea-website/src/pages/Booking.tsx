import { useEffect, useMemo, useState } from "react";
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
  Globe2,
} from "lucide-react";
import { getApiBase } from "@/lib/api-base";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/TurnstileWidget";
import { TIMEZONE_COOKIE_NAME, getCookie, setLongLivedCookie } from "@/lib/cookies";
import { useCookieConsent } from "@/components/CookieConsent";

const API_BASE = getApiBase();
const DEFAULT_TIMEZONE = "Europe/Warsaw";
const TIMEZONE_OPTIONS = [
  { value: "Europe/Warsaw", label: "Polska" },
  { value: "Europe/London", label: "Wielka Brytania" },
  { value: "Europe/Paris", label: "Europa Zachodnia" },
  { value: "Europe/Berlin", label: "Niemcy" },
  { value: "Europe/Amsterdam", label: "Holandia" },
  { value: "Europe/Brussels", label: "Belgia" },
  { value: "Europe/Vienna", label: "Austria" },
  { value: "Europe/Madrid", label: "Hiszpania" },
  { value: "Europe/Rome", label: "Włochy" },
  { value: "Europe/Zurich", label: "Szwajcaria" },
  { value: "Europe/Stockholm", label: "Szwecja" },
  { value: "Europe/Copenhagen", label: "Dania" },
  { value: "Europe/Helsinki", label: "Finlandia" },
  { value: "Europe/Athens", label: "Grecja" },
  { value: "Europe/Istanbul", label: "Turcja" },
  { value: "Europe/Dublin", label: "Irlandia" },
  { value: "America/New_York", label: "USA Wschód" },
  { value: "America/Toronto", label: "Kanada Wschód" },
  { value: "America/Chicago", label: "USA Central" },
  { value: "America/Mexico_City", label: "Meksyk" },
  { value: "America/Denver", label: "USA Góry Skaliste" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Los_Angeles", label: "USA Zachód" },
  { value: "America/Vancouver", label: "Kanada Zachód" },
  { value: "America/Sao_Paulo", label: "Brazylia" },
  { value: "Asia/Dubai", label: "Zatoka Perska" },
  { value: "Asia/Jerusalem", label: "Izrael" },
  { value: "Asia/Riyadh", label: "Arabia Saudyjska" },
  { value: "Asia/Singapore", label: "Singapur" },
  { value: "Asia/Hong_Kong", label: "Hongkong" },
  { value: "Asia/Shanghai", label: "Chiny" },
  { value: "Asia/Tokyo", label: "Japonia" },
  { value: "Asia/Seoul", label: "Korea Południowa" },
  { value: "Asia/Kolkata", label: "Indie" },
  { value: "Australia/Sydney", label: "Australia" },
  { value: "Australia/Melbourne", label: "Australia Melbourne" },
  { value: "Australia/Perth", label: "Australia Perth" },
  { value: "Pacific/Auckland", label: "Nowa Zelandia" },
] as const;

type Slot = { start: string; end: string; label: string };

type DayGroup = {
  dateKey: string;
  label: string;
  slots: Slot[];
};

const TOPICS = [
  "Wybór uczelni i kierunku",
  "Program Stypendialny ACADEA",
  "Przygotowanie dokumentów",
  "Esej motywacyjny",
  "Wiza i zakwaterowanie",
  "Inne",
];

const steps = ["Termin", "Godzina", "Rezerwacja", "Potwierdzenie"];

function formatDayLabel(value: string, timezone: string) {
  return new Date(value).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  });
}

function formatDayKey(value: string, timezone: string) {
  return new Date(value).toLocaleDateString("pl-PL", { timeZone: timezone });
}

function formatTimeLabel(value: string, timezone: string) {
  return new Date(value).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

function buildDayGroups(slots: Slot[], timezone: string) {
  const grouped = new Map<string, DayGroup>();

  for (const slot of slots) {
    const dateKey = formatDayKey(slot.start, timezone);
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {
        dateKey,
        label: formatDayLabel(slot.start, timezone),
        slots: [],
      });
    }

    grouped.get(dateKey)!.slots.push({
      start: slot.start,
      end: slot.end,
      label: formatTimeLabel(slot.start, timezone),
    });
  }

  return Array.from(grouped.values());
}

function findTimezoneOption(value: string) {
  return TIMEZONE_OPTIONS.find((option) => option.value === value);
}

export default function Booking() {
  const { canUsePreferencesCookies } = useCookieConsent();
  const [step, setStep] = useState(0);
  const [rawSlots, setRawSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState("");
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: TOPICS[0], otherDetail: "" });
  const [consentChecked, setConsentChecked] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ start: string; calendarLink?: string } | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [timezone, setTimezone] = useState(() => {
    const saved = getCookie(TIMEZONE_COOKIE_NAME);
    return saved && findTimezoneOption(saved) ? saved : DEFAULT_TIMEZONE;
  });

  useEffect(() => {
    fetch(`${API_BASE}/booking/slots`)
      .then((r) => r.json())
      .then((data: { slots?: Slot[]; error?: string }) => {
        if (data.error) {
          setSlotsError(data.error);
          return;
        }
        setRawSlots(data.slots ?? []);
      })
      .catch(() => setSlotsError("Nie udało się pobrać terminów. Spróbuj ponownie."))
      .finally(() => setLoadingSlots(false));
  }, []);

  useEffect(() => {
    if (canUsePreferencesCookies) {
      setLongLivedCookie(TIMEZONE_COOKIE_NAME, timezone);
    }
  }, [canUsePreferencesCookies, timezone]);

  useEffect(() => {
    setSelectedDayKey(null);
    setSelectedSlotStart(null);
    if (step > 0 && step < 3) {
      setStep(0);
    }
  }, [timezone]);

  const days = useMemo(() => buildDayGroups(rawSlots, timezone), [rawSlots, timezone]);
  const selectedDay = useMemo(
    () => days.find((day) => day.dateKey === selectedDayKey) ?? null,
    [days, selectedDayKey],
  );
  const selectedSlot = useMemo(
    () => selectedDay?.slots.find((slot) => slot.start === selectedSlotStart) ?? null,
    [selectedDay, selectedSlotStart],
  );
  const validateForm = () => {
    const err: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) err.name = "Wpisz imię i nazwisko.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "Podaj poprawny adres e-mail.";
    if (!form.topic) err.topic = "Wybierz temat.";
    if (form.topic === "Inne" && !form.otherDetail.trim()) err.otherDetail = "Napisz, w czym możemy pomóc.";
    if (!consentChecked) err.consent = "Zaznacz zgodę, aby umówić spotkanie.";
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!selectedSlot) return;
    if (isTurnstileEnabled() && !turnstileToken) {
      setSubmitError("Potwierdź zabezpieczenie formularza przed rezerwacją.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const topicValue =
        form.topic === "Inne" && form.otherDetail.trim()
          ? `Inne — ${form.otherDetail.trim()}`
          : form.topic;
      const res = await fetch(`${API_BASE}/booking/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedSlot,
          ...form,
          topic: topicValue,
          consent: consentChecked,
          turnstileToken,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        start?: string;
        calendarLink?: string;
        error?: string;
      };
      if (!data.success) {
        setSubmitError(data.error ?? "Błąd. Spróbuj ponownie.");
        setTurnstileToken("");
        setTurnstileResetKey((value) => value + 1);
        return;
      }
      setConfirmed({ start: data.start ?? selectedSlot.start, calendarLink: data.calendarLink });
      setStep(3);
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

  const confirmedDate = confirmed
    ? new Date(confirmed.start).toLocaleString("pl-PL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timezone,
      })
    : "";

  return (
    <div className="min-h-screen bg-gray-50 pt-28 md:pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-5 uppercase tracking-widest">
            <Calendar size={13} />
            Bezpłatna konsultacja
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-3">
            Bezpłatna konsultacja
          </h1>
          <p className="text-gray-500 text-lg">
            Wybierz termin, a nasz doradca skontaktuje się z Tobą.
          </p>
        </motion.div>

        {step < 3 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-base font-semibold text-primary">
                <Globe2 size={18} />
                <span>Wybierz strefę czasową</span>
              </div>
              <div className="w-full md:w-[360px]">
                <select
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="flex h-11 w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

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

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
        >
          <AnimatePresence mode="wait">
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
                {slotsError && <div className="text-red-500 text-center py-8">{slotsError}</div>}
                {!loadingSlots && !slotsError && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {days.slice(0, 14).map((day) => (
                      <button
                        key={day.dateKey}
                        onClick={() => {
                          setSelectedDayKey(day.dateKey);
                          setSelectedSlotStart(null);
                          setStep(1);
                        }}
                        className={`text-left p-4 rounded-xl border-2 transition-all hover:border-primary hover:bg-primary/4 ${
                          selectedDayKey === day.dateKey ? "border-primary bg-primary/6" : "border-gray-100"
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
                      onClick={() => {
                        setSelectedSlotStart(slot.start);
                        setStep(2);
                      }}
                      className={`py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all hover:border-primary hover:bg-primary/4 ${
                        selectedSlotStart === slot.start
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

            {step === 2 && selectedSlot && selectedDay && (
              <div>
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary mb-6 transition-colors">
                  <ArrowLeft size={15} /> Zmień godzinę
                </button>

                <div className="flex items-center gap-3 bg-primary/6 rounded-xl px-4 py-3 mb-6">
                  <Calendar size={18} className="text-primary shrink-0" />
                  <span className="text-sm font-semibold text-primary capitalize">
                    {selectedDay.label} · {selectedSlot.label}
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

                  {form.topic === "Inne" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Napisz, w czym możemy pomóc *
                      </label>
                      <Textarea
                        value={form.otherDetail}
                        onChange={(e) => setForm({ ...form, otherDetail: e.target.value })}
                        placeholder="Opisz krótko, czego dotyczy konsultacja…"
                        rows={3}
                        className={`rounded-xl ${formErrors.otherDetail ? "border-red-400" : ""}`}
                      />
                      {formErrors.otherDetail && <p className="text-red-500 text-xs mt-1">{formErrors.otherDetail}</p>}
                    </div>
                  )}

                  <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentChecked}
                        onChange={(e) => setConsentChecked(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary cursor-pointer"
                      />
                      <span className="text-xs text-gray-500 leading-relaxed">
                        Umawiając spotkanie, zgadzam się na otrzymywanie informacji handlowych od Fundacji
                        Acadea. Nigdy nie przekażemy Twoich danych dalej, zawsze możesz się wypisać.
                      </span>
                    </label>
                    {formErrors.consent && <p className="text-red-500 text-xs mt-1">{formErrors.consent}</p>}
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
                    {isTurnstileEnabled() ? (
                      <p className="text-xs text-gray-400">
                        Szybkie potwierdzenie antybotowe przed wysłaniem rezerwacji.
                      </p>
                    ) : null}
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full h-14 rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-base mt-2"
                  >
                    {submitting ? (
                      <><Loader2 size={18} className="animate-spin mr-2" /> Umawianie…</>
                    ) : (
                      <>Umów spotkanie <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>
                  <p className="text-center text-xs text-gray-400">
                    Otrzymasz potwierdzenie na podany adres e-mail.
                  </p>
                </div>
              </div>
            )}

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
                  Link do spotkania znajdziesz w zaproszeniu kalendarzowym.
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
