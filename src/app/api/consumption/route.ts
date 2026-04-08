import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isDateEditable, parseDateOnly } from "@/lib/dates";
import { prismaErrorResponse } from "@/lib/prisma-http";

const halfKg = (n: number) => Math.round(n * 2) / 2;

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(
    z.object({
      meatItemId: z.string().min(1),
      quantityKg: z.coerce
        .number()
        .min(0)
        .max(1_000_000)
        .transform((n) => halfKg(n)),
    })
  ),
});

export async function GET(req: NextRequest) {
  const dateStr = req.nextUrl.searchParams.get("date");
  if (!dateStr) {
    return NextResponse.json(
      { error: "Tarih parametresi gerekli (yıl-ay-gün, örn. 2026-04-07)." },
      { status: 400 }
    );
  }
  let day: Date;
  try {
    day = parseDateOnly(dateStr);
  } catch {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  try {
    const [meatItems, rows] = await Promise.all([
      prisma.meatItem.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.dailyConsumption.findMany({
        where: { date: day },
      }),
    ]);

    const byId = new Map(rows.map((r) => [r.meatItemId, r.quantityKg]));
    const editable = isDateEditable(day);

    return NextResponse.json({
      date: dateStr.slice(0, 10),
      editable,
      items: meatItems.map((m) => ({
        meatItemId: m.id,
        categoryCode: m.categoryCode,
        categoryName: m.categoryName,
        label: m.label,
        quantityKg: byId.get(m.id) ?? 0,
      })),
    });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "İstek gövdesi okunamadı (geçersiz biçim)." }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Girilen değerler geçerli değil (kg tam sayı olmalı).", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { date, items } = parsed.data;
  let day: Date;
  try {
    day = parseDateOnly(date);
  } catch {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  if (!isDateEditable(day)) {
    return NextResponse.json(
      { error: "Geçmiş tarihlerdeki kayıtlar değiştirilemez." },
      { status: 403 }
    );
  }

  try {
    const validIds = new Set(
      (await prisma.meatItem.findMany({ select: { id: true } })).map((x) => x.id)
    );
    for (const row of items) {
      if (!validIds.has(row.meatItemId)) {
        return NextResponse.json({ error: `Bilinmeyen et kalemi: ${row.meatItemId}` }, { status: 400 });
      }
    }

    await prisma.$transaction(
      items.map((row) =>
        prisma.dailyConsumption.upsert({
          where: {
            date_meatItemId: { date: day, meatItemId: row.meatItemId },
          },
          create: {
            date: day,
            meatItemId: row.meatItemId,
            quantityKg: row.quantityKg,
          },
          update: { quantityKg: row.quantityKg },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}
