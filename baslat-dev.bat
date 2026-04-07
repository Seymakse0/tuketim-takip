@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo === Et tuketim kontrol - gelistirme sunucusu ===
echo.

where npm >nul 2>&1
if errorlevel 1 (
    echo [HATA] Node.js / npm bulunamadi.
    echo Lutfen https://nodejs.org adresinden LTS surumunu kurun, sonra bu dosyayi tekrar calistirin.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Ilk kurulum: bagimliliklar yukleniyor ^(bir kac dakika surebilir^)...
    call npm install
    if errorlevel 1 (
        echo [HATA] npm install basarisiz.
        pause
        exit /b 1
    )
)

where docker >nul 2>&1
if not errorlevel 1 (
    echo Yerel PostgreSQL ^(Docker^) baslatiliyor...
    docker compose up -d db
    if errorlevel 1 (
        echo [UYARI] docker compose basarisiz. .env icindeki DATABASE_URL ile uyumlu bir PostgreSQL gerekir.
    ) else (
        echo Veritabaninin ayaga kalkmasi icin bir kac saniye bekleniyor...
        timeout /t 5 /nobreak >nul
    )
) else (
    echo [BILGI] Docker yok; PostgreSQL ayri calistiriliyorsa .env DATABASE_URL degerini kontrol edin.
)

echo.
echo Sunucu baslatiliyor. Tarayicida acin: http://localhost:3000
echo Durdurmak icin bu pencerede Ctrl+C basin.
echo.

call npm run dev

pause
