import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobeSection } from "@/components/GlobeSection";
import { countries } from "@/data/countries";

export default function Countries() {
  return (
    <div className="w-full pt-28 pb-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">

        {/* Hero with globe */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="max-w-xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold text-primary mb-6"
            >
              Świat stoi przed Tobą otworem
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-gray-600"
            >
              Pomagamy w aplikacji do ponad 25 krajów na świecie. Każdy z nich ma swój specyficzny system edukacji, wymagania i terminy. Obróć globus lub wybierz kraj poniżej, aby poznać uczelnie, na które możemy wspólnie zaaplikować.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <GlobeSection />
          </motion.div>
        </div>

        {/* Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {countries.map((country) => (
            <motion.div
              key={country.slug}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <Link
                href={`/kraje/${country.slug}`}
                className="block h-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                    <img
                      src={`https://flagcdn.com/w80/${country.code}.png`}
                      alt={`Flaga ${country.name}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors">{country.name}</h3>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{country.tagline}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:gap-2.5 transition-all">
                  Zobacz uczelnie <ArrowRight size={15} />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <div className="mt-20 pt-16 border-t border-gray-200 text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Nie wiesz, który kraj wybrać?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Podczas pierwszej bezpłatnej konsultacji przeanalizujemy Twój profil i doradzimy, który kraj i system edukacji najlepiej odpowiada Twoim oczekiwaniom.
          </p>
          <Link href="/kontakt">
            <Button size="lg" className="rounded-full px-8">Umów darmową konsultację</Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
