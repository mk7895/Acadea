import fs from "node:fs";
import path from "node:path";

const outputPath = path.resolve(
  "/Users/mateuszklepacki/Desktop/Acadea-Edu-Portal/research/acadea-all-universities-guides-batch.json",
);

const existingGuideSlugs = new Set([
  "iba-erasmus-university-rotterdam",
  "business-administration-university-of-amsterdam",
  "business-analytics-university-of-amsterdam",
  "international-business-administration-tilburg-university",
]);

const maintenanceGuides = [
  {
    title: "IBA - Erasmus University Rotterdam",
    slug: "iba-erasmus-university-rotterdam",
    country: "Holandia",
    universityName: "Erasmus University Rotterdam",
    programName: "IBA",
    emailSenderDomains: ["eur.nl"],
  },
  {
    title: "Business Administration - University of Amsterdam",
    slug: "business-administration-university-of-amsterdam",
    country: "Holandia",
    universityName: "University of Amsterdam",
    programName: "Business Administration",
    emailSenderDomains: ["uva.nl"],
  },
  {
    title: "Business Analytics - University of Amsterdam",
    slug: "business-analytics-university-of-amsterdam",
    country: "Holandia",
    universityName: "University of Amsterdam",
    programName: "Business Analytics",
    emailSenderDomains: ["uva.nl"],
  },
  {
    title: "International Business Administration - Tilburg University",
    slug: "international-business-administration-tilburg-university",
    country: "Holandia",
    universityName: "Tilburg University",
    programName: "International Business Administration",
    emailSenderDomains: ["tilburguniversity.edu"],
  },
];

