import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Globe, GraduationCap, MapPin, Users } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="/images/hero-students.jpg"
            alt="Students on campus"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-8">
                <Globe size={16} className="text-accent" />
                <span>Twój przewodnik po światowej edukacji</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6 font-sans">
                Aplikacja na studia za granicą <br />
                <span className="text-accent">— z nami to proste.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
                Pomagamy polskim uczniom dostać się na wymarzone uczelnie w ponad 15 krajach. Kompleksowe wsparcie na każdym etapie aplikacji.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/kontakt">
                  <Button size="lg" className="h-14 px-8 text-base bg-accent text-primary hover:bg-white transition-colors border-none rounded-full w-full sm:w-auto font-bold">
                    Bezpłatna Konsultacja
                  </Button>
                </Link>
                <Link href="/jak-to-dziala">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base text-white border-white/30 hover:bg-white/10 hover:text-white rounded-full w-full sm:w-auto backdrop-blur-sm">
                    Jak to działa?
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center px-4 py-4 md:py-0"
            >
              <MapPin className="text-accent w-8 h-8 mb-3" />
              <h3 className="text-4xl font-bold text-primary mb-2">15+</h3>
              <p className="text-gray-500 font-medium">Krajów w ofercie</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center text-center px-4 py-4 md:py-0"
            >
              <CheckCircle2 className="text-accent w-8 h-8 mb-3" />
              <h3 className="text-4xl font-bold text-primary mb-2">95%+</h3>
              <p className="text-gray-500 font-medium">Skuteczność kandydatów</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center text-center px-4 py-4 md:py-0"
            >
              <Users className="text-accent w-8 h-8 mb-3" />
              <h3 className="text-4xl font-bold text-primary mb-2">Setki</h3>
              <p className="text-gray-500 font-medium">Studentów za granicą</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-6">W czym Ci pomożemy?</h2>
            <p className="text-lg text-gray-600">
              Aplikacja na studia to proces, który wymaga strategii. Przeprowadzimy Cię przez niego krok po kroku.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Doradztwo uczelni",
                desc: "Pomożemy wybrać uczelnię dopasowaną do Twoich celów, predyspozycji i budżetu.",
                icon: <GraduationCap size={24} className="text-primary" />
              },
              {
                title: "Przygotowanie dokumentów",
                desc: "Wspieramy przy każdym etapie aplikacji — od transkryptów po referencje.",
                icon: <CheckCircle2 size={24} className="text-primary" />
              },
              {
                title: "Eseje i motywacje",
                desc: "Piszemy razem, żeby wyróżnić Cię spośród tysięcy kandydatów. Twoja historia jest najważniejsza.",
                icon: <Users size={24} className="text-primary" />
              },
              {
                title: "Tłumaczenia i legalizacja",
                desc: "Zajmujemy się żmudnymi formalnościami, żebyś Ty mógł skupić się na nauce.",
                icon: <Globe size={24} className="text-primary" />
              },
              {
                title: "Wizy i zakwaterowanie",
                desc: "Nie zostawiamy Cię samego po przyjęciu. Pomożemy odnaleźć się w nowym kraju.",
                icon: <MapPin size={24} className="text-primary" />
              }
            ].map((service, i) => (
              <motion.div key={i} variants={itemVariants} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/10 transition-colors">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-primary text-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-accent rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Zacznijmy Twoją drogę.</h2>
            <p className="text-xl text-gray-300 mb-10">
              Umów się na bezpłatną konsultację. Opowiesz nam o swoich celach, a my powiemy Ci, jak je osiągnąć.
            </p>
            <Link href="/kontakt">
              <Button size="lg" className="h-14 px-10 text-lg bg-accent text-primary hover:bg-white transition-colors border-none rounded-full font-bold shadow-lg shadow-accent/20">
                Zarezerwuj spotkanie <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
