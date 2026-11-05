/**
 * Late Night Combat Robotics Calculator Suite - Preset Selection & Search Component
 * Features a direct search input field to filter presets in real-time,
 * keyboard navigation, and a scrollable flyout window with grouped options.
 * Fully supports light/dark themes and sharp styling (rounded-none).
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';

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
  placeholder?: string;
}

export const PresetSelect: React.FC<PresetSelectProps> = ({
  value,
  onChange,
  groups,
  ariaLabel = 'Preset Selection',
  placeholder = 'Search motor presets...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Flatten all options to find the active option display name
  const allOptions = useMemo(() => groups.flatMap((g) => g.options), [groups]);
  const activeOption = allOptions.find((o) => o.id === value);
  const displayName = activeOption ? activeOption.name : '';

  // Filter groups and options based on searchQuery
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    const words = q.split(/\s+/).filter(Boolean);

    return groups
      .map((group) => {
        const matchingOptions = group.options.filter((opt) => {
          const text = `${opt.name} ${opt.id}`.toLowerCase();
          return words.every((w) => text.includes(w));
        });
        return {
          ...group,
          options: matchingOptions,
        };
      })
      .filter((g) => g.options.length > 0);
  }, [groups, searchQuery]);

  const flatFilteredOptions = useMemo(
    () => filteredGroups.flatMap((g) => g.options),
    [filteredGroups]
  );

  // Close flyout on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsSearching(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (optId: string) => {
    onChange(optId);
    setIsOpen(false);
    setIsSearching(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setIsSearching(true);
    // Auto-select text on focus so user can immediately type over it or see matches
    inputRef.current?.select();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearching(true);
    if (!isOpen) setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setIsSearching(false);
      setSearchQuery('');
      setHighlightedIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
        return;
      }
      if (flatFilteredOptions.length > 0) {
        setHighlightedIndex((prev) =>
          prev < flatFilteredOptions.length - 1 ? prev + 1 : 0
        );
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(flatFilteredOptions.length - 1);
        return;
      }
      if (flatFilteredOptions.length > 0) {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : flatFilteredOptions.length - 1
        );
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen) {
        if (highlightedIndex >= 0 && flatFilteredOptions[highlightedIndex]) {
          handleSelect(flatFilteredOptions[highlightedIndex].id);
        } else if (flatFilteredOptions.length > 0) {
          handleSelect(flatFilteredOptions[0].id);
        }
      } else {
        setIsOpen(true);
      }
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>('[data-highlighted="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Display value in input field
  const inputValue = isSearching ? searchQuery : displayName;

  let globalOptionIdx = 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Searchable Input Field */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          placeholder={isSearching ? 'Type to search (e.g. Blitz, DartBox, Repeat, 2850)...' : placeholder}
          onFocus={handleInputFocus}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={() => {
            if (!isOpen) setIsOpen(true);
          }}
          className="w-full bg-[#F8FAFC] dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] rounded-none pl-3 pr-16 py-2 text-sm text-[#0F172A] dark:text-[#CEDDFD] font-mono outline-none focus:border-[#094AD8] focus:ring-2 focus:ring-[#094AD8]/20 shadow-2xs transition-all"
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          role="combobox"
        />

        <div className="absolute right-1.5 flex items-center gap-0.5">
          {isSearching && searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setHighlightedIndex(-1);
                inputRef.current?.focus();
              }}
              className="h-7 w-7 flex items-center justify-center text-xs text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#E2E8F0] dark:hover:bg-[#262C38] rounded-none font-mono cursor-pointer transition-colors"
              title="Clear search"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              if (isOpen) {
                setIsOpen(false);
                setIsSearching(false);
                setSearchQuery('');
              } else {
                setIsOpen(true);
                inputRef.current?.focus();
              }
            }}
            className="h-7 w-7 flex items-center justify-center text-[10px] text-[#64748B] dark:text-[#85A3E0] hover:bg-[#E2E8F0] dark:hover:bg-[#262C38] rounded-none font-mono cursor-pointer select-none transition-colors"
            title={isOpen ? 'Close presets list' : 'Open presets list'}
          >
            {isOpen ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Flyout Window - Max 10 selections high (~320px) with custom scroll */}
      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-[#16181D] border border-[#CBD5E1] dark:border-[#2E3646] shadow-lg rounded-none overflow-y-auto max-h-[320px]"
        >
          {filteredGroups.length === 0 ? (
            <div className="px-3 py-4 text-xs font-mono text-[#94A3B8] dark:text-[#85A3E0]/70 text-center">
              No motor presets match &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredGroups.map((group) => {
              if (group.options.length === 0) return null;
              return (
                <div key={group.label} className="border-b border-[#E2E8F0] dark:border-[#2E3646] last:border-b-0">
                  <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase font-mono text-[#64748B] dark:text-[#85A3E0] bg-[#F1F5F9] dark:bg-[#1F232B] sticky top-0 z-10 border-b border-[#E2E8F0] dark:border-[#2E3646]">
                    {group.label}
                  </div>
                  {group.options.map((opt) => {
                    const isSelected = opt.id === value;
                    const isHighlighted = globalOptionIdx === highlightedIndex;
                    const thisIdx = globalOptionIdx;
                    globalOptionIdx++;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        data-highlighted={isHighlighted}
                        onClick={() => handleSelect(opt.id)}
                        onMouseEnter={() => setHighlightedIndex(thisIdx)}
                        className={`w-full min-h-[32px] flex items-center text-left px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer truncate ${
                          isSelected
                            ? 'bg-[#094AD8] text-white font-bold'
                            : isHighlighted
                            ? 'bg-[#E2E8F0] dark:bg-[#262C38] text-[#094AD8] dark:text-[#60A5FA]'
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
            })
          )}
        </div>
      )}
    </div>
  );
};
