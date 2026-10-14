/**
 * Sprzątanie starych plików (zamówienia dostarczone/anulowane > 30 dni, tmp/ > 24 h).
 * Uruchomienie: `npm run cleanup` (lub `npm run cleanup -- --dry` – tylko raport).
 * Alternatywa dla hostingu bez dostępu do powłoki: GET /api/cron/cleanup z CRON_SECRET.
 */
import { runCleanup } from "../src/lib/cleanup";
import { prisma } from "../src/lib/db";

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry");
  const report = await runCleanup({ dryRun });
  console.info(
    `${dryRun ? "[tryb próbny] " : ""}Zamówienia: ${report.ordersCleaned}, usunięte pliki zamówień: ${report.filesDeleted}, usunięte pliki tymczasowe: ${report.tmpDeleted}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Błąd sprzątania:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
