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

export interface FaqItem {
  /** Stabilny identyfikator (kotwica #faq-<id>). */
  id: string;
  question: string;
  /** Odpowiedź – kolejne akapity. */
  answer: readonly string[];
}

const maxUploadMb = Number(process.env.MAX_UPLOAD_MB ?? 25) || 25;
const addonNames = ADDONS.map((addon) => addon.name.toLowerCase()).join(", ");

export const FAQ: readonly FaqItem[] = [
  {
    id: "czas-realizacji",
    question: "Ile trwa przygotowanie wizualizacji?",
    answer: [
      `Standardowo do ${SITE.turnaroundHours} godzin od zaksięgowania płatności. W trybie ekspres (dopłata ${Math.round(EXPRESS_RATE * 100)}% ceny bazowej) – do ${SITE.expressHours} godzin.`,
      "O gotowych zdjęciach poinformujemy Cię e-mailem z linkiem do pobrania. Status zamówienia możesz też sprawdzić w każdej chwili pod linkiem z potwierdzenia.",
    ],
  },
  {
    id: "format-zdjec",
    question: "Jakie zdjęcia mam przesłać?",
    answer: [
      `Przyjmujemy pliki JPG, PNG i WebP do ${maxUploadMb} MB każdy – w jednym zamówieniu od 1 do ${MAX_PHOTOS} zdjęć. Najlepiej sprawdzają się zdjęcia w poziomie, o dłuższym boku min. 2000 px.`,
      "Fotografuj z wysokości ok. 1,2–1,5 m, przy dziennym świetle, tak by w kadrze była podłoga i przynajmniej dwie ściany. Nie musisz niczego retuszować – resztą zajmiemy się my.",
    ],
  },
  {
    id: "oznaczenie-wizualizacji",
    question: "Czy wizualizacja jest jakoś oznaczona?",
    answer: [
      "Tak. Każde gotowe zdjęcie ma w rogu dyskretny, półprzezroczysty napis „wizualizacja”. Dzięki temu kupujący wiedzą, że meble zostały dodane cyfrowo, a Ty unikasz zarzutu wprowadzania w błąd.",
      "Zalecamy publikowanie w ogłoszeniu również zdjęcia oryginalnego – kupujący docenią uczciwość, a Ty zyskasz ich zaufanie.",
    ],
  },
  {
    id: "ukrywanie-wad",
    question: "Czy możecie ukryć wady mieszkania, np. pęknięcia albo zawilgocenia?",
    answer: [
      "Nie. Wirtualny home staging pokazuje potencjał wnętrza, ale nie może zmieniać jego faktycznego stanu. Nie usuwamy pęknięć, zacieków, wilgoci ani uszkodzeń, nie zmieniamy metrażu, układu pomieszczeń, okien ani widoku za oknem.",
      "Dodatek „Wirtualny remont” zmienia wyłącznie wykończenie (np. kolor ścian, rodzaj podłogi) i zawsze jest oznaczony jako wizualizacja. Przy zamówieniu potwierdzasz, że nie będziesz wykorzystywać wizualizacji do ukrywania wad lokalu.",
    ],
  },
  {
    id: "poprawki",
    question: "Co jeśli efekt mi się nie spodoba?",
    answer: [
      `Każde zdjęcie obejmuje ${INCLUDED_REVISIONS} bezpłatną poprawkę zgłoszoną w ciągu ${REVISION_WINDOW_DAYS} dni od dostarczenia – np. inny kolor sofy, inne ustawienie mebli lub mniej dekoracji. Wystarczy odpisać na e-mail z gotowymi zdjęciami.`,
      "Zmiana stylu całej aranżacji to już nowe zamówienie, ale zawsze chętnie doradzimy, który styl najlepiej pasuje do Twojej nieruchomości.",
    ],
  },
  {
    id: "platnosci",
    question: "Jak mogę zapłacić? Czy jest BLIK?",
    answer: [
      "Tak – płacisz BLIK-iem, kartą płatniczą lub szybkim przelewem Przelewy24. Płatności obsługuje Stripe; nie przechowujemy danych Twojej karty.",
      "Realizację zaczynamy od razu po zaksięgowaniu płatności, czyli zwykle kilka sekund po jej zatwierdzeniu.",
    ],
  },
  {
    id: "faktura-vat",
    question: "Czy wystawiacie fakturę VAT?",
    answer: [
      "Tak. Ceny w cenniku są cenami brutto (z 23% VAT), obok podajemy kwotę netto. Jeśli kupujesz na firmę, wpisz nazwę firmy i NIP w formularzu zamówienia – faktura VAT trafi na Twój adres e-mail.",
    ],
  },
  {
    id: "prawa-do-zdjec",
    question: "Kto ma prawa do zdjęć i wizualizacji?",
    answer: [
      "Składając zamówienie, potwierdzasz, że masz prawo do przesłanych zdjęć (np. sam je wykonałeś lub masz zgodę autora i właściciela nieruchomości).",
      "Gotowe wizualizacje możesz bez ograniczeń czasowych wykorzystywać do promocji danej nieruchomości: w ogłoszeniach, mediach społecznościowych, materiałach drukowanych. Nie publikujemy Twoich zdjęć w naszym portfolio bez Twojej zgody.",
    ],
  },
  {
    id: "abonament",
    question: "Mam biuro nieruchomości – czy macie abonament?",
    answer: [
      `Tak. Abonament dla biur to ${formatPLNShort(OFFICE_PLAN.monthlyNet)} netto miesięcznie za ${formatPhotoCount(OFFICE_PLAN.photosPerMonth)} (ok. ${formatPLNShort(OFFICE_PLAN_APPROX_NET_PER_PHOTO)} netto za zdjęcie). Dodatki (${addonNames}) są w cenie, a zlecenia realizujemy priorytetowo – do ${OFFICE_PLAN.priorityHours} h.`,
      "Wypełnij formularz na stronie „Dla biur” – przygotujemy ofertę i fakturę. Możesz też kupić pakiet zdjęć na kod przedpłacony dla całego zespołu.",
    ],
  },
  {
    id: "zwroty",
    question: "Czy mogę odstąpić od umowy i odzyskać pieniądze?",
    answer: [
      "Wizualizacja to usługa cyfrowa wykonywana na Twoje indywidualne zamówienie. Jeśli jesteś konsumentem, przy zamówieniu wyrażasz zgodę na rozpoczęcie realizacji przed upływem 14 dni na odstąpienie od umowy i przyjmujesz do wiadomości, że po jej wykonaniu prawo odstąpienia wygasa.",
      "Jeśli nie dostarczymy zamówienia w obiecanym czasie albo wizualizacja ma wady, których nie usuniemy w ramach poprawki – zwrócimy pieniądze. Szczegóły reklamacji opisuje regulamin.",
    ],
  },
  {
    id: "cena-hurtowa",
    question: "Jak działa niższa cena przy większej liczbie zdjęć?",
    answer: [
      `Do ${BULK_THRESHOLD - 1} zdjęć w zamówieniu płacisz ${formatPLNShort(PRICE_SINGLE)} za zdjęcie. Od ${formatPhotoCount(BULK_THRESHOLD)} cena spada do ${formatPLNShort(PRICE_BULK)} za każde zdjęcie w zamówieniu – automatycznie, bez kodów rabatowych.`,
    ],
  },
  {
    id: "darmowa-probka",
    question: "Czy mogę najpierw sprawdzić jakość za darmo?",
    answer: [
      `Tak – jeśli jesteś agentem nieruchomości i zamawiasz u nas pierwszy raz, przygotujemy ${formatPhotoCount(FREE_SAMPLE_PHOTOS)} gratis. Wypełnij formularz „Darmowa próbka” i wgraj zdjęcie pustego pokoju.`,
    ],
  },
  {
    id: "polecenia",
    question: "Czy macie program poleceń?",
    answer: [
      `Tak. Poleć nas innemu agentowi – gdy złoży i opłaci pierwsze zamówienie z Twoim kodem polecenia, otrzymasz kod na ${formatPhotoCount(REFERRAL_REWARD_PHOTOS)} gratis.`,
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

export const FAQ_HOME: readonly FaqItem[] = FAQ_HOME_IDS.map((id) => {
  const item = FAQ.find((faq) => faq.id === id);
  if (!item) throw new Error(`Brak pytania FAQ: ${id}`);
  return item;
});
