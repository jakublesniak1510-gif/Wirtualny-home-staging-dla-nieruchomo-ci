/*
 * Regulamin świadczenia usług – DOKUMENT WZORCOWY – DO WERYFIKACJI PRZEZ PRAWNIKA
 * przed uruchomieniem sprzedaży. Dane firmy pochodzą z SITE.company (src/lib/site.ts),
 * terminy z src/content/legal.ts i src/lib/pricing.ts. Po każdej zmianie treści
 * zaktualizuj TERMS_EFFECTIVE_DATE w src/content/legal.ts.
 */
import Link from "next/link";
import { LegalDocument } from "@/components/LegalDocument";
import type { LegalSectionDef } from "@/components/LegalDocument";
import {
  BILLING_RETENTION_YEARS,
  COMPLAINT_RESPONSE_DAYS,
  FILE_RETENTION_DAYS,
  LEGAL_LINKS,
  PROVIDER,
  TERMS_EFFECTIVE_DATE,
  WITHDRAWAL_DAYS,
} from "@/content/legal";
import { ACCEPTED_FORMATS_TEXT, MAX_UPLOAD_MB_TEXT, MIN_PHOTO_SHORT_SIDE_PX } from "@/content/service";
import { formatDatePL, formatPhotoCount } from "@/lib/format";
import {
  EXPRESS_RATE,
  FREE_SAMPLE_PHOTOS,
  INCLUDED_REVISIONS,
  MAX_PHOTOS,
  MIN_PHOTOS,
  OFFICE_PLAN,
  REFERRAL_REWARD_PHOTOS,
  REVISION_WINDOW_DAYS,
} from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { ROUTES, SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Regulamin",
  description: `Regulamin serwisu ${SITE.name}: zasady zamawiania wirtualnego home stagingu, płatności, terminy, poprawki, licencja, odstąpienie od umowy i reklamacje.`,
  path: ROUTES.terms,
});

const effectiveDate = formatDatePL(TERMS_EFFECTIVE_DATE);

/** Kolejność paragrafów – używana do odsyłaczy „§ n” w treści. Musi odpowiadać kolejności w SECTIONS. */
const SECTION_IDS = [
  "postanowienia-ogolne",
  "definicje",
  "usluga",
  "zamowienie",
  "ceny-platnosci",
  "realizacja",
  "poprawki",
  "uczciwa-wizualizacja",
  "prawa-autorskie",
  "dane-osobowe",
  "odstapienie",
  "reklamacje",
  "odpowiedzialnosc",
  "spory",
  "zmiany",
  "postanowienia-koncowe",
] as const;

/** Odsyłacz do paragrafu, np. par("reklamacje") → „§ 12”. */
function par(id: (typeof SECTION_IDS)[number]) {
  return `§\u00a0${SECTION_IDS.indexOf(id) + 1}`;
}

