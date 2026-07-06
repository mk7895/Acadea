import {
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebPageSchema,
  useSeo,
} from "@/lib/seo";

export default function PrivacyPolicy() {
  useSeo({
    title: "Polityka prywatności | ACADEA",
    description:
      "Polityka prywatności ACADEA: informacje o przetwarzaniu danych osobowych, cookies, formularzach, platformie i prawach użytkownika.",
    path: "/polityka-prywatnosci",
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebPageSchema({
        path: "/polityka-prywatnosci",
        title: "Polityka prywatności | ACADEA",
        description:
          "Dokument opisujący zasady prywatności, cookies i przetwarzania danych osobowych w serwisie ACADEA.",
      }),
      createBreadcrumbSchema([
        { name: "Strona Główna", path: "/" },
        { name: "Polityka Prywatności", path: "/polityka-prywatnosci" },
      ]),
    ],
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Polityka Prywatności</h1>
          <p className="text-gray-400 text-sm mb-10">Ostatnia aktualizacja: czerwiec 2026</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">
            <p>
              Poniższa Polityka Prywatności określa zasady zapisywania i uzyskiwania dostępu do danych na Urządzeniach Użytkowników korzystających z Serwisu do celów świadczenia usług drogą elektroniczną przez Administratora oraz zasady gromadzenia i przetwarzania danych osobowych Użytkowników, które zostały podane przez nich osobiście i dobrowolnie za pośrednictwem narzędzi dostępnych w Serwisie.
            </p>
            <p>
              Poniższa Polityka Prywatności jest integralną częścią Regulaminu Serwisu oraz Regulaminu Platformy ACADEA, które określają zasady, prawa i obowiązki Użytkowników korzystających z Serwisu i Platformy.
            </p>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">§1 Definicje</h2>
              <ul className="space-y-3">
                <li><strong>Serwis</strong> — serwis internetowy „ACADEA" działający pod adresami https://acadea.org oraz https://app.acadea.org, wraz z powiązanymi formularzami, panelem administracyjnym i platformą dla mentorów oraz mentee</li>
                <li><strong>Serwis zewnętrzny</strong> — serwisy internetowe partnerów, usługodawców lub usługobiorców współpracujących z Administratorem</li>
                <li><strong>Administrator Serwisu / Danych</strong> — Administratorem Serwisu oraz Administratorem Danych (dalej Administrator) jest <strong>Fundacja Acadea</strong>, KRS: 0001240540, NIP: 8982333798, REGON: 544715960, z siedzibą: Jedności Narodowej 55-57 / 15, 50-262 Wrocław, świadcząca usługi drogą elektroniczną za pośrednictwem Serwisu</li>
                <li><strong>Użytkownik</strong> — osoba fizyczna, dla której Administrator świadczy usługi drogą elektroniczną za pośrednictwem Serwisu, w tym kandydat(ka), rodzic, mentor(ka), mentee lub administrator platformy</li>
                <li><strong>Urządzenie</strong> — elektroniczne urządzenie wraz z oprogramowaniem, za pośrednictwem którego Użytkownik uzyskuje dostęp do Serwisu</li>
                <li><strong>Cookies (ciasteczka)</strong> — dane tekstowe gromadzone w formie plików zamieszczanych na Urządzeniu Użytkownika</li>
                <li><strong>RODO</strong> — Rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych</li>
                <li><strong>Dane osobowe</strong> — oznaczają informacje o zidentyfikowanej lub możliwej do zidentyfikowania osobie fizycznej</li>
                <li><strong>Przetwarzanie</strong> — oznacza operację lub zestaw operacji wykonywanych na danych osobowych w sposób zautomatyzowany lub niezautomatyzowany</li>
                <li><strong>Zgoda</strong> — dobrowolne, konkretne, świadome i jednoznaczne okazanie woli, którym osoba przyzwala na przetwarzanie jej danych osobowych</li>
                <li><strong>Anonimizacja</strong> — nieodwracalny proces operacji na danych, który uniemożliwia identyfikację lub powiązanie danego rekordu z konkretnym użytkownikiem</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">§2 Inspektor Ochrony Danych</h2>
              <p>Na podstawie Art. 37 RODO, Administrator nie powołał Inspektora Ochrony Danych. W sprawach dotyczących przetwarzania danych, w tym danych osobowych, należy kontaktować się bezpośrednio z Administratorem pod adresem: <a href="mailto:contact@acadea.org" className="text-primary hover:underline">contact@acadea.org</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">§3 Rodzaje Plików Cookies</h2>
              <ul className="space-y-2">
                <li><strong>Cookies wewnętrzne</strong> — pliki zamieszczane i odczytywane z Urządzenia Użytkownika przez system teleinformatyczny Serwisu</li>
                <li><strong>Cookies zewnętrzne</strong> — pliki zamieszczane i odczytywane z Urządzenia Użytkownika przez systemy teleinformatyczne Serwisów zewnętrznych</li>
                <li><strong>Cookies sesyjne</strong> — pliki usuwane automatycznie po zakończeniu sesji Urządzenia</li>
                <li><strong>Cookies trwałe</strong> — pliki przechowywane do momentu ich ręcznego usunięcia przez Użytkownika</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">§4 Bezpieczeństwo składowania danych</h2>
              <p>Administrator stosuje wszelkie możliwe środki techniczne w celu zapewnienia bezpieczeństwa danych umieszczanych w plikach Cookie. Pliki Cookie wewnętrzne są bezpieczne dla Urządzeń Użytkowników i nie zawierają skryptów mogących zagrażać bezpieczeństwu danych osobowych.</p>
              <p className="mt-3">Użytkownik może w dowolnym momencie samodzielnie zmienić ustawienia dotyczące zapisywania, usuwania oraz dostępu do danych zapisanych plików Cookies w ustawieniach swojej przeglądarki.</p>
              <p className="mt-3">Administrator zapewnia, że dokonuje wszelkich starań, by przetwarzane dane osobowe były bezpieczne, a dostęp do nich był ograniczony i realizowany zgodnie z ich przeznaczeniem.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">§5 Cele do których wykorzystywane są pliki Cookie</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Usprawnienie i ułatwienie dostępu do Serwisu</li>
                <li>Personalizacja Serwisu dla Użytkowników</li>
                <li>Marketing i remarketing w serwisach zewnętrznych</li>
                <li>Prowadzenie statystyk (użytkowników, ilości odwiedzin, rodzajów urządzeń)</li>
                <li>Świadczenie usług społecznościowych</li>
                <li>Zapamiętanie w trakcie sesji zamknięcia komunikatów i popupów informacyjnych wyświetlanych w Serwisie</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">§6 Cele przetwarzania danych osobowych</h2>
              <p>Dane osobowe dobrowolnie podane przez Użytkowników są przetwarzane w jednym z następujących celów:</p>
              <ul className="list-disc pl-5 mt-3 space-y-1">
                <li>Realizacja usług elektronicznych (formularz kontaktowy, rezerwacja spotkań, newsletter, formularz stypendialny, formularz zgłoszenia mentora)</li>
                <li>Komunikacja Administratora z Użytkownikami w sprawach związanych z Serwisem</li>
                <li>Obsługa kont użytkowników w platformie `app.acadea.org`, w tym logowania, resetu hasła, zarządzania rolami oraz utrzymania sesji użytkownika</li>
                <li>Obsługa profili mentorów i mentee, przewodników, materiałów, zapisów na spotkania oraz danych podawanych w ramach procesu aplikacyjnego i mentoringowego</li>
                <li>Zapewnienie bezpieczeństwa Serwisu, wykrywanie nadużyć oraz ochrona formularzy i logowania przed spamem i automatycznymi atakami</li>
                <li>Zapewnienie prawnie uzasadnionego interesu Administratora</li>
              </ul>
              <p className="mt-3">Dane o Użytkownikach gromadzone anonimowo i automatycznie są przetwarzane w celach statystycznych oraz remarketingowych.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">§7 Pliki Cookies Serwisów zewnętrznych</h2>
              <p>Administrator w Serwisie może wykorzystywać skrypty javascript i komponenty webowe partnerów, którzy mogą umieszczać własne pliki cookies na Urządzeniu Użytkownika, w tym:</p>
              <ul className="list-disc pl-5 mt-3 space-y-1">
                <li>Google tag / Google Analytics (statystyki i pomiar ruchu)</li>
                <li>Google Ads i powiązane narzędzia Google, jeśli zostaną uruchomione do celów marketingowych i remarketingowych</li>
                <li>Cloudflare Turnstile (ochrona formularzy i logowania przed spamem oraz nadużyciami)</li>
                <li>Google Maps (mapy)</li>
                <li>YouTube (multimedia)</li>
                <li>Facebook, Instagram, WhatsApp (media społecznościowe i kanały komunikacji)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">§8 Rodzaje gromadzonych danych</h2>
              <p><strong>Anonimowe dane gromadzone automatycznie:</strong> adres IP, typ przeglądarki, rozdzielczość ekranu, przybliżona lokalizacja, otwierane podstrony, czas spędzony na podstronie, rodzaj systemu operacyjnego, dostawca usług internetowych.</p>
              <p className="mt-3"><strong>Dane gromadzone podczas korzystania z formularzy:</strong> imię i nazwisko, adres e-mail, numer telefonu, treść wiadomości, preferencje dotyczące studiów, informacje przekazywane w formularzu stypendialnym, formularzu mentorskim oraz podczas rezerwacji spotkania.</p>
              <p className="mt-3"><strong>Dane gromadzone w platformie `app.acadea.org`:</strong> dane konta użytkownika, rola i status użytkownika, dane sesji, zgody cookies, profile mentorów i mentee, informacje o spotkaniach, przewodnikach, materiałach oraz dane wpisywane przez użytkownika do formularzy i paneli platformy.</p>
              <p className="mt-3"><strong>Dane techniczne i bezpieczeństwa:</strong> tokeny sesji przechowywane lokalnie w przeglądarce, dane związane z resetem hasła, odpowiedzi mechanizmów antyspamowych oraz logi techniczne związane z bezpieczeństwem i działaniem usług.</p>
              <p className="mt-3"><strong>Dane interfejsu:</strong> informacje o zaakceptowanych ustawieniach cookies, wybranej strefie czasowej oraz zamknięciu komunikatów lub popupów w trakcie danej sesji przeglądarki.</p>
              <p className="mt-3">Część danych (bez danych identyfikujących) może być przechowywana w plikach cookies, localStorage lub sessionStorage przeglądarki albo przekazywana do dostawców usług statystycznych, reklamowych, bezpieczeństwa lub infrastruktury technicznej.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">§9 Dostęp do danych osobowych przez podmioty trzecie</h2>
              <p>Co do zasady jedynym odbiorcą danych osobowych podawanych przez Użytkowników jest Administrator. Dane gromadzone w ramach świadczonych usług nie są przekazywane ani odsprzedawane podmiotom trzecim, z wyjątkiem sytuacji wymaganych przez prawo lub niezbędnych do świadczenia usługi.</p>
              <p className="mt-3">Dane mogą być powierzane podmiotom wspierającym Administratora w zakresie hostingu, baz danych, poczty elektronicznej, ochrony antyspamowej, analityki, reklamy, obsługi kalendarzy i narzędzi Google lub innych usług technicznych wykorzystywanych przez Serwis i platformę.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">§10 Prawa Użytkowników</h2>
              <p>Każdy Użytkownik ma prawo do:</p>
              <ul className="list-disc pl-5 mt-3 space-y-1">
                <li>Dostępu do swoich danych osobowych</li>
                <li>Sprostowania, usunięcia lub ograniczenia przetwarzania danych</li>
                <li>Wniesienia sprzeciwu wobec przetwarzania danych</li>
                <li>Przenoszenia danych</li>
                <li>Cofnięcia zgody w dowolnym momencie</li>
                <li>Wniesienia skargi do organu nadzorczego (Prezes UODO)</li>
              </ul>
              <p className="mt-3">W celu realizacji powyższych praw prosimy o kontakt: <a href="mailto:contact@acadea.org" className="text-primary hover:underline">contact@acadea.org</a></p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">§11 Kontakt do Administratora</h2>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <p><strong>Fundacja Acadea</strong></p>
                <p>KRS: 0001240540 | NIP: 8982333798 | REGON: 544715960</p>
                <p>Jedności Narodowej 55-57 / 15, 50-262 Wrocław, Polska</p>
                <p>E-mail: <a href="mailto:contact@acadea.org" className="text-primary hover:underline">contact@acadea.org</a></p>
                <p>Tel: <a href="tel:+48728492936" className="text-primary hover:underline">+48 728 492 936</a></p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
