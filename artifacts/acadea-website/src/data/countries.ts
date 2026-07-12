export type Uni = { name: string; slug: string; blurb: string };
export type Highlight = { label: string; value: string };

export type Country = {
  slug: string;
  updatedAt: string;
  name: string;
  flag: string;
  code: string; // flagcdn 2-letter code
  iso: string[]; // ISO 3166-1 numeric codes used by the globe topology
  tagline: string;
  intro: string;
  highlights: Highlight[];
  unis: Uni[];
};

type CountryTranslationEn = {
  name: string;
  tagline: string;
  intro: string;
  highlights: Highlight[];
  uniBlurbs: Record<string, string>;
};

export const countries: Country[] = [
  // ── WIELKA BRYTANIA ──────────────────────────────────────────────
  {
    slug: "wielka-brytania",
    updatedAt: "2026-06-26",
    name: "Wielka Brytania",
    flag: "🇬🇧",
    code: "gb",
    iso: ["826"],
    tagline: "Oksford, Cambridge i prestiżowe uczelnie Russell Group.",
    intro:
      "Wielka Brytania to kolebka nowoczesnego uniwersytetu i jeden z najbardziej rozpoznawalnych kierunków studiów na świecie. Trzyletnie studia licencjackie, silny nacisk na samodzielną pracę i globalna renoma dyplomu przyciągają najambitniejszych.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski" },
      { label: "Aplikacja", value: "UCAS (do stycznia)" },
    ],
    unis: [
      { name: "University of Oxford", slug: "oxford", blurb: "Najstarszy uniwersytet w świecie anglojęzycznym, słynący z systemu tutorialowego i kolegiów." },
      { name: "University of Cambridge", slug: "cambridge", blurb: "Drugi co do prestiżu na świecie — słynny z nauki, matematyki i systemu kolegiów." },
      { name: "Imperial College London", slug: "imperial", blurb: "Ścisła czołówka w naukach przyrodniczych, inżynierii, medycynie i biznesie technologicznym." },
      { name: "London School of Economics", slug: "lse", blurb: "Światowy lider nauk społecznych, ekonomii i politologii w sercu Londynu." },
      { name: "UCL", slug: "ucl", blurb: "Wszechstronny uniwersytet badawczy z silnymi kierunkami od medycyny po sztukę." },
      { name: "King's College London", slug: "kings", blurb: "Centralnie położona uczelnia Londynu, znana z prawa, medycyny i nauk humanistycznych." },
      { name: "Queen Mary University London", slug: "qmul", blurb: "Uczelnia Russell Group mocna w inżynierii, prawie i naukach o życiu." },
      { name: "University of Warwick", slug: "warwick", blurb: "Jedna z najlepiej ocenianych uczelni UK, ceniona za ekonomię i informatykę." },
      { name: "Durham University", slug: "durham", blurb: "Prestiżowy college'owy kampus na północy Anglii z bogatą tradycją akademicką." },
      { name: "University of Bath", slug: "bath", blurb: "Kameralna uczelnia z silnymi programami inżynieryjnymi i biznesowymi." },
      { name: "University of St Andrews", slug: "st-andrews", blurb: "Najstarsza szkocka uczelnia, znana z badań i malowniczego kampusu nad morzem." },
      { name: "University of Edinburgh", slug: "edinburgh", blurb: "Jeden z największych i najbardziej renomowanych uniwersytetów w Szkocji." },
      { name: "University of Manchester", slug: "manchester", blurb: "Wiodący ośrodek badawczy ze szczególnie silną fizyką i technologiami materiałowymi." },
    ],
  },

  // ── HOLANDIA ────────────────────────────────────────────────────
  {
    slug: "holandia",
    updatedAt: "2026-06-26",
    name: "Holandia",
    flag: "🇳🇱",
    code: "nl",
    iso: ["528"],
    tagline: "Praktyczne podejście i innowacyjne programy po angielsku.",
    intro:
      "Holandia oferuje jedne z najlepszych w Europie programów anglojęzycznych i praktyczne, projektowe podejście do nauki. Jest przyjazna międzynarodowym studentom i świetnie skomunikowana z resztą kontynentu.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski" },
      { label: "Aplikacja", value: "Studielink (do maja)" },
    ],
    unis: [
      { name: "TU Delft", slug: "tu-delft", blurb: "Najlepsza politechnika w kraju, ceniona za inżynierię i architekturę." },
      { name: "Universiteit Leiden", slug: "leiden", blurb: "Najstarszy holenderski uniwersytet, mocny w prawie, humanistyce i naukach ścisłych." },
      { name: "Universiteit van Amsterdam", slug: "uva", blurb: "Największy uniwersytet w Amsterdamie z szeroką ofertą po angielsku." },
      { name: "Utrecht University", slug: "utrecht", blurb: "Czołowy ośrodek badawczy z renomą w naukach o życiu i zrównoważonym rozwoju." },
      { name: "University of Groningen", slug: "groningen", blurb: "Wszechstronny ośrodek z szeroką ofertą po angielsku na północy kraju." },
      { name: "Erasmus University Rotterdam", slug: "erasmus-rotterdam", blurb: "Czołowa europejska szkoła ekonomii, biznesu i nauk o zdrowiu." },
      { name: "Tilburg University", slug: "tilburg", blurb: "Specjalizuje się w ekonomii, prawie, naukach społecznych i humanistycznych." },
      { name: "Maastricht University", slug: "maastricht", blurb: "Znany z metody PBL (problem-based learning) i silnego profilu europejskiego." },
      { name: "Vrije Universiteit Amsterdam", slug: "vu-amsterdam", blurb: "Wszechstronny ośrodek badawczy w południowym Amsterdamie." },
      { name: "University of Twente", slug: "twente", blurb: "Kampusowa uczelnia techniczno-przedsiębiorcza z silnymi programami inżynieryjnymi." },
    ],
  },

  // ── NIEMCY ──────────────────────────────────────────────────────
  {
    slug: "niemcy",
    updatedAt: "2026-06-26",
    name: "Niemcy",
    flag: "🇩🇪",
    code: "de",
    iso: ["276"],
    tagline: "Najwyższy poziom kształcenia, często bez czesnego.",
    intro:
      "Niemcy łączą wysoką jakość kształcenia z symbolicznym lub zerowym czesnym na uczelniach publicznych. To silne kierunki inżynieryjne i ścisłe oraz prężny rynek pracy tuż za granicą.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "niemiecki / angielski" },
      { label: "Koszty", value: "często bez czesnego" },
    ],
    unis: [
      { name: "TU Munich", slug: "tu-munich", blurb: "Najlepsza niemiecka uczelnia techniczna, blisko przemysłu i startupów." },
      { name: "Humboldt Universität Berlin", slug: "humboldt", blurb: "Historyczny berliński uniwersytet, kolebka nowoczesnego modelu badawczego." },
      { name: "Universität Heidelberg", slug: "heidelberg", blurb: "Najstarszy uniwersytet w Niemczech, znany z medycyny i nauk przyrodniczych." },
      { name: "KIT Karlsruhe", slug: "kit", blurb: "Połączenie uniwersytetu i instytutu badawczego — czołówka inżynierii." },
    ],
  },

  // ── IRLANDIA ────────────────────────────────────────────────────
  {
    slug: "irlandia",
    updatedAt: "2026-06-26",
    name: "Irlandia",
    flag: "🇮🇪",
    code: "ie",
    iso: ["372"],
    tagline: "Anglojęzyczny kraj UE i europejska siedziba gigantów tech.",
    intro:
      "Irlandia to anglojęzyczny kraj Unii Europejskiej i europejska siedziba gigantów technologicznych. Studentów przyciąga przyjazne środowisko i mocne powiązania uczelni z biznesem.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski" },
      { label: "Aplikacja", value: "CAO" },
    ],
    unis: [
      { name: "University College Dublin", slug: "ucd", blurb: "Największy uniwersytet w Irlandii z silnym profilem międzynarodowym." },
      { name: "Trinity College Dublin", slug: "trinity", blurb: "Najbardziej prestiżowa irlandzka uczelnia z wielowiekową tradycją." },
      { name: "University College Cork", slug: "ucc", blurb: "Ceniony ośrodek w Cork, mocny w naukach o życiu i biznesie." },
      { name: "University of Galway", slug: "galway", blurb: "Pięknie położony ośrodek na zachodzie Irlandii, mocny w humanistyce i naukach ścisłych." },
    ],
  },

  // ── FRANCJA ─────────────────────────────────────────────────────
  {
    slug: "francja",
    updatedAt: "2026-06-26",
    name: "Francja",
    flag: "🇫🇷",
    code: "fr",
    iso: ["250"],
    tagline: "Elitarne Grandes Écoles i bogata tradycja akademicka.",
    intro:
      "Francja oferuje elitarne Grandes Écoles i bogatą tradycję akademicką. Rośnie liczba programów prowadzonych po angielsku, zwłaszcza w biznesie i naukach ścisłych.",
    highlights: [
      { label: "System", value: "Licence · Master · Doctorat" },
      { label: "Język", value: "francuski / angielski" },
      { label: "Aplikacja", value: "Parcoursup / własne" },
    ],
    unis: [
      { name: "Sciences Po", slug: "sciences-po", blurb: "Czołowa szkoła nauk politycznych i stosunków międzynarodowych." },
      { name: "HEC Paris", slug: "hec", blurb: "Najlepsza szkoła biznesu w Europie kontynentalnej." },
      { name: "Université PSL", slug: "psl", blurb: "Związek elitarnych uczelni paryskich z czołówki rankingów." },
      { name: "École Polytechnique", slug: "polytechnique", blurb: "Najbardziej prestiżowa francuska szkoła inżynierska." },
      { name: "Sorbonne University", slug: "sorbonne", blurb: "Jeden z najstarszych i najbardziej rozpoznawalnych uniwersytetów świata." },
    ],
  },

  // ── SZWAJCARIA ──────────────────────────────────────────────────
  {
    slug: "szwajcaria",
    updatedAt: "2026-06-26",
    name: "Szwajcaria",
    flag: "🇨🇭",
    code: "ch",
    iso: ["756"],
    tagline: "Prestiż, bezpieczeństwo i bliskość międzynarodowych korporacji.",
    intro:
      "Szwajcaria łączy światowy prestiż z bezpieczeństwem i bliskością międzynarodowych korporacji. Uczelnie publiczne oferują najwyższą jakość za umiarkowane czesne.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "ang. / niem. / fr." },
      { label: "Koszty", value: "niskie czesne" },
    ],
    unis: [
      { name: "ETH Zürich", slug: "eth", blurb: "Najlepsza uczelnia techniczna Europy kontynentalnej." },
      { name: "EPFL Lausanne", slug: "epfl", blurb: "Francuskojęzyczna siostra ETH, czołówka inżynierii i IT." },
      { name: "Universität Zürich", slug: "uzh", blurb: "Największy uniwersytet w Szwajcarii, mocny w medycynie i prawie." },
      { name: "Universität Basel", slug: "basel", blurb: "Najstarszy szwajcarski uniwersytet, renomowany w naukach o życiu." },
    ],
  },

  // ── SZWECJA ─────────────────────────────────────────────────────
  {
    slug: "szwecja",
    updatedAt: "2026-06-26",
    name: "Szwecja",
    flag: "🇸🇪",
    code: "se",
    iso: ["752"],
    tagline: "Innowacyjność i darmowe studia dla obywateli UE.",
    intro:
      "Szwecja stawia na pracę zespołową, innowacyjność i zrównoważony rozwój. Studia dla obywateli UE są bezpłatne, a oferta anglojęzyczna bardzo szeroka.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski" },
      { label: "Koszty", value: "bezpłatne dla UE" },
    ],
    unis: [
      { name: "KTH Royal Institute of Technology", slug: "kth", blurb: "Wiodąca szwedzka uczelnia techniczna w Sztokholmie." },
      { name: "Lund University", slug: "lund", blurb: "Jeden z najstarszych i najbardziej wszechstronnych uniwersytetów w regionie." },
      { name: "Uppsala University", slug: "uppsala", blurb: "Najstarszy uniwersytet w Skandynawii o silnej tradycji badawczej." },
    ],
  },

  // ── DANIA ───────────────────────────────────────────────────────
  {
    slug: "dania",
    updatedAt: "2026-06-26",
    name: "Dania",
    flag: "🇩🇰",
    code: "dk",
    iso: ["208"],
    tagline: "Nowoczesność, design i wysokie stypendia.",
    intro:
      "Dania to nowoczesność, design i jedne z najwyższych standardów życia na świecie. Studia są bezpłatne dla obywateli UE, a oferta po angielsku — bogata.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski" },
      { label: "Koszty", value: "bezpłatne dla UE" },
    ],
    unis: [
      { name: "Technical Univ. of Denmark (DTU)", slug: "dtu", blurb: "Czołowa duńska politechnika z silnymi związkami z przemysłem i energetyką." },
      { name: "Univ. of Copenhagen", slug: "copenhagen", blurb: "Największy i najstarszy uniwersytet w Danii." },
      { name: "Aarhus University", slug: "aarhus", blurb: "Nowoczesny ośrodek badawczy z szeroką ofertą anglojęzyczną." },
      { name: "Copenhagen Business School", slug: "cbs", blurb: "Wiodąca skandynawska szkoła biznesu w centrum Kopenhagi." },
    ],
  },

  // ── HISZPANIA ───────────────────────────────────────────────────
  {
    slug: "hiszpania",
    updatedAt: "2026-06-26",
    name: "Hiszpania",
    flag: "🇪🇸",
    code: "es",
    iso: ["724"],
    tagline: "Doskonałe szkoły biznesowe i ciepły klimat.",
    intro:
      "Hiszpania to doskonałe szkoły biznesowe, bogata kultura i przyjazny klimat. Z roku na rok rośnie oferta programów prowadzonych po angielsku.",
    highlights: [
      { label: "System", value: "Grado · Máster · Doctorado" },
      { label: "Język", value: "hiszpański / angielski" },
      { label: "Atut", value: "ciepły klimat" },
    ],
    unis: [
      { name: "IE University", slug: "ie", blurb: "Międzynarodowa uczelnia znana z biznesu i innowacji." },
      { name: "Univ. Complutense de Madrid", slug: "complutense", blurb: "Jeden z największych i najstarszych uniwersytetów w Hiszpanii." },
      { name: "Universitat de Barcelona", slug: "ub", blurb: "Czołowy ośrodek badawczy w jednym z najpiękniejszych miast Europy." },
      { name: "ESADE Business & Law School", slug: "esade", blurb: "Elitarna szkoła biznesu i prawa w Barcelonie, w ścisłej czołówce europejskich MBA." },
    ],
  },

  // ── WŁOCHY ──────────────────────────────────────────────────────
  {
    slug: "wlochy",
    updatedAt: "2026-06-26",
    name: "Włochy",
    flag: "🇮🇹",
    code: "it",
    iso: ["380"],
    tagline: "Sztuka, design i najstarsze uniwersytety świata.",
    intro:
      "Włochy łączą najstarsze uniwersytety świata ze sztuką, designem i doskonałą kuchnią. Atrakcyjne czesne i regionalne stypendia czynią je przystępnym wyborem.",
    highlights: [
      { label: "System", value: "Laurea · Laurea Mag. · Dottorato" },
      { label: "Język", value: "włoski / angielski" },
      { label: "Koszty", value: "niskie + stypendia" },
    ],
    unis: [
      { name: "Università di Bologna", slug: "bologna", blurb: "Najstarszy uniwersytet na świecie, działający od 1088 roku." },
      { name: "Politecnico di Milano", slug: "polimi", blurb: "Najlepsza włoska politechnika, czołówka w designie i inżynierii." },
      { name: "Università La Sapienza", slug: "sapienza", blurb: "Jeden z największych uniwersytetów w Europie, mocny w naukach ścisłych." },
      { name: "Università di Padova", slug: "padua", blurb: "Jeden z najstarszych i najbardziej prestiżowych włoskich universytetów badawczych." },
      { name: "Bocconi University", slug: "bocconi", blurb: "Wiodąca włoska uczelnia biznesowa i ekonomiczna w Mediolanie." },
      { name: "Università degli Studi di Torino", slug: "torino", blurb: "Wszechstronny ośrodek badawczy z szeroką ofertą kierunków w Turynie." },
      { name: "Politecnico di Torino", slug: "polito", blurb: "Czołowa politechnika północnych Włoch, mocna w inżynierii i architekturze." },
    ],
  },

  // ── AUSTRIA ─────────────────────────────────────────────────────
  {
    slug: "austria",
    updatedAt: "2026-06-26",
    name: "Austria",
    flag: "🇦🇹",
    code: "at",
    iso: ["40"],
    tagline: "Klasyczna edukacja w historycznych miastach.",
    intro:
      "Austria oferuje klasyczną edukację w pięknych, historycznych miastach i niskie czesne. To wysoka jakość życia w samym sercu Europy.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "niemiecki / angielski" },
      { label: "Koszty", value: "niskie czesne" },
    ],
    unis: [
      { name: "Universität Wien", slug: "uni-wien", blurb: "Najstarszy i największy uniwersytet w krajach niemieckojęzycznych." },
      { name: "TU Wien", slug: "tu-wien", blurb: "Wiodąca austriacka uczelnia techniczna." },
      { name: "Wirtschaftsuniversität Wien", slug: "wu-wien", blurb: "Jedna z największych szkół biznesu w Europie." },
      { name: "MCI Management Center Innsbruck", slug: "mci", blurb: "Nowoczesna uczelnia w Innsbrucku z programami biznesowymi i technologicznymi po angielsku." },
      { name: "Universität Klagenfurt", slug: "klagenfurt", blurb: "Kampusowy ośrodek w Karyntii z mocną informatyką i naukami przyrodniczymi." },
    ],
  },

  // ── BELGIA ──────────────────────────────────────────────────────
  {
    slug: "belgia",
    updatedAt: "2026-06-26",
    name: "Belgia",
    flag: "🇧🇪",
    code: "be",
    iso: ["56"],
    tagline: "Serce Europy i wielojęzyczne kampusy.",
    intro:
      "Belgia to serce Europy, wielojęzyczność i znakomita jakość kształcenia przy umiarkowanych kosztach. Idealna dla osób myślących o karierze w instytucjach UE.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "ang. / niderl. / fr." },
      { label: "Atut", value: "centrum UE" },
    ],
    unis: [
      { name: "KU Leuven", slug: "ku-leuven", blurb: "Najstarszy katolicki uniwersytet na świecie i czołówka badań w Europie." },
      { name: "Université Libre de Bruxelles", slug: "ulb", blurb: "Frankofoński uniwersytet w Brukseli o silnym profilu badawczym." },
      { name: "Ghent University", slug: "ghent", blurb: "Wszechstronny uniwersytet z mocnymi naukami o życiu." },
      { name: "Vrije Universiteit Brussel", slug: "vub", blurb: "Niderlandzkojęzyczny ośrodek w Brukseli, bliski instytucjom europejskim." },
    ],
  },

  // ── NORWEGIA ────────────────────────────────────────────────────
  {
    slug: "norwegia",
    updatedAt: "2026-06-26",
    name: "Norwegia",
    flag: "🇳🇴",
    code: "no",
    iso: ["578"],
    tagline: "Bezpłatne studia i wysoka jakość życia.",
    intro:
      "Norwegia oferuje wysoką jakość życia i mocne kierunki techniczne oraz morskie. Wiele programów publicznych pozostaje bezpłatnych lub bardzo tanich.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski / norweski" },
      { label: "Koszty", value: "niskie / bezpłatne" },
    ],
    unis: [
      { name: "University of Oslo", slug: "oslo", blurb: "Największy i najstarszy uniwersytet w Norwegii." },
      { name: "NTNU Trondheim", slug: "ntnu", blurb: "Czołowy ośrodek techniczny w Trondheim." },
      { name: "BI Norwegian Business School", slug: "bi", blurb: "Najbardziej znana norweska szkoła biznesu." },
    ],
  },

  // ── CZECHY ──────────────────────────────────────────────────────
  {
    slug: "czechy",
    updatedAt: "2026-06-26",
    name: "Czechy",
    flag: "🇨🇿",
    code: "cz",
    iso: ["203"],
    tagline: "Mocna medycyna i kierunki techniczne blisko Polski.",
    intro:
      "Czechy oferują wysoki poziom medycyny i kierunków technicznych w przystępnych cenach, a do tego tuż za polską granicą. Bliskość kulturowa ułatwia aklimatyzację.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski / czeski" },
      { label: "Koszty", value: "przystępne" },
    ],
    unis: [
      { name: "Charles University Prague", slug: "charles", blurb: "Najstarszy uniwersytet w Europie Środkowej, ceniony w medycynie." },
      { name: "Czech Technical University", slug: "ctu", blurb: "Wiodąca czeska uczelnia techniczna w Pradze." },
    ],
  },

  // ── PORTUGALIA ──────────────────────────────────────────────────
  {
    slug: "portugalia",
    updatedAt: "2026-06-26",
    name: "Portugalia",
    flag: "🇵🇹",
    code: "pt",
    iso: ["620"],
    tagline: "Przystępne koszty i łagodny klimat.",
    intro:
      "Portugalia łączy przystępne koszty życia, łagodny klimat i rosnącą ofertę programów po angielsku. To jeden z najbezpieczniejszych krajów w Europie.",
    highlights: [
      { label: "System", value: "Licenciatura · Mestrado · Doutoramento" },
      { label: "Język", value: "portugalski / angielski" },
      { label: "Atut", value: "łagodny klimat" },
    ],
    unis: [
      { name: "Universidade de Lisboa", slug: "lisboa", blurb: "Największy portugalski uniwersytet z szeroką ofertą kierunków." },
      { name: "Universidade do Porto", slug: "porto", blurb: "Czołowy ośrodek badawczy na północy kraju." },
      { name: "Nova University Lisbon", slug: "nova", blurb: "Nowoczesny uniwersytet znany z biznesu i nauk ścisłych." },
    ],
  },

  // ── FINLANDIA ───────────────────────────────────────────────────
  {
    slug: "finlandia",
    updatedAt: "2026-06-26",
    name: "Finlandia",
    flag: "🇫🇮",
    code: "fi",
    iso: ["246"],
    tagline: "Światowy lider edukacji i innowacji.",
    intro:
      "Finlandia to światowy lider edukacji, innowacji i jakości życia. Nowoczesne kampusy i programy anglojęzyczne czynią ją coraz popularniejszym kierunkiem.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski" },
      { label: "Atut", value: "topowa edukacja" },
    ],
    unis: [
      { name: "Aalto University", slug: "aalto", blurb: "Połączenie techniki, biznesu i designu — prawdziwa kuźnia startupów." },
      { name: "University of Helsinki", slug: "helsinki", blurb: "Największy i najbardziej wszechstronny fiński uniwersytet." },
      { name: "Tampere University", slug: "tampere", blurb: "Mocny w technologii i naukach o zdrowiu." },
    ],
  },

  // ── KANADA ──────────────────────────────────────────────────────
  {
    slug: "kanada",
    updatedAt: "2026-06-26",
    name: "Kanada",
    flag: "🇨🇦",
    code: "ca",
    iso: ["124"],
    tagline: "Rozległe kampusy i ścieżka pobytu po studiach.",
    intro:
      "Kanada oferuje rozległe kampusy, ogromne możliwości badawcze i otwartą politykę imigracyjną dla absolwentów. To wymarzony kierunek dla osób myślących o karierze za oceanem.",
    highlights: [
      { label: "System", value: "Bachelor · Master · PhD" },
      { label: "Język", value: "angielski / francuski" },
      { label: "Po studiach", value: "ścieżka pobytu" },
    ],
    unis: [
      { name: "University of Toronto", slug: "toronto", blurb: "Najwyżej notowany uniwersytet w Kanadzie, lider badań." },
      { name: "McGill University", slug: "mcgill", blurb: "Anglojęzyczna perła Montrealu o globalnej renomie." },
      { name: "UBC Vancouver", slug: "ubc", blurb: "Czołowy uniwersytet zachodniego wybrzeża w Vancouver." },
      { name: "University of Waterloo", slug: "waterloo", blurb: "Słynie z informatyki, inżynierii i programów co-op." },
      { name: "York University", slug: "york", blurb: "Drugi co do wielkości ośrodek w Toronto, mocny w biznesie, prawie i sztukach." },
    ],
  },

  // ── USA ─────────────────────────────────────────────────────────
  {
    slug: "usa",
    updatedAt: "2026-06-26",
    name: "USA",
    flag: "🇺🇸",
    code: "us",
    iso: ["840"],
    tagline: "Największy wybór uczelni i hojne stypendia.",
    intro:
      "Stany Zjednoczone to największy wybór uczelni na świecie, hojne stypendia i elastyczne programy w modelu liberal arts. Dyplom amerykańskiej uczelni otwiera drzwi globalnie.",
    highlights: [
      { label: "System", value: "Bachelor · Master · PhD" },
      { label: "Język", value: "angielski" },
      { label: "Aplikacja", value: "Common App + SAT/ACT" },
    ],
    unis: [
      { name: "MIT", slug: "mit", blurb: "Światowy lider techniki, nauki i przedsiębiorczości." },
      { name: "Harvard University", slug: "harvard", blurb: "Najbardziej rozpoznawalny uniwersytet na świecie." },
      { name: "Stanford University", slug: "stanford", blurb: "Serce Doliny Krzemowej i globalnej innowacji." },
      { name: "Columbia University", slug: "columbia", blurb: "Uczelnia Ivy League w sercu Nowego Jorku." },
      { name: "NYU", slug: "nyu", blurb: "Globalny uniwersytet z kampusami na całym świecie." },
      { name: "Yale University", slug: "yale", blurb: "Jedna z najstarszych uczelni Ivy League, wiodąca w prawie i humanistyce." },
      { name: "University of Pennsylvania", slug: "upenn", blurb: "Uczelnia Ivy League — siedziba legendarnej Wharton School of Business." },
      { name: "Dartmouth College", slug: "dartmouth", blurb: "Kameralna uczelnia Ivy League znana z liberal arts i programu MBA Tuck." },
      { name: "Princeton University", slug: "princeton", blurb: "Czołowa uczelnia Ivy League z silnymi programami STEM i humanistycznymi." },
      { name: "Caltech", slug: "caltech", blurb: "Mała, elitarna politechnika o ogromnym wpływie na naukę i technologię." },
      { name: "Carnegie Mellon University", slug: "cmu", blurb: "Wiodący ośrodek informatyki, robotyki i sztuk pięknych w Pittsburghu." },
      { name: "UCLA", slug: "ucla", blurb: "Flagowy kampus UC w Los Angeles — silny w biznesie, prawie i sztukach." },
      { name: "UC Berkeley", slug: "ucb", blurb: "Najwyżej notowany publiczny uniwersytet na świecie." },
      { name: "Georgia Tech", slug: "georgia-tech", blurb: "Wiodąca politechnika publiczna z silnymi kierunkami inżynieryjnymi i informatycznymi." },
      { name: "Johns Hopkins University", slug: "jhu", blurb: "Lider badań medycznych, biomedycznych i nauk ścisłych w Baltimore." },
      { name: "Northwestern University", slug: "northwestern", blurb: "Prestiżowa uczelnia prywatna z silną szkołą biznesu (Kellogg) i prawa." },
    ],
  },

  // ── CHINY ───────────────────────────────────────────────────────
  {
    slug: "chiny",
    updatedAt: "2026-06-26",
    name: "Chiny",
    flag: "🇨🇳",
    code: "cn",
    iso: ["156"],
    tagline: "Rosnąca potęga akademicka i stypendia rządowe.",
    intro:
      "Chiny szybko awansują w światowych rankingach i oferują hojne stypendia rządowe dla zagranicznych studentów. To okno na najszybciej rozwijającą się gospodarkę świata.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski / chiński" },
      { label: "Stypendia", value: "rządowe (CSC)" },
    ],
    unis: [
      { name: "Peking University", slug: "peking", blurb: "Najbardziej prestiżowy chiński uniwersytet w Pekinie." },
      { name: "Tsinghua University", slug: "tsinghua", blurb: "Czołówka światowej inżynierii i informatyki." },
      { name: "Fudan University", slug: "fudan", blurb: "Wiodący uniwersytet w Szanghaju, mocny w naukach społecznych i medycynie." },
      { name: "Zhejiang University", slug: "zhejiang", blurb: "Jeden z najlepszych i najbardziej wszechstronnych w Chinach." },
    ],
  },

  // ── KOREA POŁUDNIOWA ────────────────────────────────────────────
  {
    slug: "korea-poludniowa",
    updatedAt: "2026-06-26",
    name: "Korea Południowa",
    flag: "🇰🇷",
    code: "kr",
    iso: ["410"],
    tagline: "Technologiczna potęga z nowoczesnymi kampusami.",
    intro:
      "Korea Południowa to technologiczna potęga z nowoczesnymi kampusami i rosnącą liczbą programów po angielsku. Kraj K-popu, gier i innowacji przyciąga coraz więcej studentów.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski / koreański" },
      { label: "Stypendia", value: "liczne" },
    ],
    unis: [
      { name: "Seoul National University", slug: "snu", blurb: "Najbardziej prestiżowy uniwersytet w Korei." },
      { name: "KAIST", slug: "kaist", blurb: "Czołowa uczelnia naukowo-techniczna kraju." },
      { name: "Yonsei University", slug: "yonsei", blurb: "Renomowany prywatny uniwersytet w Seulu." },
      { name: "Sungkyunkwan University (SKKU)", slug: "skku", blurb: "Jeden z czołowych prywatnych ośrodków z silną tradycją i powiązaniami z Samsung." },
      { name: "Hanyang University", slug: "hanyang", blurb: "Znany z inżynierii, architektury i silnych powiązań z koreańskim przemysłem." },
      { name: "Inha University", slug: "inha", blurb: "Uczelnia techniczna w Incheon z rozbudowanymi programami inżynieryjnymi i lotniczymi." },
    ],
  },

  // ── SINGAPUR ────────────────────────────────────────────────────
  {
    slug: "singapur",
    updatedAt: "2026-06-26",
    name: "Singapur",
    flag: "🇸🇬",
    code: "sg",
    iso: ["702"],
    tagline: "Globalny węzeł edukacji w sercu Azji.",
    intro:
      "Singapur to globalny węzeł edukacji i biznesu, łączący zachodnie standardy z azjatycką dynamiką. Bezpieczne, anglojęzyczne i niezwykle nowoczesne miasto-państwo.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski" },
      { label: "Renoma", value: "topowa w Azji" },
    ],
    unis: [
      { name: "National University of Singapore", slug: "nus", blurb: "Najwyżej notowany uniwersytet w Azji." },
      { name: "Nanyang Technological University", slug: "ntu", blurb: "Czołówka inżynierii i nauk ścisłych." },
      { name: "SMU", slug: "smu", blurb: "Uczelnia o profilu biznesowym w stylu amerykańskim." },
    ],
  },

  // ── JAPONIA ─────────────────────────────────────────────────────
  {
    slug: "japonia",
    updatedAt: "2026-06-26",
    name: "Japonia",
    flag: "🇯🇵",
    code: "jp",
    iso: ["392"],
    tagline: "Tradycja, technologia i stypendia MEXT.",
    intro:
      "Japonia łączy tradycję z technologiczną nowoczesnością i oferuje hojne stypendia rządowe MEXT. To unikalne doświadczenie kulturowe i akademickie.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski / japoński" },
      { label: "Stypendia", value: "MEXT" },
    ],
    unis: [
      { name: "University of Tokyo", slug: "tokyo", blurb: "Najbardziej prestiżowy uniwersytet w Japonii." },
      { name: "Kyoto University", slug: "kyoto", blurb: "Kuźnia noblistów, mocna w naukach podstawowych." },
      { name: "Waseda University", slug: "waseda", blurb: "Czołowy prywatny uniwersytet z dużą liczbą obcokrajowców." },
      { name: "Osaka University", slug: "osaka", blurb: "Wiodący ośrodek badawczy zachodniej Japonii." },
      { name: "Temple University Japan", slug: "temple-japan", blurb: "Anglojęzyczny kampus Temple University w Tokio, popularny wśród studentów zachodnich." },
    ],
  },

  // ── AUSTRALIA ───────────────────────────────────────────────────
  {
    slug: "australia",
    updatedAt: "2026-06-26",
    name: "Australia",
    flag: "🇦🇺",
    code: "au",
    iso: ["36", "036"],
    tagline: "Wysoka jakość życia i praca po studiach.",
    intro:
      "Australia oferuje wysoką jakość życia, przyjazne wizy studenckie i możliwość pracy po studiach. Świetny wybór dla osób ceniących równowagę między nauką a stylem życia.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski" },
      { label: "Po studiach", value: "wiza pracy" },
    ],
    unis: [
      { name: "University of Melbourne", slug: "melbourne", blurb: "Najwyżej notowany uniwersytet w Australii." },
      { name: "University of Sydney", slug: "sydney", blurb: "Prestiżowa uczelnia z silnym profilem międzynarodowym." },
      { name: "ANU", slug: "anu", blurb: "Wiodący ośrodek badawczy w stolicy kraju." },
      { name: "UNSW Sydney", slug: "unsw", blurb: "Mocny w inżynierii, biznesie i naukach ścisłych." },
      { name: "Monash University", slug: "monash", blurb: "Jeden z największych australijskich ośrodków badawczych z kampusem w Melbourne." },
    ],
  },

  // ── MALTA ───────────────────────────────────────────────────────
  {
    slug: "malta",
    updatedAt: "2026-06-26",
    name: "Malta",
    flag: "🇲🇹",
    code: "mt",
    iso: ["470"],
    tagline: "Anglojęzyczny kraj UE nad Morzem Śródziemnym.",
    intro:
      "Malta to anglojęzyczny kraj Unii Europejskiej z ciepłym klimatem i kameralnym, przyjaznym środowiskiem akademickim. Idealna dla osób szukających spokojnego startu za granicą.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski" },
      { label: "Atut", value: "klimat śródziemnomorski" },
    ],
    unis: [
      { name: "University of Malta", slug: "uni-malta", blurb: "Główny i najstarszy uniwersytet na wyspie." },
      { name: "MCAST", slug: "mcast", blurb: "Uczelnia o profilu praktyczno-zawodowym." },
      { name: "Malta Business School", slug: "mbs", blurb: "Szkoła nastawiona na biznes i zarządzanie." },
    ],
  },

  // ── ZEA ─────────────────────────────────────────────────────────
  {
    slug: "zea",
    updatedAt: "2026-06-26",
    name: "ZEA",
    flag: "🇦🇪",
    code: "ae",
    iso: ["784"],
    tagline: "Filie światowych uczelni i hojne stypendia.",
    intro:
      "Zjednoczone Emiraty Arabskie to nowoczesne kampusy filii światowych uczelni i hojne stypendia. Dynamiczny, międzynarodowy hub na styku kultur.",
    highlights: [
      { label: "System", value: "Bachelor · Master · PhD" },
      { label: "Język", value: "angielski" },
      { label: "Atut", value: "filie światowych uczelni" },
    ],
    unis: [
      { name: "NYU Abu Dhabi", slug: "nyuad", blurb: "Selektywny kampus NYU z pełnymi stypendiami." },
      { name: "Khalifa University", slug: "khalifa", blurb: "Czołowa uczelnia techniczno-badawcza w regionie." },
      { name: "American University of Sharjah", slug: "aus", blurb: "Amerykański model studiów w Sharjah." },
    ],
  },

  // ── HONGKONG ────────────────────────────────────────────────────
  {
    slug: "hongkong",
    updatedAt: "2026-06-26",
    name: "Hongkong",
    flag: "🇭🇰",
    code: "hk",
    iso: ["344"],
    tagline: "Brytyjski system i wykłady po angielsku.",
    intro:
      "Hongkong łączy azjatycką dynamikę z brytyjskim systemem edukacji i wykładami po angielsku. To jeden z najważniejszych ośrodków finansowych i akademickich Azji.",
    highlights: [
      { label: "System", value: "Licencjat · Magister · Doktorat" },
      { label: "Język", value: "angielski" },
      { label: "Renoma", value: "topowa w Azji" },
    ],
    unis: [
      { name: "HKU", slug: "hku", blurb: "Najstarszy i najbardziej prestiżowy uniwersytet w Hongkongu." },
      { name: "HKUST", slug: "hkust", blurb: "Młoda uczelnia z czołówki rankingów w naukach ścisłych i biznesie." },
      { name: "Chinese University of Hong Kong", slug: "cuhk", blurb: "Wszechstronny uniwersytet o silnym profilu badawczym." },
      { name: "City University of Hong Kong", slug: "cityu", blurb: "Nowoczesna uczelnia mocna w inżynierii i mediach." },
    ],
  },
];

