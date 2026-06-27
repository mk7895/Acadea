export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Polityka Cookies</h1>
          <p className="text-gray-400 text-sm mb-10">Ostatnia aktualizacja: czerwiec 2026</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">
            <p>
              Ta strona wyjaśnia, jakie pliki cookies i podobne technologie mogą być używane w serwisie
              ACADEA, do czego służą oraz jak możesz zarządzać swoimi preferencjami.
            </p>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">1. Jakich kategorii używamy</h2>
              <ul className="space-y-3">
                <li>
                  <strong>Niezbędne</strong> — odpowiadają za podstawowe działanie strony i bezpieczeństwo
                  formularzy, w tym ochronę przed spamem i nadużyciami.
                </li>
                <li>
                  <strong>Preferencje</strong> — pozwalają zapamiętać wybrane ustawienia użytkownika, np.
                  preferowaną strefę czasową przy rezerwacji konsultacji.
                </li>
                <li>
                  <strong>Analityczne</strong> — będą używane po wdrożeniu narzędzi pomiaru ruchu, takich jak
                  Google Analytics.
                </li>
                <li>
                  <strong>Marketingowe</strong> — będą używane po wdrożeniu narzędzi reklamowych i
                  remarketingowych.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">2. Jakie cookies stosujemy obecnie</h2>
              <ul className="space-y-3">
                <li>
                  <strong>acadea_cookie_consent_v1</strong> — zapamiętuje Twój wybór dotyczący zgody na
                  poszczególne kategorie cookies.
                </li>
                <li>
                  <strong>acadea_timezone</strong> — zapamiętuje wybraną strefę czasową przy formularzu
                  rezerwacji, ale tylko wtedy, gdy wyrazisz zgodę na cookies preferencji.
                </li>
              </ul>
              <p className="mt-3">
                Dodatkowo formularze korzystają z zabezpieczeń antyspamowych Cloudflare Turnstile, które mogą
                używać własnych technicznych mechanizmów bezpieczeństwa niezbędnych do ochrony strony.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">3. Zarządzanie zgodą</h2>
              <p>
                Przy pierwszej wizycie możesz zaakceptować wszystkie cookies, odrzucić opcjonalne albo
                dostosować wybór. W każdej chwili możesz zmienić ten wybór ponownie.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">4. Jak usunąć cookies</h2>
              <p>
                Możesz usunąć zapisane cookies w ustawieniach swojej przeglądarki. Pamiętaj jednak, że
                usunięcie cookies niezbędnych lub preferencji może wpłynąć na wygodę korzystania ze strony.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
