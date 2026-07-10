import fs from "node:fs";
import path from "node:path";

const root = "/Users/mateuszklepacki/Desktop/Acadea-Edu-Portal";
const previousBatchPath = path.join(root, "research/acadea-all-universities-guides-batch.json");
const outputPath = path.join(root, "research/acadea-university-guides-correction.json");
const reportPath = path.join(root, "research/acadea-university-guides-correction-report.md");

const previousBatch = JSON.parse(fs.readFileSync(previousBatchPath, "utf8"));

const obsoleteDutchGuideSlugs = [
  "programy-licencjackie-po-angielsku-tu-delft",
  "programy-licencjackie-po-angielsku-universiteit-leiden",
  "programy-licencjackie-po-angielsku-utrecht-university",
  "programy-licencjackie-po-angielsku-university-of-groningen",
  "programy-licencjackie-po-angielsku-maastricht-university",
  "programy-licencjackie-po-angielsku-vrije-universiteit-amsterdam",
  "programy-licencjackie-po-angielsku-university-of-twente",
];

const existingDutchGuides = [
  {
    title: "IBA - Erasmus University Rotterdam",
    slug: "iba-erasmus-university-rotterdam",
    country: "Holandia",
    universityName: "Erasmus University Rotterdam",
    programName: "International Business Administration",
    domain: "eur.nl",
    portal: "EUR Admissions Portal i OLAF",
  },
  {
    title: "Business Administration - University of Amsterdam",
    slug: "business-administration-university-of-amsterdam",
    country: "Holandia",
    universityName: "University of Amsterdam",
    programName: "Business Administration",
    domain: "uva.nl",
    portal: "SIS / My Applications",
  },
  {
    title: "Business Analytics - University of Amsterdam",
    slug: "business-analytics-university-of-amsterdam",
    country: "Holandia",
    universityName: "University of Amsterdam",
    programName: "Business Analytics",
    domain: "uva.nl",
    portal: "SIS / My Applications",
  },
  {
    title: "International Business Administration - Tilburg University",
    slug: "international-business-administration-tilburg-university",
    country: "Holandia",
    universityName: "Tilburg University",
    programName: "International Business Administration",
    domain: "tilburguniversity.edu",
    portal: "OSIRIS Aanmeld",
  },
];

const dutchUniversities = [
  {
    name: "TU Delft",
    domain: "tudelft.nl",
    portal: "Osiaan",
    source: "https://www.tudelft.nl/en/education/programmes/bachelors",
    programmes: [
      ["Aerospace Engineering", "numerus_fixus"],
      ["Computer Science and Engineering", "numerus_fixus"],
      ["Earth, Climate and Technology"],
      ["Nanobiology", "numerus_fixus"],
    ],
  },
  {
    name: "Leiden University",
    domain: "universiteitleiden.nl",
    portal: "uSis",
    source: "https://www.universiteitleiden.nl/en/education/bachelors",
    programmes: [
      ["Archaeology"],
      ["Arts, Media and Society"],
      ["Dutch Studies"],
      ["International Relations and Organisations", "numerus_fixus"],
      ["International Studies"],
      ["Liberal Arts and Sciences: Global Challenges", "selective"],
      ["Linguistics"],
      ["Philosophy: Global and Comparative Perspectives"],
      ["Psychology", "numerus_fixus"],
      ["Security Studies"],
      ["South and Southeast Asian Studies"],
      ["Urban Studies"],
    ],
  },
  {
    name: "University of Amsterdam",
    domain: "uva.nl",
    portal: "SIS / My Applications",
    source: "https://www.uva.nl/en/education/bachelor-s/bachelor-s-programmes/bachelor-s-programmes.html",
    programmes: [
      ["Actuarial Science"],
      ["Ancient Studies"],
      ["Archaeology"],
      ["Business Administration", "numerus_fixus", "business-administration-university-of-amsterdam"],
      ["Business Analytics", null, "business-analytics-university-of-amsterdam"],
      ["Computational Social Science"],
      ["Cultural Anthropology and Development Sociology"],
      ["Econometrics and Data Science"],
      ["Economics and Business Economics", "numerus_fixus"],
      ["English Language and Culture"],
      ["European Studies"],
      ["Future Planet Studies"],
      ["Global Arts, Culture and Politics"],
      ["Global Communication Science"],
      ["Human Geography and Planning"],
      ["Liberal Arts and Sciences (Amsterdam University College)", "selective"],
      ["Linguistics"],
      ["Literary and Cultural Analysis"],
      ["Media and Culture"],
      ["Media and Information"],
      ["Political Science"],
      ["Politics, Psychology, Law and Economics (PPLE)", "selective"],
      ["Psychology", "numerus_fixus"],
      ["Sign Language Linguistics"],
      ["Sociology"],
    ],
  },
  {
    name: "Utrecht University",
    domain: "uu.nl",
    portal: "OSIRIS Online Application",
    source: "https://www.uu.nl/bachelors/algemene-informatie/ik-zoek-extra-uitdaging/studeren-in-het-engels",
    programmes: [
      ["Celtic Languages and Culture"],
      ["College of Pharmaceutical Sciences", "limited_enrolment"],
      ["Economics and Business Economics"],
      ["Global Sustainability Science"],
      ["History"],
      ["Linguistics"],
      ["Literary Studies"],
      ["Media and Culture"],
      ["Molecular and Biophysical Life Sciences"],
      ["Philosophy, Politics and Economics", "selective"],
      ["University College Roosevelt", "selective"],
      ["University College Utrecht", "selective"],
    ],
  },
  {
    name: "University of Groningen",
    domain: "rug.nl",
    portal: "Progress Portal",
    source: "https://www.rug.nl/bachelors/in-english?lang=en",
    programmes: [
      ["American Studies"],
      ["Art History"],
      ["Arts, Culture and Media"],
      ["Communication and Information Studies"],
      ["English Language and Culture"],
      ["European Languages and Cultures"],
      ["History"],
      ["International Relations and International Organization", "numerus_fixus"],
      ["Media Studies"],
      ["Data Science and Society"],
      ["Global Responsibility and Leadership", "selective"],
      ["Econometrics and Operations Research"],
      ["Economics and Business Economics"],
      ["International Business", "numerus_fixus"],
      ["Applied Mathematics"],
      ["Applied Physics"],
      ["Artificial Intelligence"],
      ["Astronomy"],
      ["Biology"],
      ["Biomedical Engineering"],
      ["Chemical Engineering"],
      ["Chemistry"],
      ["Computing Science"],
      ["Industrial Engineering and Management"],
      ["Life Science and Technology"],
      ["Mathematics"],
      ["Physics"],
      ["Human Geography and Planning"],
      ["Spatial Planning and Design"],
      ["Psychology", "numerus_fixus"],
      ["Philosophy of a Specific Discipline"],
      ["International and European Law"],
      ["Religious Studies"],
      ["Liberal Arts and Sciences", "selective"],
    ],
  },
  {
    name: "Erasmus University Rotterdam",
    domain: "eur.nl",
    portal: "EUR Admissions Portal",
    source: "https://www.eur.nl/en/education/bachelor-programmes",
    programmes: [
      ["International Bachelor Communication and Media", "selective"],
      ["International Bachelor Economics and Business Economics", "numerus_fixus"],
      ["International Business Administration", "numerus_fixus", "iba-erasmus-university-rotterdam"],
      ["International Bachelor Econometrics and Operations Research"],
      ["Nanobiology", "numerus_fixus"],
      ["Double bachelor BSc2 in Econometrics and Economics"],
      ["International Bachelor Arts and Culture Studies"],
      ["International Bachelor History"],
      ["International Bachelor in Psychology", "numerus_fixus"],
      ["Management of International Social Challenges"],
      ["Dual Degree in Arts and Sciences", "selective"],
      ["Double bachelor in Economics and Philosophy of Economics"],
      ["Double bachelor in Econometrics and Philosophy of Econometrics"],
      ["Liberal Arts and Sciences", "selective"],
    ],
  },
  {
    name: "Tilburg University",
    domain: "tilburguniversity.edu",
    portal: "OSIRIS Aanmeld",
    source: "https://www.tilburguniversity.edu/education/bachelors-programs",
    programmes: [
      ["Cognitive Science and Artificial Intelligence"],
      ["Data Science"],
      ["Digital Culture and Society"],
      ["Econometrics and Operations Research"],
      ["Economics"],
      ["Entrepreneurship and Business Innovation"],
      ["Global Law"],
      ["Global Management of Social Issues"],
      ["International Business Administration", null, "international-business-administration-tilburg-university"],
      ["International Sociology"],
      ["Psychology", "numerus_fixus"],
      ["University College Tilburg: Liberal Arts and Sciences", "selective"],
    ],
  },
  {
    name: "Maastricht University",
    domain: "maastrichtuniversity.nl",
    portal: "MyApplication",
    source: "https://www.maastrichtuniversity.nl/education/bachelor/programmes",
    programmes: [
      ["Arts and Culture"],
      ["Biomedical Sciences"],
      ["Brain Science", "numerus_fixus"],
      ["Business Analytics"],
      ["Business Engineering"],
      ["Circular Engineering"],
      ["Computer Science"],
      ["Data Science and Artificial Intelligence"],
      ["Digital Society"],
      ["Econometrics and Operations Research"],
      ["Economics and Business Economics"],
      ["European Law School", "numerus_fixus"],
      ["European Public Health"],
      ["European Studies"],
      ["Global Studies"],
      ["International Business", "numerus_fixus"],
      ["Maastricht Science Programme", "selective"],
      ["Psychology", "numerus_fixus"],
      ["Regenerative Medicine and Technology"],
      ["Sustainable Bioscience"],
      ["University College Maastricht", "selective"],
      ["University College Venlo", "selective"],
      ["Urban Sustainability Studies"],
    ],
  },
  {
    name: "Vrije Universiteit Amsterdam",
    domain: "vu.nl",
    portal: "VU Dashboard",
    source: "https://vu.nl/en/education/bachelor/programmes",
    programmes: [
      ["Ancient Studies"],
      ["Archaeology"],
      ["Artificial Intelligence"],
      ["Business Analytics"],
      ["Communication Science"],
      ["Communication and Information Studies"],
      ["Computer Science"],
      [
        "Creative Technology (Amsterdam VU-UT track)",
        null,
        null,
        {
          domain: "utwente.nl",
          domains: ["utwente.nl", "vu.nl"],
          portal: "OSIRIS (University of Twente)",
        },
      ],
      ["Cultural Anthropology and Development Sociology"],
      ["Econometrics and Data Science"],
      ["Econometrics and Operations Research"],
      ["Economics and Business Economics"],
      ["History and International Studies"],
      ["International Business Administration"],
      ["Law in Society", "selective"],
      ["Literature and Society"],
      ["Mathematics"],
      [
        "Mechanical Engineering (Amsterdam VU-UT track)",
        null,
        null,
        {
          domain: "utwente.nl",
          domains: ["utwente.nl", "vu.nl"],
          portal: "OSIRIS (University of Twente)",
        },
      ],
      ["Media, Art, Design and Architecture"],
      ["Philosophy"],
      ["Philosophy, Politics and Economics", "selective"],
      ["Political Science: Global Politics"],
      ["Psychology", "numerus_fixus"],
    ],
  },
  {
    name: "University of Twente",
    domain: "utwente.nl",
    portal: "OSIRIS",
    source: "https://www.utwente.nl/en/education/bachelor/programmes/?language=EN",
    programmes: [
      ["Advanced Technology"],
      ["Applied Mathematics"],
      ["Business Information Technology"],
      ["Chemical Science and Engineering"],
      ["Civil Engineering"],
      ["Communication Science"],
      ["Creative Technology"],
      ["Electrical Engineering"],
      ["Industrial Design Engineering"],
      ["Industrial Engineering and Management"],
      ["International Business Administration"],
      ["Mechanical Engineering"],
      ["Psychology", "numerus_fixus"],
      ["Public Administration"],
      ["Technical Computer Science"],
    ],
  },
];