const countries = [
  {
    country: "Wielka Brytania",
    centralPortal: "UCAS",
    universities: [
      ["University of Oxford", "ox.ac.uk"],
      ["University of Cambridge", "cam.ac.uk"],
      ["Imperial College London", "imperial.ac.uk"],
      ["London School of Economics", "lse.ac.uk"],
      ["UCL", "ucl.ac.uk"],
      ["King's College London", "kcl.ac.uk"],
      ["Queen Mary University London", "qmul.ac.uk"],
      ["University of Warwick", "warwick.ac.uk"],
      ["Durham University", "durham.ac.uk"],
      ["University of Bath", "bath.ac.uk"],
      ["University of St Andrews", "st-andrews.ac.uk"],
      ["University of Edinburgh", "ed.ac.uk"],
      ["University of Manchester", "manchester.ac.uk"],
    ],
  },
  {
    country: "Holandia",
    centralPortal: "Studielink",
    universities: [
      ["TU Delft", "tudelft.nl", "Programy licencjackie po angielsku"],
      ["Universiteit Leiden", "universiteitleiden.nl", "Programy licencjackie po angielsku"],
      ["Utrecht University", "uu.nl", "Programy licencjackie po angielsku"],
      ["University of Groningen", "rug.nl", "Programy licencjackie po angielsku"],
      ["Maastricht University", "maastrichtuniversity.nl", "Programy licencjackie po angielsku"],
      ["Vrije Universiteit Amsterdam", "vu.nl", "Programy licencjackie po angielsku"],
      ["University of Twente", "utwente.nl", "Programy licencjackie po angielsku"],
    ],
  },
  {
    country: "Niemcy",
    universities: [
      ["TU Munich", "tum.de"],
      ["Humboldt Universität Berlin", "hu-berlin.de"],
      ["Universität Heidelberg", "uni-heidelberg.de"],
      ["KIT Karlsruhe", "kit.edu"],
    ],
  },
  {
    country: "Irlandia",
    centralPortal: "CAO",
    universities: [
      ["University College Dublin", "ucd.ie"],
      ["Trinity College Dublin", "tcd.ie"],
      ["University College Cork", "ucc.ie"],
      ["University of Galway", "universityofgalway.ie"],
    ],
  },
  {
    country: "Francja",
    universities: [
      ["Sciences Po", "sciencespo.fr"],
      ["HEC Paris", "hec.edu"],
      ["Université PSL", "psl.eu"],
      ["École Polytechnique", "polytechnique.edu"],
      ["Sorbonne University", "sorbonne-universite.fr"],
    ],
  },
  {
    country: "Szwajcaria",
    universities: [
      ["ETH Zürich", "ethz.ch"],
      ["EPFL Lausanne", "epfl.ch"],
      ["Universität Zürich", "uzh.ch"],
      ["Universität Basel", "unibas.ch"],
    ],
  },
  {
    country: "Szwecja",
    centralPortal: "University Admissions Sweden",
    universities: [
      ["KTH Royal Institute of Technology", "kth.se"],
      ["Lund University", "lu.se"],
      ["Uppsala University", "uu.se"],
    ],
  },
  {
    country: "Dania",
    centralPortal: "Optagelse.dk",
    universities: [
      ["Technical Univ. of Denmark (DTU)", "dtu.dk"],
      ["Univ. of Copenhagen", "ku.dk"],
      ["Aarhus University", "au.dk"],
      ["Copenhagen Business School", "cbs.dk"],
    ],
  },
  {
    country: "Hiszpania",
    universities: [
      ["IE University", "ie.edu"],
      ["Univ. Complutense de Madrid", "ucm.es"],
      ["Universitat de Barcelona", "ub.edu"],
      ["ESADE Business & Law School", "esade.edu"],
    ],
  },
  {
    country: "Włochy",
    universities: [
      ["Università di Bologna", "unibo.it"],
      ["Politecnico di Milano", "polimi.it"],
      ["Università La Sapienza", "uniroma1.it"],
      ["Università di Padova", "unipd.it"],
      ["Bocconi University", "bocconi.it"],
      ["Università degli Studi di Torino", "unito.it"],
      ["Politecnico di Torino", "polito.it"],
    ],
  },
  {
    country: "Austria",
    universities: [
      ["Universität Wien", "univie.ac.at"],
      ["TU Wien", "tuwien.ac.at"],
      ["Wirtschaftsuniversität Wien", "wu.ac.at"],
      ["MCI Management Center Innsbruck", "mci.edu"],
      ["Universität Klagenfurt", "aau.at"],
    ],
  },
  {
    country: "Belgia",
    universities: [
      ["KU Leuven", "kuleuven.be"],
      ["Université Libre de Bruxelles", "ulb.be"],
      ["Ghent University", "ugent.be"],
      ["Vrije Universiteit Brussel", "vub.be"],
    ],
  },
  {
    country: "Norwegia",
    universities: [
      ["University of Oslo", "uio.no"],
      ["NTNU Trondheim", "ntnu.no"],
      ["BI Norwegian Business School", "bi.no"],
    ],
  },
  {
    country: "Czechy",
    universities: [
      ["Charles University Prague", "cuni.cz"],
      ["Czech Technical University", "cvut.cz"],
    ],
  },
  {
    country: "Portugalia",
    universities: [
      ["Universidade de Lisboa", "ulisboa.pt"],
      ["Universidade do Porto", "up.pt"],
      ["Nova University Lisbon", "nova.pt"],
    ],
  },
  {
    country: "Finlandia",
    universities: [
      ["Aalto University", "aalto.fi"],
      ["University of Helsinki", "helsinki.fi"],
      ["Tampere University", "tuni.fi"],
    ],
  },
  {
    country: "Kanada",
    universities: [
      ["University of Toronto", "utoronto.ca"],
      ["McGill University", "mcgill.ca"],
      ["UBC Vancouver", "ubc.ca"],
      ["University of Waterloo", "uwaterloo.ca"],
      ["York University", "yorku.ca"],
    ],
  },
  {
    country: "USA",
    universities: [
      ["MIT", "mit.edu"],
      ["Harvard University", "harvard.edu"],
      ["Stanford University", "stanford.edu"],
      ["Columbia University", "columbia.edu"],
      ["NYU", "nyu.edu"],
      ["Yale University", "yale.edu"],
      ["University of Pennsylvania", "upenn.edu"],
      ["Dartmouth College", "dartmouth.edu"],
      ["Princeton University", "princeton.edu"],
      ["Caltech", "caltech.edu"],
      ["Carnegie Mellon University", "cmu.edu"],
      ["UCLA", "ucla.edu"],
      ["UC Berkeley", "berkeley.edu"],
      ["Georgia Tech", "gatech.edu"],
      ["Johns Hopkins University", "jhu.edu"],
      ["Northwestern University", "northwestern.edu"],
    ],
  },
  {
    country: "Chiny",
    universities: [
      ["Peking University", "pku.edu.cn"],
      ["Tsinghua University", "tsinghua.edu.cn"],
      ["Fudan University", "fudan.edu.cn"],
      ["Zhejiang University", "zju.edu.cn"],
    ],
  },
  {
    country: "Korea Południowa",
    universities: [
      ["Seoul National University", "snu.ac.kr"],
      ["KAIST", "kaist.ac.kr"],
      ["Yonsei University", "yonsei.ac.kr"],
      ["Sungkyunkwan University (SKKU)", "skku.edu"],
      ["Hanyang University", "hanyang.ac.kr"],
      ["Inha University", "inha.ac.kr"],
    ],
  },
  {
    country: "Singapur",
    universities: [
      ["National University of Singapore", "nus.edu.sg"],
      ["Nanyang Technological University", "ntu.edu.sg"],
      ["SMU", "smu.edu.sg"],
    ],
  },
  {
    country: "Japonia",
    universities: [
      ["University of Tokyo", "u-tokyo.ac.jp"],
      ["Kyoto University", "kyoto-u.ac.jp"],
      ["Waseda University", "waseda.jp"],
      ["Osaka University", "osaka-u.ac.jp"],
      ["Temple University Japan", "tuj.ac.jp"],
    ],
  },
  {
    country: "Australia",
    universities: [
      ["University of Melbourne", "unimelb.edu.au"],
      ["University of Sydney", "sydney.edu.au"],
      ["ANU", "anu.edu.au"],
      ["UNSW Sydney", "unsw.edu.au"],
      ["Monash University", "monash.edu"],
    ],
  },
  {
    country: "Malta",
    universities: [
      ["University of Malta", "um.edu.mt"],
      ["MCAST", "mcast.edu.mt"],
      ["Malta Business School", "mbs.edu.mt"],
    ],
  },
  {
    country: "ZEA",
    universities: [
      ["NYU Abu Dhabi", "nyu.edu"],
      ["Khalifa University", "ku.ac.ae"],
      ["American University of Sharjah", "aus.edu"],
    ],
  },
  {
    country: "Hongkong",
    universities: [
      ["HKU", "hku.hk"],
      ["HKUST", "hkust.edu.hk"],
      ["Chinese University of Hong Kong", "cuhk.edu.hk"],
      ["City University of Hong Kong", "cityu.edu.hk"],
    ],
  },
];

