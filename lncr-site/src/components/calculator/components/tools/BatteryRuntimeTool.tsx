/**
 * Late Night Combat Robotics Calculator Suite
 * Battery Sizing, Run-Time & Watt-Hour Engineering Calculator
 * Dual-theme (light and dark) support.
 */

import React from 'react';
import type {
  BatteryRuntimeState,
  BatteryChemistry,
  VoltageState,
  WeightClassId,
} from '../../types';
import { computeBatteryRuntime } from '../../utils/calculations';
import { FieldInputWithToggle } from '../common/FieldInputWithToggle';
import { BatteryVoltageBar } from '../common/BatteryVoltageBar';
import { SparcVoltageWarningBox } from '../common/SparcVoltageWarningBox';

interface BatteryRuntimeToolProps {
  state: BatteryRuntimeState;
  onChange: (newState: BatteryRuntimeState) => void;
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

export const BatteryRuntimeTool: React.FC<BatteryRuntimeToolProps> = ({
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
  const results = computeBatteryRuntime(
    state,
    chemistry,
    useDirectVoltage ? directVoltage : undefined
  );

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

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Electrical Loads & Match Profile */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  Current Consumption & Match Profile
                </h3>
              </div>
              <span className="text-xs font-mono text-[#64748B] dark:text-[#85A3E0]">
                {results.totalAvgCurrentAmps.toFixed(1)}A Total Draw
              </span>
            </div>

            {/* Battery Pack Installed Capacity */}
            <FieldInputWithToggle
              label="Installed Battery Pack Capacity"
              value={state.batteryCapacityMah}
              unit="mAh"
              onChangeValue={(val) => onChange({ ...state, batteryCapacityMah: val })}
              step={50}
              min={50}
              max={25000}
              helperText="Rated capacity stamped on the pack label"
            />

            {/* Drivetrain Load */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-3">
              <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                Drivetrain Current Draw
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInputWithToggle
                  label="Drive Motors Count"
                  value={state.driveMotorCount}
                  unit="motors"
                  onChangeValue={(val) =>
                    onChange({ ...state, driveMotorCount: Math.round(val) })
                  }
                  step={1}
                  min={1}
                  max={6}
                />
                <FieldInputWithToggle
                  label="Avg Current / Drive Motor"
                  value={state.avgDriveCurrentAmps}
                  unit="A"
                  onChangeValue={(val) => onChange({ ...state, avgDriveCurrentAmps: val })}
                  step={0.5}
                  min={0.1}
                  max={150}
                  helperText="Average active driving current"
                />
              </div>
            </div>

            {/* Weapon Load */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-3">
              <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                Weapon Current Draw
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInputWithToggle
                  label="Weapon Motors Count"
                  value={state.weaponMotorCount}
                  unit="motors"
                  onChangeValue={(val) =>
                    onChange({ ...state, weaponMotorCount: Math.round(val) })
                  }
                  step={1}
                  min={0}
                  max={4}
                />
                <FieldInputWithToggle
                  label="Avg Current / Weapon Motor"
                  value={state.avgWeaponCurrentAmps}
                  unit="A"
                  onChangeValue={(val) => onChange({ ...state, avgWeaponCurrentAmps: val })}
                  step={1}
                  min={0}
                  max={300}
                  helperText="Average spinning & spin-up current"
                />
              </div>
            </div>

            {/* Match Duration & Safety Reserve */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0] dark:border-[#2E3646]">
              <FieldInputWithToggle
                label="Match Duration (SPARC/NHRL)"
                value={state.matchDurationSec}
                unit="sec"
                onChangeValue={(val) => onChange({ ...state, matchDurationSec: val })}
                step={30}
                min={30}
                max={600}
                helperText="Standard match is 180 sec (3 min)"
              />
              <FieldInputWithToggle
                label="Safety Reserve Margin"
                value={state.reserveMarginPercent}
                unit="%"
                onChangeValue={(val) => onChange({ ...state, reserveMarginPercent: val })}
                step={5}
                min={0}
                max={100}
                helperText="Extra capacity buffer (20% standard)"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Computed Battery Sizing HUD */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  Capacity Consumption & Pack Metrics
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#094AD8]">
                {results.packWattHours.toFixed(1)} Wh Energy
              </span>
            </div>

            {/* Primary KPI: Recommended Battery Capacity */}
            <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-4 flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider font-mono text-[#64748B] dark:text-[#85A3E0]">
                Recommended Pack Capacity (+{state.reserveMarginPercent}% Buffer)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-mono text-[#094AD8] dark:text-white tabular-nums">
                  {results.recommendedCapacityMah.toFixed(0)}
                </span>
                <span className="text-lg font-mono font-bold text-[#0F172A] dark:text-[#094AD8]">mAh</span>
                <span className="text-sm font-mono text-[#64748B] dark:text-[#85A3E0] ml-3">
                  (Consumed: {results.capacityConsumedMah.toFixed(0)} mAh)
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#85A3E0]/80 mt-1 font-mono">
                Prevents voltage sag into ESC low-voltage cutoff during long 3-minute bouts.
              </p>
            </div>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Full Depletion Runtime
                </span>
                <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.estimatedFullMatchRuntimeMin.toFixed(1)}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">min</span>
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  {(results.estimatedFullMatchRuntimeMin * 60).toFixed(0)} seconds continuous
                </span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Drive vs Weapon Split
                </span>
                <span className="text-base font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.driveCurrentAmps.toFixed(0)}A / {results.weaponCurrentAmps.toFixed(0)}A
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  Drive / Weapon draw
                </span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Watt-Hours Rating
                </span>
                <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.packWattHours.toFixed(1)}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">Wh</span>
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  @ {results.packNominalVoltage.toFixed(1)}V nominal
                </span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  C-Rate @ Average Draw
                </span>
                <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {state.batteryCapacityMah > 0
                    ? (results.totalAvgCurrentAmps / (state.batteryCapacityMah / 1000)).toFixed(1)
                    : '0'}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">C</span>
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  Continuous discharge
                </span>
              </div>
            </div>

            {/* Airline Carry-On Travel Regulations Box */}
            <div
              className={`p-4 rounded-none border flex items-start gap-3 ${
                results.airlineStatus === 'allowed'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                  : results.airlineStatus === 'requires_approval'
                  ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-950 dark:text-amber-200'
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-950 dark:text-rose-200'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#475569] dark:text-[#85A3E0]">
                    Airline Travel Regulation (FAA / TSA / IATA)
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-none ${
                      results.airlineStatus === 'allowed'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        : results.airlineStatus === 'requires_approval'
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {results.airlineStatus === 'allowed'
                      ? 'CARRY-ON PERMITTED (<100 Wh)'
                      : results.airlineStatus === 'requires_approval'
                      ? 'AIRLINE APPROVAL REQUIRED (100–160 Wh)'
                      : 'PROHIBITED ON PASSENGER AIRCRAFT (>160 Wh)'}
                  </span>
                </div>
                <p className="text-xs text-[#475569] dark:text-[#85A3E0] leading-relaxed">
                  {results.airlineStatus === 'allowed' ? (
                    <>
                      Pack is <strong className="text-[#0F172A] dark:text-white font-mono">{results.packWattHours.toFixed(1)} Wh</strong>, which is under the 100 Wh threshold. Permitted in carry-on baggage with terminals taped.
                    </>
                  ) : results.airlineStatus === 'requires_approval' ? (
                    <>
                      Pack is <strong className="text-amber-800 dark:text-amber-300 font-mono">{results.packWattHours.toFixed(1)} Wh</strong>. Airlines permit up to two 100–160 Wh spare batteries in carry-on with prior airline approval.
                    </>
                  ) : (
                    <>
                      Pack is <strong className="text-rose-800 dark:text-rose-300 font-mono">{results.packWattHours.toFixed(1)} Wh</strong>. Exceeds the 160 Wh legal limit for commercial passenger flights. Must be shipped ground freight.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SPARC v1.7 48V Warning Box at the bottom */}
      <SparcVoltageWarningBox packVoltage={results.packMaxVoltage} />
    </div>
  );
};
