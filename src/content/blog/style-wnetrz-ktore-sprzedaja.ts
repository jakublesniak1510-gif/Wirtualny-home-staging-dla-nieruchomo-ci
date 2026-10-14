import { ROUTES } from "@/lib/site";
import { STYLES, getStyle } from "@/lib/styles";
import type { StyleSlug } from "@/lib/styles";
import type { BlogBlock, BlogPostSource } from "./types";

/** Dla jakich nieruchomości i kupujących sprawdza się dany styl. */
const GUIDE: Record<StyleSlug, { intro: string; bestFor: readonly string[]; avoid: string }> = {
  skandynawski: {
    intro:
      "Najbezpieczniejszy wybór dla większości mieszkań w Polsce. Jasne kolory optycznie powiększają wnętrze, a prosta forma mebli nie odwraca uwagi od samego lokalu.",
    bestFor: [
      "mieszkania w blokach z lat 70.–90. i z rynku wtórnego,",
      "małe metraże i kawalerki, w których liczy się każdy metr,",
      "kupujących szukających pierwszego mieszkania i młode rodziny.",
    ],
    avoid: "Ostrożnie w bardzo ciemnych wnętrzach od północy – biel na zdjęciu może wyglądać szaro.",
  },
  nowoczesny: {
    intro:
      "Czyste linie, ciemne akcenty i wyraziste dodatki. Styl, który dobrze komunikuje „nowe, miejskie, bez kompromisów”.",
    bestFor: [
      "apartamenty w nowych inwestycjach i stan deweloperski,",
      "mieszkania z dużymi przeszkleniami i otwartą kuchnią,",
      "kupujących inwestycyjnie oraz profesjonalistów z dużych miast.",
    ],
    avoid: "W małych, niskich pomieszczeniach ciemna sofa i grafitowe dodatki mogą przytłaczać.",
  },
  loft: {
    intro:
      "Skóra, metal i stare drewno. Loft potrzebuje charakteru we wnętrzu – cegły, wysokiego sufitu, dużych okien – i wtedy wygląda autentycznie.",
    bestFor: [
      "kamienice i budynki poprzemysłowe po rewitalizacji,",
      "mieszkania z ceglaną ścianą, betonem lub belkami stropowymi,",
      "kupujących ceniących unikalność i najem krótkoterminowy.",
    ],
    avoid: "W typowym mieszkaniu w bloku loft często wygląda sztucznie – lepiej wybrać styl nowoczesny.",
  },
  klasyczny: {
    intro:
      "Symetria, welur, mosiądz i marmur. Elegancja, która podkreśla wysokie sufity, sztukaterie i parkiet w jodełkę.",
    bestFor: [
      "przedwojenne kamienice i apartamenty w prestiżowych lokalizacjach,",
      "duże salony z oknami od podłogi i oryginalnymi detalami,",
      "kupujących dojrzałych, szukających reprezentacyjnego wnętrza.",
    ],
    avoid: "W kompaktowych mieszkaniach ciężkie meble i dużo dekoracji zabierają przestrzeń.",
  },
  boho: {
    intro:
      "Rattan, juta, terakota i mnóstwo zieleni. Ciepły, swobodny styl, który zatrzymuje wzrok podczas przewijania ogłoszeń.",
    bestFor: [
      "mieszkania na wynajem, zwłaszcza dla studentów i młodych osób,",
      "lokale z dużą ilością naturalnego światła i drewnianą podłogą,",
      "najem krótkoterminowy, gdzie liczy się klimat na zdjęciach.",
    ],
    avoid: "Przy sprzedaży mieszkań premium bywa zbyt swobodny – lepiej sprawdzi się japandi.",
  },
  japandi: {
    intro:
      "Połączenie japońskiego minimalizmu i skandynawskiej przytulności: niskie meble, naturalne drewno, len i ziemiste barwy.",
    bestFor: [
      "nowe mieszkania i domy szeregowe o spokojnej architekturze,",
      "wnętrza z dużymi oknami i drewnianą podłogą,",
      "kupujących ceniących spokój, jakość i ponadczasowość.",
    ],
    avoid: "W bardzo małych pokojach niskie meble mogą zaburzać odczucie skali – dobierz je z umiarem.",
  },
};

const styleBlocks: BlogBlock[] = STYLES.flatMap((style) => {
  const guide = GUIDE[style.slug];
  return [
    { type: "h2", text: `${style.name}` } as const,
    { type: "p", text: `${guide.intro} Charakterystyczne elementy: ${style.keywords.join(", ")}.` } as const,
    { type: "ul", items: guide.bestFor.map((item) => `Pasuje do: ${item}`) } as const,
    {
      type: "p",
      text: guide.avoid,
      link: { href: `${ROUTES.order}?styl=${style.slug}`, label: `Zamów aranżację w stylu ${style.name.toLowerCase()}` },
    } as const,
  ];
});

