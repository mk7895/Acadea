import ReactMarkdown from "react-markdown";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowRight, ChevronLeft, Clock, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticleInlineContactForm } from "@/components/articles/ArticleInlineContactForm";
import { ArticleWhatsAppGroupBlock } from "@/components/articles/ArticleWhatsAppGroupBlock";
import { fetchArticleDetail, type ArticleDetail } from "@/lib/article-api";
import {
  ARTICLE_CONTACT_FORM_MARKER,
  ARTICLE_WHATSAPP_GROUP_MARKER,
  normalizeTocItems,
  splitRelatedSection,
  stripLeadingTitleHeading,
  type ArticleTocItem,
} from "@/lib/article-content";
import {
  createArticleSchema,
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  useSeo,
} from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function estimateWordCount(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/[#>*_-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { language, localizePath, t } = useLanguage();
  const slug = `/${params.slug}`;
  const [article, setArticle] = useState<ArticleDetail | null | undefined>(undefined);
  const [articleError, setArticleError] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [navbarHeight, setNavbarHeight] = useState(96);
  const [tocTop, setTocTop] = useState(120);

  useEffect(() => {
    let cancelled = false;
    setArticle(undefined);
    setArticleError(false);

    void fetchArticleDetail(slug, language)
      .then((value) => {
        if (!cancelled) {
          setArticle(value);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setArticle(null);
          setArticleError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, language]);

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

  useEffect(() => {
    function updateNavbarHeight() {
      const header = document.querySelector("header");
      if (header instanceof HTMLElement) {
        setNavbarHeight(Math.ceil(header.getBoundingClientRect().height));
      }
    }

    updateNavbarHeight();
    window.addEventListener("scroll", updateNavbarHeight, { passive: true });
    window.addEventListener("resize", updateNavbarHeight);

    return () => {
      window.removeEventListener("scroll", updateNavbarHeight);
      window.removeEventListener("resize", updateNavbarHeight);
    };
  }, []);

  useEffect(() => {
    function updateTocPosition() {
      const baseTop = navbarHeight + 24;
      const tocBox = document.getElementById("article-toc-box");
      const ctaBox = document.getElementById("article-cta-box");

      if (!(tocBox instanceof HTMLElement) || !(ctaBox instanceof HTMLElement)) {
        setTocTop(baseTop);
        return;
      }

      const ctaRect = ctaBox.getBoundingClientRect();
      const tocHeight = tocBox.getBoundingClientRect().height;
      const maxTop = ctaRect.bottom - tocHeight;

      setTocTop(Math.min(baseTop, maxTop));
    }

    updateTocPosition();
    window.addEventListener("scroll", updateTocPosition, { passive: true });
    window.addEventListener("resize", updateTocPosition);

    return () => {
      window.removeEventListener("scroll", updateTocPosition);
      window.removeEventListener("resize", updateTocPosition);
    };
  }, [article, navbarHeight]);

  const articleBody = useMemo(() => {
    if (!article) {
      return "";
    }

    return splitRelatedSection(stripLeadingTitleHeading(article.markdown)).body;
  }, [article]);

  const articleBlocks = useMemo(() => {
    if (!articleBody) {
      return [] as Array<
        | { type: "markdown"; content: string }
        | { type: "contact" }
        | { type: "whatsapp" }
      >;
    }

    const markerPattern = new RegExp(
      `(${escapeRegExp(ARTICLE_CONTACT_FORM_MARKER)}|${escapeRegExp(ARTICLE_WHATSAPP_GROUP_MARKER)})`,
      "g",
    );

    return articleBody
      .split(markerPattern)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        if (part === ARTICLE_CONTACT_FORM_MARKER) {
          return { type: "contact" as const };
        }
        if (part === ARTICLE_WHATSAPP_GROUP_MARKER) {
          return { type: "whatsapp" as const };
        }
        return { type: "markdown" as const, content: part };
      });
  }, [articleBody]);

  const renderedTocItems = useMemo(
    () => normalizeTocItems(articleBody, article?.tocItems ?? []).filter((item) => item.include),
    [article?.tocItems, articleBody],
  );

  const headingItems = useMemo(
    () => normalizeTocItems(articleBody, article?.tocItems ?? []),
    [article?.tocItems, articleBody],
  );

  const articlePath = `${localizePath("/baza-wiedzy")}${slug}`;
  const wordCount = estimateWordCount(articleBody);

  useSeo(
    article
      ? {
          title: `${article.title} | ACADEA`,
          description: article.excerpt,
          path: articlePath,
          image: article.image,
          type: "article",
          publishedTime: article.updatedAt,
          modifiedTime: article.updatedAt,
          keywords: [
            article.category,
            article.title,
            "studia za granicą",
            "ACADEA",
          ],
          schemas: [
            createOrganizationSchema(),
            createLocalBusinessSchema(),
            createArticleSchema({
              path: articlePath,
              title: article.title,
              description: article.excerpt,
              image: article.image,
              updatedAt: article.updatedAt,
              category: article.category,
              keywords: [article.category, article.title, "studia za granicą", "ACADEA"],
              wordCount,
            }),
            createBreadcrumbSchema([
              { name: "Strona Główna", path: "/" },
              { name: "Baza Wiedzy", path: "/baza-wiedzy" },
              { name: article.title, path: articlePath },
            ]),
          ],
        }
      : {
          title: "Baza Wiedzy | ACADEA",
          description: "Artykuły i poradniki o studiach za granicą od ACADEA.",
          path: articlePath,
          noindex: true,
          schemas: [
            createOrganizationSchema(),
            createLocalBusinessSchema(),
            createBreadcrumbSchema([
              { name: "Strona Główna", path: "/" },
              { name: "Baza Wiedzy", path: "/baza-wiedzy" },
            ]),
          ],
        },
  );

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
        <div className="text-center text-gray-500">{t("Ładowanie artykułu…", "Loading article...")}</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-28">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">
            {articleError
              ? t("Artykuł jest chwilowo niedostępny", "Article is temporarily unavailable")
              : t("Artykuł nie znaleziony", "Article not found")}
          </h1>
          <p className="mb-6 max-w-md text-gray-500">
            {articleError
              ? t(
                  "Nie udało się pobrać aktualnej wersji artykułu z bazy danych. Spróbuj ponownie za chwilę.",
                  "We could not fetch the current version of this article from the database. Try again in a moment.",
                )
              : t(
                  "Ten adres nie prowadzi już do opublikowanego artykułu.",
                  "This address no longer points to a published article.",
                )}
          </p>
          <button
            onClick={() => setLocation(localizePath("/baza-wiedzy"))}
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 font-semibold text-white"
          >
            {t("Wróć do Bazy Wiedzy", "Back to Knowledge Base")}
          </button>
        </div>
      </div>
    );
  }

  const related = article.relatedArticles;

  return (
    <div className="min-h-screen bg-[#fffdfa] pt-28 md:pt-32 pb-16 md:pb-20">
      <div
        className="pointer-events-none fixed left-0 right-0 z-[45] h-[4px]"
        style={{ top: `${navbarHeight}px` }}
      >
        <div
          className="h-[4px] bg-primary transition-[width] duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href={localizePath("/baza-wiedzy")}
            className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-primary"
          >
            <ChevronLeft size={16} />
            {t("Wróć do Bazy Wiedzy", "Back to Knowledge Base")}
          </Link>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b7aa8d]">
            {t("Baza Wiedzy", "Knowledge Base")}
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
                  {article.readMin} {t("min czytania", "min read")}
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

            {articleBlocks.map((block, index) => {
              if (block.type === "contact") {
                return (
                  <div key={`contact-${index}`} className="my-12">
                    <ArticleInlineContactForm articleTitle={article.title} />
                  </div>
                );
              }

              if (block.type === "whatsapp") {
                return (
                  <div key={`whatsapp-${index}`} className="my-12">
                    <ArticleWhatsAppGroupBlock />
                  </div>
                );
              }

              return (
                <div
                  key={`markdown-${index}`}
                  className={`prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-primary prose-h2:mb-4 prose-h2:mt-10 prose-p:mb-5 prose-p:leading-relaxed prose-p:text-gray-600 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2 prose-li:text-gray-600 prose-a:text-primary prose-a:no-underline hover:prose-a:underline ${
                    index > 0 ? "mt-12" : ""
                  }`}
                >
                  <ReactMarkdown components={markdownComponents}>{block.content}</ReactMarkdown>
                </div>
              );
            })}

            {related.length > 0 && (
              <section className="mt-12 border-t border-gray-100 pt-10 md:mt-16">
                <h3 className="mb-6 text-xl font-bold text-primary">{t("Czytaj również", "Read also")}</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`${localizePath("/baza-wiedzy")}${r.slug}`}
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
                          {r.readMin} {t("min", "min")}
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

            <div id="article-cta-box" className="mt-12 rounded-3xl bg-gradient-to-br from-primary to-primary/85 p-8 text-center text-white md:mt-16 md:p-10">
              <h3 className="mb-3 text-2xl font-bold">{t("Chcesz porozmawiać o swojej aplikacji?", "Want to talk about your application?")}</h3>
              <p className="mx-auto mb-8 max-w-md text-base text-white/75">
                {t(
                  "Bezpłatna konsultacja z doradcą ACADEA. Odpowiemy na Twoje pytania i pomożemy zaplanować kolejne kroki.",
                  "A free consultation with an ACADEA adviser. We will answer your questions and help you plan the next steps.",
                )}
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href={localizePath("/umow-spotkanie")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-bold text-primary transition-colors hover:bg-white"
                >
                  {t("Umów bezpłatną konsultację", "Book a free consultation")} <ArrowRight size={18} />
                </Link>
                <Link
                  href={localizePath("/jak-to-dziala")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/15 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/25"
                >
                  {t("Zapoznaj się z naszą ofertą", "See how we help")}
                </Link>
              </div>
            </div>
          </article>

          <aside className="hidden xl:block xl:w-[300px] xl:shrink-0">
            <div
              id="article-toc-box"
              className="xl:fixed xl:flex xl:w-[300px] xl:flex-col overflow-hidden rounded-[28px] border border-[#ece4d7] bg-white p-6 shadow-sm"
              style={{
                top: `${tocTop}px`,
                right: "max(1rem, calc((100vw - 80rem) / 2 + 1.5rem))",
                maxHeight: `calc(100vh - ${navbarHeight + 40}px)`,
              }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#f5f1e8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#8d7b5c]">
                <List size={12} />
                {t("Spis treści", "Contents")}
              </div>

              {renderedTocItems.length > 0 ? (
                <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
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
                <p className="text-sm text-gray-500">{t("Dla tego artykułu nie dodano jeszcze spisu treści.", "No contents have been added for this article yet.")}</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
