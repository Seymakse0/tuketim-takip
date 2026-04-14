// @ts-nocheck — Prisma betiği; tam tipler için: npm ci && npx prisma generate
/**
 * Tek seferlik: Dallas steak kalemini Tomahawk sonrasına ekler (sort_order kaydırır).
 * Tam seed (db:seed) tüm tüketimi siler; bu script silmez.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LABEL = "DANA DALLAS STEAK / BEEF DALLAS STEAK";
const AFTER_LABEL = "DANA TOMAHAVK STEAK / BEEF TOMAHAWK STEAK";

async function main() {
  const dup = await prisma.meatItem.findFirst({ where: { label: LABEL } });
  if (dup) {
    console.log("Zaten var:", LABEL);
    return;
  }

  const anchor = await prisma.meatItem.findFirst({ where: { label: AFTER_LABEL } });
  if (!anchor) {
    console.error("Sıra için referans bulunamadı:", AFTER_LABEL);
    process.exit(1);
  }

  const newOrder = anchor.sortOrder + 1;

  await prisma.$transaction([
    prisma.meatItem.updateMany({
      where: { sortOrder: { gte: newOrder } },
      data: { sortOrder: { increment: 1 } },
    }),
    prisma.meatItem.create({
      data: {
        categoryCode: anchor.categoryCode,
        categoryName: anchor.categoryName,
        label: LABEL,
        sortOrder: newOrder,
      },
    }),
  ]);

  console.log("Eklendi:", LABEL, "sortOrder=", newOrder);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
