'use client';

import React, { useState } from 'react';
import { Zap, AlertTriangle, CheckCircle, TrendingDown, Sparkles } from 'lucide-react';
import { TAVANIR_TARIFF_CONSTANTS } from '@xennic/shared';

export const AuditCalculator: React.FC = () => {
  const [contractDemand, setContractDemand] = useState<number>(150);
  const [peakMeasured, setPeakMeasured] = useState<number>(180);
  const [lowLoad, setLowLoad] = useState<number>(8000);
  const [midLoad, setMidLoad] = useState<number>(18000);
  const [peakLoad, setPeakLoad] = useState<number>(14000);
  const [reactive, setReactive] = useState<number>(30000);

  const totalActive = lowLoad + midLoad + peakLoad;
  const apparent = Math.sqrt(Math.pow(totalActive, 2) + Math.pow(reactive, 2));
  const powerFactor = apparent > 0 ? parseFloat((totalActive / apparent).toFixed(3)) : 1.0;
  const isPfCompliant = powerFactor >= 0.90;

  // Reactive Penalty
  let reactivePenalty = 0;
  if (powerFactor < 0.90) {
    const reactiveDeficit = reactive - totalActive * Math.tan(Math.acos(0.90));
    if (reactiveDeficit > 0) {
      reactivePenalty = Math.round(
        reactiveDeficit * TAVANIR_TARIFF_CONSTANTS.TOU_RATES.MID_LOAD * 1.5
      );
    }
  }

  // Demand overrun penalty
  let demandPenalty = 0;
  if (peakMeasured > contractDemand) {
    demandPenalty = (peakMeasured - contractDemand) * 185000 * 2.0;
  }

  const activeCost =
    lowLoad * 1200 + midLoad * 2400 + peakLoad * 4800;
  const baseDemandCharge = contractDemand * 185000;
  const totalPayable = Math.round(
    (activeCost + baseDemandCharge + reactivePenalty + demandPenalty) * 1.2
  );
  const recommendedCapacitor = powerFactor < 0.95
    ? Math.round(contractDemand * (Math.tan(Math.acos(powerFactor)) - Math.tan(Math.acos(0.95))))
    : 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">شبیه‌ساز ممیزی و کشف جرایم قبض برق صنعتی</h3>
            <p className="text-xs text-slate-400">محاسبه برخط بهای دیماند، جریمه راکتیو و ضریب توان</p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
          فرمول‌های توانیر ۱۴۰۵
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">پارامترهای ورودی قبض</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">دیماند قراردادی (kW)</label>
              <input
                type="number"
                value={contractDemand}
                onChange={(e) => setContractDemand(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">پیک اندازه‌گیری‌شده (kW)</label>
              <input
                type="number"
                value={peakMeasured}
                onChange={(e) => setPeakMeasured(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">مصرف میان‌باری (kWh)</label>
              <input
                type="number"
                value={midLoad}
                onChange={(e) => setMidLoad(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">مصرف اوج‌بار (kWh)</label>
              <input
                type="number"
                value={peakLoad}
                onChange={(e) => setPeakLoad(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">مصرف کم‌باری (kWh)</label>
              <input
                type="number"
                value={lowLoad}
                onChange={(e) => setLowLoad(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">مصرف راکتیو (kVARh)</label>
              <input
                type="number"
                value={reactive}
                onChange={(e) => setReactive(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Calculated Results */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">نتایج تحلیل و صرفه‌جویی</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl border ${isPfCompliant ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="text-xs text-slate-400">ضریب توان (cos φ)</div>
              <div className="text-xl font-extrabold mt-1 text-white flex items-center justify-between">
                <span>{powerFactor}</span>
                {isPfCompliant ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="text-[10px] mt-1 text-slate-400">
                {isPfCompliant ? 'محدوده مجاز' : 'مشمول جریمه راکتیو'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">مجموع جریمه ماهانه</div>
              <div className="text-lg font-bold mt-1 text-red-400">
                {((reactivePenalty + demandPenalty) / 10).toLocaleString('fa-IR')} <span className="text-xs text-slate-400">تومان</span>
              </div>
              <div className="text-[10px] mt-1 text-slate-400">
                راکتیو + تجاوز از قدرت
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              توصیه بهینه‌سازی Xennic
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              با نصب بانک خازنی به ظرفیت <strong>{recommendedCapacitor} kVAR</strong>، جریمه راکتیو به صفر رسیده و سالانه حدود <strong>{((reactivePenalty * 12) / 10).toLocaleString('fa-IR')} تومان</strong> در هزینه‌های برق کارخانه صرفه‌جویی می‌شود.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
