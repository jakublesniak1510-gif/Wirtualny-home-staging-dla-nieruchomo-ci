import { formatPLNShort, formatPhotoCount } from "@/lib/format";
import { OFFICE_PLAN, calculateOrderPrice, getAddon } from "@/lib/pricing";
import { ROUTES } from "@/lib/site";
import type { BlogPostSource } from "./types";

const remont = getAddon("wirtualny-remont");
const example = calculateOrderPrice({ photoCount: 4, addons: ["wirtualny-remont"] });

export const post: BlogPostSource = {
  slug: "stan-deweloperski-jak-pokazac-potencjal-mieszkania",
  title: "Stan deweloperski: jak pokazać potencjał mieszkania przed odbiorem",
  description:
    "Jak sprzedać lub wynająć mieszkanie w stanie deweloperskim, gdy na zdjęciach widać tylko wylewkę i tynk? Wirtualne wykończenie i aranżacja krok po kroku – uczciwie.",
  publishedAt: "2026-10-13",
  category: "rynek",
  summary: [
    "Zdjęcia surowego lokalu słabo sprzedają – kupujący nie widzi skali pomieszczeń ani możliwego wykończenia.",
    `Wirtualny remont (podłoga, ściany) i aranżacja pokazują potencjał bez kosztów wykończenia – np. ${formatPhotoCount(example.photoCount)} z remontem to ${formatPLNShort(example.total)}.`,
    "Wizualizacja wykończenia zawsze wymaga jasnego opisu: co jest w cenie, a co jest tylko propozycją.",
  ],
  image: {
    src: "/portfolio/nowoczesny-przed.svg",
    alt: "Puste wnętrze w stanie deweloperskim z szarą podłogą – zdjęcie przed wizualizacją",
  },
  keywords: ["stan deweloperski", "deweloper", "wirtualny remont", "sprzedaż mieszkania", "ogłoszenie"],
  body: [
    {
      type: "p",
      text: "Mieszkanie w stanie deweloperskim to dla wielu kupujących najlepszy wybór: nowe instalacje, brak cudzych remontów i swoboda urządzania. Na zdjęciach wygląda jednak najgorzej ze wszystkich. Szara wylewka, białe tynki, wystające kable i rury – trudno w tym zobaczyć przytulny salon. Ten artykuł jest dla deweloperów, agentów i osób odsprzedających mieszkanie przed odbiorem lub tuż po nim.",
    },
    { type: "h2", text: "Dlaczego surowe wnętrze tak słabo wypada" },
    {
      type: "p",
      text: "Brak podłogi i listew odbiera pomieszczeniu skalę – oko nie ma się czego „złapać”. Szary beton pochłania światło, więc nawet słoneczny pokój wygląda na ciemny. Kupujący, który przegląda dziesiątki ogłoszeń dziennie, potrzebuje kilku sekund, by zdecydować, czy kliknąć. Surowe zdjęcie rzadko wygrywa w tym wyścigu, nawet jeśli lokal ma świetny układ i lokalizację.",
    },
    { type: "h2", text: "Trzy sposoby na pokazanie potencjału" },
    {
      type: "ul",
      items: [
        "Rzut z opisem – niezbędny, ale abstrakcyjny. Mało kto potrafi z rzutu wyobrazić sobie wnętrze.",
        "Wizualizacja 3D z projektu – efektowna, lecz kosztowna i często oderwana od rzeczywistego światła i widoku z okna.",
        "Wirtualny staging na prawdziwym zdjęciu – pokazuje ten konkretny pokój, z jego oknem i proporcjami, ale wykończony i umeblowany.",
      ],
    },
    {
      type: "p",
      text: "Trzecia opcja łączy wiarygodność zdjęcia z czytelnością wizualizacji. Kupujący widzi realne światło, realny widok i realny metraż – a jednocześnie rozumie, jak może wyglądać gotowe wnętrze.",
    },
    { type: "h2", text: "Wirtualny remont: podłoga i ściany" },
    {
      type: "p",
      text: `Przy stanie deweloperskim sama aranżacja mebli to za mało – meble na wylewce wyglądają nienaturalnie. Dlatego łączymy ją z dodatkiem „${remont.name}” (+${formatPLNShort(remont.pricePerPhoto)} za zdjęcie): kładziemy cyfrowo panele, deski lub płytki i malujemy ściany. Cztery zdjęcia z wirtualnym remontem i aranżacją to ${formatPLNShort(example.total)} brutto.`,
    },
    {
      type: "p",
      text: "Wykończenie dobieramy tak, by było realistyczne dla danej inwestycji – w mieszkaniu z segmentu popularnego nie układamy marmuru. Możesz też wskazać konkretną kolorystykę lub materiał, np. z oferty pakietów wykończeniowych dewelopera.",
    },
    { type: "h2", text: "Jak fotografować lokal w stanie deweloperskim" },
    {
      type: "ol",
      items: [
        "Uprzątnij resztki materiałów budowlanych, worki i narzędzia – nawet jeśli to „tylko budowa”.",
        "Fotografuj w dzień, przy otwartych oknach. W lokalach bez oświetlenia światło dzienne jest jedynym źródłem.",
        "Stań w narożniku, trzymaj telefon poziomo i prosto, na wysokości ok. 1,2–1,5 m.",
        "W kadrze musi być podłoga i co najmniej dwie ściany – to na nich „położymy” wykończenie.",
        "Sfotografuj każde pomieszczenie z dwóch stron, zwłaszcza salon z aneksem kuchennym.",
      ],
    },
    {
      type: "p",
      text: "Wystające przewody, puszki elektryczne czy podejścia wodne zostawiamy na swoim miejscu albo maskujemy elementem wyposażenia zgodnym z ich funkcją (np. lampą w miejscu wypustu). Nie ukrywamy natomiast pionów, skosów i innych elementów konstrukcyjnych.",
    },
    { type: "h2", text: "Uczciwy opis: co jest w cenie, a co jest wizualizacją" },
    {
      type: "p",
      text: "Przy stanie deweloperskim granica między „potencjałem” a „obietnicą” jest szczególnie cienka. Kupujący musi wiedzieć, że panele i kolor ścian na zdjęciu to propozycja, a nie standard wykończenia. Dobra praktyka:",
    },
    {
      type: "ul",
      items: [
        "oznacz każde zdjęcie napisem „wizualizacja” (robimy to automatycznie),",
        "w treści ogłoszenia dopisz: „Mieszkanie w stanie deweloperskim. Zdjęcia nr 1–4 to wizualizacje przykładowego wykończenia i aranżacji”,",
        "opublikuj także aktualne zdjęcia lokalu,",
        "jeśli oferujesz pakiety wykończeniowe, wskaż, który pakiet pokazuje wizualizacja i ile kosztuje.",
      ],
    },
    {
      type: "note",
      title: "Dla deweloperów",
      text: "Wizualizacje w ogłoszeniach i materiałach sprzedażowych nie zastępują informacji, które nabywca musi otrzymać zgodnie z przepisami – m.in. prospektu informacyjnego i opisu standardu wykończenia. Dbaj o to, by obraz był z nimi spójny.",
    },
    { type: "h2", text: "Najczęstsze błędy przy wizualizacji stanu deweloperskiego" },
    {
      type: "ul",
      items: [
        "Wykończenie z wyższej półki niż realne możliwości kupujących – rozbudza oczekiwania, których nie da się spełnić w budżecie.",
        "Meble w zaniżonej skali – pokój wygląda na większy, niż jest, a rozczarowanie przychodzi na prezentacji.",
        "Zmieniony widok z okna – zieleń zamiast placu budowy to wprowadzanie w błąd, nawet jeśli park „kiedyś powstanie”.",
        "Brak zdjęć aktualnego stanu – kupujący zaczyna podejrzewać, że coś jest ukrywane.",
        "Różne style w jednym ogłoszeniu – salon nowoczesny i sypialnia klasyczna wyglądają jak dwa różne mieszkania.",
      ],
    },
    {
      type: "p",
      text: "Osobny przypadek to odsprzedaż mieszkania przed odbiorem albo wynajem tuż po nim. Tu czas gra szczególną rolę: właściciel płaci już ratę kredytu i czynsz, a wykończenie lokalu tylko po to, by zrobić zdjęcia, rzadko ma sens. Wizualizacja pozwala opublikować atrakcyjne ogłoszenie od razu, a decyzję o wykończeniu zostawić nowemu właścicielowi.",
    },
    { type: "h2", text: "Ile wariantów przygotować" },
    {
      type: "p",
      text: "Przy jednym mieszkaniu wystarczą zwykle 3–5 ujęć: salon z aneksem, sypialnia, ewentualnie drugi pokój i widok z balkonu (bez zmian). Przy całej inwestycji opłaca się przygotować kilka typowych układów w dwóch stylach – np. nowoczesnym i skandynawskim – i używać ich dla podobnych lokali, zawsze z informacją, który lokal przedstawia zdjęcie.",
    },
    {
      type: "p",
      text: `Deweloperom i biurom, które regularnie publikują dużo ofert, proponujemy abonament: ${formatPhotoCount(OFFICE_PLAN.photosPerMonth)} miesięcznie za ${formatPLNShort(OFFICE_PLAN.monthlyNet)} netto, z dodatkami (w tym wirtualnym remontem) w cenie i priorytetem ${OFFICE_PLAN.priorityHours} h.`,
      link: { href: ROUTES.offices, label: "Oferta dla biur i deweloperów" },
    },
    { type: "h2", text: "Podsumowanie" },
    {
      type: "p",
      text: "Stan deweloperski to świetny produkt, który źle wygląda na zdjęciach. Wirtualny remont i aranżacja na prawdziwym zdjęciu pokazują kupującemu skalę, światło i potencjał wnętrza za ułamek kosztu wykończenia. Warunek: jasny opis, co jest standardem, a co propozycją, oraz oznaczenie każdej wizualizacji.",
      link: { href: `${ROUTES.order}?dodatki=wirtualny-remont`, label: "Zamów wizualizację z wirtualnym remontem" },
    },
  ],
};
