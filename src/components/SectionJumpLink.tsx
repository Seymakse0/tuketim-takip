"use client";

import type { CSSProperties, MouseEvent, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  sectionId: string;
  className?: string;
  style?: CSSProperties;
}>;

/** Same-page anchor; uses scrollIntoView so navigation works reliably with the App Router. */
export function SectionJumpLink({ sectionId, className, style, children }: Props) {
  return (
    <a
      href={`#${sectionId}`}
      className={className}
      style={style}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          const focusTarget = el.querySelector<HTMLElement>(
            "input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled])",
          );
          focusTarget?.focus({ preventScroll: true });
        }
      }}
    >
      {children}
    </a>
  );
}
