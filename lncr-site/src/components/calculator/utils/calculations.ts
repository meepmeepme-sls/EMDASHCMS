/**
 * Late Night Combat Robotics Calculator Suite - Physical Math Engines
 * Validated against Level 5 Robotics and Run Amok Combat Robotics benchmarks
 */

import type { BatteryChemistry, VoltageState, DrivetrainState, WeaponState, SpinUpState, CenterDistanceState, BatteryRuntimeState, CapacitanceState } from '../types';
import {
  BATTERY_CHEMISTRIES,
  NHRL_TIP_SPEED_LIMIT_MPH,
  SPARC_MAX_UNAPPROVED_VOLTAGE,
} from './constants';
import { lengthToMm, massToKg, moiToKgM2 } from './conversions';

/**
 * Calculates battery pack voltage based on cell count, chemistry, and state.
 */
export function calculatePackVoltage(
  cellCount: number,
  chemistry: BatteryChemistry,
  state: VoltageState
): number {
  const config = BATTERY_CHEMISTRIES[chemistry] || BATTERY_CHEMISTRIES.lipo;
  const perCell = state === 'nominal' ? config.nominalPerCell : config.maxPerCell;
  return cellCount * perCell;
}

/**
 * Checks if a pack voltage exceeds SPARC v1.7 48V threshold.
 */
export function checkSparcVoltageStatus(voltage: number): {
  isOver48V: boolean;
  threshold: number;
} {
  return {
    isOver48V: voltage > SPARC_MAX_UNAPPROVED_VOLTAGE,
    threshold: SPARC_MAX_UNAPPROVED_VOLTAGE,
  };
}

// -------------------------------------------------------------
// 1. DRIVETRAIN CALCULATOR ENGINE
// -------------------------------------------------------------
export interface DrivetrainResults {
  packVoltage: number;
  motorRpm: number;
  wheelRpm: number;
  gearboxRatio: number;
  externalRatio: number;
  totalRatio: number;
  theoreticalSpeedMs: number;
  theoreticalSpeedMph: number;
  theoreticalSpeedFts: number;
  theoreticalSpeedKmh: number;
  loadedSpeedMs: number;
  loadedSpeedMph: number;
  loadedSpeedFts: number;
  loadedSpeedKmh: number;
  wheelCircumferenceMm: number;
  isOver48V: boolean;
}

export function computeDrivetrain(
  params: DrivetrainState,
  chemistry: BatteryChemistry,
  voltageState: VoltageState,
  directVoltageOverride?: number
): DrivetrainResults {
  const packVoltage =
    directVoltageOverride !== undefined && directVoltageOverride > 0
      ? directVoltageOverride
      : calculatePackVoltage(params.cellCount, chemistry, voltageState);
  const motorRpm =
    params.manualRpmOverride !== null && params.manualRpmOverride > 0
      ? params.manualRpmOverride
      : params.motorKv * packVoltage;

  const gearboxRatio = params.gearRatio > 0 ? params.gearRatio : 1;
  const inTeeth = params.externalInputTeeth && params.externalInputTeeth > 0 ? params.externalInputTeeth : 1;
  const outTeeth = params.externalOutputTeeth && params.externalOutputTeeth > 0 ? params.externalOutputTeeth : 1;
  const externalRatio = outTeeth / inTeeth;
  const totalRatio = gearboxRatio * externalRatio;
  const wheelRpm = motorRpm / (totalRatio > 0 ? totalRatio : 1);

  const wheelDiameterMm = lengthToMm(params.wheelDiameter, params.wheelDiameterUnit);
  const wheelCircumferenceMm = Math.PI * wheelDiameterMm;
  const wheelCircumferenceM = wheelCircumferenceMm / 1000.0;

  // Speeds
  const theoreticalSpeedMs = (wheelRpm * wheelCircumferenceM) / 60.0;
  const loadedSpeedMs = theoreticalSpeedMs * (params.efficiencyPercent / 100.0);

  return {
    packVoltage,
    motorRpm,
    wheelRpm,
    gearboxRatio,
    externalRatio,
    totalRatio,
    theoreticalSpeedMs,
    theoreticalSpeedMph: theoreticalSpeedMs / 0.44704,
    theoreticalSpeedFts: theoreticalSpeedMs / 0.3048,
    theoreticalSpeedKmh: theoreticalSpeedMs * 3.6,
    loadedSpeedMs,
    loadedSpeedMph: loadedSpeedMs / 0.44704,
    loadedSpeedFts: loadedSpeedMs / 0.3048,
    loadedSpeedKmh: loadedSpeedMs * 3.6,
    wheelCircumferenceMm,
    isOver48V: packVoltage > SPARC_MAX_UNAPPROVED_VOLTAGE,
  };
}

