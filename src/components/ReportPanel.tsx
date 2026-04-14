"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

type ReportRow = {
  categoryCode: string;
  categoryName: string;
  label: string;
  quantityKg: number;
};

type ReportPayload = {
  type: string;
  label: string;
  rows: ReportRow[];
  totalKg: number;
  from?: string;
  to?: string;
  date?: string;
};

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

function fmtKgCell(n: number): string {
  if (n === 0) return "0";
  const r = Math.round(n * 1000) / 1000;
  if (Math.abs(r - Math.round(r)) < 1e-9) return String(Math.round(r));
  return String(r).replace(".", ",");
}

export function ReportPanel() {
  const [kind, setKind] = useState<"daily" | "weekly" | "monthly">("daily");
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [day, setDay] = useState(() => new Date().getDate());

  const maxDayInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);

  useEffect(() => {
    if (day > maxDayInMonth) setDay(maxDayInMonth);
  }, [day, maxDayInMonth]);

  const date = useMemo(() => {
    const d = Math.min(day, maxDayInMonth);
    return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }, [year, month, day, maxDayInMonth]);

  const [report, setReport] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    const y0 = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => y0 - 3 + i);
  }, []);

  const dayOptions = useMemo(() => Array.from({ length: maxDayInMonth }, (_, i) => i + 1), [maxDayInMonth]);

  const run = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const path =
        kind === "daily"
          ? `/api/reports/daily?date=${encodeURIComponent(date)}`
          : kind === "weekly"
            ? `/api/reports/weekly?date=${encodeURIComponent(date)}`
            : `/api/reports/monthly?date=${encodeURIComponent(date)}`;
      const res = await fetch(path);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Rapor oluşturulamadı.");
      setReport(json);
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
        ? "Seçilen günün içinde bulunduğu Pazartesi–Pazar haftası."
        : "Seçilen tarihin ayı (aynı ay içinde hangi gün seçilirseniz seçin, ay özeti aynıdır).";

  return (
    <div id="raporlar" className="scroll-mt-6 rapor-ozet-root" aria-labelledby="raporlar-baslik">
      <h2 id="raporlar-baslik" className="card-title" style={{ marginBottom: 12 }}>
        Günlük / haftalık / aylık özet raporlar
      </h2>

      <p className="voyage-muted mb-16" style={{ maxWidth: 640 }}>
        Rapor türünü, yıl, ay ve günü seçin; <strong>Raporu oluştur</strong> ile tabloyu getirin.{" "}
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
            <option value="weekly">Haftalık (Pzt–Paz)</option>
            <option value="monthly">Aylık</option>
          </select>
        </div>
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

      {report && (
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
