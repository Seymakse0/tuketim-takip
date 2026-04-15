import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calendarMonthYmdBounds, formatTr, parseDateOnly } from "@/lib/dates";
import { normalizeMeatItemLabel } from "@/lib/meat-labels";
import { prismaErrorResponse } from "@/lib/prisma-http";

export async function GET(req: NextRequest) {
  const dateStr = req.nextUrl.searchParams.get("date");
  if (!dateStr) {
    return NextResponse.json(
      { error: "Tarih gerekli: ayı belirlemek için o ay içinde herhangi bir günü seçin." },
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
    const year = anchor.getFullYear();
    const month = anchor.getMonth() + 1;
    const { fromYmd, toYmd } = calendarMonthYmdBounds(year, month);
    const meatItems = await prisma.meatItem.findMany({ orderBy: { sortOrder: "asc" } });
    type MeatItemRow = (typeof meatItems)[number];
    const sums = await prisma.$queryRawUnsafe<Array<{ meat_item_id: string; total: unknown }>>(
      `SELECT meat_item_id, SUM(quantity_kg)::float AS total
       FROM daily_consumption
       WHERE date >= $1::date AND date <= $2::date
       GROUP BY meat_item_id`,
      fromYmd,
      toYmd
    );

    const sumByMeat = new Map<string, number>(
      sums.map((r: { meat_item_id: string; total: unknown }) => [r.meat_item_id, Number(r.total)])
    );

    return NextResponse.json({
      type: "monthly" as const,
      label: formatTr(anchor, "MMMM yyyy"),
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
  } catch (e) {
    return prismaErrorResponse(e);
  }
}
