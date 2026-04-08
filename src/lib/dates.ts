import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { tr } from "date-fns/locale";

/** Takvim günü olarak YYYY-MM-DD (PostgreSQL @db.Date ile uyumlu) */
export function dateToYmd(d: Date): string {
  // toISOString() UTC kullanır; UTC+ bölgelerde yerel gece yarısı bir gün geri kayar (ör. İstanbul).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayYmd(): string {
  const tz = process.env.APP_TIMEZONE;
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

/** Sadece bugünün kaydı girilebilir / güncellenir; dün ve ileri tarihler düzenlenemez. */
export function isDateEditable(entryDate: Date): boolean {
  return dateToYmd(entryDate) === todayYmd();
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

export function formatTr(d: Date, pattern: string) {
  return format(d, pattern, { locale: tr });
}
