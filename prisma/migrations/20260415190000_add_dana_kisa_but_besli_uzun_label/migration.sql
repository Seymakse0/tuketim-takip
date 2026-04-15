-- DANA UZUN BUT: eski İngilizce adı güncelle
UPDATE "meat_items"
SET "label" = 'DANA UZUN BUT / BEEF LONG BUT'
WHERE "label" = 'DANA UZUN BUT / BEEF STEAMSHIP';

-- Yeni satırlar (yoksa ekle; listenin sonuna sort_order ile)
INSERT INTO "meat_items" ("id", "category_code", "category_name", "label", "sort_order")
SELECT gen_random_uuid()::text,
       '1001001',
       'DANA ETLERİ',
       'DANA KISA BUT / BEEF SHORT BUT',
       (SELECT COALESCE(MAX("sort_order"), -1) + 1 FROM "meat_items" m)
WHERE NOT EXISTS (
  SELECT 1 FROM "meat_items" WHERE "label" = 'DANA KISA BUT / BEEF SHORT BUT'
);

INSERT INTO "meat_items" ("id", "category_code", "category_name", "label", "sort_order")
SELECT gen_random_uuid()::text,
       '1001001',
       'DANA ETLERİ',
       'DANA BEŞLİ SET / BEEF SET OF 5',
       (SELECT COALESCE(MAX("sort_order"), -1) + 1 FROM "meat_items" m)
WHERE NOT EXISTS (
  SELECT 1 FROM "meat_items" WHERE "label" = 'DANA BEŞLİ SET / BEEF SET OF 5'
);
