# Wirtualny home staging dla nieruchomości – propozycja po recenzji

Dokument zawiera oryginalną propozycję z poprawkami. Zmiany względem wersji wyjściowej są oznaczone **[ZMIANA]**, a uzupełnienia **[DODANE]**.

## 1. Oferta

Pośrednik lub właściciel wysyła zdjęcie pustego mieszkania, a w ciągu 24 h dostaje to samo wnętrze umeblowane w wybranym stylu. Umeblowane zdjęcia przyciągają więcej kliknięć na portalach ogłoszeniowych, a fizyczny home staging kosztuje tysiące złotych.

**[DODANE] Gwarancje, które warto obiecać od pierwszego dnia:**
- Termin: 24 h w dni robocze, opcja ekspres do 6 h za dopłatą 50 %.
- Jedna bezpłatna runda poprawek (np. zmiana koloru sofy, usunięcie elementu).
- Zwrot pieniędzy, jeśli zdjęcie wejściowe nie nadaje się do obróbki (zbyt ciemne, rozmyte) – lepiej odrzucić zlecenie niż oddać słabą pracę.

## 2. Dla kogo

- Biura nieruchomości i niezależni agenci (główny klient, zamawiają regularnie).
- Deweloperzy sprzedający mieszkania w stanie deweloperskim.
- Osoby prywatne sprzedające lub wynajmujące mieszkanie.
- **[DODANE]** Fotografowie nieruchomości – mogą odsprzedawać usługę swoim klientom (kanał partnerski, rabat 30 %).
- **[DODANE]** Firmy od najmu krótkoterminowego (Airbnb/Booking) – staging przed sezonem.

## 3. Jak działa strona

1. Klient wgrywa 1–20 zdjęć i wybiera styl.
   **[ZMIANA]** Style: skandynawski, nowoczesny, loft, klasyczny **+ boho i japandi** – te dwa są obecnie bardzo popularne w polskich ogłoszeniach i prawie nic nie kosztują w obsłudze.
2. Opcjonalnie: usunięcie starych mebli, wirtualny remont (podłoga, ściany), noc → dzień.
3. Płaci BLIK-iem, kartą lub Przelewy24 albo używa kodu pakietu.
   **[ZMIANA]** Zamiast własnego systemu „kredytów na koncie” (wymaga logowania i kont użytkowników) na start wystarczą **kody pakietów** wysyłane mailem – prostsze i wystarczające dla biur.
4. Ty generujesz 2–4 warianty, wybierasz najlepszy, poprawiasz błędy i odsyłasz.
5. Każde zdjęcie dostaje dyskretny znak „wizualizacja”.
   **[DODANE]** Znak wodny nakładany automatycznie przez system przy wgrywaniu wyniku – nie da się o nim zapomnieć.

## 4. Narzędzia AI

- Gotowe serwisy z API (ReimagineHome, Virtual Staging AI, Collov, Styldod) – najszybszy start.
  **[DODANE]** Przed wyborem sprawdź: (a) czy regulamin pozwala na odsprzedaż komercyjną, (b) czy zdjęcia klientów nie są używane do trenowania modeli (ważne dla RODO i umów z biurami), (c) koszt przy 200 zdj./mies.
- Własny proces: Stable Diffusion + ControlNet albo modele edycji obrazu (Flux Kontext, Gemini image editing, GPT image) – tańszy przy skali.
  **[ZMIANA]** Realistyczna kolejność: start na gotowym serwisie, a po 2–3 miesiącach, gdy znasz typowe błędy i masz >100 zdjęć/mies., buduj własny proces. Nie rób tego od razu – to opóźni pierwszy przychód o tygodnie.
- Photoshop (lub Affinity Photo/Photopea – tańsze) do poprawek.

## 5. Ceny i ekonomia

| Pakiet | Cena dla klienta (brutto) | Twój koszt AI (orient.) |
|---|---|---|
| 1 zdjęcie | 39 zł | 1–5 zł |
| Od 10 zdjęć w zamówieniu | 29 zł/szt (10 szt = 290 zł) | 10–50 zł |
| Dodatki (usunięcie mebli / remont / noc→dzień) | +15 / +25 / +15 zł za zdjęcie | ~1–3 zł |
| Ekspres do 6 h | +50 % | 0 zł |
| Abonament dla biura (40 zdjęć/mies.) | 799 zł/mies. netto | 40–200 zł |

Pięć biur na abonamencie to ok. 4 000 zł przychodu miesięcznie.

