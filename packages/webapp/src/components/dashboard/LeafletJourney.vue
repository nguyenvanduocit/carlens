<template>
  <div class="w-full space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">Journey Map</h2>
        <p class="text-slate-400 text-sm mt-1">Interactive GPS journey with real-time vehicle telemetry</p>
      </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-16">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      <div class="text-slate-300 text-lg font-medium">Loading GPS journey data...</div>
      <div class="text-slate-400 text-sm mt-1">Fetching telemetry points and route information</div>
    </div>

    <div v-else-if="error" class="bg-red-900/20 border border-red-700/50 rounded-lg p-6 text-center">
      <div class="text-red-400 text-lg font-medium mb-2">⚠️ Unable to Load GPS Data</div>
      <div class="text-red-300 text-sm">{{ error }}</div>
    </div>

    <div v-else-if="!hasGpsData" class="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
      <div class="text-slate-400 text-lg font-medium mb-2">📍 No GPS Data Available</div>
      <div class="text-slate-500 text-sm">No GPS coordinates found for the selected time range</div>
    </div>

    <div v-else>
      <!-- Controls Section -->
      <div class="mb-3 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <!-- Metric Selector -->
          <div class="flex-1">
            <div class="relative">
              <select v-model="selectedMetric"
                class="w-full lg:w-64 px-4 py-3 bg-slate-900/70 text-white border border-slate-600 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer">
                <option value="speed">🚗 Vehicle Speed (km/h)</option>
                <option value="rpm">⚡ Engine RPM</option>
                <option value="throttle">🎛️ Throttle Position (%)</option>
                <option value="coolant">🌡️ Coolant Temperature (°C)</option>
                <option value="fuelRate">⛽ Fuel Rate (L/h)</option>
                <option value="power">💪 Engine Power (PS)</option>
                <option value="torque">🔧 Engine Torque (N•m)</option>
              </select>
            </div>
          </div>

          <!-- Dynamic Legend -->
          <div class="lg:flex-1 lg:max-w-md">
            <div class="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded-full shadow-sm border border-emerald-400/20"
                    style="background-color: #10b981"></div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-emerald-300 font-medium text-xs">Low</span>
                    <span class="text-slate-400 text-xs truncate">{{ legendRanges.veryLow }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded-full shadow-sm border border-lime-400/20"
                    style="background-color: #84cc16"></div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-lime-300 font-medium text-xs">Moderate</span>
                    <span class="text-slate-400 text-xs truncate">{{ legendRanges.low }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded-full shadow-sm border border-yellow-400/20"
                    style="background-color: #eab308"></div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-yellow-300 font-medium text-xs">High</span>
                    <span class="text-slate-400 text-xs truncate">{{ legendRanges.mid }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded-full shadow-sm border border-red-400/20"
                    style="background-color: #ef4444"></div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-red-300 font-medium text-xs">Very High</span>
                    <span class="text-slate-400 text-xs truncate">{{ legendRanges.high }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Map Container -->
      <div ref="mapContainer" class="w-full h-[600px] overflow-hidden bg-slate-800 rounded-lg"></div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
        <div class="bg-slate-900/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-900/70 transition-colors">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div class="text-slate-400 text-sm font-medium">GPS Points</div>
          </div>
          <div class="text-white text-2xl font-bold">{{ gpsPoints.length.toLocaleString() }}</div>
          <div class="text-slate-500 text-xs mt-1">Data points collected</div>
        </div>

        <div class="bg-slate-900/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-900/70 transition-colors">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
            </div>
            <div class="text-slate-400 text-sm font-medium">Distance</div>
          </div>
          <div class="text-white text-2xl font-bold">{{ estimatedDistance.toFixed(1) }}</div>
          <div class="text-slate-500 text-xs mt-1">Kilometers traveled</div>
        </div>

        <div class="bg-slate-900/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-900/70 transition-colors">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div class="text-slate-400 text-sm font-medium">Start Time</div>
          </div>
          <div class="text-white text-lg font-bold">{{ startTime }}</div>
          <div class="text-slate-500 text-xs mt-1">Journey began</div>
        </div>

        <div class="bg-slate-900/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-900/70 transition-colors">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <div class="text-slate-400 text-sm font-medium">End Time</div>
          </div>
          <div class="text-white text-lg font-bold">{{ endTime }}</div>
          <div class="text-slate-500 text-xs mt-1">Journey completed</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useChartEventBus, type ChartRefreshPayload } from '@/composables/useChartEventBus'
import { useDataPointEventBus, type DataPointSelectedPayload } from '@/composables/useDataPointEventBus'
import { vehicleApi } from '@/api/vehicleApi'
import { CSV_METRICS, type TimeseriesDataPoint } from '@carlens/shared-types'
import { formatLocalDateTime } from '@/utils/timezone'

const refreshChartsEvent = useChartEventBus()
const dataPointEvent = useDataPointEventBus()
const loading = ref(false)
const error = ref<string | undefined>(undefined)
const timeseriesData = ref<TimeseriesDataPoint[]>([])
const mapContainer = ref<HTMLElement>()
const map = ref<L.Map>()
const markersLayer = ref<L.LayerGroup>()
const markers = ref<L.CircleMarker[]>([])
const currentFilters = ref<ChartRefreshPayload | null>(null)
const selectedMetric = ref<string>('speed')

// Load timeseries data from API
const loadTimeseriesData = async () => {
  if (loading.value) return
  if (!currentFilters.value) {
    return
  }

  loading.value = true
  error.value = undefined

  try {
    const response = await vehicleApi.getTimeseriesData({
      interval: "1m",
      startTime: currentFilters.value.startTime,
      endTime: currentFilters.value.endTime,
      vehicleId: currentFilters.value.vehicleId,
      limit: 100000,
      metrics: `${CSV_METRICS.LATITUDE_DEG},${CSV_METRICS.LONGITUDE_DEG},${CSV_METRICS.VEHICLE_SPEED_KMH},${CSV_METRICS.ENGINE_RPM},${CSV_METRICS.ENGINE_COOLANT_TEMP_C},${CSV_METRICS.THROTTLE_POSITION_DESIRED_PCT},${CSV_METRICS.ENGINE_FUEL_RATE_LH},${CSV_METRICS.ENGINE_POWER_PS},${CSV_METRICS.ENGINE_TORQUE_NM}`
    }, { reason: 'loadTimeseriesData', source: 'LeafletJourney' })
    timeseriesData.value = response.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load GPS data'
  } finally {
    loading.value = false
  }
}

// Extract GPS points from chart data (use CSV_METRICS constants, avoid hard-coded keys)
const gpsPoints = computed(() => {
  return timeseriesData.value
    .filter((point) => {
      const lat = point.measurements?.[CSV_METRICS.LATITUDE_DEG]
      const lng = point.measurements?.[CSV_METRICS.LONGITUDE_DEG]
      return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        lat !== 0 &&
        lng !== 0
      )
    })
    .map((point) => ({
      lat: point.measurements?.[CSV_METRICS.LATITUDE_DEG] as number,
      lng: point.measurements?.[CSV_METRICS.LONGITUDE_DEG] as number,
      timestamp: new Date(point.timestamp),
      speed: (point.measurements?.[CSV_METRICS.VEHICLE_SPEED_KMH] as number) || 0,
      rpm: (point.measurements?.[CSV_METRICS.ENGINE_RPM] as number) || 0,
      coolantTemp: (point.measurements?.[CSV_METRICS.ENGINE_COOLANT_TEMP_C] as number) || 0,
      throttlePos: (point.measurements?.[CSV_METRICS.THROTTLE_POSITION_DESIRED_PCT] as number) || 0,
      fuelRate: (point.measurements?.[CSV_METRICS.ENGINE_FUEL_RATE_LH] as number) || 0,
      enginePower: (point.measurements?.[CSV_METRICS.ENGINE_POWER_PS] as number) || 0,
      engineTorque: (point.measurements?.[CSV_METRICS.ENGINE_TORQUE_NM] as number) || 0,
      measurements: point.measurements || {}
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
})

const hasGpsData = computed(() => gpsPoints.value.length > 0)

const estimatedDistance = computed(() => {
  if (gpsPoints.value.length < 2) return 0

  let distance = 0
  for (let i = 1; i < gpsPoints.value.length; i++) {
    const p1 = gpsPoints.value[i - 1]
    const p2 = gpsPoints.value[i]
    distance += calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng)
  }

  return distance
})

const startTime = computed(() =>
  gpsPoints.value.length > 0
    ? gpsPoints.value[0].timestamp.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Bangkok', // GMT+7
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : '--'
)

const endTime = computed(() =>
  gpsPoints.value.length > 0
    ? gpsPoints.value[gpsPoints.value.length - 1].timestamp.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Bangkok', // GMT+7
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : '--'
)

// Calculate distance between two GPS points (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Calculate quartiles for a given array of values
const calculateQuartiles = (values: number[]) => {
  if (values.length === 0) return { min: 0, q1: 0, q2: 0, q3: 0, max: 0 }

  const sorted = [...values].sort((a, b) => a - b)
  const len = sorted.length

  const min = sorted[0]
  const max = sorted[len - 1]

  // Calculate quartile positions
  const q1Index = Math.floor(len * 0.25)
  const q2Index = Math.floor(len * 0.5)
  const q3Index = Math.floor(len * 0.75)

  const q1 = sorted[q1Index]
  const q2 = sorted[q2Index] // median
  const q3 = sorted[q3Index]

  return { min, q1, q2, q3, max }
}

// Static metric metadata (units and labels only)
const metricMetadata = {
  speed: { unit: 'km/h', label: 'Vehicle Speed' },
  rpm: { unit: 'RPM', label: 'Engine RPM' },
  throttle: { unit: '%', label: 'Throttle Position' },
  coolant: { unit: '°C', label: 'Coolant Temperature' },
  fuelRate: { unit: 'L/h', label: 'Fuel Rate' },
  power: { unit: 'PS', label: 'Engine Power' },
  torque: { unit: 'N•m', label: 'Engine Torque' }
}

// Get values for the currently selected metric from GPS points
const getMetricValues = (metric: string): number[] => {
  if (gpsPoints.value.length === 0) return []

  switch (metric) {
    case 'speed': return gpsPoints.value.map(p => p.speed).filter(v => v != null)
    case 'rpm': return gpsPoints.value.map(p => p.rpm).filter(v => v != null)
    case 'throttle': return gpsPoints.value.map(p => p.throttlePos).filter(v => v != null)
    case 'coolant': return gpsPoints.value.map(p => p.coolantTemp).filter(v => v != null)
    case 'fuelRate': return gpsPoints.value.map(p => p.fuelRate).filter(v => v != null)
    case 'power': return gpsPoints.value.map(p => p.enginePower).filter(v => v != null)
    case 'torque': return gpsPoints.value.map(p => p.engineTorque).filter(v => v != null)
    default: return []
  }
}

// Dynamic metric configuration for currently selected metric only
const currentMetricConfig = computed(() => {
  const metadata = metricMetadata[selectedMetric.value as keyof typeof metricMetadata]

  if (gpsPoints.value.length === 0) {
    // Return default config when no data
    return { min: 0, q1: 0, q2: 0, q3: 0, max: 0, ...metadata }
  }

  // Get values for currently selected metric only
  const values = getMetricValues(selectedMetric.value)

  // Calculate dynamic quartiles for the selected metric
  return { ...calculateQuartiles(values), ...metadata }
})

// Dynamic legend based on selected metric
const legendTitle = computed(() => {
  return `${currentMetricConfig.value.label} Color Legend`
})

const legendRanges = computed(() => {
  const config = currentMetricConfig.value
  return {
    veryLow: `${config.min?.toFixed(1)}-${config.q1?.toFixed(1)} ${config.unit}`,
    low: `${config.q1?.toFixed(1)}-${config.q2?.toFixed(1)} ${config.unit}`,
    mid: `${config.q2?.toFixed(1)}-${config.q3?.toFixed(1)} ${config.unit}`,
    high: `${config.q3?.toFixed(1)}-${config.max?.toFixed(1)} ${config.unit}`
  }
})

// Get the value for the selected metric from a data point
const getMetricValue = (point: TimeseriesDataPoint): number => {
  switch (selectedMetric.value) {
    case 'speed': return point.speed || 0
    case 'rpm': return point.rpm || 0
    case 'throttle': return point.throttlePos || 0
    case 'coolant': return point.coolantTemp || 0
    case 'fuelRate': return point.fuelRate || 0
    case 'power': return point.enginePower || 0
    case 'torque': return point.engineTorque || 0
    default: return 0
  }
}

// Get color based on metric value (4-bucket segmentation: green -> lime -> yellow -> red)
const getMetricColor = (value: number): string => {
  const config = currentMetricConfig.value
  const { min, q1, q2, q3, max } = config

  // Handle edge cases with insufficient data or equal quartiles
  if (min === max || q1 === q2 || q2 === q3 || q3 === max) {
    return '#64748b' // slate-500 for insufficient data variation
  }

  if (value <= min) {
    return '#10b981' // emerald-500 - very low values
  } else if (value <= q1) {
    // Gradient from emerald to lime (green)
    const ratio = (value - min) / (q1 - min)
    const r = Math.round(16 + (132 - 16) * ratio) // 10 -> 84
    const g = Math.round(185 + (204 - 185) * ratio) // b9 -> cc
    const b = Math.round(129 + (22 - 129) * ratio) // 81 -> 16
    return `rgb(${r}, ${g}, ${b})`
  } else if (value <= q2) {
    // Gradient from lime to yellow
    const ratio = (value - q1) / (q2 - q1)
    const r = Math.round(132 + (234 - 132) * ratio) // 84 -> ea
    const g = Math.round(204 + (179 - 204) * ratio) // cc -> b3
    const b = Math.round(22 + (8 - 22) * ratio) // 16 -> 08
    return `rgb(${r}, ${g}, ${b})`
  } else if (value <= q3) {
    // Gradient from yellow to orange
    const ratio = (value - q2) / (q3 - q2)
    const r = Math.round(234 + (249 - 234) * ratio) // ea -> f9
    const g = Math.round(179 + (115 - 179) * ratio) // b3 -> 73
    const b = Math.round(8 + (44 - 8) * ratio) // 08 -> 2c
    return `rgb(${r}, ${g}, ${b})`
  } else if (value <= max) {
    // Gradient from orange to red
    const ratio = (value - q3) / (max - q3)
    const r = Math.round(249 + (239 - 249) * ratio) // f9 -> ef
    const g = Math.round(115 + (68 - 115) * ratio) // 73 -> 44
    const b = Math.round(44 + (68 - 44) * ratio) // 2c -> 44
    return `rgb(${r}, ${g}, ${b})`
  } else {
    return '#ef4444' // red-500 for values above max
  }
}

// Create tooltip content for a datapoint
const createTooltipContent = (point: TimeseriesDataPoint): string => {
  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return '--'
    return value.toFixed(1)
  }

  // Build list of measurements to display
  const measurementItems: string[] = []

  // Loop through all measurements and display them with their original keys
  if (point.measurements) {
    Object.entries(point.measurements).forEach(([key, value]) => {
      // Skip latitude and longitude as they're already shown on the map
      if (key !== CSV_METRICS.LATITUDE_DEG && key !== CSV_METRICS.LONGITUDE_DEG) {
        measurementItems.push(`<div>${key}: <span class="text-blue-300">${formatValue(value as number)}</span></div>`)
      }
    })
  }

  return `
    <div class="text-xs space-y-1">
      <div class="text-slate-300 font-medium mb-2">
        ${formatLocalDateTime(point.timestamp)}
      </div>
      <div class="space-y-1">
        ${measurementItems.join('')}
      </div>
    </div>
  `
}

const initializeMap = () => {
  if (!mapContainer.value || !hasGpsData.value) return

  // Clean up existing map if it exists
  if (map.value) {
    map.value.remove()
    map.value = undefined
  }

  const points = gpsPoints.value
  if (points.length === 0) return

  // Create map centered on first GPS point
  map.value = L.map(mapContainer.value).setView([points[0].lat, points[0].lng], 13)

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value)

  // Create markers layer
  markersLayer.value = L.layerGroup().addTo(map.value)

  createMarkers()
}

const createMarkers = () => {
  if (!map.value || !hasGpsData.value) return

  const points = gpsPoints.value

  // Clear existing markers
  if (markersLayer.value) {
    markersLayer.value.clearLayers()
  }
  markers.value = []

  // Add a circle marker for each data point
  points.forEach((p, index) => {
    const metricValue = getMetricValue(p)
    const markerColor = getMetricColor(metricValue)
    const marker = L.circleMarker([p.lat, p.lng], {
      radius: 4,
      color: markerColor,
      weight: 1,
      fillColor: markerColor,
      fillOpacity: 0.8
    })

    // Bind popup when creating marker (not on click)
    const timeseriesPoint = {
      timestamp: p.timestamp,
      measurements: p.measurements
    }
    const tooltipContent = createTooltipContent(timeseriesPoint)
    marker.bindPopup(tooltipContent, {
      maxWidth: 300,
      className: 'measurement-popup',
      closeOnClick: true,
      autoClose: true
    })

    marker.addTo(markersLayer.value!)
    markers.value.push(marker)
  })

  // Fit map to points bounds
  if (points.length > 0) {
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]) as [number, number][])
    map.value.fitBounds(bounds, { padding: [10, 10] })
  }
}

