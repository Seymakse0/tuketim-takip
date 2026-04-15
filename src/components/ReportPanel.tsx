"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";

type ReportRow = {
  categoryCode: string;
  categoryName: string;
  label: string;
  quantityKg: number;
};

type ReportPayload = {
  type: "daily" | "weekly";
  label: string;
  rows: ReportRow[];
  totalKg: number;
  from?: string;
  to?: string;
  date?: string;
};

type MonthlyGridPayload = {
  type: "monthly-grid";
  label: string;
  year: number;
  month: number;
  from: string;
  to: string;
  dates: string[];
  meatItems: Array<{
    id: string;
    categoryCode: string;
    categoryName: string;
    label: string;
  }>;
  matrix: Record<string, Record<string, number>>;
};

type ReportState = ReportPayload | MonthlyGridPayload | null;

/** Hızlı ay/yıl değişiminde eski fetch sonucunun state’e yazılmasını engeller */
let monthlyGridLoadSeq = 0;

const MONTH_OPTIONS = [
  { value: 1, label: "Ocak" },
  { value: 2, label: "Şubat" },
  { value: 3, label: "Mart" },
  { value: 4, label: "Nisan" },
  { value: 5, label: "Mayıs" },
  { value: 6, label: "Haziran" },
  { value: 7, label: "Temmuz" },
  { value: 8, label: "Ağustos" },
  { value: 9, label: "Eylül" },
  { value: 10, label: "Ekim" },
  { value: 11, label: "Kasım" },
  { value: 12, label: "Aralık" },
];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultWeekFromTo(): { from: string; to: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { from: toYmd(start), to: toYmd(end) };
}

function fmtKgCell(n: number): string {
  if (n === 0) return "0";
  const r = Math.round(n * 1000) / 1000;
  if (Math.abs(r - Math.round(r)) < 1e-9) return String(Math.round(r));
  return String(r).replace(".", ",");
}

function dailyTotalsForMonth(grid: MonthlyGridPayload): number[] {
  return grid.dates.map((date) =>
    grid.meatItems.reduce((sum, m) => sum + (grid.matrix[m.id]?.[date] ?? 0), 0),
  );
}

function rowTotalForMonth(meatId: string, grid: MonthlyGridPayload): number {
  return grid.dates.reduce((s, d) => s + (grid.matrix[meatId]?.[d] ?? 0), 0);
}

/** Yerel gün / kısa gün adı (Türkçe) — date-fns locale alt yolu TS çözümü sorunlarından kaçınır */
function formatGridDayHeader(isoYmd: string): { num: string; dow: string } {
  const dt = new Date(`${isoYmd}T12:00:00`);
  return {
    num: new Intl.DateTimeFormat("tr-TR", { day: "numeric" }).format(dt),
    dow: new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(dt),
  };
}

