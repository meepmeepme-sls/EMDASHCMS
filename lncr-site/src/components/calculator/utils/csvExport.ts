/**
 * Late Night Combat Robotics Calculator Suite - CSV Configuration & Performance Exporter
 */

import { GlobalAppState } from './urlState';
import {
  computeDrivetrain,
  computeWeapon,
  computeSpinUp,
  computeCenterDistance,
  computeBatteryRuntime,
  computeCapacitance,
} from './calculations';
import { WEIGHT_CLASSES, BATTERY_CHEMISTRIES } from './constants';

export function exportConfigurationToCsv(state: GlobalAppState) {
  const lines: string[] = [];

  // Header metadata
  lines.push('Late Night Combat Robotics Calculator - Configuration Export');
  lines.push(`Domain,latenightcombat.com`);
  lines.push(`Exported At,${new Date().toISOString()}`);
  lines.push(`Active Tool,${state.activeTool.toUpperCase()}`);

  const wc = WEIGHT_CLASSES.find((w) => w.id === state.weightClass);
  lines.push(`Weight Class,"${wc?.name || state.weightClass}"`);
  if (state.hasWeaponBattery) {
    if (state.useDirectVoltage) {
      lines.push(`Drivetrain Power Source,"Direct Voltage (${state.directVoltage ?? 14.8}V)"`);
    } else {
      lines.push(`Drivetrain Battery Chemistry,"${BATTERY_CHEMISTRIES[state.chemistry]?.label || state.chemistry} (${state.drivetrain.cellCount}S)"`);
    }
    if (state.useWeaponDirectVoltage) {
      lines.push(`Weapon Power Source,"Direct Voltage (${state.weaponDirectVoltage ?? 14.8}V)"`);
    } else {
      lines.push(`Weapon Battery Chemistry,"${BATTERY_CHEMISTRIES[state.weaponChemistry]?.label || state.weaponChemistry} (${state.weaponCellCount}S)"`);
    }
  } else {
    if (state.useDirectVoltage) {
      lines.push(`Power Source,"Direct Voltage (${state.directVoltage ?? 14.8}V)"`);
    } else {
      lines.push(`Battery Chemistry,"${BATTERY_CHEMISTRIES[state.chemistry]?.label || state.chemistry} (${state.drivetrain.cellCount}S)"`);
    }
  }
  lines.push(`Voltage State,${state.voltageState.toUpperCase()}`);
  lines.push(''); // blank row

  if (state.activeTool === 'drivetrain') {
    const res = computeDrivetrain(state.drivetrain, state.chemistry, state.voltageState, state.useDirectVoltage ? state.directVoltage : undefined);
    lines.push('--- DRIVETRAIN SPECIFICATIONS ---');
    lines.push('Parameter,Value,Unit');
    lines.push(`Motor Kv,${state.drivetrain.motorKv},RPM/V`);
    lines.push(`Battery Cell Count,${state.drivetrain.cellCount},S`);
    lines.push(`Pack Voltage,${res.packVoltage.toFixed(2)},V`);
    lines.push(`Gearbox Ratio,${state.drivetrain.gearRatio},:1`);
    if (state.drivetrain.gearboxPresetId) {
      lines.push(`Gearbox Preset,${state.drivetrain.gearboxPresetId}`);
    }
    lines.push(`External Input Teeth (Driver),${state.drivetrain.externalInputTeeth ?? 1},T`);
    lines.push(`External Output Teeth (Driven),${state.drivetrain.externalOutputTeeth ?? 1},T`);
    lines.push(`External Reduction Ratio,${res.externalRatio.toFixed(2)},:1`);
    lines.push(`Total Drive Ratio,${res.totalRatio.toFixed(2)},:1`);
    lines.push(`Wheel Diameter,${state.drivetrain.wheelDiameter},${state.drivetrain.wheelDiameterUnit}`);
    lines.push('');
    lines.push('--- COMPUTED PERFORMANCE ---');
    lines.push('Metric,Value,Unit');
    lines.push(`Theoretical Speed,${res.theoreticalSpeedMph.toFixed(2)},mph`);
    lines.push(`Theoretical Speed,${res.theoreticalSpeedMs.toFixed(2)},m/s`);
    lines.push(`Theoretical Speed,${res.theoreticalSpeedFts.toFixed(2)},ft/s`);
    lines.push(`Motor RPM,${res.motorRpm.toFixed(0)},RPM`);
    lines.push(`Wheel RPM,${res.wheelRpm.toFixed(0)},RPM`);
    lines.push(`Wheel Circumference,${res.wheelCircumferenceMm.toFixed(1)},mm`);
    lines.push(`SPARC v1.7 Compliance (<= 48V),${res.isOver48V ? 'Requires Event Organizer Approval' : 'Compliant'}`);
  } else if (state.activeTool === 'weapon') {
    const chem = state.hasWeaponBattery ? state.weaponChemistry : state.chemistry;
    const cells = state.hasWeaponBattery ? state.weaponCellCount : state.drivetrain.cellCount;
    const res = computeWeapon(state.weapon, chem, state.voltageState, cells, (state.hasWeaponBattery ? state.useWeaponDirectVoltage : state.useDirectVoltage) ? (state.hasWeaponBattery ? state.weaponDirectVoltage : state.directVoltage) : undefined);
    lines.push('--- WEAPON SPECIFICATIONS ---');
    lines.push('Parameter,Value,Unit');
    lines.push(`Mass Moment of Inertia (MOI),${state.weapon.moi ?? state.weapon.moiKgM2},${state.weapon.moiUnit || 'kg*m^2'}`);
    if (state.weapon.moiUnit && state.weapon.moiUnit !== 'kg*m^2') {
      lines.push(`Mass Moment of Inertia (SI),${state.weapon.moiKgM2},kg*m^2`);
    }
    lines.push(`Effective Diameter,${state.weapon.effectiveDiameter},${state.weapon.effectiveDiameterUnit}`);
    lines.push(`Motor Kv,${state.weapon.motorKv},RPM/V`);
    lines.push(`Battery Cell Count,${cells},S`);
    lines.push(`Pack Voltage,${res.packVoltage.toFixed(2)},V`);
    lines.push(`Weapon Input Teeth (Driver),${state.weapon.inputTeeth ?? 16},T`);
    lines.push(`Weapon Output Teeth (Driven),${state.weapon.outputTeeth ?? 16},T`);
    lines.push(`Weapon Gear Ratio,${res.gearRatio.toFixed(2)},:1`);
    lines.push('');
    lines.push('--- COMPUTED WEAPON METRICS ---');
    lines.push('Metric,Value,Unit');
    lines.push(`Weapon RPM,${res.weaponRpm.toFixed(0)},RPM`);
    lines.push(`Weapon Tip Speed,${res.tipSpeedMph.toFixed(2)},mph`);
    lines.push(`Weapon Tip Speed,${res.tipSpeedMs.toFixed(2)},m/s`);
    lines.push(`Stored Kinetic Energy,${res.kineticEnergyJoules.toFixed(1)},Joules`);
    lines.push(`Stored Kinetic Energy,${res.kineticEnergyFtLbs.toFixed(1)},ft-lbs`);
    lines.push(`NHRL 250 mph Scrutiny Status,${res.isOverNhrlLimit ? 'Additional Scrutiny Required (>250 mph)' : 'Compliant (<= 250 mph)'}`);
    lines.push(`NHRL Limit Margin,%${res.nhrlLimitPercentage.toFixed(1)}`);
    lines.push(`SPARC v1.7 Compliance (<= 48V),${res.isOver48V ? 'Requires Event Organizer Approval' : 'Compliant'}`);
  } else if (state.activeTool === 'spinup') {
    const chem = state.hasWeaponBattery ? state.weaponChemistry : state.chemistry;
    const cells = state.hasWeaponBattery ? state.weaponCellCount : state.drivetrain.cellCount;
    const directV = (state.hasWeaponBattery ? state.useWeaponDirectVoltage : state.useDirectVoltage)
      ? (state.hasWeaponBattery ? state.weaponDirectVoltage : state.directVoltage)
      : undefined;
    const weaponRes = computeWeapon(state.weapon, chem, state.voltageState, cells, directV);
    const res = computeSpinUp(
      state.spinup,
      chem,
      state.voltageState,
      weaponRes.totalMoiKgM2,
      state.weapon.motorKv,
      state.weapon.gearRatio,
      cells,
      directV
    );
    const effectiveKv = state.spinup.useWeaponTabMotorKv !== false ? state.weapon.motorKv : state.spinup.motorKv;
    const effectiveGr = state.spinup.useWeaponTabGearRatio !== false ? state.weapon.gearRatio : state.spinup.gearRatio;
    lines.push('--- ELECTRONICS & SPIN-UP SPECIFICATIONS ---');
    lines.push('Parameter,Value,Unit');
    lines.push(`Motor Kv,${effectiveKv},RPM/V${state.spinup.useWeaponTabMotorKv !== false ? ' (From Weapon Tab)' : ' (Custom)'}`);
    lines.push(`Battery Cell Count,${cells},S`);
    lines.push(`Pack Voltage,${res.packVoltage.toFixed(2)},V`);
    lines.push(`Gear Reduction Ratio,${effectiveGr},:1${state.spinup.useWeaponTabGearRatio !== false ? ' (From Weapon Tab)' : ' (Custom)'}`);
    lines.push(`Motor Internal Resistance,${state.spinup.motorResistance},Ohms`);
    lines.push(`Battery Cell Resistance,${state.spinup.batteryResistancePerCell},Ohms/cell`);
    lines.push(`Wiring & ESC Resistance,${state.spinup.escWiringResistance},Ohms`);
    lines.push(`Total System Resistance,${res.systemResistanceOhms.toFixed(4)},Ohms`);
    lines.push('');
    lines.push('--- COMPUTED SPIN-UP PERFORMANCE ---');
    lines.push('Metric,Value,Unit');
    lines.push(`Motor Torque Constant (Kt),${res.ktNmPerAmp.toFixed(5)},N*m/A`);
    lines.push(`Estimated Stall Current,${res.stallCurrentAmps.toFixed(1)},Amps`);
    lines.push(`Weapon Stall Torque,${res.stallTorqueNm.toFixed(2)},N*m`);
    lines.push(`Weapon Stall Torque,${res.stallTorqueOzIn.toFixed(0)},oz-in`);
    lines.push(`Mechanical Time Constant (Tau),${res.tauSec.toFixed(3)},seconds`);
    lines.push(`Time to 63.2% RPM,${res.timeTo63PercentSec.toFixed(3)},seconds`);
    lines.push(`Time to 86.5% RPM,${res.timeTo86PercentSec.toFixed(3)},seconds`);
    lines.push(`Time to 95.0% RPM (Spin-Up),${res.timeTo95PercentSec.toFixed(3)},seconds`);
    lines.push(`Max Free RPM,${res.freeRpm.toFixed(0)},RPM`);
    lines.push(`Energy Stored at 95% Speed,${res.energyAt95Joules.toFixed(1)},Joules`);
  } else if (state.activeTool === 'capacitance') {
    const res = computeCapacitance(
      { ...state.capacitance, cellCount: state.drivetrain.cellCount },
      state.chemistry,
      state.voltageState,
      state.useDirectVoltage ? state.directVoltage : undefined
    );
    lines.push('--- RECOMMENDED CAPACITANCE SPECIFICATIONS ---');
    lines.push('Parameter,Value,Unit');
    lines.push(`Battery Cell Count,${state.drivetrain.cellCount},S`);
    lines.push(`Pack Voltage,${res.packVoltage.toFixed(2)},V`);
    lines.push(`Max Pack Voltage,${res.maxPackVoltage.toFixed(2)},V`);
    lines.push(`Wire Length,${state.capacitance.wireLength},${state.capacitance.wireLengthUnit}`);
    lines.push(`Peak Current,${state.capacitance.peakCurrentAmps},A`);
    lines.push(`Allowable Ripple Voltage,${state.capacitance.allowableRippleVolts},V`);
    lines.push(`Safety Factor,${state.capacitance.safetyFactor},x`);
    lines.push('');
    lines.push('--- COMPUTED CAPACITANCE METRICS ---');
    lines.push('Metric,Value,Unit');
    lines.push(`Recommended Capacitance,${res.recommendedCapacitanceUf},uF`);
    lines.push(`Minimum Voltage Rating,${res.recommendedVoltageRatingVolts},V`);
    lines.push(`Suggested Capacitor Bank,"${res.suggestedPackConfig}"`);
    lines.push(`Loop Inductance,${res.loopInductanceNanoHenrys.toFixed(0)},nH`);
    lines.push(`Unfiltered Voltage Spike,${res.unfilteredSpikeVolts.toFixed(1)},V`);
    lines.push(`SPARC v1.7 Compliance (<= 48V),${res.isOver48V ? 'Requires Event Organizer Approval' : 'Compliant'}`);
  } else if (state.activeTool === 'center-distance') {
    const res = computeCenterDistance(state.centerDistance);
    lines.push('--- CENTER DISTANCE SPECIFICATIONS ---');
    lines.push('Parameter,Value,Unit');
    lines.push(`Pitch Preset,${state.centerDistance.pitchPresetId}`);
    lines.push(`Tooth Pitch,${res.pitchMm},mm`);
    lines.push(`Small Pulley Teeth (z1),${state.centerDistance.smallPulleyTeeth}`);
    lines.push(`Large Pulley Teeth (z2),${state.centerDistance.largePulleyTeeth}`);
    lines.push(`Belt Size (Tooth Count),${res.beltTeeth},teeth`);
    lines.push(`Belt Pitch Length,${res.beltPitchLengthMm.toFixed(2)},mm`);
    lines.push(`Belt Pitch Length,${res.beltPitchLengthIn.toFixed(3)},in`);
    lines.push('');
    lines.push('--- COMPUTED BELT/CHAIN GEOMETRY ---');
    lines.push('Metric,Value,Unit');
    lines.push(`Small Pulley Pitch Diameter,${res.smallPitchDiameterMm.toFixed(2)},mm`);
    lines.push(`Large Pulley Pitch Diameter,${res.largePitchDiameterMm.toFixed(2)},mm`);
    lines.push(`Gear / Pulley Ratio,${res.ratio.toFixed(2)},:1`);
    lines.push(`Exact Center Distance,${res.actualCenterDistanceMm.toFixed(2)},mm`);
    lines.push(`Exact Center Distance,${res.actualCenterDistanceIn.toFixed(3)},in`);
    lines.push(`Teeth in Mesh (Small Pulley),${res.teethInMesh.toFixed(1)},teeth`);
    lines.push(`Tooth Mesh Safety (>= 6 teeth),${res.isMeshSafe ? 'Safe' : 'WARNING: Less than 6 teeth in mesh'}`);
  } else if (state.activeTool === 'battery') {
    const res = computeBatteryRuntime(
      { ...state.batteryRuntime, cellCount: state.drivetrain.cellCount },
      state.chemistry,
      state.useDirectVoltage ? state.directVoltage : undefined
    );
    lines.push('--- BATTERY & RUNTIME SPECIFICATIONS ---');
    lines.push('Parameter,Value,Unit');
    lines.push(`Battery Chemistry,"${BATTERY_CHEMISTRIES[state.chemistry]?.label || state.chemistry}"`);
    lines.push(`Cell Count,${state.drivetrain.cellCount},S`);
    lines.push(`Pack Nominal Voltage,${res.packNominalVoltage.toFixed(2)},V`);
    lines.push(`Pack Max Voltage,${res.packMaxVoltage.toFixed(2)},V`);
    lines.push(`Battery Pack Capacity,${state.batteryRuntime.batteryCapacityMah},mAh`);
    lines.push(`Drive Motors Count,${state.batteryRuntime.driveMotorCount}`);
    lines.push(`Average Current per Drive Motor,${state.batteryRuntime.avgDriveCurrentAmps},A`);
    lines.push(`Weapon Motors Count,${state.batteryRuntime.weaponMotorCount}`);
    lines.push(`Average Current per Weapon Motor,${state.batteryRuntime.avgWeaponCurrentAmps},A`);
    lines.push(`Match Duration,${state.batteryRuntime.matchDurationSec},seconds`);
    lines.push(`Reserve Margin,${state.batteryRuntime.reserveMarginPercent},%`);
    lines.push('');
    lines.push('--- COMPUTED RUNTIME METRICS ---');
    lines.push('Metric,Value,Unit');
    lines.push(`Total Average Current Draw,${res.totalAvgCurrentAmps.toFixed(1)},A`);
    lines.push(`Capacity Consumed in Match,${res.capacityConsumedMah.toFixed(0)},mAh`);
    lines.push(`Recommended Battery Pack Capacity,${res.recommendedCapacityMah.toFixed(0)},mAh`);
    lines.push(`Pack Energy (Watt-Hours),${res.packWattHours.toFixed(2)},Wh`);
    lines.push(`Full Capacity Depletion Runtime,${res.estimatedFullMatchRuntimeMin.toFixed(1)},minutes`);
    lines.push(`Airline Travel Status (FAA/IATA),${res.airlineStatus.toUpperCase()}`);
    lines.push(`SPARC v1.7 Compliance (<= 48V),${res.isOver48V ? 'Requires Event Organizer Approval' : 'Compliant'}`);
  }

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `LateNightCombat_${state.activeTool}_${state.weightClass}_${Date.now()}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
