// Next.js `next dev` / `next build` ile yeniden üretilebilir; depoda tutulur ki
// `.next` klasörü olmayan klonlarda da TypeScript `next-env.d.ts` referansı kırılmasın.
// Uyumsuzluk olursa: `npx next dev` veya `npx next build` çalıştırıp çıktıyı karşılaştırın.

import type { ReactNode } from "react";

type AppRoutes = "/" | "/login" | "/rapor-tablo"
type AppRouteHandlerRoutes =
  | "/api/auth/login"
  | "/api/auth/logout"
  | "/api/consumption"
  | "/api/export/daily"
  | "/api/meat-items"
  | "/api/reports/daily"
  | "/api/reports/monthly"
  | "/api/reports/monthly-grid"
  | "/api/reports/weekly"
  | "/health"
type PageRoutes = never
type LayoutRoutes = "/" | "/login"
type RedirectRoutes = never
type RewriteRoutes = "/favicon.ico"
type Routes = AppRoutes | PageRoutes | LayoutRoutes | RedirectRoutes | RewriteRoutes | AppRouteHandlerRoutes

interface ParamMap {
  "/": {}
  "/login": {}
  "/rapor-tablo": {}
  "/api/auth/login": {}
  "/api/auth/logout": {}
  "/api/consumption": {}
  "/api/export/daily": {}
  "/api/meat-items": {}
  "/api/reports/daily": {}
  "/api/reports/monthly": {}
  "/api/reports/monthly-grid": {}
  "/api/reports/weekly": {}
  "/health": {}
  "/favicon.ico": {}
}

export type ParamsOf<Route extends Routes> = ParamMap[Route]

interface LayoutSlotMap {
  "/": never
  "/login": never
}

export type {
  AppRoutes,
  PageRoutes,
  LayoutRoutes,
  RedirectRoutes,
  RewriteRoutes,
  ParamMap,
  AppRouteHandlerRoutes,
}

declare global {
  interface PageProps<AppRoute extends AppRoutes> {
    params: Promise<ParamMap[AppRoute]>
    searchParams: Promise<Record<string, string | string[] | undefined>>
  }

  type LayoutProps<LayoutRoute extends LayoutRoutes> = {
    params: Promise<ParamMap[LayoutRoute]>
    children: ReactNode
  } & {
    [K in LayoutSlotMap[LayoutRoute]]: ReactNode
  }

  interface RouteContext<AppRouteHandlerRoute extends AppRouteHandlerRoutes> {
    params: Promise<ParamMap[AppRouteHandlerRoute]>
  }
}
