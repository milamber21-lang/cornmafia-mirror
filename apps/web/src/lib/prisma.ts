// FILE: apps/web/src/lib/prisma.ts
// Minimal Prisma Client singleton for Next.js (avoids hot-reload duplicates)

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // You can uncomment logs during debugging
    // log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
