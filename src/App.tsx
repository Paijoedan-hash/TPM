/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  Baby, 
  Droplets, 
  Activity, 
  FlaskConical, 
  Info,
  RefreshCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  Zap,
  PieChart,
  Scale,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateTPN, TPNCalculationInputs } from './services/tpnService';
import { MilkReferenceModal } from './components/MilkReferenceModal';
import { IcuCalculatorModal } from './components/IcuCalculatorModal';
import { RdaCalculatorModal } from './components/RdaCalculatorModal';

// Types
interface TPNInputs {
  weight: string;
  weightUnit: 'kg' | 'g';
  totalFluidPerDay: string;
  fluidNeedConstant: string;
  calorieNeedConstant: string;
  enteralMinPer3Hours: string;
  enteralMaxPer3Hours: string;
  // Oral detail
  asiVolume: string;
  asiFrequency: string;
  suforVolume: string;
  suforFrequency: string;
  residuVolume: string;
  // Meds detail
  medsVolume: string;
  medsFrequency: string; 
  // New Nutrition
  aminoDose: string; // g/kg/day
  aminoConcentration: 6 | 10;
  lipidDose: string; // g/kg/day
  balanceCairan: string; // ml
  
  // New Vitamins/Minerals from prescription
  glikofosfatDose: string; // ml/kg
  soluvitVolume: string; // ml/day
  vitalipidVolume: string; // ml/day
  
  gir: string;
  caDose: string; 
  kclDose: string; 
  baseFluidType: 'D5 1/4 NS' | 'D5 1/2 NS';
}

