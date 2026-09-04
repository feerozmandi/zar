import React from 'react';
import { CableCalculator } from '../../components/CableCalculator';
import { Calculator, Award, Sliders, Cpu } from 'lucide-react';

export default function EngineeringPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/30">
          <Calculator className="w-3.5 h-3.5" />
          <span>جعبه‌ابزار محاسبات تخصصی مهندسی برق</span>
        </div>
        <h1 className="text-3xl font-black text-white">محاسبات مهندسی فشار ضعیف و متوسط</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          طراحی و سایزینگ کابل‌های صنعتی بر اساس استاندارد IEC 60364-5-52، نشریه ۱۱۰ و آیین‌نامه‌های وزارت نیرو.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CableCalculator />
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              استانداردهای مرجع سیستم
            </h3>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="font-bold text-slate-200">IEC 60364:</span> الزامات تأسیسات الکتریکی و ظرفیت حرارتی هادی‌ها
              </li>
              <li className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="font-bold text-slate-200">نشریه ۱۱۰:</span> مشخصات فنی عمومی و اجرایی تأسیسات برقی کشور
              </li>
              <li className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="font-bold text-slate-200">مبحث ۱۳ مقررات ملی:</span> رعایت حداکثر افت ولتاژ مجاز (۳٪ روشنایی، ۵٪ موتوری)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
