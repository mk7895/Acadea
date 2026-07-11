import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, ".import-jsons", "acadea_restore_4_countries_with_workflow_tiles.json");
const shellsPath = path.join(root, ".local-work", "docs", "uk_application_group_shells_2027.json");
const outputPath = path.join(
  root,
  ".import-jsons",
  "acadea_restore_4_countries_with_uk_client_ready_import_safe.json",
);

const data = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const shellsPlan = JSON.parse(fs.readFileSync(shellsPath, "utf8"));

const UK_GUIDE_ORDER = [
  "university-of-oxford",
  "university-of-cambridge",
  "imperial-college-london",
  "london-school-of-economics",
  "ucl",
  "king-s-college-london",
  "queen-mary-university-london",
  "university-of-warwick",
  "durham-university",
  "university-of-bath",
  "university-of-st-andrews",
  "university-of-edinburgh",
  "university-of-manchester",
];

const PLAN_SLUG_TO_GUIDE_SLUG = {
  "kings-college-london": "king-s-college-london",
  "queen-mary-university-of-london": "queen-mary-university-london",
};

const UK_SLUG_SET = new Set(UK_GUIDE_ORDER);

const GUIDE_OVERRIDES = {
  "university-of-oxford": {
    summary:
      "Planistyczny przewodnik ACADEA do wyboru właściwej ścieżki aplikacji na Oxford: UCAS, testy UAT-UK, LNAT, UCAT, interview, written work i portfolio.",
    routeLine:
      "Aplikacja idzie przez **UCAS**. Dla Oxford obowiązuje w praktyce bardzo wczesne planowanie, bo wiele kierunków ma dodatkowy test, written work albo interview.",
  },
  "university-of-cambridge": {
    summary:
      "Planistyczny przewodnik ACADEA do rozpoznania właściwej ścieżki Cambridge: UCAS, TMUA, ESAT, LNAT, UCAT, college assessments i interview.",
    routeLine:
      "Aplikacja idzie przez **UCAS**, ale Cambridge bardzo często dokłada własną logikę selekcji: preregistration tests, college assessments i interview.",
  },
  "imperial-college-london": {
    summary:
      "Planistyczny przewodnik ACADEA do aplikacji na Imperial z rozróżnieniem na ścieżki TMUA, ESAT, UCAT i ewentualne interview.",
    routeLine:
      "Aplikacja idzie przez **UCAS**. Kluczowe jest szybkie ustalenie, czy Twój kierunek wpada do koszyka **TMUA**, **ESAT** albo **UCAT**.",
  },
  "london-school-of-economics": {
    summary:
      "Planistyczny przewodnik ACADEA do aplikacji na LSE z podziałem na standardową ścieżkę UCAS, LNAT oraz kierunki z TMUA obowiązkowym lub rekomendowanym.",
    routeLine:
      "Aplikacja idzie przez **UCAS**. Największa różnica między kierunkami dotyczy tego, czy wpadasz w ścieżkę **LNAT**, **TMUA required** albo **TMUA recommended**.",
  },
  ucl: {
    summary:
      "Planistyczny przewodnik ACADEA do aplikacji na UCL: standard UCAS, prawo z LNAT, medycyna z UCAT oraz kierunki z portfolio lub selection day.",
    routeLine:
      "Aplikacja idzie przez **UCAS**, ale UCL ma kilka wyraźnie odmiennych ścieżek: law, medicine oraz kierunki artystyczne, architektoniczne i medialne.",
  },
  "king-s-college-london": {
    summary:
      "Planistyczny przewodnik ACADEA do aplikacji na King's: standard UCAS, LNAT dla prawa, UCAT dla kierunków klinicznych i Casper dla wybranych ścieżek stomatologicznych.",
    routeLine:
      "Aplikacja idzie przez **UCAS**. Najważniejsze rozróżnienie to standardowe kierunki vs. law, medicine/dentistry oraz Dental Therapy & Hygiene z Casper.",
  },
  "queen-mary-university-london": {
    summary:
      "Planistyczny przewodnik ACADEA do aplikacji na Queen Mary z rozróżnieniem między standardowym UCAS a ścieżką kliniczną z UCAT.",
    routeLine:
      "Aplikacja idzie przez **UCAS**. Większość kierunków to standardowa ścieżka bez dodatkowego testu, a wyjątkiem są medycyna i stomatologia z **UCAT**.",
  },
  "university-of-warwick": {
    summary:
      "Planistyczny przewodnik ACADEA do aplikacji na Warwick z rozróżnieniem na standardowy UCAS i szczególną ścieżkę prawa bez LNAT.",
    routeLine:
      "Aplikacja idzie przez **UCAS**. Dla Warwick ważniejsze od egzaminów dodatkowych jest rozpoznanie, czy kierunek ma po prostu standardową selekcję na podstawie aplikacji.",
  },
  "durham-university": {
    summary:
      "Planistyczny przewodnik ACADEA do aplikacji na Durham: standard UCAS, LNAT dla prawa i test matematyczny dla wybranych ścieżek matematycznych.",
    routeLine:
      "Aplikacja idzie przez **UCAS**. Największe różnice dotyczą prawa z **LNAT** i matematyki, gdzie Durham mocno zachęca do subject-specific test.",
  },
  "university-of-bath": {
    summary:
      "Planistyczny przewodnik ACADEA do aplikacji na Bath: standard UCAS oraz wyróżniona ścieżka architektury z możliwym interview bez klasycznego portfolio na starcie.",
    routeLine:
      "Aplikacja idzie przez **UCAS**. Dla większości kierunków to standardowa ścieżka, ale architektura ma własną logikę oceny i może obejmować interview.",
  },
  "university-of-st-andrews": {
    summary:
      "Planistyczny przewodnik ACADEA do aplikacji na St Andrews: UCAS, Common App lub direct application oraz osobna ścieżka medyczna z UCAT.",
    routeLine:
      "St Andrews jest wyjątkowe, bo kandydat międzynarodowy może kwalifikować się do **UCAS**, **Common App** albo **Direct Application**. Trzeba wybrać jedną trasę, a nie dublować zgłoszenia.",
  },
  "university-of-edinburgh": {
    summary:
      "Planistyczny przewodnik ACADEA do aplikacji na Edinburgh: standard UCAS, medycyna z UCAT i kierunki ECA z portfolio.",
    routeLine:
      "Aplikacja idzie przez **UCAS**. Najważniejszy podział to standardowe kierunki, medycyna z **UCAT** oraz art and design z **portfolio**.",
  },
  "university-of-manchester": {
    summary:
      "Planistyczny przewodnik ACADEA do aplikacji na Manchester: standard UCAS, kierunki kliniczne z UCAT i architektura z digital portfolio.",
    routeLine:
      "Aplikacja idzie przez **UCAS**. Wyraźne wyjątki od standardowej ścieżki to **medicine/dentistry z UCAT** i **architecture z digital portfolio**.",
  },
};