const officialSources = [
  ["UCAS 2026 personal statement", "https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement/how-to-write-your-personal-statement-for-2026-entry-onwards"],
  ["Common Application essay prompts", "https://www.commonapp.org/apply/essay-prompts/"],
  ["Oxford admissions tests", "https://www.ox.ac.uk/admissions/undergraduate/applying/guide-for-applicants/admissions-tests"],
  ["Cambridge admissions assessments", "https://www.undergraduate.study.cam.ac.uk/apply/how/admission-tests"],
  ["MIT essays", "https://mitadmissions.org/apply/firstyear/essays-activities-academics/"],
  ["MIT testing", "https://mitadmissions.org/apply/firstyear/tests-scores/"],
  ["Harvard supplement", "https://college.harvard.edu/resources/faq/what-included-harvard-supplement"],
  ["Stanford essays", "https://admission.stanford.edu/apply/first-year/apply.html"],
  ["Yale 2026-2027 essays", "https://admissions.yale.edu/essay-topics"],
  ["Princeton questions", "https://admission.princeton.edu/apply/princeton-specific-questions"],
  ["Penn requirements", "https://admissions.upenn.edu/how-to-apply/first-year-applicants/application-requirements"],
  ["Dartmouth supplement", "https://admissions.dartmouth.edu/glossary-term/writing-supplement"],
  ["Caltech essays", "https://www.admissions.caltech.edu/apply/first-year-applicants/supplemental-application-essays"],
  ["Carnegie Mellon requirements", "https://www.cmu.edu/admission/admission/undergraduate-admission-requirements"],
  ["NYU supplement", "https://meet.nyu.edu/advice/application-tips/your-guide-to-the-nyu-supplemental-essay/"],
  ["UC personal insight questions", "https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-first-year/personal-insight-questions.html"],
  ["UCLA supplemental applications", "https://admission.ucla.edu/apply/supplemental-applications"],
  ["Georgia Tech essays", "https://admission.gatech.edu/first-year/personal-essays"],
  ["Johns Hopkins requirements", "https://apply.jhu.edu/how-to-apply/application-deadlines-requirements/"],
  ["Northwestern writing supplements", "https://admissions.northwestern.edu/faqs/writing-supplements/"],
  ["Sciences Po 2026 written pieces", "https://www.sciencespo.fr/en/news/undergraduate-applicants-read-our-advice-for-writing-your-essays/"],
  ["HEC-Bocconi Bachelor admissions", "https://www.hec.edu/en/bachelor-programs/admissions"],
  ["École Polytechnique Bachelor admissions", "https://programmes.polytechnique.edu/en/bachelor/admissions/admissions-criteria-and-procedure"],
  ["UBC personal profile", "https://you.ubc.ca/applying-ubc/how-to-apply/personal-profile/"],
  ["UBC supplemental requirements", "https://you.ubc.ca/applying-ubc/how-to-apply/application/"],
  ["Toronto supplemental deadlines", "https://future.utoronto.ca/deadlines"],
  ["McGill supporting documents", "https://www.mcgill.ca/undergraduate-admissions/apply/submit-documents"],
  ["Waterloo supplementary forms", "https://uwaterloo.ca/future-students/start-here/understanding-admission-requirements"],
  ["NUS aptitude-based admissions", "https://nus.edu.sg/oam/admissions/aptitude-based-admissions"],
  ["NYU Abu Dhabi first-year application", "https://nyuad.nyu.edu/en/apply/undergraduate/apply.html"],
  ["NYU Abu Dhabi entry requirements", "https://nyuad.nyu.edu/en/apply/undergraduate/apply/entry-requirements.html"],
  ["Erasmus IBCoM application", "https://www.eur.nl/en/bachelor/international-bachelor-communication-and-media/application"],
  ["Utrecht College of Pharmaceutical Sciences selection", "https://www.uu.nl/en/bachelors/college-pharmaceutical-sciences/application-and-admission/selection"],
  ["Leiden numerus-fixus programmes", "https://www.universiteitleiden.nl/en/education/admission-and-application/bachelors/admission-requirements"],
  ["Groningen fixed-quota programmes", "https://www.rug.nl/education/application-enrolment-tuition-fees/admission/procedures/non-dutch-qualification/fixus-non-dutch-qualification?lang=en"],
  ["VU-UT Creative Technology application", "https://vu.nl/en/education/bachelor/creative-technology/admissions"],
  ["VU-UT Mechanical Engineering application", "https://vu.nl/en/education/bachelor/mechanical-engineering/admissions"],
  ["CAO", "https://www.cao.ie/apply.php"],
  ["University Admissions Sweden", "https://www.universityadmissions.se/en/apply-to-bachelors/"],
  ["Study in Denmark", "https://studyindenmark.dk/study-options/how-to-apply"],
  ["Peking University 2026 international undergraduate admission", "https://www.isd.pku.edu.cn/en/detail.php?id=818"],
  ["Tsinghua international undergraduate application guide", "https://apply.join-tsinghua.edu.cn/international/res/SpecialWsbm/guide.en.html"],
  ["Seoul National University 2026 international undergraduate guide", "https://admission.snu.ac.kr/webdata/admission/files/2026Spring_under.pdf"],
  ["KAIST 2026 international undergraduate application form", "https://admission.kaist.ac.kr/wz/api/admin/files/view/intl-undergraduate/%28Sample%29%20Online%20Application%20Form_2026.pdf"],
  ["VU Amsterdam 2026 selection programmes", "https://vu.nl/en/education/more-about/information-for-uk-applicants-bachelor"],
  ["University of Twente Psychology 2026 selection", "https://www.utwente.nl/en/education/bachelor/programmes/psychology/enrolment/"],
  ["UvA selective bachelor programmes", "https://www.uva.nl/en/education/admissions/bachelors/applying-for-a-selective-bachelors-programme.html"],
  ...dutchUniversities.map((university) => [`${university.name} programmes`, university.source]),
];

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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function selectionLabel(selection) {
  if (selection === "numerus_fixus") return "numerus fixus";
  if (selection === "limited_enrolment") return "limited enrolment";
  if (selection === "selective") return "selekcja programu";
  return "";
}

const dutchProgrammeRecords = dutchUniversities.flatMap((university) =>
  university.programmes.map(([programName, selection = null, existingSlug = null, overrides = {}]) => {
    const title = `${programName} - ${university.name}`;
    const slug = existingSlug || slugify(title);
    return {
      title,
      slug,
      country: "Holandia",
      universityName: university.name,
      programName,
      domain: overrides.domain || university.domain,
      domains: overrides.domains || [overrides.domain || university.domain],
      portal: overrides.portal || university.portal,
      source: university.source,
      selection,
      existing: Boolean(existingSlug),
    };
  }),
);

const newDutchProgrammeRecords = dutchProgrammeRecords.filter((guide) => !guide.existing);
let previousDutchSlug = "international-business-administration-tilburg-university";
const newDutchGuides = newDutchProgrammeRecords.map((guide) => {
  const selection = selectionLabel(guide.selection);
  const payload = {
    title: guide.title,
    slug: guide.slug,
    country: guide.country,
    universityName: guide.universityName,
    programName: guide.programName,
    emailSenderDomains: unique([...(guide.domains || [guide.domain]), "studielink.nl"]),
    insertAfterGuideSlug: previousDutchSlug,
    summary: `Aplikacja na ${guide.programName} w ${guide.universityName}: Studielink, ${guide.portal}${selection ? ` i ${selection}` : ""}.`,
    descriptionMarkdown: [
      `Ten przewodnik dotyczy programu **${guide.programName}** w **${guide.universityName}**.`,
      "",
      `Aplikację rozpoczynasz w Studielink, a dokumenty i status sprawdzasz w systemie ${guide.portal}.`,
      selection ? `Program prowadzi dodatkowy etap: **${selection}**. Nie wystarczy samo spełnienie minimalnych wymagań.` : "",
      "",
      `[Oficjalna strona programu i rekrutacji](${guide.source})`,
    ].filter((line, index, lines) => line || lines[index - 1] !== "").join("\n"),
    estimatedReadMin: 8,
    status: "published",
    guideType: "admin_template",
    isVisibleToUnapprovedUsers: true,
    items: [
      {
        sortOrder: 0,
        sectionTitle: "Studielink",
        title: `Zarejestruj ${guide.programName} w Studielink`,
        description: `Wybierz dokładny program ${guide.programName} prowadzony przez ${guide.universityName} i sprawdź poprawność danych osobowych oraz wcześniejszej edukacji.`,
        itemType: "todo",
      },
      {
        sortOrder: 1,
        sectionTitle: "Portal uczelni",
        title: `Aktywuj konto w ${guide.portal}`,
        description: `Użyj wiadomości wysłanej przez ${guide.universityName}, aby aktywować konto i otworzyć checklistę dokumentów dla tego programu.`,
        itemType: "todo",
      },
      {
        sortOrder: 2,
        sectionTitle: "Portal uczelni",
        title: `Wyślij kompletną aplikację w ${guide.portal}`,
        description: "Prześlij dokumenty wymagane na checkliście programu, zatwierdź formularz i zachowaj potwierdzenie wysłania.",
        itemType: "todo",
      },
      ...(selection
        ? [{
            sortOrder: 3,
            sectionTitle: "Selekcja",
            title: `Ukończ etap ${selection}`,
            description: "Wykonaj wszystkie elementy selekcji udostępnione dla tego programu i sprawdź, czy uczelnia potwierdziła ich otrzymanie.",
            itemType: "todo",
          }]
        : []),
    ],
  };
  previousDutchSlug = guide.slug;
  return payload;
});

const retainedPreviousGuides = previousBatch.guides.filter(
  (guide) => !obsoleteDutchGuideSlugs.includes(guide.slug),
);

const guideRecords = [
  ...retainedPreviousGuides.map((guide) => ({
    title: guide.title,
    slug: guide.slug,
    country: guide.country,
    universityName: guide.universityName,
    programName: guide.programName || null,
    domain: guide.emailSenderDomains?.[0] || "",
    portal: null,
    existing: true,
  })),
  ...newDutchProgrammeRecords,
];

const guideBySlug = new Map(guideRecords.map((guide) => [guide.slug, guide]));
const allGuideSlugs = unique(guideRecords.map((guide) => guide.slug));
const newDutchSlugs = newDutchProgrammeRecords.map((guide) => guide.slug);
const guideSlugsForCountry = (country) => guideRecords
  .filter((guide) => guide.country === country)
  .map((guide) => guide.slug);
