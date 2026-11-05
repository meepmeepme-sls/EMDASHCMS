/**
 * Late Night Combat Robotics Calculator Suite
 * Weapon Kinetic Energy & Tip Speed Engineering Calculator
 * Dual-theme (light and dark) support.
 */

import React, { useMemo, useState } from 'react';
import type {
  WeaponState,
  BatteryChemistry,
  VoltageState,
  WeightClassId,
  LengthUnit,
  MoiUnit,
  MassUnit,
  WeaponShape,
  WeaponWhatIfState,
} from '../../types';
import {
  MOTOR_PRESETS,
  WEIGHT_CLASSES,
  WEAPON_PULLEY_PRESETS,
} from '../../utils/constants';
import { computeWeapon } from '../../utils/calculations';
import { kgM2ToUnit, moiToKgM2, massToKg, lengthToMm } from '../../utils/conversions';
import { FieldInputWithToggle } from '../common/FieldInputWithToggle';
import { BatteryVoltageBar } from '../common/BatteryVoltageBar';
import { RuleComplianceBadge } from '../common/RuleComplianceBadge';
import { PresetSelect } from '../common/PresetSelect';
import { SparcVoltageWarningBox } from '../common/SparcVoltageWarningBox';
import { WeaponWhatIfTool } from './WeaponWhatIfTool';

interface WeaponToolProps {
  state: WeaponState;
  onChange: (newState: WeaponState) => void;
  chemistry: BatteryChemistry;
  onChangeChemistry: (chem: BatteryChemistry) => void;
  voltageState: VoltageState;
  onChangeVoltageState: (vstate: VoltageState) => void;
  weightClass: WeightClassId;
  hasWeaponBattery?: boolean;
  onChangeHasWeaponBattery?: (enabled: boolean) => void;
  weaponChemistry?: BatteryChemistry;
  onChangeWeaponChemistry?: (chem: BatteryChemistry) => void;
  weaponCellCount?: number;
  onChangeWeaponCellCount?: (cellCount: number) => void;
  drivetrainCellCount?: number;
  onChangeDrivetrainCellCount?: (cellCount: number) => void;
  useDirectVoltage?: boolean;
  onChangeUseDirectVoltage?: (useDirect: boolean) => void;
  directVoltage?: number;
  onChangeDirectVoltage?: (voltage: number) => void;
  useWeaponDirectVoltage?: boolean;
  onChangeUseWeaponDirectVoltage?: (useDirect: boolean) => void;
  weaponDirectVoltage?: number;
  onChangeWeaponDirectVoltage?: (voltage: number) => void;
  extendedPreset?: boolean;
}

