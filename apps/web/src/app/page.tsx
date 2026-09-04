import React from 'react';
import Link from 'next/link';
import {
  Zap,
  Sun,
  Calculator,
  BookOpen,
  Bot,
  ShieldCheck,
  TrendingDown,
  Layers,
  ArrowLeft,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { AuditCalculator } from '../components/AuditCalculator';
import { SolarEstimator } from '../components/SolarEstimator';
import { CableCalculator } from '../components/CableCalculator';

export default function HomePage() {
  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 pb-6 text-center space-y-8 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-inner">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>هوش مصنوعی و مهندسی انرژی نسل نوین شرکت زر نور نیرو یکتا</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-snug">
          تحول دیجیتال در{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
            مدیریت انرژی و مهندسی برق
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          <strong>زننیک (Xennic)</strong> پلتفرم پیشرفته ممیزی هوشمند قبوض صنعتی، برآورد اقتصادی نیروگاه‌های خورشیدی (ماده ۱۲ و ۱۶) و جعبه‌ابزار محاسبات مهندسی برق IEC بر پایه هوش مصنوعی است.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/audit"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            شروع ممیزی هوشمند قبض
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            href="/solar"
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-500/50 font-bold text-sm active:scale-95 transition-all flex items-center gap-2"
          >
            <Sun className="w-4 h-4 text-amber-400" />
            امکان‌سنجی خورشیدی
          </Link>
        </div>
      </section>

      {/* Interactive Core Modules Grid */}
      <section className="container mx-auto px-4 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            ماژول‌های تخصصی پلتفرم زننیک
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            ابزارهای مهندسی و محاسباتی یکپارچه بر مبنای آخرین آیین‌نامه‌ها و قوانین توانیر
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                ممیزی و کشف جرایم قبوض
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                استخراج اطلاعات قبوض برق با OCR، تحلیل جریمه راکتیو، جریمه تجاوز از دیماند و تخمین ظرفیت بانک خازنی.
              </p>
            </div>
            <Link
              href="/audit"
              className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:underline"
            >
              ورود به کارپوشه ممیزی <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sun className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                امکان‌سنجی نیروگاه‌های خورشیدی
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                برآورد تابش خورشیدی استانی، محاسبه دوره بازگشت سرمایه، پوشش الزامات ماده ۱۶ صنایع و تابلوی سبز بورس انرژی.
              </p>
            </div>
            <Link
              href="/solar"
              className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:underline"
            >
              ورود به کارپوشه خورشیدی <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                جعبه‌ابزار مهندسی برق IEC
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                سایزینگ کابل، افت ولتاژ، محاسبات بانک خازنی و ژنراتور طبق استانداردهای IEC 60364 و نشریه ۱۱۰.
              </p>
            </div>
            <Link
              href="/engineering"
              className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:underline"
            >
              ورود به جعبه‌ابزار مهندسی <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Live Interactive Widget Showcase */}
      <section className="container mx-auto px-4 space-y-12">
        <div className="text-center space-y-2">
          <div className="inline-block text-xs font-bold text-amber-400 uppercase tracking-wider">
            پیش‌نمایش زنده ابزارهای تعاملی
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            آزمون آنلاین ابزارهای محاسباتی پلتفرم
          </h2>
        </div>

        <div className="space-y-8">
          <AuditCalculator />
          <SolarEstimator />
          <CableCalculator />
        </div>
      </section>

      {/* Architecture & Trust Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                معماری سازمانی و امنیت کدهای صنعتی
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                طراحی‌شده برای مهندسان، صنایع و شرکت‌های EPC انرژی
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>پشتیبانی کامل از کلیدهای اختصاصی BYOK با رمزنگاری پیشرفته <strong>AES-256-GCM</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>درگاه هوش مصنوعی چندمدلی (GitHub Models, GPT-4o, Claude 3.5, Gemini 1.5)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>معماری ماژولار و میکروسرویسی با NestJS Core Gateway و Next.js 14</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="text-xs font-bold text-slate-400">شناسنامه محصول</div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">مالک حقوقی:</span>
                  <span className="text-white">شرکت سهامی خاص زر نور نیرو یکتا</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">معماری:</span>
                  <span className="text-amber-400">Turborepo + pnpm Monorepo</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">دروازه‌های کیفیت:</span>
                  <span className="text-emerald-400">5 QA Quality Gates Active</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">وضعیت سامانه:</span>
                  <span className="text-cyan-400">عملیاتی (v1.0.0)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
