"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function todayInputValue() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Geçmiş gün seçip günlük veri girişi sayfasında açma — rapor tablosu sayfası. */
export function HistoryToDailyEntry() {
  const router = useRouter();
  const [date, setDate] = useState(todayInputValue);

  const open = () => {
    if (!DATE_ONLY.test(date)) return;
    router.push(`/?date=${encodeURIComponent(date)}`);
  };

  return (
    <section className="card scroll-mt-6" aria-labelledby="gecmis-kayit-baslik">
      <h2 id="gecmis-kayit-baslik" className="card-title" style={{ marginBottom: 8 }}>
        Geçmiş kayıt (günlük giriş)
      </h2>
      <p className="voyage-muted mb-16">
        Belirli bir günün tüketim kaydını görüntülemek veya düzenlemek için tarih seçip günlük veri girişi
        sayfasında açın.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
        <div className="form-group" style={{ minWidth: 200 }}>
          <label htmlFor="rapor-gecmis-tarih" className="form-label">
            Tarih
          </label>
          <input
            id="rapor-gecmis-tarih"
            type="date"
            value={date}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
          />
        </div>
        <button type="button" onClick={open} className="btn btn-primary">
          Günlük girişte aç
        </button>
      </div>
    </section>
  );
}
