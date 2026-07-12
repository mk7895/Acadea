export const SCHOLARSHIP_MENTORS = [
  {
    name: "Nikodem Ciomcia",
    desc: "Student fizyki i energetyki jądrowej, zaangażowany w badania i popularyzację nauki. Wspiera kandydatów rozwijających się w ścisłych dziedzinach i ambitnych projektach badawczych.",
    descEn: "Physics and nuclear energy student involved in research and science communication. He supports candidates developing in STEM fields and ambitious research projects.",
  },
  {
    name: "Krzysztof Sosnowski",
    desc: "Student medycyny na University of Cambridge z doświadczeniem badawczym i klinicznym. Pomaga kandydatom zainteresowanym medycyną, biologią i naukami biomedycznymi.",
    descEn: "Medicine student at the University of Cambridge with research and clinical experience. He helps candidates interested in medicine, biology and biomedical sciences.",
  },
  {
    name: "Małgorzata Słowikowska",
    desc: "Tancerka i choreografka zdobywająca doświadczenia między innymi w Nowym Jorku i Modenie. Wspiera osoby rozwijające się artystycznie i budujące mocny, autentyczny profil twórczy.",
    descEn: "Dancer and choreographer with experience including New York and Modena. She supports artistically minded candidates building a strong, authentic creative profile.",
  },
  {
    name: "Mikołaj Błaszczyk",
    desc: "Łączy lotnictwo, kosmos i technologię, a pierwsze samoloty pilotował już jako nastolatek. Pomaga kandydatom z pasją do inżynierii, STEM-u i projektów technicznych.",
    descEn: "He combines aviation, space and technology, and flew his first aircraft as a teenager. He helps candidates passionate about engineering, STEM and technical projects.",
  },
  {
    name: "Marlena Sołtysińska",
    desc: "Studentka UCL, absolwentka NYU i założycielka Fundacji Acadea. Od lat wspiera uczniów w budowaniu strategii aplikacyjnej i drogi na topowe uczelnie świata.",
    descEn: "UCL student, NYU alumna and founder of Fundacja Acadea. For years she has helped students build application strategies for top global universities.",
  },
  {
    name: "Mateusz Klepacki",
    desc: "Absolwent LSE i NYU, z doświadczeniem w BCG i zeb Consulting. Pomaga kandydatom przekładać ambicję, osiągnięcia i cele na mocną strategię aplikacyjną.",
    descEn: "LSE and NYU alumnus with experience at BCG and zeb Consulting. He helps candidates translate ambition, achievements and goals into a strong application strategy.",
  },
  {
    name: "Amelia Kudasik",
    desc: "Studentka prawa na Durham University, łącząca zainteresowania prawem i zdrowiem. Wspiera kandydatów budujących spójny profil do nauk społecznych i humanistycznych.",
    descEn: "Law student at Durham University combining interests in law and health. She supports candidates building coherent profiles for social sciences and humanities.",
  },
  {
    name: "Oskar Krawczyk",
    desc: "Rozwija się w obszarze sztucznej inteligencji, matematyki i informatyki analitycznej. Pomaga podopiecznym dobrze pokazać potencjał w kierunkach ilościowych i technologicznych.",
    descEn: "He develops in artificial intelligence, mathematics and analytical computer science. He helps mentees present their potential in quantitative and technology-focused fields.",
  },
] as const;

const surnameKey = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts.at(-1)} ${parts.slice(0, -1).join(" ")}` : name;
};

export const SORTED_SCHOLARSHIP_MENTORS = [...SCHOLARSHIP_MENTORS].sort((a, b) =>
  surnameKey(a.name).localeCompare(surnameKey(b.name), "pl"),
);

export const SCHOLARSHIP_MENTOR_NAMES = SORTED_SCHOLARSHIP_MENTORS.map((mentor) => mentor.name);
