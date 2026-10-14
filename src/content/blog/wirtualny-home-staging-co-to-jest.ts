import {
  AGENCY_COST_PER_PHOTO,
  DIY_AI_COST_PER_PHOTO,
  PHYSICAL_STAGING_COST,
  PHYSICAL_STAGING_DAYS,
} from "@/content/market";
import { formatPLNShort, formatPhotoCount } from "@/lib/format";
import {
  ADDONS,
  BULK_THRESHOLD,
  EXPRESS_RATE,
  INCLUDED_REVISIONS,
  OFFICE_PLAN,
  OFFICE_PLAN_APPROX_NET_PER_PHOTO,
  PRICE_BULK,
  PRICE_SINGLE,
  calculateOrderPrice,
} from "@/lib/pricing";
import { ROUTES, SITE } from "@/lib/site";
import type { BlogPostSource } from "./types";

const range = (r: { min: number; max: number }) => `${formatPLNShort(r.min)}–${formatPLNShort(r.max)}`;
const typicalOrder = calculateOrderPrice({ photoCount: 6 });
const addonList = ADDONS.map((addon) => `${addon.name.toLowerCase()} (+${formatPLNShort(addon.pricePerPhoto)} za zdjęcie)`);

export const post: BlogPostSource = {
  slug: "wirtualny-home-staging-co-to-jest-i-ile-kosztuje",
  title: "Wirtualny home staging – co to jest i ile kosztuje",
  description:
    "Czym jest wirtualny home staging, jak działa, ile kosztuje w Polsce i kiedy się opłaca. Porównanie z tradycyjnym home stagingiem i narzędziami AI.",
  publishedAt: "2026-08-18",
  updatedAt: "2026-10-12",
  category: "poradniki",
  summary: [
    "Wirtualny home staging to cyfrowe umeblowanie zdjęcia pustego wnętrza – ściany, okna i metraż zostają bez zmian.",
    `Kosztuje zwykle od kilkudziesięciu do kilkuset złotych za zdjęcie; fizyczny home staging całego mieszkania to ${range(PHYSICAL_STAGING_COST)}.`,
    "Najlepiej sprawdza się przy pustych mieszkaniach, stanie deweloperskim i lokalach po lokatorach – zawsze z oznaczeniem „wizualizacja”.",
  ],
  image: {
    src: "/portfolio/skandynawski-po.svg",
    alt: "Salon urządzony cyfrowo w stylu skandynawskim – przykład wirtualnego home stagingu (wizualizacja)",
  },
  keywords: ["wirtualny home staging", "cena", "home staging", "ogłoszenie", "wizualizacja"],
  body: [
    {
      type: "p",
      text: "Puste mieszkanie na zdjęciu wygląda zwykle na mniejsze, zimniejsze i trudniejsze do oceny, niż jest w rzeczywistości. Kupujący przewija ogłoszenie, widzi białe ściany i panele – i nie potrafi sobie wyobrazić, gdzie stanie sofa, a gdzie stół. Wirtualny home staging rozwiązuje ten problem bez wnoszenia ani jednego mebla. W tym artykule wyjaśniamy, czym dokładnie jest, jak przebiega, ile kosztuje i kiedy rzeczywiście się opłaca.",
    },
    { type: "h2", text: "Czym jest wirtualny home staging?" },
    {
      type: "p",
      text: "Wirtualny home staging (nazywany też wirtualną aranżacją lub cyfrowym stagingiem) to obróbka zdjęcia pustego pomieszczenia, w której cyfrowo dodaje się meble, dywany, oświetlenie, rośliny i dekoracje. Efektem jest wizualizacja pokazująca, jak wnętrze może wyglądać po urządzeniu. Architektura pomieszczenia – ściany, okna, drzwi, podłoga, wysokość i metraż – pozostaje taka sama jak na zdjęciu oryginalnym.",
    },
    {
      type: "p",
      text: "Dziś większość pracy wykonują modele sztucznej inteligencji, ale sama generacja to dopiero połowa sukcesu. Dobry wynik wymaga wyboru najlepszego wariantu i ręcznej korekty: proporcji mebli, cieni, odbić w podłodze i krawędzi przy oknach. Tym różni się usługa od samodzielnego klikania w aplikacji.",
    },
    { type: "h2", text: "Wirtualny a tradycyjny home staging" },
    {
      type: "p",
      text: "Tradycyjny home staging polega na fizycznym wstawieniu do lokalu wypożyczonych mebli i dodatków na czas sprzedaży. Daje świetny efekt także podczas prezentacji na żywo, ale ma swoją cenę i logistykę. Najważniejsze różnice:",
    },
    {
      type: "ul",
      items: [
        `Koszt: fizyczny staging całego mieszkania to orientacyjnie ${range(PHYSICAL_STAGING_COST)}, wirtualny – kwota liczona od zdjęcia.`,
        `Czas: przygotowanie fizycznego stagingu zajmuje zwykle ${PHYSICAL_STAGING_DAYS.min}–${PHYSICAL_STAGING_DAYS.max} dni plus sesję zdjęciową; wirtualny jest gotowy w ciągu doby.`,
        "Elastyczność: wirtualnie możesz pokazać ten sam pokój w kilku stylach i dopasować aranżację do grupy docelowej.",
        "Prezentacje: fizyczne meble zobaczy kupujący na miejscu; wirtualne – tylko na zdjęciach, dlatego warto pokazać też zdjęcie oryginalne.",
      ],
    },
    { type: "h2", text: "Jak wygląda proces krok po kroku" },
    {
      type: "ol",
      items: [
        "Robisz zdjęcia pustych pomieszczeń – wystarczy dobry telefon z obiektywem szerokokątnym.",
        "Wgrywasz je w formularzu i wybierasz styl aranżacji, np. skandynawski, nowoczesny lub japandi.",
        "Opcjonalnie zamawiasz dodatki, np. usunięcie starych mebli albo zamianę zdjęcia wieczornego na dzienne.",
        "Płacisz online – BLIK-iem, kartą lub szybkim przelewem.",
        "Specjalista generuje kilka wariantów, wybiera najlepszy i poprawia detale.",
        "Odbierasz gotowe pliki w pełnej rozdzielczości, z dyskretnym oznaczeniem „wizualizacja”.",
      ],
    },
    { type: "h2", text: "Ile kosztuje wirtualny home staging w Polsce?" },
    {
      type: "p",
      text: `Ceny na rynku są bardzo zróżnicowane, bo pod tą samą nazwą kryją się trzy różne usługi. Zagraniczne aplikacje AI „zrób to sam” kosztują w abonamencie orientacyjnie ${range(DIY_AI_COST_PER_PHOTO)} za zdjęcie, ale wybór wariantu i poprawki są po Twojej stronie. Agencje graficzne, które przygotowują każde zdjęcie ręcznie, liczą zwykle ${range(AGENCY_COST_PER_PHOTO)} za zdjęcie i potrzebują kilku dni.`,
    },
    {
      type: "p",
      text: `U nas jedno zdjęcie kosztuje ${formatPLNShort(PRICE_SINGLE)} brutto, a od ${formatPhotoCount(BULK_THRESHOLD)} w zamówieniu – ${formatPLNShort(PRICE_BULK)} za każde. Typowe ogłoszenie z sześcioma ujęciami to więc ${formatPLNShort(typicalOrder.total)}. Biura, które publikują dużo ofert, mogą wybrać abonament: ${formatPhotoCount(OFFICE_PLAN.photosPerMonth)} miesięcznie za ${formatPLNShort(OFFICE_PLAN.monthlyNet)} netto, czyli ok. ${formatPLNShort(OFFICE_PLAN_APPROX_NET_PER_PHOTO)} netto za zdjęcie.`,
      link: { href: ROUTES.pricing, label: "Zobacz pełny cennik i kalkulator" },
    },
    { type: "h2", text: "Co wpływa na cenę?" },
    {
      type: "ul",
      items: [
        "Liczba zdjęć – im więcej w jednym zamówieniu, tym niższa cena jednostkowa.",
        `Dodatki: ${addonList.join(", ")}.`,
        `Termin – realizacja ekspresowa (do ${SITE.expressHours} h) to dopłata ${Math.round(EXPRESS_RATE * 100)}% ceny bazowej.`,
        `Poprawki – sprawdź, ile jest w cenie. U nas ${INCLUDED_REVISIONS} bezpłatna poprawka dla każdego zdjęcia.`,
      ],
    },
    { type: "h2", text: "Kiedy wirtualny staging się opłaca, a kiedy nie" },
    {
      type: "p",
      text: "Wirtualna aranżacja daje najwięcej tam, gdzie zdjęcia pustego wnętrza są najsłabsze: w mieszkaniach po wyprowadzce lokatorów, w lokalach w stanie deweloperskim, w nietypowych układach (skosy, długie wąskie pokoje), a także przy wynajmie, gdy ogłoszenie musi wyróżnić się na tle dziesiątek podobnych. Opłaca się też przy nieruchomościach, których właściciel mieszka daleko i nie jest w stanie zorganizować fizycznego stagingu.",
    },
    {
      type: "p",
      text: "Mniej sensu ma przy mieszkaniach już ładnie urządzonych – tam wystarczy dobre zdjęcie i porządek. Nie zastąpi też remontu: jeżeli lokal ma wilgoć czy pęknięcia, wizualizacja nie może ich ukrywać, a kupujący i tak zobaczy je na miejscu.",
    },
    { type: "h2", text: "Na co uważać przy zamawianiu" },
    {
      type: "ul",
      items: [
        "Oznaczenie – każda wizualizacja powinna mieć napis „wizualizacja” lub równoważny opis w ogłoszeniu.",
        "Uczciwość – usługa nie może ukrywać wad lokalu ani zmieniać metrażu, układu czy widoku z okna.",
        "Realizm – meble muszą mieć właściwą skalę; zbyt mała sofa sprawia, że pokój wygląda na większy, niż jest.",
        "Prawa do zdjęć – jeśli zdjęcia zrobił fotograf, upewnij się, że możesz je przekazać do obróbki.",
        "Dane – zapytaj, jak długo usługodawca przechowuje pliki i czy wykorzystuje je do trenowania modeli.",
      ],
    },
    {
      type: "note",
      title: "Dobra praktyka",
      text: "W galerii ogłoszenia publikuj obok wizualizacji także zdjęcie oryginalne. Kupujący widzi wtedy jednocześnie stan faktyczny i potencjał wnętrza – i nie czuje się zaskoczony podczas oglądania.",
    },
    { type: "h2", text: "Podsumowanie" },
    {
      type: "p",
      text: `Wirtualny home staging to najtańszy i najszybszy sposób, by puste mieszkanie wyglądało na zdjęciach jak miejsce do życia. Kosztuje ułamek ceny tradycyjnego stagingu i jest gotowy w ciągu ${SITE.turnaroundHours} godzin. Warunek jest jeden: uczciwość wobec kupujących – oznaczona wizualizacja, prawdziwe proporcje i brak ukrywania wad.`,
      link: { href: ROUTES.freeSample, label: "Sprawdź efekt na własnym zdjęciu – darmowa próbka" },
    },
  ],
};
