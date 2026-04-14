"use client";

import Link from "next/link";

/** Rapor tablosu sayfasına geçiş — günlük giriş sayfasındaki rapor bölümü. */
export function ReportEntryTeaser() {
  return (
    <section className="card scroll-mt-6" aria-labelledby="rapor-kisa-baslik">
      <h2 id="rapor-kisa-baslik" className="card-title" style={{ marginBottom: 8 }}>
        Rapor
      </h2>
      <p className="voyage-muted mb-16">
        Günlük, haftalık veya aylık özet için tarih seçip raporları oluşturun. Geçmiş kayıt ve raporlar{" "}
        <strong>Rapor tablosu</strong> sayfasındadır.
      </p>
      <Link href="/rapor-tablo" className="btn btn-primary">
        Rapor tablosuna git
      </Link>
    </section>
  );
}
