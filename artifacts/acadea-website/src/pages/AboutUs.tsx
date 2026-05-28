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
                Wiemy, jak to jest gubić się w gąszczu wymagań, portali aplikacyjnych, egzaminów językowych i terminów. Wiemy też, jak to jest nie mieć pewności, czy Twój esej jest wystarczająco dobry, albo czy dobrze zinterpretowałeś wymagania konkretnego uniwersytetu.
              </p>
              <p className="font-semibold text-primary">
                Dziś naszym celem jest ułatwienie tej drogi kolejnym rocznikom ambitnych uczniów.
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
              src="/images/consultation.jpg" 
              alt="Mentor rozmawiający z uczniem" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
          </motion.div>
        </div>

        {/* Values */}
        <div className="bg-primary text-white rounded-3xl p-10 md:p-16 mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nasze wartości</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">Tym kierujemy się w codziennej pracy z naszymi podopiecznymi.</p>
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
                className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm border border-white/10"
              >
                <h3 className="text-xl font-bold text-accent mb-3">{value.title}</h3>
                <p className="text-gray-300">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team Placeholder */}
        <div className="mb-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-12">Nasz zespół</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((member, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="w-48 h-48 rounded-full overflow-hidden mb-4 bg-gray-100 border-4 border-white shadow-lg">
                  <img 
                    src={idx === 0 ? "/images/team-1.jpg" : `https://api.dicebear.com/7.x/notionists/svg?seed=Acadea${idx}&backgroundColor=e2e8f0`} 
                    alt={`Członek zespołu ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-primary">Doradca Edukacyjny</h3>
                <p className="text-gray-500 text-sm">Absolwent uczelni zagranicznej</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/kontakt">
            <Button size="lg" className="rounded-full px-10 h-14 text-lg">
              Poznajmy się osobiście
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
