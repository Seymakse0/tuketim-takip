"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page-body page-body-wide" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div className="card" style={{ maxWidth: 480, textAlign: "center" }}>
        <h1 className="page-title" style={{ fontSize: 22, marginBottom: 12 }}>
          Bir sorun oluştu
        </h1>
        <p className="voyage-muted mb-24">
          Sayfa yüklenirken beklenmeyen bir hata meydana geldi. Veritabanı bağlantısını veya ağ
          bağlantınızı kontrol edip yeniden deneyin.
        </p>
        <button type="button" onClick={() => reset()} className="btn btn-primary">
          Yeniden dene
        </button>
      </div>
    </div>
  );
}
