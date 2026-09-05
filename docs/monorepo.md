# معماری مونورپو Xennic — راهنمای فنی

> این سند دلایل انتخاب‌ها و قواعد اجرایی مخزن را ثبت می‌کند؛ مرجع محصول و ماژول‌ها
> `docs/پلتفرم زننیک/نوت ۲` تا `نوت ۵` هستند. اینجا «چرا این‌طور چیده شده» آمده است.

---

## ۱. اصل حاکم: یک نسخه، در یک نقطه

خواسته‌ی بنیادین پروژه این است که **وابستگی‌ها در ریشه نصب و پیکربندی شوند** تا هیچ
بخشی (web، api، ocr، بسته‌های مشترک) نسخه‌ی خودش از یک کتابخانه نداشته باشد. سه سازوکار
در ریشه این را تضمین می‌کند:

| سازوکار | فایل | نقش |
|:---|:---|:---|
| pnpm workspace | `pnpm-workspace.yaml` → `packages:` | همه‌ی `apps/*` و `packages/*` یک درخت `node_modules` مشترک دارند |
| Version Catalog | `pnpm-workspace.yaml` → `catalog:` | **تک‌منبع حقیقت نسخه‌ها**؛ هر کتابخانه فقط یک‌بار اینجا شماره‌ی نسخه دارد |
| `catalog:` در بسته‌ها | `apps/*/package.json`، `packages/*/package.json` | بیان وابستگی با ارجاع به کاتالوگ، نه عدد نسخه |

```yaml
# pnpm-workspace.yaml
catalog:
  typescript: ~6.0.3
  eslint: ^9.39.5
  vitest: ^4.1.11
  "@prisma/client": 7.10.0
```

```json
// apps/web/package.json
{ "devDependencies": { "typescript": "catalog:", "vitest": "catalog:" } }
```

پیامد عملی:

- `pnpm install` هر پکیج را **یک‌بار** در store نصب می‌کند (hard-link به همه‌ی بسته‌ها).
- ارتقای نسخه = ویرایش یک خط در کاتالوگ؛ سپس `pnpm install` و `pnpm verify`.
- اگر دو بسته به دو نسخه‌ی متفاوت نیاز پیدا کنند، pnpm آن را در `pnpm why` و
  `pnpm dedupe` نشان می‌دهد؛ قفل‌شده در `pnpm-lock.yaml` باید فقط یک نسخه نگه دارد.
- سیاست `minimumReleaseAge` (پیش‌فرض pnpm 11 ≈ یک روز) از نصب بسته‌های هم‌زمان با انتشار
  محافظت می‌کند؛ در صورت نیاز صریح، به `minimumReleaseAgeExclude` افزوده می‌شود.

### افزودن کتابخانه‌ی جدید

1. نسخه را در `catalog` اضافه کنید.
2. در بسته‌های مصرف‌کننده `"foo": "catalog:"` بنویسید (هرگز عدد نسخه در بسته).
3. اگر ابزار ساخت است (tailwind، postcss، eslint plugin) فقط در همان بخش؛ اگر منطق
   مشترک است در `@xennic/shared` و مصرف‌کننده‌ها از آنجا import کنند.

---

## ۲. پیکربندی متمرکز ابزارها

| ابزار | نقطه‌ی تعریف | نکته |
|:---|:---|:---|
| TypeScript | `tsconfig.base.json` + `packages/typescript-config/*` | `strict`، `noUncheckedIndexedAccess`، `verbatimModuleSyntax`، `isolatedModules` |
| ESLint | `packages/eslint-config/src/base.mjs` (+ `node.mjs`، `react.mjs`) | هر بسته `eslint.config.mjs` دارد که از همان‌جا ارث می‌برد؛ تحلیل نوع‌محور با `projectService` |
| Prettier | `.prettierignore`/`.prettierrc.json` در ریشه | تنها فرمتر؛ قواعد فرمت در ESLint با `eslint-config-prettier` خاموش شده‌اند |
| آزمون‌ها | `vitest` در ریشه (catalog) | یک اجراکننده برای همه: api با `environment: node`، web با `jsdom` + `@vitejs/plugin-react` |
| Git hooks | `.husky/pre-commit`، `.husky/commit-msg` | `lint-staged` + `commitlint` (Conventional Commits، مطابق CONTRIBUTING) |
| گردش کار | `turbo.json` | `build/lint/typecheck/test` با گراف `^build`؛ `dev` و `start` پایدار |

### دو تصمیم مهم

- **حذف oxlint از قالب Nest 12:** Nest CLI نسخه‌ی ۱۲ برای `nest new` یک `oxlint` جدا
  تولید می‌کند. در مونورپو این یعنی دو زنجیره‌ی lint با دو مجموعه‌قاعده؛ پس lint کل مخزن
  روی **ESLint 9 + typescript-eslint** یکدست شده است (قاعده‌ی `no-floating-promises` و
  تحلیل نوع‌محور روی کد Nest هم فعال است).