const ukGuideSlugs = guideSlugsForCountry("Wielka Brytania");
const irishGuideSlugs = guideSlugsForCountry("Irlandia");
const swedishGuideSlugs = guideSlugsForCountry("Szwecja");
const danishGuideSlugs = guideSlugsForCountry("Dania");
const finnishGuideSlugs = guideSlugsForCountry("Finlandia");
const ouacSlugs = ["university-of-toronto", "university-of-waterloo", "york-university"];
const commonAppSlugs = [
  "harvard-university", "stanford-university", "columbia-university", "nyu", "yale-university",
  "university-of-pennsylvania", "dartmouth-college", "princeton-university", "caltech",
  "carnegie-mellon-university", "georgia-tech", "johns-hopkins-university", "northwestern-university",
];
const ucApplicationSlugs = ["ucla", "uc-berkeley"];

const portalNames = {
  "university-of-oxford": "Oxford applicant self-service",
  "university-of-cambridge": "My Cambridge Application",
  "imperial-college-london": "My Imperial",
  "london-school-of-economics": "LSE applicant portal",
  ucl: "Portico",
  "king-s-college-london": "King's Apply",
  "queen-mary-university-london": "MySIS",
  "university-of-warwick": "Warwick Applicant Portal",
  "durham-university": "Durham Applicant Portal",
  "university-of-bath": "Bath Application Tracker",
  "university-of-st-andrews": "St Andrews Applicant Portal",
  "university-of-edinburgh": "EUCLID / MyEd",
  "university-of-manchester": "Manchester Self Service",
  "tu-munich": "TUMonline",
  "humboldt-universitat-berlin": "uni-assist",
  "universitat-heidelberg": "heiCO",
  "kit-karlsruhe": "KIT Bewerbungsportal",
  "sciences-po": "Sciences Po admissions portal",
  "hec-paris": "HEC-Bocconi application portal",
  "universite-psl": "PSL admissions portal",
  "ecole-polytechnique": "École Polytechnique application portal",
  "sorbonne-university": "Parcoursup / eCandidat",
  "eth-zurich": "eApply ETH",
  "epfl-lausanne": "EPFL online application",
  "universitat-zurich": "UZH application portal",
  "universitat-basel": "University of Basel Online Services",
  "ie-university": "IE Admissions Portal",
  "univ-complutense-de-madrid": "Distrito Único de Madrid",
  "universitat-de-barcelona": "Accesnet pre-enrolment",
  "esade-business-and-law-school": "ESADE Admissions Portal",
  "universita-di-bologna": "Studenti Online",
  "politecnico-di-milano": "Polimi Online Services",
  "universita-la-sapienza": "Infostud",
  "universita-di-padova": "Uniweb",
  "bocconi-university": "MyApplication Bocconi",
  "universita-degli-studi-di-torino": "Apply@UniTo",
  "politecnico-di-torino": "Apply@PoliTO",
  "universitat-wien": "u:space",
  "tu-wien": "TISS",
  "wirtschaftsuniversitat-wien": "WU Online Application",
  "mci-management-center-innsbruck": "MCI application portal",
  "universitat-klagenfurt": "AAU application portal",
  "ku-leuven": "KU Leuven application tool",
  "universite-libre-de-bruxelles": "MonULB",
  "ghent-university": "Oasis",
  "vrije-universiteit-brussel": "VUB online application",
  "university-of-oslo": "Søknadsweb",
  "ntnu-trondheim": "Søknadsweb",
  "bi-norwegian-business-school": "BI application portal",
  "charles-university-prague": "Charles University faculty application",
  "czech-technical-university": "CTU electronic application",
  "universidade-de-lisboa": "ULisboa faculty application",
  "universidade-do-porto": "U.Porto application portal",
  "nova-university-lisbon": "NOVA application portal",
  "university-of-toronto": "Join U of T / Engineering Applicant Portal",
  "mcgill-university": "McGill Applicant Portal",
  "ubc-vancouver": "UBC Applicant Service Centre",
  "university-of-waterloo": "Quest",
  "york-university": "MyFile",
  mit: "MIT application portal",
  "harvard-university": "Harvard Applicant Portal",
  "stanford-university": "Stanford Portal",
  "columbia-university": "Columbia Applicant Portal",
  nyu: "NYU Applicant Portal",
  "yale-university": "Yale Admissions Status Portal",
  "university-of-pennsylvania": "Penn Applicant Portal",
  "dartmouth-college": "Dartmouth Applicant Portal",
  "princeton-university": "Princeton Applicant Portal",
  caltech: "Caltech Applicant Portal",
  "carnegie-mellon-university": "Where Am I in the Process portal",
  "georgia-tech": "Georgia Tech admission portal",
  "johns-hopkins-university": "Johns Hopkins Applicant Portal",
  "northwestern-university": "Northwestern Applicant Status Portal",
  ucla: "UC application / UCLA Applicant Portal",
  "uc-berkeley": "UC application / MAP@Berkeley",
  "peking-university": "PKU international application system",
  "tsinghua-university": "Tsinghua Online Application System",
  "fudan-university": "Fudan international application system",
  "zhejiang-university": "ZJU online application system",
  "seoul-national-university": "SNU international admissions portal",
  kaist: "KAIST online application",
  "yonsei-university": "Yonsei international admissions portal",
  "sungkyunkwan-university-skku": "SKKU online application",
  "hanyang-university": "Hanyang online application",
  "inha-university": "Inha online application",
  "national-university-of-singapore": "NUS Applicant Portal",
  "nanyang-technological-university": "NTU application portal",
  smu: "SMU Applicant Self Service",
  "university-of-tokyo": "UTokyo online application",
  "kyoto-university": "Kyoto iUP online application",
  "waseda-university": "Waseda Online Admissions Application",
  "osaka-university": "Osaka University application system",
  "temple-university-japan": "Temple application portal",
  "university-of-melbourne": "University of Melbourne applicant portal",
  "university-of-sydney": "Sydney Student",
  anu: "ANU application portal",
  "unsw-sydney": "Apply Online UNSW",
  "monash-university": "Monash applicant portal",
  "university-of-malta": "eSIMS Applicant Portal",
  mcast: "MCAST Admissions Portal",
  "malta-business-school": "Malta Business School application portal",
  "nyu-abu-dhabi": "NYU Applicant Portal",
  "khalifa-university": "Khalifa University admission portal",
  "american-university-of-sharjah": "AUS applicant portal",
  hku: "HKU application system",
  hkust: "HKUST online application",
  "chinese-university-of-hong-kong": "CUHK online application",
  "city-university-of-hong-kong": "CityU online application",
};

function materialCountryRow(country, slugs) {
  return { level: "country", country, actionType: "check_only", appliesToGuideSlugs: unique(slugs) };
}

function materialUniversityRow(guide, slugs = [guide.slug], label = guide.title) {
  return {
    level: "university",
    country: guide.country,
    university: label,
    actionType: "check_only",
    appliesToGuideSlugs: unique(slugs),
  };
}

function materialItemRow(guide, task, options = {}) {
  return {
    level: "item",
    country: guide.country,
    university: options.university || guide.title,
    task,
    actionType: options.actionType || "check_only",
    appliesToGuideSlugs: options.appliesToGuideSlugs || [guide.slug],
    ...(options.suggestedFilename ? { suggestedFilename: options.suggestedFilename } : {}),
    ...(options.docTabTitle ? { docTabTitle: options.docTabTitle } : {}),
    ...(options.docTabPrompt ? { docTabPrompt: options.docTabPrompt } : {}),
    ...(options.alternativeOptions ? { alternativeOptions: options.alternativeOptions } : {}),
  };
}

function groupRowsByCountry(records, createRows) {
  const rows = [];
  for (const country of unique(records.map((record) => record.country))) {
    const countryRecords = records.filter((record) => record.country === country);
    rows.push(materialCountryRow(country, countryRecords.map((record) => record.slug)));
    for (const record of countryRecords) rows.push(...createRows(record));
  }
  return rows;
}

const centralPortalGroups = [
  {
    country: "Wielka Brytania",
    system: "UCAS",
    slugs: ukGuideSlugs,
    accountTask: "Założenie aplikacji w UCAS i uzupełnienie danych, edukacji oraz referencji",
    choiceTask: (guide) => `Dodanie kierunku w ${guide.universityName} do wyborów UCAS`,
  },
  {
    country: "Holandia",
    system: "Studielink",
    slugs: dutchProgrammeRecords.map((guide) => guide.slug),
    accountTask: "Założenie konta w Studielink i potwierdzenie danych osobowych oraz wcześniejszej edukacji",
    choiceTask: (guide) => `Rejestracja w Studielink na ${guide.programName} w ${guide.universityName}`,
  },
  {
    country: "Irlandia",
    system: "CAO",
    slugs: irishGuideSlugs,
    accountTask: "Założenie aplikacji CAO i przesłanie dokumentów wymaganych dla kwalifikacji zagranicznej",
    choiceTask: (guide) => `Dodanie kierunku w ${guide.universityName} do listy preferencji CAO`,
  },
  {
    country: "Szwecja",
    system: "UniversityAdmissions.se",
    slugs: swedishGuideSlugs,
    accountTask: "Założenie konta w UniversityAdmissions.se i przesłanie dokumentów kwalifikacyjnych",
    choiceTask: (guide) => `Dodanie programu ${guide.universityName} i ustawienie jego właściwej kolejności`,
  },
  {
    country: "Dania",
    system: "Optagelse.dk",
    slugs: danishGuideSlugs,
    accountTask: "Utworzenie aplikacji w Optagelse.dk oraz podpisanie strony potwierdzającej",
    choiceTask: (guide) => `Dodanie programu ${guide.universityName} do aplikacji w Optagelse.dk`,
  },
  {
    country: "Finlandia",
    system: "Studyinfo.fi",
    slugs: finnishGuideSlugs,
    accountTask: "Utworzenie aplikacji w Studyinfo.fi i uporządkowanie wyborów w joint application",
    choiceTask: (guide) => `Dodanie programu ${guide.universityName} do aplikacji Studyinfo.fi`,
  },
  {
    country: "Kanada",
    system: "OUAC",
    slugs: ouacSlugs,
    accountTask: "Założenie aplikacji w OUAC i uzupełnienie historii edukacji",
    choiceTask: (guide) => `Dodanie programu ${guide.universityName} do aplikacji OUAC`,
  },
  {
    country: "USA",
    system: "Common Application",
    slugs: commonAppSlugs,
    accountTask: "Uzupełnienie profilu Common Application, aktywności, edukacji i sekcji rekomendacji",
    choiceTask: (guide) => `Dodanie ${guide.universityName} do My Colleges i uzupełnienie pytań uczelni`,
  },
  {
    country: "USA",
    system: "UC Application",
    slugs: ucApplicationSlugs,
    accountTask: "Uzupełnienie wspólnej UC Application, historii ocen, aktywności i czterech PIQ",
    choiceTask: (guide) => `Dodanie kampusu ${guide.universityName} i właściwego major do UC Application`,
  },
  {
    country: "ZEA",
    system: "Common Application",
    slugs: ["nyu-abu-dhabi"],
    accountTask: "Uzupełnienie Common Application, STARS, danych edukacyjnych, aktywności i sekcji rekomendacji dla NYU Abu Dhabi",
    choiceTask: () => "Wybór Abu Dhabi jako primary campus of interest i wysłanie NYU Supplement w Common Application",
  },
];