// -------------------------------------------------------------
// 2. WEAPON KINETIC ENERGY & TIP SPEED ENGINE (Direct MOI & Effective Diameter)
// -------------------------------------------------------------
export interface WeaponResults {
  packVoltage: number;
  motorRpm: number;
  weaponRpm: number;
  angularVelocityRadS: number;
  totalMassKg: number;
  totalMoiKgM2: number;
  kineticEnergyJoules: number;
  kineticEnergyFtLbs: number;
  tipRadiusMm: number;
  effectiveDiameterMm: number;
  gearRatio: number;
  tipSpeedMs: number;
  tipSpeedMph: number;
  nhrlLimitMph: number;
  isOverNhrlLimit: boolean;
  nhrlLimitPercentage: number;
  isOver48V: boolean;
}

export function computeWeapon(
  params: WeaponState,
  chemistry: BatteryChemistry,
  voltageState: VoltageState,
  cellCountOverride?: number,
  directVoltageOverride?: number
): WeaponResults {
  const cells = cellCountOverride !== undefined ? cellCountOverride : params.cellCount;
  const packVoltage =
    directVoltageOverride !== undefined && directVoltageOverride > 0
      ? directVoltageOverride
      : calculatePackVoltage(cells, chemistry, voltageState);
  const motorRpm =
    params.manualRpmOverride !== null && params.manualRpmOverride > 0
      ? params.manualRpmOverride
      : params.motorKv * packVoltage;

  const inTeeth = params.inputTeeth && params.inputTeeth > 0 ? params.inputTeeth : 1;
  const outTeeth = params.outputTeeth && params.outputTeeth > 0 ? params.outputTeeth : 1;
  const ratio = params.inputTeeth !== undefined && params.outputTeeth !== undefined
    ? outTeeth / inTeeth
    : params.gearRatio > 0
    ? params.gearRatio
    : 1;
  const weaponRpm = motorRpm / (ratio > 0 ? ratio : 1);
  const angularVelocityRadS = (weaponRpm * 2 * Math.PI) / 60.0;

  const rawMoi = params.moiUnit
    ? moiToKgM2(params.moi ?? params.moiKgM2, params.moiUnit)
    : params.moiKgM2;
  const totalMoiKgM2 = Math.max(rawMoi, 0.000001);
  const effectiveDiameterMm = lengthToMm(params.effectiveDiameter, params.effectiveDiameterUnit);
  const tipRadiusMm = effectiveDiameterMm / 2.0;
  const totalMassKg = massToKg(params.weaponMass ?? 0, params.weaponMassUnit ?? 'g');

  // Kinetic Energy (Joules) = 0.5 * J * w^2
  const kineticEnergyJoules = 0.5 * totalMoiKgM2 * Math.pow(angularVelocityRadS, 2);
  const kineticEnergyFtLbs = kineticEnergyJoules / 1.3558179;

  // Tip speed
  const tipRadiusM = tipRadiusMm / 1000.0;
  const tipSpeedMs = angularVelocityRadS * tipRadiusM;
  const tipSpeedMph = tipSpeedMs / 0.44704;

  const isOverNhrlLimit = tipSpeedMph > NHRL_TIP_SPEED_LIMIT_MPH;
  const nhrlLimitPercentage = (tipSpeedMph / NHRL_TIP_SPEED_LIMIT_MPH) * 100.0;

  return {
    packVoltage,
    motorRpm,
    weaponRpm,
    angularVelocityRadS,
    totalMassKg,
    totalMoiKgM2,
    kineticEnergyJoules,
    kineticEnergyFtLbs,
    tipRadiusMm,
    effectiveDiameterMm,
    gearRatio: ratio,
    tipSpeedMs,
    tipSpeedMph,
    nhrlLimitMph: NHRL_TIP_SPEED_LIMIT_MPH,
    isOverNhrlLimit,
    nhrlLimitPercentage,
    isOver48V: packVoltage > SPARC_MAX_UNAPPROVED_VOLTAGE,
  };
}

