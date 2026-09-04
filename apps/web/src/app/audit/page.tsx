import React from 'react';
import { AuditCalculator } from '../../components/AuditCalculator';
import { Zap, FileSpreadsheet, UploadCloud, ShieldCheck } from 'lucide-react';

export default function AuditPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/30">
          <Zap className="w-3.5 h-3.5" />
          <span>کارپوشه هوشمند تحلیل و ممیزی انرژی</span>
        </div>
        <h1 className="text-3xl font-black text-white">ممیزی هوشمند قبوض برق صنعتی</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          شناسایی خطاهای صدور، محاسبه دقیق جریمه توان راکتیو، هزینه‌های تجاوز از قدرت دیماند و ارائه سناریوهای کاهش بهای برق.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AuditCalculator />
        </div>

        {/* Upload Zone & OCR Simulation */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-amber-400" />
              آپلود فایل قبض (PDF / تصویر)
            </h3>
            <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-8 text-center space-y-3 transition-colors cursor-pointer bg-slate-950/50">
              <FileSpreadsheet className="w-10 h-10 text-slate-500 mx-auto" />
              <div className="text-xs text-slate-300">
                فایل قبض برق را اینجا بکشید یا برای انتخاب کلیک کنید
              </div>
              <div className="text-[10px] text-slate-500">
                فرمت‌های مجاز: PDF, JPG, PNG (حداکثر ۱۵ مگابایت)
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>استخراج خودکار داده‌ها توسط موتور OCR اختصاصی</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>حفظ محرمانگی کامل اطلاعات صورت‌حساب شرکت</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
