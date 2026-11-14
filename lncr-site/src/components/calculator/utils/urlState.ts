/**
 * Late Night Combat Robotics Calculator Suite - URL Query Parameter State Synchronization
 * Enables hyper-compact link sharing in pit chats, forums, and Discord
 * Adheres to Option 1: Delta-Encoding + Short Key Aliases with 100% Backwards Compatibility.
 */

import {
  ToolType,
  WeightClassId,
  BatteryChemistry,
  VoltageState,
  DrivetrainState,
  WeaponState,
  SpinUpState,
  CenterDistanceState,
  BatteryRuntimeState,
  CapacitanceState,
} from '../types';
import { getWeightClassDefaults } from './constants';

export interface GlobalAppState {
  theme?: 'light' | 'dark';
  activeTool: ToolType;
  weightClass: WeightClassId;
  chemistry: BatteryChemistry;
  voltageState: VoltageState;
  hasWeaponBattery: boolean;
  weaponChemistry: BatteryChemistry;
  weaponCellCount: number;
  useDirectVoltage?: boolean;
  directVoltage?: number;
  useWeaponDirectVoltage?: boolean;
  weaponDirectVoltage?: number;
  extendedPreset?: boolean;
  drivetrain: DrivetrainState;
  weapon: WeaponState;
  spinup: SpinUpState;
  capacitance: CapacitanceState;
  centerDistance: CenterDistanceState;
  batteryRuntime: BatteryRuntimeState;
}

// Compact Tool Code Mapping
const TOOL_TO_CODE: Record<ToolType, string> = {
  drivetrain: 'd',
  weapon: 'w',
  spinup: 's',
  'center-distance': 'c',
  battery: 'b',
  capacitance: 'cap',
};

const CODE_TO_TOOL: Record<string, ToolType> = {
  d: 'drivetrain',
  drivetrain: 'drivetrain',
  w: 'weapon',
  weapon: 'weapon',
  s: 'spinup',
  spinup: 'spinup',
  c: 'center-distance',
  'center-distance': 'center-distance',
  b: 'battery',
  battery: 'battery',
  cap: 'capacitance',
  capacitance: 'capacitance',
};

// Compact Weight Class Code Mapping
const WC_TO_CODE: Record<WeightClassId, string> = {
  ant: 'a',
  beetle: 'b',
  bigbot: 'bb',
};

const CODE_TO_WC: Record<string, WeightClassId> = {
  a: 'ant',
  ant: 'ant',
  b: 'beetle',
  beetle: 'beetle',
  bb: 'bigbot',
  bigbot: 'bigbot',
  fairy: 'ant', // legacy fallback
};

// Compact Chemistry Code Mapping
const CHEM_TO_CODE: Record<BatteryChemistry, string> = {
  lipo: 'lp',
  lihv: 'lh',
  nimh: 'ni',
};

const CODE_TO_CHEM: Record<string, BatteryChemistry> = {
  lp: 'lipo',
  lipo: 'lipo',
  lh: 'lihv',
  lihv: 'lihv',
  ni: 'nimh',
  nimh: 'nimh',
};

/**
 * Serializes state to a hyper-compact query string using delta-encoding against defaults.
 */
