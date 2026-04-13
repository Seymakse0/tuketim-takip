import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="page-body page-body-wide"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}
    >
      <div className="card" style={{ maxWidth: 480, textAlign: "center" }}>
        <h1 className="page-title" style={{ fontSize: 22, marginBottom: 12 }}>
          Sayfa bulunamadı
        </h1>
        <p className="voyage-muted mb-24">Aradığınız adres bu sitede yok.</p>
        <Link href="/" className="btn btn-primary">
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
