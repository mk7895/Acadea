import { motion, type Variants } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const articles = [
  {
    slug: "studia-w-holandii",
    title: "Studia w Holandii — przewodnik dla polskich maturzystów",
    excerpt:
      "Holandia to jedno z najlepszych miejsc na studia w Europie. Dowiedz się, jak wygląda aplikacja, jakie są koszty życia i które uczelnie warto rozważyć.",
    category: "Kraje",
    country: "Holandia",
    readTime: "8 min",
    date: "12 maja 2025",
    image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80",
  },
  {
    slug: "jak-napisac-esej-uczelniany",
    title: "Jak napisać esej uczelniany, który wyróżni Cię z tłumu?",
    excerpt:
      "Personal statement to Twoja wizytówka — jeden dokument, który może zdecydować o przyjęciu lub odrzuceniu. Oto sprawdzone strategie, które stosujemy z naszymi studentami.",
    category: "Poradniki",
    country: null,
    readTime: "12 min",
    date: "3 maja 2025",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80",
  },
  {
    slug: "studia-w-niemczech",
    title: "Bezpłatne studia w Niemczech — jak to możliwe i jak aplikować?",
    excerpt:
      "Niemcy oferują jedne z najlepszych uczelni technicznych na świecie — i większość studiów jest tam bezpłatna nawet dla zagranicznych studentów. Sprawdź, co musisz wiedzieć.",
    category: "Kraje",
    country: "Niemcy",
    readTime: "10 min",
    date: "25 kwietnia 2025",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80",
  },
  {
    slug: "list-motywacyjny-vs-personal-statement",
    title: "List motywacyjny a personal statement — jaka jest różnica?",
    excerpt:
      "Wiele osób myli te dwa dokumenty. Tymczasem różnią się strukturą, tonem i przeznaczeniem. Dowiedz się, kiedy piszesz co — i jak unikać najczęstszych błędów.",
    category: "Poradniki",
    country: null,
    readTime: "7 min",
    date: "18 kwietnia 2025",
    image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&q=80",
  },
  {
    slug: "studia-w-hiszpanii",
    title: "Studia w Hiszpanii — słońce, kultura i dyplom uznawany w całej Europie",
    excerpt:
      "Madryt, Barcelona, Sewilla — Hiszpania to nie tylko turystyka. To kraj z doskonałymi uczelniami i rosnącym rynkiem pracy dla absolwentów. Oto jak tam trafić.",
    category: "Kraje",
    country: "Hiszpania",
    readTime: "9 min",
    date: "10 kwietnia 2025",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
  },
  {
    slug: "stypendium-zagraniczne-jak-zdobyc",
    title: "Jak zdobyć stypendium na studia za granicą? Kompletny poradnik",
    excerpt:
      "Stypendia, granty, programy wymiany — istnieje wiele sposobów na sfinansowanie zagranicznych studiów. Poznaj najważniejsze z nich i dowiedz się, jak skutecznie aplikować.",
    category: "Stypendia",
    country: null,
    readTime: "14 min",
    date: "1 kwietnia 2025",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
  },
];

const categories = ["Wszystkie", "Kraje", "Poradniki", "Stypendia"];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Blog() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="pt-28 pb-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-6 uppercase tracking-widest border border-primary/15">
              <BookOpen size={13} />
              <span>Baza Wiedzy</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
              Wszystko, co musisz wiedzieć<br className="hidden md:block" /> o <span className="text-primary">studiach za granicą</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
              Przewodniki, poradniki i artykuły pisane przez ekspertów ACADEA — żebyś podejmował decyzje ze świadomością, a nie ze strachem.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-white border-b border-gray-100 sticky top-[60px] z-30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-2 overflow-x-auto py-4 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                data-testid={`filter-${cat.toLowerCase()}`}
                className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                  cat === "Wszystkie"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          {/* Featured */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="group relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative h-64 lg:h-auto overflow-hidden">
                  <img
                    src={articles[0].image}
                    alt={articles[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent lg:bg-gradient-to-t" />
                </div>
                <div className="p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-5">
                    <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border-none font-semibold">
                      {articles[0].category}
                    </Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {articles[0].readTime}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 leading-tight group-hover:text-accent transition-colors">
                    {articles[0].title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-8">{articles[0].excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{articles[0].date}</span>
                    <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm group-hover:text-accent transition-colors">
                      Czytaj dalej <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rest of articles */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {articles.slice(1).map((article, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                data-testid={`article-card-${i}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-primary hover:bg-white border-none font-semibold text-xs shadow-sm">
                      {article.category}
                    </Badge>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                    <Clock size={12} />
                    <span>{article.readTime}</span>
                    <span className="mx-1">·</span>
                    <span>{article.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-3 leading-snug group-hover:text-accent transition-colors flex-1">
                    {article.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                    {article.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:text-accent transition-colors mt-auto">
                    Czytaj dalej <ChevronRight size={14} />
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-primary rounded-3xl p-10 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent blur-[80px]" />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Nie przegap nowych artykułów
              </h2>
              <p className="text-gray-300 mb-8">
                Zapisz się na newsletter i otrzymuj nowe poradniki, aktualności o uczelniach i informacje o stypendialnych prosto na skrzynkę.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Twój adres e-mail"
                  data-testid="input-newsletter-email"
                  className="flex-1 h-12 px-5 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                />
                <button
                  data-testid="button-newsletter-subscribe"
                  className="h-12 px-7 rounded-full bg-accent text-primary font-bold text-sm hover:bg-white transition-colors shrink-0"
                >
                  Zapisz się
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
