import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatTr, parseDateOnly, weekRangeContaining } from "@/lib/dates";
import { prismaErrorResponse } from "@/lib/prisma-http";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const dateStr = req.nextUrl.searchParams.get("date");
  if (!dateStr) {
    return NextResponse.json(
      { error: "Tarih gerekli: haftayı belirlemek için o haftadan herhangi bir günü seçin." },
      { status: 400 }
    );
  }
  let anchor: Date;
  try {
    anchor = parseDateOnly(dateStr);
  } catch {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  try {
    const { from, to } = weekRangeContaining(anchor);
    const meatItems = await prisma.meatItem.findMany({ orderBy: { sortOrder: "asc" } });
    const consumptions = await prisma.dailyConsumption.findMany({
      where: { date: { gte: from, lte: to } },
    });

    const sumByMeat = new Map<string, number>();
    for (const c of consumptions) {
      sumByMeat.set(c.meatItemId, (sumByMeat.get(c.meatItemId) ?? 0) + c.quantityKg);
    }

    return NextResponse.json({
      type: "weekly" as const,
      label: `${formatTr(from, "d MMM")} – ${formatTr(to, "d MMM yyyy")}`,
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
      rows: meatItems.map((m) => ({
        categoryCode: m.categoryCode,
        categoryName: m.categoryName,
        label: m.label,
        quantityKg: sumByMeat.get(m.id) ?? 0,
      })),
      totalKg: meatItems.reduce((s, m) => s + (sumByMeat.get(m.id) ?? 0), 0),
    });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}
