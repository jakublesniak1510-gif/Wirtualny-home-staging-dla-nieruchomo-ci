import { FILE_RETENTION_DAYS } from "@/content/legal";
import { ROUTES } from "@/lib/site";
import type { BlogPostSource } from "./types";

export const post: BlogPostSource = {
  slug: "wirtualny-staging-a-prawo-co-wolno-a-czego-nie",
  title: "Wirtualny staging a prawo: co wolno, a czego nie (oznaczenie wizualizacji, wady, metraż)",
  description:
    "Czy wirtualny home staging jest legalny? Jak oznaczać wizualizacje, czego nie wolno zmieniać na zdjęciach i jakie przepisy mają znaczenie dla agentów i sprzedających.",
  publishedAt: "2026-10-07",
  category: "prawo",
  summary: [
    "Wirtualna aranżacja jest legalna – problemem jest dopiero wprowadzanie kupującego w błąd co do stanu, wielkości lub otoczenia lokalu.",
    "Wizualizację zawsze oznaczaj, nie ukrywaj wad, nie zmieniaj metrażu, układu ani widoku z okna i publikuj też zdjęcie oryginalne.",
    "Upewnij się, że masz prawa do zdjęć i że nie zawierają danych osobowych. Ten artykuł nie jest poradą prawną.",
  ],
  image: {
    src: "/portfolio/klasyczny-po.svg",
    alt: "Salon w kamienicy po wirtualnej aranżacji w stylu klasycznym z widocznym oznaczeniem „wizualizacja”",
  },
  keywords: ["prawo", "oznaczenie wizualizacji", "wirtualny home staging", "ogłoszenie", "uczciwość"],
  body: [
    {
      type: "p",
      text: "Wirtualny home staging budzi czasem pytanie: czy to w ogóle uczciwe? Przecież na zdjęciu są meble, których w mieszkaniu nie ma. Odpowiedź jest prosta: pokazywanie, jak wnętrze może wyglądać po urządzeniu, jest w porządku – pod warunkiem, że kupujący wie, że ogląda wizualizację, i że obraz nie zmienia tego, co w lokalu jest naprawdę. Poniżej porządkujemy zasady i wskazujemy przepisy, o których warto pamiętać.",
    },
    {
      type: "note",
      title: "Zastrzeżenie",
      text: "Artykuł ma charakter informacyjny i nie stanowi porady prawnej. W konkretnej sprawie skonsultuj się z prawnikiem.",
    },
    { type: "h2", text: "Czy wirtualny home staging jest legalny?" },
    {
      type: "p",
      text: "Tak. Żaden przepis nie zakazuje obróbki zdjęć nieruchomości ani dodawania do nich mebli. Granica przebiega gdzie indziej: między pokazaniem potencjału a wprowadzeniem w błąd. Dopóki wizualizacja dotyczy elementów ruchomych – mebli, dekoracji, oświetlenia – i jest wyraźnie oznaczona, kupujący dostaje dodatkową informację, a nie fałszywą.",
    },
    { type: "h2", text: "Które przepisy mają znaczenie" },
    {
      type: "ul",
      items: [
        "Ustawa z 23 sierpnia 2007 r. o przeciwdziałaniu nieuczciwym praktykom rynkowym – zakazuje praktyk wprowadzających konsumenta w błąd, zarówno przez działanie (np. nieprawdziwy obraz cech produktu), jak i przez zaniechanie (pominięcie istotnych informacji). Dotyczy przedsiębiorców, a więc m.in. biur nieruchomości i deweloperów.",
        "Kodeks cywilny – przepisy o rękojmi za wady. Sprzedający odpowiada m.in. za to, że rzecz nie ma właściwości, o których zapewniał kupującego. Zdjęcia i opis z ogłoszenia mogą być w sporze dowodem, jak lokal przedstawiano.",
        "Prawo autorskie – zdjęcie wykonane przez fotografa jest jego utworem, a wizualizacja na jego podstawie to opracowanie, na którego wykorzystanie co do zasady potrzebna jest zgoda autora.",
        "RODO – zdjęcia wnętrz mogą zawierać dane osobowe: dokumenty, zdjęcia rodzinne, nazwiska na korespondencji.",
        "Rozporządzenie UE o sztucznej inteligencji (AI Act) – wprowadza obowiązki przejrzystości dla treści wygenerowanych lub zmanipulowanych przez AI; część z nich stosuje się od sierpnia 2026 r. Oznaczenie „wizualizacja” to najprostszy sposób, by spełnić ich ducha.",
      ],
    },
    { type: "h2", text: "Co wolno: bezpieczny zakres zmian" },
    {
      type: "ul",
      items: [
        "dodać meble, dywany, oświetlenie, rośliny i dekoracje,",
        "usunąć cyfrowo stare meble i przedmioty, które nie zostają w lokalu,",
        "pokazać możliwy kolor ścian lub inną podłogę – z jasnym opisem, że to propozycja wykończenia,",
        "rozjaśnić zdjęcie wieczorne lub pochmurne, zachowując rzeczywisty widok za oknem,",
        "pokazać ten sam pokój w kilku stylach, by ułatwić kupującym wyobrażenie sobie wnętrza.",
      ],
    },
    { type: "h2", text: "Czego nie wolno: czerwone linie" },
    {
      type: "ul",
      items: [
        "ukrywać wad: pęknięć, zacieków, wilgoci, grzyba, uszkodzonej stolarki czy instalacji,",
        "zmieniać metrażu ani proporcji – np. „rozciągać” pokój albo stosować meble w zaniżonej skali, by wnętrze wyglądało na większe,",
        "dodawać, przesuwać lub usuwać okna, drzwi i ściany – układ musi odpowiadać rzeczywistości,",
        "zmieniać widoku z okna i otoczenia budynku – zieleń w miejscu parkingu to klasyczne wprowadzenie w błąd,",
        "usuwać elementów stałych, które zostają w lokalu: grzejników, pionów, skosów, belek.",
      ],
    },
    {
      type: "note",
      title: "Test zdrowego rozsądku",
      text: "Zadaj sobie pytanie: czy kupujący, który zobaczy mieszkanie na żywo, poczuje się oszukany? Jeżeli różnica dotyczy tylko mebli i dekoracji – nie. Jeżeli pokój okaże się mniejszy, ciemniejszy albo z wadą, której nie było na zdjęciu – tak.",
    },
    { type: "h2", text: "Jak oznaczać wizualizację" },
    {
      type: "p",
      text: "Najprostsza i najskuteczniejsza metoda to napis „wizualizacja” bezpośrednio na zdjęciu – dyskretny, ale czytelny, w miejscu, którego nie da się łatwo przyciąć. Dzięki temu oznaczenie „podróżuje” razem z plikiem, nawet gdy zdjęcie trafi na inny portal lub do mediów społecznościowych. Dodatkowo warto dopisać jedno zdanie w treści ogłoszenia, np.: „Część zdjęć to wizualizacje aranżacji – meble nie są wyposażeniem lokalu”.",
    },
    {
      type: "p",
      text: "Zalecamy też publikowanie zdjęcia oryginalnego, np. bezpośrednio po wizualizacji w galerii. Kupujący widzi wtedy jednocześnie stan faktyczny i potencjał, a Ty masz mocny argument, że niczego nie ukrywałeś.",
    },
    {
      type: "p",
      text: "Nie usuwaj ani nie zasłaniaj oznaczenia przy kadrowaniu zdjęć do mediów społecznościowych. Jeżeli format wymaga przycięcia, dodaj informację o wizualizacji w opisie posta. To drobiazg, który w razie sporu ma duże znaczenie.",
    },
    { type: "h2", text: "Regulaminy portali ogłoszeniowych" },
    {
      type: "p",
      text: "Portale nieruchomości wymagają, by treść ogłoszenia – w tym zdjęcia – odpowiadała rzeczywistości i nie wprowadzała w błąd. Zasady szczegółowe zmieniają się, a niektóre serwisy wprowadzają oznaczenia treści generowanych przez AI. Przed publikacją warto co jakiś czas zajrzeć do aktualnego regulaminu portalu, z którego korzystasz najczęściej.",
    },
    { type: "h2", text: "Prawa do zdjęć i dane osobowe" },
    {
      type: "p",
      text: "Jeśli zdjęcia robił fotograf, upewnij się, że umowa pozwala na ich obróbkę i publikację opracowań. Przy zamówieniu prosimy o oświadczenie, że masz do zdjęć odpowiednie prawa. Zanim zrobisz zdjęcia, usuń z kadru rzeczy osobiste – to prostsze niż późniejszy retusz. Przesłane pliki przechowujemy tylko przez czas potrzebny do realizacji i obsługi poprawek, a następnie usuwamy je automatycznie po " +
        `${FILE_RETENTION_DAYS} dniach.`,
      link: { href: ROUTES.privacy, label: "Polityka prywatności" },
    },
    { type: "h2", text: "Jak pracujemy my" },
    {
      type: "ul",
      items: [
        "każde zdjęcie wynikowe dostaje automatycznie napis „wizualizacja”,",
        "nie ukrywamy wad i nie zmieniamy metrażu, układu ani widoku z okna,",
        "przy zamówieniu potwierdzasz, że będziesz publikować wizualizację w sposób niewprowadzający w błąd,",
        "zalecamy publikowanie zdjęcia oryginalnego obok wizualizacji.",
      ],
    },
    { type: "h2", text: "Podsumowanie" },
    {
      type: "p",
      text: "Wirtualny home staging jest legalny i uczciwy, jeśli traktujesz go jako sposób na pokazanie potencjału, a nie na zmianę rzeczywistości. Oznaczaj wizualizacje, nie ruszaj architektury, wad ani widoku, publikuj zdjęcie oryginalne i dbaj o prawa do zdjęć. To chroni kupującego, Ciebie i Twoją reputację.",
      link: { href: `${ROUTES.howItWorks}#co-robimy`, label: "Co zmieniamy, a czego nie robimy" },
    },
  ],
};
