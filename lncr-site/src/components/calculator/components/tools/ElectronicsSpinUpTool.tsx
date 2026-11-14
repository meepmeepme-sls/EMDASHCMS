/**
 * Late Night Combat Robotics Calculator Suite
 * Advanced Electronics & Spin-Up Dynamics Calculator
 * Dual-theme (light and dark) support.
 */

import React, { useState } from 'react';
import {
  SpinUpState,
  BatteryChemistry,
  VoltageState,
  WeightClassId,
  MoiUnit,
} from '../../types';
import { computeSpinUp } from '../../utils/calculations';
import { kgM2ToUnit, moiToKgM2 } from '../../utils/conversions';
import { FieldInputWithToggle } from '../common/FieldInputWithToggle';
import { BatteryVoltageBar } from '../common/BatteryVoltageBar';
import { SparcVoltageWarningBox } from '../common/SparcVoltageWarningBox';

interface ElectronicsSpinUpToolProps {
  state: SpinUpState;
  onChange: (newState: SpinUpState) => void;
  chemistry: BatteryChemistry;
  onChangeChemistry: (chem: BatteryChemistry) => void;
  voltageState: VoltageState;
  onChangeVoltageState: (vstate: VoltageState) => void;
  weightClass: WeightClassId;
  weaponTabMoiKgM2: number;
  weaponTabMotorKv: number;
  weaponTabGearRatio: number;
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
}

