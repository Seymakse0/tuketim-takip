import { Suspense } from "react";
import { ConsumptionPanel } from "@/components/ConsumptionPanel";
import { ReportEntryTeaser } from "@/components/ReportEntryTeaser";

export default function Home() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Et tüketim kontrolü</h1>
          <p className="page-sub">
            Bugünün tüketimini aşağıdan girebilir veya güncelleyebilirsiniz. Geçmiş bir gün ve özet
            raporlar için <strong>Rapor tablosu</strong> sayfasına gidin veya alttaki <strong>Rapor</strong>{" "}
            bölümünden geçin.
          </p>
        </div>
      </header>

      <div className="page-body page-body-wide voyage-stack">
        <Suspense fallback={<div className="card">Yükleniyor…</div>}>
          <ConsumptionPanel />
        </Suspense>
        <ReportEntryTeaser />
      </div>
    </>
  );
}
