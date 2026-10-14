/*
 * Polityka prywatności (RODO) – DOKUMENT WZORCOWY – DO WERYFIKACJI PRZEZ PRAWNIKA.
 * Przed startem: uzupełnij dane firmy w src/lib/site.ts, sprawdź listę dostawców
 * (hosting, magazyn plików, e-mail, narzędzia AI) i ich lokalizację przetwarzania.
 * Po zmianie treści zaktualizuj PRIVACY_EFFECTIVE_DATE w src/content/legal.ts.
 */
import Link from "next/link";
import { LegalDocument } from "@/components/LegalDocument";
import type { LegalSectionDef } from "@/components/LegalDocument";
import {
  BILLING_RETENTION_YEARS,
  CONTACT_RETENTION_YEARS,
  FILE_RETENTION_DAYS,
  LEGAL_LINKS,
  PRIVACY_EFFECTIVE_DATE,
  PROVIDER,
} from "@/content/legal";
import { formatDatePL } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { ROUTES, SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Polityka prywatności",
  description: `Jak ${SITE.name} przetwarza dane osobowe i zdjęcia wnętrz: administrator, cele i podstawy prawne (RODO), odbiorcy, okres przechowywania, Twoje prawa i pliki cookies.`,
  path: ROUTES.privacy,
});

const effectiveDate = formatDatePL(PRIVACY_EFFECTIVE_DATE);

const PURPOSES = [
  {
    purpose: "Realizacja zamówienia: przyjęcie zdjęć, wykonanie wizualizacji, kontakt w sprawie zamówienia, poprawki",
    basis: "art. 6 ust. 1 lit. b RODO – wykonanie umowy i działania przed jej zawarciem",
  },
  {
    purpose: "Obsługa płatności, wystawianie faktur, prowadzenie ksiąg i dokumentacji podatkowej",
    basis: "art. 6 ust. 1 lit. c RODO – obowiązek prawny (przepisy podatkowe i o rachunkowości)",
  },
  {
    purpose: "Rozpatrywanie reklamacji i odstąpień od umowy",
    basis: "art. 6 ust. 1 lit. c RODO – obowiązek prawny (ustawa o prawach konsumenta, Kodeks cywilny)",
  },
  {
    purpose: "Odpowiedź na wiadomość z formularza kontaktowego lub zapytanie o ofertę dla biur",
    basis:
      "art. 6 ust. 1 lit. b RODO (gdy zapytanie dotyczy zawarcia umowy), w pozostałych przypadkach art. 6 ust. 1 lit. f RODO – uzasadniony interes: prowadzenie korespondencji",
  },
  {
    purpose: "Ustalenie, dochodzenie i obrona przed roszczeniami; zapewnienie bezpieczeństwa Serwisu (np. ochrona przed spamem)",
    basis: "art. 6 ust. 1 lit. f RODO – uzasadniony interes administratora",
  },
  {
    purpose: "Wysyłka informacji handlowych (newsletter, oferty) – tylko jeśli wyrazisz na to zgodę",
    basis:
      "art. 6 ust. 1 lit. a RODO – zgoda, w związku z art. 10 ustawy o świadczeniu usług drogą elektroniczną i art. 172 Prawa telekomunikacyjnego",
  },
  {
    purpose: "Wykorzystanie Twoich zdjęć i wizualizacji w naszym portfolio – tylko za Twoją zgodą",
    basis: "art. 6 ust. 1 lit. a RODO – zgoda (możesz ją w każdej chwili wycofać)",
  },
] as const;

