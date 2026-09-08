# 🧠 ماژول هوش مصنوعی — Multi-Model AI Gateway و AI Arena

**مالک:** تیم توسعه Xennic
**تاریخ:** ۲۰۲۶-۰۹-۰۸
**وضعیت:** نسخه ۱.۰ — پیاده‌سازی فاز «دروازه‌ی چندمدلی + AI Arena»
**مرجع:** نوت ۳ (§۲-ج، §۴، §۵) و نوت ۵ (گام چهارم — AI Arena)

---

## ۱. معماری

```text
        ┌────────────────────────────┐        ┌───────────────────────────────┐
        │  AI Arena (apps/web/ai)    │        │  سایر ماژول‌ها (wiki/ask-ai)  │
        └──────────────┬─────────────┘        └───────────────┬───────────────┘
                       │  REST /api/v1/ai/*                   │
                       ▼                                      ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │                  AiController + AiService (NestJS)               │
        │   sync: generate / compare        async: enqueue → AiJob + صف    │
        └──────────────┬──────────────────────────────────┬────────────────┘
                       │                                  │ BullMQ (ai.request)
                       ▼                                  ▼
        ┌───────────────────────────┐        ┌───────────────────────────────┐
        │  ai-gateway.ts (خالص)     │◄───────│ worker → ai-request.processor │
        │  buildRequest/parse/call  │        │ generate | wiki-ask           │
        └──────────────┬────────────┘        └───────────────┬───────────────┘
                       ▼                                     ▼
        GitHub Models / OpenAI / Anthropic / Gemini      Postgres (ai_jobs)
```

### اجزای کلیدی

| فایل | نقش |
|:---|:---|
| `apps/api/src/modules/ai/ai-gateway.ts` | لایه‌ی خالص قرارداد HTTP هر ارائه‌دهنده (بدون NestJS) — تنها مرجع build/parse/call |
| `apps/api/src/modules/ai/ai.service.ts` | سرویس دروازه: models، generate، compare، enqueue، job/jobs |
| `apps/api/src/modules/ai/ai.controller.ts` | مسیرهای REST ماژول ai |
| `apps/api/src/infra/queue/processors/ai-request.processor.ts` | پردازشگر واقعی صف `ai.request` (generate و wiki-ask) |
| `apps/api/src/common/crypto/aes-gcm.ts` | توابع خالص AES-256-GCM — مشترک بین CryptoService و worker |
| `packages/shared/src/schemas/ai.ts` | اسکیماهای zod قرارداد API (سینک با فرانت‌اند) |
| `packages/database/prisma/schema.prisma` → مدل `AiJob` | ماندگاری چرخه‌ی حیات کارهای ناهم‌زمان |
| `apps/web/src/app/_components/ai/arena-playground.tsx` | Playground مقایسه‌ی چندمدلی (AI Arena) |
| `apps/web/src/app/_components/ai/job-history.tsx` | تاریخچه‌ی کارهای ناهم‌زمان با polling خودکار |

---

## ۲. قرارداد API

### مسیرهای موجود و جدید

| Method | مسیر | شرح | احراز هویت |
|:--|:---|:---|:--:|
| GET | `/api/v1/ai/models` | فهرست مدل‌های فعال (کاتالوگ یا پیش‌فرض نوت ۳) | عمومی |
| POST | `/api/v1/ai/generate` | ارسال پرامپت (sync یا `async: true` → صف) | ✅ |
| POST | `/api/v1/ai/compare` | **جدید** — AI Arena: یک پرامپت روی حداکثر ۳ مدل هم‌زمان | ✅ |
| GET | `/api/v1/ai/jobs` | **جدید** — تاریخچه‌ی کارهای ناهم‌زمان کاربر (صفحه‌بندی) | ✅ |
| GET | `/api/v1/ai/jobs/:id` | **جدید** — وضعیت/نتیجه‌ی یک کار (فقط صاحب کار) | ✅ |
| POST | `/api/v1/wiki/ask-ai` | پرسش دانشنامه — اکنون AiJob ماندگار می‌سازد و jobId برمی‌گرداند | ✅ |

### نمونه‌ی compare

