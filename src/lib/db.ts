import { PrismaClient } from "@prisma/client";

/**
 * Docker’da compose’un ham şifre enjekte ettiği DATABASE_URL, @ # : gibi karakterlerde kırılır.
 * POSTGRES_HOST + POSTGRES_PASSWORD varsa URL’yi encode ederek burada kurarız.
 */
function applyDatabaseUrlFromParts(): void {
  const pass = process.env.POSTGRES_PASSWORD?.trim();
  const host = process.env.POSTGRES_HOST?.trim();
  if (!pass || !host) return;
  const user = process.env.POSTGRES_USER?.trim() || "tuketim";
  const port = process.env.POSTGRES_PORT?.trim() || "5432";
  const db = process.env.POSTGRES_DB?.trim() || "tuketim_kontrol";
  process.env.DATABASE_URL = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${encodeURIComponent(db)}?schema=public`;
}

applyDatabaseUrlFromParts();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
