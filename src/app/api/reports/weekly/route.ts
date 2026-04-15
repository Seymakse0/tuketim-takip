import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dateToYmd, endOfUtcCalendarDay, formatTr, parseDateOnly, weekRangeContaining } from "@/lib/dates";
import { normalizeMeatItemLabel } from "@/lib/meat-labels";
import { prismaErrorResponse } from "@/lib/prisma-http";

export async function GET(req: NextRequest) {
  const fromQ = req.nextUrl.searchParams.get("from");
  const toQ = req.nextUrl.searchParams.get("to");
  const dateStr = req.nextUrl.searchParams.get("date");

  try {
    if (fromQ && toQ) {
      let from: Date;
      let toBoundary: Date;
      try {
        from = parseDateOnly(fromQ);
        toBoundary = parseDateOnly(toQ);
      } catch {
        return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
      }
      if (from.getTime() > toBoundary.getTime()) {
        return NextResponse.json(
          { error: "Başlangıç tarihi bitiş tarihinden sonra olamaz." },
          { status: 400 }
        );
      }
      const to = endOfUtcCalendarDay(toBoundary);

      const meatItems = await prisma.meatItem.findMany({ orderBy: { sortOrder: "asc" } });
      type MeatItemRow = (typeof meatItems)[number];
      const consumptions = await prisma.dailyConsumption.findMany({
        where: { date: { gte: from, lte: to } },
      });

      const sumByMeat = new Map<string, number>();
      for (const c of consumptions) {
        sumByMeat.set(c.meatItemId, (sumByMeat.get(c.meatItemId) ?? 0) + c.quantityKg);
      }

      return NextResponse.json({
        type: "weekly" as const,
        label: `${formatTr(from, "d MMM yyyy")} – ${formatTr(toBoundary, "d MMM yyyy")}`,
        from: dateToYmd(from),
        to: dateToYmd(toBoundary),
        rows: meatItems.map((m: MeatItemRow) => ({
          categoryCode: m.categoryCode,
          categoryName: m.categoryName,
          label: normalizeMeatItemLabel(m.label),
          quantityKg: sumByMeat.get(m.id) ?? 0,
        })),
        totalKg: meatItems.reduce((s: number, m: MeatItemRow) => s + (sumByMeat.get(m.id) ?? 0), 0),
      });
    }

    if (!dateStr) {
      return NextResponse.json(
        {
          error:
            "Tarih aralığı için from ve to (YYYY-MM-DD), veya tek bir date ile o günün Pazartesi–Pazar haftası.",
        },
        { status: 400 }
      );
    }

    let anchor: Date;
    try {
      anchor = parseDateOnly(dateStr);
    } catch {
      return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
    }

    const { from, to } = weekRangeContaining(anchor);
    const meatItems = await prisma.meatItem.findMany({ orderBy: { sortOrder: "asc" } });
    type MeatItemRow = (typeof meatItems)[number];
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
      from: dateToYmd(from),
      to: dateToYmd(to),
      rows: meatItems.map((m: MeatItemRow) => ({
        categoryCode: m.categoryCode,
        categoryName: m.categoryName,
        label: normalizeMeatItemLabel(m.label),
        quantityKg: sumByMeat.get(m.id) ?? 0,
      })),
      totalKg: meatItems.reduce((s: number, m: MeatItemRow) => s + (sumByMeat.get(m.id) ?? 0), 0),
    });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}
