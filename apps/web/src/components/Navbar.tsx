'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, Sun, Calculator, BookOpen, Bot, Shield, Layers } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo & Company Title */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-6 h-6 fill-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-amber-400 transition-colors">
              XENNIC <span className="text-amber-400 text-sm font-normal">زننیک</span>
            </span>
            <span className="text-[10px] text-slate-400">زر نور نیرو یکتا</span>
          </div>
        </Link>

        {/* Navigation Workspaces */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
          <Link
            href="/audit"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-amber-400 transition-colors"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            ممیزی قبوض
          </Link>
          <Link
            href="/solar"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-amber-400 transition-colors"
          >
            <Sun className="w-4 h-4 text-amber-400" />
            امکان‌سنجی خورشیدی
          </Link>
          <Link
            href="/engineering"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-amber-400 transition-colors"
          >
            <Calculator className="w-4 h-4 text-amber-400" />
            جعبه‌ابزار مهندسی
          </Link>
          <Link
            href="/wiki"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-amber-400 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            دانشنامه قوانین
          </Link>
          <Link
            href="/ai"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-800/80 hover:text-amber-400 transition-colors"
          >
            <Bot className="w-4 h-4 text-amber-400" />
            هوش مصنوعی (AI)
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-500/50 hover:text-white transition-all"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            پنل مدیریت
          </Link>
          <Link
            href="/audit"
            className="px-4 py-2 text-xs md:text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            ورود به پنل کاربری
          </Link>
        </div>
      </div>
    </header>
  );
};
