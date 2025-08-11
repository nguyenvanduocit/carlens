<template>
  <div class="space-y-6">
    <!-- ML Model Status Card -->
    <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white flex items-center gap-2">
          <Brain class="w-5 h-5 text-purple-400" />
          ML Optimization Engine
        </h3>
        <div class="flex items-center gap-2">
          <div :class="statusBadgeClass" class="px-3 py-1 rounded-full text-xs font-medium">
            {{ statusText }}
          </div>
        </div>
      </div>

      <!-- Training Progress -->
      <div v-if="isTraining" class="mb-4">
        <div class="flex justify-between text-sm text-slate-400 mb-2">
          <span>Training Neural Network...</span>
          <span>{{ trainingProgress }}%</span>
        </div>
        <div class="w-full bg-slate-700 rounded-full h-2">
          <div 
            class="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${trainingProgress}%` }"
          />
        </div>
      </div>

      <!-- Model Info -->
      <div v-if="mlResult?.model.trained" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-slate-700/30 rounded p-3">
          <div class="text-xs text-slate-400">Model Accuracy</div>
          <div class="text-lg font-semibold text-green-300">
            {{ (mlResult.model.accuracy * 100).toFixed(1) }}%
          </div>
        </div>
        <div class="bg-slate-700/30 rounded p-3">
          <div class="text-xs text-slate-400">Features Used</div>
          <div class="text-lg font-semibold text-blue-300">
            {{ mlResult.model.features.length }}
          </div>
        </div>
        <div class="bg-slate-700/30 rounded p-3">
          <div class="text-xs text-slate-400">Confidence Score</div>
          <div class="text-lg font-semibold text-yellow-300">
            {{ (mlResult.confidence * 100).toFixed(1) }}%
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          @click="handleTrainModel"
          :disabled="isTraining || !hasEnoughData"
          class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
        >
          <RefreshCw v-if="isTraining" class="w-4 h-4 animate-spin inline mr-2" />
          {{ isTraining ? 'Training...' : mlResult?.model.trained ? 'Retrain Model' : 'Train Model' }}
        </button>
        
        <button
          @click="handleOptimize"
          :disabled="isOptimizing || !latestData"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
        >
          <Zap class="w-4 h-4 inline mr-2" />
          {{ isOptimizing ? 'Optimizing...' : 'Find Optimal RPM' }}
        </button>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="mt-4 p-3 bg-red-900/20 border border-red-700/50 rounded text-red-300 text-sm">
        {{ error }}
      </div>
    </div>

    <!-- ML Optimization Results -->
    <div v-if="mlResult" class="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
      <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Target class="w-5 h-5 text-green-400" />
        ML Optimization Results
      </h4>

      <!-- Optimal RPM Display -->
      <div class="mb-6">
        <div class="text-center p-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-lg border border-green-700/30">
          <div class="text-4xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
            {{ Math.round(mlResult.optimalRpm) }} RPM
          </div>
          <div class="text-sm text-slate-400 mt-2">
            Neural Network Predicted Optimal Engine Speed
          </div>
        </div>
      </div>

      <!-- Predicted Efficiency -->
      <div class="mb-6">
        <div class="flex justify-between text-sm text-slate-400 mb-2">
          <span>Predicted Fuel Efficiency</span>
          <span class="text-green-300 font-semibold">
            {{ mlResult.predictedFuelEfficiency.toFixed(2) }} km/L
          </span>
        </div>
        <div class="text-xs text-slate-500">
          Equivalent to {{ (100 / mlResult.predictedFuelEfficiency).toFixed(2) }} L/100km
        </div>
      </div>

      <!-- Recommendations -->
      <div class="space-y-3">
        <h5 class="text-sm font-medium text-slate-300">AI Recommendations</h5>
        
        <div class="bg-slate-700/30 rounded p-3">
          <div class="flex items-start gap-2">
            <Gauge class="w-4 h-4 text-blue-400 mt-0.5" />
            <div>
              <div class="text-sm text-slate-200">Efficient RPM Range</div>
              <div class="text-xs text-slate-400">
                Keep engine between {{ mlResult.recommendations.rpmRange[0] }} - {{ mlResult.recommendations.rpmRange[1] }} RPM
              </div>
            </div>
          </div>
        </div>

        <div v-if="mlResult.recommendations.shiftPoint" class="bg-slate-700/30 rounded p-3">
          <div class="flex items-start gap-2">
            <ArrowUp class="w-4 h-4 text-yellow-400 mt-0.5" />
            <div>
              <div class="text-sm text-slate-200">Optimal Shift Point</div>
              <div class="text-xs text-slate-400">
                Shift to next gear at {{ mlResult.recommendations.shiftPoint }} RPM
              </div>
            </div>
          </div>
        </div>

        <div class="bg-slate-700/30 rounded p-3">
          <div class="flex items-start gap-2">
            <Activity class="w-4 h-4 text-green-400 mt-0.5" />
            <div>
              <div class="text-sm text-slate-200">Target Speed</div>
              <div class="text-xs text-slate-400">
                Maintain speed around {{ mlResult.recommendations.targetSpeed.toFixed(0) }} km/h for optimal efficiency
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Model Features -->
      <div class="mt-4 p-3 bg-slate-700/20 rounded">
        <div class="text-xs text-slate-400 mb-2">Neural Network Input Features:</div>
        <div class="flex flex-wrap gap-2">
          <span v-for="feature in mlResult.model.features" :key="feature"
            class="px-2 py-1 bg-slate-600/50 rounded text-xs text-slate-300">
            {{ feature }}
          </span>
        </div>
      </div>
    </div>

    <!-- Optimization Suggestions -->
    <div v-if="getOptimizationSuggestions" class="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
      <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Lightbulb class="w-5 h-5 text-yellow-400" />
        Real-Time Suggestions
      </h4>
      
      <div class="space-y-3">
        <div class="text-lg font-medium text-green-300">
          {{ getOptimizationSuggestions.primary }}
        </div>
        <div class="text-sm text-slate-400">
          {{ getOptimizationSuggestions.confidence }}
        </div>
        <ul class="space-y-2">
          <li v-for="(suggestion, index) in getOptimizationSuggestions.suggestions" 
              :key="index"
              class="flex items-start gap-2 text-sm text-slate-300">
            <ChevronRight class="w-4 h-4 text-slate-500 mt-0.5" />
            <span>{{ suggestion }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { 
  Brain, 
  Target, 
  Gauge, 
  ArrowUp, 
  Activity, 
  Lightbulb, 
  ChevronRight,
  Zap,
  RefreshCw
} from 'lucide-vue-next'
import { useMLOptimization } from '@/composables/useMLOptimization'
import { useApiVehicleData } from '@/composables/useApiVehicleData'

// Get vehicle data
const { data: vehicleData, latestData } = useApiVehicleData()

// ML Optimization composable
const {
  isTraining,
  isOptimizing,
  mlResult,
  error,
  trainingProgress,
  modelStatus,
  trainModel,
  findOptimalRpm,
  getOptimizationSuggestions
} = useMLOptimization()

// Computed properties
const hasEnoughData = computed(() => {
  return vehicleData.value && vehicleData.value.length >= 10
})

const statusBadgeClass = computed(() => {
  switch (modelStatus.value) {
    case 'training':
      return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50'
    case 'ready':
      return 'bg-green-900/50 text-green-300 border border-green-700/50'
    default:
      return 'bg-slate-700 text-slate-400'
  }
})

const statusText = computed(() => {
  switch (modelStatus.value) {
    case 'training':
      return 'Training...'
    case 'ready':
      return 'Model Ready'
    default:
      return 'Not Trained'
  }
})

// Methods
const handleTrainModel = async () => {
  if (!vehicleData.value || vehicleData.value.length < 10) {
    error.value = 'Need at least 10 data points to train the model'
    return
  }
  
  await trainModel(vehicleData.value)
}

const handleOptimize = async () => {
  if (!latestData.value || !vehicleData.value) {
    error.value = 'No data available for optimization'
    return
  }
  
  await findOptimalRpm(latestData.value, vehicleData.value)
}

// Auto-train on mount if we have enough data
onMounted(() => {
  if (hasEnoughData.value && modelStatus.value === 'untrained') {
    // Auto-train after a short delay
    setTimeout(() => {
      handleTrainModel()
    }, 2000)
  }
})
</script>