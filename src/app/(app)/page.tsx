import { ConsumptionPanel } from "@/components/ConsumptionPanel";

export default function Home() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Et tüketim kontrolü</h1>
          <p className="page-sub">
            Günlük tüketimi tarih seçerek girebilir veya güncelleyebilirsiniz. Geçmiş bir gün için{" "}
            <strong>«Başka bir gün seç»</strong> bölümünü kullanın. Günlük, haftalık veya aylık özet raporlar
            için menüden <strong>Rapor tablosu</strong> sayfasına gidin.
          </p>
        </div>
      </header>

      <div className="page-body page-body-wide voyage-stack">
        <ConsumptionPanel />
      </div>
    </>
  );
}