const RECIPIENTS = [
  {
    name: "Dostawca hostingu i bazy danych",
    detail: "serwery, na których działa Serwis i baza zamówień (np. Vercel, Railway lub inny dostawca chmury).",
  },
  {
    name: "Dostawca magazynu plików",
    detail: "przechowywanie zdjęć i wizualizacji (usługa zgodna z S3, np. Cloudflare R2 lub Amazon S3).",
  },
  {
    name: "Stripe Payments Europe, Ltd. (Irlandia)",
    detail:
      "obsługa płatności BLIK, kartą i Przelewy24. Stripe przetwarza dane płatnicze jako odrębny administrator – zob. polityka prywatności Stripe.",
  },
  {
    name: "Dostawca poczty e-mail (Resend)",
    detail: "wysyłka potwierdzeń zamówień, powiadomień o gotowych wizualizacjach i odpowiedzi na wiadomości.",
  },
  {
    name: "Dostawcy narzędzi AI do generowania i edycji obrazów",
    detail:
      "Zdjęcia wnętrz mogą być przesyłane do zewnętrznych modeli sztucznej inteligencji w celu wygenerowania wariantów aranżacji. Korzystamy wyłącznie z narzędzi, których warunki wykluczają wykorzystywanie przesłanych zdjęć do trenowania modeli lub pozwalają tę opcję wyłączyć.",
  },
  {
    name: "Biuro rachunkowe, kancelaria prawna",
    detail: "w zakresie niezbędnym do prowadzenia księgowości i obsługi prawnej.",
  },
  {
    name: "Organy publiczne",
    detail: "gdy obowiązek przekazania danych wynika z przepisów prawa.",
  },
] as const;

