import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import {
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebPageSchema,
  useSeo,
} from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

const featuredFounders = [
  {
    name: "Marlena Sołtysińska",
    imageSrc: "/images/about-soltysinska.jpg",
    imagePosition: "object-[50%_35%]",
    imageOrder: "md:order-1",
    textOrder: "md:order-2",
    description:
      "Studentka University College London, od ponad 10 lat pierwszego na świecie uniwersytetu z Nauk o Edukacji. Założycielka Fundacji Acadea, pasjonatka implementowania nowych technologii, szczególnie w edukacji. W 2025 roku z wyróżnieniem ukończyła Bachelor of Science na Uniwersytecie Nowojorskim (NYU), w trakcie którego w aż pięciu krajach studiowała Finanse, Ekonomię oraz Język Chiński. Swoje prace prezentowała na międzynarodowych konferencjach naukowych. Wyróżniona w programach takich jak Liderzy Innowacji Kancelarii Prezesa Rady Ministrów, Krajowy Fundusz na rzecz Dzieci oraz ADAMED SmartUP. Ma na koncie liczne sukcesy w olimpiadach i konkursach, działała w Radzie Dzieci i Młodzieży przy Ministrze Edukacji i Nauki oraz Radzie Młodzieżowej Województwa Zachodniopomorskiego. Wspierając małe ojczyzny i początkujących dziennikarzy, współprzewodniczyła Ogólnopolskiej Federacji Młodych i Fundacji Polemika. Od pięciu lat Marlena pomaga innym dostać się na ich wymarzone studia - ma za sobą udane współprace z setkami aplikantów, a jej podopieczni otrzymali oferty z topowych uczelni na całym świecie.",
    descriptionEn:
      "A student at University College London and founder of the Acadea Foundation, Marlena combines a passion for education with a strong interest in how technology can improve access to it. In 2025 she graduated with distinction from New York University, where she studied finance, economics and Chinese across five countries. She has presented her work at international academic conferences and has been recognised by programmes such as Liderzy Innowacji, Krajowy Fundusz na rzecz Dzieci and ADAMED SmartUP. For the past five years, she has helped applicants build strong strategies and gain admission to ambitious universities worldwide.",
  },
  {
    name: "Mateusz Klepacki",
    imageSrc: "/images/about-klepacki-centered.jpeg",
    imagePosition: "object-center",
    imageOrder: "md:order-2",
    textOrder: "md:order-1",
    description:
      "Absolwent London School of Economics, gdzie ukończył MSc Econometrics and Mathematical Economics, oraz New York University, na którym studiował Business and Finance oraz Economics. Alumn I.S.E.O. Summer School i Akademii Liderów Rynku Kapitałowego, w trakcie swojej ścieżki akademickiej i zawodowej zdobywał doświadczenie na styku analizy, strategii i finansów, był pracownikiem zarówno Boston Consulting Group (BCG), jak i zeb Consulting. Za swoje wyniki był wielokrotnie wyróżniany akademicko, a wcześniej odnosił liczne sukcesy w olimpiadach i konkursach, w tym jako podwójny laureat Olimpiady Statystycznej, zajmując 3. i 8. miejsce w Polsce, oraz finalista Olimpiady Wiedzy Ekonomicznej. Angażował się również społecznie, między innymi jako członek Rady Krajowej Ogólnopolskiej Federacji Młodych. Od pięciu lat pomaga kandydatom dostawać się na studia w bardzo różnych systemach edukacyjnych - od Stanów Zjednoczonych po Koreę Południową i od Finlandii po Maltę. Ma za sobą tysiące godzin pracy z aplikantami i wspiera ich w budowaniu strategii, profilu oraz decyzji, które realnie otwierają drzwi do światowych uczelni.",
    descriptionEn:
      "Mateusz is a graduate of the London School of Economics, where he completed an MSc in Econometrics and Mathematical Economics, and of New York University, where he studied business, finance and economics. Across his academic and professional path he has worked at the intersection of analytics, strategy and finance, including experience at Boston Consulting Group and zeb Consulting. For five years he has supported applicants across very different education systems, from the United States to South Korea and from Finland to Malta, helping them build strong profiles, realistic strategies and smart application decisions.",
  },
];

