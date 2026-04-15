import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calendarMonthYmdBounds, formatTr, parseDateOnly } from "@/lib/dates";
import { normalizeMeatItemLabel } from "@/lib/meat-labels";
import { prismaErrorResponse } from "@/lib/prisma-http";

type RawConsumptionRow = {
  meat_item_id: string;
  quantity_kg: number;
  day: string;
};

export async function GET(req: NextRequest) {
  const yStr = req.nextUrl.searchParams.get("year");
  const mStr = req.nextUrl.searchParams.get("month");
  const now = new Date();
  const year = yStr ? Number.parseInt(yStr, 10) : now.getFullYear();
  const month = mStr ? Number.parseInt(mStr, 10) : now.getMonth() + 1;
  if (!Number.isFinite(year) || year < 1970 || year > 2100) {
    return NextResponse.json({ error: "Geçersiz yıl" }, { status: 400 });
  }
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Geçersiz ay (1–12)" }, { status: 400 });
  }

  const anchorStr = `${year}-${String(month).padStart(2, "0")}-01`;
  let anchor: Date;
  try {
    anchor = parseDateOnly(anchorStr);
  } catch {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  try {
    const { fromYmd, toYmd } = calendarMonthYmdBounds(year, month);
    const lastDay = Number.parseInt(toYmd.slice(8, 10), 10);

    const meatItems = await prisma.meatItem.findMany({ orderBy: { sortOrder: "asc" } });
    type MeatRow = (typeof meatItems)[number];

    /**
     * PG `date` → Prisma `Date` dönüşümünde Node/tz kayması tüm satırların aynı güne
     * yazılmasına yol açabiliyor; takvim gününü doğrudan SQL ile alıyoruz.
     */
    const consumptions = await prisma.$queryRawUnsafe<RawConsumptionRow[]>(
      `SELECT meat_item_id, quantity_kg, to_char(date, 'YYYY-MM-DD') AS day
       FROM daily_consumption
       WHERE date >= $1::date AND date <= $2::date`,
      fromYmd,
      toYmd
    );

    const matrix: Record<string, Record<string, number>> = {};
    for (const m of meatItems) {
      matrix[m.id] = {};
    }
    for (const c of consumptions) {
      const ymd = c.day;
      if (!matrix[c.meat_item_id]) matrix[c.meat_item_id] = {};
      matrix[c.meat_item_id][ymd] = (matrix[c.meat_item_id][ymd] ?? 0) + c.quantity_kg;
    }

    const dates: string[] = [];
    for (let dom = 1; dom <= lastDay; dom++) {
      dates.push(
        `${year}-${String(month).padStart(2, "0")}-${String(dom).padStart(2, "0")}`
      );
    }

    return NextResponse.json({
      type: "monthly-grid" as const,
      label: formatTr(anchor, "MMMM yyyy"),
      year,
      month,
      from: fromYmd,
      to: toYmd,
      dates,
      meatItems: meatItems.map((m: MeatRow) => ({
        id: m.id,
        categoryCode: m.categoryCode,
        categoryName: m.categoryName,
        label: normalizeMeatItemLabel(m.label),
      })),
      matrix,
    });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}
