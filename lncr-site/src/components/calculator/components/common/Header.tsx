/**
 * Late Night Combat Robotics Calculator Suite
 * Header Component with Combat Weight Class selection slide, Electronics / Mechanical panes, and Universal Actions
 * All controls and actions sit strictly on the same row.
 * Fully supports persistent Light and Dark modes. No icons.
 */

import React, { useState, useEffect } from 'react';
import { ToolType, ToolCategory, WeightClassId } from '../../types';
import { WEIGHT_CLASSES } from '../../utils/constants';
import { audioPlayer } from '../../fruity/audioEngine';

interface HeaderProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onShareLink: () => void;
  onExportCsv: () => void;
  onResetDefaults?: () => void;
  weightClass: WeightClassId;
  onChangeWeightClass: (wc: WeightClassId) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTool,
  onSelectTool,
  onShareLink,
  onExportCsv,
  onResetDefaults,
  weightClass,
  onChangeWeightClass,
  theme,
  onToggleTheme,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(() => audioPlayer.getIsPlaying());

  useEffect(() => {
    return audioPlayer.onPlayStateChange((playing) => {
      setIsPlaying(playing);
    });
  }, []);

  const toggleMusic = () => {
    audioPlayer.togglePlayPause();
  };

  const isMechanical = activeTool === 'center-distance';
  const activeCategory: ToolCategory = isMechanical ? 'mechanical' : 'electronics';

  const electronicsTools: { id: ToolType; label: string }[] = [
    { id: 'drivetrain', label: 'Drivetrain' },
    { id: 'weapon', label: 'Weapon KE & Tip Speed' },
    { id: 'spinup', label: 'Spin-Up & Electronics' },
    { id: 'capacitance', label: 'Recommended Capacitance' },
    { id: 'battery', label: 'Battery Runtime' },
  ];

  const mechanicalTools: { id: ToolType; label: string }[] = [
    { id: 'center-distance', label: 'Center Distance' },
  ];

  const handleCategorySwitch = (category: ToolCategory) => {
    if (category === 'electronics') {
      if (activeTool === 'center-distance') {
        onSelectTool('drivetrain');
      }
    } else {
      onSelectTool('center-distance');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#16181D]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#2E3646] shadow-2xs px-3 sm:px-4 lg:px-8 py-2 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Top Row: Brand on Left, Actions (Reset, Share, Export CSV, Dark/Light) in Top Right Corner on the same line as LNCR */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="/"
              className="flex items-center gap-2 group text-decoration-none"
            >
              <img
                src="/assets/aistudio/www.latenightcombat.com-510x510_617ea2b1.png"
                alt="Late Night Combat Robotics Logo"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0 rounded-none group-hover:opacity-90 transition-opacity"
              />
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-[#0F172A] dark:text-[#CEDDFD] whitespace-nowrap leading-tight group-hover:text-[#094AD8] dark:group-hover:text-white transition-colors">
                <span className="hidden sm:inline">Late Night Combat Robotics</span>
                <span className="sm:hidden">LNCR</span>
              </span>
            </a>
          </div>

          {/* Top Right Corner: Universal Actions (Play/Pause, Reset, Share, Export CSV, Theme Toggle) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Music Play/Pause Button */}
            <button
              type="button"
              onClick={toggleMusic}
              title={isPlaying ? 'Pause music' : 'Play music'}
              aria-label={isPlaying ? 'Pause music' : 'Play music'}
              className="px-2 py-1 text-xs font-semibold rounded-none bg-white dark:bg-[#1F232B] text-[#0F172A] dark:text-[#CEDDFD] border border-[#CBD5E1] dark:border-[#2E3646] hover:border-[#094AD8] hover:text-[#094AD8] dark:hover:text-white shadow-2xs transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
            >
              <span className="text-[10px] text-[#094AD8] dark:text-[#5fe0ff] leading-none">
                {isPlaying ? '❚❚' : '▶'}
              </span>
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            {onResetDefaults && (
              <button
                type="button"
                onClick={onResetDefaults}
                title="Reset all tool inputs and power settings to factory defaults"
                className="px-2 py-1 text-xs font-semibold rounded-none bg-white dark:bg-[#1F232B] text-[#64748B] dark:text-[#85A3E0] border border-[#CBD5E1] dark:border-[#2E3646] hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={onShareLink}
              title="Copy shareable link with current parameters"
              className="px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-none bg-white dark:bg-[#1F232B] text-[#0F172A] dark:text-[#CEDDFD] border border-[#CBD5E1] dark:border-[#2E3646] hover:border-[#094AD8] hover:text-[#094AD8] dark:hover:text-white shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
              Share
            </button>

            <button
              type="button"
              onClick={onExportCsv}
              title="Download CSV performance report"
              className="px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-none bg-[#094AD8] hover:bg-[#1B5DF5] text-white transition-colors cursor-pointer whitespace-nowrap shadow-2xs font-bold"
            >
              Export CSV
            </button>

            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-none bg-white dark:bg-[#1F232B] text-[#0F172A] dark:text-[#CEDDFD] border border-[#CBD5E1] dark:border-[#2E3646] hover:border-[#094AD8] hover:text-[#094AD8] dark:hover:text-white shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Weight Class Selection Slide & Primary Category (Electronics / Mechanical) */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-[#E2E8F0] dark:border-[#2E3646]">
          {/* Combat Weight Class Selection Slide */}
          <div className="flex items-center gap-0.5 p-0.5 bg-[#F1F5F9] dark:bg-[#16181D] rounded-none border border-[#CBD5E1] dark:border-[#2E3646]">
            {WEIGHT_CLASSES.map((wc) => {
              const isActive = weightClass === wc.id;
              const shortName =
                wc.id === 'ant'
                  ? 'Ant (1 lb)'
                  : wc.id === 'beetle'
                  ? 'Beetle (3 lb)'
                  : 'Big Bots (30 lb)';
              return (
                <button
                  key={wc.id}
                  type="button"
                  onClick={() => onChangeWeightClass(wc.id)}
                  className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-none transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-[#094AD8] text-[#094AD8] dark:text-white shadow-2xs font-bold'
                      : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-white/50 dark:hover:bg-[#1F232B]'
                  }`}
                  title={`${wc.description} Recommended: ${wc.recommendedS[0]}S–${wc.recommendedS[1]}S`}
                >
                  <span className="hidden xl:inline">{wc.name}</span>
                  <span className="xl:hidden">{shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Primary Category Panes (Electronics vs Mechanical) */}
          <div className="flex items-center gap-0.5 p-0.5 bg-[#F1F5F9] dark:bg-[#16181D] rounded-none border border-[#CBD5E1] dark:border-[#2E3646]">
            <button
              type="button"
              onClick={() => handleCategorySwitch('electronics')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-none transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'electronics'
                  ? 'bg-white dark:bg-[#094AD8] text-[#094AD8] dark:text-white shadow-2xs'
                  : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
              }`}
            >
              Electronics
            </button>
            <button
              type="button"
              onClick={() => handleCategorySwitch('mechanical')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-none transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'mechanical'
                  ? 'bg-white dark:bg-[#094AD8] text-[#094AD8] dark:text-white shadow-2xs'
                  : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD]'
              }`}
            >
              Mechanical
            </button>
          </div>
        </div>

        {/* Sub-Tabs Row for the Active Category */}
        <div className="flex items-center gap-1 overflow-x-auto pt-1 border-t border-[#E2E8F0] dark:border-[#2E3646]">
          {activeCategory === 'electronics' ? (
            electronicsTools.map((tab) => {
              const isActive = activeTool === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTool(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-none transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                      : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#F1F5F9] dark:hover:bg-[#262C38]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })
          ) : (
            mechanicalTools.map((tab) => {
              const isActive = activeTool === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTool(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-none transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#094AD8] text-white shadow-2xs font-bold'
                      : 'text-[#64748B] dark:text-[#85A3E0] hover:text-[#0F172A] dark:hover:text-[#CEDDFD] hover:bg-[#F1F5F9] dark:hover:bg-[#262C38]'
                  }`}
                >
                  {tab.label} (Timing Belts & Chains)
                </button>
              );
            })
          )}
        </div>
      </div>
    </header>
  );
};
