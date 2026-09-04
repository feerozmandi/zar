'use client';

import React, { useState } from 'react';
import { Sun, Leaf, DollarSign, Award, ArrowUpRight } from 'lucide-react';
import { IRAN_SOLAR_IRRADIATION_BENCHMARKS, calculateSolarFeasibility } from '@xennic/shared';

export const SolarEstimator: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState<string>('یزد');
  const [roofArea, setRoofArea] = useState<number>(1000);
  const [contractDemand, setContractDemand] = useState<number>(250);

  const provinceData = IRAN_SOLAR_IRRADIATION_BENCHMARKS[selectedProvince] || { ghi: 2000, sunHours: 5.0 };

  const result = calculateSolarFeasibility({
    location: {
      province: selectedProvince,
      city: selectedProvince,
      latitude: 32.0,
      longitude: 54.0,
      annualGHI_KWh_m2: provinceData.ghi,
      peakSunHoursDaily: provinceData.sunHours,
    },
    availableRoofAreaSqM: roofArea,
    contractDemandKW: contractDemand,
    monthlyAverageConsumptionKWh: 20000,
    subsidyModel: 'ARTICLE_16',
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">ماشین‌حساب امکان‌سنجی خورشیدی و بازگشت سرمایه</h3>
            <p className="text-xs text-slate-400">محاسبات ماده ۱۲، ماده ۱۶ و درآمد تابلوی سبز بورس انرژی</p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
          ساتبا و بورس انرژی
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1">استان محل احداث</label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              {Object.keys(IRAN_SOLAR_IRRADIATION_BENCHMARKS).map((prov) => (
                <option key={prov} value={prov}>
                  استان {prov} (میانگین {IRAN_SOLAR_IRRADIATION_BENCHMARKS[prov].sunHours} ساعت پیک تابش روزانه)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">مساحت مفید سقف (مترمربع)</label>
              <input
                type="number"
                value={roofArea}
                onChange={(e) => setRoofArea(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">دیماند کارخانه (کیلووات)</label>
              <input
                type="number"
                value={contractDemand}
                onChange={(e) => setContractDemand(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">ظرفیت پیشنهادی</div>
              <div className="text-xl font-extrabold mt-1 text-amber-400">
                {result.recommendedCapacityKW.toLocaleString('fa-IR')} <span className="text-xs text-slate-300">kW</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">پوشش سقف با پنل ۵۵۰W</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">دوره بازگشت سرمایه</div>
              <div className="text-xl font-extrabold mt-1 text-emerald-400">
                {result.simplePaybackPeriodYears.toLocaleString('fa-IR')} <span className="text-xs text-slate-300">سال</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">نرخ بازده داخلی (IRR): {result.internalRateOfReturnPercent}٪</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Leaf className="w-4 h-4" />
                تولید سالانه و اثر زیست‌محیطی
              </span>
              <span>{result.co2ReductionTonsAnnual.toLocaleString('fa-IR')} تن کاهش CO₂</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              تولید سالانه: <strong>{(result.annualGenerationKWh / 1000).toLocaleString('fa-IR')} مگاوات‌ساعت</strong> | درآمد تخمینی سالانه از بورس سبز: <strong>{(result.estimatedAnnualRevenueRials / 10000000).toLocaleString('fa-IR')} میلیون تومان</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
