# infra/ — زیرساخت و استقرار

| مسیر | کاربرد |
|:---|:---|
| `nginx/nginx.conf`, `nginx/conf.d/xennic.conf` | رِوروِس پروکسی، محدودساز نرخ، کش استاتیک (نوت ۵ §۱) |
| `nginx/snippets/` | سربرگ‌های امنیتی مشترک |
| `postgres/init.sql` | افزونه‌های لازم (pg_trgm، unaccent) هنگام ساخت دیتابیس |
| `cloudflare/` | یادداشت‌های تنظیم DNS/WAF روی Cloudflare |

## الگوی اجرا

```bash
cp .env.example .env && pnpm setup     # تولید کلیدها و ساخت .env محلی
pnpm infra:up                          # فقط PostgreSQL + Redis (حالت توسعه)
docker compose up -d --build           # کل پشته (وب، API، OCR، worker، Nginx)
```

> **نکته:** `docker compose up -d --build` برای ایمیج‌ها به `pnpm-lock.yaml` و کل درخت منبع
> نیاز دارد؛ بیلد از ریشه‌ی مخزن (context: `.`) انجام می‌شود تا کَش مونورپو حفظ شود.
