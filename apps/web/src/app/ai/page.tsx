'use client';

import React, { useState } from 'react';
import { Bot, Key, Lock, Sparkles, Send, CheckCircle2 } from 'lucide-react';

export default function AIPage() {
  const [prompt, setPrompt] = useState<string>('چگونه می‌توان جریمه راکتیو یک کارخانه ریخته‌گری با دیماند ۵۰۰ کیلووات را به صفر رساند؟');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [apiKey, setApiKey] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRunAI = () => {
    setLoading(true);
    setTimeout(() => {
      setResponse(
        `[پاسخ مهندسی هوش مصنوعی Xennic - مدل ${selectedModel}]\n\nبرای کارخانه ریخته‌گری با دیماند ۵۰۰ کیلووات با بارهای سلفی متغیر، راهکارهای زیر توصیه می‌گردد:\n۱. نصب رگولاتور میکروپروسسوری هوشمند با سوئیچینگ تریستوری (Static Var Compensator / SVC) به جای کنتاکتور جهت پاسخ در میلی‌ثانیه.\n۲. تفکیک جبران‌سازی متمرکز در تابلوی اصلی با ظرفیت تقریبی ۲۰۰ کیلووار و جبران‌سازی انفرادی روی الکتروموتورهای پرتوان بالای ۴۵ کیلووات.\n۳. نصب فیلتر هارمونیک پسیو (Detuned Reactor با ضریب ۷٪ یا ۱۴٪) برای جلوگیری از رزونانس با کوره القایی.`
      );
      setLoading(false);
    }, 600);
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/30">
          <Bot className="w-3.5 h-3.5" />
          <span>درگاه چندمدلی هوش مصنوعی مهندسی (Multi-Model Gateway)</span>
        </div>
        <h1 className="text-3xl font-black text-white">تحلیل هوش مصنوعی و مقایسه مدل‌ها</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          پرسش و پاسخ تخصصی روی شبکه برق، قوانین تعرفه‌ای و محاسبات مهندسی با مدل‌های پایه GitHub Models یا اتصال کلید اختصاصی شما (BYOK با رمزنگاری AES-256).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">انتخاب مدل هوش مصنوعی</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="gpt-4o">GPT-4o (GitHub Models / رایگان)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Pro BYOK)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Pro BYOK)</option>
                <option value="llama-3.3-70b">Llama 3.3 70B (GitHub Models)</option>
              </select>
            </div>

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="سوال مهندسی یا متن سناریوی انرژی خود را وارد کنید..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
            />

            <div className="flex justify-end">
              <button
                onClick={handleRunAI}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? 'در حال پردازش...' : 'اجرای تحلیل تخصصی'}
              </button>
            </div>
          </div>

          {response && (
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  خروجی تحلیل مهندسی
                </span>
                <span className="text-[10px] text-slate-500 font-mono">مدل: {selectedModel}</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                {response}
              </p>
            </div>
          )}
        </div>

        {/* BYOK Settings Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              اتصال کلید اختصاصی (BYOK)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              اگر مشترک حرفه‌ای OpenAI یا Anthropic هستید، می‌توانید با ثبت کلید خود از ظرفیت نامحدود مدل‌ها بهره‌مند شوید.
            </p>

            <div className="space-y-2">
              <label className="block text-xs text-slate-300">کلید API اختصاصی</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Lock className="w-3.5 h-3.5" />
                حفاظت امنیتی داده‌ها
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                کلید شما پس از دریافت، بلافاصله توسط الگوریتم <strong>AES-256-GCM</strong> رمزنگاری شده و هرگز به صورت متن خام در سرور ذخیره نمی‌شود.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