export function serializeStateToUrl(state: GlobalAppState): string {
  const params = new URLSearchParams();
  const d = getWeightClassDefaults(state.weightClass);
  const defaultDriveCells = d.driveCellCount ?? 4;
  const defaultWeaponCells = d.weaponCellCount ?? 4;

  // Global Context Deltas
  if (state.theme === 'dark') {
    params.set('th', 'dark');
  }
  if (state.activeTool !== 'drivetrain') {
    params.set('t', TOOL_TO_CODE[state.activeTool]);
  }
  if (state.weightClass !== 'beetle') {
    params.set('w', WC_TO_CODE[state.weightClass]);
  }
  if (state.chemistry !== 'lipo') {
    params.set('c', CHEM_TO_CODE[state.chemistry]);
  }
  if (state.voltageState === 'max') {
    params.set('vs', 'max');
  }
  if (state.drivetrain.cellCount !== defaultDriveCells) {
    params.set('ds', String(state.drivetrain.cellCount));
  }
  if (state.hasWeaponBattery) {
    params.set('wb', '1');
    if (state.weaponChemistry !== 'lipo') {
      params.set('wbc', CHEM_TO_CODE[state.weaponChemistry]);
    }
    if (state.weaponCellCount !== defaultWeaponCells) {
      params.set('wbs', String(state.weaponCellCount));
    }
    if (state.useWeaponDirectVoltage) {
      params.set('wbvd', '1');
      params.set('wbvv', String(state.weaponDirectVoltage ?? 14.8));
    }
  }
  if (state.useDirectVoltage) {
    params.set('vd', '1');
    params.set('vv', String(state.directVoltage ?? 14.8));
  }
  if (state.extendedPreset) {
    params.set('ext', '1');
  }

  // Tool Specific Deltas
  if (state.activeTool === 'drivetrain') {
    if (state.drivetrain.motorPresetId && state.drivetrain.motorPresetId !== d.driveMotorPresetId) {
      params.set('dm', state.drivetrain.motorPresetId);
    }
    if (state.drivetrain.motorKv !== d.driveKv) {
      params.set('dk', String(state.drivetrain.motorKv));
    }
    if (state.drivetrain.cellCount !== defaultDriveCells) {
      params.set('ds', String(state.drivetrain.cellCount));
    }
    if (state.drivetrain.gearRatio !== d.driveGearRatio) {
      params.set('dr', String(state.drivetrain.gearRatio));
    }
    if (state.drivetrain.gearboxPresetId !== (d.driveGearboxPresetId || undefined)) {
      if (state.drivetrain.gearboxPresetId) {
        params.set('dg', state.drivetrain.gearboxPresetId);
      }
    }
    if (state.drivetrain.wheelDiameter !== 50.8 || state.drivetrain.wheelDiameterUnit !== 'mm') {
      params.set('dd', String(state.drivetrain.wheelDiameter));
      if (state.drivetrain.wheelDiameterUnit !== 'mm') {
        params.set('du', state.drivetrain.wheelDiameterUnit);
      }
    }
    if (state.drivetrain.efficiencyPercent !== 85) {
      params.set('de', String(state.drivetrain.efficiencyPercent));
    }
    if (state.drivetrain.externalInputTeeth !== undefined && state.drivetrain.externalInputTeeth !== 1) {
      params.set('din', String(state.drivetrain.externalInputTeeth));
    }
    if (state.drivetrain.externalOutputTeeth !== undefined && state.drivetrain.externalOutputTeeth !== 1) {
      params.set('dout', String(state.drivetrain.externalOutputTeeth));
    }
    if (state.drivetrain.speedUnit && state.drivetrain.speedUnit !== 'ft/s') {
      params.set('dsu', state.drivetrain.speedUnit);
    }
  } else if (state.activeTool === 'weapon') {
    if (state.weapon.motorPresetId && state.weapon.motorPresetId !== d.weaponMotorPresetId) {
      params.set('wm', state.weapon.motorPresetId);
    }
    if (state.weapon.motorKv !== d.weaponKv) {
      params.set('wk', String(state.weapon.motorKv));
    }
    if (state.weapon.cellCount !== defaultWeaponCells) {
      params.set('ws', String(state.weapon.cellCount));
    }
    if (state.weapon.gearRatio !== d.weaponGearRatio) {
      params.set('wr', String(state.weapon.gearRatio));
    }
    if (state.weapon.effectiveDiameter !== d.effectiveDiameter) {
      params.set('wd', String(state.weapon.effectiveDiameter));
    }
    if (state.weapon.effectiveDiameterUnit !== d.effectiveDiameterUnit) {
      params.set('wdu', state.weapon.effectiveDiameterUnit);
    }
    if (state.weapon.moiKgM2 !== d.moiKgM2) {
      params.set('wi', String(state.weapon.moiKgM2));
    }
    if (state.weapon.moiUnit && state.weapon.moiUnit !== 'kg*m^2') {
      params.set('wiu', state.weapon.moiUnit);
    }
    if (state.weapon.moi !== undefined && state.weapon.moi !== state.weapon.moiKgM2) {
      params.set('wiv', String(state.weapon.moi));
    }
    if (state.weapon.moiPresetId && state.weapon.moiPresetId !== 'custom') {
      params.set('wpre', state.weapon.moiPresetId);
    }
    if (state.weapon.pulleyPresetId && state.weapon.pulleyPresetId !== 'custom') {
      params.set('wppre', state.weapon.pulleyPresetId);
    }
    if (state.weapon.inputTeeth !== undefined && state.weapon.inputTeeth !== 16) {
      params.set('win', String(state.weapon.inputTeeth));
    }
    if (state.weapon.outputTeeth !== undefined && state.weapon.outputTeeth !== 16) {
      params.set('wout', String(state.weapon.outputTeeth));
    }
    if (state.weapon.weaponMass !== undefined) {
      params.set('wmass', String(state.weapon.weaponMass));
    }
    if (state.weapon.weaponMassUnit && state.weapon.weaponMassUnit !== 'lbs') {
      params.set('wmassu', state.weapon.weaponMassUnit);
    }
  } else if (state.activeTool === 'spinup') {
    if (state.spinup.useWeaponTabMotorKv === false) {
      params.set('suwk', '0');
      if (state.spinup.motorKv !== d.weaponKv) {
        params.set('sk', String(state.spinup.motorKv));
      }
    }
    if (state.spinup.cellCount !== defaultWeaponCells) {
      params.set('ss', String(state.spinup.cellCount));
    }
    if (state.spinup.useWeaponTabGearRatio === false) {
      params.set('suwr', '0');
      if (state.spinup.gearRatio !== d.weaponGearRatio) {
        params.set('sr', String(state.spinup.gearRatio));
      }
    }
    if (state.spinup.motorResistance !== 0.035) {
      params.set('srm', String(state.spinup.motorResistance));
    }
    if (state.spinup.batteryResistancePerCell !== 0.008) {
      params.set('src', String(state.spinup.batteryResistancePerCell));
    }
    if (state.spinup.escWiringResistance !== 0.005) {
      params.set('sre', String(state.spinup.escWiringResistance));
    }
    if (state.spinup.useWeaponTabMoi === false) {
      params.set('suw', '0');
      if (state.spinup.moiKgM2 !== d.moiKgM2) {
        params.set('si', String(state.spinup.moiKgM2));
      }
      if (state.spinup.moiUnit && state.spinup.moiUnit !== 'kg*m^2') {
        params.set('siu', state.spinup.moiUnit);
      }
      if (state.spinup.moi !== undefined && state.spinup.moi !== state.spinup.moiKgM2) {
        params.set('siv', String(state.spinup.moi));
      }
    }
  } else if (state.activeTool === 'capacitance') {
    if (state.capacitance.wireLength !== 150) {
      params.set('cw', String(state.capacitance.wireLength));
    }
    if (state.capacitance.wireLengthUnit && state.capacitance.wireLengthUnit !== 'mm') {
      params.set('cwu', state.capacitance.wireLengthUnit);
    }
    if (state.capacitance.peakCurrentAmps !== 45) {
      params.set('ca', String(state.capacitance.peakCurrentAmps));
    }
    if (state.capacitance.allowableRippleVolts !== 1.0) {
      params.set('cr', String(state.capacitance.allowableRippleVolts));
    }
    if (state.capacitance.safetyFactor !== 3.0) {
      params.set('ck', String(state.capacitance.safetyFactor));
    }
    if (state.capacitance.cellCount !== defaultDriveCells) {
      params.set('cs', String(state.capacitance.cellCount));
    }
  } else if (state.activeTool === 'center-distance') {
    if (state.centerDistance.pitchPresetId && state.centerDistance.pitchPresetId !== 'gt2') {
      params.set('cp', state.centerDistance.pitchPresetId);
    }
    if (state.centerDistance.pitchPresetId === 'custom' && state.centerDistance.customPitchMm !== 2.0) {
      params.set('cpm', String(state.centerDistance.customPitchMm));
    }
    if (state.centerDistance.smallPulleyTeeth !== 16) {
      params.set('cz1', String(state.centerDistance.smallPulleyTeeth));
    }
    if (state.centerDistance.largePulleyTeeth !== 16) {
      params.set('cz2', String(state.centerDistance.largePulleyTeeth));
    }
    if (state.centerDistance.beltTeeth !== undefined && state.centerDistance.beltTeeth !== 70) {
      params.set('cbt', String(state.centerDistance.beltTeeth));
    }
    if (state.centerDistance.desiredCenterDistance !== undefined && state.centerDistance.desiredCenterDistance !== 65) {
      params.set('cd', String(state.centerDistance.desiredCenterDistance));
    }
    if (state.centerDistance.desiredCenterDistanceUnit && state.centerDistance.desiredCenterDistanceUnit !== 'mm') {
      params.set('cdu', state.centerDistance.desiredCenterDistanceUnit);
    }
  } else if (state.activeTool === 'battery') {
    if (state.batteryRuntime.cellCount !== defaultDriveCells) {
      params.set('bs', String(state.batteryRuntime.cellCount));
    }
    if (state.batteryRuntime.batteryCapacityMah !== 850) {
      params.set('bcap', String(state.batteryRuntime.batteryCapacityMah));
    }
    if (state.batteryRuntime.driveMotorCount !== 2) {
      params.set('bdm', String(state.batteryRuntime.driveMotorCount));
    }
    if (state.batteryRuntime.avgDriveCurrentAmps !== 4.5) {
      params.set('bda', String(state.batteryRuntime.avgDriveCurrentAmps));
    }
    if (state.batteryRuntime.weaponMotorCount !== 1) {
      params.set('bwm', String(state.batteryRuntime.weaponMotorCount));
    }
    if (state.batteryRuntime.avgWeaponCurrentAmps !== 18.0) {
      params.set('bwa', String(state.batteryRuntime.avgWeaponCurrentAmps));
    }
    if (state.batteryRuntime.matchDurationSec !== 180) {
      params.set('bdur', String(state.batteryRuntime.matchDurationSec));
    }
    if (state.batteryRuntime.reserveMarginPercent !== 20) {
      params.set('bres', String(state.batteryRuntime.reserveMarginPercent));
    }
  }

  const str = params.toString();
  // If no deltas exist from default beetle drivetrain, preserve '?t=d' so recipient explicitly loads clean defaults
  return str ? `?${str}` : '?t=d';
}

