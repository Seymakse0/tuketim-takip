"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

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
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
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
    const y0 = now.getFullYear();
    return Array.from({ length: 7 }, (_, i) => y0 - 3 + i);
  }, [now]);

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
    <div className="rapor-tablo-viewport">
      <header className="rapor-tablo-header">
        <div>
          <h1 className="page-title">Aylık tüketim tablosu</h1>
          <p className="page-sub">
            Ay seçildiğinde o aya ait tüm günlük kayıtlar ızgarada gösterilir. Ana sayfaya{" "}
            <Link href="/" className="rapor-tablo-inline-link">
              dön
            </Link>
            .
          </p>
        </div>
        <div className="rapor-tablo-toolbar">
          <div className="form-group" style={{ minWidth: 120 }}>
            <label htmlFor="rt-yil" className="form-label">
              Yıl
            </label>
            <select id="rt-yil" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {yearOptions.map((y) => (
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
            <select id="rt-ay" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
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
      </header>

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
                    {data.meatItems.map((m) => (
                      <th key={m.id} title={`${m.categoryName} — ${m.label}`} className="rapor-tablo-meat-head">
                        <span className="rapor-tablo-meat-code">{m.categoryCode}</span>
                        <span className="rapor-tablo-meat-label">{m.label}</span>
                      </th>
                    ))}
                    <th className="rapor-tablo-total-col">Gün toplamı (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dates.map((d) => {
                    const shortWd = format(parseISO(d), "EEE", { locale: tr });
                    return (
                      <tr key={d}>
                        <td className="rapor-tablo-sticky-col">{format(parseISO(d), "d")}</td>
                        <td className="rapor-tablo-sticky-col2">
                          {shortWd} {format(parseISO(d), "d.MM.")}
                        </td>
                        {data.meatItems.map((m) => {
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
                    {data.meatItems.map((m) => (
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
