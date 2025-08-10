export interface ObdReading {
    time: number;
    calculatedLoadValue: number;
    engineCoolantTemp: number;
    intakeManifoldPressure: number;
    engineRPM: number;
    vehicleSpeed: number;
    intakeAirTemp: number;
    massAirFlowRate: number;
    barometricPressure: number;
    absoluteLoadValue: number;
    acceleratorPedalPosition: number;
    fuelRailPressure: number;
    engineOilTemp: number;
    fuelInjectionTiming: number;
    engineFuelRate: number;
    actualEngineTorque: number;
    engineTorqueAtIdle: number;
    steeringAngle: number;
    fuelPressureSensorB: number;
    fuelRateGs: number;
    throttlePositionDesired: number;
    transmissionFluidTemp: number;
    transmissionGear: number;
    boost: number;
    acceleration: number;
    enginePower: number;
    engineTorque: number;
    measurements?: Record<string, any>;
}
export interface ObdLogFile {
    startTime: string;
    vehicleId: string;
    filename: string;
    readings: ObdReading[];
}
export interface CsvDataPoint {
    time: number;
    timestamp: number;
    engineRPM?: number;
    vehicleSpeed?: number;
    coolantTemp?: number;
    throttlePosition?: number;
    fuelRate?: number;
    barometricPressure?: number;
    intakeAirTemp?: number;
    gearEngaged?: number;
    transmissionFluidTemp?: number;
    enginePower?: number;
    engineTorque?: number;
    measurements?: Record<string, any>;
    [key: string]: any;
}
export interface CsvStats {
    avgSpeed: number;
    maxSpeed: number;
    avgRPM: number;
    maxRPM: number;
    avgFuelRate: number;
    duration: number;
    distance: number;
}
export interface CsvLogInfo {
    fileName: string;
    startTime: string;
    date: string;
    vehicleId: string;
    fullPath: string;
    size?: number;
}
export interface DayLogInfo {
    date: string;
    files: CsvLogInfo[];
    totalDuration: number;
    totalDistance: number;
    sessionCount: number;
}
export interface DateRangeData {
    startDate: string;
    endDate: string;
    days: DayLogInfo[];
    combinedData: CsvDataPoint[];
    aggregatedStats: CsvStats;
}
export { CSV_METRICS, AVAILABLE_METRICS, type CsvMetricKey, type CsvMetricValue } from './csv-metrics.js';
//# sourceMappingURL=obd.d.ts.map