export const countryTranslationsEn: Record<string, CountryTranslationEn> = {
  "wielka-brytania": {
    name: "United Kingdom",
    tagline: "Oxford, Cambridge and prestigious Russell Group universities.",
    intro:
      "The United Kingdom is the cradle of the modern university and one of the most recognisable study destinations in the world. Three-year bachelor's degrees, a strong emphasis on independent work and the global reputation of the degree attract highly ambitious applicants.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English" },
      { label: "Application", value: "UCAS (by January)" },
    ],
    uniBlurbs: {
      oxford: "The oldest university in the English-speaking world, famous for its tutorial system and colleges.",
      cambridge: "One of the world's most prestigious universities, renowned for science, mathematics and its collegiate system.",
      imperial: "A top-tier institution in natural sciences, engineering, medicine and technology business.",
      lse: "A global leader in social sciences, economics and political science in the heart of London.",
      ucl: "A broad research university with strong programmes from medicine to the arts.",
      kings: "A centrally located London university known for law, medicine and the humanities.",
      qmul: "A Russell Group university with strength in engineering, law and life sciences.",
      warwick: "One of the UK's most highly rated universities, especially valued for economics and computer science.",
      durham: "A prestigious collegiate campus in the north of England with a rich academic tradition.",
      bath: "A more intimate university with strong engineering and business programmes.",
      "st-andrews": "Scotland's oldest university, known for research and a beautiful seaside campus.",
      edinburgh: "One of the largest and most respected universities in Scotland.",
      manchester: "A leading research centre with particular strength in physics and materials technologies.",
    },
  },
  holandia: {
    name: "Netherlands",
    tagline: "A practical approach and innovative degree programmes in English.",
    intro:
      "The Netherlands offers some of Europe's strongest English-taught programmes and a practical, project-based approach to learning. It is very welcoming to international students and exceptionally well connected to the rest of the continent.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English" },
      { label: "Application", value: "Studielink (by May)" },
    ],
    uniBlurbs: {
      "tu-delft": "The country's leading technical university, especially respected for engineering and architecture.",
      leiden: "The oldest Dutch university, strong in law, the humanities and the sciences.",
      uva: "The largest university in Amsterdam with a broad English-taught offer.",
      utrecht: "A leading research university with a strong reputation in life sciences and sustainability.",
      groningen: "A broad-based institution in the north of the country with many programmes in English.",
      "erasmus-rotterdam": "A leading European university for economics, business and health sciences.",
      tilburg: "Specialises in economics, law, social sciences and the humanities.",
      maastricht: "Known for problem-based learning and a strong European profile.",
      "vu-amsterdam": "A broad research university in the south of Amsterdam.",
      twente: "A campus-based technical and entrepreneurial university with strong engineering programmes.",
    },
  },
  niemcy: {
    name: "Germany",
    tagline: "Top-quality education, often with little or no tuition.",
    intro:
      "Germany combines a very high standard of education with symbolic or zero tuition fees at public universities. It is especially strong in engineering and the sciences and offers close access to a major European labour market.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "German / English" },
      { label: "Costs", value: "often little or no tuition" },
    ],
    uniBlurbs: {
      "tu-munich": "Germany's leading technical university, closely linked with industry and start-ups.",
      humboldt: "A historic Berlin university and the birthplace of the modern research model.",
      heidelberg: "Germany's oldest university, especially known for medicine and natural sciences.",
      kit: "A combination of university and research institute, placing it among the country's engineering leaders.",
    },
  },
  irlandia: {
    name: "Ireland",
    tagline: "An English-speaking EU country and the European home of tech giants.",
    intro:
      "Ireland is an English-speaking EU country and the European base of many global technology companies. Students are drawn by its welcoming environment and strong university-business connections.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English" },
      { label: "Application", value: "CAO" },
    ],
    uniBlurbs: {
      ucd: "The largest university in Ireland with a strong international profile.",
      trinity: "Ireland's most prestigious university with centuries of academic tradition.",
      ucc: "A respected university in Cork, strong in life sciences and business.",
      galway: "A beautifully located institution on Ireland's west coast, strong in the humanities and sciences.",
    },
  },
  francja: {
    name: "France",
    tagline: "Elite Grandes Ecoles and a rich academic tradition.",
    intro:
      "France offers elite Grandes Ecoles and a deep academic tradition. The number of English-taught programmes is growing steadily, especially in business and the sciences.",
    highlights: [
      { label: "System", value: "Licence · Master's · Doctorate" },
      { label: "Language", value: "French / English" },
      { label: "Application", value: "Parcoursup / direct" },
    ],
    uniBlurbs: {
      "sciences-po": "A leading school for political science and international affairs.",
      hec: "One of the strongest business schools in continental Europe.",
      psl: "A federation of elite Paris institutions that consistently ranks at the top.",
      polytechnique: "France's most prestigious engineering school.",
      sorbonne: "One of the oldest and most recognisable universities in the world.",
    },
  },
  szwajcaria: {
    name: "Switzerland",
    tagline: "Prestige, safety and proximity to international corporations.",
    intro:
      "Switzerland combines global prestige with safety and close links to international business. Public universities offer an exceptional standard of education with relatively moderate tuition.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English / German / French" },
      { label: "Costs", value: "moderate tuition" },
    ],
    uniBlurbs: {
      eth: "The strongest technical university in continental Europe.",
      epfl: "ETH's French-speaking counterpart and a top destination for engineering and computing.",
      uzh: "The largest university in Switzerland, particularly strong in medicine and law.",
      basel: "Switzerland's oldest university, highly regarded in the life sciences.",
    },
  },
  szwecja: {
    name: "Sweden",
    tagline: "Innovation and tuition-free study for EU citizens.",
    intro:
      "Sweden emphasises teamwork, innovation and sustainability. Studies are free for EU citizens and the range of English-taught programmes is very wide.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English" },
      { label: "Costs", value: "tuition-free for EU citizens" },
    ],
    uniBlurbs: {
      kth: "Sweden's leading technical university in Stockholm.",
      lund: "One of the region's oldest and most comprehensive universities.",
      uppsala: "The oldest university in Scandinavia, with a strong research tradition.",
    },
  },
  dania: {
    name: "Denmark",
    tagline: "Modernity, design and generous scholarship opportunities.",
    intro:
      "Denmark stands for modernity, design and one of the highest standards of living in the world. Study is free for EU citizens and the English-taught offer is broad.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English" },
      { label: "Costs", value: "tuition-free for EU citizens" },
    ],
    uniBlurbs: {
      dtu: "A leading Danish technical university with strong ties to industry and energy.",
      copenhagen: "The largest and oldest university in Denmark.",
      aarhus: "A modern research university with a broad English-taught offer.",
      cbs: "A leading Scandinavian business school in the centre of Copenhagen.",
    },
  },
  hiszpania: {
    name: "Spain",
    tagline: "Excellent business schools and a warm climate.",
    intro:
      "Spain combines excellent business schools, rich culture and a welcoming climate. Each year, more programmes are offered in English.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "Spanish / English" },
      { label: "Advantage", value: "warm climate" },
    ],
    uniBlurbs: {
      ie: "An international university known for business and innovation.",
      complutense: "One of the largest and oldest universities in Spain.",
      ub: "A leading research university in one of Europe's most attractive cities.",
      esade: "An elite business and law school in Barcelona, consistently among Europe's best.",
    },
  },
  wlochy: {
    name: "Italy",
    tagline: "Art, design and some of the oldest universities in the world.",
    intro:
      "Italy combines some of the world's oldest universities with art, design and extraordinary culture. Competitive tuition and regional scholarships make it a comparatively accessible choice.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "Italian / English" },
      { label: "Costs", value: "lower tuition + scholarships" },
    ],
    uniBlurbs: {
      bologna: "The oldest university in the world, operating continuously since 1088.",
      polimi: "Italy's top technical university and a leader in design and engineering.",
      sapienza: "One of Europe's largest universities, strong in the sciences.",
      padua: "One of Italy's oldest and most prestigious research universities.",
      bocconi: "Italy's leading university for business and economics in Milan.",
      torino: "A broad research university with a wide range of programmes in Turin.",
      polito: "A leading technical university in northern Italy, especially strong in engineering and architecture.",
    },
  },
  austria: {
    name: "Austria",
    tagline: "Classical education in historic cities.",
    intro:
      "Austria offers classical higher education in beautiful, historic cities and relatively low tuition fees. It combines a strong quality of life with a central European location.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "German / English" },
      { label: "Costs", value: "lower tuition" },
    ],
    uniBlurbs: {
      "uni-wien": "The oldest and largest university in the German-speaking world.",
      "tu-wien": "Austria's leading technical university.",
      "wu-wien": "One of the largest business schools in Europe.",
      mci: "A modern university in Innsbruck with English-taught business and technology programmes.",
      klagenfurt: "A campus-based university in Carinthia with strong computing and science programmes.",
    },
  },
  belgia: {
    name: "Belgium",
    tagline: "The heart of Europe and multilingual campuses.",
    intro:
      "Belgium offers multilingualism, strong education and moderate costs in the heart of Europe. It is an excellent option for students interested in EU institutions and international careers.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English / Dutch / French" },
      { label: "Advantage", value: "EU hub" },
    ],
    uniBlurbs: {
      "ku-leuven": "The world's oldest Catholic university and one of Europe's research leaders.",
      ulb: "A French-speaking university in Brussels with a strong research profile.",
      ghent: "A broad university with particular strength in the life sciences.",
      vub: "A Dutch-speaking university in Brussels, close to European institutions.",
    },
  },
  norwegia: {
    name: "Norway",
    tagline: "Very low tuition and an outstanding quality of life.",
    intro:
      "Norway offers an exceptional quality of life and strong technical and maritime programmes. Many public options remain tuition-free or very affordable.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English / Norwegian" },
      { label: "Costs", value: "low / often tuition-free" },
    ],
    uniBlurbs: {
      oslo: "The largest and oldest university in Norway.",
      ntnu: "The country's leading technical university in Trondheim.",
      bi: "Norway's best-known business school.",
    },
  },
  czechy: {
    name: "Czech Republic",
    tagline: "Strong medicine and technical degrees close to Poland.",
    intro:
      "The Czech Republic offers strong medicine and technical education at accessible costs, all very close to Poland. Cultural proximity can also make the transition easier.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English / Czech" },
      { label: "Costs", value: "accessible" },
    ],
    uniBlurbs: {
      charles: "The oldest university in Central Europe, especially respected in medicine.",
      ctu: "The leading Czech technical university in Prague.",
    },
  },
  portugalia: {
    name: "Portugal",
    tagline: "Accessible costs and a mild climate.",
    intro:
      "Portugal combines accessible living costs, a mild climate and a growing number of English-taught programmes. It is also one of Europe's safest countries.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "Portuguese / English" },
      { label: "Advantage", value: "mild climate" },
    ],
    uniBlurbs: {
      lisboa: "Portugal's largest university with a wide range of degree options.",
      porto: "A leading research institution in the north of the country.",
      nova: "A modern university known for business and the sciences.",
    },
  },
  finlandia: {
    name: "Finland",
    tagline: "A global leader in education and innovation.",
    intro:
      "Finland is a world leader in education, innovation and quality of life. Modern campuses and strong English-taught programmes make it an increasingly popular destination.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English" },
      { label: "Advantage", value: "top-tier education" },
    ],
    uniBlurbs: {
      aalto: "A powerful combination of technology, business and design - a true start-up powerhouse.",
      helsinki: "Finland's largest and most comprehensive university.",
      tampere: "Strong in technology and health sciences.",
    },
  },
  kanada: {
    name: "Canada",
    tagline: "Expansive campuses and strong research opportunities.",
    intro:
      "Canada offers expansive campuses, major research opportunities and a multicultural academic environment. It is a strong choice for students looking for a global education in North America.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English / French" },
      { label: "Environment", value: "multicultural campuses" },
    ],
    uniBlurbs: {
      toronto: "Canada's highest-ranked university and a research leader.",
      mcgill: "Montreal's globally recognised English-language flagship.",
      ubc: "A leading west-coast university in Vancouver.",
      waterloo: "Famous for computer science, engineering and co-op programmes.",
      york: "Toronto's second-largest university, strong in business, law and the arts.",
    },
  },
  usa: {
    name: "USA",
    tagline: "The widest university choice and generous scholarships.",
    intro:
      "The United States offers the widest range of universities in the world, generous scholarships and flexible liberal arts structures. An American degree opens doors globally.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English" },
      { label: "Application", value: "Common App + SAT/ACT" },
    ],
    uniBlurbs: {
      mit: "A world leader in technology, science and entrepreneurship.",
      harvard: "The most recognisable university in the world.",
      stanford: "At the heart of Silicon Valley and global innovation.",
      columbia: "An Ivy League university in the heart of New York City.",
      nyu: "A global university with campuses around the world.",
      yale: "One of the oldest Ivy League institutions, especially strong in law and the humanities.",
      upenn: "An Ivy League university and home of the legendary Wharton School.",
      dartmouth: "A close-knit Ivy League college known for liberal arts and Tuck MBA.",
      princeton: "A top Ivy League institution with strong STEM and humanities programmes.",
      caltech: "A small, elite technical university with outsized impact on science and technology.",
      cmu: "A leading centre for computer science, robotics and fine arts in Pittsburgh.",
      ucla: "The flagship UC campus in Los Angeles, strong in business, law and the arts.",
      ucb: "The highest-ranked public university in the world.",
      "georgia-tech": "A leading public technical university with strong engineering and computing.",
      jhu: "A leader in medical, biomedical and scientific research in Baltimore.",
      northwestern: "A prestigious private university with strong business and law schools.",
    },
  },
  chiny: {
    name: "China",
    tagline: "A rising academic power and government scholarships.",
    intro:
      "China continues to climb in global rankings and offers generous government scholarships for international students. It provides direct exposure to one of the world's most dynamic economies.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English / Chinese" },
      { label: "Scholarships", value: "government-funded (CSC)" },
    ],
    uniBlurbs: {
      peking: "China's most prestigious university, located in Beijing.",
      tsinghua: "A world-class leader in engineering and computing.",
      fudan: "A leading Shanghai university, strong in social sciences and medicine.",
      zhejiang: "One of China's best and most comprehensive universities.",
    },
  },
  "korea-poludniowa": {
    name: "South Korea",
    tagline: "A technological powerhouse with modern campuses.",
    intro:
      "South Korea is a technological powerhouse with modern campuses and a growing number of English-taught programmes. It attracts more and more students interested in innovation, games, media and engineering.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English / Korean" },
      { label: "Scholarships", value: "many options" },
    ],
    uniBlurbs: {
      snu: "The most prestigious university in South Korea.",
      kaist: "The country's leading science and technology university.",
      yonsei: "A respected private university in Seoul.",
      skku: "One of Korea's top private institutions, with a long tradition and strong ties to Samsung.",
      hanyang: "Well known for engineering, architecture and strong industry links.",
      inha: "A technical university in Incheon with extensive engineering and aviation programmes.",
    },
  },
  singapur: {
    name: "Singapore",
    tagline: "A global education hub in the heart of Asia.",
    intro:
      "Singapore is a global centre for education and business, combining Western academic standards with Asian dynamism. It is safe, English-speaking and remarkably modern.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English" },
      { label: "Reputation", value: "top-tier in Asia" },
    ],
    uniBlurbs: {
      nus: "The highest-ranked university in Asia.",
      ntu: "A leading institution for engineering and the sciences.",
      smu: "A business-oriented university built more in the American style.",
    },
  },
  japonia: {
    name: "Japan",
    tagline: "Tradition, technology and MEXT scholarships.",
    intro:
      "Japan combines deep tradition with technological modernity and offers generous MEXT government scholarships. It is a distinctive academic and cultural experience.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English / Japanese" },
      { label: "Scholarships", value: "MEXT" },
    ],
    uniBlurbs: {
      tokyo: "Japan's most prestigious university.",
      kyoto: "A home of Nobel laureates with particular strength in fundamental sciences.",
      waseda: "A leading private university with a large international student body.",
      osaka: "A major research university in western Japan.",
      "temple-japan": "Temple University's English-language campus in Tokyo, popular with international students.",
    },
  },
  australia: {
    name: "Australia",
    tagline: "High quality of life and world-class universities.",
    intro:
      "Australia combines a high quality of life with globally respected universities and a very international student environment. It is a strong option for students looking for academic quality, English-language study and a lifestyle built around balance and openness.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English" },
      { label: "Environment", value: "international campuses" },
    ],
    uniBlurbs: {
      melbourne: "Australia's highest-ranked university.",
      sydney: "A prestigious university with a strong international profile.",
      anu: "A leading research institution in the national capital.",
      unsw: "Strong in engineering, business and the sciences.",
      monash: "One of Australia's largest research universities, based in Melbourne.",
    },
  },
  malta: {
    name: "Malta",
    tagline: "An English-speaking EU country on the Mediterranean.",
    intro:
      "Malta is an English-speaking EU country with a warm climate and a compact, welcoming academic environment. It can be a good option for students looking for a calmer start abroad.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English" },
      { label: "Advantage", value: "Mediterranean climate" },
    ],
    uniBlurbs: {
      "uni-malta": "The island's main and oldest university.",
      mcast: "A practice-oriented institution with a vocational profile.",
      mbs: "A school focused on business and management.",
    },
  },
  zea: {
    name: "UAE",
    tagline: "Branches of global universities and generous scholarships.",
    intro:
      "The United Arab Emirates offer modern campuses, branches of global universities and generous scholarship opportunities. The country is a dynamic international hub at the crossroads of regions and cultures.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English" },
      { label: "Advantage", value: "global university branches" },
    ],
    uniBlurbs: {
      nyuad: "A highly selective NYU campus known for full scholarships.",
      khalifa: "A leading technical and research university in the region.",
      aus: "An American-style university based in Sharjah.",
    },
  },
  hongkong: {
    name: "Hong Kong",
    tagline: "A British-style system with teaching in English.",
    intro:
      "Hong Kong combines Asian dynamism with a British-style education system and teaching in English. It remains one of Asia's most important academic and financial hubs.",
    highlights: [
      { label: "System", value: "Bachelor · Master's · Doctorate" },
      { label: "Language", value: "English" },
      { label: "Reputation", value: "top-tier in Asia" },
    ],
    uniBlurbs: {
      hku: "The oldest and most prestigious university in Hong Kong.",
      hkust: "A younger institution that ranks at the top in science, technology and business.",
      cuhk: "A broad university with a strong research profile.",
      cityu: "A modern institution with strengths in engineering and media.",
    },
  },
};

