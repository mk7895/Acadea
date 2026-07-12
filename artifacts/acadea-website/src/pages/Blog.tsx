import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { getApiBase } from "@/lib/api-base";
import {
  fetchArticleTaxonomy,
  fetchPublishedArticles,
  getCachedArticleTaxonomy,
  getCachedPublishedArticles,
  type ArticleSummary,
} from "@/lib/article-api";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/TurnstileWidget";
import type { ArticleCategoryGroup } from "@/lib/article-content";
import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  useSeo,
} from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

const API_BASE = getApiBase();

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

type SelectedFilters = Record<string, string[]>;

export default function Blog() {
  const { language, localizePath, t } = useLanguage();
  const cachedArticles = getCachedPublishedArticles(language);
  const cachedTaxonomy = getCachedArticleTaxonomy(language);

  useSeo({
    title: t("Baza wiedzy o studiach za granicą | ACADEA", "Knowledge base about studying abroad | ACADEA"),
    description: t(
      "Poradniki ACADEA o studiach za granicą: aplikacja, terminy, dokumenty, egzaminy, kierunki, kraje, uczelnie i stypendia.",
      "ACADEA guides about studying abroad: applications, deadlines, documents, exams, degree programmes, countries, universities and scholarships.",
    ),
    path: localizePath("/baza-wiedzy"),
    keywords: language === "en"
      ? [
          "study abroad knowledge base",
          "study abroad guides",
          "university application guide",
          "ACADEA blog",
        ]
      : [
          "baza wiedzy studia za granicą",
          "poradniki studia za granicą",
          "aplikacja na studia poradnik",
          "ACADEA blog",
        ],
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createCollectionPageSchema({
        path: localizePath("/baza-wiedzy"),
        title: t("Baza wiedzy o studiach za granicą | ACADEA", "Knowledge base about studying abroad | ACADEA"),
        description: t(
          "Artykuły i poradniki ACADEA o aplikacji na studia za granicą, uczelniach, krajach, egzaminach i finansowaniu.",
          "ACADEA articles and guides about applying to universities abroad, countries, universities, exams and funding.",
        ),
      }),
      createBreadcrumbSchema([
        { name: t("Strona Główna", "Home"), path: localizePath("/") },
        { name: t("Baza Wiedzy", "Knowledge base"), path: localizePath("/baza-wiedzy") },
      ]),
    ],
  });

  const [email, setEmail] = useState("");
  const [newsStatus, setNewsStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [articleItems, setArticleItems] = useState<ArticleSummary[]>(cachedArticles ?? []);
  const [taxonomyGroups, setTaxonomyGroups] = useState<ArticleCategoryGroup[]>(
    cachedTaxonomy?.groups ?? [],
  );
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});
  const [activeGroupSlug, setActiveGroupSlug] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [articleLoadError, setArticleLoadError] = useState(false);
  const [articleIndexLoading, setArticleIndexLoading] = useState(
    !(cachedArticles?.length && cachedTaxonomy?.groups.length),
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [rows, taxonomy] = await Promise.all([
          fetchPublishedArticles(language),
          fetchArticleTaxonomy(language),
        ]);

        if (!cancelled) {
          setArticleItems(rows);
          setTaxonomyGroups(taxonomy.groups);
          setArticleLoadError(false);
          setArticleIndexLoading(false);
        }
      } catch {
        if (!cancelled) {
          setArticleLoadError(true);
          setArticleIndexLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const visible = useMemo(() => {
    return articleItems.filter((article) => {
      return taxonomyGroups.every((group) => {
        const selected = selectedFilters[group.slug] ?? [];
        if (selected.length === 0) {
          return true;
        }

        return selected.some((slug) => article.categorySlugs.includes(slug));
      });
    });
  }, [articleItems, selectedFilters, taxonomyGroups]);

  const hasActiveFilters = useMemo(
    () => Object.values(selectedFilters).some((slugs) => slugs.length > 0),
    [selectedFilters],
  );

  const activeGroup = useMemo(
    () => taxonomyGroups.find((group) => group.slug === activeGroupSlug) ?? null,
    [activeGroupSlug, taxonomyGroups],
  );

  function toggleFilter(groupSlug: string, categorySlug: string) {
    setSelectedFilters((current) => {
      const existing = current[groupSlug] ?? [];
      const nextValues = existing.includes(categorySlug)
        ? existing.filter((slug) => slug !== categorySlug)
        : [...existing, categorySlug];

      return {
        ...current,
        [groupSlug]: nextValues,
      };
    });
  }

  async function handleSubscribe() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    if (isTurnstileEnabled() && !turnstileToken) {
      setNewsStatus("error");
      return;
    }
    setNewsStatus("loading");
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter ACADEA",
          email: trimmed,
          message:
            language === "en"
              ? `ACADEA newsletter signup from ${trimmed}.`
              : `Zapis do newslettera ACADEA z adresu ${trimmed}.`,
          type: "newsletter",
          language,
          turnstileToken,
        }),
      });
      setNewsStatus(res.ok ? "ok" : "error");
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } catch {
      setNewsStatus("error");
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    }
  }

  return (
    <div className="w-full">
      <section className="border-b border-gray-100 bg-white pb-10 pt-24 md:pb-12 md:pt-28">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <BookOpen size={13} />
              <span>{t("Baza Wiedzy", "Knowledge Base")}</span>
            </div>
            <h1 className="mb-4 text-5xl font-bold leading-tight text-gray-900 md:text-6xl">
              {t("Wszystko, co musisz wiedzieć", "Everything you need to know")}
              <br className="hidden md:block" /> {t("o", "about")} <span className="text-primary">{t("studiach za granicą", "studying abroad")}</span>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-gray-500">
              {t(
                "Stworzyliśmy miejsce, którego sami kiedyś szukaliśmy — konkretne, spokojne i oparte na doświadczeniu ludzi, którzy tę drogę naprawdę przeszli.",
                "We built the kind of place we once wished existed: practical, calm and grounded in the experience of people who have actually gone through the process.",
              )}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="sticky top-[60px] z-30 border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-4 md:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9f8f74]">
                {t("Filtry", "Filters")}
              </span>
              {taxonomyGroups.map((group) => {
                const hasSelectedInGroup = (selectedFilters[group.slug] ?? []).length > 0;
                const isActive = activeGroup?.slug === group.slug;

                return (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroupSlug(group.slug)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "border-primary bg-primary text-white"
                        : hasSelectedInGroup
                          ? "border-accent/40 bg-accent/12 text-primary"
                          : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {group.name}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setSelectedFilters({});
                  setActiveGroupSlug("");
                }}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  !hasActiveFilters
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                }`}
              >
                {t("Resetuj filtry", "Reset filters")}
              </button>
            </div>

            {activeGroup ? (
              <div className="rounded-2xl border border-gray-100 bg-[#faf8f2] p-3">
                <div className="flex flex-wrap gap-2">
                  {activeGroup.categories.map((category) => {
                    const selected = (selectedFilters[activeGroup.slug] ?? []).includes(category.slug);
                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleFilter(activeGroup.slug, category.slug)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          selected
                            ? "border-primary bg-primary text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
                        }`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="min-h-[50vh] bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          {articleLoadError ? (
            <div className="mb-6 rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-5 text-sm leading-relaxed text-amber-900">
              {t(
                "Nie udało się teraz wczytać aktualnych artykułów z bazy danych. Odśwież stronę za chwilę albo wróć później.",
                "We could not load the latest articles from the database right now. Refresh the page in a moment or come back later.",
              )}
            </div>
          ) : null}
          {articleIndexLoading && visible.length === 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="h-48 animate-pulse bg-gray-100" />
                  <div className="space-y-3 p-6">
                    <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                    <div className="h-6 w-4/5 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#d8d0c1] bg-white px-6 py-12 text-center">
              <h2 className="text-2xl font-bold text-primary">
                {articleLoadError
                  ? t("Artykuły są chwilowo niedostępne", "Articles are temporarily unavailable")
                  : t("Brak artykułów dla wybranych filtrów", "No articles match the selected filters")}
              </h2>
              <p className="mt-3 text-gray-500">
                {articleLoadError
                  ? t(
                      "To wygląda na problem z połączeniem z API artykułów, a nie na brak treści.",
                      "This looks like an article API connection issue, not missing content.",
                    )
                  : t(
                      "Odznacz część kategorii albo wróć do widoku wszystkich artykułów.",
                      "Remove some categories or return to all articles.",
                    )}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={JSON.stringify(selectedFilters)}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {visible.map((article, i) => (
                  <motion.div
                    key={article.slug}
                    variants={itemVariants}
                    data-testid={`article-card-${i}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute left-4 top-4">
                        <Badge className="border-none bg-white/90 text-xs font-semibold text-primary shadow-sm hover:bg-white">
                          {article.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>{article.readMin} {t("min czytania", "min read")}</span>
                      </div>
                      <h3 className="mb-3 text-lg font-bold leading-snug text-primary">{article.title}</h3>
                      <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-gray-500">{article.excerpt}</p>
                      <Link
                        href={`${localizePath("/baza-wiedzy")}${article.slug}`}
                        className="group/btn mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                      >
                        {t("Czytaj więcej", "Read more")}
                        <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-0.5" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      <section className="bg-white py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-primary p-10 text-center md:p-16"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-accent blur-[80px]" />
            </div>
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">{t("Nie przegap nowych artykułów", "Do not miss new articles")}</h2>
              <p className="mb-8 text-gray-300">
                {t(
                  "Zapisz się na newsletter i otrzymuj nowe poradniki, aktualności o uczelniach i informacje o stypendiach prosto na skrzynkę.",
                  "Sign up for the newsletter and get new guides, university updates and scholarship information straight to your inbox.",
                )}
              </p>

              {newsStatus === "ok" ? (
                <p className="text-lg font-semibold text-accent">{t("Zapisano! Wkrótce dostaniesz pierwszy e-mail.", "You are subscribed. Your first email will arrive soon.")}</p>
              ) : (
                <>
                  <div className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                      placeholder={t("Twój adres e-mail", "Your email address")}
                      data-testid="input-newsletter-email"
                      className="h-14 flex-1 rounded-full border border-white/20 bg-white/10 px-5 text-base text-white placeholder-white/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                      onClick={handleSubscribe}
                      disabled={newsStatus === "loading"}
                      data-testid="button-newsletter-subscribe"
                      className="h-14 shrink-0 rounded-full bg-accent px-8 text-base font-bold text-primary transition-colors hover:bg-white disabled:opacity-60"
                    >
                      {newsStatus === "loading" ? t("Zapisywanie…", "Saving...") : t("Zapisz się", "Sign up")}
                    </button>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <TurnstileWidget
                      onTokenChange={setTurnstileToken}
                      resetKey={turnstileResetKey}
                      theme="dark"
                    />
                  </div>
                  {newsStatus === "error" && (
                    <p className="mt-3 text-sm text-red-300">
                      {isTurnstileEnabled() && !turnstileToken
                        ? t(
                            "Potwierdź zabezpieczenie formularza i spróbuj ponownie.",
                            "Complete the form security check and try again.",
                          )
                        : t(
                            "Coś poszło nie tak. Spróbuj ponownie lub napisz do nas bezpośrednio.",
                            "Something went wrong. Try again or contact us directly.",
                          )}
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