const STANDARD_TYPE_TEXT = {
  ucas_standard: "Standardowa ścieżka UCAS",
  tmua_required: "Kierunki wymagające TMUA",
  esat_required: "Kierunki wymagające ESAT",
  tara_required: "Kierunki wymagające TARA",
  lnat_required: "Kierunki wymagające LNAT",
  ucat_required: "Kierunki wymagające UCAT",
  written_work_required: "Kierunki wymagające written work lub dodatkowych materiałów pisemnych",
  portfolio_required: "Kierunki wymagające portfolio, audition albo innych materiałów twórczych",
  interview_shortlisted: "Interview po shortlistingu",
  interview_required: "Interview lub dodatkowy etap selekcji",
  college_assessment: "College assessment po shortlistingu",
  tmua_recommended: "Kierunki, przy których TMUA jest rekomendowany, ale nieobowiązkowy",
  qualification_contingent_assessment: "Dodatkowa selekcja zależna od kwalifikacji lub indywidualnego przypadku",
  casper_required: "Kierunki wymagające Casper",
  law_no_lnat: "Prawo bez LNAT",
  tmua_or_maths_test: "Matematyka z subject-specific test",
  interview_possible_no_portfolio:
    "Architektura lub kierunki z możliwym interview bez klasycznego portfolio na starcie",
  alternative_application_route:
    "Alternatywna ścieżka aplikacji poza klasycznym UCAS",
};

function toGuideSlug(planSlug) {
  return PLAN_SLUG_TO_GUIDE_SLUG[planSlug] || planSlug;
}

function formatCourseList(courseExamples, selectionType) {
  if (!courseExamples || courseExamples.length === 0) return "";
  const hasBroadBucket =
    selectionType === "ucas_standard" ||
    selectionType === "college_assessment" ||
    selectionType === "alternative_application_route";
  const listed = courseExamples.slice(0, 10).join(", ");
  if (courseExamples.length > 10) {
    return `${listed} oraz inne podobne kierunki w tym samym koszyku selekcji.`;
  }
  if (hasBroadBucket) {
    return `${listed} oraz inne kierunki o tej samej logice aplikacyjnej.`;
  }
  return listed + ".";
}

