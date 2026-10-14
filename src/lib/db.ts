import { PrismaClient } from "@prisma/client";

/**
 * Jeden PrismaClient na proces. W trybie dev Next przeładowuje moduły,
 * więc trzymamy instancję w globalThis, żeby nie mnożyć połączeń.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
