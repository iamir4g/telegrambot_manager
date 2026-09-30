# استقرار امن فیناپ روی سرور

این راهنما برای انتقال امن کد و اجرای استک با Docker است (API + پنل ادمین).

پیش‌نیاز مطالعه: [PHASES.md](./PHASES.md) · [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)

---

## ۱) پیش‌نیاز سرور

| مورد | توضیح |
|------|--------|
| سیستم | لینوکس (Ubuntu 22.04+ توصیه می‌شود) |
| Docker | Engine + Compose v2 |
| پورت | `80` (و در صورت HTTPS روی هاست: `443`) |
| دسترسی | SSH با کلید (ترجیحاً بدون پسورد root برای اپ) |
| دامنه | اختیاری؛ برای رویداد واقعی توصیه می‌شود |

نصب سریع Docker (خلاصه):

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
# یک‌بار خارج شوید و دوباره SSH بزنید
docker compose version
```

---

## ۲) انتقال امن کد

### روش ترجیحی: Git روی سرور

روی ماشین لوکال سکرت نگذارید داخل ریپو. روی سرور:

```bash
# با SSH key به ریموت
git clone git@YOUR_GIT_HOST:ORG/finnap.git
cd finnap
git checkout main   # یا برنچ پایدار رویداد
```

به‌روزرسانی بعدی:

```bash
git pull
docker compose up -d --build
```

### روش جایگزین: rsync

اگر ریموت Git در دسترس نیست، فقط سورس را بفرستید — **بدون** اسرار و آرتیفکت‌های محلی:

```bash
rsync -avz --delete \
  --exclude node_modules \
  --exclude .env \
  --exclude '.env.*' \
  --exclude '*.db' \
  --exclude '*.db-journal' \
  --exclude dist \
  --exclude .git \
  --exclude data \
  --exclude apps/data \
  ./ user@SERVER:/opt/finnap/
```

### ممنوع

- کپی کردن `.env` لوکال به سرور یا چت/ایمیل
- انتقال `*.db` پروداکشن روی کانال ناامن
- باز کردن پورت خام `3001` به اینترنت (Compose فقط `admin:80` را publish می‌کند)
- commit کردن توکن تلگرام، `JWT_SECRET`، `SETTINGS_ENCRYPTION_KEY`

---

## ۳) اسرار فقط روی سرور

```bash
cd /opt/finnap   # مسیر واقعی خودتان
cp .env.example .env
nano .env        # یا ویرایشگر دیگر
```

حداقل مقادیر:

| متغیر | کار |
|--------|-----|
| `JWT_SECRET` | امضای JWT — رشته تصادفی بلند |
| `SETTINGS_ENCRYPTION_KEY` | رمزنگاری توکن بات/LLM در DB — حداقل حدود ۳۲ کاراکتر |
| `CORS_ORIGIN` | آدرس عمومی پنل، مثلاً `https://panel.example.com` یا `http://SERVER_IP` |
| `RUN_SEED` | در **اولین** بالا آوردن `1`؛ بعد از ساخت ادمین `0` |
| `SEED_ADMIN_*` | ایمیل/رمز قوی ادمین اولیه |
| `HTTP_PORT` | پورت هاست برای nginx پنل (پیش‌فرض `80`) |

تولید سکرت تصادفی:

```bash
openssl rand -hex 32
openssl rand -hex 24
```

`VITE_API_URL` در ایمیج ادمین هنگام build روی `/api` تنظیم می‌شود؛ nginx همان مسیر را به Nest پروکسی می‌کند. نیازی به URL جدا برای API در مرورگر نیست.

توکن تلگرام و کلید LLM را **بعد از لاگین** از پنل بگذارید (نه در `.env` مگر لازم باشد). جزئیات: [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)

---

## ۴) اجرا با Docker Compose

از ریشه ریپو:

```bash
docker compose up -d --build
```

چه اتفاقی می‌افتد:

1. ایمیج API ساخته می‌شود (multi-stage، فقط وابستگی‌های production)
2. ایمیج Admin با Vite + tree-shaking / chunk split ساخته و با nginx سرو می‌شود
3. Entry API: `prisma migrate deploy` → در صورت `RUN_SEED=1` seed ادمین → `node dist/main.js`
4. SQLite روی volume نام‌دار `finnap_data` در مسیر `/data/finnap.db`
5. فقط پورت `HTTP_PORT` (پیش‌فرض ۸۰) روی هاست باز است

