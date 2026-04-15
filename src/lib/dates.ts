import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";

/**
 * Takvim günü YYYY-MM-DD — PG `@db.Date` + Prisma’nın döndürdüğü an için yerel bileşenler (Dockerfile’da TZ=Europe/Istanbul).
 * UTC `getUTC* ile okumak, eski kayıtların (tarihin TR’de 14’ü ama PG’de 13 gibi) yanlış sütuna düşmesine yol açıyordu.
 */
export function dateToYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
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
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) throw new Error("Geçersiz tarih");
  return startOfDay(dt);
}

/** Geçmiş günler dahil tüm takvim tarihlerinde kayıt girilebilir / güncellenir. */
export function isDateEditable(entryDate: Date): boolean {
  void entryDate;
  return true;
}

/** Yerel takvime göre YYYY-MM-DD ± gün (TZ ile uyumlu; prod imajda Europe/Istanbul). */
export function addCalendarDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const dt = new Date(y, m - 1, d + deltaDays);
  if (Number.isNaN(dt.getTime())) return ymd;
  return dateToYmd(dt);
}

export function dayRange(date: Date) {
  const d = startOfDay(date);
  return { from: startOfDay(d), to: endOfDay(d) };
}

export function weekRangeContaining(date: Date) {
  const d = startOfDay(date);
  return {
    from: startOfWeek(d, { weekStartsOn: 1 }),
    to: endOfWeek(d, { weekStartsOn: 1 }),
  };
}

export function monthRange(date: Date) {
  const d = startOfDay(date);
  return { from: startOfMonth(d), to: endOfMonth(d) };
}

/**
 * Takvim ayının ilk ve son günü `YYYY-MM-DD` (yıl/ay doğrulanmış olmalı).
 * Rapor sorgularında JS `Date` yerine PG `date` ile karşılaştırmak için.
 */
export function calendarMonthYmdBounds(year: number, month1to12: number): { fromYmd: string; toYmd: string } {
  if (month1to12 < 1 || month1to12 > 12) throw new Error("Geçersiz ay");
  const last = new Date(year, month1to12, 0).getDate();
  return {
    fromYmd: `${year}-${String(month1to12).padStart(2, "0")}-01`,
    toYmd: `${year}-${String(month1to12).padStart(2, "0")}-${String(last).padStart(2, "0")}`,
  };
}

/** Türkçe tarih etiketleri — date-fns locale alt yolu bazı TS ortamlarında çözülmediği için Intl kullanılır. */
export function formatTr(d: Date, pattern: string) {
  switch (pattern) {
    case "MMMM yyyy":
      return new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(d);
    case "d MMMM yyyy":
      return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
    case "d MMM yyyy":
      return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
    case "d MMM":
      return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(d);
    default:
      return format(d, pattern);
  }
}
