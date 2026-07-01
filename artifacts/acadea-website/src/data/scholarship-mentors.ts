export const SCHOLARSHIP_MENTORS = [
  {
    name: "Nikodem Ciomcia",
    desc: "Student fizyki i energetyki jądrowej, zaangażowany w badania i popularyzację nauki. Wspiera kandydatów rozwijających się w ścisłych dziedzinach i ambitnych projektach badawczych.",
  },
  {
    name: "Krzysztof Sosnowski",
    desc: "Student medycyny na University of Cambridge z doświadczeniem badawczym i klinicznym. Pomaga kandydatom zainteresowanym medycyną, biologią i naukami biomedycznymi.",
  },
  {
    name: "Małgorzata Słowikowska",
    desc: "Tancerka i choreografka szkoląca się między innymi w Nowym Jorku i Modenie. Wspiera osoby rozwijające się artystycznie i budujące mocny, autentyczny profil twórczy.",
  },
  {
    name: "Mikołaj Błaszczyk",
    desc: "Łączy lotnictwo, kosmos i technologię, a pierwsze samoloty pilotował już jako nastolatek. Pomaga kandydatom z pasją do inżynierii, STEM-u i projektów technicznych.",
  },
  {
    name: "Marlena Sołtysińska",
    desc: "Studentka UCL, absolwentka NYU i założycielka Fundacji Acadea. Od lat wspiera uczniów w budowaniu strategii aplikacyjnej i drogi na topowe uczelnie świata.",
  },
  {
    name: "Mateusz Klepacki",
    desc: "Absolwent LSE i NYU, z doświadczeniem w Boston Consulting Group (BCG) i zeb Consulting. Pomaga kandydatom przekładać ambicję, osiągnięcia i cele na mocną strategię aplikacyjną.",
  },
  {
    name: "Amelia Kudasik",
    desc: "Studentka prawa na Durham University, łącząca zainteresowania prawem, zdrowiem i edukacją. Wspiera kandydatów budujących spójny profil do nauk społecznych i humanistycznych.",
  },
  {
    name: "Oskar Krawczyk",
    desc: "Rozwija się w obszarze sztucznej inteligencji, matematyki i informatyki analitycznej. Pomaga kandydatom dobrze pokazać potencjał w kierunkach ilościowych i technologicznych.",
  },
] as const;

export const SORTED_SCHOLARSHIP_MENTORS = [...SCHOLARSHIP_MENTORS].sort((a, b) =>
  a.name.localeCompare(b.name, "pl"),
);

export const SCHOLARSHIP_MENTOR_NAMES = SORTED_SCHOLARSHIP_MENTORS.map((mentor) => mentor.name);
