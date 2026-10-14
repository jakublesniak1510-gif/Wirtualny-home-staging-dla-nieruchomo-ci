import {
  ADDONS,
  BULK_THRESHOLD,
  EXPRESS_RATE,
  FREE_SAMPLE_PHOTOS,
  INCLUDED_REVISIONS,
  MAX_PHOTOS,
  OFFICE_PLAN,
  OFFICE_PLAN_APPROX_NET_PER_PHOTO,
  PRICE_BULK,
  PRICE_SINGLE,
  REFERRAL_REWARD_PHOTOS,
  REVISION_WINDOW_DAYS,
} from "@/lib/pricing";
import { formatPLNShort, formatPhotoCount } from "@/lib/format";
import { SITE } from "@/lib/site";
import {
  COMPLAINT_RESPONSE_DAYS,
  FILE_RETENTION_DAYS,
  WITHDRAWAL_DAYS,
} from "@/content/legal";
import {
  ACCEPTED_FORMATS_TEXT,
  MAX_UPLOAD_MB_TEXT,
  MIN_PHOTO_SHORT_SIDE_PX,
  RECOMMENDED_PHOTO_LONG_SIDE_PX,
  VARIANTS_PER_PHOTO,
} from "@/content/service";

/** Kategorie FAQ – kolejność w tablicy = kolejność na stronie /faq. */
export const FAQ_CATEGORIES = [
  { slug: "zamowienie", label: "Zamówienie i zdjęcia" },
  { slug: "realizacja", label: "Realizacja i poprawki" },
  { slug: "ceny", label: "Ceny i płatności" },
  { slug: "uczciwosc", label: "Uczciwa wizualizacja" },
  { slug: "prawo", label: "Prawa, dane i zwroty" },
  { slug: "biura", label: "Dla biur i agentów" },
] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number]["slug"];

export interface FaqItem {
  /** Stabilny identyfikator (kotwica #faq-<id>). */
  id: string;
  /** Kategoria na stronie /faq (i filtr np. „ceny” na /cennik). */
  category: FaqCategory;
  question: string;
  /** Odpowiedź – kolejne akapity. */
  answer: readonly string[];
}

const maxUploadMb = MAX_UPLOAD_MB_TEXT;
const addonNames = ADDONS.map((addon) => addon.name.toLowerCase()).join(", ");

