/**
 * Late Night Combat Robotics Calculator Suite
 * Drivetrain Speed & Mobility Engineering Calculator
 * Dual-theme (light and dark) support. No icons.
 */

import React, { useMemo, useState, useEffect } from 'react';
import type { DrivetrainState, BatteryChemistry, VoltageState, WeightClassId } from '../../types';
import type { LengthUnit } from '../../types';
import { MOTOR_PRESETS, WEIGHT_CLASSES, BIGBOT_GEARBOX_PRESETS } from '../../utils/constants';
import { computeDrivetrain } from '../../utils/calculations';
import { FieldInputWithToggle } from '../common/FieldInputWithToggle';
import { BatteryVoltageBar } from '../common/BatteryVoltageBar';
import { SparcVoltageWarningBox } from '../common/SparcVoltageWarningBox';
import { PresetSelect } from '../common/PresetSelect';

interface DrivetrainToolProps {
  state: DrivetrainState;
  onChange: (newState: DrivetrainState) => void;
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
  extendedPreset?: boolean;
}

const DecimalRatioInput: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  title: string;
}> = ({ label, value, onChange, title }) => {
  const [text, setText] = useState<string>(isNaN(value) ? '1' : value.toString());
  const [focused, setFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!focused) {
      setText(isNaN(value) ? '1' : value.toString());
    }
  }, [value, focused]);

  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-[#64748B] dark:text-[#85A3E0] select-none pointer-events-none">
        {label}:
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const parsed = parseFloat(text);
          if (isNaN(parsed) || parsed <= 0) {
            setText(value.toString());
          } else {
            onChange(parsed);
          }
        }}
        onChange={(e) => {
          const val = e.target.value;
          if (/^[0-9]*\.?[0-9]*$/.test(val)) {
            setText(val);
            const parsed = parseFloat(val);
            if (!isNaN(parsed) && parsed > 0) {
              onChange(parsed);
            }
          }
        }}
        className="w-full bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] rounded-none pl-11 pr-3 py-2 text-sm text-[#0F172A] dark:text-[#CEDDFD] font-mono outline-none focus:border-[#094AD8] tabular-nums"
        title={title}
      />
    </div>
  );
};

