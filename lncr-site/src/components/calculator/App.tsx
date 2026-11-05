/**
 * Late Night Combat Robotics Calculator Suite
 * Production-ready React application for latenightcombat.com
 * Supports Light mode default with persistent Dark mode toggle.
 * Adheres strictly to SPARC v1.7 specifications and NHRL weight classes (Ant, Beetle, Big Bot 12/30 lb)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ToolType,
  WeightClassId,
  BatteryChemistry,
  WeaponState,
  CenterDistanceState,
} from './types';
import { WEIGHT_CLASSES, getWeightClassDefaults, RECOMMENDED_CELL_COUNTS } from './utils/constants';
import { computeWeapon, calculatePackVoltage } from './utils/calculations';
import type { GlobalAppState } from './utils/urlState';
import {
  serializeStateToUrl,
  parseStateFromUrl,
} from './utils/urlState';
import { exportConfigurationToCsv } from './utils/csvExport';
import {
  saveSessionState,
  loadInitialAppState,
  clearSessionState,
  getSavedTheme,
  saveTheme,
} from './utils/storage';
import { Header } from './components/common/Header';
import { DrivetrainTool } from './components/tools/DrivetrainTool';
import { WeaponTool } from './components/tools/WeaponTool';
import { ElectronicsSpinUpTool } from './components/tools/ElectronicsSpinUpTool';
import { CenterDistanceTool } from './components/tools/CenterDistanceTool';
import { BatteryRuntimeTool } from './components/tools/BatteryRuntimeTool';
import { CapacitanceTool } from './components/tools/CapacitanceTool';
import { GlossaryFlyout } from './components/common/GlossaryFlyout';

const INITIAL_STATE: GlobalAppState = {
  theme: 'light',
  activeTool: 'drivetrain',
  weightClass: 'beetle',
  chemistry: 'lipo',
  voltageState: 'nominal',
  hasWeaponBattery: false,
  weaponChemistry: 'lipo',
  weaponCellCount: 4,
  useDirectVoltage: false,
  directVoltage: 14.8,
  useWeaponDirectVoltage: false,
  weaponDirectVoltage: 14.8,
  drivetrain: {
    motorPresetId: 'rr_pro_brushless_2006_4s',
    motorKv: 2500,
    manualRpmOverride: null,
    cellCount: 4,
    gearRatio: 27.0,
    externalInputTeeth: 1,
    externalOutputTeeth: 1,
    wheelDiameter: 50.8, // 2 inches
    wheelDiameterUnit: 'mm',
    efficiencyPercent: 85,
    speedUnit: 'ft/s',
  },
  weapon: {
    moiPresetId: 'custom',
    moi: 0.00088,
    moiKgM2: 0.00088,
    moiUnit: 'kg*m^2',
    effectiveDiameter: 5,
    effectiveDiameterUnit: 'in',
    motorPresetId: 'rr_2812_hub_1300',
    motorKv: 1300,
    manualRpmOverride: null,
    cellCount: 4,
    gearRatio: 1, // direct drive
    pulleyPresetId: 'custom',
    inputTeeth: 16,
    outputTeeth: 16,
  },
  spinup: {
    motorKv: 1300,
    cellCount: 4,
    gearRatio: 1,
    motorResistance: 0.035,
    batteryResistancePerCell: 0.008,
    escWiringResistance: 0.005,
    moi: 0.00088,
    moiKgM2: 0.00088,
    moiUnit: 'kg*m^2',
    useWeaponTabMoi: true,
    useWeaponTabMotorKv: true,
    useWeaponTabGearRatio: true,
    timeHorizonSec: 3.5,
  },
  capacitance: {
    wireLength: 150,
    wireLengthUnit: 'mm',
    peakCurrentAmps: 45,
    allowableRippleVolts: 1.0,
    safetyFactor: 3.0,
    cellCount: 4,
  },
  centerDistance: {
    pitchPresetId: 'gt2',
    customPitchMm: 2.0,
    smallPulleyTeeth: 16,
    largePulleyTeeth: 16,
    desiredCenterDistance: 65,
    desiredCenterDistanceUnit: 'mm',
    beltTeeth: 70,
  },
  batteryRuntime: {
    cellCount: 4,
    batteryCapacityMah: 850,
    driveMotorCount: 2,
    avgDriveCurrentAmps: 4.5,
    weaponMotorCount: 1,
    avgWeaponCurrentAmps: 18.0,
    auxCurrentAmps: 0.2,
    matchDurationSec: 180,
    reserveMarginPercent: 20,
  },
};

export default function App() {
  const [appState, setAppState] = useState<GlobalAppState>(() => {
    if (typeof window !== 'undefined') {
      return loadInitialAppState(window.location.search, INITIAL_STATE);
    }
    return INITIAL_STATE;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  // Persistent Light / Dark mode state (default: Light)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const urlTheme = p.get('theme') || p.get('th');
      if (urlTheme === 'dark' || urlTheme === 'light') return urlTheme;
      return getSavedTheme();
    }
    return 'light';
  });

  useEffect(() => {
    saveTheme(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      saveTheme(next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      setAppState((curr) => ({ ...curr, theme: next }));
      return next;
    });
  };

  // Sync state to URL query parameters and debounced localStorage session
  useEffect(() => {
    const query = serializeStateToUrl(appState);
    const newUrl = `${window.location.pathname}${query}`;
    window.history.replaceState(null, '', newUrl);

    const timer = setTimeout(() => {
      saveSessionState(appState);
    }, 250);
    return () => clearTimeout(timer);
  }, [appState]);

  // Handle weight class changes and load corresponding weight class defaults
  const handleWeightClassChange = (newWc: WeightClassId) => {
    const d = getWeightClassDefaults(newWc);
    const recCells = RECOMMENDED_CELL_COUNTS[newWc] || [3, 4, 5, 6];

    const newDriveCellCount = recCells.includes(appState.drivetrain.cellCount)
      ? appState.drivetrain.cellCount
      : (d.driveCellCount ?? recCells[0]);

    const newWeaponCellCount = recCells.includes(appState.weaponCellCount)
      ? appState.weaponCellCount
      : (d.weaponCellCount ?? recCells[0]);

    setAppState((prev) => ({
      ...prev,
      weightClass: newWc,
      weaponCellCount: newWeaponCellCount,
      drivetrain: {
        ...prev.drivetrain,
        motorPresetId: d.driveMotorPresetId,
        motorKv: d.driveKv,
        gearRatio: d.driveGearRatio,
        gearboxPresetId: d.driveGearboxPresetId,
        cellCount: newDriveCellCount,
      },
      weapon: {
        ...prev.weapon,
        motorPresetId: d.weaponMotorPresetId,
        motorKv: d.weaponKv,
        effectiveDiameter: d.effectiveDiameter,
        effectiveDiameterUnit: d.effectiveDiameterUnit,
        moiKgM2: d.moiKgM2,
        moi: d.moiKgM2,
        moiUnit: 'kg*m^2',
        cellCount: newWeaponCellCount,
      },
      spinup: {
        ...prev.spinup,
        motorKv: d.weaponKv,
        gearRatio: d.weaponGearRatio,
        moiKgM2: d.moiKgM2,
        moi: d.moiKgM2,
        moiUnit: 'kg*m^2',
        cellCount: newWeaponCellCount,
      },
      capacitance: {
        ...prev.capacitance,
        cellCount: newDriveCellCount,
      },
      batteryRuntime: {
        ...prev.batteryRuntime,
        cellCount: newDriveCellCount,
      },
    }));
  };

  // Copy shareable link
  const handleShareLink = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {
        setToastMessage('Link copied to clipboard with current parameters!');
        setTimeout(() => setToastMessage(null), 3000);
      },
      () => {
        setToastMessage('Could not copy link automatically.');
        setTimeout(() => setToastMessage(null), 2500);
      }
    );
  }, []);

  // Export CSV report
  const handleExportCsv = useCallback(() => {
    exportConfigurationToCsv(appState);
    setToastMessage('Configuration CSV exported successfully.');
    setTimeout(() => setToastMessage(null), 3000);
  }, [appState]);

  // Reset to baseline defaults
  const handleResetDefaults = useCallback(() => {
    clearSessionState();
    setAppState({ ...INITIAL_STATE, theme });
    saveTheme(theme);
    window.history.replaceState(null, '', window.location.pathname);
    setToastMessage('Configuration reset to baseline defaults.');
    setTimeout(() => setToastMessage(null), 3000);
  }, [theme]);

  // Effective weapon battery parameters
  const effectiveWeaponChemistry = appState.hasWeaponBattery
    ? appState.weaponChemistry
    : appState.chemistry;
  const effectiveWeaponCellCount = appState.hasWeaponBattery
    ? appState.weaponCellCount
    : appState.weapon.cellCount;

  const handleToggleHasWeaponBattery = (enabled: boolean) => {
    setAppState((prev) => ({
      ...prev,
      hasWeaponBattery: enabled,
      ...(enabled && !prev.hasWeaponBattery
        ? {
            weaponChemistry: prev.chemistry,
            weaponCellCount: prev.weapon.cellCount,
          }
        : {}),
    }));
  };

  const handleChangeMainChemistry = (chemistry: BatteryChemistry) => {
    setAppState((prev) => ({
      ...prev,
      chemistry,
      ...(!prev.hasWeaponBattery ? { weaponChemistry: chemistry } : {}),
    }));
  };

  const handleChangeWeaponChemistry = (weaponChemistry: BatteryChemistry) => {
    setAppState((prev) => ({
      ...prev,
      weaponChemistry,
    }));
  };

  const handleChangeMainCellCount = (cells: number) => {
    setAppState((prev) => ({
      ...prev,
      drivetrain: { ...prev.drivetrain, cellCount: cells },
      ...(!prev.hasWeaponBattery
        ? {
            weaponCellCount: cells,
            weapon: { ...prev.weapon, cellCount: cells },
            spinup: { ...prev.spinup, cellCount: cells },
            capacitance: { ...prev.capacitance, cellCount: cells },
            batteryRuntime: { ...prev.batteryRuntime, cellCount: cells },
          }
        : {}),
    }));
  };

  const handleChangeWeaponCellCount = (cells: number) => {
    setAppState((prev) => ({
      ...prev,
      weaponCellCount: cells,
      weapon: { ...prev.weapon, cellCount: cells },
      spinup: { ...prev.spinup, cellCount: cells },
    }));
  };

  const handleToggleUseDirectVoltage = (enabled: boolean) => {
    setAppState((prev) => ({
      ...prev,
      useDirectVoltage: enabled,
      directVoltage: prev.directVoltage ?? 14.8,
      ...(!prev.hasWeaponBattery
        ? {
            useWeaponDirectVoltage: enabled,
            weaponDirectVoltage: prev.directVoltage ?? 14.8,
          }
        : {}),
    }));
  };

  const handleChangeDirectVoltage = (voltage: number) => {
    setAppState((prev) => ({
      ...prev,
      directVoltage: voltage,
      ...(!prev.hasWeaponBattery
        ? {
            weaponDirectVoltage: voltage,
          }
        : {}),
    }));
  };

  const handleToggleUseWeaponDirectVoltage = (enabled: boolean) => {
    setAppState((prev) => ({
      ...prev,
      useWeaponDirectVoltage: enabled,
      weaponDirectVoltage: prev.weaponDirectVoltage ?? 14.8,
    }));
  };

  const handleChangeWeaponDirectVoltage = (voltage: number) => {
    setAppState((prev) => ({
      ...prev,
      weaponDirectVoltage: voltage,
    }));
  };

  // 2-way live synchronization between Weapon Reduction Teeth and Center Distance Pulleys
  const handleWeaponChange = (weapon: WeaponState) => {
    setAppState((prev) => {
      const nextCenter = { ...prev.centerDistance };
      let changedCenter = false;
      if (weapon.inputTeeth !== undefined && weapon.inputTeeth !== prev.centerDistance.smallPulleyTeeth) {
        nextCenter.smallPulleyTeeth = weapon.inputTeeth;
        changedCenter = true;
      }
      if (weapon.outputTeeth !== undefined && weapon.outputTeeth !== prev.centerDistance.largePulleyTeeth) {
        nextCenter.largePulleyTeeth = weapon.outputTeeth;
        changedCenter = true;
      }
      return {
        ...prev,
        weapon,
        centerDistance: changedCenter ? nextCenter : prev.centerDistance,
      };
    });
  };

  const handleCenterDistanceChange = (centerDistance: CenterDistanceState) => {
    setAppState((prev) => {
      const nextWeapon = { ...prev.weapon };
      let changedWeapon = false;
      if (centerDistance.smallPulleyTeeth !== prev.weapon.inputTeeth) {
        nextWeapon.inputTeeth = centerDistance.smallPulleyTeeth;
        changedWeapon = true;
      }
      if (centerDistance.largePulleyTeeth !== prev.weapon.outputTeeth) {
        nextWeapon.outputTeeth = centerDistance.largePulleyTeeth;
        changedWeapon = true;
      }
      if (changedWeapon) {
        const inT = nextWeapon.inputTeeth ?? 16;
        const outT = nextWeapon.outputTeeth ?? 16;
        nextWeapon.gearRatio = Number((outT / inT).toFixed(4));
        nextWeapon.pulleyPresetId = inT === 25 && outT === 36 ? 'repeat_vbelt_hub_25mm' : 'custom';
      }
      return {
        ...prev,
        centerDistance,
        weapon: changedWeapon ? nextWeapon : prev.weapon,
      };
    });
  };

  // Compute weapon MOI to feed into Spin-Up tab
  const computedWeaponMoi = useMemo(() => {
    const effectiveDirectV = appState.hasWeaponBattery
      ? appState.useWeaponDirectVoltage
        ? appState.weaponDirectVoltage
        : undefined
      : appState.useDirectVoltage
      ? appState.directVoltage
      : undefined;
    const res = computeWeapon(
      appState.weapon,
      effectiveWeaponChemistry,
      appState.voltageState,
      effectiveWeaponCellCount,
      effectiveDirectV
    );
    return res.totalMoiKgM2;
  }, [
    appState.weapon,
    effectiveWeaponChemistry,
    appState.voltageState,
    effectiveWeaponCellCount,
    appState.hasWeaponBattery,
    appState.useWeaponDirectVoltage,
    appState.weaponDirectVoltage,
    appState.useDirectVoltage,
    appState.directVoltage,
  ]);

  const currentPackVoltage = useMemo(() => {
    let cells = appState.drivetrain.cellCount;
    let chem = appState.chemistry;
    let isDirect = appState.useDirectVoltage;
    let directV = appState.directVoltage ?? 14.8;
    if (appState.activeTool === 'weapon' || appState.activeTool === 'spinup') {
      if (appState.hasWeaponBattery) {
        cells = effectiveWeaponCellCount;
        chem = effectiveWeaponChemistry;
        isDirect = appState.useWeaponDirectVoltage;
        directV = appState.weaponDirectVoltage ?? 14.8;
      }
    } else if (appState.activeTool === 'capacitance') {
      cells = appState.capacitance.cellCount;
    } else if (appState.activeTool === 'battery') {
      cells = appState.batteryRuntime.cellCount;
    }
    if (isDirect) return directV;
    return calculatePackVoltage(cells, chem, appState.voltageState);
  }, [appState, effectiveWeaponCellCount, effectiveWeaponChemistry]);

  return (
    <div className="calc-suite-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="calc-toast">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Navigation with Combat Weight Class & Electronics vs Mechanical Panes */}
      <Header
        activeTool={appState.activeTool}
        onSelectTool={(tool: ToolType) => setAppState((prev) => ({ ...prev, activeTool: tool }))}
        onShareLink={handleShareLink}
        onExportCsv={handleExportCsv}
        onResetDefaults={handleResetDefaults}
        weightClass={appState.weightClass}
        onChangeWeightClass={handleWeightClassChange}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        extendedPreset={appState.extendedPreset ?? false}
        onToggleExtendedPreset={() =>
          setAppState((prev) => ({ ...prev, extendedPreset: !prev.extendedPreset }))
        }
      />

      {/* Main Content Workspace */}
      <div className="calc-workspace">
        {appState.activeTool === 'drivetrain' && (
          <DrivetrainTool
            state={appState.drivetrain}
            onChange={(drivetrain) => setAppState((prev) => ({ ...prev, drivetrain }))}
            chemistry={appState.chemistry}
            onChangeChemistry={handleChangeMainChemistry}
            voltageState={appState.voltageState}
            onChangeVoltageState={(voltageState) =>
              setAppState((prev) => ({ ...prev, voltageState }))
            }
            weightClass={appState.weightClass}
            hasWeaponBattery={appState.hasWeaponBattery}
            onChangeHasWeaponBattery={handleToggleHasWeaponBattery}
            weaponChemistry={effectiveWeaponChemistry}
            onChangeWeaponChemistry={handleChangeWeaponChemistry}
            weaponCellCount={effectiveWeaponCellCount}
            onChangeWeaponCellCount={handleChangeWeaponCellCount}
            useDirectVoltage={appState.useDirectVoltage}
            onChangeUseDirectVoltage={handleToggleUseDirectVoltage}
            directVoltage={appState.directVoltage}
            onChangeDirectVoltage={handleChangeDirectVoltage}
            useWeaponDirectVoltage={appState.useWeaponDirectVoltage}
            onChangeUseWeaponDirectVoltage={handleToggleUseWeaponDirectVoltage}
            weaponDirectVoltage={appState.weaponDirectVoltage}
            onChangeWeaponDirectVoltage={handleChangeWeaponDirectVoltage}
            extendedPreset={appState.extendedPreset ?? false}
          />
        )}

        {appState.activeTool === 'weapon' && (
          <WeaponTool
            state={appState.weapon}
            onChange={handleWeaponChange}
            chemistry={appState.chemistry}
            onChangeChemistry={handleChangeMainChemistry}
            voltageState={appState.voltageState}
            onChangeVoltageState={(voltageState) =>
              setAppState((prev) => ({ ...prev, voltageState }))
            }
            weightClass={appState.weightClass}
            hasWeaponBattery={appState.hasWeaponBattery}
            onChangeHasWeaponBattery={handleToggleHasWeaponBattery}
            weaponChemistry={effectiveWeaponChemistry}
            onChangeWeaponChemistry={handleChangeWeaponChemistry}
            weaponCellCount={effectiveWeaponCellCount}
            onChangeWeaponCellCount={handleChangeWeaponCellCount}
            drivetrainCellCount={appState.drivetrain.cellCount}
            onChangeDrivetrainCellCount={handleChangeMainCellCount}
            useDirectVoltage={appState.useDirectVoltage}
            onChangeUseDirectVoltage={handleToggleUseDirectVoltage}
            directVoltage={appState.directVoltage}
            onChangeDirectVoltage={handleChangeDirectVoltage}
            useWeaponDirectVoltage={appState.useWeaponDirectVoltage}
            onChangeUseWeaponDirectVoltage={handleToggleUseWeaponDirectVoltage}
            weaponDirectVoltage={appState.weaponDirectVoltage}
            onChangeWeaponDirectVoltage={handleChangeWeaponDirectVoltage}
            extendedPreset={appState.extendedPreset ?? false}
          />
        )}

        {appState.activeTool === 'weapon-whatif' && (
          <WeaponTool
            state={appState.weapon}
            onChange={handleWeaponChange}
            chemistry={appState.chemistry}
            onChangeChemistry={handleChangeMainChemistry}
            voltageState={appState.voltageState}
            onChangeVoltageState={(voltageState) =>
              setAppState((prev) => ({ ...prev, voltageState }))
            }
            weightClass={appState.weightClass}
            hasWeaponBattery={appState.hasWeaponBattery}
            onChangeHasWeaponBattery={handleToggleHasWeaponBattery}
            weaponChemistry={effectiveWeaponChemistry}
            onChangeWeaponChemistry={handleChangeWeaponChemistry}
            weaponCellCount={effectiveWeaponCellCount}
            onChangeWeaponCellCount={handleChangeWeaponCellCount}
            drivetrainCellCount={appState.drivetrain.cellCount}
            onChangeDrivetrainCellCount={handleChangeMainCellCount}
            useDirectVoltage={appState.useDirectVoltage}
            onChangeUseDirectVoltage={handleToggleUseDirectVoltage}
            directVoltage={appState.directVoltage}
            onChangeDirectVoltage={handleChangeDirectVoltage}
            useWeaponDirectVoltage={appState.useWeaponDirectVoltage}
            onChangeUseWeaponDirectVoltage={handleToggleUseWeaponDirectVoltage}
            weaponDirectVoltage={appState.weaponDirectVoltage}
            onChangeWeaponDirectVoltage={handleChangeWeaponDirectVoltage}
            extendedPreset={appState.extendedPreset ?? false}
          />
        )}

        {appState.activeTool === 'spinup' && (
          <ElectronicsSpinUpTool
            state={appState.spinup}
            onChange={(spinup) => setAppState((prev) => ({ ...prev, spinup }))}
            chemistry={appState.chemistry}
            onChangeChemistry={handleChangeMainChemistry}
            voltageState={appState.voltageState}
            onChangeVoltageState={(voltageState) =>
              setAppState((prev) => ({ ...prev, voltageState }))
            }
            weightClass={appState.weightClass}
            weaponTabMoiKgM2={computedWeaponMoi}
            weaponTabMotorKv={appState.weapon.motorKv}
            weaponTabGearRatio={appState.weapon.gearRatio}
            hasWeaponBattery={appState.hasWeaponBattery}
            onChangeHasWeaponBattery={handleToggleHasWeaponBattery}
            weaponChemistry={effectiveWeaponChemistry}
            onChangeWeaponChemistry={handleChangeWeaponChemistry}
            weaponCellCount={effectiveWeaponCellCount}
            onChangeWeaponCellCount={handleChangeWeaponCellCount}
            drivetrainCellCount={appState.drivetrain.cellCount}
            onChangeDrivetrainCellCount={handleChangeMainCellCount}
            useDirectVoltage={appState.useDirectVoltage}
            onChangeUseDirectVoltage={handleToggleUseDirectVoltage}
            directVoltage={appState.directVoltage}
            onChangeDirectVoltage={handleChangeDirectVoltage}
            useWeaponDirectVoltage={appState.useWeaponDirectVoltage}
            onChangeUseWeaponDirectVoltage={handleToggleUseWeaponDirectVoltage}
            weaponDirectVoltage={appState.weaponDirectVoltage}
            onChangeWeaponDirectVoltage={handleChangeWeaponDirectVoltage}
          />
        )}

        {appState.activeTool === 'capacitance' && (
          <CapacitanceTool
            state={appState.capacitance}
            onChange={(capacitance) => setAppState((prev) => ({ ...prev, capacitance }))}
            chemistry={appState.chemistry}
            onChangeChemistry={handleChangeMainChemistry}
            voltageState={appState.voltageState}
            onChangeVoltageState={(voltageState) =>
              setAppState((prev) => ({ ...prev, voltageState }))
            }
            weightClass={appState.weightClass}
            hasWeaponBattery={appState.hasWeaponBattery}
            onChangeHasWeaponBattery={handleToggleHasWeaponBattery}
            weaponChemistry={effectiveWeaponChemistry}
            onChangeWeaponChemistry={handleChangeWeaponChemistry}
            weaponCellCount={effectiveWeaponCellCount}
            onChangeWeaponCellCount={handleChangeWeaponCellCount}
            useDirectVoltage={appState.useDirectVoltage}
            onChangeUseDirectVoltage={handleToggleUseDirectVoltage}
            directVoltage={appState.directVoltage}
            onChangeDirectVoltage={handleChangeDirectVoltage}
            useWeaponDirectVoltage={appState.useWeaponDirectVoltage}
            onChangeUseWeaponDirectVoltage={handleToggleUseWeaponDirectVoltage}
            weaponDirectVoltage={appState.weaponDirectVoltage}
            onChangeWeaponDirectVoltage={handleChangeWeaponDirectVoltage}
          />
        )}

        {appState.activeTool === 'center-distance' && (
          <CenterDistanceTool
            state={appState.centerDistance}
            onChange={handleCenterDistanceChange}
            packVoltage={currentPackVoltage}
          />
        )}

        {appState.activeTool === 'battery' && (
          <BatteryRuntimeTool
            state={appState.batteryRuntime}
            onChange={(batteryRuntime) =>
              setAppState((prev) => ({ ...prev, batteryRuntime }))
            }
            chemistry={appState.chemistry}
            onChangeChemistry={handleChangeMainChemistry}
            voltageState={appState.voltageState}
            onChangeVoltageState={(voltageState) =>
              setAppState((prev) => ({ ...prev, voltageState }))
            }
            weightClass={appState.weightClass}
            hasWeaponBattery={appState.hasWeaponBattery}
            onChangeHasWeaponBattery={handleToggleHasWeaponBattery}
            weaponChemistry={effectiveWeaponChemistry}
            onChangeWeaponChemistry={handleChangeWeaponChemistry}
            weaponCellCount={effectiveWeaponCellCount}
            onChangeWeaponCellCount={handleChangeWeaponCellCount}
            useDirectVoltage={appState.useDirectVoltage}
            onChangeUseDirectVoltage={handleToggleUseDirectVoltage}
            directVoltage={appState.directVoltage}
            onChangeDirectVoltage={handleChangeDirectVoltage}
            useWeaponDirectVoltage={appState.useWeaponDirectVoltage}
            onChangeUseWeaponDirectVoltage={handleToggleUseWeaponDirectVoltage}
            weaponDirectVoltage={appState.weaponDirectVoltage}
            onChangeWeaponDirectVoltage={handleChangeWeaponDirectVoltage}
          />
        )}
      </div>

      {/* Contractions & Engineering Glossary Flyout Window */}
      <GlossaryFlyout
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </div>
  );
}
