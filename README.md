# Et tüketim kontrolü

Mutfak departmanının dana ve kuzu et kalemlerini **günlük kg (tam sayı)** olarak girdiği; verilerin **PostgreSQL**’de saklandığı; **günlük / haftalık / aylık rapor** ve **Excel dışa aktarma** sunan Next.js uygulaması.

## Özellikler

- Resimlerdeki tüm et türleri veritabanında tanımlı (16 dana + 8 kuzu).
- Giriş alanları yalnızca **tam sayı** kabul eder; API tarafında `zod` ile doğrulanır.
- **Yalnızca bugünün** kaydı düzenlenebilir; geçmiş günler salt okunur.
- Tarih seçerek geçmiş tüketime bakma, raporlar ve günlük Excel indirme.

## Ortam değişkenleri

`.env.example` dosyasını kopyalayıp `.env` yapın.

- `DATABASE_URL` — PostgreSQL bağlantısı
- `APP_TIMEZONE` — “bugün” kilidi için (ör. `Europe/Istanbul`)
- `NEXT_PUBLIC_HOTEL_CSS_URL` — Otel ortak CSS’inin tam URL’i (boş bırakılabilir)

## Kurulum (geliştirme)

```bash
npm install
cp .env.example .env
# Yerel Docker veritabanı (docker-compose.yml): .env içinde şu satır kullanılabilir:
# DATABASE_URL="postgresql://tuketim:tuketim@127.0.0.1:5433/tuketim_kontrol?schema=public"
npm run db:up
npx prisma migrate deploy
npm run db:seed
npm run dev
```

**Not:** `Can't reach database server at 127.0.0.1:5433` hatası, PostgreSQL’in çalışmadığı anlamına gelir. Docker kullanıyorsanız önce **Docker Desktop**’ı açın, sonra `npm run db:up`. `baslat-dev.bat` Docker varsa konteyneri sizin için başlatır.

Tarayıcı: `http://localhost:3000`

### Windows (kolay yol)

1. [Node.js LTS](https://nodejs.org) kurulu olsun.
2. Proje klasöründe **`baslat-dev.bat`** dosyasına çift tıklayın (veya sağ tık → Çalıştır). İlk seferde `npm install` çalışır, sonra sunucu açılır.
3. Tarayıcıda **`http://localhost:3000`** adresine gidin. Pencereyi kapatmayın; sunucu bu pencerede çalışır, durdurmak için **Ctrl+C** kullanın.

Veritabanı yoksa liste/rapor API’leri hata verebilir; tam çalışma için yukarıdaki `migrate`, `seed` ve `.env` adımlarını da yapın.

## Docker (yerel deneme)

```bash
docker compose up -d db
# .env içinde DATABASE_URL: postgresql://tuketim:tuketim@127.0.0.1:5433/tuketim_kontrol?schema=public
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Tam yığın için `docker-compose.yml` içindeki `app` servisini kullanmadan önce veritabanında `prisma migrate deploy` ve seed çalıştırın (otel sunucusunda genelde ayrı bir migrate adımı kullanılır).

## Otel sunucusu ve GitHub

1. Bu klasörde `git init`, ardından GitHub’da yeni repo oluşturup `git remote add` / `git push`.
2. PostgreSQL’de bir veritabanı ve kullanıcı açın; `DATABASE_URL`’i uygulamaya (`.env`) verin.
3. Deploy sırasında: `npx prisma migrate deploy` ve **bir kez** `npm run db:seed` (et kalemleri için).
4. Ortak domain: **alt alan adı** (ör. `tuketim.otel.com`) ile reverse proxy (Nginx vb.); isteğe bağlı `NEXT_PUBLIC_HOTEL_CSS_URL`.
5. Alt dizinde yayın (`/tuketim`) gerekiyorsa Next.js `basePath` eklenmeli; altyapı ekibinizle netleştirin.

### Sunucuda Docker olmadan (ör. `ali@sunucu`, klasör `~/tuketim-takip`)

Sunucuda **sistem paketleriyle** PostgreSQL ve Node.js LTS kurulu olsun (Docker şart değil).

**1) PostgreSQL (sunucuda bir kez)**

```bash
# Örnek: Debian/Ubuntu — paket adları dağıtıma göre değişebilir
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE USER tuketim WITH PASSWORD 'güçlü_şifre';"
sudo -u postgres psql -c "CREATE DATABASE tuketim_kontrol OWNER tuketim;"
```

**2) Kodu alın**

```bash
cd ~
git clone https://github.com/KULLANICI/tuketim-takip.git tuketim-takip   # kendi repo URL’niz
cd tuketim-takip
```

**3) `.env` (sunucuda, gizli tutun)**

`DATABASE_URL` artık **localhost:5432** (veya aynı makinedeki Postgres) olmalı; Docker’daki `:5433` kullanılmaz:

```env
DATABASE_URL="postgresql://tuketim:güçlü_şifre@127.0.0.1:5432/tuketim_kontrol?schema=public"
APP_TIMEZONE="Europe/Istanbul"
NODE_ENV="production"
```

**4) Kurulum ve çalıştırma**

```bash
npm ci
npx prisma migrate deploy
npm run db:seed    # sadece ilk deploy veya seed’i sıfırlamak istediğinizde
npm run build
npm run start      # varsayılan http://0.0.0.0:3000
```

Üretimde süreç kapanmasın diye [PM2](https://pm2.keymetrics.io/) veya `systemd` servisi kullanın; önünde Nginx ile `proxy_pass http://127.0.0.1:3000` yaygındır.

**Özet:** Evet, GitHub’dan sunucuya çekip `~/tuketim-takip` içinde **Docker kullanmadan** çalıştırabilirsiniz; tek şart sunucuda çalışan bir PostgreSQL ve doğru `DATABASE_URL`.

## Teknik yığın

Next.js 15 (App Router), Prisma, PostgreSQL, ExcelJS, Tailwind CSS.
