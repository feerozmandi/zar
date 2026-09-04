import React from 'react';
import { Shield, Users, FileCheck, Sun, Activity, Cpu, Database, Server } from 'lucide-react';

export default function AdminPage() {
  const stats = [
    { title: 'کاربران فعال', value: '۱۴۲', change: '+۱۲٪ این ماه', icon: Users, color: 'text-blue-400' },
    { title: 'قبوض ممیزی‌شده', value: '۸۷۴', change: 'بیش از ۴ میلیارد تومان صرفه‌جویی کشف‌شده', icon: FileCheck, color: 'text-amber-400' },
    { title: 'طرح‌های خورشیدی', value: '۱۲.۵ MW', change: 'ظرفیت کل امکان‌سنجی‌شده', icon: Sun, color: 'text-emerald-400' },
    { title: 'محاسبات کابل و IEC', value: '۳,۴۲۰', change: 'صدور دفترچه محاسبات فنی', icon: Cpu, color: 'text-purple-400' },
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/30">
            <Shield className="w-3.5 h-3.5" />
            <span>پنل مدیریت ارشد پلتفرم زننیک</span>
          </div>
          <h1 className="text-2xl font-black text-white">داشبورد نظارت و آمار کلان سامانه</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>تمام سرویس‌ها نرمال (100% HEALTHY)</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{st.title}</span>
                <Icon className={`w-5 h-5 ${st.color}`} />
              </div>
              <div className="text-2xl font-black text-white">{st.value}</div>
              <div className="text-[11px] text-slate-500">{st.change}</div>
            </div>
          );
        })}
      </div>

      {/* Server & Infrastructure Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" />
            وضعیت کانتینرها و زیرساخت سرور
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Core API Gateway (NestJS):</span>
              <span className="text-emerald-400 font-mono">PORT 4000 (Running)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Frontend Web & Workspaces (Next.js):</span>
              <span className="text-emerald-400 font-mono">PORT 3000 (Running)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">PostgreSQL Database:</span>
              <span className="text-emerald-400 font-mono">PORT 5432 (Connected)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Redis & BullMQ Worker Queue:</span>
              <span className="text-emerald-400 font-mono">PORT 6379 (Active)</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            امنیت و پایش قوانین Ruleset مخزن
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">QA Quality Gates:</span>
              <span className="text-emerald-400 font-mono">۵ دروازه فعال در CI/CD</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">حفاظت شاخه پایدار main:</span>
              <span className="text-cyan-400 font-mono">Ruleset Active (PR + 1 Review)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">رمزنگاری کلیدهای اختصاصی BYOK:</span>
              <span className="text-amber-400 font-mono">AES-256-GCM Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