function shellDescription(shell) {
  const heading = STANDARD_TYPE_TEXT[shell.selectionType] || shell.label;
  const courses = formatCourseList(shell.courseExamples, shell.selectionType);
  switch (shell.selectionType) {
    case "ucas_standard":
      return `- **${heading}:** ${courses} Ten koszyk nie ma obowiązkowego testu preregistration, ale nadal może wymagać bardzo mocnego profilu akademickiego, personal statementu i czasem dalszej selekcji po shortliście.`;
    case "tmua_required":
    case "esat_required":
    case "tara_required":
    case "lnat_required":
    case "ucat_required":
    case "casper_required":
      return `- **${heading}:** ${courses} Tu trzeba zaplanować rejestrację i przygotowanie do konkretnego testu z dużym wyprzedzeniem.`;
    case "tmua_recommended":
      return `- **${heading}:** ${courses} To nie jest formalny wymóg, ale mocny wynik może realnie wzmocnić aplikację w bardzo konkurencyjnych kierunkach ilościowych.`;
    case "written_work_required":
      return `- **${heading}:** ${courses} Oprócz UCAS trzeba zwykle przygotować i wysłać próbki pracy pisemnej zgodnie z instrukcją uczelni albo college'u.`;
    case "portfolio_required":
      return `- **${heading}:** ${courses} Ta ścieżka wymaga osobnego przygotowania materiałów twórczych, a czasem także interview, review albo audition.`;
    case "interview_shortlisted":
    case "interview_required":
      return `- **${heading}:** ${courses} Po mocnej aplikacji papierowej selekcja przechodzi jeszcze do rozmowy albo innego etapu oceny.`;
    case "college_assessment":
      return `- **${heading}:** ${courses} To nie jest klasyczny test preregistration; assessment organizuje college po shortliście i trzeba pilnować komunikacji bezpośrednio z Cambridge.`;
    case "qualification_contingent_assessment":
      return `- **${heading}:** ${courses} Ten etap pojawia się tylko w określonych profilach kandydatów lub kwalifikacji, więc trzeba sprawdzić własny przypadek na stronie kierunku.`;
    case "law_no_lnat":
      return `- **${heading}:** ${courses} To ważne rozróżnienie planistyczne: prawo na tej uczelni nie wymaga LNAT, więc ciężar selekcji zostaje na profilu akademickim i jakości całej aplikacji.`;
    case "tmua_or_maths_test":
      return `- **${heading}:** ${courses} Ta ścieżka wymaga sprawdzenia, czy Durham oczekuje od Ciebie TMUA albo innego uznawanego testu matematycznego.`;
    case "interview_possible_no_portfolio":
      return `- **${heading}:** ${courses} To inna logika niż klasyczne portfolio-first: uczelnia może zaprosić na interview lub inny etap oceny nawet bez pełnego art portfolio na starcie.`;
    case "alternative_application_route":
      return `- **${heading}:** ${courses} Ta uczelnia dopuszcza alternatywną trasę zgłoszenia, ale trzeba wybrać jedną ścieżkę aplikacyjną i nie dublować zgłoszeń.`;
    default:
      return `- **${heading}:** ${courses}`;
  }
}

function buildGuideDescription(guide, shells) {
  const override = GUIDE_OVERRIDES[guide.slug];
  const sections = [];
  sections.push(`Przewodnik dotyczy aplikacji na **${guide.title}**.`);
  sections.push(override.routeLine);
  sections.push(
    "Ten przewodnik jest zbudowany jako **planista typów aplikacji**: najpierw rozpoznajesz właściwy koszyk selekcji dla swojego kierunku, a dopiero potem dopinasz dokumenty i terminy.",
  );
  sections.push("## Typy aplikacji i kierunki");
  for (const shell of shells) sections.push(shellDescription(shell));
  sections.push("## Jak używać tego przewodnika");
  sections.push(
    "1. Najpierw znajdź w powyższej liście koszyk odpowiadający Twojemu kierunkowi.",
  );
  sections.push(
    "2. Następnie ustaw plan pod wymagany test, portfolio, written work albo interview.",
  );
  sections.push(
    "3. Na końcu dopnij samą ścieżkę zgłoszenia: UCAS, Common App albo inny dopuszczony kanał.",
  );
  sections.push(
    `_Stan weryfikacji: 10 lipca 2026. Zakres obejmuje wszystkie uczelnie UK z obecnej listy ACADEA i ich główne rodziny selekcji dla 2027 entry._`,
  );
  return sections.join("\n\n");
}

