/**
 * "DANA BESLI SET" / "DANA BEŞLİ SET" (ekstra olmayan) → "DANA ÜÇLÜ SET / BEEF TRIPLE SET".
 * İngilizce kısım DB'de farklı veya yoksa da eşleşir; yalnızca "... SET EKSTRA ..." satırına dokunulmaz.
 */
export function normalizeMeatItemLabel(label: string): string {
  const t = label.trim();
  if (/DANA\s+(?:BESLI|BEŞLİ)\s+SET\s+EKSTRA/i.test(t)) return label;
  if (/DANA\s+(?:BESLI|BEŞLİ)\s+SET\b/i.test(t)) {
    return "DANA ÜÇLÜ SET / BEEF TRIPLE SET";
  }
  return label;
}
