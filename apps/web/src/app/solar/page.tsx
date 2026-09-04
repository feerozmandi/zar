import React from 'react';
import { SolarEstimator } from '../../components/SolarEstimator';
import { Sun, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';

export default function SolarPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/30">
          <Sun className="w-3.5 h-3.5" />
          <span>امکان‌سنجی نیروگاه‌های تجدیدپذیر</span>
        </div>
        <h1 className="text-3xl font-black text-white">طرح توجیهی و برآورد مالی نیروگاه خورشیدی</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          محاسبه ظرفیت احداث، بازگشت سرمایه و ارزیابی قوانین حمایتی ماده ۱۲ قانون رفع موانع تولید، ماده ۱۶ قانون جهش دانش‌بنیان و عرضه در بورس سبز انرژی.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SolarEstimator />
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              قوانین الزام‌آور ماده ۱۶ صنایع
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              بر اساس ماده ۱۶، صنایع موظفند ۵٪ از مصرف برق خود را از طریق نیروگاه خورشیدی تأمین کنند. احداث نیروگاه با بازگشت سرمایه کمتر از ۲.۵ سال، علاوه بر رفع جرایم سنگین قطعی برق تابستان، ارزش‌آفرینی پایدار ایجاد می‌نماید.
            </p>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>عدم قطع برق در اوج بار تابستان برای صنایع خودتأمین</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>امکان فروش مازاد تولید در تابلوی سبز بورس انرژی</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
