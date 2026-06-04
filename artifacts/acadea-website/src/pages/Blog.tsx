import { useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Category = "Poradniki" | "Kraje" | "Stypendia";

type Article = {
  title: string;
  excerpt: string;
  readMin: number;
  category: Category;
};

const IMAGES: Record<Category, string[]> = {
  Poradniki: [
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80",
    "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&q=80",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
  ],
  Kraje: [
    "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80",
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80",
    "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  ],
  Stypendia: [
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80",
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&q=80",
  ],
};

const articles: Article[] = [
  { category: "Poradniki", readMin: 16, title: "Jak dostać się na studia za granicą? Kompletny przewodnik krok po kroku", excerpt: "Od wyboru kraju i kierunku po dokumenty, terminy, eseje i finansowanie — przewodnik, który pomaga zrozumieć proces aplikacji bez chaosu i przypadkowych decyzji." },
  { category: "Poradniki", readMin: 11, title: "Dokumenty na studia za granicą — checklista dla kandydatów", excerpt: "Oceny, certyfikat językowy, rekomendacje, CV, eseje i dokumenty finansowe — zobacz, czego zwykle wymagają uczelnie i czego nie zostawiać na ostatnią chwilę." },
  { category: "Poradniki", readMin: 9, title: "Terminy aplikacji na studia za granicą — dołącz do grupy WhatsApp", excerpt: "Deadline'y różnią się między krajami, uczelniami i stypendiami. Wyjaśniamy, jak ich pilnować i dlaczego aktualizacje publikujemy także na grupie WhatsApp Acadea." },
  { category: "Poradniki", readMin: 9, title: "Rankingi uczelni: QS, THE, Shanghai — jak je czytać?", excerpt: "Rankingi mogą pomóc, ale potrafią też wprowadzać w błąd. Sprawdź, co naprawdę mierzą i dlaczego nie warto wybierać uczelni wyłącznie po pozycji w tabeli." },
  { category: "Poradniki", readMin: 8, title: "IELTS, TOEFL czy Duolingo? Certyfikat językowy na studia za granicą", excerpt: "Nie każda uczelnia akceptuje ten sam egzamin. Sprawdź, kiedy potrzebujesz certyfikatu językowego i dlaczego warto zaplanować go wcześniej." },
  { category: "Poradniki", readMin: 12, title: "Jak napisać personal statement na studia w UK?", excerpt: "Personal statement nie jest listą osiągnięć ani zwykłym listem motywacyjnym. Zobacz, jak pokazać zainteresowanie kierunkiem i uniknąć ogólników." },
  { category: "Poradniki", readMin: 8, title: "List motywacyjny a personal statement — jaka jest różnica?", excerpt: "Wiele osób myli te dwa dokumenty. Tymczasem różnią się strukturą, tonem i przeznaczeniem — szczególnie przy aplikacji do UK, Europy i USA." },
  { category: "Poradniki", readMin: 10, title: "Jak wybrać kierunek studiów za granicą?", excerpt: "Dobry kierunek to nie tylko to, co brzmi ciekawie. Trzeba sprawdzić wymagania, strukturę programu, perspektywy i dopasowanie do profilu ucznia." },
  { category: "Poradniki", readMin: 9, title: "Jak wybrać kraj na studia za granicą?", excerpt: "Kraj to nie wakacje. Liczą się koszty życia, styl nauki, język, rynek pracy, wymagania i to, czy dany system pasuje do Twoich planów." },
  { category: "Poradniki", readMin: 8, title: "Jak poprosić nauczyciela o rekomendację?", excerpt: "Dobra rekomendacja nie powinna być ogólną pochwałą. Zobacz, kogo poprosić, kiedy to zrobić i jak pomóc nauczycielowi napisać konkretny list." },
  { category: "Poradniki", readMin: 10, title: "Najczęstsze błędy w aplikacji na studia za granicą", excerpt: "Zbyt późny start, przypadkowa lista uczelni, słabe eseje i brak planu finansowego — sprawdź, które błędy najczęściej osłabiają aplikację." },
  { category: "Poradniki", readMin: 9, title: "Czy warto korzystać z mentora przy aplikacji na studia za granicą?", excerpt: "Mentor nie powinien obiecywać przyjęcia ani pisać aplikacji za ucznia. Może jednak pomóc uporządkować proces, strategię i dokumenty." },
  { category: "Poradniki", readMin: 8, title: "Jak wygląda współpraca z mentorem aplikacyjnym?", excerpt: "Od pierwszej konsultacji po wybór uczelni, teksty aplikacyjne i terminy — zobacz, jak może wyglądać uporządkowane wsparcie w aplikacji." },
  { category: "Poradniki", readMin: 8, title: "Czy studia za granicą są dla mnie?", excerpt: "Nie każdy powinien wybierać tę samą ścieżkę. Sprawdź, jak myśleć o gotowości akademickiej, finansowej i osobistej do wyjazdu." },
  { category: "Poradniki", readMin: 9, title: "Studia za granicą z polską maturą, IB albo A-levels", excerpt: "Polska matura, IB i A-levels mogą otwierać różne drzwi — ale wymagania zależą od kraju, kierunku i konkretnych przedmiotów." },
  { category: "Kraje", readMin: 14, title: "Studia w USA — aplikacja, eseje, SAT i financial aid", excerpt: "Aplikacja do USA różni się od europejskich systemów. Wyjaśniamy Common App, eseje, extracurriculars, testy i pomoc finansową dla international students." },
  { category: "Kraje", readMin: 12, title: "Studia w Europie po angielsku — gdzie warto aplikować?", excerpt: "Holandia, Dania, Szwecja, Austria, Włochy, Hiszpania czy Belgia? Zobacz, jak porównywać kraje, koszty i programy po angielsku." },
  { category: "Kraje", readMin: 10, title: "Studia w Holandii — przewodnik dla polskich maturzystów", excerpt: "Holandia przyciąga programami po angielsku i praktycznym stylem nauki, ale trzeba uważać na terminy, wymagania i zakwaterowanie." },
  { category: "Kraje", readMin: 10, title: "Studia w UK po Brexicie — aplikacja, koszty i UCAS", excerpt: "Wielka Brytania nadal ma świetne uczelnie, ale po Brexicie wymaga dokładniejszego planu finansowego, UCAS i mocnych dokumentów." },
  { category: "Kraje", readMin: 10, title: "Bezpłatne studia w Niemczech — jak to możliwe i jak aplikować?", excerpt: "Niemcy mogą być bardzo atrakcyjne finansowo, szczególnie na uczelniach publicznych. Sprawdź, kiedy niski koszt naprawdę oznacza dobrą opcję." },
  { category: "Kraje", readMin: 9, title: "Studia w Hiszpanii — słońce, kultura i dyplom uznawany w całej Europie", excerpt: "Hiszpania to nie tylko Madryt i Barcelona. To także uczelnie, programy po angielsku, kierunki biznesowe i rosnące możliwości dla absolwentów." },
  { category: "Kraje", readMin: 9, title: "Studia we Włoszech po angielsku — koszty, uczelnie i aplikacja", excerpt: "Włochy mogą być ciekawą opcją dla osób zainteresowanych biznesem, ekonomią, designem, architekturą i naukami społecznymi." },
  { category: "Kraje", readMin: 9, title: "Studia w Danii po angielsku — co warto wiedzieć?", excerpt: "Dania oferuje praktyczny styl nauki i międzynarodowe środowisko, ale wybór programów i koszty życia trzeba dokładnie sprawdzić." },
  { category: "Kraje", readMin: 9, title: "Studia w Szwecji po angielsku — kierunki, koszty i wymagania", excerpt: "Szwecja przyciąga jakością edukacji i nowoczesnym podejściem do nauki, ale wymaga dobrego planu kosztów i aplikacji." },
  { category: "Kraje", readMin: 9, title: "Studia w Kanadzie — czy to dobra alternatywa dla USA?", excerpt: "Kanada może być atrakcyjna dla osób szukających anglojęzycznych studiów poza Europą, ale koszty, terminy i wymagania różnią się od USA." },
  { category: "Stypendia", readMin: 14, title: "Ile kosztują studia za granicą i jak znaleźć stypendium?", excerpt: "Czesne to tylko część budżetu. Wyjaśniamy koszty życia, zakwaterowanie, opłaty aplikacyjne, financial aid i najczęstsze pułapki finansowe." },
  { category: "Stypendia", readMin: 12, title: "Jak zdobyć stypendium na studia za granicą? Kompletny poradnik", excerpt: "Scholarship, grant, financial aid, tuition waiver — sprawdź, czym różnią się formy finansowania i kiedy zacząć szukać wsparcia." },
  { category: "Stypendia", readMin: 10, title: "Darmowe studia za granicą — kiedy to naprawdę możliwe?", excerpt: "Brak czesnego nie oznacza braku kosztów. Sprawdź, jak odróżnić rzeczywiście tanią opcję od programu, który tylko wygląda korzystnie na papierze." },
  { category: "Stypendia", readMin: 11, title: "Financial aid dla international students w USA", excerpt: "Niektóre uczelnie w USA oferują bardzo dużą pomoc finansową, ale zasady różnią się między szkołami. Zobacz, na co uważać przy układaniu listy." },
  { category: "Stypendia", readMin: 8, title: "Stypendia Acadea — kto może otrzymać wsparcie aplikacyjne?", excerpt: "Profesjonalna pomoc w aplikacji nie powinna być dostępna tylko dla osób, które mogą zapłacić pełną cenę. Wyjaśniamy, jak myślimy o stypendiach Acadea." },
];

const categories = ["Wszystkie", "Poradniki", "Kraje", "Stypendia"] as const;
type Filter = (typeof categories)[number];

function imageFor(article: Article, indexInCategory: number) {
  const pool = IMAGES[article.category];
  return pool[indexInCategory % pool.length];
}

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

  const withImages = useMemo(() => {
    const counters: Record<Category, number> = { Poradniki: 0, Kraje: 0, Stypendia: 0 };
    return articles.map((a) => {
      const img = imageFor(a, counters[a.category]);
      counters[a.category] += 1;
      return { ...a, image: img };
    });
  }, []);

  const visible = useMemo(
    () => (filter === "Wszystkie" ? withImages : withImages.filter((a) => a.category === filter)),
    [filter, withImages],
  );

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
      <section className="py-20 bg-gray-50 min-h-[50vh]">
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
                  key={article.title}
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
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-4">
                      {article.excerpt}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
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
                Zapisz się na newsletter i otrzymuj nowe poradniki, aktualności o uczelniach i informacje o stypendiach prosto na skrzynkę.
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