- **ESLint 9 و نه ۱۰:** `eslint-config-next@16` به `eslint-plugin-react@7` وابسته است که
  با ESLint 10 سازگار نیست (`context.getFilename` حذف شده). برای همین کاتالوگ روی
  `^9.39.5` قفل شده و `overrides` تضمین می‌کند تنها **یک** نمونه‌ی `eslint` و
  `typescript-eslint` در درخت نصب شود؛ در غیر این صورت خطای
  `Cannot redefine plugin "@typescript-eslint"` در lint وب ظاهر می‌شود.
- **TypeScript `~6.0.3`:** `typescript-eslint` تا `TS < 6.1` را پشتیبانی می‌کند؛ محدوده‌ی
  نیمار (`~`) عمداً بسته انتخاب شده تا ارتقای خودکار، lint را نشکند.

---

## ۳. چیدمان بسته‌ها و مرزهای import

```
@xennic/design-tokens  ──┐
@xennic/shared  ─────────┼──► @xennic/ui ──► apps/web
                         │                 └──► apps/api
@xennic/database ────────┘
```

- `@xennic/shared`: منطق خالص (محاسبات مهندسی، خورشید، فرمت فارسی/جلالی)، **اسکیمای zod
  به‌عنوان قرارداد API**، ثابت‌ها (`ROLES`، `MODULES`، `QUEUES`، `routes`) و رمزنگاری
  (scrypt برای رمز عبور، AES-256-GCM برای BYOK). هیچ وابستگی Node اختصاصی ندارد مگر
  `node:crypto` در بخش امنیت.
- `@xennic/database`: تنها جایی که `schema.prisma` را می‌شناسد؛ `PrismaClient` را با
  `@prisma/adapter-pg` می‌سازد و خروجی type-safe می‌دهد. `apps/web` هرگز Prisma import
  نمی‌کند (دسترسی داده فقط از Core API).
- `@xennic/ui`: کامپوننت‌های بدون منطق کسب‌وکار؛ استایل از توکن‌های `design-tokens`.
- خروجی بسته‌ها `dist/` با declaration است (نه `src`)؛ بنابراین `pnpm build` پیش از
  `typecheck` مصرف‌کننده در `turbo.json` تضمین می‌شود و lint هم روی `.d.ts` واقعی
  انجام می‌گیرد.

### قرارداد import در دو جهان

| محیط | سبک | دلیل |
|:---|:---|:---|
| `apps/api` (Node ESM، TS `nodenext`) | `./x.js` الزامی | خروجی `tsc` روی Node بدون resolver اجرا می‌شود |
| `apps/web` (Next/Turbopack) | بدون پسوند | webpack/Turbopack پسوند `.js → .tsx` را نگاشت نمی‌کند |
| بسته‌های مشترک | `./x.js` + `exports` map | مصرف‌کننده‌ها از `dist` خوانده می‌شوند |

همچنین در CSS: `apps/web/src/app/globals.css` با `@import "@xennic/design-tokens/theme.css"`
و `@import "@xennic/ui/styles.css"` کار می‌کند (از طریق `exports` بسته)، نه مسیر نسبی
`../../../` — تا جابه‌جایی ساختار، بیلد را نشکند.

---

## ۴. Prisma 7 (تغییرات مهم نسبت به نسل قبل)

- `generator client { provider = "prisma-client"; output = "../src/generated/prisma"; moduleFormat = "esm" }`
  → کلاینت **داخل مخزن تولید و ignore می‌شود** و از `./generated/prisma/client.js` import
  می‌گردد (دیگر `node_modules/.prisma` نبوده و Turbopack هم گیج نمی‌شود).
- `datasource` فقط `provider = "postgresql"`؛ تمام تنظیم اتصال به `prisma.config.ts` منتقل
  شده است (`migrations.path`، `migrations.seed`، `dsml?`).
- ساخت client **الزاماً** با adapter: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`
  — این تنها راه در Prisma 7 است و در `@xennic/database` پیاده شده تا در سه بخش تکرار نشود.
- `--no-hints` در اسکریپت `generate` تا خروجی CI تمیز بماند.
- `scripts/ensure-client.mjs`: اگر شبکه برای دانلود engine نباشد ولی کلاینت تولید شده باشد،
  بیلد incremental با هشدار ادامه می‌دهد؛ در CI (کلون تازه) همان خطا مرگبار است — یعنی
  «تولید واقعی» تضمین می‌ماند.
- `prisma/migrations/` فعلاً فقط README دارد: اولین مهاجرت `0_init` باید روی دیتابیس
  واقعی با `pnpm db:migrate` ساخته و commit شود.

---

## ۵. Next.js 16 / Tailwind v4 / React 19

- Tailwind v4 **CSS-first** است: هیچ `tailwind.config.js` وجود ندارد؛ تم از
  `@theme` در `packages/design-tokens/src/theme.css` می‌آید و `postcss.config.mjs`
  تنها `@tailwindcss/postcss` را دارد.
- فونت وزیرمتن از پکیج npm (`vazirmatn`) با `next/font/local` بارگذاری می‌شود تا
  `next build` به CDN یا شبکه وابسته نباشد.
- ارتباط با بک‌اند: `NEXT_PUBLIC_API_URL=/api/proxy` (هم‌ریشه) و مسیر `/api/proxy/[...path]`
  سمت سرور به `API_INTERNAL_URL` (پیش‌فرض `http://localhost:4000/api/v1`) فوروارد
  می‌کند؛ در نتیجه هیچ کلیدی در مرورگر قرار نمی‌گیرد و CORS لازم نیست.
