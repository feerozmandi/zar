import React from 'react';
import Link from 'next/link';
import { Zap, ShieldCheck, Cpu, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-sm mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Company Bio */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 text-white font-black text-lg">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950">
                <Zap className="w-5 h-5 fill-slate-950" />
              </div>
              <span>پلتفرم زننیک (Xennic)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              سامانه جامع مهندسی انرژی، ممیزی هوشمند قبوض صنعتی، امکان‌سنجی نیروگاه‌های خورشیدی و هوش مصنوعی شرکت سهامی خاص زر نور نیرو یکتا.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200">دسترسی سریع</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/audit" className="hover:text-amber-400 transition-colors">
                  ممیزی و تحلیل قبض برق
                </Link>
              </li>
              <li>
                <Link href="/solar" className="hover:text-amber-400 transition-colors">
                  امکان‌سنجی خورشیدی (ماده ۱۲ و ۱۶)
                </Link>
              </li>
              <li>
                <Link href="/engineering" className="hover:text-amber-400 transition-colors">
                  محاسبه سایز کابل و افت ولتاژ IEC
                </Link>
              </li>
              <li>
                <Link href="/wiki" className="hover:text-amber-400 transition-colors">
                  مقررات ملی ساختمان (مبحث ۱۳)
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Security */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200">استانداردها و امنیت</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>رمزنگاری AES-256-GCM برای کلیدهای BYOK</span>
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
                <span>انطباق با استانداردهای توانیر و IEC 60364</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>دروازه‌های ۵‌گانه کیفیت نرم‌افزاری (QA Gates)</span>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-slate-200">ارتباط با شرکت</h4>
            <p className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>تهران، شرکت سهامی خاص زر نور نیرو یکتا</span>
            </p>
            <p className="flex items-center gap-2 text-slate-400">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>info@xennic.ir</span>
            </p>
            <p className="flex items-center gap-2 text-slate-400">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>پشتیبانی مهندسی و مشاوره صنعتی</span>
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© ۲۰۲۶ تمامی حقوق مادی و معنوی متعلق به شرکت سهامی خاص زر نور نیرو یکتا است.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-slate-300">
              درباره شرکت
            </Link>
            <span>•</span>
            <span className="text-amber-500/80 font-mono">v1.0.0 Monorepo</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