const centralPortalRows = [];
for (const country of unique(centralPortalGroups.map((group) => group.country))) {
  const countryGroups = centralPortalGroups.filter((group) => group.country === country);
  const countrySlugs = unique(countryGroups.flatMap((group) => group.slugs));
  centralPortalRows.push(materialCountryRow(country, countrySlugs));
  for (const group of countryGroups) {
    const anchor = guideBySlug.get(group.slugs[0]);
    centralPortalRows.push(materialItemRow(anchor, group.accountTask, {
      university: `${group.system} - wspólny etap aplikacji`,
      appliesToGuideSlugs: group.slugs,
    }));
    for (const slug of group.slugs) {
      const guide = guideBySlug.get(slug);
      centralPortalRows.push(materialUniversityRow(guide));
      centralPortalRows.push(materialItemRow(guide, group.choiceTask(guide)));
    }
  }
}

const originalPortalTasks = {
  "iba-erasmus-university-rotterdam": [
    "Odbior danych do EUR Admissions Portal i linku do OLAF po rejestracji w Studielink",
    "Oplata application fee EUR 100 w EUR Admissions Portal",
    "Wgranie wymaganych dokumentow i wyslanie kompletnej aplikacji w OLAF do 31 stycznia",
    "Sprawdzenie rank number po publikacji wynikow selection procedure",
  ],
  "business-administration-university-of-amsterdam": [
    "Odbior UvAnetID po rejestracji w Studielink",
    "Sprawdzenie personal enrolment checklist w SIS",
    "Zlozenie kompletnej aplikacji w SIS My Applications przed deadlinem",
  ],
  "business-analytics-university-of-amsterdam": [
    "Odbior UvAnetID po rejestracji w Studielink",
    "Sprawdzenie personal enrolment checklist w SIS",
    "Zlozenie kompletnej aplikacji w SIS My Applications przed deadlinem",
  ],
  "international-business-administration-tilburg-university": [
    "Odbior danych do kont Tilburg University i OSIRIS po rejestracji w Studielink",
    "Zlozenie kompletnej aplikacji w OSIRIS Aanmeld",
    "Sprawdzenie statusu aplikacji w OSIRIS Aanmeld",
  ],
};

const centralOnlyPortalSlugs = new Set([
  ...irishGuideSlugs,
  ...swedishGuideSlugs,
  ...danishGuideSlugs,
  ...finnishGuideSlugs,
]);
const postSubmissionPortalSlugs = new Set([
  ...ukGuideSlugs,
  ...ouacSlugs,
  ...commonAppSlugs,
  ...ucApplicationSlugs,
  "nyu-abu-dhabi",
]);
const submissionSystemByGuideSlug = new Map(
  centralPortalGroups.flatMap((group) => group.slugs.map((slug) => [slug, group.system])),
);

const portalGuideRecords = guideRecords.filter((guide) => !centralOnlyPortalSlugs.has(guide.slug));
const portalRows = groupRowsByCountry(portalGuideRecords, (guide) => {
  const exactTasks = originalPortalTasks[guide.slug];
  if (exactTasks) {
    return [
      materialUniversityRow(guide),
      ...exactTasks.map((task) => materialItemRow(guide, task)),
    ];
  }

  const portal = guide.portal || portalNames[guide.slug];
  if (!portal) {
    throw new Error(`Missing verified portal name for ${guide.slug}`);
  }

  if (postSubmissionPortalSlugs.has(guide.slug)) {
    const submissionSystem = submissionSystemByGuideSlug.get(guide.slug);
    if (guide.slug === "nyu-abu-dhabi") {
      return [
        materialUniversityRow(guide),
        materialItemRow(guide, "Aktywacja NYU Applicant Portal po wysłaniu Common Application"),
        materialItemRow(guide, "Uzupełnienie i wysłanie Self-reported Transcript and Academic Record System (STARS)"),
        materialItemRow(guide, "Kontrola kompletności dokumentów i statusu aplikacji w NYU Applicant Portal"),
      ];
    }
    return [
      materialUniversityRow(guide),
      materialItemRow(
        guide,
        `Aktywacja konta w ${portal} po przekazaniu aplikacji przez ${submissionSystem}`,
      ),
      materialItemRow(
        guide,
        `Kontrola checklisty, brakujących dokumentów i decyzji w ${portal}`,
      ),
    ];
  }

  const programSuffix = guide.programName ? ` dla programu ${guide.programName}` : "";
  return [
    materialUniversityRow(guide),
    materialItemRow(guide, `Założenie lub aktywacja konta w ${portal}${programSuffix}`),
    materialItemRow(guide, `Przesłanie wymaganych dokumentów i formalne wysłanie aplikacji w ${portal}${programSuffix}`),
    materialItemRow(guide, `Kontrola checklisty i statusu aplikacji w ${portal}${programSuffix}`),
  ];
});

const essayGroups = [];
const sharedEssayGroups = [];

function addEssayGroup(slug, essays, options = {}) {
  const guide = guideBySlug.get(slug);
  if (!guide) throw new Error(`Unknown essay guide slug: ${slug}`);
  essayGroups.push({ guide, essays, label: options.label || guide.title });
}

function addSharedEssayGroup(country, label, slugs, essays) {
  const unknownSlug = slugs.find((slug) => !guideBySlug.has(slug));
  if (unknownSlug) throw new Error(`Unknown shared essay guide slug: ${unknownSlug}`);
  sharedEssayGroups.push({ country, label, slugs: unique(slugs), essays });
}

addSharedEssayGroup("Wielka Brytania", "UCAS Personal Statement - wspólny dla wyborów UCAS", ukGuideSlugs, [
  {
    title: "UCAS Personal Statement - pytanie 1: wybór kierunku",
    prompt: "Wyjaśnij, dlaczego chcesz studiować wybrany kierunek lub obszar. Pokaż wiedzę o przedmiocie, motywację i związek z dalszymi planami. Odpowiedź musi mieć co najmniej 350 znaków; trzy odpowiedzi łącznie mogą mieć maksymalnie 4000 znaków ze spacjami.",
  },
  {
    title: "UCAS Personal Statement - pytanie 2: przygotowanie akademickie",
    prompt: "Pokaż, jak przedmioty szkolne, kwalifikacje i dotychczasowa nauka przygotowały Cię do wybranego kierunku. Użyj konkretnych przykładów wiedzy i umiejętności. Odpowiedź musi mieć co najmniej 350 znaków; trzy odpowiedzi łącznie mogą mieć maksymalnie 4000 znaków ze spacjami.",
  },
  {
    title: "UCAS Personal Statement - pytanie 3: doświadczenia poza edukacją",
    prompt: "Opisz istotne doświadczenia spoza formalnej edukacji i wyjaśnij, dlaczego są przydatne na wybranym kierunku. Selekcjonuj przykłady zamiast tworzyć listę aktywności. Odpowiedź musi mieć co najmniej 350 znaków; trzy odpowiedzi łącznie mogą mieć maksymalnie 4000 znaków ze spacjami.",
  },
]);

addSharedEssayGroup(
  "USA",
  "Common Application - wspólny esej osobisty",
  commonAppSlugs.filter((slug) => slug !== "northwestern-university"),
  [{
    title: "Common App personal essay",
    prompt: "Napisz osobisty esej na jeden z aktualnych tematów Common Application. Tekst ma pokazać doświadczenie, sposób myślenia i własny głos; nie powinien powtarzać listy aktywności. Maksymalnie 650 słów.",
  }],
);

addSharedEssayGroup("USA", "University of California - wspólne PIQ", ucApplicationSlugs, [1, 2, 3, 4].map((index) => ({
  title: `UC Personal Insight Question ${index}`,
  prompt: `Wybierz jeden z ośmiu aktualnych tematów UC i przygotuj odrębną odpowiedź numer ${index}. Każda odpowiedź może mieć maksymalnie 350 słów; nie powtarzaj historii użytych w pozostałych PIQ.`,
})));

addEssayGroup("northwestern-university", [{
  title: "Common App personal essay - opcjonalny dla Northwestern",
  prompt: "Northwestern nie wymaga Common App personal essay. Dodaj go tylko wtedy, gdy wnosi ważny kontekst nieobecny w pozostałej części aplikacji. Maksymalnie 650 słów.",
  alternativeOptions: ["Pomijam opcjonalny Common App personal essay"],
}]);

addEssayGroup("iba-erasmus-university-rotterdam", [
  { title: "Essay 1 - Why business administration and why IBA at RSM", prompt: "Wyjaśnij zainteresowanie business administration oraz dopasowanie do programu IBA w Rotterdam School of Management." },
  { title: "Essay 2 - International environment", prompt: "Pokaż doświadczenie w środowisku międzynarodowym i sposób współpracy z osobami o różnych perspektywach." },
  { title: "Essay 3 - Sustainable Development Goal", prompt: "Wybierz cel zrównoważonego rozwoju i uzasadnij, dlaczego jest dla Ciebie istotny oraz jak chcesz się w niego zaangażować." },
]);

addEssayGroup("international-bachelor-communication-and-media-erasmus-university-rotterdam", [{
  title: "IBCoM motivation letter",
  prompt: "Wypełnij oficjalny szablon listu motywacyjnego IBCoM. Pokaż zainteresowanie komunikacją i mediami, gotowość do pracy w international classroom oraz konkretne doświadczenia potwierdzające międzynarodową orientację. Zapisz dokument jako PDF; maksymalnie dwie strony.",
}]);

addEssayGroup("mit", [
  { title: "MIT short essay - academic field", prompt: "Wskaż dziedzinę, która obecnie interesuje Cię najbardziej, i wyjaśnij, dlaczego chcesz rozwijać ją właśnie w MIT. Odpowiedź około 100-200 słów." },
  { title: "MIT short essay - activity for pleasure", prompt: "Opisz aktywność wykonywaną po prostu dla przyjemności, poza obowiązkami i osiągnięciami. Odpowiedź około 100-200 słów." },
  { title: "MIT short essay - unexpected educational path", prompt: "Opisz sytuację, w której Twoja droga edukacyjna odbiegła od oczekiwań lub utartego schematu. Odpowiedź około 100-200 słów." },
  { title: "MIT short essay - collaboration and community", prompt: "Pokaż konkretny przykład współpracy, wzajemnego uczenia się albo wspólnego wkładu w społeczność. Odpowiedź około 100-200 słów." },
  { title: "MIT short essay - unexpected challenge", prompt: "Opisz nieoczekiwane wyzwanie, sposób działania i najważniejszy wniosek z tego doświadczenia. Odpowiedź około 100-200 słów." },
]);

addEssayGroup("harvard-university", [
  { title: "Harvard short answer - life experience and contribution", prompt: "Wyjaśnij, jak doświadczenia życiowe ukształtowały perspektywę, którą wniesiesz do społeczności Harvardu. Maksymalnie 150 słów." },
  { title: "Harvard short answer - disagreement", prompt: "Opisz istotną różnicę zdań, sposób prowadzenia rozmowy i to, czego się nauczyłeś. Maksymalnie 150 słów." },
  { title: "Harvard short answer - activities and responsibilities", prompt: "Przedstaw aktywność, pracę, podróż lub obowiązek rodzinny, który znacząco Cię ukształtował. Maksymalnie 150 słów." },
  { title: "Harvard short answer - future use of education", prompt: "Wyjaśnij, jak zamierzasz wykorzystać edukację zdobytą na Harvardzie. Maksymalnie 150 słów." },
  { title: "Harvard short answer - three roommate facts", prompt: "Wybierz trzy rzeczy, które przyszli współlokatorzy powinni o Tobie wiedzieć. Maksymalnie 150 słów." },
]);