const SECTIONS: readonly LegalSectionDef[] = [
  {
    id: "administrator",
    title: "Administrator danych",
    content: (
      <>
        <p>
          Administratorem Twoich danych osobowych jest {PROVIDER.legalName}, {PROVIDER.address}, NIP: {PROVIDER.nip}{" "}
          (dalej: „my”, „Administrator”), prowadzący serwis {SITE.name} pod adresem {PROVIDER.website}.
        </p>
        <p>
          W sprawach dotyczących danych osobowych napisz na adres{" "}
          <a href={`mailto:${PROVIDER.email}`}>{PROVIDER.email}</a> lub listownie na adres Administratora. Nie
          wyznaczyliśmy inspektora ochrony danych – nie mamy takiego obowiązku.
        </p>
      </>
    ),
  },
  {
    id: "zakres-danych",
    title: "Jakie dane przetwarzamy",
    content: (
      <ol>
        <li>
          <strong>Dane kontaktowe i identyfikacyjne</strong> – adres e-mail, a jeśli je podasz: imię, numer telefonu,
          nazwa firmy, NIP i adres do faktury.
        </li>
        <li>
          <strong>Zdjęcia wnętrz i wizualizacje</strong> – zdjęcia, które przesyłasz, oraz przygotowane na ich
          podstawie wizualizacje. Zdjęcia nieruchomości zwykle nie są danymi osobowymi, ale mogą nimi być, jeśli w
          kadrze widać osoby, dokumenty, fotografie rodzinne, adres lub inne informacje pozwalające zidentyfikować
          osobę. Prosimy, by przed wykonaniem zdjęcia usunąć takie elementy z kadru. Metadane plików (np. EXIF z datą
          lub lokalizacją GPS) mogą zostać zachowane w oryginale – jeśli nie chcesz ich przekazywać, usuń je przed
          wysłaniem.
        </li>
        <li>
          <strong>Dane zamówienia i płatności</strong> – wybrany styl, dodatki, kwota, status płatności, identyfikator
          transakcji. Danych karty płatniczej ani danych logowania do banku nie otrzymujemy – przetwarza je Stripe.
        </li>
        <li>
          <strong>Treść korespondencji</strong> – wiadomości z formularzy i e-maili, w tym zgłoszenia poprawek i
          reklamacji.
        </li>
        <li>
          <strong>Dane techniczne</strong> – adres IP i informacje o przeglądarce zapisywane w logach serwera oraz
          wykorzystywane do ochrony formularzy przed nadużyciami.
        </li>
      </ol>
    ),
  },
  {
    id: "cele-podstawy",
    title: "Cele i podstawy prawne przetwarzania",
    content: (
      <>
        <p>
          Przetwarzamy dane zgodnie z rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 („RODO”), w
          następujących celach:
        </p>
        <div className="overflow-x-auto rounded-control border border-line">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-cream text-ink">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Cel</th>
                <th scope="col" className="px-4 py-3 font-semibold">Podstawa prawna</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {PURPOSES.map((row) => (
                <tr key={row.purpose}>
                  <td className="px-4 py-3 align-top">{row.purpose}</td>
                  <td className="px-4 py-3 align-top text-muted">{row.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Na starcie nie wysyłamy newslettera. Jeśli to się zmieni, poprosimy o osobną zgodę – nigdy nie jest ona
          warunkiem złożenia zamówienia.
        </p>
      </>
    ),
  },
  {
    id: "odbiorcy",
    title: "Komu przekazujemy dane",
    content: (
      <>
        <p>
          Nie sprzedajemy danych. Przekazujemy je wyłącznie podmiotom, które pomagają nam świadczyć usługę – działają one
          na nasze zlecenie (podmioty przetwarzające, na podstawie umów powierzenia) albo jako odrębni administratorzy:
        </p>
        <ul>
          {RECIPIENTS.map((recipient) => (
            <li key={recipient.name}>
              <strong>{recipient.name}</strong> – {recipient.detail}
              {recipient.name.startsWith("Stripe") && (
                <>
                  {" "}
                  <a href={LEGAL_LINKS.stripePrivacy} rel="noopener noreferrer" target="_blank">
                    stripe.com/pl/privacy
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
        <p>Aktualną listę dostawców przekażemy na każde żądanie.</p>
      </>
    ),
  },
  {
    id: "poza-eog",
    title: "Przekazywanie danych poza Europejski Obszar Gospodarczy",
    content: (
      <>
        <p>
          Część dostawców (w szczególności narzędzi AI, poczty e-mail, hostingu i płatności) może przetwarzać dane w
          Unii Europejskiej lub w Stanach Zjednoczonych. W przypadku przekazania danych poza EOG korzystamy z mechanizmów
          przewidzianych w rozdziale V RODO: decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony (w
          tym EU-U.S. Data Privacy Framework dla certyfikowanych podmiotów) albo standardowych klauzul umownych
          zatwierdzonych przez Komisję Europejską.
        </p>
        <p>Kopię stosowanych zabezpieczeń możesz otrzymać, pisząc na adres podany w pkt 1.</p>
      </>
    ),
  },
  {
    id: "okres",
    title: "Jak długo przechowujemy dane",
    content: (
      <ul>
        <li>
          <strong>Zdjęcia i wizualizacje</strong> – usuwamy automatycznie {FILE_RETENTION_DAYS} dni po realizacji
          zamówienia (dłużej – tylko jeśli zgodzisz się na wykorzystanie w portfolio, do czasu wycofania zgody).
        </li>
        <li>
          <strong>Dane rozliczeniowe</strong> (faktury, dane zamówienia potrzebne do rozliczeń) – przez{" "}
          {BILLING_RETENTION_YEARS} lat od końca roku podatkowego, w którym powstał obowiązek podatkowy.
        </li>
        <li>
          <strong>Pozostałe dane zamówienia i korespondencja</strong> – do czasu przedawnienia ewentualnych roszczeń,
          co do zasady nie dłużej niż {CONTACT_RETENTION_YEARS} lata od zakończenia sprawy.
        </li>
        <li>
          <strong>Dane przetwarzane na podstawie zgody</strong> – do jej wycofania.
        </li>
        <li>
          <strong>Logi serwera</strong> – zwykle do 30 dni, chyba że są potrzebne do wyjaśnienia incydentu
          bezpieczeństwa.
        </li>
      </ul>
    ),
  },
  {
    id: "prawa",
    title: "Twoje prawa",
    content: (
      <>
        <p>Masz prawo do:</p>
        <ul>
          <li>dostępu do swoich danych i otrzymania ich kopii (art. 15 RODO);</li>
          <li>sprostowania danych (art. 16 RODO);</li>
          <li>usunięcia danych (art. 17 RODO) – np. wcześniejszego usunięcia zdjęć;</li>
          <li>ograniczenia przetwarzania (art. 18 RODO);</li>
          <li>przenoszenia danych przetwarzanych na podstawie umowy lub zgody (art. 20 RODO);</li>
          <li>
            sprzeciwu wobec przetwarzania opartego na uzasadnionym interesie (art. 21 RODO);
          </li>
          <li>
            wycofania zgody w dowolnym momencie – bez wpływu na zgodność z prawem przetwarzania przed jej wycofaniem.
          </li>
        </ul>
        <p>
          Aby skorzystać z praw, napisz na <a href={`mailto:${PROVIDER.email}`}>{PROVIDER.email}</a>. Odpowiemy bez
          zbędnej zwłoki, nie później niż w ciągu miesiąca.
        </p>
      </>
    ),
  },
  {
    id: "dobrowolnosc",
    title: "Czy musisz podać dane",
    content: (
      <p>
        Podanie danych jest dobrowolne, ale bez adresu e-mail i zdjęć nie możemy przyjąć ani zrealizować zamówienia, a
        bez danych do faktury – wystawić faktury. Nie podejmujemy wobec Ciebie decyzji opartych wyłącznie na
        zautomatyzowanym przetwarzaniu, w tym profilowaniu, które wywoływałyby skutki prawne lub w podobny sposób
        istotnie na Ciebie wpływały.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "Pliki cookies i podobne technologie",
    content: (
      <>
        <p>
          Serwis używa wyłącznie plików cookies niezbędnych do jego działania. Obecnie jest to plik cookie sesji
          administratora (zalogowanie do panelu obsługi zamówień) – nie dotyczy on Klientów. Przeglądarka może też
          zapamiętywać lokalnie drobne ustawienia interfejsu.
        </p>
        <p>
          Nie stosujemy narzędzi analitycznych, reklamowych ani śledzących. Jeśli w przyszłości je wprowadzimy, zapytamy
          o zgodę za pomocą banera cookies i zaktualizujemy tę politykę.
        </p>
        <p>
          Podczas płatności przechodzisz na stronę Stripe, która stosuje własne pliki cookies niezbędne do realizacji i
          zabezpieczenia płatności (zgodnie z polityką Stripe). Cookies możesz zablokować lub usunąć w ustawieniach
          przeglądarki – zablokowanie cookies niezbędnych może jednak uniemożliwić płatność.
        </p>
      </>
    ),
  },
  {
    id: "skarga",
    title: "Skarga do organu nadzorczego",
    content: (
      <p>
        Jeśli uważasz, że przetwarzamy Twoje dane niezgodnie z prawem, możesz wnieść skargę do Prezesa Urzędu Ochrony
        Danych Osobowych (ul. Stawki 2, 00-193 Warszawa,{" "}
        <a href={LEGAL_LINKS.puodo} rel="noopener noreferrer" target="_blank">
          uodo.gov.pl
        </a>
        ). Zachęcamy jednak, by najpierw napisać do nas – postaramy się szybko wyjaśnić sprawę.
      </p>
    ),
  },
  {
    id: "zmiany",
    title: "Zmiany polityki prywatności",
    content: (
      <p>
        Politykę aktualizujemy, gdy zmieniają się przepisy, nasi dostawcy lub sposób działania Serwisu. Aktualna wersja
        jest zawsze dostępna na tej stronie, a o istotnych zmianach poinformujemy Klientów z aktywnymi zamówieniami
        e-mailem. Zasady świadczenia usług opisuje <Link href={ROUTES.terms}>Regulamin</Link>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Polityka prywatności"
      meta={<>Ostatnia aktualizacja: {effectiveDate} r.</>}
      intro={
        <p>
          Szanujemy Twoją prywatność i zbieramy tylko te dane, które są potrzebne do przygotowania wizualizacji, obsługi
          płatności i kontaktu z Tobą. Zdjęcia usuwamy automatycznie {FILE_RETENTION_DAYS} dni po realizacji zamówienia,
          nie publikujemy ich bez Twojej zgody i nie używamy plików cookies do śledzenia.
        </p>
      }
      sections={SECTIONS}
      numberPrefix=""
    />
  );
}
