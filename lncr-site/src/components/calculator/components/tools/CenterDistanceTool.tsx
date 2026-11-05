/**
 * Late Night Combat Robotics Calculator Suite
 * Center Distance Calculator for Timing Belts, Chains & Smooth V-Belts
 * Dedicated Mechanical Engineering Pane with dual theme support.
 */

import React from 'react';
import type { CenterDistanceState, BeltDriveType, SizingMode, LengthUnit } from '../../types';
import { BELT_PITCH_PRESETS } from '../../utils/constants';
import { computeCenterDistance } from '../../utils/calculations';
import { FieldInputWithToggle } from '../common/FieldInputWithToggle';
import { SparcVoltageWarningBox } from '../common/SparcVoltageWarningBox';

interface CenterDistanceToolProps {
  state: CenterDistanceState;
  onChange: (newState: CenterDistanceState) => void;
  packVoltage: number;
}

export const CenterDistanceTool: React.FC<CenterDistanceToolProps> = ({
  state,
  onChange,
  packVoltage,
}) => {
  const beltType = state.beltType || 'toothed';
  const sizingMode = state.sizingMode || 'teeth';

  const results = computeCenterDistance(state);

  const handlePresetChange = (presetId: string) => {
    const preset = BELT_PITCH_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChange({
      ...state,
      pitchPresetId: presetId,
      customPitchMm: preset.pitchMm,
    });
  };

  // Dynamic SVG geometry resizing based on center distance
  const centerDist = results.actualCenterDistanceMm;
  const r1 = Math.max(results.smallPitchDiameterMm * 0.7, 18);
  const r2 = Math.max(results.largePitchDiameterMm * 0.7, 24);
  const cx1 = 90;
  const cx2 = Math.max(cx1 + centerDist * 1.6, 320);
  const svgW = Math.max(540, cx2 + 90);
  const svgH = Math.max(220, Math.round(Math.max(r1, r2) * 2 + 90));
  const cy = svgH / 2 - 10;

  return (
    <div className="flex flex-col gap-6">
      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Specifications */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  Mechanical Belt & Pulley Sizing
                </h3>
              </div>
              <span className="text-xs font-mono text-[#64748B] dark:text-[#85A3E0]">
                {results.ratio.toFixed(2)}:1 Ratio
              </span>
            </div>

            {/* Drive Type Selector (Toothed vs Smooth V-Belt) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                Drive / Belt System Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...state, beltType: 'toothed' })}
                  className={`px-3 py-2 text-xs font-semibold rounded-none border transition-all cursor-pointer ${
                    beltType === 'toothed'
                      ? 'bg-[#094AD8] text-white border-[#094AD8] shadow-2xs font-bold'
                      : 'bg-[#F8FAFC] dark:bg-[#16181D] text-[#64748B] dark:text-[#85A3E0] border-[#CBD5E1] dark:border-[#2E3646]'
                  }`}
                >
                  Toothed Belt / Chain
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...state, beltType: 'smooth-vbelt' })}
                  className={`px-3 py-2 text-xs font-semibold rounded-none border transition-all cursor-pointer ${
                    beltType === 'smooth-vbelt'
                      ? 'bg-[#094AD8] text-white border-[#094AD8] shadow-2xs font-bold'
                      : 'bg-[#F8FAFC] dark:bg-[#16181D] text-[#64748B] dark:text-[#85A3E0] border-[#CBD5E1] dark:border-[#2E3646]'
                  }`}
                >
                  Smooth V-Belt
                </button>
              </div>
            </div>

            {beltType === 'toothed' ? (
              <>
                {/* Belt / Chain Pitch Preset */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                    Belt / Chain Pitch Standard
                  </label>
                  <select
                    value={state.pitchPresetId}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] rounded-none px-3 py-2 text-sm text-[#0F172A] dark:text-[#CEDDFD] font-mono outline-none focus:border-[#094AD8] shadow-2xs cursor-pointer"
                  >
                    {BELT_PITCH_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {state.pitchPresetId === 'custom' && (
                  <FieldInputWithToggle
                    label="Custom Tooth Pitch (Distance)"
                    value={state.customPitchMm}
                    unit="mm"
                    onChangeValue={(val) => onChange({ ...state, customPitchMm: val })}
                    step={0.5}
                    min={0.5}
                  />
                )}

                {/* Pulley Tooth Counts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldInputWithToggle
                    label="Driver Pulley (z1)"
                    value={state.smallPulleyTeeth}
                    unit="teeth"
                    onChangeValue={(val) =>
                      onChange({ ...state, smallPulleyTeeth: Math.max(Math.round(val), 1) })
                    }
                    step={1}
                    min={1}
                    max={200}
                    helperText="Motor or input pulley"
                  />
                  <FieldInputWithToggle
                    label="Driven Pulley (z2)"
                    value={state.largePulleyTeeth}
                    unit="teeth"
                    onChangeValue={(val) =>
                      onChange({ ...state, largePulleyTeeth: Math.max(Math.round(val), 1) })
                    }
                    step={1}
                    min={1}
                    max={200}
                    helperText="Wheel or weapon pulley"
                  />
                </div>
              </>
            ) : (
              /* Smooth V-Belt Diameters */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldInputWithToggle
                  label="Driver Pulley Diameter"
                  value={state.driverDiameterMm ?? 20}
                  unit="mm"
                  onChangeValue={(val) => onChange({ ...state, driverDiameterMm: val })}
                  step={1}
                  min={5}
                  helperText="Driving pulley diameter"
                />
                <FieldInputWithToggle
                  label="Driven Pulley Diameter"
                  value={state.drivenDiameterMm ?? 40}
                  unit="mm"
                  onChangeValue={(val) => onChange({ ...state, drivenDiameterMm: val })}
                  step={1}
                  min={5}
                  helperText="Driven pulley diameter"
                />
              </div>
            )}

            {/* Sizing Mode Selector: Belt Teeth vs Outer Circumference vs Center Distance */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#E2E8F0] dark:border-[#2E3646]">
              <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD]">
                Belt Sizing Definition Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'teeth', label: 'Belt Teeth' },
                  { id: 'circumference', label: 'Outer Circ.' },
                  { id: 'center-distance', label: 'Center Dist.' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onChange({ ...state, sizingMode: mode.id as SizingMode })}
                    className={`px-2 py-1.5 text-[11px] font-semibold rounded-none border transition-all cursor-pointer ${
                      sizingMode === mode.id
                        ? 'bg-[#094AD8] text-white border-[#094AD8] shadow-2xs font-bold'
                        : 'bg-[#F8FAFC] dark:bg-[#16181D] text-[#64748B] dark:text-[#85A3E0] border-[#CBD5E1] dark:border-[#2E3646]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Sizing Input based on sizingMode */}
            {sizingMode === 'teeth' && beltType === 'toothed' && (
              <div className="flex flex-col gap-2">
                <FieldInputWithToggle
                  label="Belt Size (Tooth Count)"
                  value={state.beltTeeth ?? 70}
                  unit="teeth"
                  onChangeValue={(val) =>
                    onChange({ ...state, beltTeeth: Math.max(1, Math.round(val)) })
                  }
                  step={1}
                  min={1}
                  max={500}
                  helperText={`Belt pitch length: ${results.beltPitchLengthMm.toFixed(1)} mm`}
                />
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0] uppercase tracking-wider">
                    Quick Adjust:
                  </span>
                  {[-5, -1, 1, 5].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => {
                        const current = state.beltTeeth ?? 70;
                        onChange({ ...state, beltTeeth: Math.max(1, current + delta) });
                      }}
                      className="px-2.5 py-1 text-xs font-mono font-bold border border-[#CBD5E1] dark:border-[#2E3646] bg-[#F8FAFC] dark:bg-[#16181D] hover:bg-[#E2E8F0] dark:hover:bg-[#2A303C] text-[#0F172A] dark:text-[#CEDDFD] transition-colors cursor-pointer"
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizingMode === 'circumference' && (
              <FieldInputWithToggle
                label="Belt Outer Circumference"
                value={state.beltOuterCircumferenceMm ?? 140}
                unit="mm"
                onChangeValue={(val) => onChange({ ...state, beltOuterCircumferenceMm: val })}
                step={5}
                min={20}
                helperText="Total outer belt loop length"
              />
            )}

            {sizingMode === 'center-distance' && (
              <FieldInputWithToggle
                label="Desired Center-to-Center Distance"
                value={state.desiredCenterDistance ?? 100}
                unit={state.desiredCenterDistanceUnit || 'mm'}
                units={['mm', 'in']}
                onChangeValue={(val) => onChange({ ...state, desiredCenterDistance: val })}
                onChangeValueAndUnit={(val, unit: LengthUnit) =>
                  onChange({ ...state, desiredCenterDistance: val, desiredCenterDistanceUnit: unit })
                }
                step={1}
                min={10}
                helperText="Target shaft separation distance"
              />
            )}

            {/* Quick Pitch Diameters Card */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] dark:bg-[#16181D] rounded-none border border-[#E2E8F0] dark:border-[#2E3646]">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Driver Diameter (PD₁)
                </span>
                <div className="text-base font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-0.5">
                  {results.smallPitchDiameterMm.toFixed(1)}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">mm</span>
                </div>
                <div className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  {(results.smallPitchDiameterMm / 25.4).toFixed(3)} in
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#85A3E0]">
                  Driven Diameter (PD₂)
                </span>
                <div className="text-base font-bold font-mono text-[#0F172A] dark:text-[#CEDDFD] tabular-nums mt-0.5">
                  {results.largePitchDiameterMm.toFixed(1)}{' '}
                  <span className="text-xs text-[#64748B] dark:text-[#85A3E0]">mm</span>
                </div>
                <div className="text-[10px] font-mono text-[#64748B] dark:text-[#85A3E0]/70">
                  {(results.largePitchDiameterMm / 25.4).toFixed(3)} in
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Computed Geometry & Diagram HUD */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs rounded-none p-5 flex flex-col gap-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3646]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#CEDDFD]">
                  Calculated Center Distance & Geometry
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#094AD8]">
                {results.beltTeeth}T Belt
              </span>
            </div>

            {/* Primary KPI: Exact Center Distance */}
            <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-4 flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider font-mono text-[#64748B] dark:text-[#85A3E0]">
                Calculated Center-to-Center Distance
              </span>
              {results.isTooShort ? (
                <div className="text-amber-600 dark:text-amber-400 font-bold font-mono text-base mt-1">
                  Belt Too Short ({results.beltTeeth}T &lt; Minimum {results.minBeltTeeth}T)
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold font-mono text-[#094AD8] dark:text-white tabular-nums">
                    {results.actualCenterDistanceMm.toFixed(2)}
                  </span>
                  <span className="text-lg font-mono font-bold text-[#0F172A] dark:text-[#094AD8]">mm</span>
                  <span className="text-base font-mono text-[#64748B] dark:text-[#85A3E0] ml-3">
                    ({results.actualCenterDistanceIn.toFixed(3)} in)
                  </span>
                </div>
              )}
              <p className="text-[11px] text-[#64748B] dark:text-[#85A3E0]/80 mt-1 font-mono">
                {results.isTooShort ? (
                  <span className="text-amber-600 dark:text-amber-400">
                    Belt cannot physically span these pulleys without overlapping. Increase belt size to at least {results.minBeltTeeth} teeth.
                  </span>
                ) : (
                  <>
                    Belt Pitch Length:{' '}
                    <strong className="text-[#0F172A] dark:text-white">
                      {results.beltPitchLengthMm.toFixed(1)} mm ({results.beltPitchLengthIn.toFixed(2)} in)
                    </strong>
                  </>
                )}
              </p>
            </div>

            {/* Visual Pulley & Belt Schematic SVG (Dynamically Resizing) */}
            <div className="bg-[#F8FAFC] dark:bg-[#16181D] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-3 flex flex-col items-center justify-center overflow-x-auto">
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[500px] h-auto">
                {/* Belt loop line */}
                <path
                  d={`M ${cx1} ${cy - r1} L ${cx2} ${cy - r2} A ${r2} ${r2} 0 0 1 ${cx2} ${cy + r2} L ${cx1} ${cy + r1} A ${r1} ${r1} 0 0 1 ${cx1} ${cy - r1} Z`}
                  fill="none"
                  stroke="#094AD8"
                  strokeWidth="3"
                  strokeDasharray="6 3"
                />

                {/* Pulley 1 (Left) */}
                <circle
                  cx={cx1}
                  cy={cy}
                  r={r1}
                  fill="currentColor"
                  className="text-[#E2E8F0] dark:text-[#2A303C]"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx={cx1} cy={cy} r="4" fill="#094AD8" />
                <text
                  x={cx1}
                  y={cy + 4}
                  fill="currentColor"
                  className="text-[#0F172A] dark:text-[#CEDDFD]"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {beltType === 'toothed' ? `${state.smallPulleyTeeth}T` : `${results.smallPitchDiameterMm.toFixed(0)}mm`}
                </text>

                {/* Pulley 2 (Right) */}
                <circle
                  cx={cx2}
                  cy={cy}
                  r={r2}
                  fill="currentColor"
                  className="text-[#E2E8F0] dark:text-[#2A303C]"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx={cx2} cy={cy} r="4" fill="#094AD8" />
                <text
                  x={cx2}
                  y={cy + 4}
                  fill="currentColor"
                  className="text-[#0F172A] dark:text-[#CEDDFD]"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {beltType === 'toothed' ? `${state.largePulleyTeeth}T` : `${results.largePitchDiameterMm.toFixed(0)}mm`}
                </text>

                {/* Dimension Line between centers */}
                <line
                  x1={cx1}
                  y1={cy + r2 + 20}
                  x2={cx2}
                  y2={cy + r2 + 20}
                  stroke="currentColor"
                  className="text-[#64748B] dark:text-[#85A3E0]"
                  strokeWidth="1.5"
                />
                <text
                  x={(cx1 + cx2) / 2}
                  y={cy + r2 + 35}
                  fill="currentColor"
                  className={results.isTooShort ? "text-amber-600 dark:text-amber-400" : "text-[#0F172A] dark:text-[#CEDDFD]"}
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {results.isTooShort
                    ? `Belt Too Short (Min: ${results.minBeltTeeth}T)`
                    : `C = ${results.actualCenterDistanceMm.toFixed(1)} mm (${results.actualCenterDistanceIn.toFixed(2)} in)`}
                </text>
              </svg>
            </div>

            {/* Teeth In Mesh Safety Status */}
            {beltType === 'toothed' && (
              <div
                className={`p-3.5 rounded-none border flex items-center justify-between gap-3 ${
                  results.isMeshSafe
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-950 dark:text-amber-200'
                }`}
              >
                <div>
                  <div className="text-xs font-bold font-mono">
                    Teeth in Mesh on Small Pulley: {results.teethInMesh.toFixed(1)} Teeth
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#85A3E0] mt-0.5">
                    {results.isMeshSafe
                      ? 'Safe engagement: 6 or more teeth engaged to prevent ratcheting under impact loads.'
                      : 'Ratcheting caution: Less than 6 teeth in mesh. Consider larger driver pulley or idler.'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SPARC v1.7 48V Warning Box at the bottom */}
      <SparcVoltageWarningBox packVoltage={packVoltage} />
    </div>
  );
};
