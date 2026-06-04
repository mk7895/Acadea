import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { countryBySlug } from "@/data/countries";
import NotFound from "@/pages/not-found";

export default function CountryDetail() {
  const params = useParams();
  const [location] = useLocation();
  const slug = params.slug ?? "";
  const country = countryBySlug[slug];

  useEffect(() => {
    if (!country) return;
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        requestAnimationFrame(() =>
          el.scrollIntoView({ behavior: "smooth", block: "start" }),
        );
      }
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [country, slug, location]);

  if (!country) return <NotFound />;

  return (
    <div className="w-full pt-28 pb-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <Link
          href="/kraje"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-8 text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Wszystkie kraje
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl leading-none">{country.flag}</span>
            <h1 className="text-4xl md:text-6xl font-bold text-primary">{country.name}</h1>
          </div>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">{country.intro}</p>
        </motion.div>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16 max-w-3xl">
          {country.highlights.map((h, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">{h.label}</p>
              <p className="text-primary font-bold">{h.value}</p>
            </div>
          ))}
        </div>

        {/* Universities */}
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-8">
          Uczelnie, z którymi współpracujemy
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
          {country.unis.map((uni) => (
            <motion.div
              key={uni.slug}
              id={uni.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="scroll-mt-28 bg-white rounded-2xl p-7 border border-gray-100 shadow-sm target:ring-2 target:ring-accent"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <GraduationCap size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary mb-1.5">{uni.name}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{uni.blurb}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-primary text-white p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-accent rounded-full blur-[120px] opacity-20 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Myślisz o studiach w kraju {country.name}?
            </h2>
            <p className="text-white/70 mb-8 max-w-2xl mx-auto">
              Podczas bezpłatnej konsultacji sprawdzimy, które uczelnie pasują do Twojego profilu, i ułożymy plan aplikacji krok po kroku.
            </p>
            <Link href="/kontakt">
              <Button
                size="lg"
                className="h-14 px-8 rounded-full bg-accent text-primary hover:bg-white transition-colors font-bold border-none"
              >
                Bezpłatna konsultacja <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
