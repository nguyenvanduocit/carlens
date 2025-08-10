<template>
  <div class="flex items-center space-x-4">
    <!-- Date Range Selector -->
    <Popover>
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          :class="cn(
            'w-[280px] justify-start text-left font-normal bg-slate-700 text-white border-slate-600 hover:bg-slate-600',
            !value && 'text-muted-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )"
          :disabled="disabled"
        >
          <CalendarIcon class="mr-2 h-4 w-4" />
          <template v-if="value?.start">
            <template v-if="value?.end">
              {{ df.format(value.start.toDate('Asia/Bangkok')) }} - {{ df.format(value.end.toDate('Asia/Bangkok')) }}
            </template>
            <template v-else>
              {{ df.format(value.start.toDate('Asia/Bangkok')) }}
            </template>
          </template>
          <template v-else>
            Pick a date range
          </template>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0">
        <RangeCalendar 
          v-model="value" 
          initial-focus 
          :number-of-months="2"
          :min-value="minDate"
          :max-value="maxDate"
        />
      </PopoverContent>
    </Popover>

    <!-- Quick Range Buttons -->
    <div class="flex space-x-2">
      <button
        @click="setQuickRange(1)"
        class="px-3 py-2 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-500 transition-colors"
      >
        Today
      </button>
      <button
        @click="setQuickRange(7)"
        class="px-3 py-2 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-500 transition-colors"
      >
        Last 7 Days
      </button>
      <button
        @click="setQuickRange(30)"
        class="px-3 py-2 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-500 transition-colors"
      >
        Last 30 Days
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { DayLogInfo } from '@/types/obd'
import type { DateRange } from 'reka-ui'
import type { Ref } from 'vue'
import {
  CalendarDate,
  DateFormatter,
  parseZonedDateTime,
  type DateValue,
} from '@internationalized/date'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RangeCalendar } from '@/components/ui/range-calendar'

interface Props {
  dayLogs: DayLogInfo[]
  disabled?: boolean
  modelValue?: {
    startDate?: string
    endDate?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  modelValue: () => ({})
})

const emit = defineEmits<{
  'update:modelValue': [value: {
    startDate?: string
    endDate?: string
  }]
}>()

const df = new DateFormatter('en-US', {
  dateStyle: 'medium',
})

// Convert string dates to CalendarDate objects
const stringToCalendarDate = (dateString: string): CalendarDate | undefined => {
  if (!dateString) return undefined
  const date = new Date(dateString)
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

// Convert DateValue to string format
const dateValueToString = (date: DateValue): string => {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
}

const value = ref<DateRange>({
  start: undefined,
  end: undefined,
}) as Ref<DateRange>

// Flag to prevent recursive updates
let isUpdating = false

const availableDateRange = computed(() => {
  if (!props.dayLogs || props.dayLogs.length === 0) {
    return { min: '', max: '' }
  }
  const dates = props.dayLogs.map(d => d.date).sort()
  return {
    min: dates[0],
    max: dates[dates.length - 1]
  }
})

const minDate = computed(() => {
  const min = availableDateRange.value.min
  return min ? stringToCalendarDate(min) : undefined
})

const maxDate = computed(() => {
  const max = availableDateRange.value.max
  return max ? stringToCalendarDate(max) : undefined
})

const emitChange = () => {
  if (isUpdating) return
  emit('update:modelValue', {
    startDate: value.value.start ? dateValueToString(value.value.start) : undefined,
    endDate: value.value.end ? dateValueToString(value.value.end) : undefined
  })
}

const setQuickRange = (days: number) => {
  const today = new Date()
  const startDateObj = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  
  value.value = {
    start: new CalendarDate(startDateObj.getFullYear(), startDateObj.getMonth() + 1, startDateObj.getDate()),
    end: new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  }
  emitChange()
}

// Watch for changes to modelValue to sync local state
watch(() => props.modelValue, (newValue) => {
  if (isUpdating) return
  if (newValue) {
    isUpdating = true
    value.value = {
      start: newValue.startDate ? stringToCalendarDate(newValue.startDate) : undefined,
      end: newValue.endDate ? stringToCalendarDate(newValue.endDate) : undefined
    }
    // Allow updates to flow again after a tick
    nextTick(() => {
      isUpdating = false
    })
  }
}, { immediate: true, deep: true })

// Watch for calendar value changes and emit with protection
watch(value, () => {
  emitChange()
}, { deep: true })
</script>