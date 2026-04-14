/**
 * Script ambient dosya (üstte export/import yok) — `import from "react"` için TS7016 önler.
 * Global React/JSX tanımı env.d.ts içindedir; bu dosya env.d.ts’ten sonra yüklenmeli.
 */
declare module "react" {
  type A = unknown;

  export type ReactNode = globalThis.React.ReactNode;
  export type ReactElement = globalThis.React.ReactElement;
  export type CSSProperties = Record<string, string | number | undefined>;
  export type FormEvent<T = Element> = {
    preventDefault(): void;
    currentTarget: EventTarget & T;
    target: EventTarget & T;
  };

  export interface SyntheticEvent<T extends Element = Element> {
    preventDefault(): void;
    stopPropagation(): void;
    target: EventTarget;
    currentTarget: T | null;
  }

  export interface MouseEvent<T extends Element = Element> extends SyntheticEvent<T> {}

  export interface ClipboardEvent<T extends Element = Element> extends SyntheticEvent<T> {
    clipboardData: DataTransfer | null;
  }

  export interface ChangeEvent<T extends Element = Element> extends FormEvent<T> {
    target: T & EventTarget;
  }

  export function useState<S>(initialState: S | (() => S)): [S, (next: S | ((prev: S) => S)) => void];
  export function useCallback<T extends (...args: A[]) => A>(cb: T, deps: readonly unknown[]): T;
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function Suspense(props: { children?: ReactNode; fallback?: ReactNode }): JSX.Element;

  export type PropsWithChildren<P = unknown> = P & { children?: ReactNode | undefined };
}
