/**
 * Late Night Combat Robotics Calculator Suite
 * Weapon Kinetic Energy & Tip Speed Engineering Calculator
 * Dual-theme (light and dark) support.
 */

import React, { useMemo } from 'react';
import {
  WeaponState,
  BatteryChemistry,
  VoltageState,
  WeightClassId,
  LengthUnit,
  MoiUnit,
} from '../../types';
import {
  MOTOR_PRESETS,
  WEIGHT_CLASSES,
  WEAPON_PULLEY_PRESETS,
} from '../../utils/constants';
import { computeWeapon } from '../../utils/calculations';
import { kgM2ToUnit, moiToKgM2 } from '../../utils/conversions';
import { FieldInputWithToggle } from '../common/FieldInputWithToggle';
import { BatteryVoltageBar } from '../common/BatteryVoltageBar';
import { RuleComplianceBadge } from '../common/RuleComplianceBadge';
import { PresetSelect } from '../common/PresetSelect';
import { SparcVoltageWarningBox } from '../common/SparcVoltageWarningBox';

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
  const effectiveChem = hasWeaponBattery ? weaponChemistry : chemistry;
  const effectiveCells = hasWeaponBattery ? weaponCellCount : (drivetrainCellCount ?? state.cellCount);
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

            {/* Weapon Reduction Inputs */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#2E3646]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Weapon Reduction (Belt / Gear Ratio)
                </label>
                <span className="text-xs font-mono text-[#094AD8] dark:text-[#5B8DEF] font-bold">
                  {((state.outputTeeth ?? 16) / (state.inputTeeth ?? 16)).toFixed(2)}:1 Ratio
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Direct MOI & Effective Diameter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInputWithToggle
                label="Mass Moment of Inertia (MOI)"
                value={state.moi ?? kgM2ToUnit(state.moiKgM2, state.moiUnit || 'kg*m^2')}
                unit={state.moiUnit || 'kg*m^2'}
                units={['kg*m^2', 'g*cm^2', 'lb*in^2']}
                onChangeValue={(val) => {
                  const activeUnit = state.moiUnit || 'kg*m^2';
                  onChange({
                    ...state,
                    moi: val,
                    moiKgM2: moiToKgM2(val, activeUnit),
                    moiPresetId: 'custom',
                  });
                }}
                onChangeValueAndUnit={(val, u: MoiUnit) => {
                  onChange({
                    ...state,
                    moi: val,
                    moiUnit: u,
                    moiKgM2: moiToKgM2(val, u),
                    moiPresetId: 'custom',
                  });
                }}
                step={
                  (state.moiUnit || 'kg*m^2') === 'g*cm^2'
                    ? 100
                    : (state.moiUnit || 'kg*m^2') === 'lb*in^2'
                    ? 0.1
                    : 0.00005
                }
                min={0.000001}
                helperText="CAD moment of inertia around rotation axis"
              />

              <FieldInputWithToggle
                label="Effective Impact Tip Diameter"
                value={state.effectiveDiameter}
                unit={state.effectiveDiameterUnit}
                units={['mm', 'in']}
                onChangeValue={(val) =>
                  onChange({ ...state, effectiveDiameter: val, moiPresetId: 'custom' })
                }
                onChangeValueAndUnit={(val, u: LengthUnit) =>
                  onChange({
                    ...state,
                    effectiveDiameter: val,
                    effectiveDiameterUnit: u,
                    moiPresetId: 'custom',
                  })
                }
                step={state.effectiveDiameterUnit === 'in' ? 0.125 : 1}
                min={state.effectiveDiameterUnit === 'in' ? 0.5 : 10}
                helperText="Tip-to-tip spinning diameter"
              />
            </div>
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
        </div>
      </div>

      {/* SPARC v1.7 48V Warning Box at the bottom */}
      <SparcVoltageWarningBox packVoltage={results.packVoltage} />
    </div>
  );
};
