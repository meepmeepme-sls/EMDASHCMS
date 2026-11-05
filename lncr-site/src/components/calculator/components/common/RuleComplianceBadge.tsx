/**
 * Late Night Combat Robotics Calculator Suite
 * RuleComplianceBadge: Tip Speed Gauge (200 - 300 mph Range with 250 mph Guideline Line)
 * Dual-theme (light and dark) support. No icons.
 */

import React from 'react';

interface RuleComplianceBadgeProps {
  tipSpeedMph: number;
  tipSpeedMs: number;
}

export const RuleComplianceBadge: React.FC<RuleComplianceBadgeProps> = ({
  tipSpeedMph,
  tipSpeedMs,
}) => {
  const isOver = tipSpeedMph > 250;
  const isNear = tipSpeedMph >= 235 && !isOver;

  // Range 200 to 300 mph
  const minMph = 200;
  const maxMph = 300;
  const barPercentage = Math.max(
    0,
    Math.min(100, ((tipSpeedMph - minMph) / (maxMph - minMph)) * 100)
  );

  return (
    <div className="bg-white dark:bg-[#1F232B] border border-[#E2E8F0] dark:border-[#2E3646] rounded-none p-4 transition-all shadow-2xs text-[#0F172A] dark:text-[#CEDDFD]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#475569] dark:text-[#85A3E0]">
              Tip Speed
            </span>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#094AD8] dark:text-[#CEDDFD]">
              {tipSpeedMph.toFixed(1)}
            </span>
            <span className="text-xs text-[#64748B] dark:text-[#85A3E0] font-mono ml-1">mph</span>
            <div className="text-[11px] text-[#64748B] dark:text-[#85A3E0]/70 font-mono">
              ({tipSpeedMs.toFixed(1)} m/s)
            </div>
          </div>
        </div>

        {/* Visual Progress Gauge (200 to 300 mph with 250 mph Dashed Line) */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-mono text-[#64748B] dark:text-[#85A3E0]">
            <span>200 mph</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              250 mph guideline
            </span>
            <span>300 mph</span>
          </div>

          <div className="relative w-full h-3 bg-[#F1F5F9] dark:bg-[#16181D] rounded-none overflow-hidden border border-[#CBD5E1] dark:border-[#2E3646]">
            {/* Active tip speed fill */}
            <div
              className={`h-full transition-all duration-300 rounded-none ${
                isOver ? 'bg-amber-500' : isNear ? 'bg-amber-400' : 'bg-[#094AD8]'
              }`}
              style={{ width: `${barPercentage}%` }}
            />

            {/* Dashed line marking exactly 250 mph (50% position between 200 and 300) */}
            <div
              className="absolute top-0 bottom-0 left-1/2 w-0 border-r-2 border-dashed border-red-500 dark:border-red-400 pointer-events-none"
              title="250 mph Guideline Threshold"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
