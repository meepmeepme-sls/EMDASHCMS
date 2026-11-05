/**
 * Late Night Combat Robotics Calculator Suite
 * Weapon What-If Parametric Tip Speed Matrix Tool
 * Provides a 2D matrix sweep across motor KV variants and battery voltages (LiPo & LiHV).
 * Values > 300 MPH turn orange.
 * Full dual-theme (Light & Dark) and sharp industrial styling.
 */

import React, { useMemo } from 'react';
import type {
  WeaponWhatIfState,
  WeaponState,
  WeightClassId,
  LengthUnit,
  WeaponWhatIfFamily,
} from '../../types';
import { getWeaponMotorFamilies } from '../../utils/constants';

interface WeaponWhatIfToolProps {
  whatIfState: WeaponWhatIfState;
  onChangeWhatIfState: (newState: WeaponWhatIfState) => void;
  weaponState: WeaponState;
  onChangeWeaponState: (newWeaponState: WeaponState) => void;
  weightClass: WeightClassId;
}

export const WeaponWhatIfTool: React.FC<WeaponWhatIfToolProps> = ({
  whatIfState,
  onChangeWhatIfState,
  weaponState,
  onChangeWeaponState,
  weightClass: _weightClass,
}) => {
  // Motor families grouped dynamically from LNCR preset library
  const families: WeaponWhatIfFamily[] = useMemo(() => getWeaponMotorFamilies(), []);

  // Current selected family or 'custom'
  const isCustom = whatIfState.selectedFamilyId === 'custom';
  const selectedFamily = useMemo(() => {
    return families.find((f: WeaponWhatIfFamily) => f.id === whatIfState.selectedFamilyId) || families[0];
  }, [families, whatIfState.selectedFamilyId]);

  // Extract KV variants
  const activeKvs: number[] = useMemo(() => {
    if (isCustom) {
      const parts: number[] = whatIfState.customKvsText
        .split(/[,\s]+/)
        .map((x: string) => Number(x.trim()))
        .filter((n: number) => Number.isFinite(n) && n > 0);
      return parts.length > 0
        ? (Array.from(new Set(parts)).sort((a: number, b: number) => a - b) as number[])
        : [1100, 1800, 2300];
    }
    return selectedFamily ? selectedFamily.variants.map((v: { id: string; name: string; kv: number }) => v.kv) : [1100, 1800, 2300];
  }, [isCustom, whatIfState.customKvsText, selectedFamily]);

  // Pulley reduction ratio (teeth_in / teeth_out)
  const inputTeeth = Math.max(1, weaponState.inputTeeth ?? 16);
  const outputTeeth = Math.max(1, weaponState.outputTeeth ?? 16);
  const reductionRatio = inputTeeth / outputTeeth;

  // Diameter in mm for SI speed formula
  const diameterVal = Math.max(0.1, weaponState.effectiveDiameter || 5);
  const diameterMm =
    weaponState.effectiveDiameterUnit === 'in' ? diameterVal * 25.4 : diameterVal;

  // Generate voltage columns spanning minCells to maxCells
  const minCells = Math.min(whatIfState.minCells, whatIfState.maxCells);
  const maxCells = Math.max(whatIfState.minCells, whatIfState.maxCells);

  const activeVoltages = useMemo(() => {
    const list: { cells: number; chem: 'LiPo' | 'LiHV'; volts: number }[] = [];
    for (let s = minCells; s <= maxCells; s++) {
      list.push({ cells: s, chem: 'LiPo', volts: s * 4.2 });
      list.push({ cells: s, chem: 'LiHV', volts: s * 4.35 });
    }
    return list.sort((a, b) => a.volts - b.volts);
  }, [minCells, maxCells]);

  // Bi-directional update helpers
  const handleDiameterChange = (val: number) => {
    onChangeWeaponState({
      ...weaponState,
      effectiveDiameter: val,
    });
  };

  const handleDiameterUnitChange = (unit: LengthUnit) => {
    onChangeWeaponState({
      ...weaponState,
      effectiveDiameterUnit: unit,
    });
  };

  const handleInputTeethChange = (teeth: number) => {
    const t = Math.max(1, teeth);
    onChangeWeaponState({
      ...weaponState,
      inputTeeth: t,
      gearRatio: Number((t / outputTeeth).toFixed(3)),
    });
  };

  const handleOutputTeethChange = (teeth: number) => {
    const t = Math.max(1, teeth);
    onChangeWeaponState({
      ...weaponState,
      outputTeeth: t,
      gearRatio: Number((inputTeeth / t).toFixed(3)),
    });
  };

  const handleSpeedUnitChange = (unit: 'mph' | 'm/s' | 'ft/s') => {
    onChangeWhatIfState({
      ...whatIfState,
      speedUnit: unit,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ============================================================== */}
      {/* LEFT COLUMN: Parametric Inputs & Configuration                  */}
      {/* ============================================================== */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        {/* Motor Family Selection Card */}
        <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] p-5 shadow-2xs rounded-none transition-colors">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0] dark:border-[#2E3646]">
            <h2 className="text-sm font-bold tracking-wider uppercase text-[#0F172A] dark:text-[#CEDDFD]">
              Motor Family & Variants
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-[#F1F5F9] dark:bg-[#16181D] text-[#475569] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#2E3646] rounded-none">
              {isCustom ? 'Custom' : `${activeKvs.length} KVs`}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                Weapon Motor Family
              </label>
              <select
                value={whatIfState.selectedFamilyId}
                onChange={(e) =>
                  onChangeWhatIfState({
                    ...whatIfState,
                    selectedFamilyId: e.target.value,
                  })
                }
                className="w-full bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] text-[#0F172A] dark:text-[#CEDDFD] px-3 py-2 text-sm font-mono outline-none focus:border-[#094AD8] rounded-none shadow-2xs cursor-pointer"
              >
                <optgroup label="Repeat Robotics">
                  {families
                    .filter((f: WeaponWhatIfFamily) => f.brand === 'Repeat Robotics')
                    .map((f: WeaponWhatIfFamily) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.variants.map((v: { id: string; name: string; kv: number }) => v.kv).join(', ')} KV)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="FingerTech Robotics">
                  {families
                    .filter((f: WeaponWhatIfFamily) => f.brand === 'FingerTech')
                    .map((f: WeaponWhatIfFamily) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.variants.map((v: { id: string; name: string; kv: number }) => v.kv).join(', ')} KV)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Just Cuz Robotics">
                  {families
                    .filter((f: WeaponWhatIfFamily) => f.brand === 'Just Cuz Robotics')
                    .map((f: WeaponWhatIfFamily) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.variants.map((v: { id: string; name: string; kv: number }) => v.kv).join(', ')} KV)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Custom">
                  <option value="custom">-- Custom Motor (Manual KVs) --</option>
                </optgroup>
              </select>
            </div>

            {/* Custom KVs Input (when Custom is selected) */}
            {isCustom ? (
              <div className="p-3 bg-amber-500/10 dark:bg-amber-400/10 border border-amber-300 dark:border-amber-700/50 rounded-none flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Custom KV Variants (Comma-separated)
                </label>
                <input
                  type="text"
                  value={whatIfState.customKvsText}
                  onChange={(e) =>
                    onChangeWhatIfState({
                      ...whatIfState,
                      customKvsText: e.target.value,
                    })
                  }
                  placeholder="e.g. 1100, 1800, 2300"
                  className="w-full bg-white dark:bg-[#16181D] border border-amber-400/50 dark:border-amber-600/50 text-[#0F172A] dark:text-[#CEDDFD] px-3 py-1.5 text-sm font-mono outline-none focus:border-[#094AD8] rounded-none shadow-2xs"
                />
                <p className="text-[11px] text-amber-700 dark:text-amber-300/80">
                  Enter positive KV numbers separated by commas or spaces.
                </p>
              </div>
            ) : (
              <div className="p-2.5 bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] text-xs rounded-none">
                <span className="text-[#64748B] dark:text-[#85A3E0]">Included Variants: </span>
                <span className="font-mono font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  {activeKvs.map((k: number) => `${k} KV`).join(' · ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Weapon Geometry & Pulley Ratio Card (Bi-directional Sync) */}
        <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] p-5 shadow-2xs rounded-none transition-colors">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0] dark:border-[#2E3646]">
            <h2 className="text-sm font-bold tracking-wider uppercase text-[#0F172A] dark:text-[#CEDDFD]">
              Weapon Geometry & Drive
            </h2>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-[#094AD8]/10 text-[#094AD8] dark:text-[#60A5FA] border border-[#094AD8]/30 dark:border-[#60A5FA]/30 rounded-none">
              Synced with Weapon Tab
            </span>
          </div>

          <div className="space-y-4">
            {/* Diameter with Unit Toggle */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Effective Tip Diameter
                </label>
                <div className="inline-flex border border-[#CBD5E1] dark:border-[#2E3646] rounded-none overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleDiameterUnitChange('in')}
                    className={`px-2.5 py-1 text-xs font-mono font-semibold transition-colors cursor-pointer rounded-none ${
                      weaponState.effectiveDiameterUnit === 'in'
                        ? 'bg-[#094AD8] text-white shadow-2xs'
                        : 'bg-[#F1F5F9] dark:bg-[#16181D] text-[#475569] dark:text-[#85A3E0] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                    }`}
                  >
                    in
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDiameterUnitChange('mm')}
                    className={`px-2.5 py-1 text-xs font-mono font-semibold transition-colors cursor-pointer rounded-none ${
                      weaponState.effectiveDiameterUnit === 'mm'
                        ? 'bg-[#094AD8] text-white shadow-2xs'
                        : 'bg-[#F1F5F9] dark:bg-[#16181D] text-[#475569] dark:text-[#85A3E0] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                    }`}
                  >
                    mm
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0.1"
                step="0.05"
                value={weaponState.effectiveDiameter}
                onChange={(e) => handleDiameterChange(parseFloat(e.target.value) || 0.1)}
                className="w-full bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] text-[#0F172A] dark:text-[#CEDDFD] px-3 py-2 text-sm font-mono tabular-nums outline-none focus:border-[#094AD8] rounded-none shadow-2xs"
              />
            </div>

            {/* Pulley / Pinion Teeth (Driver & Driven) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                Pulley / Sprocket Teeth
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
                    Motor (Driver)
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={weaponState.inputTeeth ?? 16}
                    onChange={(e) => handleInputTeethChange(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] text-[#0F172A] dark:text-[#CEDDFD] px-3 py-2 text-sm font-mono tabular-nums outline-none focus:border-[#094AD8] rounded-none shadow-2xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
                    Weapon (Driven)
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={weaponState.outputTeeth ?? 16}
                    onChange={(e) => handleOutputTeethChange(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] text-[#0F172A] dark:text-[#CEDDFD] px-3 py-2 text-sm font-mono tabular-nums outline-none focus:border-[#094AD8] rounded-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Ratio Readout Badge */}
              <div className="mt-2 p-2 bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] flex items-center justify-between text-xs rounded-none">
                <span className="text-[#64748B] dark:text-[#85A3E0]">Weapon Ratio:</span>
                <span className="font-mono font-bold text-[#094AD8] dark:text-[#60A5FA]">
                  {inputTeeth === outputTeeth
                    ? '1.00:1 (Direct Drive)'
                    : inputTeeth < outputTeeth
                    ? `${(outputTeeth / inputTeeth).toFixed(2)}:1 (Reduction)`
                    : `1:${(inputTeeth / outputTeeth).toFixed(2)} (Overdrive)`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Voltage Range Card */}
        <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] p-5 shadow-2xs rounded-none transition-colors">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0] dark:border-[#2E3646]">
            <h2 className="text-sm font-bold tracking-wider uppercase text-[#0F172A] dark:text-[#CEDDFD]">
              Battery Cell Count Range
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-[#F1F5F9] dark:bg-[#16181D] text-[#475569] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#2E3646] rounded-none">
              {activeVoltages.length} Columns
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Minimum Cells
                </span>
                <span className="font-mono font-bold text-[#094AD8] dark:text-[#60A5FA]">
                  {minCells}S LiPo · {(minCells * 4.2).toFixed(2)} V
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="16"
                step="1"
                value={minCells}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onChangeWhatIfState({
                    ...whatIfState,
                    minCells: val,
                    maxCells: Math.max(val, whatIfState.maxCells),
                  });
                }}
                className="w-full accent-[#094AD8] cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                  Maximum Cells
                </span>
                <span className="font-mono font-bold text-[#094AD8] dark:text-[#60A5FA]">
                  {maxCells}S LiHV · {(maxCells * 4.35).toFixed(2)} V
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="16"
                step="1"
                value={maxCells}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onChangeWhatIfState({
                    ...whatIfState,
                    maxCells: val,
                    minCells: Math.min(val, whatIfState.minCells),
                  });
                }}
                className="w-full accent-[#094AD8] cursor-pointer"
              />
            </div>

            <div className="flex justify-between text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
              <span>2S (8.40 V)</span>
              <span>16S (69.60 V)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT COLUMN: 2D Parametric Tip Speed Matrix Table              */}
      {/* ============================================================== */}
      <div className="lg:col-span-8 flex flex-col gap-5">
        <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] p-5 shadow-2xs rounded-none transition-colors">
          {/* Header Bar with Speed Unit Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0] dark:border-[#2E3646] gap-3">
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase text-[#0F172A] dark:text-[#CEDDFD]">
                Weapon Tip Speed Matrix
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#85A3E0] mt-0.5">
                Theoretical no-load tip speed across motor KV variants and full battery sweep.
              </p>
            </div>

            {/* Speed Unit Selector Toggle */}
            <div className="inline-flex border border-[#CBD5E1] dark:border-[#2E3646] rounded-none overflow-hidden self-start sm:self-auto">
              {(['mph', 'm/s', 'ft/s'] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => handleSpeedUnitChange(unit)}
                  className={`px-3 py-1 text-xs font-mono font-semibold transition-colors cursor-pointer rounded-none ${
                    whatIfState.speedUnit === unit
                      ? 'bg-[#094AD8] text-white shadow-2xs'
                      : 'bg-[#F1F5F9] dark:bg-[#16181D] text-[#475569] dark:text-[#85A3E0] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {/* Matrix Table with Horizontal Scroll & Sticky Column */}
          <div className="overflow-x-auto border border-[#E2E8F0] dark:border-[#2E3646] rounded-none">
            <table className="w-full border-collapse text-left whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8FAFC] dark:bg-[#16181D] border-b border-[#E2E8F0] dark:border-[#2E3646]">
                  <th className="sticky left-0 z-10 bg-[#F1F5F9] dark:bg-[#1C2028] px-3.5 py-2.5 text-xs font-bold font-mono uppercase tracking-wider text-[#0F172A] dark:text-[#CEDDFD] border-r border-[#E2E8F0] dark:border-[#2E3646]">
                    KV
                  </th>
                  {activeVoltages.map((v, idx) => (
                    <th
                      key={`${v.cells}-${v.chem}-${idx}`}
                      className="px-3 py-2 text-center text-xs font-semibold text-[#0F172A] dark:text-[#CEDDFD] border-r border-[#E2E8F0] dark:border-[#2E3646] last:border-r-0"
                    >
                      <div className="font-mono font-bold">
                        {v.cells}S {v.chem}
                      </div>
                      <div className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0] font-normal">
                        {v.volts.toFixed(2)} V
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeKvs.map((kv: number) => (
                  <tr
                    key={kv}
                    className="border-b border-[#E2E8F0] dark:border-[#2E3646]/60 hover:bg-[#F8FAFC] dark:hover:bg-[#16181D]/60 transition-colors"
                  >
                    {/* Sticky KV Label */}
                    <td className="sticky left-0 z-10 bg-[#F8FAFC] dark:bg-[#1C2028] px-3.5 py-2.5 text-xs font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] border-r border-[#E2E8F0] dark:border-[#2E3646]">
                      {kv.toLocaleString()}
                    </td>

                    {/* Calculated Cells */}
                    {activeVoltages.map((v, vIdx) => {
                      const rpm = kv * v.volts * reductionRatio;
                      const speedMs = (rpm * Math.PI * diameterMm) / (60 * 1000);
                      const speedMph = speedMs * 2.236936;
                      const speedFts = speedMs * 3.28084;

                      // Display unit formatting
                      let displayVal = Math.round(speedMph).toLocaleString('en-US');
                      if (whatIfState.speedUnit === 'm/s') {
                        displayVal = Math.round(speedMs).toLocaleString('en-US');
                      } else if (whatIfState.speedUnit === 'ft/s') {
                        displayVal = Math.round(speedFts).toLocaleString('en-US');
                      }

                      // Condition: values greater than 300 MPH turn orange
                      const isOver300Mph = speedMph > 300.0;

                      return (
                        <td
                          key={`${kv}-${v.cells}-${v.chem}-${vIdx}`}
                          className={`px-3 py-2 text-center text-xs font-mono tabular-nums border-r border-[#E2E8F0] dark:border-[#2E3646]/60 last:border-r-0 transition-colors ${
                            isOver300Mph
                              ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-500/15 dark:bg-orange-400/20'
                              : 'text-[#0F172A] dark:text-[#CEDDFD]'
                          }`}
                          title={`${kv}KV @ ${v.volts.toFixed(2)}V = ${Math.round(speedMph)} mph (${Math.round(speedMs)} m/s)`}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Legend & Engineering Footnote */}
          <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#2E3646] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-orange-500/20 border border-orange-500 rounded-none" />
              <span className="text-[#64748B] dark:text-[#85A3E0]">
                Orange indicates tip speed <strong className="text-[#0F172A] dark:text-[#CEDDFD]">&gt; 300 MPH</strong> (134 m/s).
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
              LiPo: 4.20 V/cell · LiHV: 4.35 V/cell · Theoretical no-load
            </div>
          </div>
        </div>

        {/* Quick Engineering Notes Card */}
        <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] p-4 text-xs text-[#64748B] dark:text-[#85A3E0] space-y-1.5 rounded-none">
          <div className="font-semibold text-[#0F172A] dark:text-[#CEDDFD] uppercase tracking-wider text-[11px]">
            Engineering & Pit Considerations:
          </div>
          <p>
            • <strong className="text-[#0F172A] dark:text-[#CEDDFD]">No-load assumption:</strong> These values represent theoretical maximums with fully charged packs and zero aerodynamic drag or weapon friction. Under battle conditions, voltage sag under heavy spin-up load typically reduces actual operating RPM by 10% to 20%.
          </p>
          <p>
            • <strong className="text-[#0F172A] dark:text-[#CEDDFD]">300 MPH Threshold:</strong> Most combat robotics arenas and safety committees mandate heavy-duty polycarbonate Lexan enclosures for high-kinetic energy weapons; tip speeds exceeding 300 MPH generate massive kinetic energy and require carefully verified blade balance and hub retainment.
          </p>
        </div>
      </div>
    </div>
  );
};
