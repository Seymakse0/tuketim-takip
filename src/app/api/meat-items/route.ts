import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeMeatItemLabel } from "@/lib/meat-labels";
import { prismaErrorResponse } from "@/lib/prisma-http";

export async function GET() {
  try {
    const items = await prisma.meatItem.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(
      items.map((m: { label: string } & Record<string, unknown>) => ({
        ...m,
        label: normalizeMeatItemLabel(m.label),
      }))
    );
  } catch (e) {
    return prismaErrorResponse(e);
  }
}
