/**
 * Late Night Combat Robotics Calculator Suite
 * Ruleset Disclaimer & Compliance Box: Anchored at the bottom of calculator pages.
 * Handles SPARC 48V compliance limits and high current / electrical safety notices.
 * Dual-theme (light and dark) support.
 */

import React from 'react';
import { SPARC_MAX_UNAPPROVED_VOLTAGE } from '../../utils/constants';

interface SparcVoltageWarningBoxProps {
  packVoltage: number;
  inrushCurrentAmps?: number;
  warningNote?: string;
}

export const SparcVoltageWarningBox: React.FC<SparcVoltageWarningBoxProps> = ({
  packVoltage,
  inrushCurrentAmps,
  warningNote,
}) => {
  const isOver48V = packVoltage > SPARC_MAX_UNAPPROVED_VOLTAGE;
  const isHighCurrent = inrushCurrentAmps !== undefined && inrushCurrentAmps > 200;
  const hasWarning = isOver48V || isHighCurrent || Boolean(warningNote);

  return (
    <div
      className={`rounded-none border p-4 transition-colors shadow-2xs ${
        hasWarning
          ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 text-amber-950 dark:text-amber-200'
          : 'bg-white dark:bg-[#1F232B] border-[#E2E8F0] dark:border-[#2E3646] text-[#0F172A] dark:text-[#CEDDFD]'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs leading-relaxed">
        <div className="flex items-center gap-2 flex-wrap">
          {isOver48V && (
            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold shrink-0">
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-200/80 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400 dark:border-amber-500/40">
                SPARC Rule 4.1
              </span>
              <span>Voltage ({packVoltage.toFixed(1)}V &gt; 48V requires EO approval) ·</span>
            </div>
          )}

          {isHighCurrent && !isOver48V && (
            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold shrink-0">
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-200/80 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400 dark:border-amber-500/40">
                High Inrush
              </span>
              <span>Peak inrush ({inrushCurrentAmps.toFixed(0)}A) may stress ESC &amp; connectors ·</span>
            </div>
          )}

          {warningNote && (
            <span className="text-amber-800 dark:text-amber-300 font-medium">
              {warningNote} ·
            </span>
          )}

          <span className="text-[#475569] dark:text-[#85A3E0]">
            Voltage and Tip Speed limits are pulled from{' '}
            <a
              href="https://sparc.tools/SPARC_Robot_Construction_Specifications_v1.7.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#094AD8] dark:text-[#60A5FA] font-semibold hover:underline"
            >
              SPARC V1.7 Construction Ruleset
            </a>{' '}
            and from{' '}
            <a
              href="https://wiki.nhrl.io/wiki/index.php?title=NHRL_Open_Rules_-_2026#Bot_Design_Rules"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#094AD8] dark:text-[#60A5FA] font-semibold hover:underline"
            >
              NHRL Bot Design Rules
            </a>
            .
          </span>
        </div>
      </div>
    </div>
  );
};
