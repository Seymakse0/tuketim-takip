import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dayRange, formatTr, parseDateOnly } from "@/lib/dates";
import { prismaErrorResponse } from "@/lib/prisma-http";

export async function GET(req: NextRequest) {
  const dateStr = req.nextUrl.searchParams.get("date");
  if (!dateStr) {
    return NextResponse.json({ error: "Tarih parametresi gerekli." }, { status: 400 });
  }
  let day: Date;
  try {
    day = parseDateOnly(dateStr);
  } catch {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  try {
    const { from, to } = dayRange(day);
    const meatItems = await prisma.meatItem.findMany({ orderBy: { sortOrder: "asc" } });
    const rows = await prisma.dailyConsumption.findMany({
      where: { date: { gte: from, lte: to } },
    });
    const byId = new Map(rows.map((r) => [r.meatItemId, r.quantityKg]));

    return NextResponse.json({
      type: "daily" as const,
      label: formatTr(day, "d MMMM yyyy"),
      date: dateStr.slice(0, 10),
      rows: meatItems.map((m) => ({
        categoryCode: m.categoryCode,
        categoryName: m.categoryName,
        label: m.label,
        quantityKg: byId.get(m.id) ?? 0,
      })),
      totalKg: meatItems.reduce((s, m) => s + (byId.get(m.id) ?? 0), 0),
    });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}
