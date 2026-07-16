import { Suspense, lazy } from "react";
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
import { Link } from "wouter";
import scholarshipHomePhoto from "@/assets/scholarship-home-photo.webp";
import {
  createBreadcrumbSchema,
  createFaqSchema,
  createLocalBusinessSchema,
  createSiteNavigationSchema,
  createOrganizationSchema,
  createWebPageSchema,
  createWebSiteSchema,
  useSeo,
} from "@/lib/seo";
import { HOME_FAQ_ITEMS_EN, HOME_FAQ_ITEMS_PL } from "@/data/home-faq";
import { ResponsiveQrCode } from "@/components/ResponsiveQrCode";
import { useLanguage } from "@/lib/i18n";

const GlobeSection = lazy(() =>
  import("@/components/GlobeSection").then((module) => ({ default: module.GlobeSection })),
);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Home() {
  const { isEnglish, localizePath, t } = useLanguage();

  const services = [
    {
      title: t("Doradztwo uczelni", "University advising"),
      desc: t(
        "Pomożemy wybrać uczelnię dopasowaną do Twoich celów, predyspozycji i budżetu.",
        "We help you choose a university suited to your goals, strengths and budget.",
      ),
      icon: <GraduationCap size={22} className="text-primary" />,
    },
    {
      title: t("Egzaminy i certyfikaty", "Exams and certificates"),
      desc: t(
        "Przygotowujemy do GRE, SAT, GMAT, Cambridge, IELTS, TOEFL i innych egzaminów wymaganych przez zagraniczne uczelnie.",
        "We prepare students for GRE, SAT, GMAT, Cambridge, IELTS, TOEFL and other exams required by foreign universities.",
      ),
      icon: <BookOpen size={22} className="text-primary" />,
    },
    {
      title: t("Przygotowanie dokumentów", "Document preparation"),
      desc: t(
        "Wspieramy przy każdym etapie aplikacji — od transkryptów po referencje.",
        "We support you at every stage of the application - from transcripts to references.",
      ),
      icon: <CheckCircle2 size={22} className="text-primary" />,
    },
    {
      title: t("Eseje, listy motywacyjne i CV", "Essays, motivation letters and CVs"),
      desc: t(
        "Nieograniczona liczba wersji i stała informacja zwrotna — Twoje dokumenty w najlepszej możliwej formie.",
        "An unlimited number of versions and steady feedback - your documents in the best possible form.",
      ),
      icon: <Users size={22} className="text-primary" />,
    },
    {
      title: t("Tłumaczenia i formalności dokumentowe", "Translations and document formalities"),
      desc: t(
        "Pomagamy uporządkować tłumaczenia, dokumenty i kolejne kroki formalne, żeby cały proces był bardziej przejrzysty.",
        "We help organise translations, documents and the next formal steps so that the whole process is clearer.",
      ),
      icon: <Globe size={22} className="text-primary" />,
    },
    {
      title: t("Formalności po przyjęciu i zakwaterowanie", "Post-offer formalities and accommodation"),
      desc: t(
        "Nie znikamy po przyjęciu — pomagamy odnaleźć się w kolejnych krokach po otrzymaniu oferty, organizacji zakwaterowania i kontakcie z uczelnią.",
        "We do not disappear after admission - we help you navigate the next steps after receiving an offer, arranging accommodation and staying in touch with the university.",
      ),
      icon: <MapPin size={22} className="text-primary" />,
    },
  ];

  const parentCards = [
    {
      icon: ShieldCheck,
      title: t("Pełna przejrzystość", "Full transparency"),
      desc: t(
        "Jasne zasady współpracy i stały wgląd w postępy — wiecie, za co płacicie i na jakim etapie jest aplikacja.",
        "Clear rules of cooperation and steady insight into progress - you know what you are paying for and what stage the application is at.",
      ),
    },
    {
      icon: Wallet,
      title: t("Świadome decyzje finansowe", "Informed financial decisions"),
      desc: t(
        "Realnie pokazujemy koszty studiów, stypendia i opcje finansowania — bez ukrytych obietnic.",
        "We show the real costs of studying, scholarships and funding options - without hidden promises.",
      ),
    },
    {
      icon: Compass,
      title: t("Szczere doradztwo", "Honest advice"),
      desc: t(
        "Doradzamy najlepsze, a nie najdroższe rozwiązania. Mówimy wprost, jakie są realne szanse Twojego dziecka.",
        "We advise on the best solutions, not the most expensive ones. We say plainly what your child's real chances are.",
      ),
    },
    {
      icon: PhoneCall,
      title: t("Kontakt na każdym etapie", "Support at every stage"),
      desc: t(
        "Jesteśmy dostępni dla rodziców i odpowiadamy na pytania przez całą drogę — od pierwszej rozmowy po wyjazd.",
        "We are available to parents and answer questions throughout the whole journey - from the first conversation to departure.",
      ),
    },
  ];

  const whatsappItems = [
    t(
      "Terminy aplikacji i ważne daty rekrutacyjne",
      "Application deadlines and important admissions dates",
    ),
    t("Aktualności o stypendiach i programach", "Updates on scholarships and programmes"),
    t(
      "Porady od absolwentów zagranicznych uczelni",
      "Advice from graduates of international universities",
    ),
    t("Odpowiedzi na pytania od ekspertów ACADEA", "Answers from ACADEA experts"),
  ];

  useSeo({
    title: t(
      "Studia za granicą i doradztwo aplikacyjne | ACADEA",
      "Study abroad guidance and university applications | ACADEA",
    ),
    description: t(
      "Pomagamy dostać się na studia za granicą. ACADEA wspiera w wyborze uczelni, dokumentach, esejach, egzaminach i planowaniu aplikacji.",
      "We help students get into universities abroad. ACADEA supports university choice, documents, essays, exams and application planning.",
    ),
    path: localizePath("/"),
    keywords: isEnglish
      ? [
          "study abroad guidance",
          "university applications abroad",
          "scholarships abroad",
          "application essays",
          "ACADEA",
        ]
      : [
          "studia za granicą",
          "doradztwo aplikacyjne",
          "wybór uczelni za granicą",
          "aplikacja na studia",
          "stypendia studia za granicą",
          "ACADEA",
        ],
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebSiteSchema(isEnglish ? "en-GB" : "pl-PL"),
      createWebPageSchema({
        path: localizePath("/"),
        title: t(
          "Studia za granicą i doradztwo aplikacyjne | ACADEA",
          "Study abroad guidance and university applications | ACADEA",
        ),
        description: t(
          "ACADEA pomaga w aplikacji na studia za granicą, wyborze uczelni, dokumentach, esejach, stypendiach i planowaniu całego procesu.",
          "ACADEA helps with applications to universities abroad, university choice, documents, essays, scholarships and planning the whole process.",
        ),
      }),
      createFaqSchema(isEnglish ? HOME_FAQ_ITEMS_EN : HOME_FAQ_ITEMS_PL),
      createBreadcrumbSchema([{ name: t("Strona Główna", "Home"), path: localizePath("/") }]),
      createSiteNavigationSchema([
        { name: t("Strona Główna", "Home"), path: localizePath("/") },
        { name: t("Jak pomagamy", "How we help"), path: localizePath("/jak-to-dziala") },
        { name: t("Kraje i Uczelnie", "Countries and universities"), path: localizePath("/kraje") },
        { name: t("Baza Wiedzy", "Knowledge base"), path: localizePath("/baza-wiedzy") },
        { name: t("Stypendia", "Scholarships"), path: localizePath("/stypendium") },
        { name: t("Poznajmy się", "About us"), path: localizePath("/o-nas") },
        { name: t("Kontakt", "Contact"), path: localizePath("/kontakt") },
      ]),
    ],
  });

  return (
    <div className="w-full">
      <section className="relative min-h-screen flex items-center overflow-x-hidden bg-white pt-28 md:pt-36 pb-10 md:pb-14">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-52 -right-40 w-[700px] h-[700px] rounded-full bg-primary/6" />
          <div className="absolute bottom-0 left-1/2 w-[500px] h-[500px] rounded-full bg-accent/8 -translate-x-1/2 translate-y-1/3" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/12 text-accent border border-accent/25 text-xs font-semibold mb-8 uppercase tracking-widest">
                <Globe size={13} />
                <span>{t("Edukacja bez granic", "Education without borders")}</span>
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold text-gray-900 leading-[1.05] tracking-tight mb-6">
                {isEnglish ? (
                  <>
                    Your place
                    <br />
                    at a <span className="text-primary">world-class</span>
                    <br />
                    university is waiting.
                  </>
                ) : (
                  <>
                    Twoje miejsce
                    <br />
                    na <span className="text-primary">światowej</span>
                    <br />
                    uczelni czeka.
                  </>
                )}
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
                {t(
                  "Pomagamy dostać się na wymarzone uczelnie na całym świecie.",
                  "We help students get into their dream universities all around the world.",
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10 md:mb-14">
                <Link href={localizePath("/umow-spotkanie")}>
                  <Button
                    size="lg"
                    data-testid="button-hero-cta-primary"
                    className="h-14 px-8 text-base rounded-full bg-primary text-white hover:bg-primary/90 font-bold border-none shadow-lg shadow-primary/20"
                  >
                    {t("Umów bezpłatną konsultację", "Book a free consultation")}
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-6 items-center text-sm text-gray-400 pt-8">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  <span>
                    <strong className="text-gray-700 font-semibold">25+</strong>{" "}
                    {t("krajów w ofercie", "countries covered")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary" />
                  <span>
                    <strong className="text-gray-700 font-semibold">99%+</strong>{" "}
                    {t("skuteczność", "success rate")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-accent fill-accent" />
                  <span>
                    <strong className="text-gray-700 font-semibold">{isEnglish ? "£0" : "0 zł"}</strong>{" "}
                    {t("dla stypendystów", "for scholarship recipients")}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
              className="hidden min-h-[532px] lg:flex items-center justify-center"
            >
              <Suspense fallback={<div className="h-[532px] w-full max-w-[500px] rounded-full bg-primary/5" />}>
                <GlobeSection />
              </Suspense>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-6">
              {t("W czym pomożemy Tobie lub Twojemu Dziecku?", "How can we help you or your child?")}
            </h2>
            <p className="text-lg text-gray-500">
              {t(
                "Aplikacja na studia to proces, który wymaga strategii. Przeprowadzimy Cię przez niego krok po kroku.",
                "Applying to university is a process that requires strategy. We guide you through it step by step.",
              )}
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {services.map((service) => (
              <motion.div
                key={service.title}
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
                <span>{t("Program Stypendialny ACADEA", "ACADEA Scholarship Programme")}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6">
                {isEnglish ? (
                  <>
                    Your <span className="text-accent">potential</span> matters,
                    <br />
                    not your budget.
                  </>
                ) : (
                  <>
                    Liczy się Twój <span className="text-accent">potencjał</span>,
                    <br />
                    nie budżet.
                  </>
                )}
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-10">
                {t(
                  "Wybitny potencjał nie powinien napotykać barier finansowych. Dlatego stworzyliśmy Program Stypendialny ACADEA — dla kandydatów, którym zależy, a potrzebują wsparcia.",
                  "Outstanding potential should not face financial barriers. That is why we created the ACADEA Scholarship Programme - for candidates who truly care and need support.",
                )}
              </p>
              <Link href={localizePath("/stypendium/aplikacja")}>
                <Button
                  size="lg"
                  data-testid="button-scholarship-home"
                  className="h-13 px-8 text-base rounded-full bg-accent text-primary hover:bg-primary hover:text-white transition-all font-bold border-none"
                >
                  {t("Aplikuj o stypendium", "Apply for a scholarship")}{" "}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-primary/5 to-accent/10 border border-primary/10 p-2 md:min-h-[360px] md:p-2.5"
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent/10 blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary/8 blur-[60px]" />
              </div>
              <div className="relative z-10 overflow-hidden rounded-[28px] aspect-[5/3] shadow-[0_18px_40px_rgba(22,101,52,0.08)]">
                <img
                  src={scholarshipHomePhoto}
                  alt={t("Program Stypendialny ACADEA", "ACADEA Scholarship Programme")}
                  width={1600}
                  height={1022}
                  className="h-full w-full scale-[1.04] object-cover"
                  loading="lazy"
                />
              </div>
              <div className="relative z-10 mt-2 flex items-center gap-2 px-2 text-sm text-primary/80">
                <MapPin size={16} className="shrink-0 text-accent" />
                <span>{t("wewnątrz Bodleian Library, University of Oxford", "inside the Bodleian Library, University of Oxford")}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

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
                <span>{t("Dla Rodziców", "For parents")}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-5">
                {t(
                  "Rodzicu, jesteśmy tu również dla Ciebie",
                  "Parents, we are here for you too",
                )}
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                {t(
                  "Decyzja o studiach za granicą to ważny krok dla całej rodziny. Dbamy o to, żeby był przejrzysty, bezpieczny i dobrze zaplanowany — także z perspektywy Rodzica.",
                  "The decision to study abroad is an important step for the whole family. We make sure it is transparent, safe and well planned - also from a parent's perspective.",
                )}
              </p>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {parentCards.map((card) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm"
              >
                <div className="w-12 h-12 bg-primary/8 rounded-xl flex items-center justify-center mb-5">
                  <card.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-primary mb-2">{card.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Link href={localizePath("/umow-spotkanie")}>
              <Button
                size="lg"
                data-testid="button-parents-cta"
                className="h-14 px-8 rounded-full bg-primary text-white hover:bg-primary/90 font-bold"
              >
                {t(
                  "Umów rozmowę — również jako Rodzic",
                  "Book a consultation as a parent",
                )}{" "}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
                {t(
                  "Darmowa społeczność WhatsApp — aktualności o studiach za granicą",
                  "Free WhatsApp community for study abroad updates",
                )}
              </h2>
              <p className="text-gray-800/70 text-lg leading-relaxed mb-8">
                {t(
                  "Dołącz i otrzymuj bezpłatne porady, terminy aplikacji i aktualności — prosto na telefon.",
                  "Join and receive free advice, application deadlines and updates - straight to your phone.",
                )}
              </p>
              <ul className="space-y-3 mb-10">
                {whatsappItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-900 text-sm">
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
                {t(
                  "Dołącz do społeczności — to bezpłatne",
                  "Join the community for free",
                )}
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
                <ResponsiveQrCode
                  value="https://chat.whatsapp.com/Cg8sKNNvAFIKBfDjBLqWKl"
                  size={200}
                  title={t("Kod QR do grupy WhatsApp ACADEA", "QR code for the ACADEA WhatsApp group")}
                  className="h-auto w-full max-w-[200px]"
                />
              </motion.div>
              <p className="text-white font-bold text-lg mt-7">{t("Zeskanuj kod QR", "Scan the QR code")}</p>
              <p className="text-white/70 text-sm mt-2 max-w-xs">
                {t(
                  "Otwórz aparat i dołącz do społeczności ACADEA na WhatsApp.",
                  "Open your camera and join the ACADEA community on WhatsApp.",
                )}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

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
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t("Zacznijmy Twoją drogę.", "Let's start your journey.")}
              
            </h2>
            <p className="text-xl text-white/70 mb-10">
              {t(
                "Umów bezpłatną konsultację — bez zobowiązań. Wybierz termin i porozmawiaj z naszym doradcą.",
                "Book a free consultation - with no obligation. Choose a time and speak with our adviser.",
              )}
            </p>
            <Link href={localizePath("/umow-spotkanie")}>
              <Button size="lg" className="h-14 px-10 text-lg bg-accent text-primary hover:bg-white transition-colors border-none rounded-full font-bold shadow-lg shadow-accent/20">
                {t("Wybierz termin", "Choose a time")} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
