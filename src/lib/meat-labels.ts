/**
 * Etiketler veritabanındaki gibi gösterilir. (Eski "beşli → üçlü" birleştirmesi kaldırıldı;
 * DANA BEŞLİ SET ile DANA ÜÇLÜ SET ayrı satırlar olabilir.)
 */
export function normalizeMeatItemLabel(label: string): string {
  return label.trim();
}
