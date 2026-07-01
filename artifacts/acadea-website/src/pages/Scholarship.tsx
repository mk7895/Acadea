import { motion, type Variants } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Heart,
  PlayCircle,
  Clock,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const criteria = [
  {
    title: "Wybitne wyniki i osiągnięcia",
    desc: "Szukamy osób z pasją — oceny są istotne, ale równie ważne są Twoja motywacja, determinacja i to, co robisz poza szkołą.",
  },
  {
    title: "Wielkie marzenia i plany na przyszłość",
    desc: "Chcesz studiować za granicą, latać samolotami, tańczyć albo rozwijać zupełnie inną dziedzinę? Pomożemy Ci zaplanować własną ścieżkę.",
  },
];

export default function Scholarship() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="pt-24 md:pt-28 pb-10 md:pb-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.02fr)_minmax(340px,0.98fr)] gap-10 lg:gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 text-primary text-xs font-semibold mb-6 uppercase tracking-widest border border-accent/40">
                <Heart size={13} className="fill-accent text-accent" />
                <span>Program Stypendialny ACADEA</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-[1.05] tracking-tight mb-5">
                Twoja pasja.<br />
                <span className="text-primary">Nasze wsparcie.</span>
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mb-8 md:mb-10">
                Program Stypendialny ACADEA to mentoring i wsparcie dla ambitnych, zmotywowanych osób — niezależnie od tego, czy marzą o studiach za granicą, czy chcą rozwijać inną pasję, jak lotnictwo czy taniec. Pomagamy świadomie wybrać i podążać własną ścieżką.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#konkurs">
                  <Button
                    size="lg"
                    data-testid="button-scholarship-hero-cta"
                    className="h-14 px-8 text-base bg-primary text-white hover:bg-gray-900 transition-colors border-none rounded-full font-bold"
                  >
                    Zobacz konkurs stypendialny <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="relative flex justify-center xl:justify-end xl:-translate-x-20"
            >
              <div className="w-full max-w-[340px] rounded-[32px] border border-primary/10 bg-gradient-to-br from-primary/[0.04] via-white to-accent/10 p-4 md:p-5 shadow-[0_22px_60px_rgba(22,101,52,0.08)]">
                <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary to-primary/85 aspect-[9/16]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,188,30,0.30),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_32%)]" />
                  <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 text-center text-white px-6">
                    <PlayCircle size={64} className="text-accent drop-shadow-[0_10px_30px_rgba(0,0,0,0.2)]" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent/90 mb-2">
                        Placeholder wideo
                      </p>
                      <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                        Miejsce na film o programie stypendialnym
                      </h2>
                    </div>
                    <span className="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 border border-white/20">
                      9:16
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
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
              <span>Zgłoszenia do: 10 lipca 2026</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission statement */}
      <section className="py-12 md:py-14 bg-white">
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
              <blockquote className="text-2xl md:text-3xl font-bold text-primary leading-snug mb-3">
                „Edukacja jest najpotężniejszą bronią, której możesz użyć, aby zmienić świat.”
              </blockquote>
              <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-6">
                — Nelson Mandela
              </p>
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                Wierzymy w to każdego dnia. Dlatego stworzyliśmy program, który daje ambitnym, zmotywowanym osobom dostęp do mentoringu i wsparcia w realizacji ich marzeń — niezależnie od tego, skąd pochodzą i jaką ścieżkę wybiorą.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Competition section */}
      <section
        className="py-12 md:py-16 relative overflow-hidden"
        style={{ backgroundColor: "rgb(28, 61, 47)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-10 h-72 w-72 rounded-full bg-[#fcbc1e]/18 blur-[8px]" />
          <div className="absolute bottom-10 left-[8%] h-56 w-56 rounded-full bg-[#fcbc1e]/12 blur-[6px]" />
          <div className="absolute top-[34%] right-[18%] h-40 w-40 rounded-full bg-[#fcbc1e]/10 blur-[4px]" />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Konkurs Stypendialny ACADEA
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                Szukamy ambitnych, zmotywowanych osób z pasją — niezależnie od tego, czy marzą o studiach za granicą, czy chcą rozwijać swoje zainteresowania, takie jak lotnictwo, taniec czy nauka. To program mentoringowy, w którym pomagamy świadomie wybrać i podążać własną ścieżką.
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
                  <div className="text-sm font-semibold uppercase tracking-widest mb-2 text-primary/70">Zgłoszenia</div>
                  <div className="text-3xl md:text-4xl font-bold">Rozpatrywane na bieżąco</div>
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
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold text-primary mb-6">Aplikuj o stypendium</h2>
            <p className="text-lg text-gray-600 mb-4 leading-relaxed">
              Jeśli masz wybitne wyniki, pasję i wielkie marzenia, ten konkurs jest dla Ciebie.
            </p>
            <p className="text-base text-gray-500 mb-10">
              Wypełnij formularz. Zgłoszenia rozpatrujemy z indywidualną uwagą dla każdej historii.
            </p>
            <Link href="/stypendium/aplikacja">
              <Button
                size="lg"
                data-testid="button-apply-scholarship"
                className="h-14 px-10 text-base bg-primary text-white hover:bg-primary/90 rounded-full font-bold shadow-lg"
              >
                Wypełnij formularz <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-gray-400 mt-5">
              Wypełnienie formularza zajmuje kilka minut.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