addEssayGroup("stanford-university", [
  { title: "Stanford essay - intellectual curiosity", prompt: "Opisz ideę lub doświadczenie, które wywołuje autentyczną ekscytację uczeniem się. 100-250 słów." },
  { title: "Stanford essay - note to future roommate", prompt: "Napisz notatkę do przyszłego współlokatora, która pozwoli lepiej Cię poznać. 100-250 słów." },
  { title: "Stanford essay - distinctive contribution", prompt: "Pokaż, które doświadczenia, zainteresowania i cechy pozwolą Ci wnieść odrębny wkład w Stanford. 100-250 słów." },
  { title: "Stanford short questions", prompt: "Przygotuj krótkie, konkretne odpowiedzi do aktualnego zestawu pytań Stanfordu; każda odpowiedź ma limit 50 słów." },
]);

addEssayGroup("columbia-university", [
  { title: "Columbia list - intellectual resources", prompt: "Przygotuj zwięzłą listę książek, publikacji, mediów i innych źródeł, które rozwijały Twoją ciekawość poza zajęciami." },
  { title: "Columbia short answer - lived experience", prompt: "Pokaż doświadczenie lub perspektywę, którą wniesiesz do wielogłosowej społeczności Columbii." },
  { title: "Columbia short answer - disagreement", prompt: "Opisz rozmowę z osobą o innym stanowisku i sposób, w jaki wpłynęła na Twoje myślenie." },
  { title: "Columbia short answer - adversity", prompt: "Opisz nieprzewidziane wyzwanie, sposób reakcji i zmianę, która z niego wynikła." },
  { title: "Columbia short answer - why Columbia", prompt: "Uzasadnij zainteresowanie Columbią, odwołując się do konkretnych elementów programu i społeczności." },
  { title: "Columbia short answer - academic interest", prompt: "Wyjaśnij zainteresowanie wybranym obszarem studiów w Columbia College lub Columbia Engineering." },
]);

addEssayGroup("nyu", [{
  title: "NYU optional essay - bridge builder",
  prompt: "Pokaż doświadczenie łączenia osób, grup albo idei mimo różnic oraz wnioski dotyczące współpracy. Maksymalnie 250 słów.",
}]);

addEssayGroup("yale-university", [
  { title: "Yale academic interest response", prompt: "Wskaż interesujące Cię obszary akademickie i opisz ideę z nimi związaną, która szczególnie Cię angażuje. Maksymalnie 200 słów." },
  { title: "Yale short takes", prompt: "Przygotuj trzy odpowiedzi do aktualnych short takes: pomysł na kurs lub dzieło, obszar rozwoju oraz ważny fakt nieobecny w reszcie aplikacji. Każda do 200 znaków." },
  { title: "Yale essay - selected prompt", prompt: "Wybierz jeden aktualny temat Yale dotyczący rozmowy z odmiennym poglądem, ważnej społeczności albo osobistego doświadczenia. Maksymalnie 400 słów." },
]);

addEssayGroup("university-of-pennsylvania", [
  { title: "Penn short answer - thank-you note", prompt: "Napisz notatkę z podziękowaniem do osoby, której wcześniej nie podziękowałeś w pełni. 150-200 słów." },
  { title: "Penn short answer - community", prompt: "Pokaż, jak poznasz społeczność Penn i jak Twoje doświadczenia wpłyną na wzajemne relacje. 150-200 słów." },
  { title: "Penn school-specific essay", prompt: "Odpowiedz na aktualny temat szkoły lub programu Penn, do którego aplikujesz, wskazując konkretne zainteresowania akademickie i zasoby." },
]);

addEssayGroup("dartmouth-college", [
  { title: "Dartmouth essay - why Dartmouth", prompt: "Wyjaśnij, które elementy programu, społeczności lub kampusu sprawiają, że Dartmouth jest właściwym wyborem. Maksymalnie 100 słów." },
  { title: "Dartmouth essay - personal context", prompt: "Wybierz jeden z dwóch tematów dotyczących środowiska dorastania albo przedstawienia siebie. Maksymalnie 250 słów." },
  { title: "Dartmouth essay - selected prompt", prompt: "Wybierz jeden z aktualnych tematów Dartmouth dotyczących pasji, wpływu albo lektury, która zmieniła perspektywę. Maksymalnie 250 słów." },
]);

addEssayGroup("princeton-university", [
  { title: "Princeton academic essay - AB or BSE", prompt: "Odpowiedz na wariant właściwy dla A.B./undecided albo B.S.E., łącząc zainteresowania z konkretną ofertą Princeton. Maksymalnie 250 słów." },
  { title: "Princeton essay - lived experience", prompt: "Pokaż, jak doświadczenia życiowe ukształtowały perspektywę i rozmowy, które wniesiesz do kampusu. Maksymalnie 500 słów." },
  { title: "Princeton essay - service and civic engagement", prompt: "Wyjaśnij, jak Twoja historia łączy się ze służbą, odpowiedzialnością społeczną lub zaangażowaniem obywatelskim. Maksymalnie 250 słów." },
  { title: "Princeton short responses", prompt: "Przygotuj trzy odpowiedzi do pytań o nową umiejętność, źródło radości i piosenkę opisującą obecny moment. Każda do 50 słów." },
  {
    title: "Princeton graded written paper",
    actionType: "file_required",
    suggestedFilename: "princeton-graded-written-paper.pdf",
    prompt: "Prześlij ocenioną pracę pisemną z przedmiotu akademickiego, najlepiej English, social studies lub history, wraz z komentarzem i oceną nauczyciela.",
  },
]);

addEssayGroup("caltech", [
  { title: "Caltech essay - STEM academic interest", prompt: "Wskaż jeden lub dwa obszary STEM i uzasadnij wybór. 100-200 słów." },
  { title: "Caltech essay - STEM curiosity", prompt: "Opisz konkretny temat STEM, w który ostatnio szczególnie się zagłębiłeś. 50-150 słów." },
  { title: "Caltech essay - STEM experience", prompt: "Wybierz wariant o rozwoju zainteresowania STEM albo znaczącym doświadczeniu, które pobudziło ciekawość. 100-200 słów." },
  { title: "Caltech essay - creativity in action", prompt: "Pokaż konkretny przykład tworzenia, wynalazczości lub innowacji w swoim życiu. 100-200 słów." },
  { title: "Caltech short answers - choose two", prompt: "Wybierz dwa z czterech aktualnych tematów o hobby, własnym kursie, tożsamości lub idei, która zmieniła sposób myślenia; łącznie do 250 słów." },
]);

addEssayGroup("carnegie-mellon-university", [
  { title: "CMU short answer - choice of study", prompt: "Wyjaśnij, jaka pasja lub inspiracja doprowadziła do wyboru obszaru studiów. Maksymalnie 300 słów." },
  { title: "CMU short answer - successful college experience", prompt: "Zdefiniuj udane doświadczenie studiów i rolę uczenia się w osiąganiu Twoich celów. Maksymalnie 300 słów." },
  { title: "CMU short answer - application emphasis", prompt: "Wskaż najważniejszy element, który komisja powinna dostrzec w całej aplikacji. Maksymalnie 300 słów." },
]);

addEssayGroup("georgia-tech", [{
  title: "Georgia Tech essay - chosen major and institution",
  prompt: "Wyjaśnij, dlaczego chcesz studiować wybrany major i dlaczego właśnie w Georgia Tech. Maksymalnie 300 słów.",
}]);

addEssayGroup("johns-hopkins-university", [{
  title: "Johns Hopkins supplemental essay - an important first",
  prompt: "Opisz ważny pierwszy krok lub pierwsze doświadczenie, które Cię ukształtowało. Maksymalnie 350 słów.",
}]);

addEssayGroup("northwestern-university", [
  { title: "Northwestern required short answer", prompt: "Odpowiedz na aktualny obowiązkowy temat o doświadczeniach, perspektywie i sposobie angażowania się w społeczność Northwestern." },
  { title: "Northwestern optional short answers", prompt: "Wybierz maksymalnie dwa aktualne opcjonalne pytania, jeśli wnoszą informacje nieobecne w pozostałej części aplikacji." },
]);

addEssayGroup("ubc-vancouver", [
  { title: "UBC Personal Profile - who you are", prompt: "Pokaż, jak opisaliby Cię bliscy lub społeczność, oraz z czego jesteś szczególnie dumny." },
  { title: "UBC Personal Profile - what matters", prompt: "Wyjaśnij, co jest dla Ciebie ważne i dlaczego." },
  { title: "UBC Personal Profile - key activities", prompt: "Rozwiń jedną lub dwie najważniejsze aktywności, swoją rolę i wnioski z doświadczenia." },
  { title: "UBC Personal Profile - academic context", prompt: "Dodaj istotny kontekst historii edukacji, decyzji przedmiotowych albo przygotowania do wybranego obszaru studiów." },
]);

addEssayGroup("university-of-toronto", [
  { title: "U of T supplemental profile - programme-specific", prompt: "Przygotuj odpowiedzi wymagane przez wybrany program: Engineering, Architecture, Rotman Commerce, Computer Science, Kinesiology, Music lub właściwy program Scarborough." },
]);

addEssayGroup("mcgill-university", [
  { title: "McGill Population and Global Health - three essays", prompt: "Przygotuj trzy odpowiedzi wymagane w formularzu B.A. Population and Global Health oraz listę aktywności pozaszkolnych." },
  { title: "McGill Global Engineering - personal statement", prompt: "Wyjaśnij motywację, cele i przygotowanie do Bachelor of Global Engineering. Tekst po angielsku, maksymalnie dwie strony, single-spaced." },
]);

addEssayGroup("university-of-waterloo", [
  { title: "Waterloo Admission Information Form", prompt: "Uzupełnij AIF wymagany m.in. dla Engineering, Mathematics i innych wskazanych programów; opisz zainteresowania, aktywności i przygotowanie." },
  { title: "Waterloo Software Engineering additional response", prompt: "Jeśli aplikujesz na Software Engineering, przygotuj dodatkową obowiązkową odpowiedź widoczną w AIF." },
]);

addEssayGroup("york-university", [
  { title: "York programme-specific supplementary application", prompt: "Przygotuj profil przywództwa i odpowiedzi wymagane przez Schulich albo materiały właściwe dla programu artystycznego, edukacji lub social work." },
]);

addEssayGroup("nyu-abu-dhabi", [
  { title: "Common App personal essay", prompt: "Napisz osobisty esej na jeden z aktualnych tematów Common Application, uzupełniający pozostałe części aplikacji." },
  { title: "NYU optional essay - bridge builder", prompt: "Pokaż doświadczenie łączenia osób, grup albo idei mimo różnic oraz wnioski dotyczące współpracy. Maksymalnie 250 słów." },
]);

