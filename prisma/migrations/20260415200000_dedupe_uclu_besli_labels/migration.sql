-- İki satırda aynı "DANA ÜÇLÜ SET / BEEF TRIPLE SET" (eski migration çakışması):
-- sort_order + id'ye göre ilki kalır; diğerleri DANA BEŞLİ SET olur.

UPDATE "meat_items" m
SET "label" = 'DANA BEŞLİ SET / BEEF SET OF 5'
FROM (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (ORDER BY "sort_order" ASC, "id" ASC) AS rn
    FROM "meat_items"
    WHERE "label" = 'DANA ÜÇLÜ SET / BEEF TRIPLE SET'
  ) t
  WHERE t.rn > 1
) dup
WHERE m."id" = dup."id";

-- Aynı etiketle birden fazla "DANA BEŞLİ SET" satırı kaldıysa tek satıra indir (tüketim kayıtları korunur).

DO $$
DECLARE
  keep_id text;
  dup_id text;
BEGIN
  IF (SELECT COUNT(*)::int FROM "meat_items" WHERE "label" = 'DANA BEŞLİ SET / BEEF SET OF 5') <= 1 THEN
    RETURN;
  END IF;

  SELECT "id" INTO keep_id
  FROM "meat_items"
  WHERE "label" = 'DANA BEŞLİ SET / BEEF SET OF 5'
  ORDER BY "sort_order" ASC, "id" ASC
  LIMIT 1;

  FOR dup_id IN
    SELECT "id" FROM "meat_items"
    WHERE "label" = 'DANA BEŞLİ SET / BEEF SET OF 5' AND "id" <> keep_id
  LOOP
    UPDATE "daily_consumption" k
    SET "quantity_kg" = k."quantity_kg" + d."quantity_kg"
    FROM "daily_consumption" d
    WHERE k."meat_item_id" = keep_id
      AND d."meat_item_id" = dup_id
      AND k."date" = d."date";

    DELETE FROM "daily_consumption" d
    WHERE d."meat_item_id" = dup_id
      AND EXISTS (
        SELECT 1 FROM "daily_consumption" k
        WHERE k."meat_item_id" = keep_id AND k."date" = d."date"
      );

    UPDATE "daily_consumption"
    SET "meat_item_id" = keep_id
    WHERE "meat_item_id" = dup_id;

    DELETE FROM "meat_items" WHERE "id" = dup_id;
  END LOOP;
END $$;
