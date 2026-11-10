/**
 * Late Night Combat Robotics Calculator Suite
 * Recommended Capacitance Calculator (ESC Wire Inductance & Ripple Suppression)
 * Derived from Combat Robotics electrical principles (Too Hot / RoboCalc)
 * Dual-theme (light and dark) support. No icons.
 */

import React from 'react';
import {
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
  const results = computeCapacitance(
    state,
    chemistry,
    voltageState,
    useDirectVoltage ? directVoltage : undefined
  );
  const currentClass = WEIGHT_CLASSES.find((w) => w.id === weightClass) || WEIGHT_CLASSES[0];

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
                {currentClass.shortName} Setup
              </span>
            </div>

            {/* Total Battery-to-ESC Wire Length */}
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
              helperText="Combined length of battery lead + switch + harness"
            />

            {/* Peak / Stall Current */}
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
              helperText="Maximum instantaneous burst current drawn by motor/ESC"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Allowable Voltage Ripple */}
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

              {/* Safety Margin Factor */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Safety Margin (k-factor)
                </label>
                <select
                  value={state.safetyFactor}
                  onChange={(e) =>
                    onChange({ ...state, safetyFactor: parseFloat(e.target.value) })
                  }
                  className="w-full bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] rounded-none px-3 py-2 text-sm text-[#0F172A] dark:text-[#CEDDFD] font-mono outline-none focus:border-[#094AD8] shadow-2xs cursor-pointer"
                >
                  <option value={2.0}>2.0x (Standard / Moderate Driving)</option>
                  <option value={3.0}>3.0x (Combat Recommended / High Shock)</option>
                  <option value={4.0}>4.0x (Heavy Weapon / Frequent Stalls)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recommended Capacitance Telemetry */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            <div className="pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                Capacitance Sizing Analysis
              </h3>
            </div>

            {/* Primary Big Result: Recommended Capacitance */}
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

            {/* Secondary Metrics */}
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

              <div className="col-span-2 bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3.5 flex flex-col">
                <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Suggested Capacitor Bank
                </span>
                <span className="text-sm font-bold font-mono text-[#094AD8] dark:text-[#60A5FA] mt-1">
                  {results.suggestedPackConfig}
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70 mt-0.5">
                  Use Rubycon ZLH, Panasonic FR/FC, or Nichicon PW low-ESR series
                </span>
              </div>
            </div>

            {/* Combat Pit Recommendation Box */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] text-xs text-[#64748B] dark:text-[#85A3E0] leading-relaxed">
              <div className="font-semibold text-[#0F172A] dark:text-[#CEDDFD] mb-1">
                Combat Wiring Rule of Thumb
              </div>
              Keep battery-to-ESC leads under 100mm (4 in). Solder capacitors directly across the ESC battery pads with leads under 8mm. If distance cannot be avoided, lengthen the 3-phase motor wires instead of battery DC wires.
            </div>
          </div>
        </div>
      </div>

      {/* SPARC v1.7 48V Warning Box at the bottom */}
      <SparcVoltageWarningBox packVoltage={results.packVoltage} />
    </div>
  );
};
