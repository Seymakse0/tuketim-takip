-- Tek seferlik: Dallas steak satırını Tomahawk sonrasına ekler (sort_order kaydırır).
-- Prisma gerektirmez; docker compose ile db konteynerinde çalıştırılır.
-- idempotent: aynı label zaten varsa hiçbir şey yapmaz.

DO $$
DECLARE
  v_anchor int;
  v_new int;
  v_cat_code text;
  v_cat_name text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM meat_items WHERE label = 'DANA DALLAS STEAK / BEEF DALLAS STEAK'
  ) THEN
    RAISE NOTICE 'Zaten var: DANA DALLAS STEAK / BEEF DALLAS STEAK';
    RETURN;
  END IF;

  SELECT sort_order, category_code, category_name
  INTO v_anchor, v_cat_code, v_cat_name
  FROM meat_items
  WHERE label = 'DANA TOMAHAVK STEAK / BEEF TOMAHAWK STEAK'
  LIMIT 1;

  IF v_cat_code IS NULL THEN
    RAISE EXCEPTION 'Referans satır bulunamadı: DANA TOMAHAVK STEAK / BEEF TOMAHAWK STEAK';
  END IF;

  v_new := v_anchor + 1;

  UPDATE meat_items SET sort_order = sort_order + 1 WHERE sort_order >= v_new;

  INSERT INTO meat_items (id, category_code, category_name, label, sort_order)
  VALUES (
    gen_random_uuid()::text,
    v_cat_code,
    v_cat_name,
    'DANA DALLAS STEAK / BEEF DALLAS STEAK',
    v_new
  );

  RAISE NOTICE 'Eklendi: DANA DALLAS STEAK / BEEF DALLAS STEAK (sort_order=%)', v_new;
END $$;
