import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { countries, getLocalizedCountry } from "@/data/countries";
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

export default function Countries() {
  const { isEnglish, localizePath, t } = useLanguage();

  useSeo({
    title: t("Kraje i uczelnie za granicą | ACADEA", "Countries and universities abroad | ACADEA"),
    description: t(
      "Poznaj kraje i uczelnie, do których pomagamy aplikować. Sprawdź wymagania, kierunki i możliwości studiowania za granicą z ACADEA.",
      "Discover the countries and universities we help students apply to. Explore requirements, degree options and opportunities for studying abroad with ACADEA.",
    ),
    path: localizePath("/kraje"),
    keywords: isEnglish
      ? ["countries to study abroad", "universities abroad", "where to study abroad", "international universities"]
      : ["studia za granicą kraje", "uczelnie za granicą", "gdzie studiować za granicą", "kraje i uczelnie"],
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createCollectionPageSchema({
        path: localizePath("/kraje"),
        title: t("Kraje i uczelnie za granicą | ACADEA", "Countries and universities abroad | ACADEA"),
        description: t(
          "Przegląd krajów i uczelni, do których pomagamy aplikować w ramach doradztwa ACADEA.",
          "An overview of the countries and universities we help students apply to as part of ACADEA guidance.",
        ),
      }),
      createBreadcrumbSchema([
        { name: t("Strona Główna", "Home"), path: localizePath("/") },
        { name: t("Kraje i Uczelnie", "Countries and universities"), path: localizePath("/kraje") },
      ]),
      createItemListSchema({
        name: t("Kraje dostępne w ACADEA", "Countries available with ACADEA"),
        items: countries.map((country) => ({
          name: getLocalizedCountry(country, isEnglish ? "en" : "pl").name,
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
              {t("Świat stoi przed Tobą otworem", "The world is open to you")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-gray-600"
            >
              {t(
                "Pomagamy w aplikacji do ponad 25 krajów na świecie. Każdy z nich ma swój specyficzny system edukacji, wymagania i terminy. Obróć globus lub wybierz kraj poniżej, aby poznać uczelnie, na które możemy wspólnie zaaplikować.",
                "We help with applications to more than 25 countries around the world. Each one has its own education system, requirements and deadlines. Rotate the globe or choose a country below to discover the universities we can apply to together.",
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
            const localizedCountry = getLocalizedCountry(country, isEnglish ? "en" : "pl");
            const title = localizedCountry.name;
            const tagline = localizedCountry.tagline;
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
            {t("Nie wiesz, który kraj wybrać?", "Not sure which country to choose?")}
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            {t(
              "Podczas pierwszej bezpłatnej konsultacji przeanalizujemy Twój profil i doradzimy, który kraj i system edukacji najlepiej odpowiada Twoim oczekiwaniom.",
              "During the first free consultation, we will analyse your profile and advise which country and education system best match your expectations.",
            )}
          </p>
          <Link href={localizePath("/umow-spotkanie")}>
            <Button size="lg" className="rounded-full px-8">
              {t("Umów darmową konsultację", "Book a free consultation")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
