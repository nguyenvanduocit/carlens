<template>
  <div class="flex items-center space-x-2">
    <span class="text-sm text-slate-400">Interval:</span>
    <div class="flex space-x-1 bg-slate-700/50 rounded-lg p-1">
      <button
        v-for="option in intervalOptions"
        :key="option.value"
        @click="$emit('update:modelValue', option.value)"
        :class="[
          'px-3 py-1.5 text-sm font-medium rounded transition-all',
          modelValue === option.value
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-slate-600'
        ]"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
export type DataInterval = '1m' | '5m' | '15m' | '30m' | '1h'

interface Props {
  modelValue: DataInterval
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: DataInterval]
}>()

const intervalOptions = [
  { value: '1m' as DataInterval, label: '1m' },
  { value: '5m' as DataInterval, label: '5m' },
  { value: '15m' as DataInterval, label: '15m' },
  { value: '30m' as DataInterval, label: '30m' },
  { value: '1h' as DataInterval, label: '1h' }
]
</script>