/**
 * Late Night Combat Robotics Calculator Suite - Type Definitions
 * Designed for SPARC v1.7 & NHRL competitions (Fairyweight, Antweight, Beetleweight, Big Bot 12/30 lb)
 */

export type WeightClassId = 'ant' | 'beetle' | 'bigbot';

export interface WeightClassInfo {
  id: WeightClassId;
  name: string;
  shortName: string;
  pluralName: string;
  weightGrams: number;
  weightLbs: number;
  description: string;
  recommendedS: [number, number]; // [min, max]
  maxVoltageWarningThreshold: number; // e.g. 48V per SPARC
}

export type BatteryChemistry = 'lipo' | 'lihv' | 'nimh';
export type VoltageState = 'nominal' | 'max';

export interface BatteryChemistryConfig {
  id: BatteryChemistry;
  label: string;
  nominalPerCell: number;
  maxPerCell: number;
}

export type ToolCategory = 'electronics' | 'mechanical';
export type ToolType =
  | 'drivetrain'
  | 'weapon'
  | 'weapon-whatif'
  | 'spinup'
  | 'capacitance'
  | 'battery'
  | 'center-distance';

// Unit options
export type LengthUnit = 'mm' | 'in';
export type MassUnit = 'kg' | 'lbs' | 'g' | 'oz';
export type SpeedUnit = 'm/s' | 'mph' | 'ft/s' | 'km/h';
export type EnergyUnit = 'J' | 'ft-lbs';
export type TorqueUnit = 'N*m' | 'oz-in' | 'in-lbs';
export type MoiUnit = 'kg*m^2' | 'g*cm^2' | 'lb*in^2';

// Commercial blade MOI presets
export interface BladeMoiPreset {
  id: string;
  name: string;
  weightClass: WeightClassId;
  moiKgM2: number;
  effectiveDiameterMm: number;
  massKg: number;
  description: string;
}

export interface MotorPreset {
  id: string;
  name: string;
  category: 'drive' | 'weapon' | 'both';
  weightClasses: WeightClassId[];
  kv: number;
  gearRatio?: number;
  internalResistanceOhms?: number;
  ratedVoltage?: number;
  maxAmps?: number;
  massGrams?: number;
  notes?: string;
}

export interface BeltPitchPreset {
  id: string;
  name: string;
  pitchMm: number;
  type: 'belt' | 'chain';
  description: string;
}

export interface GearboxPreset {
  id: string;
  name: string;
  ratio: number;
  brand: string;
  weightClasses: WeightClassId[];
  description?: string;
}

// State interface for Drivetrain
export interface DrivetrainState {
  motorPresetId: string;
  motorKv: number;
  manualRpmOverride: number | null;
  cellCount: number;
  gearRatio: number; // gearbox reduction ratio (e.g. 14 for 14:1)
  gearboxPresetId?: string; // big bot gearbox preset
  externalInputTeeth?: number; // external driver teeth (e.g. 16)
  externalOutputTeeth?: number; // external driven teeth (e.g. 16)
  wheelDiameter: number; // in current unit
  wheelDiameterUnit: LengthUnit;
  efficiencyPercent: number; // default 85%
  speedUnit?: 'ft/s' | 'mph';
}

// State interface for Weapon (simplified to MOI & Effective Diameter)
export interface WeaponState {
  moiPresetId: string;
  moi?: number; // current value in moiUnit
  moiKgM2: number;
  moiUnit?: MoiUnit;
  effectiveDiameter: number;
  effectiveDiameterUnit: LengthUnit;
  weaponMass?: number;
  weaponMassUnit?: MassUnit;
  motorPresetId: string;
  motorKv: number;
  manualRpmOverride: number | null;
  cellCount: number;
  gearRatio: number; // driven / driver
  inputTeeth?: number; // driver / motor pulley teeth
  outputTeeth?: number; // driven / weapon pulley teeth
  pulleyPresetId?: string;
}

// State interface for Electronics & Spin-Up
export interface SpinUpState {
  motorKv: number;
  cellCount: number;
  gearRatio: number;
  motorResistance: number; // Ohms
  batteryResistancePerCell: number; // Ohms (typically 0.008 = 8 mOhm)
  escWiringResistance: number; // Ohms (typically 0.005)
  moi?: number; // current value in moiUnit
  moiKgM2: number;
  moiUnit?: MoiUnit;
  useWeaponTabMoi: boolean;
  useWeaponTabMotorKv?: boolean;
  useWeaponTabGearRatio?: boolean;
  timeHorizonSec: number; // 3 to 5 sec
}

export type BeltDriveType = 'toothed' | 'smooth-vbelt';
export type SizingMode = 'teeth' | 'circumference' | 'center-distance';

// State interface for Center Distance
export interface CenterDistanceState {
  pitchPresetId: string;
  customPitchMm: number;
  smallPulleyTeeth: number;
  largePulleyTeeth: number;
  beltTeeth: number; // belt size in tooth count (determines center-to-center)
  desiredCenterDistance?: number;
  desiredCenterDistanceUnit?: LengthUnit;
  beltType?: BeltDriveType;
  sizingMode?: SizingMode;
  beltOuterCircumferenceMm?: number;
  driverDiameterMm?: number;
  drivenDiameterMm?: number;
}

// State interface for Battery Runtime
export interface BatteryRuntimeState {
  cellCount: number;
  batteryCapacityMah: number;
  driveMotorCount: number;
  avgDriveCurrentAmps: number;
  weaponMotorCount: number;
  avgWeaponCurrentAmps: number;
  auxCurrentAmps: number;
  matchDurationSec: number;
  reserveMarginPercent: number;
}

// State interface for Capacitance Calculator
export interface CapacitanceState {
  wireLength: number;
  wireLengthUnit: LengthUnit;
  peakCurrentAmps: number;
  allowableRippleVolts: number;
  safetyFactor: number;
  cellCount: number;
}

// Interfaces for Weapon What-If Tool
export interface WeaponWhatIfFamily {
  id: string;
  name: string;
  brand: string;
  variants: { id: string; name: string; kv: number }[];
}

export interface WeaponWhatIfState {
  selectedFamilyId: string;
  customKvsText: string;
  minCells: number;
  maxCells: number;
  speedUnit: 'mph' | 'm/s' | 'ft/s';
}
