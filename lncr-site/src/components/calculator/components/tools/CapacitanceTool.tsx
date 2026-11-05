/**
 * Late Night Combat Robotics Calculator Suite
 * Recommended Capacitance Calculator (ESC Wire Inductance & Ripple Suppression)
 * Derived from Combat Robotics electrical principles (Too Hot / RoboCalc)
 * Dual-theme (light and dark) support. No icons.
 */

import React, { useState } from 'react';
import type {
  CapacitanceState,
  BatteryChemistry,
  VoltageState,
  WeightClassId,
  LengthUnit,
} from '../../types';
import { WEIGHT_CLASSES } from '../../utils/constants';
import { computeCapacitance } from '../../utils/calculations';
import { FieldInputWithToggle } from '../common/FieldInputWithToggle';
import { BatteryVoltageBar } from '../common/BatteryVoltageBar';
import { SparcVoltageWarningBox } from '../common/SparcVoltageWarningBox';

interface CapacitanceToolProps {
  state: CapacitanceState;
  onChange: (newState: CapacitanceState) => void;
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
  useDirectVoltage?: boolean;
  onChangeUseDirectVoltage?: (useDirect: boolean) => void;
  directVoltage?: number;
  onChangeDirectVoltage?: (voltage: number) => void;
  useWeaponDirectVoltage?: boolean;
  onChangeUseWeaponDirectVoltage?: (useDirect: boolean) => void;
  weaponDirectVoltage?: number;
  onChangeWeaponDirectVoltage?: (voltage: number) => void;
}

// Preset Quick Selection Options
const WIRE_LENGTH_PRESETS = [
  { mm: 75, in: 3.0, label: '75mm (3")', tag: 'Direct / Short' },
  { mm: 150, in: 6.0, label: '150mm (6")', tag: 'Combat Std' },
  { mm: 250, in: 10.0, label: '250mm (10")', tag: 'Long Harness' },
];

const CURRENT_PRESETS = [
  { value: 20, label: '20A', tag: 'Antweight' },
  { value: 45, label: '45A', tag: 'Beetleweight' },
  { value: 90, label: '90A', tag: 'Feather / 12lb' },
  { value: 180, label: '180A', tag: 'Big Bot / 30lb' },
];

const RIPPLE_PRESETS = [
  { value: 0.5, label: '0.5V', tag: 'Strict' },
  { value: 1.0, label: '1.0V', tag: 'Standard' },
  { value: 1.5, label: '1.5V', tag: 'Relaxed' },
];

const SAFETY_FACTORS = [
  { value: 2.0, label: '2.0x', tag: 'Standard', desc: 'Moderate driving, low stall duration' },
  { value: 2.5, label: '2.5x', tag: 'Aggressive', desc: 'High duty cycle, fast reversals' },
  { value: 3.0, label: '3.0x', tag: 'Combat Rec', desc: 'Combat standard, high shock & stall safety' },
  { value: 4.0, label: '4.0x', tag: 'Extreme', desc: 'Heavy spinner weapon, locked-rotor protection' },
];

const PRESET_CAPACITORS = [
  { value: 220, label: '220 µF', tag: 'Ant / Compact' },
  { value: 330, label: '330 µF', tag: 'Mini Low-ESR' },
  { value: 470, label: '470 µF', tag: 'Combat Standard' },
  { value: 680, label: '680 µF', tag: 'High Ripple' },
  { value: 1000, label: '1000 µF', tag: 'Beetle / Feather' },
  { value: 1500, label: '1500 µF', tag: 'Big Bot Bank' },
];

