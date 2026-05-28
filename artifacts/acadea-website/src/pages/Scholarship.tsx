import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Heart, BookOpen, GraduationCap, Star, Users } from "lucide-react";
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

const testimonials = [
  {
    name: "Marta K.",
    school: "TU Delft, Holandia",
    quote:
      "Dzięki stypendium ACADEA mogłam skupić się w pełni na aplikacji, zamiast martwić się o koszty. Teraz jestem na wymarzonych studiach inżynierskich.",
    year: "Stypendystka 2024",
  },
  {
    name: "Tomasz W.",
    school: "University of Edinburgh, Wielka Brytania",
    quote:
      "Nie myślałem, że mnie na to stać. ACADEA pokazało, że możliwe jest coś, co wydawało się odległym marzeniem.",
    year: "Stypendysta 2023",
  },
  {
    name: "Zofia R.",
    school: "Sciences Po, Francja",
    quote:
      "Program stypendialny zmienił moje życie. Jestem wdzięczna każdemu, kto zdecydował się na usługi ACADEA — wspieraliście mnie nawet o tym nie wiedząc.",
    year: "Stypendystka 2024",
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
              <Link href="/kontakt">
                <Button
                  size="lg"
                  data-testid="button-scholarship-cta"
                  className="h-14 px-8 text-base bg-accent text-primary hover:bg-white transition-colors border-none rounded-full font-bold"
                >
                  Zacznij z ACADEA <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
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
              <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">Jak to działa?</h2>
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

      {/* Stats */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          >
            {[
              { value: "40+", label: "Stypendystów od początku programu", icon: <Users size={28} className="text-accent" /> },
              { value: "12", label: "Krajów, gdzie uczą się nasi stypendyści", icon: <GraduationCap size={28} className="text-accent" /> },
              { value: "100%", label: "Transparentność — każdy widzi, dokąd trafiają środki", icon: <Heart size={28} className="text-accent" /> },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants} className="flex flex-col items-center">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-5">
                  {stat.icon}
                </div>
                <div className="text-5xl font-bold text-white mb-3">{stat.value}</div>
                <p className="text-gray-300 leading-relaxed max-w-xs">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-primary mb-6">Głosy naszych stypendystów</h2>
              <p className="text-lg text-gray-600">Oni są dowodem na to, że ten model działa.</p>
            </motion.div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                data-testid={`testimonial-card-${i}`}
                className="bg-gray-50 rounded-2xl p-8 border border-gray-100"
              >
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={16} className="text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-8 italic">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-primary text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.school}</div>
                    <div className="text-xs text-accent font-semibold mt-0.5">{t.year}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Apply for scholarship CTA */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold text-primary mb-6">Chcesz ubiegać się o stypendium?</h2>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Jeśli masz wybitne wyniki, pasję do nauki i marzenia większe niż możliwości finansowe — napisz do nas. Rozpatrujemy zgłoszenia indywidualnie, z pełnym szacunkiem dla każdej historii.
            </p>
            <Link href="/kontakt">
              <Button
                size="lg"
                data-testid="button-apply-scholarship"
                className="h-14 px-10 text-base bg-primary text-white hover:bg-primary/90 rounded-full font-bold shadow-lg"
              >
                Aplikuj o stypendium <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
