# Wirtualny Staging – serwis wirtualnego home stagingu

Gotowa strona internetowa usługi „wirtualny home staging”: klient (agent nieruchomości, deweloper, osoba prywatna) wgrywa zdjęcia pustego mieszkania, wybiera styl, płaci BLIK-iem, kartą lub Przelewy24 i w ciągu 24 h dostaje umeblowane wizualizacje z oznaczeniem „wizualizacja”. Ty jako operator generujesz warianty w narzędziach AI, wybierasz najlepszy, poprawiasz go i wgrywasz wynik w panelu administratora.

Biznesowe tło, ceny, ryzyka i plan na pierwsze 2 tygodnie opisuje **[docs/PROPOZYCJA-BIZNESOWA.md](docs/PROPOZYCJA-BIZNESOWA.md)** – przeczytaj go przed startem. Ten plik (README) opisuje stronę techniczną: jak to uruchomić, skonfigurować i obsługiwać.

## Spis treści

1. [Co jest w środku](#co-jest-w-środku)
2. [Wymagania](#wymagania)
3. [Uruchomienie lokalne](#uruchomienie-lokalne)
4. [Płatności – Stripe](#płatności--stripe)
5. [E-maile – Resend](#e-maile--resend)
6. [Hosting produkcyjny](#hosting-produkcyjny)
7. [Hasło administratora](#hasło-administratora)
8. [Podmiana treści](#podmiana-treści) – portfolio, opinie, dane firmy, ceny
9. [Dzienna obsługa zamówień](#dzienna-obsługa-zamówień)
10. [Generowanie wariantów AI](#generowanie-wariantów-ai)
11. [Panel admina – dashboard, poprawki, polecenia](#panel-admina--dashboard-poprawki-polecenia)
12. [Lista kontrolna przed startem](#lista-kontrolna-przed-startem)
13. [Znane ograniczenia](#znane-ograniczenia)

---

## Co jest w środku

| Adres | Co to jest |
|---|---|
| `/` | Strona główna (suwak przed/po, style, cennik, opinie, FAQ) |
| `/zamow` | Kreator zamówienia: zdjęcia, styl, dodatki, ekspres, kod pakietu, zgody, płatność |
| `/zamowienie/<token>` | Status zamówienia i pobieranie wyników (link prywatny z e-maila) |
| `/darmowa-probka` | Formularz „1 zdjęcie gratis” dla nowych agentów |
| `/cennik` | Pełny cennik, przykładowe wyliczenia, pakiety, abonament, FAQ cenowe |
| `/dla-biur` | Oferta abonamentu dla biur i deweloperów + formularz zapytania |
| `/jak-to-dziala` | Proces krok po kroku, wymagania do zdjęć, czego nie robimy |
| `/portfolio` | Galeria par przed/po z filtrem po stylu |
| `/faq` | Wszystkie pytania w kategoriach (z danymi strukturalnymi dla Google) |
| `/kontakt` | Dane kontaktowe i formularz |
| `/regulamin`, `/polityka-prywatnosci` | Dokumenty prawne (wzory – patrz niżej) |
| `/admin` | Panel operatora (zamówienia, zgłoszenia z formularzy, kody pakietów) |

Technologia: Next.js 16 + React 19 + Tailwind CSS 4, baza przez Prisma (lokalnie SQLite, na produkcji Postgres), płatności Stripe Checkout, e-maile Resend, pliki na dysku lub w magazynie S3/R2, obróbka zdjęć (znak wodny, miniatury) biblioteką `sharp`.

**Jedno źródło prawdy** – większość zmian robisz w kilku plikach:

| Plik | Co zawiera |
|---|---|
| `src/lib/site.ts` | Nazwa serwisu, domena, e-mail, telefon, dane firmy, czasy realizacji |
| `src/lib/pricing.ts` | Wszystkie ceny (w groszach), progi, dodatki, abonament, poprawki |
| `src/lib/styles.ts` | Style aranżacji (nazwa, opis, słowa kluczowe, paleta) |
| `src/content/portfolio.ts` | Pary zdjęć przed/po w portfolio |
| `src/content/testimonials.ts` | Opinie klientów |
| `src/content/faq.ts` | Pytania i odpowiedzi (z kategoriami) |
| `src/content/legal.ts` | Daty wersji regulaminu i polityki, okres przechowywania plików (30 dni), termin reklamacji (14 dni) |
| `src/content/service.ts` | Parametry usługi na stronach informacyjnych: liczba wariantów, wymagania do zdjęć, rabat partnerski 30%, godziny odpowiedzi |

---

## Wymagania

- **Node.js 20.9 lub nowszy** (zalecany 22 LTS) – sprawdzisz poleceniem `node -v`.
- **npm** (instaluje się razem z Node.js).
- Konto **Stripe** (płatności), konto **Resend** (e-maile) – na start lokalny możesz je pominąć.
- Na produkcję: hosting aplikacji Node.js (np. Vercel lub Railway), baza **Postgres** i magazyn plików **S3/R2** (szczegóły niżej).

---

## Uruchomienie lokalne

```bash
# 1. Zależności (pierwszy raz i po każdej zmianie package.json)
npm install

# 2. Konfiguracja – skopiuj przykład i uzupełnij
cp .env.example .env
#    minimum do pracy lokalnej: ADMIN_PASSWORD i ADMIN_SESSION_SECRET
#    (sekret wygenerujesz: openssl rand -hex 32)

# 3. Baza danych (SQLite w prisma/data/dev.db)
npx prisma migrate dev

# 4. Start serwera deweloperskiego
npm run dev
```

Strona działa pod adresem <http://localhost:3000>, panel pod <http://localhost:3000/admin>.

Bez kluczy Stripe i Resend strona działa, ale: płatność nie wystartuje (formularz zgłosi brak konfiguracji), a treść e-maili zamiast do skrzynki trafi do konsoli (okno terminala z `npm run dev`). To wygodne do testów.

Przydatne polecenia:

| Polecenie | Co robi |
|---|---|
| `npm run dev` | Serwer deweloperski z podglądem zmian na żywo |
| `npm run build` i `npm start` | Wersja produkcyjna lokalnie |
| `npm run lint` | Sprawdzenie jakości kodu |
| `npm test` | Testy automatyczne (cennik, walidacja) |
| `npx prisma studio` | Podgląd i edycja bazy danych w przeglądarce |
| `node scripts/generate-illustrations.mjs` | Ponowne wygenerowanie ilustracji portfolio i obrazka `og.png` |

---

## Płatności – Stripe

1. **Załóż konto** na <https://dashboard.stripe.com/register> i uzupełnij dane firmy (Settings → Business). Do czasu weryfikacji działa tryb testowy.
2. **Włącz metody płatności**: Settings → Payments → Payment methods. Włącz **BLIK**, **Przelewy24** i **Cards** (karty są zwykle włączone domyślnie). BLIK i Przelewy24 działają tylko dla płatności w PLN – serwis rozlicza się w złotówkach, więc wszystko się zgadza.
3. **Klucze API**: Developers → API keys. Skopiuj **Secret key** (`sk_test_...` w trybie testowym, `sk_live_...` na produkcji) do `.env` jako `STRIPE_SECRET_KEY`.
4. **Webhook** (Stripe informuje serwis o opłaceniu zamówienia):
   - Developers → Webhooks → *Add endpoint*.
   - Adres: `https://TWOJA-DOMENA/api/webhooks/stripe`.
   - Zdarzenia: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` (Przelewy24 bywa potwierdzany z opóźnieniem – dlatego dwa ostatnie).
   - Po zapisaniu skopiuj **Signing secret** (`whsec_...`) do `STRIPE_WEBHOOK_SECRET`.
5. **Test lokalny** z [Stripe CLI](https://docs.stripe.com/stripe-cli):

   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   CLI wypisze tymczasowy `whsec_...` – wpisz go do `.env` i zrestartuj `npm run dev`. W trybie testowym zapłać kartą `4242 4242 4242 4242` (dowolna przyszła data, dowolny CVC) albo wybierz BLIK/Przelewy24 i zatwierdź na stronie testowej Stripe.
6. **Przejście na produkcję**: przełącz Dashboard na *Live*, utwórz drugi webhook (już na adres produkcyjny) i podmień oba klucze w zmiennych środowiskowych hostingu.

Faktury VAT: serwis zapisuje nazwę firmy i NIP przy zamówieniu, ale faktur sam **nie wystawia** – wystawiasz je w swoim programie do fakturowania (lub włącz Stripe Invoicing, jeśli wolisz).

---

## E-maile – Resend

1. Załóż konto na <https://resend.com>.
2. **Domains → Add domain**: dodaj swoją domenę (np. `wirtualnystaging.pl`). Resend pokaże rekordy DNS – **SPF (TXT)**, **DKIM (TXT/CNAME)** i opcjonalnie **DMARC** – dodaj je u rejestratora domeny. Weryfikacja trwa od kilku minut do kilku godzin. Bez niej maile będą trafiać do spamu albo nie zostaną wysłane.
3. **API Keys → Create API key** (uprawnienie *Sending access*) → wpisz do `RESEND_API_KEY`.
4. Ustaw `EMAIL_FROM` (np. `Wirtualny Staging <kontakt@twojadomena.pl>` – adres w zweryfikowanej domenie) oraz `EMAIL_ADMIN` – Twój adres, na który przychodzą powiadomienia o nowych zamówieniach.

Bez `RESEND_API_KEY` serwis nie wysyła maili, tylko wypisuje ich treść w logach – nic się nie psuje.

---

## Hosting produkcyjny

Lokalna baza SQLite i zapis plików na dysk **nie nadają się** na Vercel (dysk jest tymczasowy). Na produkcji potrzebujesz bazy Postgres i magazynu plików S3/R2.

### 1. Baza Postgres

Możesz użyć np. Vercel Postgres / Neon, Supabase lub Postgres w Railway.

1. W `prisma/schema.prisma` zmień `provider = "sqlite"` na `provider = "postgresql"`.
2. Migracje w repozytorium są przygotowane pod SQLite. Przy pierwszym przejściu na Postgresa usuń katalog `prisma/migrations` i wygeneruj migrację od nowa na pustej bazie Postgres:

   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate dev --name init
   ```

   i zatwierdź nowe pliki w repozytorium.
3. Na serwerze produkcyjnym przy każdym wdrożeniu uruchamiaj `npx prisma migrate deploy` (na Vercel: dopisz do komendy budowania, np. `prisma migrate deploy && next build`).

### 2. Pliki – S3 / Cloudflare R2

1. Utwórz prywatny bucket (np. w Cloudflare R2 – tani i bez opłat za transfer).
2. Wygeneruj klucze dostępu z prawem zapisu do tego bucketu.
3. Ustaw zmienne: `STORAGE_DRIVER="s3"`, `S3_ENDPOINT` (dla R2: `https://<ID_KONTA>.r2.cloudflarestorage.com`), `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION` (dla R2: `auto`).
4. Bucket ma być **prywatny** – pliki klientów są serwowane przez aplikację tylko osobom z linkiem do zamówienia.

### 3. Vercel (najprostsza droga)

1. Wrzuć repozytorium na GitHub, w Vercel kliknij *Add New → Project* i wybierz repozytorium.
2. W *Settings → Environment Variables* wpisz wszystkie zmienne z `.env.example` (z wartościami produkcyjnymi), w tym `NEXT_PUBLIC_SITE_URL="https://twojadomena.pl"`.
3. Podepnij domenę (*Settings → Domains*).
4. Ustaw automatyczne sprzątanie plików (usuwanie po 30 dniach): zadanie cykliczne (Vercel Cron lub dowolny zewnętrzny cron) wywołujące raz dziennie `/api/cron/cleanup` z nagłówkiem `Authorization: Bearer <CRON_SECRET>`.

**Railway** działa podobnie: nowy projekt z repozytorium + usługa Postgres w tym samym projekcie; komenda startowa `npx prisma migrate deploy && npm start`. Na Railway możesz też zostać przy `STORAGE_DRIVER="local"`, jeśli podepniesz trwały wolumin (Volume) pod katalog `data/` i ustawisz `UPLOADS_DIR` na ścieżkę w tym wolumenie.

---

## Hasło administratora

- `ADMIN_PASSWORD` – hasło do `/admin`. Użyj długiego, losowego hasła (min. 16 znaków, najlepiej z menedżera haseł).
- `ADMIN_SESSION_SECRET` – sekret do podpisywania sesji, min. 32 losowe znaki (`openssl rand -hex 32`).
- Zmiana hasła = zmiana zmiennej na hostingu i ponowne wdrożenie. Zmiana `ADMIN_SESSION_SECRET` wyloguje wszystkie sesje.

---

## Podmiana treści

### Portfolio – prawdziwe zdjęcia zamiast ilustracji

Obecne pary to rysunki poglądowe (`public/portfolio/*.svg`). Gdy masz własne realizacje:

1. Przygotuj pary zdjęć: **1200 × 800 px** (proporcje 3:2), **JPG lub WebP**, jakość ok. 80%, do ~300 KB na plik. Wersja „po” musi mieć widoczny znak „wizualizacja” (tak jak dostaje klient).
2. Nazwij pliki według schematu `public/portfolio/<styl>-<miejsce>-przed.jpg` i `...-po.jpg`, np. `skandynawski-salon-krakow-przed.jpg`. Małe litery, bez polskich znaków i spacji.
3. W `src/content/portfolio.ts` zmień `beforeSrc` / `afterSrc` na nowe ścieżki (np. `/portfolio/skandynawski-salon-krakow-przed.jpg`) i zaktualizuj `title`, `description`, `room`, `area` oraz opisy alternatywne `beforeAlt` / `afterAlt` (ważne dla dostępności i SEO).
4. Pole `slug` musi być jednym ze stylów z `src/lib/styles.ts` – na nim działa filtr w `/portfolio`.
5. Gdy wszystkie ilustracje są podmienione, usuń dopisek „Ilustracje poglądowe” w `src/app/portfolio/page.tsx` (oznaczony komentarzem) oraz słowa „ilustracja poglądowa” w podpisach na stronie głównej i w `/jak-to-dziala`.
6. Publikuj tylko zdjęcia, na które masz **pisemną zgodę klienta** (regulamin to przewiduje) – najlepiej z nieruchomości już sprzedanych/wynajętych.

### Opinie klientów

W `src/content/testimonials.ts` zastąp przykładowe opinie prawdziwymi (imię i inicjał nazwiska, rola, miasto – za zgodą autora) i ustaw `isPlaceholder: false` przy każdej. Gdy żadna opinia nie jest placeholderem, zniknie dopisek „Przykładowe opinie”. **Nie publikuj zmyślonych opinii jako prawdziwych** – to nieuczciwa praktyka rynkowa.

### Dane firmy i dokumenty prawne

1. W `src/lib/site.ts` uzupełnij `company.legalName`, `company.nip`, `company.address` (zastąp `[NAZWA FIRMY]`, `[NIP]`, `[ADRES]`), a także `email`, `phone`, `domain`. Dane pojawią się automatycznie w stopce, na `/kontakt`, w regulaminie, polityce prywatności i pod formularzami.
2. Regulamin (`src/app/regulamin/page.tsx`) i polityka prywatności (`src/app/polityka-prywatnosci/page.tsx`) to **dokumenty wzorcowe – daj je do weryfikacji prawnikowi** przed startem sprzedaży. Sprawdź zwłaszcza: zasady biegu terminu 24 h w weekendy, zasady kodów pakietów i abonamentu, listę dostawców (hosting, magazyn plików, narzędzia AI) i kraje przetwarzania.
3. Po każdej zmianie treści dokumentu zmień datę `TERMS_EFFECTIVE_DATE` / `PRIVACY_EFFECTIVE_DATE` w `src/content/legal.ts`.

### Zmiana cen

1. Ceny zmieniasz **wyłącznie** w `src/lib/pricing.ts` (kwoty w groszach: `3900` = 39 zł). Strona główna, cennik, FAQ, kreator, płatność i e-maile przeliczą się same.
2. Dwa miejsca z ceną zapisaną tekstem – popraw je ręcznie:
   - `SITE.description` w `src/lib/site.ts` („Od 29 zł za zdjęcie…” – opis dla Google),
   - linia `od 29 zł za zdjęcie` w `scripts/generate-illustrations.mjs` (obrazek do udostępnień), a potem wygeneruj go ponownie: `node scripts/generate-illustrations.mjs`.
3. Uruchom `npm test` – testy cennika pokażą, jeśli coś się nie zgadza (testy z konkretnymi kwotami trzeba wtedy też zaktualizować).

---

## Dzienna obsługa zamówień

1. **Powiadomienie**: po opłaceniu zamówienia dostajesz e-mail na `EMAIL_ADMIN`. Zamówienie ma status „opłacone”.
2. **Panel**: wejdź na `/admin`, zaloguj się. Lista pokazuje zamówienia od najnowszych – zacznij od ekspresów i abonamentów (krótszy termin).
3. **Szczegóły zamówienia**: kliknij zamówienie – zobaczysz styl, dodatki, uwagi klienta, termin z odliczaniem i oryginalne zdjęcia. Status „w realizacji” ustawia się sam przy pierwszym wyniku (klient dostaje e-mail „pracujemy nad zamówieniem”); możesz go też ustawić ręcznie.
4. **Kontrola zdjęć**: jeśli zdjęcie jest za ciemne, rozmyte albo nie pokazuje pomieszczenia – napisz do klienta, zanim zaczniesz (lepsze ujęcie albo zwrot za to zdjęcie; zwrot zrobisz w Dashboardzie Stripe: Payments → płatność → *Refund*).
5. **Praca**: przy każdym zdjęciu kliknij „Generuj warianty” (patrz „Generowanie wariantów AI”), obejrzyj je w porównaniu z oryginałem i wybierz najlepszy jako wynik główny; drugi dobry wariant możesz dodać jako „wariant dla klienta”. Jeśli wolisz zewnętrzne narzędzie lub retusz w edytorze – wgraj gotowe pliki ręcznie (pojedynczo albo zbiorczo dla całego zamówienia; pliki z numerami `01`, `02`… dopasują się same). Pilnuj zasad: **żadnego ukrywania wad, zmiany metrażu, okien ani układu**.
6. **Znak wodny**: „wizualizacja” nakłada się automatycznie na każdy publikowany wynik – nie dodawaj go ręcznie.
7. **Wysyłka**: gdy wszystkie wyniki są wgrane, zmień status na „gotowe” / wyślij e-mail „gotowe” – klient dostaje link do pobrania.
8. **Poprawki**: klient zgłasza je formularzem na stronie zamówienia (1 runda w 7 dni w cenie); dostajesz e-mail, a zgłoszenia widzisz w `/admin/poprawki` i w szczegółach zamówienia. Wgraj poprawioną wersję przy zdjęciu, wpisz krótką odpowiedź i oznacz zgłoszenie jako „gotowe” – klient dostanie e-mail.
9. **Zgłoszenia z formularzy**: o każdej wiadomości z `/kontakt` i `/dla-biur` dostajesz e-mail; wszystkie są też w `/admin/zgloszenia`. Odpowiadaj w ciągu dnia roboczego.
10. **Kody pakietów**: `/admin/kody` – tworzysz kod z liczbą kredytów (np. dla biura po opłaceniu faktury) i wysyłasz go klientowi e-mailem; klient widzi swoje kody także w „Moje zamówienia”.
11. **Nagrody za polecenia**: `/admin/polecenia` – gdy polecony klient opłaci pierwsze zamówienie, kliknij „Wydaj nagrodę”; kod na 5 zdjęć powstaje i wychodzi do polecającego automatycznie.
12. **Faktury**: zamówienia z NIP-em – wystaw fakturę w swoim programie i wyślij e-mailem.

Raz w tygodniu: sprawdź w Stripe wypłaty i ewentualne nieudane płatności, a w panelu – zamówienia, które utknęły w statusie „w realizacji”.

---

## Generowanie wariantów AI

Panel potrafi wygenerować warianty wizualizacji jednym kliknięciem – bez przełączania się do zewnętrznych narzędzi. Cel: z ok. 10 minut pracy na zdjęcie zejść do ok. 2 minut (wybór najlepszego wariantu + ewentualna drobna poprawka).

### Jak to działa

1. Serwer bierze oryginał zdjęcia, zmniejsza go (dłuższy bok `AI_MAX_INPUT_SIDE`, domyślnie 2048 px, usuwa metadane z GPS) i wysyła do wybranego dostawcy razem z promptem.
2. Prompt (po angielsku, edytowalny w panelu) składa się automatycznie ze stylu zamówienia (`src/lib/styles.ts` – nazwa, paleta), dodatków (usunięcie mebli, wirtualny remont, noc → dzień) i uwag klienta. Na końcu zawsze są **twarde zasady uczciwości**: ściany, okna, drzwi, sufit, geometria i perspektywa bez zmian, żadnego dodawania/usuwania okien i drzwi, żadnego ukrywania wad (pęknięcia, plamy, wilgoć), meble w realnej skali. Kod: `src/lib/ai/prompt.ts`.
3. Wynik jest dopasowywany do proporcji oryginału i zapisywany jako **wariant AI bez znaku wodnego** (widzi go tylko operator, plik `orders/<id>/ai/<wariant>.jpg`).
4. Gdy klikniesz „Ustaw jako wynik główny” albo „Dodaj jako wariant dla klienta”, serwer nakłada znak wodny „wizualizacja” i dopiero wtedy wynik trafia do klienta.

Generowanie działa w tle: przycisk od razu wraca, a strona co 3 s sprawdza postęp (maks. 2 generowania naraz na serwer). Pojedyncze wywołanie API ma limit 120 s.

### Klucze API – wystarczy jeden dostawca

| Dostawca | Gdzie po klucz | Zmienne | Orientacyjny koszt za 1 wariant* |
|---|---|---|---|
| **Replicate** – FLUX Kontext Pro (domyślny) | <https://replicate.com/account/api-tokens> (konto + karta w *Billing*) | `REPLICATE_API_TOKEN`, opcjonalnie `REPLICATE_MODEL` | ok. 0,04 USD ≈ 0,16 zł |
| **OpenAI** – gpt-image-1 | <https://platform.openai.com/api-keys> (doładuj saldo w *Billing*; organizacja może wymagać weryfikacji, by używać modeli obrazu) | `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL`, opcjonalnie `OPENAI_IMAGE_QUALITY` | low ≈ 0,02 USD, medium ≈ 0,06 USD, high ≈ 0,25 USD (≈ 0,08–1,00 zł) |
| **Google Gemini** – „Nano Banana” | <https://aistudio.google.com/apikey> (płatny poziom w Google AI Studio) | `GEMINI_API_KEY`, `GEMINI_IMAGE_MODEL` | ok. 0,04 USD ≈ 0,16 zł |

\* **Sprawdź aktualny cennik dostawcy** – ceny i nazwy modeli zmieniają się często. Panel liczy koszt orientacyjnie (stałe w `src/lib/ai/*.ts`) i pokazuje sumę z 30 dni na pulpicie. Przy 3 wariantach na zdjęcie koszt AI to zwykle 0,5–3 zł – ułamek ceny zdjęcia (29–39 zł).

Konfiguracja:

1. Wpisz klucz do `.env` (lokalnie) albo w zmiennych środowiskowych hostingu, ustaw `AI_PROVIDER` na `replicate`, `openai` lub `gemini` i uruchom serwer ponownie.
2. W `/admin/ustawienia` sprawdzisz, którzy dostawcy są skonfigurowani (kluczy nie pokazujemy).
3. Bez żadnego klucza panel działa jak dotąd – przycisk „Generuj warianty” jest wyłączony z komunikatem „Skonfiguruj klucz API w .env”, a wyniki wgrywasz ręcznie.

Integracje są napisane według dokumentacji dostawców (linki w komentarzach w `src/lib/ai/replicate.ts`, `openai.ts`, `gemini.ts`). **Przed startem zrób jedno testowe generowanie u wybranego dostawcy** – jeśli API zmieniło format, panel pokaże czytelny błąd przy wariancie. Przed użyciem sprawdź też regulamin dostawcy (użytek komercyjny, brak trenowania na zdjęciach klientów) i dopisz go do polityki prywatności, jeśli zaleci to prawnik.

### Praca operatora krok po kroku (nowy panel)

1. `/admin` → kafelek **Do zrobienia** → otwórz zamówienie (najpierw ekspresy i te z czerwonym terminem).
2. W nagłówku masz wszystko: klienta, styl, dodatki, odliczanie do terminu, uwagi klienta i **notatki wewnętrzne** (zapisują się same).
3. Przy każdym zdjęciu: przejrzyj prompt (w razie potrzeby dopisz np. „living room with a dining table”), wybierz dostawcę i liczbę wariantów → **Generuj warianty**. Możesz od razu przejść do kolejnego zdjęcia – generowanie trwa w tle.
4. Kliknij miniaturę wariantu – otworzy się porównanie z oryginałem. Sprawdź okna, drzwi, ściany i widoczność wad.
5. Najlepszy wariant → **Ustaw jako wynik główny**. Inne dobre warianty → **Dodaj jako wariant dla klienta** (z etykietą, np. „Wariant jasny”). Złe → **Usuń**. Zamówienie samo przechodzi z „opłacone” na „w realizacji” (klient dostaje e-mail).
6. Jeśli wariant wymaga retuszu: pobierz go linkiem **Pobierz** pod miniaturą (plik bez znaku wodnego), popraw w edytorze i wgraj przyciskiem **Podmień wynik** albo **Wgraj dodatkowy wariant**. Wiele gotowych plików naraz wgrasz w sekcji **Upload zbiorczy** – pliki z numerem w nazwie (`01.jpg`, `salon-02.png`) dopasujemy do zdjęć po numerze, inne po kolejności nazw; przed zatwierdzeniem zobaczysz podgląd przypisań i możesz je zmienić.
7. Gdy wszystkie zdjęcia mają wynik główny → **Wyślij maila: gotowe** (jak dotąd).

### Generowanie w tle a hosting serverless

Kolejka generowania działa w pamięci procesu serwera (`src/lib/ai/queue.ts`) i jest uruchamiana przez `after()` z Next.js – na Vercel funkcja żyje do końca generowania (w granicach `maxDuration` = 300 s; plan Hobby ma niższy limit). Jeśli proces zostanie zatrzymany w trakcie (restart, wdrożenie, przekroczony czas), warianty zostaną w stanie „w toku” – po 15 minutach panel oznaczy je jako błąd z prośbą o ponowne wygenerowanie. Gdy to się powtarza, ustaw `AI_SYNC=1`: przycisk będzie wtedy czekał na wynik (do ok. 2 min na wariant), ale nic nie zginie. Na zwykłym serwerze Node (Railway, VPS) tryb w tle działa bez ograniczeń.

---

## Panel admina – dashboard, poprawki, polecenia

| Adres | Co tam jest |
|---|---|
| `/admin` | **Pulpit**: kafelki – zamówienia do zrobienia (opłacone + w realizacji), po terminie, otwarte poprawki, przychód z 30 dni, średni czas realizacji (opłacenie → dostarczenie) z 30 dni, koszt AI z 30 dni. Pod spodem lista zamówień z kolumnami „Poprawki” (otwarte zgłoszenia) i „AI” (liczba wariantów). |
| `/admin/zamowienia/<id>` | **Stanowisko pracy** (opis wyżej) + sekcja **Poprawki** tego zamówienia: treść zgłoszenia, zmiana statusu (w realizacji / zrobione / odrzuć) i odpowiedź dla klienta. Po zamknięciu zgłoszenia klient dostaje e-mail. |
| `/admin/poprawki` | Wszystkie otwarte zgłoszenia poprawek od najstarszego, z linkiem do zamówienia („Pokaż wszystkie” – także zamknięte). |
| `/admin/polecenia` | Opłacone zamówienia z kodem polecenia, pogrupowane po kodzie (e-mail polecającego): liczba poleconych zamówień i czy nagroda została wydana. **Wydaj nagrodę** tworzy kod pakietu na 5 zdjęć (`REFERRAL_REWARD_PHOTOS` w `pricing.ts`), oznacza polecenia jako nagrodzone i wysyła polecającemu e-mail z kodem. Samopolecenia (ten sam e-mail) się nie liczą. |
| `/admin/ustawienia` | Podgląd konfiguracji (tylko odczyt): dostawcy AI, Stripe, Resend, magazyn plików, sekrety, wersja aplikacji. Kluczy nie wyświetlamy. |

Bezpieczeństwo panelu: sesja w ciasteczku HttpOnly `SameSite=Lax` (7 dni, odnawiana automatycznie przy korzystaniu z panelu), trasy `/api/admin/**` odrzucają żądania zmieniające dane z innej domeny (sprawdzanie nagłówka `Origin` – ochrona CSRF), a cała strona wysyła nagłówki `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` i – przy adresie https – `Strict-Transport-Security`.

---

## Lista kontrolna przed startem

- [ ] Dane firmy w `src/lib/site.ts` (nazwa, NIP, adres, e-mail, telefon, domena) – brak `[NAZWA FIRMY]` na stronie.
- [ ] Regulamin i polityka prywatności zweryfikowane przez prawnika; daty wersji w `src/content/legal.ts` aktualne.
- [ ] Decyzja o VAT i formie działalności (patrz `docs/PROPOZYCJA-BIZNESOWA.md`, sekcja 8). Jeśli nie jesteś płatnikiem VAT – zmień teksty o „cenach brutto z 23% VAT” i `VAT_RATE` w `pricing.ts`.
- [ ] Stripe w trybie *Live*: BLIK, Przelewy24 i karty włączone; webhook produkcyjny z trzema zdarzeniami; klucze `sk_live_` i `whsec_` na hostingu.
- [ ] Testowe zamówienie na produkcji (prawdziwy BLIK na małą kwotę → zwrot w Stripe).
- [ ] Resend: domena zweryfikowana (SPF, DKIM), testowy e-mail nie trafia do spamu.
- [ ] Postgres + `prisma migrate deploy`; `STORAGE_DRIVER="s3"` z prywatnym bucketem.
- [ ] Silne `ADMIN_PASSWORD` i `ADMIN_SESSION_SECRET`; `CRON_SECRET` i codzienne wywołanie `/api/cron/cleanup`.
- [ ] `NEXT_PUBLIC_SITE_URL` ustawiony na docelową domenę (wpływa na linki w e-mailach, sitemapę i Google).
- [ ] Portfolio: przynajmniej kilka prawdziwych par przed/po (za zgodą klientów); opinie – prawdziwe albo oznaczone jako przykładowe.
- [ ] Wybrane narzędzie AI: regulamin pozwala na użytek komercyjny i nie trenuje na zdjęciach klientów; nazwa dostawcy dopisana do polityki prywatności, jeśli prawnik tak zaleci.
- [ ] Google Search Console: dodana domena i zgłoszona mapa strony `https://TWOJADOMENA/sitemap.xml`.
- [ ] Formularze `/kontakt` i `/dla-biur` przetestowane – zgłoszenia widoczne w `/admin/zgloszenia`.

---

## Znane ograniczenia

- **Abonament i pakiety są obsługiwane ręcznie**: zapytanie przychodzi z formularza, fakturę wystawiasz sam, kod tworzysz w panelu. Kreator zamówienia nalicza dodatki także przy kodzie – klienci abonamentowi opisują dodatki w uwagach (a Ty ich nie doliczasz). Automatyczny abonament (Stripe Subscriptions) to możliwy kolejny krok.
- **Program poleceń** – nagrodę wydajesz jednym kliknięciem w `/admin/polecenia`, ale decyzję podejmujesz Ty (system nie wydaje jej sam).
- **Brak haseł klientów** – dostęp do zamówienia daje prywatny link z e-maila, a do listy zamówień jednorazowy link logowania („Moje zamówienia”). Kto ma link do zamówienia, widzi je; nie publikuj go.
- **Generowanie AI** nie było testowane z prawdziwymi kluczami dostawców – przed startem zrób jedno próbne generowanie (patrz „Generowanie wariantów AI”).
- **Faktury VAT** nie są generowane automatycznie.
- **Limit wiadomości z formularza kontaktowego** (10 na 10 minut z jednego adresu IP) liczony jest w pamięci serwera – przy kilku instancjach (np. serverless) każda liczy osobno. Do małego ruchu to wystarcza.
- **Ilustracje portfolio** są poglądowe (SVG) – podmień je na prawdziwe realizacje jak najszybciej, bo to one sprzedają.
- **Tryb ciemny** nie jest obsługiwany (świadoma decyzja projektowa).
