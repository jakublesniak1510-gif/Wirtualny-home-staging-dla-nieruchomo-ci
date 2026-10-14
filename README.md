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
10. [Lista kontrolna przed startem](#lista-kontrolna-przed-startem)
11. [Znane ograniczenia](#znane-ograniczenia)

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
3. **Szczegóły zamówienia**: kliknij zamówienie – zobaczysz styl, dodatki, uwagi klienta i oryginalne zdjęcia. Pobierz oryginały (pojedynczo lub jako ZIP) i zmień status na „w realizacji”.
4. **Kontrola zdjęć**: jeśli zdjęcie jest za ciemne, rozmyte albo nie pokazuje pomieszczenia – napisz do klienta, zanim zaczniesz (lepsze ujęcie albo zwrot za to zdjęcie; zwrot zrobisz w Dashboardzie Stripe: Payments → płatność → *Refund*).
5. **Praca**: dla każdego zdjęcia wygeneruj 2–4 warianty w wybranym narzędziu AI, wybierz najlepszy i popraw detale (proporcje mebli, cienie, krawędzie). Pilnuj zasad: **żadnego ukrywania wad, zmiany metrażu, okien ani układu**.
6. **Wgranie wyników**: w szczegółach zamówienia wgraj gotowy plik przy każdym zdjęciu. Znak „wizualizacja” nakłada się automatycznie – nie dodawaj go ręcznie.
7. **Wysyłka**: gdy wszystkie wyniki są wgrane, zmień status na „gotowe” / wyślij e-mail „gotowe” – klient dostaje link do pobrania.
8. **Poprawki**: klient odpisuje na e-mail (1 poprawka w 7 dni w cenie). Wgraj poprawioną wersję w tym samym zamówieniu.
9. **Zgłoszenia z formularzy**: `/admin/zgloszenia` – wiadomości z `/kontakt` (typ „contact”) i zapytania biur z `/dla-biur` (typ „office”). Odpowiadaj w ciągu dnia roboczego. Uwaga: na razie nie przychodzi o nich e-mail – zaglądaj do panelu codziennie (patrz „Znane ograniczenia”).
10. **Kody pakietów i nagrody za polecenia**: `/admin/kody` – tworzysz kod z liczbą kredytów (np. dla biura po opłaceniu faktury albo 5 zdjęć za polecenie) i wysyłasz go klientowi e-mailem.
11. **Faktury**: zamówienia z NIP-em – wystaw fakturę w swoim programie i wyślij e-mailem.

Raz w tygodniu: sprawdź w Stripe wypłaty i ewentualne nieudane płatności, a w panelu – zamówienia, które utknęły w statusie „w realizacji”.

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

- **Brak powiadomień e-mail o wiadomościach z formularzy** `/kontakt` i `/dla-biur` – zgłoszenia zapisują się w bazie i są widoczne w panelu; w kodzie (`src/app/api/contact/route.ts`) jest oznaczone miejsce do podpięcia wysyłki.
- **Abonament i pakiety są obsługiwane ręcznie**: zapytanie przychodzi z formularza, fakturę wystawiasz sam, kod tworzysz w panelu. Kreator zamówienia nalicza dodatki także przy kodzie – klienci abonamentowi opisują dodatki w uwagach (a Ty ich nie doliczasz). Automatyczny abonament (Stripe Subscriptions) to możliwy kolejny krok.
- **Program poleceń** tylko zapisuje kod polecenia w zamówieniu – nagrodę przyznajesz ręcznie.
- **Brak kont klientów** – dostęp do zamówienia daje prywatny link z e-maila. Kto ma link, widzi zamówienie; nie publikuj go.
- **Faktury VAT** nie są generowane automatycznie.
- **Limit wiadomości z formularza kontaktowego** (10 na 10 minut z jednego adresu IP) liczony jest w pamięci serwera – przy kilku instancjach (np. serverless) każda liczy osobno. Do małego ruchu to wystarcza.
- **Ilustracje portfolio** są poglądowe (SVG) – podmień je na prawdziwe realizacje jak najszybciej, bo to one sprzedają.
- **Tryb ciemny** nie jest obsługiwany (świadoma decyzja projektowa).
