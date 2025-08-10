import { useEventBus } from '@vueuse/core'

export interface DataPointSelectedPayload {
  timestamp: string | Date
}

// Create and export a single shared event bus instance for data point selection
export const dataPointSelectedEventBus = useEventBus<DataPointSelectedPayload>('data-point-selected')

// Composable to provide the event bus
export const useDataPointEventBus = () => {
  return dataPointSelectedEventBus
}