export const ElectronicsSpinUpTool: React.FC<ElectronicsSpinUpToolProps> = ({
  state,
  onChange,
  chemistry,
  onChangeChemistry,
  voltageState,
  onChangeVoltageState,
  weightClass,
  weaponTabMoiKgM2,
  weaponTabMotorKv,
  weaponTabGearRatio,
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
}) => {
  const isUseWeaponTabMoi = state.useWeaponTabMoi !== false;
  const isUseWeaponTabMotorKv = state.useWeaponTabMotorKv !== false;
  const isUseWeaponTabGearRatio = state.useWeaponTabGearRatio !== false;

  const effectiveChem = hasWeaponBattery ? weaponChemistry : chemistry;
  const effectiveCells = hasWeaponBattery ? weaponCellCount : (drivetrainCellCount ?? state.cellCount);
  const effectiveDirectV = hasWeaponBattery
    ? useWeaponDirectVoltage
      ? weaponDirectVoltage
      : undefined
    : useDirectVoltage
    ? directVoltage
    : undefined;

  const results = computeSpinUp(
    state,
    effectiveChem,
    voltageState,
    weaponTabMoiKgM2,
    weaponTabMotorKv,
    weaponTabGearRatio,
    effectiveCells,
    effectiveDirectV
  );

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 55 };

  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  const maxTime = results.curvePoints[results.curvePoints.length - 1]?.timeSec || 3.5;
  const maxRpm = Math.max(results.freeRpm, 100);

  const getX = (t: number) => padding.left + (t / maxTime) * chartW;
  const getY = (rpm: number) => padding.top + chartH - (rpm / maxRpm) * chartH;

  const pathD = results.curvePoints.reduce((acc, pt, i) => {
    const x = getX(pt.timeSec);
    const y = getY(pt.rpm);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = `${pathD} L ${getX(maxTime)} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;

  const hoveredPoint = hoverIndex !== null ? results.curvePoints[hoverIndex] : null;

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
        {/* Left Column: Resistance & Inertia Parameters */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  System Resistance & Powertrain
                </h3>
              </div>
              <span className="text-xs font-mono text-[#64748B] dark:text-[#85A3E0]">
                R_sys: {results.systemResistanceOhms.toFixed(4)} Ω
              </span>
            </div>

            {/* Motor KV Source Selector */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Motor KV
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onChange({ ...state, useWeaponTabMotorKv: true })}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-none cursor-pointer ${
                      isUseWeaponTabMotorKv
                        ? 'bg-[#094AD8] text-white shadow-2xs'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                    }`}
                  >
                    From Weapon Tab ({weaponTabMotorKv} RPM/V)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...state,
                        useWeaponTabMotorKv: false,
                        motorKv: state.motorKv || weaponTabMotorKv,
                      })
                    }
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-none cursor-pointer ${
                      !isUseWeaponTabMotorKv
                        ? 'bg-[#094AD8] text-white shadow-2xs'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {!isUseWeaponTabMotorKv && (
                <FieldInputWithToggle
                  label="Custom Motor KV (RPM/V)"
                  value={state.motorKv}
                  unit="RPM/V"
                  onChangeValue={(val) => onChange({ ...state, motorKv: val })}
                  step={25}
                  min={50}
                  helperText="RPM produced per volt applied"
                />
              )}
            </div>

            {/* Gear Reduction Ratio Source Selector */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Gear Reduction Ratio
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onChange({ ...state, useWeaponTabGearRatio: true })}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-none cursor-pointer ${
                      isUseWeaponTabGearRatio
                        ? 'bg-[#094AD8] text-white shadow-2xs'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                    }`}
                  >
                    From Weapon Tab ({weaponTabGearRatio}:1)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...state,
                        useWeaponTabGearRatio: false,
                        gearRatio: state.gearRatio || weaponTabGearRatio,
                      })
                    }
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-none cursor-pointer ${
                      !isUseWeaponTabGearRatio
                        ? 'bg-[#094AD8] text-white shadow-2xs'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {!isUseWeaponTabGearRatio && (
                <FieldInputWithToggle
                  label="Custom Gear Reduction Ratio (:1)"
                  value={state.gearRatio}
                  unit=":1"
                  onChangeValue={(val) => onChange({ ...state, gearRatio: val })}
                  step={0.01}
                  min={0.1}
                  helperText="Driven teeth / driver teeth, or reduction ratio"
                />
              )}
            </div>

            {/* Inertia Source Selector */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Mass Moment of Inertia (MOI)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onChange({ ...state, useWeaponTabMoi: true })}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-none cursor-pointer ${
                      isUseWeaponTabMoi
                        ? 'bg-[#094AD8] text-white shadow-2xs'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                    }`}
                  >
                    From Weapon Tab ({kgM2ToUnit(weaponTabMoiKgM2, state.moiUnit || 'kg*m^2').toFixed((state.moiUnit || 'kg*m^2') === 'g*cm^2' ? 1 : (state.moiUnit || 'kg*m^2') === 'lb*in^2' ? 3 : 5)} {state.moiUnit || 'kg*m^2'})
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...state, useWeaponTabMoi: false })}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-none cursor-pointer ${
                      !isUseWeaponTabMoi
                        ? 'bg-[#094AD8] text-white shadow-2xs'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {!isUseWeaponTabMoi && (
                <FieldInputWithToggle
                  label="Custom Weapon Inertia (J)"
                  value={state.moi ?? kgM2ToUnit(state.moiKgM2, state.moiUnit || 'kg*m^2')}
                  unit={state.moiUnit || 'kg*m^2'}
                  units={['kg*m^2', 'g*cm^2', 'lb*in^2']}
                  onChangeValue={(val) => {
                    const activeUnit = state.moiUnit || 'kg*m^2';
                    onChange({
                      ...state,
                      moi: val,
                      moiKgM2: moiToKgM2(val, activeUnit),
                    });
                  }}
                  onChangeValueAndUnit={(val, u: MoiUnit) => {
                    onChange({
                      ...state,
                      moi: val,
                      moiUnit: u,
                      moiKgM2: moiToKgM2(val, u),
                    });
                  }}
                  step={
                    (state.moiUnit || 'kg*m^2') === 'g*cm^2'
                      ? 100
                      : (state.moiUnit || 'kg*m^2') === 'lb*in^2'
                      ? 0.1
                      : 0.0001
                  }
                  min={0.000001}
                  helperText="Blade mass moment of inertia around bore axis"
                />
              )}
            </div>

            {/* Electrical Resistances */}
            <div className="flex flex-col gap-3 pt-2 border-t border-[#E2E8F0] dark:border-[#2E3646]">
              <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                Circuit & Battery Resistances (Ohms)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FieldInputWithToggle
                  label="Motor Phase Ri"
                  value={state.motorResistance}
                  unit="Ω"
                  onChangeValue={(val) => onChange({ ...state, motorResistance: val })}
                  step={0.005}
                  min={0.001}
                  helperText="Winding phase-to-phase resistance"
                />
                <FieldInputWithToggle
                  label="Battery Cell Ri"
                  value={state.batteryResistancePerCell}
                  unit="Ω/cell"
                  onChangeValue={(val) => onChange({ ...state, batteryResistancePerCell: val })}
                  step={0.001}
                  min={0.001}
                  helperText="Typically 0.004–0.010 Ω/cell"
                />
                <FieldInputWithToggle
                  label="ESC & Harness"
                  value={state.escWiringResistance}
                  unit="Ω"
                  onChangeValue={(val) => onChange({ ...state, escWiringResistance: val })}
                  step={0.001}
                  min={0.001}
                  helperText="MOSFET RDS(on) + connectors"
                />
              </div>
            </div>

            {/* Electrical Telemetry Box */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-[#F8FAFC] dark:bg-[#16181D] rounded-none border border-[#E2E8F0] dark:border-[#2E3646]">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#64748B] dark:text-[#85A3E0]">
                  Stall Current
                </span>
                <div className="text-lg font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums">
                  {results.stallCurrentAmps.toFixed(0)} <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">A</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#64748B] dark:text-[#85A3E0]">
                  Stall Torque
                </span>
                <div className="text-lg font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums">
                  {results.stallTorqueNm.toFixed(2)} <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">N·m</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#64748B] dark:text-[#85A3E0]">
                  Torque Const (Kt)
                </span>
                <div className="text-lg font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums">
                  {(results.ktNmPerAmp * 1000).toFixed(1)} <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">mN·m/A</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Spin-Up Curve & Time Benchmarks */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  Asymptotic Spin-Up Curve
                </h3>
              </div>
              <span className="text-xs font-mono text-[#0F172A] dark:text-[#CEDDFD]">
                95% Spin-Up:{' '}
                <strong className="text-[#094AD8]">
                  {results.timeTo95PercentSec.toFixed(2)}s
                </strong>
              </span>
            </div>

            {/* Interactive SVG Chart */}
            <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-2 relative overflow-hidden">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto"
                onMouseLeave={() => setHoverIndex(null)}
              >
                {/* Horizontal Grid lines */}
                {[0.25, 0.5, 0.75, 1.0].map((frac) => {
                  const y = getY(maxRpm * frac);
                  return (
                    <g key={frac}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={svgWidth - padding.right}
                        y2={y}
                        stroke="currentColor"
                        className="text-[#CBD5E1] dark:text-[#2E3646]"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 4}
                        fill="currentColor"
                        className="text-[#64748B] dark:text-[#85A3E0]"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {(maxRpm * frac).toFixed(0)}
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Grid lines (Time markers) */}
                {[1, 2, 3, 4, 5].filter((t) => t < maxTime).map((t) => {
                  const x = getX(t);
                  return (
                    <g key={t}>
                      <line
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={padding.top + chartH}
                        stroke="currentColor"
                        className="text-[#CBD5E1] dark:text-[#2E3646]"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={x}
                        y={padding.top + chartH + 15}
                        fill="currentColor"
                        className="text-[#64748B] dark:text-[#85A3E0]"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {t}s
                      </text>
                    </g>
                  );
                })}

                {/* 95% Reference Line */}
                <line
                  x1={getX(results.timeTo95PercentSec)}
                  y1={padding.top}
                  x2={getX(results.timeTo95PercentSec)}
                  y2={padding.top + chartH}
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />

                {/* Area Fill */}
                <path d={areaD} fill="url(#blueGradientSpin)" opacity="0.25" />

                {/* Curve Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#094AD8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                <defs>
                  <linearGradient id="blueGradientSpin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#094AD8" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#094AD8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Invisible hover overlay rectangles */}
                {results.curvePoints.map((pt, idx) => {
                  const x = getX(pt.timeSec);
                  return (
                    <rect
                      key={idx}
                      x={x - (chartW / results.curvePoints.length) / 2}
                      y={padding.top}
                      width={chartW / results.curvePoints.length}
                      height={chartH}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoverIndex(idx)}
                    />
                  );
                })}

                {/* Hover indicator */}
                {hoveredPoint && (
                  <g>
                    <line
                      x1={getX(hoveredPoint.timeSec)}
                      y1={padding.top}
                      x2={getX(hoveredPoint.timeSec)}
                      y2={padding.top + chartH}
                      stroke="currentColor"
                      className="text-[#0F172A] dark:text-[#CEDDFD]"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={getX(hoveredPoint.timeSec)}
                      cy={getY(hoveredPoint.rpm)}
                      r="4"
                      fill="#094AD8"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  </g>
                )}
              </svg>

              {/* Hover HUD Pill */}
              {hoveredPoint && (
                <div className="absolute top-3 right-3 bg-white/95 dark:bg-[#1F232B]/95 border border-[#CBD5E1] dark:border-[#2E3646] rounded-none px-3 py-1.5 text-[11px] font-mono text-[#0F172A] dark:text-[#CEDDFD] shadow-md pointer-events-none flex items-center gap-3">
                  <span>
                    t: <strong className="text-[#094AD8]">{hoveredPoint.timeSec.toFixed(2)}s</strong>
                  </span>
                  <span>
                    RPM: <strong>{hoveredPoint.rpm.toFixed(0)}</strong>
                  </span>
                  <span>
                    KE: <strong>{hoveredPoint.energyJoules.toFixed(0)} J</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Key Time-to-Speed Benchmarks */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  63.2% Speed (1τ)
                </span>
                <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.timeTo63PercentSec.toFixed(2)}s
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  {(results.freeRpm * 0.632).toFixed(0)} RPM
                </span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  86.5% Speed (2τ)
                </span>
                <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.timeTo86PercentSec.toFixed(2)}s
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  {(results.freeRpm * 0.865).toFixed(0)} RPM
                </span>
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-none p-3 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-amber-900 dark:text-amber-300 font-bold">
                  95.0% Spin-Up (3τ)
                </span>
                <span className="text-xl font-bold font-mono text-amber-800 dark:text-amber-300 tabular-nums mt-1">
                  {results.timeTo95PercentSec.toFixed(2)}s
                </span>
                <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400/80">
                  {(results.freeRpm * 0.95).toFixed(0)} RPM
                </span>
              </div>
            </div>

            {/* Combat Pit Recommendation */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] text-xs text-[#64748B] dark:text-[#85A3E0] leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-[#0F172A] dark:text-[#CEDDFD] mb-1">
                <span>Spin-Up Combat Strategy</span>
              </div>
              In combat robotics, a spin-up time under <strong className="text-[#0F172A] dark:text-white">2.5 seconds</strong> allows you to recover full striking power between hits before the opponent can pin you against the arena walls.
            </div>
          </div>
        </div>
      </div>

      {/* SPARC v1.7 48V Warning Box at the bottom */}
      <SparcVoltageWarningBox packVoltage={results.packVoltage} />
    </div>
  );
};
