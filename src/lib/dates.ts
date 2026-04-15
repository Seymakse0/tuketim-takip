import { format } from "date-fns";

/**
 * Takvim günü YYYY-MM-DD — Prisma `@db.Date` ve PG ile yaz/oku hep UTC takvim bileşenleriyle eşleşir.
 * Yerel gece yarısı `Date` kullanmak UTC+ bölgelerde PG DATE’e bir gün kayması yapıyordu (rapor grid’i bozuluyordu).
 */
export function dateToYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readAppTimezoneFromEnv(): string | undefined {
  const g = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return g.process?.env?.APP_TIMEZONE;
}

export function todayYmd(): string {
  const tz = readAppTimezoneFromEnv();
  if (tz) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) throw new Error("Geçersiz tarih");
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(dt.getTime())) throw new Error("Geçersiz tarih");
  return dt;
}

/** Geçmiş günler dahil tüm takvim tarihlerinde kayıt girilebilir / güncellenir. */
export function isDateEditable(entryDate: Date): boolean {
  void entryDate;
  return true;
}

/** YYYY-MM-DD takviminde ± gün (PG `@db.Date` ile aynı eksen — UTC). */
export function addCalendarDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const t = Date.UTC(y, m - 1, d + deltaDays);
  const dt = new Date(t);
  if (Number.isNaN(dt.getTime())) return ymd;
  return dateToYmd(dt);
}

/** Sorgu aralığı: tek takvim günü (UTC). */
export function dayRange(date: Date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  return {
    from: new Date(Date.UTC(y, m, d, 0, 0, 0, 0)),
    to: new Date(Date.UTC(y, m, d, 23, 59, 59, 999)),
  };
}

/** Haftalık rapor / hafta özeti: içinde bulunulan Pazartesi–Pazar (UTC takvim). */
export function weekRangeContaining(date: Date) {
  const y = date.getUTCFullYear();
  const mo = date.getUTCMonth();
  const d = date.getUTCDate();
  const anchorMs = Date.UTC(y, mo, d);
  const dow = new Date(anchorMs).getUTCDay();
  const daysSinceMonday = (dow + 6) % 7;
  const mondayMs = anchorMs - daysSinceMonday * 86_400_000;
  const from = new Date(mondayMs);
  const sunday = new Date(mondayMs + 6 * 86_400_000);
  const to = new Date(
    Date.UTC(sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate(), 23, 59, 59, 999)
  );
  return { from, to };
}

export function monthRange(date: Date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const from = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const to = new Date(Date.UTC(y, m, lastDay, 23, 59, 59, 999));
  return { from, to };
}

/** Haftalık özet `from`–`to` (YYYY-MM-DD) tek günde birleştirirken bitiş gününü dahil etmek için. */
export function endOfUtcCalendarDay(date: Date): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  return new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
}

/** Türkçe tarih etiketleri — `timeZone: UTC` ile sadece takvim günü (PG DATE) gösterilir. */
export function formatTr(d: Date, pattern: string) {
  const utc = { timeZone: "UTC" as const };
  switch (pattern) {
    case "MMMM yyyy":
      return new Intl.DateTimeFormat("tr-TR", { ...utc, month: "long", year: "numeric" }).format(d);
    case "d MMMM yyyy":
      return new Intl.DateTimeFormat("tr-TR", {
        ...utc,
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
    case "d MMM yyyy":
      return new Intl.DateTimeFormat("tr-TR", {
        ...utc,
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
    case "d MMM":
      return new Intl.DateTimeFormat("tr-TR", { ...utc, day: "numeric", month: "short" }).format(d);
    default:
      return format(d, pattern);
  }
}
