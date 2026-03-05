
/**
 * TPN Calculation Service
 * Handles core logic for neonatal TPN calculations.
 */

export interface TPNCalculationInputs {
  weight: number;
  weightUnit: 'kg' | 'g';
  totalFluidPerDay: number;
  asiVolume: number;
  asiFrequency: number;
  suforVolume: number;
  suforFrequency: number;
  medsVolume: number;
  medsFrequency: number;
  aminoDose: number;
  aminoConcentration: number;
  lipidDose: number;
  balanceCairan: number;
  glikofosfatDose: number;
  soluvitVolume: number;
  vitalipidVolume: number;
  gir: number;
  caDose: number;
  kclDose: number;
  baseFluidType: string;
  useSmartRounding: boolean;
}

const ASI_KCAL_MULTIPLIER = 0.7;
const FORMULA_KCAL_MULTIPLIER = 0.8;
const PROTEIN_KCAL_MULTIPLIER = 0.4;
const LIPID_KCAL_MULTIPLIER = 1.8;

export const calculateWeightInKg = (weight: number, unit: 'kg' | 'g'): number => {
  return unit === 'g' ? weight / 1000 : weight;
};

export const calculateOralAndMeds = (
  asiVol: number,
  asiFreq: number,
  suforVol: number,
  suforFreq: number,
  medsVol: number, 
  medsFreq: number
) => {
  const totalAsiOral = asiFreq > 0 ? (24 / asiFreq) * asiVol : 0;
  const totalSuforOral = suforFreq > 0 ? (24 / suforFreq) * suforVol : 0;
  const totalOral = totalAsiOral + totalSuforOral;
  const totalMeds = medsFreq * medsVol;
  return { totalAsiOral, totalSuforOral, totalOral, totalMeds };
};

export const calculateAminoVolume = (
  aminoDose: number, 
  weightInKg: number, 
  concentration: number
): number => {
  if (concentration <= 0) return 0;
  return (aminoDose * weightInKg) / (concentration / 100);
};

export const calculateLipidVolume = (
  lipidDose: number, 
  weightInKg: number
): number => {
  // Smoflipid 20% (20g/100ml)
  return (lipidDose * weightInKg) / 0.2;
};

export const calculateDextrosePercent = (
  gir: number, 
  weightInKg: number, 
  ratePerHour: number
): number => {
  return ratePerHour > 0 ? (gir * weightInKg * 6) / ratePerHour : 0;
};

export const calculateElectrolytes = (
  caDose: number, 
  kclDose: number, 
  weightInKg: number
) => {
  return {
    caVolume: caDose * weightInKg,
    kclVolume: kclDose * weightInKg
  };
};

export const calculateCalories = (
  finalBaseFluid: number,
  finalD40: number,
  aminoDoseVal: number,
  lipidDoseVal: number,
  weightInKg: number,
  totalAsiOral: number,
  totalSuforOral: number
) => {
  // Parenteral Dextrose Calories (3.4 kcal/g)
  const totalDextroseGrams = (finalBaseFluid * 0.05) + (finalD40 * 0.4);
  const dextroseKcal = totalDextroseGrams * 3.4;
  
  // Amino Calories (4 kcal/g)
  const aminoKcal = aminoDoseVal * weightInKg * 4;
  
  // Lipid Calories (Smoflipid 20% is 2 kcal/ml, 1g is 5ml, so 1g is 10 kcal)
  const lipidKcal = lipidDoseVal * weightInKg * 10;

  const parenteralKcal = dextroseKcal + aminoKcal + lipidKcal;
  
  // Oral Calories (ASI: 0.67, Sufor: 1.0)
  const oralKcal = (totalAsiOral * 0.67) + (totalSuforOral * 1.0);
  
  const totalKcal = parenteralKcal + oralKcal;
  const kcalPerKg = weightInKg > 0 ? totalKcal / weightInKg : 0;
  
  return {
    dextroseKcal,
    aminoKcal,
    lipidKcal,
    parenteralKcal,
    oralKcal,
    totalKcal,
    kcalPerKg
  };
};

