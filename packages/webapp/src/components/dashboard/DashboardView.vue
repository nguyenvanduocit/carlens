<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
    <!-- Header Bar -->
    <HeaderBar @refresh="handleRefresh">
      <template #controls>
        <div class="flex items-center space-x-4">
          <DateRangeSelector v-model="dateSelection" :day-logs="dayLogs" :disabled="!selectedVehicle"
            @update:modelValue="onDateRangeUpdated" />
          <IntervalSelector v-model="dataInterval" @update:modelValue="onIntervalUpdated" />
        </div>
      </template>
    </HeaderBar>

    <!-- Loading State -->
    <div v-if="configLoading" class="flex items-center justify-center py-12">
      <div class="text-white text-lg">Loading vehicle data...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="configError" class="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
      <div class="text-red-200">Error loading data: {{ configError }}</div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="space-y-8">


      <!-- Charts Grid -->
      <div class="grid grid-cols-1 gap-8">

        <!-- Optimization Analysis -->
        <OptimizationAnalysis />

        <!-- ML Optimization Demo -->
        <MLOptimizationDemo />

        <!-- Multi-metric Configurable Chart -->
        <MultiMetricLineChart />

        <!-- Journey Map -->
        <LeafletJourney />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Import components
import HeaderBar from './HeaderBar.vue'
import DateRangeSelector from './DateRangeSelector.vue'
import IntervalSelector from './IntervalSelector.vue'
import type { DataInterval } from './IntervalSelector.vue'

// Import API-based chart components
import MultiMetricLineChart from './MultiMetricLineChart.vue'
import LeafletJourney from './LeafletJourney.vue'
import OptimizationAnalysis from './OptimizationAnalysis.vue'
import MLOptimizationDemo from './MLOptimizationDemo.vue'

// Use new composables
import { useChartEventBus, type ChartRefreshPayload } from '@/composables/useChartEventBus'
import type { DayLogInfo, VehicleInfoResponse } from '@/types/obd'
import { vehicleApi } from '@/api/vehicleApi'
import { createGMT7DateString } from '@/utils/timezone'

// Event bus for triggering chart data refresh
const refreshChartsEvent = useChartEventBus()

// Local dashboard filter state
const selectedVehicle = ref<string>('RL2UMFC50RYR87488') // Fixed vehicle ID
const dayLogs = ref<DayLogInfo[]>([])
const dateRange = ref<{ start?: Date; end?: Date }>({})
const dataInterval = ref<DataInterval>('5m')
const vehicleInfo = ref<VehicleInfoResponse>()
const configLoading = ref(true)
const configError = ref<string>()

// Set default date selection (will be updated after config loads)
const dateSelection = ref<{ startDate?: string; endDate?: string }>({})


// Handle updates from child components directly and emit refresh events
const onDateRangeUpdated = (newValue: { startDate?: string; endDate?: string }) => {
  // Ignore incomplete or undefined updates
  if (!newValue?.startDate || !newValue?.endDate) return

  const nextStart = new Date(newValue.startDate)
  const nextEnd = new Date(newValue.endDate)

  // Get current values to avoid redundant updates
  const currentStart = dateRange.value.start
  const currentEnd = dateRange.value.end

  const isSameRange = !!currentStart && !!currentEnd &&
    currentStart.getTime() === new Date(nextStart).setHours(0, 0, 0, 0) &&
    currentEnd.getTime() === new Date(nextEnd).setHours(23, 59, 59, 999)

  if (isSameRange) return

  // Set local date range
  dateRange.value = {
    start: new Date(nextStart.setHours(0, 0, 0, 0)),
    end: new Date(nextEnd.setHours(23, 59, 59, 999))
  }

}

const onIntervalUpdated = (newValue: DataInterval) => {
  // Ignore undefined or unchanged values
  if (!newValue || newValue === dataInterval.value) return

  dataInterval.value = newValue
}

// Initialize local configuration
const initializeConfig = async () => {
  try {
    configLoading.value = true
    configError.value = undefined

    // Load vehicle info
    const vehicleInfoResponse = await vehicleApi.getVehicleInfo({ reason: 'dashboard-init' })

    vehicleInfo.value = vehicleInfoResponse

    // Set default date range from vehicle data
    if (vehicleInfoResponse.dataRange) {
      const { minTime, maxTime } = vehicleInfoResponse.dataRange
      if (minTime && maxTime) {
        const startDate = new Date(minTime as Date)
        const endDate = new Date(maxTime as Date)

        // Set to the last day by default
        const lastDay = new Date(endDate)
        dateRange.value = {
          start: new Date(lastDay.setHours(0, 0, 0, 0)),
          end: new Date(lastDay.setHours(23, 59, 59, 999))
        }

        // Generate day logs for the date selector
        const days: DayLogInfo[] = []
        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
          days.push({
            date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
            files: [], // We don't need file details for the date selector
            totalDuration: 0,
            totalDistance: 0,
            sessionCount: 1
          })
          currentDate.setDate(currentDate.getDate() + 1)
        }

        dayLogs.value = days

        // Set date selection for UI
        const lastDayString = endDate.toISOString().split('T')[0]
        dateSelection.value = { startDate: lastDayString, endDate: lastDayString }
      }
    }

    configLoading.value = false
  } catch (error) {
    configError.value = error instanceof Error ? error.message : 'Failed to load configuration'
    configLoading.value = false
    console.error('Dashboard config initialization failed:', error)
  }
}

// Load initial data
onMounted(async () => {
  await initializeConfig()

  // Trigger initial data load once configuration is ready
  if (dateRange.value.start && dateRange.value.end) {
    const payload: ChartRefreshPayload = {
      startTime: createGMT7DateString(dateRange.value.start),
      endTime: createGMT7DateString(dateRange.value.end),
      vehicleId: selectedVehicle.value,
      interval: dataInterval.value,
      vehicleInfo: vehicleInfo.value,
    }
    refreshChartsEvent.emit(payload)
  }
})

const handleRefresh = () => {
  const payload: ChartRefreshPayload = {

    startTime: createGMT7DateString(dateRange.value.start!),
    endTime: createGMT7DateString(dateRange.value.end!),
    vehicleId: selectedVehicle.value,
    interval: dataInterval.value,
    vehicleInfo: vehicleInfo.value,
  }
  refreshChartsEvent.emit(payload)
}


</script>