const SECTIONS: readonly LegalSectionDef[] = [
  {
    id: "postanowienia-ogolne",
    title: "Postanowienia ogólne",
    content: (
      <ol>
        <li>
          Regulamin określa zasady korzystania z serwisu internetowego {SITE.name} dostępnego pod adresem{" "}
          {PROVIDER.website} (dalej: „Serwis”) oraz zasady świadczenia usług wirtualnego home stagingu.
        </li>
        <li>
          Usługodawcą i sprzedawcą jest {PROVIDER.legalName}, adres: {PROVIDER.address}, NIP: {PROVIDER.nip}, adres
          e-mail: <a href={`mailto:${PROVIDER.email}`}>{PROVIDER.email}</a>, telefon: {PROVIDER.phone} (dalej:
          „Usługodawca”).
        </li>
        <li>
          Regulamin jest regulaminem, o którym mowa w art. 8 ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą
          elektroniczną. Przed złożeniem zamówienia Klient jest obowiązany zapoznać się z Regulaminem i go zaakceptować.
        </li>
        <li>
          Regulamin jest udostępniony nieodpłatnie w Serwisie w sposób umożliwiający jego pozyskanie, odtworzenie i
          utrwalenie (wydruk lub zapis do pliku). Treść Regulaminu w wersji obowiązującej w chwili złożenia zamówienia
          Usługodawca przesyła Klientowi wraz z potwierdzeniem zamówienia.
        </li>
        <li>Regulamin obowiązuje od dnia {effectiveDate} r.</li>
      </ol>
    ),
  },
  {
    id: "definicje",
    title: "Definicje",
    content: (
      <>
        <p>Użyte w Regulaminie pojęcia oznaczają:</p>
        <ol>
          <li>
            <strong>Klient</strong> – osoba fizyczna, osoba prawna lub jednostka organizacyjna nieposiadająca osobowości
            prawnej, której ustawa przyznaje zdolność prawną, składająca zamówienie w Serwisie.
          </li>
          <li>
            <strong>Konsument</strong> – Klient będący osobą fizyczną, zawierający umowę niezwiązaną bezpośrednio z
            jego działalnością gospodarczą lub zawodową (art. 22<sup>1</sup> Kodeksu cywilnego).
          </li>
          <li>
            <strong>Przedsiębiorca na prawach konsumenta</strong> – Klient będący osobą fizyczną, zawierający umowę
            bezpośrednio związaną z jego działalnością gospodarczą, gdy z treści umowy wynika, że nie posiada ona dla
            niego charakteru zawodowego, wynikającego w szczególności z przedmiotu wykonywanej działalności
            gospodarczej, udostępnionego na podstawie przepisów o Centralnej Ewidencji i Informacji o Działalności
            Gospodarczej.
          </li>
          <li>
            <strong>Zdjęcie Wejściowe</strong> – fotografia wnętrza przesłana przez Klienta w celu wykonania Usługi.
          </li>
          <li>
            <strong>Wizualizacja</strong> – plik graficzny będący wynikiem Usługi: Zdjęcie Wejściowe z cyfrowo dodanym
            wyposażeniem (meblami, dekoracjami) w wybranym stylu, a w razie zamówienia dodatków – także z cyfrowo
            usuniętymi przedmiotami, zmienionym wykończeniem lub oświetleniem.
          </li>
          <li>
            <strong>Usługa</strong> – usługa wirtualnego home stagingu polegająca na przygotowaniu Wizualizacji na
            podstawie Zdjęć Wejściowych, świadczona drogą elektroniczną.
          </li>
          <li>
            <strong>Zamówienie</strong> – oświadczenie woli Klienta złożone za pomocą formularza w Serwisie, zmierzające
            do zawarcia umowy o świadczenie Usługi.
          </li>
          <li>
            <strong>Kod Pakietu</strong> – przedpłacony kod uprawniający do wykorzystania określonej liczby kredytów; 1
            kredyt odpowiada jednemu zdjęciu w cenie bazowej (bez dodatków i ekspresu).
          </li>
          <li>
            <strong>Abonament</strong> – umowa zawierana indywidualnie z Klientem niebędącym Konsumentem, obejmująca
            stałą miesięczną liczbę Wizualizacji za stałą opłatą.
          </li>
          <li>
            <strong>Dzień roboczy</strong> – dzień od poniedziałku do piątku z wyjątkiem dni ustawowo wolnych od pracy.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "usluga",
    title: "Usługa i jej zakres",
    content: (
      <ol>
        <li>
          Usługodawca przygotowuje Wizualizacje w stylu wybranym przez Klienta. Dla każdego Zdjęcia Wejściowego
          Usługodawca generuje kilka wariantów aranżacji z wykorzystaniem narzędzi opartych na sztucznej inteligencji,
          wybiera najlepszy i poddaje go ręcznej korekcie.
        </li>
        <li>
          W ramach dodatkowo płatnych opcji Usługodawca może: usunąć z obrazu istniejące meble i przedmioty, zmienić
          wykończenie ścian i podłóg („wirtualny remont”), zmienić porę dnia lub oświetlenie zdjęcia („noc → dzień”),
          wykonać Usługę w trybie ekspresowym.
        </li>
        <li>
          Wizualizacja ma charakter poglądowy. Pokazuje możliwą aranżację wnętrza i nie stanowi zapewnienia co do
          stanu, wyposażenia ani wykończenia nieruchomości.
        </li>
        <li>
          Każda Wizualizacja jest automatycznie oznaczana widocznym, dyskretnym napisem „wizualizacja”. Oznaczenie jest
          integralną częścią Wizualizacji.
        </li>
        <li>
          Do korzystania z Serwisu potrzebne są: urządzenie z dostępem do internetu, aktualna przeglądarka internetowa
          z włączoną obsługą JavaScript oraz aktywny adres e-mail. Zdjęcia Wejściowe muszą spełniać wymagania: format{" "}
          {ACCEPTED_FORMATS_TEXT}, rozmiar do {MAX_UPLOAD_MB_TEXT}&nbsp;MB na plik, krótszy bok co najmniej{" "}
          {MIN_PHOTO_SHORT_SIDE_PX}&nbsp;px.
        </li>
        <li>
          Zakazane jest dostarczanie przez Klienta treści o charakterze bezprawnym, w tym naruszających prawa osób
          trzecich, a także plików zawierających złośliwe oprogramowanie.
        </li>
      </ol>
    ),
  },
  {
    id: "zamowienie",
    title: "Zamówienie i zawarcie umowy",
    content: (
      <ol>
        <li>
          Zamówienie składa się za pomocą formularza dostępnego pod adresem{" "}
          <Link href={ROUTES.order}>{PROVIDER.website + ROUTES.order}</Link>. Jedno Zamówienie może obejmować od{" "}
          {formatPhotoCount(MIN_PHOTOS)} do {formatPhotoCount(MAX_PHOTOS)}. Rejestracja konta nie jest wymagana.
        </li>
        <li>
          Składając Zamówienie, Klient: wgrywa Zdjęcia Wejściowe, wybiera styl i ewentualne dodatki, podaje adres
          e-mail (oraz – jeśli chce otrzymać fakturę VAT – dane firmy i NIP), składa wymagane oświadczenia i akceptuje
          Regulamin oraz Politykę prywatności.
        </li>
        <li>
          Przed złożeniem Zamówienia Klient widzi łączną cenę Usługi. Złożenie Zamówienia następuje przez kliknięcie
          przycisku oznaczonego słowami wskazującymi na obowiązek zapłaty i przejście do płatności.
        </li>
        <li>
          Umowa o świadczenie Usługi zostaje zawarta z chwilą zaksięgowania płatności (albo – przy Zamówieniu w pełni
          opłaconym Kodem Pakietu lub darmowej próbce – z chwilą przyjęcia Zamówienia przez system). Usługodawca
          niezwłocznie potwierdza zawarcie umowy e-mailem, przesyłając link do strony statusu Zamówienia, treść
          złożonych oświadczeń i Regulamin.
        </li>
        <li>
          Usługodawca może jednorazowo przygotować bezpłatnie {formatPhotoCount(FREE_SAMPLE_PHOTOS)} dla nowego Klienta
          („darmowa próbka”) na zasadach opisanych w formularzu darmowej próbki. Do darmowej próbki stosuje się
          odpowiednio postanowienia Regulaminu, z wyłączeniem postanowień o płatności.
        </li>
      </ol>
    ),
  },
  {
    id: "ceny-platnosci",
    title: "Ceny i płatności",
    content: (
      <ol>
        <li>
          Ceny Usług podane są w cenniku pod adresem <Link href={ROUTES.pricing}>{PROVIDER.website + ROUTES.pricing}</Link>{" "}
          w złotych polskich i są cenami brutto (zawierają podatek VAT). Cena wiążąca Klienta to cena widoczna w
          podsumowaniu Zamówienia w chwili jego złożenia.
        </li>
        <li>
          Płatności obsługuje Stripe Payments Europe, Ltd. z siedzibą w Dublinie (Irlandia). Dostępne metody płatności:
          BLIK, karta płatnicza oraz Przelewy24. Usługodawca nie przetwarza ani nie przechowuje danych kart
          płatniczych.
        </li>
        <li>
          Dopłata za tryb ekspresowy wynosi {Math.round(EXPRESS_RATE * 100)}% ceny bazowej Zamówienia (bez dodatków).
        </li>
        <li>
          Kod Pakietu jest sprzedawany na podstawie odrębnego zamówienia złożonego e-mailem lub przez formularz „Dla
          biur” i opłacany przelewem na podstawie faktury. Kod można wykorzystać w wielu Zamówieniach do wyczerpania
          kredytów, w terminie ważności wskazanym przy jego wydaniu. Kredyty pokrywają cenę bazową zdjęć; dodatki i
          ekspres są płatne osobno. Kod nie podlega wymianie na gotówkę, co nie wyłącza uprawnień Konsumenta
          wynikających z przepisów prawa.
        </li>
        <li>
          Abonament jest dostępny wyłącznie dla Klientów niebędących Konsumentami. Obejmuje{" "}
          {formatPhotoCount(OFFICE_PLAN.photosPerMonth)} miesięcznie, dodatki bez dopłat oraz priorytetowy termin
          realizacji do {OFFICE_PLAN.priorityHours} godzin. Cena Abonamentu jest podawana w kwocie netto, a szczegółowe
          warunki (okres, termin płatności, rozliczanie niewykorzystanych zdjęć) określa indywidualna oferta lub umowa,
          która ma pierwszeństwo przed Regulaminem.
        </li>
        <li>
          Na życzenie Klienta Usługodawca wystawia fakturę VAT i przesyła ją w formie elektronicznej na adres e-mail
          Klienta, na co Klient wyraża zgodę.
        </li>
        <li>
          W programie poleceń Klient, którego kod polecenia zostanie użyty w pierwszym opłaconym Zamówieniu nowego
          Klienta, otrzymuje Kod Pakietu na {formatPhotoCount(REFERRAL_REWARD_PHOTOS)}. Nagroda jest przyznawana po
          weryfikacji przez Usługodawcę i nie podlega wymianie na gotówkę.
        </li>
      </ol>
    ),
  },
  {
    id: "realizacja",
    title: "Termin realizacji i dostarczenie",
    content: (
      <ol>
        <li>
          Usługodawca przygotowuje Wizualizacje w terminie do {SITE.turnaroundHours} godzin, a w trybie ekspresowym do{" "}
          {SITE.expressHours} godzin, liczonych od zawarcia umowy. Jeżeli umowa została zawarta w dniu niebędącym Dniem
          roboczym lub po godz. 17:00, termin biegnie od godz. 9:00 najbliższego Dnia roboczego.
        </li>
        <li>
          Wizualizacje są udostępniane do pobrania na stronie statusu Zamówienia, a Klient otrzymuje o tym informację
          e-mailem. Za chwilę dostarczenia uznaje się udostępnienie Wizualizacji do pobrania.
        </li>
        <li>
          Pliki (Zdjęcia Wejściowe i Wizualizacje) są przechowywane przez {FILE_RETENTION_DAYS} dni od realizacji
          Zamówienia, a następnie trwale usuwane. Klient powinien pobrać i zachować Wizualizacje w tym terminie.
        </li>
        <li>
          Jeżeli Zdjęcie Wejściowe nie nadaje się do wykonania Usługi (np. jest zbyt ciemne, nieostre lub nie pokazuje
          pomieszczenia), Usługodawca przed rozpoczęciem pracy poinformuje o tym Klienta e-mailem. Klient może
          przesłać inne zdjęcie albo zrezygnować z tej części Zamówienia – wówczas Usługodawca zwraca zapłaconą za nie
          cenę w terminie 14 dni.
        </li>
        <li>
          Jeżeli Usługodawca nie dostarczy Wizualizacji w terminie, Klient może wyznaczyć dodatkowy, odpowiedni termin,
          a po jego bezskutecznym upływie odstąpić od umowy w części niewykonanej i otrzymać zwrot ceny. Niezależnie od
          tego, przy przekroczeniu terminu w trybie ekspresowym Usługodawca zwraca dopłatę za ekspres.
        </li>
      </ol>
    ),
  },
  {
    id: "poprawki",
    title: "Poprawki",
    content: (
      <ol>
        <li>
          Cena każdej Wizualizacji obejmuje {INCLUDED_REVISIONS} bezpłatną poprawkę, zgłoszoną w ciągu{" "}
          {REVISION_WINDOW_DAYS} dni od dostarczenia, np. zmianę koloru lub rodzaju mebla, inne ustawienie, usunięcie
          lub dodanie elementu wyposażenia.
        </li>
        <li>
          Poprawkę zgłasza się e-mailem, w odpowiedzi na wiadomość z gotowymi Wizualizacjami, ze wskazaniem zdjęcia i
          oczekiwanej zmiany. Poprawkę Usługodawca wykonuje w terminie do {SITE.turnaroundHours} godzin w Dni robocze.
        </li>
        <li>
          Zmiana stylu całej aranżacji lub kolejne poprawki stanowią nowe Zamówienie. Poprawka nie może prowadzić do
          naruszenia zasad z {par("uczciwa-wizualizacja")}.
        </li>
        <li>Prawo do poprawki nie ogranicza uprawnień reklamacyjnych Klienta ({par("reklamacje")}).</li>
      </ol>
    ),
  },
  {
    id: "uczciwa-wizualizacja",
    title: "Zasady uczciwej wizualizacji",
    content: (
      <ol>
        <li>
          Usługodawca nie wykonuje i nie jest zobowiązany wykonać zmian, które mogłyby wprowadzać w błąd co do stanu
          lub cech nieruchomości, w szczególności:
          <ol>
            <li>ukrywania wad i uszkodzeń (pęknięć, zacieków, zawilgocenia, grzyba, uszkodzeń instalacji);</li>
            <li>zmiany metrażu, proporcji lub wysokości pomieszczeń;</li>
            <li>dodawania, usuwania lub przesuwania okien, drzwi i ścian, zmiany układu pomieszczeń;</li>
            <li>zmiany widoku z okien i otoczenia budynku.</li>
          </ol>
        </li>
        <li>
          Klient zobowiązuje się nie wykorzystywać Wizualizacji w sposób wprowadzający w błąd, w szczególności nie
          usuwać ani nie zasłaniać oznaczenia „wizualizacja” i nie prezentować Wizualizacji jako zdjęcia faktycznego
          stanu nieruchomości.
        </li>
        <li>
          Usługodawca rekomenduje, aby w ogłoszeniu obok Wizualizacji publikować także zdjęcie oryginalne lub wyraźnie
          wskazać w opisie, że zdjęcie jest wizualizacją. Klient powinien przestrzegać zasad portali ogłoszeniowych
          dotyczących zdjęć i treści generowanych cyfrowo.
        </li>
        <li>
          Za sposób wykorzystania Wizualizacji, w tym za treść ogłoszenia, odpowiada Klient. Usługodawca może odmówić
          wykonania Usługi lub poprawki, jeżeli z okoliczności wynika, że Wizualizacja ma służyć wprowadzeniu w błąd –
          w takim przypadku zwraca Klientowi cenę za niewykonaną część Usługi.
        </li>
      </ol>
    ),
  },
  {
    id: "prawa-autorskie",
    title: "Prawa autorskie i licencja",
    content: (
      <ol>
        <li>
          Klient oświadcza, że przysługują mu prawa do Zdjęć Wejściowych w zakresie umożliwiającym ich przekazanie do
          obróbki (np. jest ich autorem albo uzyskał zgodę autora oraz – jeśli to konieczne – właściciela
          nieruchomości), a ich wykorzystanie w ramach Usługi nie narusza praw osób trzecich.
        </li>
        <li>
          Klient udziela Usługodawcy niewyłącznej, nieodpłatnej licencji na korzystanie ze Zdjęć Wejściowych wyłącznie
          w zakresie niezbędnym do wykonania Usługi, w tym na ich przetwarzanie w narzędziach informatycznych, o których
          mowa w Polityce prywatności. Licencja wygasa z chwilą usunięcia plików.
        </li>
        <li>
          Z chwilą dostarczenia Wizualizacji Usługodawca udziela Klientowi – w zakresie, w jakim Wizualizacji przysługuje
          ochrona prawnoautorska – niewyłącznej, nieograniczonej czasowo i terytorialnie licencji na korzystanie z
          Wizualizacji w celu promocji, sprzedaży lub najmu nieruchomości, której dotyczy Zdjęcie Wejściowe, na polach
          eksploatacji: utrwalanie i zwielokrotnianie dowolną techniką, wprowadzanie do pamięci komputera, publiczne
          udostępnianie w internecie (w tym na portalach ogłoszeniowych, stronach internetowych i w mediach
          społecznościowych), wykorzystanie w materiałach drukowanych. Klient może udzielać dalszych licencji w tym samym
          zakresie (np. biuru nieruchomości lub właścicielowi lokalu).
        </li>
        <li>
          Usługodawca może wykorzystać Zdjęcia Wejściowe i Wizualizacje w swoim portfolio lub materiałach promocyjnych
          wyłącznie za odrębną, wyraźną zgodą Klienta, którą można w każdej chwili wycofać.
        </li>
        <li>
          Jeżeli Klient niebędący Konsumentem ani Przedsiębiorcą na prawach konsumenta złożył nieprawdziwe oświadczenie,
          o którym mowa w ust. 1, zwalnia Usługodawcę z odpowiedzialności wobec osób trzecich i pokrywa uzasadnione
          koszty z tym związane.
        </li>
      </ol>
    ),
  },
  {
    id: "dane-osobowe",
    title: "Dane osobowe",
    content: (
      <ol>
        <li>Administratorem danych osobowych Klientów jest Usługodawca.</li>
        <li>
          Zasady przetwarzania danych osobowych, w tym informacje o celach i podstawach przetwarzania, odbiorcach danych,
          okresie przechowywania oraz prawach osób, których dane dotyczą, określa{" "}
          <Link href={ROUTES.privacy}>Polityka prywatności</Link>.
        </li>
        <li>
          Zdjęcia wnętrz mogą przypadkowo zawierać dane osobowe (np. dokumenty, fotografie rodzinne). Klient powinien w
          miarę możliwości usunąć takie elementy z kadru przed wykonaniem zdjęcia.
        </li>
      </ol>
    ),
  },
  {
    id: "odstapienie",
    title: "Odstąpienie od umowy",
    content: (
      <ol>
        <li>
          Konsument oraz Przedsiębiorca na prawach konsumenta może odstąpić od umowy zawartej na odległość bez podania
          przyczyny w terminie {WITHDRAWAL_DAYS} dni od dnia jej zawarcia, z zastrzeżeniem ust. 3–5.
        </li>
        <li>
          Aby odstąpić od umowy, wystarczy przed upływem terminu wysłać oświadczenie, np. e-mailem na adres{" "}
          <a href={`mailto:${PROVIDER.email}`}>{PROVIDER.email}</a>. Można skorzystać ze wzoru formularza stanowiącego
          Załącznik nr 1, nie jest to jednak obowiązkowe. Usługodawca niezwłocznie potwierdzi otrzymanie oświadczenia.
        </li>
        <li>
          Składając Zamówienie, Konsument lub Przedsiębiorca na prawach konsumenta wyraźnie żąda rozpoczęcia świadczenia
          Usługi przed upływem terminu do odstąpienia od umowy i przyjmuje do wiadomości, że po pełnym wykonaniu Usługi
          przez Usługodawcę traci prawo odstąpienia od umowy (art. 38 ust. 1 pkt 1 oraz pkt 13 ustawy z dnia 30 maja
          2014 r. o prawach konsumenta). Potwierdzenie tej zgody Usługodawca przesyła w wiadomości potwierdzającej
          zawarcie umowy.
        </li>
        <li>
          Prawo odstąpienia od umowy wygasa z chwilą dostarczenia wszystkich Wizualizacji objętych Zamówieniem.
        </li>
        <li>
          Jeżeli Konsument lub Przedsiębiorca na prawach konsumenta odstąpi od umowy po rozpoczęciu świadczenia, a przed
          jego pełnym wykonaniem, zapłaci za świadczenia spełnione do chwili odstąpienia – proporcjonalnie do liczby
          Wizualizacji dostarczonych przed odstąpieniem (art. 35 ustawy o prawach konsumenta).
        </li>
        <li>
          Usługodawca zwraca należne płatności niezwłocznie, nie później niż w terminie 14 dni od otrzymania oświadczenia
          o odstąpieniu, przy użyciu takiego samego sposobu płatności, jakiego użył Klient, chyba że Klient zgodzi się
          na inny sposób niewiążący się dla niego z kosztami.
        </li>
        <li>
          Prawo odstąpienia od umowy na zasadach opisanych w niniejszym paragrafie nie przysługuje Klientom niebędącym
          Konsumentami ani Przedsiębiorcami na prawach konsumenta. Usługi zamawiane w ramach działalności o charakterze
          zawodowym (np. przez agenta nieruchomości dla ofert, którymi się zajmuje) z reguły mają charakter zawodowy.
        </li>
      </ol>
    ),
  },
  {
    id: "reklamacje",
    title: "Reklamacje",
    content: (
      <ol>
        <li>
          Usługodawca jest obowiązany dostarczyć Wizualizacje zgodne z umową. Wobec Konsumentów i Przedsiębiorców na
          prawach konsumenta Usługodawca odpowiada za brak zgodności z umową na zasadach określonych w rozdziale 5b
          ustawy o prawach konsumenta (dostarczanie treści cyfrowej lub usługi cyfrowej).
        </li>
        <li>
          Reklamację można złożyć e-mailem na adres <a href={`mailto:${PROVIDER.email}`}>{PROVIDER.email}</a> lub
          pisemnie na adres Usługodawcy. Reklamacja powinna zawierać: adres e-mail użyty przy Zamówieniu lub link do
          strony statusu Zamówienia, opis zastrzeżeń oraz oczekiwany sposób rozpatrzenia (np. ponowne wykonanie
          Wizualizacji, obniżenie ceny, zwrot ceny).
        </li>
        <li>
          Usługodawca odpowiada na reklamację w terminie {COMPLAINT_RESPONSE_DAYS} dni od jej otrzymania, na adres
          e-mail Klienta. Brak odpowiedzi Usługodawcy w tym terminie wobec Konsumenta oznacza uznanie reklamacji.
        </li>
        <li>
          W razie uwzględnienia reklamacji Usługodawca w pierwszej kolejności doprowadza Wizualizację do zgodności z
          umową, a gdy nie jest to możliwe lub nie nastąpi w rozsądnym czasie – obniża cenę albo zwraca ją w całości.
        </li>
        <li>
          Za wadę nie uważa się cech Wizualizacji wynikających z jej poglądowego charakteru, z ograniczeń Zdjęcia
          Wejściowego zgłoszonych Klientowi przed realizacją, ani z odmowy dokonania zmian sprzecznych z {par("uczciwa-wizualizacja")}.
        </li>
      </ol>
    ),
  },
  {
    id: "odpowiedzialnosc",
    title: "Odpowiedzialność",
    content: (
      <ol>
        <li>
          Usługodawca dokłada należytej staranności, aby Serwis działał nieprzerwanie, jednak zastrzega możliwość
          krótkich przerw technicznych, o ile to możliwe – z wyprzedzeniem ogłoszonych w Serwisie.
        </li>
        <li>
          Usługodawca nie odpowiada za sposób wykorzystania Wizualizacji przez Klienta, w szczególności za treść
          ogłoszeń i ich zgodność z przepisami o przeciwdziałaniu nieuczciwym praktykom rynkowym oraz z regulaminami
          portali ogłoszeniowych.
        </li>
        <li>
          Wobec Klientów niebędących Konsumentami ani Przedsiębiorcami na prawach konsumenta: odpowiedzialność
          Usługodawcy z tytułu umowy jest ograniczona do wysokości ceny zapłaconej za Zamówienie, którego dotyczy
          roszczenie, i nie obejmuje utraconych korzyści; wyłączona jest odpowiedzialność z tytułu rękojmi.
        </li>
        <li>
          Postanowienia Regulaminu nie wyłączają ani nie ograniczają odpowiedzialności Usługodawcy wobec Konsumentów i
          Przedsiębiorców na prawach konsumenta w zakresie, w jakim nie pozwalają na to przepisy prawa.
        </li>
      </ol>
    ),
  },
  {
    id: "spory",
    title: "Pozasądowe rozwiązywanie sporów",
    content: (
      <ol>
        <li>
          Konsument może skorzystać z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, w
          szczególności zwrócić się do stałego polubownego sądu konsumenckiego przy wojewódzkim inspektoracie Inspekcji
          Handlowej, wystąpić do wojewódzkiego inspektora Inspekcji Handlowej z wnioskiem o wszczęcie postępowania
          mediacyjnego albo skorzystać z bezpłatnej pomocy powiatowego (miejskiego) rzecznika konsumentów.
        </li>
        <li>
          Wykaz podmiotów uprawnionych do pozasądowego rozwiązywania sporów konsumenckich prowadzi Prezes Urzędu Ochrony
          Konkurencji i Konsumentów:{" "}
          <a href={LEGAL_LINKS.uokikDisputes} rel="noopener noreferrer" target="_blank">
            polubowne.uokik.gov.pl
          </a>
          . Informacje o prawach konsumentów są dostępne na stronie{" "}
          <a href={LEGAL_LINKS.uokik} rel="noopener noreferrer" target="_blank">
            uokik.gov.pl
          </a>
          .
        </li>
        <li>
          Unijna platforma internetowego rozstrzygania sporów (platforma ODR) została wyłączona przez Komisję
          Europejską z dniem 20 lipca 2025 r. W sporach transgranicznych w Unii Europejskiej Konsument może zwrócić się
          o pomoc do Europejskiego Centrum Konsumenckiego w Polsce:{" "}
          <a href={LEGAL_LINKS.eck} rel="noopener noreferrer" target="_blank">
            konsument.gov.pl
          </a>
          .
        </li>
        <li>
          Skorzystanie z pozasądowych sposobów rozwiązywania sporów jest dobrowolne i wymaga zgody obu stron.
        </li>
      </ol>
    ),
  },
  {
    id: "zmiany",
    title: "Zmiany Regulaminu",
    content: (
      <ol>
        <li>
          Usługodawca może zmienić Regulamin z ważnych przyczyn, w szczególności: zmiany przepisów prawa, zmiany
          zakresu lub sposobu świadczenia Usług, zmiany metod płatności, konieczności zapewnienia bezpieczeństwa
          Serwisu.
        </li>
        <li>
          Zmieniony Regulamin jest publikowany w Serwisie z co najmniej 7-dniowym wyprzedzeniem. Do Zamówień złożonych
          przed wejściem w życie zmian stosuje się Regulamin w brzmieniu obowiązującym w chwili złożenia Zamówienia.
        </li>
      </ol>
    ),
  },
  {
    id: "postanowienia-koncowe",
    title: "Postanowienia końcowe",
    content: (
      <ol>
        <li>Umowy zawierane na podstawie Regulaminu są zawierane w języku polskim.</li>
        <li>
          W sprawach nieuregulowanych w Regulaminie stosuje się przepisy prawa polskiego, w szczególności Kodeksu
          cywilnego, ustawy o prawach konsumenta oraz ustawy o świadczeniu usług drogą elektroniczną. Wybór prawa
          polskiego nie pozbawia Konsumenta ochrony przyznanej mu przez bezwzględnie obowiązujące przepisy prawa
          państwa jego zwykłego pobytu.
        </li>
        <li>
          Spory z Klientami niebędącymi Konsumentami ani Przedsiębiorcami na prawach konsumenta rozstrzyga sąd właściwy
          dla siedziby Usługodawcy.
        </li>
        <li>
          Dokumenty rozliczeniowe przechowujemy przez {BILLING_RETENTION_YEARS} lat od końca roku podatkowego, zgodnie z
          przepisami podatkowymi.
        </li>
      </ol>
    ),
  },
];

// Zabezpieczenie: odsyłacze „§ n” muszą odpowiadać faktycznej kolejności sekcji.
if (SECTIONS.map((section) => section.id).join() !== SECTION_IDS.join()) {
  throw new Error("Regulamin: kolejność SECTIONS nie zgadza się z SECTION_IDS (odsyłacze § byłyby błędne).");
}

export default function TermsPage() {
  return (
    <>
      <LegalDocument
        title="Regulamin"
        meta={<>Obowiązuje od {effectiveDate} r. · {PROVIDER.legalName}</>}
        intro={
          <p>
            Ten dokument opisuje zasady zamawiania wizualizacji w serwisie {SITE.name}. Najważniejsze w skrócie: płacisz
            z góry, wizualizacje dostajesz w ciągu {SITE.turnaroundHours}&nbsp;h, masz {INCLUDED_REVISIONS} bezpłatną
            poprawkę, a każda wizualizacja jest oznaczona i nie może ukrywać wad lokalu.
          </p>
        }
        sections={SECTIONS}
      />

      <section
        id="zalacznik-1"
        aria-labelledby="zalacznik-1-tytul"
        className="container-x pb-16"
      >
        <div className="lg:ml-[calc(16rem+3.5rem)]">
          <div className="card max-w-3xl p-6 sm:p-8">
            <h2 id="zalacznik-1-tytul" className="text-xl font-semibold text-ink">
              Załącznik nr 1 – wzór formularza odstąpienia od umowy
            </h2>
            <p className="mt-2 text-sm text-muted">
              (formularz należy wypełnić i odesłać tylko w przypadku chęci odstąpienia od umowy)
            </p>
            <div className="mt-5 space-y-3 rounded-control border border-dashed border-line bg-paper p-5 text-sm leading-relaxed text-ink/90">
              <p>
                Adresat: {PROVIDER.legalName}, {PROVIDER.address}, e-mail: {PROVIDER.email}
              </p>
              <p>
                Ja/My(*) niniejszym informuję/informujemy(*) o moim/naszym(*) odstąpieniu od umowy o świadczenie
                następującej usługi: wirtualny home staging – zamówienie z dnia …………… (adres e-mail użyty przy
                zamówieniu / link do statusu zamówienia: ……………)
              </p>
              <p>Imię i nazwisko konsumenta(-ów): ……………</p>
              <p>Adres konsumenta(-ów): ……………</p>
              <p>Podpis konsumenta(-ów) (tylko jeżeli formularz jest przesyłany w wersji papierowej): ……………</p>
              <p>Data: ……………</p>
              <p className="text-xs text-muted">(*) Niepotrzebne skreślić.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