export const DrivetrainTool: React.FC<DrivetrainToolProps> = ({
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
  extendedPreset = false,
}) => {
  const results = computeDrivetrain(
    state,
    chemistry,
    voltageState,
    useDirectVoltage ? directVoltage : undefined
  );
  const currentClass = WEIGHT_CLASSES.find((w) => w.id === weightClass) || WEIGHT_CLASSES[0];
  const speedUnit = state.speedUnit || 'ft/s';
  const isFtPerSec = speedUnit === 'ft/s';

  const filteredMotors = MOTOR_PRESETS.filter((m) => {
    const isCategoryMatch = m.category === 'drive' || m.category === 'both';
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

  const repeatGearboxPresets = BIGBOT_GEARBOX_PRESETS.filter((p) => p.brand === 'Repeat Robotics');
  const rangleboxGearboxPresets = BIGBOT_GEARBOX_PRESETS.filter((p) => p.brand === 'Ranglebox');
  const hiveTechGearboxPresets = BIGBOT_GEARBOX_PRESETS.filter((p) => p.brand === 'HiveTech');

  // Active gearbox preset for Big Bots
  const activeGearboxPreset = useMemo(() => {
    if (state.gearboxPresetId) {
      return state.gearboxPresetId;
    }
    const matching = BIGBOT_GEARBOX_PRESETS.find(
      (p) => p.id !== 'custom' && Math.abs(p.ratio - state.gearRatio) < 0.05
    );
    return matching ? matching.id : 'custom';
  }, [state.gearboxPresetId, state.gearRatio]);

  const handleGearboxPresetChange = (presetId: string) => {
    if (presetId === 'custom') {
      onChange({
        ...state,
        gearboxPresetId: 'custom',
      });
      return;
    }
    const preset = BIGBOT_GEARBOX_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChange({
      ...state,
      gearboxPresetId: presetId,
      gearRatio: preset.ratio,
    });
  };

  const handleGearRatioChange = (val: number) => {
    const matchingPreset = BIGBOT_GEARBOX_PRESETS.find(
      (p) => p.id !== 'custom' && Math.abs(p.ratio - val) < 0.01
    );
    onChange({
      ...state,
      gearRatio: val,
      gearboxPresetId: matchingPreset ? matchingPreset.id : 'custom',
    });
  };

  const handleMotorPresetChange = (presetId: string) => {
    const preset = MOTOR_PRESETS.find((m) => m.id === presetId);
    if (!preset) return;

    let newGearRatio = preset.gearRatio !== undefined ? preset.gearRatio : state.gearRatio;
    let newGearboxPresetId = state.gearboxPresetId;

    if (weightClass === 'bigbot') {
      const isBeltOrCustom =
        preset.id === 'custom' ||
        preset.name.toLowerCase().includes('belt drive') ||
        preset.gearRatio === 1.0;

      if (isBeltOrCustom) {
        newGearboxPresetId = 'custom';
      } else if (preset.id === 'rr_magnum_gearmotor_3536') {
        newGearboxPresetId = 'repeat_magnum_gearbox';
        newGearRatio = 19.0;
      } else if (preset.id === 'rr_ultra_mk2_gearmotor_2830') {
        newGearboxPresetId = 'repeat_ultra_mk2_14';
        newGearRatio = 14.0;
      } else if (preset.id === 'ranglebox_saturn_19') {
        newGearboxPresetId = 'ranglebox_saturn_19';
        newGearRatio = 19.0;
      } else {
        const matching = BIGBOT_GEARBOX_PRESETS.find(
          (gb) => gb.id !== 'custom' && Math.abs(gb.ratio - (preset.gearRatio ?? 1)) < 0.05
        );
        newGearboxPresetId = matching ? matching.id : 'custom';
      }
    }

    onChange({
      ...state,
      motorPresetId: presetId,
      motorKv: preset.kv,
      gearRatio: newGearRatio,
      gearboxPresetId: newGearboxPresetId,
      manualRpmOverride: null,
    });
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

      {/* Main Split Layout: Inputs (Left) and Theoretical Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Parameter Cards */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                Motor & Powertrain Specifications
              </h3>
              <span className="text-xs font-mono text-[#64748B] dark:text-[#85A3E0]">
                {currentClass.shortName} Preset
              </span>
            </div>

            {/* Motor Preset Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                Motor Preset
              </label>
              <PresetSelect
                value={state.motorPresetId}
                onChange={handleMotorPresetChange}
                groups={motorPresetGroups}
                ariaLabel="Motor Preset"
                placeholder="Search drive motor presets (e.g. Blitz, DartBox, 2850)..."
              />
            </div>

            {/* Motor KV */}
            <FieldInputWithToggle
              label="Motor Velocity Constant (KV)"
              value={state.motorKv}
              unit="RPM/V"
              onChangeValue={(val) =>
                onChange({
                  ...state,
                  motorKv: val,
                  motorPresetId: 'custom',
                  ...(weightClass === 'bigbot' ? { gearboxPresetId: 'custom' } : {}),
                })
              }
              step={25}
              min={50}
              max={15000}
              helperText="RPM produced per volt applied"
            />

            {/* Optional Manual RPM Override */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Manual Motor RPM Override (Optional)
                </label>
                {state.manualRpmOverride !== null && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...state, manualRpmOverride: null })}
                    className="text-[11px] text-[#094AD8] hover:underline font-semibold cursor-pointer"
                  >
                    Clear Override
                  </button>
                )}
              </div>
              <input
                type="number"
                value={state.manualRpmOverride ?? ''}
                placeholder="Leave blank to use KV × Voltage"
                onChange={(e) => {
                  const val = e.target.value === '' ? null : parseFloat(e.target.value);
                  onChange({ ...state, manualRpmOverride: val });
                }}
                className="w-full bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] rounded-none px-3 py-2 text-sm text-[#0F172A] dark:text-[#CEDDFD] font-mono outline-none focus:border-[#094AD8] placeholder-[#94A3B8] dark:placeholder-[#424957] shadow-2xs"
              />
            </div>

            {/* Gearbox & External Reduction Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Gearbox Reduction */}
              <div className="flex flex-col gap-3">
                {weightClass === 'bigbot' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                      Gearbox Preset (Big Bots)
                    </label>
                    <select
                      value={activeGearboxPreset}
                      onChange={(e) => handleGearboxPresetChange(e.target.value)}
                      className="w-full bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] rounded-none px-3 py-2 text-sm text-[#0F172A] dark:text-[#CEDDFD] font-mono outline-none focus:border-[#094AD8] shadow-2xs cursor-pointer"
                    >
                      {repeatGearboxPresets.length > 0 && (
                        <optgroup label="Repeat Robotics">
                          {repeatGearboxPresets.map((gb) => (
                            <option key={gb.id} value={gb.id}>
                              {gb.name}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {extendedPreset && rangleboxGearboxPresets.length > 0 && (
                        <optgroup label="Ranglebox">
                          {rangleboxGearboxPresets.map((gb) => (
                            <option key={gb.id} value={gb.id}>
                              {gb.name}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {extendedPreset && hiveTechGearboxPresets.length > 0 && (
                        <optgroup label="HiveTech">
                          {hiveTechGearboxPresets.map((gb) => (
                            <option key={gb.id} value={gb.id}>
                              {gb.name}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      <optgroup label="Direct / Custom">
                        <option value="direct_drive">Direct Drive (1:1)</option>
                        <option value="custom">Custom Ratio</option>
                      </optgroup>

                      {!extendedPreset &&
                        (rangleboxGearboxPresets.some((p) => p.id === activeGearboxPreset) ||
                          hiveTechGearboxPresets.some((p) => p.id === activeGearboxPreset)) && (
                          <optgroup label="Active Selection">
                            <option value={activeGearboxPreset}>
                              {BIGBOT_GEARBOX_PRESETS.find((p) => p.id === activeGearboxPreset)?.name ||
                                'Custom Ratio'}
                            </option>
                          </optgroup>
                        )}
                    </select>
                  </div>
                )}

                <FieldInputWithToggle
                  label="Gearbox Reduction (:1)"
                  value={state.gearRatio}
                  unit=":1"
                  onChangeValue={handleGearRatioChange}
                  step={0.5}
                  min={0.5}
                  max={250}
                  helperText="Internal planetary/spur reduction (e.g. 14 for 14:1)"
                />
              </div>

              {/* External Reduction (Belt / Chain / Secondary Gears) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                    External Reduction (Belt/Gear Ratio)
                  </label>
                  <span className="text-[11px] font-mono text-[#094AD8] dark:text-[#60A5FA] font-bold">
                    {results.externalRatio.toFixed(2)}:1
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <DecimalRatioInput
                    label="IN"
                    value={state.externalInputTeeth ?? 1}
                    onChange={(val) => onChange({ ...state, externalInputTeeth: val })}
                    title="Driver ratio or tooth count (e.g. 1 or 15)"
                  />
                  <DecimalRatioInput
                    label="OUT"
                    value={state.externalOutputTeeth ?? 1}
                    onChange={(val) => onChange({ ...state, externalOutputTeeth: val })}
                    title="Driven ratio or tooth count (e.g. 2.5 or 30)"
                  />
                </div>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  Total Drive Ratio: <strong>{results.totalRatio.toFixed(2)}:1</strong> (Gearbox × External)
                </span>
              </div>
            </div>

            {/* Wheel Diameter with Unit Toggle */}
            <FieldInputWithToggle
              label="Wheel Outer Diameter"
              value={state.wheelDiameter}
              unit={state.wheelDiameterUnit}
              units={['mm', 'in']}
              onChangeValue={(val) => onChange({ ...state, wheelDiameter: val })}
              onChangeValueAndUnit={(val, unit: LengthUnit) =>
                onChange({ ...state, wheelDiameter: val, wheelDiameterUnit: unit })
              }
              step={state.wheelDiameterUnit === 'in' ? 0.125 : 1}
              min={state.wheelDiameterUnit === 'in' ? 0.2 : 5}
              helperText="Outer tire contact diameter"
            />
          </div>
        </div>

        {/* Right Column: Theoretical Drive Speed Telemetry */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            <div className="pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                Theoretical Drive Speed
              </h3>
            </div>

            {/* Primary Big Result: Theoretical Speed */}
            <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-mono text-[#64748B] dark:text-[#85A3E0]">
                  Theoretical Speed
                </span>
                <div className="flex items-center border border-[#CBD5E1] dark:border-[#333C4D] bg-[#F1F5F9] dark:bg-[#1C2028] p-0.5">
                  <button
                    type="button"
                    onClick={() => onChange({ ...state, speedUnit: 'ft/s' })}
                    className={`px-2 py-0.5 text-[10px] font-semibold font-mono rounded-none cursor-pointer transition-colors ${
                      isFtPerSec
                        ? 'bg-[#094AD8] text-white shadow-2xs'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                    }`}
                  >
                    ft/s
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...state, speedUnit: 'mph' })}
                    className={`px-2 py-0.5 text-[10px] font-semibold font-mono rounded-none cursor-pointer transition-colors ${
                      !isFtPerSec
                        ? 'bg-[#094AD8] text-white shadow-2xs'
                        : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
                    }`}
                  >
                    mph
                  </button>
                </div>
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl sm:text-5xl font-extrabold font-mono text-[#094AD8] dark:text-white tabular-nums">
                  {isFtPerSec
                    ? results.theoreticalSpeedFts.toFixed(2)
                    : results.theoreticalSpeedMph.toFixed(2)}
                </span>
                <span className="text-lg font-mono font-bold text-[#0F172A] dark:text-[#094AD8]">
                  {isFtPerSec ? 'ft/s' : 'mph'}
                </span>
              </div>
              <div className="text-sm font-mono text-[#64748B] dark:text-[#85A3E0] mt-0.5">
                {isFtPerSec
                  ? `${results.theoreticalSpeedMph.toFixed(2)} mph · ${results.theoreticalSpeedMs.toFixed(2)} m/s`
                  : `${results.theoreticalSpeedMs.toFixed(2)} m/s · ${results.theoreticalSpeedFts.toFixed(2)} ft/s`}
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3.5 flex flex-col">
                <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Wheel Speed
                </span>
                <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.wheelRpm.toFixed(0)}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">RPM</span>
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70 mt-0.5">
                  {results.wheelCircumferenceMm.toFixed(1)} mm travel per rotation
                </span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3.5 flex flex-col">
                <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Motor Speed
                </span>
                <span className="text-xl font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-1">
                  {results.motorRpm.toFixed(0)}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">RPM</span>
                </span>
                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70 mt-0.5">
                  @ {results.packVoltage.toFixed(1)}V pack
                </span>
              </div>
            </div>

            {/* Combat Pit Recommendation Box */}
            <div className="p-3.5 rounded-none bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] text-xs text-[#64748B] dark:text-[#85A3E0] leading-relaxed">
              <div className="font-semibold text-[#0F172A] dark:text-[#CEDDFD] mb-1">
                Combat Mobility Target
              </div>
              For all weight classes (including {currentClass.pluralName}), target speeds of{' '}
              <strong className="text-[#0F172A] dark:text-white">5–8 mph (8–12 ft/s)</strong> provide ideal control and pushing responsiveness in the arena.
            </div>
          </div>
        </div>
      </div>

      {/* SPARC v1.7 48V Warning Box at the bottom */}
      <SparcVoltageWarningBox packVoltage={results.packVoltage} />
    </div>
  );
};
