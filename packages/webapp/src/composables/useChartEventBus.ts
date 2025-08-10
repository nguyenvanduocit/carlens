import { useEventBus } from '@vueuse/core'
import type { VehicleInfoResponse } from '@/types/obd'

// Define the filter payload interface
export interface ChartRefreshPayload {
  startTime: string
  endTime: string
  vehicleId: string
  interval: '1m' | '5m' | '15m' | '30m' | '1h'
  vehicleInfo?: VehicleInfoResponse
}

// Create and export a single shared event bus instance for chart refreshes with filter payload
export const chartRefreshEventBus = useEventBus<ChartRefreshPayload>('refresh-charts')

// Composable to provide the event bus
export const useChartEventBus = () => {
  return chartRefreshEventBus
}