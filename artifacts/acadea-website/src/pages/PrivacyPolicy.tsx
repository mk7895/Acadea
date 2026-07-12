import {
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebPageSchema,
  useSeo,
} from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

export default function PrivacyPolicy() {
  const { isEnglish } = useLanguage();

  useSeo({
    title: isEnglish ? "Privacy Policy | ACADEA" : "Polityka prywatności | ACADEA",
    description: isEnglish
      ? "ACADEA Privacy Policy: personal data processing, cookies, forms, platform data and user rights."
      : "Polityka prywatności ACADEA: informacje o przetwarzaniu danych osobowych, cookies, formularzach, platformie i prawach użytkownika.",
    path: isEnglish ? "/en/privacy-policy" : "/polityka-prywatnosci",
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebPageSchema({
        path: isEnglish ? "/en/privacy-policy" : "/polityka-prywatnosci",
        title: isEnglish ? "Privacy Policy | ACADEA" : "Polityka prywatności | ACADEA",
        description: isEnglish
          ? "A document describing privacy, cookies and personal data processing rules for ACADEA services."
          : "Dokument opisujący zasady prywatności, cookies i przetwarzania danych osobowych w serwisie ACADEA.",
      }),
      createBreadcrumbSchema([
        { name: isEnglish ? "Home" : "Strona Główna", path: isEnglish ? "/en" : "/" },
        { name: isEnglish ? "Privacy Policy" : "Polityka Prywatności", path: isEnglish ? "/en/privacy-policy" : "/polityka-prywatnosci" },
      ]),
    ],
  });

  if (isEnglish) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Privacy Policy</h1>
            <p className="text-gray-400 text-sm mb-10">Last updated: July 2026</p>

            <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">
              <p>
                This Privacy Policy explains how data is stored on, and accessed from, users' devices
                when they use the ACADEA website and platform, and how personal data voluntarily
                provided through our forms and services is collected and processed by the Controller.
              </p>
              <p>
                This Privacy Policy forms part of the Website Terms and the ACADEA Platform Terms,
                which define the rules, rights and obligations for users of the website and platform.
              </p>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">§1 Definitions</h2>
                <ul className="space-y-3">
                  <li><strong>Website</strong> — the ACADEA website available at https://acadea.org and https://app.acadea.org, including related forms, admin tools and the mentor/mentee platform.</li>
                  <li><strong>External service</strong> — websites or services of partners, providers or clients cooperating with the Controller.</li>
                  <li><strong>Controller</strong> — Fundacja Acadea, KRS: 0001240540, NIP: 8982333798, REGON: 544715960, registered at Jedności Narodowej 55-57 / 15, 50-262 Wroclaw, Poland.</li>
                  <li><strong>User</strong> — any individual using the website or platform, including a candidate, scholarship applicant, parent or legal guardian, mentor, mentee or platform user.</li>
                  <li><strong>Device</strong> — an electronic device and software used by the User to access the Website.</li>
                  <li><strong>Cookies</strong> — text files stored on the User's Device.</li>
                  <li><strong>GDPR</strong> — Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016.</li>
                  <li><strong>Personal data</strong> — information relating to an identified or identifiable natural person.</li>
                  <li><strong>Processing</strong> — any operation performed on personal data, whether automated or not.</li>
                  <li><strong>Consent</strong> — a freely given, specific, informed and unambiguous indication of the data subject's wishes.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">§2 Data Protection Officer</h2>
                <p>
                  The Controller has not appointed a Data Protection Officer under Article 37 GDPR.
                  For matters concerning data processing, including personal data, please contact us at{" "}
                  <a href="mailto:contact@acadea.org" className="text-primary hover:underline">contact@acadea.org</a>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">§3 Types of cookies</h2>
                <ul className="space-y-2">
                  <li><strong>First-party cookies</strong> — cookies placed and read by ACADEA's systems.</li>
                  <li><strong>Third-party cookies</strong> — cookies placed and read by external service providers.</li>
                  <li><strong>Session cookies</strong> — cookies removed automatically after a browser session ends.</li>
                  <li><strong>Persistent cookies</strong> — cookies stored until the User deletes them or until they expire.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">§4 Data storage security</h2>
                <p>The Controller applies appropriate technical and organisational measures to protect cookie data and personal data. First-party cookies do not contain scripts that threaten device security.</p>
                <p className="mt-3">Users may change cookie storage, deletion and access settings in their browser at any time.</p>
                <p className="mt-3">We take reasonable steps to ensure that personal data is processed securely, access is limited and data is used only for its intended purposes.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">§5 Purposes of cookies</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Improving and simplifying access to the Website and platform.</li>
                  <li>Personalising the service for Users.</li>
                  <li>Marketing and remarketing through external services, where permitted.</li>
                  <li>Analytics and statistics, including visits, device types and traffic measurement.</li>
                  <li>Social media features and communication channels.</li>
                  <li>Remembering session interface choices, such as closed information banners or popups.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">§6 Purposes and legal bases for personal data processing</h2>
                <p>Personal data may be processed for the following purposes and legal bases:</p>
                <ul className="list-disc pl-5 mt-3 space-y-2">
                  <li>Handling contact forms, mentor forms, newsletters and booking requests under Article 6(1)(b) or 6(1)(f) GDPR, depending on the request.</li>
                  <li>Receiving, assessing and administering ACADEA Scholarship applications, selecting recipients and running the programme under Article 6(1)(b) and 6(1)(f) GDPR.</li>
                  <li>For minors: documenting parental or legal guardian consent where required, under Article 6(1)(c), 6(1)(f) and, where applicable, 6(1)(a) GDPR.</li>
                  <li>Creating and securing user accounts on app.acadea.org, including login, password reset, sessions, roles and material access under Article 6(1)(b) and 6(1)(f) GDPR.</li>
                  <li>Operating guides, materials, tips, meetings, mailboxes and other platform data under Article 6(1)(b) and 6(1)(f) GDPR.</li>
                  <li>Protecting the Website and platform against spam, abuse and automated attacks, and keeping technical and audit logs under Article 6(1)(f) GDPR.</li>
                  <li>Analytics, statistics and service improvement under Article 6(1)(f) GDPR and, where required, on the basis of consent for analytics or marketing cookies.</li>
                  <li>Establishing, pursuing or defending claims and demonstrating compliance with legal obligations under Article 6(1)(c) and 6(1)(f) GDPR.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">§7 Third-party cookies and services</h2>
                <p>We may use scripts and web components from external providers that can place their own cookies, including:</p>
                <ul className="list-disc pl-5 mt-3 space-y-1">
                  <li>Google tag / Google Analytics for statistics and traffic measurement.</li>
                  <li>Google Ads and related Google tools if used for marketing or remarketing.</li>
                  <li>Cloudflare Turnstile for anti-spam and abuse protection.</li>
                  <li>Google Maps, YouTube, Facebook, Instagram and WhatsApp where embedded or linked.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">§8 Types of data collected</h2>
                <p><strong>Automatically collected anonymous data:</strong> IP address, browser type, screen resolution, approximate location, visited pages, time spent, operating system and internet provider.</p>
                <p className="mt-3"><strong>Form data:</strong> full name, email, phone number, message content, study preferences, scholarship form information, mentor form information and booking details.</p>
                <p className="mt-3"><strong>Platform data:</strong> account data, role and status, session data, cookie consents, mentor and mentee profiles, meetings, guides, materials and information entered into platform forms or panels.</p>
                <p className="mt-3"><strong>Technical and security data:</strong> session tokens stored locally in the browser, password-reset information, anti-spam responses and technical security logs.</p>
                <p className="mt-3"><strong>Interface data:</strong> cookie settings, selected time zone and closed banners or popups.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">§9 Third-party access to personal data</h2>
                <p>As a rule, the Controller is the only recipient of personal data provided by Users. Data is not sold. It may be shared where required by law or where necessary to provide the service.</p>
                <p className="mt-3">Data may be entrusted to providers supporting hosting, databases, email delivery, anti-spam protection, analytics, advertising, calendar handling, Google tools and other technical services used by the Website and platform.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">§10 User rights</h2>
                <p>Each User has the right to:</p>
                <ul className="list-disc pl-5 mt-3 space-y-1">
                  <li>Access their personal data.</li>
                  <li>Rectify, erase or restrict processing.</li>
                  <li>Object to processing.</li>
                  <li>Data portability.</li>
                  <li>Withdraw consent at any time.</li>
                  <li>Lodge a complaint with the competent supervisory authority in Poland.</li>
                </ul>
                <p className="mt-3">To exercise these rights, please contact: <a href="mailto:contact@acadea.org" className="text-primary hover:underline">contact@acadea.org</a>.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">§11 Controller contact details</h2>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <p><strong>Fundacja Acadea</strong></p>
                  <p>KRS: 0001240540 | NIP: 8982333798 | REGON: 544715960</p>
                  <p>Jedności Narodowej 55-57 / 15, 50-262 Wroclaw, Poland</p>
                  <p>E-mail: <a href="mailto:contact@acadea.org" className="text-primary hover:underline">contact@acadea.org</a></p>
                  <p>Phone: <a href="tel:+48728492936" className="text-primary hover:underline">+48 728 492 936</a></p>
                </div>
              </section>
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
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Polityka Prywatności</h1>
          <p className="text-gray-400 text-sm mb-10">Ostatnia aktualizacja: lipiec 2026</p>

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
                <li><strong>Użytkownik</strong> — osoba fizyczna korzystająca z Serwisu, w tym kandydat lub kandydatka do programu stypendialnego, rodzic lub opiekun prawny kandydata, mentor lub mentorka, mentee albo użytkownik platformy</li>
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
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">§6 Cele i podstawy prawne przetwarzania danych osobowych</h2>
              <p>
                Dane osobowe podane przez Użytkowników mogą być przetwarzane w następujących celach i na następujących podstawach prawnych:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li>
                  obsługa formularza kontaktowego, formularza mentorskiego, newslettera oraz rezerwacji spotkań — na podstawie art. 6 ust. 1 lit. b lub f RODO, w zależności od charakteru zgłoszenia;
                </li>
                <li>
                  przyjęcie i ocena zgłoszenia do Konkursu Stypendialnego ACADEA, kontakt z kandydatem, przeprowadzenie konkursu, wybór stypendystów oraz realizacja programu stypendialnego — na podstawie art. 6 ust. 1 lit. b i f RODO;
                </li>
                <li>
                  w przypadku osoby niepełnoletniej: obsługa i udokumentowanie zgody rodzica lub opiekuna prawnego na udział w konkursie oraz na przetwarzanie danych niezbędnych do przeprowadzenia konkursu — na podstawie art. 6 ust. 1 lit. c, f oraz, gdy jest to wymagane, art. 6 ust. 1 lit. a RODO;
                </li>
                <li>
                  prowadzenie i zabezpieczenie kont użytkowników w platformie <strong>app.acadea.org</strong>, w tym logowanie, reset hasła, utrzymanie sesji, zarządzanie rolami i dostępem do materiałów — na podstawie art. 6 ust. 1 lit. b oraz f RODO;
                </li>
                <li>
                  obsługa przewodników, materiałów, wskazówek, spotkań, skrzynek mailowych i innych danych przetwarzanych w platformie w ramach usług ACADEA — na podstawie art. 6 ust. 1 lit. b oraz f RODO;
                </li>
                <li>
                  zapewnienie bezpieczeństwa Serwisu i platformy, ochrona przed spamem, nadużyciami i automatycznymi atakami, prowadzenie logów technicznych i audytowych — na podstawie art. 6 ust. 1 lit. f RODO;
                </li>
                <li>
                  analityka, statystyka oraz ulepszanie Serwisu — na podstawie art. 6 ust. 1 lit. f RODO, a w zakresie cookies marketingowych lub analitycznych także na podstawie zgody, jeśli jest wymagana;
                </li>
                <li>
                  dochodzenie lub obrona przed roszczeniami oraz wykazanie zgodności działań Administratora z obowiązkami prawnymi — na podstawie art. 6 ust. 1 lit. c i f RODO.
                </li>
              </ul>
              <p className="mt-3">
                Dane o Użytkownikach gromadzone anonimowo i automatycznie mogą być przetwarzane w celach statystycznych, bezpieczeństwa oraz — jeżeli Użytkownik wyraził odpowiednią zgodę — marketingowych.
              </p>
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
