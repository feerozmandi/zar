'use client';

import React, { useState } from 'react';
import { Calculator, CheckCircle2, AlertCircle } from 'lucide-react';
import { calculateCableSizing } from '@xennic/shared';

export const CableCalculator: React.FC = () => {
  const [powerKW, setPowerKW] = useState<number>(55);
  const [lengthMeters, setLengthMeters] = useState<number>(75);
  const [voltage, setVoltage] = useState<number>(400);
  const [material, setMaterial] = useState<'COPPER' | 'ALUMINUM'>('COPPER');
  const [maxDrop, setMaxDrop] = useState<number>(3.0);

  const result = calculateCableSizing({
    loadPowerKW: powerKW,
    nominalVoltageV: voltage,
    powerFactor: 0.85,
    cableLengthMeters: lengthMeters,
    conductorMaterial: material,
    insulationType: 'XLPE',
    installationMethod: 'IN_AIR',
    ambientTemperatureC: 35,
    maxAllowableVoltageDropPercent: maxDrop,
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">محاسبه سریع سایزینگ کابل و افت ولتاژ</h3>
            <p className="text-xs text-slate-400">بر مبنای استاندارد IEC 60364 و نشریه ۱۱۰ سازمان برنامه و بودجه</p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-medium">
          IEC 60364-5-52
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-300 mb-1">توان مصرفی بار (kW)</label>
            <input
              type="number"
              value={powerKW}
              onChange={(e) => setPowerKW(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">طول مسیر کابل (متر)</label>
            <input
              type="number"
              value={lengthMeters}
              onChange={(e) => setLengthMeters(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">جنس هادی</label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="COPPER">مس (Copper)</option>
              <option value="ALUMINUM">آلومینیوم (Aluminum)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">حداکثر افت مجاز (%)</label>
            <input
              type="number"
              step="0.5"
              value={maxDrop}
              onChange={(e) => setMaxDrop(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">سطح مقطع پیشنهادی</div>
              <div className="text-xl font-black mt-1 text-amber-400 font-mono">
                {result.recommendedCrossSectionSqMm} <span className="text-xs text-slate-300 font-sans">mm²</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">جریان نامی: {result.designCurrentAmperes} A</div>
            </div>

            <div className={`p-3 rounded-xl border ${result.isVoltageDropAcceptable ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="text-xs text-slate-400">افت ولتاژ محاسبه‌شده</div>
              <div className="text-xl font-bold mt-1 text-white font-mono flex items-center justify-between">
                <span>{result.actualVoltageDropPercent}٪</span>
                {result.isVoltageDropAcceptable ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">مقدار ولتاژ: {result.actualVoltageDropVolts} V</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <span className="font-bold text-amber-400">مرجع مهندسی:</span> {result.standardReference} — مقاومت کابل: {result.cableResistanceOhmPerKm} Ω/km
          </div>
        </div>
      </div>
    </div>
  );
};
