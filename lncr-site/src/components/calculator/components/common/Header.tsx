/**
 * Late Night Combat Robotics Calculator Suite
 * Calculator Toolbar & Subsystem Navigation Component
 * Styled strictly in-line with the Late Night Combat Robotics Cosmos Theme.
 */

import React from 'react';
import type { ToolType, ToolCategory, WeightClassId } from '../../types';
import { WEIGHT_CLASSES } from '../../utils/constants';

interface HeaderProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onShareLink: () => void;
  onExportCsv: () => void;
  onResetDefaults?: () => void;
  weightClass: WeightClassId;
  onChangeWeightClass: (wc: WeightClassId) => void;
  onOpenGlossary?: () => void;
  extendedPreset?: boolean;
  onToggleExtendedPreset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTool,
  onSelectTool,
  onShareLink,
  onExportCsv,
  onResetDefaults,
  weightClass,
  onChangeWeightClass,
  onOpenGlossary,
  extendedPreset = false,
  onToggleExtendedPreset,
}) => {
  const isMechanical = activeTool === 'center-distance';
  const activeCategory: ToolCategory = isMechanical ? 'mechanical' : 'electronics';

  const electronicsTools: { id: ToolType; label: string }[] = [
    { id: 'drivetrain', label: 'Drivetrain' },
    { id: 'weapon', label: 'Weapon KE & Tip Speed' },
    { id: 'weapon-whatif', label: 'Weapon What-If' },
    { id: 'spinup', label: 'Spin-Up & Electronics' },
    { id: 'capacitance', label: 'Capacitance Sizing' },
    { id: 'battery', label: 'Battery Runtime' },
  ];

  const mechanicalTools: { id: ToolType; label: string }[] = [
    { id: 'center-distance', label: 'Center Distance (Belts & Chains)' },
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
    <div className="calc-toolbar-container">
      {/* Upper Control Bar: Weight Class, Category & Universal Actions */}
      <div className="calc-toolbar-top">
        {/* Left: Combat Weight Class Selector */}
        <div className="calc-group-wrapper">
          <span className="calc-group-label">Class:</span>
          <div className="calc-segmented-group" role="group" aria-label="Combat Weight Class">
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
                  className={`calc-segmented-btn ${isActive ? 'is-active' : ''}`}
                  title={`${wc.description} (Recommended: ${wc.recommendedS[0]}S–${wc.recommendedS[1]}S)`}
                >
                  {shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Electronics vs Mechanical Category Switcher */}
        <div className="calc-group-wrapper">
          <span className="calc-group-label">Subsystem:</span>
          <div className="calc-segmented-group" role="group" aria-label="Tool Category">
            <button
              type="button"
              onClick={() => handleCategorySwitch('electronics')}
              className={`calc-segmented-btn ${activeCategory === 'electronics' ? 'is-active' : ''}`}
            >
              Electronics
            </button>
            <button
              type="button"
              onClick={() => handleCategorySwitch('mechanical')}
              className={`calc-segmented-btn ${activeCategory === 'mechanical' ? 'is-active' : ''}`}
            >
              Mechanical
            </button>
          </div>
        </div>

        {/* Right: Actions (Reset, Share, Export CSV, Glossary, Extended Motors) */}
        <div className="calc-actions-group">
          {onResetDefaults && (
            <button
              type="button"
              onClick={onResetDefaults}
              title="Reset all inputs to factory defaults"
              className="calc-btn calc-btn--subtle"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={onShareLink}
            title="Copy shareable link with current parameters"
            className="calc-btn calc-btn--subtle"
          >
            Share URL
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            title="Download CSV performance report"
            className="calc-btn calc-btn--primary"
          >
            Export CSV
          </button>

          {onOpenGlossary && (
            <button
              type="button"
              onClick={onOpenGlossary}
              title="Open engineering contractions glossary"
              className="calc-btn calc-btn--subtle"
            >
              Glossary
            </button>
          )}

          {onToggleExtendedPreset && (
            <button
              type="button"
              onClick={onToggleExtendedPreset}
              className={`calc-btn ${extendedPreset ? 'calc-btn--active' : 'calc-btn--subtle'}`}
              title="Toggle extended third-party motor presets"
            >
              Extended Presets: {extendedPreset ? 'ON' : 'OFF'}
            </button>
          )}
        </div>
      </div>

      {/* Lower Sub-Tabs Bar: Active Subsystem Tools */}
      <div className="calc-subtabs-row" role="tablist">
        {activeCategory === 'electronics' ? (
          electronicsTools.map((tab) => {
            const isActive = activeTool === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => onSelectTool(tab.id)}
                className={`calc-subtab-btn ${isActive ? 'is-active' : ''}`}
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
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => onSelectTool(tab.id)}
                className={`calc-subtab-btn ${isActive ? 'is-active' : ''}`}
              >
                {tab.label}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
