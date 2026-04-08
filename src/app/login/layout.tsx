import { Suspense } from "react";

function LoginFallback() {
  return (
    <div className="login-screen">
      <div className="login-card card">
        <p className="voyage-muted" style={{ textAlign: "center" }}>
          Yükleniyor…
        </p>
      </div>
    </div>
  );
}

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Suspense fallback={<LoginFallback />}>{children}</Suspense>;
}
