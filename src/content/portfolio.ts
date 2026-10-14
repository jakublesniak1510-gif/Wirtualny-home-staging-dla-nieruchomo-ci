import type { StyleSlug } from "@/lib/styles";

export interface PortfolioItem {
  /** = slug stylu z src/lib/styles.ts */
  slug: StyleSlug;
  title: string;
  description: string;
  /** Metraż pomieszczenia (przykładowy), m². */
  area: number;
  room: string;
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  /** „Co zmieniliśmy” – 3 punkty. */
  changes: readonly [string, string, string];
  /** „Czego NIE zmieniliśmy” – elementy stałe lokalu (domyślnie UNCHANGED_DEFAULT + specyficzne). */
  unchanged: readonly string[];
}

/** Elementy, których nie zmieniamy na żadnej wizualizacji. */
export const UNCHANGED_DEFAULT = ["okna i widok za oknem", "ściany i układ pomieszczenia", "metraż i wysokość"] as const;

/**
 * Pary „przed/po” w /public/portfolio/{slug}-przed.svg i {slug}-po.svg.
 * To ilustracje poglądowe – aby podmienić na prawdziwe zdjęcia, wgraj pliki
 * (np. {slug}-przed.jpg / {slug}-po.jpg, proporcje 3:2) i zmień ścieżki poniżej.
 */
function paths(slug: StyleSlug) {
  return {
    beforeSrc: `/portfolio/${slug}-przed.svg`,
    afterSrc: `/portfolio/${slug}-po.svg`,
  };
}

export const PORTFOLIO: readonly PortfolioItem[] = [
  {
    slug: "skandynawski",
    title: "Jasny salon w bloku",
    description:
      "Pusty salon z dużym oknem zyskał przytulny charakter: jasna sofa, dębowy stolik i wełniany dywan.",
    area: 21,
    room: "Salon",
    ...paths("skandynawski"),
    beforeAlt: "Pusty, jasny salon z oknem i dębową podłogą – zdjęcie przed",
    afterAlt:
      "Ten sam salon w stylu skandynawskim z jasną sofą, okrągłym stolikiem, dywanem i rośliną – wizualizacja",
    changes: [
      "jasna sofa z poduszkami w kolorach stylu",
      "okrągły dębowy stolik i wełniany dywan",
      "lampa podłogowa, plakat i roślina w doniczce",
    ],
    unchanged: [...UNCHANGED_DEFAULT, "dębowa podłoga"],
  },
  {
    slug: "nowoczesny",
    title: "Salon w nowym apartamentowcu",
    description:
      "Surowe wnętrze od dewelopera pokazane jako gotowe do zamieszkania: grafitowa sofa i wyraziste akcenty.",
    area: 26,
    room: "Salon z aneksem",
    ...paths("nowoczesny"),
    beforeAlt: "Pusty salon z szarą podłogą w stanie deweloperskim – zdjęcie przed",
    afterAlt:
      "Ten sam salon w stylu nowoczesnym z grafitową sofą, czarnym stolikiem i lampą łukową – wizualizacja",
    changes: [
      "grafitowa sofa z koniakowymi akcentami",
      "czarny stolik kawowy i grafika na ścianie",
      "lampa łukowa i sansewieria",
    ],
    unchanged: [...UNCHANGED_DEFAULT, "szara posadzka"],
  },
  {
    slug: "loft",
    title: "Kawalerka w odnowionej kamienicy",
    description:
      "Ceglana ściana aż prosiła się o industrialny klimat: skórzana sofa, metal i ciemne drewno.",
    area: 18,
    room: "Pokój dzienny",
    ...paths("loft"),
    beforeAlt: "Pusty pokój z ceglaną ścianą i ciemną podłogą – zdjęcie przed",
    afterAlt:
      "Ten sam pokój w stylu loft ze skórzaną sofą, metalowym stolikiem i lampą na trójnogu – wizualizacja",
    changes: [
      "skórzana sofa w kolorze koniaku",
      "stolik z drewna i czarnego metalu, industrialna lampa",
      "dywan, roślina i grafika w czarnej ramie",
    ],
    unchanged: [...UNCHANGED_DEFAULT, "ceglana ściana", "ciemna podłoga z desek"],
  },
  {
    slug: "klasyczny",
    title: "Salon w przedwojennej kamienicy",
    description:
      "Wysokie wnętrze ze sztukaterią podkreśliły granatowy welur, mosiężne detale i żyrandol.",
    area: 32,
    room: "Salon",
    ...paths("klasyczny"),
    beforeAlt: "Pusty salon ze sztukaterią na ścianach i parkietem – zdjęcie przed",
    afterAlt:
      "Ten sam salon w stylu klasycznym z granatową sofą, marmurowym stolikiem i żyrandolem – wizualizacja",
    changes: [
      "granatowa welurowa sofa i marmurowy stolik",
      "żyrandol ze świecami i obrazy w złotych ramach",
      "dywan z bordiurą, stolik boczny z lampą",
    ],
    unchanged: [...UNCHANGED_DEFAULT, "sztukateria na ścianie", "parkiet"],
  },
  {
    slug: "boho",
    title: "Mieszkanie na wynajem",
    description:
      "Ciepłe barwy, rattan i rośliny – aranżacja, która wyróżnia ogłoszenie na portalach wynajmu.",
    area: 19,
    room: "Pokój dzienny",
    ...paths("boho"),
    beforeAlt: "Pusty pokój w ciepłych barwach z drewnianą podłogą – zdjęcie przed",
    afterAlt:
      "Ten sam pokój w stylu boho z rattanową lampą, okrągłym dywanem z juty i roślinami – wizualizacja",
    changes: [
      "jasna sofa z kolorowymi poduszkami",
      "okrągły dywan z juty, pufa z terakoty",
      "rattanowa lampa, makrama i dwie rośliny",
    ],
    unchanged: [...UNCHANGED_DEFAULT, "drewniana podłoga"],
  },
  {
    slug: "japandi",
    title: "Salon w domu szeregowym",
    description:
      "Spokojna, minimalistyczna aranżacja z niskimi meblami i naturalnym drewnem.",
    area: 24,
    room: "Salon",
    ...paths("japandi"),
    beforeAlt: "Pusty salon z jasnymi ścianami i drewnianą podłogą – zdjęcie przed",
    afterAlt:
      "Ten sam salon w stylu japandi z niską sofą, drewnianym stolikiem i papierową lampą – wizualizacja",
    changes: [
      "niska sofa w kolorze piasku",
      "niski stolik z ciemnego drewna",
      "papierowa lampa, okrągła lampa podłogowa i roślina",
    ],
    unchanged: [...UNCHANGED_DEFAULT, "drewniana podłoga"],
  },
];

export function getPortfolioItem(slug: StyleSlug): PortfolioItem | undefined {
  return PORTFOLIO.find((item) => item.slug === slug);
}
