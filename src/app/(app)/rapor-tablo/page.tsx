"use client";

import Link from "next/link";
import { ReportPanel } from "@/components/ReportPanel";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { format, parseISO } from "date-fns";

type MeatCol = {
  id: string;
  categoryCode: string;
  categoryName: string;
  label: string;
};

type GridPayload = {
  type: "monthly-grid";
  label: string;
  year: number;
  month: number;
  from: string;
  to: string;
  dates: string[];
  meatItems: MeatCol[];
  matrix: Record<string, Record<string, number>>;
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

function fmtKg(n: number): string {
  if (n === 0) return "—";
  const r = Math.round(n * 1000) / 1000;
  if (Math.abs(r - Math.round(r)) < 1e-9) return String(Math.round(r));
  return r.toFixed(1).replace(".", ",");
}

export default function RaporTabloPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [data, setData] = useState<GridPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ year: String(year), month: String(month) });
      const res = await fetch(`/api/reports/monthly-grid?${q}`);
      const json = (await res.json()) as GridPayload & { error?: string };
      if (!res.ok) throw new Error(json.error || "Veri alınamadı.");
      setData(json);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Beklenmeyen hata.");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const yearOptions = useMemo(() => {
    const y0 = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => y0 - 3 + i);
  }, []);

  const colTotals = useMemo(() => {
    if (!data) return null;
    const perDay: Record<string, number> = {};
    const perMeat: Record<string, number> = {};
    let grand = 0;
    for (const d of data.dates) perDay[d] = 0;
    for (const m of data.meatItems) perMeat[m.id] = 0;
    for (const m of data.meatItems) {
      const row = data.matrix[m.id] ?? {};
      for (const d of data.dates) {
        const v = row[d] ?? 0;
        perDay[d] += v;
        perMeat[m.id] += v;
        grand += v;
      }
    }
    return { perDay, perMeat, grand };
  }, [data]);

  return (
    <div className="rapor-tablo-viewport page-body page-body-wide voyage-stack">
      <header className="rapor-tablo-header">
        <div>
          <h1 className="page-title">Rapor tablosu</h1>
          <p className="page-sub">
            Özet rapor için günlük, haftalık veya aylık seçip tarih belirleyin. Aşağıda seçilen aya göre gün
            bazlı detay ızgarası yer alır. Ana sayfaya{" "}
            <Link href="/" className="rapor-tablo-inline-link">
              dön
            </Link>
            .
          </p>
        </div>
      </header>

      <section className="card scroll-mt-6" aria-labelledby="raporlar-baslik">
        <ReportPanel />
      </section>

      <section className="rapor-tablo-monthly-block" aria-labelledby="aylik-detay-baslik">
        <h2 id="aylik-detay-baslik" className="card-title" style={{ marginBottom: 12 }}>
          Aylık günlük detay tablosu
        </h2>
        <p className="voyage-muted mb-16">
          Ay ve yıl seçildiğinde o döneme ait günlük kayıtlar et türleri sütunlarında listelenir.
        </p>
        <div className="rapor-tablo-toolbar mb-16" style={{ flexWrap: "wrap" }}>
          <div className="form-group" style={{ minWidth: 120 }}>
            <label htmlFor="rt-yil" className="form-label">
              Yıl
            </label>
            <select
              id="rt-yil"
              value={year}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y: number) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 140 }}>
            <label htmlFor="rt-ay" className="form-label">
              Ay
            </label>
            <select
              id="rt-ay"
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
          <button type="button" className="btn btn-primary" disabled={loading} onClick={() => void load()}>
            {loading ? "Yükleniyor…" : "Yenile"}
          </button>
        </div>
      </section>

      {error ? (
        <p className="voyage-alert voyage-alert--error rapor-tablo-banner" role="alert">
          {error}
        </p>
      ) : null}

      <div className="rapor-tablo-scroll">
        {data && colTotals ? (
          <>
            <p className="rapor-tablo-caption">
              <strong>{data.label}</strong>
              <span className="voyage-muted"> — {data.from} … {data.to}</span>
            </p>
            <div className="rapor-tablo-table-wrap">
              <table className="rapor-tablo-grid voyage-report-table">
                <thead>
                  <tr>
                    <th className="rapor-tablo-sticky-col">Gün</th>
                    <th className="rapor-tablo-sticky-col2">Tarih</th>
                    {data.meatItems.map((m: MeatCol) => (
                      <th key={m.id} title={`${m.categoryName} — ${m.label}`} className="rapor-tablo-meat-head">
                        <span className="rapor-tablo-meat-code">{m.categoryCode}</span>
                        <span className="rapor-tablo-meat-label">{m.label}</span>
                      </th>
                    ))}
                    <th className="rapor-tablo-total-col">Gün toplamı (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dates.map((d: string) => {
                    const day = parseISO(d);
                    const shortWd = new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(day);
                    return (
                      <tr key={d}>
                        <td className="rapor-tablo-sticky-col">{format(day, "d")}</td>
                        <td className="rapor-tablo-sticky-col2">
                          {shortWd} {format(day, "d.MM.")}
                        </td>
                        {data.meatItems.map((m: MeatCol) => {
                          const v = data.matrix[m.id]?.[d] ?? 0;
                          return (
                            <td key={m.id} className="rapor-tablo-num">
                              {fmtKg(v)}
                            </td>
                          );
                        })}
                        <td className="rapor-tablo-num rapor-tablo-total-col">{fmtKg(colTotals.perDay[d] ?? 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="rapor-tablo-sticky-col" colSpan={2}>
                      <strong>Ay toplamı (kg)</strong>
                    </td>
                    {data.meatItems.map((m: MeatCol) => (
                      <td key={m.id} className="rapor-tablo-num">
                        <strong>{fmtKg(colTotals.perMeat[m.id] ?? 0)}</strong>
                      </td>
                    ))}
                    <td className="rapor-tablo-num rapor-tablo-total-col">
                      <strong>{fmtKg(colTotals.grand)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : !loading && !error ? (
          <p className="voyage-muted rapor-tablo-banner">Veri yok.</p>
        ) : null}
      </div>
    </div>
  );
}
