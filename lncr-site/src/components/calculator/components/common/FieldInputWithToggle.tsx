/**
 * Late Night Combat Robotics Calculator Suite
 * FieldInputWithToggle: High-precision numeric input with attached inline unit switcher.
 * Automatically converts entered values when switching between units.
 * Dual-theme (light and dark) support.
 */

import React from 'react';
import type { LengthUnit, MassUnit, SpeedUnit, EnergyUnit, MoiUnit } from '../../types';
import {
  mmToUnit,
  lengthToMm,
  kgToUnit,
  massToKg,
  moiToKgM2,
  kgM2ToUnit,
  speedToMs,
  msToUnit,
} from '../../utils/conversions';

type AnyUnit = LengthUnit | MassUnit | SpeedUnit | EnergyUnit | MoiUnit | string;

interface FieldInputWithToggleProps {
  label: string;
  value: number;
  unit?: AnyUnit;
  units?: AnyUnit[];
  onChangeValue: (newVal: number) => void;
  onChangeUnit?: (newUnit: any, convertedValue?: number) => void;
  onChangeValueAndUnit?: (newVal: number, newUnit: any) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  helperText?: string;
  autoConvertOnUnitChange?: boolean;
}

export const FieldInputWithToggle: React.FC<FieldInputWithToggleProps> = ({
  label,
  value,
  unit = '',
  units,
  onChangeValue,
  onChangeUnit,
  onChangeValueAndUnit,
  step = 1,
  min = 0,
  max,
  placeholder,
  helperText,
  autoConvertOnUnitChange = true,
}) => {
  // Local string representation to allow intermediate typing (e.g. "0.", ".", "", intermediate backspaces)
  const [textValue, setTextValue] = React.useState<string>(
    isNaN(value) ? '' : value.toString()
  );
  const [isFocused, setIsFocused] = React.useState<boolean>(false);

  // Sync external value changes when user is NOT actively typing
  React.useEffect(() => {
    if (!isFocused) {
      setTextValue(isNaN(value) ? '' : value.toString());
    } else {
      // While typing, only sync if the external value changed significantly from our parsed text
      if (textValue !== '' && textValue !== '-' && textValue !== '.' && textValue !== '-.') {
        const parsed = parseFloat(textValue);
        if (!isNaN(parsed) && !isNaN(value) && Math.abs(parsed - value) > 1e-9) {
          setTextValue(value.toString());
        }
      }
    }
  }, [value, isFocused]);

  const handleUnitToggle = (targetUnit: AnyUnit) => {
    if (targetUnit === unit) return;

    let convertedVal = value;

    if (autoConvertOnUnitChange && !isNaN(value) && value !== 0) {
      if ((unit === 'mm' || unit === 'in') && (targetUnit === 'mm' || targetUnit === 'in')) {
        const inMm = lengthToMm(value, unit as LengthUnit);
        const converted = mmToUnit(inMm, targetUnit as LengthUnit);
        // Round to clean precision: 3 decimals for inches, 2 for mm
        const precision = targetUnit === 'in' ? 3 : 2;
        convertedVal = Number(converted.toFixed(precision));
      } else if (
        ['kg', 'lbs', 'g', 'oz'].includes(unit) &&
        ['kg', 'lbs', 'g', 'oz'].includes(targetUnit)
      ) {
        const inKg = massToKg(value, unit as MassUnit);
        const converted = kgToUnit(inKg, targetUnit as MassUnit);
        let precision = 3;
        if (targetUnit === 'g') precision = 1;
        else if (targetUnit === 'kg') precision = 4;
        else if (targetUnit === 'lbs') precision = 3;
        else if (targetUnit === 'oz') precision = 2;
        convertedVal = Number(converted.toFixed(precision));
      } else if (
        ['kg*m^2', 'g*cm^2', 'lb*in^2', 'oz*in^2'].includes(unit) &&
        ['kg*m^2', 'g*cm^2', 'lb*in^2', 'oz*in^2'].includes(targetUnit)
      ) {
        const inKgM2 = moiToKgM2(value, unit as MoiUnit);
        const converted = kgM2ToUnit(inKgM2, targetUnit as MoiUnit);
        let precision = 5;
        if (targetUnit === 'g*cm^2') precision = 1;
        else if (targetUnit === 'oz*in^2') precision = 2;
        else if (targetUnit === 'lb*in^2') precision = 3;
        else if (targetUnit === 'kg*m^2') precision = 6;
        convertedVal = Number(converted.toFixed(precision));
      } else if (
        ['mΩ', 'Ω'].includes(unit) &&
        ['mΩ', 'Ω'].includes(targetUnit)
      ) {
        convertedVal = targetUnit === 'mΩ' ? value * 1000 : value / 1000;
        const precision = targetUnit === 'mΩ' ? 1 : 4;
        convertedVal = Number(convertedVal.toFixed(precision));
      } else if (
        ['mΩ/cell', 'Ω/cell'].includes(unit) &&
        ['mΩ/cell', 'Ω/cell'].includes(targetUnit)
      ) {
        convertedVal = targetUnit === 'mΩ/cell' ? value * 1000 : value / 1000;
        const precision = targetUnit === 'mΩ/cell' ? 1 : 4;
        convertedVal = Number(convertedVal.toFixed(precision));
      } else if (
        ['m/s', 'mph', 'ft/s', 'km/h'].includes(unit) &&
        ['m/s', 'mph', 'ft/s', 'km/h'].includes(targetUnit)
      ) {
        const inMs = speedToMs(value, unit as SpeedUnit);
        const converted = msToUnit(inMs, targetUnit as SpeedUnit);
        const precision = targetUnit === 'm/s' ? 2 : 2;
        convertedVal = Number(converted.toFixed(precision));
      }
    }

    setTextValue(convertedVal.toString());

    if (onChangeValueAndUnit) {
      onChangeValueAndUnit(convertedVal, targetUnit);
    } else {
      if (onChangeUnit) {
        onChangeUnit(targetUnit, convertedVal);
      }
      if (onChangeValue && convertedVal !== value) {
        onChangeValue(convertedVal);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty string or standalone signs / dots for intermediate typing without snapping back to 0
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
      setTextValue(raw);
      onChangeValue(0);
      return;
    }

    // Allow valid decimal digits and intermediate decimal points (e.g. "0.", "12.34")
    const regex = min !== undefined && min >= 0 ? /^\d*\.?\d*$/ : /^-?\d*\.?\d*$/;
    if (regex.test(raw)) {
      setTextValue(raw);
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        onChangeValue(parsed);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (textValue === '' || textValue === '-' || textValue === '.' || textValue === '-.') {
      setTextValue('0');
      onChangeValue(0);
    } else {
      const parsed = parseFloat(textValue);
      if (!isNaN(parsed)) {
        let finalVal = parsed;
        if (min !== undefined && finalVal < min) finalVal = min;
        if (max !== undefined && finalVal > max) finalVal = max;
        setTextValue(finalVal.toString());
        onChangeValue(finalVal);
      } else {
        setTextValue(value.toString());
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseFloat(textValue) || 0;
      const delta = e.key === 'ArrowUp' ? (step || 1) : -(step || 1);
      let next = current + delta;
      const stepStr = (step || 1).toString();
      const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
      next = Number(next.toFixed(Math.max(decimals, 2)));
      if (min !== undefined && next < min) next = min;
      if (max !== undefined && next > max) next = max;
      setTextValue(next.toString());
      onChangeValue(next);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-0.5">
        <label className="text-xs font-semibold text-[#1E293B] dark:text-[#CEDDFD] tracking-wide">
          {label}
        </label>
        {helperText && (
          <span className="text-[11px] text-[#64748B] dark:text-[#85A3E0] leading-snug break-words">
            {helperText}
          </span>
        )}
      </div>

      <div className="relative flex items-center rounded-none bg-white dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] shadow-2xs focus-within:border-[#094AD8] focus-within:ring-2 focus-within:ring-[#094AD8]/20 transition-all">
        <input
          type="text"
          inputMode="decimal"
          value={textValue}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck="false"
          className="min-w-0 w-full bg-transparent px-3 py-2 text-sm text-[#0F172A] dark:text-[#CEDDFD] font-mono tabular-nums outline-none placeholder-[#94A3B8] dark:placeholder-[#424957]"
        />

        {units && units.length > 1 ? (
          <div className="flex items-center gap-0.5 pr-1.5 shrink-0">
            {units.map((u) => {
              const isActive = u === unit;
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUnitToggle(u)}
                  className={`h-7 min-w-[28px] px-2 inline-flex items-center justify-center text-[11px] font-mono font-semibold rounded-none transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#094AD8] text-white shadow-2xs'
                      : 'bg-[#F1F5F9] dark:bg-[#1F232B] text-[#475569] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#2A303C]'
                  }`}
                >
                  {u}
                </button>
              );
            })}
          </div>
        ) : unit ? (
          <span className="px-3 py-1 text-xs font-mono text-[#64748B] dark:text-[#85A3E0] shrink-0">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
};
