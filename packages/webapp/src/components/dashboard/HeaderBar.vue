<template>
  <div
    class="flex items-center justify-between mb-4 p-3 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50">
    <div class="flex items-center">
      <h1 class="text-xl font-bold text-white">{{ title }}</h1>
    </div>
    <div class="flex items-center gap-2">
      <slot name="controls"></slot>
      <button
        @click="handleApply"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 font-medium">
        Apply
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Header shows only title and controls slot

interface Props {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Vehicle Analytics Dashboard'
})

const emit = defineEmits<{
  refresh: []
}>()

const handleApply = () => {
  emit('refresh')
}
</script>