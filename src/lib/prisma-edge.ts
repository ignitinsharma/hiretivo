import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client/edge";

const globalForPrisma = globalThis as unknown as {
  prismaEdge: PrismaClient | undefined;
};

function createPrismaEdgeClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set (prisma-edge)");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prismaEdge =
  globalForPrisma.prismaEdge ?? createPrismaEdgeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaEdge = prismaEdge;
}