// -------------------------------------------------------------
// 3. ADVANCED ELECTRONICS & SPIN-UP DYNAMICS ENGINE
// -------------------------------------------------------------
export interface SpinUpPoint {
  timeSec: number;
  rpm: number;
  energyJoules: number;
  percentage: number;
}

export interface SpinUpResults {
  packVoltage: number;
  freeRpm: number;
  freeRadS: number;
  ktNmPerAmp: number;
  systemResistanceOhms: number;
  stallCurrentAmps: number;
  stallTorqueNm: number;
  stallTorqueOzIn: number;
  tauSec: number;
  timeTo63PercentSec: number;
  timeTo86PercentSec: number;
  timeTo95PercentSec: number;
  maxStoredEnergyJoules: number;
  energyAt95Joules: number;
  curvePoints: SpinUpPoint[];
  isOver48V: boolean;
}

export function computeSpinUp(
  params: SpinUpState,
  chemistry: BatteryChemistry,
  voltageState: VoltageState,
  weaponMoiKgM2: number,
  weaponMotorKv?: number,
  weaponGearRatio?: number,
  cellCountOverride?: number,
  directVoltageOverride?: number
): SpinUpResults {
  const cells = cellCountOverride !== undefined ? cellCountOverride : params.cellCount;
  const packVoltage =
    directVoltageOverride !== undefined && directVoltageOverride > 0
      ? directVoltageOverride
      : calculatePackVoltage(cells, chemistry, voltageState);
  const rawCustomMoi = params.moiUnit
    ? moiToKgM2(params.moi ?? params.moiKgM2, params.moiUnit)
    : params.moiKgM2;
  const useMoi = params.useWeaponTabMoi !== false;
  const effectiveMoi = useMoi ? weaponMoiKgM2 : rawCustomMoi;
  const safeMoi = Math.max(effectiveMoi, 0.000001);

  const useKv = params.useWeaponTabMotorKv !== false && weaponMotorKv !== undefined;
  const effectiveMotorKv = useKv ? weaponMotorKv : params.motorKv;
  const safeMotorKv = Math.max(effectiveMotorKv, 1);

  const useGr = params.useWeaponTabGearRatio !== false && weaponGearRatio !== undefined;
  const effectiveGearRatio = useGr ? weaponGearRatio : params.gearRatio;
  const ratio = effectiveGearRatio > 0 ? effectiveGearRatio : 1;

  const motorFreeRpm = safeMotorKv * packVoltage;
  const weaponFreeRpm = motorFreeRpm / ratio;
  const freeRadS = (weaponFreeRpm * 2 * Math.PI) / 60.0;

  // Torque constant: Kt = 60 / (2 * pi * Kv) [N*m / A]
  const ktNmPerAmp = 60.0 / (2.0 * Math.PI * safeMotorKv);
  const ke = ktNmPerAmp; // Back-EMF constant in V / (rad/s)

  // System resistance: (cells * R_cell) + R_motor + R_esc
  const effectiveCellCount =
    directVoltageOverride !== undefined && directVoltageOverride > 0
      ? Math.max(1, Math.round(packVoltage / 3.7))
      : cells;
  const batteryRi = effectiveCellCount * params.batteryResistancePerCell;
  const systemResistanceOhms = batteryRi + params.motorResistance + params.escWiringResistance;
  const safeRsys = Math.max(systemResistanceOhms, 0.001);

  // Stall dynamics
  const stallCurrentAmps = packVoltage / safeRsys;
  const motorStallTorqueNm = ktNmPerAmp * stallCurrentAmps;
  const weaponStallTorqueNm = motorStallTorqueNm * ratio;
  const stallTorqueOzIn = weaponStallTorqueNm * 141.6119;

  // Mechanical time constant tau:
  // tau = (J * R_sys) / (Kt * Ke * ratio^2)
  const tauSec = (safeMoi * safeRsys) / (ktNmPerAmp * ke * Math.pow(ratio, 2));

  const timeTo63PercentSec = tauSec;
  const timeTo86PercentSec = 2 * tauSec;
  const timeTo95PercentSec = 3 * tauSec;

  const maxStoredEnergyJoules = 0.5 * safeMoi * Math.pow(freeRadS, 2);
  const energyAt95Joules = maxStoredEnergyJoules * Math.pow(0.95, 2);

  // Generate curve points for SVG graphing
  const curvePoints: SpinUpPoint[] = [];
  const maxTime = Math.max(params.timeHorizonSec || 3.5, timeTo95PercentSec * 1.3);
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * maxTime;
    const fraction = 1 - Math.exp(-t / tauSec);
    const rpm = weaponFreeRpm * fraction;
    const radS = (rpm * 2 * Math.PI) / 60.0;
    const energy = 0.5 * safeMoi * Math.pow(radS, 2);
    curvePoints.push({
      timeSec: t,
      rpm,
      energyJoules: energy,
      percentage: fraction * 100,
    });
  }

  return {
    packVoltage,
    freeRpm: weaponFreeRpm,
    freeRadS,
    ktNmPerAmp,
    systemResistanceOhms,
    stallCurrentAmps,
    stallTorqueNm: weaponStallTorqueNm,
    stallTorqueOzIn,
    tauSec,
    timeTo63PercentSec,
    timeTo86PercentSec,
    timeTo95PercentSec,
    maxStoredEnergyJoules,
    energyAt95Joules,
    curvePoints,
    isOver48V: packVoltage > SPARC_MAX_UNAPPROVED_VOLTAGE,
  };
}

