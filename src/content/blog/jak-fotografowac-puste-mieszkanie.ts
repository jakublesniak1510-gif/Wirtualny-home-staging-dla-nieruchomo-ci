import {
  ACCEPTED_FORMATS_TEXT,
  MAX_UPLOAD_MB_TEXT,
  MIN_PHOTO_SHORT_SIDE_PX,
  RECOMMENDED_PHOTO_LONG_SIDE_PX,
} from "@/content/service";
import { getAddon } from "@/lib/pricing";
import { ROUTES } from "@/lib/site";
import type { BlogPostSource } from "./types";

export const post: BlogPostSource = {
  slug: "jak-fotografowac-puste-mieszkanie-do-wirtualnego-stagingu",
  title: "Jak fotografować puste mieszkanie do wirtualnego stagingu",
  description:
    "Praktyczny poradnik: jak zrobić telefonem zdjęcia pustego mieszkania, które dobrze nadają się do wirtualnego home stagingu. Kadr, światło, wysokość i najczęstsze błędy.",
  publishedAt: "2026-09-16",
  category: "poradniki",
  summary: [
    "Fotografuj poziomo, z wysokości ok. 1,2–1,5 m, z rogu pokoju – tak, by w kadrze była podłoga i co najmniej dwie ściany.",
    "Najlepsze światło to dzienne, rozproszone: odsłonięte okna, zapalone lampy, bez fotografowania pod słońce.",
    "Proste pionowe linie i ostre, jasne zdjęcie to połowa sukcesu – resztę zrobi wizualizacja.",
  ],
  image: {
    src: "/portfolio/japandi-przed.svg",
    alt: "Puste, jasne pomieszczenie z oknem i drewnianą podłogą – przykład dobrego zdjęcia wejściowego",
  },
  keywords: ["zdjęcia nieruchomości", "fotografia wnętrz", "poradnik", "wirtualny home staging", "telefon"],
  body: [
    {
      type: "p",
      text: "Jakość wizualizacji zależy w dużej mierze od zdjęcia, które do nas trafia. Model sztucznej inteligencji i retuszer pracują na tym, co widać w kadrze: jeśli podłoga jest ucięta, ściany „walą się” do środka, a okno jest białą plamą, nawet najlepsza aranżacja nie będzie wyglądała naturalnie. Dobra wiadomość: nie potrzebujesz profesjonalnego aparatu. Wystarczy współczesny telefon i kilka prostych zasad, które opisujemy poniżej.",
    },
    { type: "h2", text: "Przygotuj wnętrze przed zdjęciem" },
    {
      type: "ul",
      items: [
        "Usuń z kadru kartony, worki, drabiny i narzędzia – nawet drobne przedmioty utrudniają wstawienie mebli.",
        "Schowaj rzeczy osobiste: dokumenty, zdjęcia rodzinne, korespondencję. To kwestia prywatności (RODO).",
        "Umyj okna i odsłoń zasłony – czyste szyby wpuszczają więcej światła.",
        "Zapal wszystkie lampy, także w sąsiednich pomieszczeniach widocznych przez drzwi.",
        `Większych mebli nie musisz wynosić – możemy je usunąć cyfrowo (dodatek „${getAddon("usuniecie-mebli").name}”).`,
      ],
    },
    { type: "h2", text: "Ustawienia telefonu" },
    {
      type: "p",
      text: "Włącz w aparacie siatkę pomocniczą – ułatwi trzymanie linii prosto. Jeśli Twój telefon ma obiektyw ultraszerokokątny (oznaczany zwykle jako 0,5×), użyj go, ale nie przesadzaj: w małych pomieszczeniach zbyt szeroki kąt mocno zniekształca proporcje przy krawędziach kadru. Wyłącz filtry i tryby „upiększające”. Tryb HDR zostaw włączony – pomoże wyrównać jasność okna i wnętrza.",
    },
    {
      type: "p",
      text: `Zapisuj zdjęcia w najwyższej dostępnej rozdzielczości. Przyjmujemy pliki ${ACCEPTED_FORMATS_TEXT} do ${MAX_UPLOAD_MB_TEXT} MB, minimum ${MIN_PHOTO_SHORT_SIDE_PX} px na krótszym boku – najlepiej ${RECOMMENDED_PHOTO_LONG_SIDE_PX} px i więcej na dłuższym. Nie wysyłaj zrzutów ekranu ani zdjęć przesłanych wcześniej przez komunikator, bo te są mocno skompresowane.`,
    },
    { type: "h2", text: "Kadr: skąd i jak fotografować" },
    {
      type: "ol",
      items: [
        "Stań w rogu pokoju lub w drzwiach, naprzeciwko najciekawszej ściany albo okna.",
        "Trzymaj telefon poziomo (orientacja pozioma), na wysokości ok. 1,2–1,5 m – mniej więcej na wysokości klatki piersiowej.",
        "Trzymaj telefon pionowo względem podłogi – nie pochylaj go w dół ani w górę. Pionowe krawędzie ścian i drzwi powinny być na zdjęciu pionowe.",
        "Zadbaj, by w kadrze była podłoga i co najmniej dwie ściany. Bez podłogi nie ma gdzie „postawić” mebli.",
        "Zrób 2–3 ujęcia z różnych narożników – wybierzesz najlepsze, zanim wyślesz.",
      ],
    },
    {
      type: "note",
      title: "Szybki test",
      text: "Spójrz na framugę drzwi lub narożnik pokoju na zdjęciu. Jeśli linia jest wyraźnie pochylona, popraw ułożenie telefonu i zrób zdjęcie ponownie. To najczęstszy błąd, a jednocześnie najłatwiejszy do uniknięcia.",
    },
    { type: "h2", text: "Światło: dzień, nie słońce" },
    {
      type: "p",
      text: "Najlepsze warunki to jasny dzień z rozproszonym światłem – lekkie zachmurzenie bywa lepsze niż pełne słońce. Unikaj fotografowania prosto pod światło (okno naprzeciwko obiektywu przy ostrym słońcu), bo wnętrze wyjdzie ciemne, a okno prześwietlone. Jeśli nie masz wyboru, ustaw się bokiem do okna.",
    },
    {
      type: "p",
      text: `Zdjęcie po zmroku albo w ponury dzień też da się uratować – służy do tego dodatek „${getAddon("noc-dzien").name}”, w którym zamieniamy wieczorne ujęcie na jasne, dzienne. Pamiętaj jednak, że nie zmieniamy widoku za oknem: jeśli jest tam ściana sąsiedniego bloku, zostanie na wizualizacji.`,
    },
    { type: "h2", text: "Jakie pomieszczenia fotografować" },
    {
      type: "p",
      text: "Największy efekt daje aranżacja salonu, sypialni i pokoju dziecięcego, bo tam kupujący najtrudniej wyobrażają sobie skalę. Kuchnia z zabudową zwykle broni się sama, ale pusta przestrzeń jadalni przy kuchni zyskuje na stole i krzesłach. Łazienki i korytarze rzadko wymagają stagingu – wystarczy dobre, jasne zdjęcie. Przy kawalerkach warto pokazać, jak pogodzić strefę dzienną i nocną w jednym pokoju.",
    },
    { type: "h2", text: "Najczęstsze błędy" },
    {
      type: "ul",
      items: [
        "Zdjęcie pionowe – na portalach wyświetla się z czarnymi pasami i mieści mniej wnętrza.",
        "Telefon pochylony w dół – ściany zbiegają się, a pokój wygląda na niższy.",
        "Kadr z samą ścianą i oknem, bez podłogi – nie ma gdzie umieścić mebli.",
        "Lustro lub szyba z odbiciem fotografującego – trzeba je potem retuszować.",
        "Zbyt ciemne, poruszone zdjęcie – szczegóły znikają w szumie i nie da się ich odtworzyć.",
      ],
    },
    { type: "h2", text: "Lista kontrolna przed wysłaniem" },
    {
      type: "ul",
      items: [
        "Zdjęcie jest poziome i ostre – sprawdź je w powiększeniu, a nie tylko w miniaturze.",
        "Pionowe linie ścian i drzwi są pionowe.",
        "W kadrze widać podłogę i co najmniej dwie ściany.",
        "Okno nie jest jednolitą białą plamą, a wnętrze nie jest ciemne.",
        "W kadrze nie ma dokumentów, zdjęć rodzinnych ani innych rzeczy osobistych.",
        "Masz prawa do zdjęcia – zrobiłeś je sam albo masz zgodę fotografa.",
      ],
    },
    {
      type: "p",
      text: "Jeśli zdjęcia wykonał profesjonalny fotograf nieruchomości, zwykle spełniają wszystkie te warunki – wystarczy poprosić o wersję w pełnej rozdzielczości, bez znaków wodnych fotografa. Zdjęcia z drona czy ujęcia elewacji nie nadają się do aranżacji wnętrz, ale mogą uzupełnić galerię ogłoszenia.",
    },
    { type: "h2", text: "Co, jeśli zdjęcie się nie nada?" },
    {
      type: "p",
      text: "Zanim zaczniemy pracę, oglądamy każde zdjęcie. Jeśli jest zbyt ciemne, rozmyte albo kadr nie pozwala na sensowną aranżację, napiszemy do Ciebie – możesz przesłać inne ujęcie albo odzyskać pieniądze za to zdjęcie. Wolimy odrzucić zlecenie niż oddać słabą pracę.",
      link: { href: `${ROUTES.howItWorks}#zdjecia`, label: "Wymagania techniczne i lista kontrolna" },
    },
    { type: "h2", text: "Podsumowanie" },
    {
      type: "p",
      text: "Dobre zdjęcie do wirtualnego stagingu to zdjęcie poziome, proste, jasne i z podłogą w kadrze. Pięć minut przygotowania pokoju i kilka ujęć z różnych narożników wystarczy, by wizualizacja wyglądała naturalnie, a ogłoszenie przyciągało uwagę. Masz już zdjęcia? Sprawdź, jak będą wyglądały po aranżacji.",
      link: { href: ROUTES.order, label: "Wgraj zdjęcia i zamów wizualizację" },
    },
  ],
};
