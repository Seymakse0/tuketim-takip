import { ConsumptionPanel } from "@/components/ConsumptionPanel";
import { ReportPanel } from "@/components/ReportPanel";
import { SectionJumpLink } from "@/components/SectionJumpLink";

export default function Home() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Et tüketim kontrolü</h1>
          <p className="page-sub">
            Aşağıda <strong>bugünün</strong> girişi açıktır. Geçmiş gün ve raporlar için aşağı kaydırın veya
            menüden seçin.
          </p>
        </div>
      </header>

      <div className="page-body page-body-wide voyage-stack">
        <ConsumptionPanel />

        <section
          id="gecmis-ve-raporlar"
          className="card scroll-mt-6"
          aria-labelledby="gecmis-rapor-baslik"
        >
          <div className="mb-16">
            <h2 id="gecmis-rapor-baslik" className="card-title" style={{ marginBottom: 8 }}>
              Geçmiş kayıt ve raporlar
            </h2>
            <p className="voyage-muted mb-12">
              Geçmiş günlük kaydı yalnızca görüntülemek için günlük giriş kutusundaki{" "}
              <strong>«Başka bir gün seç»</strong> bölümünü kullanın; Excel indirme oradadır. Özet raporlar
              için aşağıda <strong>tarih</strong> seçip raporu oluşturun. Miktarlar{" "}
              <strong>kilogram (0,5 kg adımı)</strong> olarak girilir.
            </p>
            <SectionJumpLink sectionId="raporlar" className="btn btn-ghost btn-sm">
              Rapor bölümüne git →
            </SectionJumpLink>
          </div>
          <ReportPanel />
        </section>
      </div>
    </>
  );
}
