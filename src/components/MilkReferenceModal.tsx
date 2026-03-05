import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Droplets, Scale, Zap } from 'lucide-react';

interface MilkData {
  name: string;
  scoopWeight: string;
  caloriesPerScoop: string;
  waterPerScoop: string;
  kcalPerMl: string;
  note?: string;
}

const milkData: MilkData[] = [
  { name: 'SGM gain 100', scoopWeight: '4.2 gr', caloriesPerScoop: '22', waterPerScoop: '18 ml', kcalPerMl: '1', note: '' },
  { name: 'SGM optigrow', scoopWeight: '11.5 gr', caloriesPerScoop: '53', waterPerScoop: '45 ml', kcalPerMl: '1', note: '' },
  { name: 'SGM ananda 0-6 bulan', scoopWeight: '4.4 gr', caloriesPerScoop: '22', waterPerScoop: '30 ml', kcalPerMl: '0.67', note: '' },
  { name: 'Isokal', scoopWeight: '14 gr', caloriesPerScoop: '-', waterPerScoop: '50 ml', kcalPerMl: '1', note: '' },
  { name: 'Peptamen junior', scoopWeight: '7.8 gr', caloriesPerScoop: '-', waterPerScoop: '30 ml', kcalPerMl: '1', note: 'MCT 51%' },
  { name: 'Nutri baby royal pepti', scoopWeight: '4.2 gr', caloriesPerScoop: '22', waterPerScoop: '30 ml', kcalPerMl: '0.67', note: 'MCT 40%' },
  { name: 'Neocate LCP', scoopWeight: '4.6 gr', caloriesPerScoop: '22', waterPerScoop: '30 ml', kcalPerMl: '0.67', note: '' },
  { name: 'SGM LLM+ Bebas Laktosa', scoopWeight: '4.4 gr', caloriesPerScoop: '22', waterPerScoop: '30 ml', kcalPerMl: '0.67', note: '' },
  { name: 'SGM eksplore 1+', scoopWeight: '11.6 gr', caloriesPerScoop: '-', waterPerScoop: '70 ml', kcalPerMl: '0.68', note: '' },
  { name: 'Dancow 1+', scoopWeight: '11.6 gr', caloriesPerScoop: '-', waterPerScoop: '65 ml', kcalPerMl: '0.84', note: '' },
  { name: 'Vidoran xmart 1+', scoopWeight: '11.6 gr', caloriesPerScoop: '-', waterPerScoop: '60 ml', kcalPerMl: '0.84', note: '' },
  { name: 'Chilmill', scoopWeight: '5.8 gr', caloriesPerScoop: '-', waterPerScoop: '40 ml', kcalPerMl: '0.7', note: '' },
  { name: 'Pediasure', scoopWeight: '9.7 gr', caloriesPerScoop: '-', waterPerScoop: '48 ml', kcalPerMl: '0.78', note: '' },
  { name: 'Pediasure komplit', scoopWeight: '9.8 gr', caloriesPerScoop: '-', waterPerScoop: '38 ml', kcalPerMl: '1', note: '' },
  { name: 'Nutrinidrink', scoopWeight: '-', caloriesPerScoop: '-', waterPerScoop: '28 ml', kcalPerMl: '1.5', note: '' },
  { name: 'Infantrini', scoopWeight: '5 gr', caloriesPerScoop: '25', waterPerScoop: '22 ml', kcalPerMl: '1.13', note: '' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MilkReferenceModal({ isOpen, onClose }: Props) {
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-[2rem] shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Konversi Kalori Scoop Susu</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Referensi data RSDM</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {milkData.map((milk, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all group">
                    <h3 className="font-bold text-slate-800 mb-3 group-hover:text-emerald-600 transition-colors">{milk.name}</h3>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Scale size={14} />
                          <span>1 Scoop</span>
                        </div>
                        <span className="font-bold text-slate-700">{milk.scoopWeight}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Droplets size={14} />
                          <span>Air / Scoop</span>
                        </div>
                        <span className="font-bold text-slate-700">{milk.waterPerScoop}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Zap size={14} />
                          <span>Kalori / ml</span>
                        </div>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {milk.kcalPerMl} kkal
                        </span>
                      </div>

                      {milk.note && (
                        <div className="pt-2 mt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-wider">
                            {milk.note}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
