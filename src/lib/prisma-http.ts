import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

const DB_UNAVAILABLE =
  "Veritabanına ulaşılamıyor. PostgreSQL konteyneri ayakta mı kontrol edin (docker compose ps). Üretimde .env içindeki POSTGRES_PASSWORD, veritabanı volume’u ilk oluşturulurken kullanılan şifreyle aynı olmalı; şifreyi değiştirdiyseniz veritabanındaki kullanıcı şifresini de güncelleyin veya eski şifreyi .env’e yazın.";

/** JSON yanıt; bağlantı/Prisma hatalarında 503 veya 500. */
export function prismaErrorResponse(e: unknown): NextResponse {
  if (e instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    // P1000: kimlik doğrulama, P1001: sunucuya ulaşılamıyor, P1002: zaman aşımı, P1017: bağlantı kapandı
    if (e.code === "P1000" || e.code === "P1001" || e.code === "P1002" || e.code === "P1017") {
      return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
    }
  }
  console.error(e);
  return NextResponse.json({ error: "Veritabanı işlemi başarısız." }, { status: 500 });
}