// -------------------------------------------------------------
// 4. CENTER DISTANCE ENGINE (TIMING BELT & CHAIN)
// -------------------------------------------------------------
export interface CenterDistanceResults {
  pitchMm: number;
  smallPitchDiameterMm: number;
  largePitchDiameterMm: number;
  ratio: number;
  beltTeeth: number;
  beltPitchLengthMm: number;
  beltPitchLengthIn: number;
  actualCenterDistanceMm: number;
  actualCenterDistanceIn: number;
  teethInMesh: number;
  wrapAngleDeg: number;
  isMeshSafe: boolean; // >= 6 teeth
  isTooShort: boolean;
  minBeltTeeth: number;
  desiredCenterDistanceMm: number;
  approximateBeltTeeth: number;
  recommendedBeltTeeth: number;
  deltaDistanceMm: number;
}

export function computeCenterDistance(params: CenterDistanceState): CenterDistanceResults {
  const p = params.customPitchMm > 0 ? params.customPitchMm : 2.0;
  const isSmooth = params.beltType === 'smooth-vbelt';
  const sizingMode = params.sizingMode || 'teeth';

  let smallPitchDiameterMm = 0;
  let largePitchDiameterMm = 0;
  let ratio = 1;
  let minZ = 1;
  let maxZ = 1;

  if (isSmooth) {
    const d1 = Math.max(params.driverDiameterMm || 20, 5);
    const d2 = Math.max(params.drivenDiameterMm || 40, 5);
    smallPitchDiameterMm = Math.min(d1, d2);
    largePitchDiameterMm = Math.max(d1, d2);
    ratio = largePitchDiameterMm / smallPitchDiameterMm;
    minZ = Math.round((smallPitchDiameterMm * Math.PI) / p);
    maxZ = Math.round((largePitchDiameterMm * Math.PI) / p);
  } else {
    const z1 = Math.max(params.smallPulleyTeeth || 16, 1);
    const z2 = Math.max(params.largePulleyTeeth || 16, 1);
    minZ = Math.min(z1, z2);
    maxZ = Math.max(z1, z2);
    smallPitchDiameterMm = (minZ * p) / Math.PI;
    largePitchDiameterMm = (maxZ * p) / Math.PI;
    ratio = minZ > 0 ? maxZ / minZ : 1;
  }

  const minBeltTeeth = Math.ceil((minZ + maxZ) / 2.0 + (2.0 * Math.SQRT2 * (maxZ - minZ)) / Math.PI) + 1;

  let beltTeeth = Math.max(Math.round(params.beltTeeth || 70), 1);
  let beltPitchLengthMm = beltTeeth * p;

  if (sizingMode === 'circumference' && params.beltOuterCircumferenceMm && params.beltOuterCircumferenceMm > 0) {
    beltPitchLengthMm = params.beltOuterCircumferenceMm;
    beltTeeth = Math.max(Math.round(beltPitchLengthMm / p), 1);
  } else if (sizingMode === 'center-distance' && params.desiredCenterDistance && params.desiredCenterDistance > 0) {
    const c = lengthToMm(params.desiredCenterDistance, params.desiredCenterDistanceUnit || 'mm');
    const dSum = smallPitchDiameterMm + largePitchDiameterMm;
    const dDiff = largePitchDiameterMm - smallPitchDiameterMm;
    const calcL = 2 * c + (Math.PI / 2) * dSum + (dDiff * dDiff) / (4 * Math.max(c, 1));
    beltPitchLengthMm = calcL;
    beltTeeth = Math.max(Math.round(beltPitchLengthMm / p), 1);
  } else {
    beltTeeth = Math.max(Math.round(params.beltTeeth || 70), 1);
    beltPitchLengthMm = beltTeeth * p;
  }

  const beltPitchLengthIn = beltPitchLengthMm / 25.4;
  const effectiveN = beltPitchLengthMm / p;
  const b = 2 * effectiveN - (minZ + maxZ);
  const radical = Math.pow(b, 2) - (8 * Math.pow(maxZ - minZ, 2)) / Math.pow(Math.PI, 2);

  const isTooShort = radical < 0 || beltTeeth < minBeltTeeth;

  let actualCenterDistanceMm = 0;
  let teethInMesh = 0;
  let wrapAngleDeg = 180;

  if (!isTooShort) {
    actualCenterDistanceMm = (p / 8.0) * (b + Math.sqrt(radical));
    const diameterDiff = largePitchDiameterMm - smallPitchDiameterMm;
    const sinArg = Math.min(Math.max(diameterDiff / (2 * Math.max(actualCenterDistanceMm, 0.001)), -1), 1);
    wrapAngleDeg = 180 - 2 * (Math.asin(sinArg) * (180 / Math.PI));
    teethInMesh = isSmooth ? 180 : (wrapAngleDeg / 360.0) * minZ;
  } else {
    actualCenterDistanceMm = (largePitchDiameterMm + smallPitchDiameterMm) / 2.0;
    teethInMesh = isSmooth ? 90 : minZ / 2;
  }

  const actualCenterDistanceIn = actualCenterDistanceMm / 25.4;
  const isMeshSafe = isSmooth || (!isTooShort && teethInMesh >= 6);

  const cdMm = actualCenterDistanceMm;

  return {
    pitchMm: p,
    smallPitchDiameterMm,
    largePitchDiameterMm,
    ratio,
    beltTeeth,
    beltPitchLengthMm,
    beltPitchLengthIn,
    actualCenterDistanceMm,
    actualCenterDistanceIn,
    teethInMesh,
    wrapAngleDeg,
    isMeshSafe,
    isTooShort,
    minBeltTeeth,
    desiredCenterDistanceMm: cdMm,
    approximateBeltTeeth: beltTeeth,
    recommendedBeltTeeth: beltTeeth,
    deltaDistanceMm: 0,
  };
}

