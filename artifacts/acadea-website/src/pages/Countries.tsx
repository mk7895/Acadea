import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { countries } from "@/data/countries";
import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
  createItemListSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  useSeo,
} from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

const GlobeSection = lazy(() =>
  import("@/components/GlobeSection").then((module) => ({ default: module.GlobeSection })),
);

const countryContentEn: Record<string, { name: string; tagline: string }> = {
  usa: { name: "USA", tagline: "The widest range of universities and generous scholarship opportunities." },
  "wielka-brytania": { name: "United Kingdom", tagline: "Oxford, Cambridge and top Russell Group universities." },
  holandia: { name: "Netherlands", tagline: "Practical, international education with many programmes in English." },
  niemcy: { name: "Germany", tagline: "Top-quality education, often with little or no tuition." },
  irlandia: { name: "Ireland", tagline: "An English-speaking EU destination with strong links to global tech." },
  francja: { name: "France", tagline: "Elite Grandes Ecoles and a rich academic tradition." },
  szwajcaria: { name: "Switzerland", tagline: "Prestige, safety and proximity to international organisations." },
  szwecja: { name: "Sweden", tagline: "Innovation-driven education and strong outcomes for EU students." },
  dania: { name: "Denmark", tagline: "Modern campuses, design culture and attractive scholarship options." },
  hiszpania: { name: "Spain", tagline: "Excellent business schools and a warm Mediterranean lifestyle." },
  wlochy: { name: "Italy", tagline: "Art, design and some of the world's oldest universities." },
  austria: { name: "Austria", tagline: "Classical education in historic university cities." },
  belgia: { name: "Belgium", tagline: "The heart of Europe with multilingual academic environments." },
  norwegia: { name: "Norway", tagline: "High quality of life and tuition-friendly study options." },
  czechy: { name: "Czech Republic", tagline: "Strong medicine and technical degrees close to Poland." },
  portugalia: { name: "Portugal", tagline: "Accessible costs and a mild climate." },
  finlandia: { name: "Finland", tagline: "A global leader in education and innovation." },
  kanada: { name: "Canada", tagline: "Expansive campuses and strong post-study pathways." },
  chiny: { name: "China", tagline: "A rising academic powerhouse with government scholarships." },
  "korea-poludniowa": { name: "South Korea", tagline: "A technology leader with highly modern campuses." },
  singapur: { name: "Singapore", tagline: "A global education hub in the heart of Asia." },
  japonia: { name: "Japan", tagline: "Tradition, technology and MEXT scholarship opportunities." },
  australia: { name: "Australia", tagline: "Strong student life, excellent universities and post-study work routes." },
  malta: { name: "Malta", tagline: "An English-speaking EU country on the Mediterranean." },
  zea: { name: "UAE", tagline: "Branch campuses of world universities and generous scholarships." },
  hongkong: { name: "Hong Kong", tagline: "A British-style academic system with English-medium teaching." },
};

export default function Countries() {
  const { isEnglish, localizePath, t } = useLanguage();

  useSeo({
    title: t("Kraje i uczelnie za granica | ACADEA", "Countries and universities abroad | ACADEA"),
    description: t(
      "Poznaj kraje i uczelnie, do ktorych pomagamy aplikowac. Sprawdz wymagania, kierunki i mozliwosci studiowania za granica z ACADEA.",
      "Explore the countries and universities we help students apply to. Compare systems, destinations and study abroad opportunities with ACADEA.",
    ),
    path: localizePath("/kraje"),
    keywords: isEnglish
      ? ["countries to study abroad", "universities abroad", "where to study abroad", "international universities"]
      : ["studia za granica kraje", "uczelnie za granica", "gdzie studiowac za granica", "kraje i uczelnie"],
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createCollectionPageSchema({
        path: localizePath("/kraje"),
        title: t("Kraje i uczelnie za granica | ACADEA", "Countries and universities abroad | ACADEA"),
        description: t(
          "Przeglad krajow i uczelni, do ktorych pomagamy aplikowac w ramach doradztwa ACADEA.",
          "An overview of the countries and universities ACADEA supports students with.",
        ),
      }),
      createBreadcrumbSchema([
        { name: t("Strona Glowna", "Home"), path: localizePath("/") },
        { name: t("Kraje i Uczelnie", "Countries and universities"), path: localizePath("/kraje") },
      ]),
      createItemListSchema({
        name: t("Kraje dostepne w ACADEA", "Countries available with ACADEA"),
        items: countries.map((country) => ({
          name: isEnglish ? countryContentEn[country.slug]?.name ?? country.name : country.name,
          path: localizePath(`/kraje/${country.slug}`),
        })),
      }),
    ],
  });

  return (
    <div className="w-full pt-24 md:pt-28 pb-12 md:pb-16 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 items-center mb-10 md:mb-14">
          <div className="max-w-xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold text-primary mb-6"
            >
              {t("Swiat stoi przed Toba otworem", "The world is open to you")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-gray-600"
            >
              {t(
                "Pomagamy w aplikacji do ponad 25 krajow na swiecie. Kazdy z nich ma swoj specyficzny system edukacji, wymagania i terminy. Obroc globus lub wybierz kraj ponizej, aby poznac uczelnie, na ktore mozemy wspolnie zaaplikowac.",
                "We support applications to more than 25 countries worldwide. Each destination has its own admissions system, deadlines and expectations. Spin the globe or choose a country below to explore the universities we can apply to together.",
              )}
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <Suspense fallback={<div className="h-[520px] w-full max-w-[520px] rounded-full bg-primary/5" />}>
              <GlobeSection />
            </Suspense>
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {countries.map((country) => {
            const translated = countryContentEn[country.slug];
            const title = isEnglish ? translated?.name ?? country.name : country.name;
            const tagline = isEnglish ? translated?.tagline ?? country.tagline : country.tagline;
            return (
              <motion.div
                key={country.slug}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Link
                  href={localizePath(`/kraje/${country.slug}`)}
                  className="block h-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                      <img
                        src={`https://flagcdn.com/w80/${country.code}.png`}
                        alt={isEnglish ? `${title} flag` : `Flaga ${title}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors">{title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{tagline}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:gap-2.5 transition-all">
                    {t("Zobacz uczelnie", "See universities")} <ArrowRight size={15} />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-12 md:mt-16 pt-10 md:pt-12 border-t border-gray-200 text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">
            {t("Nie wiesz, ktory kraj wybrac?", "Not sure which country to choose?")}
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            {t(
              "Podczas pierwszej bezplatnej konsultacji przeanalizujemy Twoj profil i doradzimy, ktory kraj i system edukacji najlepiej odpowiada Twoim oczekiwaniom.",
              "During a free first consultation, we can review your profile and advise which country and education system fit your goals best.",
            )}
          </p>
          <Link href={localizePath("/umow-spotkanie")}>
            <Button size="lg" className="rounded-full px-8">
              {t("Umow darmowa konsultacje", "Book a free consultation")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
