import { ref, computed, watch, onUnmounted } from 'vue'
import { mlOptimizationService, type MLOptimizationResult } from '@/services/ml-optimization'
import type { TimeseriesDataPoint } from '@carlens/shared-types'

export function useMLOptimization() {
  const isTraining = ref(false)
  const isOptimizing = ref(false)
  const mlResult = ref<MLOptimizationResult | null>(null)
  const error = ref<string | null>(null)
  const trainingProgress = ref(0)

  /**
   * Train the ML model with historical data
   */
  const trainModel = async (dataPoints: TimeseriesDataPoint[]) => {
    if (isTraining.value) return
    
    isTraining.value = true
    error.value = null
    trainingProgress.value = 0

    try {
      // Validate data
      if (!dataPoints || dataPoints.length < 100) {
        throw new Error('Need at least 100 data points for training')
      }

      // Start training
      await mlOptimizationService.trainModel(dataPoints)
      trainingProgress.value = 100
      
      console.log('ML model training completed successfully')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Training failed'
      console.error('ML training error:', err)
    } finally {
      isTraining.value = false
    }
  }

  /**
   * Find optimal RPM using ML model
   */
  const findOptimalRpm = async (
    currentData: TimeseriesDataPoint,
    historicalData: TimeseriesDataPoint[]
  ) => {
    if (isOptimizing.value) return
    
    isOptimizing.value = true
    error.value = null

    try {
      const result = await mlOptimizationService.findOptimalRpm(currentData, historicalData)
      mlResult.value = result
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Optimization failed'
      console.error('ML optimization error:', err)
      return null
    } finally {
      isOptimizing.value = false
    }
  }

  /**
   * Get real-time optimization suggestions
   */
  const getOptimizationSuggestions = computed(() => {
    if (!mlResult.value) return null

    const { optimalRpm, confidence, recommendations } = mlResult.value
    
    return {
      primary: `Optimal RPM: ${Math.round(optimalRpm)}`,
      confidence: `${(confidence * 100).toFixed(1)}% confidence`,
      suggestions: [
        `Keep RPM between ${recommendations.rpmRange[0]}-${recommendations.rpmRange[1]}`,
        recommendations.shiftPoint ? `Shift at ${recommendations.shiftPoint} RPM` : null,
        `Target speed: ${recommendations.targetSpeed.toFixed(0)} km/h`
      ].filter(Boolean)
    }
  })

  /**
   * Model training status
   */
  const modelStatus = computed(() => {
    if (isTraining.value) return 'training'
    if (mlResult.value?.model.trained) return 'ready'
    return 'untrained'
  })

  /**
   * Cleanup on unmount
   */
  onUnmounted(() => {
    // The service is a singleton, so we don't dispose it here
    // to allow reuse across components
  })

  return {
    // State
    isTraining,
    isOptimizing,
    mlResult,
    error,
    trainingProgress,
    modelStatus,
    
    // Methods
    trainModel,
    findOptimalRpm,
    
    // Computed
    getOptimizationSuggestions
  }
}