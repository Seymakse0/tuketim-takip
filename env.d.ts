/**
 * Bu makinede `@types/react` boş/bozuksa (sadece `ts5.0` klasörü vb.) JSX (TS7026) ve
 * `import … from "react"` çalışmaz. Bu dosya güvenli bir yedek tipler sağlar.
 *
 * `@types/react` projede yok; tipler `react-shim.d.ts` üzerinden gelir (çift bildirim yok).
 * `@types/node` ve diğer @types paketleri TypeScript’in varsayılan yüklemesiyle gelir.
 */
export {};

type ShimAny = unknown;

declare global {
  namespace React {
    type Key = string | number | bigint | null | undefined;
    type ReactNode =
      | ReactElement
      | string
      | number
      | Iterable<ReactNode>
      | boolean
      | null
      | undefined;
    type ReactElement = {
      type: unknown;
      props: Record<string, unknown>;
      key: Key | null;
    };
  }

  namespace JSX {
    type Element = React.ReactElement;
    interface IntrinsicElements {
      [elemName: string]: ShimAny;
    }
  }
}

declare module "next/navigation" {
  export class ReadonlyURLSearchParams extends URLSearchParams {}

  export function useRouter(): {
    push(href: string): void;
    replace(href: string): void;
    refresh(): void;
  };
  export function usePathname(): string;
  export function useSearchParams(): ReadonlyURLSearchParams;
}

declare module "next/link" {
  import type { ReactNode } from "react";
  interface LinkProps {
    href: string | Record<string, ShimAny>;
    children?: ReactNode;
    className?: string;
    prefetch?: boolean;
    [key: string]: ShimAny;
  }
  const Link: (props: LinkProps) => JSX.Element;
  export default Link;
}

declare module "next/server" {
  export interface NextRequest extends Request {
    readonly nextUrl: URL;
    readonly cookies: {
      get(name: string): { name: string; value: string } | undefined;
    };
  }

  /** Route handler’larda NextResponse.json() dönüşü; `cookies.set` gerçek Next.js ile uyumludur. */
  export interface NextResponseCookieOptions {
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    path?: string;
    maxAge?: number;
    secure?: boolean;
  }

  export class NextResponse extends Response {
    readonly cookies: {
      set(name: string, value: string, options?: NextResponseCookieOptions): void;
    };
    static next(): NextResponse;
    static redirect(url: string | URL, init?: number): NextResponse;
    static json(body: ShimAny, init?: ResponseInit): NextResponse;
  }
}

declare module "next/og" {
  export class ImageResponse extends Response {
    constructor(element: ShimAny, options?: ResponseInit & { width?: number; height?: number });
  }
}
