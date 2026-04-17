-- Tek seferlik: Kuzu kalem pirzola satırını tarak pirzola sonrasına ekler (sort_order kaydırır).
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
    SELECT 1 FROM meat_items WHERE label = 'KUZU KALEM PIRZOLA / LAMB PENCIL CHOP'
  ) THEN
    RAISE NOTICE 'Zaten var: KUZU KALEM PIRZOLA / LAMB PENCIL CHOP';
    RETURN;
  END IF;

  SELECT sort_order, category_code, category_name
  INTO v_anchor, v_cat_code, v_cat_name
  FROM meat_items
  WHERE label = 'KUZU TARAK PIRZOLA / LAMB CHOP (TARAK)'
  LIMIT 1;

  IF v_cat_code IS NULL THEN
    RAISE EXCEPTION 'Referans satır bulunamadı: KUZU TARAK PIRZOLA / LAMB CHOP (TARAK)';
  END IF;

  v_new := v_anchor + 1;

  UPDATE meat_items SET sort_order = sort_order + 1 WHERE sort_order >= v_new;

  INSERT INTO meat_items (id, category_code, category_name, label, sort_order)
  VALUES (
    gen_random_uuid()::text,
    v_cat_code,
    v_cat_name,
    'KUZU KALEM PIRZOLA / LAMB PENCIL CHOP',
    v_new
  );

  RAISE NOTICE 'Eklendi: KUZU KALEM PIRZOLA / LAMB PENCIL CHOP (sort_order=%)', v_new;
END $$;