export default function AboutUs() {
  const { isEnglish, localizePath, t } = useLanguage();

  const values = [
    {
      title: t("Szczerość", "Honesty"),
      desc: t(
        "Nie obiecujemy gruszek na wierzbie. Realnie oceniamy Twoje szanse i doradzamy najlepsze, a nie najdroższe rozwiązania.",
        "We do not sell fantasies. We assess your chances realistically and recommend what is best, not what is most expensive.",
      ),
    },
    {
      title: t("Indywidualność", "Individuality"),
      desc: t(
        "Nie pracujemy na szablonach. Każdy uczeń to inna historia, inne pasje i inne cele. Twój profil będzie w 100% Twój.",
        "We do not work from templates. Every student has a different story, different interests and different goals, so your profile should feel fully your own.",
      ),
    },
    {
      title: t("Wsparcie 360°", "360° support"),
      desc: t(
        "Jesteśmy z Tobą od pierwszego pomysłu aż po wniesienie walizek do akademika. Nie zostawiamy Cię z problemami samemu sobie.",
        "We stay with you from the first idea to moving into your accommodation. We do not disappear once the hard part begins.",
      ),
    },
  ];

  useSeo({
    title: t("Poznajmy się | Zespół ACADEA", "About us | The ACADEA team"),
    description: t(
      "Poznaj zespół ACADEA i historię osób, które same przeszły proces aplikacji na studia za granicą, a dziś wspierają kolejnych kandydatów.",
      "Meet the ACADEA team and the people who went through international applications themselves and now support the next generation of candidates.",
    ),
    path: localizePath("/o-nas"),
    keywords: isEnglish
      ? ["about ACADEA", "ACADEA team", "study abroad mentors"]
      : ["o nas ACADEA", "zespół ACADEA", "mentorzy studia za granicą"],
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebPageSchema({
        path: localizePath("/o-nas"),
        title: t("Poznajmy się | Zespół ACADEA", "About us | The ACADEA team"),
        description: t(
          "Strona o zespole ACADEA, jego wartościach i doświadczeniu w aplikacji na studia za granicą.",
          "A page about the ACADEA team, its values and its experience in study abroad applications.",
        ),
      }),
      createBreadcrumbSchema([
        { name: t("Strona Główna", "Home"), path: localizePath("/") },
        { name: t("Poznajmy się", "About us"), path: localizePath("/o-nas") },
      ]),
    ],
  });

  return (
    <div className="w-full pt-28 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              {t(
                "Byliśmy tam, gdzie Ty jesteś teraz.",
                "We have been where you are now.",
              )}
            </h1>
            <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
              <p>
                {t(
                  "Założyliśmy ACADEA, ponieważ sami kiedyś przeszliśmy przez stresujący i skomplikowany proces aplikacji na zagraniczne uczelnie.",
                  "We founded ACADEA because we had gone through the stressful, complicated process of applying to universities abroad ourselves.",
                )}
              </p>
              <p>
                {t(
                  "Sami gubiliśmy się w gąszczu wymagań, portali aplikacyjnych, egzaminów językowych i terminów. Z biegiem lat nauczyliśmy się, co naprawdę znaczy doskonały esej, a wymagania kolejnych uczelni przestały mieć przed nami jakiekolwiek tajemnice.",
                  "We remember the confusion of requirements, portals, language tests and deadlines. Over the years we learned what truly makes an essay work and how different universities evaluate applicants in practice.",
                )}
              </p>
              <p className="font-semibold text-primary">
                {t(
                  "Od ponad 5 lat prowadzimy kolejne roczniki ambitnych uczniów za rękę — dokładnie tak, jak sami chcielibyśmy zostać wtedy poprowadzeni.",
                  "For more than five years, we have guided ambitious students in the exact way we once wished someone had guided us.",
                )}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[500px] rounded-3xl overflow-hidden"
          >
            <img
              src="/images/about-together.webp"
              alt={t("Zespół ACADEA", "The ACADEA team")}
              className="w-full h-full object-cover object-[38%_center]"
            />
            <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
          </motion.div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-3xl p-10 md:p-16 mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              {t("Nasze wartości", "Our values")}
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              {t(
                "Tym kierujemy sie w codziennej pracy z naszymi podopiecznymi.",
                "These principles shape the way we work with students every day.",
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {values.map((value, idx) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm"
              >
                <h3 className="text-xl font-bold text-primary mb-3">{value.title}</h3>
                <p className="text-gray-500">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              {t("Nasz zespół", "Our team")}
            </h2>
            <p className="max-w-3xl mx-auto text-gray-500 leading-relaxed">
              {t(
                "Poznaj osoby, które zbudowały ACADEA na własnych doświadczeniach aplikacyjnych i od lat prowadzą kolejnych uczniów przez ten proces.",
                "Meet the people who built ACADEA from their own admissions experience and have spent years guiding students through the same journey.",
              )}
            </p>
          </div>
          <div className="space-y-16">
            {featuredFounders.map((member, idx) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-14"
              >
                <div className={`${member.imageOrder} flex w-full items-center justify-center`}>
                  <div className="relative aspect-square w-full overflow-hidden rounded-full border border-primary/10 bg-[#f8f4ec] shadow-[0_20px_60px_rgba(22,101,52,0.08)]">
                    <img
                      src={member.imageSrc}
                      alt={member.name}
                      className={`h-full w-full object-cover ${member.imagePosition}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/12 via-transparent to-transparent" />
                  </div>
                </div>
                <div className={`${member.textOrder} flex w-full flex-col justify-center`}>
                  <h3 className="mb-5 text-3xl font-bold text-primary md:text-4xl">{member.name}</h3>
                  <p className="text-base leading-8 text-gray-600 md:text-lg">
                    {isEnglish ? member.descriptionEn : member.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-14 mt-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-semibold mb-6">
              <Users size={16} />
              <span>{t("Dołącz do zespołu", "Join the team")}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              {t(
                "Chcesz wspierać uczniów razem z ACADEA?",
                "Would you like to support students with ACADEA?",
              )}
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto mb-8">
              {t(
                "Jeśli studiujesz za granicą albo masz już ten etap za sobą i chcesz pomagać kolejnym osobom przejść przez aplikację spokojniej i mądrzej, chętnie Cię poznamy.",
                "If you study abroad or have already gone through the process yourself and want to help the next generation navigate applications more calmly and intelligently, we would love to hear from you.",
              )}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={localizePath("/mentoruj")}>
                <Button size="lg" className="rounded-full px-8 h-14 text-base bg-primary text-white hover:bg-primary/90 font-bold">
                  {t("Aplikuj do zespołu", "Apply to join the team")} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={localizePath("/kontakt")}>
                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base">
                  {t("Poznajmy się", "Get in touch")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
