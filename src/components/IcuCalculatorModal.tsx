/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wind, Activity } from 'lucide-react';

interface VentilatorInputs {
  pco2Awal: string;
  pco2Target: string;
  mveAwal: string;
  rrAwal: string;
  pao2Awal: string;
  pao2Target: string;
  fio2Awal: string;
}

interface FenclInputs {
  beTotal: string;
  natrium: string;
  klorida: string;
  albumin: string;
}

const CONTOH_VENTILATOR: VentilatorInputs = {
  pco2Awal: '55',
  pco2Target: '40',
  mveAwal: '4.0',
  rrAwal: '30',
  pao2Awal: '60',
  pao2Target: '80',
  fio2Awal: '40',
};

const CONTOH_FENCL: FenclInputs = {
  beTotal: '-8',
  natrium: '140',
  klorida: '115',
  albumin: '2.5',
};

const EMPTY_VENTILATOR: VentilatorInputs = {
  pco2Awal: '',
  pco2Target: '',
  mveAwal: '',
  rrAwal: '',
  pao2Awal: '',
  pao2Target: '',
  fio2Awal: '',
};

const EMPTY_FENCL: FenclInputs = {
  beTotal: '',
  natrium: '',
  klorida: '',
  albumin: '',
};

const parseNum = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const fmtResult = (n: number, d = 2) =>
  Number.isFinite(n) && !Number.isNaN(n) ? n.toFixed(d) : '-';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function IcuCalculatorModal({ isOpen, onClose }: Props) {
  const [vent, setVent] = useState<VentilatorInputs>(EMPTY_VENTILATOR);
  const [fencl, setFencl] = useState<FenclInputs>(EMPTY_FENCL);

  const handleVentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVent(prev => ({ ...prev, [name]: value }));
  };

  const handleFenclChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFencl(prev => ({ ...prev, [name]: value }));
  };

  const fillContoh = () => {
    setVent(CONTOH_VENTILATOR);
    setFencl(CONTOH_FENCL);
  };

  const resetForm = () => {
    setVent(EMPTY_VENTILATOR);
    setFencl(EMPTY_FENCL);
  };

  // Ventilator calculations
  const ventResults = useMemo(() => {
    const pco2A = parseNum(vent.pco2Awal);
    const pco2T = parseNum(vent.pco2Target);
    const mveA = parseNum(vent.mveAwal);
    const rrA = parseNum(vent.rrAwal);
    const pao2A = parseNum(vent.pao2Awal);
    const pao2T = parseNum(vent.pao2Target);
    const fio2A = parseNum(vent.fio2Awal);

    const targetMve  = pco2A > 0 && pco2T > 0 && mveA > 0 ? (mveA * pco2A) / pco2T : NaN;
    const targetRr   = pco2A > 0 && pco2T > 0 && rrA  > 0 ? (rrA  * pco2A) / pco2T : NaN;
    const targetFio2 = pao2A > 0 && pao2T > 0 && fio2A > 0 ? (fio2A * pao2T) / pao2A : NaN;

    return { targetMve, targetRr, targetFio2 };
  }, [vent]);

  // Fencl-Stewart base excess analysis
  const fenclResults = useMemo(() => {
    const be  = parseNum(fencl.beTotal);
    const na  = parseNum(fencl.natrium);
    const cl  = parseNum(fencl.klorida);
    const alb = parseNum(fencl.albumin);

    // Require positive sodium for corrected-Cl calculation
    if (na <= 0) {
      return { efekNatrium: NaN, efekKlorida: NaN, efekAlbumin: NaN, ua: NaN };
    }

    // Effect of free water (Na) on BE
    const efekNatrium = (na - 140) * 0.3;

    // Effect of chloride on BE — uses corrected Cl vs normal Cl (105)
    const clCorr = cl * (140 / na);
    const efekKlorida = 105 - clCorr;

    // Effect of albumin on BE (hypoalbuminemia raises effective BE)
    const efekAlbumin = 2.5 * (4.2 - alb);

    // Unmeasured anions = residual BE not explained by the above
    const ua = be - efekNatrium - efekKlorida - efekAlbumin;

    return { efekNatrium, efekKlorida, efekAlbumin, ua };
  }, [fencl]);

  const inputCls =
    'w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold ' +
    'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all';

  const labelCls = 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[92vh] overflow-hidden bg-white rounded-[2rem] shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Kalkulator Klinis Intensif</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Target Ventilator &amp; Analisis Base Excess (Metode Stewart-Fencl)
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-8">

              {/* ── Section 1: Ventilator ── */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Wind size={18} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">1. Penyesuaian Ventilator</h3>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'PCO₂ Awal', name: 'pco2Awal', unit: 'mmHg' },
                    { label: 'PCO₂ Target', name: 'pco2Target', unit: 'mmHg' },
                    { label: 'MVe Awal', name: 'mveAwal', unit: 'L/min' },
                    { label: 'RR Awal', name: 'rrAwal', unit: 'x/min' },
                    { label: 'PaO₂ Awal', name: 'pao2Awal', unit: 'mmHg' },
                    { label: 'PaO₂ Target', name: 'pao2Target', unit: 'mmHg' },
                    { label: 'FiO₂ Awal', name: 'fio2Awal', unit: '%' },
                  ].map(({ label, name, unit }) => (
                    <div key={name}>
                      <label className={labelCls}>{label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name={name}
                          value={vent[name as keyof VentilatorInputs]}
                          onChange={handleVentChange}
                          placeholder="0"
                          className={inputCls}
                        />
                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Results */}
                <div className="bg-blue-50 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-blue-700 mb-4">Hasil Perhitungan</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Target MVe', value: ventResults.targetMve, unit: 'L/min' },
                      { label: 'Target RR', value: ventResults.targetRr, unit: 'x/min' },
                      { label: 'Target FiO₂', value: ventResults.targetFio2, unit: '%' },
                    ].map(({ label, value, unit }) => (
                      <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-lg font-black text-blue-600">
                          {fmtResult(value)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">{unit}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-blue-500 font-medium mt-3">
                    *Rumus: (Nilai Awal × Variabel Awal) / Variabel Target
                  </p>
                </div>
              </section>

              {/* ── Section 2: Base Excess Fencl ── */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
                    <Activity size={18} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">2. Analisis Base Excess (Fencl)</h3>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Base Excess (BE) Total', name: 'beTotal', unit: 'mEq/L' },
                    { label: 'Natrium (Na)', name: 'natrium', unit: 'mEq/L' },
                    { label: 'Klorida (Cl)', name: 'klorida', unit: 'mEq/L' },
                    { label: 'Albumin', name: 'albumin', unit: 'g/dL' },
                  ].map(({ label, name, unit }) => (
                    <div key={name}>
                      <label className={labelCls}>{label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name={name}
                          value={fencl[name as keyof FenclInputs]}
                          onChange={handleFenclChange}
                          placeholder="0"
                          className={inputCls}
                        />
                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Results */}
                <div className="bg-violet-50 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-violet-700 mb-4">Efek Terhadap BE &amp; Unmeasured Anions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Efek Natrium', value: fenclResults.efekNatrium },
                      { label: 'Efek Klorida', value: fenclResults.efekKlorida },
                      { label: 'Efek Albumin', value: fenclResults.efekAlbumin },
                      { label: 'Unmeasured Anions (UA)', value: fenclResults.ua },
                    ].map(({ label, value }) => {
                      const display = fmtResult(value);
                      const isNeg = Number.isFinite(value) && value < 0;
                      return (
                        <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 leading-tight">{label}</p>
                          <p className={`text-lg font-black ${isNeg ? 'text-rose-500' : 'text-violet-600'}`}>
                            {display}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">mEq/L</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

            </div>

            {/* Footer buttons */}
            <div className="p-6 md:px-8 md:pb-8 border-t border-slate-100 flex items-center gap-3 shrink-0 bg-white">
              <button
                onClick={fillContoh}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-sm"
              >
                Isi Data Kertas (Contoh)
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all text-sm"
              >
                Reset Form
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
