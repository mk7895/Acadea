import { Link } from "wouter";
import {
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebPageSchema,
  useSeo,
} from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

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

const scoringRowsEn = [
  {
    criterion: "Average grade for the last school year",
    points: "up to 10 pts",
    description: "5 pts for an average above 4.0; 7 pts above 4.75; 10 pts above 5.0. Thresholds are not cumulative.",
  },
  {
    criterion: "Competitions, awards, olympiads or publications",
    points: "up to 20 pts",
    description: "Assessment of the form answer about the candidate's most important achievements.",
  },
  {
    criterion: "Most interesting things created in free time",
    points: "up to 20 pts",
    description: "Assessment of the answer about projects, initiatives, organisations, apps, websites or other independent activities.",
  },
  {
    criterion: "Why are you applying?",
    points: "up to 20 pts",
    description: "Assessment of the answer about the candidate, their plans, motivation and how an ACADEA scholarship could change their situation.",
  },
];

export default function ScholarshipTerms() {
  const { isEnglish, localizePath } = useLanguage();

  useSeo({
    title: isEnglish ? "ACADEA Scholarship Competition Terms" : "Regulamin Konkursu Stypendialnego ACADEA",
    description: isEnglish
      ? "Read the ACADEA Scholarship Competition terms, application rules, scoring, assessment process and scholarship selection conditions."
      : "Przeczytaj regulamin Konkursu Stypendialnego ACADEA, zasady zgłoszeń, punktację, sposób oceny oraz warunki wyboru stypendystów.",
    path: isEnglish ? "/en/scholarship/terms" : "/stypendium/regulamin",
    keywords: isEnglish ? ["scholarship terms", "ACADEA scholarship competition", "scholarship rules"] : ["regulamin stypendium", "konkurs stypendialny regulamin", "ACADEA regulamin stypendium"],
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebPageSchema({
        path: isEnglish ? "/en/scholarship/terms" : "/stypendium/regulamin",
        title: isEnglish ? "ACADEA Scholarship Competition Terms" : "Regulamin Konkursu Stypendialnego ACADEA",
        description: isEnglish
          ? "Terms of the ACADEA scholarship programme, including application, assessment and recipient selection rules."
          : "Regulamin programu stypendialnego ACADEA z zasadami zgłoszeń, oceną i wyborem stypendystów.",
      }),
      createBreadcrumbSchema([
        { name: isEnglish ? "Home" : "Strona Główna", path: isEnglish ? "/en" : "/" },
        { name: isEnglish ? "Scholarship" : "Stypendia", path: isEnglish ? "/en/scholarship" : "/stypendium" },
        { name: isEnglish ? "Scholarship Terms" : "Regulamin Stypendium", path: isEnglish ? "/en/scholarship/terms" : "/stypendium/regulamin" },
      ]),
    ],
  });

  if (isEnglish) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 pb-20 md:pt-32">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm md:p-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              ACADEA Scholarship Competition
            </p>
            <h1 className="mb-2 text-3xl font-bold text-primary md:text-4xl">
              ACADEA Scholarship Competition Terms 2026
            </h1>
            <p className="mb-10 text-sm text-gray-400">Version effective from the date of publication on the website.</p>

            <div className="space-y-8 text-sm leading-relaxed text-gray-600">
              <section>
                <h2 className="mb-3 text-xl font-bold text-primary">§1. Organiser and purpose</h2>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>The organiser of the ACADEA Scholarship Competition 2026 is Fundacja Acadea, registered in Wroclaw, KRS: 0001240540, NIP: 8982333798, REGON: 544715960.</li>
                  <li>The purpose of the competition is to select people whom the Organiser may support through mentoring, educational or organisational assistance in developing academic, application or project plans.</li>
                  <li>These Terms define the rules for applications, assessment and selection of scholarship recipients.</li>
                </ol>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-primary">§2. Participants and applications</h2>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>The competition is for people who in the 2026/2027 school year will be students of upper-secondary schools, including general secondary schools, technical schools or vocational schools.</li>
                  <li>Participation requires having upper-secondary school student status in the 2026/2027 school year. The Organiser may ask the candidate to provide a document or other confirmation.</li>
                  <li>A minor may participate and submit an application only with prior consent of their parent or legal guardian.</li>
                  <li>Submitting an application by a minor means the minor declares that they have obtained parent or legal guardian consent to participate, submit the application and process data required to run the competition.</li>
                  <li>The Organiser may request confirmation of parent or guardian consent, especially before awarding or starting support. Failure to provide confirmation by the deadline may result in the application being disregarded or support not being awarded.</li>
                  <li>
                    Applications are submitted through the form available at{" "}
                    <Link href={localizePath("/stypendium/aplikacja")} className="font-semibold text-primary hover:underline">
                      acadea.org/en/scholarship/application
                    </Link>.
                  </li>
                  <li>Applications are reviewed on a rolling basis. The Organiser may divide applications into rounds and assess them within a given round.</li>
                  <li>The candidate is responsible for the truthfulness, completeness and currency of data provided in the form.</li>
                  <li>One person may submit a maximum of one application in a six-month period.</li>
                  <li>Submitting multiple applications in a short time, bypassing limits or applying under different details may result in all such applications being disregarded, exclusion from the current round or, in repeated cases, a permanent block from future editions.</li>
                  <li>The Organiser may leave incomplete, clearly unreliable, ineligible or rule-breaching applications unreviewed.</li>
                </ol>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-primary">§3. Committee</h2>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>Applications are assessed by a competition committee composed of ACADEA mentors and members of the Fundacja Acadea board.</li>
                  <li>The committee may assess applications jointly or individually and then agree the final result for a given round.</li>
                  <li>The committee may contact a selected candidate to clarify application information but is not required to do so.</li>
                </ol>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-primary">§4. Scoring</h2>
                <p className="mb-4">
                  A candidate may receive a maximum of 70 points. Scoring is used to compare applications in a given round and does not guarantee a scholarship.
                </p>
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="bg-gray-50 text-primary">
                      <tr>
                        <th className="px-4 py-3 font-bold">Criterion</th>
                        <th className="px-4 py-3 font-bold">Points</th>
                        <th className="px-4 py-3 font-bold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {scoringRowsEn.map((row) => (
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
                <h2 className="mb-3 text-xl font-bold text-primary">§5. Selection of scholarship recipients</h2>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>After assessment, the committee prepares a ranking list within the given application round.</li>
                  <li>The committee may award a scholarship to one or more people from a given round, considering points, application quality, organisational capacity and the available pool of support.</li>
                  <li>The committee reserves the right not to select any recipient in a given round.</li>
                  <li>The committee's decision is final. No appeal is available.</li>
                </ol>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-primary">§6. Nature of support</h2>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>The scope of support is determined by the Organiser individually, taking into account the recipient's needs and the Foundation's capacity.</li>
                  <li>A scholarship award does not create a claim to a specific form, value or duration of support.</li>
                  <li>The Organiser may withdraw support if the recipient provided false information, breaches standards of proper conduct, acts to the detriment of the Organiser or does not cooperate in programme delivery.</li>
                </ol>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-primary">§7. Personal data</h2>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>The controller of candidates' personal data is Fundacja Acadea, registered in Wroclaw.</li>
                  <li>Candidate personal data is processed to receive and assess applications, run the competition, contact candidates, select recipients, defend against possible claims and deliver the scholarship programme.</li>
                  <li>For minor candidates, the Organiser may also process parent or legal guardian data where needed to confirm consent or deliver support.</li>
                  <li>
                    Detailed information about data processing rules, legal bases and retention periods is available in the{" "}
                    <Link href="/en/privacy-policy" className="font-semibold text-primary hover:underline">
                      Privacy Policy
                    </Link>.
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-bold text-primary">§8. Final provisions</h2>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>The Organiser may amend these Terms if needed to run the competition properly or due to organisational, technical or legal changes.</li>
                  <li>Matters not regulated by these Terms are decided by the Organiser.</li>
                  <li>Competition contact: <a href="mailto:contact@acadea.org" className="font-semibold text-primary hover:underline">contact@acadea.org</a>.</li>
                </ol>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <h2 className="mb-3 text-xl font-bold text-primary">§2. Uczestnicy i zgłoszenia</h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Konkurs jest skierowany do osób, które w roku szkolnym 2026/2027 będą uczniami szkół ponadpodstawowych, w szczególności liceów ogólnokształcących, techników lub szkół branżowych.
                </li>
                <li>
                  Warunkiem udziału w konkursie jest posiadanie statusu ucznia szkoły ponadpodstawowej w roku szkolnym 2026/2027. Organizator może poprosić kandydata o przedstawienie dokumentu lub innego potwierdzenia spełnienia tego warunku.
                </li>
                <li>
                  Osoba niepełnoletnia może wziąć udział w konkursie i przesłać zgłoszenie wyłącznie za uprzednią zgodą swojego rodzica lub opiekuna prawnego.
                </li>
                <li>
                  Przesłanie zgłoszenia przez osobę niepełnoletnią oznacza złożenie przez nią oświadczenia, że uzyskała zgodę rodzica lub opiekuna prawnego na udział w konkursie, przesłanie zgłoszenia oraz przetwarzanie danych osobowych niezbędnych do przeprowadzenia konkursu.
                </li>
                <li>
                  Organizator może zażądać przedstawienia potwierdzenia zgody rodzica lub opiekuna prawnego, w szczególności przed przyznaniem albo rozpoczęciem realizacji stypendium. Brak przedstawienia takiego potwierdzenia w wyznaczonym terminie może skutkować nieuwzględnieniem zgłoszenia lub odstąpieniem od przyznania wsparcia.
                </li>
                <li>
                  Zgłoszenia są przyjmowane przez formularz dostępny na stronie{" "}
                  <Link href={localizePath("/stypendium/aplikacja")} className="font-semibold text-primary hover:underline">
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
                  Organizator może pozostawić bez rozpoznania zgłoszenie niekompletne, oczywiście nierzetelne, niespełniające warunków udziału albo naruszające zasady konkursu.
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
                  Administratorem danych osobowych kandydatów jest Fundacja Acadea z siedzibą we Wrocławiu.
                </li>
                <li>
                  Dane osobowe kandydatów są przetwarzane w celu przyjęcia i oceny zgłoszeń, przeprowadzenia konkursu, kontaktu z kandydatami, wyboru stypendystów, obrony przed ewentualnymi roszczeniami oraz realizacji programu stypendialnego.
                </li>
                <li>
                  W przypadku kandydatów niepełnoletnich Organizator może przetwarzać także dane rodzica lub opiekuna prawnego, jeżeli są one potrzebne do potwierdzenia zgody na udział w konkursie albo realizacji wsparcia.
                </li>
                <li>
                  Szczegółowe informacje o zasadach, podstawach prawnych i okresach przetwarzania danych znajdują się w{" "}
                  <Link href={localizePath("/polityka-prywatnosci")} className="font-semibold text-primary hover:underline">
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
