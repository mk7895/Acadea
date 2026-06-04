import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
  Users,
} from "lucide-react";
import { Link } from "wouter";

const destinations = [
  { name: "Wielka Brytania", flag: "🇬🇧", uni: "Oxford · Imperial · LSE" },
  { name: "Holandia", flag: "🇳🇱", uni: "TU Delft · Leiden · UvA" },
  { name: "Niemcy", flag: "🇩🇪", uni: "TU Munich · HU Berlin" },
  { name: "Irlandia", flag: "🇮🇪", uni: "UCD · Trinity College" },
  { name: "Francja", flag: "🇫🇷", uni: "Sciences Po · HEC Paris" },
  { name: "Szwajcaria", flag: "🇨🇭", uni: "ETH Zurich · EPFL" },
  { name: "Szwecja", flag: "🇸🇪", uni: "KTH · Lund University" },
  { name: "Dania", flag: "🇩🇰", uni: "DTU · Copenhagen Uni" },
];

const services = [
  {
    title: "Doradztwo uczelni",
    desc: "Pomożemy wybrać uczelnię dopasowaną do Twoich celów, predyspozycji i budżetu.",
    icon: <GraduationCap size={22} className="text-primary" />,
  },
  {
    title: "Przygotowanie dokumentów",
    desc: "Wspieramy przy każdym etapie aplikacji — od transkryptów po referencje.",
    icon: <CheckCircle2 size={22} className="text-primary" />,
  },
  {
    title: "Eseje i motywacje",
    desc: "Piszemy razem, żeby wyróżnić Cię spośród tysięcy kandydatów.",
    icon: <Users size={22} className="text-primary" />,
  },
  {
    title: "Tłumaczenia i legalizacja",
    desc: "Zajmujemy się formalnościami, żebyś Ty mógł skupić się na nauce.",
    icon: <Globe size={22} className="text-primary" />,
  },
  {
    title: "Wizy i zakwaterowanie",
    desc: "Nie zostawiamy Cię samego po przyjęciu. Pomożemy odnaleźć się w nowym kraju.",
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

export default function Home() {
  return (
    <div className="w-full">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-white pt-20">
        {/* Background accent shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-primary/6" />
          <div className="absolute bottom-0 left-1/2 w-[500px] h-[500px] rounded-full bg-accent/8 -translate-x-1/2 translate-y-1/3" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-8 uppercase tracking-widest">
                <Globe size={13} />
                <span>Edukacja bez granic</span>
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold text-gray-900 leading-[1.05] tracking-tight mb-6">
                Twoje miejsce<br />
                na <span className="text-primary">światowej</span><br />
                uczelni czeka.
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
                ACADEA to doradcy edukacyjni, którzy sami studiowali za granicą. Znamy ten proces od środka — i przeprowadzimy przez niego Ciebie.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-14">
                <Link href="/kontakt">
                  <Button
                    size="lg"
                    data-testid="button-hero-cta-primary"
                    className="h-14 px-8 text-base rounded-full bg-primary text-white hover:bg-primary/90 font-bold border-none shadow-lg shadow-primary/20"
                  >
                    Bezpłatna konsultacja
                  </Button>
                </Link>
                <Link href="/jak-to-dziala">
                  <Button
                    size="lg"
                    variant="outline"
                    data-testid="button-hero-cta-secondary"
                    className="h-14 px-8 text-base rounded-full border-gray-200 text-gray-700 hover:border-primary hover:text-primary font-medium"
                  >
                    Jak pomagamy?
                  </Button>
                </Link>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap gap-6 items-center text-sm text-gray-400 border-t border-gray-100 pt-8">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  <span><strong className="text-gray-700 font-semibold">15+</strong> krajów w ofercie</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary" />
                  <span><strong className="text-gray-700 font-semibold">95%+</strong> skuteczność</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  <span><strong className="text-gray-700 font-semibold">Setki</strong> studentów za granicą</span>
                </div>
              </div>
            </motion.div>

            {/* Right — destination cards grid */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
              className="grid grid-cols-2 gap-3"
            >
              {destinations.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
                  className={`rounded-2xl p-5 border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all cursor-default group ${
                    i === 0 ? "bg-primary text-white border-primary" : "bg-white"
                  }`}
                >
                  <span className="text-2xl mb-3 block">{d.flag}</span>
                  <h3 className={`font-bold text-sm mb-1 ${i === 0 ? "text-white" : "text-gray-900"}`}>
                    {d.name}
                  </h3>
                  <p className={`text-xs leading-relaxed ${i === 0 ? "text-white/70" : "text-gray-400"}`}>
                    {d.uni}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
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
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
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
                Korzystasz z naszych usług.<br />
                <span className="text-accent">Wspierasz czyjś sen.</span>
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-6">
                Wierzymy, że wykształcenie nie powinno być przywilejem. Dlatego każda osoba, która wybiera ACADEA, automatycznie przyczynia się do naszego funduszu stypendialnego.
              </p>
              <p className="text-lg text-gray-500 leading-relaxed mb-10">
                Część każdej opłaty trafia do uczniów o wybitnym potencjale, których nie stać na studia za granicą.
              </p>
              <Link href="/stypendium">
                <Button
                  size="lg"
                  data-testid="button-scholarship-home"
                  className="h-13 px-8 text-base rounded-full bg-accent text-primary hover:bg-primary hover:text-white transition-all font-bold border-none"
                >
                  Dowiedz się więcej <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative rounded-3xl overflow-hidden bg-primary min-h-[380px] flex flex-col justify-end p-10"
            >
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-[60px]" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mb-6">
                  <Heart size={28} className="text-accent" />
                </div>
                <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-3">Nasza misja</p>
                <p className="text-white text-2xl font-bold leading-snug">
                  Każda opłata za usługi ACADEA tworzy fundusz, który zmienia czyjeś życie.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHATSAPP ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2"
          >
            <div className="bg-[#075E54] p-10 md:p-14 flex flex-col justify-center">
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-7">
                <MessageCircle size={30} className="text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-5">
                Darmowa grupa WhatsApp — aktualności o studiach za granicą
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-8">
                Dołącz do naszej społeczności i otrzymuj bezpłatne porady, terminy aplikacji i aktualności — prosto na telefon.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "Terminy aplikacji i ważne daty rekrutacyjne",
                  "Aktualności o stypendiach i programach",
                  "Porady od absolwentów zagranicznych uczelni",
                  "Odpowiedzi na pytania od ekspertów ACADEA",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/90 text-sm">
                    <CheckCircle2 size={16} className="text-[#25D366] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="https://chat.whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-whatsapp-join"
                className="inline-flex items-center gap-3 self-start bg-[#25D366] text-white font-bold px-8 py-4 rounded-full hover:bg-white hover:text-[#075E54] transition-all text-base"
              >
                <MessageCircle size={20} />
                Dołącz do grupy — to bezpłatne
              </a>
            </div>
            <div className="bg-primary p-10 md:p-14 flex flex-col justify-center">
              <div className="space-y-6">
                {[
                  { num: "01", text: "Kliknij przycisk i wejdź do grupy" },
                  { num: "02", text: "Zaakceptuj zaproszenie w WhatsApp" },
                  { num: "03", text: "Otrzymuj aktualizacje — kiedy chcesz, możesz wyjść" },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-5"
                  >
                    <span className="text-4xl font-bold text-white/20 w-10 shrink-0">{step.num}</span>
                    <p className="text-white/90 text-lg font-medium">{step.text}</p>
                  </motion.div>
                ))}
                <p className="text-white/40 text-sm pt-4 border-t border-white/10">
                  Aktualnie ponad 200 uczniów i rodziców w grupie.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── BECOME A MENTOR ──────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
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
                Zostań mentorem ACADEA
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-5">
                Studiujesz lub skończyłeś studia za granicą? Wiesz, jak wygląda aplikacja od środka? Pomóż kolejnym rocznikom polskich uczniów przejść tę drogę pewniej.
              </p>
              <p className="text-lg text-gray-500 leading-relaxed mb-10">
                Mentorzy ACADEA doradzają uczniom, recenzują eseje i dzielą się swoim doświadczeniem — w elastycznym modelu, dopasowanym do Twojego harmonogramu.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {[
                  { title: "Elastyczny czas", desc: "Pracujesz kiedy chcesz" },
                  { title: "Realne wynagrodzenie", desc: "Płacimy za każdą sesję" },
                  { title: "Misja z sensem", desc: "Twoja wiedza zmienia przyszłość" },
                ].map((b, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <h4 className="font-bold text-primary text-sm mb-1">{b.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/kontakt">
                <Button
                  size="lg"
                  data-testid="button-become-mentor"
                  className="h-14 px-8 rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-base"
                >
                  Aplikuj jako mentor <ArrowRight className="ml-2 h-5 w-5" />
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
              {[
                { country: "Wielka Brytania", school: "University of Edinburgh", field: "Computer Science", quote: "Mentoruję w ACADEA, bo pamiętam jak bardzo brakowało mi kogoś, kto powiedział po prostu — dasz radę." },
                { country: "Holandia", school: "TU Delft", field: "Inżynieria Lądowa", quote: "Praca z uczniami ACADEA to najlepsza rzecz, jaką mogę zrobić z moją wiedzą o procesie aplikacji." },
                { country: "Niemcy", school: "TU Munich", field: "Mechatronika", quote: "Każda sesja mentoringowa to dla mnie przypomnienie, dlaczego sam podjąłem tę decyzję." },
              ].map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 * i }}
                  data-testid={`mentor-card-${i}`}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex gap-5"
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {m.country[0]}
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm leading-relaxed italic mb-3">"{m.quote}"</p>
                    <p className="text-primary font-semibold text-sm">{m.school}</p>
                    <p className="text-gray-400 text-xs">{m.field} · {m.country}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden bg-primary text-white">
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
              Umów się na bezpłatną konsultację. Opowiesz nam o swoich celach, a my powiemy Ci, jak je osiągnąć.
            </p>
            <Link href="/kontakt">
              <Button size="lg" className="h-14 px-10 text-lg bg-accent text-primary hover:bg-white transition-colors border-none rounded-full font-bold shadow-lg shadow-accent/20">
                Zarezerwuj spotkanie <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
