import React from 'react';
import { Zap, ShieldCheck, Target, Award, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 space-y-12 max-w-4xl">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/30">
          <Zap className="w-3.5 h-3.5" />
          <span>هویت و رسالت سازمانی</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          درباره شرکت سهامی خاص زر نور نیرو یکتا و پلتفرم زننیک
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          تلفیق دانش تخصصی مهندسی برق قدرت، انرژی‌های تجدیدپذیر و فناوری‌های پیشرفته هوش مصنوعی جهت بهینه‌سازی مصرف انرژی در صنایع ایران.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">چشم‌انداز ما</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            تبدیل شدن به معتبرترین مرجع هوشمند محاسبات مهندسی برق، ممیزی انرژی و سرمایه‌گذاری نیروگاه‌های خورشیدی در سطح کشور و منطقه.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">ارزش‌های محوری</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            دقت مهندسی منطبق بر استانداردهای بین‌المللی IEC، شفافیت کامل مالی در برآورد هزینه‌ها و صیانت از محرمانگی اطلاعات صنایع.
          </p>
        </div>
      </div>
    </div>
  );
}
