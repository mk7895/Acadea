import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Globe,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
  Users,
  ShieldCheck,
  Wallet,
  Compass,
  PhoneCall,
} from "lucide-react";
import QRCode from "react-qr-code";
import { Link } from "wouter";
import { GlobeSection } from "@/components/GlobeSection";

const services = [
  {
    title: "Doradztwo uczelni",
    desc: "Pomożemy wybrać uczelnię dopasowaną do Twoich celów, predyspozycji i budżetu.",
    icon: <GraduationCap size={22} className="text-primary" />,
  },
  {
    title: "Egzaminy i certyfikaty",
    desc: "Przygotowujemy do GRE, SAT, GMAT, Cambridge, IELTS, TOEFL i innych egzaminów wymaganych przez zagraniczne uczelnie.",
    icon: <BookOpen size={22} className="text-primary" />,
  },
  {
    title: "Przygotowanie dokumentów",
    desc: "Wspieramy przy każdym etapie aplikacji — od transkryptów po referencje.",
    icon: <CheckCircle2 size={22} className="text-primary" />,
  },
  {
    title: "Eseje, listy motywacyjne i CV",
    desc: "Nieograniczona liczba wersji i stała informacja zwrotna — Twoje dokumenty w najlepszej możliwej formie.",
    icon: <Users size={22} className="text-primary" />,
  },
  {
    title: "Tłumaczenia i legalizacja",
    desc: "Prowadzimy za rękę przez wszystkie formalności, żebyś Ty mógł skupić się na nauce.",
    icon: <Globe size={22} className="text-primary" />,
  },
  {
    title: "Wizy i zakwaterowanie",
    desc: "Nie znikamy po przyjęciu — pomagamy z wizami, zakwaterowaniem i ułatwiamy kontakt z uczelnią.",
    icon: <MapPin size={22} className="text-primary" />,
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const mentors = [
  {
    name: "Marlena Sołtysińska",
    initials: "MS",
    lines: [
      "Education and Technology · University College London (UCL) · Wielka Brytania",
      "Business and Finance · New York University (NYU) · USA, Chiny, ZEA, Włochy",
    ],
    quote: "Mentoruję w ACADEA, bo sama przeszłam przez ten proces i wiem, ile może zmienić jedna dobra rozmowa z kimś, kto już tam był.",
  },
  {
    name: "Mateusz Klepacki",
    initials: "MK",
    lines: [
      "Econometrics and Mathematical Economics · London School of Economics and Political Science (LSE) · Wielka Brytania",
      "Ekonomia, Biznes i Finanse · New York University (NYU) · USA, Chiny, ZEA, Włochy",
    ],
    quote: "Najbardziej cenię chwilę, gdy kandydat dostaje list przyjęcia. Wiem wtedy, że nasza praca naprawdę coś zmieniła.",
  },
];

export default function Home() {
  return (
    <div className="w-full">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-x-hidden bg-white pt-28 md:pt-36 pb-10 md:pb-14">
        {/* Background accent shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-primary/6" />
          <div className="absolute bottom-0 left-1/2 w-[500px] h-[500px] rounded-full bg-accent/8 -translate-x-1/2 translate-y-1/3" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 lg:gap-20 items-center">

            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/12 text-accent border border-accent/25 text-xs font-semibold mb-8 uppercase tracking-widest">
                <Globe size={13} />
                <span>Edukacja bez granic</span>
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold text-gray-900 leading-[1.05] tracking-tight mb-6">
                Twoje miejsce<br />
                na <span className="text-primary">światowej</span><br />
                uczelni czeka.
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
                Pomagamy dostać się na wymarzone uczelnie na całym świecie. 
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10 md:mb-14">
                <Link href="/umow-spotkanie">
                  <Button
                    size="lg"
                    data-testid="button-hero-cta-primary"
                    className="h-14 px-8 text-base rounded-full bg-primary text-white hover:bg-primary/90 font-bold border-none shadow-lg shadow-primary/20"
                  >
                    Umów bezpłatną konsultację
                  </Button>
                </Link>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap gap-6 items-center text-sm text-gray-400 pt-8">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  <span><strong className="text-gray-700 font-semibold">25+</strong> krajów w ofercie</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary" />
                  <span><strong className="text-gray-700 font-semibold">99%+</strong> skuteczność</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-accent fill-accent" />
                  <span><strong className="text-gray-700 font-semibold">0 zł</strong> dla stypendystów</span>
                </div>
              </div>
            </motion.div>

            {/* Right — interactive globe */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
              className="hidden lg:flex items-center justify-center"
            >
              <GlobeSection />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-6">W czym Ci pomożemy?</h2>
            <p className="text-lg text-gray-500">
              Aplikacja na studia to proces, który wymaga strategii. Przeprowadzimy Cię przez niego krok po kroku.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {services.map((service, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <div className="w-12 h-12 bg-primary/8 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{service.title}</h3>
                <p className="text-gray-500 leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SCHOLARSHIP ──────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-8">
                <Heart size={16} className="fill-accent" />
                <span>Program Stypendialny ACADEA</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6">
                Liczy się Twój <span className="text-accent">potencjał</span>,<br />
                nie budżet.
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-10">
                Wybitny potencjał nie powinien napotykać barier finansowych. Dlatego stworzyliśmy Program Stypendialny ACADEA — dla kandydatów, którym zależy, a potrzebują wsparcia.
              </p>
              <Link href="/stypendium/aplikacja">
                <Button
                  size="lg"
                  data-testid="button-scholarship-home"
                  className="h-13 px-8 text-base rounded-full bg-accent text-primary hover:bg-primary hover:text-white transition-all font-bold border-none"
                >
                  Aplikuj o stypendium <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 to-accent/10 border border-primary/10 min-h-[380px] flex flex-col justify-end p-10"
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent/10 blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary/8 blur-[60px]" />
              </div>
              <div className="relative z-10 mb-8 overflow-hidden rounded-[28px] border border-primary/10 bg-white/70 aspect-[4/3] shadow-[0_18px_40px_rgba(22,101,52,0.08)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,188,30,0.20),transparent_30%),linear-gradient(135deg,rgba(22,101,52,0.12),rgba(255,255,255,0.65))]" />
                <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
                    <GraduationCap size={32} className="text-primary" />
                  </div>
                  <p className="text-primary/55 text-xs uppercase tracking-[0.26em] font-semibold mb-3">
                    Placeholder zdjęcia
                  </p>
                  <p className="text-primary text-xl md:text-2xl font-bold leading-tight">
                    Miejsce na zdjęcie programu stypendialnego
                  </p>
                </div>
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <GraduationCap size={28} className="text-primary" />
                </div>
                <p className="text-primary/50 text-xs uppercase tracking-widest font-semibold mb-3">Program Stypendialny</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── DLA RODZICÓW ─────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-semibold mb-6">
                <Heart size={16} />
                <span>Dla rodziców</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-5">
                Rodzicu, jesteśmy tu również dla Ciebie
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Decyzja o studiach za granicą to ważny krok dla całej rodziny. Dbamy o to, żeby był przejrzysty, bezpieczny i dobrze zaplanowany — także z perspektywy rodzica.
              </p>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: ShieldCheck, title: "Pełna przejrzystość", desc: "Jasne zasady współpracy i stały wgląd w postępy — wiecie, za co płacicie i na jakim etapie jest aplikacja." },
              { icon: Wallet, title: "Świadome decyzje finansowe", desc: "Realnie pokazujemy koszty studiów, stypendia i opcje finansowania — bez ukrytych obietnic." },
              { icon: Compass, title: "Szczere doradztwo", desc: "Doradzamy najlepsze, a nie najdroższe rozwiązania. Mówimy wprost, jakie są realne szanse Waszego dziecka." },
              { icon: PhoneCall, title: "Kontakt na każdym etapie", desc: "Jesteśmy dostępni dla rodziców i odpowiadamy na pytania przez całą drogę — od pierwszej rozmowy po wyjazd." },
            ].map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm"
              >
                <div className="w-12 h-12 bg-primary/8 rounded-xl flex items-center justify-center mb-5">
                  <c.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-primary mb-2">{c.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/umow-spotkanie">
              <Button
                size="lg"
                data-testid="button-parents-cta"
                className="h-14 px-8 rounded-full bg-primary text-white hover:bg-primary/90 font-bold"
              >
                Umów rozmowę — również jako rodzic <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHATSAPP ─────────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2"
          >
            <div className="bg-orange-50 p-10 md:p-14 flex flex-col justify-center">
              <div className="w-14 h-14 bg-primary/12 rounded-2xl flex items-center justify-center mb-7">
                <MessageCircle size={30} className="text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-5">
                Darmowa społeczność WhatsApp — aktualności o studiach za granicą
              </h2>
              <p className="text-gray-800/70 text-lg leading-relaxed mb-8">
                Dołącz i otrzymuj bezpłatne porady, terminy aplikacji i aktualności — prosto na telefon.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "Terminy aplikacji i ważne daty rekrutacyjne",
                  "Aktualności o stypendiach i programach",
                  "Porady od absolwentów zagranicznych uczelni",
                  "Odpowiedzi na pytania od ekspertów ACADEA",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-900 text-sm">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="https://chat.whatsapp.com/Cg8sKNNvAFIKBfDjBLqWKl"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-whatsapp-join"
                className="inline-flex items-center gap-3 self-start bg-primary text-white font-bold px-8 py-4 rounded-full hover:bg-gray-900 transition-all text-base"
              >
                <MessageCircle size={20} />
                Dołącz do społeczności — to bezpłatne
              </a>
            </div>
            <div className="bg-primary p-10 md:p-14 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl p-6 shadow-xl"
              >
                <QRCode
                  value="https://chat.whatsapp.com/Cg8sKNNvAFIKBfDjBLqWKl"
                  size={200}
                  fgColor="#166534"
                  bgColor="#ffffff"
                  title="Kod QR do grupy WhatsApp ACADEA"
                  style={{ height: "auto", maxWidth: "100%", width: "200px" }}
                />
              </motion.div>
              <p className="text-white font-bold text-lg mt-7">Zeskanuj kod QR</p>
              <p className="text-white/70 text-sm mt-2 max-w-xs">
                Otwórz aparat i dołącz do społeczności ACADEA na WhatsApp.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── BECOME A MENTOR ──────────────────────────────────────────── */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-semibold mb-8">
                <Users size={16} />
                <span>Dołącz do zespołu</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6">
                Mentoruj z ACADEA
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-5">
                Studiujesz za granicą lub masz to już za sobą? Wiesz, jak wygląda aplikacja od środka? Pomóż kolejnym rocznikom polskich uczniów przejść tę drogę pewniej.
              </p>
              <p className="text-lg text-gray-500 leading-relaxed mb-10">
                Mentorzy ACADEA doradzają uczniom, recenzują eseje i dzielą się swoim doświadczeniem — w elastycznym modelu, dopasowanym do Twojego harmonogramu.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {[
                  { title: "Elastyczny czas", desc: "Mentorujesz tyle, ile chcesz — bez minimalnych zobowiązań" },
                  { title: "Sieć absolwentów", desc: "Dołącz do społeczności mentorów z najlepszych uczelni świata" },
                  { title: "Realny wpływ", desc: "Twoje doświadczenie zmienia czyjąś ścieżkę edukacyjną" },
                ].map((b, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <h4 className="font-bold text-primary text-sm mb-1">{b.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/mentoruj">
                <Button
                  size="lg"
                  data-testid="button-become-mentor"
                  className="h-14 px-8 rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-base"
                >
                  Aplikuj jako mentor(ka) <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4"
            >
              {mentors.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 * i }}
                  data-testid={`mentor-card-${i}`}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex gap-5"
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-base shrink-0">
                    {m.initials}
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm leading-relaxed italic mb-3">"{m.quote}"</p>
                    <p className="text-primary font-semibold text-sm">{m.name}</p>
                    {m.lines.map((line, j) => (
                      <p key={j} className="text-gray-400 text-xs leading-snug">{line}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 relative overflow-hidden bg-primary text-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-accent rounded-full blur-[120px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-white/10 rounded-full blur-[120px] opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Zacznijmy Twoją drogę.</h2>
            <p className="text-xl text-white/70 mb-10">
              Umów bezpłatną konsultację — bez zobowiązań. Wybierz termin i porozmawiaj z naszym doradcą.
            </p>
            <Link href="/umow-spotkanie">
              <Button size="lg" className="h-14 px-10 text-lg bg-accent text-primary hover:bg-white transition-colors border-none rounded-full font-bold shadow-lg shadow-accent/20">
                Wybierz termin <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
