// Prisma Client — singleton.
// W trybie deweloperskim Next.js przeładowuje pliki przy każdej zmianie,
// co tworzyłoby nową instancję PrismaClient za każdym razem (i wyczerpywało
// pulę połączeń). Singleton trzymany w globalnym obiekcie temu zapobiega.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // log queries w dev mode pomaga debugować — w produkcji wyłączone
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