```json
POST /api/v1/ai/compare
{
  "prompt": "این پروفیل مصرف را تحلیل کن…",
  "models": ["gpt-4o", "llama-3.3-70b"],
  "useOwnKey": false
}
→ { "success": true, "data": { "tier": "SYSTEM", "results": [
     { "model": "gpt-4o", "ok": true, "content": "…", "latencyMs": 850,
       "usage": { "promptTokens": 120, "completionTokens": 340 } },
     { "model": "llama-3.3-70b", "ok": false, "errorMessage": "…", "latencyMs": 120 }
] } }
```

خطای یک مدل، نتیجه‌ی مدل‌های دیگر را از بین نمی‌برد (Promise.all با catch داخلی).

---

## ۳. چرخه‌ی حیات کار ناهم‌زمان (AiJob)

```text
POST /ai/generate {async:true}  ──►  aiJob.create (QUEUED)  ──►  BullMQ add(jobId = aiJob.id)
                                                                     │ worker
                                              RUNNING ◄──────────────┘
                                                 │ callProvider
                                     SUCCEEDED / FAILED  (+ resultText، توکن‌ها، تأخیر)
                                                 │
GET /ai/jobs/:id  ◄──────────────  خواندن از Postgres (مستقل از TTL صف Redis)
```

- شناسه‌ی BullMQ همان `AiJob.id` است (`{ jobId: job.id }`) تا ردیابی یک‌به‌یک باشد.
- نتیجه در Postgres ماندگار است؛ `removeOnComplete` صف Redis مشکلی ایجاد نمی‌کند.
- `wiki-ask` علاوه بر پرسش، متن مقالات انتخابی (`articleIds`) را به‌عنوان زمینه با سقف
  ۲۴هزار نویسه در پرامپت می‌گنجاند و با system prompt تخصصی فارسی پاسخ می‌گیرد.

## ۴. امنیت (BYOK)

- کلید کاربر فقط لحظه‌ی فراخوان با AES-256-GCM رمزگشایی می‌شود (`aes-gcm.ts` مشترک بین API و worker).
- در `AiJob.inputJson` هرگز کلید یا داده‌ی حساس ذخیره نمی‌شود (فقط پرامپت و پارامترها).
- کلید Anthropic/Gemini به آدرس ارائه‌دهنده‌ی خودش می‌رود (نگاشت `PROVIDER_BASE_URL`).
- خطای ارائه‌دهنده حداکثر ۵۰۰ نویسه در `errorMessage` ذخیره می‌شود؛ پاسخ خام لاگ نمی‌شود.

## ۵. تست‌ها

| فایل | پوشش |
|:---|:---|
| `ai-gateway.spec.ts` | build/parse برای ۴ ارائه‌دهنده + callProvider (موفق/خطا/شبکه/timeout) |
| `ai.service.spec.ts` | models، generate (SYSTEM/BYOK/خطا)، compare (موازی/خطای جزئی/dedupe)، enqueue/jobs |
| `ai-request.processor.spec.ts` | چرخه‌ی RUNNING→SUCCEEDED/FAILED، BYOK در worker، زمینه‌ی wiki، سقف نویسه |
| `test/ai.e2e-spec.ts` | قرارداد HTTP: envelope، اعتبارسنجی zod، jobId، مالکیت job، سقف ۳ مدل |

اجرا:

```bash
pnpm --filter @xennic/api test        # واحد
pnpm --filter @xennic/api test:e2e    # e2e (بدون نیاز به DB/Redis واقعی)
```

## ۶. مهاجرت دیتابیس

مدل جدید `AiJob` (جدول `ai_jobs`) به schema اضافه شده است. در محیط دارای PostgreSQL:

```bash
pnpm --filter @xennic/database db:push       # توسعه
pnpm --filter @xennic/database migrate:dev   # ساخت مهاجرت رسمی
```

## ۷. گام‌های بعدی پیشنهادی

- [ ] Streaming (SSE) برای پاسخ‌های طولانی در Arena
- [ ] retrieval واقعی (tsvector/embedding) به‌جای انتخاب دستی `articleIds` در wiki-ask
- [ ] سهمیه‌بندی per-user روی لایه‌ی SYSTEM (rate limit منطقی در دیتابیس)
- [ ] اتصال `bill.analyze` به همین دروازه برای تحلیل هوشمند قبض (فاز ۲)