addEssayGroup("sciences-po", [
  {
    title: "Sciences Po written piece - personal journey and worldview",
    prompt: "Wyjaśnij, jak Twoja droga życiowa ukształtowała sposób patrzenia na świat i jak ta perspektywa łączy się z misją edukacyjną Sciences Po. 1500-2000 znaków ze spacjami.",
  },
  {
    title: "Sciences Po written piece - formative work of literature",
    prompt: "Wybierz dzieło literackie, które wpłynęło na Twój rozwój intelektualny, i przeanalizuj ten wpływ. 1500-2000 znaków ze spacjami.",
  },
  {
    title: "Sciences Po written piece - campus choices",
    prompt: "Wskaż dwa programy lub kampusy Sciences Po, które najbardziej Cię interesują, i uzasadnij każdy wybór. 1500-2000 znaków ze spacjami.",
  },
]);

addEssayGroup("hec-paris", [{
  title: "HEC-Bocconi Bachelor motivation letter",
  prompt: "Przedstaw motywację oraz akademickie, kulturalne i osobiste zainteresowanie programem Data, Society and Organisations. Połącz przygotowanie ilościowe z zainteresowaniem problemami społecznymi i organizacyjnymi.",
}]);

addEssayGroup("ecole-polytechnique", [{
  title: "École Polytechnique Bachelor personal statement",
  prompt: "Wyjaśnij wybór Bachelor of Science, przygotowanie matematyczno-naukowe, zainteresowanie wybranym double major oraz cele akademickie. Tekst musi odpowiadać aktualnym instrukcjom formularza École Polytechnique.",
}]);

for (const entry of [
  ["ie-university", "IE University application essays", "Przygotuj odpowiedzi z formularza IE dotyczące motywacji, doświadczeń, celów i dopasowania do wybranego bachelor programme."],
  ["esade-business-and-law-school", "ESADE motivation responses", "Przygotuj odpowiedzi motywacyjne wymagane w aplikacji ESADE dla wybranego programu."],
  ["national-university-of-singapore", "NUS mandatory short responses", "Przygotuj pięć obowiązkowych krótkich odpowiedzi będących samooceną zainteresowań i dopasowania do wybranego programu. Uzupełnij także sekcję osiągnięć i aktywności w zakresie wskazanym w formularzu NUS; każdą odpowiedź napisz samodzielnie, zwięźle i po angielsku."],
  ["nanyang-technological-university", "NTU aptitude-based admissions essay", "Jeśli korzystasz z Aptitude-Based Admissions, opisz najważniejsze osiągnięcie, doświadczenie lub talent i poprzyj je konkretnymi dowodami."],
  ["smu", "SMU short responses", "Przygotuj aktualne krótkie odpowiedzi aplikacyjne SMU dotyczące doświadczeń, motywacji i wkładu w społeczność."],
  ["university-of-tokyo", "PEAK application essays", "Przygotuj eseje PEAK dotyczące zainteresowań akademickich, motywacji do wybranego programu i dotychczasowych doświadczeń."],
  ["kyoto-university", "Kyoto iUP essays", "Przygotuj wymagane eseje Kyoto iUP dotyczące motywacji, zainteresowań akademickich i planu rozwoju językowego."],
  ["waseda-university", "Waseda statement of purpose", "Napisz statement of purpose właściwy dla anglojęzycznego undergraduate programme i szkoły Waseda."],
  ["hku", "HKU personal statement", "Napisz personal statement odnoszący doświadczenia i cele do wybranych programów HKU."],
  ["hkust", "HKUST personal statement", "Przygotuj personal statement wyjaśniający zainteresowania akademickie, przygotowanie i wybór programu HKUST."],
  ["chinese-university-of-hong-kong", "CUHK personal statement", "Przygotuj personal statement dla wybranego programu CUHK, uwzględniając motywację i przygotowanie akademickie."],
]) {
  addEssayGroup(entry[0], [{ title: entry[1], prompt: entry[2] }]);
}

addEssayGroup("peking-university", [{
  title: "Peking University personal statement",
  prompt: "Przygotuj personal statement zgodny z formularzem PKU dla kandydatów międzynarodowych. Pokaż przygotowanie akademickie, motywację, potencjał rozwoju, odpowiedzialność społeczną i perspektywę międzynarodową.",
}]);

addEssayGroup("tsinghua-university", [{
  title: "Tsinghua University personal statement and study plan",
  prompt: "Opisz plan studiów w Tsinghua, powody wyboru uczelni i obszaru, dalszy rozwój zawodowy oraz cele. Odpowiedź może być po angielsku lub chińsku zgodnie z instrukcją formularza.",
}]);

addEssayGroup("fudan-university", [{
  title: "Fudan University personal statement",
  prompt: "Przedstaw przygotowanie akademickie, motywację do wybranego anglojęzycznego programu oraz cele. Dla programu International Undergraduate 2026 tekst musi mieścić się w limicie 5000 znaków angielskich.",
}]);

addEssayGroup("zhejiang-university", [{
  title: "Zhejiang University personal statement",
  prompt: "Przedstaw dotychczasową edukację, zainteresowanie wybranym programem ZJU, przygotowanie i plan studiów. Zastosuj limit oraz język wskazane w aktualnym formularzu konkretnego programu.",
}]);

addEssayGroup("seoul-national-university", [{
  title: "SNU personal statement and study plan",
  prompt: "Opisz motywację do wybranego kierunku, przygotowanie i osiągnięcia akademickie, cele na czas studiów oraz plan nauki w Seoul National University. Maksymalnie 4000 bajtów, po angielsku lub koreańsku.",
}]);

addEssayGroup("kaist", [
  {
    title: "KAIST essay 1 - distinctive STEM question",
    prompt: "Sformułuj wyróżniające Cię pytanie z obszaru STEM w limicie 300 bajtów, a następnie wyjaśnij, co skłoniło Cię do jego postawienia, w limicie 1600 bajtów.",
  },
  {
    title: "KAIST essay 2 - meaningful activities",
    prompt: "Opisz do trzech ważnych aktywności szkolnych lub pozaszkolnych oraz najważniejsze wnioski. Maksymalnie 1500 znaków.",
  },
  {
    title: "KAIST essay 3 - thinking differently",
    prompt: "Opisz sytuację, w której myślałeś lub działałeś inaczej niż inni, oraz wpływ tego podejścia na Ciebie i otoczenie. Maksymalnie 1500 znaków.",
  },
]);

for (const [slug, title, prompt] of [
  ["yonsei-university", "Yonsei University personal statement", "Wypełnij aktualny formularz personal statement dla kandydatów międzynarodowych, odnosząc doświadczenia, motywację i cele do wybranego college lub programu Yonsei."],
  ["sungkyunkwan-university-skku", "SKKU personal statement and study plan", "Przedstaw motywację, przygotowanie akademickie i plan studiów właściwy dla wybranego anglojęzycznego programu SKKU."],
  ["hanyang-university", "Hanyang University personal statement and study plan", "Przygotuj odpowiedzi wymagane w formularzu dla kandydatów międzynarodowych, uwzględniając motywację, przygotowanie i plan studiów."],
  ["inha-university", "Inha University personal statement and study plan", "Przygotuj personal statement i plan studiów zgodnie z aktualnym formularzem dla wybranego anglojęzycznego programu Inha."],
  ["osaka-university", "Osaka University programme statement", "Przygotuj statement of purpose lub eseje wymagane przez wybrany anglojęzyczny undergraduate programme Osaka University."],
  ["temple-university-japan", "Temple University Japan application essay", "Przygotuj esej osobisty wymagany w aplikacji first-year Temple University, odnosząc doświadczenia i cele do planowanych studiów."],
  ["khalifa-university", "Khalifa University personal statement", "Przedstaw zainteresowania akademickie, przygotowanie STEM i motywację do wybranego programu Khalifa University zgodnie z aktualnym formularzem."],
  ["american-university-of-sharjah", "AUS personal statement", "Przygotuj personal statement wymagany dla wybranego programu American University of Sharjah, odnosząc przygotowanie i cele do programu."],
]) {
  addEssayGroup(slug, [{ title, prompt }]);
}

for (const slug of [
  "liberal-arts-and-sciences-global-challenges-leiden-university",
  "liberal-arts-and-sciences-amsterdam-university-college-university-of-amsterdam",
  "politics-psychology-law-and-economics-pple-university-of-amsterdam",
  "philosophy-politics-and-economics-utrecht-university",
  "university-college-roosevelt-utrecht-university",
  "university-college-utrecht-utrecht-university",
  "global-responsibility-and-leadership-university-of-groningen",
  "liberal-arts-and-sciences-university-of-groningen",
  "dual-degree-in-arts-and-sciences-erasmus-university-rotterdam",
  "liberal-arts-and-sciences-erasmus-university-rotterdam",
  "university-college-tilburg-liberal-arts-and-sciences-tilburg-university",
  "maastricht-science-programme-maastricht-university",
  "university-college-maastricht-maastricht-university",
  "university-college-venlo-maastricht-university",
  "law-in-society-vrije-universiteit-amsterdam",
  "philosophy-politics-and-economics-vrije-universiteit-amsterdam",
]) {
  if (guideBySlug.has(slug)) {
    const guide = guideBySlug.get(slug);
    addEssayGroup(slug, [{
      title: `${guide.programName} - formularz motywacyjny i selekcyjny`,
      prompt: `Wypełnij aktualny formularz selekcyjny programu ${guide.programName}. Uzasadnij wybór konkretnego curriculum, pokaż przygotowanie akademickie i doświadczenia istotne dla profilu programu; zachowaj podział i limity widoczne w formularzu uczelni.`,
    }]);
  }
}

function appendEssayRows(rows, anchorGuide, label, slugs, essays, keyPrefix) {
  rows.push(materialUniversityRow(anchorGuide, slugs, label));
  for (const essay of essays) {
    const actionType = essay.actionType || "file_or_doc";
    const key = `${keyPrefix}-${slugify(essay.title)}`;
    rows.push(materialItemRow(anchorGuide, essay.title, {
      actionType,
      appliesToGuideSlugs: slugs,
      university: label,
      suggestedFilename: essay.suggestedFilename || `${key}.${actionType === "file_required" ? "pdf" : "docx"}`,
      ...(actionType === "file_or_doc"
        ? { docTabTitle: essay.title, docTabPrompt: essay.prompt }
        : {}),
      alternativeOptions: essay.alternativeOptions,
    }));
  }
}

const essayRows = [];
const essayCountries = unique([
  ...sharedEssayGroups.map((group) => group.country),
  ...essayGroups.map((group) => group.guide.country),
]);
for (const country of essayCountries) {
  const sharedGroups = sharedEssayGroups.filter((group) => group.country === country);
  const individualGroups = essayGroups.filter((group) => group.guide.country === country);
  essayRows.push(materialCountryRow(country, [
    ...sharedGroups.flatMap((group) => group.slugs),
    ...individualGroups.map((group) => group.guide.slug),
  ]));
  for (const group of sharedGroups) {
    appendEssayRows(
      essayRows,
      guideBySlug.get(group.slugs[0]),
      group.label,
      group.slugs,
      group.essays,
      slugify(group.label),
    );
  }
  for (const group of individualGroups) {
    appendEssayRows(
      essayRows,
      group.guide,
      group.label,
      [group.guide.slug],
      group.essays,
      group.guide.slug,
    );
  }
}

const assessmentEntries = [];

function addAssessment(slug, task, alternativeOptions) {
  const guide = guideBySlug.get(slug);
  if (!guide) throw new Error(`Unknown assessment guide slug: ${slug}`);
  assessmentEntries.push({ guide, task, alternativeOptions });
}

