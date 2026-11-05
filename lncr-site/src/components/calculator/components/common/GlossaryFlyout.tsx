/**
 * Late Night Combat Robotics Calculator Suite
 * Engineering Contractions Glossary Pane
 * Clean, single-page reference list containing only engineering contractions and expansions.
 * Dual-theme (light and dark) support.
 */

import React, { useEffect } from 'react';

interface ContractionEntry {
  term: string;
  expansion: string;
}

const CONTRACTIONS: ContractionEntry[] = [
  { term: 'LiPo', expansion: 'Lithium Ion Polymer Battery' },
  { term: 'LiHV', expansion: 'High Voltage Lithium Polymer Battery' },
  { term: 'NiMH', expansion: 'Nickel-Metal Hydride Battery' },
  { term: 'Kv', expansion: 'Motor Velocity Constant (RPM/V)' },
  { term: 'Kt', expansion: 'Motor Torque Constant (N·m/A)' },
  { term: 'KE', expansion: 'Kinetic Energy' },
  { term: 'MOI', expansion: 'Mass Moment of Inertia' },
  { term: 'RPM', expansion: 'Revolutions Per Minute' },
  { term: 'ESC', expansion: 'Electronic Speed Controller' },
  { term: 'BLDC', expansion: 'Brushless Direct Current Motor' },
  { term: 'BEC', expansion: 'Battery Eliminator Circuit' },
  { term: 'SPARC', expansion: 'Standardized Procedures for the Advancement of Robotic Combat' },
  { term: 'NHRL', expansion: 'National Havoc Robot League' },
  { term: 'EO', expansion: 'Event Organizer' },
  { term: 'S', expansion: 'Series Cell Count' },
  { term: 'mAh', expansion: 'Milliampere-Hour' },
  { term: 'Ah', expansion: 'Ampere-Hour' },
  { term: 'Wh', expansion: 'Watt-Hour' },
  { term: 'C-Rating', expansion: 'Battery Discharge Multiplier' },
  { term: 'GT2 / GT3', expansion: 'Gates Tooth Profile (2mm / 3mm Pitch)' },
  { term: 'HTD', expansion: 'High Torque Drive (Timing Belt)' },
  { term: 'z1 / z2', expansion: 'Drive / Driven Pulley Tooth Count' },
  { term: 'mph', expansion: 'Miles Per Hour' },
  { term: 'm/s', expansion: 'Meters Per Second' },
  { term: 'ft/s', expansion: 'Feet Per Second' },
  { term: 'N·m', expansion: 'Newton-Meter' },
  { term: 'oz-in', expansion: 'Ounce-Inch' },
  { term: 'Rad/s', expansion: 'Radians Per Second' },
];

interface GlossaryFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlossaryFlyout: React.FC<GlossaryFlyoutProps> = ({ isOpen, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Single-Page Modal Container */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#16181D] text-[#0F172A] dark:text-[#E2E4E9] rounded-none shadow-2xl border border-[#CBD5E1] dark:border-[#2D333F] z-10 flex flex-col overflow-hidden max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#2D333F] flex items-center justify-between bg-[#F8FAFC] dark:bg-[#1C2028]">
          <h2 className="text-sm font-bold tracking-tight text-[#0F172A] dark:text-white">
            Engineering Contractions
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs font-semibold rounded-none border border-[#CBD5E1] dark:border-[#2D333F] text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-white hover:bg-[#E2E8F0] dark:hover:bg-[#2D333F] transition-colors cursor-pointer"
            aria-label="Close glossary"
          >
            Close
          </button>
        </div>

        {/* All On One Page: 2-Column Grid of Single-Line Contractions */}
        <div className="p-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
            {CONTRACTIONS.map((c) => (
              <div
                key={c.term}
                className="flex items-baseline gap-2 py-1 border-b border-[#F1F5F9] dark:border-[#242A36]"
              >
                <span className="font-mono font-bold text-[#094AD8] dark:text-[#60A5FA] shrink-0 min-w-[70px]">
                  {c.term}
                </span>
                <span className="text-[#94A3B8] dark:text-[#64748B] select-none">–</span>
                <span className="text-[#334155] dark:text-[#CBD5E1] break-words">
                  {c.expansion}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
