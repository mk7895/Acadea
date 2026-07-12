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
      "A student at University College London, for over 10 years the world's leading university in Education. Founder of the Acadea Foundation, she is passionate about implementing new technologies, especially in education. In 2025 she graduated with distinction with a Bachelor of Science from New York University (NYU), during which she studied Finance, Economics and Chinese across as many as five countries. She has presented her work at international academic conferences. She has been recognised in programmes such as the Chancellery of the Prime Minister's Leaders of Innovation, the National Children's Fund and ADAMED SmartUP. She has achieved numerous successes in olympiads and competitions, served on the Children and Youth Council to the Minister of Education and Science and on the Youth Council of the West Pomeranian Voivodeship. While supporting local communities and early-career journalists, she co-chaired the Polish Federation of Youth and the Polemika Foundation. For five years Marlena has been helping others get into their dream universities - she has successfully worked with hundreds of applicants, and her mentees have received offers from top universities around the world.",
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
      "A graduate of the London School of Economics, where he completed an MSc in Econometrics and Mathematical Economics, and of New York University, where he studied Business and Finance as well as Economics. An alumnus of I.S.E.O. Summer School and the Capital Market Leaders Academy, throughout his academic and professional path he gained experience at the intersection of analytics, strategy and finance, working at both Boston Consulting Group (BCG) and zeb Consulting. He was recognised multiple times for his academic performance and earlier achieved numerous successes in olympiads and competitions, including as a double laureate of the Polish Statistics Olympiad, placing 3rd and 8th in Poland, and as a finalist of the Economics Olympiad. He was also socially engaged, including as a member of the National Council of the Polish Federation of Youth. For five years he has been helping candidates gain admission in very different education systems - from the United States to South Korea and from Finland to Malta. He has spent thousands of hours working with applicants and supports them in building strategy, profile and decisions that genuinely open doors to world-class universities.",
  },
];

export default function AboutUs() {
  const { isEnglish, localizePath, t } = useLanguage();

  const values = [
    {
      title: t("Szczerość", "Honesty"),
      desc: t(
        "Nie obiecujemy gruszek na wierzbie. Realnie oceniamy Twoje szanse i doradzamy najlepsze, a nie najdroższe rozwiązania.",
        "We do not promise the impossible. We assess your chances realistically and recommend the best solutions, not the most expensive ones.",
      ),
    },
    {
      title: t("Indywidualność", "Individuality"),
      desc: t(
        "Nie pracujemy na szablonach. Każdy uczeń to inna historia, inne pasje i inne cele. Twój profil będzie w 100% Twój.",
        "We do not work from templates. Every student has a different story, different passions and different goals. Your profile will be 100% your own.",
      ),
    },
    {
      title: t("Wsparcie 360°", "360° support"),
      desc: t(
        "Jesteśmy z Tobą od pierwszego pomysłu aż po wniesienie walizek do akademika. Nie zostawiamy Cię z problemami samemu sobie.",
        "We are with you from the first idea all the way to carrying your suitcases into the dorm. We do not leave you alone with problems.",
      ),
    },
  ];

  useSeo({
    title: t("Poznajmy się | Zespół ACADEA", "About us | The ACADEA team"),
    description: t(
      "Poznaj zespół ACADEA i historię osób, które same przeszły proces aplikacji na studia za granicą, a dziś wspierają kolejnych kandydatów.",
      "Meet the ACADEA team and the stories of the people who went through the process of applying abroad themselves and today support the next generation of candidates.",
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
          "A page about the ACADEA team, its values and its experience in applying to universities abroad.",
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
                  "We founded ACADEA because we ourselves once went through the stressful and complicated process of applying to foreign universities.",
                )}
              </p>
              <p>
                {t(
                  "Sami gubiliśmy się w gąszczu wymagań, portali aplikacyjnych, egzaminów językowych i terminów. Z biegiem lat nauczyliśmy się, co naprawdę znaczy doskonały esej, a wymagania kolejnych uczelni przestały mieć przed nami jakiekolwiek tajemnice.",
                  "We ourselves got lost in the maze of requirements, application portals, language exams and deadlines. Over the years we learned what a truly excellent essay means, and the requirements of successive universities stopped holding any secrets for us.",
                )}
              </p>
              <p className="font-semibold text-primary">
                {t(
                  "Od ponad 5 lat prowadzimy kolejne roczniki ambitnych uczniów za rękę — dokładnie tak, jak sami chcielibyśmy zostać wtedy poprowadzeni.",
                  "For more than 5 years, we have been guiding successive cohorts of ambitious students by the hand - exactly the way we ourselves would have wanted to be guided back then.",
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
                "These are the principles that guide our everyday work with our mentees.",
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
                "Meet the people who built ACADEA on their own application experience and who have been guiding successive students through this process for years.",
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
                "If you study abroad or already have this stage behind you and want to help other people go through the application process more calmly and more wisely, we would be glad to get to know you.",
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
