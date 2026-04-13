"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Giriş başarısız");
        return;
      }
      const from = searchParams.get("from");
      router.replace(from && from.startsWith("/") && !from.startsWith("//") ? from : "/");
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card card">
        <div className="login-card-brand">
          <div className="brand-mark" aria-hidden>
            V
          </div>
          <div>
            <div className="brand-name">
              VOYA<span>GE</span>
            </div>
            <div className="brand-sub">Et tüketim kontrolü</div>
          </div>
        </div>

        <h1 className="login-title">Oturum açın</h1>
        <p className="voyage-muted login-lead">
          Devam etmek için otel hesabınızla giriş yapın.
        </p>

        <form onSubmit={onSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-user">
              Kullanıcı adı
            </label>
            <input
              id="login-user"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(ev) => setUsername(ev.target.value)}
              required
              disabled={pending}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-pass">
              Şifre
            </label>
            <input
              id="login-pass"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              disabled={pending}
            />
          </div>

          {error ? (
            <p className="login-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={pending}>
            {pending ? "Giriş yapılıyor…" : "Giriş"}
          </button>
        </form>
      </div>
    </div>
  );
}
