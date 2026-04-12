// src/lib/prisma-edge.ts
import { PrismaClient } from "@prisma/client/edge";

const globalForPrisma = globalThis as unknown as {
  prismaEdge: PrismaClient | undefined;
};

export const prismaEdge =
  globalForPrisma.prismaEdge ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaEdge = prismaEdge;
}
