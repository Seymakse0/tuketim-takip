"use client";

import { useState, type ChangeEvent } from "react";

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

export function ReportPanel() {
  const [kind, setKind] = useState<"daily" | "weekly" | "monthly">("daily");
  const [date, setDate] = useState(() => {
    const n = new Date();
    const y = n.getFullYear();
    const m = String(n.getMonth() + 1).padStart(2, "0");
    const d = String(n.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div id="raporlar" className="scroll-mt-6" aria-labelledby="raporlar-baslik">
      <h2 id="raporlar-baslik" className="card-title" style={{ marginBottom: 8 }}>
        Günlük / haftalık / aylık özet raporlar
      </h2>
      <p className="voyage-muted mb-16">
        <strong>Rapor türü</strong>nden günlük, haftalık veya aylık seçin; tarih seçip{" "}
        <strong>Raporu oluştur</strong> düğmesine basın. Haftalık raporda, seçtiğiniz günün içinde bulunduğu{" "}
        <strong>Pazartesi–Pazar</strong> haftası kullanılır.
      </p>
      <div
        className="mb-24"
        style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}
      >
        <div className="form-group" style={{ minWidth: 200 }}>
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
        <div className="form-group" style={{ minWidth: 200 }}>
          <label htmlFor="rapor-tarih" className="form-label">
            {kind === "daily"
              ? "Rapor günü"
              : kind === "weekly"
                ? "Haftayı seçmek için bu haftadan bir gün"
                : "Ayı seçmek için o ayda bir gün"}
          </label>
          <input
            id="rapor-tarih"
            type="date"
            value={date}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
          />
        </div>
        <button type="button" onClick={() => void run()} disabled={loading} className="btn btn-primary">
          {loading ? "Hazırlanıyor…" : "Raporu oluştur"}
        </button>
      </div>

      {error && (
        <p className="voyage-alert voyage-alert--error mb-16" role="alert">
          {error}
        </p>
      )}

      {report && (
        <div className="table-wrap">
          <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>{report.label}</p>
          {report.from && report.to ? (
            <p className="voyage-muted mb-16">
              Dönem: {report.from} – {report.to}
            </p>
          ) : null}
          <table className="voyage-report-table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Kategori</th>
                <th>Et türü</th>
                <th style={{ textAlign: "right" }}>Kilogram</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.categoryCode}</td>
                  <td>{r.categoryName}</td>
                  <td>{r.label}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.quantityKg}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ fontWeight: 700 }}>
                  Toplam
                </td>
                <td style={{ textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {report.totalKg}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