بررسی سلامت:

```bash
curl -sS http://127.0.0.1/api/health
# یا از بیرون: http://SERVER_IP/api/health
docker compose ps
docker compose logs -f api
```

پنل: `http://SERVER_IP/` (یا دامنه)  
API از مرورگر: همان دامنه با پیشوند `/api`

بعد از اولین seed موفق، در `.env` بگذارید `RUN_SEED=0` و یک‌بار:

```bash
docker compose up -d
```

---

## ۵) باندل سبک (tree shaking)

پنل با Vite در حالت production:

- minify با esbuild
- حذف `console` / `debugger`
- جداسازی chunkهای vendor (React، Mantine، TipTap، …) برای کش بهتر و دانلود اولیه کمتر

ایمیج API با `pnpm deploy --prod` بدون سورس و بدون devDependencies ساخته می‌شود.

---

## ۶) HTTPS و فایروال

Compose فعلی TLS را داخل کانتینر مدیریت نمی‌کند. برای رویداد واقعی:

1. فایروال فقط `22`، `80`، `443` را باز کند؛ `3001` را به اینترنت publish نکنید.
2. روی هاست یک reverse proxy (Caddy / nginx / Cloudflare) با گواهی Let’s Encrypt بگذارید و به `127.0.0.1:80` (سرویس admin) پروکسی کنید.
3. `CORS_ORIGIN` را روی همان `https://...` تنظیم کنید.

نمونه مینیمال Caddy روی هاست:

```caddyfile
panel.example.com {
  reverse_proxy 127.0.0.1:80
}
```

اگر بات در حالت webhook باشد، URL عمومی HTTPS لازم است — جزئیات در [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md).

---

## ۷) بکاپ و بازیابی SQLite

بکاپ volume:

```bash
docker compose stop api
docker run --rm -v finnap_finnap_data:/data -v "$(pwd)/backups:/backup" alpine \
  cp /data/finnap.db /backup/finnap-$(date +%Y%m%d-%H%M).db
docker compose start api
```

(نام volume را با `docker volume ls | grep finnap` چک کنید.)

بازیابی:

```bash
docker compose stop api
docker run --rm -v finnap_finnap_data:/data -v "$(pwd)/backups:/backup" alpine \
  cp /backup/finnap-YYYYMMDD-HHMM.db /data/finnap.db
docker compose start api
```

زمان‌بندی بکاپ (مثلاً cron روزانه) قبل از رویداد توصیه می‌شود.

---

## ۸) به‌روزرسانی بدون از دست دادن دیتا

```bash
git pull
# .env را دست نزنید مگر متغیر جدید لازم باشد
docker compose up -d --build
```

Volume دیتابیس باقی می‌ماند؛ migrationها در استارت API اعمال می‌شوند.

---

## ۹) چک‌لیست قبل از رویداد

- [ ] `.env` فقط روی سرور؛ سکرت‌های قوی؛ `RUN_SEED=0` بعد از ساخت ادمین
- [ ] `curl` به `/api/health` موفق است
- [ ] لاگین پنل با رمز قوی ادمین
- [ ] رمز پیش‌فرض توسعه (`admin123`) استفاده نشده
- [ ] توکن بات و کانال از پنل تنظیم و تست شده — [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)
- [ ] دانش/FAQ ضروری approved است
- [ ] بکاپ SQLite حداقل یک‌بار گرفته شده
- [ ] پورت `3001` از اینترنت در دسترس نیست
- [ ] در صورت دامنه: HTTPS فعال و `CORS_ORIGIN` درست است

---

## ۱۰) عیب‌یابی سریع

| مشکل | اقدام |
|------|--------|
| پنل باز می‌شود ولی API خطا | `docker compose logs api`؛ health و migrate |
| لاگین کار نمی‌کند | seed با `RUN_SEED=1` یک‌بار؛ ایمیل/رمز `.env` |
| CORS در مرورگر | `CORS_ORIGIN` = همان origin مرورگر (با https) |
| ایمیج سنگین / کند | از ریشه ریپو build کنید؛ `.dockerignore` را حذف نکنید |
| دیتابیس خالی بعد از recreate | volume را `down -v` نکنید مگر عمدی |

توقف کامل (بدون پاک کردن دیتا):

```bash
docker compose down
```

حذف دیتا (خطرناک):

```bash
docker compose down -v
```