const updateMarkerColors = () => {
  if (!hasGpsData.value || markers.value.length === 0) return

  const points = gpsPoints.value

  // Update colors of existing markers
  points.forEach((p, index) => {
    if (index < markers.value.length) {
      const metricValue = getMetricValue(p)
      const markerColor = getMetricColor(metricValue)
      const marker = markers.value[index]
      
      // Update marker color
      marker.setStyle({
        color: markerColor,
        fillColor: markerColor
      })
    }
  })
}

// Watch for GPS points changes to recreate markers
watch(
  () => gpsPoints.value,
  (newPoints) => {
    if (newPoints.length > 0) {
      if (!map.value) {
        // Initialize map if it doesn't exist
        nextTick(() => {
          initializeMap()
        })
      } else {
        // Recreate markers when GPS points change
        createMarkers()
      }
    }
  },
  { immediate: true }
)

// Watch for metric changes to update colors only
watch(
  () => selectedMetric.value,
  () => {
    // Only update colors if markers already exist and we have GPS data
    if (markers.value.length > 0 && hasGpsData.value) {
      updateMarkerColors()
    }
  }
)

// Listen to refresh event from event bus with filter payload
refreshChartsEvent.on((payload) => {
  if (!payload) return

  currentFilters.value = payload
  loadTimeseriesData().then(() => {
    if (hasGpsData.value && !map.value) {
      initializeMap()
    }
  })
})
</script>

<style scoped>
:deep(.leaflet-container) {
  background: #1e293b !important;
}

:deep(.leaflet-tile) {
  filter: brightness(0.8) contrast(1.2) saturate(0.8);
}

:deep(.leaflet-popup-content-wrapper) {
  background: rgba(15, 23, 42, 0.95) !important;
  color: #e2e8f0 !important;
  border-radius: 8px !important;
  border: 1px solid #475569 !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
}

:deep(.leaflet-popup-tip) {
  background: rgba(15, 23, 42, 0.95) !important;
}

:deep(.leaflet-popup-close-button) {
  color: #94a3b8 !important;
  font-size: 18px !important;
  font-weight: bold !important;
}

:deep(.leaflet-popup-close-button:hover) {
  color: #e2e8f0 !important;
}

:deep(.measurement-popup .leaflet-popup-content-wrapper) {
  background: rgba(15, 23, 42, 0.98) !important;
  border: 1px solid #64748b !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
  min-width: 200px !important;
}

:deep(.measurement-popup .leaflet-popup-content) {
  margin: 12px 16px !important;
  max-width: 280px !important;
  font-size: 12px !important;
  line-height: 1.4 !important;
}
</style>