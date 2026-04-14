-- DANA BESLI SET (ekstra değil) → DANA ÜÇLÜ SET
-- Önceki migration uygulanmadıysa veya etikette küçük fark varsa bu da günceller.
UPDATE "meat_items"
SET "label" = 'DANA ÜÇLÜ SET / BEEF TRIPLE SET'
WHERE "label" = 'DANA BESLI SET / BEEF SET OF 5'
   OR "label" = 'DANA BEŞLİ SET / BEEF SET OF 5'
   OR (
     "label" NOT ILIKE '%EKSTRA%'
     AND "label" NOT ILIKE '%EXTRA%'
     AND "label" ILIKE '%BESLI SET%'
     AND "label" ILIKE '%BEEF SET OF 5%'
   );
