import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Search, PenTool, Send, Home as HomeIcon, BookOpen } from "lucide-react";
import { Link } from "wouter";

const steps = [
  {
    id: "profilowanie-i-wybor-uczelni",
    icon: Search,
    title: "1. Profilowanie i wybór uczelni",
    desc: "Zaczynamy od dogłębnego poznania Twoich pasji, mocnych stron i oczekiwań. Analizujemy wyniki w nauce i budżet. Wspólnie tworzymy listę optymalnych uniwersytetów (Reach, Match, Safety).",
    color: "bg-blue-100 text-blue-600"
  },
  {
    id: "egzaminy-i-certyfikaty",
    icon: BookOpen,
    title: "2. Przygotowanie do egzaminów",
    desc: "Pomagamy w przygotowaniu do egzaminów wymaganych przez uczelnie — IELTS, TOEFL, egzaminów Cambridge, SAT oraz egzaminów maturalnych. Ćwiczymy w zaplanowanym tempie, aby osiągnąć wymagane wyniki z wyprzedzeniem.",
    color: "bg-teal-100 text-teal-600"
  },
  {
    id: "przygotowanie-dokumentow",
    icon: PenTool,
    title: "3. Kompletowanie dokumentów",
    desc: "Pomagamy w zebraniu niezbędnych dokumentów: transkryptów ocen, referencji. Pracujemy nad Twoim CV (Extracurriculars) tak, aby pokazać Cię z jak najlepszej strony.",
    color: "bg-emerald-100 text-emerald-600"
  },
  {
    id: "eseje-i-personal-statement",
    icon: Check,
    title: "4. Eseje i Personal Statement",
    desc: "To najważniejszy element aplikacji. Przechodzimy przez burzę mózgów, tworzymy konspekty i przeprowadzamy wielokrotną korektę esejów, aż będą perfekcyjne. Twoja unikalna historia musi błyszczeć.",
    color: "bg-purple-100 text-purple-600"
  },
  {
    id: "aplikacja-i-formalnosci",
    icon: Send,
    title: "5. Aplikacja i Formalności",
    desc: "Wspólnie wypełniamy portale aplikacyjne (UCAS, Common App itp.). Dbamy o wszystkie terminy (deadlines), opłaty aplikacyjne oraz ewentualne wnioski o stypendia.",
    color: "bg-orange-100 text-orange-600"
  },
  {
    id: "po-przyjeciu",
    icon: HomeIcon,
    title: "6. Po przyjęciu",
    desc: "Otrzymujesz oferty! Pomagamy podjąć ostateczną decyzję. Wspieramy w procesie aplikacji o wizę studencką, rezerwacji akademika oraz zakładaniu konta bankowego.",
    color: "bg-rose-100 text-rose-600"
  }
];

export default function HowItWorks() {
  return (
    <div className="w-full pt-24 md:pt-28 pb-12 md:pb-16">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-14">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-primary mb-6"
          >
            Droga na wymarzoną uczelnię
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-600"
          >
            Aplikacja na studia za granicą to maraton, nie sprint. Zobacz, jak przeprowadzimy Cię przez cały proces — od pierwszego pomysłu aż po wyjazd.
          </motion.p>
        </div>

        {/* Steps */}
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

        {/* Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 md:mt-16 max-w-4xl mx-auto bg-gray-50 rounded-3xl p-8 md:p-12 text-center border border-gray-100"
        >
          <h2 className="text-3xl font-bold text-primary mb-4">Gotowy zrobić pierwszy krok?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Najlepszy czas na rozpoczęcie przygotowań to 12-18 miesięcy przed maturą. Nie czekaj do ostatniej chwili.
          </p>
          <Link href="/kontakt" className="inline-flex justify-center">
            <Button size="lg" className="inline-flex h-14 items-center justify-center px-10 text-center text-lg rounded-full shadow-md">
              Zacznijmy przygotowania <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
