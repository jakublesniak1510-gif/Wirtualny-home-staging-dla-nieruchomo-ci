<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Notatki projektu (dla kolejnych agentów)

- Jedyne źródła prawdy: `src/lib/site.ts` (marka, trasy `ROUTES`, nawigacja), `src/lib/pricing.ts` (ceny w groszach, `calculateOrderPrice`), `src/lib/styles.ts` (style), `src/lib/format.ts` (`formatPLN` itd.). Żadnych kwot ani ścieżek wpisanych na sztywno.
- `cacheComponents` jest WYŁĄCZONE (`next.config.ts`) – trasy czytające bazę/cookies oznaczaj `export const dynamic = "force-dynamic"`.
- Layout renderuje `<Header/>`, `<main id="tresc">` i `<Footer/>` – strony NIE dodają własnego `<main>`.
- Klasy wspólne: `.container-x`, `.btn-primary`, `.btn-secondary`, `.card`, `.link`; tokeny kolorów: `paper`, `surface`, `ink`, `muted`, `line`, `cream`, `brand`(-dark/-light), `sand`(-light/-dark).
- Baza: `prisma/schema.prisma`, klient `import { prisma } from "@/lib/db"`. SQLite lokalnie (`prisma/data/dev.db`).
- Ilustracje portfolio i OG: `node scripts/generate-illustrations.mjs`.
