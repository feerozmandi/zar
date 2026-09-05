# Cloudflare — دامنه، SSL و WAF (نوت ۵ §۱)

تنظیمات لازم پس از اتصال دامنه (این‌ها در Cloudflare Dashboard اعمال می‌شوند، نه در مخزن):

1. **DNS** — رکورد `A` به IP سرور (Hetzner/Arvan) با حالت Proxied.
2. **SSL/TLS** — حالت `Full (strict)` + Always Use HTTPS + HSTS.
3. **Speed → Optimization** — Auto Minify فقط روی JS/CSS (HTML دست‌نخورده بماند).
4. **Caching** — قانون کش برای `/_next/static/*` (ئیراژ) و `Cache-Control: no-store` برای `/api/*`.
5. **WAF / Rate Rules** — برای `/api/v1/audit/upload` و `/api/v1/auth/*` محدودساز نرخ سخت‌تر.
6. **Turnstile** — روی فرم‌های ثبت‌نام و درخواست مشاوره (ضد ربات).
