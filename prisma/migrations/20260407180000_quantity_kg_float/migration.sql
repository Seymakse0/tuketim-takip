-- 0,5 kg adımları için ondalık saklama
ALTER TABLE "daily_consumption" ALTER COLUMN "quantity_kg" TYPE DOUBLE PRECISION USING "quantity_kg"::double precision;
