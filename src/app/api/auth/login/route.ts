import { NextRequest, NextResponse } from "next/server";
import { safePasswordEqual } from "@/lib/auth-password";
import {
  createSessionToken,
  getAuthSecret,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SEC,
} from "@/lib/auth-session";
import { parseAuthUsers } from "@/lib/auth-users";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const o = body as { username?: string; password?: string };
  const username = String(o?.username ?? "")
    .replace(/\r/g, "")
    .trim();
  const password = String(o?.password ?? "").replace(/\r/g, "");
  if (!username || !password) {
    return NextResponse.json({ error: "Kullanıcı adı ve şifre gerekli" }, { status: 400 });
  }

  let secret: string;
  try {
    secret = getAuthSecret();
  } catch {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik (APP_AUTH_SECRET)." },
      { status: 500 }
    );
  }

  const users = parseAuthUsers();
  if (users.size === 0) {
    return NextResponse.json(
      {
        error:
          "Hiç kullanıcı tanımlı değil. APP_AUTH_USERS veya APP_AUTH_USERS_JSON ortam değişkenini ayarlayın.",
      },
      { status: 503 }
    );
  }

  const expected = users.get(username);
  if (expected === undefined || !safePasswordEqual(expected, password)) {
    return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı" }, { status: 401 });
  }

  const token = await createSessionToken(username, secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
