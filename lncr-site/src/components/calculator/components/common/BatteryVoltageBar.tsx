/**
 * Late Night Combat Robotics Calculator Suite
 * BatteryVoltageBar: Shared top-level power source configuration.
 * Supports standard Battery Pack (chemistry & cell count) OR Direct Operating Voltage specification,
 * optional independent Weapon Battery/Voltage, and collapsible minimized view.
 * Dual-theme (light and dark) support.
 */

import React, { useState, useEffect } from 'react';
import type { BatteryChemistry, VoltageState, WeightClassId } from '../../types';
import { BATTERY_CHEMISTRIES, WEIGHT_CLASSES, RECOMMENDED_CELL_COUNTS } from '../../utils/constants';

export interface BatteryVoltageBarProps {
  chemistry: BatteryChemistry;
  onChangeChemistry: (chem: BatteryChemistry) => void;
  voltageState: VoltageState;
  onChangeVoltageState: (vstate: VoltageState) => void;
  cellCount: number;
  onChangeCellCount: (cellCount: number) => void;
  weightClass: WeightClassId;

  // Additional weapon battery props
  hasWeaponBattery?: boolean;
  onChangeHasWeaponBattery?: (enabled: boolean) => void;
  weaponChemistry?: BatteryChemistry;
  onChangeWeaponChemistry?: (chem: BatteryChemistry) => void;
  weaponCellCount?: number;
  onChangeWeaponCellCount?: (cellCount: number) => void;

  // Direct operating voltage props
  useDirectVoltage?: boolean;
  onChangeUseDirectVoltage?: (useDirect: boolean) => void;
  directVoltage?: number;
  onChangeDirectVoltage?: (voltage: number) => void;

  useWeaponDirectVoltage?: boolean;
  onChangeUseWeaponDirectVoltage?: (useDirect: boolean) => void;
  weaponDirectVoltage?: number;
  onChangeWeaponDirectVoltage?: (voltage: number) => void;
}

interface DirectVoltageInputProps {
  label: string;
  voltage: number;
  onChangeVoltage: (v: number) => void;
}