export const CapacitanceTool: React.FC<CapacitanceToolProps> = ({
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
  useDirectVoltage = false,
  onChangeUseDirectVoltage,
  directVoltage = 14.8,
  onChangeDirectVoltage,
  useWeaponDirectVoltage = false,
  onChangeUseWeaponDirectVoltage,
  weaponDirectVoltage = 14.8,
  onChangeWeaponDirectVoltage,
}) => {
  const [selectedCapacitorUf, setSelectedCapacitorUf] = useState<number>(470);
  const [showFormulaBreakdown, setShowFormulaBreakdown] = useState<boolean>(true);
  const [targetSubsystem, setTargetSubsystem] = useState<'drive' | 'weapon'>('drive');

  const isWeaponTarget = hasWeaponBattery && targetSubsystem === 'weapon';
  const activeChemistry = isWeaponTarget ? weaponChemistry : chemistry;
  const activeCellCount = isWeaponTarget ? weaponCellCount : state.cellCount;
  const activeUseDirect = isWeaponTarget ? useWeaponDirectVoltage : useDirectVoltage;
  const activeDirectVoltage = isWeaponTarget ? weaponDirectVoltage : directVoltage;

  const results = computeCapacitance(
    { ...state, cellCount: activeCellCount },
    activeChemistry,
    voltageState,
    activeUseDirect ? activeDirectVoltage : undefined
  );

  const currentClass = WEIGHT_CLASSES.find((w) => w.id === weightClass) || WEIGHT_CLASSES[0];

  // Pit inventory bank builder calculation
  const capsNeeded = Math.max(1, Math.ceil(results.recommendedCapacitanceUf / selectedCapacitorUf));
  const totalBankCapacitanceUf = capsNeeded * selectedCapacitorUf;
  const bankMarginPercent = Math.round((totalBankCapacitanceUf / results.recommendedCapacitanceUf) * 100);

  // Active safety factor descriptor
  const activeSafetyFactorObj =
    SAFETY_FACTORS.find((sf) => Math.abs(sf.value - state.safetyFactor) < 0.05) || {
      value: state.safetyFactor,
      label: `${state.safetyFactor.toFixed(1)}x`,
      tag: 'Custom',
      desc: 'User specified custom safety factor',
    };

  return (
    <div className="flex flex-col gap-6">
      {/* Battery System Bar */}
      <BatteryVoltageBar
        chemistry={chemistry}
        onChangeChemistry={onChangeChemistry}
        voltageState={voltageState}
        onChangeVoltageState={onChangeVoltageState}
        cellCount={state.cellCount}
        onChangeCellCount={(cells) => onChange({ ...state, cellCount: cells })}
        weightClass={weightClass}
        hasWeaponBattery={hasWeaponBattery}
        onChangeHasWeaponBattery={onChangeHasWeaponBattery}
        weaponChemistry={weaponChemistry}
        onChangeWeaponChemistry={onChangeWeaponChemistry}
        weaponCellCount={weaponCellCount}
        onChangeWeaponCellCount={onChangeWeaponCellCount}
        useDirectVoltage={useDirectVoltage}
        onChangeUseDirectVoltage={onChangeUseDirectVoltage}
        directVoltage={directVoltage}
        onChangeDirectVoltage={onChangeDirectVoltage}
        useWeaponDirectVoltage={useWeaponDirectVoltage}
        onChangeUseWeaponDirectVoltage={onChangeUseWeaponDirectVoltage}
        weaponDirectVoltage={weaponDirectVoltage}
        onChangeWeaponDirectVoltage={onChangeWeaponDirectVoltage}
      />

      {/* Dual Battery Subsystem Selector (when independent weapon battery is active) */}
      {hasWeaponBattery && (
        <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-[#0F172A] dark:text-[#CEDDFD]">
              Dual Battery System Sizing
            </span>
            <span className="text-[11px] text-[#64748B] dark:text-[#85A3E0]">
              Select which ESC power loop to calculate capacitance for:
            </span>
          </div>
          <div className="inline-flex rounded-none border border-[#CBD5E1] dark:border-[#2E3646] overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setTargetSubsystem('drive')}
              className={`px-3 py-1.5 text-xs font-mono font-semibold cursor-pointer transition-colors ${
                !isWeaponTarget
                  ? 'bg-[#094AD8] text-white shadow-2xs'
                  : 'bg-[#F8FAFC] dark:bg-[#16181D] text-[#475569] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
              }`}
            >
              Drive ESC ({state.cellCount}S {chemistry.toUpperCase()})
            </button>
            <button
              type="button"
              onClick={() => setTargetSubsystem('weapon')}
              className={`px-3 py-1.5 text-xs font-mono font-semibold cursor-pointer transition-colors border-l border-[#CBD5E1] dark:border-[#2E3646] ${
                isWeaponTarget
                  ? 'bg-[#094AD8] text-white shadow-2xs'
                  : 'bg-[#F8FAFC] dark:bg-[#16181D] text-[#475569] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
              }`}
            >
              Weapon ESC ({weaponCellCount}S {weaponChemistry.toUpperCase()})
            </button>
          </div>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Electrical & Lead Inputs */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                Power Leads & ESC Electrical Parameters
              </h3>
              <span className="text-xs font-mono text-[#64748B] dark:text-[#85A3E0]">
                {isWeaponTarget ? 'Weapon ESC' : 'Drive ESC'} · {currentClass.shortName} Setup
              </span>
            </div>

            {/* 1. Total Battery-to-ESC Wire Length Card */}
            <div className="flex flex-col gap-2 p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646]">
              <FieldInputWithToggle
                label="Total Battery-to-ESC Wire Length"
                value={state.wireLength}
                unit={state.wireLengthUnit}
                units={['mm', 'in']}
                onChangeValue={(val) => onChange({ ...state, wireLength: val })}
                onChangeValueAndUnit={(val, unit: LengthUnit) =>
                  onChange({ ...state, wireLength: val, wireLengthUnit: unit })
                }
                step={state.wireLengthUnit === 'in' ? 0.5 : 10}
                min={state.wireLengthUnit === 'in' ? 0.5 : 10}
                helperText="Combined total length of positive (+) and negative (-) battery leads, switch harness, and ESC wire"
              />

              {/* Wire Length Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
                  Presets:
                </span>
                {WIRE_LENGTH_PRESETS.map((p) => {
                  const targetVal = state.wireLengthUnit === 'in' ? p.in : p.mm;
                  const isActive = Math.abs(state.wireLength - targetVal) < 0.1;
                  return (
                    <button
                      key={p.mm}
                      type="button"
                      onClick={() => onChange({ ...state, wireLength: targetVal })}
                      className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded-none transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#094AD8] text-white shadow-2xs'
                          : 'bg-white dark:bg-[#1F232B] border border-[#CBD5E1] dark:border-[#2E3646] text-[#475569] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                      }`}
                    >
                      {state.wireLengthUnit === 'in' ? `${p.in}"` : `${p.mm}mm`} ({p.tag})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Estimated Peak Inrush / Burst Current Card */}
            <div className="flex flex-col gap-2 p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646]">
              <FieldInputWithToggle
                label="Peak Current / ESC Max Burst (Amps)"
                value={state.peakCurrentAmps}
                unit="A"
                onChangeValue={(val) =>
                  onChange({ ...state, peakCurrentAmps: Math.max(val, 1) })
                }
                step={5}
                min={5}
                max={600}
                helperText="Maximum instantaneous locked-rotor or spin-up burst current drawn by motor/ESC"
              />

              {/* Peak Current Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
                  Presets:
                </span>
                {CURRENT_PRESETS.map((p) => {
                  const isActive = Math.abs(state.peakCurrentAmps - p.value) < 1;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => onChange({ ...state, peakCurrentAmps: p.value })}
                      className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded-none transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#094AD8] text-white shadow-2xs'
                          : 'bg-white dark:bg-[#1F232B] border border-[#CBD5E1] dark:border-[#2E3646] text-[#475569] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                      }`}
                    >
                      {p.label} ({p.tag})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Ripple & Safety Margin Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Allowable Voltage Ripple */}
              <div className="flex flex-col gap-2 p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646]">
                <FieldInputWithToggle
                  label="Allowable Voltage Ripple (ΔV)"
                  value={state.allowableRippleVolts}
                  unit="V"
                  onChangeValue={(val) =>
                    onChange({ ...state, allowableRippleVolts: Math.max(val, 0.1) })
                  }
                  step={0.1}
                  min={0.2}
                  max={5.0}
                  helperText="Target ripple ceiling (1.0V typical for brushless ESCs)"
                />

                {/* Ripple Target Quick Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
                    Targets:
                  </span>
                  {RIPPLE_PRESETS.map((p) => {
                    const isActive = Math.abs(state.allowableRippleVolts - p.value) < 0.05;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => onChange({ ...state, allowableRippleVolts: p.value })}
                        className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded-none transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#094AD8] text-white shadow-2xs'
                            : 'bg-white dark:bg-[#1F232B] border border-[#CBD5E1] dark:border-[#2E3646] text-[#475569] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                        }`}
                      >
                        {p.label} ({p.tag})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Safety Margin Factor (Preset Buttons 2.0x, 2.5x, 3.0x, 4.0x) */}
              <div className="flex flex-col gap-2 p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                    Safety Margin (k-factor)
                  </label>
                  <span className="text-xs font-mono font-bold text-[#094AD8] dark:text-[#60A5FA]">
                    {activeSafetyFactorObj.label}
                  </span>
                </div>

                {/* Preset Buttons Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {SAFETY_FACTORS.map((sf) => {
                    const isActive = Math.abs(state.safetyFactor - sf.value) < 0.05;
                    return (
                      <button
                        key={sf.value}
                        type="button"
                        onClick={() => onChange({ ...state, safetyFactor: sf.value })}
                        className={`px-2 py-1.5 text-xs font-mono font-semibold rounded-none transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer text-center ${
                          isActive
                            ? 'bg-[#094AD8] text-white shadow-2xs border border-[#094AD8]'
                            : 'bg-white dark:bg-[#1F232B] border border-[#CBD5E1] dark:border-[#2E3646] text-[#334155] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                        }`}
                      >
                        <span className="text-xs font-bold leading-none">{sf.label}</span>
                        <span
                          className={`text-[9px] font-normal leading-tight truncate w-full ${
                            isActive ? 'text-white/80' : 'text-[#64748B] dark:text-[#85A3E0]/70'
                          }`}
                        >
                          {sf.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <span className="text-[11px] text-[#64748B] dark:text-[#85A3E0] leading-snug">
                  {activeSafetyFactorObj.desc}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recommended Capacitance Telemetry */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            <div className="pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                Capacitance Sizing Analysis
              </h3>
              {results.isWireExcessive && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wide bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 px-2 py-0.5">
                  Long Leads
                </span>
              )}
            </div>

            {/* Primary Big Result: Recommended Added Capacitance */}
            <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-5 flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wider font-mono text-[#64748B] dark:text-[#85A3E0]">
                Recommended Added Capacitance
              </span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl sm:text-5xl font-extrabold font-mono text-[#094AD8] dark:text-white tabular-nums">
                  {results.recommendedCapacitanceUf.toLocaleString()}
                </span>
                <span className="text-lg font-mono font-bold text-[#0F172A] dark:text-[#094AD8]">
                  µF
                </span>
              </div>
              <div className="text-sm font-mono text-[#64748B] dark:text-[#85A3E0] mt-0.5">
                Rating: ≥ {results.recommendedVoltageRatingVolts}V Low-ESR (105°C)
              </div>
            </div>

            {/* Secondary Metrics 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3.5 flex flex-col">
                <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Min Voltage Rating
                </span>
                <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.recommendedVoltageRatingVolts}V
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70 mt-0.5">
                  Safe for {results.maxPackVoltage.toFixed(1)}V pack max
                </span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3.5 flex flex-col">
                <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Loop Inductance
                </span>
                <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.loopInductanceNanoHenrys.toFixed(0)}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">nH</span>
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70 mt-0.5">
                  Over {results.wireLengthMm.toFixed(0)} mm wire length
                </span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3.5 flex flex-col">
                <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Unfiltered Kick
                </span>
                <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                  +{results.unfilteredSpikeVolts.toFixed(1)}V
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70 mt-0.5">
                  Spike without added caps
                </span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3.5 flex flex-col">
                <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Theoretical Min
                </span>
                <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.theoreticalMinCapacitanceUf.toFixed(0)}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">µF</span>
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70 mt-0.5">
                  Energy balance minimum
                </span>
              </div>
            </div>

            {/* Preset Capacitor Selection Buttons & Capacitor Count Guidance */}
            <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0F172A] dark:text-[#CEDDFD]">
                  Capacitor Bank Builder (Pit Inventory)
                </span>
                <span className="text-[11px] font-mono text-[#094AD8] dark:text-[#60A5FA]">
                  {selectedCapacitorUf}µF Selected
                </span>
              </div>

              <span className="text-[11px] text-[#64748B] dark:text-[#85A3E0]">
                Select your pit stock capacitor size to compute required parallel count:
              </span>

              {/* Preset Capacitor Selection Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {PRESET_CAPACITORS.map((preset) => {
                  const isActive = selectedCapacitorUf === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setSelectedCapacitorUf(preset.value)}
                      className={`px-1 py-1.5 text-xs font-mono font-semibold rounded-none transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer text-center ${
                        isActive
                          ? 'bg-[#094AD8] text-white shadow-2xs border border-[#094AD8]'
                          : 'bg-white dark:bg-[#1F232B] border border-[#CBD5E1] dark:border-[#2E3646] text-[#334155] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                      }`}
                    >
                      <span className="text-xs font-bold leading-none">{preset.value}</span>
                      <span
                        className={`text-[9px] font-normal leading-tight truncate w-full ${
                          isActive ? 'text-white/80' : 'text-[#64748B] dark:text-[#85A3E0]/70'
                        }`}
                      >
                        {preset.tag}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Capacitor Count Guidance Result */}
              <div className="p-3 bg-white dark:bg-[#1F232B] border border-[#CBD5E1] dark:border-[#2E3646] rounded-none flex flex-col gap-1 mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-mono font-bold text-[#094AD8] dark:text-[#60A5FA]">
                    Capacitor Count Guidance
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                    {capsNeeded}x in parallel
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  Install {capsNeeded}x {selectedCapacitorUf}µF Low-ESR ({results.recommendedVoltageRatingVolts}V)
                </div>
                <div className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
                  Total Bank: {totalBankCapacitanceUf} µF ({bankMarginPercent}% of {results.recommendedCapacitanceUf} µF requirement)
                </div>
                <div className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/80 pt-0.5">
                  Recommended: Rubycon ZLH, Panasonic FR/FC, or Nichicon PW series
                </div>
              </div>
            </div>

            {/* Technical Calculation Formula Breakdown Box */}
            <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  Technical Calculation Formula Breakdown
                </span>
                <button
                  type="button"
                  onClick={() => setShowFormulaBreakdown(!showFormulaBreakdown)}
                  className="text-[11px] font-mono text-[#094AD8] dark:text-[#60A5FA] hover:underline cursor-pointer"
                >
                  {showFormulaBreakdown ? '[ Hide ]' : '[ Show ]'}
                </button>
              </div>

              {showFormulaBreakdown && (
                <div className="flex flex-col gap-3 pt-1 text-xs text-[#334155] dark:text-[#85A3E0] font-mono leading-relaxed border-t border-[#E2E8F0] dark:border-[#2E3646]">
                  {/* Energy Balance Equation */}
                  <div className="p-2.5 bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-1">
                    <span className="font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                      1. Inductive Energy-Balance Formula:
                    </span>
                    <div className="text-[#094AD8] dark:text-[#60A5FA] font-bold">
                      C ≥ k · (L · I²) / (ΔV²)
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#85A3E0]">
                      C ≥ {state.safetyFactor.toFixed(1)} · ({results.loopInductanceNanoHenrys.toFixed(0)}nH · {state.peakCurrentAmps}A²) / ({state.allowableRippleVolts.toFixed(1)}V²) = {results.theoreticalMinCapacitanceUf.toFixed(0)} µF
                    </div>
                  </div>

                  {/* Empirical Combat Baseline */}
                  <div className="p-2.5 bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-1">
                    <span className="font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                      2. Empirical Combat Bulk Rule:
                    </span>
                    <div className="text-[#094AD8] dark:text-[#60A5FA] font-bold">
                      C_emp = 8 µF/A · I + 55 µF/in · (wireLength - 2)
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#85A3E0]">
                      C_emp = (8 · {state.peakCurrentAmps}) + (55 · max(0, {results.wireLengthIn.toFixed(1)} - 2)) = {results.baseBulkCapacitanceUf.toFixed(0)} µF
                    </div>
                  </div>

                  {/* Unfiltered Inductive Spike */}
                  <div className="p-2.5 bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-1">
                    <span className="font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                      3. Unfiltered Inductive Voltage Kick:
                    </span>
                    <div className="text-amber-600 dark:text-amber-400 font-bold">
                      ΔV_spike = I · √(L / C_onboard) ≈ +{results.unfilteredSpikeVolts.toFixed(1)}V
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#85A3E0]">
                      Without added low-ESR bulk capacitance, rapid PWM MOSFET switching creates dangerous overvoltage spikes that destroy FET gate oxide and trigger MCU brownouts.
                    </div>
                  </div>

                  {/* Voltage Derating Guideline */}
                  <div className="p-2.5 bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-1">
                    <span className="font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                      4. Voltage Rating Derating Rule:
                    </span>
                    <div className="text-[#0F172A] dark:text-[#CEDDFD]">
                      V_rating ≥ 1.4x – 1.5x V_pack,max ({results.maxPackVoltage.toFixed(1)}V → ≥ {results.recommendedVoltageRatingVolts}V)
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#85A3E0]">
                      Protects against back-EMF energy spikes during hard weapon stalls and active regenerative braking.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Combat Pit Recommendation Box */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] text-xs text-[#64748B] dark:text-[#85A3E0] leading-relaxed">
              <div className="font-semibold text-[#0F172A] dark:text-[#CEDDFD] mb-1">
                Combat Wiring Rule of Thumb
              </div>
              Keep battery-to-ESC leads under 100mm (4 in). Solder capacitors directly across the ESC battery pads with leads under 8mm. If physical chassis separation cannot be avoided, lengthen the 3-phase AC motor wires instead of battery DC wires.
            </div>
          </div>
        </div>
      </div>

      {/* SPARC v1.7 48V Warning Box at the bottom */}
      <SparcVoltageWarningBox packVoltage={results.packVoltage} />
    </div>
  );
};
