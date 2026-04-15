import { Suspense } from "react";
import { ConsumptionPanel } from "@/components/ConsumptionPanel";

export default function Home() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Et tüketim kontrolü</h1>
          <p className="page-sub">
            <strong>Kayıt tarihi</strong> alanından günü seçerek o güne ait tüketimi girebilir veya
            güncelleyebilirsiniz. Günlük / haftalık / aylık özet raporlar için karttaki{" "}
            <strong>Rapor bölümüne git</strong> ile <strong>Rapor tablosu</strong> sayfasına geçin.
          </p>
        </div>
      </header>

      <div className="page-body page-body-wide voyage-stack">
        <Suspense fallback={<div className="card">Yükleniyor…</div>}>
          <ConsumptionPanel />
        </Suspense>
      </div>
    </>
  );
}