const centralPortalConfig = {
  "Wielka Brytania": {
    portalLabel: "UCAS",
    commonTask: "Założenie konta w UCAS i potwierdzenie danych osobowych",
    universityTask: (guide) => `Dodanie programu ${guide.title} w UCAS`,
  },
  "Holandia": {
    portalLabel: "Studielink",
    commonTask: "Założenie konta w Studielink i potwierdzenie danych osobowych",
    universityTask: (guide) =>
      guide.programName
        ? `Rejestracja w Studielink na ${guide.programName}`
        : `Rejestracja w Studielink na wybrany program w ${guide.universityName}`,
  },
  "Irlandia": {
    portalLabel: "CAO",
    commonTask: "Założenie konta w CAO i potwierdzenie danych osobowych",
    universityTask: (guide) => `Dodanie programu ${guide.title} w CAO`,
  },
  "Szwecja": {
    portalLabel: "University Admissions Sweden",
    commonTask: "Założenie konta w University Admissions Sweden",
    universityTask: (guide) => `Dodanie programu ${guide.title} w University Admissions Sweden`,
  },
  "Dania": {
    portalLabel: "Optagelse.dk",
    commonTask: "Założenie konta w Optagelse.dk lub sprawdzenie, czy program ma własny portal krajowy",
    universityTask: (guide) => `Dodanie programu ${guide.title} do aplikacji krajowej`,
  },
};

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}

function titleForGuide(universityName, programName) {
  return programName ? `${programName} - ${universityName}` : universityName;
}