- تست وب با `vitest` + `jsdom` در همان رانر مرکزی انجام می‌شود.

---

## ۶. NestJS 12

- `"type": "module"` + `sourceRoot` در `nest-cli.json` و `tsConfigPath: tsconfig.build.json`.
- `useDefineForClassFields: false` (الزامی برای DTOهای class-validator) و
  `emitDecoratorMetadata` در `packages/typescript-config/nest.json` متمرکز شده است.
- لایه‌ی سراسری: `helmet` → `ValidationPipe` (whitelist/transform) → `ApiEnvelopeInterceptor`
  (`{ success, data }`) → `AllExceptionsFilter`؛ نسخه‌دهی URI (`/api/v1`) و Swagger
  پشت `SWAGGER_ENABLED`.
- صف‌ها با `@nestjs/bullmq` + `ioredis` در `QueueModule` مرکزی تعریف می‌شوند و worker
  مستقل (`apps/api/src/infra/queue/worker.ts`) در ظرف جدا اجرا می‌شود (نوت ۵ §۱).
- محدودسازی نرخ در لایه‌ی لبه است (`infra/nginx/conf.d/xennic.conf` و قوانین Cloudflare)؛
  `@nestjs/throttler` هنوز برای Nest 12 منتشر نشده و عمداً اضافه نشده است.

---

## ۷. بخش پایتون (apps/ocr)

- اکوسیستم پایتون در `node_modules` ریشه جای نمی‌گیرد؛ venv در `apps/ocr/.venv`
  (gitignored) با پل `scripts/ocr.mjs` ساخته می‌شود:
  `pnpm ocr:install | ocr:dev | ocr:test | ocr:lint | ocr:typecheck`.
- قرارداد داده‌ها با `@xennic/shared` هم‌نام است (snake_case در پاسخ HTTP، همان کلیدهای
  `billMetricsSchema`) تا مصرف‌کننده‌ها دو نسخه‌ی فیلد نبینند.
- ruff (lint + format) و mypy در `pyproject.toml` پیکربندی شده‌اند و در CI جدا از Node
  اجرا می‌شوند (`.github/workflows/ci.yml` → job `ocr`).

---

## ۸. سنجش قطعی (هر PR)

| لایه | دستور | وضعیت فعلی |
|:---|:---|:---|
| ساخت | `pnpm build` (turbo: 6 task) | ✓ سبز — `next build` با ۲۹ مسیر، `nest build`، `tsc` بسته‌ها |
| تایپ | `pnpm typecheck` (turbo: 10 task) | ✓ سبز |
| lint | `pnpm lint` (turbo: 11 task) | ✓ سبز (تحلیل نوع‌محور فعال) |
| تست TS | `pnpm test` (vitest در shared/api/web) | ✓ ۱۹ آزمون سبز |
| تست پایتون | `pnpm ocr:test` | ✓ ۷ آزمون سبز |
| قالب‌بندی | `pnpm format:check` | ✓ سبز |
| استقرار | `docker compose config` | ⚠ در این سندباکس docker نصب نیست؛ فایل‌ها بر اساس نوت ۵ نوشته شده و روی VPS اعتبارسنجی می‌شوند |

---

## ۹. افزودن بسته‌ی جدید (چک‌لیست)

1. `packages/<name>/package.json` با `"name": "@xennic/<name>"`، `"type": "module"`،
   `exports` به `dist`، و همه‌ی وابستگی‌ها با `catalog:`.
2. `tsconfig.json` (extends `../../tsconfig.base.json`) + `tsconfig.build.json`
   (`rootDir: ./src`، `outDir: ./dist`، `declaration: true`).
3. `eslint.config.mjs` با `node()` یا `react()` از `@xennic/eslint-config`.
4. اسکریپت‌های `build`، `typecheck`، `lint`، `test`، `clean` (Turbo همین نام‌ها را می‌شناسد).
5. `workspace:*` در مصرف‌کننده‌ها؛ سپس `pnpm install && pnpm verify`.
6. اگر زیرساخت جدید است: `Dockerfile`، `docker-compose.yml` سرویس، بخش `ci.yml` و
   به‌روزرسانی همین سند + `README.md`.

---

**آخرین بروزرسانی:** 2026-09-05
