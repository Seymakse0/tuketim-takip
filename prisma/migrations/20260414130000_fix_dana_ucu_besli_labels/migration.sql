-- DANA BESLI SET → DANA ÜÇLÜ SET (beşli değil, üçlü)
UPDATE "meat_items"
SET "label" = 'DANA ÜÇLÜ SET / BEEF TRIPLE SET'
WHERE "label" = 'DANA BESLI SET / BEEF SET OF 5';

-- DANA BESLI SET EKSTRA aynı kalır; yanlışlıkla ÜÇLÜ yapılmışsa geri al
UPDATE "meat_items"
SET "label" = 'DANA BESLI SET EKSTRA / BEEF SET OF 5 EXTRA'
WHERE "label" = 'DANA ÜÇLÜ SET EKSTRA / BEEF TRIPLE SET EXTRA';
