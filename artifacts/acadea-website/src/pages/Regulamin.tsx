import {
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebPageSchema,
  useSeo,
} from "@/lib/seo";
import { useLanguage } from "@/lib/i18n";

export default function Regulamin() {
  const { isEnglish } = useLanguage();

  useSeo({
    title: isEnglish ? "Website Terms | ACADEA" : "Regulamin serwisu | ACADEA",
    description: isEnglish
      ? "ACADEA Website Terms covering the website, forms, booking system and electronic communication."
      : "Regulamin serwisu ACADEA określający zasady korzystania z witryny, formularzy, rezerwacji spotkań i komunikacji elektronicznej.",
    path: isEnglish ? "/en/terms" : "/regulamin",
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebPageSchema({
        path: isEnglish ? "/en/terms" : "/regulamin",
        title: isEnglish ? "Website Terms | ACADEA" : "Regulamin serwisu | ACADEA",
        description: isEnglish
          ? "Terms of use for the ACADEA website, including forms, bookings and liability rules."
          : "Regulamin korzystania z serwisu ACADEA wraz z zasadami formularzy, rezerwacji i odpowiedzialności.",
      }),
      createBreadcrumbSchema([
        { name: isEnglish ? "Home" : "Strona Główna", path: isEnglish ? "/en" : "/" },
        { name: isEnglish ? "Terms" : "Regulamin", path: isEnglish ? "/en/terms" : "/regulamin" },
      ]),
    ],
  });

  if (isEnglish) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Website Terms</h1>
            <p className="text-gray-400 text-sm mb-10">Last updated: January 2025</p>

            <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-primary mt-4 mb-4">I. General definitions</h2>
                <ul className="space-y-2">
                  <li><strong>Terms</strong> — these website terms.</li>
                  <li><strong>Website</strong> — the ACADEA website available at https://acadea.org.</li>
                  <li><strong>Service Provider</strong> — Fundacja Acadea, KRS: 0001240540, NIP: 8982333798, REGON: 544715960, registered at Jedności Narodowej 55-57 / 15, 50-262 Wroclaw, Poland.</li>
                  <li><strong>Service User</strong> — any individual accessing the Website and using services provided through it.</li>
                  <li><strong>Electronic Communication</strong> — communication between parties by email and website forms.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">II. General provisions</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>These Terms define the operation and use of the Website and the rights and obligations of Users and the Service Provider.</li>
                  <li>The Website provides free online tools, content, articles, audiovisual materials and electronic forms.</li>
                  <li>Content, articles and information published on the Website are general information only and are not individual advice addressed to a specific User.</li>
                  <li>The User is fully responsible for how they use materials made available through the Website.</li>
                  <li>The Service Provider is not liable for damage suffered by Users or third parties in connection with use of the Website, except where liability cannot be excluded under mandatory law.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">III. Conditions for using the Website</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Use of the Website is free and voluntary.</li>
                  <li>Users should read and accept these Terms before continuing to use the Website.</li>
                  <li>Users may not use personal data obtained through the Website for marketing purposes.</li>
                  <li>Technical requirements:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>a device with a display capable of showing web pages;</li>
                      <li>internet access;</li>
                      <li>a web browser supporting HTML5;</li>
                      <li>JavaScript enabled;</li>
                      <li>cookies enabled where required for specific functions.</li>
                    </ul>
                  </li>
                  <li>Actions that disrupt the Website are prohibited, including decompiling source code without written consent, attempting to detect security vulnerabilities or uploading harmful code.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">IV. Forms and booking conditions</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Using contact forms and the meeting booking system is free and voluntary.</li>
                  <li>By sending an enquiry or booking a meeting, the User agrees to the processing of personal data for the purpose of handling the request.</li>
                  <li>The Service Provider may refuse to provide a service without giving a reason.</li>
                  <li>Consultations are held via Zoom or another tool indicated by the Service Provider. The Service Provider is not responsible for third-party tools.</li>
                  <li>A free consultation is an introductory information meeting. Any further cooperation is agreed individually.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">V. Newsletter and WhatsApp group terms</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Joining a WhatsApp group or subscribing to a newsletter is voluntary and free.</li>
                  <li>The User may leave the group or unsubscribe from the newsletter at any time.</li>
                  <li>The Service Provider may remove a User from a group or mailing list if the User breaches standards of respectful communication or these Terms.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">VI. Website communication</h2>
                <p>The Website provides tools for User interaction:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>contact form;</li>
                  <li>online meeting booking system;</li>
                  <li>mentor application form.</li>
                </ul>
                <p className="mt-3">Contact details:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Email: <a href="mailto:contact@acadea.org" className="text-primary hover:underline">contact@acadea.org</a></li>
                  <li>Phone: <a href="tel:+48728492936" className="text-primary hover:underline">+48 728 492 936</a></li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">VII. Collection of User data</h2>
                <p>To provide services properly, the Website collects and processes User data in accordance with the Privacy Policy, which forms part of these Terms.</p>
                <p className="mt-3">Automatically collected data may include IP address, browser type, screen resolution, approximate location, visited pages, time spent on the Website and operating system.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">VIII. Copyright</h2>
                <p>The Website and copyright to the Website are owned by the Service Provider. Copying, reproducing or using content, graphics, video or audio from the Website without written permission is prohibited unless permitted by mandatory law.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">IX. Changes to the Terms</h2>
                <p>The Service Provider may amend these Terms at any time. Changes apply from the moment they are published on the Website. Continued use after publication means acceptance of the changes.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary mt-8 mb-4">X. Final provisions</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Polish law applies to matters not regulated by these Terms.</li>
                  <li>Disputes arising from use of the Website will be resolved by the competent common court.</li>
                  <li>These Terms enter into force on the date of publication on the Website.</li>
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
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Regulamin Serwisu</h1>
          <p className="text-gray-400 text-sm mb-10">Ostatnia aktualizacja: styczeń 2025</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-primary mt-4 mb-4">I. Pojęcia ogólne</h2>
              <ul className="space-y-2">
                <li><strong>Regulamin</strong> — niniejszy regulamin</li>
                <li><strong>Serwis</strong> — serwis internetowy „ACADEA", działający pod adresem https://acadea.org</li>
                <li><strong>Usługodawca</strong> — <strong>Fundacja Acadea</strong>, KRS: 0001240540, NIP: 8982333798, REGON: 544715960, z siedzibą: Jedności Narodowej 55-57 / 15, 50-262 Wrocław, Polska</li>
                <li><strong>Usługobiorca</strong> — każda osoba fizyczna, uzyskująca dostęp do Serwisu i korzystająca z usług świadczonych za pośrednictwem Serwisu przez Usługodawcę</li>
                <li><strong>Komunikacja Drogą Elektroniczną</strong> — komunikacja pomiędzy stronami za pośrednictwem poczty elektronicznej (e-mail) oraz formularzy kontaktowych dostępnych na stronie</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">II. Postanowienia ogólne</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>Regulamin określa zasady funkcjonowania i użytkowania Serwisu oraz zakres praw i obowiązków Usługobiorców i Usługodawcy związanych z użytkowaniem Serwisu.</li>
                <li>Przedmiotem usług Usługodawcy jest udostępnienie nieodpłatnych narzędzi w postaci Serwisu, umożliwiających Usługobiorcom dostęp do treści w postaci wpisów, artykułów i materiałów audiowizualnych oraz formularzy elektronicznych.</li>
                <li>Wszelkie treści, artykuły i informacje zawierające cechy wskazówek lub porad publikowane w Serwisie są jedynie ogólnym zbiorem informacji i nie są kierowane do poszczególnych Usługobiorców. Usługodawca nie ponosi odpowiedzialności za wykorzystanie ich przez Usługobiorców.</li>
                <li>Usługobiorca bierze na siebie pełną odpowiedzialność za sposób wykorzystania materiałów udostępnianych w ramach Serwisu.</li>
                <li>Usługodawca nie ponosi odpowiedzialności z tytułu ewentualnych szkód poniesionych przez Usługobiorców lub osoby trzecie w związku z korzystaniem z Serwisu.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">III. Warunki używania Serwisu</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>Używanie Serwisu przez każdego z Usługobiorców jest nieodpłatne i dobrowolne.</li>
                <li>Usługobiorcy mają obowiązek zapoznania się z Regulaminem i akceptują jego postanowienia w całości w celu dalszego korzystania z Serwisu.</li>
                <li>Usługobiorcy nie mogą wykorzystywać żadnych pozyskanych w Serwisie danych osobowych do celów marketingowych.</li>
                <li>Wymagania techniczne korzystania z Serwisu:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>urządzenie z wyświetlaczem umożliwiające wyświetlanie stron internetowych</li>
                    <li>połączenie z internetem</li>
                    <li>dowolna przeglądarka internetowa obsługująca HTML5</li>
                    <li>włączona obsługa skryptów JavaScript</li>
                    <li>włączona obsługa plików Cookie</li>
                  </ul>
                </li>
                <li>Zabrania się działań mogących zakłócać funkcjonowanie Serwisu, w tym: dekompilacji kodu źródłowego bez pisemnej zgody, prób wykrycia luk w zabezpieczeniach, wgrywania kodu mogącego wyrządzić szkodę oprogramowaniu Serwisu lub innym Usługobiorcom.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">IV. Warunki korzystania z formularzy i rezerwacji</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>Korzystanie z formularzy kontaktowych i systemu rezerwacji spotkań jest bezpłatne i dobrowolne.</li>
                <li>Składając zapytanie lub rezerwując spotkanie, Usługobiorca wyraża zgodę na przetwarzanie swoich danych osobowych przez Usługodawcę w celu realizacji usługi.</li>
                <li>Usługodawca zastrzega sobie prawo do odmowy świadczenia usług bez podania przyczyny.</li>
                <li>Spotkania konsultacyjne odbywają się przez Zoom lub inne narzędzia wskazane przez Usługodawcę. Usługodawca nie ponosi odpowiedzialności za działanie narzędzi zewnętrznych.</li>
                <li>Bezpłatna konsultacja stanowi wstępne spotkanie informacyjne. Szczegółowe warunki ewentualnej dalszej współpracy ustalane są indywidualnie.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">V. Warunki świadczenia usługi Newsletter / Grupy WhatsApp</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>Dołączenie do grupy WhatsApp lub zapisanie się do newslettera jest dobrowolne i bezpłatne.</li>
                <li>Usługobiorca może w dowolnym momencie opuścić grupę lub wypisać się z newslettera.</li>
                <li>Usługodawca zastrzega sobie prawo do usunięcia Usługobiorcy z grupy lub listy mailingowej w przypadku naruszenia zasad kultury lub niniejszego Regulaminu.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">VI. Warunki komunikacji w Serwisie</h2>
              <p>Serwis udostępnia usługi i narzędzia umożliwiające Usługobiorcom interakcję:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Formularz kontaktowy</li>
                <li>System rezerwacji spotkań online</li>
                <li>Formularz aplikacji dla mentorów</li>
              </ul>
              <p className="mt-3">Serwis udostępnia dane kontaktowe:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Adres e-mail: <a href="mailto:contact@acadea.org" className="text-primary hover:underline">contact@acadea.org</a></li>
                <li>Telefon: <a href="tel:+48728492936" className="text-primary hover:underline">+48 728 492 936</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">VII. Gromadzenie danych o Usługobiorcach</h2>
              <p>W celu prawidłowego świadczenia usług Serwis gromadzi i przetwarza dane o Użytkownikach zgodnie z Polityką Prywatności stanowiącą integralną część niniejszego Regulaminu.</p>
              <p className="mt-3">Dane zbierane automatycznie: adres IP, typ przeglądarki, rozdzielczość ekranu, przybliżona lokalizacja, odwiedzone podstrony, czas spędzony na Serwisie, rodzaj systemu operacyjnego.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">VIII. Prawa autorskie</h2>
              <p>Właścicielem Serwisu oraz praw autorskich do Serwisu jest Usługodawca. Na podstawie Ustawy z dnia 4 lutego 1994 o prawie autorskim zabrania się wykorzystywania, kopiowania lub reprodukowania w jakiejkolwiek formie jakichkolwiek treści, materiałów graficznych, wideo lub audio znajdujących się w Serwisie bez pisemnej zgody ich prawnego właściciela.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">IX. Zmiany Regulaminu</h2>
              <p>Usługodawca zastrzega sobie prawo do zmiany niniejszego Regulaminu w dowolnym czasie. Zmiany wchodzą w życie z chwilą ich opublikowania w Serwisie. Dalsze korzystanie z Serwisu po opublikowaniu zmian oznacza ich akceptację.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">X. Postanowienia końcowe</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>W sprawach nieuregulowanych niniejszym Regulaminem stosuje się przepisy prawa polskiego.</li>
                <li>Wszelkie spory wynikające z korzystania z Serwisu będą rozstrzygane przez właściwy sąd powszechny.</li>
                <li>Regulamin wchodzi w życie z dniem opublikowania w Serwisie.</li>
              </ol>
            </section>

            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mt-8">
              <p className="font-bold text-primary mb-1">Fundacja Acadea</p>
              <p>KRS: 0001240540 | NIP: 8982333798 | REGON: 544715960</p>
              <p>Jedności Narodowej 55-57 / 15, 50-262 Wrocław, Polska</p>
              <p>E-mail: <a href="mailto:contact@acadea.org" className="text-primary hover:underline">contact@acadea.org</a></p>
              <p>Tel: <a href="tel:+48728492936" className="text-primary hover:underline">+48 728 492 936</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