export function getLocalizedCountry(country: Country, language: "pl" | "en"): Country {
  if (language !== "en") {
    return country;
  }

  const translation = countryTranslationsEn[country.slug];
  if (!translation) {
    return country;
  }

  return {
    ...country,
    name: translation.name,
    tagline: translation.tagline,
    intro: translation.intro,
    highlights: translation.highlights,
    unis: country.unis.map((uni) => ({
      ...uni,
      blurb: translation.uniBlurbs[uni.slug] ?? uni.blurb,
    })),
  };
}

// Locative phrase used in CTAs, e.g. "Myślisz o studiach w Holandii?"
export const countryLocative: Record<string, string> = {
  "wielka-brytania": "w Wielkiej Brytanii",
  holandia: "w Holandii",
  niemcy: "w Niemczech",
  irlandia: "w Irlandii",
  francja: "we Francji",
  szwajcaria: "w Szwajcarii",
  szwecja: "w Szwecji",
  dania: "w Danii",
  hiszpania: "w Hiszpanii",
  wlochy: "we Włoszech",
  austria: "w Austrii",
  belgia: "w Belgii",
  norwegia: "w Norwegii",
  czechy: "w Czechach",
  portugalia: "w Portugalii",
  finlandia: "w Finlandii",
  kanada: "w Kanadzie",
  usa: "w USA",
  chiny: "w Chinach",
  "korea-poludniowa": "w Korei Południowej",
  singapur: "w Singapurze",
  japonia: "w Japonii",
  australia: "w Australii",
  malta: "na Malcie",
  zea: "w Emiratach",
  hongkong: "w Hongkongu",
};

