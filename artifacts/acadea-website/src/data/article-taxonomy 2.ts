import type { ArticleCategoryGroup } from "../lib/article-content";

export const STATIC_ARTICLE_TAXONOMY: ArticleCategoryGroup[] = [
  {
    id: 1,
    name: "Etap aplikacji",
    slug: "etap-aplikacji",
    sortOrder: 1,
    categories: [
      { id: 101, groupId: 1, name: "Strategia i wybór", slug: "strategia", sortOrder: 1 },
      { id: 102, groupId: 1, name: "Dokumenty", slug: "dokumenty", sortOrder: 2 },
      { id: 103, groupId: 1, name: "Terminy", slug: "terminy", sortOrder: 3 },
      { id: 104, groupId: 1, name: "Eseje i listy", slug: "eseje-i-listy", sortOrder: 4 },
      { id: 105, groupId: 1, name: "Egzaminy", slug: "egzaminy", sortOrder: 5 },
      { id: 106, groupId: 1, name: "Rekomendacje", slug: "rekomendacje", sortOrder: 6 },
      { id: 107, groupId: 1, name: "Common App", slug: "common-app", sortOrder: 7 },
      { id: 108, groupId: 1, name: "Mentoring", slug: "mentoring", sortOrder: 8 },
      { id: 109, groupId: 1, name: "Dla rodziców", slug: "dla-rodzicow", sortOrder: 9 },
    ],
  },
  {
    id: 2,
    name: "Kraje",
    slug: "kraje",
    sortOrder: 2,
    categories: [
      { id: 201, groupId: 2, name: "Europa", slug: "europa", sortOrder: 1 },
      { id: 202, groupId: 2, name: "USA", slug: "usa", sortOrder: 2 },
      { id: 203, groupId: 2, name: "Wielka Brytania", slug: "wielka-brytania", sortOrder: 3 },
      { id: 204, groupId: 2, name: "Holandia", slug: "holandia", sortOrder: 4 },
      { id: 205, groupId: 2, name: "Niemcy", slug: "niemcy", sortOrder: 5 },
      { id: 206, groupId: 2, name: "Hiszpania", slug: "hiszpania", sortOrder: 6 },
      { id: 207, groupId: 2, name: "Włochy", slug: "wlochy", sortOrder: 7 },
      { id: 208, groupId: 2, name: "Dania", slug: "dania", sortOrder: 8 },
      { id: 209, groupId: 2, name: "Szwecja", slug: "szwecja", sortOrder: 9 },
      { id: 210, groupId: 2, name: "Kanada", slug: "kanada", sortOrder: 10 },
    ],
  },
  {
    id: 3,
    name: "Kierunki",
    slug: "kierunki",
    sortOrder: 3,
    categories: [
      { id: 301, groupId: 3, name: "Ekonomia i biznes", slug: "ekonomia", sortOrder: 1 },
      { id: 302, groupId: 3, name: "Prawo", slug: "prawo", sortOrder: 2 },
      { id: 303, groupId: 3, name: "Psychologia", slug: "psychologia", sortOrder: 3 },
      { id: 304, groupId: 3, name: "Medycyna", slug: "medycyna", sortOrder: 4 },
      { id: 305, groupId: 3, name: "Informatyka", slug: "informatyka", sortOrder: 5 },
    ],
  },
  {
    id: 4,
    name: "Finansowanie",
    slug: "finansowanie",
    sortOrder: 4,
    categories: [
      { id: 401, groupId: 4, name: "Koszty studiów", slug: "koszty", sortOrder: 1 },
      { id: 402, groupId: 4, name: "Stypendia", slug: "stypendia", sortOrder: 2 },
      { id: 403, groupId: 4, name: "Financial aid", slug: "financial-aid", sortOrder: 3 },
      { id: 404, groupId: 4, name: "Darmowe studia", slug: "darmowe-studia", sortOrder: 4 },
    ],
  },
];
