/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Baby, AlertCircle, CheckCircle2, RefreshCcw, ImageIcon } from 'lucide-react';

// ── RDA lookup table ──────────────────────────────────────────────────────────

interface RdaRow {
  label: string;
  kcalPerKg: number;
  proteinPerKg: number;
  fluidMin: number;
  fluidMax: number;
}

type Gender = 'male' | 'female';

function getRdaRow(age: number, gender: Gender): RdaRow | null {
  if (age < 0 || age > 18) return null;

  if (age < 0.5) {
    return { label: 'Bayi (0 – 0.5 tahun)', kcalPerKg: 108, proteinPerKg: 2.2, fluidMin: 140, fluidMax: 160 };
  }
  if (age < 1) {
    return { label: 'Bayi (0.5 – 1 tahun)', kcalPerKg: 98, proteinPerKg: 1.5, fluidMin: 125, fluidMax: 145 };
  }
  if (age < 4) {
    return { label: 'Anak (1 – 3 tahun)', kcalPerKg: 102, proteinPerKg: 1.23, fluidMin: 115, fluidMax: 125 };
  }
  if (age < 7) {
    return { label: 'Anak (4 – 6 tahun)', kcalPerKg: 90, proteinPerKg: 1.2, fluidMin: 90, fluidMax: 110 };
  }
  if (age < 11) {
    return { label: 'Anak (7 – 10 tahun)', kcalPerKg: 70, proteinPerKg: 1.0, fluidMin: 70, fluidMax: 85 };
  }
  if (age < 15) {
    if (gender === 'male') {
      return { label: 'Remaja Laki-laki (11 – 14 tahun)', kcalPerKg: 55, proteinPerKg: 1.0, fluidMin: 70, fluidMax: 85 };
    }
    return { label: 'Remaja Perempuan (11 – 14 tahun)', kcalPerKg: 47, proteinPerKg: 1.0, fluidMin: 70, fluidMax: 85 };
  }
  // 15–18
  if (gender === 'male') {
    return { label: 'Remaja Laki-laki (15 – 18 tahun)', kcalPerKg: 45, proteinPerKg: 0.8, fluidMin: 50, fluidMax: 60 };
  }
  return { label: 'Remaja Perempuan (15 – 18 tahun)', kcalPerKg: 40, proteinPerKg: 0.8, fluidMin: 50, fluidMax: 60 };
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface RdaInputs {
  age: string;
  gender: Gender;
  bbi: string;
}

const EMPTY_INPUTS: RdaInputs = { age: '', gender: 'male', bbi: '' };

const parseNum = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function RdaCalculatorModal({ isOpen, onClose }: Props) {
  const [inputs, setInputs] = useState<RdaInputs>(EMPTY_INPUTS);
  const [showRefImage, setShowRefImage] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const reset = () => setInputs(EMPTY_INPUTS);

  const result = useMemo(() => {
    const age = parseNum(inputs.age);
    const bbi = parseNum(inputs.bbi);

    if (inputs.age.trim() === '' || inputs.bbi.trim() === '') return { type: 'empty' as const };
    if (Number.isNaN(age) || Number.isNaN(bbi)) return { type: 'invalid' as const };
    if (age < 0 || age > 18) return { type: 'outOfRange' as const };
    if (bbi <= 0) return { type: 'invalidBBI' as const };

    const row = getRdaRow(age, inputs.gender);
    if (!row) return { type: 'outOfRange' as const };

    const kalori = bbi * row.kcalPerKg;
    const protein = bbi * row.proteinPerKg;
    const cairanMin = bbi * row.fluidMin;
    const cairanMax = bbi * row.fluidMax;

    return {
      type: 'ok' as const,
      row,
      bbi,
      kalori,
      protein,
      cairanMin,
      cairanMax,
    };
  }, [inputs]);

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inputCls =
    'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold ' +
    'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all';
  const labelCls = 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[92vh] overflow-hidden bg-white rounded-[2rem] shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <Baby size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Kalkulator Kebutuhan Nutrisi Harian</h2>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    RDA Bayi & Anak berdasarkan Umur, Jenis Kelamin, dan BBI
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6">

              {/* ── Reference Image toggle ── */}
              <div>
                <button
                  onClick={() => setShowRefImage(v => !v)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
                >
                  <ImageIcon size={14} />
                  {showRefImage ? 'Sembunyikan' : 'Tampilkan'} Tabel Referensi RDA
                </button>
                <AnimatePresence>
                  {showRefImage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <img
                        src="https://github.com/user-attachments/assets/93189188-e226-4a0e-bc52-19184aabb958"
                        alt="Tabel 1. Recommended Dietary Allowances untuk bayi dan anak"
                        className="w-full rounded-2xl border border-slate-200 shadow-sm object-contain"
                        style={{ imageRendering: 'crisp-edges' }}
                      />
                      <p className="text-[10px] text-slate-400 font-medium mt-2 text-center">
                        Tabel 1. Recommended Dietary Allowances untuk Bayi dan Anak
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Inputs ── */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-slate-700">Data Pasien</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Age */}
                  <div>
                    <label className={labelCls}>Umur (tahun)</label>
                    <input
                      type="number"
                      name="age"
                      value={inputs.age}
                      onChange={handleChange}
                      placeholder="0"
                      min={0}
                      max={18}
                      step={0.1}
                      className={inputCls}
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">0 – 18 tahun, boleh desimal</p>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className={labelCls}>Jenis Kelamin</label>
                    <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 h-[46px]">
                      {([
                        { value: 'male', label: 'Laki-laki' },
                        { value: 'female', label: 'Perempuan' },
                      ] as const).map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setInputs(p => ({ ...p, gender: value }))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            inputs.gender === value
                              ? 'bg-white text-emerald-600 shadow-sm border border-slate-200'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* BBI */}
                  <div>
                    <label className={labelCls}>BBI (kg)</label>
                    <input
                      type="number"
                      name="bbi"
                      value={inputs.bbi}
                      onChange={handleChange}
                      placeholder="0"
                      min={0}
                      step={0.1}
                      className={inputCls}
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Berat Badan Ideal</p>
                  </div>
                </div>
              </section>

              {/* ── Output ── */}
              <section>
                {result.type === 'empty' && (
                  <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <AlertCircle size={18} className="text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-500 font-medium">
                      Masukkan data pasien untuk melihat kebutuhan nutrisi harian.
                    </p>
                  </div>
                )}

                {(result.type === 'invalid' || result.type === 'invalidBBI') && (
                  <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-5">
                    <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-rose-700 font-medium">
                      {result.type === 'invalidBBI'
                        ? 'BBI harus lebih dari 0 kg.'
                        : 'Pastikan semua input terisi dengan angka yang valid.'}
                    </p>
                  </div>
                )}

                {result.type === 'outOfRange' && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-700 font-medium">
                      Umur di luar rentang yang didukung (0 – 18 tahun). Tabel RDA ini hanya untuk bayi dan anak.
                    </p>
                  </div>
                )}

                {result.type === 'ok' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Category badge */}
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                        {result.row.label}
                      </span>
                    </div>

                    {/* Result cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">Kalori</p>
                        <p className="text-3xl font-black text-amber-700 tracking-tight">
                          {result.kalori.toFixed(1)}
                        </p>
                        <p className="text-xs font-bold text-amber-500 mt-1">kkal/hari</p>
                        <p className="text-[10px] text-amber-400 mt-1 font-medium">
                          {result.row.kcalPerKg} kkal/kg × {result.bbi} kg
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Protein</p>
                        <p className="text-3xl font-black text-blue-700 tracking-tight">
                          {result.protein.toFixed(2)}
                        </p>
                        <p className="text-xs font-bold text-blue-500 mt-1">gram/hari</p>
                        <p className="text-[10px] text-blue-400 mt-1 font-medium">
                          {result.row.proteinPerKg} g/kg × {result.bbi} kg
                        </p>
                      </div>

                      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 text-center">
                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-2">Cairan</p>
                        <p className="text-2xl font-black text-teal-700 tracking-tight leading-none">
                          {result.cairanMin.toFixed(0)}
                          <span className="text-base font-bold text-teal-500 mx-1">–</span>
                          {result.cairanMax.toFixed(0)}
                        </p>
                        <p className="text-xs font-bold text-teal-500 mt-1">ml/hari</p>
                        <p className="text-[10px] text-teal-400 mt-1 font-medium">
                          {result.row.fluidMin}–{result.row.fluidMax} ml/kg × {result.bbi} kg
                        </p>
                      </div>
                    </div>

                    {/* Clinical summary */}
                    <div className="bg-slate-900 rounded-2xl p-6 text-white font-mono text-sm leading-relaxed">
                      <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-4">
                        Kebutuhan Harian (Format Klinis)
                      </p>
                      <div className="space-y-2">
                        <p>
                          <span className="text-slate-400 w-28 inline-block">- Kalori</span>
                          <span className="text-white">: </span>
                          <span className="text-amber-400 font-bold">{result.kalori.toFixed(1)} kkal/hari</span>
                        </p>
                        <p>
                          <span className="text-slate-400 w-28 inline-block">- Protein</span>
                          <span className="text-white">: </span>
                          <span className="text-blue-400 font-bold">{result.protein.toFixed(2)} gram/hari</span>
                        </p>
                        <p>
                          <span className="text-slate-400 w-28 inline-block">- Cairan</span>
                          <span className="text-white">: </span>
                          <span className="text-teal-400 font-bold">
                            {result.cairanMin.toFixed(0)} – {result.cairanMax.toFixed(0)} ml/hari
                          </span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 md:px-8 md:pb-8 border-t border-slate-100 flex items-center gap-3 shrink-0 bg-white">
              <button
                onClick={reset}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl transition-all text-sm"
              >
                <RefreshCcw size={14} />
                Reset
              </button>
              <p className="text-[10px] text-slate-400 font-medium flex-1">
                * Berdasarkan Tabel RDA – Recommended Dietary Allowances untuk bayi dan anak
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
