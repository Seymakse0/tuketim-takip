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
const MAX_KG = 1_000_000;

function todayInputValue() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function roundHalfKg(n: number): number {
  return Math.round(n * 2) / 2;
}

/** Gösterim / taslak: binlik ayırıcı yok; ondalık virgül. */
function kgToDraftString(n: number): string {
  const r = roundHalfKg(n);
  if (r % 1 === 0) return String(Math.round(r));
  return r.toFixed(1).replace(".", ",");
}

function sanitizeKgInput(s: string): string {
  let s2 = s.replace(/[^0-9,]/g, "");
  if (s2.startsWith(",")) s2 = `0${s2}`;
  const fc = s2.indexOf(",");
  if (fc === -1) return s2;
  const left = s2.slice(0, fc).replace(/,/g, "");
  const right = s2.slice(fc + 1).replace(/,/g, "");
  return `${left},${right}`;
}

function parseKgDraft(s: string): number {
  const t = s.trim();
  if (t === "" || t === ",") return 0;
  const normalized = t.replace(",", ".");
  const n = Number.parseFloat(normalized);
  if (Number.isNaN(n)) return 0;
  return roundHalfKg(Math.max(0, Math.min(MAX_KG, n)));
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
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dbUnavailable, setDbUnavailable] = useState(false);

  const today = todayInputValue();
  const viewingToday = date === today;

  const load = useCallback(async () => {
    if (!DATE_ONLY.test(date)) {
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    setDbUnavailable(false);
    try {
      const res = await fetch(`/api/consumption?date=${encodeURIComponent(date)}`);
      const json = await readJsonResponse(res);
      if (res.status === 503) {
        setDbUnavailable(true);
      }
      if (!res.ok) throw new Error((json.error as string) || "Veriler yüklenemedi.");
      setData(json as unknown as ConsumptionResponse);
      const next: Record<string, string> = {};
      for (const it of (json.items as ItemRow[]) ?? []) {
        next[it.meatItemId] = kgToDraftString(it.quantityKg);
      }
      setDrafts(next);
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

  const setDraft = (id: string, raw: string) => {
    setDrafts((d) => ({ ...d, [id]: sanitizeKgInput(raw) }));
  };

  const normalizeDraftOnBlur = (id: string) => {
    setDrafts((d) => {
      const cur = d[id] ?? "";
      const n = parseKgDraft(cur);
      return { ...d, [id]: kgToDraftString(n) };
    });
  };

  const save = async () => {
    if (!data?.editable) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const items = data.items.map((it) => ({
        meatItemId: it.meatItemId,
        quantityKg: parseKgDraft(drafts[it.meatItemId] ?? ""),
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
    <section id="gunluk-giris" className="card scroll-mt-6" aria-labelledby="gunluk-giris-baslik">
      <div className="card-title" style={{ marginBottom: 12 }}>
        <h2 id="gunluk-giris-baslik">Günlük tüketim girişi (mutfak)</h2>
        {data && !loading && DATE_ONLY.test(date) && (
          <a
            href={`/api/export/daily?date=${encodeURIComponent(date)}`}
            className="btn btn-secondary btn-sm"
          >
            Bu günü Excel’e aktar
          </a>
        )}
      </div>

      <p className="voyage-muted mb-16">
        Her et için <strong>kilogram</strong> değerini kutuya yazın (yalnızca rakam ve virgül; ondalık
        ayırıcı virgüldür). Kayıtlar <strong>0,5 kg</strong> adımlarına yuvarlanır.{" "}
        <strong>Kaydet</strong> ile kaydedin. Başka bir gün için alttaki{" "}
        <strong>«Başka bir gün seç»</strong> bölümünü kullanın.
      </p>

      <div className="mb-16" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        {viewingToday ? (
          <span className="badge badge-green">Bugün ({today})</span>
        ) : (
          <span className="badge badge-gray">Seçili gün: {date} — düzenleyebilirsiniz</span>
        )}
        {!viewingToday && (
          <button type="button" onClick={goToToday} className="btn btn-ghost btn-sm">
            Bugüne dön
          </button>
        )}
      </div>

      <details className="voyage-details">
        <summary>Başka bir gün seç</summary>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            gap: 12,
          }}
        >
          <div className="form-group" style={{ minWidth: 200 }}>
            <label htmlFor="tuketim-gecmis-tarih" className="form-label">
              Tarih
            </label>
            <input
              id="tuketim-gecmis-tarih"
              type="date"
              value={historyDraft}
              onChange={(e) => setHistoryDraft(e.target.value)}
            />
          </div>
          <button type="button" onClick={applyHistoryDate} className="btn btn-primary">
            Bu tarihi göster
          </button>
        </div>
      </details>

      {loading && (
        <div className="loading" role="status">
          <span className="spinner" aria-hidden />
          Yükleniyor…
        </div>
      )}
      {error && (
        <p className="voyage-alert voyage-alert--error mb-16 whitespace-pre-wrap" role="alert">
          {error}
        </p>
      )}
      {dbUnavailable && (
        <div className="voyage-alert voyage-alert--warn mb-16" role="status">
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Kayıt alanları neden yok?</p>
          <p className="voyage-muted mb-12">
            Liste veritabanından gelir. Şu an sunucu veritabanına bağlanamıyor (503). Aşağıdakileri bu
            bilgisayarda deneyin:
          </p>
          <ol className="voyage-help-list">
            <li>
              <strong>Docker Desktop</strong> açık olsun (yerel PostgreSQL konteyneri için).
            </li>
            <li>
              Proje klasöründe terminal: <code className="voyage-code">npm run db:up</code>
            </li>
            <li>
              İlk kurulumda: <code className="voyage-code">npx prisma migrate deploy</code> ve{" "}
              <code className="voyage-code">npm run db:seed</code>
            </li>
            <li>
              <code className="voyage-code">.env</code> içindeki{" "}
              <code className="voyage-code">DATABASE_URL</code> Docker için genelde{" "}
              <code className="voyage-code">127.0.0.1:5434</code> kullanır.
            </li>
          </ol>
          <button type="button" onClick={() => void load()} className="btn btn-primary">
            Veritabanını başlattıktan sonra tekrar dene
          </button>
        </div>
      )}
      {message && <p className="voyage-alert voyage-alert--ok mb-16">{message}</p>}

      {data && !loading && (
        <>
          {data.items.length === 0 ? (
            <p className="voyage-empty">
              Veritabanında tanımlı et kalemi yok. Yönetici ürün listesini ekledikten sonra tablo burada
              görünür.
            </p>
          ) : (
            <div className="voyage-stack">
              {grouped.map(([title, items]) => (
                <div key={title}>
                  <h3 className="voyage-section-title">{title}</h3>
                  <ul className="voyage-stack" style={{ gap: 12, listStyle: "none", padding: 0 }}>
                    {items.map((it) => {
                      const canEdit = data.editable;
                      const draft = drafts[it.meatItemId] ?? "";
                      return (
                        <li key={it.meatItemId} className="voyage-row-input">
                          <label
                            className="form-label"
                            style={{ color: "var(--text)", fontWeight: 500 }}
                            htmlFor={`kg-input-${it.meatItemId}`}
                            id={`kg-label-${it.meatItemId}`}
                          >
                            {it.label}
                            <span style={{ color: "var(--text-dim)", fontWeight: 400 }}> (kg)</span>
                          </label>
                          <input
                            id={`kg-input-${it.meatItemId}`}
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            className="voyage-kg-input"
                            disabled={!canEdit}
                            aria-labelledby={`kg-label-${it.meatItemId}`}
                            value={draft}
                            onChange={(e) => setDraft(it.meatItemId, e.target.value)}
                            onBlur={() => normalizeDraftOnBlur(it.meatItemId)}
                            onPaste={(e) => {
                              e.preventDefault();
                              const t = e.clipboardData.getData("text");
                              setDrafts((d) => {
                                const cur = d[it.meatItemId] ?? "";
                                return { ...d, [it.meatItemId]: sanitizeKgInput(cur + t) };
                              });
                            }}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {data.editable && data.items.length > 0 && (
            <div className="form-actions" style={{ marginTop: 24, justifyContent: "flex-start" }}>
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="btn btn-primary btn-lg"
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
