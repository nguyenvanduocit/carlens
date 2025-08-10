<template>
  <div class="w-full">
    <!-- Metric Selection Controls -->
    <div class="mb-4">
      <div v-if="!currentFilters" class="text-slate-400 text-sm mb-2">
        Waiting for filter configuration...
      </div>
      <div v-else class="flex flex-wrap gap-2">
        <button v-for="(name, key) in CSV_METRICS" :key="key" @click="toggleMetric(name)" :class="[
          'px-3 py-1 rounded text-sm transition-all',
          selectedMetrics.includes(name)
            ? 'bg-blue-500 text-white'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        ]">
          {{ name }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="text-slate-400">Loading multi-metric data...</div>
    </div>

    <div v-else-if="error" class="text-red-400 text-sm py-4">
      Error loading data: {{ error }}
    </div>

    <div v-else>
      <v-chart ref="chartRef" :option="chartOption" :style="{ height: '600px', width: '100%' }" autoresize
        @click="handleChartClick" @zr:click="handleChartClick" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useChartEventBus, type ChartRefreshPayload } from '@/composables/useChartEventBus'
import { useDataPointEventBus } from '@/composables/useDataPointEventBus'
import { vehicleApi } from '@/api/vehicleApi'
import { CSV_METRICS, type TimeseriesDataPoint } from '@carlens/shared-types'
import { formatChartTime, formatChartAxisTime } from '@/utils/timezone'

use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  CanvasRenderer
])

const refreshChartsEvent = useChartEventBus()
const dataPointEvent = useDataPointEventBus()
const loading = ref(false)
const error = ref<string | undefined>(undefined)
const timeseriesData = ref<TimeseriesDataPoint[]>([])
const chartRef = ref()
const currentFilters = ref<ChartRefreshPayload | null>(null)

// State for metrics
const selectedMetrics = ref<string[]>([CSV_METRICS.VEHICLE_SPEED_KMH])

const toggleMetric = (metricKey: string) => {
  const index = selectedMetrics.value.indexOf(metricKey)
  if (index > -1) {
    selectedMetrics.value.splice(index, 1)
  } else {
    // Limit to max 8 metrics to avoid chart overcrowding
    if (selectedMetrics.value.length < 8) {
      selectedMetrics.value.push(metricKey)
    }
  }
  // Fetch immediately on user action when filters are set
  if (currentFilters.value && selectedMetrics.value.length > 0) {
    loadTimeseriesData()
  }
}

// Load timeseries data from API
const loadTimeseriesData = async () => {
  if (loading.value) return
  if (!currentFilters.value || selectedMetrics.value.length === 0) {
    return
  }

  loading.value = true
  error.value = undefined

  try {
    const response = await vehicleApi.getTimeseriesData({
      startTime: currentFilters.value.startTime,
      endTime: currentFilters.value.endTime,
      vehicleId: currentFilters.value.vehicleId,
      metrics: selectedMetrics.value.join(','),
      interval: currentFilters.value.interval
    }, { reason: 'loadTimeseriesData', source: 'MultiMetricLineChart', details: { selectedMetrics: [...selectedMetrics.value] } })
    timeseriesData.value = response.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load chart data'
  } finally {
    loading.value = false
  }
}

// Listen to refresh event from event bus with filter payload
refreshChartsEvent.on((payload) => {
  if (!payload) return

  currentFilters.value = payload

  if (selectedMetrics.value.length > 0) {
    loadTimeseriesData()
  }
})

// Prepare chart series data
const chartSeries = computed(() => {
  return selectedMetrics.value.map(metricKey => {
    const data = timeseriesData.value.map(point => {
      // Use the metric key directly since it's now the full CSV metric name
      const value = point.measurements?.[metricKey] || 0
      return [new Date(point.timestamp).getTime(), value]
    }).filter(([, value]) => value !== null && value !== undefined)

    // Use display name for series name to match legend
    const displayName = metricKey in CSV_METRICS ? CSV_METRICS[metricKey as keyof typeof CSV_METRICS] : metricKey

    return {
      name: displayName,
      type: 'line',
      data: data,
      smooth: true,
      symbol: 'none',
      lineStyle: {
        width: 2
      },
      emphasis: {
        focus: 'series'
      }
    }
  }).filter(Boolean)
})

const chartOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: '#475569',
    textStyle: {
      color: '#e2e8f0'
    },
    formatter: (params: any) => {
      if (!params || params.length === 0) return ''
      const time = formatChartTime(params[0].value[0])
      let content = `<div style="font-size: 13px;">
        <div style="margin-bottom: 4px; font-weight: 600;">Multi-Metric Data</div>
        <div>Time: ${time}</div>`

      params.forEach((param: any) => {
        const value = param.value[1].toFixed(1)
        content += `<div>${param.seriesName}: ${value}</div>`
      })

      content += '</div>'
      return content
    }
  },
  legend: {
    data: selectedMetrics.value.map(key => key in CSV_METRICS ? CSV_METRICS[key as keyof typeof CSV_METRICS] : key),
    textStyle: {
      color: '#e2e8f0'
    },
    top: 10,
    type: 'scroll',
    orient: 'horizontal'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'time',
    boundaryGap: false,
    axisLine: {
      lineStyle: {
        color: '#475569'
      }
    },
    axisLabel: {
      color: '#94a3b8',
      formatter: (value: number) => {
        // Convert UTC timestamp back to GMT+7 for display
        const utcDate = new Date(value)
        return utcDate.toLocaleString('en-US', {
          timeZone: 'Asia/Bangkok', // GMT+7
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      }
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#334155',
        type: 'dashed'
      }
    }
  },
  yAxis: {
    type: 'value',
    name: 'Multiple Metrics',
    nameTextStyle: {
      color: '#94a3b8'
    },
    axisLine: {
      lineStyle: {
        color: '#475569'
      }
    },
    axisLabel: {
      color: '#94a3b8'
    },
    splitLine: {
      lineStyle: {
        color: '#334155',
        type: 'dashed'
      }
    }
  },
  dataZoom: [
    {
      type: 'inside',
      xAxisIndex: 0,
      filterMode: 'filter',
      zoomOnMouseWheel: false,  // Disable mouse wheel zoom
      moveOnMouseMove: true,     // Enable panning by dragging
      moveOnMouseWheel: true,   // Disable moving with mouse wheel
      preventDefaultMouseMove: true
    },
    {
      type: 'slider',
      xAxisIndex: 0,
      bottom: '5%',
      height: 20,
      handleStyle: {
        color: '#6366f1'
      },
      textStyle: {
        color: '#94a3b8'
      },
      borderColor: '#475569',
      fillerColor: 'rgba(99, 102, 241, 0.2)',
      backgroundColor: 'rgba(15, 23, 42, 0.5)'
    }
  ],
  series: chartSeries.value
}))

// Handle chart click events
const handleChartClick = (params: any) => {
  console.log('[MultiMetricLineChart] Chart zr:click event triggered:', params.data)
  dataPointEvent.emit({
    timestamp: ""
  })
}

// Note: We no longer watch metrics automatically to avoid duplicate loads
// Metrics will be loaded when the chart refresh event is received with payload
</script>
