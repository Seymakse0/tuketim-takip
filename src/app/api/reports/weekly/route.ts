import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  assertIsoDateOnly,
  dateToYmd,
  formatTr,
  parseDateOnly,
  weekRangeContaining,
} from "@/lib/dates";
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
      const fromYmd = assertIsoDateOnly(fromQ.slice(0, 10));
      const toYmd = assertIsoDateOnly(toQ.slice(0, 10));

      const meatItems = await prisma.meatItem.findMany({ orderBy: { sortOrder: "asc" } });
      type MeatItemRow = (typeof meatItems)[number];
      const sums = await prisma.$queryRawUnsafe<Array<{ meat_item_id: string; total: unknown }>>(
        `SELECT meat_item_id, SUM(quantity_kg)::float AS total
         FROM daily_consumption
         WHERE date >= '${fromYmd}'::date AND date <= '${toYmd}'::date
         GROUP BY meat_item_id`
      );
      const sumByMeat = new Map<string, number>(
        sums.map((r: { meat_item_id: string; total: unknown }) => [r.meat_item_id, Number(r.total)])
      );

      return NextResponse.json({
        type: "weekly" as const,
        label: `${formatTr(from, "d MMM yyyy")} – ${formatTr(toBoundary, "d MMM yyyy")}`,
        from: fromYmd,
        to: toYmd,
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
    const fromYmd = assertIsoDateOnly(dateToYmd(from));
    const toYmd = assertIsoDateOnly(dateToYmd(to));
    const meatItems = await prisma.meatItem.findMany({ orderBy: { sortOrder: "asc" } });
    type MeatItemRow = (typeof meatItems)[number];
    const sums = await prisma.$queryRawUnsafe<Array<{ meat_item_id: string; total: unknown }>>(
      `SELECT meat_item_id, SUM(quantity_kg)::float AS total
       FROM daily_consumption
       WHERE date >= '${fromYmd}'::date AND date <= '${toYmd}'::date
       GROUP BY meat_item_id`
    );
    const sumByMeat = new Map<string, number>(
      sums.map((r: { meat_item_id: string; total: unknown }) => [r.meat_item_id, Number(r.total)])
    );

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
