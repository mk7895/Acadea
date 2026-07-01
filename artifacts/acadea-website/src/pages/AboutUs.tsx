import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";

const featuredFounders = [
  {
    name: "Marlena Sołtysińska",
    imageSrc: "/images/about-soltysinska.jpg",
    imagePosition: "object-[50%_35%]",
    imageOrder: "md:order-1",
    textOrder: "md:order-2",
    description:
      "Studentka University College London, od ponad 10 lat pierwszego na świecie uniwersytetu z Nauk o Edukacji. Założycielka Fundacji Acadea, pasjonatka implementowania nowych technologii, szczególnie w edukacji. W 2025 roku z wyróżnieniem ukończyła Bachelor of Science na Uniwersytecie Nowojorskim (NYU), w trakcie którego w aż pięciu krajach studiowała Finanse, Ekonomię oraz Język Chiński. Swoje prace prezentowała na międzynarodowych konferencjach naukowych. Wyróżniona w programach takich jak Liderzy Innowacji Kancelarii Prezesa Rady Ministrów, Krajowy Fundusz na rzecz Dzieci oraz ADAMED SmartUP. Ma na koncie liczne sukcesy w olimpiadach i konkursach, działała w Radzie Dzieci i Młodzieży przy Ministrze Edukacji i Nauki oraz Radzie Młodzieżowej Województwa Zachodniopomorskiego. Wspierając małe ojczyzny i początkujących dziennikarzy, współprzewodniczyła Ogólnopolskiej Federacji Młodych i Fundacji Polemika. Od pięciu lat Marlena pomaga innym dostać się na ich wymarzone studia - ma za sobą udane współprace z setkami aplikantów, a jej podopieczni otrzymali oferty z topowych uczelni na całym świecie.",
  },
  {
    name: "Mateusz Klepacki",
    imageSrc: "/images/about-klepacki.jpg",
    imagePosition: "object-[50%_22%]",
    imageOrder: "md:order-2",
    textOrder: "md:order-1",
    description:
      "Absolwent London School of Economics, gdzie ukończył MSc Econometrics and Mathematical Economics, oraz New York University, na którym studiował Business and Finance oraz Economics. Alumn I.S.E.O. Summer School i Akademii Liderów Rynku Kapitałowego, w trakcie swojej ścieżki akademickiej i zawodowej zdobywał doświadczenie na styku analizy, strategii i finansów, był pracownikiem zarówno Boston Consulting Group, jak i zeb consulting. Za swoje wyniki był wielokrotnie wyróżniany akademicko, a wcześniej odnosił liczne sukcesy w olimpiadach i konkursach, w tym jako podwójny laureat Olimpiady Statystycznej i finalista Olimpiady Wiedzy Ekonomicznej. Angażował się również społecznie, między innymi jako członek Rady Krajowej Ogólnopolskiej Federacji Młodych. Od pięciu lat pomaga kandydatom dostawać się na studia w bardzo różnych systemach edukacyjnych - od Stanów Zjednoczonych po Koreę Południową i od Finlandii po Maltę. Ma za sobą setki godzin pracy z aplikantami i wspiera ich w budowaniu strategii, profilu oraz decyzji, które realnie otwierają drzwi do światowych uczelni.",
  },
];

export default function AboutUs() {
  return (
    <div className="w-full pt-28 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Byliśmy tam, gdzie Ty jesteś teraz.
            </h1>
            <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
              <p>
                Założyliśmy ACADEA, ponieważ sami kiedyś przeszliśmy przez stresujący i skomplikowany proces aplikacji na zagraniczne uczelnie.
              </p>
              <p>
                Sami gubiliśmy się w gąszczu wymagań, portali aplikacyjnych, egzaminów językowych i terminów. Z biegiem lat nauczyliśmy się, co naprawdę znaczy doskonały esej, a wymagania kolejnych uczelni przestały mieć przed nami jakiekolwiek tajemnice.
              </p>
              <p className="font-semibold text-primary">
                Od ponad 5 lat prowadzimy kolejne roczniki ambitnych uczniów za rękę — dokładnie tak, jak sami chcielibyśmy zostać wtedy poprowadzeni.
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
              alt="Zespół ACADEA" 
              className="w-full h-full object-cover object-[38%_center]"
            />
            <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
          </motion.div>
        </div>

        {/* Values */}
        <div className="bg-gray-50 border border-gray-100 rounded-3xl p-10 md:p-16 mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Nasze wartości</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Tym kierujemy się w codziennej pracy z naszymi podopiecznymi.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "Szczerość",
                desc: "Nie obiecujemy gruszek na wierzbie. Realnie oceniamy Twoje szanse i doradzamy najlepsze, a nie najdroższe rozwiązania."
              },
              {
                title: "Indywidualność",
                desc: "Nie pracujemy na szablonach. Każdy uczeń to inna historia, inne pasje i inne cele. Twój profil będzie w 100% Twój."
              },
              {
                title: "Wsparcie 360°",
                desc: "Jesteśmy z Tobą od pierwszego pomysłu aż po wniesienie walizek do akademika. Nie zostawiamy Cię z problemami samemu sobie."
              }
            ].map((value, idx) => (
              <motion.div 
                key={idx}
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

        {/* Team */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">Nasz zespół</h2>
            <p className="max-w-3xl mx-auto text-gray-500 leading-relaxed">
              Poznaj osoby, które zbudowały ACADEA na własnych doświadczeniach aplikacyjnych i od lat prowadzą kolejnych uczniów przez ten proces.
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
                className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-14"
              >
                <div className={`${member.imageOrder} flex w-full justify-center md:justify-start`}>
                  <div className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-full border border-primary/10 bg-[#f8f4ec] shadow-[0_20px_60px_rgba(22,101,52,0.08)]">
                    <img
                      src={member.imageSrc}
                      alt={member.name}
                      className={`h-full w-full object-cover ${member.imagePosition}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/12 via-transparent to-transparent" />
                  </div>
                </div>
                <div className={`${member.textOrder} w-full`}>
                  <h3 className="mb-5 text-3xl font-bold text-primary md:text-4xl">{member.name}</h3>
                  <p className="text-base leading-8 text-gray-600 md:text-lg">{member.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-14 mt-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-semibold mb-6">
              <Users size={16} />
              <span>Dołącz do zespołu</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Chcesz wspierać uczniów razem z ACADEA?
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto mb-8">
              Jeśli studiujesz za granicą albo masz już ten etap za sobą i chcesz pomagać kolejnym osobom przejść przez aplikację spokojniej i mądrzej, chętnie Cię poznamy.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/mentoruj">
                <Button size="lg" className="rounded-full px-8 h-14 text-base bg-primary text-white hover:bg-primary/90 font-bold">
                  Aplikuj do zespołu <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/kontakt">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base">
                  Poznajmy się
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