export const post: BlogPostSource = {
  slug: "6-stylow-wnetrz-ktore-sprzedaja",
  title: "6 stylów wnętrz, które sprzedają: który wybrać do jakiego mieszkania",
  description:
    "Skandynawski, nowoczesny, loft, klasyczny, boho czy japandi? Podpowiadamy, który styl aranżacji wybrać do bloku, kamienicy, stanu deweloperskiego i mieszkania na wynajem.",
  publishedAt: "2026-09-30",
  category: "style",
  summary: [
    "Styl dobieraj do budynku i kupującego, a nie do własnego gustu – aranżacja ma pokazać potencjał konkretnego wnętrza.",
    `W blokach najczęściej sprawdza się styl ${getStyle("skandynawski").name.toLowerCase()}, w kamienicach – klasyczny lub loft, w nowych inwestycjach – nowoczesny i japandi.`,
    "Przy wynajmie liczy się klimat na zdjęciach – boho i skandynawski wyróżniają ogłoszenie w wynikach wyszukiwania.",
  ],
  image: {
    src: "/portfolio/salon-demo-japandi.svg",
    alt: "Ten sam salon urządzony w stylu japandi – jeden z sześciu stylów aranżacji (wizualizacja)",
  },
  keywords: ["style wnętrz", "aranżacja", "skandynawski", "japandi", "loft", "wynajem"],
  body: [
    {
      type: "p",
      text: `Wybór stylu aranżacji to jedna z pierwszych decyzji przy zamawianiu wirtualnego home stagingu – i jedna z najważniejszych. Ten sam salon urządzony w stylu loft i klasycznym trafi do zupełnie innych kupujących. Poniżej omawiamy ${STYLES.length} stylów, które oferujemy, i podpowiadamy, do jakich nieruchomości pasują najlepiej.`,
    },
    { type: "h2", text: "Zasada pierwsza: styl dla kupującego, nie dla sprzedającego" },
    {
      type: "p",
      text: "Aranżacja w ogłoszeniu nie jest projektem wnętrza na lata. Ma pomóc konkretnej grupie odbiorców wyobrazić sobie życie w tym miejscu. Zadaj sobie trzy pytania: kto najczęściej kupuje lub wynajmuje podobne mieszkania w tej okolicy, jaki jest charakter budynku i co jest największym atutem lokalu – światło, wysokość, widok, metraż? Styl powinien ten atut podkreślić, a nie z nim konkurować.",
    },
    {
      type: "note",
      title: "Gdy masz wątpliwości",
      text: "Wybierz styl neutralny – skandynawski albo japandi. Rzadko kogoś zniechęcają, a dobrze pokazują skalę i funkcję pomieszczeń. Możesz też zamówić jedno zdjęcie w dwóch stylach i porównać reakcje.",
    },
    ...styleBlocks,
    { type: "h2", text: "Ściągawka: styl a typ nieruchomości" },
    {
      type: "ul",
      items: [
        "Blok z rynku wtórnego – skandynawski, japandi.",
        "Stan deweloperski w nowej inwestycji – nowoczesny, japandi, skandynawski.",
        "Kamienica z wysokim sufitem i detalami – klasyczny lub loft (przy cegle i betonie).",
        "Mieszkanie na wynajem dla młodych osób – boho, skandynawski.",
        "Apartament premium – klasyczny, nowoczesny lub japandi.",
      ],
    },
    { type: "h2", text: "Spójność w całym ogłoszeniu" },
    {
      type: "p",
      text: "Wszystkie pomieszczenia w jednym ogłoszeniu aranżuj w tym samym stylu. Salon w stylu boho i sypialnia w klasycznym sprawiają wrażenie przypadkowego zbioru zdjęć, a kupujący zaczyna się zastanawiać, co jest prawdziwe. Wyjątkiem może być pokój dziecięcy, który rządzi się swoimi prawami – ale i tu warto zachować wspólną paletę kolorów.",
    },
    {
      type: "p",
      text: "Pamiętaj też, że styl dotyczy mebli i dodatków, a nie architektury. Nie zmieniamy okien, ścian ani układu – jeśli chcesz pokazać inną podłogę lub kolor ścian, skorzystaj z dodatku „wirtualny remont”, a w ogłoszeniu opisz, co jest wizualizacją.",
    },
    { type: "h2", text: "Podsumowanie" },
    {
      type: "p",
      text: "Najlepiej sprzedaje styl dopasowany do budynku i odbiorcy. Skandynawski i japandi to bezpieczne wybory dla większości mieszkań, nowoczesny pasuje do nowych inwestycji, loft i klasyczny – do kamienic z charakterem, a boho ożywia ogłoszenia na wynajem. Zobacz, jak ten sam pokój wygląda w każdym z sześciu stylów.",
      link: { href: `${ROUTES.home}#style`, label: "Przełącznik „Ten sam pokój w 6 stylach”" },
    },
  ],
};
