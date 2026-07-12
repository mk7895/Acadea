import { motion, type Variants } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Heart,
  Clock,
  Calendar,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SORTED_SCHOLARSHIP_MENTORS } from "@/data/scholarship-mentors";
import {
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebPageSchema,
  useSeo,
} from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const criteria = [
  {
    title: "Wybitne wyniki i osiągnięcia",
    desc: "Szukamy osób z pasją — oceny są istotne, ale równie ważne są Twoja motywacja, determinacja i to, co robisz poza szkołą.",
  },
  {
    title: "Wielkie marzenia i plany na przyszłość",
    desc: "Chcesz studiować za granicą, latać samolotami, tańczyć albo rozwijać zupełnie inną dziedzinę? Pomożemy Ci zaplanować własną ścieżkę.",
  },
];

export default function Scholarship() {
  const { isEnglish, localizePath, t } = useLanguage();
  const localizedCriteria = isEnglish
    ? [
        {
          title: "Outstanding results and achievements",
          desc: "We are looking for people with passion - grades matter, but your motivation, determination and what you do outside school matter just as much.",
        },
        {
          title: "Big dreams and plans for the future",
          desc: "Do you want to study abroad, fly planes, dance or develop in a completely different field? We will help you plan your own path.",
        },
      ]
    : criteria;
  useSeo({
    title: t(
      "Program Stypendialny ACADEA | Konkurs stypendialny",
      "ACADEA Scholarship Programme | Scholarship competition",
    ),
    description: t(
      "Poznaj Program Stypendialny ACADEA i sprawdź zasady konkursu dla ambitnych kandydatów, którzy potrzebują wsparcia mentoringowego i edukacyjnego.",
      "Explore the ACADEA Scholarship Programme and see the competition rules for ambitious candidates who need mentoring and educational support.",
    ),
    path: localizePath("/stypendium"),
    keywords: isEnglish
      ? [
          "ACADEA scholarship",
          "scholarship competition",
          "scholarship programme",
          "study abroad scholarship",
        ]
      : [
          "stypendium ACADEA",
          "konkurs stypendialny",
          "program stypendialny",
          "stypendium studia za granicą",
        ],
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebPageSchema({
        path: localizePath("/stypendium"),
        title: t(
          "Program Stypendialny ACADEA | Konkurs stypendialny",
          "ACADEA Scholarship Programme | Scholarship competition",
        ),
        description: t(
          "Strona programu stypendialnego ACADEA z opisem konkursu, mentorów i formularza zgłoszeniowego.",
          "ACADEA scholarship programme page with the competition description, mentors and application form.",
        ),
      }),
      createBreadcrumbSchema([
        { name: t("Strona Główna", "Home"), path: localizePath("/") },
        { name: t("Stypendia", "Scholarships"), path: localizePath("/stypendium") },
      ]),
    ],
  });

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="pt-24 md:pt-28 pb-10 md:pb-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.02fr)_minmax(340px,0.98fr)] gap-10 lg:gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-[1.05] tracking-tight mb-5">
                {t("Twoja pasja.", "Your passion.")}
                <br />
                <span className="text-primary">{t("Nasze wsparcie.", "Our support.")}</span>
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mb-8 md:mb-10">
                {t(
                  "Program Stypendialny ACADEA to mentoring i wsparcie dla ambitnych, zmotywowanych osób, które chcą świadomie wybrać i podążać własną ścieżką.",
                  "The ACADEA Scholarship Programme offers mentoring and support for ambitious, motivated people who want to choose and follow their own path consciously.",
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#konkurs">
                  <Button
                    size="lg"
                    data-testid="button-scholarship-hero-cta"
                    className="h-14 px-8 text-base bg-primary text-white hover:bg-gray-900 transition-colors border-none rounded-full font-bold"
                  >
                    {t("Zobacz konkurs stypendialny", "See the scholarship competition")} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="relative flex justify-center xl:justify-end xl:-translate-x-20"
            >
              <div className="w-full max-w-[340px] rounded-[32px] border border-primary/10 bg-gradient-to-br from-primary/[0.04] via-white to-accent/10 p-4 md:p-5 shadow-[0_22px_60px_rgba(22,101,52,0.08)]">
                <div className="overflow-hidden rounded-3xl border border-primary/10 aspect-[9/16] bg-black">
                  <video
                    src="https://media.acadea.org/acadeaVideoR2HD.mp4#t=0.1"
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                    preload="auto"
                    onLoadedMetadata={(event) => {
                      if (event.currentTarget.currentTime < 0.1) {
                        event.currentTarget.currentTime = 0.1;
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Deadline banner */}
      <section id="konkurs" className="bg-accent py-5">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-4 text-primary text-center"
          >
            <div className="flex items-center gap-2 bg-primary/10 rounded-full px-5 py-2 font-bold text-base">
              <Clock size={18} className="shrink-0" />
              <span>{t("Rozpatrywane na bieżąco", "Reviewed on a rolling basis")}</span>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 rounded-full px-5 py-2 font-bold text-base">
              <Calendar size={18} className="shrink-0" />
              <span>Online</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission statement */}
      <section className="py-12 md:py-14 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-accent/5 border border-accent/20 rounded-3xl p-10 md:p-16 text-center"
            >
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Heart size={32} className="text-accent" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-primary leading-snug mb-6">
                {t(
                  "Czasem potrzeba jednej osoby, żeby marzenie zamieniło się w realny plan. Kogoś, kto pokaże pierwszy krok i pomoże uwierzyć, że ambitne cele są naprawdę osiągalne.",
                  "Sometimes all it takes is one person for a dream to turn into a real plan. Someone who shows the first step and helps you believe that ambitious goals are truly achievable.",
                )}
              </div>
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                {t(
                  "Wierzymy w to każdego dnia. Dlatego stworzyliśmy program, który daje ambitnym, zmotywowanym osobom dostęp do mentoringu i wsparcia w realizacji ich marzeń i celów naukowych.",
                  "We believe this every day. That is why we created a programme that gives ambitious, motivated people access to mentoring and support in pursuing their dreams and academic goals.",
                )}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Competition section */}
      <section className="py-12 md:py-16 relative overflow-hidden bg-[#faf7f1]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[26%] left-[28%] h-[20rem] w-[20rem] rounded-full bg-primary/8 blur-[18px]" />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                {t("Konkurs Stypendialny ACADEA", "ACADEA Scholarship Competition")}
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                {t(
                  "Szukamy ambitnych, zmotywowanych osób z pasją — niezależnie od tego, czy marzą o studiach za granicą, czy chcą rozwijać swoje zainteresowania, takie jak lotnictwo, taniec czy nauka. To program mentoringowy, w którym pomagamy świadomie wybrać i podążać własną ścieżką.",
                  "We are looking for ambitious, motivated people with passion - whether they dream of studying abroad or want to develop interests such as aviation, dance or science. This is a mentoring programme in which we help people consciously choose and follow their own path.",
                )}
              </p>
            </motion.div>

            {/* Criteria */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {localizedCriteria.map((c, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  data-testid={`criterion-${i}`}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-primary/10 shadow-sm"
                >
                  <h3 className="text-primary font-bold text-lg mb-2">{c.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{c.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 24}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                className="mt-12"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-primary mb-3">{t("Nasi mentorzy", "Our mentors")}</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {t(
                    "Stypendium to nie tylko wsparcie finansowe, ale też ludzie, którzy pomagają przekuć potencjał w konkretny plan.",
                    "A scholarship is not only financial support but also people who help turn potential into a concrete plan.",
                  )}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {SORTED_SCHOLARSHIP_MENTORS.map((mentor) => (
                    <div
                        key={mentor.name}
                        className="w-full rounded-2xl border border-primary/10 bg-white/85 p-6 shadow-sm md:basis-[calc((100%_-_2rem)/3)] md:max-w-[calc((100%_-_2rem)/3)]"
                    >
                      <div
                          className="w-11 h-11 rounded-full bg-primary/8 text-primary flex items-center justify-center mb-4">
                        <GraduationCap size={20}/>
                      </div>
                      <h4 className="text-lg font-bold text-primary">{mentor.name}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed mt-3">{isEnglish ? mentor.descEn : mentor.desc}</p>
                    </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <a
                    href="/mentorzy-acadea.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                >
                  {t("Dowiedz się więcej o Mentorach", "Learn more about the mentors")}
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
              initial={{opacity: 0, y: 24}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold text-primary mb-6">{t("Aplikuj o stypendium", "Apply for a scholarship")}</h2>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              {t(
                "Jeśli masz wybitne wyniki, pasję i wielkie marzenia, ten konkurs jest dla Ciebie. Wypełnij formularz. Zgłoszenia rozpatrujemy z indywidualną uwagą dla każdej historii.",
                "If you have outstanding results, passion and big dreams, this competition is for you. Fill in the form. We review applications with individual attention to every story.",
              )}
            </p>
            <div className="flex flex-col items-center gap-4">
              <Link href={localizePath("/stypendium/aplikacja")}>
                <Button
                  size="lg"
                  data-testid="button-apply-scholarship"
                  className="h-14 px-10 text-base bg-primary text-white hover:bg-primary/90 rounded-full font-bold shadow-lg"
                >
                  {t("Wypełnij formularz", "Fill in the form")} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={localizePath("/stypendium/regulamin")} className="text-sm font-semibold text-primary hover:underline">
                {t("Regulamin konkursu stypendialnego", "Scholarship competition terms")}
              </Link>
            </div>
            <p className="text-sm text-gray-400 mt-5">
              {t("Wypełnienie formularza zajmuje kilka minut.", "Completing the form takes a few minutes.")}
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
