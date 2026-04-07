import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

const DB_UNAVAILABLE =
  "Veritabanına ulaşılamıyor. PostgreSQL çalışmıyor olabilir. Yerel geliştirme: Docker Desktop’ı açın, proje klasöründe npm run db:up çalıştırın. İlk kurulumda: npx prisma migrate deploy ve npm run db:seed";

/** JSON yanıt; bağlantı/Prisma hatalarında 503 veya 500. */
export function prismaErrorResponse(e: unknown): NextResponse {
  if (e instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P1001" || e.code === "P1017") {
      return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
    }
  }
  console.error(e);
  return NextResponse.json({ error: "Veritabanı işlemi başarısız." }, { status: 500 });
}
