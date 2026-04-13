import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/_next/static") || pathname.startsWith("/_next/image")) return true;
  if (pathname === "/favicon.ico" || pathname === "/favicon.png") return true;
  if (pathname === "/icon" || pathname.startsWith("/icon/")) return true;
  if (pathname === "/apple-icon" || pathname.startsWith("/apple-icon/")) return true;
  if (pathname === "/health") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }

    const secret = process.env.APP_AUTH_SECRET?.trim();
    if (!secret) {
      return new NextResponse("Sunucu yapılandırması eksik: APP_AUTH_SECRET tanımlı değil.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
    const sessionUser = token ? await verifySessionToken(token, secret) : null;

    if (pathname === "/login" || pathname.startsWith("/login/")) {
      if (sessionUser) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/logout")) {
      return NextResponse.next();
    }

    if (!sessionUser) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
      }
      const login = new URL("/login", request.url);
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }

    return NextResponse.next();
  } catch (err) {
    console.error("middleware error:", err);
    return new NextResponse("Geçici sunucu hatası.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png).*)",
    "/",
  ],
};
