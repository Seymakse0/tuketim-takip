import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const beef = {
  code: "1001001",
  name: "DANA ETLERİ",
  items: [
    "DANA ANTRIKOT / BEEF ENTRECOTE",
    "DANA ÜÇLÜ SET / BEEF TRIPLE SET",
    "DANA BONFILE / BEEF TENDERLOIN",
    "DANA DRY PIRZOLA / BEEF DRY CHOP",
    "DANA KIYMALIK ET / BEEF MEAT FOR GROUND",
    "DANA KONTRAFILE / BEEF SIRLOIN",
    "DANA T-BONE / BEEF T-BONE",
    "DANA YAPRAK DONER / BEEF DONER",
    "DANA KIYMALIK ET DOS / BEEF SHORT PLATE MEAT FOR GROUND",
    "DANA TOMAHAVK STEAK / BEEF TOMAHAWK STEAK",
    "DANA DALLAS STEAK / BEEF DALLAS STEAK",
    "DANA BONFILE EKSTRA / BEEF TENDERLOIN EXTRA",
    "DANA UZUN BUT / BEEF STEAMSHIP",
    "DANA BESLI SET EKSTRA / BEEF SET OF 5 EXTRA",
    "DANA KUSBASI (Beef Cubes)",
    "DANA DONER KARISIK 60-40 kg / BEEF DONER MIXED 60-40 kg",
    "DANA BUT YAPRAK DONER / BEEF STEAMSHIP DONER",
  ],
};

const lamb = {
  code: "1001002",
  name: "KUZU ETLERI",
  items: [
    "KUZU CATAL BUT/LAMB LEGS",
    "KUZU KAFES/LAMB CAGE",
    "KUZU KASKI",
    "KUZU TARAK PIRZOLA / LAMB CHOP (TARAK)",
    "KUZU INCIK UCSUZ/LAMB SHANK",
    "KUZU CATAL BUT KIVIRCIK/LAMB LEGS (CURLY)",
    "KUZU PIRZOLA TARAK KIVIRCIK / LAMB CHOP",
    "KUZU KANAT PIRZOLA KIVIRCIK / LAMB WING CHOPS",
  ],
};

async function main() {
  await prisma.dailyConsumption.deleteMany();
  await prisma.meatItem.deleteMany();

  let order = 0;
  for (const label of beef.items) {
    await prisma.meatItem.create({
      data: {
        categoryCode: beef.code,
        categoryName: beef.name,
        label,
        sortOrder: order++,
      },
    });
  }
  for (const label of lamb.items) {
    await prisma.meatItem.create({
      data: {
        categoryCode: lamb.code,
        categoryName: lamb.name,
        label,
        sortOrder: order++,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