const DirectVoltageInput: React.FC<DirectVoltageInputProps> = ({
  label,
  voltage,
  onChangeVoltage,
}) => {
  const [localVal, setLocalVal] = useState<string>(String(voltage));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalVal(String(voltage));
    }
  }, [voltage, isFocused]);

  const quickPresets = [7.4, 11.1, 12.0, 14.8, 18.5, 22.2, 24.0, 29.6, 44.4];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = e.target.value;
    setLocalVal(s);
    const num = parseFloat(s);
    if (!isNaN(num) && num > 0) {
      onChangeVoltage(num);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#475569] dark:text-[#85A3E0]">
          {label}
        </label>
        <span className="text-[11px] font-mono text-[#094AD8] dark:text-[#60A5FA] font-bold">
          {voltage.toFixed(1)}V DC
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            step="0.1"
            min="1"
            max="120"
            value={localVal}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              const num = parseFloat(localVal);
              if (isNaN(num) || num <= 0) {
                setLocalVal(String(voltage));
              }
            }}
            onChange={handleChange}
            className="w-full bg-white dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#333C4D] px-3 py-1.5 font-mono text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD] focus:outline-none focus:border-[#094AD8] dark:focus:border-[#60A5FA] rounded-none tabular-nums"
            placeholder="e.g. 14.8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#64748B] dark:text-[#85A3E0]">
            V
          </span>
        </div>
      </div>

      {/* Quick Reference Voltage Presets */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
        <span className="text-[10px] uppercase font-mono text-[#64748B] dark:text-[#85A3E0]/70 mr-1 select-none whitespace-nowrap">
          Presets:
        </span>
        {quickPresets.map((p) => {
          const isActive = Math.abs(voltage - p) < 0.05;
          return (
            <button
              key={p}
              type="button"
              onClick={() => {
                setLocalVal(String(p));
                onChangeVoltage(p);
              }}
              className={`px-2 py-0.5 text-xs font-mono rounded-none transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#094AD8] text-white font-bold shadow-2xs'
                  : 'bg-[#F1F5F9] dark:bg-[#1F232B] text-[#64748B] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#333C4D] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
              }`}
            >
              {p}V
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const BatteryVoltageBar: React.FC<BatteryVoltageBarProps> = ({
  chemistry,
  onChangeChemistry,
  voltageState,
  onChangeVoltageState,
  cellCount,
  onChangeCellCount,
  weightClass,
  hasWeaponBattery = false,
  onChangeHasWeaponBattery,
  weaponChemistry = chemistry,
  onChangeWeaponChemistry,
  weaponCellCount = cellCount,
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
  const currentClass = WEIGHT_CLASSES.find((w) => w.id === weightClass) || WEIGHT_CLASSES[1];
  const [minS, maxS] = currentClass.recommendedS;

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lnc_battery_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMinimized = () => {
    setIsMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lnc_battery_minimized', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Only show recommended cell count tiles for the selected weight class
  const cellOptions = RECOMMENDED_CELL_COUNTS[weightClass] || [3, 4, 5, 6];

  // Calculated pack voltages for display
  const calcDtVoltage =
    cellCount *
    (voltageState === 'nominal'
      ? BATTERY_CHEMISTRIES[chemistry].nominalPerCell
      : BATTERY_CHEMISTRIES[chemistry].maxPerCell);

  const calcWpnVoltage =
    weaponCellCount *
    (voltageState === 'nominal'
      ? BATTERY_CHEMISTRIES[weaponChemistry].nominalPerCell
      : BATTERY_CHEMISTRIES[weaponChemistry].maxPerCell);

  const activeDtV = useDirectVoltage ? directVoltage : calcDtVoltage;
  const activeWpnV = hasWeaponBattery
    ? useWeaponDirectVoltage
      ? weaponDirectVoltage
      : calcWpnVoltage
    : activeDtV;

  return (
    <div
      className={`bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none transition-all ${
        isMinimized ? 'p-3' : 'p-4 flex flex-col gap-3'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`flex items-center justify-between flex-wrap gap-2 ${
          !isMinimized ? 'border-b border-[#E2E8F0] dark:border-[#2E3646] pb-2.5' : ''
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase font-mono tracking-wider font-bold text-[#094AD8] dark:text-[#60A5FA]">
            Battery
          </span>
          <span className="text-xs text-[#94A3B8] dark:text-[#64748B]">•</span>

          {/* Minimized Assignment View vs Expanded Subtitle */}
          {isMinimized ? (
            <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
              {!hasWeaponBattery ? (
                <span className="font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  {useDirectVoltage
                    ? `${directVoltage.toFixed(1)}V (Direct)`
                    : `${cellCount}S ${BATTERY_CHEMISTRIES[chemistry].label}`}
                </span>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#0F172A] dark:text-[#CEDDFD]">
                    <span className="text-[#64748B] dark:text-[#85A3E0]">Drivetrain:</span>{' '}
                    {useDirectVoltage
                      ? `${directVoltage.toFixed(1)}V (Direct)`
                      : `${cellCount}S ${BATTERY_CHEMISTRIES[chemistry].label}`}
                  </span>
                  <span className="text-[#94A3B8] dark:text-[#64748B]">·</span>
                  <span className="font-semibold text-[#0F172A] dark:text-[#CEDDFD]">
                    <span className="text-[#64748B] dark:text-[#85A3E0]">Weapon:</span>{' '}
                    {useWeaponDirectVoltage
                      ? `${weaponDirectVoltage.toFixed(1)}V (Direct)`
                      : `${weaponCellCount}S ${BATTERY_CHEMISTRIES[weaponChemistry].label}`}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs font-mono text-[#64748B] dark:text-[#85A3E0]">
              {hasWeaponBattery
                ? 'Separate Drivetrain & Weapon Power Systems'
                : useDirectVoltage
                ? 'Direct Operating Voltage Specification'
                : 'Shared across all subsystem calculators'}
            </span>
          )}
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2.5">
          {!isMinimized && onChangeHasWeaponBattery && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#475569] dark:text-[#85A3E0] select-none">
                Additional weapon battery
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={hasWeaponBattery}
                onClick={() => onChangeHasWeaponBattery(!hasWeaponBattery)}
                className={`px-2.5 py-1 text-xs font-semibold font-mono rounded-none cursor-pointer transition-colors border ${
                  hasWeaponBattery
                    ? 'bg-[#094AD8] text-white border-[#094AD8] shadow-2xs'
                    : 'bg-[#F1F5F9] dark:bg-[#16181D] text-[#64748B] dark:text-[#85A3E0] border-[#CBD5E1] dark:border-[#2E3646] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                }`}
              >
                {hasWeaponBattery ? 'ON' : 'OFF'}
              </button>
            </div>
          )}

          {/* Minimize / Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleMinimized}
            className="px-2.5 py-1 text-xs font-semibold font-mono rounded-none cursor-pointer transition-colors border border-[#CBD5E1] dark:border-[#333C4D] bg-[#F8FAFC] dark:bg-[#16181D] text-[#0F172A] dark:text-[#CEDDFD] hover:border-[#094AD8] dark:hover:border-[#60A5FA] shadow-2xs"
            aria-label={isMinimized ? 'Expand battery tab' : 'Minimize battery tab'}
            title={isMinimized ? 'Expand battery configuration' : 'Minimize battery configuration'}
          >
            {isMinimized ? 'Expand ▾' : 'Minimize ▴'}
          </button>
        </div>
      </div>

      {/* Expanded Controls Content */}
      {!isMinimized && (
        <>
          {!hasWeaponBattery ? (
            /* Single Shared Power Source Layout */
            <div className="flex flex-col gap-3 pt-1">
              {/* Power Source Mode Toggle */}
              <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                <span className="text-xs font-semibold text-[#475569] dark:text-[#85A3E0]">
                  Operating Power Configuration
                </span>
                <div className="flex items-center p-0.5 bg-[#F1F5F9] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646]">
                  <button
                    type="button"
                    onClick={() => onChangeUseDirectVoltage && onChangeUseDirectVoltage(false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                      !useDirectVoltage
                        ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                    }`}
                  >
                    Battery Pack
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onChangeUseDirectVoltage) {
                        onChangeUseDirectVoltage(true);
                        if (!directVoltage || directVoltage <= 0) {
                          onChangeDirectVoltage && onChangeDirectVoltage(calcDtVoltage);
                        }
                      }
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                      useDirectVoltage
                        ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                    }`}
                  >
                    Direct Voltage
                  </button>
                </div>
              </div>

              {!useDirectVoltage ? (
                /* Battery Pack: 3 Columns (Chemistry, Voltage State, Cell Count) */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Battery Chemistry */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[#475569] dark:text-[#85A3E0]">
                      Chemistry
                    </span>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-[#F1F5F9] dark:bg-[#16181D] rounded-none border border-[#E2E8F0] dark:border-[#2E3646]">
                      {(['lipo', 'lihv', 'nimh'] as BatteryChemistry[]).map((chem) => {
                        const active = chemistry === chem;
                        const cfg = BATTERY_CHEMISTRIES[chem];
                        return (
                          <button
                            key={chem}
                            type="button"
                            onClick={() => onChangeChemistry(chem)}
                            className={`py-1.5 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                              active
                                ? 'bg-white dark:bg-[#094AD8] text-[#094AD8] dark:text-white shadow-2xs font-bold'
                                : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-white/50 dark:hover:bg-[#1F232B]'
                            }`}
                            title={`${cfg.label}: ${cfg.nominalPerCell}V nom, ${cfg.maxPerCell}V max`}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Voltage State (Nominal vs Max) */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[#475569] dark:text-[#85A3E0]">
                      Voltage State
                    </span>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-[#F1F5F9] dark:bg-[#16181D] rounded-none border border-[#E2E8F0] dark:border-[#2E3646]">
                      <button
                        type="button"
                        onClick={() => onChangeVoltageState('nominal')}
                        className={`py-1.5 text-xs font-semibold rounded-none transition-all cursor-pointer whitespace-nowrap px-1.5 text-center ${
                          voltageState === 'nominal'
                            ? 'bg-white dark:bg-[#094AD8] text-[#094AD8] dark:text-white shadow-2xs font-bold'
                            : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-white/50 dark:hover:bg-[#1F232B]'
                        }`}
                        title={`Nominal voltage (${BATTERY_CHEMISTRIES[chemistry].nominalPerCell}V per cell)`}
                      >
                        Nominal
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeVoltageState('max')}
                        className={`py-1.5 text-xs font-semibold rounded-none transition-all cursor-pointer whitespace-nowrap px-1.5 text-center ${
                          voltageState === 'max'
                            ? 'bg-white dark:bg-[#094AD8] text-[#094AD8] dark:text-white shadow-2xs font-bold'
                            : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-white/50 dark:hover:bg-[#1F232B]'
                        }`}
                        title={`Max fully charged voltage (${BATTERY_CHEMISTRIES[chemistry].maxPerCell}V per cell)`}
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  {/* 3. Cell Count */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#475569] dark:text-[#85A3E0]">
                        Cell Count
                      </span>
                      <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                        {currentClass.shortName}: {minS}S–{maxS}S rec.
                      </span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                      {cellOptions.map((s) => {
                        const active = cellCount === s;
                        const isRecommended = s >= minS && s <= maxS;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => onChangeCellCount(s)}
                            className={`flex-1 min-w-[28px] py-1.5 text-xs font-mono font-bold rounded-none transition-all cursor-pointer ${
                              active
                                ? 'bg-[#094AD8] text-white shadow-2xs ring-1 ring-white/20'
                                : isRecommended
                                ? 'bg-[#F8FAFC] dark:bg-[#16181D] text-[#0F172A] dark:text-[#CEDDFD] border border-[#CBD5E1] dark:border-[#2E3646] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                                : 'bg-[#F8FAFC]/50 dark:bg-[#16181D]/50 text-[#94A3B8] dark:text-[#85A3E0]/40 border border-[#E2E8F0] dark:border-[#2E3646]/50 hover:text-[#475569] dark:hover:text-[#85A3E0]'
                            }`}
                            title={`${s}S (${(s * BATTERY_CHEMISTRIES[chemistry].nominalPerCell).toFixed(1)}V nom)`}
                          >
                            {s}S
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Direct Operating Voltage Specification */
                <div className="p-4 bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] flex flex-col gap-2">
                  <DirectVoltageInput
                    label="Direct Operating Voltage"
                    voltage={directVoltage}
                    onChangeVoltage={(v) => onChangeDirectVoltage && onChangeDirectVoltage(v)}
                  />
                  <p className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]/80">
                    Bypasses battery pack cell calculations and supplies a fixed DC voltage to all calculators.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Dual Power Systems: Shared Voltage State + Independent Drivetrain & Weapon */
            <div className="flex flex-col gap-4 pt-1">
              {/* Shared Voltage State Bar (for packs in Battery Pack mode) */}
              {(!useDirectVoltage || !useWeaponDirectVoltage) && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646]">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#0F172A] dark:text-[#CEDDFD]">
                      Shared Battery Voltage State
                    </span>
                    <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                      Applied to any battery configured in Pack mode
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-[#F1F5F9] dark:bg-[#1F232B] rounded-none border border-[#CBD5E1] dark:border-[#333C4D] w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => onChangeVoltageState('nominal')}
                      className={`py-1.5 px-4 text-xs font-semibold rounded-none transition-all cursor-pointer whitespace-nowrap text-center ${
                        voltageState === 'nominal'
                          ? 'bg-white dark:bg-[#094AD8] text-[#094AD8] dark:text-white shadow-2xs font-bold'
                          : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                      }`}
                    >
                      Nominal
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeVoltageState('max')}
                      className={`py-1.5 px-4 text-xs font-semibold rounded-none transition-all cursor-pointer whitespace-nowrap text-center ${
                        voltageState === 'max'
                          ? 'bg-white dark:bg-[#094AD8] text-[#094AD8] dark:text-white shadow-2xs font-bold'
                          : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                      }`}
                    >
                      Max
                    </button>
                  </div>
                </div>
              )}

              {/* Side-by-Side Power Sources */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Drivetrain Power */}
                <div className="p-3.5 bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#2E3646] flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F172A] dark:text-[#CEDDFD] font-mono uppercase tracking-wider">
                        Drivetrain
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#094AD8] dark:text-[#60A5FA]">
                        {useDirectVoltage
                          ? `${directVoltage.toFixed(1)}V (Direct)`
                          : `${cellCount}S (${calcDtVoltage.toFixed(1)}V)`}
                      </span>
                    </div>

                    {/* Drivetrain Mode Switch */}
                    <div className="flex items-center p-0.5 bg-[#F1F5F9] dark:bg-[#1F232B] border border-[#CBD5E1] dark:border-[#333C4D]">
                      <button
                        type="button"
                        onClick={() => onChangeUseDirectVoltage && onChangeUseDirectVoltage(false)}
                        className={`px-2 py-0.5 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                          !useDirectVoltage
                            ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                            : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                        }`}
                      >
                        Pack
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onChangeUseDirectVoltage) {
                            onChangeUseDirectVoltage(true);
                            if (!directVoltage || directVoltage <= 0) {
                              onChangeDirectVoltage && onChangeDirectVoltage(calcDtVoltage);
                            }
                          }
                        }}
                        className={`px-2 py-0.5 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                          useDirectVoltage
                            ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                            : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                        }`}
                      >
                        Direct V
                      </button>
                    </div>
                  </div>

                  {!useDirectVoltage ? (
                    <>
                      {/* Drivetrain Chemistry */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-[#475569] dark:text-[#85A3E0]">
                          Chemistry
                        </span>
                        <div className="grid grid-cols-3 gap-1 p-1 bg-[#F1F5F9] dark:bg-[#1F232B] rounded-none border border-[#CBD5E1] dark:border-[#333C4D]">
                          {(['lipo', 'lihv', 'nimh'] as BatteryChemistry[]).map((chem) => {
                            const active = chemistry === chem;
                            const cfg = BATTERY_CHEMISTRIES[chem];
                            return (
                              <button
                                key={chem}
                                type="button"
                                onClick={() => onChangeChemistry(chem)}
                                className={`py-1 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                                  active
                                    ? 'bg-white dark:bg-[#094AD8] text-[#094AD8] dark:text-white shadow-2xs font-bold'
                                    : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                                }`}
                                title={`${cfg.label}: ${cfg.nominalPerCell}V nom`}
                              >
                                {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Drivetrain Cell Count */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#475569] dark:text-[#85A3E0]">
                            Cell Count
                          </span>
                          <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                            {currentClass.shortName}: {minS}S–{maxS}S rec.
                          </span>
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                          {cellOptions.map((s) => {
                            const active = cellCount === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => onChangeCellCount(s)}
                                className={`flex-1 min-w-[26px] py-1 text-xs font-mono font-bold rounded-none transition-all cursor-pointer ${
                                  active
                                    ? 'bg-[#094AD8] text-white shadow-2xs ring-1 ring-white/20'
                                    : 'bg-[#F1F5F9] dark:bg-[#1F232B] text-[#0F172A] dark:text-[#CEDDFD] border border-[#CBD5E1] dark:border-[#333C4D] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                                }`}
                              >
                                {s}S
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <DirectVoltageInput
                      label="Drivetrain Operating Voltage"
                      voltage={directVoltage}
                      onChangeVoltage={(v) => onChangeDirectVoltage && onChangeDirectVoltage(v)}
                    />
                  )}
                </div>

                {/* 2. Weapon Power */}
                <div className="p-3.5 bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#2E3646] flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F172A] dark:text-[#CEDDFD] font-mono uppercase tracking-wider">
                        Weapon
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#094AD8] dark:text-[#60A5FA]">
                        {useWeaponDirectVoltage
                          ? `${weaponDirectVoltage.toFixed(1)}V (Direct)`
                          : `${weaponCellCount}S (${calcWpnVoltage.toFixed(1)}V)`}
                      </span>
                    </div>

                    {/* Weapon Mode Switch */}
                    <div className="flex items-center p-0.5 bg-[#F1F5F9] dark:bg-[#1F232B] border border-[#CBD5E1] dark:border-[#333C4D]">
                      <button
                        type="button"
                        onClick={() =>
                          onChangeUseWeaponDirectVoltage && onChangeUseWeaponDirectVoltage(false)
                        }
                        className={`px-2 py-0.5 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                          !useWeaponDirectVoltage
                            ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                            : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                        }`}
                      >
                        Pack
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onChangeUseWeaponDirectVoltage) {
                            onChangeUseWeaponDirectVoltage(true);
                            if (!weaponDirectVoltage || weaponDirectVoltage <= 0) {
                              onChangeWeaponDirectVoltage && onChangeWeaponDirectVoltage(calcWpnVoltage);
                            }
                          }
                        }}
                        className={`px-2 py-0.5 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                          useWeaponDirectVoltage
                            ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                            : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                        }`}
                      >
                        Direct V
                      </button>
                    </div>
                  </div>

                  {!useWeaponDirectVoltage ? (
                    <>
                      {/* Weapon Chemistry */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-[#475569] dark:text-[#85A3E0]">
                          Chemistry
                        </span>
                        <div className="grid grid-cols-3 gap-1 p-1 bg-[#F1F5F9] dark:bg-[#1F232B] rounded-none border border-[#CBD5E1] dark:border-[#333C4D]">
                          {(['lipo', 'lihv', 'nimh'] as BatteryChemistry[]).map((chem) => {
                            const active = weaponChemistry === chem;
                            const cfg = BATTERY_CHEMISTRIES[chem];
                            return (
                              <button
                                key={chem}
                                type="button"
                                onClick={() =>
                                  onChangeWeaponChemistry && onChangeWeaponChemistry(chem)
                                }
                                className={`py-1 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                                  active
                                    ? 'bg-white dark:bg-[#094AD8] text-[#094AD8] dark:text-white shadow-2xs font-bold'
                                    : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                                }`}
                                title={`${cfg.label}: ${cfg.nominalPerCell}V nom`}
                              >
                                {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Weapon Cell Count */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#475569] dark:text-[#85A3E0]">
                            Cell Count
                          </span>
                          <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                            Dedicated Weapon Load
                          </span>
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                          {cellOptions.map((s) => {
                            const active = weaponCellCount === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() =>
                                  onChangeWeaponCellCount && onChangeWeaponCellCount(s)
                                }
                                className={`flex-1 min-w-[26px] py-1 text-xs font-mono font-bold rounded-none transition-all cursor-pointer ${
                                  active
                                    ? 'bg-[#094AD8] text-white shadow-2xs ring-1 ring-white/20'
                                    : 'bg-[#F1F5F9] dark:bg-[#1F232B] text-[#0F172A] dark:text-[#CEDDFD] border border-[#CBD5E1] dark:border-[#333C4D] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                                }`}
                              >
                                {s}S
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <DirectVoltageInput
                      label="Weapon Operating Voltage"
                      voltage={weaponDirectVoltage}
                      onChangeVoltage={(v) => onChangeWeaponDirectVoltage && onChangeWeaponDirectVoltage(v)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SPARC 48V Voltage Warning */}
          {(activeDtV > 48 || activeWpnV > 48) && (
            <div className="px-3 py-2 rounded-none bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-mono">
              <span>
                Operating voltage exceeds the SPARC v1.7 48V threshold (Drivetrain: {activeDtV.toFixed(1)}V, Weapon: {activeWpnV.toFixed(1)}V).
                Requires special technical inspection and event organizer approval.
              </span>
            </div>
          )}

          {/* Caution if pack cell count is outside recommended weight class range */}
          {!useDirectVoltage && (cellCount < minS || cellCount > maxS) && (
            <div className="px-3 py-2 rounded-none bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
              <span>
                {cellCount}S is outside the standard {currentClass.shortName} baseline ({minS}S–{maxS}S).
                Verify ESC voltage limits and robot total weight budget.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
