"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ItemRow = {
  meatItemId: string;
  categoryCode: string;
  categoryName: string;
  label: string;
  quantityKg: number;
};

type ConsumptionResponse = {
  date: string;
  editable: boolean;
  items: ItemRow[];
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function todayInputValue() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function readJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Sunucu yanıtı okunamadı (geçerli JSON değil).");
  }
}

export function ConsumptionPanel() {
  const [date, setDate] = useState(todayInputValue);
  const [historyDraft, setHistoryDraft] = useState(todayInputValue);
  const [data, setData] = useState<ConsumptionResponse | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = todayInputValue();
  const viewingToday = date === today;

  const load = useCallback(async () => {
    if (!DATE_ONLY.test(date)) {
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/consumption?date=${encodeURIComponent(date)}`);
      const json = await readJsonResponse(res);
      if (!res.ok) throw new Error((json.error as string) || "Veriler yüklenemedi.");
      setData(json as unknown as ConsumptionResponse);
      const next: Record<string, number> = {};
      for (const it of (json.items as ItemRow[]) ?? []) {
        next[it.meatItemId] = it.quantityKg;
      }
      setValues(next);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, ItemRow[]>();
    for (const it of data.items) {
      const key = `${it.categoryCode} — ${it.categoryName}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries());
  }, [data]);

  const onQtyChange = (id: string, raw: string) => {
    if (raw === "") {
      setValues((v) => ({ ...v, [id]: 0 }));
      return;
    }
    if (!/^\d+$/.test(raw)) return;
    const n = parseInt(raw, 10);
    if (n < 0 || n > 1_000_000) return;
    setValues((v) => ({ ...v, [id]: n }));
  };

  const save = async () => {
    if (!data?.editable) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const items = data.items.map((it) => ({
        meatItemId: it.meatItemId,
        quantityKg: values[it.meatItemId] ?? 0,
      }));
      const res = await fetch("/api/consumption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, items }),
      });
      const json = await readJsonResponse(res);
      if (!res.ok) throw new Error((json.error as string) || "Kayıt yapılamadı.");
      setMessage("Kayıtlarınız kaydedildi.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const goToToday = () => {
    const t = todayInputValue();
    setDate(t);
    setHistoryDraft(t);
  };

  const applyHistoryDate = () => {
    if (!DATE_ONLY.test(historyDraft)) return;
    setDate(historyDraft);
  };

  return (
    <section
      id="gunluk-giris"
      className="rounded-xl border p-6 shadow-sm scroll-mt-6"
      style={{ background: "var(--tk-card, #fff)", borderColor: "var(--tk-border, #e2e8f0)" }}
      aria-labelledby="gunluk-giris-baslik"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <h2
          id="gunluk-giris-baslik"
          className="text-xl font-semibold"
          style={{ color: "var(--tk-accent, #047857)" }}
        >
          Günlük tüketim girişi (mutfak)
        </h2>
        {data && !loading && DATE_ONLY.test(date) && (
          <a
            href={`/api/export/daily?date=${encodeURIComponent(date)}`}
            className="shrink-0 px-3 py-2 rounded-lg border text-sm font-medium text-slate-800 bg-white hover:bg-slate-50"
          >
            Bu günü Excel’e aktar
          </a>
        )}
      </div>

      <p className="text-slate-600 text-sm mb-4 leading-relaxed">
        Her et için kullanılan <strong>kilogramı tam sayı</strong> olarak girin (ondalık yok).{" "}
        <strong>Kaydet</strong> ile kaydedin. Geçmiş günü görmek için alttaki{" "}
        <strong>«Başka bir gün seç»</strong> bölümünü kullanın.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {viewingToday ? (
          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1 text-sm font-medium">
            Bugün ({today}) — kayıt girebilirsiniz
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 text-sm font-medium">
            Seçili gün: {date}
          </span>
        )}
        {!viewingToday && (
          <button
            type="button"
            onClick={goToToday}
            className="text-sm font-medium underline decoration-emerald-700/40 hover:decoration-emerald-700"
            style={{ color: "var(--tk-accent, #047857)" }}
          >
            Bugüne dön
          </button>
        )}
      </div>

      <details className="mb-6 rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4 open:bg-slate-50">
        <summary className="cursor-pointer text-sm font-medium text-slate-800 select-none">
          Başka bir gün seç (salt okunur, Excel)
        </summary>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="tuketim-gecmis-tarih" className="block text-sm font-medium text-slate-600 mb-1">
              Tarih
            </label>
            <input
              id="tuketim-gecmis-tarih"
              type="date"
              value={historyDraft}
              onChange={(e) => setHistoryDraft(e.target.value)}
              className="border rounded-lg px-3 py-2 text-slate-900 bg-white"
            />
          </div>
          <button
            type="button"
            onClick={applyHistoryDate}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm"
            style={{ background: "var(--tk-accent, #047857)" }}
          >
            Bu tarihi göster
          </button>
        </div>
      </details>

      {loading && <p className="text-slate-500">Yükleniyor…</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="text-emerald-700 mb-4">{message}</p>}

      {data && !loading && (
        <>
          {!data.editable && (
            <p className="mb-4 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
              Bu tarih salt okunur: yalnızca <strong>bugünün</strong> kaydı girilebilir veya
              değiştirilebilir.
            </p>
          )}

          {data.items.length === 0 ? (
            <p className="text-slate-600 text-sm border border-dashed border-slate-200 rounded-lg px-4 py-6 text-center">
              Veritabanında tanımlı et kalemi yok. Yönetici ürün listesini ekledikten sonra tablo burada
              görünür.
            </p>
          ) : (
            <div className="space-y-8">
              {grouped.map(([title, items]) => (
                <div key={title}>
                  <h3
                    className="text-lg font-semibold mb-3 pb-2 border-b"
                    style={{ borderColor: "var(--tk-border)", color: "var(--tk-accent, #047857)" }}
                  >
                    {title}
                  </h3>
                  <ul className="space-y-3">
                    {items.map((it) => (
                      <li
                        key={it.meatItemId}
                        className="grid gap-3 sm:grid-cols-[1fr_auto] items-start sm:items-center"
                      >
                        <label className="text-sm sm:text-base text-slate-800 leading-snug">
                          {it.label}
                          <span className="text-slate-500 font-normal"> (kg, tam sayı)</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="off"
                          disabled={!data.editable}
                          value={values[it.meatItemId] ?? 0}
                          onChange={(e) => onQtyChange(it.meatItemId, e.target.value)}
                          className="w-full sm:w-28 border rounded-lg px-3 py-2 text-right font-mono disabled:bg-slate-100 disabled:text-slate-600"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {data.editable && data.items.length > 0 && (
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-60"
                style={{ background: "var(--tk-accent, #047857)" }}
              >
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
