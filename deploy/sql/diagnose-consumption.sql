-- Sunucuda: veri gerçekten var mı? (Docker örneği)
-- docker compose -f docker-compose.production.yml exec -it db \
--   psql -U tuketim -d tuketim_kontrol -f - < deploy/sql/diagnose-consumption.sql
-- veya psql içinde bu satırları çalıştırın.

SELECT COUNT(*) AS toplam_satir FROM daily_consumption;

SELECT date::text AS gun, COUNT(*) AS satir, SUM(quantity_kg)::float AS toplam_kg
FROM daily_consumption
GROUP BY date
ORDER BY date;

SELECT MIN(date)::text AS ilk_kayit, MAX(date)::text AS son_kayit
FROM daily_consumption;
