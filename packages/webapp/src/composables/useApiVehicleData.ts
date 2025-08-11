import { ref, computed, onMounted, onUnmounted } from 'vue'
import { vehicleApi } from '@/api/vehicleApi'
import type { TimeseriesDataPoint, TimeseriesDataResponse } from '@carlens/shared-types'

export function useApiVehicleData(autoRefresh = false, refreshInterval = 5000) {
  const data = ref<TimeseriesDataPoint[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetch = ref<Date | null>(null)

  let refreshTimer: ReturnType<typeof setInterval> | null = null

  // Computed properties
  const latestData = computed(() => {
    if (!data.value || data.value.length === 0) return null
    return data.value[data.value.length - 1]
  })

  const dataCount = computed(() => data.value?.length || 0)

  const hasData = computed(() => data.value && data.value.length > 0)

  // Fetch data from API
  const fetchData = async (limit = 1000) => {
    loading.value = true
    error.value = null

    try {
      const response = await vehicleApi.getTimeseriesData(
        { limit },
        { reason: 'Fetching vehicle telemetry data', source: 'useApiVehicleData' }
      )
      
      if (response.success && response.data) {
        data.value = response.data
        lastFetch.value = new Date()
      } else {
        throw new Error(response.error || 'Failed to fetch data')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Failed to fetch vehicle data:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch latest readings
  const fetchLatest = async () => {
    try {
      const response = await vehicleApi.getLatestReadings(
        { limit: 10 },
        { reason: 'Fetching latest readings', source: 'useApiVehicleData' }
      )
      
      if (response.success && response.data && response.data.length > 0) {
        // Append new data points that don't already exist
        const existingTimestamps = new Set(data.value.map(d => d.timestamp))
        const newPoints = response.data.filter(point => !existingTimestamps.has(point.timestamp))
        
        if (newPoints.length > 0) {
          data.value = [...data.value, ...newPoints].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          lastFetch.value = new Date()
        }
      }
    } catch (err) {
      console.error('Failed to fetch latest readings:', err)
    }
  }

  // Start auto-refresh
  const startAutoRefresh = () => {
    if (refreshTimer) return
    
    refreshTimer = setInterval(() => {
      fetchLatest()
    }, refreshInterval)
  }

  // Stop auto-refresh
  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  // Lifecycle
  onMounted(async () => {
    await fetchData()
    
    if (autoRefresh) {
      startAutoRefresh()
    }
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  return {
    // State
    data,
    loading,
    error,
    lastFetch,
    
    // Computed
    latestData,
    dataCount,
    hasData,
    
    // Methods
    fetchData,
    fetchLatest,
    startAutoRefresh,
    stopAutoRefresh
  }
}