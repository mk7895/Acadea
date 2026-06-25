import ReactMarkdown from "react-markdown";
import { useParams } from "wouter";
import { articles, findArticle } from "@/data/articles";
import { Link } from "wouter";
import { ArrowRight, Clock, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = `/${params.slug}`;
  const article = findArticle(slug);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-28">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Artykuł nie znaleziony</h1>
          <Link href="/baza-wiedzy">
            <Button className="bg-primary text-white rounded-full">Wróć do Bazy Wiedzy</Button>
          </Link>
        </div>
      </div>
    );
  }

  const related = articles
    .filter((a) => a.category === article.category && a.slug !== article.slug)
    .slice(0, 3);

  return (
    <div className="bg-white min-h-screen pt-28 md:pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">

        {/* Breadcrumb */}
        <div className="mb-8">
          <a
            href={`${BASE}/baza-wiedzy`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <ChevronLeft size={16} />
            Baza Wiedzy
          </a>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/8 text-primary">
              {article.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={13} />
              {article.readMin} min czytania
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary leading-tight mb-6">
            {article.title}
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed border-l-4 border-accent pl-5">
            {article.excerpt}
          </p>
        </div>

        {/* Cover image */}
        <div className="rounded-2xl overflow-hidden mb-12 aspect-[16/7] bg-gray-100">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        {/* Article body */}
        <div className="prose prose-lg max-w-none
          prose-headings:font-bold prose-headings:text-primary
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-5
          prose-li:text-gray-600 prose-ul:my-4 prose-ul:space-y-1
          prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-800 prose-strong:font-semibold">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => {
                if (!href) return <span>{children}</span>;
                const isInternal = href.startsWith("/");
                if (isInternal) {
                  return (
                    <Link href={`/baza-wiedzy${href}`}>
                      {children}
                    </Link>
                  );
                }
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                );
              },
            }}
          >
            {article.markdown}
          </ReactMarkdown>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="mt-16 pt-10 border-t border-gray-100">
            <h3 className="text-xl font-bold text-primary mb-6">Czytaj też</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/baza-wiedzy${r.slug}`}
                  className="group block rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-28 overflow-hidden bg-gray-100">
                    <img
                      src={r.image}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                      <Clock size={11} />
                      {r.readMin} min
                    </p>
                    <p className="text-sm font-semibold text-primary leading-snug group-hover:text-primary/75 transition-colors">
                      {r.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-3xl bg-gradient-to-br from-primary to-primary/85 p-10 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">
            Chcesz porozmawiać o swojej aplikacji?
          </h3>
          <p className="text-white/75 mb-8 text-base max-w-md mx-auto">
            Bezpłatna konsultacja z doradcą ACADEA — odpowiemy na Twoje pytania i pomożemy zaplanować kolejne kroki.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`${BASE}/umow-spotkanie`}
              className="inline-flex items-center justify-center gap-2 bg-accent text-primary font-bold px-8 py-4 rounded-full hover:bg-white transition-colors text-base"
            >
              Umów bezpłatną konsultację <ArrowRight size={18} />
            </a>
            <a
              href={`${BASE}/jak-to-dziala`}
              className="inline-flex items-center justify-center gap-2 bg-white/15 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/25 transition-colors text-base"
            >
              Zapoznaj się z naszą ofertą
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
