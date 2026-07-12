import {
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebPageSchema,
  useSeo,
} from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

export default function PlatformTerms() {
  const { isEnglish } = useLanguage();

  useSeo({
    title: isEnglish ? "ACADEA Platform Terms" : "Regulamin platformy ACADEA",
    description: isEnglish
      ? "ACADEA Platform Terms covering accounts, materials, meetings, data and external integrations."
      : "Regulamin platformy ACADEA opisujący zasady korzystania z kont, materiałów, spotkań, danych i integracji zewnętrznych.",
    path: isEnglish ? "/en/platform-terms" : "/regulamin-platformy",
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebPageSchema({
        path: isEnglish ? "/en/platform-terms" : "/regulamin-platformy",
        title: isEnglish ? "ACADEA Platform Terms" : "Regulamin platformy ACADEA",
        description: isEnglish
          ? "Terms for using the ACADEA platform, including accounts, documents, materials and external integrations."
          : "Regulamin korzystania z platformy ACADEA, w tym kont, dokumentów, materiałów i integracji zewnętrznych.",
      }),
      createBreadcrumbSchema([
        { name: isEnglish ? "Home" : "Strona Główna", path: isEnglish ? "/en" : "/" },
        { name: isEnglish ? "Platform Terms" : "Regulamin Platformy", path: isEnglish ? "/en/platform-terms" : "/regulamin-platformy" },
      ]),
    ],
  });

  if (isEnglish) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">ACADEA Platform Terms</h1>
            <p className="text-gray-400 text-sm mb-10">Last updated: June 2026</p>

            <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-primary mt-4 mb-4">I. Definitions</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li><strong>Platform Terms</strong> means this document setting out the rules for using the ACADEA Platform.</li>
                  <li><strong>Platform</strong> means the ACADEA web application available at https://app.acadea.org and its related functions, accounts, materials, forms and communication or organisational tools.</li>
                  <li><strong>Service Provider</strong> means Fundacja Acadea, KRS: 0001240540, NIP: 8982333798, REGON: 544715960, registered at Jedności Narodowej 55-57 / 15, 50-262 Wroclaw, Poland.</li>
                  <li><strong>User</strong> means any person using the Platform, including a Mentee, Mentor or Administrator.</li>
                  <li><strong>Mentee</strong> means a person using the Platform to organise their educational, application or mentoring process.</li>
                  <li><strong>Mentor</strong> means a person granted a mentor account by the Service Provider to support Mentees within the agreed Platform functions.</li>
                  <li><strong>Materials</strong> means content, checklists, tips, files, links, notes, documents, forms, comments and other information made available or processed in the Platform.</li>
                  <li><strong>External integrations</strong> means third-party services, in particular Google Drive, Google Calendar, Google Meet, Zoom, Microsoft Teams, WhatsApp, Cloudflare, Render and email services.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">II. General provisions</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>The Platform Terms define rules for providing electronic services through the Platform, including accounts, materials, meetings, documents and external integrations.</li>
                  <li>Use of the Platform is voluntary. Creating an account or continuing to use the Platform means accepting these Platform Terms and reading the Privacy Policy.</li>
                  <li>The Platform is organisational, educational and supportive. It does not guarantee university admission, a scholarship, a visa, a positive recruitment result or any specific educational, financial, administrative or legal outcome.</li>
                  <li>Materials available in the Platform are not legal, tax, immigration, financial, psychological or other licensed professional advice unless a separate written agreement states otherwise.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">III. Account and access</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>A Mentee account may be created through the registration form. A Mentor account is created or approved by the Service Provider.</li>
                  <li>The User undertakes to provide true, current data concerning themselves unless they have a proper basis to act on behalf of another person.</li>
                  <li>The User is responsible for keeping passwords, access codes, meeting links and other access data confidential.</li>
                  <li>The Service Provider may refuse to create an account, limit access, suspend or delete an account if the User breaches these Platform Terms, the law, third-party rights, security rules or standards of proper conduct.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">IV. Documents, files and data</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>The User remains responsible for the content, legality, completeness, accuracy and currency of documents and data entered into the Platform.</li>
                  <li>The User should not upload documents or data of third parties unless they have the required legal basis or consent.</li>
                  <li>The Platform and External integrations are supporting tools. The User should keep their own backups of documents, files, application data and other important materials.</li>
                  <li>To the fullest extent permitted by law, the Service Provider is not liable for loss, damage, synchronisation delay, unavailability, accidental deletion or incompleteness of documents, files or data caused by the User, a Mentor, an external integration provider, technical failure, force majeure, an independent security incident or circumstances outside the Service Provider's reasonable control.</li>
                  <li>The Service Provider may delete data and files connected with an account after account closure, expiry of cooperation, withdrawal of access to a material or expiry of the retention period set out in the Privacy Policy, unless law requires longer storage.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">V. Meetings and mentoring</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>The Platform may allow Users to schedule, cancel, describe and mark the status of meetings.</li>
                  <li>Meeting times, Mentor availability, meeting links and communication methods may depend on External integrations. The Service Provider does not guarantee uninterrupted operation of those tools.</li>
                  <li>Mentors are responsible for their own availability, the reliability of information they provide from their experience and content they independently add to the Platform. The Service Provider may moderate or remove such content if it breaches these Platform Terms or the law.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">VI. Platform use rules</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>The Platform must not be used unlawfully, in a way that infringes third-party rights, disrupts the Platform or circumvents security measures.</li>
                  <li>Uploading malware, unlawful content, content infringing personal rights, confidential third-party data without a legal basis or materials for which the User lacks rights is prohibited.</li>
                  <li>The User may not share their account with third parties or use the Platform for mass data extraction, spam, automated scraping or competitive activity contrary to the Platform's purpose.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">VII. Availability and integrations</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>The Service Provider takes reasonable steps to keep the Platform stable but does not guarantee constant, uninterrupted or error-free availability.</li>
                  <li>The Platform may be temporarily unavailable due to maintenance, updates, failures, overload, infrastructure provider decisions or events outside the Service Provider's control.</li>
                  <li>External integrations are subject to their providers' terms and privacy policies. The Service Provider is not liable for changes, limits, failures, fees, account deletion or other actions of external providers.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">VIII. Liability</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>To the fullest extent permitted by law, the Service Provider is not liable for indirect loss, lost profits, lost opportunities, data loss, delays, application failure, refusal of admission, refusal of scholarship, visa refusal or decisions of third parties.</li>
                  <li>The User uses Materials, checklists, tips, recommendations, comments and Platform content at their own responsibility and should independently verify requirements of universities, institutions, authorities and scholarship organisations.</li>
                  <li>Nothing in these Platform Terms excludes or limits liability where exclusion or limitation is prohibited by mandatory law, in particular liability for intentional damage.</li>
                  <li>If the User is a consumer, these Platform Terms do not restrict rights granted under mandatory consumer law.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">IX. Personal data</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Personal data processing rules, including account data, form data, data entered into the Platform, technical data and cookie-related data, are described in the Privacy Policy at https://acadea.org/en/privacy-policy.</li>
                  <li>The User acknowledges that using the Platform may involve processing private or confidential data. The User should enter only data necessary to use the Platform.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">X. Complaints and contact</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Complaints concerning Platform operation may be sent to <a href="mailto:contact@acadea.org" className="text-primary hover:underline">contact@acadea.org</a>.</li>
                  <li>A complaint should include contact details, a description of the issue and, where possible, information allowing us to reproduce the error.</li>
                  <li>The Service Provider reviews complaints within a reasonable time, no longer than 30 days after receiving a complete report, unless the matter requires more time.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">XI. Changes to the Platform Terms</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>The Service Provider may change these Platform Terms, in particular due to legal changes, Platform functionality changes, organisational or security changes, external integrations or service delivery methods.</li>
                  <li>The amended Platform Terms will be published on the Service Provider's website. If a change materially affects the User's rights or obligations, the Service Provider may require renewed acceptance at the next login or when using selected functions.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">XII. Governing law and disputes</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Polish law applies to matters not regulated by these Platform Terms.</li>
                  <li>Disputes connected with the Platform will be resolved by the competent common courts in Poland and, for Users who are not consumers, by the court competent for the Service Provider's registered office, unless mandatory law provides otherwise.</li>
                </ol>
              </section>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mt-8">
                <p className="font-bold text-primary mb-1">Fundacja Acadea</p>
                <p>KRS: 0001240540 | NIP: 8982333798 | REGON: 544715960</p>
                <p>Jedności Narodowej 55-57 / 15, 50-262 Wroclaw, Poland</p>
                <p>E-mail: <a href="mailto:contact@acadea.org" className="text-primary hover:underline">contact@acadea.org</a></p>
                <p>Phone: <a href="tel:+48728492936" className="text-primary hover:underline">+48 728 492 936</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
            Regulamin Platformy ACADEA
          </h1>
          <p className="text-gray-400 text-sm mb-10">Ostatnia aktualizacja: czerwiec 2026</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-primary mt-4 mb-4">I. Definicje</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <strong>Regulamin Platformy</strong> oznacza niniejszy dokument określający zasady
                  korzystania z Platformy ACADEA.
                </li>
                <li>
                  <strong>Platforma</strong> oznacza aplikację internetową ACADEA dostępną pod adresem
                  https://app.acadea.org oraz powiązane z nią funkcje, konta, materiały, formularze,
                  narzędzia organizacyjne i komunikacyjne.
                </li>
                <li>
                  <strong>Usługodawca</strong> oznacza Fundację Acadea, KRS: 0001240540,
                  NIP: 8982333798, REGON: 544715960, z siedzibą: Jedności Narodowej 55-57 / 15,
                  50-262 Wrocław, Polska.
                </li>
                <li>
                  <strong>Użytkownik</strong> oznacza każdą osobę korzystającą z Platformy, w tym
                  Mentee, Mentora lub Administratora.
                </li>
                <li>
                  <strong>Mentee</strong> oznacza osobę korzystającą z Platformy w celu organizacji
                  własnego procesu edukacyjnego, aplikacyjnego lub mentoringowego.
                </li>
                <li>
                  <strong>Mentor</strong> oznacza osobę, której Usługodawca udostępnił konto mentorskie
                  w celu wspierania Mentees w ramach ustalonych funkcji Platformy.
                </li>
                <li>
                  <strong>Materiały</strong> oznaczają treści, checklisty, wskazówki, pliki, linki,
                  notatki, dokumenty, formularze, komentarze i inne informacje udostępniane lub
                  przetwarzane w Platformie.
                </li>
                <li>
                  <strong>Integracje zewnętrzne</strong> oznaczają usługi innych dostawców, w
                  szczególności Google Drive, Google Calendar, Google Meet, Zoom, Microsoft Teams,
                  WhatsApp, Cloudflare, Render oraz usługi poczty elektronicznej.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">II. Postanowienia ogólne</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Regulamin Platformy określa zasady świadczenia usług drogą elektroniczną za
                  pośrednictwem Platformy, w tym zasady zakładania kont, korzystania z materiałów,
                  umawiania spotkań, pracy z dokumentami oraz obsługi integracji zewnętrznych.
                </li>
                <li>
                  Korzystanie z Platformy jest dobrowolne. Założenie konta lub dalsze korzystanie z
                  Platformy oznacza akceptację Regulaminu Platformy oraz zapoznanie się z Polityką
                  Prywatności.
                </li>
                <li>
                  Platforma ma charakter organizacyjny, edukacyjny i pomocniczy. Platforma nie
                  gwarantuje przyjęcia na uczelnię, uzyskania stypendium, otrzymania wizy, pozytywnego
                  wyniku rekrutacji ani jakiegokolwiek określonego rezultatu edukacyjnego,
                  finansowego, administracyjnego lub prawnego.
                </li>
                <li>
                  Materiały udostępniane w Platformie nie stanowią porady prawnej, podatkowej,
                  imigracyjnej, finansowej, psychologicznej ani innej profesjonalnej porady wymagającej
                  indywidualnej licencji lub uprawnień, chyba że odrębna pisemna umowa stanowi inaczej.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">III. Konto i dostęp</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Konto Mentee może zostać założone przez formularz rejestracyjny. Konto Mentora jest
                  tworzone albo zatwierdzane przez Usługodawcę.
                </li>
                <li>
                  Użytkownik zobowiązuje się podawać dane prawdziwe, aktualne i dotyczące jego samego,
                  chyba że posiada właściwą podstawę do działania w imieniu innej osoby.
                </li>
                <li>
                  Użytkownik odpowiada za zachowanie poufności hasła, kodów dostępu, linków do spotkań
                  oraz innych danych umożliwiających dostęp do Platformy.
                </li>
                <li>
                  Usługodawca może odmówić utworzenia konta, ograniczyć dostęp, zawiesić konto albo je
                  usunąć, jeżeli Użytkownik narusza Regulamin Platformy, prawo, prawa osób trzecich,
                  zasady bezpieczeństwa lub dobre obyczaje.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">IV. Dokumenty, pliki i dane</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Użytkownik zachowuje odpowiedzialność za treść, zgodność z prawem, kompletność,
                  prawdziwość oraz aktualność dokumentów i danych wprowadzanych do Platformy.
                </li>
                <li>
                  Użytkownik nie powinien przesyłać do Platformy dokumentów lub danych osób trzecich,
                  jeżeli nie posiada do tego odpowiedniej podstawy prawnej lub zgody wymaganej przez
                  prawo.
                </li>
                <li>
                  Platforma oraz Integracje zewnętrzne służą jako narzędzia pomocnicze. Użytkownik ma
                  obowiązek przechowywać własne kopie zapasowe dokumentów, plików, danych aplikacyjnych
                  i innych materiałów, które mogą być dla niego istotne.
                </li>
                <li>
                  W najszerszym zakresie dopuszczalnym przez prawo Usługodawca nie odpowiada za utratę,
                  uszkodzenie, opóźnienie synchronizacji, niedostępność, przypadkowe usunięcie lub
                  niekompletność dokumentów, plików albo danych, jeżeli wynika to z działania lub
                  zaniechania Użytkownika, Mentora, dostawcy Integracji zewnętrznej, awarii technicznej,
                  działania siły wyższej, naruszenia bezpieczeństwa niezależnego od Usługodawcy albo
                  innych okoliczności pozostających poza rozsądną kontrolą Usługodawcy.
                </li>
                <li>
                  Usługodawca może usuwać dane i pliki związane z kontem po zamknięciu konta, wygaśnięciu
                  współpracy, cofnięciu dostępu do danego materiału lub po upływie okresu retencji
                  określonego w Polityce Prywatności, chyba że obowiązujące przepisy wymagają dłuższego
                  przechowywania.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">V. Spotkania i mentoring</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Platforma może umożliwiać umawianie, odwoływanie, opisywanie i oznaczanie statusu
                  spotkań pomiędzy Użytkownikami.
                </li>
                <li>
                  Terminy spotkań, dostępność Mentorów, linki do spotkań oraz metody komunikacji mogą
                  zależeć od Integracji zewnętrznych. Usługodawca nie gwarantuje nieprzerwanego działania
                  tych narzędzi.
                </li>
                <li>
                  Mentorzy odpowiadają za własną dostępność, rzetelność informacji przekazywanych w
                  ramach swojego doświadczenia oraz za treści, które samodzielnie wprowadzają do
                  Platformy. Usługodawca może moderować lub usuwać takie treści, jeżeli naruszają
                  Regulamin Platformy lub prawo.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">VI. Zasady korzystania z Platformy</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Zabronione jest korzystanie z Platformy w sposób niezgodny z prawem, naruszający prawa
                  osób trzecich, zakłócający działanie Platformy lub prowadzący do obejścia zabezpieczeń.
                </li>
                <li>
                  Zabronione jest wgrywanie złośliwego oprogramowania, treści bezprawnych, treści
                  naruszających dobra osobiste, dane poufne osób trzecich bez podstawy prawnej oraz
                  materiałów, do których Użytkownik nie posiada praw.
                </li>
                <li>
                  Użytkownik nie może udostępniać swojego konta osobom trzecim ani wykorzystywać
                  Platformy do masowego pobierania danych, spamu, automatycznego scrapingu lub działań
                  konkurencyjnych sprzecznych z przeznaczeniem Platformy.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">VII. Dostępność i integracje</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Usługodawca podejmuje rozsądne działania, aby Platforma działała stabilnie, ale nie
                  gwarantuje jej stałej, nieprzerwanej ani bezbłędnej dostępności.
                </li>
                <li>
                  Platforma może być czasowo niedostępna z powodu prac technicznych, aktualizacji, awarii,
                  przeciążenia, decyzji dostawców infrastruktury lub zdarzeń niezależnych od Usługodawcy.
                </li>
                <li>
                  Integracje zewnętrzne podlegają regulaminom i politykom prywatności ich dostawców.
                  Usługodawca nie ponosi odpowiedzialności za zmiany, ograniczenia, awarie, opłaty,
                  usunięcie konta lub inne działania dostawców usług zewnętrznych.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">VIII. Odpowiedzialność</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  W najszerszym zakresie dopuszczalnym przez obowiązujące prawo Usługodawca nie ponosi
                  odpowiedzialności za szkody pośrednie, utracone korzyści, utratę szansy, utratę danych,
                  opóźnienia, niepowodzenie aplikacji, odmowę przyjęcia na uczelnię, odmowę stypendium,
                  odmowę wizy lub decyzje podmiotów trzecich.
                </li>
                <li>
                  Użytkownik korzysta z Materiałów, checklist, wskazówek, rekomendacji, komentarzy i
                  treści w Platformie na własną odpowiedzialność oraz powinien samodzielnie weryfikować
                  wymagania uczelni, instytucji, urzędów i organizacji stypendialnych.
                </li>
                <li>
                  Żadne postanowienie Regulaminu Platformy nie wyłącza ani nie ogranicza odpowiedzialności
                  Usługodawcy w zakresie, w jakim jej wyłączenie lub ograniczenie byłoby niedopuszczalne
                  na podstawie bezwzględnie obowiązujących przepisów prawa, w szczególności za szkodę
                  wyrządzoną umyślnie.
                </li>
                <li>
                  Jeżeli Użytkownik jest konsumentem, Regulamin Platformy nie ogranicza praw
                  przysługujących mu na podstawie bezwzględnie obowiązujących przepisów prawa
                  konsumenckiego.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">IX. Dane osobowe</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Zasady przetwarzania danych osobowych, w tym danych konta, danych formularzy, danych
                  wprowadzanych do Platformy, danych technicznych oraz danych związanych z cookies,
                  opisuje Polityka Prywatności dostępna pod adresem https://acadea.org/polityka-prywatnosci.
                </li>
                <li>
                  Użytkownik przyjmuje do wiadomości, że korzystanie z Platformy może wiązać się z
                  przetwarzaniem danych o charakterze prywatnym lub poufnym. Użytkownik powinien
                  wprowadzać wyłącznie dane potrzebne do korzystania z Platformy.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">X. Reklamacje i kontakt</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Reklamacje dotyczące działania Platformy można kierować na adres:
                  <a href="mailto:contact@acadea.org" className="text-primary hover:underline">
                    {" "}contact@acadea.org
                  </a>.
                </li>
                <li>
                  Reklamacja powinna zawierać dane umożliwiające kontakt z Użytkownikiem, opis problemu
                  oraz, jeżeli to możliwe, informacje pozwalające odtworzyć błąd.
                </li>
                <li>
                  Usługodawca rozpatruje reklamacje w rozsądnym terminie, nie dłuższym niż 30 dni od
                  otrzymania kompletnego zgłoszenia, chyba że charakter sprawy wymaga dłuższego czasu.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">XI. Zmiany Regulaminu Platformy</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Usługodawca może zmienić Regulamin Platformy w szczególności z powodu zmian prawa,
                  zmian funkcji Platformy, zmian organizacyjnych, bezpieczeństwa, integracji zewnętrznych
                  lub sposobu świadczenia usług.
                </li>
                <li>
                  Zmieniony Regulamin Platformy będzie publikowany na stronie Usługodawcy. Jeżeli zmiana
                  ma istotny wpływ na prawa lub obowiązki Użytkownika, Usługodawca może wymagać ponownej
                  akceptacji Regulaminu Platformy przy kolejnym logowaniu lub korzystaniu z wybranej
                  funkcji.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">XII. Prawo właściwe i spory</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  W sprawach nieuregulowanych Regulaminem Platformy stosuje się prawo polskie.
                </li>
                <li>
                  Wszelkie spory związane z Platformą będą rozstrzygane przez właściwe sądy powszechne
                  w Polsce, a w przypadku Użytkowników niebędących konsumentami - przez sąd właściwy
                  miejscowo dla siedziby Usługodawcy, o ile bezwzględnie obowiązujące przepisy prawa
                  nie stanowią inaczej.
                </li>
              </ol>
            </section>

            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mt-8">
              <p className="font-bold text-primary mb-1">Fundacja Acadea</p>
              <p>KRS: 0001240540 | NIP: 8982333798 | REGON: 544715960</p>
              <p>Jedności Narodowej 55-57 / 15, 50-262 Wrocław, Polska</p>
              <p>
                E-mail:{" "}
                <a href="mailto:contact@acadea.org" className="text-primary hover:underline">
                  contact@acadea.org
                </a>
              </p>
              <p>
                Tel:{" "}
                <a href="tel:+48728492936" className="text-primary hover:underline">
                  +48 728 492 936
                </a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
