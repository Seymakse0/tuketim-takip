"use client";

import { useState } from "react";

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
    <div
      id="raporlar"
      className="scroll-mt-6 pt-2 border-t"
      style={{ borderColor: "var(--tk-border, #e2e8f0)" }}
      aria-labelledby="raporlar-baslik"
    >
      <h2
        id="raporlar-baslik"
        className="text-xl font-semibold mb-2"
        style={{ color: "var(--tk-accent, #047857)" }}
      >
        Raporlar (salt okunur)
      </h2>
      <p className="text-slate-600 text-sm mb-4">
        Günlük, haftalık veya aylık özet için tarih seçip <strong>Oluştur</strong> düğmesine basın.
        Hafta, seçtiğiniz günün içinde bulunduğu <strong>Pazartesi–Pazar</strong> aralığıdır.
      </p>
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Rapor türü</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="daily">Günlük</option>
            <option value="weekly">Haftalık (Pzt–Paz)</option>
            <option value="monthly">Aylık</option>
          </select>
        </div>
        <div>
          <label htmlFor="rapor-tarih" className="block text-sm font-medium text-slate-600 mb-1">
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
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-60"
          style={{ background: "var(--tk-accent, #047857)" }}
        >
          {loading ? "Hazırlanıyor…" : "Raporu oluştur"}
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {report && (
        <div className="overflow-x-auto">
          <p className="font-medium text-slate-800 mb-2">{report.label}</p>
          {report.from && report.to ? (
            <p className="text-sm text-slate-500 mb-4">
              Dönem: {report.from} – {report.to}
            </p>
          ) : null}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-white" style={{ background: "var(--tk-accent, #047857)" }}>
                <th className="p-2 border border-white/20">Kod</th>
                <th className="p-2 border border-white/20">Kategori</th>
                <th className="p-2 border border-white/20">Et türü</th>
                <th className="p-2 border border-white/20 text-right">Kilogram</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r, i) => (
                <tr key={i} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="p-2 border border-slate-200">{r.categoryCode}</td>
                  <td className="p-2 border border-slate-200">{r.categoryName}</td>
                  <td className="p-2 border border-slate-200">{r.label}</td>
                  <td className="p-2 border border-slate-200 text-right font-mono">{r.quantityKg}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-slate-100">
                <td className="p-2 border border-slate-200" colSpan={3}>
                  Toplam
                </td>
                <td className="p-2 border border-slate-200 text-right font-mono">{report.totalKg}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
