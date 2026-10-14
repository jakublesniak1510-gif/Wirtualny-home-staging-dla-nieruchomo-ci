import { FILE_RETENTION_DAYS } from "@/content/legal";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";

/**
 * Sprzątanie magazynu (RODO – minimalizacja danych):
 * - pliki zamówień DOSTARCZONYCH ponad FILE_RETENTION_DAYS dni temu,
 * - pliki zamówień ANULOWANYCH ponad FILE_RETENTION_DAYS dni temu,
 * - pliki tymczasowe `tmp/` starsze niż TMP_RETENTION_HOURS (porzucone kreatory).
 * Rekordy w bazie zostają (rozliczenia) i dostają `filesDeletedAt`.
 */

export { FILE_RETENTION_DAYS };
export const TMP_RETENTION_HOURS = 24;

export interface CleanupReport {
  ordersCleaned: number;
  filesDeleted: number;
  tmpDeleted: number;
  dryRun: boolean;
}

export async function runCleanup(
  options: { now?: Date; dryRun?: boolean } = {},
): Promise<CleanupReport> {
  const now = options.now ?? new Date();
  const dryRun = options.dryRun ?? false;
  const storage = getStorage();
  const orderCutoff = new Date(now.getTime() - FILE_RETENTION_DAYS * 24 * 3_600_000);
  const tmpCutoff = new Date(now.getTime() - TMP_RETENTION_HOURS * 3_600_000);

  const orders = await prisma.order.findMany({
    where: {
      filesDeletedAt: null,
      OR: [
        { status: "DELIVERED", deliveredAt: { lt: orderCutoff } },
        { status: "CANCELLED", updatedAt: { lt: orderCutoff } },
      ],
    },
    select: { id: true },
  });

  let filesDeleted = 0;
  for (const order of orders) {
    const files = await storage.list(`orders/${order.id}/`);
    for (const file of files) {
      if (!dryRun) await storage.delete(file.key);
      filesDeleted += 1;
    }
    if (!dryRun) {
      await prisma.order.update({ where: { id: order.id }, data: { filesDeletedAt: now } });
    }
  }

  let tmpDeleted = 0;
  for (const file of await storage.list("tmp/")) {
    if (file.lastModified.getTime() < tmpCutoff.getTime()) {
      if (!dryRun) await storage.delete(file.key);
      tmpDeleted += 1;
    }
  }

  return { ordersCleaned: orders.length, filesDeleted, tmpDeleted, dryRun };
}