function buildGuide(country, universityName, domain, programName, insertAfterGuideSlug) {
  const title = titleForGuide(universityName, programName);
  const slug = slugify(title);
  const centralPortal = centralPortalConfig[country]?.portalLabel;
  const applicationLine = centralPortal
    ? `Proces aplikacji rozpoczyna się w portalu ${centralPortal}, a następnie przechodzi do wymagań programu oraz ewentualnego portalu uczelni.`
    : "Proces aplikacji obejmuje sprawdzenie wymagań programu, założenie konta w portalu uczelni i skompletowanie dokumentów przed deadlinem.";
  const portfolioLine =
    "W przypadku kierunków artystycznych, architektonicznych albo projektowych warto od razu sprawdzić, czy uczelnia wymaga portfolio, audition albo dodatkowych materiałów.";
  return {
    title,
    slug,
    country,
    universityName,
    ...(programName ? { programName } : {}),
    emailSenderDomains: [domain],
    insertAfterGuideSlug,
    summary: `Przewodnik ACADEA dla aplikacji na ${title}.`,
    descriptionMarkdown: [
      `Przewodnik dotyczy aplikacji na **${title}**.`,
      "",
      applicationLine,
      portfolioLine,
      "",
      "Znajdziesz tu uporządkowane najważniejsze kroki: dokumenty podstawowe, portal krajowy tam, gdzie obowiązuje, oraz portal uczelni i formalne wysłanie aplikacji.",
    ].join("\n"),
    estimatedReadMin: 8,
    status: "published",
    guideType: "admin_template",
    isVisibleToUnapprovedUsers: true,
    items: [
      {
        sortOrder: 0,
        sectionTitle: "Start",
        title: "Sprawdź wymagania programu i deadline",
        description: "Zweryfikuj język, wymagania przedmiotowe, dodatkowe testy i termin aplikacji przed rozpoczęciem kompletowania dokumentów.",
        itemType: "todo",
      },
      {
        sortOrder: 1,
        sectionTitle: "Dokumenty",
        title: "Przygotuj dokumenty podstawowe",
        description: "Zbierz transkrypty, przewidywane ukończenie szkoły, dokument tożsamości i potwierdzenie języka zgodnie z wymaganiami programu.",
        itemType: "todo",
      },
      {
        sortOrder: 2,
        sectionTitle: "Aplikacja",
        title: centralPortal ? `Rozpocznij aplikację przez ${centralPortal}` : "Załóż konto w portalu uczelni i złóż aplikację",
        description: "Przejdź przez wszystkie wymagane kroki w systemie rekrutacyjnym, wgraj dokumenty i upewnij się, że aplikacja została formalnie wysłana.",
        itemType: "todo",
      },
    ],
  };
}

const guides = [...maintenanceGuides];
let previousSlug = "international-business-administration-tilburg-university";

for (const group of countries) {
  for (const [universityName, domain, programName] of group.universities) {
    const guide = buildGuide(group.country, universityName, domain, programName, previousSlug);
  if (existingGuideSlugs.has(guide.slug)) {
    previousSlug = guide.slug;
    continue;
  }
    guides.push(guide);
    previousSlug = guide.slug;
  }
}

const newGuides = guides.filter((guide) => !existingGuideSlugs.has(guide.slug));
const allGuideSlugs = newGuides.map((guide) => guide.slug);

function attachExistingTile(title, guideSlugs) {
  return {
    title,
    targetTemplateTitle: title,
    mergeMode: "append",
    appliesToGuideSlugs: guideSlugs,
    rows: [],
  };
}

const materialTemplates = [
  attachExistingTile("Paszport", allGuideSlugs),
  attachExistingTile("Certificate of expected graduation", allGuideSlugs),
  attachExistingTile("Certyfikat językowy", allGuideSlugs),
  attachExistingTile("Transkrypty / świadectwa ze szkoły średniej", allGuideSlugs),
];

const centralPortalRows = [];
for (const [country, config] of Object.entries(centralPortalConfig)) {
  const countryGuides = newGuides.filter((guide) => guide.country === country);
  if (!countryGuides.length) {
    continue;
  }
  centralPortalRows.push(
    {
      level: "country",
      country,
      actionType: "check_only",
      appliesToGuideSlugs: countryGuides.map((guide) => guide.slug),
    },
    {
      level: "item",
      task: config.commonTask,
      actionType: "check_only",
      appliesToGuideSlugs: countryGuides.map((guide) => guide.slug),
    },
  );
  for (const guide of countryGuides) {
    centralPortalRows.push({
      level: "university",
      university: guide.title,
      actionType: "check_only",
      appliesToGuideSlugs: [guide.slug],
    });
    centralPortalRows.push({
      level: "item",
      task: config.universityTask(guide),
      actionType: "check_only",
      appliesToGuideSlugs: [guide.slug],
    });
  }
}