// -------------------------------------------------------------
// 5. BATTERY SIZING & RUN-TIME ENGINE
// -------------------------------------------------------------
export interface BatteryRuntimeResults {
  packNominalVoltage: number;
  packMaxVoltage: number;
  totalAvgCurrentAmps: number;
  driveCurrentAmps: number;
  weaponCurrentAmps: number;
  capacityConsumedMah: number;
  recommendedCapacityMah: number;
  packWattHours: number;
  estimatedFullMatchRuntimeMin: number;
  airlineStatus: 'allowed' | 'requires_approval' | 'prohibited';
  isOver48V: boolean;
}

export function computeBatteryRuntime(
  params: BatteryRuntimeState,
  chemistry: BatteryChemistry,
  directVoltageOverride?: number
): BatteryRuntimeResults {
  const packNominalVoltage =
    directVoltageOverride !== undefined && directVoltageOverride > 0
      ? directVoltageOverride
      : calculatePackVoltage(params.cellCount, chemistry, 'nominal');
  const packMaxVoltage =
    directVoltageOverride !== undefined && directVoltageOverride > 0
      ? directVoltageOverride
      : calculatePackVoltage(params.cellCount, chemistry, 'max');

  const driveCurrentAmps = params.driveMotorCount * params.avgDriveCurrentAmps;
  const weaponCurrentAmps = params.weaponMotorCount * params.avgWeaponCurrentAmps;
  const totalAvgCurrentAmps = driveCurrentAmps + weaponCurrentAmps + params.auxCurrentAmps;

  const matchHours = params.matchDurationSec / 3600.0;
  const capacityConsumedAh = totalAvgCurrentAmps * matchHours;
  const capacityConsumedMah = capacityConsumedAh * 1000.0;

  const marginMultiplier = 1.0 + params.reserveMarginPercent / 100.0;
  const recommendedCapacityMah = capacityConsumedMah * marginMultiplier;

  const actualPackAh = params.batteryCapacityMah / 1000.0;
  const packWattHours = actualPackAh * packNominalVoltage;

  const estimatedFullMatchRuntimeMin =
    totalAvgCurrentAmps > 0 ? (actualPackAh / totalAvgCurrentAmps) * 60.0 : 0;

  let airlineStatus: 'allowed' | 'requires_approval' | 'prohibited' = 'allowed';
  if (packWattHours > 160) {
    airlineStatus = 'prohibited';
  } else if (packWattHours > 100) {
    airlineStatus = 'requires_approval';
  }

  return {
    packNominalVoltage,
    packMaxVoltage,
    totalAvgCurrentAmps,
    driveCurrentAmps,
    weaponCurrentAmps,
    capacityConsumedMah,
    recommendedCapacityMah,
    packWattHours,
    estimatedFullMatchRuntimeMin,
    airlineStatus,
    isOver48V: packMaxVoltage > SPARC_MAX_UNAPPROVED_VOLTAGE,
  };
}

