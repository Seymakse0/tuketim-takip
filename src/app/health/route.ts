import { NextResponse } from "next/server";

/** Nginx / izleme için oturum gerektirmez (middleware’de public). */
export function GET() {
  return NextResponse.json({ ok: true, service: "tuketim-kontrol" }, { status: 200 });
}
