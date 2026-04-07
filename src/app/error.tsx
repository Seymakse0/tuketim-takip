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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Bir sorun oluştu</h1>
      <p className="text-slate-600 mb-6 max-w-md">
        Sayfa yüklenirken beklenmeyen bir hata meydana geldi. Veritabanı bağlantısını veya ağ
        bağlantınızı kontrol edip yeniden deneyin.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg px-4 py-2 text-white font-medium"
        style={{ background: "var(--tk-accent, #047857)" }}
      >
        Yeniden dene
      </button>
    </main>
  );
}
