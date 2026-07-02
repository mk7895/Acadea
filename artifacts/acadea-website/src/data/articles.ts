import type { ArticleTocItem } from "../lib/article-content";
import { ARTICLE_CONTACT_FORM_MARKER, estimateReadMinutes } from "../lib/article-content";

export interface Article {
  order: number;
  category: string;
  categorySlugs?: string[];
  readMin: number;
  title: string;
  slug: string;
  updatedAt: string;
  excerpt: string;
  image: string;
  markdown: string;
  tocItems?: ArticleTocItem[];
}

type Section = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  ordered?: boolean;
};

type RelatedLink = {
  title: string;
  slug: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type ArticleSeed = Omit<Article, "readMin" | "markdown"> & {
  intro: string[];
  sections: Section[];
  related: RelatedLink[];
  faq?: FaqItem[];
};

function renderList(items: string[], ordered = false) {
  const marker = ordered ? "1." : "-";
  return items.map((item) => `${marker} ${item}`).join("\n");
}

function renderSection(section: Section) {
  const chunks = [`## ${section.title}`];
  if (section.paragraphs?.length) {
    chunks.push(section.paragraphs.join("\n\n"));
  }
  if (section.bullets?.length) {
    chunks.push(renderList(section.bullets, section.ordered));
  }
  return chunks.join("\n\n");
}

function renderFaq(items: FaqItem[]) {
  return [
    "## Najczęstsze pytania",
    ...items.flatMap((item) => [`### ${item.question}`, item.answer]),
  ].join("\n\n");
}

function hasCategory(seed: ArticleSeed, slug: string) {
  return seed.categorySlugs?.includes(slug) ?? false;
}

function buildDecisionSection(seed: ArticleSeed) {
  if (hasCategory(seed, "koszty") || hasCategory(seed, "stypendia") || hasCategory(seed, "financial-aid")) {
    return [
      "## Jak ocenić, czy ten plan finansowy ma sens?",
      "W artykułach o kosztach i stypendiach najczęstszym błędem jest patrzenie tylko na jedno pole w tabeli: wysokość czesnego albo wysokość wsparcia. Tymczasem realna decyzja finansowa wymaga policzenia pełnego kosztu studiów, kosztów życia, waluty, zaliczek, kosztu pierwszych miesięcy i ryzyka, że część wsparcia będzie warunkowa albo nieodnawialna.",
      "Dopiero takie pełne porównanie pokazuje, czy dany kraj lub uczelnia rzeczywiście jest osiągalna. Kandydat, który zrobi to wcześnie, zwykle buduje rozsądniejszą listę uczelni i unika rozczarowania po otrzymaniu oferty, na którą w praktyce nie może sobie pozwolić.",
    ].join("\n\n");
  }

  if (
    hasCategory(seed, "dania") ||
    hasCategory(seed, "holandia") ||
    hasCategory(seed, "wielka-brytania") ||
    hasCategory(seed, "niemcy") ||
    hasCategory(seed, "wlochy") ||
    hasCategory(seed, "szwecja") ||
    hasCategory(seed, "usa") ||
    hasCategory(seed, "kanada")
  ) {
    return [
      "## Jak ocenić, czy ten kraj naprawdę do Ciebie pasuje?",
      `Przy temacie „${seed.title}” nie chodzi wyłącznie o prestiż uczelni albo liczbę programów po angielsku. Trzeba zestawić styl nauki, koszty życia, język codzienny, sposób rekrutacji, dostępność mieszkań, szanse na pracę w trakcie studiów i sens dyplomu w długim horyzoncie. W praktyce to właśnie ta kombinacja decyduje, czy kandydat będzie w danym systemie rozwijał się swobodnie, czy raczej stale nadrabiał niedopasowanie.`,
      `Dlatego dobry wybór po lekturze tekstu „${seed.title}” zwykle nie kończy się na jednym kraju. Warto porównać go z dwiema lub trzema sensownymi alternatywami i dopiero wtedy zdecydować, gdzie rzeczywiście warto inwestować czas w aplikację, eseje, testy i formalności.`,
    ].join("\n\n");
  }

  if (
    hasCategory(seed, "ekonomia") ||
    hasCategory(seed, "prawo") ||
    hasCategory(seed, "psychologia") ||
    hasCategory(seed, "medycyna") ||
    hasCategory(seed, "informatyka")
  ) {
    return [
      "## Jak ocenić, czy ten kierunek jest dobrym wyborem właśnie dla Ciebie?",
      "Najlepszy kierunek to nie zawsze ten, który najlepiej wygląda w rankingu albo prowadzi do modnej branży. Znacznie ważniejsze jest połączenie zainteresowań, wyników z kluczowych przedmiotów, stylu nauki i gotowości do codziennej pracy z materiałem, który naprawdę dominuje na studiach. To szczególnie ważne na kierunkach selektywnych, gdzie samo ogólne zainteresowanie tematem bardzo szybko okazuje się niewystarczające.",
      "Jeśli kandydat umie uczciwie ocenić, czy dany program odpowiada jego mocnym stronom i planom zawodowym, łatwiej zbuduje mocną aplikację i wybierze uczelnie, które są ambitne, ale nadal sensownie dopasowane do jego profilu.",
    ].join("\n\n");
  }

  return [
    "## Jak ocenić, czy to dobra opcja w Twojej sytuacji?",
    `Najwięcej zyskują kandydaci, którzy czytają tekst „${seed.title}” nie jako inspirację ogólną, ale jako narzędzie do podejmowania konkretnych decyzji. Warto więc po lekturze zadać sobie trzy pytania: czy ta opcja pasuje do mojego profilu, czy rozumiem jej koszty i terminy oraz czy wiem, jakie następne kroki powinienem wykonać w ciągu najbliższych tygodni.`,
    `Jeżeli po lekturze tekstu „${seed.title}” odpowiedź na któreś z tych pytań nadal jest niejasna, to zwykle znak, że potrzebna jest głębsza analiza programu, kraju albo własnej listy uczelni. Samo przeczytanie artykułu to dobry start, ale przewagę daje dopiero przełożenie tej wiedzy na plan działania.`,
  ].join("\n\n");
}

function buildChecklist(seed: ArticleSeed) {
  if (hasCategory(seed, "medycyna")) {
    return [
      "## Praktyczna checklista przed rozpoczęciem aplikacji",
      renderList([
        "sprawdź, które kraje przyjmują kandydatów bezpośrednio po liceum, a które wymagają wcześniejszych studiów,",
        "porównaj język studiów z językiem klinicznym i codziennym funkcjonowaniem na uczelni,",
        "ustal, czy potrzebujesz testu typu UCAT, HPAT, IMAT, egzaminu uczelnianego albo rozmowy kwalifikacyjnej,",
        "policz pełny koszt 5–6 lat studiów, a nie tylko pierwszego roku,",
        "sprawdź zasady uznawalności dyplomu i sens dalszej ścieżki zawodowej po ukończeniu programu,",
        "zacznij wcześniej zbierać doświadczenia, które pokazują dojrzałą motywację do zawodu lekarza.",
      ]),
    ].join("\n\n");
  }

  if (hasCategory(seed, "informatyka")) {
    return [
      "## Praktyczna checklista przed rozpoczęciem aplikacji",
      renderList([
        "przeczytaj plan zajęć i sprawdź, czy program jest bardziej teoretyczny, praktyczny czy interdyscyplinarny,",
        "porównaj wymagania z matematyki, informatyki i języka angielskiego na kilku uczelniach naraz,",
        "zbierz projekty, konkursy, kursy i doświadczenia, które rzeczywiście pokazują zainteresowanie technologią,",
        "ustal, czy aplikujesz na Computer Science, Software Engineering, AI, Data Science czy inny pokrewny kierunek,",
        "sprawdź koszty życia i możliwości stażowe w mieście, a nie tylko sam ranking uczelni,",
        "zbuduj listę uczelni o różnym poziomie selektywności zamiast opierać cały plan na dwóch topowych nazwach.",
      ]),
    ].join("\n\n");
  }

  if (
    hasCategory(seed, "dania") ||
    hasCategory(seed, "holandia") ||
    hasCategory(seed, "wielka-brytania") ||
    hasCategory(seed, "niemcy") ||
    hasCategory(seed, "wlochy") ||
    hasCategory(seed, "szwecja") ||
    hasCategory(seed, "usa") ||
    hasCategory(seed, "kanada")
  ) {
    return [
      "## Praktyczna checklista przed rozpoczęciem aplikacji",
      renderList([
        "sprawdź aktualną ofertę programów po angielsku na oficjalnych stronach uczelni i portali krajowych,",
        "porównaj wymagania dla kandydatów z polską maturą, a nie tylko ogólny opis programu,",
        "zapisz terminy uczelni, testów językowych, stypendiów i dokumentów dodatkowych,",
        "policz pełny koszt studiowania, w tym mieszkanie, transport, depozyt i pierwszy okres po przeprowadzce,",
        "upewnij się, czy lokalny język nie będzie potrzebny na praktykach, w pracy albo w codziennych formalnościach,",
        "zestaw ten kraj z co najmniej dwiema alternatywami, żeby decyzja była naprawdę świadoma.",
      ]),
    ].join("\n\n");
  }

  return [
    "## Praktyczna checklista przed kolejnym krokiem",
    renderList([
      "zapisz najważniejsze decyzje, które wynikają z tego artykułu dla Twojej sytuacji,",
      "sprawdź, czy temat dotyczy licencjatu, magisterki czy obu poziomów studiów,",
      "ustal, jakie dokumenty, testy lub działania trzeba rozpocząć wcześniej niż się wydaje,",
      "porównaj co najmniej dwie alternatywne opcje, zamiast opierać plan na jednej ścieżce,",
      "policz konsekwencje finansowe i czasowe zanim wyślesz pierwszą aplikację,",
      "zamień wiedzę z artykułu na konkretny harmonogram działań na najbliższe tygodnie.",
    ]),
  ].join("\n\n");
}

function buildOfficialSourcesSection(seed: ArticleSeed) {
  if (
    hasCategory(seed, "dania") ||
    hasCategory(seed, "holandia") ||
    hasCategory(seed, "wielka-brytania") ||
    hasCategory(seed, "niemcy") ||
    hasCategory(seed, "wlochy") ||
    hasCategory(seed, "szwecja") ||
    hasCategory(seed, "usa") ||
    hasCategory(seed, "kanada")
  ) {
    return [
      "## Co jeszcze sprawdzić na oficjalnych źródłach",
      `Nawet najlepiej napisany artykuł, taki jak „${seed.title}”, powinien być początkiem, a nie końcem researchu. Przy krajach i systemach rekrutacji szczególnie ważne jest sprawdzenie oficjalnych stron uczelni oraz krajowych portali dla kandydatów, ponieważ to tam najszybciej zmieniają się informacje o języku programu, deadline’ach, opłatach i wymaganych dokumentach.`,
      renderList([
        "oficjalną stronę konkretnej uczelni i wybranego programu,",
        "portal krajowy lub system aplikacyjny, jeśli dany kraj z niego korzysta,",
        "aktualne informacje o wymaganiach językowych i dokumentach dla kandydatów międzynarodowych,",
        "sekcję kosztów życia, mieszkania i opłat semestralnych, a nie tylko wysokość czesnego,",
        "warunki pracy w trakcie studiów oraz znaczenie języka lokalnego poza salą wykładową,",
        "możliwości stypendialne lub lokalne regulacje dotyczące studentów z UE i spoza UE.",
      ]),
    ].join("\n\n");
  }

  if (
    hasCategory(seed, "ekonomia") ||
    hasCategory(seed, "prawo") ||
    hasCategory(seed, "psychologia") ||
    hasCategory(seed, "medycyna") ||
    hasCategory(seed, "informatyka")
  ) {
    return [
      "## Co jeszcze sprawdzić zanim wybierzesz konkretną uczelnię",
      "Przy kierunkach merytorycznych najwięcej błędów bierze się z patrzenia na ogólne hasło programu zamiast na jego realną treść. Właśnie dlatego warto wejść poziom głębiej i przeczytać nie tylko stronę marketingową, ale również plan zajęć, opis kursów oraz warunki dalszej ścieżki akademickiej lub zawodowej.",
      renderList([
        "listę przedmiotów z pierwszego i drugiego roku,",
        "wymagania z konkretnych przedmiotów szkolnych lub akademickich,",
        "informacje o portfolio, testach, rozmowach albo dodatkowych etapach selekcji,",
        "strukturę praktyk, researchu albo pracy projektowej, jeśli są istotne dla kierunku,",
        "możliwości kontynuacji na magisterce, doktoracie albo w ścieżce zawodowej,",
        "to, czy program jest bardziej teoretyczny, praktyczny czy interdyscyplinarny.",
      ]),
    ].join("\n\n");
  }

  return [
    "## Co jeszcze warto sprawdzić po lekturze",
    `Dobre poradniki, takie jak „${seed.title}”, pomagają zrozumieć logikę procesu, ale nie zastępują sprawdzenia szczegółów na stronach uczelni i w systemach aplikacyjnych. Im bardziej selektywny kierunek lub skomplikowany kraj, tym ważniejsze jest, by po ogólnym researchu wejść w konkret: program, dokumenty, terminy i realne kryteria przyjęcia.`,
  ].join("\n\n");
}

function buildDeepDiveSection(seed: ArticleSeed) {
  if (hasCategory(seed, "mentoring")) {
    return [
      "## Jak to wygląda w praktyce, gdy uczeń pracuje z mentorem?",
      "W najlepszym scenariuszu mentoring nie polega na tym, że ktoś „mówi, co robić”, tylko na tym, że porządkuje proces i pomaga kandydatowi podejmować lepsze decyzje samodzielnie. Uczeń rozumie, dlaczego dana uczelnia trafia na listę, jaką funkcję ma dany esej, co trzeba przygotować wcześniej i które elementy profilu naprawdę robią różnicę. To sprawia, że wsparcie nie znika wraz z końcem spotkania, tylko zostawia po sobie lepiej zorganizowany sposób myślenia o całej aplikacji.",
      "Taka współpraca zwykle jest najbardziej wartościowa wtedy, gdy kandydat ma dużo zmiennych do połączenia: kilka krajów, selektywny kierunek, potrzebę finansowania, nietypowy profil albo stres związany z dużą liczbą terminów. Właśnie wtedy zewnętrzna perspektywa pomaga odsiać rzeczy ważne od pozornie pilnych i utrzymać jakość decyzji przez wiele miesięcy.",
      renderList([
        "na początku porządkuje się profil, cele i ograniczenia finansowe,",
        "potem buduje się listę uczelni i kalendarz aplikacji,",
        "w kolejnych krokach mentor pomaga utrzymać spójność dokumentów, tekstów i decyzji,",
        "na końcu kandydat powinien rozumieć proces lepiej niż na starcie, a nie tylko „mieć zrobione papiery”.",
      ]),
    ].join("\n\n");
  }

  if (hasCategory(seed, "dla-rodzicow")) {
    return [
      "## Gdzie rodzice najczęściej pomagają naprawdę dobrze, a gdzie niechcący przeszkadzają",
      "Rodzic potrafi bardzo wzmocnić proces aplikacji, jeśli wspiera organizację, rytm pracy i spokojne podejmowanie decyzji. Szczególnie cenne bywa pilnowanie kalendarza, kosztów, formalności i momentów, w których uczeń sam już traci perspektywę. To jest realna pomoc, bo nie odbiera sprawczości, ale stabilizuje cały proces.",
      "Problem zaczyna się wtedy, gdy troska zamienia się w przejęcie kontroli nad historią ucznia. Esej napisany głosem dorosłego, lista uczelni wybrana tylko prestiżowo albo nadmierna presja na „najbezpieczniejsze” decyzje często osłabiają jakość aplikacji. Dobrze działa partnerstwo: rodzic wspiera ramy procesu, a uczeń zachowuje własny głos i odpowiedzialność za merytoryczne wybory.",
      renderList([
        "pomagaj w logistyce, budżecie i terminach,",
        "zadawaj pytania, które porządkują myślenie, zamiast od razu podawać gotową odpowiedź,",
        "nie próbuj pisać aplikacji za dziecko ani wygładzać jej do dorosłego tonu,",
        "wspieraj realistyczne decyzje finansowe i emocjonalne, a nie tylko najbardziej prestiżowy scenariusz.",
      ]),
    ].join("\n\n");
  }

  if (hasCategory(seed, "koszty") || hasCategory(seed, "stypendia") || hasCategory(seed, "financial-aid")) {
    return [
      "## Jak myśleć o finansowaniu bardziej strategicznie",
      "W finansowaniu studiów za granicą rzadko działa jedna idealna odpowiedź. Czasem najlepszym rozwiązaniem będzie kraj o niższym koszcie życia, czasem uczelnia z mocniejszym wsparciem stypendialnym, a czasem program droższy nominalnie, ale lepiej dopasowany do celu zawodowego i realnych możliwości rodziny. Największy błąd polega na tym, że kandydaci liczą tylko jedną część równania, na przykład samo czesne, i ignorują cały kontekst.",
      "Znacznie lepsze efekty daje ułożenie planu finansowego już na etapie wyboru listy uczelni. Wtedy łatwiej zdecydować, które opcje są rzeczywiście osiągalne, gdzie warto inwestować czas w scholarship essays, a gdzie od początku lepiej szukać innych ścieżek. To oszczędza nie tylko pieniądze, ale też energię i rozczarowania po otrzymaniu oferty.",
      renderList([
        "oddziel koszty jednorazowe od stałych miesięcznych wydatków,",
        "sprawdź, czy wsparcie jest gwarantowane, odnawialne i na jakich warunkach,",
        "porównaj nie tylko cenę studiów, ale też siłę programu i wartość dyplomu dla Twojego celu,",
        "zbuduj listę uczelni tak, aby finansowanie było częścią strategii od początku, a nie ratunkiem na końcu.",
      ]),
    ].join("\n\n");
  }

  if (hasCategory(seed, "common-app") || hasCategory(seed, "usa")) {
    return [
      "## Co zwykle zaskakuje kandydatów aplikujących do USA",
      "System amerykański często wygląda z zewnątrz jak zbiór formularzy i esejów, ale w praktyce jest znacznie bardziej narracyjny i wielowarstwowy. Uczelnia nie ocenia tylko wyników, lecz próbuje zrozumieć, kim jest kandydat, jak podejmuje decyzje, jak wygląda jego ciekawość intelektualna i co może wnieść do wspólnoty kampusu. To sprawia, że każdy element aplikacji powinien wspierać spójną historię, a nie funkcjonować osobno.",
      "Właśnie dlatego aplikacja do USA wymaga więcej iteracji niż wiele systemów europejskich. Trzeba przemyśleć listę uczelni, strategię finansową, aktywności, ton esejów i to, jak pokazać własny profil bez przesady i bez sztucznego „budowania marki osobistej”. Kandydaci, którzy rozumieją tę logikę wcześniej, znacznie lepiej wykorzystują czas poświęcony na pisanie i wybór uczelni.",
      renderList([
        "traktuj aplikację jak spójną historię, a nie zbiór osobnych rubryk,",
        "zwróć uwagę na różnicę między eseje głównym a supplementami uczelnianymi,",
        "nie zakładaj, że bardzo dobre oceny same rozwiążą temat przyjęcia lub finansowania,",
        "zostaw dużo czasu na poprawki, bo amerykańskie teksty rzadko powstają dobrze w jednej wersji.",
      ]),
    ].join("\n\n");
  }

  return [
    "## Jak ten temat wygląda w praktyce w procesie aplikacji",
    `Największa różnica między kandydatami przy temacie „${seed.title}” rzadko bierze się z samej wiedzy teoretycznej. Dużo częściej decyduje to, czy umieją przełożyć ogólne zasady na własny kalendarz, budżet, listę uczelni i dokumenty. Właśnie dlatego nawet pozornie prosty temat potrafi realnie wzmocnić albo osłabić cały proces.`,
    `Im wcześniej kandydat zamieni wnioski z tekstu „${seed.title}” na konkretne decyzje, tym łatwiej utrzyma spójność aplikacji i uniknie pracy w ostatniej chwili. To szczególnie ważne wtedy, gdy równolegle trzeba łączyć szkołę, egzaminy, teksty i rozmowy z rodzicami o budżecie oraz kierunku wyjazdu.`,
  ].join("\n\n");
}

function buildScenarioSection(seed: ArticleSeed) {
  if (hasCategory(seed, "financial-aid") || hasCategory(seed, "stypendia") || hasCategory(seed, "koszty")) {
    return [
      "## Typowe scenariusze kandydatów i różne strategie działania",
      "Uczeń, który ma mocny profil, ale ograniczony budżet, powinien budować listę uczelni zupełnie inaczej niż osoba z podobnymi wynikami, ale większą elastycznością finansową. W pierwszym przypadku strategia musi uwzględniać stypendia, kraje o rozsądniejszych kosztach albo uczelnie, które oferują przewidywalne wsparcie. W drugim można częściej pozwolić sobie na bardziej prestiżowe lub droższe opcje, nawet jeśli proces finansowania jest mniej oczywisty.",
      "Podobnie wygląda to na poziomie psychologicznym. Część rodzin chce najpierw znać koszt maksymalny i dopiero potem rozmawiać o aspiracjach, a część najpierw wybiera uczelnie i dopiero później szuka sposobu na domknięcie finansowania. Z doświadczenia zwykle lepiej działa model pierwszy: najpierw uczciwa mapa możliwości finansowych, potem lista uczelni. To pozwala zbudować strategię ambitną, ale nie życzeniową.",
      renderList([
        "jeśli potrzebujesz dużego wsparcia, szukaj systemów i uczelni, gdzie finanse są częścią strategii rekrutacyjnej,",
        "jeśli możesz pozwolić sobie na większą elastyczność, nadal licz pełny koszt i porównuj opłacalność opcji,",
        "jeśli rodzina nie ma jeszcze jasnego budżetu, zacznij od przedziałów i scenariuszy, a nie jednej sztywnej liczby,",
        "jeśli plan finansowy wydaje się zbyt napięty już na starcie, potraktuj to jako sygnał do przebudowy listy uczelni, a nie do późniejszego martwienia się.",
      ]),
    ].join("\n\n");
  }

  if (hasCategory(seed, "usa") || hasCategory(seed, "common-app")) {
    return [
      "## Różne typy kandydatów do USA i dlaczego nie wszyscy powinni aplikować tak samo",
      "Inaczej buduje się aplikację kandydata olimpijskiego z bardzo technicznym profilem, inaczej ucznia mocnego humanistycznie z wyrazistym doświadczeniem społecznym, a jeszcze inaczej osoby wszechstronnej, która nie ma jednego bardzo dominującego sukcesu, ale ma spójną historię rozwoju. Amerykański system jest pod tym względem wymagający, bo nie wynagradza prostego kopiowania wzorców z internetu. To, co wygląda dobrze u jednego ucznia, może brzmieć sztucznie u drugiego.",
      "W praktyce najlepsze aplikacje do USA są bardzo indywidualne, ale jednocześnie dobrze uporządkowane. Kandydat powinien wiedzieć, które aktywności są centralne, jakie wartości albo zainteresowania naprawdę go definiują i gdzie uczelnia ma zobaczyć jego ambicję akademicką, a gdzie dojrzałość osobistą. Bez tej struktury łatwo stworzyć aplikację, która jest pełna treści, ale nie buduje żadnego wyraźnego obrazu.",
      renderList([
        "nie próbuj udawać „idealnego kandydata” z każdej kategorii naraz,",
        "wybierz kilka najmocniejszych osi swojej historii i buduj wokół nich aktywności oraz eseje,",
        "traktuj suplementy jako miejsce doprecyzowania profilu, a nie powtarzania tego samego,",
        "zostaw czas na selekcję materiału, bo w USA problemem częściej bywa nadmiar niż brak wątków.",
      ]),
    ].join("\n\n");
  }

  return [
    "## Jak ten temat wygląda u różnych kandydatów w praktyce",
    `Nie każdy kandydat czyta artykuł „${seed.title}” z tego samego miejsca. Jedna osoba dopiero zaczyna myśleć o studiach za granicą i potrzebuje zrozumieć podstawy systemu. Ktoś inny ma już listę uczelni, ale utknął na jednym elemencie: kosztach, rekomendacjach, eseju albo wyborze kraju. To oznacza, że warto czytać poradnik aktywnie i od razu zaznaczać, które elementy są dla Ciebie tylko tłem, a które stają się konkretnym zadaniem do wykonania.`,
    `Najlepiej działa prosty filtr: co z artykułu „${seed.title}” zmienia moją decyzję, co zmienia kolejność działań, a co tylko porządkuje ogólną wiedzę. Kandydaci, którzy od razu zamieniają lekturę w konkretne kroki, zwykle szybciej wychodzą z etapu researchu bez końca i przechodzą do realnego budowania aplikacji.`,
  ].join("\n\n");
}

function buildExecutionSection(seed: ArticleSeed) {
  if (hasCategory(seed, "terminy") || hasCategory(seed, "dokumenty") || hasCategory(seed, "egzaminy")) {
    return [
      "## Jak zamienić wiedzę z tego artykułu na realny plan działania",
      "Największy problem kandydatów nie polega zwykle na braku informacji, tylko na tym, że informacje nie są ułożone w kolejności wykonywania. Ktoś wie, że potrzebuje testu językowego, rekomendacji i eseju, ale nie wie, co uruchomić najpierw, żeby nie zablokować kolejnych kroków. Właśnie dlatego warto budować plan operacyjny, a nie tylko listę rzeczy „do zrobienia kiedyś”.",
      "Najlepiej działa rozpisanie procesu na tygodnie lub etapy: najpierw lista uczelni i wymagania, potem dokumenty wspólne, następnie rzeczy zależne od terminu lub innych osób, a na końcu poprawki i finalne wysyłki. Taki porządek oszczędza mnóstwo stresu, bo kandydat nie próbuje robić wszystkiego jednocześnie.",
      renderList([
        "najpierw ustal, które działania zależą od zewnętrznych terminów lub innych ludzi,",
        "potem przygotuj materiały, które będą używane w wielu aplikacjach naraz,",
        "zostaw osobny czas na poprawki, tłumaczenia i techniczne wgrywanie dokumentów,",
        "traktuj deadline uczelni jako ostateczność, a nie docelową datę ukończenia pracy.",
      ]),
    ].join("\n\n");
  }

  if (hasCategory(seed, "strategia") || hasCategory(seed, "rekomendacje") || hasCategory(seed, "eseje-i-listy")) {
    return [
      "## Co odróżnia dobrą strategię od przypadkowego działania",
      `W temacie „${seed.title}” bardzo łatwo zrobić dużo rzeczy i nadal nie posuwać się naprawdę do przodu. Kandydat może czytać rankingi, oglądać kanały na YouTube, porównywać miasta i nawet pisać pierwsze szkice tekstów, a mimo to nie odpowiadać sobie na kluczowe pytania: do jakiego systemu aplikuję, jakie kraje mają sens, jak wygląda finansowanie i co moja aplikacja ma o mnie komunikować. Dobra strategia porządkuje właśnie tę warstwę.`,
      `W praktyce oznacza to, że przed intensywną pracą nad tematem „${seed.title}” warto mieć choćby roboczą mapę decyzji: kraje, poziom selektywności uczelni, rolę kosztów, profil kierunkowy i plan terminów. Bez tego nawet dobrze napisane materiały mogą pracować na listę uczelni, która od początku była zbyt przypadkowa albo zbyt ryzykowna.`,
      renderList([
        "najpierw ustal logikę listy uczelni, a dopiero potem dopracowuj detale tekstów,",
        "traktuj rekomendacje i eseje jako część większej historii, a nie osobne zadania,",
        "sprawdzaj, czy każda godzina pracy wzmacnia decyzję strategiczną, a nie tylko daje poczucie zajętości,",
        "regularnie wracaj do pytania, czy obrany kierunek naprawdę pasuje do Twojego celu i budżetu.",
      ]),
    ].join("\n\n");
  }

  return [
    "## Jak przełożyć ten artykuł na kolejne 30 dni pracy",
    `Dla większości kandydatów najlepszym ruchem po przeczytaniu tekstu „${seed.title}” nie jest dalsze czytanie kolejnych poradników bez końca, tylko zamiana wniosków na konkretne działanie w kalendarzu. To może być zbudowanie pierwszej listy uczelni, zapis na test, rozmowa z nauczycielem o rekomendacji, uporządkowanie budżetu albo rozpisanie własnych terminów roboczych przed oficjalnym deadline’em.`,
    `Jeśli artykuł „${seed.title}” nie prowadzi do żadnej decyzji ani żadnego działania, łatwo utknąć w researchu, który brzmi produktywnie, ale nie przybliża do wysłania mocnej aplikacji. Dlatego warto po każdej lekturze dopisać sobie trzy konkretne rzeczy, które wydarzą się w najbliższych tygodniach właśnie dzięki tej wiedzy.`,
  ].join("\n\n");
}

function getArticleAngle(seed: ArticleSeed) {
  const categorySlugs = seed.categorySlugs ?? [];
  const countryMap: Record<string, string> = {
    dania: "Danii",
    holandia: "Holandii",
    "wielka-brytania": "Wielkiej Brytanii",
    niemcy: "Niemczech",
    wlochy: "Włoszech",
    szwecja: "Szwecji",
    usa: "USA",
    kanada: "Kanadzie",
    hiszpania: "Hiszpanii",
    europa: "Europie",
  };
  const subjectMap: Record<string, string> = {
    ekonomia: "ekonomii",
    prawo: "prawa",
    psychologia: "psychologii",
    medycyna: "medycyny",
    informatyka: "informatyki",
  };
  const countrySlug = categorySlugs.find((slug) => countryMap[slug]);
  const subjectSlug = categorySlugs.find((slug) => subjectMap[slug]);
  const isFinance = ["koszty", "stypendia", "financial-aid", "darmowe-studia"].some((slug) =>
    categorySlugs.includes(slug),
  );
  const isUs = categorySlugs.includes("usa") || categorySlugs.includes("common-app");

  if (subjectSlug) {
    return {
      type: "subject",
      label: subjectMap[subjectSlug],
      decision: `wybór kierunku ${subjectMap[subjectSlug]} za granicą`,
      formalLayer: "wymagania przedmiotowe, poziom selektywności, doświadczenia kierunkowe i sposób pokazania motywacji",
      practicalLayer: "program zajęć, język studiów, praktyki, dalsza specjalizacja i realna ścieżka zawodowa",
      evidenceLayer: "oceny z kluczowych przedmiotów, projekty, konkursy, aktywności, lektury i refleksja nad wyborem kierunku",
      listLayer: "kraje o różnym modelu rekrutacji, uczelnie ambitne i realistyczne oraz programy z sensownym planem B",
    };
  }

  if (isUs) {
    return {
      type: "usa",
      label: "USA",
      decision: "aplikację do uczelni amerykańskich",
      formalLayer: "Common App, suplementy uczelniane, aktywności, rekomendacje, testy i strategię finansowania",
      practicalLayer: "dopasowanie kampusu, model liberal arts, aid policy, eseje i sposób selekcji kandydatów",
      evidenceLayer: "spójna narracja, osiągnięcia, inicjatywa, ciekawość intelektualna i wkład w społeczność",
      listLayer: "reach, target i likely schools, wraz z osobnym planem dla uczelni oferujących realne wsparcie finansowe",
    };
  }

  if (countrySlug) {
    return {
      type: "country",
      label: countryMap[countrySlug],
      decision: `studia w ${countryMap[countrySlug]}`,
      formalLayer: "system aplikacji, wymagania dla polskiej matury, język programu, terminy i dokumenty",
      practicalLayer: "koszty życia, mieszkanie, praca studencka, język codzienny i styl nauki na uczelni",
      evidenceLayer: "dopasowanie programu, przedmiotów, miasta, budżetu oraz możliwości po dyplomie",
      listLayer: "kilka uczelni o różnym poziomie selektywności i co najmniej jedną alternatywę w innym kraju",
    };
  }

  if (isFinance) {
    return {
      type: "finance",
      label: "finansowania studiów",
      decision: "finansowanie studiów za granicą",
      formalLayer: "czesne, koszty życia, stypendia, financial aid, terminy i warunki utrzymania wsparcia",
      practicalLayer: "budżet pierwszego roku, koszty startowe, kurs walut, depozyty, mieszkanie i źródła finansowania",
      evidenceLayer: "realistyczny koszt całej ścieżki, nie tylko atrakcyjna kwota z tabeli opłat",
      listLayer: "uczelnie i kraje dobrane tak, aby ambicja była połączona z finansową wykonalnością",
    };
  }

  return {
    type: "general",
    label: "aplikacji na studia za granicą",
    decision: "aplikację na studia za granicą",
    formalLayer: "kraje, terminy, dokumenty, testy, rekomendacje, teksty aplikacyjne i budżet",
    practicalLayer: "kolejność działań, jakość listy uczelni, komunikację z nauczycielami i finalną wysyłkę",
    evidenceLayer: "spójny profil kandydata, wyniki, aktywności, motywację i konkretne przykłady",
    listLayer: "ambitne, realistyczne i bezpieczniejsze opcje, które razem tworzą sensowną strategię",
  };
}

function buildArticleSpecificLongForm(seed: ArticleSeed) {
  const angle = getArticleAngle(seed);
  const topic = seed.title.toLowerCase();
  const sourceHint =
    angle.type === "country"
      ? "oficjalne strony uczelni, krajowe portale dla kandydatów i aktualne opisy programów"
      : angle.type === "subject"
        ? "opisy programów, sylabusy, wymagania przedmiotowe i przykłady profili przyjmowanych kandydatów"
        : angle.type === "finance"
          ? "kalkulatory kosztów, regulaminy stypendiów, tabele opłat i warunki odnowienia wsparcia"
          : angle.type === "usa"
            ? "strony admission, financial aid policies, Common App i wymagania poszczególnych uczelni"
            : "strony uczelni, systemy aplikacyjne, oficjalne terminy i wymagania konkretnych programów";
  const comparisonHint =
    angle.type === "subject"
      ? `czy ${angle.label} ma być główną osią dalszej edukacji, czy jednym z możliwych kierunków rozwoju`
      : angle.type === "finance"
        ? "czy dana opcja jest osiągalna w scenariuszu realistycznym, a nie tylko optymistycznym"
        : angle.type === "country"
          ? `czy ${angle.decision} pasują do Twojego stylu nauki, budżetu i planu po dyplomie`
          : angle.type === "usa"
            ? "czy uczelnia pasuje akademicko, społecznie i finansowo, a nie tylko dobrze wygląda w rankingu"
            : "czy dana decyzja realnie przybliża Cię do wysłania mocnej aplikacji";

  return [
    [
      `## Jak podejść do tematu „${seed.title}” bez gubienia konkretów`,
      `Najlepszy sposób pracy nad tematem takim jak ${topic} zaczyna się od oddzielenia inspiracji od decyzji. Inspiracją może być ranking, film, historia znajomego albo atrakcyjny opis programu. Decyzją jest dopiero wybór, który zmienia harmonogram, listę uczelni, budżet albo dokumenty. W praktyce kandydat potrzebuje obu warstw, ale nie powinien ich mieszać. Inspiracje pomagają zobaczyć możliwości, a decyzje porządkują działania.`,
      `W przypadku pracy nad tematem ${topic} najważniejsze jest szybkie ustalenie, które informacje są krytyczne. Do tej grupy należą przede wszystkim: ${angle.formalLayer}. Jeśli te elementy nie są jasne, dalsze porównywanie opinii i ogólnych porad łatwo daje poczucie pracy, ale nie przekłada się na jakość aplikacji.`,
      `Dobrze działa zasada jednej tabeli decyzyjnej. Dla każdej opcji związanej z tematem ${topic} wpisz wymagania, terminy, koszty, mocne strony, ograniczenia i pytania do sprawdzenia. Dzięki temu po kilku godzinach researchu nie masz luźnych notatek w pięciu miejscach, tylko materiał, z którego naprawdę można wyciągnąć wniosek.`,
      `Taka tabela dla tematu ${topic} powinna być regularnie aktualizowana. Jeśli źródło okazuje się nieaktualne, jeśli program nie przyjmuje kandydatów z Twoim profilem albo jeśli koszt wykracza poza ustalony budżet, warto to odnotować od razu. Celem nie jest zebranie jak największej liczby opcji, lecz stworzenie listy, która jest ambitna, zrozumiała i wykonalna.`,
      renderList([
        `zapisuj tylko te informacje o temacie ${topic}, które zmieniają decyzję albo konkretne zadanie,`,
        `sprawdzaj ${sourceHint}, zanim uznasz daną informację za pewną,`,
        `porównuj opcje przez te same kryteria: wymagania, koszt, termin, dopasowanie i ryzyko,`,
        `co kilka dni usuwaj opcje, które nie pasują do profilu, celu albo budżetu.`,
      ]),
    ].join("\n\n"),
    [
      "## Co powinno znaleźć się w dobrej analizie przed wyborem uczelni",
      `Dobra analiza przed wyborem uczelni nie polega na tym, że kandydat zna dziesięć nazw i kilka miejsc w rankingach. Przy temacie ${topic} ważniejsze jest rozumienie, dlaczego dana uczelnia ma sens właśnie dla niego. Ta odpowiedź powinna łączyć ${angle.practicalLayer}. Dopiero wtedy lista uczelni zaczyna być strategią, a nie zbiorem atrakcyjnych logo.`,
      `Pierwsza warstwa przy analizie tematu ${topic} to dopasowanie akademickie. Trzeba sprawdzić, czego program rzeczywiście uczy, jakie przedmioty pojawiają się na pierwszym roku, czy jest miejsce na specjalizację i czy forma zajęć pasuje do sposobu pracy kandydata. Dwie uczelnie mogą mieć podobną nazwę kierunku, ale zupełnie inny nacisk: jedna może być bardziej teoretyczna, druga projektowa, trzecia nastawiona na praktykę zawodową.`,
      `Druga warstwa to dopasowanie rekrutacyjne. Przy planowaniu tematu ${topic} warto jasno zobaczyć, czy wymagania są ambitne, ale osiągalne, oraz które elementy trzeba przygotować najwcześniej. Czasem najważniejszy będzie certyfikat językowy, czasem wynik z konkretnego przedmiotu, czasem portfolio, esej, rozmowa albo rekomendacja. To nie są detale techniczne, tylko elementy, które wpływają na całą kolejność pracy.`,
      `Trzecia warstwa w decyzji o temacie ${topic} to dopasowanie życiowe i finansowe. Uczelnia może mieć świetny program, ale miasto może być bardzo drogie, mieszkania trudno dostępne, a lokalny język ważniejszy niż wynika z broszury. Dlatego w analizie powinny znaleźć się nie tylko dane akademickie, ale też codzienność studenta. Kandydat nie wybiera samego programu, tylko kilka lat funkcjonowania w konkretnym środowisku.`,
      renderList([
        "sprawdź strukturę programu, nie tylko jego nazwę i ranking,",
        "porównaj wymagania rekrutacyjne z własnym profilem i kalendarzem,",
        "policz koszty życia oraz koszty startowe przed pierwszym semestrem,",
        `zadaj sobie pytanie, ${comparisonHint}.`,
      ]),
    ].join("\n\n"),
    [
      "## Jak budować profil, który brzmi wiarygodnie",
      `Profil kandydata przy temacie ${topic} powinien być spójny, ale nie sztuczny. Komisje rekrutacyjne zwykle nie szukają osoby, która robiła wszystko, tylko osoby, której wybory mają sens. W praktyce liczy się ${angle.evidenceLayer}. Jeśli te elementy układają się w czytelną historię, aplikacja staje się bardziej przekonująca nawet wtedy, gdy kandydat nie ma perfekcyjnego CV.`,
      `Najczęstszy błąd przy temacie ${topic} polega na myleniu profilu z listą aktywności. Sama liczba konkursów, projektów, wolontariatów czy kursów nie wystarczy, jeśli nie wiadomo, co z nich wynika. Lepiej wybrać kilka doświadczeń, które pokazują konsekwencję i dojrzałość, niż próbować opisać wszystko. Dobre pytanie brzmi: co komisja ma zrozumieć o kandydacie po przeczytaniu tej części aplikacji?`,
      `Przy temacie ${topic} szczególnie dobrze działają przykłady konkretne. Zamiast ogólnego zdania o pasji do nauki, lepiej pokazać projekt, decyzję, lekturę, rozmowę, problem badawczy, praktykę albo sytuację, która naprawdę zmieniła sposób myślenia. Taki materiał jest trudniejszy do napisania, ale dużo mniej generyczny i lepiej odróżnia kandydata od innych osób z podobnymi ocenami.`,
      `Warto też pamiętać, że profil pod kątem ${topic} można dopracować językowo bez dopisywania nowych osiągnięć. Czasem kandydat ma dobre doświadczenia, ale opisuje je zbyt sucho albo zbyt szeroko. Wtedy praca polega na wyborze właściwego przykładu, pokazaniu skali działania, opisaniu własnej roli i połączeniu tego z wyborem kierunku lub uczelni.`,
      renderList([
        "wybierz 3-4 główne wątki profilu, zamiast opisywać wszystko po równo,",
        "pokazuj własną rolę i decyzje, nie tylko nazwę projektu lub konkursu,",
        "łącz aktywności z kierunkiem, krajem albo stylem programu,",
        "unikaj zdań, które mogłyby pasować do każdego kandydata.",
      ]),
    ].join("\n\n"),
    [
      "## Jak przygotować teksty aplikacyjne, żeby nie były ogólne",
      `Teksty aplikacyjne są miejscem, w którym temat ${topic} musi przejść z poziomu informacji na poziom osobistej decyzji. Uczelnia nie potrzebuje streszczenia własnej strony internetowej. Potrzebuje zrozumieć, dlaczego kandydat wybiera taki program, co już zrobił w tym kierunku i jak planuje wykorzystać środowisko uczelni. To wymaga konkretu, a nie wyłącznie ładnych deklaracji.`,
      `Dobry tekst w aplikacji związanej z tematem ${topic} powinien mieć jasną funkcję. Jeśli jest to personal statement, powinien pokazywać dojrzałość akademicką i gotowość do kierunku. Jeśli jest to list motywacyjny, powinien łączyć wybór programu z doświadczeniami i planami. Jeśli jest to esej do USA, często ważniejsza będzie osobista perspektywa, sposób myślenia i charakter kandydata. Ta różnica decyduje o tym, jak dobiera się przykłady.`,
      `Przy temacie ${topic} łatwo napisać tekst zbyt ogólny: “chcę studiować za granicą, bo to rozwój, międzynarodowe środowisko i prestiż”. To prawda, ale brzmi podobnie u tysięcy osób. Lepszy tekst odpowiada na pytania: dlaczego ten kierunek, dlaczego ten system, dlaczego teraz, dlaczego ten kandydat i jakie dowody już istnieją w jego historii.`,
      `Przy tekstach dotyczących tematu ${topic} warto pracować na kilku wersjach. Pierwsza wersja często służy zebraniu materiału, druga selekcji, trzecia strukturze, a dopiero kolejne dopracowaniu stylu. Jeżeli kandydat zaczyna od perfekcyjnego zdania otwierającego, często blokuje się zanim ustali, co tekst ma naprawdę powiedzieć.`,
      renderList([
        "najpierw zbierz przykłady, potem decyduj o strukturze tekstu,",
        "nie powtarzaj informacji, które już jasno wynikają z formularza lub CV,",
        "dopasuj ton tekstu do kraju i typu aplikacji,",
        "sprawdzaj, czy każdy akapit wnosi nowy argument za kandydatem.",
      ]),
    ].join("\n\n"),
    [
      "## Jak ułożyć harmonogram, który naprawdę chroni jakość",
      `Harmonogram przy temacie ${topic} powinien być układany od końca, ale oceniany od początku. Oficjalny deadline mówi tylko, kiedy aplikacja musi być wysłana. Nie mówi, kiedy trzeba poprosić o rekomendację, kiedy zapisać się na test, kiedy mieć pierwszą wersję tekstu ani kiedy policzyć budżet. Dlatego własny kalendarz powinien być bardziej szczegółowy niż kalendarz uczelni.`,
      `Najważniejsze są zadania zależne od innych osób i instytucji. Rekomendacje, tłumaczenia, wyniki testów, dokumenty szkolne i potwierdzenia finansowe rzadko są gotowe natychmiast. Jeśli kandydat zostawia je na koniec, traci kontrolę nad procesem. Przy temacie ${topic} warto więc od razu wypisać, które elementy trzeba uruchomić z wyprzedzeniem.`,
      `Drugim ważnym elementem harmonogramu przy temacie ${topic} jest czas na myślenie. Wiele decyzji aplikacyjnych dojrzewa po kilku dniach: lista uczelni, wybór eseju, interpretacja kosztów albo decyzja, czy dany kraj naprawdę pasuje. Harmonogram wypełniony samymi deadline’ami technicznymi nie zostawia miejsca na korektę strategii, a to właśnie korekta często poprawia jakość aplikacji.`,
      `Przy planowaniu tematu ${topic} dobrze działa podział na etapy: research i lista uczelni, dokumenty bazowe, teksty, rekomendacje, testy, finansowanie, kontrola formalna i wysyłka. Każdy etap powinien mieć nie tylko datę, ale też definicję ukończenia. “Popracować nad esejem” to zbyt ogólne zadanie. “Mieć drugą wersję tekstu z jasną strukturą i komentarzami” jest już zadaniem operacyjnym.`,
      renderList([
        "ustal własny deadline roboczy wcześniejszy niż deadline uczelni,",
        "oddziel zadania zależne od innych osób od zadań samodzielnych,",
        "zaplanuj kilka rund pracy nad tekstami, nie jedną finalną noc,",
        "zostaw czas na sprawdzenie portalu, plików, limitów znaków i statusu aplikacji.",
      ]),
    ].join("\n\n"),
    [
      "## Jak sprawdzać koszty i finansowanie bez niepotrzebnego stresu",
      `Koszty przy temacie ${topic} powinny być liczone możliwie wcześnie, ale spokojnie i scenariuszowo. Nie chodzi o to, żeby od razu znać każdą kwotę z dokładnością do złotówki. Chodzi o to, żeby wiedzieć, które opcje są realne, które wymagają stypendium, a które warto odłożyć, zanim pochłoną dużo pracy aplikacyjnej. Finansowanie jest częścią strategii, nie dodatkiem po otrzymaniu oferty.`,
      `Najlepiej zacząć od pełnego kosztu pierwszego roku. Oprócz czesnego trzeba uwzględnić mieszkanie, jedzenie, transport, ubezpieczenie, materiały, podróże, depozyt, opłaty aplikacyjne, testy i koszt pierwszych tygodni po przeprowadzce. Przy temacie ${topic} szczególnie ważne jest też sprawdzenie, czy koszty rosną w kolejnych latach i czy ewentualne wsparcie jest odnawialne.`,
      `Dobre porównanie finansowe dla tematu ${topic} ma trzy warianty: minimalny, realistyczny i ostrożny. Wariant minimalny pokazuje, ile potrzeba, żeby wyjazd w ogóle był możliwy. Realistyczny zakłada normalne warunki życia. Ostrożny uwzględnia podwyżki, kurs walut, droższe mieszkanie albo opóźnienia. Taki układ pomaga rodzinie rozmawiać o faktach, a nie o ogólnym wrażeniu, że “będzie drogo”.`,
      `Przy temacie ${topic} warto też oceniać koszt razem z wartością programu. Najtańsza opcja nie zawsze jest najlepsza, a najdroższa nie zawsze jest najbardziej prestiżowa w praktyce. Sensowna decyzja finansowa odpowiada na pytanie, czy dana inwestycja pasuje do celu edukacyjnego, możliwości rodziny i alternatyw dostępnych dla kandydata.`,
      renderList([
        "licz pełny koszt pierwszego roku, nie tylko czesne,",
        "sprawdzaj, czy stypendium lub aid są gwarantowane i odnawialne,",
        "porównuj koszt programu z jego dopasowaniem i dalszą ścieżką,",
        "nie wysyłaj wielu drogich aplikacji bez wcześniejszego planu finansowania.",
      ]),
    ].join("\n\n"),
    [
      "## Jak rozpoznać, że artykuł albo poradnik jest naprawdę pomocny",
      `W internecie jest dużo treści o studiach za granicą, ale nie każda pomaga podjąć decyzję. Przy temacie ${topic} dobra treść powinna tłumaczyć zależności, a nie tylko wymieniać fakty. Powinna pokazywać, co kandydat ma zrobić z informacją: jak porównać uczelnie, jak ustawić kalendarz, jak sprawdzić wymagania i jak uniknąć wyborów, które wyglądają atrakcyjnie tylko z daleka.`,
      `Przy researchu o temacie ${topic} warto zadawać każdemu źródłu trzy pytania. Po pierwsze: czy jest aktualne? Po drugie: czy dotyczy mojego poziomu studiów, kraju pochodzenia i kierunku? Po trzecie: czy po przeczytaniu wiem, jaki krok wykonać dalej? Jeśli odpowiedź na trzecie pytanie brzmi “nie”, tekst może być ciekawy, ale niekoniecznie wystarczający do planowania aplikacji.`,
      `Najbardziej wartościowe są treści, które łączą praktykę z ostrożnością. Nie powinny przytłaczać procesem, ale też nie powinny udawać, że wszystko jest proste i takie samo w każdym kraju. Przy temacie ${topic} szczegóły naprawdę mają znaczenie, bo drobna różnica w terminie, dokumencie albo języku programu może zmienić kolejność działań.`,
      `Dobry poradnik o temacie ${topic} powinien zostawiać czytelnika z większą jasnością, nie z poczuciem przytłoczenia. Jeśli po lekturze masz trzy konkretne decyzje, listę pytań do sprawdzenia i pierwsze zadania w kalendarzu, tekst spełnił swoją funkcję. Jeśli masz tylko więcej zakładek w przeglądarce, warto wrócić do tabeli decyzyjnej.`,
      renderList([
        "sprawdzaj datę i źródło informacji, zwłaszcza przy terminach i opłatach,",
        "oddziel poradę ogólną od wymagań konkretnej uczelni,",
        "wyciągaj z każdego tekstu decyzję, pytanie i zadanie,",
        "nie opieraj strategii wyłącznie na jednym źródle ani jednej opinii.",
      ]),
    ].join("\n\n"),
    [
      "## Jak wygląda dobra finalna lista opcji",
      `Finalna lista związana z tematem ${topic} powinna być krótsza, mocniejsza i bardziej uzasadniona niż lista początkowa. Na początku researchu naturalne jest mieć szeroki zestaw możliwości. Na końcu kandydat powinien wiedzieć, dlaczego każda opcja została. Przy tym temacie taka lista powinna obejmować ${angle.listLayer}.`,
      `Każda pozycja na liście w temacie ${topic} powinna mieć własną rolę. Jedna uczelnia może być bardzo ambitna, ale wymagać świetnego tekstu lub wysokiego wyniku. Inna może być bardziej realistyczna i dobrze dopasowana programowo. Jeszcze inna może być ważna finansowo, bo oferuje sensowne stypendium albo niższy koszt życia. Jeśli wszystkie opcje pełnią tę samą funkcję, lista zwykle jest słabo zbalansowana.`,
      `Dobra lista przy temacie ${topic} nie jest też zbiorem kompromisów bez entuzjazmu. Nawet opcje bezpieczniejsze powinny być miejscami, w których kandydat naprawdę może chcieć studiować. W przeciwnym razie plan B staje się tylko formalnym zabezpieczeniem, a nie realną alternatywą. To ważne, bo decyzje rekrutacyjne potrafią być nieprzewidywalne nawet przy mocnym profilu.`,
      `Przed wysłaniem aplikacji związanej z tematem ${topic} warto przy każdej uczelni dopisać jedno zdanie: “ta opcja ma sens, ponieważ…”. Jeśli trudno je napisać, to znak, że wybór wymaga doprecyzowania albo usunięcia z listy. Taki filtr jest prosty, ale bardzo skutecznie usuwa przypadkowe aplikacje.`,
      renderList([
        "każda uczelnia powinna mieć jasną rolę na liście,",
        "lista powinna łączyć ambicję, realizm i finansową wykonalność,",
        "opcje bezpieczniejsze nadal muszą być opcjami, które naprawdę akceptujesz,",
        "przy każdej aplikacji zapisz konkretny powód, dla którego warto ją wysłać.",
      ]),
    ].join("\n\n"),
    [
      "## Jak czytać wymagania formalne bez błędnych założeń",
      `Wymagania formalne przy temacie ${topic} warto czytać dosłownie, ale nie mechanicznie. Uczelnia może napisać, że akceptuje kandydatów międzynarodowych, ale dopiero szczegóły pokażą, czy dotyczy to polskiej matury, konkretnego poziomu języka, wybranych przedmiotów albo określonego typu dokumentów. Wiele nieporozumień bierze się z tego, że kandydat zatrzymuje się na ogólnym opisie i nie dochodzi do sekcji admissions requirements.`,
      `Najważniejsze jest rozdzielenie wymagań minimalnych od profilu konkurencyjnego. Minimalne wymaganie mówi, czy aplikacja może zostać rozpatrzona. Profil konkurencyjny mówi, czy kandydat ma realną szansę w danym naborze. Przy temacie ${topic} ta różnica może być bardzo duża: spełnienie progu językowego lub ocenowego nie zawsze oznacza, że aplikacja będzie mocna na tle innych osób.`,
      `Trzeba też sprawdzać, dla kogo napisane są dane wymagania. Inne zasady mogą obowiązywać kandydatów z UE, spoza UE, z IB, z maturą polską, po gap year, na licencjat, na magisterkę albo na program zawodowy. Jeśli artykuł o temacie ${topic} nie rozróżnia tych grup, może być dobrym wprowadzeniem, ale nie powinien być jedyną podstawą decyzji.`,
      `W praktyce przy temacie ${topic} najlepiej zrobić osobną notatkę “wymagania twarde” i osobną “elementy wzmacniające”. Do pierwszej trafiają rzeczy konieczne: dokument, termin, wynik, przedmiot, opłata. Do drugiej: aktywności, dodatkowe kursy, doświadczenia, projekty, lektury i elementy profilu, które mogą pomóc, ale nie zastępują formalnego spełnienia wymagań.`,
      renderList([
        "sprawdź, czy wymagania dotyczą dokładnie Twojego poziomu studiów i typu matury,",
        "oddziel minimum formalne od realnej konkurencyjności profilu,",
        "zapisz wymagane dokumenty osobno dla każdej uczelni, nawet jeśli wyglądają podobnie,",
        "przy niejasnościach wróć do oficjalnej strony programu albo działu admissions.",
      ]),
    ].join("\n\n"),
    [
      "## Jak mierzyć postęp, żeby nie mylić pracy z ruchem w miejscu",
      `Przy temacie ${topic} łatwo mieć wrażenie dużej produktywności, bo proces generuje wiele drobnych zadań. Można czytać kolejne strony, poprawiać nazwy folderów, oglądać materiały o uczelniach i zbierać linki, a mimo to nie zbliżać się do wysłania lepszej aplikacji. Dlatego warto mierzyć postęp nie liczbą godzin, tylko jakością decyzji i gotowością konkretnych elementów.`,
      `Dobry wskaźnik postępu w pracy nad tematem ${topic} to zamknięta decyzja. Na przykład: wybrane trzy kraje do porównania, usunięta uczelnia bez sensu finansowego, gotowa lista dokumentów, ustalony termin testu, wybrany nauczyciel do rekomendacji albo ukończona druga wersja tekstu. Takie punkty są bardziej przydatne niż ogólne “robiłem research”, bo pokazują, że proces idzie do przodu.`,
      `Drugim wskaźnikiem jest malejąca liczba niewiadomych. Na początku pracy nad tematem ${topic} naturalne jest mieć dużo pytań. Po dobrym tygodniu pracy część z nich powinna zmienić się w odpowiedzi, a część w konkretne zadania. Jeśli lista pytań tylko rośnie, trzeba zmienić metodę: mniej przypadkowego czytania, więcej porównywania i weryfikacji u źródeł.`,
      `Trzecim wskaźnikiem przy temacie ${topic} jest spójność. Jeśli lista uczelni, dokumenty, teksty i budżet opowiadają tę samą historię, kandydat jest bliżej mocnej aplikacji. Jeśli każdy element ciągnie w inną stronę, sama liczba wykonanych zadań nie wystarczy. Wtedy warto zatrzymać się i wrócić do pytania, jaki jest główny cel całego procesu.`,
      renderList([
        "mierz postęp zamkniętymi decyzjami, a nie liczbą otwartych kart,",
        "co tydzień zapisuj, które pytania zmieniły się w odpowiedzi lub zadania,",
        "sprawdzaj, czy lista uczelni, teksty i budżet nadal do siebie pasują,",
        "jeśli działasz dużo, ale nic się nie domyka, ogranicz zakres researchu i wróć do priorytetów.",
      ]),
    ].join("\n\n"),
    [
      "## Jak rozmawiać o tej decyzji z rodziną albo nauczycielem",
      `Decyzje związane z tematem ${topic} rzadko dzieją się w próżni. Nawet jeśli to kandydat będzie studiował, w procesie pojawiają się rodzice, nauczyciele, mentorzy, czasem znajomi i absolwenci. Każda z tych osób może wnieść coś wartościowego, ale tylko wtedy, gdy rozmowa dotyczy konkretów, a nie ogólnego “czy warto wyjechać”.`,
      `Z rodziną najlepiej rozmawiać o scenariuszach. Przy temacie ${topic} rodzice zwykle potrzebują zobaczyć koszt, bezpieczeństwo, mieszkanie, terminy i sens dyplomu. Uczeń z kolei często zaczyna od kierunku, marzenia albo reputacji uczelni. Te perspektywy da się połączyć, jeśli rozmowa opiera się na tabeli opcji, a nie na pojedynczym przykładzie z internetu.`,
      `Z nauczycielem rozmowa powinna dotyczyć profilu akademickiego i rekomendacji. Warto pokazać mu, jakie programy rozważasz, jakie cechy chcesz podkreślić i jakie przykłady najlepiej pokazują Twoją pracę. Przy temacie ${topic} dobra rekomendacja nie powinna być ogólnym listem pochwalnym, tylko potwierdzeniem cech ważnych dla wybranego kierunku i systemu rekrutacji.`,
      `Warto też uważać na nadmiar opinii wokół tematu ${topic}. Pięć osób może mieć pięć różnych przekonań o najlepszym kraju, uczelni albo kierunku. Pomocne są te opinie, które prowadzą do sprawdzenia faktów lub lepszej decyzji. Mniej pomocne są te, które tylko zwiększają presję. Ostatecznie kandydat potrzebuje planu, który jest zrozumiały dla rodziny, ale nadal jego własny.`,
      renderList([
        "z rodziną rozmawiaj na podstawie kosztów, terminów i konkretnych opcji,",
        "z nauczycielem omawiaj profil, przykłady i cel rekomendacji,",
        "oddziel fakty od opinii osób, które znają tylko fragment procesu,",
        "nie pozwól, żeby duża liczba głosów zastąpiła własną, uporządkowaną strategię.",
      ]),
    ].join("\n\n"),
    [
      "## Co zrobić po przeczytaniu tego przewodnika",
      `Po lekturze artykułu o temacie ${topic} najlepiej nie przechodzić od razu do kolejnego poradnika. Dużo większą wartość ma krótka praca własna: zapisanie wniosków, pytań i kolejnych kroków. Dzięki temu wiedza nie zostaje tylko ogólnym poczuciem, że temat jest “bardziej znany”, ale zaczyna działać w procesie aplikacyjnym.`,
      `Pierwszy krok po lekturze tekstu „${seed.title}” to decyzja robocza. Może brzmieć: sprawdzam trzy opcje w obszarze ${angle.label}, porównuję dwa kraje, zapisuję się na test, proszę nauczyciela o rozmowę albo liczę budżet pierwszego roku. Decyzja nie musi być ostateczna, ale powinna przesuwać proces do przodu.`,
      `Drugi krok to pytanie do weryfikacji. Przy temacie ${topic} najczęściej będzie dotyczyć terminu, wymaganego przedmiotu, kosztu, języka, dokumentu albo warunku stypendium. Najlepiej od razu przypisać to pytanie do oficjalnego źródła, które trzeba sprawdzić.`,
      `Trzeci krok po lekturze o temacie ${topic} to zadanie w kalendarzu. Jeśli wiedza nie trafia do kalendarza, bardzo łatwo wrócić do ogólnego researchu. Wystarczy jedno konkretne działanie w tym tygodniu, żeby artykuł stał się częścią realnego planu, a nie tylko kolejną przeczytaną stroną.`,
      renderList([
        "zapisz jedną decyzję roboczą wynikającą z artykułu,",
        "zapisz jedno pytanie, które trzeba sprawdzić u źródła,",
        "dodaj jedno konkretne zadanie do kalendarza na najbliższy tydzień,",
        "wróć do tej notatki po kilku dniach i usuń opcje, które przestały mieć sens.",
      ]),
    ].join("\n\n"),
  ].join("\n\n");
}

function buildLongFormExpansion(seed: ArticleSeed) {
  const isCountry =
    hasCategory(seed, "dania") ||
    hasCategory(seed, "holandia") ||
    hasCategory(seed, "wielka-brytania") ||
    hasCategory(seed, "niemcy") ||
    hasCategory(seed, "wlochy") ||
    hasCategory(seed, "szwecja") ||
    hasCategory(seed, "usa") ||
    hasCategory(seed, "kanada");
  const isSubject =
    hasCategory(seed, "ekonomia") ||
    hasCategory(seed, "prawo") ||
    hasCategory(seed, "psychologia") ||
    hasCategory(seed, "medycyna") ||
    hasCategory(seed, "informatyka");
  const isFinance = hasCategory(seed, "koszty") || hasCategory(seed, "stypendia") || hasCategory(seed, "financial-aid");
  const isUs = hasCategory(seed, "usa") || hasCategory(seed, "common-app");

  const context = isCountry
    ? "kraju, systemu rekrutacji i konkretnego programu"
    : isSubject
      ? "kierunku, programu i profilu kandydata"
      : isFinance
        ? "budżetu, stypendiów i realnego kosztu wyjazdu"
        : isUs
          ? "amerykańskiego systemu aplikacji, listy uczelni i narracji kandydata"
          : "strategii aplikacyjnej, dokumentów i decyzji o dalszych krokach";

  return [
    [
      "## Jak prowadzić research, żeby nie utknąć w chaosie",
      `Przy temacie takim jak ${seed.title.toLowerCase()} bardzo łatwo pomylić research z realnym przygotowaniem. Kandydat otwiera kilkanaście kart, zapisuje przypadkowe linki, ogląda krótkie poradniki i ma poczucie, że wie coraz więcej, ale po tygodniu nadal nie ma jasnej listy decyzji. Problem nie polega wtedy na braku informacji, tylko na braku struktury. Dlatego research warto prowadzić jak projekt: z pytaniami, źródłami, notatkami i momentem, w którym wiedza zamienia się w działanie.`,
      `Najpierw trzeba ustalić, jakie informacje są naprawdę krytyczne dla Twojej sytuacji. W przypadku ${context} będą to zwykle wymagania formalne, terminy, koszty, język, poziom selektywności i dopasowanie programu. Dopiero później warto czytać opinie, blogi, filmy i materiały firm doradczych. Te źródła są pomocne, bo pokazują praktyczne doświadczenia, ale nie powinny zastępować oficjalnych stron uczelni ani systemów aplikacyjnych.`,
      "Dobra notatka researchowa powinna mieć formę porównania, a nie zbioru cytatów. Przy każdej uczelni albo opcji warto zapisać: co jest wymagane, do kiedy, ile kosztuje, co jest ryzykiem, co jest największym plusem i jakie pytanie nadal pozostaje otwarte. Taka tabela bardzo szybko pokazuje, które opcje są realne, które wymagają dodatkowego sprawdzenia, a które tylko dobrze wyglądały na początku.",
      "Warto też regularnie usuwać z listy opcje, które przestały mieć sens. Kandydaci często trzymają dziesiątki uczelni „na wszelki wypadek”, przez co tracą energię na rzeczy, które i tak nigdy nie trafią do finalnej aplikacji. Research ma zawężać decyzję, a nie stale ją rozmywać.",
      renderList([
        "zapisuj tylko informacje, które wpływają na decyzję lub kolejne działanie,",
        "oddziel oficjalne wymagania od opinii i opisów marketingowych,",
        "porównuj opcje w jednej tabeli, żeby szybciej widzieć różnice,",
        "co kilka dni usuwaj z listy opcje, które nie pasują do profilu, budżetu albo celu.",
      ]),
    ].join("\n\n"),
    [
      "## Jak porównywać opcje, kiedy każda wygląda dobrze na pierwszy rzut oka",
      "Strony uczelni i programów są pisane tak, żeby każdy kierunek brzmiał atrakcyjnie. Prawie wszędzie pojawi się międzynarodowe środowisko, praktyczne podejście, świetni wykładowcy, nowoczesny kampus i dobre perspektywy zawodowe. To nie znaczy, że te informacje są nieprawdziwe, ale oznacza, że same w sobie nie wystarczają do wyboru. Kandydat potrzebuje kryteriów porównania, które są bardziej konkretne niż ogólne wrażenie.",
      "Pierwsze kryterium to dopasowanie akademickie. Czy program rzeczywiście uczy tego, czego chcesz się nauczyć? Czy pierwszy rok zawiera przedmioty, które Cię interesują, czy raczej takie, które brzmią obco i nie pasują do Twoich mocnych stron? Czy wymagania wejściowe są spójne z Twoim profilem, czy trzeba będzie nadrabiać kluczowe braki już przed aplikacją?",
      "Drugie kryterium to dopasowanie systemowe. Ten sam kierunek może wyglądać zupełnie inaczej w USA, Wielkiej Brytanii, Holandii, Niemczech czy Skandynawii. Różni się nie tylko proces rekrutacji, ale też kontakt z wykładowcami, liczba egzaminów, rola pracy projektowej, elastyczność wyboru zajęć i sposób oceniania. Kandydat powinien wybrać nie tylko uczelnię, ale też środowisko, w którym będzie w stanie dobrze pracować.",
      "Trzecie kryterium to wykonalność. Nawet bardzo atrakcyjna opcja może nie mieć sensu, jeśli wymaga budżetu, dokumentów, testów lub języka, których kandydat realnie nie zdąży przygotować. Dobra strategia aplikacyjna nie polega na rezygnacji z ambicji, ale na takim ustawieniu listy, żeby ambicja miała techniczne i finansowe oparcie.",
      renderList([
        "porównuj programy przez plan zajęć, a nie tylko nazwę uczelni,",
        "sprawdź, czy styl nauki pasuje do Twojego sposobu pracy,",
        "policz czas i pieniądze potrzebne do przygotowania każdej opcji,",
        "zostaw na liście tylko te wybory, które są jednocześnie atrakcyjne i wykonalne.",
      ]),
    ].join("\n\n"),
    [
      "## Jak ułożyć harmonogram przygotowań bez pracy w ostatniej chwili",
      "Przy aplikacji na studia za granicą największym wrogiem jakości jest kompresja czasu. To nie jest tak, że kandydat w ostatnim tygodniu nagle traci zdolność pisania albo myślenia. Problem polega na tym, że w ostatnim tygodniu wszystkie decyzje zaczynają konkurować ze sobą naraz: trzeba poprawić esej, sprawdzić dokumenty, poprosić o rekomendację, przeliczyć koszty, potwierdzić termin i rozwiązać drobne problemy techniczne. Wtedy nawet dobre pomysły tracą precyzję.",
      "Najlepiej pracować od deadline’u wstecz. Jeśli aplikacja zamyka się konkretnego dnia, to własny termin ukończenia dokumentów powinien wypadać wcześniej. Jeśli nauczyciel ma napisać rekomendację, potrzebuje czasu i materiałów. Jeśli certyfikat językowy jest wymagany, trzeba uwzględnić rejestrację, wynik i ewentualną poprawkę. Jeśli tekst aplikacyjny ma być dobry, potrzebuje kilku wersji, a nie jednego wieczoru.",
      "Harmonogram powinien mieć też miejsce na decyzje, nie tylko zadania techniczne. Wybór uczelni, programu, kraju czy strategii finansowej to nie są rzeczy, które da się dopisać na końcu. One wpływają na wszystko inne. Kandydat, który nie wie, po co aplikuje do danej uczelni, będzie pisał słabsze dokumenty, nawet jeśli językowo będą poprawne.",
      "Warto myśleć o przygotowaniach w blokach: research, lista uczelni, dokumenty bazowe, testy, teksty, rekomendacje, finalna kontrola i wysyłka. Każdy blok powinien mieć własny termin i osobne kryterium ukończenia. Dzięki temu proces przestaje być jednym wielkim, mglistym zadaniem.",
      renderList([
        "ustal wewnętrzny deadline wcześniejszy niż oficjalny termin uczelni,",
        "oddziel zadania zależne od innych osób od tych, które możesz zrobić samodzielnie,",
        "zaplanuj minimum kilka rund pracy nad tekstami aplikacyjnymi,",
        "zostaw osobny czas na sprawdzenie plików, linków, formularzy i tłumaczeń.",
      ]),
    ].join("\n\n"),
    [
      "## Jak budować profil kandydata, żeby aplikacja była spójna",
      "Profil kandydata nie jest listą wszystkich aktywności, które udało się wpisać do CV. To raczej odpowiedź na pytanie, co łączy wyniki, zainteresowania, działania i decyzje edukacyjne danej osoby. Im bardziej selektywna uczelnia lub kierunek, tym większe znaczenie ma spójność. Komisja nie musi zobaczyć kandydata idealnego we wszystkim. Musi zobaczyć osobę, której wybory mają sens i która rozumie, dlaczego aplikuje właśnie tam.",
      "Dla jednych kandydatów osią profilu będzie zainteresowanie akademickie: matematyka, prawo, ekonomia, medycyna, psychologia, informatyka, języki albo nauki społeczne. Dla innych ważniejsza będzie inicjatywa społeczna, projekt technologiczny, doświadczenie artystyczne albo przedsiębiorczość. Kluczowe jest to, żeby nie próbować sztucznie dopisywać aktywności tylko dlatego, że brzmią prestiżowo. Dobra aplikacja zwykle jest bardziej przekonująca, gdy pokazuje kilka mocnych wątków niż wiele przypadkowych.",
      "Spójność profilu przydaje się także przy tekstach. Kandydat, który wie, jakie trzy lub cztery motywy są najważniejsze, łatwiej wybierze przykłady do eseju, poprosi właściwą osobę o rekomendację i wyjaśni, dlaczego dany kierunek lub kraj pasuje do jego drogi. Bez tego aplikacja może być pełna osiągnięć, ale nadal brzmieć rozproszona.",
      "Warto też pamiętać, że profil można wzmacniać nawet wtedy, gdy nie ma już lat na budowanie nowych aktywności. Czasem wystarczy lepiej opisać to, co kandydat już zrobił, znaleźć związek między doświadczeniami i pokazać refleksję. Uczelnie nie oceniają tylko samego faktu uczestnictwa, lecz także to, co kandydat z danego doświadczenia wyniósł.",
      renderList([
        "wybierz kilka głównych wątków, które naprawdę opisują Twój profil,",
        "nie dopisuj aktywności tylko dlatego, że brzmią dobrze w abstrakcji,",
        "pokazuj konsekwencję między kierunkiem, tekstami, rekomendacjami i wyborem uczelni,",
        "opisuj nie tylko co zrobiłeś, ale też czego się nauczyłeś i dlaczego to ma znaczenie.",
      ]),
    ].join("\n\n"),
    [
      "## Jak patrzeć na koszty, żeby decyzja była realistyczna",
      "Koszt studiów za granicą to nie tylko czesne. W praktyce o wykonalności wyjazdu decyduje suma wielu elementów: opłat uczelnianych, mieszkania, jedzenia, transportu, ubezpieczenia, podróży, materiałów, depozytów, opłat wizowych, kursów językowych, testów i kosztów pierwszych tygodni po przeprowadzce. Kandydaci często liczą tylko najłatwiej widoczną pozycję, a potem dopiero odkrywają, że realny budżet wygląda zupełnie inaczej.",
      "Finanse warto rozpatrywać w scenariuszach. Scenariusz minimalny pokazuje, ile trzeba mieć, żeby wyjazd był w ogóle możliwy. Scenariusz realistyczny uwzględnia mieszkanie w normalnej lokalizacji, codzienne życie i margines bezpieczeństwa. Scenariusz ostrożny zakłada, że coś może się opóźnić albo podrożeć. Dopiero porównanie tych wariantów pozwala spokojnie rozmawiać o tym, które kraje i uczelnie mają sens.",
      "Warto też oddzielić koszt pierwszego roku od kosztu całych studiów. Niektóre rozwiązania są wykonalne przez kilka miesięcy, ale nie przez trzy lub cztery lata. Przy kierunkach dłuższych, takich jak medycyna, to jeszcze ważniejsze, bo łączny koszt może być wielokrotnie wyższy niż intuicyjnie wydaje się na początku. Stypendium, praca dorywcza albo wsparcie rodziny powinny być policzone w czasie, a nie tylko jako jednorazowa deklaracja.",
      "Dobra decyzja finansowa nie musi oznaczać wyboru najtańszej opcji. Czasem droższy program ma sens, jeśli otwiera realnie lepsze możliwości, pasuje do profilu i jest finansowo wykonalny. Problem zaczyna się wtedy, gdy kandydat wybiera opcję prestiżową bez planu pokrycia kosztów albo tanią bez sprawdzenia jakości i dopasowania.",
      renderList([
        "licz cały koszt studiowania, nie tylko czesne,",
        "porównuj scenariusz minimalny, realistyczny i ostrożny,",
        "sprawdź, czy finansowanie jest możliwe przez cały okres studiów,",
        "uwzględnij koszty pierwszych tygodni, bo często pojawiają się przed pierwszym regularnym budżetem.",
      ]),
    ].join("\n\n"),
    [
      "## Jak ocenić ryzyko i mieć sensowny plan B",
      "Plan B w aplikacji na studia za granicą nie jest oznaką braku ambicji. Jest oznaką dojrzałej strategii. Nawet bardzo mocny kandydat może nie dostać się na najbardziej selektywne uczelnie, przegapić termin stypendium, uzyskać gorszy wynik z testu albo odkryć, że koszty mieszkania zmieniają sens wyjazdu. Dobra lista uczelni uwzględnia te ryzyka wcześniej, zamiast reagować dopiero po decyzjach rekrutacyjnych.",
      "Ryzyko ma kilka rodzajów. Jest ryzyko akademickie, czyli pytanie, czy kandydat spełnia wymagania i ma realne szanse. Jest ryzyko finansowe, czyli czy oferta będzie wykonalna nawet po przyjęciu. Jest ryzyko logistyczne, związane z mieszkaniem, wizą, dokumentami i terminami. Jest też ryzyko dopasowania: czy kandydat naprawdę będzie chciał studiować na danym programie, jeśli dostanie ofertę.",
      "Najczęściej dobry plan B nie oznacza jednej słabszej uczelni wrzuconej na koniec listy. Oznacza zestaw alternatyw, które nadal są sensowne: inny kraj, podobny kierunek w bardziej realistycznym systemie, uczelnia z lepszym finansowaniem albo przesunięcie ambicji na poziom magisterski. Taki plan daje kandydatowi większy spokój i chroni przed decyzjami podejmowanymi pod presją.",
      "Warto też odróżnić plan B od przypadkowej rezygnacji. Jeśli alternatywa nie pasuje do celu, profilu ani budżetu, nie jest dobrym zabezpieczeniem. Powinna być mniej ryzykowna, ale nadal wartościowa.",
      renderList([
        "sprawdź osobno ryzyko akademickie, finansowe, logistyczne i osobiste,",
        "buduj plan B z opcji, które nadal realnie chcesz rozważyć,",
        "nie opieraj całego procesu na jednej selektywnej uczelni lub jednym kraju,",
        "traktuj alternatywy jako część strategii, a nie porażkę.",
      ]),
    ].join("\n\n"),
    [
      "## Jak rozmawiać o decyzji z rodzicami, nauczycielami i doradcami",
      "Aplikacja na studia za granicą rzadko jest decyzją jednej osoby w pełnej izolacji. Nawet jeśli to uczeń będzie studiował, w procesie pojawiają się rodzice, nauczyciele, doradcy, mentorzy i czasem znajomi, którzy mają własne opinie. To może pomagać, ale może też prowadzić do chaosu, jeśli każdy ocenia decyzję innymi kryteriami. Jedna osoba patrzy na prestiż, druga na koszt, trzecia na bezpieczeństwo, a czwarta na marzenie kandydata.",
      "Dlatego warto na początku ustalić, jakie kryteria są najważniejsze dla wszystkich stron. Rodzice często potrzebują zrozumieć budżet, bezpieczeństwo, mieszkanie i sens dyplomu. Nauczyciel może pomóc ocenić potencjał akademicki. Mentor albo doradca może uporządkować systemy aplikacji i dokumenty. Kandydat powinien natomiast zachować własny głos, bo to on będzie później żył z tą decyzją na co dzień.",
      "Dobre rozmowy o studiach za granicą są konkretne. Zamiast pytać ogólnie, czy „warto wyjechać”, lepiej rozmawiać o trzech porównywalnych opcjach, kosztach, terminach, szansach i konsekwencjach. Taka rozmowa jest mniej emocjonalna i bardziej decyzyjna. Łatwiej wtedy zobaczyć, czy spór dotyczy faktów, pieniędzy, ryzyka czy wyobrażeń o przyszłości.",
      "Warto też wracać do rozmowy etapami. Decyzja, która wydaje się trudna w październiku, może wyglądać inaczej po wynikach testów, po pierwszych wersjach esejów albo po lepszym policzeniu kosztów. Proces aplikacji jest dynamiczny, więc dobra komunikacja powinna aktualizować się razem z nim.",
      renderList([
        "ustal wspólne kryteria oceny opcji: jakość, koszt, ryzyko, dopasowanie i terminy,",
        "rozmawiaj o konkretnych programach, a nie tylko ogólnych krajach lub rankingach,",
        "oddziel fakty od obaw i od preferencji każdej osoby,",
        "wracaj do decyzji po kolejnych etapach, bo nowe informacje mogą zmienić układ sił.",
      ]),
    ].join("\n\n"),
    [
      "## Kiedy warto poprosić o pomoc i jak ocenić jej jakość",
      "Nie każda aplikacja wymaga wsparcia z zewnątrz, ale wiele procesów zyskuje na dobrej drugiej parze oczu. Pomoc jest szczególnie wartościowa wtedy, gdy kandydat łączy kilka krajów, potrzebuje finansowania, aplikuje na selektywny kierunek, ma nietypowy profil albo czuje, że research przestał prowadzić do decyzji. W takich sytuacjach problemem nie jest brak ambicji, tylko liczba zależnych od siebie elementów.",
      "Dobra pomoc nie powinna polegać na obietnicach ani pisaniu aplikacji za ucznia. Powinna raczej porządkować proces, zadawać trafne pytania, pokazywać konsekwencje decyzji i pomagać kandydatowi mówić własnym głosem. Jeśli ktoś obiecuje przyjęcie albo przedstawia jedną uniwersalną listę uczelni dla wszystkich, warto zachować ostrożność. Aplikacja jest zbyt indywidualna, żeby działała według jednego szablonu.",
      "Warto też oceniać wsparcie po jakości wyjaśnień. Dobry doradca albo mentor potrafi powiedzieć nie tylko, co zrobić, ale dlaczego. Kandydat powinien rozumieć sens zmian w liście uczelni, tekstach, dokumentach czy harmonogramie. Jeśli po spotkaniach uczeń ma mniej chaosu i więcej sprawczości, to zwykle dobry znak.",
      "Pomoc może dotyczyć całego procesu albo tylko jednego etapu: wyboru kraju, tekstów, testów, dokumentów, rozmów kwalifikacyjnych albo finansowania. Najważniejsze, żeby zakres wsparcia odpowiadał realnemu problemowi, a nie był kupowany dlatego, że proces wydaje się stresujący w ogóle.",
      renderList([
        "szukaj pomocy wtedy, gdy problem jest strategiczny, a nie tylko techniczny,",
        "oceniaj wsparcie po jakości pytań, wyjaśnień i uporządkowania procesu,",
        "unikaj obietnic przyjęcia i gotowych szablonów bez analizy profilu,",
        "upewnij się, że finalna aplikacja nadal brzmi jak kandydat, a nie jak dorosły konsultant.",
      ]),
    ].join("\n\n"),
  ].join("\n\n");
}

function buildAdvancedLongFormExpansion(seed: ArticleSeed) {
  const isCountry =
    hasCategory(seed, "dania") ||
    hasCategory(seed, "holandia") ||
    hasCategory(seed, "wielka-brytania") ||
    hasCategory(seed, "niemcy") ||
    hasCategory(seed, "wlochy") ||
    hasCategory(seed, "szwecja") ||
    hasCategory(seed, "usa") ||
    hasCategory(seed, "kanada");
  const isSubject =
    hasCategory(seed, "ekonomia") ||
    hasCategory(seed, "prawo") ||
    hasCategory(seed, "psychologia") ||
    hasCategory(seed, "medycyna") ||
    hasCategory(seed, "informatyka");
  const isFinance = hasCategory(seed, "koszty") || hasCategory(seed, "stypendia") || hasCategory(seed, "financial-aid");

  const angle = isCountry
    ? "wyboru kraju i konkretnego systemu edukacji"
    : isSubject
      ? "wyboru kierunku, uczelni i dalszej ścieżki zawodowej"
      : isFinance
        ? "finansowania, stypendiów i długoterminowej wykonalności wyjazdu"
        : "planowania aplikacji, dokumentów i decyzji strategicznych";

  return [
    [
      "## Jak odróżnić dobrą informację od informacji, która tylko dobrze brzmi",
      `W temacie ${angle} kandydaci bardzo często trafiają na treści, które są poprawne, ale zbyt ogólne, żeby naprawdę pomagały w decyzji. Zdanie typu „warto zacząć wcześniej” albo „sprawdź wymagania uczelni” jest prawdziwe, ale nie mówi jeszcze, co dokładnie zrobić jutro rano. Dobra informacja powinna mieć konsekwencję praktyczną: zmieniać listę uczelni, harmonogram, budżet, wybór testu, treść eseju albo sposób rozmowy z nauczycielem i rodzicami.`,
      "Dlatego przy researchu warto każde źródło oceniać przez trzy pytania. Po pierwsze: czy ta informacja jest aktualna i pochodzi z miejsca, które ma prawo znać szczegóły? Po drugie: czy dotyczy mojego poziomu studiów, kraju pochodzenia i konkretnego programu, czy jest ogólnym opisem dla wszystkich? Po trzecie: czy po przeczytaniu wiem, jaka decyzja albo działanie wynika z tej informacji? Jeśli odpowiedź na trzecie pytanie brzmi „nie”, informacja może być ciekawa, ale niekoniecznie operacyjna.",
      "Materiały firm doradczych, takich jak te obecne na polskim rynku edukacji zagranicznej, mogą być użyteczne, bo często pokazują praktyczny język procesu: terminy, dokumenty, różnice między krajami i typowe błędy. Nadal jednak trzeba je zestawiać z oficjalnymi stronami uczelni i systemów aplikacyjnych. Dobra strategia korzysta z wielu źródeł, ale nie miesza ich rangi. Oficjalne wymaganie jest ważniejsze niż opis marketingowy, a doświadczenie praktyczne pomaga je zinterpretować.",
      renderList([
        "sprawdzaj, czy informacja dotyczy Twojego poziomu studiów i statusu kandydata,",
        "oddziel inspirację od wymagania formalnego,",
        "zapisuj tylko te wnioski, które prowadzą do decyzji lub zadania,",
        "wracaj do oficjalnego źródła zawsze wtedy, gdy chodzi o termin, opłatę, test albo dokument.",
      ]),
    ].join("\n\n"),
    [
      "## Jak wygląda dobra decyzja końcowa",
      "Dobra decyzja o aplikacji rzadko daje poczucie absolutnej pewności. Częściej jest dobrze uzasadnionym wyborem między kilkoma sensownymi opcjami. Kandydat wie, dlaczego dana uczelnia trafia na listę, jakie ma ryzyka, ile kosztuje, jakie dokumenty są potrzebne i co musi się wydarzyć, żeby aplikacja była mocna. To jest dużo bardziej wartościowe niż emocjonalne przekonanie, że jedna opcja jest „najlepsza”, bo dobrze wygląda w rankingu albo na stronie internetowej.",
      "W praktyce dobra decyzja końcowa powinna łączyć cztery warstwy. Pierwsza to dopasowanie akademickie: program uczy rzeczy, które kandydat naprawdę chce studiować. Druga to dopasowanie rekrutacyjne: wymagania są ambitne, ale zrozumiałe i możliwe do przygotowania. Trzecia to dopasowanie finansowe: wyjazd jest wykonalny w realistycznym scenariuszu, nie tylko w najbardziej optymistycznym. Czwarta to dopasowanie życiowe: kraj, miasto, język i styl nauki są czymś, w czym kandydat może funkcjonować przez kilka lat.",
      "Jeśli któraś z tych warstw jest bardzo słaba, warto się zatrzymać. Czasem uczelnia jest świetna akademicko, ale finansowo nierealna. Czasem kraj wygląda atrakcyjnie, ale program nie pasuje do kierunku rozwoju. Czasem aplikacja jest formalnie możliwa, ale wymaga testu albo dokumentów, których kandydat nie zdąży przygotować. To nie zawsze znaczy, że trzeba zrezygnować, ale na pewno znaczy, że decyzja wymaga dodatkowej pracy.",
      renderList([
        "sprawdź osobno dopasowanie akademickie, rekrutacyjne, finansowe i życiowe,",
        "nie myl prestiżu uczelni z dopasowaniem programu,",
        "traktuj ryzyka jako element decyzji, a nie coś, o czym pomyślisz później,",
        "wybieraj opcje, które da się obronić konkretnymi argumentami, nie tylko intuicją.",
      ]),
    ].join("\n\n"),
    [
      "## Jak wygląda etap finalizacji aplikacji",
      "Finalizacja aplikacji jest często bardziej techniczna niż ekscytująca, ale właśnie wtedy łatwo popełnić błędy. Kandydat ma już wybrane uczelnie, przygotowane teksty i dokumenty, ale musi jeszcze upewnić się, że wszystko jest zgodne z wymaganiami systemu. To oznacza sprawdzenie nazw plików, formatów, podpisów, dat, tłumaczeń, limitów znaków, kolejności załączników, danych osobowych i sposobu wysyłki. Brzmi prosto, ale przy kilku krajach i kilkunastu portalach drobne różnice potrafią zmęczyć nawet bardzo zorganizowaną osobę.",
      "Warto przygotować osobną checklistę finalną dla każdej uczelni. Nie chodzi o powtarzanie ogólnych punktów, lecz o techniczne potwierdzenie: czy ten program chce dokładnie ten certyfikat, czy ten tekst mieści się w limicie, czy rekomendacja została wysłana, czy opłata aplikacyjna przeszła, czy portal pokazuje status complete, czy termin jest liczony w konkretnej strefie czasowej. Takie drobiazgi mogą decydować o tym, czy aplikacja w ogóle zostanie oceniona.",
      "Dobrą praktyką jest także finalny przegląd logiczny, nie tylko techniczny. Warto przeczytać cały zestaw materiałów tak, jak zobaczy go komisja. Czy CV, teksty, rekomendacje i wybór programu tworzą spójną historię? Czy kandydat powtarza stale te same informacje, czy każdy element wnosi coś nowego? Czy najważniejsze atuty są widoczne, czy giną między detalami? Ten ostatni przegląd często pozwala wyłapać rzeczy, których nie widać przy pracy nad jednym dokumentem.",
      renderList([
        "przygotuj osobną checklistę finalną dla każdej uczelni,",
        "sprawdź status wysyłki rekomendacji i dokumentów zależnych od innych osób,",
        "zostaw czas na techniczne problemy portalu aplikacyjnego,",
        "przeczytaj cały zestaw aplikacyjny jako jedną historię kandydata.",
      ]),
    ].join("\n\n"),
    [
      "## Jak ocenić wynik po wysłaniu aplikacji i co robić dalej",
      "Po wysłaniu aplikacji kandydaci często wpadają w zawieszenie: z jednej strony najważniejsza praca została wykonana, z drugiej strony decyzje jeszcze nie przyszły. Ten czas warto wykorzystać mądrze. Nie chodzi o obsesyjne odświeżanie portalu, tylko o przygotowanie się na różne scenariusze. Oferta bezwarunkowa, oferta warunkowa, lista rezerwowa, odrzucenie, prośba o dodatkowe dokumenty albo rozmowa kwalifikacyjna wymagają innych reakcji.",
      "Jeśli przychodzi oferta, trzeba sprawdzić nie tylko sam fakt przyjęcia, ale też warunki. Czy trzeba dostarczyć konkretny wynik matury, certyfikat, depozyt albo dokument finansowy? Do kiedy trzeba odpowiedzieć? Czy można czekać na inne uczelnie? Czy oferta zmienia plan budżetowy? Wiele osób celebruje przyjęcie i dopiero później zauważa, że najważniejsze terminy po ofercie są bardzo krótkie.",
      "Jeśli przychodzi odmowa, warto potraktować ją jako informację, a nie podsumowanie wartości kandydata. W selektywnych systemach odmowy są częścią procesu nawet dla bardzo mocnych osób. Ważne jest to, czy lista uczelni była zbudowana tak, żeby jedna decyzja nie kończyła całego planu. Jeśli strategia była zbalansowana, kandydat ma kolejne opcje i może spokojnie porównać wyniki.",
      "Po decyzjach warto też zrobić krótką analizę procesu. Co zadziałało dobrze? Co było zrobione za późno? Które informacje były naprawdę pomocne, a które tylko zabierały czas? Ta refleksja przydaje się szczególnie wtedy, gdy kandydat będzie później aplikował na magisterkę, stypendium, praktyki albo kolejny program.",
      renderList([
        "po ofercie sprawdź warunki, terminy odpowiedzi i konsekwencje finansowe,",
        "po odmowie wróć do całej listy, zamiast oceniać proces po jednej decyzji,",
        "przygotuj się na rozmowy, dodatkowe dokumenty albo warunki końcowe,",
        "zapisz wnioski z procesu, bo przydadzą się przy kolejnych etapach edukacji.",
      ]),
    ].join("\n\n"),
  ].join("\n\n");
}

function buildFinalLongFormLayer(seed: ArticleSeed) {
  return [
    "## Co zapisać po przeczytaniu tego artykułu",
    `Po lekturze artykułu o temacie „${seed.title}” warto nie kończyć pracy na ogólnym poczuciu, że temat jest już jaśniejszy. Najbardziej praktyczne jest krótkie podsumowanie własnej sytuacji: które informacje bezpośrednio zmieniają Twoją strategię, które wymagają sprawdzenia na stronach uczelni, a które są tylko tłem do późniejszej decyzji. To proste ćwiczenie bardzo szybko oddziela wiedzę użyteczną od wiedzy, która brzmi ciekawie, ale nie prowadzi do żadnego kroku.`,
    "Najlepiej zapisać trzy rzeczy. Po pierwsze: decyzję, którą możesz podjąć już teraz, nawet jeśli jest robocza. Po drugie: pytanie, na które trzeba znaleźć konkretną odpowiedź w oficjalnym źródle. Po trzecie: działanie do wykonania w najbliższym tygodniu. Dzięki temu artykuł staje się częścią procesu aplikacyjnego, a nie tylko kolejną przeczytaną stroną.",
    "Warto też wrócić do tego podsumowania po kilku dniach. Często dopiero po krótkim czasie widać, czy dana opcja naprawdę ma sens, czy tylko była atrakcyjna w pierwszym kontakcie. Aplikacja na studia za granicą jest maratonem decyzyjnym: wygrywa nie ten, kto przeczyta najwięcej, ale ten, kto najlepiej zamienia informacje na trafne decyzje i spokojne działanie.",
  ].join("\n\n");
}

function buildDefaultFaq(seed: ArticleSeed): FaqItem[] {
  if (seed.faq?.length) {
    return seed.faq;
  }

  if (
    hasCategory(seed, "dania") ||
    hasCategory(seed, "holandia") ||
    hasCategory(seed, "wielka-brytania") ||
    hasCategory(seed, "niemcy") ||
    hasCategory(seed, "wlochy") ||
    hasCategory(seed, "szwecja") ||
    hasCategory(seed, "usa") ||
    hasCategory(seed, "kanada")
  ) {
    return [
      {
        question: "Czy do tego kraju da się aplikować z polską maturą?",
        answer:
          `W kontekście artykułu „${seed.title}” w wielu przypadkach tak, ale zawsze trzeba sprawdzić oficjalne wymagania konkretnej uczelni i programu. Różnice dotyczą nie tylko samych ocen, ale też wymaganych przedmiotów, poziomu języka, dokumentów i terminów.`,
      },
      {
        question: "Czy studia po angielsku oznaczają, że nie trzeba znać języka lokalnego?",
        answer:
          `Nie zawsze. Przy temacie „${seed.title}” program może być po angielsku, ale mieszkanie, administracja, praca dorywcza, praktyki albo kontakt z pacjentami i klientami mogą w praktyce wymagać lokalnego języka. To warto ocenić przed wyborem kraju.`,
      },
      {
        question: "Ile wcześniej warto zacząć przygotowania?",
        answer:
          `Przy temacie „${seed.title}” bezpiecznie jest zacząć co najmniej kilka miesięcy przed pierwszymi deadline’ami, a przy bardziej selektywnych krajach lub kierunkach nawet rok wcześniej. Dzięki temu da się spokojnie zaplanować język, dokumenty, listę uczelni i ewentualne egzaminy dodatkowe.`,
      },
      {
        question: "Czy warto porównywać kilka krajów jednocześnie?",
        answer:
          `Tak, również przy temacie „${seed.title}”, bo dopiero porównanie pokazuje, która opcja najlepiej łączy jakość programu, koszty, język, styl nauki i realne szanse przyjęcia. Kandydaci, którzy od razu zawężają się do jednego kraju, częściej tracą lepsze alternatywy.`,
      },
    ];
  }

  if (
    hasCategory(seed, "ekonomia") ||
    hasCategory(seed, "prawo") ||
    hasCategory(seed, "psychologia") ||
    hasCategory(seed, "medycyna") ||
    hasCategory(seed, "informatyka")
  ) {
    return [
      {
        question: "Czy ten kierunek wymaga bardzo konkretnego profilu przedmiotowego?",
        answer:
          "Często tak. Uczelnie patrzą nie tylko na ogólne oceny, ale też na to, czy kandydat ma mocne wyniki z przedmiotów najbardziej związanych z kierunkiem, na przykład z matematyki, biologii, chemii albo przedmiotów humanistycznych.",
      },
      {
        question: "Czy aktywności pozaszkolne naprawdę mają znaczenie?",
        answer:
          "Tak, ale tylko wtedy, gdy są sensownie powiązane z kierunkiem i pokazują realne zainteresowanie, samodzielność albo dojrzałość. Sama liczba aktywności zwykle znaczy mniej niż ich jakość i to, co kandydat z nich wyniósł.",
      },
      {
        question: "Czy warto aplikować na ten kierunek do kilku krajów naraz?",
        answer:
          "Najczęściej tak, bo różne kraje oceniają kandydatów inaczej. Ta sama osoba może być bardzo mocna w jednym systemie, a znacznie słabsza w innym, więc porównanie kilku ścieżek zwykle poprawia jakość strategii.",
      },
      {
        question: "Kiedy najlepiej zacząć przygotowania pod taki kierunek?",
        answer:
          "Im bardziej selektywny kierunek, tym wcześniej warto działać. Przygotowania obejmują nie tylko dokumenty, ale też profil, doświadczenia, testy, esej i wybór krajów, więc rozsądnie jest zacząć zanim pojawi się presja najbliższych terminów.",
      },
    ];
  }

  return [
    {
      question: "Czy taki temat warto rozstrzygać jeszcze przed wyborem uczelni?",
      answer:
        `Tak. W temacie „${seed.title}” większość strategicznych decyzji najlepiej podjąć wcześnie, bo wpływają na wybór kraju, harmonogram pracy, koszty i listę dokumentów.`,
    },
    {
      question: "Czy polska matura zwykle wystarcza do aplikacji za granicę?",
      answer:
        `Często tak, ale przy temacie „${seed.title}” znaczenie mają konkretne przedmioty, poziomy i wymagania programu. To właśnie dlatego trzeba zawsze sprawdzać uczelnię i kierunek osobno.`,
    },
    {
      question: "Czy taki artykuł wystarczy, żeby podjąć decyzję?",
      answer:
        `Artykuł „${seed.title}” dobrze porządkuje temat, ale nie zastąpi indywidualnej strategii. W praktyce decyzja powinna wynikać z połączenia profilu kandydata, budżetu, kierunku, terminów i realnych szans.`,
    },
    {
      question: "Co zrobić po przeczytaniu tego artykułu?",
      answer:
        `Po przeczytaniu tekstu „${seed.title}” najlepiej zapisać konkretne wnioski dla własnej sytuacji: jakie kraje lub uczelnie sprawdzić, jakich terminów pilnować i które elementy aplikacji trzeba zacząć przygotowywać jako pierwsze.`,
    },
  ];
}

function renderArticleMarkdown(seed: ArticleSeed) {
  const [firstIntro, ...remainingIntro] = seed.intro;
  const related = renderList(
    seed.related.map((item) => `[${item.title}](${item.slug})`),
  );
  const faq = renderFaq(buildDefaultFaq(seed));

  return [
    `# ${seed.title}`,
    firstIntro,
    ARTICLE_CONTACT_FORM_MARKER,
    ...remainingIntro,
    ...seed.sections.map(renderSection),
    buildDecisionSection(seed),
    buildChecklist(seed),
    buildOfficialSourcesSection(seed),
    buildDeepDiveSection(seed),
    buildScenarioSection(seed),
    buildExecutionSection(seed),
    buildArticleSpecificLongForm(seed),
    faq,
    "## Jak może pomóc Acadea?",
    `Ten przewodnik po temacie „${seed.title}” porządkuje najważniejsze decyzje, ale najlepszy plan aplikacyjny zawsze powinien wynikać z konkretnej sytuacji kandydata. W praktyce liczą się jednocześnie: kraj, kierunek, poziom studiów, budżet, dokumenty, terminy i realne szanse.`,
    `W Acadea pomagamy przełożyć takie tematy jak „${seed.title}” na konkretny plan działania: od wyboru uczelni i terminów, przez dokumenty i eseje, aż po finansowanie i decyzję, gdzie naprawdę warto aplikować.`,
    "## Czytaj też",
    related,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function seedArticle(seed: ArticleSeed): Article {
  const markdown = renderArticleMarkdown(seed);
  return {
    ...seed,
    markdown,
    readMin: estimateReadMinutes(markdown),
  };
}

function countryArticle(seed: Omit<ArticleSeed, "sections"> & {
  whyParagraphs: string[];
  universities: string[];
  applicationParagraphs: string[];
  costsParagraphs: string[];
  whoItsFor: string[];
  watchouts: string[];
}) {
  return seedArticle({
    ...seed,
    sections: [
      {
        title: `Dlaczego ${seed.title.toLowerCase()} jest w ogóle warte rozważenia?`,
        paragraphs: seed.whyParagraphs,
      },
      {
        title: "Czy da się tam studiować po angielsku i jak szeroka jest oferta?",
        paragraphs: [
          `Przy temacie „${seed.title}” to pytanie warto zadać wcześniej niż większość kandydatów. W wielu krajach sama obecność kierunków po angielsku nie oznacza jeszcze, że oferta jest szeroka na każdym poziomie studiów. Często więcej opcji pojawia się na magisterkach niż na licencjatach, a część programów wygląda międzynarodowo tylko na pierwszy rzut oka.`,
          `Dlatego przy analizie tematu „${seed.title}” trzeba sprawdzić nie tylko, czy program jest po angielsku, ale też czy realnie odpowiada Twojemu poziomowi studiów, kierunkowi i długofalowym planom. To jeden z najczęstszych momentów, w których kandydaci odkrywają zbyt późno, że ich założenia były zbyt ogólne.`,
        ],
      },
      {
        title: "Uczelnie i programy, które warto sprawdzić",
        paragraphs: [
          `Zamiast wybierać kraj z artykułu „${seed.title}” wyłącznie po marce, warto porównać konkretne programy, strukturę zajęć, język nauczania, relację z rynkiem pracy i możliwość dalszej magisterki albo specjalizacji.`,
        ],
        bullets: seed.universities,
      },
      {
        title: "Jak wygląda aplikacja krok po kroku",
        paragraphs: seed.applicationParagraphs,
      },
      {
        title: "Studia licencjackie czy magisterskie — gdzie ten kraj zwykle wypada mocniej?",
        paragraphs: [
          `Przy temacie „${seed.title}” trzeba osobno ocenić licencjat i magisterkę. W części systemów największą przewagą są dobrze rozwinięte magisterki po angielsku, podczas gdy studia pierwszego stopnia bywają bardziej ograniczone lub mocniej związane z językiem lokalnym. W innych krajach także licencjat jest bardzo dobrym punktem wejścia dla kandydatów z Polski.`,
          `Jeśli kandydat myśli długofalowo, przy analizie tematu „${seed.title}” warto od razu zadać sobie pytanie, czy dany kraj ma być miejscem na cały etap studiów, czy raczej jednym z przystanków: na przykład licencjat gdzie indziej, a magisterka właśnie tutaj. Taka perspektywa często prowadzi do lepszych decyzji niż patrzenie wyłącznie na najbliższą rekrutację.`,
        ],
      },
      {
        title: "Koszty, mieszkanie i codzienność studenta",
        paragraphs: seed.costsParagraphs,
      },
      {
        title: "Praca w trakcie studiów i po dyplomie",
        paragraphs: [
          `Dla wielu kandydatów zainteresowanych tematem „${seed.title}” liczy się nie tylko sam dyplom, ale też to, czy da się zbudować wokół studiów sensowną codzienność: znaleźć mieszkanie, pracę dorywczą, staż albo pierwsze doświadczenie zawodowe. W niektórych krajach jest to stosunkowo proste dzięki silnemu rynkowi pracy i wysokiemu poziomowi angielskiego, a w innych większą rolę odgrywa lokalny język albo specyfika miasta.`,
          `Warto więc przy temacie „${seed.title}” sprawdzić nie tylko samą uczelnię, ale też otoczenie zawodowe programu. Dla jednych kandydatów najważniejsza będzie ścieżka akademicka, dla innych praktyki, projekty i możliwość pozostania w kraju po studiach. To zupełnie zmienia sposób oceny tej samej oferty.`,
        ],
      },
      {
        title: "Na co trzeba szczególnie uważać",
        bullets: seed.watchouts,
      },
      {
        title: "Dla kogo ten kierunek wyjazdu będzie dobrym wyborem",
        bullets: seed.whoItsFor,
      },
    ],
  });
}

function subjectArticle(seed: Omit<ArticleSeed, "sections"> & {
  subjectIntro: string[];
  requirements: string[];
  profileParagraphs: string[];
  countries: string[];
  mistakes: string[];
  strategyParagraphs: string[];
}) {
  return seedArticle({
    ...seed,
    sections: [
      {
        title: "Od czego zacząć myślenie o tym kierunku",
        paragraphs: seed.subjectIntro,
      },
      {
        title: "Najczęstsze wymagania i elementy mocnej aplikacji",
        bullets: seed.requirements,
      },
      {
        title: "Jak zbudować profil kandydata",
        paragraphs: seed.profileParagraphs,
      },
      {
        title: "Kraje i systemy, które najczęściej warto porównać",
        bullets: seed.countries,
      },
      {
        title: "Jak wyglądają dokumenty, testy i dodatkowe etapy selekcji",
        paragraphs: [
          "Na kierunkach selektywnych sam formularz aplikacyjny rzadko wystarcza. Uczelnie mogą patrzeć na wyniki z konkretnych przedmiotów, certyfikat językowy, portfolio, test, rozmowę, esej albo list motywacyjny. To dlatego dwa pozornie podobne kierunki mogą wymagać zupełnie innego przygotowania.",
          "Najbezpieczniej jest rozpisać każdą uczelnię osobno: co trzeba wysłać, co trzeba zdać, kiedy wypadają terminy i które elementy zależą od pracy wykonanej z wyprzedzeniem. Kandydaci, którzy robią to wcześnie, dużo rzadziej odkrywają w połowie procesu, że nie przygotowali kluczowego elementu aplikacji.",
        ],
      },
      {
        title: "Najczęstsze błędy kandydatów",
        bullets: seed.mistakes,
      },
      {
        title: "Jak ułożyć strategię aplikacji",
        paragraphs: seed.strategyParagraphs,
      },
      {
        title: "Koszty, plan B i sens całej listy uczelni",
        paragraphs: [
          "Silna aplikacja nie kończy się na jednej wymarzonej uczelni. Szczególnie na kierunkach takich jak medycyna, prawo, psychologia, ekonomia czy informatyka warto mieć listę zróżnicowaną pod względem selektywności, kosztów i systemów rekrutacji. Dzięki temu kandydat nie uzależnia całego roku od jednego wyniku albo jednej komisji.",
          "W praktyce dobra strategia łączy ambicję z realizmem. Powinna uwzględniać nie tylko to, gdzie kandydat chciałby się dostać, ale też gdzie ma realne szanse, jak wygląda finansowanie i czy wybrany program prowadzi do ścieżki zawodowej, na której rzeczywiście mu zależy.",
        ],
      },
    ],
  });
}

const updatedAt = "2026-07-02";

const rawArticles: Article[] = [
  seedArticle({
    order: 1,
    category: "Poradniki",
    categorySlugs: ["strategia", "dokumenty", "terminy"],
    title: "Jak dostać się na studia za granicą? Kompletny przewodnik krok po kroku",
    slug: "/jak-dostac-sie-na-studia-za-granica",
    updatedAt,
    excerpt:
      "Od wyboru kraju i kierunku po dokumenty, terminy, eseje i finansowanie — przewodnik, który pomaga zrozumieć proces aplikacji bez chaosu i przypadkowych decyzji.",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80",
    intro: [
      "Studia za granicą otwierają dostęp do świetnych uczelni, międzynarodowego środowiska i zupełnie innego sposobu nauki, ale sama aplikacja rzadko jest intuicyjna. Każdy kraj ma własne terminy, dokumenty, kryteria oceny i pułapki, które dla kandydatów z Polski bywają niewidoczne aż do momentu, gdy jest już za późno na spokojną korektę planu.",
      "Dlatego najbardziej opłaca się zacząć nie od przypadkowych rankingów, lecz od zrozumienia całego procesu. Im szybciej kandydat zobaczy, jak łączą się wybór kraju, kierunku, budżetu, testów, esejów i terminów, tym łatwiej uniknie kosztownych pomyłek.",
      "Dobra strategia nie polega na wysłaniu kilku formularzy. Polega na takim ustawieniu listy uczelni i zadań, aby każdy element aplikacji pracował na tę samą historię kandydata.",
    ],
    sections: [
      {
        title: "Zacznij od systemu edukacji, a nie od logo uczelni",
        paragraphs: [
          "Wielu uczniów zaczyna od pytania: „jaka uczelnia jest najlepsza?”. To naturalne, ale w praktyce lepiej najpierw zapytać, w jakim systemie chcę aplikować i studiować. Wielka Brytania, Holandia, USA, Włochy czy Dania różnią się nie tylko prestiżem uczelni, ale też filozofią rekrutacji i nauki.",
          "W USA aplikacja bywa holistyczna i wymaga opowiedzenia szerokiej historii o kandydacie. W Holandii dużo większe znaczenie ma dopasowanie formalne do programu. W UK trzeba bardzo dobrze pokazać zainteresowanie kierunkiem. To są zupełnie inne gry, nawet jeśli wszystkie prowadzą do „studiów za granicą”.",
        ],
      },
      {
        title: "Jak ułożyć dobrą listę uczelni",
        bullets: [
          "oddziel uczelnie ambitne od realistycznych i bezpieczniejszych,",
          "porównaj nie tylko rankingi, ale też program zajęć, język, lokalizację i koszty,",
          "sprawdź, czy dany kierunek naprawdę pasuje do Twoich przedmiotów i profilu,",
          "uwzględnij finansowanie już na etapie budowy listy, a nie dopiero po przyjęciu,",
          "nie kopiuj listy znajomego tylko dlatego, że u niego zadziałała.",
        ],
      },
      {
        title: "Jakie dokumenty i zadania najczęściej pojawiają się w aplikacji",
        paragraphs: [
          "Najczęściej potrzebne są świadectwa, wyniki matury, certyfikat językowy, rekomendacje, CV i tekst aplikacyjny. W zależności od kraju może to być personal statement, motivation letter, college essay albo zestaw krótszych odpowiedzi. Czasem dochodzi portfolio, test albo rozmowa kwalifikacyjna.",
          "Najważniejsze jest to, by wszystkie materiały mówiły jednym głosem. Dobra aplikacja nie wygląda jak zestaw osobnych plików, tylko jak spójna odpowiedź na pytanie: dlaczego ten kandydat pasuje do tego programu i co z niego wniesie.",
        ],
      },
      {
        title: "Terminy są ważniejsze, niż większość kandydatów zakłada",
        paragraphs: [
          "Oficjalny deadline aplikacji to zwykle tylko wierzchołek góry lodowej. Wcześniej trzeba mieć gotowe rekomendacje, wyniki testów, szkice esejów, przetłumaczone dokumenty i często także plan finansowania. Jeśli kandydat zaczyna wszystko w ostatniej chwili, nawet dobry profil może zostać osłabiony przez pośpiech.",
        ],
        bullets: [
          "zapisz osobno terminy uczelni, testów językowych i stypendiów,",
          "przyjmij, że dokumenty powinny być gotowe wcześniej niż finalny deadline,",
          "sprawdź, czy dana uczelnia ma rolling admissions lub kilka rund naboru,",
          "zostaw margines na poprawki i nieprzewidziane opóźnienia.",
        ],
      },
      {
        title: "Najczęstsze błędy kandydatów",
        bullets: [
          "wybór uczelni wyłącznie po prestiżu,",
          "ignorowanie kosztów życia i mieszkania,",
          "przekonanie, że jeden tekst można wysłać do wszystkich krajów,",
          "zbyt późne rozpoczęcie przygotowań do testu językowego,",
          "brak zrozumienia, jak bardzo różnią się systemy USA, UK i Europy kontynentalnej.",
        ],
      },
      {
        title: "Dlaczego warto pracować z planem, a nie z listą zadań",
        paragraphs: [
          "Dobra aplikacja to nie jest tylko checklista. To sekwencja decyzji: dokąd aplikować, po co, z jaką historią i w jakiej kolejności. Kiedy kandydat rozumie sens każdego kroku, dużo łatwiej podejmuje lepsze decyzje i nie marnuje miesięcy na przypadkowe działania.",
        ],
      },
    ],
    related: [
      { title: "Dokumenty na studia za granicą — checklista", slug: "/dokumenty-na-studia-za-granica" },
      { title: "Jak wybrać kraj na studia za granicą?", slug: "/jak-wybrac-kraj-na-studia-za-granica" },
    ],
  }),
  seedArticle({
    order: 2,
    category: "Poradniki",
    categorySlugs: ["dokumenty"],
    title: "Dokumenty na studia za granicą — checklista dla kandydatów",
    slug: "/dokumenty-na-studia-za-granica",
    updatedAt,
    excerpt:
      "Oceny, certyfikat językowy, rekomendacje, CV, eseje i dokumenty finansowe — zobacz, czego zwykle wymagają uczelnie i czego nie zostawiać na ostatnią chwilę.",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80",
    intro: [
      "Jednym z najbardziej stresujących momentów w aplikacji na studia za granicą nie jest wcale wybór uczelni, tylko chwila, w której kandydat odkrywa, że każda z nich chce nieco innych dokumentów, w innym formacie i w innym terminie. Wtedy łatwo wpaść w tryb gaszenia pożarów i robić rzeczy za późno albo dwa razy.",
      "Dobra wiadomość jest taka, że większość wymagań da się uporządkować wcześniej. Jeśli kandydat rozumie, które dokumenty pojawiają się niemal wszędzie, a które zależą od kraju lub kierunku, może zbudować własny system pracy i uniknąć chaosu.",
    ],
    sections: [
      {
        title: "Dokumenty, które pojawiają się najczęściej",
        bullets: [
          "świadectwa i transkrypty ocen,",
          "wyniki matury, IB lub A-levels,",
          "certyfikat językowy, jeśli uczelnia go wymaga,",
          "CV lub résumé, szczególnie przy USA i wybranych programach europejskich,",
          "rekomendacje od nauczycieli lub innych osób pracujących z kandydatem,",
          "personal statement, motivation letter albo esej aplikacyjny,",
          "czasem portfolio, test, rozmowa kwalifikacyjna lub dokumenty finansowe.",
        ],
      },
      {
        title: "Dlaczego same oceny nie wystarczą",
        paragraphs: [
          "W wielu systemach kluczowe są nie tylko wyniki ogólne, ale też konkretne przedmioty. Kandydat na informatykę bez mocnej matematyki, na medycynę bez biologii i chemii albo na ekonomię bez analitycznego profilu może mieć ograniczone opcje mimo dobrych stopni.",
          "Dlatego przy kompletowaniu dokumentów warto myśleć nie tylko o tym, co trzeba wysłać, ale też co te dokumenty faktycznie komunikują o kandydacie.",
        ],
      },
      {
        title: "Certyfikat językowy: kiedy naprawdę jest potrzebny",
        paragraphs: [
          "IELTS, TOEFL albo Duolingo English Test często pojawiają się w wymaganiach nawet wtedy, gdy kandydat uczył się po angielsku poza szkołą albo czuje się pewnie językowo. Uczelnie patrzą na formalne potwierdzenie, a nie na deklaracje.",
          "Najbezpieczniejsza strategia to sprawdzenie wymagań dla każdej uczelni na liście i wybranie takiego testu, który rzeczywiście jest przez nie akceptowany.",
        ],
      },
      {
        title: "Jak podejść do tłumaczeń i formatowania",
        bullets: [
          "sprawdź, czy uczelnia wymaga tłumaczenia przysięgłego, czy wystarczy wersja szkolna,",
          "używaj czytelnych nazw plików i trzymaj wszystkie dokumenty w jednym systemie folderów,",
          "zwróć uwagę na podpisy, daty, pieczątki i format PDF,",
          "nie zakładaj, że skan z telefonu zawsze wystarczy.",
        ],
      },
      {
        title: "Najczęstsze błędy przy kompletowaniu dokumentów",
        bullets: [
          "zaczęcie zbierania rekomendacji zbyt późno,",
          "tłumaczenie dokumentów dopiero po wysłaniu pierwszych aplikacji,",
          "używanie jednego ogólnego tekstu do różnych systemów,",
          "wysyłanie plików bez sprawdzenia, czy wszystkie strony są czytelne,",
          "brak planu, które dokumenty są wspólne dla wszystkich uczelni, a które tylko dla wybranych.",
        ],
      },
    ],
    related: [
      { title: "Terminy aplikacji na studia za granicą", slug: "/terminy-aplikacji-studia-za-granica" },
      { title: "Jak poprosić nauczyciela o rekomendację?", slug: "/jak-poprosic-o-rekomendacje" },
    ],
  }),
  seedArticle({
    order: 3,
    category: "Poradniki",
    categorySlugs: ["terminy"],
    title: "Terminy aplikacji na studia za granicą — dołącz do grupy WhatsApp",
    slug: "/terminy-aplikacji-studia-za-granica",
    updatedAt,
    excerpt:
      "Deadline’y różnią się między krajami, uczelniami i stypendiami. Wyjaśniamy, jak ich pilnować i dlaczego aktualizacje publikujemy także na grupie WhatsApp Acadea.",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80",
    intro: [
      "W aplikacji na studia za granicą termin końcowy prawie nigdy nie jest jedyną datą, którą trzeba znać. Po drodze pojawiają się testy językowe, wewnętrzne deadline’y na rekomendacje, daty wysyłki portfoliów, wnioski stypendialne i momenty, w których trzeba już mieć gotowy szkic eseju albo listę uczelni.",
      "To właśnie dlatego kandydaci tak łatwo wpadają w przekonanie, że „jeszcze jest czas”, choć w praktyce najważniejsze zadania powinny być zakończone dużo wcześniej niż oficjalne zamknięcie systemu.",
    ],
    sections: [
      {
        title: "Dlaczego deadline’y są trudniejsze niż wyglądają",
        paragraphs: [
          "Jeden uczeń może równolegle pilnować UCAS, Studielink, wewnętrznych portali uczelni, zapisów na IELTS, terminów rozmów i osobnych dat dla scholarship essays. To oznacza, że kalendarz aplikacyjny nie jest jedną listą, tylko siecią zależnych od siebie terminów.",
        ],
      },
      {
        title: "Jakie daty warto śledzić osobno",
        bullets: [
          "termin rejestracji w systemie aplikacyjnym,",
          "ostateczny deadline uczelni,",
          "wcześniejsze terminy dla kierunków selektywnych,",
          "daty testów językowych i egzaminów dodatkowych,",
          "deadline’y dla dokumentów finansowych i stypendialnych,",
          "terminy odpowiedzi na ofertę oraz wpłaty depozytu.",
        ],
      },
      {
        title: "Jak budować własny kalendarz aplikacyjny",
        paragraphs: [
          "Najlepiej zacząć od listy uczelni i dopisać do każdej osobno: dokumenty, testy, terminy i rzeczy zależne od innych ludzi, takie jak rekomendacje. Potem warto dodać własne „wewnętrzne” deadline’y na tydzień lub dwa przed oficjalną datą.",
          "To podejście znacznie zmniejsza ryzyko, że kandydat będzie kończył kluczowy esej noc przed wysyłką albo odkryje zbyt późno, że test językowy nie ma już dogodnych terminów.",
        ],
      },
      {
        title: "Po co grupa WhatsApp Acadea",
        paragraphs: [
          "Artykuł na stronie porządkuje ogólne zasady, ale przypomnienia najlepiej działają tam, gdzie kandydaci faktycznie zaglądają codziennie. Dlatego w naszej grupie WhatsApp przypominamy o wybranych terminach i ważnych momentach w procesie.",
          "To nie zastępuje własnego kalendarza, ale pomaga utrzymać rytm pracy i nie przegapić tego, co najłatwiej umyka przy kilku krajach naraz.",
        ],
      },
      {
        title: "Najczęstsze błędy",
        bullets: [
          "traktowanie deadline’u uczelni jako daty rozpoczęcia pracy nad aplikacją,",
          "brak osobnych terminów dla rekomendacji i testów,",
          "przekonanie, że wszystkie kraje aplikują według podobnego kalendarza,",
          "nieuwzględnienie czasu na poprawki, tłumaczenia i awarie techniczne.",
        ],
      },
    ],
    related: [
      { title: "Jak dostać się na studia za granicą?", slug: "/jak-dostac-sie-na-studia-za-granica" },
      { title: "Dokumenty na studia za granicą", slug: "/dokumenty-na-studia-za-granica" },
    ],
  }),
  seedArticle({
    order: 4,
    category: "Poradniki",
    categorySlugs: ["strategia"],
    title: "Rankingi uczelni: QS, THE, Shanghai — jak je czytać?",
    slug: "/rankingi-uczelni",
    updatedAt,
    excerpt:
      "Rankingi mogą pomóc, ale potrafią też wprowadzać w błąd. Sprawdź, co naprawdę mierzą i dlaczego nie warto wybierać uczelni wyłącznie po pozycji w tabeli.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80",
    intro: [
      "Rankingi uczelni kuszą prostą odpowiedzią na trudne pytanie: gdzie warto studiować? Jedna tabela, jedno miejsce, jedno porównanie — i wydaje się, że decyzja jest gotowa. Problem polega na tym, że ranking prawie nigdy nie mierzy dokładnie tego, co jest najważniejsze dla konkretnego kandydata na studia licencjackie lub magisterskie.",
      "Dlatego rankingi warto czytać jako narzędzie pomocnicze, a nie jako gotową instrukcję wyboru. Dobra uczelnia w rankingu globalnym nie zawsze oznacza najlepszy program dla danego kierunku, budżetu i stylu nauki.",
    ],
    sections: [
      {
        title: "Co właściwie mierzą najpopularniejsze rankingi",
        paragraphs: [
          "QS, Times Higher Education i ShanghaiRanking korzystają z innych metodologii. Jedne mocniej akcentują reputację akademicką, inne badania, cytowania, umiędzynarodowienie albo wpływ naukowy. To znaczy, że jedna uczelnia może być wysoko w jednym zestawieniu i niżej w innym bez żadnej sprzeczności.",
        ],
      },
      {
        title: "Ranking uczelni to nie ranking kierunku",
        paragraphs: [
          "Kandydat na psychologię, prawo czy informatykę powinien patrzeć przede wszystkim na siłę konkretnego programu, a nie tylko na pozycję całej instytucji. Uczelnia może być doskonała badawczo w biologii albo fizyce, ale mieć przeciętny bachelor w interesującej Cię dziedzinie.",
        ],
      },
      {
        title: "Kiedy ranking rzeczywiście pomaga",
        bullets: [
          "gdy zawężasz dużą liczbę uczelni do krótszej listy,",
          "gdy porównujesz rozpoznawalność instytucji w skali międzynarodowej,",
          "gdy myślisz o ścieżce akademickiej, researchu lub bardzo selektywnych branżach,",
          "gdy łączysz ranking ogólny z rankingiem kierunkowym i analizą programu.",
        ],
      },
      {
        title: "Kiedy ranking szkodzi",
        bullets: [
          "gdy zastępuje myślenie o kosztach, stylu nauki i miejscu zamieszkania,",
          "gdy prowadzi do listy uczelni zbyt ambitnej lub finansowo nierealnej,",
          "gdy kandydat ignoruje wymagania formalne i wybiera tylko na podstawie prestiżu,",
          "gdy myli rozpoznawalność marki z dopasowaniem programu do własnych celów.",
        ],
      },
      {
        title: "Jak korzystać z rankingów mądrze",
        paragraphs: [
          "Najlepsze efekty daje połączenie kilku źródeł: rankingu globalnego, rankingu kierunkowego, planu zajęć, wymagań rekrutacyjnych i realnych kosztów. Ranking powinien odpowiadać na pytanie „czy warto przyjrzeć się tej uczelni bliżej?”, a nie „czy to na pewno najlepszy wybór dla mnie?”.",
        ],
      },
    ],
    related: [
      { title: "Jak wybrać kraj na studia za granicą?", slug: "/jak-wybrac-kraj-na-studia-za-granica" },
      { title: "Jak wybrać kierunek studiów za granicą?", slug: "/jak-wybrac-kierunek-studiow-za-granica" },
    ],
  }),
  seedArticle({
    order: 5,
    category: "Poradniki",
    categorySlugs: ["egzaminy"],
    title: "IELTS, TOEFL czy Duolingo? Certyfikat językowy na studia za granicą",
    slug: "/ielts-toefl-duolingo",
    updatedAt,
    excerpt:
      "Nie każda uczelnia akceptuje ten sam egzamin. Sprawdź, kiedy potrzebujesz certyfikatu językowego i dlaczego warto zaplanować go wcześniej.",
    image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1200&q=80",
    intro: [
      "Dla wielu kandydatów certyfikat językowy wydaje się dodatkiem, który „zawsze da się zrobić później”. W praktyce to jeden z tych elementów aplikacji, które potrafią zablokować cały proces, jeśli wybierzesz nieakceptowany test, zapiszesz się za późno albo założysz, że szkoła lub matura automatycznie zwolnią Cię z formalnego wymogu.",
      "Najlepszy moment na myślenie o egzaminie językowym jest dużo wcześniej, niż większość uczniów zakłada. Dzięki temu można dobrać właściwy test, zostawić sobie margines na poprawkę i nie budować całej listy uczelni na niepotwierdzonych przypuszczeniach.",
    ],
    sections: [
      {
        title: "Kiedy certyfikat jest potrzebny",
        paragraphs: [
          "Wiele programów po angielsku wymaga formalnego potwierdzenia poziomu językowego niezależnie od tego, jak swobodnie kandydat mówi i pisze po angielsku. Zwolnienia istnieją, ale różnią się między krajami i uczelniami.",
        ],
      },
      {
        title: "Jak różnią się najpopularniejsze testy",
        bullets: [
          "IELTS jest bardzo szeroko akceptowany i dobrze rozpoznawalny przez uczelnie w Europie oraz krajach anglosaskich,",
          "TOEFL bywa szczególnie popularny w USA i na uczelniach, które dobrze znają amerykański system,",
          "Duolingo English Test jest wygodny logistycznie, ale nie każda uczelnia go honoruje,",
          "część programów akceptuje kilka testów, ale z różnymi progami punktowymi.",
        ],
      },
      {
        title: "Najpierw lista uczelni, potem wybór testu",
        paragraphs: [
          "Najgorsza strategia to zdawanie egzaminu tylko dlatego, że jest tańszy albo najszybszy w rezerwacji. Zdecydowanie lepiej najpierw ustalić listę uczelni i sprawdzić ich oficjalne wymagania, a dopiero potem zapisać się na właściwy test.",
        ],
      },
      {
        title: "Jak zaplanować czas",
        bullets: [
          "zapisz się na pierwszy termin na tyle wcześnie, by mieć możliwość poprawki,",
          "sprawdź, ile trwa oczekiwanie na wynik i wysyłka do uczelni,",
          "uwzględnij, że stres i brak znajomości formatu mogą obniżyć wynik nawet przy dobrym angielskim,",
          "nie zostawiaj testu na ostatni miesiąc przed deadline’em.",
        ],
      },
      {
        title: "Najczęstsze błędy kandydatów",
        bullets: [
          "zdanie testu nieakceptowanego przez wymarzoną uczelnię,",
          "zbyt późna rejestracja, gdy kończą się dobre terminy,",
          "przekonanie, że wynik z matury lub olimpiady językowej zastąpi formalny certyfikat,",
          "brak planu na poprawkę.",
        ],
      },
    ],
    related: [
      { title: "Studia w Europie po angielsku", slug: "/studia-w-europie-po-angielsku" },
      { title: "Jak dostać się na studia za granicą?", slug: "/jak-dostac-sie-na-studia-za-granica" },
    ],
  }),
  seedArticle({
    order: 6,
    category: "Poradniki",
    categorySlugs: ["eseje-i-listy", "wielka-brytania"],
    title: "Jak napisać personal statement na studia w UK?",
    slug: "/jak-napisac-personal-statement",
    updatedAt,
    excerpt:
      "Personal statement nie jest listą osiągnięć ani zwykłym listem motywacyjnym. Zobacz, jak pokazać zainteresowanie kierunkiem i uniknąć ogólników.",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80",
    intro: [
      "Dobry personal statement do Wielkiej Brytanii nie ma brzmieć „ładnie” w ogólnym sensie. Ma przekonująco odpowiedzieć na pytanie, dlaczego kandydat chce studiować właśnie ten kierunek i jak rozwijał związane z nim myślenie. To dlatego teksty pełne deklaracji o pasji zwykle wypadają słabiej niż krótsze, ale konkretne opowieści o tym, co kandydat rzeczywiście przeczytał, przeanalizował i zrozumiał.",
      "W praktyce personal statement jest znacznie bliżej tekstu akademickiego niż tradycyjnego listu motywacyjnego. Szczególnie na kierunkach selektywnych liczy się dojrzałość intelektualna, precyzja i umiejętność wyboru naprawdę mocnych przykładów.",
    ],
    sections: [
      {
        title: "Od czego warto zacząć",
        paragraphs: [
          "Najlepiej nie od pierwszego zdania, tylko od zebrania materiału. Kandydat powinien wypisać książki, kursy, projekty, debaty, doświadczenia szkolne i pozaszkolne, które rzeczywiście rozwinęły jego zainteresowanie kierunkiem. Dopiero z tego powstaje sensowna struktura tekstu.",
        ],
      },
      {
        title: "Co powinno znaleźć się w dobrym personal statement",
        bullets: [
          "konkretne zainteresowanie kierunkiem, a nie tylko uczelnią lub prestiżem,",
          "przykłady aktywności, które rozwinęły myślenie kandydata,",
          "krótka refleksja: czego kandydat się nauczył i jak to wpłynęło na jego sposób patrzenia,",
          "umiejętności i doświadczenia wspierające gotowość do studiów,",
          "spójność między profilem kandydata a wybranym kierunkiem.",
        ],
      },
      {
        title: "Czego zdecydowanie unikać",
        bullets: [
          "cytatów na otwarcie, jeśli niczego realnie nie wnoszą,",
          "zdań w stylu „od zawsze marzyłem”, bez żadnego rozwinięcia,",
          "opisywania wszystkiego po trochu bez wyraźnego motywu przewodniego,",
          "zbyt długich fragmentów o aktywnościach niezwiązanych z kierunkiem,",
          "kopiowania konstrukcji z przykładowych tekstów z internetu.",
        ],
      },
      {
        title: "Jak myśleć o strukturze",
        paragraphs: [
          "Najlepszy tekst zwykle przechodzi od najważniejszego zainteresowania akademickiego do kolejnych przykładów, które wzmacniają tę historię. Nie chodzi o sztywny schemat, tylko o logikę: każda część powinna budować odpowiedź na pytanie, dlaczego właśnie ten kandydat nadaje się na ten kierunek.",
        ],
      },
      {
        title: "Dlaczego feedback jest tak ważny",
        paragraphs: [
          "Dobra informacja zwrotna nie polega na „upiększaniu” tekstu. Chodzi o sprawdzenie, czy przykłady są naprawdę mocne, czy tekst jest spójny i czy kandydat nie mówi za mało albo za dużo o niewłaściwych rzeczach.",
        ],
      },
    ],
    related: [
      { title: "List motywacyjny a personal statement", slug: "/list-motywacyjny-a-personal-statement" },
      { title: "Studia w UK po Brexicie", slug: "/studia-w-uk-po-brexicie" },
    ],
  }),
  seedArticle({
    order: 7,
    category: "Poradniki",
    categorySlugs: ["eseje-i-listy"],
    title: "List motywacyjny a personal statement — jaka jest różnica?",
    slug: "/list-motywacyjny-a-personal-statement",
    updatedAt,
    excerpt:
      "Wiele osób myli te dwa dokumenty. Tymczasem różnią się strukturą, tonem i przeznaczeniem — szczególnie przy aplikacji do UK, Europy i USA.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80",
    intro: [
      "W aplikacji na studia za granicą kandydaci często używają pojęć personal statement, motivation letter i essay zamiennie. To zrozumiałe, bo wszystkie są „tekstami o kandydacie”, ale w praktyce różnią się celem, tonem i tym, czego uczelnia oczekuje od autora.",
      "Jeśli kandydat nie rozróżnia tych formatów, bardzo łatwo wysłać dobry tekst do niewłaściwego systemu. A to jeden z najczęstszych powodów, dla których aplikacja brzmi poprawnie językowo, ale nie odpowiada na prawdziwe potrzeby komisji.",
    ],
    sections: [
      {
        title: "Personal statement do UK",
        paragraphs: [
          "W brytyjskim systemie personal statement jest zwykle mocno kierunkowy. Uczelnię interesuje przede wszystkim, dlaczego kandydat chce studiować dany przedmiot i jak rozwijał związane z nim zainteresowania. To tekst bliższy refleksji akademickiej niż autopromocji.",
        ],
      },
      {
        title: "Motivation letter w Europie kontynentalnej",
        paragraphs: [
          "W wielu krajach europejskich motivation letter jest bardziej formalny i częściej odnosi się do konkretnego programu. Kandydat powinien pokazać nie tylko zainteresowanie tematem, ale też zrozumienie, dlaczego właśnie ten program, w tym miejscu i w tej formule ma dla niego sens.",
        ],
      },
      {
        title: "Eseje do USA",
        paragraphs: [
          "Amerykańskie eseje często mocniej eksponują osobowość, wartości, doświadczenie i sposób myślenia. Oczywiście kierunek też ma znaczenie, ale nie w tak bezpośredni sposób jak w brytyjskim personal statement. Uczelnie chcą zrozumieć człowieka, nie tylko przyszłego studenta danego przedmiotu.",
        ],
      },
      {
        title: "Skąd biorą się pomyłki",
        bullets: [
          "pisanie jednego tekstu i wysyłanie go wszędzie,",
          "zbyt formalny ton w eseju do USA,",
          "zbyt osobisty i mało kierunkowy tekst do UK,",
          "brak odniesienia do konkretnego programu w motivation letter.",
        ],
      },
      {
        title: "Jak dobrać właściwy format",
        paragraphs: [
          "Najlepszą praktyką jest zaczynanie od polecenia uczelni, nie od nazwy dokumentu. To instrukcja mówi, czego naprawdę oczekuje komisja: analizy akademickiej, motywacji do programu, historii osobistej czy odpowiedzi na określone pytanie.",
        ],
      },
    ],
    related: [
      { title: "Jak napisać personal statement na studia w UK?", slug: "/jak-napisac-personal-statement" },
      { title: "Esej na studia w USA", slug: "/esej-na-studia-w-usa" },
    ],
  }),
  seedArticle({
    order: 8,
    category: "Poradniki",
    categorySlugs: ["strategia"],
    title: "Jak wybrać kierunek studiów za granicą?",
    slug: "/jak-wybrac-kierunek-studiow-za-granica",
    updatedAt,
    excerpt:
      "Dobry wybór kierunku nie zaczyna się od nazwy programu. Sprawdź, jak połączyć zainteresowania, wymagania, styl nauki i perspektywy zawodowe.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80",
    intro: [
      "Wybór kierunku studiów za granicą jest trudniejszy niż wypełnienie ankiety o zainteresowaniach. Ta sama nazwa programu może oznaczać bardzo różne rzeczy w zależności od kraju i uczelni, a kandydat, który wybiera wyłącznie po nazwie lub prestiżu, często odkrywa różnicę dopiero po rozpoczęciu aplikacji.",
      "Dlatego warto zacząć od zrozumienia nie tylko „co mnie interesuje”, ale też jak lubię się uczyć, jakie mam mocne strony i do jakiego stylu studiów naprawdę pasuję.",
    ],
    sections: [
      {
        title: "Najpierw profil, potem nazwa kierunku",
        paragraphs: [
          "Dwie osoby zainteresowane psychologią mogą potrzebować zupełnie innego programu: jedna bardziej badawczego i statystycznego, druga bardziej społecznego i praktycznego. To samo dotyczy ekonomii, prawa, informatyki czy designu.",
        ],
      },
      {
        title: "Jakie pytania warto sobie zadać",
        bullets: [
          "czy wolę teorię i analizę, czy projekty i praktykę,",
          "czy chcę programu bardzo wyspecjalizowanego, czy szerokiego na starcie,",
          "czy lepiej funkcjonuję w dużym, międzynarodowym środowisku, czy na mniejszym kampusie,",
          "jak ważne są dla mnie staże, networking i ścieżka zawodowa po studiach,",
          "czy mój obecny profil akademicki odpowiada wymaganiom kierunku.",
        ],
      },
      {
        title: "Dlaczego plan zajęć mówi więcej niż nazwa programu",
        paragraphs: [
          "Najlepszym źródłem wiedzy o programie jest zwykle sylabus, nie marketingowa strona uczelni. Jeśli kandydat sprawdzi przedmioty z pierwszego i drugiego roku, szybciej zobaczy, czy dany kierunek jest rzeczywiście tym, czego szuka.",
        ],
      },
      {
        title: "Najczęstsze pułapki",
        bullets: [
          "wybór kierunku pod wpływem jednej modnej nazwy,",
          "ignorowanie wymagań z matematyki, biologii lub innych przedmiotów,",
          "patrzenie wyłącznie na rankingi, bez czytania planu zajęć,",
          "mieszanie zainteresowania zawodem z zainteresowaniem konkretnym programem.",
        ],
      },
      {
        title: "Jak połączyć kierunek z krajem",
        paragraphs: [
          "Niektóre kraje są szczególnie mocne w wybranych obszarach: Holandia w kierunkach po angielsku i naukach społecznych, UK w prawie i humanistyce, USA w interdyscyplinarności, Niemcy w technice, a Dania czy Szwecja w praktycznym stylu nauki. Wybór kierunku i kraju powinien więc powstawać równolegle.",
        ],
      },
    ],
    related: [
      { title: "Jak wybrać kraj na studia za granicą?", slug: "/jak-wybrac-kraj-na-studia-za-granica" },
      { title: "Czy studia za granicą są dla mnie?", slug: "/czy-studia-za-granica-sa-dla-mnie" },
    ],
  }),
  seedArticle({
    order: 9,
    category: "Poradniki",
    categorySlugs: ["strategia", "europa"],
    title: "Jak wybrać kraj na studia za granicą?",
    slug: "/jak-wybrac-kraj-na-studia-za-granica",
    updatedAt,
    excerpt:
      "Koszty, język, system edukacji, klimat aplikacji i styl życia — wybór kraju to coś więcej niż ranking i popularność wśród znajomych.",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
    intro: [
      "Pytanie „w jakim kraju studiować?” jest w praktyce pytaniem o dużo więcej niż lokalizację. To wybór systemu edukacji, budżetu, języka, stylu nauki, kultury akademickiej i codzienności na kilka lat. Kandydat, który wybiera kraj wyłącznie na podstawie trendu albo zdjęć w internecie, zwykle pomija właśnie te elementy, które później najmocniej wpływają na komfort studiowania.",
      "Dobry wybór kraju nie polega na znalezieniu „najlepszego miejsca do studiów”, tylko na dopasowaniu kraju do konkretnego profilu, kierunku i możliwości finansowych.",
    ],
    sections: [
      {
        title: "Co porównać przed wyborem kraju",
        bullets: [
          "język wykładowy i realna potrzeba znajomości języka lokalnego,",
          "koszty czesnego, życia i mieszkania,",
          "sposób aplikacji: formalny, holistyczny albo oparty na egzaminach,",
          "styl nauki: akademicki, projektowy, praktyczny albo bardzo selektywny,",
          "możliwości pracy po studiach i sens dyplomu w długim horyzoncie.",
        ],
      },
      {
        title: "Jak różnią się najpopularniejsze kierunki wyjazdu",
        paragraphs: [
          "Wielka Brytania i USA często wymagają mocniejszych tekstów i bardziej narracyjnej aplikacji. Holandia oraz część Europy kontynentalnej stawiają częściej na formalne dopasowanie do programu. Kraje skandynawskie i Niemcy mogą być bardzo atrakcyjne merytorycznie, ale trzeba pilnować kosztów życia i języka lokalnego.",
        ],
      },
      {
        title: "Budżet zmienia strategię bardziej, niż się wydaje",
        paragraphs: [
          "To nie jest temat na sam koniec. Jeśli kandydat potrzebuje scholarship, stypendium albo niskiego czesnego, powinien budować listę uczelni inaczej niż ktoś, kto wybiera wyłącznie na podstawie prestiżu programu. Właśnie dlatego finanse trzeba włączyć do strategii od pierwszego etapu.",
        ],
      },
      {
        title: "Najczęstsze błędy przy wyborze kraju",
        bullets: [
          "patrzenie tylko na koszt czesnego, bez kosztów życia,",
          "wybór kraju tylko dlatego, że aplikowali tam znajomi,",
          "ignorowanie różnic w systemie rekrutacji,",
          "zakładanie, że „po angielsku” zawsze oznacza łatwą codzienność bez języka lokalnego.",
        ],
      },
      {
        title: "Jak zawęzić listę do 2–4 realnych opcji",
        paragraphs: [
          "Najlepiej porównać kraje przez pryzmat konkretnego kierunku. Kandydat na informatykę będzie patrzył inaczej niż kandydat na prawo czy medycynę. Kiedy kierunek, budżet i styl nauki są jasno określone, wybór kraju robi się dużo prostszy.",
        ],
      },
    ],
    related: [
      { title: "Studia w Europie po angielsku", slug: "/studia-w-europie-po-angielsku" },
      { title: "Ile kosztują studia za granicą?", slug: "/ile-kosztuja-studia-za-granica" },
    ],
  }),
  seedArticle({
    order: 10,
    category: "Poradniki",
    categorySlugs: ["rekomendacje"],
    title: "Jak poprosić nauczyciela o rekomendację?",
    slug: "/jak-poprosic-o-rekomendacje",
    updatedAt,
    excerpt:
      "Dobra rekomendacja nie powstaje z jednego maila dzień przed deadlinem. Zobacz, jak poprosić o nią mądrze i ułatwić nauczycielowi napisanie mocnego listu.",
    image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1200&q=80",
    intro: [
      "Rekomendacja to jeden z tych elementów aplikacji, które kandydaci często traktują jak formalność, dopóki nie okaże się, że naprawdę mocny list może znacząco wzmocnić całą historię. Słaby list rzadko przekreśla aplikację samodzielnie, ale bardzo często odbiera jej część wiarygodności i konkretu.",
      "Dlatego prośba o rekomendację nie powinna być szybkim komunikatem wysłanym nauczycielowi tydzień przed deadlinem. To raczej krótki proces współpracy, w którym kandydat pomaga drugiej stronie napisać lepszy list.",
    ],
    sections: [
      {
        title: "Kogo najlepiej poprosić",
        bullets: [
          "nauczyciela, który zna Twoją pracę i sposób myślenia, a nie tylko nazwisko,",
          "osobę związaną z przedmiotem ważnym dla kierunku,",
          "nauczyciela, który potrafi pisać konkretnie, a nie wyłącznie ogólnikami,",
          "kogoś, kto ma realny czas napisać list bez pośpiechu.",
        ],
      },
      {
        title: "Jak wygląda dobra prośba o rekomendację",
        paragraphs: [
          "Najlepiej zapytać odpowiednio wcześnie, jasno wyjaśnić, do jakiego typu uczelni aplikujesz i dlaczego właśnie ta osoba może napisać wartościowy list. Warto też od razu zaznaczyć terminy oraz zaoferować krótkie materiały pomocnicze.",
        ],
      },
      {
        title: "Co warto przygotować nauczycielowi",
        bullets: [
          "krótki opis kierunków i krajów, do których aplikujesz,",
          "daty wysyłki lub instrukcję techniczną, jeśli system wymaga uploadu,",
          "listę projektów, aktywności i sukcesów, które dana osoba mogła obserwować,",
          "szkic CV albo krótkie podsumowanie profilu.",
        ],
      },
      {
        title: "Czego nie robić",
        bullets: [
          "nie proś w ostatniej chwili, jeśli można było zrobić to wcześniej,",
          "nie zakładaj, że nauczyciel pamięta wszystkie Twoje działania z kilku lat,",
          "nie wysyłaj suchej prośby bez kontekstu i instrukcji,",
          "nie próbuj pisać listu za nauczyciela, jeśli system lub szkoła tego nie przewiduje.",
        ],
      },
      {
        title: "Dlaczego rekomendacja ma znaczenie",
        paragraphs: [
          "Dobrze napisana rekomendacja wzmacnia to, co kandydat pokazuje sam o sobie w innych częściach aplikacji. Potwierdza styl pracy, dojrzałość, inicjatywę i potencjał akademicki z perspektywy kogoś, kto widział te cechy w praktyce.",
        ],
      },
    ],
    related: [
      { title: "Dokumenty na studia za granicą", slug: "/dokumenty-na-studia-za-granica" },
      { title: "Najczęstsze błędy w aplikacji", slug: "/bledy-w-aplikacji-na-studia-za-granica" },
    ],
  }),
  seedArticle({
    order: 11,
    category: "Poradniki",
    categorySlugs: ["strategia", "dokumenty"],
    title: "Najczęstsze błędy w aplikacji na studia za granicą",
    slug: "/bledy-w-aplikacji-na-studia-za-granica",
    updatedAt,
    excerpt:
      "Błędy rzadko wynikają z braku ambicji — częściej z pośpiechu, chaosu i złych założeń. Sprawdź, czego najłatwiej nie dopilnować.",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80",
    intro: [
      "Większość błędów w aplikacji na studia za granicą nie bierze się z lenistwa albo braku ambicji. Zwykle wynikają z tego, że kandydat pracuje na kilku systemach naraz, uczy się do matury i dopiero po drodze odkrywa, jak wiele decyzji trzeba podjąć odpowiednio wcześnie.",
      "To dlatego tak ważne jest patrzenie na aplikację jak na proces. Jeden mały błąd techniczny albo błędne założenie często nie boli samodzielnie, ale w połączeniu z pośpiechem potrafi osłabić całą strategię.",
    ],
    sections: [
      {
        title: "Błąd 1: zbyt późny start",
        paragraphs: [
          "To najczęstszy problem. Kandydat zaczyna od myśli, że najpierw skupi się na szkole, a aplikację „ogarnie później”. Tymczasem później okazuje się, że teksty, rekomendacje, test językowy i wybór uczelni powinny być zaplanowane dużo wcześniej.",
        ],
      },
      {
        title: "Błąd 2: wybór uczelni bez czytania programu",
        paragraphs: [
          "Bardzo łatwo ulec nazwie uczelni albo modnemu kierunkowi. Jeśli jednak kandydat nie przeczyta planu zajęć i wymagań, może zbudować listę pozornie atrakcyjną, ale kompletnie niedopasowaną do własnego profilu.",
        ],
      },
      {
        title: "Błąd 3: jeden tekst do wszystkich systemów",
        bullets: [
          "UK oczekuje tekstu bardziej kierunkowego,",
          "Europa kontynentalna często chce listu dopasowanego do programu,",
          "USA zwykle szukają też osobowości, refleksji i narracji.",
        ],
      },
      {
        title: "Błąd 4: niedoszacowanie kosztów",
        paragraphs: [
          "Czesne to tylko część obrazu. Wiele aplikacji wygląda dobrze na etapie planowania, a rozpada się dopiero wtedy, gdy kandydat realnie policzy mieszkanie, transport, depozyt, dokumenty i pierwsze miesiące życia w nowym kraju.",
        ],
      },
      {
        title: "Błąd 5: brak wewnętrznych deadline’ów",
        paragraphs: [
          "Jeśli jedyną datą w kalendarzu jest oficjalny termin uczelni, bardzo łatwo wszystko zostawić na ostatni moment. Znacznie lepiej działa ustawienie własnych wcześniejszych granic dla testów, rekomendacji i pierwszych wersji tekstów.",
        ],
      },
    ],
    related: [
      { title: "Terminy aplikacji na studia za granicą", slug: "/terminy-aplikacji-studia-za-granica" },
      { title: "Jak dostać się na studia za granicą?", slug: "/jak-dostac-sie-na-studia-za-granica" },
    ],
  }),
  seedArticle({
    order: 12,
    category: "Poradniki",
    categorySlugs: ["mentoring"],
    title: "Czy warto korzystać z mentora przy aplikacji na studia za granicą?",
    slug: "/mentor-aplikacyjny-studia-za-granica",
    updatedAt,
    excerpt:
      "Mentor nie powinien obiecywać przyjęcia ani pisać aplikacji za ucznia. Może jednak pomóc uporządkować proces, strategię i dokumenty.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80",
    intro: [
      "Mentoring aplikacyjny ma sens tylko wtedy, gdy naprawdę porządkuje proces i wzmacnia samodzielność ucznia. Jeśli sprowadza się do gotowych list uczelni albo pustych obietnic, łatwo pomylić wsparcie z marketingiem.",
      "Dlatego pytanie nie brzmi wyłącznie „czy warto mieć mentora?”, ale raczej: jak rozpoznać dobrą pomoc i w którym momencie procesu rzeczywiście może ona coś zmienić.",
    ],
    sections: [
      {
        title: "W czym mentor może realnie pomóc",
        bullets: [
          "ułożyć strategię krajów i uczelni,",
          "przełożyć profil ucznia na realistyczną listę aplikacji,",
          "ustawić kalendarz działań i priorytety,",
          "pomóc w pracy nad tekstami i dokumentami,",
          "zwrócić uwagę na błędy, których kandydat sam nie widzi.",
        ],
      },
      {
        title: "Czego mentor nie powinien robić",
        bullets: [
          "obiecywać przyjęcia,",
          "pisać esejów za ucznia,",
          "sprzedawać każdemu tej samej listy uczelni,",
          "udawać, że prestiż zawsze jest ważniejszy niż dopasowanie i finanse.",
        ],
      },
      {
        title: "Kiedy wsparcie jest najbardziej wartościowe",
        paragraphs: [
          "Największą różnicę mentoring robi zwykle tam, gdzie kandydat musi połączyć kilka trudnych elementów naraz: wiele krajów, selektywny kierunek, potrzebę stypendium albo nietypowy profil. Im więcej zmiennych, tym bardziej opłaca się dobra strategia zamiast działania metodą prób i błędów.",
        ],
      },
      {
        title: "Dlaczego sam internet nie zawsze wystarcza",
        paragraphs: [
          "Internet daje ogrom informacji, ale sam nie pokaże, które z nich są naprawdę ważne dla konkretnej osoby. Dwie uczennice czy dwaj uczniowie mogą czytać te same oficjalne strony, a mimo to potrzebować zupełnie innej listy uczelni i innych decyzji finansowych.",
        ],
      },
      {
        title: "Jak ocenić, czy dana pomoc jest dobra",
        bullets: [
          "czy rozmowa zaczyna się od zrozumienia profilu ucznia,",
          "czy mentor tłumaczy logikę decyzji, zamiast tylko podawać odpowiedzi,",
          "czy widać uczciwość co do szans, kosztów i kompromisów,",
          "czy wsparcie wzmacnia samodzielność, a nie uzależnia od opiekuna.",
        ],
      },
    ],
    related: [
      { title: "Jak wygląda współpraca z mentorem aplikacyjnym?", slug: "/jak-wyglada-wspolpraca-z-mentorem-aplikacyjnym" },
      { title: "Czy studia za granicą są dla mnie?", slug: "/czy-studia-za-granica-sa-dla-mnie" },
    ],
  }),
  seedArticle({
    order: 13,
    category: "Poradniki",
    categorySlugs: ["mentoring"],
    title: "Jak wygląda współpraca z mentorem aplikacyjnym?",
    slug: "/jak-wyglada-wspolpraca-z-mentorem-aplikacyjnym",
    updatedAt,
    excerpt:
      "Od pierwszej konsultacji po wybór uczelni, teksty aplikacyjne i terminy — zobacz, jak może wyglądać uporządkowane wsparcie w aplikacji.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80",
    intro: [
      "Współpraca z mentorem aplikacyjnym powinna przypominać dobrze zaprojektowany proces, a nie serię przypadkowych konsultacji. Kandydat ma na końcu nie tylko wysłać dokumenty, ale też rozumieć, dlaczego wybrał takie kraje, taką listę uczelni i taką kolejność działań.",
      "Dla wielu uczniów największą wartością nie jest sama liczba spotkań, lecz to, że ktoś porządkuje całą drogę od diagnozy profilu po ostatnie poprawki w tekstach.",
    ],
    sections: [
      {
        title: "Etap 1: diagnoza profilu i celów",
        paragraphs: [
          "Na starcie trzeba zrozumieć wyniki, przedmioty, aktywności, budżet, język, preferencje kraju i poziom samodzielności ucznia. Bez tego każde kolejne działanie będzie oparte bardziej na przypuszczeniach niż na strategii.",
        ],
      },
      {
        title: "Etap 2: lista krajów i uczelni",
        paragraphs: [
          "Mentor pomaga oddzielić opcje ambitne od realistycznych oraz sprawdzić, czy profil ucznia odpowiada wymaganiom kierunku. W praktyce to często moment, w którym kandydat pierwszy raz widzi spójną listę zamiast zbioru inspiracji.",
        ],
      },
      {
        title: "Etap 3: kalendarz pracy",
        bullets: [
          "testy językowe i dodatkowe egzaminy,",
          "terminy rekomendacji,",
          "kolejne wersje tekstów,",
          "wysyłka dokumentów i tłumaczeń,",
          "deadliny stypendialne i finansowe.",
        ],
      },
      {
        title: "Etap 4: praca nad dokumentami i narracją",
        paragraphs: [
          "Tutaj wsparcie nie polega tylko na poprawianiu języka. Chodzi o uporządkowanie historii kandydata: co jest najmocniejsze, co naprawdę wspiera kierunek, a co tylko zajmuje miejsce. Dobra aplikacja jest selektywna i spójna.",
        ],
      },
      {
        title: "Etap 5: decyzje i kolejne kroki",
        paragraphs: [
          "Po wysłaniu aplikacji często zaczyna się drugi etap pytań: które oferty porównać, jak policzyć koszty, co zrobić z mieszkaniem, czy warto negocjować scholarship albo kiedy zaakceptować miejsce. Dobra współpraca obejmuje więc nie tylko sam moment aplikacji, ale też decyzję, gdzie finalnie studiować.",
        ],
      },
    ],
    related: [
      { title: "Czy warto korzystać z mentora przy aplikacji?", slug: "/mentor-aplikacyjny-studia-za-granica" },
      { title: "Jak dostać się na studia za granicą?", slug: "/jak-dostac-sie-na-studia-za-granica" },
    ],
  }),
  seedArticle({
    order: 14,
    category: "Poradniki",
    categorySlugs: ["strategia"],
    title: "Czy studia za granicą są dla mnie?",
    slug: "/czy-studia-za-granica-sa-dla-mnie",
    updatedAt,
    excerpt:
      "Nie każdy powinien wybierać tę samą ścieżkę. Sprawdź, jak myśleć o gotowości akademickiej, finansowej i osobistej do wyjazdu.",
    image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80",
    intro: [
      "To jedno z najuczciwszych pytań w całym procesie aplikacyjnym. Studia za granicą mogą być świetną decyzją, ale nie dlatego, że są modne albo bardziej prestiżowe „z definicji”. Mają sens wtedy, gdy realnie pasują do kandydata: jego celów, gotowości, budżetu i stylu uczenia się.",
      "Czasem odpowiedź brzmi „tak, zdecydowanie”. Czasem „tak, ale dopiero za kilka lat albo w innym kraju”. A czasem najlepszą decyzją jest zostać w Polsce na pierwszy etap i wyjechać później na magisterkę. Wszystkie te opcje mogą być rozsądne.",
    ],
    sections: [
      {
        title: "Gotowość akademicka",
        paragraphs: [
          "Wielu kandydatów dobrze radzi sobie z nauką szkolną, ale studia za granicą często wymagają też dużej samodzielności, pisania, czytania, pracy projektowej i sprawnego zarządzania czasem. Warto uczciwie ocenić, czy taki styl nauki Ci odpowiada.",
        ],
      },
      {
        title: "Gotowość finansowa",
        paragraphs: [
          "Nawet w krajach z niskim lub zerowym czesnym wyjazd kosztuje. Mieszkanie, jedzenie, transport, ubezpieczenie i pierwszy miesiąc po przyjeździe trzeba policzyć zawczasu. Dobrze, jeśli decyzja o wyjeździe opiera się na liczbach, a nie na nadziei, że „jakoś to będzie”.",
        ],
      },
      {
        title: "Gotowość osobista",
        bullets: [
          "czy potrafisz organizować codzienność bez stałego wsparcia rodziny,",
          "czy odnajdujesz się w nowym środowisku i kulturze,",
          "czy jesteś gotów na samotność, formalności i okres adaptacji,",
          "czy wyjazd wynika z realnej motywacji, a nie tylko z presji otoczenia.",
        ],
      },
      {
        title: "Kiedy lepiej odłożyć wyjazd",
        paragraphs: [
          "Jeśli kierunek za granicą nie jest na razie dostępny finansowo, nie czujesz się pewnie językowo albo po prostu potrzebujesz jeszcze czasu na zbudowanie profilu, odłożenie wyjazdu może być bardzo mądrą decyzją. Dla wielu osób świetnie działa licencjat w Polsce i magisterka za granicą.",
        ],
      },
      {
        title: "Po czym poznać, że wyjazd ma sens",
        bullets: [
          "program za granicą naprawdę daje Ci coś, czego nie dostajesz lokalnie,",
          "wiesz, po co wybierasz dany kraj i uczelnię,",
          "masz realistyczny plan finansowy,",
          "Twoje cele zawodowe i akademickie są z tym wyborem spójne.",
        ],
      },
    ],
    related: [
      { title: "Jak wybrać kierunek studiów za granicą?", slug: "/jak-wybrac-kierunek-studiow-za-granica" },
      { title: "Studia za granicą: poradnik dla rodziców", slug: "/studia-za-granica-poradnik-dla-rodzicow" },
    ],
  }),
  seedArticle({
    order: 15,
    category: "Poradniki",
    categorySlugs: ["strategia"],
    title: "Studia za granicą z polską maturą, IB albo A-levels",
    slug: "/studia-za-granica-polska-matura-ib-a-levels",
    updatedAt,
    excerpt:
      "Polska matura, IB i A-levels mogą otwierać różne drzwi — ale wymagania zależą od kraju, kierunku i konkretnych przedmiotów.",
    image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&q=80",
    intro: [
      "To, z jakiego systemu edukacyjnego kandydat pochodzi, ma ogromne znaczenie w aplikacji na studia za granicą. Uczelnie nie patrzą wyłącznie na wynik końcowy, ale także na strukturę przedmiotów, poziomy, specjalizację i to, czy profil akademicki pasuje do wymagań danego kierunku.",
      "Dlatego polska matura, IB i A-levels nie są po prostu trzema różnymi „dokumentami końcowymi”. To trzy różne sposoby budowania aplikacji, z których każdy daje inne przewagi i inne ograniczenia.",
    ],
    sections: [
      {
        title: "Polska matura",
        paragraphs: [
          "Polska matura jest akceptowana przez wiele uczelni w Europie i poza nią, ale ogromne znaczenie mają rozszerzenia. Dla wielu kierunków selektywnych nie wystarczy sam wynik ogólny — liczy się to, jakie przedmioty kandydat zdawał i na jakim poziomie.",
        ],
      },
      {
        title: "IB",
        paragraphs: [
          "IB jest dobrze rozpoznawalne międzynarodowo, ale uczelnie często patrzą szczególnie na HL-e i konfigurację przedmiotów. Kandydat z bardzo dobrym wynikiem końcowym może nadal być mniej dopasowany do niektórych kierunków, jeśli wybrał niewłaściwe przedmioty na wyższym poziomie.",
        ],
      },
      {
        title: "A-levels",
        paragraphs: [
          "A-levels są bardzo przejrzyste dla uczelni brytyjskich, ale wymagają świadomego wyboru przedmiotów. To właśnie dobór A-levels często już na wczesnym etapie otwiera albo zamyka niektóre ścieżki na medycynę, inżynierię, ekonomię czy prawo.",
        ],
      },
      {
        title: "Co zawsze trzeba sprawdzić",
        bullets: [
          "które przedmioty są obowiązkowe na wybranym kierunku,",
          "czy liczy się poziom podstawowy czy rozszerzony / HL / A-level,",
          "jak uczelnia przelicza wyniki z danego systemu,",
          "czy można aplikować na predicted grades,",
          "czy dany system jest wystarczający bez dodatkowych testów.",
        ],
      },
      {
        title: "Dlaczego strategia zależy od systemu",
        paragraphs: [
          "Dwie osoby o podobnym talencie i motywacji mogą potrzebować różnych krajów lub różnych list uczelni tylko dlatego, że uczą się w innym systemie. To właśnie dlatego dobry plan aplikacji powinien być budowany od profilu akademicznego, a nie od marzeń oderwanych od wymagań.",
        ],
      },
    ],
    related: [
      { title: "Jak dostać się na studia za granicą?", slug: "/jak-dostac-sie-na-studia-za-granica" },
      { title: "Jak wybrać kierunek studiów za granicą?", slug: "/jak-wybrac-kierunek-studiow-za-granica" },
    ],
  }),
  countryArticle({
    order: 16,
    category: "Kraje",
    categorySlugs: ["usa", "financial-aid", "common-app"],
    title: "Studia w USA — aplikacja, eseje, SAT i financial aid",
    slug: "/studia-w-usa",
    updatedAt,
    excerpt:
      "Aplikacja do USA różni się od europejskich systemów. Wyjaśniamy Common App, eseje, extracurriculars, testy i pomoc finansową dla international students.",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80",
    intro: [
      "Studia w USA są dla wielu uczniów synonimem ambitnej, międzynarodowej edukacji i ogromnej elastyczności akademickiej. Jednocześnie to jeden z najbardziej złożonych systemów aplikacyjnych na świecie: liczą się nie tylko oceny, ale też eseje, aktywności, rekomendacje, kontekst szkoły, a często również budżet i strategia financial aid.",
      "To oznacza, że aplikacja do Stanów Zjednoczonych nie jest rozszerzoną wersją aplikacji europejskiej. To osobny proces, który wymaga wcześniejszego planowania i zupełnie innego podejścia do narracji kandydata.",
    ],
    whyParagraphs: [
      "Największą zaletą USA jest elastyczność programu. Student często nie musi od pierwszego dnia zamykać się w jednej bardzo wąskiej specjalizacji. Może łączyć kilka obszarów, zmieniać kierunek rozwoju i korzystać z bardzo bogatego ekosystemu zajęć, researchu, organizacji studenckich i kontaktów zawodowych.",
      "To także kraj z ogromną liczbą uczelni o bardzo różnym charakterze: od liberal arts colleges po wielkie research universities. Dla jednego kandydata najlepsza będzie mała uczelnia z indywidualnym mentoringiem, dla innego duży kampus z potężną ofertą badawczą.",
    ],
    universities: [
      "MIT, Stanford, Harvard, Princeton i Yale dla kandydatów celujących w najbardziej selektywne uczelnie,",
      "Carnegie Mellon, UC Berkeley, Georgia Tech, UIUC czy University of Washington dla bardzo mocnych kierunków STEM i technologii,",
      "NYU, Columbia, UPenn czy Northwestern dla kandydatów szukających połączenia akademii z dużymi miastami i networkingiem,",
      "liberal arts colleges dla osób, które chcą kameralnego środowiska i dużej bliskości z wykładowcami.",
    ],
    applicationParagraphs: [
      "Najczęściej kandydat zaczyna od zbudowania listy uczelni, a potem przechodzi przez Common App lub Coalition, eseje główne, suplementy, rekomendacje i listę aktywności. W zależności od uczelni mogą pojawić się także portfolio, dodatkowe formularze finansowe i decyzja, czy wysyłać SAT/ACT.",
      "Bardzo ważne jest zrozumienie, że w USA aplikacja ma charakter holistyczny. Uczelnia patrzy nie tylko na wynik, lecz także na potencjał, dojrzałość, wybory kandydata i spójność całego profilu.",
    ],
    costsParagraphs: [
      "USA potrafią być bardzo drogie, ale jednocześnie część uczelni oferuje pomoc finansową dla international students. To właśnie dlatego strategia finansowa musi być wpisana w listę uczelni od samego początku.",
      "W praktyce kandydat powinien osobno policzyć czesne, mieszkanie, ubezpieczenie, podróże i codzienny koszt życia, a potem sprawdzić, które uczelnie rzeczywiście mają sens przy jego sytuacji finansowej.",
    ],
    whoItsFor: [
      "dla kandydatów, którzy chcą bardzo elastycznego programu i szerokiej edukacji,",
      "dla osób z mocnym profilem pozaszkolnym i gotowością do pracy nad esejami,",
      "dla uczniów, którzy myślą długofalowo o researchu, startupach lub międzynarodowej karierze,",
      "dla tych, którzy są gotowi dobrze zaplanować budżet i proces finansowania.",
    ],
    watchouts: [
      "nie każda droga do USA ma sens finansowo — trzeba to policzyć bardzo wcześnie,",
      "eseje do USA nie powinny być kopiami tekstów do UK lub Europy,",
      "lista uczelni musi być zbalansowana, a nie złożona tylko z topowych nazw,",
      "test-optional nie zawsze oznacza, że wynik testu nigdy nie pomoże aplikacji.",
    ],
    related: [
      { title: "Common App: jak działa aplikacja na studia w USA?", slug: "/common-app" },
      { title: "Financial aid dla international students w USA", slug: "/financial-aid-usa" },
    ],
  }),
  countryArticle({
    order: 17,
    category: "Kraje",
    categorySlugs: ["europa"],
    title: "Studia w Europie po angielsku — gdzie warto aplikować?",
    slug: "/studia-w-europie-po-angielsku",
    updatedAt,
    excerpt:
      "Holandia, Dania, Szwecja, Austria, Włochy, Hiszpania czy Belgia? Zobacz, jak porównywać kraje, koszty i programy po angielsku.",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
    intro: [
      "Europa po angielsku przyciąga kandydatów z Polski z kilku powodów naraz: bliższa odległość niż USA czy Kanada, często rozsądniejsze koszty, duża liczba programów i możliwość studiowania w bardzo różnych kulturach akademickich bez wychodzenia poza kontynent.",
      "Jednocześnie „Europa” nie jest jednym rynkiem studiów. Holandia, Dania, Włochy, Niemcy czy Hiszpania mogą być świetnymi opcjami, ale różnią się językiem codzienności, typem uczelni, strukturą aplikacji i kosztami życia.",
    ],
    whyParagraphs: [
      "Największą siłą Europy jest różnorodność. Kandydat może wybierać między programami bardzo praktycznymi, badawczymi, projektowymi, biznesowymi albo interdyscyplinarnymi — i to bez konieczności aplikowania w jednym, wspólnym modelu jak w USA.",
      "Dla wielu uczniów Europa jest też po prostu bardziej dostępna logistycznie. Łatwiej przyjechać na dni otwarte, wrócić na święta, znaleźć podobną strefę kulturową i poruszać się między krajami w trakcie studiów.",
    ],
    universities: [
      "Holandia: TU Delft, University of Amsterdam, Erasmus University Rotterdam, Leiden, Utrecht, Groningen, Maastricht, VU Amsterdam, University of Twente.",
      "Włochy: Bocconi, Politecnico di Milano, Bologna, Padwa, Sapienza, Torino, Politecnico di Torino.",
      "Skandynawia: DTU, University of Copenhagen, Aarhus, Lund, Uppsala, KTH, Aalto, University of Helsinki.",
      "Europa Zachodnia i Środkowa: KU Leuven, WU Wien, University of Vienna, TU Munich, Heidelberg, Sciences Po, ESADE, IE University.",
    ],
    applicationParagraphs: [
      "W Europie kontynentalnej aplikacja jest często bardziej formalna niż w USA czy UK. Duże znaczenie ma dopasowanie przedmiotów, wyniki, certyfikat językowy i terminowe przesłanie dokumentów. Czasem pojawiają się dodatkowe egzaminy lub systemy numerus fixus.",
      "To dobra wiadomość dla kandydatów, którzy wolą proces oparty na wymaganiach programu niż na bardzo narracyjnych esejach. Trzeba jednak pilnować detali: terminów, tłumaczeń, sposobu wysyłki i konkretnych wymagań dla poziomu studiów.",
    ],
    costsParagraphs: [
      "Czesne i koszty życia bardzo się różnią. W jednym kraju czesne może być relatywnie niskie, ale mieszkanie niezwykle trudne i drogie. W innym sytuacja będzie odwrotna. Dlatego porównując Europę, trzeba patrzeć na całkowity koszt studiowania, a nie tylko na jedną liczbę z tabeli.",
    ],
    whoItsFor: [
      "dla osób, które chcą studiować po angielsku w bliższej geograficznie formule niż USA,",
      "dla kandydatów szukających kompromisu między jakością, kosztem i logistyką,",
      "dla uczniów, którzy wolą bardziej formalny proces aplikacji niż rozbudowaną narrację,",
      "dla tych, którzy chcą porównać kilka krajów i wybrać naprawdę dopasowaną ścieżkę.",
    ],
    watchouts: [
      "nie zakładaj, że każdy program po angielsku działa w całkowicie anglojęzycznym środowisku,",
      "sprawdzaj dostępność mieszkań równolegle z aplikacją,",
      "uważaj na różnice między uczelniami badawczymi a uczelniami stosowanymi,",
      "nie traktuj Europy jako jednego wspólnego systemu rekrutacji.",
    ],
    related: [
      { title: "Studia w Holandii — przewodnik dla polskich maturzystów", slug: "/studia-w-holandii-po-angielsku" },
      { title: "Studia w Danii po angielsku — co warto wiedzieć?", slug: "/studia-w-danii-po-angielsku" },
    ],
  }),
  countryArticle({
    order: 18,
    category: "Kraje",
    categorySlugs: ["holandia", "europa"],
    title: "Studia w Holandii — przewodnik dla polskich maturzystów",
    slug: "/studia-w-holandii-po-angielsku",
    updatedAt,
    excerpt:
      "Holandia przyciąga programami po angielsku i praktycznym stylem nauki, ale trzeba uważać na terminy, wymagania i zakwaterowanie.",
    image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=80",
    intro: [
      "Holandia od lat jest jednym z najczęstszych kierunków wyjazdu wśród polskich kandydatów. Przyciąga szeroką ofertą programów po angielsku, stosunkowo przejrzystym systemem aplikacji i stylem nauki, który dla wielu uczniów wydaje się bardziej praktyczny niż klasyczny model wykładowy.",
      "To jednak nie znaczy, że Holandia jest prostym wyborem „z automatu”. Trzeba bardzo dobrze zrozumieć różnicę między typami uczelni, terminami numerus fixus i realną sytuacją mieszkaniową.",
    ],
    whyParagraphs: [
      "Holandia jest szczególnie atrakcyjna dla kandydatów zainteresowanych biznesem, ekonomią, psychologią, naukami społecznymi, designem i wybranymi kierunkami technologicznymi. Wiele programów jest zaprojektowanych międzynarodowo i od początku komunikuje się z kandydatem z zagranicy.",
      "Dużą zaletą jest też to, że dla wielu uczniów Holandia bywa logistycznie i finansowo bardziej dostępna niż kraje anglosaskie, przy zachowaniu wysokiej jakości nauki.",
    ],
    universities: [
      "TU Delft, Eindhoven i Twente dla kandydatów technicznych i inżynieryjnych,",
      "University of Amsterdam, VU Amsterdam, Utrecht, Groningen i Leiden dla szerokiego spektrum kierunków akademickich,",
      "Erasmus University Rotterdam i Maastricht dla biznesu, ekonomii i kierunków międzynarodowych,",
      "uczelnie sciences of applied sciences dla osób szukających bardziej praktycznej ścieżki.",
    ],
    applicationParagraphs: [
      "Aplikacja zwykle przechodzi przez Studielink, ale nie kończy się na samym założeniu konta. Kandydat musi jeszcze wypełnić wymagania konkretnej uczelni, a przy numerus fixus dodatkowo pilnować wcześniejszych terminów i czasem przejść selekcję.",
      "Na wielu programach ważne są matematyka, język angielski i zgodność profilu szkolnego z wymaganiami kierunku. Właśnie dlatego bardzo opłaca się sprawdzać oficjalne warunki programu dużo wcześniej niż w ostatnim semestrze szkoły.",
    ],
    costsParagraphs: [
      "Czesne dla obywateli UE bywa względnie przewidywalne, ale największym wyzwaniem są mieszkania. W wielu miastach znalezienie pokoju lub studia wymaga bardzo wczesnego działania i gotowości do szybkich decyzji.",
      "Budżet powinien obejmować nie tylko czesne, lecz także depozyt, transport, codzienne wydatki i ryzyko droższego zakwaterowania na starcie.",
    ],
    whoItsFor: [
      "dla uczniów, którzy chcą programu po angielsku w Europie i praktycznego stylu nauki,",
      "dla kandydatów gotowych pilnować formalnych wymagań i terminów,",
      "dla osób, które dobrze odnajdują się w samodzielnej pracy projektowej i dyskusjach.",
    ],
    watchouts: [
      "numerus fixus ma inne terminy niż wiele zwykłych programów,",
      "nazwa programu nie zawsze mówi, czy to uczelnia badawcza czy stosowana,",
      "problem mieszkaniowy trzeba traktować jak część aplikacji, a nie późniejszy detal.",
    ],
    related: [
      { title: "Studia w Europie po angielsku", slug: "/studia-w-europie-po-angielsku" },
      { title: "Jak wybrać kraj na studia za granicą?", slug: "/jak-wybrac-kraj-na-studia-za-granica" },
    ],
  }),
  countryArticle({
    order: 19,
    category: "Kraje",
    categorySlugs: ["wielka-brytania", "eseje-i-listy"],
    title: "Studia w UK po Brexicie — aplikacja, koszty i UCAS",
    slug: "/studia-w-uk-po-brexicie",
    updatedAt,
    excerpt:
      "Wielka Brytania nadal ma świetne uczelnie, ale po Brexicie wymaga dokładniejszego planu finansowego, UCAS i mocnych dokumentów.",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80",
    intro: [
      "Wielka Brytania nadal pozostaje jednym z najbardziej prestiżowych i rozpoznawalnych kierunków studiów za granicą, ale po Brexicie decyzja o wyjeździe wymaga znacznie większej świadomości finansowej i proceduralnej niż kiedyś. Dla wielu kandydatów UK wciąż ma ogromny sens — pod warunkiem że rozumieją system UCAS, strukturę aplikacji i realny koszt całej ścieżki.",
      "To nie jest już kierunek, do którego warto aplikować „na wszelki wypadek”. Dziś bardziej opłaca się podejść do niego selektywnie: sprawdzić, gdzie rzeczywiście jakość programu uzasadnia inwestycję i jak zbudować listę uczelni, która ma akademiczny oraz finansowy sens.",
    ],
    whyParagraphs: [
      "UK wciąż oferuje znakomite uczelnie, mocne programy kierunkowe i bardzo czytelną tożsamość akademicką wielu instytucji. Na niektórych kierunkach brytyjskie programy nadal należą do najbardziej cenionych na świecie.",
      "Dużą zaletą jest też przejrzystość ścieżki undergraduate: zazwyczaj trzy lata studiów w Anglii, dość jasny system aplikacji i kierunkowe podejście do wyboru programu.",
    ],
    universities: [
      "Oxford, Cambridge, Imperial, LSE i UCL dla kandydatów celujących w najbardziej selektywne uczelnie,",
      "Warwick, Bristol, Manchester, Bath, Durham, Edinburgh czy King’s College London jako bardzo mocne opcje w wielu dziedzinach,",
      "mniejsze, bardziej wyspecjalizowane uczelnie dla kandydatów szukających konkretnego stylu nauki lub miasta.",
    ],
    applicationParagraphs: [
      "Aplikacja undergraduate zazwyczaj przechodzi przez UCAS. Kandydat wybiera ograniczoną liczbę programów, przygotowuje personal statement, wpisuje przewidywane wyniki i koordynuje rekomendację szkolną. Przy wybranych kierunkach pojawiają się także testy lub rozmowy.",
      "W praktyce najważniejsze jest dobre dopasowanie kierunku. UK szczególnie premiuje kandydatów, którzy potrafią jasno pokazać swoje zainteresowanie przedmiotem i nie rozmywają aplikacji na kilka niepowiązanych ścieżek.",
    ],
    costsParagraphs: [
      "Po Brexicie wielu kandydatów z UE musi planować UK podobnie jak inne kierunki międzynarodowe. Trzeba osobno policzyć czesne, koszty życia, mieszkanie, wizę i to, jak całość wygląda w horyzoncie całych studiów.",
      "To nie przekreśla sensu wyjazdu, ale oznacza, że decyzja powinna być bardzo świadoma — szczególnie w porównaniu z tańszymi opcjami europejskimi.",
    ],
    whoItsFor: [
      "dla kandydatów, którzy chcą mocno kierunkowego programu i brytyjskiego stylu akademickiego,",
      "dla osób z dobrym profilem akademickim i gotowością do pracy nad personal statement,",
      "dla uczniów, którzy rozumieją koszt decyzji i mają plan finansowy.",
    ],
    watchouts: [
      "nie warto kopiować listy uczelni z czasów sprzed Brexitu bez przeliczenia kosztów,",
      "personal statement do UK musi być rzeczywiście kierunkowy,",
      "wybrane kierunki mają wcześniejsze terminy i dodatkowe wymagania.",
    ],
    related: [
      { title: "Jak napisać personal statement na studia w UK?", slug: "/jak-napisac-personal-statement" },
      { title: "Czy warto zdawać SAT albo ACT?", slug: "/sat-act" },
    ],
  }),
  countryArticle({
    order: 20,
    category: "Kraje",
    categorySlugs: ["niemcy", "darmowe-studia", "koszty"],
    title: "Bezpłatne studia w Niemczech — jak to możliwe i jak aplikować?",
    slug: "/bezplatne-studia-w-niemczech",
    updatedAt,
    excerpt:
      "Niemcy mogą być bardzo atrakcyjne finansowo, szczególnie na uczelniach publicznych. Sprawdź, kiedy niski koszt naprawdę oznacza dobrą opcję.",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&q=80",
    intro: [
      "Niemcy są jednym z najczęściej wymienianych krajów, gdy kandydaci szukają jakościowej edukacji przy znacznie niższym koszcie niż w krajach anglosaskich. Hasło „bezpłatne studia” jest jednak uproszczeniem: brak wysokiego czesnego nie oznacza braku kosztów ani łatwej ścieżki aplikacyjnej.",
      "Dla wielu kandydatów Niemcy naprawdę mogą być świetną opcją, ale tylko wtedy, gdy rozumieją różnicę między niskim czesnym a całkowitym kosztem studiowania, a także wiedzą, na których poziomach i kierunkach realnie da się studiować po angielsku.",
    ],
    whyParagraphs: [
      "Największą siłą Niemiec są publiczne uczelnie o wysokim poziomie oraz bardzo dobra reputacja w obszarach technicznych, naukach ścisłych, ekonomii i wybranych kierunkach badawczych.",
      "To także kraj, który szczególnie dobrze wypada dla osób myślących długofalowo o pracy w przemyśle, inżynierii, badaniach lub technologiach stosowanych.",
    ],
    universities: [
      "Technical University of Munich, RWTH Aachen, KIT Karlsruhe, TU Berlin, TU Darmstadt i University of Stuttgart dla kandydatów technicznych.",
      "Heidelberg, Humboldt, Freiburg czy Mannheim dla kierunków bardziej badawczych, ekonomicznych lub społecznych.",
      "Programy master’s po angielsku są zwykle znacznie szersze niż oferta bachelorów po angielsku.",
    ],
    applicationParagraphs: [
      "W Niemczech trzeba bardzo dokładnie sprawdzać język programu, typ uczelni i sposób składania dokumentów. Część aplikacji przechodzi przez uni-assist, część bezpośrednio przez uczelnię. Różnią się także wymagania dla kandydatów z polską maturą.",
      "Szczególnie na licencjacie warto uważać na to, że wiele mocnych programów nadal jest prowadzonych po niemiecku. Jeśli kandydat szuka wyłącznie studiów po angielsku, lista opcji będzie węższa niż intuicyjnie się wydaje.",
    ],
    costsParagraphs: [
      "Niski albo zerowy poziom czesnego nie eliminuje kosztów życia. Mieszkanie, kaucja, ubezpieczenie, transport i codzienne wydatki trzeba policzyć z wyprzedzeniem, zwłaszcza w dużych miastach.",
      "W praktyce Niemcy są bardzo atrakcyjne kosztowo, ale tylko przy realistycznym budżecie i dobrej organizacji formalności.",
    ],
    whoItsFor: [
      "dla kandydatów technicznych i ścisłych,",
      "dla osób, które chcą ograniczyć koszt studiów, ale nie jakość uczelni,",
      "dla uczniów gotowych sprawdzić, czy potrzebują języka niemieckiego już na etapie studiów.",
    ],
    watchouts: [
      "nie każdy program „w Niemczech” oznacza możliwość studiowania po angielsku,",
      "formalności i dokumenty potrafią być bardzo szczegółowe,",
      "niski koszt czesnego nie rozwiązuje problemu mieszkania i kosztów utrzymania.",
    ],
    related: [
      { title: "Darmowe studia za granicą — kiedy to naprawdę możliwe?", slug: "/darmowe-studia-za-granica" },
      { title: "Ile kosztują studia za granicą?", slug: "/ile-kosztuja-studia-za-granica" },
    ],
  }),
  countryArticle({
    order: 21,
    category: "Kraje",
    categorySlugs: ["hiszpania", "europa"],
    title: "Studia w Hiszpanii — słońce, kultura i dyplom uznawany w całej Europie",
    slug: "/studia-w-hiszpanii",
    updatedAt,
    excerpt:
      "Hiszpania to nie tylko Madryt i Barcelona. To także uczelnie, programy po angielsku, kierunki biznesowe i rosnące możliwości dla absolwentów.",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=80",
    intro: [
      "Hiszpania bardzo często pojawia się w rozmowach o studiach za granicą ze względu na klimat, styl życia i rozpoznawalne miasta, ale to za mało, by podjąć dobrą decyzję aplikacyjną. Najważniejsze pytanie brzmi: czy programy, które rzeczywiście są dostępne, odpowiadają profilowi i planom kandydata.",
      "Dla części uczniów Hiszpania będzie świetna w biznesie, marketingu, prawie międzynarodowym, naukach społecznych, designie albo kierunkach powiązanych z turystyką. Dla innych może okazać się mniej naturalna niż Holandia czy UK — i to jest całkowicie normalne.",
    ],
    whyParagraphs: [
      "Hiszpania ma kilka bardzo ciekawych uczelni i szkół biznesowych, a dodatkowo przyciąga studentów międzynarodowych dobrą jakością życia i dużymi miastami z rozbudowanym życiem akademickim.",
      "W przypadku części programów anglojęzycznych dużą wartością jest połączenie międzynarodowego środowiska z silnym lokalnym kontekstem biznesowym i kulturowym.",
    ],
    universities: [
      "IE University, ESADE i wybrane szkoły biznesowe dla kandydatów zainteresowanych managementem, biznesem i innowacją,",
      "Universitat de Barcelona, Universidad Complutense de Madrid i inne duże ośrodki akademickie dla szerokiej oferty kierunków,",
      "programy prywatne i publiczne różnią się znacząco językiem, ceną i stylem nauczania.",
    ],
    applicationParagraphs: [
      "W Hiszpanii trzeba bardzo dokładnie sprawdzić język programu. Część kierunków jest w pełni po angielsku, część dwujęzyczna, a część wymaga hiszpańskiego na poziomie, który dla kandydatów z Polski będzie barierą.",
      "Aplikacja może być zależna od typu uczelni. Programy prywatne często mają inne procedury niż uczelnie publiczne, a część kierunków może wymagać dodatkowych dokumentów lub rozmów.",
    ],
    costsParagraphs: [
      "Hiszpania bywa bardziej dostępna kosztowo niż kraje anglosaskie, ale budżet zależy mocno od miasta. Madryt czy Barcelona różnią się od mniejszych ośrodków zarówno kosztem życia, jak i dynamiką rynku mieszkaniowego.",
    ],
    whoItsFor: [
      "dla kandydatów zainteresowanych biznesem, komunikacją, designem i kierunkami międzynarodowymi,",
      "dla osób, które dobrze czują się w większych, żywych miastach,",
      "dla uczniów gotowych sprawdzić, jak dużą rolę w codzienności będzie odgrywał język hiszpański.",
    ],
    watchouts: [
      "nie zakładaj, że każdy ciekawie brzmiący program jest całkowicie po angielsku,",
      "sprawdź różnicę między uczelnią publiczną a prywatną zanim ocenisz koszty,",
      "porównuj konkretne kierunki, a nie samą atrakcyjność kraju.",
    ],
    related: [
      { title: "Studia w Europie po angielsku", slug: "/studia-w-europie-po-angielsku" },
      { title: "Jak wybrać kraj na studia za granicą?", slug: "/jak-wybrac-kraj-na-studia-za-granica" },
    ],
  }),
  countryArticle({
    order: 22,
    category: "Kraje",
    categorySlugs: ["wlochy", "europa"],
    title: "Studia we Włoszech po angielsku — koszty, uczelnie i aplikacja",
    slug: "/studia-we-wloszech-po-angielsku",
    updatedAt,
    excerpt:
      "Włochy oferują znane uczelnie, coraz więcej programów po angielsku i atrakcyjne koszty w porównaniu z krajami anglosaskimi.",
    image: "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=1200&q=80",
    intro: [
      "Włochy przestały być wyłącznie kierunkiem dla osób zakochanych w kulturze, architekturze i włoskim stylu życia. Dziś coraz częściej są realnie rozważane przez kandydatów szukających programów po angielsku w biznesie, designie, ekonomii, architekturze czy nawet medycynie.",
      "To jeden z tych krajów, gdzie bardzo ważne jest oddzielenie atrakcyjnego wyobrażenia od konkretnego programu. Dla jednych kandydatów Włochy będą znakomitym wyborem, dla innych tylko piękną inspiracją, która nie do końca pasuje do ich kierunku lub stylu nauki.",
    ],
    whyParagraphs: [
      "Włochy przyciągają połączeniem długiej tradycji akademickiej z rosnącą ofertą programów po angielsku. Na wybranych kierunkach można znaleźć bardzo mocne uczelnie o wysokiej rozpoznawalności w Europie.",
      "To również kraj atrakcyjny dla osób, które szukają bardziej przystępnych kosztów niż w UK czy USA, przy zachowaniu międzynarodowego środowiska i dobrego poziomu uczelni.",
    ],
    universities: [
      "Bocconi dla ekonomii, finansów i biznesu,",
      "Politecnico di Milano i Politecnico di Torino dla inżynierii, architektury i designu,",
      "Bologna, Padwa, Sapienza, Turyn czy Mediolan dla szerokiego spektrum programów akademickich,",
      "w medycynie lub bardzo selektywnych kierunkach trzeba zawsze sprawdzać osobne zasady rekrutacji.",
    ],
    applicationParagraphs: [
      "Włochy nie mają jednego uniwersalnego modelu aplikacji dla wszystkich uczelni. Część instytucji prowadzi własne systemy, część ma dodatkowe egzaminy, a część różni się zasadami między uczelniami publicznymi i prywatnymi.",
      "Kluczowe jest dokładne sprawdzenie terminu, wymagań językowych oraz tego, czy program rzeczywiście jest prowadzony po angielsku przez cały okres studiów.",
    ],
    costsParagraphs: [
      "W porównaniu z krajami anglosaskimi Włochy mogą wypadać kosztowo korzystnie, ale bardzo wiele zależy od miasta. Mediolan i Rzym oznaczają inną rzeczywistość finansową niż mniejsze ośrodki akademickie.",
    ],
    whoItsFor: [
      "dla osób zainteresowanych biznesem, designem, architekturą, ekonomią i wybranymi kierunkami społecznymi,",
      "dla kandydatów, którzy chcą połączenia jakości programu i atrakcyjniejszego kosztu niż w UK,",
      "dla uczniów gotowych odnaleźć się w kraju, gdzie włoski może zyskać znaczenie w codzienności.",
    ],
    watchouts: [
      "różnice między uczelniami są bardzo duże i nie warto generalizować całego kraju,",
      "sprawdzaj osobno procedury dla uczelni publicznych i prywatnych,",
      "nie utożsamiaj atrakcyjności miasta z dopasowaniem programu.",
    ],
    related: [
      { title: "Jak aplikować na medycynę za granicą?", slug: "/jak-aplikowac-na-medycyne-za-granica" },
      { title: "Studia w Europie po angielsku", slug: "/studia-w-europie-po-angielsku" },
    ],
  }),
  countryArticle({
    order: 23,
    category: "Kraje",
    categorySlugs: ["dania", "europa"],
    title: "Studia w Danii po angielsku — co warto wiedzieć?",
    slug: "/studia-w-danii-po-angielsku",
    updatedAt,
    excerpt:
      "Sprawdź, jak wyglądają studia w Danii po angielsku: dostępne kierunki, uczelnie, koszty, rekrutacja, terminy, wymagania językowe i życie studenckie.",
    image: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=1200&q=80",
    intro: [
      "Dania od lat przyciąga studentów z całej Europy wysoką jakością życia, nowoczesną edukacją i praktycznym podejściem do nauki. Dla wielu kandydatów z Polski studia w Danii po angielsku wydają się atrakcyjną alternatywą dla Holandii, Wielkiej Brytanii, Niemiec, Irlandii czy Szwecji.",
      "Jednocześnie Dania nie jest już tak prostym wyborem, jak mogło się wydawać kilka lat temu. Oferta kierunków po angielsku zmieniała się, szczególnie na poziomie licencjackim, dlatego przed wyborem uczelni trzeba bardzo dokładnie sprawdzić, co jest naprawdę dostępne i dla kogo ma sens.",
      "Właśnie w tym procesie może pomóc dobrze ułożona strategia. Dania potrafi być świetnym wyborem, ale tylko wtedy, gdy kandydat porówna programy, wymagania, koszty, perspektywy po dyplomie i codzienność poza salą wykładową.",
    ],
    whyParagraphs: [
      "Dania jest ceniona za projektowy styl nauki, pracę zespołową i bliskie związki części programów z biznesem i praktyką zawodową. To kraj szczególnie ciekawy dla osób, które chcą uczyć się nowocześnie i nie ograniczać studiów wyłącznie do wykładów.",
      "Dodatkową zaletą jest powszechna dobra znajomość angielskiego w codziennym życiu. Trzeba jednak pamiętać, że wygoda językowa nie oznacza automatycznie szerokiej oferty bachelorów po angielsku.",
    ],
    universities: [
      "University of Copenhagen, Aarhus University, DTU i Aalborg University jako najsilniejsze punkty odniesienia dla programów akademickich i technicznych.",
      "Copenhagen Business School dla biznesu, zarządzania i pokrewnych obszarów.",
      "IT University of Copenhagen dla kandydatów zainteresowanych technologią, systemami cyfrowymi i projektowaniem.",
      "University colleges i business academies dla bardziej praktycznych, zawodowych ścieżek.",
    ],
    applicationParagraphs: [
      "W Danii trzeba przede wszystkim sprawdzić poziom studiów i język programu. Oferta anglojęzyczna bywa szersza na poziomie magisterskim niż licencjackim, dlatego kandydat po polskiej maturze powinien bardzo uważnie sprawdzić, czy wybrany bachelor rzeczywiście jest dostępny po angielsku.",
      "Ważne są też wymagania formalne: wyniki, przedmioty, certyfikat językowy i terminy. Dla części kandydatów kluczowe będzie również rozróżnienie między klasycznym uniwersytetem badawczym a bardziej praktyczną instytucją zawodową.",
    ],
    costsParagraphs: [
      "Dania bywa atrakcyjna z perspektywy czesnego dla kandydatów z UE, ale trzeba realistycznie policzyć koszty życia. Kopenhaga i inne duże miasta nie należą do tanich, dlatego mieszkanie i codzienny budżet trzeba uwzględnić od początku.",
    ],
    whoItsFor: [
      "dla uczniów szukających projektowego stylu nauki i międzynarodowego środowiska,",
      "dla kandydatów technicznych, biznesowych i zainteresowanych sustainability,",
      "dla osób, które są gotowe bardzo dokładnie zweryfikować dostępność programu po angielsku.",
    ],
    watchouts: [
      "nie zakładaj, że jeśli uczelnia ma dużo magisterek po angielsku, to podobnie będzie na bachelorze,",
      "sprawdzaj, czy program jest akademicki czy bardziej zawodowy,",
      "nie ignoruj kosztów życia tylko dlatego, że czesne wygląda rozsądnie.",
    ],
    related: [
      { title: "Studia w Europie po angielsku", slug: "/studia-w-europie-po-angielsku" },
      { title: "Jak aplikować na informatykę za granicą?", slug: "/jak-aplikowac-na-informatyke-za-granica" },
    ],
  }),
  countryArticle({
    order: 24,
    category: "Kraje",
    categorySlugs: ["szwecja", "europa"],
    title: "Studia w Szwecji po angielsku — kierunki, koszty i wymagania",
    slug: "/studia-w-szwecji-po-angielsku",
    updatedAt,
    excerpt:
      "Szwecja przyciąga nowoczesną edukacją, designem i innowacją. Zobacz, na co zwrócić uwagę przy wyborze uczelni i programu.",
    image: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=1200&q=80",
    intro: [
      "Szwecja kojarzy się kandydatom z nowoczesnością, wysoką jakością życia, zaufaniem społecznym i bardzo dobrą edukacją. W praktyce to kraj szczególnie interesujący dla osób, które cenią samodzielność, pracę projektową i studia w środowisku mocno międzynarodowym.",
      "Jednocześnie nie jest to kierunek dla każdego. Koszty życia są wysokie, a oferta programów po angielsku może różnić się między poziomami studiów. Dlatego wybór Szwecji warto oprzeć na konkretnym kierunku i uczelni, a nie na ogólnym wizerunku kraju.",
    ],
    whyParagraphs: [
      "Szwecja jest bardzo silna w obszarach takich jak technologia, sustainability, design, innowacje i wybrane nauki społeczne. Dla wielu kandydatów ogromnym plusem jest też kultura pracy zespołowej i partnerskiej relacji między studentem a uczelnią.",
      "To kraj, w którym styl nauki bywa bardziej dialogiczny i mniej hierarchiczny, co dla jednych studentów jest ogromną zaletą, a dla innych wymaga czasu na adaptację.",
    ],
    universities: [
      "KTH, Lund University i Uppsala University jako najbardziej rozpoznawalne punkty odniesienia.",
      "University of Gothenburg, Chalmers czy Stockholm University dla wybranych kierunków technicznych, społecznych i kreatywnych.",
      "Wiele programów po angielsku jest szczególnie atrakcyjnych na poziomie magisterskim.",
    ],
    applicationParagraphs: [
      "Kandydaci aplikują zwykle przez scentralizowany system i muszą bardzo pilnować terminu oraz dokumentów. Warto sprawdzić, czy program jest dostępny na poziomie licencjackim, bo część mocnych opcji po angielsku pojawia się dopiero później.",
      "Równie ważne jest dopasowanie przedmiotów szkolnych i potwierdzenie poziomu angielskiego, jeśli uczelnia tego wymaga.",
    ],
    costsParagraphs: [
      "Szwecja jest krajem o wysokich kosztach życia, dlatego nawet jeśli program wygląda atrakcyjnie akademicko, budżet musi zostać przeliczony uczciwie i bez optymistycznych założeń. Szczególnie ważne są mieszkanie, transport i codzienna logistyka.",
    ],
    whoItsFor: [
      "dla kandydatów ceniących samodzielność, innowację i projektowy styl pracy,",
      "dla osób zainteresowanych technologią, designem, sustainability i naukami społecznymi,",
      "dla uczniów gotowych funkcjonować w kraju o wysokim koszcie życia.",
    ],
    watchouts: [
      "sprawdź, na którym poziomie studiów program jest dostępny po angielsku,",
      "nie ignoruj kosztów życia, bo potrafią całkowicie zmienić sens wyjazdu,",
      "porównuj konkretny program, a nie tylko atrakcyjny wizerunek kraju.",
    ],
    related: [
      { title: "Studia w Danii po angielsku — co warto wiedzieć?", slug: "/studia-w-danii-po-angielsku" },
      { title: "Studia w Europie po angielsku", slug: "/studia-w-europie-po-angielsku" },
    ],
  }),
  countryArticle({
    order: 25,
    category: "Kraje",
    categorySlugs: ["kanada"],
    title: "Studia w Kanadzie — czy to dobra alternatywa dla USA?",
    slug: "/studia-w-kanadzie",
    updatedAt,
    excerpt:
      "Kanada łączy wysoką jakość uczelni z bardziej przewidywalnym systemem niż USA. Zobacz, dla kogo to naprawdę dobry kierunek.",
    image: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1200&q=80",
    intro: [
      "Kanada często pojawia się jako bardziej przewidywalna alternatywa dla USA: z mocnymi uczelniami, anglojęzycznym środowiskiem i dużymi miastami, które mają rozwinięte ekosystemy akademickie oraz zawodowe. Dla wielu kandydatów z Polski to bardzo interesująca ścieżka — pod warunkiem że wiedzą, czym Kanada rzeczywiście różni się od Stanów.",
      "To nie jest po prostu „tańsza Ameryka”. Kanada ma własny system, własne mocne uczelnie i własną logikę aplikacji. Warto więc patrzeć na nią jako na osobny kierunek, a nie plan B.",
    ],
    whyParagraphs: [
      "Kanada łączy wysoki poziom uczelni z przyjaznym wizerunkiem kraju dla studentów międzynarodowych. Dla części kandydatów ważna jest też perspektywa kariery po studiach i siła ośrodków takich jak Toronto, Vancouver, Montreal czy Waterloo.",
      "To szczególnie ciekawe miejsce dla osób zainteresowanych informatyką, biznesem, naukami ścisłymi, ekonomią i kierunkami interdyscyplinarnymi.",
    ],
    universities: [
      "University of Toronto, McGill i UBC jako najbardziej rozpoznawalne uczelnie o bardzo mocnym profilu badawczym.",
      "University of Waterloo dla kandydatów technologicznych i zainteresowanych praktycznym połączeniem studiów z rynkiem pracy.",
      "York University, Queen’s, Simon Fraser czy University of Alberta jako wartościowe opcje zależnie od kierunku.",
    ],
    applicationParagraphs: [
      "Kanadyjski system jest zwykle mniej holistyczny niż amerykański, ale nadal wymaga bardzo dobrego zrozumienia wymagań konkretnej uczelni. Czasem większe znaczenie mają wyniki i formalne dopasowanie, a czasem dodatkowe elementy profilu też grają rolę.",
      "Kluczowe jest sprawdzenie nie tylko wymagań akademickich, ale też kosztów, języka prowincji, struktury programu i tego, jak uczelnia wspiera studentów zagranicznych.",
    ],
    costsParagraphs: [
      "Kanada nie jest krajem tanim, dlatego trzeba osobno policzyć czesne i koszty życia. Mimo to dla części kandydatów nadal bywa bardziej przewidywalna i atrakcyjna niż niektóre ścieżki amerykańskie, zwłaszcza jeśli porównujemy konkretny profil uczelni.",
    ],
    whoItsFor: [
      "dla osób, które chcą wysokiej jakości uczelni w anglojęzycznym środowisku,",
      "dla kandydatów zainteresowanych technologią, biznesem, naukami ścisłymi i badaniami,",
      "dla uczniów, którzy chcą porównać Amerykę Północną szerzej niż tylko przez pryzmat USA.",
    ],
    watchouts: [
      "nie traktuj Kanady jako automatycznie tańszego odpowiednika USA bez liczenia kosztów,",
      "sprawdzaj różnice między uczelniami i prowincjami,",
      "porównuj konkretne programy, a nie tylko ogólną markę kraju.",
    ],
    related: [
      { title: "Studia w USA — aplikacja, eseje, SAT i financial aid", slug: "/studia-w-usa" },
      { title: "Gdzie studiować informatykę za granicą?", slug: "/jak-aplikowac-na-informatyke-za-granica" },
    ],
  }),
  seedArticle({
    order: 26,
    category: "Finansowanie",
    categorySlugs: ["koszty", "stypendia"],
    title: "Ile kosztują studia za granicą i jak znaleźć stypendium?",
    slug: "/ile-kosztuja-studia-za-granica",
    updatedAt,
    excerpt:
      "Koszty studiowania za granicą to nie tylko czesne. Zobacz, jak liczyć cały budżet i gdzie szukać realnych źródeł wsparcia.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
    intro: [
      "Pytanie o koszt studiów za granicą jest trudne nie dlatego, że nie da się na nie odpowiedzieć, ale dlatego, że zbyt często pada za późno. Kandydaci porównują czesne, a dopiero później odkrywają, że mieszkanie, transport, depozyt, dokumenty i pierwsze tygodnie po przyjeździe potrafią zmienić opłacalność całego wyjazdu.",
      "Najlepszy budżet aplikacyjny to taki, który obejmuje pełny obraz: nie tylko cenę programu, ale też codzienność i scenariusz minimum na pierwszy rok.",
    ],
    sections: [
      {
        title: "Z czego składa się koszt studiowania",
        bullets: [
          "czesne, jeśli kraj lub uczelnia je pobiera,",
          "zakwaterowanie i kaucja,",
          "jedzenie, transport i telefon,",
          "ubezpieczenie, dokumenty i testy językowe,",
          "opłaty aplikacyjne i ewentualny depozyt,",
          "podróże do i z kraju studiów.",
        ],
      },
      {
        title: "Dlaczego czesne nie mówi całej prawdy",
        paragraphs: [
          "Kraj z relatywnie niskim czesnym może okazać się bardzo kosztowny przez rynek mieszkaniowy. Z kolei uczelnia o wysokim czesnym może mieć mocne scholarship albo financial aid. W praktyce liczy się więc całkowity koszt netto, a nie jedna liczba na stronie programu.",
        ],
      },
      {
        title: "Gdzie szukać wsparcia finansowego",
        bullets: [
          "stypendia uczelniane i merit scholarships,",
          "need-based aid, jeśli system uczelni to przewiduje,",
          "zewnętrzne fundacje, programy krajowe i regionalne,",
          "wewnętrzne programy wsparcia, takie jak stypendia aplikacyjne Acadea.",
        ],
      },
      {
        title: "Jak planować budżet realistycznie",
        paragraphs: [
          "Najrozsądniej policzyć trzy scenariusze: optymistyczny, realny i bezpieczny. Dzięki temu kandydat widzi, czy wyjazd nadal ma sens wtedy, gdy mieszkanie okaże się droższe albo wsparcie finansowe mniejsze niż oczekiwano.",
        ],
      },
      {
        title: "Najczęstsze błędy",
        bullets: [
          "sprawdzanie kosztów dopiero po złożeniu aplikacji,",
          "liczenie tylko czesnego, bez życia i depozytu,",
          "budowanie listy uczelni bez uwzględnienia scholarship strategy,",
          "zakładanie, że dodatkowa praca w trakcie studiów zawsze rozwiąże problem budżetu.",
        ],
      },
    ],
    related: [
      { title: "Jak zdobyć stypendium na studia za granicą?", slug: "/stypendia-na-studia-za-granica" },
      { title: "Darmowe studia za granicą", slug: "/darmowe-studia-za-granica" },
    ],
  }),
  seedArticle({
    order: 27,
    category: "Finansowanie",
    categorySlugs: ["stypendia"],
    title: "Jak zdobyć stypendium na studia za granicą? Kompletny poradnik",
    slug: "/stypendia-na-studia-za-granica",
    updatedAt,
    excerpt:
      "Stypendium rzadko pojawia się przypadkiem. Sprawdź, jakie typy wsparcia istnieją i jak budować strategię scholarship już na etapie wyboru uczelni.",
    image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1200&q=80",
    intro: [
      "Stypendium na studia za granicą nie jest dodatkiem, którego szuka się po przyjęciu na uczelnię. W najlepszym scenariuszu jest częścią strategii od samego początku, bo to właśnie rodzaj dostępnego wsparcia finansowego często powinien wpływać na wybór krajów i listę uczelni.",
      "Wielu kandydatów traci czas, bo szuka „jednego dużego stypendium”, zamiast zrozumieć, że źródła finansowania mogą być różne i zwykle trzeba je analizować bardzo konkretnie.",
    ],
    sections: [
      {
        title: "Jakie typy stypendiów istnieją",
        bullets: [
          "merit-based scholarships za wyniki lub profil kandydata,",
          "need-based aid zależne od sytuacji finansowej rodziny,",
          "stypendia kierunkowe lub wydziałowe,",
          "zewnętrzne programy fundacji i organizacji,",
          "lokalne i krajowe programy wsparcia dla konkretnych grup kandydatów.",
        ],
      },
      {
        title: "Dlaczego scholarship strategy zaczyna się od listy uczelni",
        paragraphs: [
          "Nie każda uczelnia finansuje international students w podobny sposób. Czasem lepiej wybrać mniej rozpoznawalną uczelnię z sensownym pakietem pomocy niż bardzo prestiżową opcję bez realnego wsparcia. Dlatego finanse powinny współdecydować o doborze listy aplikacji.",
        ],
      },
      {
        title: "Co zwiększa szanse na wsparcie",
        bullets: [
          "spójny i mocny profil akademicki,",
          "dobrze przygotowane dokumenty i teksty,",
          "złożenie aplikacji w terminie lub wcześniejszej rundzie, jeśli system to premiuje,",
          "świadome dopasowanie do uczelni, które rzeczywiście wspierają studentów z zagranicy.",
        ],
      },
      {
        title: "Najczęstsze błędy kandydatów",
        bullets: [
          "szukanie stypendium dopiero po wysłaniu aplikacji,",
          "mylenie rabatu od czesnego z pełnym finansowaniem,",
          "brak planu awaryjnego, jeśli scholarship okaże się niższe niż oczekiwano,",
          "wybieranie uczelni bez sprawdzenia, czy wspierają kandydatów o podobnym profilu.",
        ],
      },
      {
        title: "Jak podejść do tematu realistycznie",
        paragraphs: [
          "Najlepiej myśleć o stypendium jak o części większego systemu finansowania: własnych środków, wsparcia rodziny, ewentualnych zewnętrznych programów i uczelniowej pomocy. Dzięki temu decyzje stają się bardziej stabilne i mniej ryzykowne.",
        ],
      },
    ],
    related: [
      { title: "Ile kosztują studia za granicą?", slug: "/ile-kosztuja-studia-za-granica" },
      { title: "Stypendia Acadea", slug: "/stypendia-acadea" },
    ],
  }),
  seedArticle({
    order: 28,
    category: "Finansowanie",
    categorySlugs: ["darmowe-studia", "koszty"],
    title: "Darmowe studia za granicą — kiedy to naprawdę możliwe?",
    slug: "/darmowe-studia-za-granica",
    updatedAt,
    excerpt:
      "Darmowe studia istnieją, ale prawie nigdy nie oznaczają wyjazdu bez kosztów. Sprawdź, kiedy ten model naprawdę działa i na co uważać.",
    image: "https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=1200&q=80",
    intro: [
      "Hasło „darmowe studia za granicą” działa mocno na wyobraźnię, ale jest jednocześnie jednym z najbardziej mylących skrótów w całym procesie aplikacyjnym. W praktyce brak czesnego nie oznacza braku kosztów, a kraj postrzegany jako tani może okazać się logistycznie albo mieszkaniowo bardzo wymagający.",
      "To nie znaczy, że darmowe lub bardzo tanie studia nie istnieją. Trzeba po prostu precyzyjnie rozumieć, co jest darmowe, dla kogo i pod jakimi warunkami.",
    ],
    sections: [
      {
        title: "Co naprawdę może być darmowe",
        bullets: [
          "czesne na uczelniach publicznych dla określonych grup studentów,",
          "wybrane programy finansowane przez państwo lub region,",
          "studia, w których koszt formalny jest niski, ale niezerowy,",
          "programy, gdzie wysokie koszty życia nadal pozostają po stronie studenta.",
        ],
      },
      {
        title: "Najczęstsze kraje w takich rozmowach",
        paragraphs: [
          "Najczęściej kandydaci patrzą na Niemcy, część krajów nordyckich, wybrane opcje w Europie Środkowej i państwowe uczelnie w krajach, gdzie czesne dla obywateli UE jest relatywnie niskie. Każdy z tych przypadków trzeba jednak sprawdzać osobno dla poziomu studiów i języka programu.",
        ],
      },
      {
        title: "Największy błąd: skupienie tylko na czesnym",
        paragraphs: [
          "Jeśli kandydat nie policzy mieszkania, jedzenia, ubezpieczenia, transportu i pierwszych kosztów po przeprowadzce, może dojść do wniosku, że „darmowy” kraj jest poza jego zasięgiem bardziej niż płatny program z dobrym stypendium.",
        ],
      },
      {
        title: "Kiedy taki model ma sens",
        bullets: [
          "gdy program jest realnie mocny i dopasowany do kierunku,",
          "gdy kandydat akceptuje język lub warunki lokalne,",
          "gdy całościowy budżet pozostaje bezpieczny, a nie tylko sam koszt czesnego,",
          "gdy darmowość nie jest jedynym kryterium decyzji.",
        ],
      },
      {
        title: "Jak to porównywać z innymi opcjami",
        paragraphs: [
          "W praktyce warto zestawić darmowe lub tanie studia z płatnymi kierunkami oferującymi scholarship. Czasem ten drugi model okazuje się lepiej dopasowany, bardziej przewidywalny i finalnie podobny kosztowo.",
        ],
      },
    ],
    related: [
      { title: "Bezpłatne studia w Niemczech", slug: "/bezplatne-studia-w-niemczech" },
      { title: "Jak zdobyć stypendium na studia za granicą?", slug: "/stypendia-na-studia-za-granica" },
    ],
  }),
  seedArticle({
    order: 29,
    category: "Finansowanie",
    categorySlugs: ["financial-aid", "usa"],
    title: "Financial aid dla international students w USA",
    slug: "/financial-aid-usa",
    updatedAt,
    excerpt:
      "Need-blind, need-aware, CSS Profile, merit scholarships — wyjaśniamy, jak naprawdę działa pomoc finansowa w USA dla kandydatów spoza Stanów.",
    image: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=1200&q=80",
    intro: [
      "Financial aid w USA jest jednym z najbardziej niezrozumianych tematów w aplikacji międzynarodowej. Kandydaci często słyszą, że „w Ameryce można dostać pełne finansowanie”, ale rzadziej dowiadują się, jak niewiele uczelni rzeczywiście oferuje taki model i jak mocno wpływa on na budowę listy aplikacji.",
      "Dlatego najważniejsze jest nie marzenie o aidzie w oderwaniu od rzeczywistości, lecz zrozumienie mechanizmu: które uczelnie wspierają international students, na jakich zasadach i jak to wpływa na szanse przyjęcia.",
    ],
    sections: [
      {
        title: "Najważniejsze pojęcia",
        bullets: [
          "need-based aid — wsparcie zależne od sytuacji finansowej rodziny,",
          "merit scholarship — wsparcie oparte na profilu lub osiągnięciach,",
          "need-blind — uczelnia deklaruje, że potrzeba finansowa nie wpływa na decyzję o przyjęciu,",
          "need-aware — potrzeba finansowa może mieć znaczenie w rekrutacji.",
        ],
      },
      {
        title: "Dlaczego lista uczelni musi być budowana inaczej",
        paragraphs: [
          "Kandydat potrzebujący znaczącej pomocy finansowej nie może tworzyć listy tak samo jak osoba finansująca studia bez wsparcia. Niektóre uczelnie są bardzo selektywne, ale realnie wspierają kandydatów. Inne są mniej selektywne, ale nie finansują studentów zagranicznych na poziomie, który rozwiązuje problem budżetu.",
        ],
      },
      {
        title: "Jakie formularze i dokumenty się pojawiają",
        bullets: [
          "CSS Profile lub uczelniane formularze finansowe,",
          "zaświadczenia o dochodach i majątku rodziny,",
          "informacje o walucie, zobowiązaniach i kosztach utrzymania,",
          "czasem dodatkowe wyjaśnienia dotyczące sytuacji rodzinnej.",
        ],
      },
      {
        title: "Najczęstsze nieporozumienia",
        bullets: [
          "mylenie merit scholarship z pełnym pokryciem kosztów,",
          "zakładanie, że każda uczelnia z topu ma podobną politykę financial aid,",
          "brak strategii finansowej przy budowie listy uczelni,",
          "niedoszacowanie tego, jak złożone są dokumenty finansowe.",
        ],
      },
      {
        title: "Jak podejść do tego realistycznie",
        paragraphs: [
          "Najlepiej myśleć o financial aid jak o osobnej warstwie strategii aplikacyjnej. Uczeń potrzebujący wsparcia powinien od początku wybierać uczelnie, przy których zarówno przyjęcie, jak i sfinansowanie studiów są realną możliwością.",
        ],
      },
    ],
    related: [
      { title: "Studia w USA — aplikacja, eseje, SAT i financial aid", slug: "/studia-w-usa" },
      { title: "Common App: jak działa aplikacja na studia w USA?", slug: "/common-app" },
    ],
  }),
  seedArticle({
    order: 30,
    category: "Finansowanie",
    categorySlugs: ["stypendia"],
    title: "Stypendia Acadea — kto może otrzymać wsparcie aplikacyjne?",
    slug: "/stypendia-acadea",
    updatedAt,
    excerpt:
      "Wybitny potencjał nie powinien zatrzymywać się na barierze finansowej. Wyjaśniamy, komu i w jakiej formule Acadea oferuje wsparcie aplikacyjne.",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80",
    intro: [
      "Program stypendialny Acadea powstał z bardzo prostego założenia: ambitny kandydat nie powinien rezygnować z mocnej aplikacji tylko dlatego, że profesjonalne wsparcie jest poza jego zasięgiem finansowym. Dla wielu rodzin nie problemem jest brak motywacji, lecz to, że koszt procesu staje się dodatkową barierą.",
      "Dlatego nasze stypendia nie są „nagrodą pocieszenia”, ale narzędziem, które ma otworzyć drogę tym osobom, które naprawdę chcą działać i mają ku temu potencjał.",
    ],
    sections: [
      {
        title: "Na czym polega wsparcie",
        paragraphs: [
          "W praktyce chodzi o pomoc aplikacyjną: uporządkowanie strategii, wybór uczelni, wsparcie w dokumentach i przeprowadzenie przez proces w sposób bardziej świadomy. Nie jest to jednorazowy benefit, ale realne odciążenie w bardzo wymagającym etapie życia.",
        ],
      },
      {
        title: "Dla kogo to program",
        bullets: [
          "dla osób ambitnych i zmotywowanych,",
          "dla kandydatów z potencjałem, który warto przekuć w konkretny plan,",
          "dla uczniów, którzy potrzebują wsparcia finansowego, by skorzystać z profesjonalnego doradztwa,",
          "dla osób gotowych zaangażować się w proces, a nie tylko „wysłać formularz i czekać”.",
        ],
      },
      {
        title: "Co liczy się w ocenie zgłoszenia",
        bullets: [
          "wyniki i osiągnięcia,",
          "motywacja i spójność celów,",
          "to, co kandydat robi poza szkołą,",
          "realna gotowość do pracy nad własną ścieżką.",
        ],
      },
      {
        title: "Dlaczego ten program istnieje",
        paragraphs: [
          "Najlepsze aplikacje rzadko powstają przypadkiem. Potrzebują czasu, strategii i informacji zwrotnej. Chcemy, aby dostęp do takiego wsparcia nie zależał wyłącznie od budżetu rodziny, ale także od potencjału i gotowości do działania.",
        ],
      },
      {
        title: "Jak podejść do aplikowania o stypendium",
        paragraphs: [
          "Najlepiej potraktować to jak poważny proces wyboru, a nie szybki formularz. Im bardziej konkretnie kandydat pokaże swoje cele, osiągnięcia i motywację, tym łatwiej ocenić, czy program rzeczywiście będzie dla niego dobrym wsparciem.",
        ],
      },
    ],
    related: [
      { title: "Jak zdobyć stypendium na studia za granicą?", slug: "/stypendia-na-studia-za-granica" },
      { title: "Program Stypendialny Acadea", slug: "/stypendium" },
    ],
  }),
  seedArticle({
    order: 31,
    category: "Poradniki",
    categorySlugs: ["common-app", "usa"],
    title: "Common App: jak działa aplikacja na studia w USA?",
    slug: "/common-app",
    updatedAt,
    excerpt:
      "Common App ułatwia techniczną stronę aplikacji, ale nie zastępuje strategii. Sprawdź, co naprawdę trzeba tam przygotować.",
    image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1200&q=80",
    intro: [
      "Common App jest narzędziem, które porządkuje techniczną stronę aplikacji do wielu uczelni w USA, ale nie rozwiązuje za Ciebie najtrudniejszych pytań. Sam formularz nie powie, jak zbudować listę uczelni, co napisać w eseju i jak przedstawić aktywności tak, by tworzyły spójny profil kandydata.",
      "To właśnie dlatego część uczniów czuje ulgę po założeniu konta, a potem szybko odkrywa, że najważniejsza praca dopiero się zaczyna.",
    ],
    sections: [
      {
        title: "Co obejmuje Common App",
        bullets: [
          "dane osobowe i edukacyjne,",
          "listę aktywności i osiągnięć,",
          "główny esej personalny,",
          "rekomendacje i informacje od szkoły,",
          "część uczelnianych pytań dodatkowych.",
        ],
      },
      {
        title: "Co Common App nie robi za kandydata",
        bullets: [
          "nie wybiera uczelni,",
          "nie buduje strategii finansowej,",
          "nie podpowiada, które aktywności są naprawdę najmocniejsze,",
          "nie napisze suplementów ani nie nada sensu Twojej historii.",
        ],
      },
      {
        title: "Dlaczego lista aktywności jest tak ważna",
        paragraphs: [
          "To jedno z miejsc, w którym kandydaci najczęściej tracą potencjał aplikacji. Krótkie opisy muszą być konkretne, a kolejność aktywności powinna wynikać z ich znaczenia dla całej historii, a nie z chronologii czy przyzwyczajenia.",
        ],
      },
      {
        title: "Esej główny a suplementy",
        paragraphs: [
          "Esej główny pokazuje osobowość i sposób myślenia. Suplementy często pytają o dopasowanie do uczelni, zainteresowania akademickie lub konkretne decyzje. Te teksty powinny się uzupełniać, a nie powtarzać.",
        ],
      },
      {
        title: "Najczęstsze błędy",
        bullets: [
          "traktowanie Common App jako wyłącznie technicznego formularza,",
          "niespójna prezentacja aktywności,",
          "powtarzanie tych samych treści w eseju i suplementach,",
          "zbyt późne rozpoczęcie pracy nad całością.",
        ],
      },
    ],
    related: [
      { title: "Esej na studia w USA", slug: "/esej-na-studia-w-usa" },
      { title: "Studia w USA — aplikacja, eseje, SAT i financial aid", slug: "/studia-w-usa" },
    ],
  }),
  seedArticle({
    order: 32,
    category: "Poradniki",
    categorySlugs: ["eseje-i-listy", "usa"],
    title: "Esej na studia w USA: czym różni się od personal statement?",
    slug: "/esej-na-studia-w-usa",
    updatedAt,
    excerpt:
      "Esej do USA nie powinien być wersją brytyjskiego personal statement. Zobacz, jak pokazać osobowość, refleksję i sposób myślenia.",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80",
    intro: [
      "Esej aplikacyjny do USA ma zupełnie inną funkcję niż personal statement do Wielkiej Brytanii. Nie chodzi w nim wyłącznie o pokazanie zainteresowania kierunkiem, ale o uchwycenie tego, kim kandydat jest, jak myśli, co go kształtuje i w jaki sposób podejmuje decyzje.",
      "To właśnie dlatego najlepsze amerykańskie eseje rzadko przypominają CV w formie prozy. Zamiast tego budują jedną wyraźną obserwację, scenę albo refleksję, która zostaje z czytelnikiem na dłużej.",
    ],
    sections: [
      {
        title: "Po co uczelnie w USA pytają o esej",
        paragraphs: [
          "Esej pomaga zrozumieć człowieka, a nie tylko profil akademicki. Komisja chce zobaczyć sposób myślenia, samoświadomość, dojrzałość i umiejętność wyciągania wniosków z doświadczeń.",
        ],
      },
      {
        title: "Czym ten tekst różni się od personal statement",
        bullets: [
          "jest zwykle bardziej osobisty,",
          "nie musi być bezpośrednio kierunkowy,",
          "może budować narrację wokół jednej sceny albo motywu,",
          "mocniej liczy się głos autora i jakość refleksji niż lista osiągnięć.",
        ],
      },
      {
        title: "Skąd brać dobry temat",
        paragraphs: [
          "Najlepszy temat nie musi być spektakularny. Ważniejsze jest to, czy pozwala pokazać coś prawdziwego o kandydacie: sposób reagowania, uczenia się, zmiany perspektywy albo budowania relacji z innymi.",
        ],
      },
      {
        title: "Czego unikać",
        bullets: [
          "pisania tekstu, który brzmi jak motywacyjny list do pracy,",
          "upchnięcia zbyt wielu wątków naraz,",
          "opowiadania historii bez żadnej refleksji,",
          "budowania całej narracji wyłącznie wokół prestiżu i sukcesów.",
        ],
      },
      {
        title: "Jak pracować nad draftami",
        paragraphs: [
          "W eseju do USA najwięcej daje praca nad kolejnymi wersjami: skracanie, pogłębianie obserwacji i sprawdzanie, czy tekst naprawdę brzmi jak osoba, która go podpisała. To nie jest dokument, który zazwyczaj powstaje w jednej wersji.",
        ],
      },
    ],
    related: [
      { title: "Common App: jak działa aplikacja na studia w USA?", slug: "/common-app" },
      { title: "List motywacyjny a personal statement", slug: "/list-motywacyjny-a-personal-statement" },
    ],
  }),
  seedArticle({
    order: 33,
    category: "Poradniki",
    categorySlugs: ["egzaminy", "usa"],
    title: "Czy warto zdawać SAT albo ACT?",
    slug: "/sat-act",
    updatedAt,
    excerpt:
      "Test-optional nie zawsze oznacza, że wynik nie ma znaczenia. Sprawdź, kiedy SAT lub ACT mogą realnie pomóc aplikacji.",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80",
    intro: [
      "Wokół SAT i ACT narosło wiele uproszczeń. Część kandydatów zakłada, że skoro sporo uczelni jest dziś test-optional, to nie ma już żadnego sensu przygotowywać się do egzaminu. Inni idą w drugą skrajność i uznają test za absolutnie obowiązkowy niezależnie od uczelni i profilu.",
      "W praktyce odpowiedź zależy od listy szkół, poziomu wyniku próbnego oraz tego, jaką rolę wynik testu może odegrać w całej aplikacji.",
    ],
    sections: [
      {
        title: "Co naprawdę oznacza test-optional",
        paragraphs: [
          "Test-optional zwykle znaczy, że kandydat może złożyć aplikację bez wyniku i nie zostanie z tego powodu automatycznie odrzucony. Nie oznacza jednak, że mocny wynik nigdy nie pomoże albo że wszystkie uczelnie interpretują tę politykę identycznie.",
        ],
      },
      {
        title: "Kiedy wynik może być przydatny",
        bullets: [
          "gdy kandydat ma bardzo mocny rezultat i chce nim wzmocnić aplikację,",
          "gdy szkoła lub system edukacyjny są słabiej znane uczelniom amerykańskim,",
          "gdy wynik pomaga potwierdzić potencjał ilościowy na kierunkach ścisłych,",
          "gdy lista uczelni obejmuje miejsca, które nadal realnie patrzą na testy.",
        ],
      },
      {
        title: "Kiedy lepiej odpuścić albo nie wysyłać wyniku",
        bullets: [
          "gdy przygotowanie do testu odciąga uwagę od ważniejszych elementów aplikacji,",
          "gdy wynik jest wyraźnie słabszy niż profil kandydata i nie wnosi wartości,",
          "gdy uczelnia faktycznie mocno odchodzi od wykorzystania testów w procesie.",
        ],
      },
      {
        title: "Jak podjąć decyzję",
        paragraphs: [
          "Najrozsądniej zacząć od próbnego wyniku i porównania go z profilem uczelni na liście. Dopiero wtedy widać, czy inwestycja czasu w SAT albo ACT ma sens, czy lepiej skierować energię w eseje, aktywności albo scholarship strategy.",
        ],
      },
      {
        title: "Najczęstsze błędy",
        bullets: [
          "decyzja o zdawaniu testu bez zrozumienia listy uczelni,",
          "rezygnacja z testu wyłącznie dlatego, że ktoś inny też zrezygnował,",
          "wysyłanie wyniku, który nie wzmacnia aplikacji,",
          "poświęcanie zbyt dużo czasu testowi kosztem ważniejszych elementów profilu.",
        ],
      },
    ],
    related: [
      { title: "Studia w USA — aplikacja, eseje, SAT i financial aid", slug: "/studia-w-usa" },
      { title: "Common App: jak działa aplikacja na studia w USA?", slug: "/common-app" },
    ],
  }),
  seedArticle({
    order: 34,
    category: "Poradniki",
    categorySlugs: ["dla-rodzicow"],
    title: "Studia za granicą: poradnik dla rodziców",
    slug: "/studia-za-granica-poradnik-dla-rodzicow",
    updatedAt,
    excerpt:
      "Wyjazd na studia to decyzja całej rodziny. Sprawdź, jak rodzic może podejść do tematu spokojnie, odpowiedzialnie i bez chaosu.",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=80",
    intro: [
      "Dla rodziców studia za granicą dziecka są jednocześnie źródłem dumy, ekscytacji i dużej niepewności. To naturalne: decyzja dotyczy nie tylko uczelni, ale także bezpieczeństwa, budżetu, samodzielności dziecka i jakości życia przez kolejne lata.",
      "Najbardziej pomaga wtedy nie presja na szybką odpowiedź, lecz uporządkowany proces. Im lepiej rodzina rozumie system aplikacji, koszty i możliwe scenariusze, tym spokojniej podejmuje decyzje.",
    ],
    sections: [
      {
        title: "Jak patrzeć na wybór uczelni",
        paragraphs: [
          "Warto patrzeć nie tylko na prestiż, ale też na kierunek, dopasowanie programu, bezpieczeństwo finansowe i styl nauki. Dla rodzica najważniejsze pytanie brzmi zwykle: czy ta opcja jest dobra nie tylko „na papierze”, ale też w codziennym życiu mojego dziecka?",
        ],
      },
      {
        title: "Jak rozmawiać o finansach",
        bullets: [
          "oddziel marzenia od realistycznego budżetu,",
          "policz czesne, mieszkanie i pierwszy rok całościowo,",
          "sprawdź scholarship strategy zanim lista uczelni się zamknie,",
          "ustal, które scenariusze są bezpieczne dla rodziny.",
        ],
      },
      {
        title: "Jak wspierać bez przejmowania sterów",
        paragraphs: [
          "Najlepsze wsparcie rodzica polega zwykle na zadawaniu dobrych pytań, pilnowaniu ram procesu i pomaganiu w organizacji, ale bez odbierania dziecku sprawczości. To ono będzie żyło z konsekwencjami decyzji i powinno rozumieć, dlaczego wybiera właśnie tę ścieżkę.",
        ],
      },
      {
        title: "Najczęstsze obawy rodziców",
        bullets: [
          "czy dziecko poradzi sobie akademicko i emocjonalnie,",
          "czy koszty nie okażą się zbyt wysokie,",
          "czy dyplom będzie miał sens zawodowy,",
          "czy wyjazd nie jest za wczesny albo za ryzykowny.",
        ],
      },
      {
        title: "Kiedy warto skonsultować plan",
        paragraphs: [
          "Jeśli rodzina porównuje kilka krajów, selektywny kierunek albo kosztowną ścieżkę, zewnętrzne wsparcie często pomaga uporządkować decyzję i zmniejszyć niepotrzebny stres. Czasem jedna dobra konsultacja oszczędza miesiące chaosu.",
        ],
      },
    ],
    related: [
      { title: "Jak rodzic może pomóc w aplikacji?", slug: "/jak-rodzic-moze-pomoc-w-aplikacji" },
      { title: "Czy studia za granicą są dla mnie?", slug: "/czy-studia-za-granica-sa-dla-mnie" },
    ],
  }),
  seedArticle({
    order: 35,
    category: "Poradniki",
    categorySlugs: ["dla-rodzicow"],
    title: "Jak rodzic może pomóc w aplikacji, nie pisząc jej za dziecko?",
    slug: "/jak-rodzic-moze-pomoc-w-aplikacji",
    updatedAt,
    excerpt:
      "Wsparcie rodzica jest ważne, ale nie powinno odbierać kandydatowi samodzielności. Zobacz, jak pomagać mądrze.",
    image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200&q=80",
    intro: [
      "W aplikacji na studia za granicą rodzic może być ogromnym wsparciem, ale bardzo łatwo przekroczyć granicę między pomocą a przejęciem procesu. Aplikacja napisana za dziecko bywa technicznie poprawna, ale często traci autentyczność, która jest tak ważna zwłaszcza w tekstach i rozmowach.",
      "Najbardziej skuteczny rodzic nie robi wszystkiego za ucznia. Raczej pomaga utrzymać strukturę, porządek i zdrowy dystans do decyzji.",
    ],
    sections: [
      {
        title: "W czym rodzic może realnie pomóc",
        bullets: [
          "pilnować kalendarza i większych etapów procesu,",
          "wspólnie liczyć budżet i scenariusze finansowe,",
          "pomóc zebrać dokumenty i zorganizować logistykę,",
          "zadawać pytania, które pomagają dziecku lepiej przemyśleć wybory.",
        ],
      },
      {
        title: "Czego lepiej nie robić",
        bullets: [
          "nie pisać tekstów aplikacyjnych za dziecko,",
          "nie wybierać uczelni tylko przez pryzmat własnych ambicji,",
          "nie traktować konsultacji jak przesłuchania po każdej zmianie planu,",
          "nie zakładać, że więcej kontroli zawsze oznacza większe bezpieczeństwo.",
        ],
      },
      {
        title: "Dlaczego autentyczność jest ważna",
        paragraphs: [
          "Eseje, listy motywacyjne i rozmowy najlepiej wypadają wtedy, gdy naprawdę należą do kandydata. Nawet jeśli rodzic ma większe doświadczenie w pisaniu czy planowaniu, rolą dorosłego jest raczej pomóc dziecku znaleźć własny głos niż go zastąpić.",
        ],
      },
      {
        title: "Jak prowadzić dobrą rozmowę o wyborach",
        paragraphs: [
          "Zamiast pytać wyłącznie „czy to na pewno najlepsza uczelnia?”, lepiej pytać: dlaczego ten program do Ciebie pasuje, czego się tam nauczysz, jak wygląda budżet i co zrobimy, jeśli plan A nie zadziała. Takie pytania budują odpowiedzialność, a nie tylko presję.",
        ],
      },
      {
        title: "Kiedy wsparcie zewnętrzne szczególnie pomaga",
        paragraphs: [
          "Jeśli napięcie w rodzinie rośnie, lista krajów się rozjeżdża albo kandydat czuje się przytłoczony, zewnętrzna konsultacja może być bardzo dobrym ruchem. Pozwala rozdzielić emocje od strategii i uporządkować decyzje w bardziej neutralny sposób.",
        ],
      },
    ],
    related: [
      { title: "Studia za granicą: poradnik dla rodziców", slug: "/studia-za-granica-poradnik-dla-rodzicow" },
      { title: "Czy warto korzystać z mentora?", slug: "/mentor-aplikacyjny-studia-za-granica" },
    ],
  }),
  subjectArticle({
    order: 36,
    category: "Kierunki",
    categorySlugs: ["ekonomia"],
    title: "Jak aplikować na ekonomię za granicą?",
    slug: "/jak-aplikowac-na-ekonomie-za-granica",
    updatedAt,
    excerpt:
      "Ekonomia za granicą może być bardzo matematyczna albo bardziej interdyscyplinarna. Sprawdź, jak ocenić wymagania i dobrać właściwy system.",
    image: "https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=1200&q=80",
    intro: [
      "Ekonomia jest jednym z tych kierunków, które brzmią znajomo niemal wszędzie, ale w praktyce potrafią bardzo różnić się między uczelniami. Na jednej będzie to program mocno ilościowy i matematyczny, na innej bardziej społeczny, polityczny albo biznesowy. Dlatego aplikacja na ekonomię za granicą powinna zaczynać się od zrozumienia, jakiego typu ekonomii kandydat szuka.",
      "Dla uczniów z Polski to szczególnie ważne, bo wymagania formalne często mocno premiują matematykę i analityczny profil. Nawet świetny kandydat może zbudować złą listę uczelni, jeśli nie rozumie tej różnicy.",
    ],
    subjectIntro: [
      "Na początku warto rozdzielić ekonomię od business studies, managementu czy finance. Te obszary są ze sobą powiązane, ale uczelnie traktują je inaczej, a programy bywają zaprojektowane pod zupełnie inne cele akademickie i zawodowe.",
    ],
    requirements: [
      "mocna matematyka jest na wielu programach jednym z najważniejszych elementów profilu,",
      "przydają się umiejętności analityczne, logiczne myślenie i czytanie argumentacji,",
      "na bardziej selektywnych uczelniach ważne bywają także konkursy, kursy lub projekty pokazujące zainteresowanie tematem.",
    ],
    profileParagraphs: [
      "Dobry profil na ekonomię nie musi oznaczać wyłącznie olimpiad. Równie ważne mogą być własne analizy, czytanie książek i raportów, debaty, projekty badawcze, udział w konkursach lub łączenie ekonomii z polityką, biznesem czy data analysis.",
    ],
    countries: [
      "Wielka Brytania dla bardzo mocnych, kierunkowych programów i selektywnej rekrutacji.",
      "Holandia dla szerokiej oferty po angielsku i praktycznego środowiska akademickiego.",
      "USA dla osób szukających elastyczności i możliwości łączenia ekonomii z innymi dziedzinami.",
      "Włochy, Hiszpania i Belgia jako ciekawe opcje na wybranych uczelniach ekonomicznych i biznesowych.",
    ],
    mistakes: [
      "mylenie ekonomii z zarządzaniem lub biznesem bez czytania programu,",
      "ignorowanie wymagań z matematyki,",
      "wybieranie uczelni wyłącznie po rankingu ogólnym,",
      "brak sprawdzenia, czy kandydat bardziej pasuje do economics, PPE, finance czy business economics.",
    ],
    strategyParagraphs: [
      "Najlepiej budować listę uczelni na podstawie dwóch osi jednocześnie: poziomu matematyczności programu i stylu nauki. Dzięki temu kandydat szybciej widzi, czy powinien iść w stronę LSE i Warwick, czy raczej szukać programu bardziej interdyscyplinarnego lub biznesowego.",
    ],
    related: [
      { title: "Jak wybrać kierunek studiów za granicą?", slug: "/jak-wybrac-kierunek-studiow-za-granica" },
      { title: "Studia w UK po Brexicie", slug: "/studia-w-uk-po-brexicie" },
    ],
  }),
  subjectArticle({
    order: 37,
    category: "Kierunki",
    categorySlugs: ["prawo"],
    title: "Jak aplikować na prawo za granicą?",
    slug: "/jak-aplikowac-na-prawo-za-granica",
    updatedAt,
    excerpt:
      "Prawo za granicą wymaga zrozumienia systemu prawnego, języka i dalszej ścieżki zawodowej. Zobacz, na co uważać przy wyborze programu.",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80",
    intro: [
      "Prawo to jeden z najbardziej zdradliwych kierunków przy planowaniu studiów za granicą, bo jego atrakcyjna nazwa może ukrywać bardzo różne konsekwencje zawodowe. Inaczej wygląda ścieżka do brytyjskiego LLB, inaczej do prawa kontynentalnego, a jeszcze inaczej do programu z elementami global law, politics albo business law.",
      "Dlatego aplikacja na prawo za granicą powinna zaczynać się nie od pytania „gdzie jest najlepsza uczelnia?”, ale od pytania: w jakim systemie prawnym chcę działać i co ten dyplom realnie otwiera po studiach.",
    ],
    subjectIntro: [
      "Na prawie ogromne znaczenie ma język, argumentacja, czytanie trudnych tekstów i zrozumienie, czy kandydat wybiera ścieżkę stricte zawodową, bardziej akademicką czy międzynarodową.",
    ],
    requirements: [
      "mocne pisanie i argumentacja,",
      "umiejętność pracy z tekstem i analizą,",
      "dobry angielski, a w części krajów także gotowość do funkcjonowania w lokalnym języku prawa,",
      "świadomość, jak dyplom przekłada się na późniejszą praktykę zawodową.",
    ],
    profileParagraphs: [
      "Profil kandydata na prawo może wzmacniać udział w debatach, MUN-ach, aktywności obywatelskiej, projektach społecznych, czytaniu literatury prawniczej lub politycznej i doświadczeniach pokazujących dojrzałość argumentacyjną.",
    ],
    countries: [
      "Wielka Brytania dla kandydatów zainteresowanych common law i bardzo mocnym, kierunkowym LLB.",
      "Holandia, Belgia lub Włochy dla wybranych programów z prawa międzynarodowego, europejskiego albo law & society.",
      "USA raczej jako dalszy etap niż prosty odpowiednik europejskiego licencjatu z prawa.",
    ],
    mistakes: [
      "wybór prawa bez refleksji, gdzie kandydat chce później pracować,",
      "ignorowanie roli języka lokalnego w ścieżce zawodowej,",
      "mylenie law z business law albo politics bez czytania programu,",
      "zakładanie, że każdy dyplom prawniczy daje podobne możliwości.",
    ],
    strategyParagraphs: [
      "Najlepsza strategia zaczyna się od celu zawodowego: czy kandydat chce zostać prawnikiem praktykiem w konkretnym systemie, czy bardziej interesuje go prawo międzynarodowe, polityka, compliance, biznes albo ścieżka akademicka. Dopiero potem wybiera się kraj i uczelnię.",
    ],
    related: [
      { title: "Studia w UK po Brexicie", slug: "/studia-w-uk-po-brexicie" },
      { title: "Jak wybrać kraj na studia za granicą?", slug: "/jak-wybrac-kraj-na-studia-za-granica" },
    ],
  }),
  subjectArticle({
    order: 38,
    category: "Kierunki",
    categorySlugs: ["psychologia"],
    title: "Jak aplikować na psychologię za granicą?",
    slug: "/jak-aplikowac-na-psychologie-za-granica",
    updatedAt,
    excerpt:
      "Psychologia za granicą może być badawcza, kliniczna albo społeczna. Sprawdź, jak czytać programy i unikać mylenia nazwy z rzeczywistym profilem studiów.",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&q=80",
    intro: [
      "Psychologia jest jednym z najpopularniejszych kierunków w aplikacji zagranicznej, ale również jednym z tych, które kandydaci najczęściej wybierają zbyt ogólnie. Sama nazwa programu nie mówi jeszcze, czy uczelnia stawia na badania, statystykę, neuroscience, ścieżkę kliniczną czy bardziej społeczne rozumienie człowieka.",
      "Dlatego dobra aplikacja na psychologię za granicą zaczyna się od bardzo uważnego czytania programu i uczciwej odpowiedzi na pytanie, jaki typ psychologii naprawdę Cię interesuje.",
    ],
    subjectIntro: [
      "Psychologia potrafi być znacznie bardziej ilościowa, niż wielu kandydatów się spodziewa. Statystyka, metodologia badań i analiza danych bywają w centrum programu już od pierwszych semestrów.",
    ],
    requirements: [
      "dobry angielski i umiejętność pracy z tekstem,",
      "otwartość na metodologię badań i statystykę,",
      "dojrzałość w mówieniu o ludziach i zjawiskach społecznych,",
      "świadomość, że ścieżka do pracy klinicznej zależy od kraju i dalszego kształcenia.",
    ],
    profileParagraphs: [
      "Mocny profil może obejmować książki popularnonaukowe i akademickie, kursy z psychologii lub neuronauki, wolontariat, projekty społeczne, debaty albo zainteresowanie badaniami nad zachowaniem człowieka.",
    ],
    countries: [
      "Holandia dla szerokiej oferty psychologii po angielsku i bardzo dużej popularności kierunku.",
      "Wielka Brytania dla mocnych programów badawczych i szerokiego wyboru specjalizacji.",
      "Irlandia, Belgia i część krajów nordyckich dla wybranych programów po angielsku.",
    ],
    mistakes: [
      "wybieranie programu bez sprawdzenia, ile ma statystyki i metodologii,",
      "zakładanie, że sam bachelor daje od razu prostą drogę do praktyki klinicznej,",
      "mylenie zainteresowania pomaganiem ludziom z gotowością do studiowania psychologii jako nauki.",
    ],
    strategyParagraphs: [
      "W psychologii bardzo ważne jest rozróżnienie między celem akademickim a zawodowym. Kandydat, który już teraz wie, że myśli o pracy klinicznej, powinien znacznie uważniej patrzeć na regulacje zawodu i kolejne etapy edukacji niż osoba zainteresowana badaniami lub ścieżką w HR, marketingu czy user research.",
    ],
    related: [
      { title: "Jak wybrać kierunek studiów za granicą?", slug: "/jak-wybrac-kierunek-studiow-za-granica" },
      { title: "Studia w Holandii — przewodnik dla polskich maturzystów", slug: "/studia-w-holandii-po-angielsku" },
    ],
  }),
  subjectArticle({
    order: 39,
    category: "Kierunki",
    categorySlugs: ["medycyna"],
    title: "Jak aplikować na medycynę za granicą?",
    slug: "/jak-aplikowac-na-medycyne-za-granica",
    updatedAt,
    excerpt:
      "Sprawdź, jak aplikować na medycynę za granicą: wymagania, egzaminy, kraje, koszty, terminy i wybór uczelni medycznych w Europie oraz krajach anglosaskich.",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80",
    intro: [
      "Medycyna od lat należy do najbardziej konkurencyjnych kierunków, dlatego coraz więcej kandydatów z Polski rozważa studia lekarskie za granicą. Dla jednych będzie to medycyna po angielsku w Europie Środkowej lub Południowej, dla innych aplikacja do Wielkiej Brytanii, Irlandii albo planowanie dłuższej ścieżki w USA czy Kanadzie.",
      "Najważniejsze jest to, że medycyna za granicą wymaga bardzo dobrego planu. Nie wystarczy znaleźć uczelnię z kierunkiem „Medicine”. Trzeba sprawdzić język studiów, egzaminy, koszty, uznawalność dyplomu, praktyki kliniczne i to, gdzie kandydat chce później pracować.",
      "Właśnie dlatego warto podejść do tego strategicznie: porównać kraje, wybrać realistyczne opcje i zrozumieć, które systemy naprawdę pasują do Twojego profilu, budżetu i celu zawodowego.",
    ],
    subjectIntro: [
      "Na medycynie nie ma jednego uniwersalnego modelu aplikacji. W jednych krajach kluczowe będą egzaminy wstępne z biologii i chemii, w innych testy typu UCAT lub HPAT, a jeszcze w innych decydujące znaczenie będzie miało połączenie wyników, tekstów i rozmowy.",
    ],
    requirements: [
      "mocne wyniki z biologii i chemii, a czasem także matematyki lub fizyki,",
      "gotowość do dodatkowych testów lub egzaminów uczelnianych,",
      "bardzo dobry angielski, a nierzadko również otwartość na naukę języka lokalnego,",
      "dojrzała motywacja i umiejętność pokazania, skąd bierze się wybór medycyny.",
    ],
    profileParagraphs: [
      "W medycynie bardzo ważne jest doświadczenie pokazujące kontakt z ludźmi i rozumienie odpowiedzialności tego zawodu. Wolontariat, shadowing, aktywność społeczna czy projekty związane z naukami biomedycznymi mogą wzmacniać aplikację, ale liczy się nie tylko to, co kandydat zrobił, lecz także jak o tym myśli i co zrozumiał.",
    ],
    countries: [
      "Wielka Brytania i Irlandia dla kandydatów gotowych na testy typu UCAT/HPAT oraz bardzo selektywny proces.",
      "Włochy, Czechy, Słowacja czy Węgry dla osób szukających medycyny po angielsku w Europie i egzaminów uczelnianych lub krajowych.",
      "USA i Kanada dla kandydatów rozumiejących, że ścieżka do med school zwykle zaczyna się od wcześniejszych studiów undergraduate.",
    ],
    mistakes: [
      "szukanie „najłatwiejszej medycyny za granicą” bez patrzenia na jakość i uznawalność dyplomu,",
      "ignorowanie języka kontaktu klinicznego,",
      "niedoszacowanie kosztów kilkuletnich studiów,",
      "brak planu egzaminów i terminów w systemach o bardzo różnych zasadach.",
    ],
    strategyParagraphs: [
      "Najlepsza strategia medyczna zwykle opiera się na 2–3 systemach, które kandydat jest w stanie dobrze przygotować, a nie na przypadkowej liście wielu krajów. Dzięki temu można sensownie zaplanować egzaminy, dokumenty, budżet i czas pracy nad aplikacją.",
    ],
    related: [
      { title: "Studia we Włoszech po angielsku", slug: "/studia-we-wloszech-po-angielsku" },
      { title: "Jak dostać się na studia za granicą?", slug: "/jak-dostac-sie-na-studia-za-granica" },
    ],
  }),
  subjectArticle({
    order: 40,
    category: "Kierunki",
    categorySlugs: ["informatyka"],
    title: "Jak aplikować na informatykę za granicą?",
    slug: "/jak-aplikowac-na-informatyke-za-granica",
    updatedAt,
    excerpt:
      "Sprawdź, gdzie i jak aplikować na informatykę za granicą — od wymagań z matematyki po wybór programu, kraju i specjalizacji.",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80",
    intro: [
      "Informatyka należy do najpopularniejszych kierunków wybieranych przez ambitnych uczniów planujących studia za granicą. To jednak bardzo szeroka dziedzina: Computer Science, Data Science, Artificial Intelligence, Software Engineering czy Information Systems potrafią oznaczać zupełnie różne programy, wymagania i ścieżki zawodowe.",
      "Dlatego dobra aplikacja na informatykę nie zaczyna się od jednego pytania „gdzie jest najlepszy ranking?”, ale od zrozumienia, jaki typ programu naprawdę pasuje do kandydata. To szczególnie ważne, bo wiele topowych kierunków jest mocno matematycznych i teoretycznych, a inne stawiają na projekty, software development albo połączenie IT z biznesem.",
      "Im wcześniej kandydat zobaczy te różnice, tym łatwiej zbuduje listę uczelni, która nie będzie przypadkowym zbiorem nazw, ale sensowną strategią aplikacyjną.",
    ],
    subjectIntro: [
      "Na informatyce szczególnie ważne jest rozróżnienie między nazwą programu a jego realnym profilem. Dwa kierunki opisane jako Computer Science mogą różnić się poziomem matematyki, teorii, software engineeringu, AI albo data science bardziej, niż kandydat intuicyjnie zakłada.",
    ],
    requirements: [
      "mocna matematyka i gotowość do pracy analitycznej,",
      "umiejętność logicznego myślenia i rozwiązywania problemów,",
      "dobry angielski oraz zdolność do pracy projektowej i technicznej,",
      "dodatkowe projekty, kursy, konkursy lub własne eksperymenty technologiczne wzmacniają aplikację.",
    ],
    profileParagraphs: [
      "Najmocniejsze profile informatyczne często łączą wyniki z matematyki z czymś namacalnym: projektami, aplikacjami, hackathonami, własnym kodem, eksperymentami z AI, data analysis albo realnym zainteresowaniem architekturą systemów. Nie trzeba mieć startupu, ale warto pokazać, że ciekawość technologiczna przekłada się na działanie.",
    ],
    countries: [
      "Wielka Brytania dla bardzo mocnych, kierunkowych programów i wyraźnie zdefiniowanych ścieżek Computer Science.",
      "USA dla kandydatów szukających elastyczności, researchu i możliwości łączenia informatyki z innymi dziedzinami.",
      "Holandia dla dobrej oferty po angielsku w Europie i technicznych uczelni takich jak TU Delft czy Twente.",
      "Niemcy, Dania, Szwecja, Szwajcaria i Kanada dla kandydatów technicznych porównujących koszt, styl nauki i rynek pracy.",
    ],
    mistakes: [
      "wybór programu wyłącznie po nazwie bez czytania syllabusu,",
      "ignorowanie roli matematyki w najbardziej selektywnych programach,",
      "mylenie informatyki z bardziej biznesowym IT lub information systems,",
      "brak sprawdzenia, czy kandydat woli program teoretyczny, praktyczny czy interdyscyplinarny.",
    ],
    strategyParagraphs: [
      "Najlepsza strategia na informatykę zwykle łączy dwa spojrzenia: poziom selektywności uczelni i charakter samego programu. Dzięki temu kandydat nie tylko zwiększa swoje szanse, ale też trafia na studia, które rzeczywiście odpowiadają jego mocnym stronom i przyszłym planom.",
    ],
    related: [
      { title: "Studia w Danii po angielsku — co warto wiedzieć?", slug: "/studia-w-danii-po-angielsku" },
      { title: "Studia w USA — aplikacja, eseje, SAT i financial aid", slug: "/studia-w-usa" },
    ],
  }),
];

export const articles: Article[] = rawArticles;

export function findArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug || article.slug === `/${slug}`);
}
