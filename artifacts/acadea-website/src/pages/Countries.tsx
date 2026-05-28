import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const countries = [
  { name: "Wielka Brytania", code: "gb", description: "Oksford, Cambridge i prestiżowe uniwersytety Russel Group." },
  { name: "Holandia", code: "nl", description: "Praktyczne podejście, innowacyjne programy w języku angielskim." },
  { name: "Niemcy", code: "de", description: "Bezpłatna lub tania edukacja na najwyższym poziomie." },
  { name: "Hiszpania", code: "es", description: "Kultura, doskonałe szkoły biznesowe i ciepły klimat." },
  { name: "Włochy", code: "it", description: "Sztuka, moda, design i doskonała kuchnia w przerwach od nauki." },
  { name: "Francja", code: "fr", description: "Elitarne Grandes Écoles i bogata tradycja akademicka." },
  { name: "USA / Kanada", code: "us", description: "Rozległe kampusy, ogromne możliwości badawcze i stypendia." },
  { name: "Szwajcaria", code: "ch", description: "Prestiż, bezpieczeństwo i bliskość międzynarodowych korporacji." },
  { name: "Belgia", code: "be", description: "Serce Europy, wielojęzyczność i znakomita jakość kształcenia." },
  { name: "Dania", code: "dk", description: "Zrównoważony rozwój, nowoczesność i wysokie stypendia." },
  { name: "Szwecja", code: "se", description: "Praca grupowa, innowacyjność i darmowe studia dla obywateli UE." },
  { name: "Austria", code: "at", description: "Klasyczna edukacja w pięknych, historycznych miastach." },
  { name: "Irlandia", code: "ie", description: "Angielskojęzyczny kraj UE, siedziba europejskich gigantów tech." },
  { name: "Czechy", code: "cz", description: "Wysoki poziom medycyny i kierunków technicznych." },
  { name: "Węgry", code: "hu", description: "Przystępne koszty życia i rosnąca popularność programów anglojęzycznych." },
];

export default function Countries() {
  return (
    <div className="w-full pt-28 pb-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-primary mb-6"
          >
            Świat stoi otworem
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-600"
          >
            Pomagamy w aplikacji do ponad 15 krajów na świecie. Każdy z nich ma swój specyficzny system edukacji, wymagania i terminy. Pomożemy Ci się w nich odnaleźć.
          </motion.p>
        </div>

        {/* Grid */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {countries.map((country, index) => (
            <motion.div 
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer group"
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
              <p className="text-gray-500 text-sm leading-relaxed">{country.description}</p>
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