function buildGuideItems(guide, shells) {
  const routeShell = shells.find((shell) =>
    ["ucas_standard", "alternative_application_route"].includes(shell.selectionType),
  );
  const testShells = shells.filter((shell) =>
    [
      "tmua_required",
      "esat_required",
      "tara_required",
      "lnat_required",
      "ucat_required",
      "tmua_recommended",
      "casper_required",
      "tmua_or_maths_test",
      "qualification_contingent_assessment",
    ].includes(shell.selectionType),
  );
  const supplementalShells = shells.filter((shell) =>
    [
      "portfolio_required",
      "written_work_required",
      "college_assessment",
      "interview_required",
      "interview_shortlisted",
      "interview_possible_no_portfolio",
      "law_no_lnat",
    ].includes(shell.selectionType),
  );
  return [
    {
      sortOrder: 0,
      sectionTitle: "Strategia",
      title: "Rozpoznaj właściwy typ rekrutacji dla swojego kierunku",
      description:
        "Najpierw ustal, do którego koszyka aplikacyjnego należy Twój kierunek na tej uczelni: standard UCAS, test ilościowy, law, medicine, portfolio albo interview route.",
      itemType: "todo",
    },
    {
      sortOrder: 1,
      sectionTitle: "Testy i selekcja",
      title: "Zarejestruj test albo dodatkowy etap z odpowiednim wyprzedzeniem",
      description:
        testShells.length > 0
          ? `Na tej uczelni najważniejsze wyjątki od standardowej ścieżki to: ${testShells
              .map((shell) => STANDARD_TYPE_TEXT[shell.selectionType] || shell.label)
              .join(", ")}.`
          : "Ta uczelnia opiera większość selekcji na standardowej aplikacji i ewentualnej późniejszej ocenie bez odrębnego preregistration test.",
      itemType: "todo",
    },
    {
      sortOrder: 2,
      sectionTitle: "Aplikacja",
      title: "Przygotuj właściwą trasę zgłoszenia",
      description:
        guide.slug === "university-of-st-andrews"
          ? "Dla St Andrews porównaj UCAS z Common App albo Direct Application i złóż tylko jedno zgłoszenie zgodne z Twoją kwalifikowalnością."
          : routeShell
            ? `Dla tej uczelni podstawową trasą jest ${STANDARD_TYPE_TEXT[routeShell.selectionType].toLowerCase()}.`
            : "Ustal podstawową trasę zgłoszenia na stronie uczelni i nie dubluj aplikacji w kilku systemach jednocześnie.",
      itemType: "todo",
    },
    {
      sortOrder: 3,
      sectionTitle: "Dodatki",
      title: "Dopnij portfolio, written work albo interview, jeśli Twój koszyk tego wymaga",
      description:
        supplementalShells.length > 0
          ? `Na tej uczelni trzeba szczególnie uważać na: ${supplementalShells
              .map((shell) => STANDARD_TYPE_TEXT[shell.selectionType] || shell.label)
              .join(", ")}.`
          : "Jeżeli Twój kierunek nie wpada do dodatkowej ścieżki selekcyjnej, skup się na jakości samej aplikacji UCAS i terminach uczelni.",
      itemType: "todo",
    },
  ];
}

function replaceUkGuides() {
  const planBySlug = new Map(
    shellsPlan.universities.map((entry) => [toGuideSlug(entry.slug), entry]),
  );
  data.guides = data.guides.map((guide) => {
    if (!UK_SLUG_SET.has(guide.slug)) return guide;
    const plan = planBySlug.get(guide.slug);
    if (!plan) throw new Error(`Missing shells plan for UK guide ${guide.slug}`);
    return {
      ...guide,
      summary: GUIDE_OVERRIDES[guide.slug].summary,
      descriptionMarkdown: buildGuideDescription(guide, plan.shells),
      estimatedReadMin: Math.max(10, Math.min(18, plan.shells.length + 6)),
      items: buildGuideItems(guide, plan.shells),
    };
  });
}

function hasUkScope(row) {
  if (row.country === "Wielka Brytania") return true;
  const slugs = row.appliesToGuideSlugs || [];
  return slugs.some((slug) => UK_SLUG_SET.has(slug));
}

function unionGuideSlugs(rows) {
  return Array.from(
    new Set(
      rows.flatMap((row) => (Array.isArray(row.appliesToGuideSlugs) ? row.appliesToGuideSlugs : [])),
    ),
  ).sort();
}

function makeCountryRow(slugs) {
  return {
    actionType: "check_only",
    level: "country",
    task: "",
    university: "",
    country: "Wielka Brytania",
    appliesToGuideSlugs: slugs,
  };
}

function makeUniversityRow(university, slug) {
  return {
    actionType: "check_only",
    level: "university",
    task: "",
    university,
    appliesToGuideSlugs: [slug],
  };
}

function makeItemRow(university, slug, task, extra = {}) {
  return {
    actionType: "check_only",
    level: "item",
    task,
    university,
    appliesToGuideSlugs: [slug],
    ...extra,
  };
}

