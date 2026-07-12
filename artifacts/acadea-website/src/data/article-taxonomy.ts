import type { ArticleCategoryGroup } from "../lib/article-content";

const STATIC_ARTICLE_TAXONOMY_PL: ArticleCategoryGroup[] = [
  {
    id: 1,
    name: "Etap aplikacji",
    nameEn: "Application stage",
    slug: "etap-aplikacji",
    sortOrder: 1,
    categories: [
      { id: 101, groupId: 1, name: "Strategia i wybór", nameEn: "Strategy and fit", slug: "strategia", sortOrder: 1 },
      { id: 102, groupId: 1, name: "Dokumenty", nameEn: "Documents", slug: "dokumenty", sortOrder: 2 },
      { id: 103, groupId: 1, name: "Terminy", nameEn: "Deadlines", slug: "terminy", sortOrder: 3 },
      { id: 104, groupId: 1, name: "Eseje i listy", nameEn: "Essays and letters", slug: "eseje-i-listy", sortOrder: 4 },
      { id: 105, groupId: 1, name: "Egzaminy", nameEn: "Exams", slug: "egzaminy", sortOrder: 5 },
      { id: 106, groupId: 1, name: "Rekomendacje", nameEn: "Recommendations", slug: "rekomendacje", sortOrder: 6 },
      { id: 107, groupId: 1, name: "Common App", nameEn: "Common App", slug: "common-app", sortOrder: 7 },
      { id: 108, groupId: 1, name: "Mentoring", nameEn: "Mentoring", slug: "mentoring", sortOrder: 8 },
      { id: 109, groupId: 1, name: "Dla rodziców", nameEn: "For parents", slug: "dla-rodzicow", sortOrder: 9 },
    ],
  },
  {
    id: 2,
    name: "Kraje",
    nameEn: "Countries",
    slug: "kraje",
    sortOrder: 2,
    categories: [
      { id: 201, groupId: 2, name: "Europa", nameEn: "Europe", slug: "europa", sortOrder: 1 },
      { id: 202, groupId: 2, name: "USA", nameEn: "USA", slug: "usa", sortOrder: 2 },
      { id: 203, groupId: 2, name: "Wielka Brytania", nameEn: "United Kingdom", slug: "wielka-brytania", sortOrder: 3 },
      { id: 204, groupId: 2, name: "Holandia", nameEn: "Netherlands", slug: "holandia", sortOrder: 4 },
      { id: 205, groupId: 2, name: "Niemcy", nameEn: "Germany", slug: "niemcy", sortOrder: 5 },
      { id: 206, groupId: 2, name: "Hiszpania", nameEn: "Spain", slug: "hiszpania", sortOrder: 6 },
      { id: 207, groupId: 2, name: "Włochy", nameEn: "Italy", slug: "wlochy", sortOrder: 7 },
      { id: 208, groupId: 2, name: "Dania", nameEn: "Denmark", slug: "dania", sortOrder: 8 },
      { id: 209, groupId: 2, name: "Szwecja", nameEn: "Sweden", slug: "szwecja", sortOrder: 9 },
      { id: 210, groupId: 2, name: "Kanada", nameEn: "Canada", slug: "kanada", sortOrder: 10 },
    ],
  },
  {
    id: 3,
    name: "Kierunki",
    nameEn: "Subjects",
    slug: "kierunki",
    sortOrder: 3,
    categories: [
      { id: 301, groupId: 3, name: "Ekonomia i biznes", nameEn: "Economics and business", slug: "ekonomia", sortOrder: 1 },
      { id: 302, groupId: 3, name: "Prawo", nameEn: "Law", slug: "prawo", sortOrder: 2 },
      { id: 303, groupId: 3, name: "Psychologia", nameEn: "Psychology", slug: "psychologia", sortOrder: 3 },
      { id: 304, groupId: 3, name: "Medycyna", nameEn: "Medicine", slug: "medycyna", sortOrder: 4 },
      { id: 305, groupId: 3, name: "Informatyka", nameEn: "Computer science", slug: "informatyka", sortOrder: 5 },
    ],
  },
  {
    id: 4,
    name: "Finansowanie",
    nameEn: "Funding",
    slug: "finansowanie",
    sortOrder: 4,
    categories: [
      { id: 401, groupId: 4, name: "Koszty studiów", nameEn: "Tuition and costs", slug: "koszty", sortOrder: 1 },
      { id: 402, groupId: 4, name: "Stypendia", nameEn: "Scholarships", slug: "stypendia", sortOrder: 2 },
      { id: 403, groupId: 4, name: "Financial aid", nameEn: "Financial aid", slug: "financial-aid", sortOrder: 3 },
      { id: 404, groupId: 4, name: "Darmowe studia", nameEn: "Tuition-free study", slug: "darmowe-studia", sortOrder: 4 },
    ],
  },
];

export const STATIC_ARTICLE_TAXONOMY = STATIC_ARTICLE_TAXONOMY_PL;

export function getStaticArticleTaxonomy(language: "pl" | "en" = "pl"): ArticleCategoryGroup[] {
  return STATIC_ARTICLE_TAXONOMY_PL.map((group) => ({
    ...group,
    name: language === "en" ? group.nameEn || group.name : group.name,
    categories: group.categories.map((category) => ({
      ...category,
      name: language === "en" ? category.nameEn || category.name : category.name,
    })),
  }));
}
