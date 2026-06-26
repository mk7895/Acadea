import { useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { articles } from "@/data/articles";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const categories = ["Wszystkie", "Poradniki", "Kraje", "Stypendia"] as const;
type Filter = (typeof categories)[number];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function Blog() {
  const [filter, setFilter] = useState<Filter>("Wszystkie");
  const [email, setEmail] = useState("");
  const [newsStatus, setNewsStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const visible = useMemo(
    () => (filter === "Wszystkie" ? articles : articles.filter((a) => a.category === filter)),
    [filter],
  );

  async function handleSubscribe() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    setNewsStatus("loading");
    try {
      const res = await fetch(`${BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "newsletter", email: trimmed }),
      });
      setNewsStatus(res.ok ? "ok" : "error");
    } catch {
      setNewsStatus("error");
    }
  }

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="pt-24 md:pt-28 pb-10 md:pb-12 bg-white border-b border-gray-100">
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
              Wszystko, co musisz wiedzieć<br className="hidden md:block" /> o{" "}
              <span className="text-primary">studiach za granicą</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
              Przewodniki, poradniki i artykuły przygotowane przez ekspertów ACADEA — żeby decyzje o studiach za granicą podejmować ze świadomością, a nie ze strachem.
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
                onClick={() => setFilter(cat)}
                data-testid={`filter-${cat.toLowerCase()}`}
                aria-pressed={filter === cat}
                className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                  filter === cat
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
      <section className="py-12 md:py-16 bg-gray-50 min-h-[50vh]">
        <div className="container mx-auto px-4 md:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {visible.map((article, i) => (
                <motion.div
                  key={article.slug}
                  variants={itemVariants}
                  data-testid={`article-card-${i}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
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
                      <span>{article.readMin} min czytania</span>
                    </div>
                    <h3 className="text-lg font-bold text-primary mb-3 leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 flex-1">
                      {article.excerpt}
                    </p>
                    <Link
                      href={`/baza-wiedzy${article.slug}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group/btn"
                    >
                      Czytaj więcej
                      <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-12 md:py-16 bg-white">
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
                Zapisz się na newsletter i otrzymuj nowe poradniki, aktualności o uczelniach i informacje o stypendiach prosto na skrzynkę.
              </p>

              {newsStatus === "ok" ? (
                <p className="text-accent font-semibold text-lg">
                  Zapisano! Wkrótce dostaniesz pierwszy e-mail.
                </p>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                      placeholder="Twój adres e-mail"
                      data-testid="input-newsletter-email"
                      className="flex-1 h-12 px-5 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                    />
                    <button
                      onClick={handleSubscribe}
                      disabled={newsStatus === "loading"}
                      data-testid="button-newsletter-subscribe"
                      className="h-12 px-7 rounded-full bg-accent text-primary font-bold text-sm hover:bg-white transition-colors shrink-0 disabled:opacity-60"
                    >
                      {newsStatus === "loading" ? "Zapisywanie…" : "Zapisz się"}
                    </button>
                  </div>
                  {newsStatus === "error" && (
                    <p className="text-red-300 text-sm mt-3">
                      Coś poszło nie tak. Spróbuj ponownie lub napisz do nas bezpośrednio.
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
