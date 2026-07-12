import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Search, PenTool, Send, Home as HomeIcon, BookOpen, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import {
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebPageSchema,
  useSeo,
} from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

export default function HowItWorks() {
  const { isEnglish, localizePath, t } = useLanguage();

  const steps = [
    {
      id: "wybor-uczelni",
      icon: Search,
      title: t(
        "1. Doradztwo w wyborze krajow, uczelni i kierunkow",
        "1. Advice on choosing countries, universities and degree programmes",
      ),
      desc: t(
        "Zaczynamy od doglebnego poznania Twoich pasji, mocnych stron i oczekiwan. Analizujemy wyniki w nauce i budzet. Wspolnie tworzymy spersonalizowana i optymalna liste uniwersytetow oraz harmonogram aplikacji.",
        "We begin by understanding your interests, strengths and ambitions in depth. We review your academic profile and budget, then build a personalised and well-balanced university list together with an application timeline.",
      ),
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "egzaminy-i-certyfikaty",
      icon: BookOpen,
      title: t(
        "2. Przygotowanie do Egzaminow i Certyfikatow Jezykowych",
        "2. Exam and language certificate preparation",
      ),
      desc: t(
        "Pomagamy w przygotowaniu do egzaminow wymaganych przez uczelnie — IELTS, TOEFL, egzaminow Cambridge, SAT, GRE, GMAT oraz egzaminow maturalnych, w tym matury miedzynarodowej IB. Cwiczymy w zaplanowanym tempie, aby osiagnac wymagane wyniki z wyprzedzeniem.",
        "We support preparation for the exams required by universities, including IELTS, TOEFL, Cambridge exams, SAT, GRE, GMAT and school-leaving exams such as the IB. We work to a structured plan so target scores are reached early.",
      ),
      color: "bg-teal-100 text-teal-600",
    },
    {
      id: "przygotowanie-dokumentow",
      icon: PenTool,
      title: t("3. Przygotowanie Dokumentow", "3. Document preparation"),
      desc: t(
        "Pomagamy w skompletowaniu niezbednych dokumentow: transkryptow ocen, referencji/listow rekomendacyjnych, certyfikatow. Pracujemy nad Twoim CV tak, aby pokazac Cie z jak najlepszej strony. Sluzymy rada i pomoca rowniez nauczycielom i innym osobom, ktore pisza dla Ciebie listy rekomendacyjne.",
        "We help gather every required document, from transcripts and certificates to references and recommendation letters. We also refine your CV and support teachers or referees contributing to your application.",
      ),
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "eseje-cv-i-listy-motywacyjne",
      icon: Check,
      title: t("4. Eseje, CV i Listy Motywacyjne", "4. Essays, CVs and motivation letters"),
      desc: t(
        "To jeden z najwazniejszych elementow aplikacji. Dokladnie analizujemy kazdy zadany temat, przechodzimy przez burze mozgow i tworzenie planow esejow. Nastepnie edytujemy teksty, az beda perfekcyjne.",
        "This is one of the most important parts of the application. We analyse every prompt carefully, brainstorm ideas with you, shape strong outlines and then edit each draft until it is genuinely ready to submit.",
      ),
      color: "bg-purple-100 text-purple-600",
    },
    {
      id: "aplikacja-i-stypendia",
      icon: Send,
      title: t("5. Aplikacja i Stypendia", "5. Applications and scholarships"),
      desc: t(
        "Wspolnie wypelniamy portale i wnioski aplikacyjne (UCAS, Common App i inne). Dbamy o wszystkie terminy, oplaty aplikacyjne oraz ewentualne wnioski o stypendia.",
        "We complete application portals and forms together, including UCAS, Common App and others. We keep track of deadlines, fees and any scholarship submissions.",
      ),
      color: "bg-orange-100 text-orange-600",
    },
    {
      id: "oczekiwanie",
      icon: MessageCircle,
      title: t("6. W oczekiwaniu na odpowiedzi i interviews", "6. Waiting for results and interviews"),
      desc: t(
        "Pozostajemy w kontakcie po wyslaniu aplikacji, pomagajac w komunikacji z uczelnia, przygotowaniu sie do rozmow wstepnych oraz dodajac otuchy w oczekiwaniu na wyniki.",
        "We stay close after submission, helping with communication from universities, interview preparation and the uncertainty that comes with waiting for decisions.",
      ),
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      id: "po-przyjeciu",
      icon: HomeIcon,
      title: t("7. Po przyjeciu", "7. After admission"),
      desc: t(
        "Otrzymujesz oferty! Pomagamy podjac ostateczna decyzje oraz dopelnic formalnosci. Wspieramy w organizacji wyjazdu, wyborze ubezpieczenia, procesie wizowym, aplikacji o miejsce w akademiku czy wyborze operatora w nowym kraju.",
        "When offers arrive, we help you compare them, make the final choice and complete the next formal steps. That includes departure planning, insurance, visas, accommodation and settling into a new country.",
      ),
      color: "bg-rose-100 text-rose-600",
    },
  ];

  useSeo({
    title: t(
      "Jak pomagamy w aplikacji na studia za granica | ACADEA",
      "How we help with study abroad applications | ACADEA",
    ),
    description: t(
      "Zobacz, jak wyglada wspolpraca z ACADEA krok po kroku: wybor uczelni, egzaminy, dokumenty, eseje, aplikacja, rozmowy i formalnosci po przyjeciu.",
      "See how working with ACADEA looks step by step: university choice, exams, documents, essays, applications, interviews and post-offer formalities.",
    ),
    path: localizePath("/jak-to-dziala"),
    keywords: isEnglish
      ? ["study abroad application process", "application help", "application essays", "study abroad advising"]
      : [
          "jak aplikowac na studia za granica",
          "pomoc w aplikacji",
          "eseje aplikacyjne",
          "doradztwo studia za granica",
        ],
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebPageSchema({
        path: localizePath("/jak-to-dziala"),
        title: t(
          "Jak pomagamy w aplikacji na studia za granica | ACADEA",
          "How we help with study abroad applications | ACADEA",
        ),
        description: t(
          "Opis procesu wspolpracy z ACADEA przy aplikacji na studia za granica od wyboru uczelni po wyjazd.",
          "An overview of the ACADEA process for study abroad applications, from university selection to departure.",
        ),
      }),
      createBreadcrumbSchema([
        { name: t("Strona Glowna", "Home"), path: localizePath("/") },
        { name: t("Jak pomagamy", "How we help"), path: localizePath("/jak-to-dziala") },
      ]),
    ],
  });

  return (
    <div className="w-full pt-24 md:pt-28 pb-12 md:pb-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-14">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-primary mb-6"
          >
            {t("Droga na wymarzona uczelnie", "The road to your dream university")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-600"
          >
            {t(
              "Aplikacja na studia za granica to maraton, nie sprint. Zobacz, jak przeprowadzimy Cie przez caly proces — od pierwszego pomyslu az po wyjazd.",
              "Applying abroad is a marathon, not a sprint. Here is how we guide you through the whole process, from the first idea all the way to departure.",
            )}
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative border-l-2 border-gray-100 ml-6 md:ml-12 space-y-8 md:space-y-12 py-2 md:py-4">
            {steps.map((step, index) => (
              <motion.div
                id={step.id}
                key={step.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative pl-10 md:pl-16"
              >
                <div className={`absolute -left-7 top-1 w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${step.color}`}>
                  <step.icon size={24} />
                </div>

                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <h3 className="text-2xl font-bold text-primary mb-4">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 md:mt-16 max-w-4xl mx-auto bg-gray-50 rounded-3xl p-8 md:p-12 text-center border border-gray-100"
        >
          <h2 className="text-3xl font-bold text-primary mb-4">
            {t("Gotowy zrobic pierwszy krok?", "Ready to take the first step?")}
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {t(
              "Najlepszy czas na rozpoczecie przygotowan jest na przynajmniej rok przed matura. Nie czekaj do ostatniej chwili.",
              "The best time to start preparing is at least a year before your final school exams. It is much easier when there is time to plan well.",
            )}
          </p>
          <Link href={localizePath("/kontakt")} className="inline-flex justify-center">
            <Button size="lg" className="inline-flex h-14 items-center justify-center px-10 text-center text-lg rounded-full shadow-md">
              {t("Zacznijmy przygotowania", "Let's start planning")} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
