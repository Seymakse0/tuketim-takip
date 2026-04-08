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

## PostgreSQL ve DATABASE_URL (adım adım)

Bağlantı dizesi şu kalıpta olmalıdır:

`postgresql://KULLANICI:ŞİFRE@HOST:PORT/VERİTABANI_ADI?schema=public`

- **HOST:** Bu bilgisayarda çalışıyorsa genelde `127.0.0.1` veya `localhost`.
- **PORT:** Docker ile bu projedeki veritabanı **5433**; Windows’a kurulu PostgreSQL çoğunlukla **5432**.
- **Şifre** içinde `@`, `#`, `:` gibi karakterler varsa URL’de özel anlam taşıdığı için [URL kodlaması](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) gerekir (ör. `@` → `%40`).

### Yöntem 1 — Docker ile (bu repo, önerilen)

1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) kurun ve **çalışır durumda** açın.
2. Proje klasöründe terminalde: `npm run db:up`  
   (`docker-compose.yml` içinde kullanıcı `tuketim`, şifre `tuketim`, veritabanı `tuketim_kontrol`, dış port **5433**.)
3. Proje kökünde `.env` dosyası yoksa: `.env.example` dosyasını kopyalayıp `.env` adını verin.
4. `.env` içine **tam olarak** şunu yazın (veya aynı anlama gelen tek satır):

   `DATABASE_URL="postgresql://tuketim:tuketim@127.0.0.1:5433/tuketim_kontrol?schema=public"`

5. Bir kez çalıştırın: `npx prisma migrate deploy` ve `npm run db:seed`
6. Uygulamayı başlatın: `npm run dev` (veya `npx next dev -p 3005` gibi bir port seçtiyseniz o adresi kullanın).

Kontrol: `docker ps` çıktısında `postgres` konteyneri **Up** görünmeli.

### Yöntem 2 — Windows’a PostgreSQL kurulu (Docker yok)

1. [PostgreSQL for Windows](https://www.postgresql.org/download/windows/) ile kurulum sihirbazını çalıştırın; kurulumda belirlediğiniz **postgres** (veya başka) kullanıcı şifresini not edin; varsayılan port **5432** kalsın.
2. **pgAdmin** veya `psql` ile bağlanıp veritabanı oluşturun, örneğin adı `tuketim_kontrol` ve uygulama için bir kullanıcı (ör. `tuketim`) tanımlayın; kullanıcıya bu veritabanı üzerinde yetki verin.
3. `.env` içinde (kendi şifrenizle):

   `DATABASE_URL="postgresql://tuketim:SIZIN_SIFRE@127.0.0.1:5432/tuketim_kontrol?schema=public"`

4. `npx prisma migrate deploy` ve `npm run db:seed` çalıştırın.

### Hata ayıklama

- `Can't reach database server` → PostgreSQL çalışmıyor veya **PORT** / **HOST** yanlış; Docker ise `npm run db:up` ve Docker Desktop.
- `password authentication failed` → `DATABASE_URL` içindeki kullanıcı veya şifre yanlış.
- `database "tuketim_kontrol" does not exist` → Veritabanını oluşturun veya `DATABASE_URL`’deki ismi mevcut DB ile eşleştirin.

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

### Üretim örneği: `https://follow.voyagestars.com` (sunucu `194.62.54.157`, ayrı konteyner)

Bu site, aynı makinedeki diğer `voyagestars.com` sitelerinden **bağımsız bir Docker Compose yığını** olarak çalışabilir. Dışarıya doğrudan port açmak yerine uygulama **yalnızca `127.0.0.1:3005`** üzerinden dinler; sunucudaki **Nginx** (veya benzeri) `follow.voyagestars.com` isteğini buraya yönlendirir.

**1) DNS**

- `follow.voyagestars.com` için **A** kaydı → `194.62.54.157` (TTL yayına göre).

**2) Sunucuda proje**

```bash
cd /opt   # veya tercih ettiğiniz klasör
sudo git clone https://github.com/Seymakse0/tuketim-takip.git tuketim-takip
cd tuketim-takip
sudo chown -R $USER:$USER .
cp .env.production.example .env
nano .env   # POSTGRES_PASSWORD=güçlü_şifre
```

**3) İlk kez: veritabanı + migrate + seed + uygulama**

```bash
docker compose -f docker-compose.production.yml up -d db
docker compose -f docker-compose.production.yml --profile setup run --rm setup
docker compose -f docker-compose.production.yml up -d app
```

`setup` adımı **yalnızca ilk kurulumda** çalıştırılmalıdır (`db:seed` mevcut tüketim kayıtlarını siler). Canlı veri varken tekrar çalıştırmayın.

**4) HTTPS ve domain (host Nginx)**

Repoda örnek yapılandırma: `deploy/nginx-follow.voyagestars.com.example.conf`

- Sertifika: örn. `sudo certbot certonly --nginx -d follow.voyagestars.com` (veya elinizdeki wildcard sertifikayı kullanın).
- `proxy_pass http://127.0.0.1:3005;` satırı bu projenin konteynerine gider; diğer siteler kendi `server_name` ve kendi upstream portlarında kalır.

**5) Güncelleme**

```bash
cd /opt/tuketim-takip   # örnek yol
git pull
docker compose -f docker-compose.production.yml build app
docker compose -f docker-compose.production.yml up -d app
```

Veritabanı şeması değiştiyse (yeni migration): geçici olarak `setup` profilinde yalnızca migrate çalıştırmak gerekir; canlıda seed kullanmadan `npx prisma migrate deploy` eşdeğerini operasyon ekibinizle netleştirin.

**Özet mimari**

| Katman | Görev |
|--------|--------|
| DNS | `follow.voyagestars.com` → `194.62.54.157` |
| Nginx (host, 443) | TLS sonlandırma, `proxy_pass` → `127.0.0.1:3005` |
| Docker `app` | Next.js (bu repo `Dockerfile`) |
| Docker `db` | PostgreSQL, **dışarıya port açılmaz**; yalnızca compose ağı |

İsteğe bağlı: otel ortak CSS için `.env` / compose ortamına `NEXT_PUBLIC_HOTEL_CSS_URL` eklenebilir.

## Teknik yığın

Next.js 15 (App Router), Prisma, PostgreSQL, ExcelJS, Tailwind CSS.
