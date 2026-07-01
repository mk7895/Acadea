import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Clock, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { countryBySlug, countryLocative, uniDomain } from "@/data/countries";
import { fetchPublishedArticles, type ArticleSummary } from "@/lib/article-api";
import NotFound from "@/pages/not-found";

const SKIP_CLEARBIT = new Set([
  "dtu.dk",
  "fudan.edu.cn",
  "ku.ac.ae",
  "skku.edu",
  "hanyang.ac.kr",
  "inha.ac.kr",
  "tuj.ac.jp",
  "pku.edu.cn",
  "tsinghua.edu.cn",
  "zju.edu.cn",
  "snu.ac.kr",
  "kaist.ac.kr",
  "yonsei.ac.kr",
  "u-tokyo.ac.jp",
  "kyoto-u.ac.jp",
  "waseda.jp",
  "osaka-u.ac.jp",
]);

function UniLogo({ slug, name }: { slug: string; name: string }) {
  const domain = uniDomain[slug];
  const sources = domain
    ? [
        ...(SKIP_CLEARBIT.has(domain) ? [] : [`https://logo.clearbit.com/${domain}`]),
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      ]
    : [];
  const [idx, setIdx] = useState(0);

  if (!domain || idx >= sources.length) {
    return (
      <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
        <GraduationCap size={24} className="text-primary" />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
      <img
        src={sources[idx]}
        alt={`Logo ${name}`}
        loading="lazy"
        className="w-full h-full object-contain"
        onError={() => setIdx((i) => i + 1)}
      />
    </div>
  );
}

export default function CountryDetail() {
  const params = useParams();
  const [location] = useLocation();
  const slug = params.slug ?? "";
  const country = countryBySlug[slug];
  const [articleItems, setArticleItems] = useState<ArticleSummary[]>([]);

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

  useEffect(() => {
    let cancelled = false;

    void fetchPublishedArticles().then((rows) => {
      if (!cancelled) {
        setArticleItems(rows);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const relatedCountryArticles = useMemo(() => {
    if (!country) {
      return [];
    }

    return articleItems
      .filter((article) => article.categorySlugs.includes(country.slug))
      .slice(0, 3);
  }, [articleItems, country]);

  if (!country) return <NotFound />;

  const locative = countryLocative[country.slug] ?? country.name;

  return (
    <div className="w-full pt-36 md:pt-40 pb-20 bg-gray-50 min-h-screen">
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
          Uczelnie warte uwagi
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
          {country.unis.map((uni) => (
            <motion.div
              key={uni.slug}
              id={uni.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="scroll-mt-36 bg-white rounded-2xl p-7 border border-gray-100 shadow-sm target:ring-2 target:ring-accent"
            >
              <div className="flex items-start gap-4">
                <UniLogo slug={uni.slug} name={uni.name} />
                <div>
                  <h3 className="text-lg font-bold text-primary mb-1.5">{uni.name}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{uni.blurb}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {relatedCountryArticles.length > 0 ? (
          <section className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-8">
              Dowiedz się więcej
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {relatedCountryArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/baza-wiedzy${article.slug}`}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="h-48 overflow-hidden bg-gray-100">
                    <img
                      src={article.image}
                      alt={article.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
                      <Clock size={12} />
                      <span>{article.readMin} min czytania</span>
                    </div>
                    <h3 className="text-lg font-bold text-primary mb-3">{article.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-500">{article.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* CTA */}
        <div className="rounded-3xl bg-primary text-white p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-accent rounded-full blur-[120px] opacity-20 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Myślisz o studiach {locative}?
            </h2>
            <p className="text-white/70 mb-8 max-w-2xl mx-auto">
              Podczas bezpłatnej konsultacji sprawdzimy, które uczelnie pasują do Twojego profilu, i ułożymy plan aplikacji krok po kroku.
            </p>
            <Link href="/umow-spotkanie">
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