for (const [slug, task, alternativeOptions] of [
  ["university-of-oxford", "Rejestracja i udział w teście wymaganym przez wybrany kierunek Oxford: ESAT, TMUA, TARA, LNAT albo UCAT", ["Nie dotyczy - wybrany kierunek Oxford nie wymaga testu"]],
  ["university-of-oxford", "Przygotowanie do rozmów kwalifikacyjnych Oxford po otrzymaniu zaproszenia", ["Nie dotyczy - brak zaproszenia do rozmowy"]],
  ["university-of-cambridge", "Rejestracja i udział w pre-interview assessment właściwym dla kierunku Cambridge", ["Nie dotyczy - wybrany kierunek Cambridge nie wymaga testu"]],
  ["university-of-cambridge", "Przygotowanie do rozmów kwalifikacyjnych Cambridge po otrzymaniu zaproszenia", ["Nie dotyczy - brak zaproszenia do rozmowy"]],
  ["imperial-college-london", "Rejestracja i udział w ESAT, TMUA albo UCAT, jeśli wymaga go wybrany kierunek Imperial", ["Nie dotyczy - wybrany kierunek Imperial nie wymaga testu"]],
  ["imperial-college-london", "Udział w rozmowie lub dodatkowym etapie selekcji, jeśli wymaga go wybrany kierunek Imperial", ["Nie dotyczy - wybrany kierunek nie prowadzi tego etapu"]],
  ["london-school-of-economics", "Udział w TMUA, jeśli jest wymagany lub rekomendowany dla wybranego kierunku LSE", ["Nie dotyczy - wybrany kierunek LSE nie wymaga ani nie rekomenduje TMUA"]],
  ["ucl", "Udział w teście wymaganym przez wybrany kierunek UCL, w tym TARA, LNAT lub UCAT", ["Nie dotyczy - wybrany kierunek UCL nie wymaga testu"]],
  ["sciences-po", "Rozmowa rekrutacyjna Sciences Po po zakwalifikowaniu na podstawie dokumentów i prac pisemnych", ["Nie dotyczy - brak zaproszenia do rozmowy"]],
  ["hec-paris", "Przesłanie wyniku SAT, ACT albo Bocconi online test dla Bachelor HEC-Bocconi"],
  ["hec-paris", "Ukończenie online video interview dla Bachelor HEC-Bocconi"],
  ["ecole-polytechnique", "Rozmowa rekrutacyjna École Polytechnique Bachelor po zakwalifikowaniu na podstawie dokumentów", ["Nie dotyczy - brak zaproszenia do rozmowy"]],
  ["ie-university", "Ukończenie IE Admissions Test albo przesłanie akceptowanego wyniku SAT/ACT/LNAT zależnie od programu"],
  ["esade-business-and-law-school", "Ukończenie ESADE Admissions Test albo przesłanie akceptowanego wyniku SAT/ACT"],
  ["bocconi-university", "Przesłanie wyniku Bocconi online test, SAT albo ACT zgodnie z wybraną rundą"],
  ["politecnico-di-torino", "Rejestracja i udział w teście TIL właściwym dla wybranego programu"],
  ["wirtschaftsuniversitat-wien", "Ukończenie Online Self-Assessment i udział w entrance exam, jeśli liczba kandydatów uruchomi selekcję", ["Entrance exam nie został uruchomiony w tym cyklu"]],
  ["mit", "Przesłanie wyniku SAT albo ACT wymaganego przez MIT"],
  ["harvard-university", "Przesłanie wyniku SAT albo ACT; użycie alternatywnego egzaminu tylko w sytuacji dopuszczonej przez Harvard"],
  ["stanford-university", "Przesłanie wyniku SAT albo ACT wymaganego w aktualnym cyklu Stanford"],
  ["yale-university", "Przesłanie wyniku spełniającego test-flexible requirement Yale: ACT, SAT, AP albo IB"],
  ["university-of-pennsylvania", "Przesłanie wyniku SAT albo ACT zgodnie z aktualną polityką Penn"],
  ["caltech", "Przesłanie wyniku SAT albo ACT zgodnie z aktualną polityką Caltech"],
  ["georgia-tech", "Przesłanie wyniku SAT albo ACT wymaganego przez Georgia Tech"],
  ["johns-hopkins-university", "Przesłanie wyniku SAT albo ACT wymaganego w aktualnym cyklu Johns Hopkins"],
  ["dartmouth-college", "Przesłanie wyniku egzaminu spełniającego aktualny wymóg testing policy Dartmouth"],
  ["peking-university", "Udział w egzaminie wstępnym PKU z języka chińskiego, angielskiego i matematyki oraz w drugim etapie kwalifikacji"],
  ["tsinghua-university", "Udział w integrative test lub rozmowie Tsinghua po przejściu oceny dokumentów, jeśli kandydat otrzyma zaproszenie", ["Nie dotyczy - brak zaproszenia do dodatkowego etapu"]],
]) addAssessment(slug, task, alternativeOptions);

for (const guide of dutchProgrammeRecords.filter((item) => item.selection)) {
  addAssessment(
    guide.slug,
    `${selectionLabel(guide.selection)} - ukończenie wszystkich zadań selekcyjnych dla ${guide.programName}`,
  );
}

const assessmentRows = [];
for (const country of unique(assessmentEntries.map((entry) => entry.guide.country))) {
  const entries = assessmentEntries.filter((entry) => entry.guide.country === country);
  assessmentRows.push(materialCountryRow(country, entries.map((entry) => entry.guide.slug)));
  for (const guide of unique(entries.map((entry) => entry.guide.slug)).map((slug) => guideBySlug.get(slug))) {
    assessmentRows.push(materialUniversityRow(guide));
    for (const entry of entries.filter((item) => item.guide.slug === guide.slug)) {
      assessmentRows.push(materialItemRow(guide, entry.task, {
        alternativeOptions: entry.alternativeOptions,
      }));
    }
  }
}

const portfolioEntries = [
  ["mit", "Opcjonalne portfolio MIT w SlideRoom: research, maker, visual art/architecture albo performing arts"],
  ["harvard-university", "Opcjonalny Harvard supplementary media upload dla wyjątkowo rozwiniętej twórczości artystycznej, muzycznej lub badawczej"],
  ["stanford-university", "Opcjonalne Stanford Arts Portfolio dla Art Practice, Dance, Music albo Theater and Performance Studies"],
  ["columbia-university", "Opcjonalny Columbia supplement w SlideRoom: architecture, creative writing, dance, drama/theatre, film, maker, music albo visual arts"],
  ["nyu", "Obowiązkowy artistic review, portfolio albo audition dla odpowiednich programów Tisch i Steinhardt"],
  ["yale-university", "Opcjonalny Yale supplement: visual art, dance, music, film albo STEM research"],
  ["university-of-pennsylvania", "Opcjonalny Penn portfolio lub supplementary material wyłącznie dla odpowiedniego programu i zgodnie z instrukcją uczelni"],
  ["dartmouth-college", "Opcjonalny Dartmouth arts portfolio dla wybitnie rozwiniętej praktyki artystycznej"],
  ["princeton-university", "Opcjonalny Princeton Arts Supplement w SlideRoom dla dziedzin wskazanych przez uczelnię"],
  ["caltech", "Opcjonalne Caltech supplemental materials: research paper, STEM portfolio albo materiały twórcze zgodne z instrukcją aplikacji"],
  ["carnegie-mellon-university", "Obowiązkowe portfolio, pre-screen lub audition dla właściwej szkoły College of Fine Arts"],
  ["ucla", "Supplemental application, portfolio lub audition dla Arts and Architecture, Music, Nursing albo Theater, Film and Television"],
  ["johns-hopkins-university", "Odrębna aplikacja lub audition dla Peabody Institute"],
  ["northwestern-university", "Bienen School Supplement, materiały muzyczne i rekomendacja nauczyciela muzyki"],
  ["university-of-oxford", "Portfolio wymagane dla Fine Art albo dodatkowe materiały pisemne lub muzyczne wymagane przez wybrany kierunek Oxford"],
  ["university-of-cambridge", "Portfolio lub prace pisemne wymagane przez wybrany kierunek Cambridge, w szczególności Architecture"],
  ["ucl", "Portfolio wymagane przez wybrane programy Bartlett lub Slade School of Fine Art"],
  ["university-of-edinburgh", "Portfolio wymagane przez wybrane programy Edinburgh College of Art"],
  ["university-of-manchester", "Digital portfolio wymagane przez Manchester School of Architecture"],
  ["university-of-toronto", "One Idea supplementary application albo portfolio dla Daniels Faculty oraz audition dla Faculty of Music"],
  ["ubc-vancouver", "Supplemental application lub portfolio dla Design, Fine Arts, Media Studies, Music albo innego programu wskazanego przez UBC"],
  ["mcgill-university", "Digital portfolio i audition dla Schulich School of Music"],
  ["university-of-waterloo", "Portfolio, video presentation i interview wymagane przez Waterloo Architecture"],
  ["york-university", "Portfolio, audition albo supplementary evaluation dla właściwego programu School of the Arts, Media, Performance and Design"],
  ["ie-university", "Portfolio wymagane przez Bachelor in Architectural Studies lub inny program projektowy IE"],
  ["tsinghua-university", "Obowiązkowe self-introduction video do 3 minut oraz portfolio dla kandydatów do wskazanych programów artystycznych"],
  ["peking-university", "Obowiązkowe self-introduction video zgodne z instrukcją aplikacji międzynarodowej PKU"],
  ["national-university-of-singapore", "Portfolio, aptitude test lub interview dla Architecture, Landscape Architecture, Industrial Design, Music i innych wskazanych programów NUS"],
  ["nanyang-technological-university", "Portfolio wymagane przez Art, Design and Media oraz inne programy NTU wskazane w application requirements"],
  ["university-of-melbourne", "Portfolio albo audition dla właściwych programów Design, Fine Arts lub Music w University of Melbourne"],
  ["university-of-sydney", "Portfolio, audition albo additional selection criteria dla właściwych programów Sydney Conservatorium, Design lub Architecture"],
  ["anu", "Portfolio albo audition dla właściwych programów ANU School of Art and Design lub School of Music"],
  ["unsw-sydney", "Portfolio lub dodatkowe zadanie selekcyjne dla właściwych programów UNSW Arts, Design and Architecture"],
  ["monash-university", "Portfolio albo audition dla właściwych programów Monash Art, Design, Architecture lub Music"],
  ["american-university-of-sharjah", "Portfolio wymagane przez Architecture, Interior Design albo Multimedia Design w AUS"],
].map(([slug, task]) => ({ guide: guideBySlug.get(slug), task }));

const portfolioRows = [];
for (const country of unique(portfolioEntries.map((entry) => entry.guide.country))) {
  const entries = portfolioEntries.filter((entry) => entry.guide.country === country);
  portfolioRows.push(materialCountryRow(country, entries.map((entry) => entry.guide.slug)));
  for (const entry of entries) {
    portfolioRows.push(materialUniversityRow(entry.guide));
    portfolioRows.push(materialItemRow(entry.guide, entry.task, {
      actionType: "check_or_file",
      suggestedFilename: `${entry.guide.slug}-portfolio.pdf`,
      alternativeOptions: ["Nie dotyczy - wybrany program nie wymaga portfolio ani audition"],
    }));
  }
}

