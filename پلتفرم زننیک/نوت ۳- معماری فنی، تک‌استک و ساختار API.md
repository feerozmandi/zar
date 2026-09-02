# 📄 Note 03: Platform Architecture, Tech Stack & API Design

**Company:** Zar Noor Niroo Yekta

**Project:** Xennic Energy Tech & Consulting Platform

**Document Type:** Technical Blueprint & Modular Infrastructure Specification

## 🏗️ ۱. معماری کلی سیستم (Modular Headless & Multi-Workspace Architecture)

معماری پلتفرم **Xennic** بر پایه جداکنندگی کامل هسته مرکزی (Headless API Layer) از لایه نمایش و پنل‌های مستقل کاری (Isolated Workspaces) استوار است. لندینگ پیج سازمانی، پنل‌های کاربری اختصاصی، دانشنامه، و ربات تلگرام/اپلیکیشن‌ها همگی از طریق API یکپارچه با بک‌اند NestJS در ارتباط هستند.

```
                                  ┌─────────────────────────────────────────┐
                                  │      Xennic Modern Minimal Landing      │
                                  └────────────────────┬────────────────────┘
                                                       │
               ┌───────────────────────┬───────────────┴───────┬───────────────────────┐
               ▼                       ▼                       ▼                       ▼
    ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
    │  Smart Audit Panel  │ │   Solar ROI Panel   │ │ Engineering Panel   │ │ Knowledge Base Wiki │
    │  (Auth / Payment)   │ │  (Auth / Payment)   │ │  (Auth / Payment)   │ │  (Standards/Rules)  │
    └──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘
               │                       │                       │                       │
               └───────────────────────┴───────────────┬───────┴───────────────────────┘
                                                       ▼
                                  ┌─────────────────────────────────────────┐
                                  │       Unified Auth & Billing Layer      │
                                  └────────────────────┬────────────────────┘
                                                       │
                                  ┌────────────────────┴────────────────────┐
                                  ▼                                         ▼
                   ┌─────────────────────────────┐           ┌─────────────────────────────┐
                   │    Multi-Model AI Gateway   │           │    Xennic Super Admin Panel │
                   │ (GitHub Models / Pro BYOK)  │           │   (RBAC / Analytics / CMS)  │
                   └──────────────┬──────────────┘           └──────────────┬──────────────┘
                                  │                                         │
                                  └────────────────────┬────────────────────┘
                                                       ▼
                                  ┌─────────────────────────────────────────┐
                                  │       NestJS Core API Gateway           │
                                  └────────────────────┬────────────────────┘
                                                       ▼
                                  ┌─────────────────────────────────────────┐
                                  │       Prisma ORM & PostgreSQL DB        │
                                  └─────────────────────────────────────────┘
```

## 🛠️ ۲. انتخاب تکنولوژی‌ها (Tech Stack)

### الف) بک‌اند و خدمات پایه (Back-End API)

- **NestJS (Node.js + TypeScript):** معماری مدولار، شیءگرا (OOP)، و پیاده‌سازی سرویس‌ها به صورت ایزوله.
    
- **Prisma ORM:** مدیریت ساده، سریع و تایپ‌سایف (Type-Safe) پایگاه داده.
    
- **PostgreSQL:** دیتابیس اصلی جهت ذخیره‌سازی داده‌های کاربران، قبض‌ها، محاسبات مهندسی، محتوای دانشنامه و کلیدهای رمزنگاری‌شده.
    
- **Redis + BullMQ:** مدیریت صف پردازش‌های سنگین (OCR، پردازش هوش مصنوعی و صدور فایل‌های PDF).
    

### ب) فرانت‌اند و لایه کاربری (Front-End & Workspaces)

- **Next.js (App Router):** رندرینگ ترکیبی (SSR/SSG/ISR) جهت دستیابی به سئوی فوق‌العاده در بخش لندینگ و دانشنامه، و عملکرد SPA در پنل‌ها.
    
- **TailwindCSS + Shadcn/ui:** استایل‌دهی مدرن، مینیمال و واکنش‌گرا بر اساس هویت بصری سازمانی شرکت زر نور نیرو یکتا.
    
- **Zustand / React Query:** مدیریت وضعیت احراز هویت، داده‌های هر پنل و کش‌سازی درخواست‌ها.
    

### ج) هوش مصنوعی و پردازش اسناد (AI & Processing Gateway)

- **Tesseract / Python OCR Microservice:** استخراج متن و داده از تصاویر و فایل‌های PDF قبوض.
    
- **Multi-Model AI Gateway:**
    
    - **System Level:** اتصال به **GitHub Models API** جهت ارائه تحلیل‌های پایه و رایگان.
        
    - **Pro Level (BYOK):** امکان وارد کردن کلید اختصاصی (OpenAI, Anthropic, Gemini) توسط کاربر با رمزنگاری **AES-256**.
        

## 📂 ۳. ساختار صفحات و دایرکتوری‌های پروژه (Frontend Routing)

تفکیک پنل‌ها در فرانت‌اند با استفاده از ساختار App Router در Next.js به شکل زیر سازماندهی می‌شود:

```
app/
├── (marketing)/
│   ├── page.tsx                 # لندینگ پیج اصلی و سازمانی Xennic
│   ├── about/                   # درباره شرکت زر نور نیرو یکتا
│   └── contact/                 # ارتباط با ما و درخواست مشاوره
├── (auth)/
│   ├── login/                   # ورود یکپارچه به پلتفرم (SSO)
│   └── register/                # ثبت‌نام کاربران
├── audit/                       # پنل اختصاصی ممیزی و تحلیل قبض
│   ├── page.tsx
│   ├── upload/
│   └── analytics/
├── solar/                       # پنل اختصاصی امکان‌سنجی نیروگاه خورشیدی
│   ├── page.tsx
│   ├── map/
│   └── feasibility-report/
├── engineering/                 # پنل اختصاصی جعبه‌ابزار محاسبات مهندسی
│   ├── cable-sizing/
│   ├── voltage-drop/
│   ├── capacitor-bank/
│   └── generator-size/
├── wiki/                        # دانشنامه، مقررات ملی و استانداردهای برق
│   ├── page.tsx
│   └── [slug]/
├── ai/                    # ماژول انتخاب و مقایسه مدل‌های هوش مصنوعی
└── admin/                       # پنل مدیریت ارشد پلتفرم
    ├── users/
    ├── audit-logs/
    ├── wiki-cms/
    └── revenue/
```

## 🔗 ۴. ساختار APIهای مدولار (RESTful Endpoints)

تمامی سرویس‌های سیستم به صورت APIهای تفکیک‌شده و استاندارد پیاده‌سازی می‌شوند:

### 🔑 احراز هویت و مدیریت کاربران (Auth & User API)

- `POST /api/v1/auth/register` -> ثبت‌نام کاربر جدید
    
- `POST /api/v1/auth/login` -> ورود و دریافت JWT Token
    
- `GET /api/v1/user/profile` -> دریافت اطلاعات پروفایل و کیف‌پول ماژول‌ها
    
- `POST /api/v1/user/ai-settings` -> ذخیره کلید اختصاصی API Key کاربر (BYOK)
    

### 📄 ماژول ممیزی و تحلیل قبض (Smart Audit API)

- `POST /api/v1/audit/upload` -> آپلود فایل/تصویر قبض
    
- `POST /api/v1/audit/analyze` -> استخراج داده با OCR و تحلیل جریمه راکتیو/دیماند
    
- `GET /api/v1/audit/history` -> آرشیو قبوض و گزارش‌های قبلی
    

### ☀️ ماژول امکان‌سنجی خورشیدی (Solar Feasibility API)

- `POST /api/v1/solar/assess` -> محاسبه پتانسیل تابش و ظرفیت پیشنهادی
    
- `POST /api/v1/solar/roi-calculator` -> محاسبه مالی بازگشت سرمایه (ماده ۱۲ و ۱۶)
    
- `POST /api/v1/solar/epc-request` -> ثبت درخواست ارجاع پروژه به مجریان EPC
    

### ⚡ ماژول جعبه‌ابزار مهندسی (Engineering Tools API)

- `POST /api/v1/engineering/cable-sizing` -> محاسبه سایز کابل و افت ولتاژ (IEC)
    
- `POST /api/v1/engineering/capacitor-bank` -> محاسبه ظرفیت بانک خازنی
    
- `POST /api/v1/engineering/export-pdf` -> صدور دفترچه محاسبات رسمی قابل چاپ
    

### 📚 ماژول دانشنامه و مرجع مهندسی (Wiki & Knowledge Base API)

- `GET /api/v1/wiki/articles` -> لیست مقالات و استانداردهای مهندسی
    
- `GET /api/v1/wiki/search?q=...` -> جستجوی هوشمند در قوانین و آیین‌نامه‌ها
    
- `POST /api/v1/wiki/ask-ai` -> پرسش و پاسخ تخصصی مبتنی بر AI روی قوانین
    

### 🧠 ماژول هوش مصنوعی و مقایسه مدل‌ها (AI Gateway API)

- `POST /api/v1/ai/generate` -> ارسال پرامپت به مدل انتخاب‌شده (GitHub Models یا کلید کاربر)
    
- `GET /api/v1/ai/models` -> لیست مدل‌های فعال (`gpt-4o`, `claude-3-5-sonnet`, `llama-3.3-70b`)
    

### 👑 پنل مدیریت ارشد (Super Admin API)

- `GET /api/v1/admin/dashboard` -> آمار کلی کاربران، تراکنش‌ها و لود سرور
    
- `POST /api/v1/admin/wiki` -> ایجاد و ویرایش اسناد دانشنامه
    
- `GET /api/v1/admin/transactions` -> مدیریت پرداختی‌ها به تفکیک ماژول‌ها
    

## 🔒 ۵. امنیت و حریم خصوصی (Security & BYOK)

1. **رمزنگاری کلیدهای اختصاصی:** کلیدهای API وارد شده توسط کاربران حرفه‌ای، پیش از ذخیره در دیتابیس با کلید سرور و الگوریتم **AES-256-GCM** رمزنگاری می‌شوند.
    
2. **جداسازی داد‌ه‌ها:** داده‌های هر پنل مجزا نگهداری شده و پردازش‌های AI تنها به پروایدر انتخابی کاربر ارسال می‌گردد.
    
3. **کنترل سطح دسترسی (RBAC):** نقش‌های دسترسی شامل `USER` (کاربر عادی)، `PRO_ENGINEER` (مهندس/مشاور)، `EPC_PARTNER` (پیمانکار خورشیدی) و `SUPER_ADMIN` تعریف می‌شوند.

[[نوت ۲- الگوبرداری و مدل بومی‌سازی‌شده Xennic]]
[[نوت ۴- ساختار و محتوای لندینگ پیج اصلی Xennic]]