// Primary domain per university (keyed by uni slug) — used to fetch logos.
export const uniDomain: Record<string, string> = {
  // UK
  oxford: "ox.ac.uk",
  cambridge: "cam.ac.uk",
  imperial: "imperial.ac.uk",
  lse: "lse.ac.uk",
  ucl: "ucl.ac.uk",
  kings: "kcl.ac.uk",
  qmul: "qmul.ac.uk",
  warwick: "warwick.ac.uk",
  durham: "dur.ac.uk",
  bath: "bath.ac.uk",
  "st-andrews": "st-andrews.ac.uk",
  edinburgh: "ed.ac.uk",
  manchester: "manchester.ac.uk",
  // NL
  "tu-delft": "tudelft.nl",
  leiden: "universiteitleiden.nl",
  uva: "uva.nl",
  utrecht: "uu.nl",
  groningen: "rug.nl",
  "erasmus-rotterdam": "eur.nl",
  tilburg: "tilburguniversity.edu",
  maastricht: "maastrichtuniversity.nl",
  "vu-amsterdam": "vu.nl",
  twente: "utwente.nl",
  // DE
  "tu-munich": "tum.de",
  humboldt: "hu-berlin.de",
  heidelberg: "uni-heidelberg.de",
  kit: "kit.edu",
  // IE
  ucd: "ucd.ie",
  trinity: "tcd.ie",
  ucc: "ucc.ie",
  galway: "universityofgalway.ie",
  // FR
  "sciences-po": "sciencespo.fr",
  hec: "hec.edu",
  psl: "psl.eu",
  polytechnique: "polytechnique.edu",
  sorbonne: "sorbonne-universite.fr",
  // CH
  eth: "ethz.ch",
  epfl: "epfl.ch",
  uzh: "uzh.ch",
  basel: "unibas.ch",
  // SE
  kth: "kth.se",
  lund: "lunduniversity.lu.se",
  uppsala: "uu.se",
  // DK
  dtu: "dtu.dk",
  copenhagen: "ku.dk",
  aarhus: "au.dk",
  cbs: "cbs.dk",
  // ES
  ie: "ie.edu",
  complutense: "ucm.es",
  ub: "ub.edu",
  esade: "esade.edu",
  // IT
  bologna: "unibo.it",
  polimi: "polimi.it",
  sapienza: "uniroma1.it",
  padua: "unipd.it",
  bocconi: "unibocconi.it",
  torino: "unito.it",
  polito: "polito.it",
  // AT
  "uni-wien": "univie.ac.at",
  "tu-wien": "tuwien.at",
  "wu-wien": "wu.ac.at",
  mci: "mci.edu",
  klagenfurt: "aau.at",
  // BE
  "ku-leuven": "kuleuven.be",
  ulb: "ulb.be",
  ghent: "ugent.be",
  vub: "vub.be",
  // NO
  oslo: "uio.no",
  ntnu: "ntnu.no",
  bi: "bi.no",
  // CZ
  charles: "cuni.cz",
  ctu: "cvut.cz",
  // PT
  lisboa: "ulisboa.pt",
  porto: "up.pt",
  nova: "unl.pt",
  // FI
  aalto: "aalto.fi",
  helsinki: "helsinki.fi",
  tampere: "tuni.fi",
  // CA
  toronto: "utoronto.ca",
  mcgill: "mcgill.ca",
  ubc: "ubc.ca",
  waterloo: "uwaterloo.ca",
  york: "yorku.ca",
  // US
  mit: "mit.edu",
  harvard: "harvard.edu",
  stanford: "stanford.edu",
  columbia: "columbia.edu",
  nyu: "nyu.edu",
  yale: "yale.edu",
  upenn: "upenn.edu",
  dartmouth: "dartmouth.edu",
  princeton: "princeton.edu",
  caltech: "caltech.edu",
  cmu: "cmu.edu",
  ucla: "ucla.edu",
  ucb: "berkeley.edu",
  "georgia-tech": "gatech.edu",
  jhu: "jhu.edu",
  northwestern: "northwestern.edu",
  // CN
  peking: "pku.edu.cn",
  tsinghua: "tsinghua.edu.cn",
  fudan: "fudan.edu.cn",
  zhejiang: "zju.edu.cn",
  // KR
  snu: "snu.ac.kr",
  kaist: "kaist.ac.kr",
  yonsei: "yonsei.ac.kr",
  skku: "skku.edu",
  hanyang: "hanyang.ac.kr",
  inha: "inha.ac.kr",
  // SG
  nus: "nus.edu.sg",
  ntu: "ntu.edu.sg",
  smu: "smu.edu.sg",
  // JP
  tokyo: "u-tokyo.ac.jp",
  kyoto: "kyoto-u.ac.jp",
  waseda: "waseda.jp",
  osaka: "osaka-u.ac.jp",
  "temple-japan": "tuj.ac.jp",
  // AU
  melbourne: "unimelb.edu.au",
  sydney: "sydney.edu.au",
  anu: "anu.edu.au",
  unsw: "unsw.edu.au",
  monash: "monash.edu",
  // MT
  "uni-malta": "um.edu.mt",
  mcast: "mcast.edu.mt",
  mbs: "maltabusinessschool.com",
  // AE
  nyuad: "nyuad.nyu.edu",
  khalifa: "ku.ac.ae",
  aus: "aus.edu",
  // HK
  hku: "hku.hk",
  hkust: "hkust.edu.hk",
  cuhk: "cuhk.edu.hk",
  cityu: "cityu.edu.hk",
};

export const countryBySlug: Record<string, Country> = Object.fromEntries(
  countries.map((c) => [c.slug, c]),
);

export const countryByIso: Record<string, Country> = Object.fromEntries(
  countries.flatMap((c) =>
    c.iso.flatMap((iso) => {
      const normalized = String(Number.parseInt(iso, 10)).padStart(3, "0");
      return [
        [iso, c],
        [normalized, c],
      ];
    }),
  ),
);
