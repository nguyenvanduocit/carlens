// Core OBD data structures
export interface ObdReading {
  time: number // seconds
  calculatedLoadValue: number // %
  engineCoolantTemp: number // °C
  intakeManifoldPressure: number // kPa
  engineRPM: number // RPM
  vehicleSpeed: number // km/h
  intakeAirTemp: number // °C
  massAirFlowRate: number // g/s
  barometricPressure: number // kPa
  absoluteLoadValue: number // %
  acceleratorPedalPosition: number // %
  fuelRailPressure: number // kPa
  engineOilTemp: number // °C
  fuelInjectionTiming: number // deg
  engineFuelRate: number // l/hr
  actualEngineTorque: number // %
  engineTorqueAtIdle: number // %
  steeringAngle: number // deg
  fuelPressureSensorB: number // kPa
  fuelRateGs: number // g/s
  throttlePositionDesired: number // %
  transmissionFluidTemp: number // °C
  transmissionGear: number
  boost: number // kPa
  acceleration: number // m/s²
  enginePower: number // PS
  engineTorque: number // N•m
  measurements?: Record<string, any>
}

export interface ObdLogFile {
  startTime: string
  vehicleId: string
  filename: string
  readings: ObdReading[]
}

export interface CsvDataPoint {
  time: number
  timestamp: number // Unix timestamp in seconds  
  engineRPM?: number
  vehicleSpeed?: number
  coolantTemp?: number
  throttlePosition?: number
  fuelRate?: number
  barometricPressure?: number
  intakeAirTemp?: number
  gearEngaged?: number
  transmissionFluidTemp?: number
  enginePower?: number
  engineTorque?: number
  measurements?: Record<string, any>
  [key: string]: any
}

export interface CsvStats {
  avgSpeed: number
  maxSpeed: number
  avgRPM: number
  maxRPM: number
  avgFuelRate: number
  duration: number
  distance: number
}

export interface CsvLogInfo {
  fileName: string
  startTime: string
  date: string
  vehicleId: string
  fullPath: string
  size?: number
}

export interface DayLogInfo {
  date: string
  files: CsvLogInfo[]
  totalDuration: number
  totalDistance: number
  sessionCount: number
}

export interface DateRangeData {
  startDate: string
  endDate: string
  days: DayLogInfo[]
  combinedData: CsvDataPoint[]
  aggregatedStats: CsvStats
}

// Re-export CSV metrics types and constants for backward compatibility
export { CSV_METRICS, AVAILABLE_METRICS, type CsvMetricKey, type CsvMetricValue } from './csv-metrics.js';

