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
- **PORT:** Docker ile bu projedeki veritabanı **5434**; Windows’a kurulu PostgreSQL çoğunlukla **5432**.
- **Şifre** içinde `@`, `#`, `:` gibi karakterler varsa URL’de özel anlam taşıdığı için [URL kodlaması](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) gerekir (ör. `@` → `%40`).

### Yöntem 1 — Docker ile (bu repo, önerilen)

1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) kurun ve **çalışır durumda** açın.
2. Proje klasöründe terminalde: `npm run db:up`  
   (`docker-compose.yml` içinde kullanıcı `tuketim`, şifre `tuketim`, veritabanı `tuketim_kontrol`, dış port **5434**.)
3. Proje kökünde `.env` dosyası yoksa: `.env.example` dosyasını kopyalayıp `.env` adını verin.
4. `.env` içine **tam olarak** şunu yazın (veya aynı anlama gelen tek satır):

   `DATABASE_URL="postgresql://tuketim:tuketim@127.0.0.1:5434/tuketim_kontrol?schema=public"`

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
# DATABASE_URL="postgresql://tuketim:tuketim@127.0.0.1:5434/tuketim_kontrol?schema=public"
npm run db:up
npx prisma migrate deploy
npm run db:seed
npm run dev
```

**Not:** `Can't reach database server at 127.0.0.1:5434` hatası, PostgreSQL’in çalışmadığı anlamına gelir. Docker kullanıyorsanız önce **Docker Desktop**’ı açın, sonra `npm run db:up`. `baslat-dev.bat` Docker varsa konteyneri sizin için başlatır.

Tarayıcı: `http://localhost:3000`

### Windows (kolay yol)

1. [Node.js LTS](https://nodejs.org) kurulu olsun.
2. Proje klasöründe **`baslat-dev.bat`** dosyasına çift tıklayın (veya sağ tık → Çalıştır). İlk seferde `npm install` çalışır, sonra sunucu açılır.
3. Tarayıcıda **`http://localhost:3000`** adresine gidin. Pencereyi kapatmayın; sunucu bu pencerede çalışır, durdurmak için **Ctrl+C** kullanın.

Veritabanı yoksa liste/rapor API’leri hata verebilir; tam çalışma için yukarıdaki `migrate`, `seed` ve `.env` adımlarını da yapın.

## Docker (yerel deneme)

```bash
docker compose up -d db
# .env içinde DATABASE_URL: postgresql://tuketim:tuketim@127.0.0.1:5434/tuketim_kontrol?schema=public
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Tam yığın için `docker-compose.yml` içindeki `app` servisini kullanmadan önce veritabanında `prisma migrate deploy` ve seed çalıştırın (otel sunucusunda genelde ayrı bir migrate adımı kullanılır).

**Sunucuda `app` konteyneri ayaktayken** (güncel Docker imajı gerekir) şema ve seed için:

```bash
docker compose exec app npm run db:migrate
docker compose exec app npm run db:seed
```

Konteyner içinde **`npx prisma ...` kullanmayın** — `npx` Prisma 7 indirip şema ile uyumsuz hata verebilir. `npm run db:migrate` / `db:seed` yerleşik Prisma 6 ve `node` ile çalışır.

## Otel sunucusu ve GitHub

1. Bu klasörde `git init`, ardından GitHub’da yeni repo oluşturup `git remote add` / `git push`.
2. PostgreSQL’de bir veritabanı ve kullanıcı açın; `DATABASE_URL`’i uygulamaya (`.env`) verin.
3. Deploy sırasında: `prisma migrate deploy` ve **bir kez** `npm run db:seed` (et kalemleri için); Docker’da yukarıdaki `docker compose exec app ...` komutlarını kullanın.
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

`DATABASE_URL` artık **localhost:5432** (veya aynı makinedeki Postgres) olmalı; Docker’daki `:5434` kullanılmaz:

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

### Geliştirici makinesi → Git (Bu repo başka, `otel-mudur-takip` dosya listesi kullanılmaz)

Commit edeceğiniz yollar örneğin `src/`, `prisma/`, `package.json`, `Dockerfile`, `docker-compose*.yml`, `deploy/` olur. Örnek:

```bash
git status
git add src prisma package.json package-lock.json docker-compose.production.yml Dockerfile deploy
git commit -m "Açıklama"
git push origin main   # veya kullandığınız dal
```

### Üretim örneği: `https://kitchen.voyagestars.com` (ör. sunucu `194.62.54.157`, ayrı konteyner)

**Tarayıcıdan bu projeyi açmak:** Uygulama içinde `kitchen.voyagestars.com` yazmanız gerekmez; domain tamamen **Cloudflare DNS + sunucuda Docker + Nginx** ile bağlanır. Aşağıdaki sırayı eksiksiz yapın; biri eksikse adres ya açılmaz ya da başka site (ör. `gate`) görünür.

| Sıra | Yapılacak |
|------|-----------|
| 1 | Cloudflare’da `kitchen` **A** kaydı sunucu IP’nize; `kitchen` → `gate` gibi **Redirect Rule** yok. |
| 2 | Sunucuda repo + `.env` → `./deploy/server-first-install.sh` (veya README’deki `docker compose` komutları). |
| 3 | Sunucuda test: `curl -sI http://127.0.0.1:3005` → uygulama ayaktayken `HTTP/1.1 200`, `307` veya `401/302` gibi anlamlı cevap (bağlantı reddi olmamalı). |
| 4 | Nginx: `./deploy/install-kitchen-nginx.sh` veya `deploy/nginx-kitchen.voyagestars.com.example.conf` elle kopyala; **sites-enabled**’da aktif; `server_name` yalnızca `kitchen.voyagestars.com`; `proxy_pass` → `http://127.0.0.1:3005`. |
| 5 | HTTPS sertifikası bu hostname için (certbot veya wildcard) Nginx’te tanımlı. |
| 6 | Tarayıcıda `https://kitchen.voyagestars.com` — giriş sayfası bu uygulamanın `/login` akışı olmalı. |

Bu site, aynı makinedeki diğer `voyagestars.com` sitelerinden (ör. `gate.voyagestars.com`) **bağımsız bir Docker Compose yığını** olarak çalışır. Dışarıya doğrudan port açmak yerine uygulama **yalnızca `127.0.0.1:3005`** üzerinden dinler; sunucudaki **Nginx** yalnızca **`kitchen.voyagestars.com`** için `proxy_pass` ile buraya yönlendirir. `kitchen` için ayrı `server_name` bloğu yoksa istekler başka sitenin `default_server` bloğuna düşebilir (ikisi de aynı siteyi gösterir).

**1) DNS**

