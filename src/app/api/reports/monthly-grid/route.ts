import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dateToYmd, formatTr, monthRange, parseDateOnly } from "@/lib/dates";
import { normalizeMeatItemLabel } from "@/lib/meat-labels";
import { prismaErrorResponse } from "@/lib/prisma-http";

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
    const { from, to } = monthRange(anchor);
    const meatItems = await prisma.meatItem.findMany({ orderBy: { sortOrder: "asc" } });
    type MeatRow = (typeof meatItems)[number];

    const consumptions = await prisma.dailyConsumption.findMany({
      where: { date: { gte: from, lte: to } },
    });

    const matrix: Record<string, Record<string, number>> = {};
    for (const m of meatItems) {
      matrix[m.id] = {};
    }
    for (const c of consumptions) {
      const ymd = dateToYmd(c.date);
      if (!matrix[c.meatItemId]) matrix[c.meatItemId] = {};
      matrix[c.meatItemId][ymd] = (matrix[c.meatItemId][ymd] ?? 0) + c.quantityKg;
    }

    const y = anchor.getUTCFullYear();
    const m0 = anchor.getUTCMonth();
    const lastDay = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
    const dates: string[] = [];
    for (let dom = 1; dom <= lastDay; dom++) {
      dates.push(dateToYmd(new Date(Date.UTC(y, m0, dom))));
    }

    return NextResponse.json({
      type: "monthly-grid" as const,
      label: formatTr(anchor, "MMMM yyyy"),
      year,
      month,
      from: dateToYmd(from),
      to: dateToYmd(to),
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