function makePortfolioRow(university, slug, task, suggestedFilename) {
  return {
    actionType: "check_or_file",
    level: "item",
    task,
    university,
    appliesToGuideSlugs: [slug],
    suggestedFilename,
  };
}

function ukCentralizedRows() {
  const slugs = [...UK_GUIDE_ORDER];
  return [
    makeCountryRow(slugs),
    {
      actionType: "check_only",
      level: "item",
      task: "Załóż aplikację w UCAS, uzupełnij dane, edukację, predicted grades i sekcję rekomendacji",
      university: "UCAS - wspólny etap aplikacji",
      appliesToGuideSlugs: slugs,
    },
    makeUniversityRow("University of Oxford", "university-of-oxford"),
    makeItemRow(
      "University of Oxford",
      "university-of-oxford",
      "Dodaj kurs Oxford do UCAS i pilnuj early deadline właściwego dla Oxford",
    ),
    makeUniversityRow("University of Cambridge", "university-of-cambridge"),
    makeItemRow(
      "University of Cambridge",
      "university-of-cambridge",
      "Dodaj kurs Cambridge do UCAS i pilnuj early deadline właściwego dla Cambridge",
    ),
    makeUniversityRow("Imperial College London", "imperial-college-london"),
    makeItemRow(
      "Imperial College London",
      "imperial-college-london",
      "Dodaj kurs Imperial do UCAS i od razu sprawdź, czy potrzebujesz TMUA, ESAT albo UCAT",
    ),
    makeUniversityRow("London School of Economics", "london-school-of-economics"),
    makeItemRow(
      "London School of Economics",
      "london-school-of-economics",
      "Dodaj kurs LSE do UCAS i sprawdź, czy Twój kierunek wpada do ścieżki LNAT albo TMUA",
    ),
    makeUniversityRow("UCL", "ucl"),
    makeItemRow(
      "UCL",
      "ucl",
      "Dodaj kurs UCL do UCAS i sprawdź, czy oprócz zgłoszenia potrzebny będzie LNAT, UCAT, portfolio albo selection day",
    ),
    makeUniversityRow("King's College London", "king-s-college-london"),
    makeItemRow(
      "King's College London",
      "king-s-college-london",
      "Dodaj kurs King's do UCAS i sprawdź, czy kierunek wymaga LNAT, UCAT albo Casper",
    ),
    makeUniversityRow("Queen Mary University London", "queen-mary-university-london"),
    makeItemRow(
      "Queen Mary University London",
      "queen-mary-university-london",
      "Dodaj kurs Queen Mary do UCAS; dla medicine i dentistry zaplanuj też UCAT",
    ),
    makeUniversityRow("University of Warwick", "university-of-warwick"),
    makeItemRow(
      "University of Warwick",
      "university-of-warwick",
      "Dodaj kurs Warwick do UCAS i sprawdź, czy aplikujesz standardowo czy do prawa bez LNAT",
    ),
    makeUniversityRow("Durham University", "durham-university"),
    makeItemRow(
      "Durham University",
      "durham-university",
      "Dodaj kurs Durham do UCAS; dla prawa sprawdź LNAT, a dla matematyki subject-specific test",
    ),
    makeUniversityRow("University of Bath", "university-of-bath"),
    makeItemRow(
      "University of Bath",
      "university-of-bath",
      "Dodaj kurs Bath do UCAS; dla architektury sprawdź od razu logikę interview i dalszej oceny",
    ),
    makeUniversityRow("University of St Andrews", "university-of-st-andrews"),
    makeItemRow(
      "University of St Andrews",
      "university-of-st-andrews",
      "Jeśli aplikujesz przez UCAS, dodaj kurs St Andrews do UCAS i nie duplikuj zgłoszenia w innym systemie",
    ),
    makeItemRow(
      "University of St Andrews",
      "university-of-st-andrews",
      "Jeśli kwalifikujesz się do alternatywnej ścieżki, porównaj UCAS z Common App albo Direct Application i wybierz tylko jedną trasę",
    ),
    makeUniversityRow("University of Edinburgh", "university-of-edinburgh"),
    makeItemRow(
      "University of Edinburgh",
      "university-of-edinburgh",
      "Dodaj kurs Edinburgh do UCAS; dla medycyny i kierunków ECA od razu sprawdź etapy dodatkowe",
    ),
    makeUniversityRow("University of Manchester", "university-of-manchester"),
    makeItemRow(
      "University of Manchester",
      "university-of-manchester",
      "Dodaj kurs Manchester do UCAS; dla medicine, dentistry i architecture sprawdź od razu etapy dodatkowe",
    ),
  ];
}