**[DODANE] Czego brakowało w rachunku:**
- Prowizja płatności (Stripe/Przelewy24) ok. 1,5–2 % + koszt faktur.
- Twój czas: ok. 5–10 min na zdjęcie (generowanie, wybór, retusz). 200 zdjęć/mies. = 17–33 h pracy. Przy 4 000 zł to 120–240 zł/h – dobrze, ale pamiętaj, że to limit skalowania w pojedynkę.
- Ceny dla konsumentów muszą być podane **brutto** (z VAT), dla firm możesz pokazywać netto – strona robi to automatycznie.
- Program poleceń: **[ZMIANA]** 10 zdjęć gratis = ok. 390 zł wartości za jedno polecenie to za dużo. Proponuję **5 zdjęć gratis po pierwszym płatnym zamówieniu poleconego** (ok. 145 zł wartości, koszt ok. 10–25 zł).

## 6. Jak zdobyć klientów

- Przeglądaj ogłoszenia z pustymi mieszkaniami na Otodom i OLX, zrób darmowo 1 zdjęcie „przed/po” i wyślij agentowi.
  **[DODANE]** Wysyłaj przez formularz kontaktowy z ogłoszenia albo przez LinkedIn, nie masową wysyłką e-mail – masowy e-mail bez zgody to naruszenie ustawy o świadczeniu usług drogą elektroniczną (tzw. zakaz spamu) i ryzyko blokady domeny.
- Grupy na Facebooku dla pośredników nieruchomości i LinkedIn.
- Na stronie głównej suwak przed/po – to sprzedaje najlepiej.
- Program poleceń (5 zdjęć gratis).
- **[DODANE]** Formularz „Darmowa próbka” na stronie – agent sam wgrywa 1 zdjęcie. Dostajesz jego e-mail legalnie (zgoda) i możesz wrócić z ofertą abonamentu.
- **[DODANE]** Partnerstwo z fotografami nieruchomości i firmami od zdjęć z drona – mają gotową bazę agentów.

## 7. Ryzyka

- Wizualizacja nie może ukrywać wad (pęknięć, wilgoci) ani zmieniać metrażu – to wprowadzanie kupującego w błąd (ustawa o przeciwdziałaniu nieuczciwym praktykom rynkowym; odpowiedzialność ponosi głównie ogłaszający, ale Ty też możesz zostać wciągnięty w spór).
- Zawsze dodawaj oznaczenie, że to wizualizacja, i zalecaj agentom pokazanie też zdjęcia oryginału.
- **[DODANE]** Prawa autorskie do zdjęć: klient musi oświadczyć, że ma prawo do zdjęć (często robi je fotograf, nie agent). Oświadczenie jest w kreatorze zamówienia.
- **[DODANE]** RODO: zdjęcia wnętrz mogą zawierać dane osobowe (dokumenty na stole, zdjęcia rodzinne). Polityka prywatności + automatyczne usuwanie plików po 30 dniach.
- **[DODANE]** Prawo konsumenckie: usługa cyfrowa realizowana od razu – konsument musi wyraźnie zgodzić się na utratę prawa odstąpienia (14 dni). Checkbox jest w kreatorze; bez niego zwroty „bo się rozmyśliłem” są uzasadnione prawnie.
- **[DODANE]** Regulaminy portali: Otodom i OLX wymagają, by zdjęcia nie wprowadzały w błąd; część portali oznacza treści generowane przez AI. Sprawdzaj ich regulaminy raz na kwartał.
- **[DODANE]** Zależność od jednego dostawcy AI: miej zawsze drugie narzędzie „w zapasie”, bo serwisy zmieniają ceny i API bez ostrzeżenia.

## 8. Pierwsze kroki (2 tygodnie)

- [ ] Przetestuj 2–3 narzędzia na 20 zdjęciach z ogłoszeń i wybierz najlepsze (sprawdź też regulamin: komercyjne użycie, trening na danych).
- [ ] Zrób portfolio 10 par przed/po i **podmień placeholdery SVG na stronie** (instrukcja w README).
- [ ] Uruchom stronę (gotowa w tym repozytorium): konto Stripe z BLIK, domena, hosting – instrukcja w README.
- [ ] Uzupełnij dane firmy w regulaminie i polityce prywatności (pola [NAZWA FIRMY], [NIP], [ADRES]).
- [ ] Wyślij 50 darmowych próbek do agentów (link do formularza „Darmowa próbka”).
- [ ] Zaproponuj abonament tym, którzy odpiszą; pierwszym 3 biurom daj miesiąc za 499 zł w zamian za opinię i logo na stronie.
- [ ] **[DODANE]** Załóż działalność (lub działalność nierejestrowaną do limitu przychodu) i zdecyduj o VAT przed pierwszą fakturą dla biura.
