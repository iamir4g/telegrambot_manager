# Finnap AI Assistant

پنل بک‌آفیس + API + بات تلگرام برای رویداد Finup Credit First.

## استک

- `apps/api` — NestJS + Prisma + SQLite
- `apps/admin` — React + Mantine + TanStack Query + React Hook Form
- معماری feature-based — جزئیات در [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- فازها — [`docs/PHASES.md`](docs/PHASES.md)
- راه‌اندازی بات و کانال تلگرام — [`docs/TELEGRAM_SETUP.md`](docs/TELEGRAM_SETUP.md)
- راهنمای پنل برای دمو به تیم — [`docs/PANEL_GUIDE.md`](docs/PANEL_GUIDE.md)

## راه‌اندازی محلی

```bash
pnpm install
mkdir -p data
cd apps/api && pnpm prisma migrate dev --name init && pnpm prisma:seed
pnpm dev
```

- API: http://localhost:3001/api/health
- Admin: http://localhost:5173
- ورود پیش‌فرض: `admin@finnap.local` / `admin123`

## متغیرهای مهم API

در `apps/api/.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `SETTINGS_ENCRYPTION_KEY`
- اختیاری: `OPENAI_API_KEY` / `OPENAI_BASE_URL` (یا از پنل)

تنظیمات بات تلگرام و FAQ از پنل ادمین انجام می‌شود.  
راهنمای گام‌به‌گام توکن، کانال و تست ارسال: [`docs/TELEGRAM_SETUP.md`](docs/TELEGRAM_SETUP.md)  
توضیح منوهای پنل برای دمو: [`docs/PANEL_GUIDE.md`](docs/PANEL_GUIDE.md)