function ukExamRows() {
  const slugs = [...UK_GUIDE_ORDER];
  return [
    makeCountryRow(slugs),
    makeUniversityRow("University of Oxford", "university-of-oxford"),
    makeItemRow(
      "University of Oxford",
      "university-of-oxford",
      "Standardowe kierunki Oxford bez TMUA, ESAT, TARA, LNAT i UCAT nadal wymagają bardzo wczesnego przygotowania pod shortlist i interview",
    ),
    makeItemRow(
      "University of Oxford",
      "university-of-oxford",
      "TMUA: Computer Science, Computer Science and Philosophy, Mathematics, Mathematics and Computer Science, Mathematics and Philosophy, Mathematics and Statistics",
    ),
    makeItemRow(
      "University of Oxford",
      "university-of-oxford",
      "ESAT: Biomedical Sciences, Engineering Science, Physics, Physics and Philosophy",
    ),
    makeItemRow(
      "University of Oxford",
      "university-of-oxford",
      "TARA: Economics and Management, History and Economics, History and Politics, Human Sciences, PPE, Psychology (Experimental), Psychology, Philosophy and Linguistics",
    ),
    makeItemRow(
      "University of Oxford",
      "university-of-oxford",
      "LNAT: Law (Jurisprudence) oraz Law with Law Studies in Europe",
    ),
    makeItemRow(
      "University of Oxford",
      "university-of-oxford",
      "UCAT: Medicine",
    ),
    makeItemRow(
      "University of Oxford",
      "university-of-oxford",
      "Po shortliście przygotuj się na interview, bo to nadal kluczowy etap selekcji w większości kursów Oxford",
    ),
    makeUniversityRow("University of Cambridge", "university-of-cambridge"),
    makeItemRow(
      "University of Cambridge",
      "university-of-cambridge",
      "Standardowe kierunki Cambridge bez preregistration test nadal mogą przejść do college assessment albo interview",
    ),
    makeItemRow(
      "University of Cambridge",
      "university-of-cambridge",
      "TMUA: Computer Science, Economics, Mathematics",
    ),
    makeItemRow(
      "University of Cambridge",
      "university-of-cambridge",
      "ESAT: Chemical Engineering and Biotechnology, Engineering, Natural Sciences, Veterinary Medicine",
    ),
    makeItemRow(
      "University of Cambridge",
      "university-of-cambridge",
      "LNAT: Law",
    ),
    makeItemRow(
      "University of Cambridge",
      "university-of-cambridge",
      "UCAT: Medicine (Standard Course) oraz Medicine (Graduate Course)",
    ),
    makeItemRow(
      "University of Cambridge",
      "university-of-cambridge",
      "College assessment po shortliście: m.in. Architecture, Asian and Middle Eastern Studies, Classics, Design, English, Geography, History, HSPS, Music, Philosophy i inne kierunki przypisane przez college",
    ),
    makeItemRow(
      "University of Cambridge",
      "university-of-cambridge",
      "Po shortliście przygotuj się na interview zgodnie z instrukcjami college'u",
    ),
    makeUniversityRow("Imperial College London", "imperial-college-london"),
    makeItemRow(
      "Imperial College London",
      "imperial-college-london",
      "TMUA: Computing, Mathematics, Mathematics with Computer Science oraz Economics, Finance and Data Science",
    ),
    makeItemRow(
      "Imperial College London",
      "imperial-college-london",
      "ESAT: Aeronautical Engineering, Chemical Engineering, Civil Engineering, Design Engineering, Electrical and Electronic Engineering, Life Sciences, Mechanical Engineering, Physics oraz pokrewne ścieżki science and engineering",
    ),
    makeItemRow(
      "Imperial College London",
      "imperial-college-london",
      "UCAT: Medicine",
    ),
    makeItemRow(
      "Imperial College London",
      "imperial-college-london",
      "Jeśli Twój kurs Imperial przewiduje dalszą selekcję, przygotuj się na interview albo inny dodatkowy etap po ocenie aplikacji",
    ),
    makeUniversityRow("London School of Economics", "london-school-of-economics"),
    makeItemRow(
      "London School of Economics",
      "london-school-of-economics",
      "Standardowe kierunki LSE bez LNAT i TMUA są oceniane wyłącznie na podstawie bardzo mocnej aplikacji UCAS; LSE nie prowadzi interview dla undergraduate",
    ),
    makeItemRow(
      "London School of Economics",
      "london-school-of-economics",
      "TMUA obowiązkowy: Economics oraz Econometrics and Mathematical Economics",
    ),
    makeItemRow(
      "London School of Economics",
      "london-school-of-economics",
      "TMUA rekomendowany: Actuarial Science, Actuarial Science with Placement, Data Science, Economics and Data Science, Financial Mathematics and Statistics, Mathematics and Economics, Mathematics with Economics, Mathematics, Statistics and Business",
    ),
    makeItemRow(
      "London School of Economics",
      "london-school-of-economics",
      "LNAT: LLB Laws",
    ),
    makeUniversityRow("UCL", "ucl"),
    makeItemRow(
      "UCL",
      "ucl",
      "Standardowe kierunki UCL są oceniane przez UCAS bez obowiązkowego testu preregistration, ale część ścieżek ma selection day, portfolio albo interview",
    ),
    makeItemRow(
      "UCL",
      "ucl",
      "LNAT: wszystkie ścieżki LLB Law, w tym Law with a European Legal System",
    ),
    makeItemRow(
      "UCL",
      "ucl",
      "UCAT: Medicine",
    ),
    makeItemRow(
      "UCL",
      "ucl",
      "Wybrane kierunki, np. MPharm, mogą dodawać selection day, test albo interview po shortliście",
    ),
    makeUniversityRow("King's College London", "king-s-college-london"),
    makeItemRow(
      "King's College London",
      "king-s-college-london",
      "Standardowe kierunki King's nie wymagają dodatkowego testu preregistration poza wyjątkami opisanymi niżej",
    ),
    makeItemRow(
      "King's College London",
      "king-s-college-london",
      "LNAT: Law oraz Politics, Philosophy and Law",
    ),
    makeItemRow(
      "King's College London",
      "king-s-college-london",
      "UCAT: Medicine i Dentistry",
    ),
    makeItemRow(
      "King's College London",
      "king-s-college-london",
      "Casper: Dental Therapy and Hygiene",
    ),
    makeUniversityRow("Queen Mary University London", "queen-mary-university-london"),
    makeItemRow(
      "Queen Mary University London",
      "queen-mary-university-london",
      "Standardowe kierunki Queen Mary, w tym undergraduate law, nie wymagają LNAT",
    ),
    makeItemRow(
      "Queen Mary University London",
      "queen-mary-university-london",
      "UCAT: Medicine i Dentistry",
    ),
    makeUniversityRow("University of Warwick", "university-of-warwick"),
    makeItemRow(
      "University of Warwick",
      "university-of-warwick",
      "Standardowe kierunki Warwick są oceniane głównie na podstawie aplikacji UCAS bez obowiązkowego testu preregistration",
    ),
    makeItemRow(
      "University of Warwick",
      "university-of-warwick",
      "Law w Warwick obecnie nie wymaga LNAT, więc ciężar selekcji spoczywa na profilu akademickim i jakości całej aplikacji",
    ),
    makeUniversityRow("Durham University", "durham-university"),
    makeItemRow(
      "Durham University",
      "durham-university",
      "Standardowe kierunki Durham są zwykle oceniane bez dodatkowego testu preregistration",
    ),
    makeItemRow(
      "Durham University",
      "durham-university",
      "LNAT: Law",
    ),
    makeItemRow(
      "Durham University",
      "durham-university",
      "Mathematics test: Durham mocno zachęca kandydatów na matematykę do wyniku z TMUA albo innego akceptowanego testu matematycznego",
    ),
    makeUniversityRow("University of Bath", "university-of-bath"),
    makeItemRow(
      "University of Bath",
      "university-of-bath",
      "Większość kierunków Bath przechodzi standardowo przez UCAS bez obowiązkowego testu preregistration",
    ),
    makeItemRow(
      "University of Bath",
      "university-of-bath",
      "Architecture może obejmować interview albo inny etap oceny po shortliście, mimo że nie działa tu klasyczny model portfolio-first",
    ),
    makeUniversityRow("University of St Andrews", "university-of-st-andrews"),
    makeItemRow(
      "University of St Andrews",
      "university-of-st-andrews",
      "Standardowe kierunki St Andrews zwykle nie wymagają dodatkowego testu preregistration",
    ),
    makeItemRow(
      "University of St Andrews",
      "university-of-st-andrews",
      "UCAT: Medicine",
    ),
    makeUniversityRow("University of Edinburgh", "university-of-edinburgh"),
    makeItemRow(
      "University of Edinburgh",
      "university-of-edinburgh",
      "Standardowe kierunki Edinburgh zwykle nie wymagają dodatkowego testu preregistration",
    ),
    makeItemRow(
      "University of Edinburgh",
      "university-of-edinburgh",
      "UCAT: Medicine",
    ),
    makeUniversityRow("University of Manchester", "university-of-manchester"),
    makeItemRow(
      "University of Manchester",
      "university-of-manchester",
      "Standardowe kierunki Manchester zwykle nie wymagają dodatkowego testu preregistration",
    ),
    makeItemRow(
      "University of Manchester",
      "university-of-manchester",
      "UCAT: Medicine i Dentistry",
    ),
  ];
}