export const FAQ: readonly FaqItem[] = [
  {
    id: "czas-realizacji",
    category: "realizacja",
    question: "Ile trwa przygotowanie wizualizacji?",
    answer: [
      `Standardowo do ${SITE.turnaroundHours} godzin od zaksięgowania płatności. W trybie ekspres (dopłata ${Math.round(EXPRESS_RATE * 100)}% ceny bazowej) – do ${SITE.expressHours} godzin.`,
      "O gotowych zdjęciach poinformujemy Cię e-mailem z linkiem do pobrania. Status zamówienia możesz też sprawdzić w każdej chwili pod linkiem z potwierdzenia.",
    ],
  },
  {
    id: "format-zdjec",
    category: "zamowienie",
    question: "Jakie zdjęcia mam przesłać?",
    answer: [
      `Przyjmujemy pliki ${ACCEPTED_FORMATS_TEXT} do ${maxUploadMb} MB każdy – w jednym zamówieniu od 1 do ${MAX_PHOTOS} zdjęć. Krótszy bok musi mieć co najmniej ${MIN_PHOTO_SHORT_SIDE_PX} px, ale najlepiej sprawdzają się zdjęcia w poziomie o dłuższym boku ${RECOMMENDED_PHOTO_LONG_SIDE_PX} px i więcej.`,
      "Fotografuj z wysokości ok. 1,2–1,5 m, przy dziennym świetle, tak by w kadrze była podłoga i przynajmniej dwie ściany. Nie musisz niczego retuszować – resztą zajmiemy się my.",
    ],
  },
  {
    id: "oznaczenie-wizualizacji",
    category: "uczciwosc",
    question: "Czy wizualizacja jest jakoś oznaczona?",
    answer: [
      "Tak. Każde gotowe zdjęcie ma w rogu dyskretny, półprzezroczysty napis „wizualizacja”. Dzięki temu kupujący wiedzą, że meble zostały dodane cyfrowo, a Ty unikasz zarzutu wprowadzania w błąd.",
      "Zalecamy publikowanie w ogłoszeniu również zdjęcia oryginalnego – kupujący docenią uczciwość, a Ty zyskasz ich zaufanie.",
    ],
  },
  {
    id: "ukrywanie-wad",
    category: "uczciwosc",
    question: "Czy możecie ukryć wady mieszkania, np. pęknięcia albo zawilgocenia?",
    answer: [
      "Nie. Wirtualny home staging pokazuje potencjał wnętrza, ale nie może zmieniać jego faktycznego stanu. Nie usuwamy pęknięć, zacieków, wilgoci ani uszkodzeń, nie zmieniamy metrażu, układu pomieszczeń, okien ani widoku za oknem.",
      "Dodatek „Wirtualny remont” zmienia wyłącznie wykończenie (np. kolor ścian, rodzaj podłogi) i zawsze jest oznaczony jako wizualizacja. Przy zamówieniu potwierdzasz, że nie będziesz wykorzystywać wizualizacji do ukrywania wad lokalu.",
    ],
  },
  {
    id: "poprawki",
    category: "realizacja",
    question: "Co jeśli efekt mi się nie spodoba?",
    answer: [
      `Każde zdjęcie obejmuje ${INCLUDED_REVISIONS} bezpłatną poprawkę zgłoszoną w ciągu ${REVISION_WINDOW_DAYS} dni od dostarczenia – np. inny kolor sofy, inne ustawienie mebli lub mniej dekoracji. Wystarczy odpisać na e-mail z gotowymi zdjęciami.`,
      "Zmiana stylu całej aranżacji to już nowe zamówienie, ale zawsze chętnie doradzimy, który styl najlepiej pasuje do Twojej nieruchomości.",
    ],
  },
  {
    id: "platnosci",
    category: "ceny",
    question: "Jak mogę zapłacić? Czy jest BLIK?",
    answer: [
      "Tak – płacisz BLIK-iem, kartą płatniczą lub szybkim przelewem Przelewy24. Płatności obsługuje Stripe; nie przechowujemy danych Twojej karty.",
      "Realizację zaczynamy od razu po zaksięgowaniu płatności, czyli zwykle kilka sekund po jej zatwierdzeniu.",
    ],
  },
  {
    id: "faktura-vat",
    category: "ceny",
    question: "Czy wystawiacie fakturę VAT?",
    answer: [
      "Tak. Ceny w cenniku są cenami brutto (z 23% VAT), obok podajemy kwotę netto. Jeśli kupujesz na firmę, wpisz nazwę firmy i NIP w formularzu zamówienia – faktura VAT trafi na Twój adres e-mail.",
    ],
  },
  {
    id: "prawa-do-zdjec",
    category: "prawo",
    question: "Kto ma prawa do zdjęć i wizualizacji?",
    answer: [
      "Składając zamówienie, potwierdzasz, że masz prawo do przesłanych zdjęć (np. sam je wykonałeś lub masz zgodę autora i właściciela nieruchomości).",
      "Gotowe wizualizacje możesz bez ograniczeń czasowych wykorzystywać do promocji danej nieruchomości: w ogłoszeniach, mediach społecznościowych, materiałach drukowanych. Nie publikujemy Twoich zdjęć w naszym portfolio bez Twojej zgody.",
    ],
  },
  {
    id: "abonament",
    category: "biura",
    question: "Mam biuro nieruchomości – czy macie abonament?",
    answer: [
      `Tak. Abonament dla biur to ${formatPLNShort(OFFICE_PLAN.monthlyNet)} netto miesięcznie za ${formatPhotoCount(OFFICE_PLAN.photosPerMonth)} (ok. ${formatPLNShort(OFFICE_PLAN_APPROX_NET_PER_PHOTO)} netto za zdjęcie). Dodatki (${addonNames}) są w cenie, a zlecenia realizujemy priorytetowo – do ${OFFICE_PLAN.priorityHours} h.`,
      "Wypełnij formularz na stronie „Dla biur” – przygotujemy ofertę i fakturę. Możesz też kupić pakiet zdjęć na kod przedpłacony dla całego zespołu.",
    ],
  },
  {
    id: "zwroty",
    category: "prawo",
    question: "Czy mogę odstąpić od umowy i odzyskać pieniądze?",
    answer: [
      `Wizualizacja to usługa cyfrowa wykonywana na Twoje indywidualne zamówienie. Jeśli jesteś konsumentem, przy zamówieniu wyrażasz zgodę na rozpoczęcie realizacji przed upływem ${WITHDRAWAL_DAYS} dni na odstąpienie od umowy i przyjmujesz do wiadomości, że po jej wykonaniu prawo odstąpienia wygasa.`,
      `Jeśli nie dostarczymy zamówienia w obiecanym czasie albo wizualizacja ma wady, których nie usuniemy w ramach poprawki – zwrócimy pieniądze. Reklamację rozpatrujemy w ciągu ${COMPLAINT_RESPONSE_DAYS} dni; szczegóły opisuje regulamin.`,
    ],
  },
  {
    id: "cena-hurtowa",
    category: "ceny",
    question: "Jak działa niższa cena przy większej liczbie zdjęć?",
    answer: [
      `Do ${BULK_THRESHOLD - 1} zdjęć w zamówieniu płacisz ${formatPLNShort(PRICE_SINGLE)} za zdjęcie. Od ${formatPhotoCount(BULK_THRESHOLD)} cena spada do ${formatPLNShort(PRICE_BULK)} za każde zdjęcie w zamówieniu – automatycznie, bez kodów rabatowych.`,
    ],
  },
  {
    id: "darmowa-probka",
    category: "biura",
    question: "Czy mogę najpierw sprawdzić jakość za darmo?",
    answer: [
      `Tak – jeśli jesteś agentem nieruchomości i zamawiasz u nas pierwszy raz, przygotujemy ${formatPhotoCount(FREE_SAMPLE_PHOTOS)} gratis. Wypełnij formularz „Darmowa próbka” i wgraj zdjęcie pustego pokoju.`,
    ],
  },
  {
    id: "polecenia",
    category: "biura",
    question: "Czy macie program poleceń?",
    answer: [
      `Tak. Poleć nas innemu agentowi – gdy złoży i opłaci pierwsze zamówienie z Twoim kodem polecenia, otrzymasz kod na ${formatPhotoCount(REFERRAL_REWARD_PHOTOS)} gratis.`,
    ],
  },
  {
    id: "jakie-pomieszczenia",
    category: "zamowienie",
    question: "Jakie pomieszczenia możecie umeblować?",
    answer: [
      "Salony, sypialnie, pokoje dziecięce, gabinety, jadalnie i aneksy kuchenne, a także przedpokoje i balkony czy tarasy. Najlepszy efekt dają zdjęcia pustych lub prawie pustych wnętrz.",
      "Jeśli w pomieszczeniu stoją stare meble, wybierz dodatek „Usunięcie starych mebli” – najpierw cyfrowo opróżnimy wnętrze, a potem je urządzimy.",
    ],
  },
  {
    id: "sztuczna-inteligencja",
    category: "realizacja",
    question: "Czy wizualizacje powstają z pomocą sztucznej inteligencji?",
    answer: [
      `Tak. Dla każdego zdjęcia generujemy od ${VARIANTS_PER_PHOTO.min} do ${VARIANTS_PER_PHOTO.max} wariantów aranżacji w narzędziach AI, wybieramy najlepszy i ręcznie poprawiamy detale: proporcje mebli, cienie, odbicia i krawędzie.`,
      "Każdy wynik sprawdza człowiek, zanim trafi do Ciebie. Dlatego nie wysyłamy surowych, przypadkowych generacji – tylko dopracowane wizualizacje.",
    ],
  },
  {
    id: "zdjecie-nie-nadaje-sie",
    category: "realizacja",
    question: "Co jeśli moje zdjęcie nie nada się do obróbki?",
    answer: [
      "Jeśli zdjęcie jest zbyt ciemne, mocno rozmyte albo kadr nie pokazuje podłogi i ścian, napiszemy do Ciebie, zanim zaczniemy pracę. Możesz przesłać lepsze ujęcie albo zrezygnować z tego zdjęcia – wtedy zwrócimy pieniądze za nie.",
      "Wolimy odrzucić zlecenie niż oddać słabą wizualizację.",
    ],
  },
  {
    id: "kody-pakietow",
    category: "ceny",
    question: "Jak działa kod pakietu (przedpłata)?",
    answer: [
      "Kod pakietu to przedpłacona pula zdjęć – np. dla całego zespołu biura. Jeden kredyt w kodzie odpowiada jednemu zdjęciu bazowemu. Kod wpisujesz w formularzu zamówienia, a system sam odejmie wykorzystane kredyty.",
      "Dodatki (np. usunięcie mebli) i ekspres są płatne osobno przy zamówieniu. Pakiet zamówisz przez formularz na stronie „Dla biur”.",
    ],
  },
  {
    id: "przechowywanie-zdjec",
    category: "prawo",
    question: "Jak długo przechowujecie moje zdjęcia?",
    answer: [
      `Oryginały i gotowe wizualizacje usuwamy automatycznie ${FILE_RETENTION_DAYS} dni po realizacji zamówienia – pobierz je wcześniej i zachowaj kopię. Dane rozliczeniowe (np. faktury) przechowujemy tak długo, jak wymagają tego przepisy podatkowe.`,
      "Zdjęcia wnętrz mogą przypadkiem zawierać dane osobowe (np. dokumenty, zdjęcia rodzinne) – dlatego traktujemy je poufnie i nie publikujemy ich bez Twojej zgody. Szczegóły znajdziesz w polityce prywatności.",
    ],
  },
];

/** Skrót FAQ na stronę główną. */
export const FAQ_HOME_IDS = [
  "czas-realizacji",
  "oznaczenie-wizualizacji",
  "ukrywanie-wad",
  "platnosci",
  "faktura-vat",
  "poprawki",
] as const;

/** Pytania z danej kategorii (w kolejności z FAQ). */
export function getFaqByCategory(category: FaqCategory): readonly FaqItem[] {
  return FAQ.filter((item) => item.category === category);
}

export const FAQ_HOME: readonly FaqItem[] = FAQ_HOME_IDS.map((id) => {
  const item = FAQ.find((faq) => faq.id === id);
  if (!item) throw new Error(`Brak pytania FAQ: ${id}`);
  return item;
});