export const WeaponTool: React.FC<WeaponToolProps> = ({
  state,
  onChange,
  chemistry,
  onChangeChemistry,
  voltageState,
  onChangeVoltageState,
  weightClass,
  hasWeaponBattery = false,
  onChangeHasWeaponBattery,
  weaponChemistry = chemistry,
  onChangeWeaponChemistry,
  weaponCellCount = state.cellCount,
  onChangeWeaponCellCount,
  drivetrainCellCount,
  onChangeDrivetrainCellCount,
  useDirectVoltage = false,
  onChangeUseDirectVoltage,
  directVoltage = 14.8,
  onChangeDirectVoltage,
  useWeaponDirectVoltage = false,
  onChangeUseWeaponDirectVoltage,
  weaponDirectVoltage = 14.8,
  onChangeWeaponDirectVoltage,
  extendedPreset = false,
}) => {
  const [showWhatIf, setShowWhatIf] = useState<boolean>(false);
  const [whatIfState, setWhatIfState] = useState<WeaponWhatIfState>({
    selectedFamilyId: 'repeat_robotics_2812_beetleweight_hubmotor',
    customKvsText: '1100, 1800, 2300',
    minCells: weightClass === 'ant' ? 2 : weightClass === 'bigbot' ? 4 : 3,
    maxCells: weightClass === 'ant' ? 4 : weightClass === 'bigbot' ? 12 : 6,
    speedUnit: 'mph',
  });

  const effectiveChem = hasWeaponBattery ? weaponChemistry : chemistry;
  const effectiveCells = hasWeaponBattery ? weaponCellCount : state.cellCount;
  const effectiveDirectV = hasWeaponBattery
    ? useWeaponDirectVoltage ? weaponDirectVoltage : undefined
    : useDirectVoltage ? directVoltage : undefined;
  const results = computeWeapon(
    state,
    effectiveChem,
    voltageState,
    effectiveCells,
    effectiveDirectV
  );
  const currentClass = WEIGHT_CLASSES.find((w) => w.id === weightClass) || WEIGHT_CLASSES[1];

  // Active shape calculation & state
  const activeShape: WeaponShape = state.weaponShape || (state.moiPresetId === 'custom' || !state.weaponShape ? 'custom' : state.weaponShape);
  const activeMassUnit: MassUnit = state.weaponMassUnit || (weightClass === 'bigbot' ? 'lbs' : 'g');
  const defaultMassForClass = weightClass === 'ant' ? 80 : weightClass === 'beetle' ? 350 : 3.5;
  const activeWeaponMass = state.weaponMass ?? defaultMassForClass;

  // Bite & Tooth Engagement Parameters
  const toothCount = state.toothCount ?? 1;
  const driveSpeedFps = state.driveSpeedFps ?? 12.0; // 12 ft/s standard combat robotics closing speed

  // Tooth strike frequency (Hz / strikes per second)
  const strikeFrequencyHz = (results.weaponRpm * toothCount) / 60.0;
  const timeBetweenTeethMs = strikeFrequencyHz > 0 ? 1000.0 / strikeFrequencyHz : 0;

  // Bite depth per tooth (forward travel of robot during time between consecutive tooth passes)
  // Bite (in) = (v_drive (ft/s) * 12) / (RPS * teeth)
  const weaponRps = results.weaponRpm / 60.0;
  const forwardInchesPerSec = driveSpeedFps * 12.0;
  const biteDepthInches = weaponRps > 0 && toothCount > 0 ? forwardInchesPerSec / (weaponRps * toothCount) : 0;
  const biteDepthMm = biteDepthInches * 25.4;

  // Theoretical 95% spin-up time calculation
  // tau = (J * R) / (Kt^2 * ratio^2), t_95% = 3 * tau
  const motorKv = Math.max(50, state.motorKv);
  const kt = 9.5493 / motorKv; // N*m/A
  const rCircuit = 0.06; // estimated circuit resistance in Ohms
  const currentRatio = Math.max(0.01, results.gearRatio);
  const tauM = (results.totalMoiKgM2 * rCircuit) / (Math.pow(kt, 2) * Math.pow(currentRatio, 2));
  const estimatedSpinUpSec = Math.max(0.1, 3 * tauM);

  const filteredMotors = MOTOR_PRESETS.filter((m) => {
    const isCategoryMatch = m.category === 'weapon' || m.category === 'both';
    const isWeightMatch = m.weightClasses.includes(weightClass);
    const isRepeatOrCustom = m.name.startsWith('Repeat Robotics') || m.id === 'custom';
    const matchesBrand = extendedPreset || isRepeatOrCustom;
    return isCategoryMatch && isWeightMatch && matchesBrand;
  });

  const repeatMotors = filteredMotors.filter((m) => m.name.startsWith('Repeat Robotics'));
  const customMotor = MOTOR_PRESETS.find((m) => m.id === 'custom');
  const justCuzMotors = filteredMotors.filter((m) => m.name.startsWith('Just Cuz Robotics'));
  const turnabotMotors = filteredMotors.filter((m) => m.name.startsWith('Turnabot'));
  const fingertechMotors = filteredMotors.filter((m) => m.name.startsWith('FingerTech'));
  const rangleboxMotors = filteredMotors.filter((m) => m.name.startsWith('Ranglebox'));
  const rectifiedMotors = filteredMotors.filter((m) => m.name.startsWith('Rectified Robotics'));
  const roboDomeMotors = filteredMotors.filter((m) => m.name.startsWith('The RoboDome'));

  const motorPresetGroups = useMemo(() => {
    const groups: { label: string; options: { id: string; name: string }[] }[] = [];

    // 1. Repeat Robotics
    if (repeatMotors.length > 0) {
      groups.push({
        label: 'Repeat Robotics',
        options: repeatMotors.map((m) => ({ id: m.id, name: m.name })),
      });
    }

    // 2. Custom Configuration
    groups.push({
      label: 'Custom Configuration',
      options: [{ id: 'custom', name: customMotor?.name || 'Custom Motor (Manual Spec)' }],
    });

    // 3. Alphabetical Extended Brands
    if (extendedPreset) {
      if (fingertechMotors.length > 0) {
        groups.push({
          label: 'FingerTech',
          options: fingertechMotors.map((m) => ({ id: m.id, name: m.name })),
        });
      }
      if (rangleboxMotors.length > 0) {
        groups.push({
          label: 'Ranglebox',
          options: rangleboxMotors.map((m) => ({ id: m.id, name: m.name })),
        });
      }
      if (rectifiedMotors.length > 0) {
        groups.push({
          label: 'Rectified Robotics',
          options: rectifiedMotors.map((m) => ({ id: m.id, name: m.name })),
        });
      }
      if (roboDomeMotors.length > 0) {
        groups.push({
          label: 'The RoboDome',
          options: roboDomeMotors.map((m) => ({ id: m.id, name: m.name })),
        });
      }
      if (turnabotMotors.length > 0) {
        groups.push({
          label: 'Turnabot',
          options: turnabotMotors.map((m) => ({ id: m.id, name: m.name })),
        });
      }

      // 4. Just Cuz Robotics (LAST!)
      if (justCuzMotors.length > 0) {
        groups.push({
          label: 'Just Cuz Robotics',
          options: justCuzMotors.map((m) => ({ id: m.id, name: m.name })),
        });
      }
    }

    // Active Selection if not matching above
    const isKnown = groups.some((g) => g.options.some((o) => o.id === state.motorPresetId));
    if (!isKnown && state.motorPresetId !== 'custom') {
      const activeObj = MOTOR_PRESETS.find((m) => m.id === state.motorPresetId);
      groups.push({
        label: 'Active Selection',
        options: [{ id: state.motorPresetId, name: activeObj?.name || 'Custom Motor' }],
      });
    }

    return groups;
  }, [
    repeatMotors,
    customMotor,
    extendedPreset,
    fingertechMotors,
    rangleboxMotors,
    rectifiedMotors,
    roboDomeMotors,
    turnabotMotors,
    justCuzMotors,
    state.motorPresetId,
  ]);

  const handleMotorPresetChange = (presetId: string) => {
    const preset = MOTOR_PRESETS.find((m) => m.id === presetId);
    if (!preset) return;
    onChange({
      ...state,
      motorPresetId: presetId,
      motorKv: preset.kv,
      gearRatio: preset.gearRatio !== undefined ? preset.gearRatio : state.gearRatio,
      manualRpmOverride: null,
    });
  };

  const handlePulleyPresetChange = (presetId: string) => {
    const preset = WEAPON_PULLEY_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    if (preset.id === 'custom') {
      onChange({
        ...state,
        pulleyPresetId: 'custom',
      });
    } else if (preset.id === 'repeat_vbelt_hub_25mm') {
      onChange({
        ...state,
        pulleyPresetId: preset.id,
        inputTeeth: 25,
        outputTeeth: 36,
        gearRatio: 1.44,
      });
    } else {
      onChange({
        ...state,
        pulleyPresetId: preset.id,
        gearRatio: preset.ratio,
      });
    }
  };

  const activePulleyPreset =
    state.pulleyPresetId ||
    ((state.inputTeeth === 25 && state.outputTeeth === 36) || Math.abs(state.gearRatio - 1.44) < 0.001
      ? 'repeat_vbelt_hub_25mm'
      : 'custom');

  // Helper to calculate shape MOI
  const calculateShapeMoi = (
    shape: 'disc' | 'bar' | 'drum',
    massVal: number,
    massUnit: MassUnit,
    diaVal: number,
    diaUnit: LengthUnit
  ): number => {
    const massKg = massToKg(massVal, massUnit);
    const diaM = lengthToMm(diaVal, diaUnit) / 1000.0;
    if (shape === 'disc') {
      // Solid circular disk: J = 1/2 * m * r^2 = 1/8 * m * d^2
      return (1 / 8) * massKg * Math.pow(diaM, 2);
    } else if (shape === 'bar') {
      // Rectangular bar rotating at center: J = 1/12 * m * L^2
      return (1 / 12) * massKg * Math.pow(diaM, 2);
    } else if (shape === 'drum') {
      // Cylindrical drum / beater bar outer shell: J ≈ 1/8 * m * d^2
      return (1 / 8) * massKg * Math.pow(diaM, 2);
    }
    return state.moiKgM2;
  };

  // Shape selector button click handler
  const handleShapeSelect = (shape: WeaponShape) => {
    if (shape === 'custom') {
      onChange({
        ...state,
        weaponShape: 'custom',
        moiPresetId: 'custom',
      });
      return;
    }

    const calculatedKgM2 = calculateShapeMoi(
      shape,
      activeWeaponMass,
      activeMassUnit,
      state.effectiveDiameter,
      state.effectiveDiameterUnit
    );
    const activeUnit = state.moiUnit || 'kg*m^2';
    const converted = kgM2ToUnit(calculatedKgM2, activeUnit);
    const precision = activeUnit === 'g*cm^2' ? 1 : activeUnit === 'oz*in^2' ? 2 : activeUnit === 'lb*in^2' ? 3 : 5;

    onChange({
      ...state,
      weaponShape: shape,
      weaponMass: activeWeaponMass,
      weaponMassUnit: activeMassUnit,
      moiKgM2: calculatedKgM2,
      moi: Number(converted.toFixed(precision)),
      moiPresetId: shape,
    });
  };

  // Mass change handler when shape is active
  const handleWeaponMassChange = (newMass: number) => {
    if (activeShape !== 'custom') {
      const calculatedKgM2 = calculateShapeMoi(
        activeShape,
        newMass,
        activeMassUnit,
        state.effectiveDiameter,
        state.effectiveDiameterUnit
      );
      const activeUnit = state.moiUnit || 'kg*m^2';
      const converted = kgM2ToUnit(calculatedKgM2, activeUnit);
      const precision = activeUnit === 'g*cm^2' ? 1 : activeUnit === 'oz*in^2' ? 2 : activeUnit === 'lb*in^2' ? 3 : 5;

      onChange({
        ...state,
        weaponMass: newMass,
        moiKgM2: calculatedKgM2,
        moi: Number(converted.toFixed(precision)),
      });
    } else {
      onChange({
        ...state,
        weaponMass: newMass,
      });
    }
  };

  const handleWeaponMassUnitChange = (newMass: number, newUnit: MassUnit) => {
    if (activeShape !== 'custom') {
      const calculatedKgM2 = calculateShapeMoi(
        activeShape,
        newMass,
        newUnit,
        state.effectiveDiameter,
        state.effectiveDiameterUnit
      );
      const activeUnit = state.moiUnit || 'kg*m^2';
      const converted = kgM2ToUnit(calculatedKgM2, activeUnit);
      const precision = activeUnit === 'g*cm^2' ? 1 : activeUnit === 'oz*in^2' ? 2 : activeUnit === 'lb*in^2' ? 3 : 5;

      onChange({
        ...state,
        weaponMass: newMass,
        weaponMassUnit: newUnit,
        moiKgM2: calculatedKgM2,
        moi: Number(converted.toFixed(precision)),
      });
    } else {
      onChange({
        ...state,
        weaponMass: newMass,
        weaponMassUnit: newUnit,
      });
    }
  };

  // Quick reduction ratio buttons
  const quickRatios = [
    { label: '1.0:1 (Direct)', inT: 16, outT: 16, preset: 'custom' },
    { label: '1.25:1', inT: 16, outT: 20, preset: 'custom' },
    { label: '1.44:1 (Repeat)', inT: 25, outT: 36, preset: 'repeat_vbelt_hub_25mm' },
    { label: '1.5:1', inT: 16, outT: 24, preset: 'custom' },
    { label: '2.0:1', inT: 16, outT: 32, preset: 'custom' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Battery System Bar */}
      <BatteryVoltageBar
        chemistry={chemistry}
        onChangeChemistry={onChangeChemistry}
        voltageState={voltageState}
        onChangeVoltageState={onChangeVoltageState}
        cellCount={drivetrainCellCount ?? state.cellCount}
        onChangeCellCount={(cells) => {
          if (onChangeDrivetrainCellCount) {
            onChangeDrivetrainCellCount(cells);
          } else {
            onChange({ ...state, cellCount: cells });
          }
        }}
        weightClass={weightClass}
        hasWeaponBattery={hasWeaponBattery}
        onChangeHasWeaponBattery={onChangeHasWeaponBattery}
        weaponChemistry={weaponChemistry}
        onChangeWeaponChemistry={onChangeWeaponChemistry}
        weaponCellCount={weaponCellCount}
        onChangeWeaponCellCount={(cells) => {
          if (onChangeWeaponCellCount) {
            onChangeWeaponCellCount(cells);
          } else {
            onChange({ ...state, cellCount: cells });
          }
        }}
        useDirectVoltage={useDirectVoltage}
        onChangeUseDirectVoltage={onChangeUseDirectVoltage}
        directVoltage={directVoltage}
        onChangeDirectVoltage={onChangeDirectVoltage}
        useWeaponDirectVoltage={useWeaponDirectVoltage}
        onChangeUseWeaponDirectVoltage={onChangeUseWeaponDirectVoltage}
        weaponDirectVoltage={weaponDirectVoltage}
        onChangeWeaponDirectVoltage={onChangeWeaponDirectVoltage}
      />

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Powertrain & Blade MOI Inputs */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Powertrain / Motor Drive Card (Positioned Above Blade MOI) */}
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  Weapon Drive Motor & Reduction
                </h3>
              </div>
            </div>

            {/* Motor Preset */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                Motor Preset
              </label>
              <PresetSelect
                value={state.motorPresetId}
                onChange={handleMotorPresetChange}
                groups={motorPresetGroups}
                ariaLabel="Motor Preset"
                placeholder="Search weapon motor presets (e.g. Blitz, Propdrive, 1500)..."
              />
            </div>

            {/* Motor KV and Pulley Reduction Preset */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInputWithToggle
                label="Motor KV"
                value={state.motorKv}
                unit="RPM/V"
                onChangeValue={(val) =>
                  onChange({ ...state, motorKv: val, motorPresetId: 'custom' })
                }
                step={25}
                min={50}
                max={15000}
                helperText="RPM produced per volt applied"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Weapon Pulley Reduction Preset
                </label>
                <select
                  value={activePulleyPreset}
                  onChange={(e) => handlePulleyPresetChange(e.target.value)}
                  className="w-full bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] rounded-none px-3 py-2 text-sm text-[#0F172A] dark:text-[#CEDDFD] font-mono outline-none focus:border-[#094AD8] shadow-2xs cursor-pointer"
                >
                  {WEAPON_PULLEY_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Pulley Reduction Ratio Selector Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#2E3646]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Quick Ratio Presets
                </label>
                <span className="text-xs font-mono text-[#094AD8] dark:text-[#5B8DEF] font-bold">
                  {((state.outputTeeth ?? 16) / (state.inputTeeth ?? 16)).toFixed(2)}:1 Current
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {quickRatios.map((qr) => {
                  const currentEffectiveRatio = (state.outputTeeth ?? 16) / (state.inputTeeth ?? 16);
                  const isCurrent = Math.abs(currentEffectiveRatio - (qr.outT / qr.inT)) < 0.01;
                  return (
                    <button
                      key={qr.label}
                      type="button"
                      onClick={() => {
                        onChange({
                          ...state,
                          inputTeeth: qr.inT,
                          outputTeeth: qr.outT,
                          gearRatio: Number((qr.outT / qr.inT).toFixed(4)),
                          pulleyPresetId: qr.preset,
                        });
                      }}
                      className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-none transition-all cursor-pointer whitespace-nowrap ${
                        isCurrent
                          ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                          : 'bg-[#F1F5F9] dark:bg-[#16181D] text-[#475569] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#2E3646] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                      }`}
                    >
                      {qr.label}
                    </button>
                  );
                })}
              </div>

              {/* Exact Teeth Numeric Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                <FieldInputWithToggle
                  label="Input (Motor / Driver)"
                  value={state.inputTeeth ?? 16}
                  unit=""
                  onChangeValue={(val) => {
                    const inT = Math.max(0.01, val);
                    const outT = state.outputTeeth ?? 16;
                    const ratio = Number((outT / inT).toFixed(4));
                    onChange({
                      ...state,
                      inputTeeth: inT,
                      outputTeeth: outT,
                      gearRatio: ratio,
                      pulleyPresetId: inT === 25 && outT === 36 ? 'repeat_vbelt_hub_25mm' : 'custom',
                    });
                  }}
                  step={0.1}
                  min={0.01}
                  max={500}
                  helperText="Driver teeth count or input ratio (e.g. 1 or 16)"
                />
                <FieldInputWithToggle
                  label="Output (Weapon / Driven)"
                  value={state.outputTeeth ?? 16}
                  unit=""
                  onChangeValue={(val) => {
                    const inT = state.inputTeeth ?? 16;
                    const outT = Math.max(0.01, val);
                    const ratio = Number((outT / inT).toFixed(4));
                    onChange({
                      ...state,
                      inputTeeth: inT,
                      outputTeeth: outT,
                      gearRatio: ratio,
                      pulleyPresetId: inT === 25 && outT === 36 ? 'repeat_vbelt_hub_25mm' : 'custom',
                    });
                  }}
                  step={0.1}
                  min={0.01}
                  max={500}
                  helperText="Driven teeth count or output ratio (e.g. 2.5 or 36)"
                />
              </div>
            </div>
          </div>

          {/* Blade MOI & Physical Sizing Card (Positioned Below Motor Drive) */}
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  Blade MOI & Physical Sizing
                </h3>
              </div>
              <span className="text-xs font-mono text-[#64748B] dark:text-[#85A3E0]">
                {currentClass.shortName} Class
              </span>
            </div>

            {/* Weapon Shape Selector Buttons */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Weapon Geometry & MOI Estimation Shape
                </label>
                <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
                  {activeShape === 'custom' ? 'Direct CAD Input' : 'Parametric Formula'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: 'disc', label: 'Disc', desc: 'J = ⅛ m D²' },
                    { id: 'bar', label: 'Bar', desc: 'J = 1/12 m L²' },
                    { id: 'drum', label: 'Drum', desc: 'J ≈ ⅛ m D²' },
                    { id: 'custom', label: 'Custom (CAD)', desc: 'Direct MOI' },
                  ] as const
                ).map((shape) => {
                  const isSelected = activeShape === shape.id;
                  return (
                    <button
                      key={shape.id}
                      type="button"
                      onClick={() => handleShapeSelect(shape.id)}
                      className={`py-2 px-3 flex flex-col items-center justify-center text-center rounded-none transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#094AD8] text-white border-[#094AD8] shadow-2xs font-bold'
                          : 'bg-[#F8FAFC] dark:bg-[#16181D] text-[#0F172A] dark:text-[#CEDDFD] border-[#CBD5E1] dark:border-[#2E3646] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                      }`}
                    >
                      <span className="text-xs font-mono font-bold">{shape.label}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-[#64748B] dark:text-[#85A3E0]'}`}>
                        {shape.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct MOI & Effective Diameter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInputWithToggle
                label="Mass Moment of Inertia (MOI)"
                value={state.moi ?? kgM2ToUnit(state.moiKgM2, state.moiUnit || 'kg*m^2')}
                unit={state.moiUnit || 'kg*m^2'}
                units={['kg*m^2', 'g*cm^2', 'oz*in^2', 'lb*in^2']}
                onChangeValue={(val) => {
                  const activeUnit = state.moiUnit || 'kg*m^2';
                  onChange({
                    ...state,
                    moi: val,
                    moiKgM2: moiToKgM2(val, activeUnit),
                    moiPresetId: 'custom',
                    weaponShape: 'custom',
                  });
                }}
                onChangeValueAndUnit={(val, u: MoiUnit) => {
                  onChange({
                    ...state,
                    moi: val,
                    moiUnit: u,
                    moiKgM2: moiToKgM2(val, u),
                    moiPresetId: 'custom',
                    weaponShape: 'custom',
                  });
                }}
                step={
                  (state.moiUnit || 'kg*m^2') === 'g*cm^2'
                    ? 100
                    : (state.moiUnit || 'kg*m^2') === 'oz*in^2'
                    ? 0.5
                    : (state.moiUnit || 'kg*m^2') === 'lb*in^2'
                    ? 0.1
                    : 0.00005
                }
                min={0.000001}
                helperText={
                  activeShape === 'custom'
                    ? 'CAD moment of inertia around rotation axis'
                    : `Calculated from ${activeShape.toUpperCase()} formula & mass`
                }
              />

              <FieldInputWithToggle
                label="Effective Impact Tip Diameter"
                value={state.effectiveDiameter}
                unit={state.effectiveDiameterUnit}
                units={['in', 'mm']}
                onChangeValue={(val) => {
                  if (activeShape !== 'custom') {
                    const newKgM2 = calculateShapeMoi(
                      activeShape,
                      activeWeaponMass,
                      activeMassUnit,
                      val,
                      state.effectiveDiameterUnit
                    );
                    const activeUnit = state.moiUnit || 'kg*m^2';
                    const converted = kgM2ToUnit(newKgM2, activeUnit);
                    const precision = activeUnit === 'g*cm^2' ? 1 : activeUnit === 'oz*in^2' ? 2 : activeUnit === 'lb*in^2' ? 3 : 5;
                    onChange({
                      ...state,
                      effectiveDiameter: val,
                      moiKgM2: newKgM2,
                      moi: Number(converted.toFixed(precision)),
                    });
                  } else {
                    onChange({ ...state, effectiveDiameter: val, moiPresetId: 'custom' });
                  }
                }}
                onChangeValueAndUnit={(val, u: LengthUnit) => {
                  if (activeShape !== 'custom') {
                    const newKgM2 = calculateShapeMoi(
                      activeShape,
                      activeWeaponMass,
                      activeMassUnit,
                      val,
                      u
                    );
                    const activeUnit = state.moiUnit || 'kg*m^2';
                    const converted = kgM2ToUnit(newKgM2, activeUnit);
                    const precision = activeUnit === 'g*cm^2' ? 1 : activeUnit === 'oz*in^2' ? 2 : activeUnit === 'lb*in^2' ? 3 : 5;
                    onChange({
                      ...state,
                      effectiveDiameter: val,
                      effectiveDiameterUnit: u,
                      moiKgM2: newKgM2,
                      moi: Number(converted.toFixed(precision)),
                    });
                  } else {
                    onChange({
                      ...state,
                      effectiveDiameter: val,
                      effectiveDiameterUnit: u,
                      moiPresetId: 'custom',
                    });
                  }
                }}
                step={state.effectiveDiameterUnit === 'in' ? 0.125 : 1}
                min={state.effectiveDiameterUnit === 'in' ? 0.5 : 10}
                helperText="Tip-to-tip spinning diameter"
              />
            </div>

            {/* Weapon Mass Input (active when shape estimation is used) */}
            {activeShape !== 'custom' && (
              <div className="p-3 bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] rounded-none flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0F172A] dark:text-[#CEDDFD]">
                    {activeShape.charAt(0).toUpperCase() + activeShape.slice(1)} Weapon Mass (for Inertia Calc)
                  </span>
                  <span className="text-[11px] font-mono text-[#094AD8] dark:text-[#60A5FA] font-bold">
                    {massToKg(activeWeaponMass, activeMassUnit).toFixed(3)} kg
                  </span>
                </div>
                <FieldInputWithToggle
                  label="Weapon Mass"
                  value={activeWeaponMass}
                  unit={activeMassUnit}
                  units={['g', 'oz', 'lbs', 'kg']}
                  onChangeValue={handleWeaponMassChange}
                  onChangeValueAndUnit={handleWeaponMassUnitChange}
                  step={activeMassUnit === 'kg' ? 0.05 : activeMassUnit === 'lbs' ? 0.1 : 5}
                  min={0.01}
                  helperText="Total spinning weapon mass used for theoretical moment of inertia"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Telemetry Performance HUD */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Real-Time Tip Speed Advisory */}
          <RuleComplianceBadge
            tipSpeedMph={results.tipSpeedMph}
            tipSpeedMs={results.tipSpeedMs}
          />

          {/* Kinetic Energy Stored KPI Card */}
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                Kinetic Energy & Impact Power
              </h3>
            </div>

            {/* Dual Hero KPI Panes: Stored Kinetic Energy & Weapon Tip Speed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Hero Pane 1: Stored Kinetic Energy */}
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-4 flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wider font-mono text-[#64748B] dark:text-[#85A3E0]">
                  Stored Kinetic Energy (KE)
                </span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#094AD8] dark:text-white tabular-nums">
                    {results.kineticEnergyJoules.toFixed(0)}
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold text-[#0F172A] dark:text-[#094AD8]">Joules</span>
                  <span className="text-xs font-mono text-[#64748B] dark:text-[#85A3E0]">
                    ({results.kineticEnergyFtLbs.toFixed(0)} ft-lbs)
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#85A3E0]/80 mt-1 font-mono">
                  Rotational energy: ½ · J · ω²
                </p>
              </div>

              {/* Hero Pane 2: Weapon Tip Speed */}
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-4 flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wider font-mono text-[#64748B] dark:text-[#85A3E0]">
                  Weapon Tip Speed
                </span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#094AD8] dark:text-white tabular-nums">
                    {results.tipSpeedMph.toFixed(2)}
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold text-[#0F172A] dark:text-[#094AD8]">mph</span>
                  <span className="text-xs font-mono text-[#64748B] dark:text-[#85A3E0]">
                    ({results.tipSpeedMs.toFixed(2)} m/s · {(results.tipSpeedMs * 3.28084).toFixed(2)} ft/s)
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#85A3E0]/80 mt-1 font-mono">
                  Tangential velocity: ω · r
                </p>
              </div>
            </div>

            {/* Secondary Weapon Telemetry Matrix: 3 Column Layout (Weapon Speed, Tip Diameter, Active MOI) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col">
                <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Weapon Speed
                </span>
                <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.weaponRpm.toFixed(0)}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">RPM</span>
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  {results.angularVelocityRadS.toFixed(0)} rad/s
                </span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col">
                <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Tip Diameter
                </span>
                <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.effectiveDiameterMm.toFixed(1)}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">mm</span>
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  {(results.effectiveDiameterMm / 25.4).toFixed(2)} in diameter
                </span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col">
                <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Active MOI (J)
                </span>
                <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {(() => {
                    const activeUnit = state.moiUnit || 'kg*m^2';
                    const converted = kgM2ToUnit(results.totalMoiKgM2, activeUnit);
                    return activeUnit === 'g*cm^2'
                      ? converted.toFixed(1)
                      : activeUnit === 'oz*in^2'
                      ? converted.toFixed(2)
                      : activeUnit === 'lb*in^2'
                      ? converted.toFixed(3)
                      : converted.toFixed(5);
                  })()}
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  {state.moiUnit || 'kg*m^2'} inertia
                  {state.moiUnit && state.moiUnit !== 'kg*m^2'
                    ? ` (${results.totalMoiKgM2.toFixed(5)} kg·m²)`
                    : ''}
                </span>
              </div>
            </div>

            {/* Context Note */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] text-xs text-[#64748B] dark:text-[#85A3E0] leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-[#0F172A] dark:text-[#CEDDFD] mb-1">
                <span>Impact Target for {currentClass.pluralName}</span>
              </div>
              Typical tournament strike energy:{' '}
              <strong className="text-[#0F172A] dark:text-white">
                {currentClass.id === 'ant'
                  ? '80–250 J'
                  : currentClass.id === 'beetle'
                  ? '300–1200 J'
                  : '1500–8000 J'}
              </strong>
              . High kinetic energy translates directly into air time and structural armor deformation.
            </div>
          </div>

          {/* Bite & Tooth Engagement Metrics Card */}
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                Bite & Tooth Engagement
              </h3>
              <span className="text-[11px] font-mono text-[#094AD8] dark:text-[#60A5FA] font-bold">
                {biteDepthInches.toFixed(2)} in / {biteDepthMm.toFixed(1)} mm
              </span>
            </div>

            {/* Interactive Tooth Count Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Tooth Count (Blade Geometry)
                </label>
                <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
                  {toothCount === 1 ? 'Single Tooth' : `${toothCount} Teeth`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((t) => {
                  const isSelected = toothCount === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onChange({ ...state, toothCount: t })}
                      className={`py-1.5 text-xs font-mono font-bold rounded-none transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#094AD8] text-white border-[#094AD8] shadow-2xs'
                          : 'bg-[#F8FAFC] dark:bg-[#16181D] text-[#0F172A] dark:text-[#CEDDFD] border-[#CBD5E1] dark:border-[#2E3646] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                      }`}
                    >
                      {t}T
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Robot Forward Drive Closing Speed Input */}
            <FieldInputWithToggle
              label="Robot Forward Drive Speed"
              value={driveSpeedFps}
              unit="ft/s"
              onChangeValue={(val) => onChange({ ...state, driveSpeedFps: val })}
              step={0.5}
              min={1}
              max={50}
              helperText="Typical insect-weight combat robotics closing velocity (default 12 ft/s)"
            />

            {/* Engagement Metrics Telemetry */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] p-3 rounded-none flex flex-col">
                <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Bite Depth Per Tooth
                </span>
                <span className="text-lg font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-0.5">
                  {biteDepthInches.toFixed(3)} in
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  {biteDepthMm.toFixed(2)} mm penetration
                </span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] p-3 rounded-none flex flex-col">
                <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Strike Rate (Frequency)
                </span>
                <span className="text-lg font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-0.5">
                  {strikeFrequencyHz.toFixed(0)} Hz
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  {timeBetweenTeethMs.toFixed(1)} ms between teeth
                </span>
              </div>
            </div>

            {/* Bite Quality Assessment Evaluation */}
            <div
              className={`p-3 border rounded-none text-xs leading-relaxed ${
                biteDepthInches < 0.1
                  ? 'bg-amber-500/10 dark:bg-amber-400/10 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200'
                  : biteDepthInches <= 0.4
                  ? 'bg-emerald-500/10 dark:bg-emerald-400/10 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200'
                  : 'bg-[#094AD8]/10 border-[#094AD8]/30 dark:border-[#60A5FA]/30 text-[#0F172A] dark:text-[#CEDDFD]'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <span>
                  {biteDepthInches < 0.1
                    ? '⚠️ Low Bite / Grinding Risk'
                    : biteDepthInches <= 0.4
                    ? '✓ Optimal Combat Bite Depth'
                    : '⚡ Aggressive High Bite'}
                </span>
              </div>
              <p className="text-[11px] opacity-90">
                {biteDepthInches < 0.1
                  ? 'Under 0.10" (2.5mm): Teeth risk skimming/grinding opponent armor instead of biting and throwing. Consider reducing tooth count or increasing drive speed.'
                  : biteDepthInches <= 0.4
                  ? '0.10"–0.40" (2.5–10mm): Ideal engagement depth for modern insect-weight combat. Maximizes energy transfer into opponent frame while minimizing recoil stall risk.'
                  : 'Over 0.40" (10mm): Massive chunk bite transferring extreme shock loads. Ensure weapon hub clamping and motor mount fasteners can withstand severe shock.'}
              </p>
            </div>
          </div>

          {/* Spin-Up Time Indicator Card */}
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-3 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                Spin-Up Time & Dynamic Acceleration
              </h3>
              <span className="text-xs font-mono font-bold text-[#094AD8] dark:text-[#60A5FA]">
                ~{estimatedSpinUpSec.toFixed(2)}s to 95%
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-[#64748B] dark:text-[#85A3E0]">
                <span>0 RPM</span>
                <span>{(results.weaponRpm * 0.95).toFixed(0)} RPM (95%)</span>
                <span>{results.weaponRpm.toFixed(0)} RPM</span>
              </div>
              <div className="w-full bg-[#F1F5F9] dark:bg-[#16181D] h-2.5 rounded-none border border-[#CBD5E1] dark:border-[#2E3646] overflow-hidden">
                <div
                  className="bg-[#094AD8] dark:bg-[#60A5FA] h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(10, 100 - estimatedSpinUpSec * 15))}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] dark:text-[#85A3E0] leading-relaxed">
              Calculated from weapon inertia ({results.totalMoiKgM2.toFixed(5)} kg·m²) and motor back-EMF / torque constant. For detailed thermal curves, ESC ramp parameters, and battery ESR sag, open the <strong>Electronics Spin-Up</strong> tab.
            </p>
          </div>
        </div>
      </div>

      {/* Parametric What-If Analysis Collapsible Drawer / Container */}
      <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none transition-colors">
        <button
          type="button"
          onClick={() => setShowWhatIf(!showWhatIf)}
          className="w-full px-5 py-4 flex items-center justify-between cursor-pointer text-left hover:bg-[#F8FAFC] dark:hover:bg-[#16181D]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD] uppercase tracking-wider">
              Parametric What-If Tip Speed Matrix
            </span>
            <span className="text-xs font-mono px-2 py-0.5 bg-[#094AD8]/10 text-[#094AD8] dark:text-[#60A5FA] border border-[#094AD8]/30 dark:border-[#60A5FA]/30 rounded-none">
              Sweep 2S–16S & KV Variants
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-[#64748B] dark:text-[#85A3E0]">
              {showWhatIf ? 'Collapse Matrix' : 'Expand Matrix'}
            </span>
            <span className="text-xs font-mono text-[#094AD8] dark:text-[#60A5FA]">
              {showWhatIf ? '▲' : '▼'}
            </span>
          </div>
        </button>

        {showWhatIf && (
          <div className="p-5 border-t border-[#E2E8F0] dark:border-[#2E3646]">
            <WeaponWhatIfTool
              whatIfState={whatIfState}
              onChangeWhatIfState={setWhatIfState}
              weaponState={state}
              onChangeWeaponState={onChange}
              weightClass={weightClass}
            />
          </div>
        )}
      </div>

      {/* SPARC v1.7 48V Warning Box at the bottom */}
      <SparcVoltageWarningBox packVoltage={results.packVoltage} />
    </div>
  );
};
