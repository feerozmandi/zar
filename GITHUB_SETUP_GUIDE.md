# 🚀 راهنمای جامع GitHub Governance، معماری Ruleset و دروازه‌های کیفیت QA

**پروژه:** پلتفرم Xennic (زننیک)
**سازمان:** شرکت سهامی خاص زر نور نیرو یکتا
**نگارش:** ۲.۰.۰ — ۲۰۲۶-۰۹-۰۴
**مخزن:** `https://github.com/feerozmandi/zar`

---

## 📋 فهرست مطالب

1. [مقدمه و معماری راهبری (Governance Architecture)](#۱-مقدمه-و-معماری-راهبری)
2. [مقایسه Branch Protection سنتی و GitHub Rulesets مدرن](#۲-مقایسه-branch-protection-سنتی-و-github-rulesets-مدرن)
3. [پیکربندی گام‌به‌گام Rulesetها با فایل‌های آماده](#۳-پیکربندی-گام‌به‌گام-rulesetها)
4. [دروازه‌های پنج‌گانه کیفیت (5 QA Quality Gates)](#۴-دروازه‌های-پنج‌گانه-کیفیت-qa)
5. [خط‌مشی شاخه‌بندی و گردش کار توسعه (Gitflow)](#۵-خط‌مشی-شاخه‌بندی-و-گردش-کار-توسعه)
6. [چک‌لیست بررسی و ادغام Pull Request](#۶-چک‌لیست-بررسی-و-ادغام-pull-request)
7. [خطایابی و پرسش‌های متداول](#۷-خطایابی-و-پرسش‌های-متداول)

---

## ۱. مقدمه و معماری راهبری

پلتفرم **Xennic** یک سامانه حساس مهندسی انرژی، ممیزی هوشمند قبوض و محاسبات فنی بر پایه هوش مصنوعی است. برای تضمین پایداری کدهای عملیاتی، جلوگیری از درج تصادفی کلیدهای رمزنگاری و تضمین کیفیت تحویل نرم‌افزار، زیرساخت راهبری GitHub مخزن بر پایه دو رکن اساسی بنا شده است:

1. **GitHub Repository Rulesets:** جایگزین پیشرفته و انعطاف‌پذیر قوانین قدیمی Branch Protection با قابلیت نسخه‌پذیری و اعمال سیاست‌های لایه‌ای.
2. **QA Quality Gates:** زنجیره‌ای ۵ مرحله‌ای از فیلترهای کیفیت خودکار و بازبینی انسانی که مانع از ورود کدهای معیوب به شاخه‌های `dev` و `main` می‌شود.

---

## ۲. مقایسه Branch Protection سنتی و GitHub Rulesets مدرن

| قابلیت | Branch Protection سنتی (Legacy) | GitHub Repository Rulesets (مدرن) | وضعیت در Xennic |
| :--- | :---: | :---: | :---: |
| **قالب پیکربندی** | فرم‌های تکی در UI | فایل‌های JSON استاندارد قابل Import/Export | ✅ پیکربندی با JSON |
| **قوانین چندگانه بر یک شاخه** | ❌ محدود و تداخلی | ✅ ترکیب چند Ruleset با اولویت مشخص | ✅ فعال |
| **محافظت از Tagها** | ❌ نیازمند تنظیم مجزا | ✅ پشتیبانی بومی با قوانین تگ و SemVer | ✅ فعال برای `v*.*.*` |
| **اعتبارسنجی فراداده و کامیت** | ❌ محدود | ✅ اعتبارسنجی الگوی پیام کامیت و ایمیل | ✅ Conventional Commits |
| **استثنائات بدون دور زدن کامل** | ❌ یا همه یا هیچ | ✅ Bypass list برای ربات‌های مجاز و CI | ✅ مدیریت‌شده |

---

## ۳. پیکربندی گام‌به‌گام Rulesetها

فایل‌های JSON پیکربندی استاندارد در مسیر `.github/rulesets/` قرار دارند:
- `main-ruleset.json`: محافظت شاخه پایدار `main`
- `dev-ruleset.json`: محافظت شاخه یکپارچه‌سازی `dev`
- `tags-ruleset.json`: محافظت از برچسب‌های نسخه‌های رسمی `v*.*.*`

### روش ۱: اعمال از طریق GitHub CLI (پیشنهادی برای مدیران مخزن)

با داشتن دسترسی مدیر مخزن (Admin/Owner)، دستورات زیر را اجرا کنید:

```bash
# ۱. اعمال Ruleset شاخه main
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/feerozmandi/zar/rulesets \
  --input .github/rulesets/main-ruleset.json

# ۲. اعمال Ruleset شاخه dev
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/feerozmandi/zar/rulesets \
  --input .github/rulesets/dev-ruleset.json

# ۳. اعمال Ruleset تگ‌های نسخه
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/feerozmandi/zar/rulesets \
  --input .github/rulesets/tags-ruleset.json
```

### روش ۲: تنظیم از طریق پنل کاربری وب GitHub

1. به مسیر **Settings** > **Rules** > **Rulesets** در ریپوزیتوری مراجعه کنید:
   `https://github.com/feerozmandi/zar/settings/rules`
2. روی دکمه **New ruleset** > **New branch ruleset** کلیک کنید.
3. **تنظیمات شاخه `main`:**
   - **Ruleset Name:** `main-production-ruleset`
   - **Enforcement status:** `Active`
   - **Target branches:** اضافه کردن `Include default branch` یا `fnmatch: refs/heads/main`
   - **Rules:**
     - [x] Restrict deletions
     - [x] Block force pushes
     - [x] Require linear history
     - [x] Require a pull request before merging (حداقل ۱ Approve، فعال‌سازی Dismiss stale approvals، فعال‌سازی Require review from Code Owners)
     - [x] Require status checks to pass (افزودن `QA Gate / Quality & Test Matrix`، `Security Gate / Secret & Dependency Scan` و `PR Gate / Conventional Commits & Rules`)
4. **تنظیمات شاخه `dev`:**
   - **Ruleset Name:** `dev-integration-ruleset`
   - **Target branches:** اضافه کردن `fnmatch: refs/heads/dev`
   - **Rules:** فعال‌سازی Require PR، Status Checks الزامی، عدم اجازه به Force Push و حذف شاخه.
5. روی **Save changes** کلیک کنید.

---

## ۴. دروازه‌های پنج‌گانه کیفیت (5 QA Quality Gates)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          5 QA QUALITY GATES MATRIX                          │
└─────────────────────────────────────────────────────────────────────────────┘

 [دروازه ۱: انضباط توسعه محلی] ──► [دروازه ۲: ماتریس تست CI] ──► [دروازه ۳: امنیت و اسرار]
               │                                                          │
               ▼                                                          ▼
 [دروازه ۴: بازبینی همتا و کد] ◄──────────────────────────────────────────┘
               │
               ▼
 [دروازه ۵: انتشار و استقرار]
```

### 🚪 دروازه ۱: انضباط توسعه محلی و استاندارد کامیت‌ها (Pre-commit & Conventional Commits)
- **هدف:** جلوگیری از ورود کامیت‌های نامنظم و نامفهوم به چرخه گیت.
- **معیار پذیرش:**
  - ساختار پیام‌های کامیت طبق استاندارد Conventional Commits: `type(scope): message`
  - انواع مجاز: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
  - اعتبارسنجی محلی کدها با ابزارهای فرمت و تایپ‌چک پیش از پوش.

### 🚪 دروازه ۲: ماتریس اعتبارسنجی خودکار و تست CI (CI Quality & Test Matrix)
- **فایل گردش کار:** `ci/workflows/ci.yml` (آماده انتقال به `.github/workflows/ci.yml` توسط مالک مخزن)
- **معیار پذیرش:**
  - **Lint Check:** اجرای بدون خطای `pnpm lint` در سراسر بسته‌های مونورپو.
  - **Type Checking:** اعتبارسنجی دقیق TypeScript در حالت `strict: true` با `pnpm typecheck`.
  - **Unit & Integration Tests:** اجرای تمام تست‌های Jest/Vitest با پوشش آزمون (Coverage) مطلوب (`pnpm test`).
  - **Build Verification:** بیلد موفقیت‌آمیز تمام بسته‌ها و برنامه‌های `apps/api` و `apps/web` با Turborepo (`pnpm build`).

### 🚪 دروازه ۳: اسکن امنیتی و پایش اسرار (Security & Dependency Gate)
- **فایل گردش کار:** `ci/workflows/security.yml` (آماده انتقال به `.github/workflows/security.yml`)
- **معیار پذیرش:**
  - **Secret Detection:** اسکن دقیق ریپوزیتوری جهت جلوگیری از افشای کلیدهای خصوصی، توکن‌های GitHub/OpenAI و سکرت‌های سرور.
  - **Dependency Audit:** ممیزی بسته‌های npm جهت کشف آسیب‌پذیری‌های امنیتی بالا و بحرانی (High/Critical).
  - **BYOK Encryption Compliance:** رعایت الگوریتم AES-256-GCM برای ذخیره کلیدهای اختصاصی کاربران در ماژول‌های هوش مصنوعی.

### 🚪 دروازه ۴: بازبینی همتا، تأیید کد و مالکیت (Code Review & CODEOWNERS)
- **فایل تنظیمات:** `.github/CODEOWNERS` و قوانین Ruleset
- **معیار پذیرش:**
  - ثبت حداقل ۱ تأیید رسمی (Approval) از اعضای مجاز تیم پیش از Merge.
  - بررسی و تأیید فایل‌های تغییریافته توسط مالکین تعیین‌شده در `CODEOWNERS`.
  - حل‌وفصل کامل تمامی مکالمات و کامنت‌های بازبینی (Conversation Resolution).
  - به‌روز بودن کامل شاخه با شاخه مقصد (`dev` یا `main`) بدون تداخل (Merge Conflict).

### 🚪 دروازه ۵: نسخه‌بندی معنایی و انتشار پایدار (Semantic Release & Production Gate)
- **فایل گردش کار:** `ci/workflows/release.yml` (آماده انتقال به `.github/workflows/release.yml`)
- **معیار پذیرش:**
  - برچسب‌گذاری نسخه‌ها طبق استاندارد SemVer (`vMAJOR.MINOR.PATCH`).
  - تولید خودکار یادداشت‌های انتشار (Release Notes) بر اساس کامیت‌های ادغام‌شده.
  - آماده‌سازی کانتینرهای داکر و خروجی‌های ایزوله برای استقرار روی سرورهای ابری.

---

## ۵. خط‌مشی شاخه‌بندی و گردش کار توسعه (Gitflow)

```
main (v1.0.0, v1.1.0 - فقط پایدار و عملیاتی)
  ▲
  │ (PR رسمی پس از تست نهایی و تایید مدیر ارشد)
  │
dev (شاخه یکپارچه‌سازی و تست مستمر)
  ▲
  ├── feature/<نام-ویژگی>      (پیاده‌سازی ماژول جدید)
  ├── fix/<نام-باگ>             (رفع اشکال نرم‌افزاری)
  ├── docs/<عنوان-مستند>        (به‌روزرسانی اسناد و معماری)
  └── chore/<کارهای-زیرساختی>   (به‌روزرسانی پکیج‌ها و کانفیگ‌ها)
```

### مراحل شروع کار روی یک تسک جدید:

```bash
# ۱. به‌روزرسانی شاخه dev محلی
git fetch origin
git checkout dev
git pull origin dev

# ۲. ایجاد شاخه کاری جدید از dev
git checkout -b feat/audit-ocr-engine

# ۳. انجام تغییرات و بررسی محلی
pnpm lint
pnpm typecheck
pnpm test

# ۴. ثبت کامیت با ساختار قراردادی
git add .
git commit -m "feat(audit): implement OCR parser for industrial electricity bills"

# ۵. ارسال تغییرات به مخزن
git push origin feat/audit-ocr-engine

# ۶. باز کردن Pull Request به مقصد dev
gh pr create --base dev --head feat/audit-ocr-engine --title "feat(audit): implement OCR parser for bills"
```

---

## ۶. چک‌لیست بررسی و ادغام Pull Request

پیش از تأیید و ادغام هر PR، موارد زیر بررسی می‌شوند:

- [ ] عنوان PR از فرمت Conventional Commits پیروی می‌کند.
- [ ] چک‌های خودکار CI (`QA Gate`) همگی سبز و موفق هستند.
- [ ] اسکن امنیتی (`Security Gate`) بدون خطا پاس شده است.
- [ ] هیچ فایل حساس نظیر `.env` یا کلیدهای API کامیت نشده است.
- [ ] بازبینی کد انجام شده و تمام ابهامات رفع گردیده است.
- [ ] روش ادغام در شاخه `dev` ترجیحاً **Squash and Merge** یا **Rebase and Merge** برای تمیز ماندن تاریخچه انتخاب شود.

---

## ۷. خطایابی و پرسش‌های متداول

### الف) چرا خطای `Push rejected by ruleset` دریافت می‌کنم؟
- **دلیل:** کامیت مستقیم به شاخه‌های `main` یا `dev` به دلیل قوانین Ruleset مسدود است.
- **راه‌حل:** تغییرات خود را روی یک شاخه کاری جدید (مانند `feat/...`) قرار داده و از طریق PR به `dev` ارسال کنید.

### ب) چگونه چک‌های CI را به صورت محلی تست کنم؟
```bash
# اجرای سریع تمامی اعتبارسنجی‌ها:
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

**شرکت زر نور نیرو یکتا** — تمامی حقوق محفوظ است.
