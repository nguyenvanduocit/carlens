// Vehicle-related types
export interface VehicleStats {
  totalDistance: number // km
  averageSpeed: number // km/h
  maxSpeed: number // km/h
  averageFuelRate: number // l/hr
  totalFuelConsumed: number // l
  averageEngineTemp: number // °C
  maxEngineTemp: number // °C
  engineHours: number // hours
}

export interface FaultAlert {
  id: string
  type: 'warning' | 'critical' | 'info'
  title: string
  description: string
  timestamp: Date
  metric: string
  value: number
  threshold: number
}

export interface DashboardMetrics {
  currentSpeed: number
  currentRPM: number
  currentTemp: number
  currentFuelRate: number
  fuelEfficiency: number
  engineLoad: number
}

export interface EngineHealthMetrics {
  overallHealthScore: number // 0-100%
  performanceDegradation: number // percentage decrease from baseline
  predictedLifeRemaining: number // hours
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  diagnosticInsights: DiagnosticInsight[]
}

export interface DiagnosticInsight {
  category: 'combustion' | 'thermal' | 'mechanical' | 'fuel' | 'emission'
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  recommendedAction: string
  confidenceLevel: number // 0-100%
  trendDirection: 'improving' | 'stable' | 'degrading'
}

export interface EngineBaselineMetrics {
  optimalRpmRange: [number, number]
  optimalTempRange: [number, number]
  maxEfficiencyFuelRate: number
  baselineCompressionRatio: number
  nominalTorqueCurve: { rpm: number; torque: number }[]
  newEngineBaseline: EnginePerformanceSnapshot
}

export interface EnginePerformanceSnapshot {
  timestamp: Date
  averageRPM: number
  averageTemp: number
  averageFuelRate: number
  averageLoadValue: number
  powerEfficiency: number
  thermalEfficiency: number
  mechanicalEfficiency: number
  combustionQuality: number
  compressionHealth: number
}

export interface VehicleMetadata {
  vehicleId?: string
  make?: string
  model?: string
  year?: number
  vin?: string
}