export function ReportPanel() {
  const [kind, setKind] = useState<"daily" | "weekly" | "monthly">("daily");
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [day, setDay] = useState(() => new Date().getDate());

  const [weekFrom, setWeekFrom] = useState(() => defaultWeekFromTo().from);
  const [weekTo, setWeekTo] = useState(() => defaultWeekFromTo().to);

  const maxDayInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);

  useEffect(() => {
    if (day > maxDayInMonth) setDay(maxDayInMonth);
  }, [day, maxDayInMonth]);

  const dateDaily = useMemo(() => {
    const d = Math.min(day, maxDayInMonth);
    return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }, [year, month, day, maxDayInMonth]);

  const [report, setReport] = useState<ReportState>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchMonthlyGrid = useCallback(async () => {
    const loadId = ++monthlyGridLoadSeq;
    setLoading(true);
    setError(null);
    try {
      const path = `/api/reports/monthly-grid?year=${year}&month=${month}`;
      const res = await fetch(path);
      const json: unknown = await res.json();
      if (loadId !== monthlyGridLoadSeq) return;
      if (!res.ok) {
        const err = json as { error?: string };
        throw new Error(err.error || "Rapor oluşturulamadı.");
      }
      const data = json as Partial<MonthlyGridPayload>;
      if (data.type !== "monthly-grid" || !Array.isArray(data.dates) || !Array.isArray(data.meatItems)) {
        throw new Error("Sunucudan beklenmeyen rapor yanıtı.");
      }
      setReport(data as MonthlyGridPayload);
    } catch (e) {
      if (loadId !== monthlyGridLoadSeq) return;
      setError(e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      if (loadId === monthlyGridLoadSeq) setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    setReport(null);
  }, [kind]);

  useEffect(() => {
    if (kind !== "monthly") return;
    void fetchMonthlyGrid();
  }, [kind, year, month, fetchMonthlyGrid]);

  const yearOptions = useMemo(() => {
    const y0 = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => y0 - 3 + i);
  }, []);

  const dayOptions = useMemo(() => Array.from({ length: maxDayInMonth }, (_, i) => i + 1), [maxDayInMonth]);

  const run = async () => {
    setError(null);
    if (kind === "monthly") {
      await fetchMonthlyGrid();
      return;
    }
    setLoading(true);
    setReport(null);
    try {
      let path: string;
      if (kind === "daily") {
        path = `/api/reports/daily?date=${encodeURIComponent(dateDaily)}`;
      } else {
        if (!DATE_ONLY.test(weekFrom) || !DATE_ONLY.test(weekTo)) {
          throw new Error("Başlangıç ve bitiş için geçerli tarih seçin.");
        }
        if (weekFrom > weekTo) {
          throw new Error("Başlangıç tarihi bitişten sonra olamaz.");
        }
        path = `/api/reports/weekly?from=${encodeURIComponent(weekFrom)}&to=${encodeURIComponent(weekTo)}`;
      }
      const res = await fetch(path);
      const json: unknown = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error || "Rapor oluşturulamadı.");
      setReport(json as ReportPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const kindHint =
    kind === "daily"
      ? "Seçilen günün özeti."
      : kind === "weekly"
        ? "Başlangıç ve bitiş tarihleri arasındaki tüketim toplamları (dönem istediğiniz gibi seçilebilir)."
        : "Ay veya yılı değiştirdiğinizde tablo güncellenir: her sütun bir gün, en altta o günün toplamı.";

  const intro =
    kind === "monthly"
      ? "Rapor türü, yıl ve ayı seçin; "
      : kind === "weekly"
        ? "Rapor türü ve haftalık dönem için başlangıç/bitiş tarihlerini seçin; "
        : "Rapor türü, yıl, ay ve günü seçin; ";

  const introRun =
    kind === "monthly" ? (
      "Günlük sütunlar yıl veya ayı değiştirdiğinizde otomatik güncellenir; "
    ) : (
      <>
        <strong>Raporu oluştur</strong> ile tabloyu getirin;{" "}
      </>
    );

  return (
    <div id="raporlar" className="scroll-mt-6 rapor-ozet-root" aria-labelledby="raporlar-baslik">
      <h2 id="raporlar-baslik" className="card-title" style={{ marginBottom: 12 }}>
        Günlük / haftalık / aylık özet raporlar
      </h2>

      <p className="voyage-muted mb-16" style={{ maxWidth: 640 }}>
        {intro}
        {introRun}
        <span className="voyage-muted">{kindHint}</span>
      </p>

      <div className="rapor-ozet-toolbar">
        <div className="form-group rapor-ozet-field">
          <label htmlFor="rapor-tur" className="form-label">
            Rapor türü
          </label>
          <select
            id="rapor-tur"
            value={kind}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setKind(e.target.value as typeof kind)}
          >
            <option value="daily">Günlük</option>
            <option value="weekly">Haftalık</option>
            <option value="monthly">Aylık</option>
          </select>
        </div>

        {kind === "weekly" ? (
          <>
            <div className="form-group rapor-ozet-field">
              <label htmlFor="rapor-hafta-bas" className="form-label">
                Başlangıç tarihi
              </label>
              <input
                id="rapor-hafta-bas"
                type="date"
                value={weekFrom}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setWeekFrom(e.target.value)}
              />
            </div>
            <div className="form-group rapor-ozet-field">
              <label htmlFor="rapor-hafta-bit" className="form-label">
                Bitiş tarihi
              </label>
              <input
                id="rapor-hafta-bit"
                type="date"
                value={weekTo}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setWeekTo(e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="form-group rapor-ozet-field">
              <label htmlFor="rapor-yil" className="form-label">
                Yıl
              </label>
              <select
                id="rapor-yil"
                value={year}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group rapor-ozet-field">
              <label htmlFor="rapor-ay" className="form-label">
                Ay
              </label>
              <select
                id="rapor-ay"
                value={month}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setMonth(Number(e.target.value))}
              >
                {MONTH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {kind === "daily" && (
              <div className="form-group rapor-ozet-field">
                <label htmlFor="rapor-gun" className="form-label">
                  Gün
                </label>
                <select
                  id="rapor-gun"
                  value={day}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setDay(Number(e.target.value))}
                >
                  {dayOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <div className="rapor-ozet-actions">
          <button type="button" onClick={() => void run()} disabled={loading} className="btn btn-primary">
            {loading ? "Hazırlanıyor…" : "Raporu oluştur"}
          </button>
        </div>
      </div>

      {error && (
        <p className="voyage-alert voyage-alert--error mb-16" role="alert">
          {error}
        </p>
      )}

      {report && report.type === "monthly-grid" && (
        <div className="rapor-ozet-sonuc">
          <p className="rapor-ozet-sonuc-baslik">{report.label}</p>
          <p className="voyage-muted mb-16">
            Dönem: {report.from} – {report.to}
          </p>
          <MonthlyGridTable grid={report} />
        </div>
      )}

      {report && report.type !== "monthly-grid" && (
        <div className="rapor-ozet-sonuc">
          <p className="rapor-ozet-sonuc-baslik">{report.label}</p>
          {report.from && report.to ? (
            <p className="voyage-muted mb-16">
              Dönem: {report.from} – {report.to}
            </p>
          ) : null}
          <div className="rapor-ozet-table-scroll">
            <table className="voyage-report-table rapor-ozet-table">
              <thead>
                <tr>
                  <th scope="col">Kod</th>
                  <th scope="col">Kategori</th>
                  <th scope="col">Et türü</th>
                  <th scope="col" className="rapor-ozet-col-num">
                    Kilogram
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r, i) => (
                  <tr key={`${r.categoryCode}-${r.label}-${i}`}>
                    <td>{r.categoryCode}</td>
                    <td>{r.categoryName}</td>
                    <td>{r.label}</td>
                    <td className="rapor-ozet-col-num">{fmtKgCell(r.quantityKg)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ fontWeight: 700 }}>
                    Toplam
                  </td>
                  <td className="rapor-ozet-col-num" style={{ fontWeight: 700 }}>
                    {fmtKgCell(report.totalKg)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthlyGridTable({ grid }: { grid: MonthlyGridPayload }) {
  const dailyTotals = useMemo(() => dailyTotalsForMonth(grid), [grid]);
  const grandTotal = useMemo(() => dailyTotals.reduce((s, n) => s + n, 0), [dailyTotals]);

  return (
    <div className="rapor-ozet-table-scroll rapor-ay-grid-scroll">
      <table
        className="voyage-report-table rapor-ozet-table rapor-ay-grid-table"
        style={{ minWidth: `${Math.max(520, 240 + grid.dates.length * 48 + 96)}px` }}
      >
        <thead>
          <tr>
            <th scope="col">Kod</th>
            <th scope="col">Kategori</th>
            <th scope="col">Et türü</th>
            {grid.dates.map((d) => {
              const { num, dow } = formatGridDayHeader(d);
              return (
                <th key={d} scope="col" className="rapor-ozet-col-num rapor-ay-grid-dayhead" title={d}>
                  <span className="rapor-ay-grid-daynum">{num}</span>
                  <span className="rapor-ay-grid-dow">{dow}</span>
                </th>
              );
            })}
            <th scope="col" className="rapor-ozet-col-num">
              Ay toplamı
            </th>
          </tr>
        </thead>
        <tbody>
          {grid.meatItems.map((m) => (
            <tr key={m.id}>
              <td>{m.categoryCode}</td>
              <td>{m.categoryName}</td>
              <td>{m.label}</td>
              {grid.dates.map((d) => (
                <td key={d} className="rapor-ozet-col-num">
                  {fmtKgCell(grid.matrix[m.id]?.[d] ?? 0)}
                </td>
              ))}
              <td className="rapor-ozet-col-num">{fmtKgCell(rowTotalForMonth(m.id, grid))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} style={{ fontWeight: 700 }}>
              Günlük toplam
            </td>
            {dailyTotals.map((t, i) => (
              <td key={grid.dates[i]} className="rapor-ozet-col-num" style={{ fontWeight: 700 }}>
                {fmtKgCell(t)}
              </td>
            ))}
            <td className="rapor-ozet-col-num" style={{ fontWeight: 700 }}>
              {fmtKgCell(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
