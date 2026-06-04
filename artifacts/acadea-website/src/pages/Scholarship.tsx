import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Heart, BookOpen, GraduationCap, Star, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const howItWorks = [
  {
    step: "01",
    title: "Kupujesz nasze usługi",
    desc: "Każdy pakiet doradztwa ACADEA — od konsultacji po pełne wsparcie aplikacyjne — zawiera wbudowany wkład w fundusz stypendialny.",
    icon: <GraduationCap size={28} className="text-accent" />,
  },
  {
    step: "02",
    title: "Część środków trafia do funduszu",
    desc: "Automatycznie przekazujemy część każdej opłaty do naszego wewnętrznego Funduszu Stypendialnego ACADEA. Bez dodatkowych działań z Twojej strony.",
    icon: <Heart size={28} className="text-accent" />,
  },
  {
    step: "03",
    title: "Fundusz wspiera zdolnych uczniów",
    desc: "Co roku przyznajemy stypendia uczniom o wysokim potencjale, którzy nie mają środków na studia za granicą. Twój wybór im to umożliwia.",
    icon: <Star size={28} className="text-accent" />,
  },
  {
    step: "04",
    title: "Więcej studentów na świecie",
    desc: "Każdy rok to nowi stypendyści, nowe uczelnie, nowe możliwości. Razem budujemy pokolenie wykształconych Polaków na arenie międzynarodowej.",
    icon: <BookOpen size={28} className="text-accent" />,
  },
];

const criteria = [
  {
    title: "Wybitne wyniki w nauce",
    desc: "Szukamy uczniów z pasją do nauki — oceny są ważne, ale jeszcze ważniejsza jest motywacja i determinacja.",
  },
  {
    title: "Marzenia większe niż możliwości finansowe",
    desc: "Program jest skierowany do osób, dla których koszty byłyby główną przeszkodą w realizacji celu.",
  },
  {
    title: "Jasny cel edukacyjny",
    desc: "Wiemy, gdzie chcesz studiować i dlaczego — albo jesteś gotowy to odkryć razem z nami.",
  },
  {
    title: "Obywatelstwo lub rezydencja polska",
    desc: "Konkurs skierowany jest do polskich uczniów planujących studia za granicą.",
  },
];

export default function Scholarship() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative bg-primary pt-36 pb-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-accent blur-[140px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-400 blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium mb-8">
              <Heart size={16} className="text-accent" />
              <span>Program Stypendialny ACADEA</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
              Korzystasz z naszych usług.<br />
              <span className="text-accent">Wspierasz czyjś sen.</span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mb-10">
              Każda osoba, która wybiera ACADEA, automatycznie przyczynia się do funduszu stypendialnego, który otwiera drzwi do światowych uczelni uczniom, których na to nie stać.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#konkurs">
                <Button
                  size="lg"
                  data-testid="button-scholarship-hero-cta"
                  className="h-14 px-8 text-base bg-accent text-primary hover:bg-white transition-colors border-none rounded-full font-bold"
                >
                  Zobacz konkurs stypendialny <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Deadline banner */}
      <section id="konkurs" className="bg-accent py-5">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 text-primary text-center"
          >
            <div className="flex items-center gap-2 font-bold text-lg">
              <Calendar size={22} className="shrink-0" />
              <span>Nabór do I edycji Konkursu Stypendialnego ACADEA</span>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 rounded-full px-5 py-2 font-bold text-base">
              <Clock size={18} className="shrink-0" />
              <span>Zgłoszenia do: 20 czerwca 2025</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission statement */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-accent/5 border border-accent/20 rounded-3xl p-10 md:p-16 text-center"
            >
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Heart size={32} className="text-accent" />
              </div>
              <blockquote className="text-2xl md:text-3xl font-bold text-primary leading-snug mb-6">
                "Wierzymy, że wykształcenie nie powinno być przywilejem. Powinno być prawem."
              </blockquote>
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                Dlatego zbudowaliśmy model, w którym każdy klient ACADEA jest jednocześnie mecenasem edukacji. Kiedy inwestujesz w siebie — inwestujesz też w kogoś, dla kogo ta szansa mogłaby nigdy nie nadejść.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">Jak działa fundusz?</h2>
              <p className="text-lg text-gray-600">
                Model jest prosty. Przejrzysty. I autentyczny.
              </p>
            </motion.div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            {howItWorks.map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                data-testid={`scholarship-step-${i}`}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-accent tracking-widest uppercase mb-2 block">
                      Krok {item.step}
                    </span>
                    <h3 className="text-xl font-bold text-primary mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Competition section */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-semibold mb-8">
                <Star size={16} className="fill-accent" />
                <span>I Edycja — 2025</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Konkurs Stypendialny ACADEA
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                Ogłaszamy pierwszą edycję naszego konkursu stypendialnego. Szukamy ambitnych polskich uczniów, którzy marzą o studiach za granicą, ale potrzebują wsparcia, żeby ten sen stał się rzeczywistością.
              </p>
            </motion.div>

            {/* Deadline card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-accent rounded-3xl p-8 md:p-12 text-primary text-center mb-12"
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-widest mb-2 text-primary/70">Termin zgłoszeń</div>
                  <div className="text-4xl md:text-5xl font-bold">20 czerwca 2025</div>
                </div>
                <div className="hidden md:block w-px h-16 bg-primary/20" />
                <div>
                  <div className="text-sm font-semibold uppercase tracking-widest mb-2 text-primary/70">Edycja</div>
                  <div className="text-4xl md:text-5xl font-bold">I / 2025</div>
                </div>
                <div className="hidden md:block w-px h-16 bg-primary/20" />
                <div>
                  <div className="text-sm font-semibold uppercase tracking-widest mb-2 text-primary/70">Forma</div>
                  <div className="text-2xl md:text-3xl font-bold">Online</div>
                </div>
              </div>
            </motion.div>

            {/* Criteria */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {criteria.map((c, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  data-testid={`criterion-${i}`}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <h3 className="text-white font-bold text-lg mb-2">{c.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{c.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold text-primary mb-6">Aplikuj o stypendium</h2>
            <p className="text-lg text-gray-600 mb-4 leading-relaxed">
              Jeśli masz wybitne wyniki, pasję do nauki i marzenia większe niż możliwości finansowe — to konkurs dla Ciebie.
            </p>
            <p className="text-base text-gray-500 mb-10">
              Nabór trwa do <strong className="text-primary">20 czerwca 2025</strong>. Napisz do nas — rozpatrujemy zgłoszenia indywidualnie, z pełnym szacunkiem dla każdej historii.
            </p>
            <Link href="/kontakt">
              <Button
                size="lg"
                data-testid="button-apply-scholarship"
                className="h-14 px-10 text-base bg-primary text-white hover:bg-primary/90 rounded-full font-bold shadow-lg"
              >
                Aplikuj teraz <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-gray-400 mt-5">
              W tytule wiadomości wpisz: "Konkurs Stypendialny ACADEA 2025"
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