export const calculateTPN = (inputs: TPNCalculationInputs) => {
  const {
    weight,
    weightUnit,
    totalFluidPerDay,
    asiVolume,
    asiFrequency,
    suforVolume,
    suforFrequency,
    medsVolume,
    medsFrequency,
    aminoDose,
    aminoConcentration,
    lipidDose,
    balanceCairan,
    glikofosfatDose,
    soluvitVolume,
    vitalipidVolume,
    gir,
    caDose,
    kclDose,
    useSmartRounding
  } = inputs;

  const weightInKg = calculateWeightInKg(weight, weightUnit);
  const { totalAsiOral, totalSuforOral, totalOral, totalMeds } = calculateOralAndMeds(
    asiVolume,
    asiFrequency,
    suforVolume,
    suforFrequency,
    medsVolume,
    medsFrequency
  );
  
  const aminoVolume = calculateAminoVolume(aminoDose, weightInKg, aminoConcentration);
  const lipidVolume = calculateLipidVolume(lipidDose, weightInKg);

  const totalAminoInfusion = aminoVolume;
  const totalLipidInfusion = lipidVolume + soluvitVolume + vitalipidVolume;

  const bcAdjustment = balanceCairan > 0 ? (0.5 * balanceCairan) : 0;
  const mainInfusionVolume = Math.max(0, totalFluidPerDay - totalOral - totalMeds - totalAminoInfusion - totalLipidInfusion - bcAdjustment);
  
  const mainRatePerHour = mainInfusionVolume / 24;
  const aminoRatePerHour = totalAminoInfusion / 24;
  const lipidRatePerHour = totalLipidInfusion / 24;
  
  // Step 5: Determine D%, formula: (GIR * BB * 6) / (cc/j)
  // The image uses the rounded rate (1 decimal) for this calculation
  const mainRatePerHourRounded = Math.round(mainRatePerHour * 10) / 10;
  const dPercent = mainRatePerHourRounded > 0 ? (gir * weightInKg * 6) / mainRatePerHourRounded : 0;
  
  const rawD40 = dPercent > 5 ? ((dPercent - 5) / 35) * mainInfusionVolume : 0;
  const { caVolume: rawCa, kclVolume: rawKcl } = calculateElectrolytes(caDose, kclDose, weightInKg);
  const rawGliko = glikofosfatDose * weightInKg;
  
  let finalD40 = rawD40;
  let finalCa = rawCa;
  let finalKcl = rawKcl;
  let finalGliko = rawGliko;
  let finalAmino = totalAminoInfusion;
  let finalLipid = lipidVolume;
  
  if (useSmartRounding) {
    finalD40 = Math.round(rawD40);
    finalCa = Math.round(rawCa);
    finalKcl = Math.round(rawKcl);
    finalGliko = Math.round(rawGliko);
    finalAmino = Math.round(totalAminoInfusion);
    finalLipid = Math.round(lipidVolume);
  }
  
  const finalBaseFluid = Math.max(0, mainInfusionVolume - finalD40 - finalCa - finalKcl - finalGliko);

  const asiKcalReport = totalAsiOral * ASI_KCAL_MULTIPLIER;
  const formulaKcalReport = totalSuforOral * FORMULA_KCAL_MULTIPLIER;
  const dextroseBaseVolume = finalBaseFluid + finalD40;
  const dextroseKcalReport = (dextroseBaseVolume * (4 * dPercent)) / 100;
  const proteinKcalReport = finalAmino * PROTEIN_KCAL_MULTIPLIER;
  const lipidKcalReport = finalLipid * LIPID_KCAL_MULTIPLIER;

  const calResults = calculateCalories(
    finalBaseFluid,
    finalD40,
    aminoDose,
    lipidDose,
    weightInKg,
    totalAsiOral,
    totalSuforOral
  );

  const kebutuhanKaloriTotal = 120 * weightInKg;
  const dextrosePercent = kebutuhanKaloriTotal > 0 ? (calResults.dextroseKcal / kebutuhanKaloriTotal) * 100 : 0;
  const aminoPercent = kebutuhanKaloriTotal > 0 ? (calResults.aminoKcal / kebutuhanKaloriTotal) * 100 : 0;
  const lipidPercent = kebutuhanKaloriTotal > 0 ? (calResults.lipidKcal / kebutuhanKaloriTotal) * 100 : 0;
  const parenteralPercent = kebutuhanKaloriTotal > 0 ? (calResults.parenteralKcal / kebutuhanKaloriTotal) * 100 : 0;
  const oralPercent = kebutuhanKaloriTotal > 0 ? (calResults.oralKcal / kebutuhanKaloriTotal) * 100 : 0;
  const totalPercent = kebutuhanKaloriTotal > 0 ? (calResults.totalKcal / kebutuhanKaloriTotal) * 100 : 0;

  const parenteralFluidPercent = totalFluidPerDay > 0 ? (mainInfusionVolume / totalFluidPerDay) * 100 : 0;
  const oralFluidPercent = totalFluidPerDay > 0 ? (totalOral / totalFluidPerDay) * 100 : 0;
  const totalFluidPercent = totalFluidPerDay > 0 ? ((mainInfusionVolume + totalOral) / totalFluidPerDay) * 100 : 0;

  return {
    weightInKg,
    totalAsiOral,
    totalSuforOral,
    totalOral,
    totalMeds,
    mainInfusionVolume,
    totalAminoInfusion,
    totalLipidInfusion,
    mainRatePerHour,
    aminoRatePerHour,
    lipidRatePerHour,
    dPercent,
    finalD40,
    finalCa,
    finalKcl,
    finalGliko,
    finalAmino,
    finalLipid,
    finalBaseFluid,
    asiKcalReport,
    formulaKcalReport,
    dextroseKcalReport,
    proteinKcalReport,
    lipidKcalReport,
    ...calResults,
    kebutuhanKaloriTotal,
    dextrosePercent,
    aminoPercent,
    lipidPercent,
    parenteralPercent,
    oralPercent,
    totalPercent,
    parenteralFluidPercent,
    oralFluidPercent,
    totalFluidPercent,
    isLowGIR: dPercent < 5 && mainInfusionVolume > 0
  };
};
