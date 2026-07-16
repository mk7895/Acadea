export type HomeFaqItem = {
  question: string;
  answer: string;
};

export const HOME_FAQ_ITEMS_PL: HomeFaqItem[] = [
  {
    question: "Jak wygląda aplikacja na studia za granicą z ACADEA?",
    answer:
      "Zaczynamy od poznania Twojego profilu, celów i budżetu, potem pomagamy wybrać uczelnie, zaplanować terminy, przygotować dokumenty, eseje, certyfikaty językowe oraz dalsze kroki aplikacyjne.",
  },
  {
    question: "Czy pomagacie tylko w aplikacji do USA albo UK?",
    answer:
      "Nie. Wspieramy kandydatów aplikujących do ponad 25 krajów, w tym do USA, Wielkiej Brytanii, Holandii, Danii, Niemiec, Włoch, Szwecji, Kanady i innych systemów edukacyjnych.",
  },
  {
    question: "Czy rodzice też mogą uczestniczyć w konsultacji?",
    answer:
      "Tak. Wiele rodzin chce wspólnie omówić koszty, terminy, bezpieczeństwo i plan działania. Dlatego konsultacje są otwarte również dla rodziców.",
  },
  {
    question: "Czy pomagacie znaleźć stypendium na studia za granicą?",
    answer:
      "Tak. Pomagamy ocenić koszty studiowania, szukać sensownych opcji finansowania i budować plan aplikacji tak, aby uwzględniał stypendia, financial aid i realny budżet całego procesu.",
  },
];

export const HOME_FAQ_ITEMS_EN: HomeFaqItem[] = [
  {
    question: "What does applying to university abroad with ACADEA look like?",
    answer:
      "We start by getting to know your profile, goals and budget, then help you choose universities, plan deadlines, prepare documents, essays, language certificates and further application steps.",
  },
  {
    question: "Do you only help with applications to the USA or the UK?",
    answer:
      "No. We support candidates applying to more than 25 countries, including the USA, the United Kingdom, the Netherlands, Denmark, Germany, Italy, Sweden, Canada and other education systems.",
  },
  {
    question: "Can parents take part in the consultation too?",
    answer:
      "Yes. Many families want to discuss costs, deadlines, safety and the action plan together. That is why consultations are also open to parents.",
  },
  {
    question: "Do you help students find scholarships for studying abroad?",
    answer:
      "Yes. We help assess the cost of studying, look for sensible funding options and build an application plan that takes scholarships, financial aid and a realistic budget for the whole process into account.",
  },
];

// Kept as the Polish default for build-time metadata generated for the root route.
export const HOME_FAQ_ITEMS = HOME_FAQ_ITEMS_PL;
