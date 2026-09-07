-- تنظیمات اولیه‌ی PostgreSQL برای پلتفرم Xennic
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- جستجوی متنی دانشنامه (ILIKE سریع)
CREATE EXTENSION IF NOT EXISTS unaccent;  -- جستجوی فارسی/عربی بدون حساسیت به اعراب
ALTER DATABASE xennic SET timezone TO 'UTC';
