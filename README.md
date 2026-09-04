<<<<<<< HEAD
# zar — پلتفرم Xennic (شرکت زر نور نیرو یکتا)

**وضعیت فعلی:** فاز ۰ — مستندسازی، زیرساخت مخزن و راه‌اندازی گردش کار توسعه
**مالک:** شرکت زر نور نیرو یکتا (Zar Noor Niroo Yekta) — برند تجاری: **Xennic**

---

## 🌟 معرفی پروژه

**Xennic** پلتفرم جامع انرژی، مهندسی برق و هوش مصنوعی شرکت زر نور نیرو یکتا است که با تلفیق سه الگوی موفق جهانی (ممیزی هوشمند قبض، امکان‌سنجی خورشیدی و جعبه‌ابزار محاسبات مهندسی برق) طراحی شده است:

| # | ماژول | شرح کوتاه |
|:-:|:---|:---|
| ۱ | **فعالیت و تحلیل هوشمند قبض** (Smart Energy Audit) | OCR و استخراج خودکار داده از قبض برق، کشف خطاهای تعرفه‌ای، جریمه راکتیو و دیماند + توصیه‌های هوش مصنوعی |
| ۲ | **امکان‌سنجی نیروگاه خورشیدی** (Solar ROI & Feasibility) | محاسبه تابش منطقه‌ای، ظرفیت پیشنهادی، برآورد احداث و بازگشت سرمایه (ماده ۱۲ و ۱۶، بورس سبز) |
| ۳ | **جعبه‌ابزار محاسبات مهندسی برق** (Engineering Suite) | افت ولتاژ، سایزینگ کابل، بانک خازنی، ژنراتور مطابق IEC و نشریه ۱۱۰ + خروجی PDF رسمی |
| ۴ | **دانشنامه و مرجع قوانین برق** (Wiki) | مقررات ملی ساختمان (مبحث ۱۳)، نشریه ۱۱۰ و آیین‌نامه‌های توانیر |

معماری هدفمند: **NestJS + Prisma + PostgreSQL + Redis/BullMQ** (بک‌اند) و **Next.js + TailwindCSS + Shadcn/ui** (فرانت‌اند) — طبق سند `docs/پلتفرم زننیک/نوت ۳- معماری فنی، تک‌استک و ساختار API.md`.

---

## 📁 ساختار مخزن

```text
zar/
├── docs/                        # مستندات راهبردی و فنی (Obsidian-compatible)
│   ├── پلتفرم زننیک/            # نوت‌های ۱ تا ۵ + تحلیل عمیق رقبا
│   ├── assets/                  # تصاویر و منابع مستندات
│   ├── کتابچه تأسیس، هویت سازمانی و معماری شرکت...md
│   └── گزارش-بررسی-ریپوزیتوری-zar.md
├── .github/                     # قالب‌های PR/Issue و (در گام بعد) GitHub Actions
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

> پس از شروع فاز کدنویسی، ساختار مونورپو (`apps/` و `packages/`) طبق نوت ۳ به همین درخت اضافه می‌شود.

---

## 🌿 جریان کاری Git (خط‌مشی رسمی پروژه)

```text
main  ←──────── (فقط نسخه پایدار و تست‌شده) ──────────
 │                                                   ▲
 │               ┌── پس از QA نهایی ──┐                │
 │               │   PR: dev → main   │               │
 │               ▼                    │               │
