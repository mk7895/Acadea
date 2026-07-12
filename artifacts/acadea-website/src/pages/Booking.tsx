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
import { DEFAULT_TIMEZONE, TIMEZONE_OPTIONS } from "@/lib/timezones";
import { useCookieConsent } from "@/components/CookieConsent";
import {
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebPageSchema,
  useSeo,
} from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

const API_BASE = getApiBase();
type Slot = { start: string; end: string; label: string };
type MentorOption = { email: string; fullName: string };

type DayGroup = {
  dateKey: string;
  label: string;
  slots: Slot[];
};

const TOPICS = [
  "Wybór uczelni i kierunku",
  "Przygotowanie dokumentów",
  "Esej motywacyjny",
  "Formalności po przyjęciu i zakwaterowanie",
  "Inne",
];

const steps = ["Termin", "Godzina", "Rezerwacja", "Potwierdzenie"];
const stepsEn = ["Date", "Time", "Details", "Confirmation"];

const topicLabelsEn: Record<string, string> = {
  "Wybór uczelni i kierunku": "University and course choice",
  "Przygotowanie dokumentów": "Document preparation",
  "Esej motywacyjny": "Personal statement / essay",
  "Formalności po przyjęciu i zakwaterowanie": "Post-offer formalities and accommodation",
  "Inne": "Other",
};

const timezoneLabelsEn: Record<string, string> = {
  "Polska": "Poland",
  "Wielka Brytania": "United Kingdom",
  "Europa Zachodnia": "Western Europe",
  "Niemcy": "Germany",
  "Holandia": "Netherlands",
  "Belgia": "Belgium",
  "Austria": "Austria",
  "Hiszpania": "Spain",
  "Włochy": "Italy",
  "Szwajcaria": "Switzerland",
  "Szwecja": "Sweden",
  "Dania": "Denmark",
  "Finlandia": "Finland",
  "Grecja": "Greece",
  "Turcja": "Turkey",
  "Irlandia": "Ireland",
  "USA Wschód": "US East",
  "Kanada Wschód": "Canada East",
  "USA Central": "US Central",
  "Meksyk": "Mexico",
  "Arizona": "Arizona",
  "USA Góry Skaliste": "US Mountain",
  "USA Zachód": "US West",
  "Kanada Zachód": "Canada West",
  "Brazylia": "Brazil",
  "Zatoka Perska": "Gulf Region",
  "Izrael": "Israel",
  "Arabia Saudyjska": "Saudi Arabia",
  "Singapur": "Singapore",
  "Hongkong": "Hong Kong",
  "Chiny": "China",
  "Japonia": "Japan",
  "Korea Południowa": "South Korea",
  "Indie": "India",
  "Australia": "Australia",
  "Australia Melbourne": "Australia Melbourne",
  "Australia Perth": "Australia Perth",
  "Nowa Zelandia": "New Zealand",
};

function formatDayLabel(value: string, timezone: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  });
}

function formatDayKey(value: string, timezone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: timezone,
    })
      .formatToParts(new Date(value))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatTimeLabel(value: string, timezone: string, locale: string) {
  return new Date(value).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

function buildDayGroups(slots: Slot[], timezone: string, locale: string) {
  const grouped = new Map<string, DayGroup>();

  for (const slot of slots) {
    const dateKey = formatDayKey(slot.start, timezone);
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {
        dateKey,
        label: formatDayLabel(slot.start, timezone, locale),
        slots: [],
      });
    }

    grouped.get(dateKey)!.slots.push({
      start: slot.start,
      end: slot.end,
      label: formatTimeLabel(slot.start, timezone, locale),
    });
  }

  return Array.from(grouped.values());
}

function findTimezoneOption(value: string) {
  return TIMEZONE_OPTIONS.find((option) => option.value === value);
}

