"use client";

import Link from "next/link";
import { HistoryToDailyEntry } from "@/components/HistoryToDailyEntry";
import { ReportPanel } from "@/components/ReportPanel";

export default function RaporTabloPage() {
  return (
    <div className="rapor-tablo-viewport page-body page-body-wide voyage-stack">
      <header className="rapor-tablo-header">
        <div>
          <h1 className="page-title">Rapor tablosu</h1>
          <p className="page-sub">
            Günlük, haftalık veya aylık özet için tarih seçip raporu oluşturun. Geçmiş bir günün tüketim kaydını
            açmak için alttaki bölümü kullanın. Ana sayfaya{" "}
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

      <HistoryToDailyEntry />
    </div>
  );
}