/**
 * Parses application state from URL query parameters.
 * Supports short aliases (Option 1) while retaining full backwards compatibility with legacy parameters.
 */
export function parseStateFromUrl(search: string, fallback: GlobalAppState): GlobalAppState {
  if (!search || search.length < 2) return fallback;
  const p = new URLSearchParams(search);

  const state: GlobalAppState = JSON.parse(JSON.stringify(fallback));

  // Determine weight class first to load appropriate baseline defaults
  const rawWc = p.get('w') || p.get('wc');
  if (rawWc && CODE_TO_WC[rawWc]) {
    const targetWc = CODE_TO_WC[rawWc];
    if (targetWc !== state.weightClass) {
      state.weightClass = targetWc;
      const d = getWeightClassDefaults(targetWc);
      const defaultDriveCells = d.driveCellCount ?? 4;
      const defaultWeaponCells = d.weaponCellCount ?? 4;
      state.drivetrain.motorPresetId = d.driveMotorPresetId;
      state.drivetrain.motorKv = d.driveKv;
      state.drivetrain.gearRatio = d.driveGearRatio;
      state.drivetrain.gearboxPresetId = d.driveGearboxPresetId;
      state.drivetrain.cellCount = defaultDriveCells;
      state.weapon.motorPresetId = d.weaponMotorPresetId;
      state.weapon.motorKv = d.weaponKv;
      state.weapon.gearRatio = d.weaponGearRatio;
      state.weapon.cellCount = defaultWeaponCells;
      state.weaponCellCount = defaultWeaponCells;
      state.weapon.effectiveDiameter = d.effectiveDiameter;
      state.weapon.effectiveDiameterUnit = d.effectiveDiameterUnit;
      state.weapon.moiKgM2 = d.moiKgM2;
      state.weapon.moi = d.moiKgM2;
      state.spinup.motorKv = d.weaponKv;
      state.spinup.gearRatio = d.weaponGearRatio;
      state.spinup.cellCount = defaultWeaponCells;
      state.spinup.moiKgM2 = d.moiKgM2;
      state.spinup.moi = d.moiKgM2;
      state.capacitance.cellCount = defaultDriveCells;
      state.batteryRuntime.cellCount = defaultDriveCells;
    }
  }

  // Global Context
  const th = p.get('th') || p.get('theme');
  if (th === 'light' || th === 'dark') {
    state.theme = th;
  }
  const rawTool = p.get('t') || p.get('tool');
  if (rawTool && CODE_TO_TOOL[rawTool]) {
    state.activeTool = CODE_TO_TOOL[rawTool];
  }
  const rawChem = p.get('c') || p.get('chem');
  if (rawChem && CODE_TO_CHEM[rawChem]) {
    state.chemistry = CODE_TO_CHEM[rawChem];
  }
  const rawVs = p.get('vs') || p.get('vstate');
  if (rawVs === 'nominal' || rawVs === 'nom') {
    state.voltageState = 'nominal';
  } else if (rawVs === 'max') {
    state.voltageState = 'max';
  }

  if (p.has('wb') || p.has('wb_on')) {
    state.hasWeaponBattery = (p.get('wb') === '1' || p.get('wb_on') === '1');
  }
  const rawWbChem = p.get('wbc') || p.get('wb_chem');
  if (rawWbChem && CODE_TO_CHEM[rawWbChem]) {
    state.weaponChemistry = CODE_TO_CHEM[rawWbChem];
  }
  if (p.has('wbs') || p.has('wb_s')) {
    state.weaponCellCount = Number(p.get('wbs') || p.get('wb_s')) || state.weaponCellCount;
  }
  if (p.has('vd') || p.has('v_dir')) {
    state.useDirectVoltage = (p.get('vd') === '1' || p.get('v_dir') === '1');
  }
  if (p.has('vv') || p.has('v_val')) {
    state.directVoltage = Number(p.get('vv') || p.get('v_val')) || 14.8;
  }
  if (p.has('wbvd') || p.has('wb_dir')) {
    state.useWeaponDirectVoltage = (p.get('wbvd') === '1' || p.get('wb_dir') === '1');
  }
  if (p.has('wbvv') || p.has('wb_v')) {
    state.weaponDirectVoltage = Number(p.get('wbvv') || p.get('wb_v')) || 14.8;
  }
  if (p.has('ext')) {
    state.extendedPreset = p.get('ext') === '1';
  }

  // Drivetrain
  if (p.has('dk') || p.has('d_kv')) state.drivetrain.motorKv = Number(p.get('dk') || p.get('d_kv')) || state.drivetrain.motorKv;
  if (p.has('ds') || p.has('d_s')) state.drivetrain.cellCount = Number(p.get('ds') || p.get('d_s')) || state.drivetrain.cellCount;
  if (p.has('dr') || p.has('d_ratio')) state.drivetrain.gearRatio = Number(p.get('dr') || p.get('d_ratio')) || state.drivetrain.gearRatio;
  if (p.has('din') || p.has('d_in')) state.drivetrain.externalInputTeeth = Number(p.get('din') || p.get('d_in')) || state.drivetrain.externalInputTeeth;
  if (p.has('dout') || p.has('d_out')) state.drivetrain.externalOutputTeeth = Number(p.get('dout') || p.get('d_out')) || state.drivetrain.externalOutputTeeth;
  if (p.has('dd') || p.has('d_dia')) state.drivetrain.wheelDiameter = Number(p.get('dd') || p.get('d_dia')) || state.drivetrain.wheelDiameter;
  if (p.has('du') || p.has('d_dunit')) state.drivetrain.wheelDiameterUnit = (p.get('du') || p.get('d_dunit')) as any;
  if (p.has('de') || p.has('d_eff')) state.drivetrain.efficiencyPercent = Number(p.get('de') || p.get('d_eff')) || state.drivetrain.efficiencyPercent;
  if (p.has('dm') || p.has('d_mpre')) state.drivetrain.motorPresetId = (p.get('dm') || p.get('d_mpre')) || state.drivetrain.motorPresetId;
  if (p.has('dg') || p.has('d_gpre')) state.drivetrain.gearboxPresetId = (p.get('dg') || p.get('d_gpre')) || undefined;
  if (p.has('dsu') || p.has('d_sunit')) state.drivetrain.speedUnit = (p.get('dsu') || p.get('d_sunit')) as any;

  // Weapon
  if (p.has('wi') || p.has('w_moi')) state.weapon.moiKgM2 = Number(p.get('wi') || p.get('w_moi')) || state.weapon.moiKgM2;
  if (p.has('wiu') || p.has('w_moiu')) state.weapon.moiUnit = (p.get('wiu') || p.get('w_moiu')) as any;
  if (p.has('wiv') || p.has('w_moiv')) state.weapon.moi = Number(p.get('wiv') || p.get('w_moiv')) || state.weapon.moi;
  if (p.has('wd') || p.has('w_dia')) state.weapon.effectiveDiameter = Number(p.get('wd') || p.get('w_dia')) || state.weapon.effectiveDiameter;
  if (p.has('wdu') || p.has('w_diaunit')) state.weapon.effectiveDiameterUnit = (p.get('wdu') || p.get('w_diaunit')) as any;
  if (p.has('wmass') || p.has('w_mass')) state.weapon.weaponMass = Number(p.get('wmass') || p.get('w_mass')) || state.weapon.weaponMass;
  if (p.has('wmassu') || p.has('w_massunit')) state.weapon.weaponMassUnit = (p.get('wmassu') || p.get('w_massunit')) as any;
  if (p.has('wpre') || p.has('w_pre')) state.weapon.moiPresetId = (p.get('wpre') || p.get('w_pre')) || state.weapon.moiPresetId;
  if (p.has('wm')) state.weapon.motorPresetId = p.get('wm') || state.weapon.motorPresetId;
  if (p.has('wk') || p.has('w_kv')) state.weapon.motorKv = Number(p.get('wk') || p.get('w_kv')) || state.weapon.motorKv;
  if (p.has('ws') || p.has('w_s')) state.weapon.cellCount = Number(p.get('ws') || p.get('w_s')) || state.weapon.cellCount;
  if (p.has('wr') || p.has('w_ratio')) state.weapon.gearRatio = Number(p.get('wr') || p.get('w_ratio')) || state.weapon.gearRatio;
  if (p.has('win') || p.has('w_in')) state.weapon.inputTeeth = Number(p.get('win') || p.get('w_in')) || state.weapon.inputTeeth;
  if (p.has('wout') || p.has('w_out')) state.weapon.outputTeeth = Number(p.get('wout') || p.get('w_out')) || state.weapon.outputTeeth;
  if (p.has('wppre') || p.has('w_ppre')) state.weapon.pulleyPresetId = (p.get('wppre') || p.get('w_ppre')) || state.weapon.pulleyPresetId;

  // Spin-Up
  if (p.has('sk') || p.has('s_kv')) state.spinup.motorKv = Number(p.get('sk') || p.get('s_kv')) || state.spinup.motorKv;
  if (p.has('ss') || p.has('s_s')) state.spinup.cellCount = Number(p.get('ss') || p.get('s_s')) || state.spinup.cellCount;
  if (p.has('sr') || p.has('s_ratio')) state.spinup.gearRatio = Number(p.get('sr') || p.get('s_ratio')) || state.spinup.gearRatio;
  if (p.has('srm') || p.has('s_rm')) state.spinup.motorResistance = Number(p.get('srm') || p.get('s_rm')) || state.spinup.motorResistance;
  if (p.has('src') || p.has('s_rcell')) state.spinup.batteryResistancePerCell = Number(p.get('src') || p.get('s_rcell')) || state.spinup.batteryResistancePerCell;
  if (p.has('sre') || p.has('s_resc')) state.spinup.escWiringResistance = Number(p.get('sre') || p.get('s_resc')) || state.spinup.escWiringResistance;
  if (p.has('si') || p.has('s_moi')) state.spinup.moiKgM2 = Number(p.get('si') || p.get('s_moi')) || state.spinup.moiKgM2;
  if (p.has('siu') || p.has('s_moiu')) state.spinup.moiUnit = (p.get('siu') || p.get('s_moiu')) as any;
  if (p.has('siv') || p.has('s_moiv')) state.spinup.moi = Number(p.get('siv') || p.get('s_moiv')) || state.spinup.moi;
  if (p.has('suw') || p.has('s_usew')) state.spinup.useWeaponTabMoi = (p.get('suw') === '1' || p.get('s_usew') === '1');
  if (p.has('suwk') || p.has('s_usew_kv')) state.spinup.useWeaponTabMotorKv = (p.get('suwk') === '1' || p.get('s_usew_kv') === '1');
  if (p.has('suwr') || p.has('s_usew_gr')) state.spinup.useWeaponTabGearRatio = (p.get('suwr') === '1' || p.get('s_usew_gr') === '1');

  // Capacitance
  if (p.has('cw') || p.has('c_wire')) state.capacitance.wireLength = Number(p.get('cw') || p.get('c_wire')) || state.capacitance.wireLength;
  if (p.has('cwu') || p.has('c_unit')) state.capacitance.wireLengthUnit = (p.get('cwu') || p.get('c_unit')) as any;
  if (p.has('ca') || p.has('c_amps')) state.capacitance.peakCurrentAmps = Number(p.get('ca') || p.get('c_amps')) || state.capacitance.peakCurrentAmps;
  if (p.has('cr') || p.has('c_rip')) state.capacitance.allowableRippleVolts = Number(p.get('cr') || p.get('c_rip')) || state.capacitance.allowableRippleVolts;
  if (p.has('ck') || p.has('c_k')) state.capacitance.safetyFactor = Number(p.get('ck') || p.get('c_k')) || state.capacitance.safetyFactor;
  if (p.has('cs') || p.has('c_s')) state.capacitance.cellCount = Number(p.get('cs') || p.get('c_s')) || state.capacitance.cellCount;

  // Center Distance
  if (p.has('cp') || p.has('cd_pitch')) state.centerDistance.pitchPresetId = (p.get('cp') || p.get('cd_pitch')) || state.centerDistance.pitchPresetId;
  if (p.has('cpm') || p.has('cd_customp')) state.centerDistance.customPitchMm = Number(p.get('cpm') || p.get('cd_customp')) || state.centerDistance.customPitchMm;
  if (p.has('cz1') || p.has('cd_z1')) state.centerDistance.smallPulleyTeeth = Number(p.get('cz1') || p.get('cd_z1')) || state.centerDistance.smallPulleyTeeth;
  if (p.has('cz2') || p.has('cd_z2')) state.centerDistance.largePulleyTeeth = Number(p.get('cz2') || p.get('cd_z2')) || state.centerDistance.largePulleyTeeth;
  if (p.has('cbt') || p.has('cd_bteeth')) state.centerDistance.beltTeeth = Number(p.get('cbt') || p.get('cd_bteeth')) || state.centerDistance.beltTeeth;
  if (p.has('cd') || p.has('cd_dist')) state.centerDistance.desiredCenterDistance = Number(p.get('cd') || p.get('cd_dist')) || state.centerDistance.desiredCenterDistance;
  if (p.has('cdu') || p.has('cd_unit')) state.centerDistance.desiredCenterDistanceUnit = (p.get('cdu') || p.get('cd_unit')) as any;

  // Battery Runtime
  if (p.has('bs') || p.has('b_s')) state.batteryRuntime.cellCount = Number(p.get('bs') || p.get('b_s')) || state.batteryRuntime.cellCount;
  if (p.has('bcap') || p.has('b_cap')) state.batteryRuntime.batteryCapacityMah = Number(p.get('bcap') || p.get('b_cap')) || state.batteryRuntime.batteryCapacityMah;
  if (p.has('bdm') || p.has('b_dmotors')) state.batteryRuntime.driveMotorCount = Number(p.get('bdm') || p.get('b_dmotors')) || state.batteryRuntime.driveMotorCount;
  if (p.has('bda') || p.has('b_damps')) state.batteryRuntime.avgDriveCurrentAmps = Number(p.get('bda') || p.get('b_damps')) || state.batteryRuntime.avgDriveCurrentAmps;
  if (p.has('bwm') || p.has('b_wmotors')) state.batteryRuntime.weaponMotorCount = Number(p.get('bwm') || p.get('b_wmotors')) || state.batteryRuntime.weaponMotorCount;
  if (p.has('bwa') || p.has('b_wamps')) state.batteryRuntime.avgWeaponCurrentAmps = Number(p.get('bwa') || p.get('b_wamps')) || state.batteryRuntime.avgWeaponCurrentAmps;
  if (p.has('bdur') || p.has('b_dur')) state.batteryRuntime.matchDurationSec = Number(p.get('bdur') || p.get('b_dur')) || state.batteryRuntime.matchDurationSec;
  if (p.has('bres') || p.has('b_res')) state.batteryRuntime.reserveMarginPercent = Number(p.get('bres') || p.get('b_res')) || state.batteryRuntime.reserveMarginPercent;

  // Normalize & synchronize battery cell counts across subsystems
  const parseCellParam = (keys: string[]): number | null => {
    for (const k of keys) {
      if (p.has(k)) {
        const n = Number(p.get(k));
        if (Number.isFinite(n) && n > 0) return n;
      }
    }
    return null;
  };
  const dsVal = parseCellParam(['ds', 'd_s']);
  const wsVal = parseCellParam(['ws', 'w_s']);
  const ssVal = parseCellParam(['ss', 's_s']);
  const csVal = parseCellParam(['cs', 'c_s']);
  const bsVal = parseCellParam(['bs', 'b_s']);
  const wbsVal = parseCellParam(['wbs', 'wb_s']);

  const mainCandidates = state.hasWeaponBattery
    ? [dsVal, csVal, bsVal]
    : [dsVal, wsVal, ssVal, csVal, bsVal];
  const mainCells = mainCandidates.find((v): v is number => v !== null) ?? state.drivetrain.cellCount;

  state.drivetrain.cellCount = mainCells;
  state.capacitance.cellCount = mainCells;
  state.batteryRuntime.cellCount = mainCells;

  if (!state.hasWeaponBattery) {
    state.weaponCellCount = mainCells;
    state.weapon.cellCount = mainCells;
    state.spinup.cellCount = mainCells;
    state.weaponChemistry = state.chemistry;
  } else {
    const wpnCells =
      [wbsVal, wsVal, ssVal].find((v): v is number => v !== null) ?? state.weaponCellCount;
    state.weaponCellCount = wpnCells;
    state.weapon.cellCount = wpnCells;
    state.spinup.cellCount = wpnCells;
  }

  return state;
}
