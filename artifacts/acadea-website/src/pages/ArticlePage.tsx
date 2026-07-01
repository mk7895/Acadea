import ReactMarkdown from "react-markdown";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowRight, ChevronLeft, Clock, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticleInlineContactForm } from "@/components/articles/ArticleInlineContactForm";
import { fetchArticleDetail, type ArticleDetail } from "@/lib/article-api";
import {
  ARTICLE_CONTACT_FORM_MARKER,
  normalizeTocItems,
  splitRelatedSection,
  stripLeadingTitleHeading,
  type ArticleTocItem,
} from "@/lib/article-content";

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const slug = `/${params.slug}`;
  const [article, setArticle] = useState<ArticleDetail | null | undefined>(undefined);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setArticle(undefined);

    void fetchArticleDetail(slug).then((value) => {
      if (!cancelled) {
        setArticle(value);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    function updateProgress() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        setReadingProgress(0);
        return;
      }

      setReadingProgress(Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)));
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  const articleBody = useMemo(() => {
    if (!article) {
      return "";
    }

    return splitRelatedSection(stripLeadingTitleHeading(article.markdown)).body;
  }, [article]);

  const renderedTocItems = useMemo(
    () => normalizeTocItems(articleBody, article?.tocItems ?? []).filter((item) => item.include),
    [article?.tocItems, articleBody],
  );

  const headingItems = useMemo(
    () => normalizeTocItems(articleBody, article?.tocItems ?? []),
    [article?.tocItems, articleBody],
  );

  const articleSections = useMemo(() => {
    if (!articleBody) {
      return { intro: "", remainder: "" };
    }

    const [intro, ...rest] = articleBody.split(ARTICLE_CONTACT_FORM_MARKER);
    return {
      intro: intro.trim(),
      remainder: rest.join(ARTICLE_CONTACT_FORM_MARKER).trim(),
    };
  }, [articleBody]);

  const markdownComponents = (() => {
    const counter = { value: 0 };
    const renderHeading =
      (level: "h2" | "h3" | "h4") =>
      ({ children }: { children?: ReactNode }) => {
        const item = headingItems[counter.value];
        counter.value += 1;
        const Tag = level;
        return (
          <Tag id={item?.anchorId} className="scroll-mt-32">
            {children}
          </Tag>
        );
      };

    return {
      h2: renderHeading("h2"),
      h3: renderHeading("h3"),
      h4: renderHeading("h4"),
      a: ({ href, children }: { href?: string; children?: ReactNode }) => {
        if (!href) return <span>{children}</span>;
        const isInternal = href.startsWith("/");
        if (isInternal) {
          return <Link href={`/baza-wiedzy${href}`}>{children}</Link>;
        }
        return <a href={href}>{children}</a>;
      },
    };
  })();

  if (article === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-28">
        <div className="text-center text-gray-500">Ładowanie artykułu…</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-28">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Artykuł nie znaleziony</h1>
          <button
            onClick={() => setLocation("/baza-wiedzy")}
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 font-semibold text-white"
          >
            Wróć do Bazy Wiedzy
          </button>
        </div>
      </div>
    );
  }

  const related = article.relatedArticles;
  const showInlineForm = articleBody.includes(ARTICLE_CONTACT_FORM_MARKER);
  const introMarkdown = showInlineForm ? articleSections.intro : articleBody;
  const remainderMarkdown = showInlineForm ? articleSections.remainder : "";

  return (
    <div className="min-h-screen bg-[#fffdfa] pt-28 md:pt-32 pb-16 md:pb-20">
      <div className="pointer-events-none fixed left-0 right-0 top-[88px] z-[40] h-[4px] md:top-[108px]">
        <div
          className="h-[4px] bg-primary transition-[width] duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/baza-wiedzy"
            className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-primary"
          >
            <ChevronLeft size={16} />
            Wróć do Bazy Wiedzy
          </Link>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b7aa8d]">
            Baza Wiedzy
          </div>
        </div>

        <div className="grid gap-10 lg:items-start lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="min-w-0">
            <header className="mb-10">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                  {article.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={13} />
                  {article.readMin} min czytania
                </span>
              </div>
              <h1 className="mb-6 text-3xl font-bold leading-tight text-primary md:text-5xl">
                {article.title}
              </h1>
              <p className="max-w-3xl border-l-4 border-accent pl-5 text-lg leading-relaxed text-gray-500">
                {article.excerpt}
              </p>
            </header>

            <div className="mb-12 overflow-hidden rounded-[28px] bg-gray-100 shadow-sm aspect-[16/7]">
              <img
                src={article.image}
                alt={article.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-primary prose-h2:mb-4 prose-h2:mt-10 prose-p:mb-5 prose-p:leading-relaxed prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
              <ReactMarkdown
                components={markdownComponents}
              >
                {introMarkdown}
              </ReactMarkdown>
            </div>

            {showInlineForm ? (
              <div className="my-12">
                <ArticleInlineContactForm articleTitle={article.title} />
              </div>
            ) : null}

            {remainderMarkdown ? (
              <div className="prose prose-lg mt-12 max-w-none prose-headings:font-bold prose-headings:text-primary prose-h2:mb-4 prose-h2:mt-10 prose-p:mb-5 prose-p:leading-relaxed prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                <ReactMarkdown
                  components={markdownComponents}
                >
                  {remainderMarkdown}
                </ReactMarkdown>
              </div>
            ) : null}

            {related.length > 0 && (
              <section className="mt-12 border-t border-gray-100 pt-10 md:mt-16">
                <h3 className="mb-6 text-xl font-bold text-primary">czytaj również</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/baza-wiedzy${r.slug}`}
                      className="group block overflow-hidden rounded-xl border border-gray-100 transition-shadow hover:shadow-md"
                    >
                      <div className="h-28 overflow-hidden bg-gray-100">
                        <img
                          src={r.image}
                          alt={r.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div className="p-4">
                        <p className="mb-1.5 flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={11} />
                          {r.readMin} min
                        </p>
                        <p className="text-sm font-semibold leading-snug text-primary transition-colors group-hover:text-primary/75">
                          {r.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-12 rounded-3xl bg-gradient-to-br from-primary to-primary/85 p-8 text-center text-white md:mt-16 md:p-10">
              <h3 className="mb-3 text-2xl font-bold">Chcesz porozmawiać o swojej aplikacji?</h3>
              <p className="mx-auto mb-8 max-w-md text-base text-white/75">
                Bezpłatna konsultacja z doradcą ACADEA. Odpowiemy na Twoje pytania i pomożemy zaplanować kolejne kroki.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/umow-spotkanie"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-bold text-primary transition-colors hover:bg-white"
                >
                  Umów bezpłatną konsultację <ArrowRight size={18} />
                </Link>
                <Link
                  href="/jak-to-dziala"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/15 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/25"
                >
                  Zapoznaj się z naszą ofertą
                </Link>
              </div>
            </div>
          </article>

          <aside className="hidden xl:block xl:self-start">
            <div className="sticky top-28 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[28px] border border-[#ece4d7] bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#f5f1e8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#8d7b5c]">
                <List size={12} />
                Spis treści
              </div>

              {renderedTocItems.length > 0 ? (
                <nav className="space-y-2">
                  {renderedTocItems.map((item) => (
                    <a
                      key={`${item.sourceIndex}-${item.anchorId}`}
                      href={`#${item.anchorId}`}
                      className={`block rounded-2xl px-3 py-2 text-sm transition-colors hover:bg-primary/5 hover:text-primary ${
                        item.level >= 3 ? "ml-4 text-gray-500" : "font-medium text-gray-700"
                      }`}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              ) : (
                <p className="text-sm text-gray-500">Dla tego artykułu nie dodano jeszcze spisu treści.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
