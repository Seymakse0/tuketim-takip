import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isDateEditable, parseDateOnly } from "@/lib/dates";
import { normalizeMeatItemLabel } from "@/lib/meat-labels";
import { prismaErrorResponse } from "@/lib/prisma-http";

const halfKg = (n: number) => Math.round(n * 2) / 2;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parseConsumptionBody(body: unknown):
  | { ok: true; date: string; items: { meatItemId: string; quantityKg: number }[] }
  | { ok: false } {
  if (body === null || typeof body !== "object") return { ok: false };
  const o = body as Record<string, unknown>;
  const date = o.date;
  if (typeof date !== "string" || !DATE_ONLY.test(date)) return { ok: false };
  const raw = o.items;
  if (!Array.isArray(raw)) return { ok: false };
  const items: { meatItemId: string; quantityKg: number }[] = [];
  for (const el of raw) {
    if (el === null || typeof el !== "object") return { ok: false };
    const row = el as Record<string, unknown>;
    const meatItemId = row.meatItemId;
    if (typeof meatItemId !== "string" || meatItemId.length < 1) return { ok: false };
    const q = row.quantityKg;
    const n =
      typeof q === "number"
        ? q
        : typeof q === "string"
          ? Number.parseFloat(q)
          : Number.NaN;
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return { ok: false };
    items.push({ meatItemId, quantityKg: halfKg(n) });
  }
  return { ok: true, date, items };
}

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

    const byId = new Map(
      rows.map((r: { meatItemId: string; quantityKg: number }) => [r.meatItemId, r.quantityKg])
    );
    const editable = isDateEditable(day);

    return NextResponse.json({
      date: dateStr.slice(0, 10),
      editable,
      items: meatItems.map((m: { id: string; categoryCode: string; categoryName: string; label: string }) => ({
        meatItemId: m.id,
        categoryCode: m.categoryCode,
        categoryName: m.categoryName,
        label: normalizeMeatItemLabel(m.label),
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

  const parsed = parseConsumptionBody(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Girilen değerler geçerli değil (kg tam sayı olmalı)." },
      { status: 400 }
    );
  }

  const { date, items } = parsed;
  let day: Date;
  try {
    day = parseDateOnly(date);
  } catch {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  try {
    const validIds = new Set(
      (await prisma.meatItem.findMany({ select: { id: true } })).map((x: { id: string }) => x.id)
    );
    for (const row of items) {
      if (!validIds.has(row.meatItemId)) {
        return NextResponse.json({ error: `Bilinmeyen et kalemi: ${row.meatItemId}` }, { status: 400 });
      }
    }

    await prisma.$transaction(
      items.map((row: { meatItemId: string; quantityKg: number }) =>
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