dev  ←────── (شاخه یکپارچه‌سازی توسعه) ───────────────
 │
 ├── feature/*   → PR → dev
 ├── fix/*       → PR → dev
 └── docs/*      → PR → dev
```

### قوانین الزامی

1. **قبل از هر تغییر، ابتدا از شاخه والد به‌روزرسانی بگیرید:**
   ```bash
   git fetch origin
   git checkout dev && git pull origin dev
   git checkout -b feature/<نام-ویژگی> dev
   ```
2. **هیچ کامیت مستقیمی روی `main` و `dev` مجاز نیست؛ تمام تغییرات از طریق Pull Request وارد می‌شوند.**
3. پیام‌های کامیت قراردادی (Conventional Commits) — راهنمای کامل در `CONTRIBUTING.md`.
4. قبل از PR: به‌روزرسانی از `dev`، اجرای تست/بررسی، و اطمینان از نبود سکرت/فایل حساس.
5. انتقال به `main` فقط پس از تست نهایی، بازبینی و رفع خطاها؛ سپس برچسب نسخه (SemVer) و Release.

---

## 📚 مستندات کلیدی

| سند | توضیح |
|:---|:---|
| [docs/README.md](docs/README.md) | فهرست کامل مستندات پروژه |
| کتابچه تأسیس، هویت سازمانی و معماری شرکت | سند رسمی بنیان‌گذاری (۲۸ فصل) |
| نوت ۱ تا ۵ (پلتفرم زننیک) | تحلیل بازار، الگوی بومی، معماری فنی، لندینگ پیج و نقشه راه |
| گزارش بررسی ریپوزیتوری | مستند ممیزی اولیه مخزن و ریسک‌ها |

---

## 🗺️ نقشه راه (خلاصه — جزئیات در نوت ۵)

- **فاز ۰ (فعلی):** زیرساخت مخزن، شاخه‌بندی و امنیت
- **فاز ۱:** اسکلت مونورپو، Prisma Schema و لندینگ پیج سازمانی
- **فاز ۲:** پنل ممیزی قبض (OCR + AI)
- **فاز ۳:** پنل سولار و ابزارهای مهندسی
- **فاز ۴:** دانشنامه و AI Arena
- **فاز ۵:** پنل ادمین، درگاه پرداخت، ربات تلگرام و تجاری‌سازی

---

## 🔐 امنیت

- هرگز فایل `.env`، کلید API یا اطلاعات حساس را در مخزن کامیت نکنید؛ از **GitHub Secrets** و متغیرهای محیطی استفاده کنید.
- مخزن در حال حاضر **عمومی** است در حالی که اسناد آن با طبقه‌بندی «Internal Strategic Document» علامت‌خورده‌اند — مالک باید درباره عمومی‌بودن یا خصوصی‌سازی تصمیم صریح بگیرد.
- گزارش آسیب‌پذیری‌ها طبق [SECURITY.md](SECURITY.md).
- محافظت شاخه‌های `main` و `dev` (PR الزامی + بررسی + Status Checks) باید توسط Owner فعال شود — دستورالعمل در گزارش بررسی.

---

## ⚖️ مجوز

کلیه حقوق مادی و معنوی این مخزن و محتوای آن متعلق به **شرکت زر نور نیرو یکتا** است و بدون مجوز رسمی قابل استفاده، کپی یا انتشار نیست. (رجوع به [LICENSE](LICENSE))
=======
# Zar 🚀

> یک پروژه حرفه‌ای با استانداردهای بین‌المللی GitHub

---

## 📋 فهرست مطالب

- [درباره پروژه](#درباره-پروژه)
- [شروع سریع](#شروع-سریع)
- [ساختار پروژه](#ساختار-پروژه)
- [راهنمای مشارکت](#راهنمای-مشارکت)
- [استانداردهای کیفی](#استانداردهای-کیفی)
- [اقدامات امنیتی](#اقدامات-امنیتی)
- [مدیریت شاخه‌ها](#مدیریت-شاخه‌ها)
- [انتشار نسخه](#انتشار-نسخه)
- [تماس و پشتیبانی](#تماس-و-پشتیبانی)

---

## 📖 درباره پروژه

**Zar** یک پروژه متن‌باز است که بر اساس جدیدترین الگوریتم‌های GitHub و بهترین عملکردهای صنعتی توسعه‌یافته است.

### ✨ ویژگی‌های اصلی

- ✅ **حفاظت شاخه‌ها**: محافظت خودکار از شاخه‌های اصلی
- ✅ **CI/CD پیشرفته**: خط لوله خودکار برای تست و استقرار
- ✅ **اسکن امنیتی**: بررسی خودکار نقاط ضعف امنیتی
- ✅ **مدیریت وابستگی‌ها**: بروزرسانی خودکار با Dependabot
- ✅ **کنترل کیفیت**: تحلیل CodeQL و Coverage reporting
- ✅ **استانداردهای کمیت**: Conventional Commits و سیاست PR

---

## 🚀 شروع سریع

### پیش‌نیازها

- Node.js 18+ و npm 9+
- Git 2.30+
- دسترسی به مخزن

### تنظیم محیط توسعه

```bash
# کلون کردن مخزن
git clone https://github.com/feerozmandi/zar.git
cd zar

# اضافه کردن upstream remote برای هم‌زمان‌سازی
git remote add upstream https://github.com/feerozmandi/zar.git

# نصب وابستگی‌ها
npm install

# ایجاد شاخه ویژگی جدید
git checkout -b feat/your-feature-name
```

### اجرای محلی

```bash
# اجرای تست‌ها
npm test

# بررسی کد (linting)
npm run lint

# اصلاح خودکار مسائل linting
npm run lint:fix

# ساخت پروژه
npm run build

# بررسی coverage
npm run coverage
```

---

## 📁 ساختار پروژه

```
zar/
├── .github/
│   ├── CODEOWNERS              # تعیین افراد مسئول بررسی
│   ├── PULL_REQUEST_TEMPLATE.md # قالب توضیحات PR
│   ├── dependabot.yml          # تنظیمات بروزرسانی خودکار
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md       # الگو برای گزارش باگ
│   │   ├── feature_request.md  # الگو برای درخواست ویژگی
│   │   └── config.yml          # تنظیمات الگو
│   └── workflows/
│       ├── ci.yml              # خط لوله تست و کیفیت
│       ├── security.yml        # اسکن امنیتی
│       └── release.yml         # انتشار خودکار
├── docs/                        # فایل‌های مستندات
├── CONTRIBUTING.md             # راهنمای مشارکت
├── CODE_OF_CONDUCT.md          # قواعد رفتاری
└── README.md                   # این فایل
```

---

## 👥 راهنمای مشارکت

### سیاست شاخه‌ها

ما از **Gitflow Workflow** پیروی می‌کنیم:

| شاخه | هدف | تضمین |
|------|-----|-------|
| `main` | کد آماده برای تولید | نسخه‌های پایدار |
| `dev` | توسعه جاری | تست‌های موفق |
| `feat/*` | ویژگی‌های جدید | بررسی ضروری |
| `fix/*` | تعمیرات باگ | تست‌های رگرسیون |
| `chore/*` | کارهای نگهداری | CI/CD موفق |

### نام‌گذاری شاخه‌ها

```
feat/feature-name       # ویژگی جدید
fix/issue-description   # تعمیر باگ
docs/topic              # بروزرسانی مستندات
test/functionality      # اضافه کردن تست
chore/task             # کارهای نگهداری
refactor/component     # بازسازی کد
perf/optimization      # بهبود عملکرد
```

### فرآیند مشارکت

```bash
# 1. ایجاد شاخه از dev
git checkout -b feat/my-feature

# 2. تغییر کدها و تست
npm test && npm run lint

# 3. commit با Conventional Commits
git commit -m "feat(scope): description"

# 4. پوش به fork شخصی
git push origin feat/my-feature

# 5. ایجاد Pull Request
# → از قالب فراهم‌شده استفاده کنید
# → توضیح روشن درباره تغییرات
# → لینک کردن به issue‌های مرتبط
```

### پیام Commit

```
<type>(<scope>): <subject>

<body>

<footer>
```

**انواع معتبر:**
- `feat`: ویژگی جدید
- `fix`: تعمیر باگ
- `docs`: بروزرسانی مستندات
- `test`: اضافه کردن/بروزرسانی تست
- `chore`: تغییرات ابزار یا وابستگی
- `refactor`: بازسازی کد بدون تغییر عملکرد
- `perf`: بهبود عملکرد
- `ci`: تغییرات CI/CD

**مثال:**
```
feat(auth): add two-factor authentication

Added support for TOTP-based 2FA with backup codes.
Includes security improvements and recovery procedures.

Closes #123
Related-To: #456
```

---

## ✅ استانداردهای کیفی

### الزامات PR برای شاخه `main`

✅ **الزامی:**
- تمام تست‌ها موفق باشند
- Coverage > 80%
- بررسی کد توسط حداقل 1 نفر
- CI/CD تمام چک‌ها را پاس کند
- شاخه بروز با `main` باشد
- کامیت‌ها Conventional Commits را رعایت کنند

✅ **توصیه‌شده:**
- Signed commits
- بررسی‌های اضافی از متخصصین
- مستندات به‌روز شده

### الزامات PR برای شاخه `dev`

✅ **الزامی:**
- تست‌های اساسی موفق
- یک بررسی کد
- CI/CD پیش‌نیازی موفق

✅ **فعالیت‌های خودکار:**
- Auto-merge پس از تأیید
- حذف شاخه بعد از merge

### درجه بندی کیفیت

```
A: Coverage > 90%, بدون هیچ هشدار
B: Coverage 80-90%, هشدارهای جزئی
C: Coverage 70-80%, نیاز به بهبودی
D: Coverage < 70%, ممنوع برای merge
```

---

## 🔐 اقدامات امنیتی

### فعال‌شده در پروژه

- 🛡️ **CodeQL Analysis**: تحلیل خودکار کدهای ضعیف
- 🔍 **Dependency Scanning**: بررسی وابستگی‌های ناامن
- 📦 **npm Audit**: بررسی بسته‌های NPM
- 🤖 **Dependabot**: بروزرسانی خودکار وابستگی‌ها
- 🔐 **Secret Scanning**: بررسی افشای اسرار

### سیاست امنیت

```
❌ ممنوع:
- فایل‌های .env و credentials
- کلیدهای API و توکن‌ها
- اطلاعات شخصی یا حساس
- کدهای هارڈ‌کد شده

✅ مجاز:
- متغیرهای محیط‌ی (.env.example)
- نمونه‌های داده (samples/)
- توثیق‌های نقاب‌گذاری‌شده
```

### گزارش آسیب‌پذیری

برای گزارش مسائل امنیتی:
```
⚠️ لطفا از طریق GitHub Security Advisory گزارش دهید
https://github.com/feerozmandi/zar/security/advisories
```

**پیام‌رسانی درمورد:**
1. درخواست‌های تغییر امنیتی (GHSA)
2. نقاط ضعیف اطلاعات شناخت‌شده
3. استراتژی خفقان‌سازی

---

## 🌿 مدیریت شاخه‌ها

### قوانین حفاظت شاخه

#### شاخه `main` 🛡️ (تولید)

```yaml
اشتراط‌های Merge:
  • Require pull request reviews: بلی (حداقل 1)
  • Require status checks to pass: بلی (تمام)
  • Require branches to be up to date: بلی
  • Require commit signoff: توصیه‌شده
  • Restrict who can push: مدیران فقط
  • Include administrators: بلی

تنظیمات Merge:
  • Allow squash merging: بلی
  • Default squash commit message: PR title + body
  • Delete branch on merge: خودکار
```

#### شاخه `dev` 🔄 (توسعه)

```yaml
اشتراط‌های Merge:
  • Require pull request reviews: بلی (حداقل 1)
  • Require status checks to pass: بلی
  • Allow auto-merge: بلی
  • Delete branch on merge: خودکار
  • Require up to date: اختیاری
```

### فرآیند Merge

```
1. PR ایجاد شود
   ↓
2. Automated Tests اجرا شوند
   ↓
3. Code Review توسط حداقل 1 نفر
   ↓
4. Approval و Merge
   ↓
5. تمام Workflows اجرا شوند
   ↓
6. نسخه جدید بروزرسانی شود
```

---

## 📦 انتشار نسخه

### Semantic Versioning

ما از [Semantic Versioning](https://semver.org) پیروی می‌کنیم:

```
MAJOR.MINOR.PATCH
v1.2.3
│  │  │
│  │  └── Patch: Bug fixes (v1.2.3 → v1.2.4)
│  └────── Minor: New features (v1.2.0 → v1.3.0)
└───────── Major: Breaking changes (v1.0.0 → v2.0.0)
```

### انتشار خودکار

```bash
# ایجاد tag برای انتشار
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Workflow `release.yml` خودکار:
# 1. Checkout کد
# 2. اجرای تست‌ها
# 3. ساخت artifact
# 4. ایجاد GitHub Release
# 5. انتشار Package
```

### نسخه‌های Prerelease

```bash
# Alpha
git tag v1.0.0-alpha.1

# Beta
git tag v1.0.0-beta.1

# Release Candidate
git tag v1.0.0-rc.1
```

---

## 🔄 Workflows و خودکارسازی

### CI Pipeline (`ci.yml`)

**موارد اجرا:**
- ✅ هر push به `main` یا `dev`
- ✅ هر PR به `main` یا `dev`

**مراحل:**
1. Checkout کد
2. Setup محیط
3. نصب وابستگی‌ها
4. Linting
5. Unit Tests
6. Coverage Analysis
7. گزارش نتایج

### Security Scanning (`security.yml`)

**پیش‌نیازها:**
- CodeQL Analysis
- npm Audit
- Dependency Check
- Secret Scanning

**جدول زمان:**
- هفتگی (هر دوشنبه ساعت 2 شب)

### Release Workflow (`release.yml`)

**موارد اجرا:**
- ✅ زمانی که tag `v*.*.*` ایجاد شود

**خروجی:**
- GitHub Release
- Release Notes
- Artifacts

---

## 📊 Dependabot

### بروزرسانی خودکار

```yaml
تنظیمات:
  • npm dependencies: هفتگی (دوشنبه)
  • GitHub Actions: هفتگی (دوشنبه)
  • Open PRs limit: 5
  • Auto-merge: برای minor/patch

دسته‌بندی:
  • dependencies: وابستگی‌های عادی
  • github-actions: اکشن‌های کاری
```

### بررسی و Merge

```bash
# Dependabot PRها:
# 1. Automated تست اجرا شوند
# 2. اگر تمام چک‌ها موفق باشند
# 3. Squash merge با commit message استاندارد
# 4. خودکا�� delete branch
```

---

## 📞 تماس و پشتیبانی

### آدرس‌های اساسی

| مورد | لینک |
|------|------|
| 🐛 گزارش باگ | [Issues](https://github.com/feerozmandi/zar/issues/new?template=bug_report.md) |
| ✨ درخواست ویژگی | [Discussions](https://github.com/feerozmandi/zar/discussions) |
| 📖 مستندات | [Wiki](https://github.com/feerozmandi/zar/wiki) |
| 💬 بحث‌های عمومی | [Discussions](https://github.com/feerozmandi/zar/discussions) |
| 🛡️ مسائل امنیتی | [Security Advisory](https://github.com/feerozmandi/zar/security/advisories/new) |

### راهنمای مشارکت

مطالعه: [CONTRIBUTING.md](CONTRIBUTING.md)

### قوانین رفتاری

مطالعه: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

---

## 🏆 بهترین عملکردها

### برای توسعه‌دهندگان

- ✅ شاخه‌های کوچک و فوکوس شده
- ✅ تست‌های مناسب برای هر تغیی
- ✅ کامیت‌های منطقی و واضح
- ✅ مستندات به‌روز شده
- ✅ لینک کردن issue‌های مرتبط

### برای Reviewer ها

- ✅ بررسی نسبتاً سریع (24-48 ساعت)
- ✅ کامنت‌های بناء و دوستانه
- ✅ تأیید واضح یا درخواست تغییر
- ✅ تصمیم در مورد conflict‌ها

### برای تیم

- ✅ بازگذاری منظم وابستگی‌ها
- ✅ مرور security alerts
- ✅ بروزرسانی مستندات
- ✅ کنترل release‌ها

---

## 📈 معیارهای موفقیت

```
Coverage:          ████████░░ 80%+ ✅
Tests:             ████████░░ 85%+ ✅
Code Quality:      ████████░░ A-Grade ✅
Security:          ██████████ 0 Critical ✅
Response Time:     ███████░░░ < 48h ✅
Automation:        ████████░░ 90%+ ✅
```

---

## 📜 لایسنس

این پروژه تحت لایسنس [MIT](LICENSE) منتشر شده است.

---

## 🙏 تشکر

متشکریم از تمام مشارکین و کسانی که به بهبود این پروژه کمک می‌کنند! 🎉

---

## 📅 تاریخچه نسخه‌ها

برای دیدن تغییرات اخیر: [Releases](https://github.com/feerozmandi/zar/releases)

---

**آخرین بروزرسانی:** 2026-09-04

**وضعیت:** ✅ فعال و در حال توسعه

**Maintainer:** [@feerozmandi](https://github.com/feerozmandi)
>>>>>>> origin/dev
