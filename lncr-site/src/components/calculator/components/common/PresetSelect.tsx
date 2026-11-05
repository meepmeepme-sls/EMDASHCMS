/**
 * Late Night Combat Robotics Calculator Suite - Preset Selection Dropdown Component
 * Features a custom flyout window restricted to 10 selections high, requiring scrolling
 * for extended option lists. Fully supports light/dark themes and sharp styling (rounded-none).
 */

import React, { useState, useRef, useEffect } from 'react';

export interface PresetOption {
  id: string;
  name: string;
}

export interface PresetGroup {
  label: string;
  options: PresetOption[];
}

interface PresetSelectProps {
  value: string;
  onChange: (value: string) => void;
  groups: PresetGroup[];
  ariaLabel?: string;
}

export const PresetSelect: React.FC<PresetSelectProps> = ({
  value,
  onChange,
  groups,
  ariaLabel = 'Preset Selection',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Flatten all options to find the active option display name
  const allOptions = groups.flatMap((g) => g.options);
  const activeOption = allOptions.find((o) => o.id === value);
  const displayName = activeOption ? activeOption.name : 'Select Preset...';

  // Close flyout on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] rounded-none px-3 py-2 text-sm text-[#0F172A] dark:text-[#CEDDFD] font-mono outline-none focus:border-[#094AD8] shadow-2xs cursor-pointer flex items-center justify-between text-left"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <span className="truncate pr-2 font-mono">{displayName}</span>
        <span className="text-[10px] text-[#64748B] dark:text-[#85A3E0] shrink-0 font-mono select-none">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Flyout Window - Max 10 selections high (~320px) with custom scroll */}
      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] shadow-lg rounded-none overflow-y-auto max-h-[320px]"
        >
          {groups.map((group) => {
            if (group.options.length === 0) return null;
            return (
              <div key={group.label} className="border-b border-[#E2E8F0] dark:border-[#2E3646] last:border-b-0">
                <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase font-mono text-[#64748B] dark:text-[#85A3E0] bg-[#F1F5F9] dark:bg-[#1F232B] sticky top-0 z-10 border-b border-[#E2E8F0] dark:border-[#2E3646]">
                  {group.label}
                </div>
                {group.options.map((opt) => {
                  const isSelected = opt.id === value;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(opt.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer block truncate ${
                        isSelected
                          ? 'bg-[#094AD8] text-white font-bold'
                          : 'text-[#0F172A] dark:text-[#CEDDFD] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38]'
                      }`}
                      title={opt.name}
                    >
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
