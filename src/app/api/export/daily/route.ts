import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
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
  const byId = new Map<string, number>(
    rows.map((r: { meatItemId: string; quantityKg: number }) => [r.meatItemId, r.quantityKg])
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Tüketim Kontrol";
  const sheet = workbook.addWorksheet("Günlük", {
    views: [{ showGridLines: true }],
  });

  const title = `Et tüketimi — ${formatTr(day, "d MMMM yyyy")}`;
  sheet.mergeCells(1, 1, 1, 4);
  const titleRow = sheet.getRow(1);
  titleRow.getCell(1).value = title;
  titleRow.getCell(1).font = { size: 14, bold: true };
  titleRow.height = 22;

  const header = sheet.getRow(3);
  header.values = ["Kategori kodu", "Kategori", "Et türü", "kg (tam sayı)"];
  header.font = { bold: true };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF047857" },
  };
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.alignment = { vertical: "middle", wrapText: true };
  header.height = 20;

  let r = 4;
  for (const m of meatItems) {
    const row = sheet.getRow(r);
    const qty = byId.get(m.id) ?? 0;
    row.values = [m.categoryCode, m.categoryName, m.label, qty];
    row.getCell(4).numFmt = "0";
    row.alignment = { vertical: "top", wrapText: true };
    const labelLen = m.label.length;
    row.height = Math.max(18, Math.ceil(labelLen / 55) * 15);
    r++;
  }

  let total = 0;
  for (const m of meatItems) {
    total += byId.get(m.id) ?? 0;
  }
  const totalRow = sheet.getRow(r);
  totalRow.getCell(3).value = "TOPLAM";
  totalRow.getCell(3).font = { bold: true };
  totalRow.getCell(4).value = total;
  totalRow.getCell(4).numFmt = "0";
  totalRow.font = { bold: true };

  sheet.columns = [
    { width: 14 },
    { width: 22 },
    { width: 62 },
    { width: 16 },
  ];

  const buf = await workbook.xlsx.writeBuffer();
  const filename = `et-tuketimi-${dateStr.slice(0, 10)}.xlsx`;
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : new Uint8Array(buf);

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}