export default function Booking() {
  const { language, isEnglish, localizePath, t } = useLanguage();
  const locale = isEnglish ? "en-GB" : "pl-PL";
  useSeo({
    title: t("Umów bezpłatną konsultację | ACADEA", "Book a free consultation | ACADEA"),
    description: t(
      "Wybierz termin i umów bezpłatną konsultację z ACADEA dotyczącą studiów za granicą, wyboru uczelni i planu aplikacji.",
      "Choose a time and book a free ACADEA consultation about studying abroad, university choice and your application plan.",
    ),
    path: localizePath("/umow-spotkanie"),
    keywords: isEnglish ? ["book consultation", "free ACADEA consultation", "study abroad meeting"] : ["umów konsultację", "bezpłatna konsultacja ACADEA", "spotkanie studia za granicą"],
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebPageSchema({
        path: localizePath("/umow-spotkanie"),
        title: t("Umów bezpłatną konsultację | ACADEA", "Book a free consultation | ACADEA"),
        description: t(
          "Strona rezerwacji bezpłatnej konsultacji ACADEA dla kandydatów zainteresowanych studiami za granicą.",
          "Free ACADEA consultation booking page for candidates interested in studying abroad.",
        ),
      }),
      createBreadcrumbSchema([
        { name: t("Strona Główna", "Home"), path: localizePath("/") },
        { name: t("Umów spotkanie", "Book a consultation"), path: localizePath("/umow-spotkanie") },
      ]),
    ],
  });

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
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [selectedMentorEmail, setSelectedMentorEmail] = useState("");

  useEffect(() => {
    setLoadingSlots(true);
    setSlotsError("");
    const params = new URLSearchParams();
    if (selectedMentorEmail) {
      params.set("mentorEmail", selectedMentorEmail);
    }
    fetch(`${API_BASE}/booking/slots${params.toString() ? `?${params.toString()}` : ""}`)
      .then((r) => r.json())
      .then((data: {
        slots?: Slot[];
        mentors?: MentorOption[];
        selectedMentorEmail?: string | null;
        error?: string;
      }) => {
        if (data.error) {
          setSlotsError(data.error);
          return;
        }
        setSlotsError("");
        setRawSlots(data.slots ?? []);
        const nextMentors = Array.isArray(data.mentors) ? data.mentors : [];
        setMentors(nextMentors);
        setSelectedMentorEmail((current) => {
          if (data.selectedMentorEmail) {
            return data.selectedMentorEmail;
          }
          if (current && nextMentors.some((mentor) => mentor.email === current)) {
            return current;
          }
          return nextMentors[0]?.email ?? "";
        });
      })
      .catch(() => setSlotsError(t("Nie udało się pobrać terminów. Spróbuj ponownie.", "Could not load available times. Please try again.")))
      .finally(() => setLoadingSlots(false));
  }, [selectedMentorEmail, t]);

  useEffect(() => {
    if (canUsePreferencesCookies) {
      setLongLivedCookie(TIMEZONE_COOKIE_NAME, timezone);
    }
  }, [canUsePreferencesCookies, timezone]);

  useEffect(() => {
    const resetBooking = () => {
      setStep(0);
      setSelectedDayKey(null);
      setSelectedSlotStart(null);
      setSubmitError("");
      setFormErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("acadea:booking-reset", resetBooking);
    return () => window.removeEventListener("acadea:booking-reset", resetBooking);
  }, []);

  useEffect(() => {
    setSelectedDayKey(null);
    setSelectedSlotStart(null);
    if (step > 0 && step < 3) {
      setStep(0);
    }
  }, [timezone, selectedMentorEmail]);

  const days = useMemo(() => buildDayGroups(rawSlots, timezone, locale), [rawSlots, timezone, locale]);
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
    if (!form.name.trim() || form.name.trim().length < 2) err.name = t("Wpisz imię i nazwisko.", "Enter your full name.");
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = t("Podaj poprawny adres e-mail.", "Enter a valid email address.");
    if (!form.topic) err.topic = t("Wybierz temat.", "Choose a topic.");
    if (form.topic === "Inne" && !form.otherDetail.trim()) err.otherDetail = t("Napisz, w czym możemy pomóc.", "Tell us how we can help.");
    if (!consentChecked) err.consent = t("Zaznacz zgodę, aby umówić spotkanie.", "Tick the consent box to book the meeting.");
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!selectedSlot) return;
    if (isTurnstileEnabled() && !turnstileToken) {
      setSubmitError(t("Potwierdź zabezpieczenie formularza przed rezerwacją.", "Complete the form security check before booking."));
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const topicValue =
        form.topic === "Inne" && form.otherDetail.trim()
          ? `${isEnglish ? "Other" : "Inne"} — ${form.otherDetail.trim()}`
          : isEnglish
            ? (topicLabelsEn[form.topic] ?? form.topic)
            : form.topic;
      const res = await fetch(`${API_BASE}/booking/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedSlot,
          ...form,
          topic: topicValue,
          mentorEmail: selectedMentorEmail || undefined,
          consent: consentChecked,
          language,
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
        setSubmitError(data.error ?? t("Błąd. Spróbuj ponownie.", "Something went wrong. Please try again."));
        setTurnstileToken("");
        setTurnstileResetKey((value) => value + 1);
        return;
      }
      setConfirmed({ start: data.start ?? selectedSlot.start, calendarLink: data.calendarLink });
      setStep(3);
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

  const confirmedDate = confirmed
    ? new Date(confirmed.start).toLocaleString(locale, {
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
            {t("Pierwsza rozmowa jest bezpłatna", "The first conversation is free")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-3">
            {t("Umów konsultację", "Book a consultation")}
          </h1>
          <p className="text-gray-500 text-lg">
            {t("Wybierz termin, a nasz doradca skontaktuje się z Tobą.", "Choose a time and our adviser will contact you.")}
          </p>
        </motion.div>

        {step < 3 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-2 text-base font-semibold text-primary">
                  <Globe2 size={18} />
                  <span>{t("Wybierz strefę czasową", "Choose your time zone")}</span>
                </div>
                <select
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="flex h-11 w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {isEnglish ? timezoneLabelsEn[option.label] ?? option.label : option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2 text-base font-semibold text-primary">
                  <User size={18} />
                  <span>{t("Wybierz mentora", "Choose a mentor")}</span>
                </div>
                <select
                  value={selectedMentorEmail}
                  onChange={(event) => setSelectedMentorEmail(event.target.value)}
                  className="flex h-11 w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {mentors.length ? (
                    mentors.map((mentor) => (
                      <option key={mentor.email} value={mentor.email}>
                        {mentor.fullName}
                      </option>
                    ))
                  ) : (
                    <option value="">{t("Brak mentorów do wyboru", "No mentors available")}</option>
                  )}
                </select>
              </div>
            </div>
          </div>
        )}

        {step < 3 && (
          <div className="flex items-center justify-center gap-2 mb-10">
            {(isEnglish ? stepsEn : steps).slice(0, 3).map((s, i) => (
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
                  <Calendar size={20} /> {t("Wybierz dzień", "Choose a day")}
                </h2>
                {loadingSlots && (
                  <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
                    <Loader2 size={24} className="animate-spin" />
                    {t("Ładowanie dostępnych terminów…", "Loading available times...")}
                  </div>
                )}
                {slotsError && <div className="text-red-500 text-center py-8">{slotsError}</div>}
                {!loadingSlots && !slotsError && (
                  <div className="space-y-5">
                    {!days.length ? (
                      <div className="text-gray-400 text-center py-6">
                        {t("Na najbliższe dni nie ma już wolnych terminów.", "There are no free times available in the next few days.")}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {days.map((day) => (
                          <button
                            key={day.dateKey}
                            onClick={() => {
                              setSelectedDayKey(day.dateKey);
                              setSelectedSlotStart(null);
                              setStep(1);
                            }}
                            className="w-full rounded-2xl border-2 border-gray-100 px-5 py-4 text-left transition-all hover:border-primary hover:bg-primary/4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="font-semibold text-primary capitalize">{day.label}</div>
                                <div className="mt-1 text-sm text-gray-400">
                                  {day.slots.length} {isEnglish ? (day.slots.length === 1 ? "slot" : "slots") : day.slots.length === 1 ? "termin" : day.slots.length < 5 ? "terminy" : "terminów"}
                                </div>
                              </div>
                              <ArrowRight size={18} className="shrink-0 text-primary" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 1 && selectedDay && (
              <div>
                <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary mb-6 transition-colors">
                  <ArrowLeft size={15} /> {t("Zmień dzień", "Change day")}
                </button>
                <h2 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                  <Clock size={20} /> {t("Wybierz godzinę", "Choose a time")}
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
                  <ArrowLeft size={15} /> {t("Zmień godzinę", "Change time")}
                </button>

                <div className="flex items-center gap-3 bg-primary/6 rounded-xl px-4 py-3 mb-6">
                  <Calendar size={18} className="text-primary shrink-0" />
                  <span className="text-sm font-semibold text-primary capitalize">
                    {selectedDay.label} · {selectedSlot.label}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <User size={20} /> {t("Twoje dane", "Your details")}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><User size={14} /> {t("Imię i nazwisko", "Full name")} *</span>
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
                      <span className="flex items-center gap-1.5"><Phone size={14} /> {t("Telefon (opcjonalnie)", "Phone (optional)")}</span>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("Temat konsultacji", "Consultation topic")} *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TOPICS.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => setForm({ ...form, topic })}
                          className={`text-left px-3 py-2.5 rounded-xl text-sm border-2 transition-all ${
                            form.topic === topic
                              ? "border-primary bg-primary/6 text-primary font-semibold"
                              : "border-gray-100 text-gray-600 hover:border-primary/40"
                          }`}
                        >
                          {isEnglish ? topicLabelsEn[topic] : topic}
                        </button>
                      ))}
                    </div>
                    {formErrors.topic && <p className="text-red-500 text-xs mt-1">{formErrors.topic}</p>}
                  </div>

                  {form.topic === "Inne" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        {t("Napisz, w czym możemy pomóc", "Tell us how we can help")} *
                      </label>
                      <Textarea
                        value={form.otherDetail}
                        onChange={(e) => setForm({ ...form, otherDetail: e.target.value })}
                        placeholder={t("Opisz krótko, czego dotyczy konsultacja…", "Briefly describe what you would like to discuss...")}
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
                        {t(
                          "Umawiając spotkanie, zgadzam się na otrzymywanie informacji handlowych od Fundacji Acadea. Nigdy nie przekażemy Twoich danych dalej, zawsze możesz się wypisać.",
                          "By booking a meeting, I agree to receive commercial information from Fundacja Acadea. We will never pass your data on and you can unsubscribe at any time.",
                        )}
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
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full h-14 rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-base mt-2"
                  >
                    {submitting ? (
                      <><Loader2 size={18} className="animate-spin mr-2" /> {t("Umawianie…", "Booking...")}</>
                    ) : (
                      <>{t("Umów spotkanie", "Book a meeting")} <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>
                  <p className="text-center text-xs text-gray-400">
                    {t("Otrzymasz potwierdzenie na podany adres e-mail.", "You will receive a confirmation at the email address provided.")}
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-primary mb-2">{t("Spotkanie zarezerwowane!", "Meeting booked!")}</h2>
                <p className="text-gray-500 mb-6">
                  {t("Cześć", "Hi")} <strong>{form.name.split(" ")[0]}</strong>! {t("Zarezerwowano spotkanie na:", "Your meeting is booked for:")}
                </p>
                <div className="bg-primary/6 rounded-2xl px-6 py-4 mb-6 inline-block">
                  <p className="font-bold text-primary capitalize text-lg">{confirmedDate}</p>
                  <p className="text-sm text-gray-500 mt-1">{t("Konsultacja z doradcą ACADEA", "Consultation with an ACADEA adviser")}</p>
                </div>
                <p className="text-sm text-gray-400 mb-8">
                  {t("Potwierdzenie zostało wysłane na", "The confirmation has been sent to")} <strong>{form.email}</strong>.<br />
                  {t("Link do spotkania znajdziesz w zaproszeniu kalendarzowym.", "You will find the meeting link in the calendar invitation.")}
                </p>
                {confirmed?.calendarLink && (
                  <a
                    href={confirmed.calendarLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white border-2 border-primary text-primary font-semibold px-6 py-3 rounded-full hover:bg-primary hover:text-white transition-all text-sm"
                  >
                    <Calendar size={16} /> {t("Otwórz w Google Calendar", "Open in Google Calendar")}
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {step < 3 && (
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-400">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("acadea:booking-reset"))}
              className="flex items-center gap-2 transition-colors hover:text-primary"
            >
              <CheckCircle2 size={14} className="text-primary" /> {t("Bezpłatna konsultacja", "Free consultation")}
            </button>
            {["Zoom", t("Bez zobowiązań", "No obligation")].map((item) => (
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
