/**
 * Late Night Combat Robotics Calculator Suite
 * Battery Sizing, Run-Time & Watt-Hour Engineering Calculator
 * Dual-theme (light and dark) support. Zero border-radius Serious Mode.
 * Adheres strictly to SPARC v1.7 specifications and NHRL competition standards.
 */

import React from 'react';
import type {
  BatteryRuntimeState,
  BatteryChemistry,
  VoltageState,
  WeightClassId,
} from '../../types';
import {
  BATTERY_CHEMISTRIES,
  RECOMMENDED_CELL_COUNTS,
  WEIGHT_CLASSES,
} from '../../utils/constants';
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
  // Ensure auxCurrentAmps is always a valid number (defaults to 0.2A if not yet set)
  const auxCurrentAmps = state.auxCurrentAmps ?? 0.2;

  const results = computeBatteryRuntime(
    {
      ...state,
      auxCurrentAmps,
    },
    chemistry,
    useDirectVoltage ? directVoltage : undefined
  );

  const currentClass =
    WEIGHT_CLASSES.find((w) => w.id === weightClass) || WEIGHT_CLASSES[1];
  const [minS, maxS] = currentClass.recommendedS;
  const cellOptions = RECOMMENDED_CELL_COUNTS[weightClass] || [3, 4, 5, 6];

  // Current and Energy Breakdowns
  const driveAmps = state.driveMotorCount * state.avgDriveCurrentAmps;
  const weaponAmps = state.weaponMotorCount * state.avgWeaponCurrentAmps;
  const totalAmps = results.totalAvgCurrentAmps;
  const matchHours = state.matchDurationSec / 3600.0;

  const driveMah = driveAmps * matchHours * 1000.0;
  const weaponMah = weaponAmps * matchHours * 1000.0;
  const auxMah = auxCurrentAmps * matchHours * 1000.0;
  const consumedMah = results.capacityConsumedMah;
  const consumedWh =
    (consumedMah / 1000.0) * results.packNominalVoltage;

  // Percentage of energy by subsystem
  const drivePct = totalAmps > 0 ? (driveAmps / totalAmps) * 100 : 0;
  const weaponPct = totalAmps > 0 ? (weaponAmps / totalAmps) * 100 : 0;
  const auxPct = totalAmps > 0 ? (auxCurrentAmps / totalAmps) * 100 : 0;

  // Remaining capacity metrics
  const remainingMah = Math.max(0, state.batteryCapacityMah - consumedMah);
  const remainingPct =
    state.batteryCapacityMah > 0
      ? Math.max(0, ((state.batteryCapacityMah - consumedMah) / state.batteryCapacityMah) * 100)
      : 0;

  // Effective Runtime with reserve margin preserved vs full depletion
  const effectiveRuntimeMin =
    totalAmps > 0
      ? ((state.batteryCapacityMah * (1.0 - state.reserveMarginPercent / 100.0)) /
          1000.0 /
          totalAmps) *
        60.0
      : 0;
  const effectiveRuntimeSec = effectiveRuntimeMin * 60.0;
  const fullRuntimeSec = results.estimatedFullMatchRuntimeMin * 60.0;

  // C-Rate Discharge Stress Calculation
  const cRate =
    state.batteryCapacityMah > 0
      ? totalAmps / (state.batteryCapacityMah / 1000.0)
      : 0;

  // Stress Level Tiers
  // Low: <15C, Moderate: 15-35C, High: 35-50C, Extreme: >50C
  const stressTier: 'low' | 'moderate' | 'high' | 'extreme' =
    cRate < 15
      ? 'low'
      : cRate < 35
      ? 'moderate'
      : cRate < 50
      ? 'high'
      : 'extreme';

  // Pack capacity adequacy evaluation
  const isAdequate = state.batteryCapacityMah >= results.recommendedCapacityMah;
  const isMarginal =
    !isAdequate && state.batteryCapacityMah >= results.capacityConsumedMah;
  const isUndersized = state.batteryCapacityMah < results.capacityConsumedMah;

  return (
    <div className="flex flex-col gap-6">
      {/* Battery System Bar */}
      <BatteryVoltageBar
        chemistry={chemistry}
        onChangeChemistry={onChangeChemistry}
        voltageState={voltageState}
        onChangeVoltageState={onChangeVoltageState}
        cellCount={state.cellCount}
        onChangeCellCount={(cells: number) => onChange({ ...state, cellCount: cells })}
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
        {/* ======================================================== */}
        {/* Left Column: Electrical Loads & Match Profile            */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646] flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  Current Consumption & Match Profile
                </h3>
                <p className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]/80">
                  Subsystem load profiles & match parameters
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-[#F1F5F9] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] text-[#094AD8] dark:text-[#60A5FA]">
                {results.totalAvgCurrentAmps.toFixed(1)}A Total Draw
              </span>
            </div>

            {/* 1. Installed Battery Pack Configuration & Capacity */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Installed Battery Pack
                </span>
                <span className="text-[11px] font-mono text-[#094AD8] dark:text-[#60A5FA] font-bold">
                  {useDirectVoltage
                    ? `${directVoltage.toFixed(1)}V Direct DC`
                    : `${state.cellCount}S ${BATTERY_CHEMISTRIES[chemistry].label} (${results.packNominalVoltage.toFixed(1)}V Nom)`}
                </span>
              </div>

              {/* Chemistry & Cell Count Toggles (Synchronized with Power Bar) */}
              {!useDirectVoltage && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-[#E2E8F0] dark:border-[#2E3646]">
                  {/* Chemistry Toggle */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-[#475569] dark:text-[#85A3E0]">
                      Chemistry
                    </span>
                    <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#F1F5F9] dark:bg-[#1F232B] border border-[#CBD5E1] dark:border-[#333C4D] rounded-none">
                      {(['lipo', 'lihv', 'nimh'] as BatteryChemistry[]).map((chem) => {
                        const isActive = chemistry === chem;
                        return (
                          <button
                            key={chem}
                            type="button"
                            onClick={() => onChangeChemistry(chem)}
                            className={`py-1 text-xs font-mono font-semibold rounded-none cursor-pointer transition-all text-center whitespace-nowrap ${
                              isActive
                                ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                                : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                            }`}
                          >
                            {BATTERY_CHEMISTRIES[chem].label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cell Count Buttons */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#475569] dark:text-[#85A3E0]">
                        Cell Count
                      </span>
                      <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                        {currentClass.shortName}: {minS}–{maxS}S rec
                      </span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                      {cellOptions.map((s) => {
                        const isActive = state.cellCount === s;
                        const isRecommended = s >= minS && s <= maxS;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => onChange({ ...state, cellCount: s })}
                            className={`flex-1 min-w-[28px] py-1 text-xs font-mono font-bold rounded-none cursor-pointer transition-all ${
                              isActive
                                ? 'bg-[#094AD8] text-white shadow-2xs ring-1 ring-white/20'
                                : isRecommended
                                ? 'bg-white dark:bg-[#1F232B] text-[#0F172A] dark:text-[#CEDDFD] border border-[#CBD5E1] dark:border-[#333C4D] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                                : 'bg-[#F1F5F9]/60 dark:bg-[#16181D]/60 text-[#94A3B8] dark:text-[#85A3E0]/40 border border-[#E2E8F0] dark:border-[#2E3646]/50 hover:text-[#475569]'
                            }`}
                          >
                            {s}S
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Battery Pack Installed Capacity Input */}
              <FieldInputWithToggle
                label="Installed Battery Pack Capacity"
                value={state.batteryCapacityMah}
                unit="mAh"
                onChangeValue={(val) =>
                  onChange({ ...state, batteryCapacityMah: Math.max(0, val) })
                }
                step={50}
                min={50}
                max={30000}
                helperText="Rated capacity stamped on the pack label"
              />

              {/* Pack Capacity Quick Presets */}
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] dark:text-[#85A3E0]/70 select-none">
                  Common Pack Capacities:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[300, 450, 850, 1300, 1500, 2200].map((cap) => {
                    const isActive = state.batteryCapacityMah === cap;
                    return (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => onChange({ ...state, batteryCapacityMah: cap })}
                        className={`py-1 px-1.5 text-xs font-mono font-semibold rounded-none cursor-pointer transition-all text-center whitespace-nowrap ${
                          isActive
                            ? 'bg-[#094AD8] text-white shadow-2xs font-bold ring-1 ring-white/20'
                            : 'bg-white dark:bg-[#1F232B] text-[#64748B] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#2E3646] hover:bg-[#E2E8F0] dark:hover:bg-[#222733] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                        }`}
                      >
                        {cap}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Drivetrain Load */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Drivetrain Current Draw
                </span>
                <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
                  {driveAmps.toFixed(1)}A Total Drive ({state.driveMotorCount} × {state.avgDriveCurrentAmps.toFixed(1)}A)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Drive Motors Count */}
                <div className="flex flex-col gap-1.5">
                  <FieldInputWithToggle
                    label="Drive Motors Count"
                    value={state.driveMotorCount}
                    unit="motors"
                    onChangeValue={(val) =>
                      onChange({ ...state, driveMotorCount: Math.max(1, Math.round(val)) })
                    }
                    step={1}
                    min={1}
                    max={6}
                  />

                  {/* Drive Motor Count Quick Toggles (2WD, 4WD, etc.) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                    {[
                      { count: 1, label: '1 Motor' },
                      { count: 2, label: '2WD (2)' },
                      { count: 4, label: '4WD (4)' },
                      { count: 6, label: '6WD (6)' },
                    ].map(({ count, label }) => {
                      const isActive = state.driveMotorCount === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => onChange({ ...state, driveMotorCount: count })}
                          className={`py-1 px-1 text-xs font-mono font-semibold rounded-none cursor-pointer transition-all text-center whitespace-nowrap ${
                            isActive
                              ? 'bg-[#094AD8] text-white shadow-2xs font-bold ring-1 ring-white/20'
                              : 'bg-white dark:bg-[#1F232B] text-[#64748B] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#2E3646] hover:bg-[#E2E8F0] dark:hover:bg-[#222733] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Avg Current per Drive Motor */}
                <div className="flex flex-col gap-1.5">
                  <FieldInputWithToggle
                    label="Avg Current / Drive Motor"
                    value={state.avgDriveCurrentAmps}
                    unit="A"
                    onChangeValue={(val) =>
                      onChange({ ...state, avgDriveCurrentAmps: Math.max(0.1, val) })
                    }
                    step={0.5}
                    min={0.1}
                    max={150}
                    helperText="Average active driving current"
                  />

                  {/* Typical Drive Motor Current Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                    {[
                      { amps: 2.5, label: '2.5A (Ant)' },
                      { amps: 4.5, label: '4.5A (Beetle)' },
                      { amps: 8.0, label: '8.0A (Heavy)' },
                      { amps: 25.0, label: '25A (BigBot)' },
                    ].map(({ amps, label }) => {
                      const isActive =
                        Math.abs(state.avgDriveCurrentAmps - amps) < 0.05;
                      return (
                        <button
                          key={amps}
                          type="button"
                          onClick={() =>
                            onChange({ ...state, avgDriveCurrentAmps: amps })
                          }
                          className={`py-1 px-1 text-xs font-mono font-semibold rounded-none cursor-pointer transition-all text-center whitespace-nowrap ${
                            isActive
                              ? 'bg-[#094AD8] text-white shadow-2xs font-bold ring-1 ring-white/20'
                              : 'bg-white dark:bg-[#1F232B] text-[#64748B] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#2E3646] hover:bg-[#E2E8F0] dark:hover:bg-[#222733] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Weapon Load */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Weapon Current Draw
                </span>
                <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
                  {weaponAmps.toFixed(1)}A Total Weapon ({state.weaponMotorCount} × {state.avgWeaponCurrentAmps.toFixed(1)}A)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Weapon Motors Count */}
                <div className="flex flex-col gap-1.5">
                  <FieldInputWithToggle
                    label="Weapon Motors Count"
                    value={state.weaponMotorCount}
                    unit="motors"
                    onChangeValue={(val) =>
                      onChange({ ...state, weaponMotorCount: Math.max(0, Math.round(val)) })
                    }
                    step={1}
                    min={0}
                    max={4}
                  />

                  {/* Weapon Motor Count Quick Toggles (0, 1, 2) */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[
                      { count: 0, label: '0 (None)' },
                      { count: 1, label: '1 Motor' },
                      { count: 2, label: '2 Motors' },
                    ].map(({ count, label }) => {
                      const isActive = state.weaponMotorCount === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => onChange({ ...state, weaponMotorCount: count })}
                          className={`py-1 px-1 text-xs font-mono font-semibold rounded-none cursor-pointer transition-all text-center whitespace-nowrap ${
                            isActive
                              ? 'bg-[#094AD8] text-white shadow-2xs font-bold ring-1 ring-white/20'
                              : 'bg-white dark:bg-[#1F232B] text-[#64748B] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#2E3646] hover:bg-[#E2E8F0] dark:hover:bg-[#222733] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Avg Current per Weapon Motor */}
                <div className="flex flex-col gap-1.5">
                  <FieldInputWithToggle
                    label="Avg Current / Weapon Motor"
                    value={state.avgWeaponCurrentAmps}
                    unit="A"
                    onChangeValue={(val) =>
                      onChange({ ...state, avgWeaponCurrentAmps: Math.max(0, val) })
                    }
                    step={1}
                    min={0}
                    max={300}
                    helperText="Average spinning & spin-up current"
                  />

                  {/* Typical Weapon Current Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                    {[
                      { amps: 0, label: '0A (None)' },
                      { amps: 8, label: '8A (Ant)' },
                      { amps: 18, label: '18A (Beetle)' },
                      { amps: 35, label: '35A (Heavy)' },
                    ].map(({ amps, label }) => {
                      const isActive =
                        state.weaponMotorCount > 0 &&
                        Math.abs(state.avgWeaponCurrentAmps - amps) < 0.1;
                      return (
                        <button
                          key={amps}
                          type="button"
                          onClick={() =>
                            onChange({ ...state, avgWeaponCurrentAmps: amps })
                          }
                          className={`py-1 px-1 text-xs font-mono font-semibold rounded-none cursor-pointer transition-all text-center whitespace-nowrap ${
                            isActive
                              ? 'bg-[#094AD8] text-white shadow-2xs font-bold ring-1 ring-white/20'
                              : 'bg-white dark:bg-[#1F232B] text-[#64748B] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#2E3646] hover:bg-[#E2E8F0] dark:hover:bg-[#222733] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Auxiliary Electronics Load (Receiver, BEC, LEDs, Gyros, Servos) */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Auxiliary Electronics Current Draw
                </span>
                <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
                  {auxCurrentAmps.toFixed(2)}A Aux Load
                </span>
              </div>

              <FieldInputWithToggle
                label="Aux Electronics Current Draw"
                value={auxCurrentAmps}
                unit="A"
                onChangeValue={(val) =>
                  onChange({ ...state, auxCurrentAmps: Math.max(0, val) })
                }
                step={0.05}
                min={0}
                max={10}
                helperText="Receiver, ESC BEC, LED indicators, telemetry & servos (typically 0.1A–1.0A)"
              />

              {/* Aux Load Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                {[
                  { amps: 0.1, label: '0.1A (Minimal / Rx)' },
                  { amps: 0.2, label: '0.2A (Standard SPARC)' },
                  { amps: 0.5, label: '0.5A (LEDs/Telem)' },
                  { amps: 1.0, label: '1.0A (Heavy / Servo)' },
                ].map(({ amps, label }) => {
                  const isActive = Math.abs(auxCurrentAmps - amps) < 0.01;
                  return (
                    <button
                      key={amps}
                      type="button"
                      onClick={() => onChange({ ...state, auxCurrentAmps: amps })}
                      className={`py-1 px-1.5 text-xs font-mono font-semibold rounded-none cursor-pointer transition-all text-center whitespace-nowrap ${
                        isActive
                          ? 'bg-[#094AD8] text-white shadow-2xs font-bold ring-1 ring-white/20'
                          : 'bg-white dark:bg-[#1F232B] text-[#64748B] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#2E3646] hover:bg-[#E2E8F0] dark:hover:bg-[#222733] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Match Duration & Safety Reserve */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-4">
              <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                Match Duration & Reserve Buffer
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Match Duration */}
                <div className="flex flex-col gap-1.5">
                  <FieldInputWithToggle
                    label="Match Duration (SPARC / NHRL)"
                    value={state.matchDurationSec}
                    unit="sec"
                    onChangeValue={(val) =>
                      onChange({ ...state, matchDurationSec: Math.max(10, Math.round(val)) })
                    }
                    step={10}
                    min={30}
                    max={600}
                    helperText="Standard tournament match is 180s (3 min)"
                  />

                  {/* Match Duration Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                    {[
                      { sec: 120, label: '120s (2m)' },
                      { sec: 150, label: '150s (2.5m)' },
                      { sec: 180, label: '180s (3m)' },
                      { sec: 240, label: '240s (4m)' },
                    ].map(({ sec, label }) => {
                      const isActive = state.matchDurationSec === sec;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => onChange({ ...state, matchDurationSec: sec })}
                          className={`py-1 px-1 text-xs font-mono font-semibold rounded-none cursor-pointer transition-all text-center whitespace-nowrap ${
                            isActive
                              ? 'bg-[#094AD8] text-white shadow-2xs font-bold ring-1 ring-white/20'
                              : 'bg-white dark:bg-[#1F232B] text-[#64748B] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#2E3646] hover:bg-[#E2E8F0] dark:hover:bg-[#222733] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Safety Reserve Margin */}
                <div className="flex flex-col gap-1.5">
                  <FieldInputWithToggle
                    label="Safety Reserve Margin"
                    value={state.reserveMarginPercent}
                    unit="%"
                    onChangeValue={(val) =>
                      onChange({ ...state, reserveMarginPercent: Math.max(0, val) })
                    }
                    step={5}
                    min={0}
                    max={100}
                    helperText="Capacity buffer preventing ESC low-voltage cutoff (20% standard)"
                  />

                  {/* Reserve Margin Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                    {[
                      { pct: 15, label: '15%' },
                      { pct: 20, label: '20% (Std)' },
                      { pct: 25, label: '25%' },
                      { pct: 30, label: '30%' },
                    ].map(({ pct, label }) => {
                      const isActive = state.reserveMarginPercent === pct;
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => onChange({ ...state, reserveMarginPercent: pct })}
                          className={`py-1 px-1 text-xs font-mono font-semibold rounded-none cursor-pointer transition-all text-center whitespace-nowrap ${
                            isActive
                              ? 'bg-[#094AD8] text-white shadow-2xs font-bold ring-1 ring-white/20'
                              : 'bg-white dark:bg-[#1F232B] text-[#64748B] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#2E3646] hover:bg-[#E2E8F0] dark:hover:bg-[#222733] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Right Column: Computed Battery Sizing HUD & Metrics      */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646] flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  Capacity Consumption & Pack Metrics
                </h3>
                <p className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]/80">
                  Engineering sizing & battery discharge analysis
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-[#F1F5F9] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] text-[#094AD8] dark:text-[#60A5FA]">
                {results.packWattHours.toFixed(1)} Wh Energy
              </span>
            </div>

            {/* Primary KPI Card: Recommended Battery Capacity */}
            <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-mono font-semibold text-[#64748B] dark:text-[#85A3E0]">
                  Recommended Pack Capacity (+{state.reserveMarginPercent}% Buffer)
                </span>
                <span className="text-[11px] font-mono font-bold text-[#094AD8] dark:text-[#60A5FA]">
                  Target Sizing
                </span>
              </div>

              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-extrabold font-mono text-[#094AD8] dark:text-white tabular-nums">
                  {results.recommendedCapacityMah.toFixed(0)}
                </span>
                <span className="text-lg font-mono font-bold text-[#0F172A] dark:text-[#094AD8]">
                  mAh
                </span>
                <span className="text-xs font-mono text-[#64748B] dark:text-[#85A3E0] ml-auto">
                  (Consumed: {consumedMah.toFixed(0)} mAh + {(results.recommendedCapacityMah - consumedMah).toFixed(0)} mAh buffer)
                </span>
              </div>

              {/* Status Banner: Installed Capacity vs Target */}
              <div
                className={`px-3 py-2 border rounded-none text-xs font-mono flex items-center justify-between gap-2 ${
                  isAdequate
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                    : isMarginal
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-950 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-950 dark:text-rose-200'
                }`}
              >
                <span className="font-semibold">
                  {isAdequate
                    ? `✓ Adequate Capacity: +${(state.batteryCapacityMah - results.recommendedCapacityMah).toFixed(0)} mAh above recommended sizing`
                    : isMarginal
                    ? `⚠ Marginal Sizing: Survives ${state.matchDurationSec}s, but leaves only ${(state.batteryCapacityMah - consumedMah).toFixed(0)} mAh reserve (<${state.reserveMarginPercent}%)`
                    : `✕ UNDERSIZED: Depletes at ~${(results.estimatedFullMatchRuntimeMin * 60).toFixed(0)}s (${(state.matchDurationSec - results.estimatedFullMatchRuntimeMin * 60).toFixed(0)}s premature shutdown!)`}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                  {isAdequate ? 'PASS' : isMarginal ? 'MARGINAL' : 'FAIL'}
                </span>
              </div>
            </div>

            {/* Metric 1 & Metric 2 Cards (Energy Consumed & Remaining Usable Capacity) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Total Estimated Energy Consumed */}
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3.5 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] dark:text-[#85A3E0]">
                      Energy Consumed ({state.matchDurationSec}s)
                    </span>
                    <span className="text-[10px] font-mono text-[#094AD8] dark:text-[#60A5FA] font-bold">
                      {consumedWh.toFixed(2)} Wh
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums">
                      {consumedMah.toFixed(0)}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#64748B] dark:text-[#85A3E0]">
                      mAh
                    </span>
                  </div>
                </div>

                {/* Subsystem Draw Breakdown */}
                <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-1 text-[10px] font-mono">
                  <div className="flex items-center justify-between text-[#64748B] dark:text-[#85A3E0]">
                    <span>Drive: {driveMah.toFixed(0)} mAh</span>
                    <span className="font-semibold">{drivePct.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[#64748B] dark:text-[#85A3E0]">
                    <span>Weapon: {weaponMah.toFixed(0)} mAh</span>
                    <span className="font-semibold">{weaponPct.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[#64748B] dark:text-[#85A3E0]">
                    <span>Aux / BEC: {auxMah.toFixed(0)} mAh</span>
                    <span className="font-semibold">{auxPct.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Remaining Usable Capacity */}
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3.5 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] dark:text-[#85A3E0]">
                      Remaining Capacity
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        remainingPct >= state.reserveMarginPercent
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : remainingPct > 0
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {remainingPct.toFixed(1)}% remaining
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums">
                      {remainingMah.toFixed(0)}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#64748B] dark:text-[#85A3E0]">
                      mAh / {state.batteryCapacityMah} mAh
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-1.5">
                  <div className="w-full bg-[#E2E8F0] dark:bg-[#2E3646] h-2 rounded-none overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        remainingPct >= state.reserveMarginPercent
                          ? 'bg-emerald-600 dark:bg-emerald-500'
                          : remainingPct > 0
                          ? 'bg-amber-500 dark:bg-amber-400'
                          : 'bg-rose-600 dark:bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, remainingPct)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                    {remainingPct >= state.reserveMarginPercent
                      ? `Target buffer of ${state.reserveMarginPercent}% fully satisfied`
                      : remainingPct > 0
                      ? `Encroaching into ${state.reserveMarginPercent}% reserve margin`
                      : 'Pack will completely exhaust before bout ends'}
                  </span>
                </div>
              </div>
            </div>

            {/* Metric 3 Card: Effective Match Runtime */}
            <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] dark:text-[#85A3E0]">
                  Effective Match Runtime
                </span>
                <span className="text-[11px] font-mono font-bold text-[#094AD8] dark:text-[#60A5FA]">
                  Target: {state.matchDurationSec}s ({Math.floor(state.matchDurationSec / 60)}m {state.matchDurationSec % 60}s)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Safe Runtime with Buffer */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                    Safe Runtime (+{state.reserveMarginPercent}% Reserve Buffer)
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums">
                      {Math.floor(effectiveRuntimeSec / 60)}m {(effectiveRuntimeSec % 60).toFixed(0)}s
                    </span>
                    <span className="text-xs font-mono text-[#64748B] dark:text-[#85A3E0]">
                      ({effectiveRuntimeMin.toFixed(1)} min)
                    </span>
                  </div>
                </div>

                {/* Full Depletion Runtime to 0% */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                    Theoretical Full Depletion (0% Remaining)
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums">
                      {Math.floor(fullRuntimeSec / 60)}m {(fullRuntimeSec % 60).toFixed(0)}s
                    </span>
                    <span className="text-xs font-mono text-[#64748B] dark:text-[#85A3E0]">
                      ({results.estimatedFullMatchRuntimeMin.toFixed(1)} min)
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]/80 pt-1 border-t border-[#E2E8F0] dark:border-[#2E3646]">
                {fullRuntimeSec >= state.matchDurationSec ? (
                  <>
                    Pack sustains combat for full <strong className="text-[#0F172A] dark:text-[#CEDDFD]">{state.matchDurationSec}s</strong> with <strong className="text-emerald-700 dark:text-emerald-400">{(fullRuntimeSec - state.matchDurationSec).toFixed(0)}s</strong> surplus endurance.
                  </>
                ) : (
                  <>
                    <strong className="text-rose-700 dark:text-rose-400 font-bold">WARNING:</strong> Pack will lose weapon/drive power <strong className="text-rose-700 dark:text-rose-400">{(state.matchDurationSec - fullRuntimeSec).toFixed(0)}s</strong> before the bell rings.
                  </>
                )}
              </p>
            </div>

            {/* Metric 4 Card: C-Rating Discharge Stress Level Indicator */}
            <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] dark:text-[#85A3E0]">
                  C-Rating Discharge Stress Level
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-none ${
                    stressTier === 'low'
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : stressTier === 'moderate'
                      ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300'
                      : stressTier === 'high'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {stressTier === 'low'
                    ? 'LOW STRESS (<15C)'
                    : stressTier === 'moderate'
                    ? 'MODERATE STRESS (15–35C)'
                    : stressTier === 'high'
                    ? 'HIGH STRESS (35–50C)'
                    : 'EXTREME STRESS (>50C)'}
                </span>
              </div>

              {/* C-Rate Value */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums">
                  {cRate.toFixed(1)}
                </span>
                <span className="text-base font-mono font-bold text-[#094AD8] dark:text-[#60A5FA]">
                  C Continuous Draw
                </span>
                <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0] ml-auto">
                  ({totalAmps.toFixed(1)}A / {(state.batteryCapacityMah / 1000).toFixed(2)}Ah)
                </span>
              </div>

              {/* 4-Tier Visual Segmented Gauge */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <div
                  className={`h-2 rounded-none transition-all ${
                    stressTier === 'low' || stressTier === 'moderate' || stressTier === 'high' || stressTier === 'extreme'
                      ? 'bg-emerald-600 dark:bg-emerald-500'
                      : 'bg-[#CBD5E1] dark:bg-[#333C4D]'
                  }`}
                  title="Low Stress: <15C"
                />
                <div
                  className={`h-2 rounded-none transition-all ${
                    stressTier === 'moderate' || stressTier === 'high' || stressTier === 'extreme'
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-[#CBD5E1] dark:bg-[#333C4D]'
                  }`}
                  title="Moderate Stress: 15–35C"
                />
                <div
                  className={`h-2 rounded-none transition-all ${
                    stressTier === 'high' || stressTier === 'extreme'
                      ? 'bg-amber-500 dark:bg-amber-400'
                      : 'bg-[#CBD5E1] dark:bg-[#333C4D]'
                  }`}
                  title="High Stress: 35–50C"
                />
                <div
                  className={`h-2 rounded-none transition-all ${
                    stressTier === 'extreme'
                      ? 'bg-rose-600 dark:bg-rose-500'
                      : 'bg-[#CBD5E1] dark:bg-[#333C4D]'
                  }`}
                  title="Extreme Stress: >50C"
                />
              </div>

              {/* Gauge Tier Labels */}
              <div className="grid grid-cols-4 text-[9px] font-mono text-[#64748B] dark:text-[#85A3E0]/70 text-center">
                <span className={stressTier === 'low' ? 'font-bold text-emerald-700 dark:text-emerald-400' : ''}>
                  &lt;15C
                </span>
                <span className={stressTier === 'moderate' ? 'font-bold text-blue-700 dark:text-blue-400' : ''}>
                  15–35C
                </span>
                <span className={stressTier === 'high' ? 'font-bold text-amber-700 dark:text-amber-400' : ''}>
                  35–50C
                </span>
                <span className={stressTier === 'extreme' ? 'font-bold text-rose-700 dark:text-rose-400' : ''}>
                  &gt;50C
                </span>
              </div>

              {/* Stress Level Engineering Advice */}
              <p className="text-[11px] font-mono text-[#475569] dark:text-[#85A3E0] pt-1 border-t border-[#E2E8F0] dark:border-[#2E3646] leading-relaxed">
                {stressTier === 'low' ? (
                  <>Optimal thermal zone. Pack experiences negligible voltage sag and minimal temperature rise over 3 minutes.</>
                ) : stressTier === 'moderate' ? (
                  <>Normal combat duty cycle. Pack will get moderately warm; standard 45C–75C packs handle this easily.</>
                ) : stressTier === 'high' ? (
                  <>High discharge rate. Noticeable voltage sag during weapon spin-up and pushing stalls. Use high-burst 75C+ graphene packs.</>
                ) : (
                  <strong className="text-rose-700 dark:text-rose-400">
                    CRITICAL: Extreme discharge stress! Severe risk of tripping ESC low-voltage cutoff, rapid thermal runaway, and pack puffing. Increase pack capacity or reduce weapon/drive current.
                  </strong>
                )}
              </p>
            </div>

            {/* Secondary Metrics Grid (Drive vs Weapon Split & Voltage Specs) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Drive vs Weapon Split
                </span>
                <span className="text-base font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.driveCurrentAmps.toFixed(0)}A / {results.weaponCurrentAmps.toFixed(0)}A
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  Drive: {drivePct.toFixed(0)}% · Weapon: {weaponPct.toFixed(0)}%
                </span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Pack Operating Voltage
                </span>
                <span className="text-base font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.packNominalVoltage.toFixed(1)}V{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">
                    ({results.packMaxVoltage.toFixed(1)}V Max)
                  </span>
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  {state.cellCount}S {BATTERY_CHEMISTRIES[chemistry].label} configuration
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
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between flex-wrap gap-2">
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
                <p className="text-xs text-[#475569] dark:text-[#85A3E0] leading-relaxed mt-1">
                  {results.airlineStatus === 'allowed' ? (
                    <>
                      Pack is <strong className="text-[#0F172A] dark:text-white font-mono">{results.packWattHours.toFixed(1)} Wh</strong>, which is under the 100 Wh threshold. Permitted in carry-on baggage with terminals insulated/taped.
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