- `kitchen.voyagestars.com` için **A** kaydı → sunucu IPv4 (ör. `194.62.54.157`). Cloudflare’da `kitchen`’i `gate`’e yönlendiren **Redirect Rule** olmamalı.

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

Repoda örnek yapılandırma: **`deploy/nginx-kitchen.voyagestars.com.example.conf`** (başka alt alan için aynı kalıp: `deploy/nginx-follow.voyagestars.com.example.conf`).

- Sertifika: örn. `sudo certbot certonly --nginx -d kitchen.voyagestars.com` (veya elinizdeki wildcard sertifikayı kullanın).
- Hızlı kurulum (sunucuda, sites-available / sites-enabled): `chmod +x deploy/install-kitchen-nginx.sh && ./deploy/install-kitchen-nginx.sh`
- `proxy_pass http://127.0.0.1:3005;` yalnızca **`server_name kitchen.voyagestars.com;`** bloğunda olmalı; `gate` ve diğer alt alanlar kendi dosyalarında kendi `proxy_pass` portlarına gider.

**5) Güncelleme**

```bash
cd /opt/tuketim-takip   # örnek yol
git pull
docker compose -f docker-compose.production.yml build app
docker compose -f docker-compose.production.yml up -d app
```

Aynı akışı tek komutta (sunucuda, Linux): önce betiklere çalıştırma izni verin:

```bash
chmod +x deploy/server-first-install.sh deploy/server-update.sh deploy/install-kitchen-nginx.sh
```

- **İlk kurulum:** `./deploy/server-first-install.sh` (içeride: `up -d db` → `setup` → `up -d app`)
- **Kod güncellemesi** (`gate.voyagestars.com` için yaptığınız `git pull` + `build` + `up` eşdeğeri): `./deploy/server-update.sh`
- Tam temiz imaj: `NO_CACHE=1 ./deploy/server-update.sh`

Veritabanı şeması değiştiyse (yeni migration): `setup` tekrar çalıştırmadan, yalnızca migrate için operasyon ekibi konteyner veya geçici `run` ile `npx prisma migrate deploy` çalıştırmalıdır (`setup` seed de çalıştırır).

**Özet mimari**

| Katman | Görev |
|--------|--------|
| DNS | `kitchen.voyagestars.com` → sunucu IP |
| Nginx (host, 443) | Sadece `kitchen` için TLS + `proxy_pass` → `127.0.0.1:3005` |
| Docker `app` | Next.js (bu repo `Dockerfile`) |
| Docker `db` | PostgreSQL, **dışarıya port açılmaz**; yalnızca compose ağı |

İsteğe bağlı: otel ortak CSS için `.env` / compose ortamına `NEXT_PUBLIC_HOTEL_CSS_URL` eklenebilir.

## Teknik yığın

Next.js 15 (App Router), Prisma, PostgreSQL, ExcelJS, Tailwind CSS.
