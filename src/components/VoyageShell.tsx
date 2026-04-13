"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SectionJumpLink } from "@/components/SectionJumpLink";

export function VoyageShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <aside id="sidebar" aria-label="Ana menü">
        <div className="sidebar-brand">
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
        <nav className="sidebar-nav" aria-label="Bölümler">
          <SectionJumpLink sectionId="gunluk-giris" className="nav-item">
            Günlük veri girişi
          </SectionJumpLink>
          <Link
            href="/rapor-tablo"
            className={`nav-item${pathname === "/rapor-tablo" ? " active" : ""}`}
          >
            Rapor tablosu
          </Link>
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="nav-item" onClick={() => void logout()}>
            Çıkış
          </button>
        </div>
      </aside>
      <div id="main">{children}</div>
    </>
  );
}