const parseNumericInput = (value: string): number => {
  const normalizedValue = value.trim().replace(/,/g, '.');
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

export default function App() {
  const [isMilkModalOpen, setIsMilkModalOpen] = useState(false);
  const [isIcuModalOpen, setIsIcuModalOpen] = useState(false);
  const [isRdaModalOpen, setIsRdaModalOpen] = useState(false);
  const [inputs, setInputs] = useState<TPNInputs>({
    weight: '1.5',
    weightUnit: 'kg',
    totalFluidPerDay: '150',
    fluidNeedConstant: '90',
    calorieNeedConstant: '90',
    enteralMinPer3Hours: '3',
    enteralMaxPer3Hours: '5',
    asiVolume: '2',
    asiFrequency: '3',
    suforVolume: '0',
    suforFrequency: '3',
    residuVolume: '0',
    medsVolume: '1',
    medsFrequency: '2',
    aminoDose: '2',
    aminoConcentration: 10,
    lipidDose: '1',
    balanceCairan: '',
    glikofosfatDose: '1',
    soluvitVolume: '',
    vitalipidVolume: '',
    gir: '4',
    caDose: '2',
    kclDose: '1',
    baseFluidType: 'D5 1/4 NS',
  });

  const [useSmartRounding, setUseSmartRounding] = useState(true);

  // Darrow (Holliday-Segar) Formula
  const calculateDarrowFluid = (weight: number, unit: 'kg' | 'g') => {
    const w = unit === 'g' ? weight / 1000 : weight;
    if (w <= 0) return 0;
    if (w <= 10) return w * 100;
    if (w <= 20) return 1000 + (w - 10) * 50;
    return 1500 + (w - 20) * 20;
  };

  // Auto-calculate fluid when weight changes
  useEffect(() => {
    const w = parseNumericInput(inputs.weight);
    const darrowFluid = calculateDarrowFluid(w, inputs.weightUnit);
    if (darrowFluid > 0) {
      setInputs(prev => ({ ...prev, totalFluidPerDay: Math.round(darrowFluid).toString() }));
    }
  }, [inputs.weight, inputs.weightUnit]);

  // Calculations
  const results = useMemo(() => {
    const calculationInputs: TPNCalculationInputs = {
      weight: parseNumericInput(inputs.weight),
      weightUnit: inputs.weightUnit,
      totalFluidPerDay: parseNumericInput(inputs.totalFluidPerDay),
      asiVolume: parseNumericInput(inputs.asiVolume),
      asiFrequency: parseNumericInput(inputs.asiFrequency),
      suforVolume: parseNumericInput(inputs.suforVolume),
      suforFrequency: parseNumericInput(inputs.suforFrequency),
      medsVolume: parseNumericInput(inputs.medsVolume),
      medsFrequency: parseNumericInput(inputs.medsFrequency),
      aminoDose: parseNumericInput(inputs.aminoDose),
      aminoConcentration: inputs.aminoConcentration,
      lipidDose: parseNumericInput(inputs.lipidDose),
      balanceCairan: parseNumericInput(inputs.balanceCairan),
      glikofosfatDose: parseNumericInput(inputs.glikofosfatDose),
      soluvitVolume: parseNumericInput(inputs.soluvitVolume),
      vitalipidVolume: parseNumericInput(inputs.vitalipidVolume),
      gir: parseNumericInput(inputs.gir),
      caDose: parseNumericInput(inputs.caDose),
      kclDose: parseNumericInput(inputs.kclDose),
      baseFluidType: inputs.baseFluidType,
      useSmartRounding
    };

    return calculateTPN(calculationInputs);
  }, [inputs, useSmartRounding]);

  const { soluvitVolumeValue, vitalipidVolumeValue } = useMemo(() => ({
    soluvitVolumeValue: parseNumericInput(inputs.soluvitVolume),
    vitalipidVolumeValue: parseNumericInput(inputs.vitalipidVolume),
  }), [inputs.soluvitVolume, inputs.vitalipidVolume]);

  const calibrationSummary = useMemo(() => {
    const weightInKg = inputs.weightUnit === 'g'
      ? parseNumericInput(inputs.weight) / 1000
      : parseNumericInput(inputs.weight);
    const fluidNeed = parseNumericInput(inputs.fluidNeedConstant) * weightInKg;
    const calorieNeed = parseNumericInput(inputs.calorieNeedConstant) * weightInKg;
    const enteralMin24h = parseNumericInput(inputs.enteralMinPer3Hours) * 8;
    const enteralMax24h = parseNumericInput(inputs.enteralMaxPer3Hours) * 8;

    return {
      fluidNeed,
      calorieNeed,
      enteralMin24h,
      enteralMax24h,
    };
  }, [
    inputs.weight,
    inputs.weightUnit,
    inputs.fluidNeedConstant,
    inputs.calorieNeedConstant,
    inputs.enteralMinPer3Hours,
    inputs.enteralMaxPer3Hours,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const normalizedValue = value.replace(/,/g, '.');
    setInputs(prev => ({
      ...prev,
      [name]: normalizedValue
    }));
  };

  const resetInputs = () => {
    setInputs({
      weight: '1.5',
      weightUnit: 'kg',
      totalFluidPerDay: '150',
      fluidNeedConstant: '90',
      calorieNeedConstant: '90',
      enteralMinPer3Hours: '3',
      enteralMaxPer3Hours: '5',
      asiVolume: '2',
      asiFrequency: '3',
      suforVolume: '0',
      suforFrequency: '3',
      residuVolume: '0',
      medsVolume: '1',
      medsFrequency: '2',
      aminoDose: '2',
      aminoConcentration: 10,
      lipidDose: '1',
      balanceCairan: '',
      glikofosfatDose: '1',
      soluvitVolume: '',
      vitalipidVolume: '',
      gir: '4',
      caDose: '2',
      kclDose: '1',
      baseFluidType: 'D5 1/4 NS',
    });
  };

  const clearInputs = () => {
    setInputs({
      weight: '',
      weightUnit: 'kg',
      totalFluidPerDay: '',
      fluidNeedConstant: '',
      calorieNeedConstant: '',
      enteralMinPer3Hours: '',
      enteralMaxPer3Hours: '',
      asiVolume: '',
      asiFrequency: '',
      suforVolume: '',
      suforFrequency: '',
      residuVolume: '',
      medsVolume: '',
      medsFrequency: '',
      aminoDose: '',
      aminoConcentration: 10,
      lipidDose: '',
      balanceCairan: '',
      glikofosfatDose: '',
      soluvitVolume: '',
      vitalipidVolume: '',
      gir: '',
      caDose: '',
      kclDose: '',
      baseFluidType: 'D5 1/4 NS',
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Calculator size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">NeoTPN Calc <span className="text-emerald-500 text-sm font-medium ml-2">v2.0</span></h1>
              <p className="text-slate-500 font-medium">Kalkulator Nutrisi & Kalori Neonatus</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setUseSmartRounding(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                useSmartRounding 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Smart Rounding
            </button>
            <button 
              onClick={() => setUseSmartRounding(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                !useSmartRounding 
                ? 'bg-slate-800 text-white shadow-md shadow-slate-200' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Presisi
            </button>
            <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />
            <button 
              onClick={resetInputs}
              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
              title="Reset ke Default"
            >
              <RefreshCcw size={18} />
            </button>
            <button 
              onClick={clearInputs}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="Kosongkan Semua (0)"
            >
              <Trash2 size={18} />
            </button>
            <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />
            <button
              onClick={() => setIsIcuModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
              title="Kalkulator ICU"
            >
              <Activity size={14} />
              Kalkulator ICU
            </button>
            <button
              onClick={() => setIsRdaModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"
              title="Kalkulator Kebutuhan Nutrisi Harian (RDA)"
            >
              <Baby size={14} />
              Kalkulator RDA
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: INPUTS */}
          <div className="lg:col-span-5 space-y-6">
            {/* Patient Info */}
            <section className="bg-white rounded-[2rem] p-5 md:p-8 shadow-sm border border-slate-200/60">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <Baby size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Data Pasien & Cairan</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Berat Badan</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 group">
                      <input
                        type="number"
                        name="weight"
                        value={inputs.weight}
                        onChange={handleInputChange}
                        step={0.01}
                        placeholder="0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {(['kg', 'g'] as const).map(unit => (
                        <button
                          key={unit}
                          onClick={() => setInputs(p => ({ ...p, weightUnit: unit }))}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            inputs.weightUnit === unit 
                            ? 'bg-white text-emerald-600 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <InputGroup 
                    label="Target Cairan Total" 
                    name="totalFluidPerDay" 
                    value={inputs.totalFluidPerDay} 
                    onChange={handleInputChange} 
                    unit="ml/hari"
                  />
                  <div className="absolute top-0 right-0">
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">
                      Darrow
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kalibrasi Kebutuhan</p>
                  <div className="grid grid-cols-2 gap-3">
                    <InputGroup
                      label="Konstanta Cairan"
                      name="fluidNeedConstant"
                      value={inputs.fluidNeedConstant}
                      onChange={handleInputChange}
                      step={1}
                      unit="ml/kg"
                    />
                    <InputGroup
                      label="Konstanta Kalori"
                      name="calorieNeedConstant"
                      value={inputs.calorieNeedConstant}
                      onChange={handleInputChange}
                      step={1}
                      unit="kkal/kg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputGroup
                      label="Enteral Min (/3 jam)"
                      name="enteralMinPer3Hours"
                      value={inputs.enteralMinPer3Hours}
                      onChange={handleInputChange}
                      step={0.1}
                      unit="ml"
                    />
                    <InputGroup
                      label="Enteral Max (/3 jam)"
                      name="enteralMaxPer3Hours"
                      value={inputs.enteralMaxPer3Hours}
                      onChange={handleInputChange}
                      step={0.1}
                      unit="ml"
                    />
                  </div>
                  <div className="space-y-1 text-[10px] font-bold">
                    <p className="text-slate-600">
                      Kebutuhan cairan: {parseNumericInput(inputs.fluidNeedConstant).toFixed(0)} x {(results.weightInKg || 0).toFixed(2)} = <span className="text-emerald-600">{(calibrationSummary.fluidNeed || 0).toFixed(1)} ml/hari</span>
                    </p>
                    <p className="text-slate-600">
                      Kebutuhan kalori: {parseNumericInput(inputs.calorieNeedConstant).toFixed(0)} x {(results.weightInKg || 0).toFixed(2)} = <span className="text-emerald-600">{(calibrationSummary.calorieNeed || 0).toFixed(1)} kkal/hari</span>
                    </p>
                    <p className="text-slate-600">
                      Kebutuhan enteral: {parseNumericInput(inputs.enteralMinPer3Hours).toFixed(1)} - {parseNumericInput(inputs.enteralMaxPer3Hours).toFixed(1)} ml/3 jam = <span className="text-emerald-600">{(calibrationSummary.enteralMin24h || 0).toFixed(1)} - {(calibrationSummary.enteralMax24h || 0).toFixed(1)} ml/24 jam</span>
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asupan Oral</label>
                        <button 
                          onClick={() => setIsMilkModalOpen(true)}
                          className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-1 rounded-md transition-colors"
                          title="Referensi Kalori Susu"
                        >
                            <BookOpen size={12} />
                          </button>
                        </div>
                    </div>
                    <div className="space-y-2 p-2 bg-white rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ASI</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          name="asiVolume" 
                          value={inputs.asiVolume} 
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                        <span className="text-xs text-slate-400 font-medium">cc</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">Tiap</span>
                        <input 
                          type="number" 
                          name="asiFrequency" 
                          value={inputs.asiFrequency} 
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-12 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">Jam</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">Total ASI: {(results.totalAsiOral || 0).toFixed(1)} ml</p>
                    </div>
                    <div className="space-y-2 p-2 bg-white rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sufor</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          name="suforVolume" 
                          value={inputs.suforVolume} 
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                        <span className="text-xs text-slate-400 font-medium">cc</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">Tiap</span>
                        <input 
                          type="number" 
                          name="suforFrequency" 
                          value={inputs.suforFrequency} 
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-12 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">Jam</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">Total Sufor: {(results.totalSuforOral || 0).toFixed(1)} ml</p>
                    </div>
                    <div className="space-y-2 p-2 bg-white rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Residu</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          name="residuVolume" 
                          value={inputs.residuVolume} 
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                        <span className="text-xs text-slate-400 font-medium">cc</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">Residu: {(parseNumericInput(inputs.residuVolume) || 0).toFixed(1)} ml</p>
                    </div>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">Total: {(results.totalOral || 0).toFixed(1)} ml</p>
                    <p className="text-[10px] text-rose-500 font-bold">Muntah: 0 ml</p>
                  </div>

                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Obat-obatan</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        name="medsVolume" 
                        value={inputs.medsVolume} 
                        onChange={handleInputChange}
                        placeholder="0"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                      <span className="text-xs text-slate-400 font-medium">cc</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        name="medsFrequency" 
                        value={inputs.medsFrequency} 
                        onChange={handleInputChange}
                        placeholder="0"
                        className="w-12 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">X Sehari</span>
                    </div>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">Total: {(results.totalMeds || 0).toFixed(1)} ml</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Nutrition Parameters */}
            <section className="bg-white rounded-[2rem] p-5 md:p-8 shadow-sm border border-slate-200/60">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <FlaskConical size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Parameter Nutrisi</h2>
              </div>
              
              <div className="space-y-6">
                <InputGroup 
                  label="GIR (Glucose Infusion Rate)" 
                  name="gir" 
                  value={inputs.gir} 
                  onChange={handleInputChange} 
                  step={0.1}
                  unit="mg/kg/mnt"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aminosteril</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        name="aminoDose" 
                        value={inputs.aminoDose} 
                        onChange={handleInputChange}
                        step="0.1"
                        placeholder="0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        {([6, 10] as const).map(conc => (
                          <button
                            key={conc}
                            type="button"
                            onClick={() => setInputs(p => ({ ...p, aminoConcentration: conc }))}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              inputs.aminoConcentration === conc 
                              ? 'bg-white text-emerald-600 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {conc}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <InputGroup 
                    label="Smoflipid" 
                    name="lipidDose" 
                    value={inputs.lipidDose} 
                    onChange={handleInputChange} 
                    step={0.1}
                    unit="g/kg/hari"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InputGroup label="Glikofosfat" name="glikofosfatDose" value={inputs.glikofosfatDose} onChange={handleInputChange} unit="ml/kg" step={0.1} />
                  <InputGroup label="Soluvit" name="soluvitVolume" value={inputs.soluvitVolume} onChange={handleInputChange} unit="ml" />
                  <InputGroup label="Vitalipid" name="vitalipidVolume" value={inputs.vitalipidVolume} onChange={handleInputChange} unit="ml" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputGroup 
                    label="Ca Glukonat" 
                    name="caDose" 
                    value={inputs.caDose} 
                    onChange={handleInputChange} 
                    step={0.1}
                    unit="ml/kg"
                  />
                  <InputGroup 
                    label="KCl" 
                    name="kclDose" 
                    value={inputs.kclDose} 
                    onChange={handleInputChange} 
                    step={0.1}
                    unit="ml/kg"
                  />
                </div>

                <div className="pt-2">
                  <InputGroup 
                    label="Balance Cairan (BC)" 
                    name="balanceCairan" 
                    value={inputs.balanceCairan} 
                    onChange={handleInputChange} 
                    unit="ml"
                  />
                  <p className="text-[9px] text-slate-400 mt-1 italic font-medium">
                    *Jika BC positif, SISA (Infus) dikurangi 1/2 BC ({ (results.mainInfusionVolume < parseNumericInput(inputs.totalFluidPerDay) - results.totalOral - results.totalMeds) ? (0.5 * parseNumericInput(inputs.balanceCairan)).toFixed(1) : 0 } ml)
                  </p>
                </div>
                
                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Cairan Dasar</label>
                  <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    {(['D5 1/4 NS', 'D5 1/2 NS'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setInputs(p => ({ ...p, baseFluidType: type }))}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                          inputs.baseFluidType === type 
                          ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' 
                          : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: RESULTS */}
          <div className="lg:col-span-7 space-y-6">
            {/* Calorie Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-800">Cakupan Kalori</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Harian</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{(results.totalKcal || 0).toFixed(1)}</span>
                    <span className="text-sm font-bold text-slate-400 uppercase">kcal/hari</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100">
                      {(results.kcalPerKg || 0).toFixed(1)} kcal/kg/hari
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400 uppercase">Cakupan Oral</span>
                    <span className="text-slate-900">{(results.oralPercent || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400 uppercase">Cakupan Parenteral (Dextrose)</span>
                    <span className="text-slate-900">{(results.dextrosePercent || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400 uppercase">Cakupan Total (Oral + Dextrose)</span>
                    <span className="text-slate-900">{( (results.oralPercent || 0) + (results.dextrosePercent || 0) ).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold pt-2 border-t border-slate-50">
                    <span className="text-emerald-600 uppercase">Total Kalori (Semua Sumber)</span>
                    <span className="text-emerald-600">{(results.totalPercent || 0).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 space-y-2 text-[10px] font-bold">
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase">ASI × 0.7</span>
                    <span className="text-slate-900">{(results.asiKcalReport || 0).toFixed(1)} kkal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase">Formula × 0.8</span>
                    <span className="text-slate-900">{(results.formulaKcalReport || 0).toFixed(1)} kkal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase">Dextrose (Rumus Inf D)</span>
                    <span className="text-slate-900">{(results.dextroseKcalReport || 0).toFixed(1)} kkal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase">Protein (Aminosteril × 0.4)</span>
                    <span className="text-slate-900">{(results.proteinKcalReport || 0).toFixed(1)} kkal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase">Lipid (Smoflipid × 1.8)</span>
                    <span className="text-slate-900">{(results.lipidKcalReport || 0).toFixed(1)} kkal</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <PieChart size={18} className="text-blue-500" />
                    <h3 className="text-sm font-bold text-slate-800">Cakupan Cairan</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Distribusi</span>
                </div>
                <div className="space-y-6">
                      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${results.oralFluidPercent}%` }}
                        />
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${results.parenteralFluidPercent}%` }}
                        />
                      </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Oral</p>
                      <p className="text-sm font-bold text-blue-500">{(results.oralFluidPercent || 0).toFixed(0)}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Parenteral</p>
                      <p className="text-sm font-bold text-emerald-600">{(results.parenteralFluidPercent || 0).toFixed(0)}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                      <p className="text-sm font-bold text-slate-900">{(results.totalFluidPercent || 0).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Volume</p>
                  <p className="text-sm font-bold text-slate-900">{inputs.totalFluidPerDay} ml/hari</p>
                </div>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={JSON.stringify(results)}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 rounded-[2.5rem] p-5 md:p-10 text-white shadow-2xl relative overflow-hidden"
              >
                {/* Visual Accents */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6 md:mb-12">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Hasil Kalkulasi TPN</span>
                    </div>
                  </div>

                  {/* Main Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-10 mb-6 md:mb-12">
                    <ResultStat label="Main Infusion" value={results.mainInfusionVolume} unit="ml/hari" />
                    <ResultStat label="Tetesan Utama" value={results.mainRatePerHour} unit="cc/jam" />
                    <ResultStat label="Dextrose %" value={results.dPercent} unit="%" color="text-emerald-400" />
                  </div>

                  {/* Detailed Composition */}
                  <div className="space-y-6 md:space-y-10 mb-6 md:mb-12">
                    {/* Block 1: Main Infusion */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">1. Main Infusion ({(results.mainRatePerHour || 0).toFixed(1)} cc/jam)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <CompositionRow label={inputs.baseFluidType} value={results.finalBaseFluid} unit="ml" isBase useSmartRounding={useSmartRounding} />
                        <CompositionRow label="Dextrose 40% (D40)" value={results.finalD40} unit="ml" useSmartRounding={useSmartRounding} />
                        <CompositionRow label="KCl" value={results.finalKcl} unit="ml" useSmartRounding={useSmartRounding} />
                        <CompositionRow label="Ca Glukonat" value={results.finalCa} unit="ml" useSmartRounding={useSmartRounding} />
                        <CompositionRow label="Glikofosfat" value={results.finalGliko} unit="ml" useSmartRounding={useSmartRounding} />
                      </div>
                    </div>

                    {/* Block 2: Amino Acid */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">2. Amino Acid ({(results.aminoRatePerHour || 0).toFixed(1)} cc/jam)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <CompositionRow label={`Aminosteril ${inputs.aminoConcentration}%`} value={results.finalAmino} unit="ml" useSmartRounding={useSmartRounding} />
                      </div>
                    </div>

                    {/* Block 3: Lipid Infusion */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">3. Lipid Infusion ({(results.lipidRatePerHour || 0).toFixed(1)} cc/jam)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <CompositionRow label="Smoflipid 20%" value={results.finalLipid} unit="ml" useSmartRounding={useSmartRounding} />
                        <CompositionRow label="Soluvit" value={inputs.soluvitVolume} unit="ml" useSmartRounding={useSmartRounding} />
                        <CompositionRow label="Vitalipid" value={inputs.vitalipidVolume} unit="ml" useSmartRounding={useSmartRounding} />
                      </div>
                    </div>
                  </div>

                  {/* Final Equation */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-8 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <ClipboardCheck size={16} className="text-emerald-400" />
                      <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Format Peresepan (Moewardi)</h4>
                    </div>
                    
                    <div className="font-mono text-xs md:text-sm leading-relaxed text-slate-100 space-y-6">
                      <div>
                        <p className="text-emerald-400 font-bold mb-2 uppercase tracking-wider">1. INFUS UTAMA (D {(results.dPercent || 0).toFixed(1)}%, GIR {inputs.gir})</p>
                        <p className="bg-white/5 p-4 rounded-2xl border border-white/10 text-sm md:text-base">
                          {inputs.baseFluidType} <span className="text-white">{(results.finalBaseFluid || 0).toFixed(useSmartRounding ? 0 : 1)} ml</span> + 
                          D40 <span className="text-white">{(results.finalD40 || 0).toFixed(useSmartRounding ? 0 : 1)} ml</span> + 
                          KCl <span className="text-white">{(results.finalKcl || 0).toFixed(useSmartRounding ? 0 : 1)} ml</span> + 
                          CaGluc <span className="text-white">{(results.finalCa || 0).toFixed(useSmartRounding ? 0 : 1)} ml</span> + 
                          Glikofosfat <span className="text-white">{(results.finalGliko || 0).toFixed(useSmartRounding ? 0 : 1)} ml</span> = 
                          <span className="text-emerald-400 font-bold ml-2">{(results.mainInfusionVolume || 0).toFixed(0)} ml/hari ({(results.mainRatePerHour || 0).toFixed(1)} cc/jam)</span>
                        </p>
                      </div>

                      <div>
                        <p className="text-blue-400 font-bold mb-2 uppercase tracking-wider">2. INFUS AMINOSTERIL {inputs.aminoConcentration}%</p>
                        <p className="bg-white/5 p-4 rounded-2xl border border-white/10 text-sm md:text-base">
                          Aminosteril {inputs.aminoConcentration}% = <span className="text-blue-400 font-bold">{(results.finalAmino || 0).toFixed(useSmartRounding ? 0 : 1)} ml/hari ({(results.aminoRatePerHour || 0).toFixed(1)} cc/jam)</span>
                        </p>
                      </div>

                      <div>
                        <p className="text-amber-400 font-bold mb-2 uppercase tracking-wider">3. INFUS SMOFLIPID 20%</p>
                        <p className="bg-white/5 p-4 rounded-2xl border border-white/10 text-sm md:text-base">
                          Smoflipid 20% <span className="text-white">{(results.finalLipid || 0).toFixed(useSmartRounding ? 0 : 1)} ml</span> + 
                          Soluvit <span className="text-white">{soluvitVolumeValue.toFixed(useSmartRounding ? 0 : 1)} ml</span> + 
                          Vitalipid <span className="text-white">{vitalipidVolumeValue.toFixed(useSmartRounding ? 0 : 1)} ml</span> = 
                          <span className="text-amber-400 font-bold ml-2">{(results.totalLipidInfusion || 0).toFixed(0)} ml/hari ({(results.lipidRatePerHour || 0).toFixed(1)} cc/jam)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Alerts & Notes */}
            <div className="space-y-4">
              {results.isLowGIR && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm"
                >
                  <AlertCircle className="text-amber-600 shrink-0" size={24} />
                  <div>
                    <h5 className="text-sm font-bold text-amber-900 mb-1">Peringatan: D% Rendah</h5>
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                      Konsentrasi Dekstrosa ({(results.dPercent || 0).toFixed(2)}%) lebih rendah dari cairan dasar (5%). 
                      Naikkan GIR atau gunakan cairan dasar lain.
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="bg-white rounded-[2rem] p-5 md:p-8 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Info size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">Catatan Nutrisi</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parameter Nutrisi</p>
                    <ul className="text-[10px] text-slate-500 font-medium space-y-1">
                      <li>• Target Kalori: 120 kcal/kg/hari</li>
                      <li>• GIR Neo: 3 - 5 mg/kg/mnt (Mulai)</li>
                      <li>• Aminosteril: 2 - 4 g/kg/hari</li>
                      <li>• Smoflipid: 1 - 3 g/kg/hari</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Elektrolit & Mineral</p>
                    <ul className="text-[10px] text-slate-500 font-medium space-y-1">
                      <li>• KCl: 1 - 2 ml/kg</li>
                      <li>• Ca Glukonat: 2 ml/kg (Jika HipoCa)</li>
                      <li>• Glikofosfat: 1 ml/kg (1/2 Ca Gluk)</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rumus Darrow</p>
                    <ul className="text-[10px] text-slate-500 font-medium space-y-1">
                      <li>• 0-10 kg: 100 ml/kg</li>
                      <li>• 10-20 kg: 1000 + 50 ml/kg</li>
                      <li>• &gt;20 kg: 1500 + 20 ml/kg</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MilkReferenceModal 
        isOpen={isMilkModalOpen} 
        onClose={() => setIsMilkModalOpen(false)} 
      />
      <MilkReferenceModal 
        isOpen={isMilkModalOpen} 
        onClose={() => setIsMilkModalOpen(false)} 
      />
      <IcuCalculatorModal
        isOpen={isIcuModalOpen}
        onClose={() => setIsIcuModalOpen(false)}
      />
      <RdaCalculatorModal
        isOpen={isRdaModalOpen}
        onClose={() => setIsRdaModalOpen(false)}
      />
    </div>
  );
}

// Sub-components
function InputGroup({ label, name, value, onChange, unit, step = 1 }: { 
  label: string, 
  name: string, 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  unit: string,
  step?: number | string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative group">
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          step={step}
          placeholder="0"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none group-focus-within:text-emerald-500 transition-colors">
          {unit}
        </div>
      </div>
    </div>
  );
}

function ResultStat({ label, value, unit, color = "text-white" }: { label: string, value: number | string | undefined | null, unit: string, color?: string }) {
  const numValue = Number(value) || 0;
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold tracking-tight ${color}`}>
          {unit === 'ml/hari' ? numValue.toFixed(0) : numValue.toFixed(1)}
        </span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{unit}</span>
      </div>
    </div>
  );
}

function CompositionRow({ label, value, unit, isBase = false, useSmartRounding = true }: { label: string, value: number | string | undefined | null, unit: string, isBase?: boolean, useSmartRounding?: boolean }) {
  const numValue = Number(value) || 0;
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
      isBase 
      ? 'bg-emerald-500/5 border-emerald-500/10' 
      : 'bg-white/5 border-white/5'
    }`}>
      <span className={`text-xs font-bold ${isBase ? 'text-emerald-400' : 'text-slate-400'}`}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-white">{numValue.toFixed(useSmartRounding ? 0 : 1)}</span>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{unit}</span>
      </div>
    </div>
  );
}