materialTemplates.push({
  title: "Zcentralizowane Portale Aplikacyjne",
  targetTemplateTitle: "Zcentralizowane Portale Aplikacyjne",
  mergeMode: "append",
  appliesToGuideSlugs: Array.from(new Set(centralPortalRows.flatMap((row) => row.appliesToGuideSlugs ?? []))),
  rows: centralPortalRows,
});

const portalCountries = new Set([
  "Holandia",
  "Niemcy",
  "Francja",
  "Szwajcaria",
  "Hiszpania",
  "Włochy",
  "Austria",
  "Belgia",
  "Norwegia",
  "Czechy",
  "Portugalia",
  "Finlandia",
  "Kanada",
  "USA",
  "Chiny",
  "Korea Południowa",
  "Singapur",
  "Japonia",
  "Australia",
  "Malta",
  "ZEA",
  "Hongkong",
]);

const portalRows = [];
for (const group of countries) {
  const countryGuides = newGuides.filter((guide) => guide.country === group.country && portalCountries.has(guide.country));
  if (!countryGuides.length) {
    continue;
  }
  portalRows.push({
    level: "country",
    country: group.country,
    actionType: "check_only",
    appliesToGuideSlugs: countryGuides.map((guide) => guide.slug),
  });
  for (const guide of countryGuides) {
    portalRows.push({
      level: "university",
      university: guide.title,
      actionType: "check_only",
      appliesToGuideSlugs: [guide.slug],
    });
    portalRows.push({
      level: "item",
      task: "Założenie konta w portalu uczelni",
      actionType: "check_only",
      appliesToGuideSlugs: [guide.slug],
    });
    portalRows.push({
      level: "item",
      task: "Wgranie wymaganych dokumentów i formalne wysłanie aplikacji w portalu uczelni",
      actionType: "check_only",
      appliesToGuideSlugs: [guide.slug],
    });
  }
}

materialTemplates.push({
  title: "Portale Uczelni",
  targetTemplateTitle: "Portale Uczelni",
  mergeMode: "append",
  appliesToGuideSlugs: Array.from(new Set(portalRows.flatMap((row) => row.appliesToGuideSlugs ?? []))),
  rows: portalRows,
});

materialTemplates.push({
  title: "Egzaminy wstępne do uczelni",
  description: "Najbardziej przewidywalne testy i etapy selekcyjne, które warto śledzić na poziomie uczelni lub programu.",
  templateType: "passport_like",
  appliesToGuideSlugs: [
    "university-of-oxford",
    "university-of-cambridge",
  ],
  rows: [
    {
      level: "country",
      country: "Wielka Brytania",
      actionType: "check_only",
      appliesToGuideSlugs: [
        "university-of-oxford",
        "university-of-cambridge",
      ],
    },
    {
      level: "university",
      university: "University of Oxford",
      actionType: "check_only",
      appliesToGuideSlugs: ["university-of-oxford"],
    },
    {
      level: "item",
      task: "Sprawdzenie, czy wybrany kierunek w Oxford wymaga admissions test",
      actionType: "check_only",
      appliesToGuideSlugs: ["university-of-oxford"],
    },
    {
      level: "item",
      task: "Przygotowanie do interview w Oxford, jeśli kandydat zostanie shortlisted",
      actionType: "check_only",
      appliesToGuideSlugs: ["university-of-oxford"],
    },
    {
      level: "university",
      university: "University of Cambridge",
      actionType: "check_only",
      appliesToGuideSlugs: ["university-of-cambridge"],
    },
    {
      level: "item",
      task: "Sprawdzenie, czy wybrany kierunek w Cambridge wymaga admissions assessment",
      actionType: "check_only",
      appliesToGuideSlugs: ["university-of-cambridge"],
    },
    {
      level: "item",
      task: "Przygotowanie do interview w Cambridge, jeśli kandydat zostanie shortlisted",
      actionType: "check_only",
      appliesToGuideSlugs: ["university-of-cambridge"],
    },
  ],
});

const blueprint = {
  version: 1,
  guides,
  materialTemplates,
};

fs.writeFileSync(outputPath, `${JSON.stringify(blueprint, null, 2)}\n`);
console.log(`Wrote ${guides.length} guides to ${outputPath}`);
