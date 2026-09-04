import React from 'react';
import { BookOpen, Search, FileText, ChevronLeft, Sparkles } from 'lucide-react';

export default function WikiPage() {
  const articles = [
    {
      title: 'مبحث ۱۳ مقررات ملی ساختمان - الزامات سایزینگ کابل و افت ولتاژ',
      category: 'مقررات ملی ساختمان',
      summary: 'بررسی ضوابط انتخاب سطح مقطع هادی‌ها بر اساس جریان مجاز، ضرایب اصلاح دمایی و افت ولتاژ حداکثر.',
      tag: 'مبحث ۱۳',
    },
    {
      title: 'ماده ۱۶ قانون جهش تولید دانش‌بنیان - تعهدات ۵ درصدی صنایع خورشیدی',
      category: 'قوانین و آیین‌نامه‌ها',
      summary: 'الزام صنایع با مصرف بالای یک مگاوات در احداث نیروگاه تجدیدپذیر و تبعات مالی عدم تمکین در اوج بار.',
      tag: 'ماده ۱۶',
    },
    {
      title: 'نشریه ۱۱۰ - مشخصات فنی عمومی و اجرایی تابلوهای برق صنعتی',
      category: 'نشریه ۱۱۰',
      summary: 'استانداردهای حفاظت تابلوها (IP)، شینه‌کشی مسی، شین‌های حفاظتی ارت و نول و تجهیزات قطع‌کننده.',
      tag: 'نشریه ۱۱۰',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/30">
          <BookOpen className="w-3.5 h-3.5" />
          <span>دانشنامه تخصصی و آیین‌نامه‌های مهندسی برق</span>
        </div>
        <h1 className="text-3xl font-black text-white">دانشنامه استانداردها و مقررات ملی</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          بانک مرجع مقررات ملی ساختمان (مبحث سیزدهم)، نشریه ۱۱۰، استانداردهای بین‌المللی IEC و آیین‌نامه‌های اجرایی توانیر و ساتبا.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl">
        <input
          type="text"
          placeholder="جستجو در متن قوانین، ضرایب کابل، فرمول‌ها یا ماده‌های قانونی..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
        />
        <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
      </div>

      {/* Articles List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((art, idx) => (
          <div
            key={idx}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                {art.category}
              </span>
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                {art.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {art.summary}
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
              <span className="font-mono">مرجع رسمی</span>
              <span className="text-amber-400 flex items-center gap-1 font-bold group-hover:translate-x-[-4px] transition-transform">
                مطالعه کامل <ChevronLeft className="w-4 h-4" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