function ukPortfolioRows() {
  const rows = [
    {
      level: "country",
      country: "Wielka Brytania",
      university: "",
      task: "",
      actionType: "check_only",
      appliesToGuideSlugs: [
        "university-of-oxford",
        "university-of-cambridge",
        "ucl",
        "university-of-bath",
        "university-of-edinburgh",
        "university-of-manchester",
      ],
    },
    makeUniversityRow("University of Oxford", "university-of-oxford"),
    makePortfolioRow(
      "University of Oxford",
      "university-of-oxford",
      "Fine Art wymaga digital portfolio; część kierunków humanistycznych i językowych może wymagać written work lub dodatkowych materiałów muzycznych",
      "oxford-portfolio-written-work.pdf",
    ),
    makeUniversityRow("University of Cambridge", "university-of-cambridge"),
    makePortfolioRow(
      "University of Cambridge",
      "university-of-cambridge",
      "Architecture oraz wybrane kierunki arts and humanities mogą wymagać portfolio, written work albo innych materiałów dodatkowych zgodnie z instrukcjami college'u",
      "cambridge-portfolio-written-work.pdf",
    ),
    makeUniversityRow("UCL", "ucl"),
    makePortfolioRow(
      "UCL",
      "ucl",
      "Portfolio: Architecture (Bartlett), Fine Art (Slade), Art and Technology, BA Media oraz inne wybrane kierunki kreatywne wymagające przesłania prac",
      "ucl-portfolio-creative-courses.pdf",
    ),
    makeUniversityRow("University of Bath", "university-of-bath"),
    makePortfolioRow(
      "University of Bath",
      "university-of-bath",
      "Architecture w Bath wymaga przygotowania się do oceny twórczej i możliwego interview, ale nie działa tu klasyczny obowiązkowy portfolio-first jak na części innych uczelni",
      "bath-architecture-creative-evidence.pdf",
    ),
    makeUniversityRow("University of Edinburgh", "university-of-edinburgh"),
    makePortfolioRow(
      "University of Edinburgh",
      "university-of-edinburgh",
      "Portfolio: m.in. Fine Art, Graphic Design, Illustration, Interior Design, Jewellery and Silversmithing, Performance Costume, Product Design, Textiles, Fashion, Animation i inne kierunki Edinburgh College of Art",
      "edinburgh-college-of-art-portfolio.pdf",
    ),
    makeUniversityRow("University of Manchester", "university-of-manchester"),
    makePortfolioRow(
      "University of Manchester",
      "university-of-manchester",
      "Digital portfolio: BA Architecture w Manchester School of Architecture",
      "manchester-architecture-digital-portfolio.pdf",
    ),
  ];
  return rows;
}

