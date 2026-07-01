import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

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
              src="/images/hero-students.jpg" 
              alt="Studenci na zagranicznej uczelni" 
              className="w-full h-full object-cover"
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
              Eksperci, którzy sami przeszli przez proces aplikacji na studia za granicą i teraz pomagają innym. Doświadczeni tutorzy, którzy od lat pomagają uczniom rozwijać płynność, poprawność oraz pewność w komunikacji.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Marlena Sołtysińska",
                role: "Mentorka",
                desc: "Absolwentka UCL (Education and Technology) i NYU. Od ponad 5 lat wspiera uczniów na każdym etapie procesu aplikacyjnego.",
                initials: "MS",
                linkedin: "https://www.linkedin.com/in/marlena-soltysinska/",
                color: "#166534",
              },
              {
                name: "Mateusz Klepacki",
                role: "Mentor",
                desc: "Absolwent LSE (Econometrics and Mathematical Economics) i NYU. Ma za sobą 100+ udanych współprac.",
                initials: "MK",
                linkedin: "https://www.linkedin.com/in/mateusz-klepacki/",
                color: "#14532d",
              },
              {
                name: "Weronika Klepacka",
                role: "Tutorka",
                desc: "Przygotowuje do IELTS, TOEFL i egzaminów Cambridge — krok po kroku, bez stresu.",
                initials: "WK",
                linkedin: "https://www.linkedin.com/in/weronika-klepacka-7349b51b6",
                color: "#166534",
              },
              {
                name: "Bartosz Kuźma",
                role: "Tutor",
                desc: "Nauczyciel języka angielskiego z certyfikatem TEFL, absolwent prawa.",
                initials: "BK",
                linkedin: "https://www.linkedin.com/in/bartosz-ku%C5%BAma-243945259/",
                color: "#14532d",
              },
            ].map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-44 h-44 rounded-full overflow-hidden mb-5 shadow-lg ring-4 ring-white">
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-bold text-4xl select-none"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initials}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-primary mb-0.5">{member.name}</h3>
                <p className="text-accent font-semibold text-sm mb-2">{member.role}</p>
                <p className="text-gray-500 text-sm leading-relaxed mb-4 max-w-[200px]">{member.desc}</p>
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/60 hover:text-primary transition-colors border border-primary/20 hover:border-primary rounded-full px-4 py-1.5"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/kontakt">
            <Button size="lg" className="rounded-full px-10 h-14 text-lg">
              Poznajmy się
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
