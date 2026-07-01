import { Link } from "wouter";

const scoringRows = [
  {
    criterion: "Średnia ocen za ostatni rok szkolny",
    points: "do 10 pkt",
    description: "5 pkt za średnią powyżej 4,0; 7 pkt za średnią powyżej 4,75; 10 pkt za średnią powyżej 5,0. Progi nie sumują się.",
  },
  {
    criterion: "Konkursy, nagrody, olimpiady lub publikacje",
    points: "do 20 pkt",
    description: "Ocena odpowiedzi na pytanie z formularza dotyczące najważniejszych osiągnięć kandydata.",
  },
  {
    criterion: "Najciekawsze rzeczy stworzone w wolnym czasie",
    points: "do 20 pkt",
    description: "Ocena odpowiedzi na pytanie z formularza dotyczące projektów, inicjatyw, organizacji, aplikacji, stron lub innych działań własnych.",
  },
  {
    criterion: "Dlaczego aplikujesz?",
    points: "do 20 pkt",
    description: "Ocena odpowiedzi na pytanie z formularza o kandydacie, jego planach, motywacji oraz tym, dlaczego stypendium ACADEA mogłoby zmienić jego sytuację.",
  },
];

export default function ScholarshipTerms() {
  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20 md:pt-32">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm md:p-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Konkurs Stypendialny ACADEA
          </p>
          <h1 className="mb-2 text-3xl font-bold text-primary md:text-4xl">
            Regulamin Konkursu Stypendialnego ACADEA 2026
          </h1>
          <p className="mb-10 text-sm text-gray-400">Wersja obowiązująca od dnia publikacji w serwisie.</p>

          <div className="space-y-8 text-sm leading-relaxed text-gray-600">
            <section>
              <h2 className="mb-3 text-xl font-bold text-primary">§1. Organizator i cel konkursu</h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Organizatorem Konkursu Stypendialnego ACADEA 2026 jest Fundacja Acadea z siedzibą we Wrocławiu, KRS: 0001240540, NIP: 8982333798, REGON: 544715960.
                </li>
                <li>
                  Celem konkursu jest wyłonienie osób, którym Organizator może przyznać wsparcie mentoringowe, edukacyjne lub organizacyjne w rozwijaniu planów naukowych, aplikacyjnych albo projektowych.
                </li>
                <li>
                  Regulamin określa zasady zgłoszeń, oceny i wyboru stypendystów w ramach konkursu.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-primary">§2. Zgłoszenia</h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Zgłoszenia są przyjmowane przez formularz dostępny na stronie{" "}
                  <Link href="/stypendium/aplikacja" className="font-semibold text-primary hover:underline">
                    acadea.org/stypendium/aplikacja
                  </Link>.
                </li>
                <li>
                  Zgłoszenia są rozpatrywane na bieżąco. Organizator może dzielić napływające aplikacje na tury zgłoszeń i oceniać je w ramach danej tury.
                </li>
                <li>
                  Kandydat odpowiada za prawdziwość, kompletność i aktualność danych podanych w formularzu.
                </li>
                <li>
                  Jedna osoba może wysłać maksymalnie jedno zgłoszenie w okresie 6 miesięcy.
                </li>
                <li>
                  Wysyłanie wielu zgłoszeń w krótkim czasie, obchodzenie ograniczenia albo składanie aplikacji pod różnymi danymi może skutkować nieuwzględnieniem wszystkich takich zgłoszeń, wykluczeniem z bieżącej rekrutacji, a w powtarzających się przypadkach także trwałą blokadą udziału w kolejnych edycjach programu.
                </li>
                <li>
                  Organizator może pozostawić bez rozpoznania zgłoszenie niekompletne, oczywiście nierzetelne albo naruszające zasady konkursu.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-primary">§3. Komisja</h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Zgłoszenia ocenia komisja konkursowa. W skład komisji wchodzą mentorzy ACADEA oraz członkowie zarządu Fundacji Acadea.
                </li>
                <li>
                  Komisja może oceniać zgłoszenia wspólnie albo indywidualnie, a następnie uzgodnić wynik końcowy dla danej tury zgłoszeń.
                </li>
                <li>
                  Komisja może kontaktować się z wybranym kandydatem w celu doprecyzowania informacji podanych w zgłoszeniu, ale nie ma takiego obowiązku.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-primary">§4. Punktacja</h2>
              <p className="mb-4">
                W ramach oceny zgłoszenia kandydat może uzyskać maksymalnie 70 punktów. Punktacja służy porównaniu zgłoszeń w danej turze i nie gwarantuje przyznania stypendium.
              </p>
              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-gray-50 text-primary">
                    <tr>
                      <th className="px-4 py-3 font-bold">Kryterium</th>
                      <th className="px-4 py-3 font-bold">Punkty</th>
                      <th className="px-4 py-3 font-bold">Opis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {scoringRows.map((row) => (
                      <tr key={row.criterion}>
                        <td className="px-4 py-4 font-semibold text-primary">{row.criterion}</td>
                        <td className="px-4 py-4 whitespace-nowrap">{row.points}</td>
                        <td className="px-4 py-4">{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-primary">§5. Wybór stypendystów</h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Po ocenie zgłoszeń komisja tworzy listę rankingową w ramach danej tury zgłoszeń.
                </li>
                <li>
                  Komisja może przyznać stypendium jednej lub kilku osobom z danej tury zgłoszeń, kierując się liczbą punktów, jakością zgłoszeń, możliwościami organizacyjnymi oraz dostępną pulą wsparcia.
                </li>
                <li>
                  Komisja zastrzega sobie prawo do niewyłonienia żadnego stypendysty w danej turze zgłoszeń.
                </li>
                <li>
                  Decyzja komisji jest ostateczna. Od decyzji nie przysługuje odwołanie.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-primary">§6. Charakter wsparcia</h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Zakres wsparcia przyznanego stypendyście jest ustalany przez Organizatora indywidualnie, z uwzględnieniem potrzeb stypendysty i możliwości Fundacji.
                </li>
                <li>
                  Przyznanie stypendium nie tworzy po stronie kandydata roszczenia o określoną formę, wartość ani czas trwania wsparcia.
                </li>
                <li>
                  Organizator może cofnąć wsparcie, jeżeli stypendysta podał nieprawdziwe informacje, narusza dobre obyczaje, działa na szkodę Organizatora albo nie współpracuje przy realizacji programu.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-primary">§7. Dane osobowe</h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Dane osobowe kandydatów są przetwarzane w celu przeprowadzenia konkursu, kontaktu z kandydatami i realizacji programu stypendialnego.
                </li>
                <li>
                  Szczegółowe informacje o przetwarzaniu danych znajdują się w{" "}
                  <Link href="/polityka-prywatnosci" className="font-semibold text-primary hover:underline">
                    Polityce Prywatności
                  </Link>.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-primary">§8. Postanowienia końcowe</h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Organizator może zmienić regulamin, jeżeli jest to potrzebne do prawidłowego przeprowadzenia konkursu albo wynika ze zmian organizacyjnych, technicznych lub prawnych.
                </li>
                <li>
                  W sprawach nieuregulowanych regulaminem decyzję podejmuje Organizator.
                </li>
                <li>
                  Kontakt w sprawach konkursu:{" "}
                  <a href="mailto:contact@acadea.org" className="font-semibold text-primary hover:underline">
                    contact@acadea.org
                  </a>.
                </li>
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
