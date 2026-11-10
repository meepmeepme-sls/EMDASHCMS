/**
 * Late Night Combat Robotics Calculator Suite - Unit Conversion Engine
 * Default SI internal representations with lossless field-level conversion
 */

import { LengthUnit, MassUnit, SpeedUnit, EnergyUnit, MoiUnit } from '../types';

// Length conversions
export function lengthToMm(val: number, unit: LengthUnit): number {
  if (unit === 'in') {
    return val * 25.4;
  }
  return val;
}

export function mmToUnit(valMm: number, targetUnit: LengthUnit): number {
  if (targetUnit === 'in') {
    return valMm / 25.4;
  }
  return valMm;
}

export function lengthToM(val: number, unit: LengthUnit): number {
  return lengthToMm(val, unit) / 1000.0;
}

// Mass conversions
export function massToKg(val: number, unit: MassUnit): number {
  switch (unit) {
    case 'lbs':
      return val * 0.45359237;
    case 'g':
      return val / 1000.0;
    case 'oz':
      return val * 0.028349523;
    case 'kg':
    default:
      return val;
  }
}

export function kgToUnit(valKg: number, targetUnit: MassUnit): number {
  switch (targetUnit) {
    case 'lbs':
      return valKg / 0.45359237;
    case 'g':
      return valKg * 1000.0;
    case 'oz':
      return valKg / 0.028349523;
    case 'kg':
    default:
      return valKg;
  }
}

// Mass Moment of Inertia (MOI) conversions (kg*m^2 internal SI)
// 1 kg*m^2 = 10,000,000 g*cm^2
// 1 lb*in^2 = 0.45359237 kg * (0.0254 m)^2 = 0.0002926396534292 kg*m^2
export const KG_M2_PER_LB_IN2 = 0.0002926396534292;
export const G_CM2_PER_KG_M2 = 10000000;

export function moiToKgM2(val: number, unit: MoiUnit | string): number {
  switch (unit) {
    case 'g*cm^2':
      return val / G_CM2_PER_KG_M2;
    case 'lb*in^2':
      return val * KG_M2_PER_LB_IN2;
    case 'kg*m^2':
    default:
      return val;
  }
}

export function kgM2ToUnit(valKgM2: number, targetUnit: MoiUnit | string): number {
  switch (targetUnit) {
    case 'g*cm^2':
      return valKgM2 * G_CM2_PER_KG_M2;
    case 'lb*in^2':
      return valKgM2 / KG_M2_PER_LB_IN2;
    case 'kg*m^2':
    default:
      return valKgM2;
  }
}

// Speed conversions (m/s internal)
export function speedToMs(val: number, unit: SpeedUnit): number {
  switch (unit) {
    case 'mph':
      return val * 0.44704;
    case 'ft/s':
      return val * 0.3048;
    case 'km/h':
      return val * (1000.0 / 3600.0);
    case 'm/s':
    default:
      return val;
  }
}

export function msToUnit(valMs: number, targetUnit: SpeedUnit): number {
  switch (targetUnit) {
    case 'mph':
      return valMs / 0.44704;
    case 'ft/s':
      return valMs / 0.3048;
    case 'km/h':
      return valMs * 3.6;
    case 'm/s':
    default:
      return valMs;
  }
}

// Energy conversions (Joules internal)
export function energyToJoules(val: number, unit: EnergyUnit): number {
  if (unit === 'ft-lbs') {
    return val * 1.3558179;
  }
  return val;
}

export function joulesToUnit(valJ: number, targetUnit: EnergyUnit): number {
  if (targetUnit === 'ft-lbs') {
    return valJ / 1.3558179;
  }
  return valJ;
}

// Formatting helper
export function formatNum(num: number, decimals = 2): string {
  if (isNaN(num) || !isFinite(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