const mathProgrammePattern = /(actuarial|analytics|econom|econometric|mathemat|computer|data science|engineering|physics|chemistry|nanobiology|artificial intelligence|technology|science programme|biomedical|molecular|sustainab|earth, climate)/i;
const mathGuideSlugs = unique([
  "iba-erasmus-university-rotterdam",
  "business-administration-university-of-amsterdam",
  "business-analytics-university-of-amsterdam",
  "international-business-administration-tilburg-university",
  ...dutchProgrammeRecords
    .filter((guide) => mathProgrammePattern.test(guide.programName))
    .map((guide) => guide.slug),
]);
const mathRows = groupRowsByCountry(
  mathGuideSlugs.map((slug) => guideBySlug.get(slug)),
  (guide) => [
    materialUniversityRow(guide),
    materialItemRow(guide, "Potwierdzenie wymogu z matematyki", {
      actionType: "check_or_file",
      suggestedFilename: `${guide.slug}-potwierdzenie-matematyki.pdf`,
      alternativeOptions: ["Wymóg potwierdzony bez dodatkowego dokumentu"],
    }),
  ],
);

function attachExistingTile(title, slugs) {
  return {
    title,
    targetTemplateTitle: title,
    mergeMode: "append",
    appliesToGuideSlugs: unique(slugs),
    rows: [],
  };
}

const materialTemplates = [
  attachExistingTile("Paszport", newDutchSlugs),
  attachExistingTile("Certificate of expected graduation", newDutchSlugs),
  attachExistingTile("Certyfikat językowy", newDutchSlugs),
  attachExistingTile("Transkrypty / świadectwa ze szkoły średniej", newDutchSlugs),
  {
    title: "Potwierdzenie wymogu z matematyki",
    targetTemplateTitle: "Potwierdzenie wymogu z matematyki",
    mergeMode: "replace",
    templateType: "passport_like",
    description: "Potwierdzenie poziomu matematyki przypisane oddzielnie do każdego programu, który stawia taki wymóg.",
    appliesToGuideSlugs: mathGuideSlugs,
    rows: mathRows,
  },
  {
    title: "Zcentralizowane Portale Aplikacyjne",
    targetTemplateTitle: "Zcentralizowane Portale Aplikacyjne",
    mergeMode: "replace",
    templateType: "passport_like",
    description: "Wspólne systemy krajowe i ponaduczelniane używane do rozpoczęcia aplikacji oraz dodania konkretnych wyborów.",
    appliesToGuideSlugs: unique(centralPortalRows.flatMap((row) => row.appliesToGuideSlugs || [])),
    rows: centralPortalRows,
  },
  {
    title: "Portale Uczelni",
    targetTemplateTitle: "Portale Uczelni",
    mergeMode: "replace",
    templateType: "passport_like",
    description: "Portale uczelni są rozdzielone według instytucji i programu. Przy aplikacjach składanych przez system centralny portal uczelni służy wyłącznie do kontroli statusu i brakujących dokumentów.",
    appliesToGuideSlugs: unique(portalRows.flatMap((row) => row.appliesToGuideSlugs || [])),
    rows: portalRows,
  },
  {
    title: "Eseje",
    targetTemplateTitle: "Eseje",
    mergeMode: "replace",
    templateType: "essay_like",
    description: "Eseje, short answers, personal statements i profile pisemne przypisane do konkretnych uczelni lub programów.",
    appliesToGuideSlugs: unique(essayRows.flatMap((row) => row.appliesToGuideSlugs || [])),
    rows: essayRows,
  },
  {
    title: "Egzaminy i etapy selekcyjne",
    targetTemplateTitle: "Egzaminy wstępne do uczelni",
    mergeMode: "replace",
    templateType: "passport_like",
    description: "Testy standaryzowane, admissions tests, rozmowy i inne etapy selekcyjne wymagane przez konkretną uczelnię lub program.",
    appliesToGuideSlugs: unique(assessmentRows.flatMap((row) => row.appliesToGuideSlugs || [])),
    rows: assessmentRows,
  },
  {
    title: "Portfolio i audition",
    templateType: "passport_like",
    description: "Materiały artystyczne, projektowe, muzyczne i performatywne wymagane tylko przez wskazane szkoły lub programy.",
    appliesToGuideSlugs: unique(portfolioRows.flatMap((row) => row.appliesToGuideSlugs || [])),
    rows: portfolioRows,
  },
];

const blueprint = {
  version: 1,
  operations: {
    deleteGuideSlugs: obsoleteDutchGuideSlugs,
  },
  guides: newDutchGuides,
  materialTemplates,
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateBlueprint() {
  const newSlugs = newDutchGuides.map((guide) => guide.slug);
  assert(new Set(newSlugs).size === newSlugs.length, "Duplicate new Dutch guide slug");
  assert(!newSlugs.some((slug) => obsoleteDutchGuideSlugs.includes(slug)), "Obsolete guide recreated");
  assert(!newDutchGuides.some((guide) => /programy licencjackie po angielsku/i.test(guide.title)), "Umbrella Dutch guide remains");

  const knownSlugs = new Set(allGuideSlugs);
  for (const template of materialTemplates) {
    for (const slug of template.appliesToGuideSlugs || []) {
      assert(knownSlugs.has(slug), `Unknown template guide slug ${slug} in ${template.title}`);
    }
    for (const row of template.rows || []) {
      for (const slug of row.appliesToGuideSlugs || []) {
        assert(knownSlugs.has(slug), `Unknown row guide slug ${slug} in ${template.title}`);
      }
      if (row.level === "item" && template.rows.filter((item) => item.level === "university").length > 1) {
        assert(row.country?.trim(), `Unscoped country on item ${row.task} in ${template.title}`);
        assert(row.university?.trim(), `Unscoped university on item ${row.task} in ${template.title}`);
      }
    }
  }

  const portalItems = portalRows.filter((row) => row.level === "item");
  assert(portalItems.every((row) => row.appliesToGuideSlugs.length === 1), "Portal item spans multiple guides");
  assert(portalItems.every((row) => row.country && row.university), "Portal item lacks explicit scope");
  assert(
    !portalRows.some((row) => row.appliesToGuideSlugs?.some((slug) => centralOnlyPortalSlugs.has(slug))),
    "Central-only application guide leaked into university portal tile",
  );
  assert(
    !portalItems.some(
      (row) => row.appliesToGuideSlugs.some((slug) => postSubmissionPortalSlugs.has(slug))
        && /formalne wysłanie aplikacji/i.test(row.task),
    ),
    "Central application is incorrectly submitted in a post-submission university portal",
  );

  const mitRows = essayRows.filter(
    (row) => row.level === "item" && row.appliesToGuideSlugs?.includes("mit"),
  );
  assert(mitRows.length === 5, `Expected 5 MIT essays, found ${mitRows.length}`);
  assert(mitRows.every((row) => row.actionType === "file_or_doc"), "MIT essay is not file_or_doc");
  assert(
    essayRows.filter((row) => row.level === "item" && /^UCAS Personal Statement - pytanie/.test(row.task)).length === 3,
    "UCAS three-question personal statement is incomplete",
  );
  assert(
    essayRows.filter((row) => row.level === "item" && /^UC Personal Insight Question/.test(row.task)).length === 4,
    "UC application must contain four shared PIQ tasks",
  );
  assert(
    essayRows.filter(
      (row) => row.level === "item"
        && row.country === "USA"
        && row.task === "Common App personal essay"
        && row.appliesToGuideSlugs.length > 1,
    ).length === 1,
    "Common App personal essay must be shared instead of duplicated per university",
  );
  assert(
    newDutchGuides.filter((guide) => /Amsterdam University College/.test(guide.programName)).length === 1,
    "Amsterdam University College was duplicated between UvA and VU",
  );

  const scopedItemKeys = new Set();
  for (const template of materialTemplates) {
    for (const row of template.rows || []) {
      if (row.level !== "item") continue;
      const key = `${template.title}|${row.country}|${row.university}|${row.task}|${[...(row.appliesToGuideSlugs || [])].sort().join(",")}`;
      assert(!scopedItemKeys.has(key), `Duplicate scoped item: ${key}`);
      scopedItemKeys.add(key);
      if (["file_required", "check_or_file", "file_or_doc"].includes(row.actionType)) {
        assert(row.suggestedFilename, `Missing suggested filename for ${key}`);
      }
      if (row.actionType === "file_or_doc") {
        assert(row.docTabTitle && row.docTabPrompt, `Incomplete Essay Doc metadata for ${key}`);
      }
    }
  }

  const forbidden = /(FILL_|OPTIONAL_|wybrany program w |programy licencjackie po angielsku)/i;
  assert(!forbidden.test(JSON.stringify(blueprint)), "Placeholder or obsolete umbrella copy found");
}

validateBlueprint();

fs.writeFileSync(outputPath, `${JSON.stringify(blueprint, null, 2)}\n`);

const report = [
  "# ACADEA university guide correction",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Scope",
  "",
  `- Deletes ${obsoleteDutchGuideSlugs.length} incorrect Dutch umbrella guides.`,
  `- Adds ${newDutchGuides.length} programme-level Dutch guides.`,
  `- Rebuilds ${materialTemplates.filter((template) => template.mergeMode === "replace").length} shared tiles in place.`,
  `- Creates ${essayRows.filter((row) => row.level === "item").length} essay tasks.`,
  `- Creates ${portalRows.filter((row) => row.level === "item").length} university-portal tasks, each scoped to exactly one guide.`,
  `- Creates ${assessmentRows.filter((row) => row.level === "item").length} assessment tasks.`,
  "- Keeps existing non-Dutch guide records untouched so their guide checklist progress is not deleted by the importer.",
  "- Renames the assessment tile in place to cover tests, interviews and other selection stages accurately.",
  "",
  "## Validation",
  "",
  "- Every portal item has explicit country and university scope.",
  "- Every portal item applies to exactly one guide.",
  "- UCAS, Common App, UC Application and OUAC guides use their university portals only after the central application is submitted.",
  "- CAO, UniversityAdmissions.se, Optagelse.dk and Studyinfo.fi guides do not receive fabricated university-portal submission tasks.",
  "- Every referenced guide slug is known to the correction dataset.",
  "- MIT has five separate file-or-doc essay rows.",
  "- UCAS has three shared 2026-format statement questions; Common App and UC PIQ writing is shared rather than duplicated per university.",
  "- Mathematics requirements are grouped and scoped per programme rather than represented by one ambiguous global row.",
  "- Amsterdam University College appears once rather than once under both UvA and VU.",
  "- No scaffold placeholders or Dutch umbrella-guide labels remain.",
  "",
  "## Official sources",
  "",
  ...officialSources.map(([label, url]) => `- [${label}](${url})`),
  "",
].join("\n");

fs.writeFileSync(reportPath, report);

console.log(JSON.stringify({
  outputPath,
  reportPath,
  deletedGuides: obsoleteDutchGuideSlugs.length,
  newDutchGuides: newDutchGuides.length,
  retainedGuides: retainedPreviousGuides.length,
  totalGuideUniverse: allGuideSlugs.length,
  essayItems: essayRows.filter((row) => row.level === "item").length,
  portalItems: portalRows.filter((row) => row.level === "item").length,
  assessmentItems: assessmentRows.filter((row) => row.level === "item").length,
}, null, 2));
