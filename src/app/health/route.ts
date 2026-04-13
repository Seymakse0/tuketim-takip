import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Nginx / izleme için oturum gerektirmez (middleware’de public). */
export async function GET(request: NextRequest) {
  const base = { ok: true as const, service: "tuketim-kontrol" };
  if (request.nextUrl.searchParams.get("db") !== "1") {
    return NextResponse.json(base, { status: 200 });
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ...base, db: true }, { status: 200 });
  } catch (e) {
    console.error("health db check:", e);
    return NextResponse.json(
      { ok: false, service: "tuketim-kontrol", db: false, error: "database_unreachable" },
      { status: 503 }
    );
  }
}