// -------------------------------------------------------------
// 5. RECOMMENDED CAPACITANCE ENGINE (ESC Wire Inductance & Ripple Suppression)
// -------------------------------------------------------------
export interface CapacitanceResults {
  packVoltage: number;
  maxPackVoltage: number;
  wireLengthMm: number;
  wireLengthIn: number;
  loopInductanceNanoHenrys: number;
  recommendedCapacitanceUf: number;
  theoreticalMinCapacitanceUf: number;
  baseBulkCapacitanceUf: number;
  recommendedVoltageRatingVolts: number;
  unfilteredSpikeVolts: number;
  suggestedPackConfig: string;
  isWireExcessive: boolean;
  isOver48V: boolean;
}

export function computeCapacitance(
  params: CapacitanceState,
  chemistry: BatteryChemistry,
  voltageState: VoltageState,
  directVoltageOverride?: number
): CapacitanceResults {
  const packVoltage =
    directVoltageOverride !== undefined && directVoltageOverride > 0
      ? directVoltageOverride
      : calculatePackVoltage(params.cellCount, chemistry, voltageState);
  const maxPackVoltage =
    directVoltageOverride !== undefined && directVoltageOverride > 0
      ? directVoltageOverride
      : calculatePackVoltage(params.cellCount, chemistry, 'max');

  const wireLengthMm = lengthToMm(params.wireLength, params.wireLengthUnit);
  const wireLengthIn = wireLengthMm / 25.4;

  // Typical paired/twisted power lead inductance: ~25 nH per inch (~1 nH per mm)
  const loopInductanceH = wireLengthMm * 1.0e-9;
  const loopInductanceNanoHenrys = wireLengthMm; // in nH

  const I = Math.max(params.peakCurrentAmps, 1);
  const deltaV = Math.max(params.allowableRippleVolts, 0.1);
  const k = Math.max(params.safetyFactor, 1.5);

  // Energy-balance: 1/2 * C * (deltaV)^2 >= k * (1/2 * L * I^2)
  // C >= k * L * I^2 / (deltaV)^2
  const theoreticalMinCapF = (k * loopInductanceH * (I * I)) / (deltaV * deltaV);
  const theoreticalMinCapacitanceUf = theoreticalMinCapF * 1.0e6;

  // Empirical combat robotics rule of thumb:
  // Base: ~8 uF per Amp of peak current
  // Plus: ~220 uF per 4 inches of DC lead length beyond 2 inches
  const baseCurrentCapUf = I * 8.0;
  const lengthExtensionUf = Math.max(0, wireLengthIn - 2.0) * 55.0;
  const empiricalCapUf = baseCurrentCapUf + lengthExtensionUf;

  const finalCapUf = Math.max(theoreticalMinCapacitanceUf, empiricalCapUf, 220);
  const recommendedCapacitanceUf = Math.ceil(finalCapUf / 50) * 50;

  // Minimum capacitor voltage rating (at least 1.4x to 1.5x max battery voltage)
  let recommendedVoltageRatingVolts = 25;
  if (maxPackVoltage > 65) recommendedVoltageRatingVolts = 100;
  else if (maxPackVoltage > 45) recommendedVoltageRatingVolts = 63;
  else if (maxPackVoltage > 30) recommendedVoltageRatingVolts = 50;
  else if (maxPackVoltage > 20) recommendedVoltageRatingVolts = 35;
  else recommendedVoltageRatingVolts = 25;

  // Expected unfiltered voltage spike without supplemental capacitance
  const assumedOnboardCapF = 100.0e-6;
  const unfilteredSpikeVolts = I * Math.sqrt(loopInductanceH / assumedOnboardCapF);

  // Suggested bank arrangement
  let suggestedPackConfig = '';
  if (recommendedCapacitanceUf <= 330) {
    suggestedPackConfig = `1x 330µF Low-ESR (${recommendedVoltageRatingVolts}V)`;
  } else if (recommendedCapacitanceUf <= 500) {
    suggestedPackConfig = `1x 470µF or 2x 220µF Low-ESR (${recommendedVoltageRatingVolts}V)`;
  } else if (recommendedCapacitanceUf <= 1000) {
    suggestedPackConfig = `2x 470µF or 3x 330µF Low-ESR (${recommendedVoltageRatingVolts}V)`;
  } else if (recommendedCapacitanceUf <= 2000) {
    suggestedPackConfig = `3x 680µF or 4x 470µF Low-ESR (${recommendedVoltageRatingVolts}V)`;
  } else {
    const numCaps = Math.ceil(recommendedCapacitanceUf / 680);
    suggestedPackConfig = `${numCaps}x 680µF Low-ESR (${recommendedVoltageRatingVolts}V) in parallel`;
  }

  return {
    packVoltage,
    maxPackVoltage,
    wireLengthMm,
    wireLengthIn,
    loopInductanceNanoHenrys,
    recommendedCapacitanceUf,
    theoreticalMinCapacitanceUf,
    baseBulkCapacitanceUf: empiricalCapUf,
    recommendedVoltageRatingVolts,
    unfilteredSpikeVolts,
    suggestedPackConfig,
    isWireExcessive: wireLengthMm > 200,
    isOver48V: packVoltage > SPARC_MAX_UNAPPROVED_VOLTAGE,
  };
}
