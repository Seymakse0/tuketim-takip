import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dayRange, formatTr, parseDateOnly } from "@/lib/dates";
import { normalizeMeatItemLabel } from "@/lib/meat-labels";
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
    const byId = new Map<string, number>(
      rows.map((r: { meatItemId: string; quantityKg: number }) => [r.meatItemId, r.quantityKg])
    );

    return NextResponse.json({
      type: "daily" as const,
      label: formatTr(day, "d MMMM yyyy"),
      date: dateStr.slice(0, 10),
      rows: meatItems.map((m: { id: string; categoryCode: string; categoryName: string; label: string }) => ({
        categoryCode: m.categoryCode,
        categoryName: m.categoryName,
        label: normalizeMeatItemLabel(m.label),
        quantityKg: byId.get(m.id) ?? 0,
      })),
      totalKg: meatItems.reduce(
        (s: number, m: { id: string }) => s + (byId.get(m.id) ?? 0),
        0
      ),
    });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}
