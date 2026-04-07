import { ConsumptionPanel } from "@/components/ConsumptionPanel";
import { ReportPanel } from "@/components/ReportPanel";
import { SectionJumpLink } from "@/components/SectionJumpLink";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Et tüketim kontrolü</h1>
        <p className="text-sm text-slate-600">
          Aşağıda <strong>bugünün</strong> girişi açıktır. Geçmiş gün ve raporlar için sayfayı aşağı kaydırın.
        </p>
      </header>

      <ConsumptionPanel />

      <section
        id="gecmis-ve-raporlar"
        className="space-y-6 scroll-mt-6 rounded-xl border p-5 sm:p-6 shadow-sm"
        style={{ background: "var(--tk-card, #fff)", borderColor: "var(--tk-border, #e2e8f0)" }}
        aria-labelledby="gecmis-rapor-baslik"
      >
        <div className="space-y-2">
          <h2 id="gecmis-rapor-baslik" className="text-lg font-semibold text-slate-900">
            Geçmiş kayıt ve raporlar
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Geçmiş günlük kaydı yalnızca görüntülemek için günlük giriş kutusundaki{" "}
            <strong>«Başka bir gün seç»</strong> bölümünü kullanın; Excel indirme oradadır. Özet raporlar
            için aşağıda <strong>tarih</strong> seçip raporu oluşturun. Miktarlar{" "}
            <strong>kilogram (tam sayı)</strong> olarak girilir.
          </p>
          <SectionJumpLink
            sectionId="raporlar"
            className="inline-flex text-sm font-medium hover:underline"
            style={{ color: "var(--tk-accent, #047857)" }}
          >
            Rapor bölümüne git →
          </SectionJumpLink>
        </div>
        <ReportPanel />
      </section>
    </main>
  );
}