function replaceTemplate(title, ukRowsBuilder) {
  const template = data.materialTemplates.find((entry) => entry.title === title);
  if (!template) throw new Error(`Missing template: ${title}`);
  const nonUkRows = template.rows.filter((row) => !hasUkScope(row));
  const newUkRows = ukRowsBuilder();
  const rows = [...nonUkRows, ...newUkRows];
  template.rows = rows;
  template.appliesToGuideSlugs = unionGuideSlugs(rows);
}

function validate() {
  if (data.version !== 1) throw new Error("version must be 1");
  const guideSlugs = data.guides.map((guide) => guide.slug);
  if (new Set(guideSlugs).size !== guideSlugs.length) {
    throw new Error("Duplicate guide slugs detected");
  }
  for (const template of data.materialTemplates) {
    if (!template.title) throw new Error("Template missing title");
    for (const row of template.rows) {
      if (
        ["file_required", "check_or_file", "file_or_doc"].includes(row.actionType) &&
        !row.suggestedFilename
      ) {
        throw new Error(`Row missing suggestedFilename in template ${template.title}`);
      }
      if (row.actionType === "file_or_doc" && (!row.docTabTitle || !row.docTabPrompt)) {
        throw new Error(`file_or_doc row missing docTab fields in ${template.title}`);
      }
    }
  }
}

replaceUkGuides();
replaceTemplate("Zcentralizowane Portale Aplikacyjne", ukCentralizedRows);
replaceTemplate("Egzaminy i etapy selekcyjne", ukExamRows);
replaceTemplate("Portfolio i audition", ukPortfolioRows);
validate();

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2) + "\n");
console.log(outputPath);
