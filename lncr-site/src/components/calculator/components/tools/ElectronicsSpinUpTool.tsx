/**
 * Late Night Combat Robotics Calculator Suite
 * Advanced Electronics & Spin-Up Dynamics Calculator
 * Dual-theme (light and dark) support.
 */

import React, { useState } from 'react';
import type { SpinUpState, BatteryChemistry, VoltageState, WeightClassId, MoiUnit } from '../../types';
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
  const effectiveCells = hasWeaponBattery ? weaponCellCount : state.cellCount;
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
  const [resistanceUnit, setResistanceUnit] = useState<'mΩ' | 'Ω'>('mΩ');

  const timeHorizon = state.timeHorizonSec || 3.5;

  // Kinetic energy and speed at simulation time horizon
  const timeTo80PercentSec = -results.tauSec * Math.log(0.2); // ~1.6094 * tau
  const effectiveMoiKgM2 = isUseWeaponTabMoi
    ? weaponTabMoiKgM2
    : state.moiUnit
    ? moiToKgM2(state.moi ?? state.moiKgM2, state.moiUnit)
    : state.moiKgM2;
  const safeMoi = Math.max(effectiveMoiKgM2, 0.000001);

  const rpmAtHorizon = results.freeRpm * (1 - Math.exp(-timeHorizon / Math.max(results.tauSec, 0.0001)));
  const radSAtHorizon = (rpmAtHorizon * 2 * Math.PI) / 60.0;
  const energyAtHorizonJoules = 0.5 * safeMoi * Math.pow(radSAtHorizon, 2);
  const percentEnergyAtHorizon = Math.min(
    100,
    (energyAtHorizonJoules / Math.max(results.maxStoredEnergyJoules, 0.0001)) * 100
  );

  // Electrical inrush and running current metrics
  const peakInrushCurrentAmps = results.stallCurrentAmps;
  // Typical no-load steady-state running current for combat brushless systems (motor idling with belt friction):
  const steadyStateCurrentAmps = Math.min(
    Math.max(1.2, results.packVoltage * 0.12),
    peakInrushCurrentAmps * 0.05
  );

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 55 };

  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  const maxTime = results.curvePoints[results.curvePoints.length - 1]?.timeSec || timeHorizon;
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

  // Dynamic time markers for SVG grid
  const timeMarkers = Array.from(
    { length: Math.floor(maxTime) },
    (_, i) => i + 1
  ).filter((t) => t < maxTime - 0.2);

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
        {/* Left Column: Resistance & Powertrain Parameters */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  System Resistance &amp; Powertrain
                </h3>
              </div>
              <span className="text-xs font-mono text-[#64748B] dark:text-[#85A3E0]">
                R_sys:{' '}
                <strong className="text-[#0F172A] dark:text-[#CEDDFD]">
                  {resistanceUnit === 'mΩ'
                    ? `${(results.systemResistanceOhms * 1000).toFixed(1)} mΩ`
                    : `${results.systemResistanceOhms.toFixed(4)} Ω`}
                </strong>
              </span>
            </div>

            {/* Motor KV Source Selector */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Motor KV
                </span>
                <div className="flex items-center p-0.5 bg-[#F1F5F9] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onChange({ ...state, useWeaponTabMotorKv: true })}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-none cursor-pointer transition-all whitespace-nowrap ${
                      isUseWeaponTabMotorKv
                        ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#1F232B]'
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
                    className={`px-2.5 py-1 text-xs font-semibold rounded-none cursor-pointer transition-all whitespace-nowrap ${
                      !isUseWeaponTabMotorKv
                        ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#1F232B]'
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Gear Reduction Ratio
                </span>
                <div className="flex items-center p-0.5 bg-[#F1F5F9] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onChange({ ...state, useWeaponTabGearRatio: true })}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-none cursor-pointer transition-all whitespace-nowrap ${
                      isUseWeaponTabGearRatio
                        ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#1F232B]'
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
                    className={`px-2.5 py-1 text-xs font-semibold rounded-none cursor-pointer transition-all whitespace-nowrap ${
                      !isUseWeaponTabGearRatio
                        ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#1F232B]'
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                    Mass Moment of Inertia (MOI)
                  </span>
                  {/* Inline MOI Unit Selector */}
                  <div className="flex items-center gap-0.5">
                    {(['kg*m^2', 'g*cm^2', 'lb*in^2'] as MoiUnit[]).map((u) => {
                      const active = (state.moiUnit || 'kg*m^2') === u;
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => {
                            const currentUnit = state.moiUnit || 'kg*m^2';
                            const currentKgM2 = isUseWeaponTabMoi
                              ? weaponTabMoiKgM2
                              : (state.moiKgM2 ?? moiToKgM2(state.moi || 0, currentUnit));
                            const newMoiVal = kgM2ToUnit(currentKgM2, u);
                            onChange({
                              ...state,
                              moiUnit: u,
                              moi: newMoiVal,
                              moiKgM2: currentKgM2,
                            });
                          }}
                          className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-none cursor-pointer transition-colors ${
                            active
                              ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                              : 'bg-[#F1F5F9] dark:bg-[#16181D] text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] border border-[#CBD5E1] dark:border-[#2E3646]'
                          }`}
                          title={`Switch MOI unit to ${u}`}
                        >
                          {u}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center p-0.5 bg-[#F1F5F9] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onChange({ ...state, useWeaponTabMoi: true })}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-none cursor-pointer transition-all whitespace-nowrap ${
                      isUseWeaponTabMoi
                        ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#1F232B]'
                    }`}
                  >
                    From Weapon Tab (
                    {kgM2ToUnit(weaponTabMoiKgM2, state.moiUnit || 'kg*m^2').toFixed(
                      (state.moiUnit || 'kg*m^2') === 'g*cm^2'
                        ? 1
                        : (state.moiUnit || 'kg*m^2') === 'lb*in^2'
                        ? 3
                        : 5
                    )}{' '}
                    {state.moiUnit || 'kg*m^2'})
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...state, useWeaponTabMoi: false })}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-none cursor-pointer transition-all whitespace-nowrap ${
                      !isUseWeaponTabMoi
                        ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#1F232B]'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {!isUseWeaponTabMoi && (
                <FieldInputWithToggle
                  label="Custom Blade Inertia (MOI)"
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Circuit &amp; Battery Resistances (Rm, Rbat, Rwire)
                </span>
                {/* Global Resistance Unit Switcher */}
                <div className="flex items-center p-0.5 bg-[#F1F5F9] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646]">
                  <button
                    type="button"
                    onClick={() => setResistanceUnit('mΩ')}
                    className={`px-2 py-0.5 text-xs font-mono font-semibold rounded-none cursor-pointer transition-all ${
                      resistanceUnit === 'mΩ'
                        ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#1F232B]'
                    }`}
                  >
                    mΩ
                  </button>
                  <button
                    type="button"
                    onClick={() => setResistanceUnit('Ω')}
                    className={`px-2 py-0.5 text-xs font-mono font-semibold rounded-none cursor-pointer transition-all ${
                      resistanceUnit === 'Ω'
                        ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#1F232B]'
                    }`}
                  >
                    Ω
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FieldInputWithToggle
                  label="Motor Resistance (Rm)"
                  value={
                    resistanceUnit === 'mΩ'
                      ? Number((state.motorResistance * 1000).toFixed(1))
                      : state.motorResistance
                  }
                  unit={resistanceUnit}
                  onChangeValue={(val) => {
                    const ohmVal = resistanceUnit === 'mΩ' ? val / 1000 : val;
                    onChange({ ...state, motorResistance: Math.max(0.0001, ohmVal) });
                  }}
                  step={resistanceUnit === 'mΩ' ? 5 : 0.005}
                  min={resistanceUnit === 'mΩ' ? 0.5 : 0.0005}
                  helperText="Winding phase-to-phase resistance"
                />
                <FieldInputWithToggle
                  label="Battery Ri (Rbat)"
                  value={
                    resistanceUnit === 'mΩ'
                      ? Number((state.batteryResistancePerCell * 1000).toFixed(1))
                      : state.batteryResistancePerCell
                  }
                  unit={resistanceUnit === 'mΩ' ? 'mΩ/cell' : 'Ω/cell'}
                  onChangeValue={(val) => {
                    const ohmVal = resistanceUnit === 'mΩ' ? val / 1000 : val;
                    onChange({ ...state, batteryResistancePerCell: Math.max(0.0001, ohmVal) });
                  }}
                  step={resistanceUnit === 'mΩ' ? 1 : 0.001}
                  min={resistanceUnit === 'mΩ' ? 0.1 : 0.0001}
                  helperText="Typically 4–10 mΩ/cell"
                />
                <FieldInputWithToggle
                  label="ESC &amp; Wiring (Rwire)"
                  value={
                    resistanceUnit === 'mΩ'
                      ? Number((state.escWiringResistance * 1000).toFixed(1))
                      : state.escWiringResistance
                  }
                  unit={resistanceUnit}
                  onChangeValue={(val) => {
                    const ohmVal = resistanceUnit === 'mΩ' ? val / 1000 : val;
                    onChange({ ...state, escWiringResistance: Math.max(0.0001, ohmVal) });
                  }}
                  step={resistanceUnit === 'mΩ' ? 1 : 0.001}
                  min={resistanceUnit === 'mΩ' ? 0.1 : 0.0001}
                  helperText="MOSFET RDS(on) + wire/plug resistance"
                />
              </div>
            </div>

            {/* Electrical Telemetry Box */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-[#F8FAFC] dark:bg-[#16181D] rounded-none border border-[#E2E8F0] dark:border-[#2E3646]">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#64748B] dark:text-[#85A3E0]">
                  Stall Torque
                </span>
                <div className="text-base sm:text-lg font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums">
                  {results.stallTorqueNm.toFixed(2)}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">N·m</span>
                </div>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  {results.stallTorqueOzIn.toFixed(0)} oz·in
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-[#64748B] dark:text-[#85A3E0]">
                  Torque Const (Kt)
                </span>
                <div className="text-base sm:text-lg font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums">
                  {(results.ktNmPerAmp * 1000).toFixed(1)}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">mN·m/A</span>
                </div>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  {results.ktNmPerAmp.toFixed(4)} N·m/A
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-[#64748B] dark:text-[#85A3E0]">
                  Time Constant (τ)
                </span>
                <div className="text-base sm:text-lg font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums">
                  {results.tauSec.toFixed(3)}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">s</span>
                </div>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  63.2% spin-up speed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Spin-Up Curve & Time Benchmarks */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  Asymptotic Spin-Up Curve
                </h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-[#64748B] dark:text-[#85A3E0]">
                  Free Speed:{' '}
                  <strong className="text-[#0F172A] dark:text-[#CEDDFD]">
                    {results.freeRpm.toFixed(0)} RPM
                  </strong>
                </span>
                <span className="text-[#0F172A] dark:text-[#CEDDFD]">
                  95% Spin-Up:{' '}
                  <strong className="text-[#094AD8] dark:text-[#60A5FA]">
                    {results.timeTo95PercentSec.toFixed(2)}s
                  </strong>
                </span>
              </div>
            </div>

            {/* Time Horizon Slider Controls and Quick Presets */}
            <div className="p-3 bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none flex flex-col gap-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                    Simulation Time Horizon
                  </span>
                  <span className="text-xs font-mono font-bold text-[#094AD8] dark:text-[#60A5FA]">
                    {timeHorizon.toFixed(1)}s
                  </span>
                </div>

                {/* Preset Buttons (2s, 3s, 4s, 5s) */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] uppercase font-mono text-[#64748B] dark:text-[#85A3E0]/70 mr-1 select-none">
                    Presets:
                  </span>
                  {[2, 3, 4, 5].map((preset) => {
                    const isActive = Math.abs(timeHorizon - preset) < 0.05;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => onChange({ ...state, timeHorizonSec: preset })}
                        className={`px-2 py-0.5 text-xs font-mono rounded-none transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#094AD8] text-white font-bold shadow-2xs'
                            : 'bg-white dark:bg-[#1F232B] text-[#64748B] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#2E3646] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                        }`}
                        title={`Set time horizon to ${preset} seconds`}
                      >
                        {preset}s
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horizon Slider */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1.0"
                  max="6.0"
                  step="0.1"
                  value={timeHorizon}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      onChange({ ...state, timeHorizonSec: val });
                    }
                  }}
                  className="w-full accent-[#094AD8] cursor-pointer h-1.5 bg-[#CBD5E1] dark:bg-[#2E3646] rounded-none appearance-none"
                  aria-label="Simulation time horizon in seconds"
                />
              </div>
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
                {timeMarkers.map((t) => {
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

                {/* 80% Combat Benchmark Line */}
                <line
                  x1={getX(Math.min(timeTo80PercentSec, maxTime))}
                  y1={padding.top}
                  x2={getX(Math.min(timeTo80PercentSec, maxTime))}
                  y2={padding.top + chartH}
                  stroke="#3B82F6"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                />

                {/* 95% Reference Line */}
                <line
                  x1={getX(Math.min(results.timeTo95PercentSec, maxTime))}
                  y1={padding.top}
                  x2={getX(Math.min(results.timeTo95PercentSec, maxTime))}
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
                      x={x - chartW / results.curvePoints.length / 2}
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
                  <span>
                    ({hoveredPoint.percentage.toFixed(0)}%)
                  </span>
                </div>
              )}
            </div>

            {/* Spin-Up Telemetry Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Card 1: Time to 80% Speed */}
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                    80% Speed (Combat)
                  </span>
                  <div className="text-lg font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-0.5">
                    {timeTo80PercentSec.toFixed(2)}s
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70 mt-1">
                  {(results.freeRpm * 0.8).toFixed(0)} RPM
                </span>
              </div>

              {/* Card 2: Time to 95% Speed */}
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-none p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-900 dark:text-amber-300 font-bold">
                    95% Spin-Up (3τ)
                  </span>
                  <div className="text-lg font-bold font-mono text-amber-800 dark:text-amber-300 tabular-nums mt-0.5">
                    {results.timeTo95PercentSec.toFixed(2)}s
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400/80 mt-1">
                  {(results.freeRpm * 0.95).toFixed(0)} RPM
                </span>
              </div>

              {/* Card 3: Peak Inrush Current */}
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                    Peak Inrush Current
                  </span>
                  <div className="text-lg font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-0.5">
                    {peakInrushCurrentAmps.toFixed(0)}{' '}
                    <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">A</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70 mt-1">
                  Stall load at t=0
                </span>
              </div>

              {/* Card 4: Steady State Current */}
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                    Steady State Current
                  </span>
                  <div className="text-lg font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-0.5">
                    {steadyStateCurrentAmps.toFixed(1)}{' '}
                    <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">A</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70 mt-1">
                  Free spin idle load
                </span>
              </div>

              {/* Card 5: Kinetic Energy at Horizon */}
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col justify-between col-span-2 sm:col-span-1">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                    KE @ {timeHorizon.toFixed(1)}s Horizon
                  </span>
                  <div className="text-lg font-bold font-mono text-[#094AD8] dark:text-[#60A5FA] tabular-nums mt-0.5">
                    {energyAtHorizonJoules.toFixed(0)}{' '}
                    <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">J</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70 mt-1">
                  {percentEnergyAtHorizon.toFixed(0)}% max ({results.maxStoredEnergyJoules.toFixed(0)} J)
                </span>
              </div>
            </div>

            {/* Combat Pit Recommendation */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] text-xs text-[#64748B] dark:text-[#85A3E0] leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-[#0F172A] dark:text-[#CEDDFD] mb-1">
                <span>Spin-Up Combat Strategy</span>
              </div>
              In combat robotics, an 80% spin-up time under{' '}
              <strong className="text-[#0F172A] dark:text-white">2.0 to 2.5 seconds</strong> allows
              you to recover lethal striking power between impacts before the opponent can pin you
              against the arena hazards.
            </div>
          </div>
        </div>
      </div>

      {/* SPARC v1.7 48V & High Current Compliance Warning Box */}
      <SparcVoltageWarningBox
        packVoltage={results.packVoltage}
        inrushCurrentAmps={peakInrushCurrentAmps}
      />
    </div>
  );
};
