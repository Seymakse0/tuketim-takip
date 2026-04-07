import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { prismaErrorResponse } from "@/lib/prisma-http";

export async function GET() {
  try {
    const items = await prisma.meatItem.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(items);
  } catch (e) {
    return prismaErrorResponse(e);
  }
}
