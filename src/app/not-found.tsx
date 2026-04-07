import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Sayfa bulunamadı</h1>
      <p className="text-slate-600 mb-6">Aradığınız adres bu sitede yok.</p>
      <Link
        href="/"
        className="rounded-lg px-4 py-2 text-white font-medium"
        style={{ background: "var(--tk-accent, #047857)" }}
      >
        Ana sayfaya dön
      </Link>
    </main>
  );
}
