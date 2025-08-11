import * as tf from '@tensorflow/tfjs'
import type { TimeseriesDataPoint } from '@carlens/shared-types'

export interface MLOptimizationResult {
  optimalRpm: number
  confidence: number
  predictedFuelEfficiency: number
  model: {
    trained: boolean
    accuracy: number
    features: string[]
  }
  recommendations: {
    rpmRange: [number, number]
    targetSpeed: number
    shiftPoint?: number
  }
}

export class MLOptimizationService {
  private model: tf.Sequential | null = null
  private isTraining = false
  private normalizers: {
    inputMean: tf.Tensor | null
    inputStd: tf.Tensor | null
    outputMean: tf.Tensor | null
    outputStd: tf.Tensor | null
  } = {
    inputMean: null,
    inputStd: null,
    outputMean: null,
    outputStd: null
  }

  /**
   * Train a neural network model to predict fuel efficiency based on vehicle parameters
   */
  async trainModel(dataPoints: TimeseriesDataPoint[]): Promise<void> {
    if (this.isTraining || dataPoints.length < 100) {
      console.warn('Insufficient data for training (need at least 100 points)')
      return
    }

    this.isTraining = true

    try {
      // Prepare training data
      const { features, labels, normalizers } = this.prepareTrainingData(dataPoints)
      this.normalizers = normalizers

      // Create model architecture
      this.model = tf.sequential({
        layers: [
          // Input layer with 6 features
          tf.layers.dense({
            inputShape: [6],
            units: 32,
            activation: 'relu',
            kernelInitializer: 'heNormal'
          }),
          // Hidden layers with dropout for regularization
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 16,
            activation: 'relu',
            kernelInitializer: 'heNormal'
          }),
          tf.layers.dropout({ rate: 0.1 }),
          tf.layers.dense({
            units: 8,
            activation: 'relu',
            kernelInitializer: 'heNormal'
          }),
          // Output layer for fuel efficiency prediction
          tf.layers.dense({
            units: 1,
            activation: 'linear'
          })
        ]
      })

      // Compile model with optimizer
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae', 'mse']
      })

      // Train the model
      const history = await this.model.fit(features, labels, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0 && logs) {
              console.log(`Epoch ${epoch}: loss = ${logs.loss?.toFixed(4)}, mae = ${logs.mae?.toFixed(4)}`)
            }
          }
        }
      })

      // Clean up tensors
      features.dispose()
      labels.dispose()

      console.log('Model training completed', history)
    } finally {
      this.isTraining = false
    }
  }

  /**
   * Prepare and normalize training data
   */
  private prepareTrainingData(dataPoints: TimeseriesDataPoint[]) {
    // Filter valid data points
    const validData = dataPoints.filter(point => 
      point.rpm > 0 &&
      point.speed > 0 &&
      point.fuelRate > 0 &&
      point.engineLoad > 0 &&
      point.power > 0
    )

    // Extract features: [rpm, speed, load, throttle, intakePressure, coolantTemp]
    const featuresArray = validData.map(point => [
      point.rpm,
      point.speed,
      point.engineLoad,
      point.throttle,
      point.intakePressure || 100,
      point.coolantTemp || 90
    ])

    // Calculate fuel efficiency (km/L) as label
    const labelsArray = validData.map(point => {
      const kmPerHour = point.speed
      const litersPerHour = point.fuelRate
      return litersPerHour > 0 ? [kmPerHour / litersPerHour] : [0]
    })

    // Convert to tensors
    const features = tf.tensor2d(featuresArray)
    const labels = tf.tensor2d(labelsArray)

    // Normalize features using z-score normalization
    const inputMean = features.mean(0)
    const inputStd = features.sub(inputMean).square().mean(0).sqrt().add(1e-7)
    const normalizedFeatures = features.sub(inputMean).div(inputStd)

    // Normalize labels
    const outputMean = labels.mean(0)
    const outputStd = labels.sub(outputMean).square().mean(0).sqrt().add(1e-7)
    const normalizedLabels = labels.sub(outputMean).div(outputStd)

    // Clean up intermediate tensors
    features.dispose()
    labels.dispose()

    return {
      features: normalizedFeatures,
      labels: normalizedLabels,
      normalizers: {
        inputMean,
        inputStd,
        outputMean,
        outputStd
      }
    }
  }

  /**
   * Find optimal RPM using the trained model
   */
  async findOptimalRpm(
    currentData: TimeseriesDataPoint,
    historicalData: TimeseriesDataPoint[]
  ): Promise<MLOptimizationResult> {
    // Train model if not already trained
    if (!this.model && historicalData.length >= 100) {
      await this.trainModel(historicalData)
    }

    if (!this.model || !this.normalizers.inputMean) {
      // Fallback to statistical analysis if model not available
      return this.statisticalOptimization(historicalData)
    }

    // Create RPM range to test (500 to 4000 in steps of 100)
    const rpmRange: number[] = []
    for (let rpm = 500; rpm <= 4000; rpm += 100) {
      rpmRange.push(rpm)
    }

    // Prepare test data with current conditions but different RPMs
    const testData = rpmRange.map(rpm => [
      rpm,
      currentData.speed,
      currentData.engineLoad,
      currentData.throttle,
      currentData.intakePressure || 100,
      currentData.coolantTemp || 90
    ])

    // Normalize and predict
    const testTensor = tf.tensor2d(testData)
    const normalizedTest = testTensor
      .sub(this.normalizers.inputMean!)
      .div(this.normalizers.inputStd!)

    const predictions = this.model.predict(normalizedTest) as tf.Tensor
    const denormalizedPredictions = predictions
      .mul(this.normalizers.outputStd!)
      .add(this.normalizers.outputMean!)

    // Find optimal RPM (highest predicted efficiency)
    const efficiencyValues = await denormalizedPredictions.array() as number[][]
    let maxEfficiency = -Infinity
    let optimalRpm = currentData.rpm
    let optimalIndex = 0

    efficiencyValues.forEach((value, index) => {
      const efficiency = value[0]
      if (efficiency > maxEfficiency) {
        maxEfficiency = efficiency
        optimalRpm = rpmRange[index]
        optimalIndex = index
      }
    })

    // Calculate confidence based on prediction variance
    const mean = efficiencyValues.reduce((sum, val) => sum + val[0], 0) / efficiencyValues.length
    const variance = efficiencyValues.reduce((sum, val) => sum + Math.pow(val[0] - mean, 2), 0) / efficiencyValues.length
    const confidence = Math.max(0, Math.min(1, 1 - (Math.sqrt(variance) / mean)))

    // Find optimal RPM range (within 90% of max efficiency)
    const threshold = maxEfficiency * 0.9
    const efficientRpmRange = rpmRange.filter((_rpm, i) => efficiencyValues[i][0] >= threshold)
    
    // Clean up tensors
    testTensor.dispose()
    normalizedTest.dispose()
    predictions.dispose()
    denormalizedPredictions.dispose()

    return {
      optimalRpm,
      confidence,
      predictedFuelEfficiency: maxEfficiency,
      model: {
        trained: true,
        accuracy: confidence,
        features: ['rpm', 'speed', 'load', 'throttle', 'intakePressure', 'coolantTemp']
      },
      recommendations: {
        rpmRange: [Math.min(...efficientRpmRange), Math.max(...efficientRpmRange)] as [number, number],
        targetSpeed: currentData.speed,
        shiftPoint: this.calculateShiftPoint(optimalRpm, currentData.gear || 1)
      }
    }
  }

  /**
   * Fallback statistical optimization when ML model is not available
   */
  private statisticalOptimization(dataPoints: TimeseriesDataPoint[]): MLOptimizationResult {
    if (dataPoints.length === 0) {
      return {
        optimalRpm: 2000,
        confidence: 0,
        predictedFuelEfficiency: 0,
        model: {
          trained: false,
          accuracy: 0,
          features: []
        },
        recommendations: {
          rpmRange: [1500, 2500],
          targetSpeed: 60
        }
      }
    }

    // Calculate fuel efficiency for each data point
    const efficiencyData = dataPoints
      .filter(point => point.fuelRate > 0 && point.speed > 0)
      .map(point => ({
        rpm: point.rpm,
        efficiency: point.speed / point.fuelRate
      }))

    if (efficiencyData.length === 0) {
      return {
        optimalRpm: 2000,
        confidence: 0,
        predictedFuelEfficiency: 0,
        model: {
          trained: false,
          accuracy: 0,
          features: []
        },
        recommendations: {
          rpmRange: [1500, 2500],
          targetSpeed: 60
        }
      }
    }

    // Group by RPM ranges (buckets of 100 RPM)
    const rpmBuckets = new Map<number, number[]>()
    efficiencyData.forEach(({ rpm, efficiency }) => {
      const bucket = Math.round(rpm / 100) * 100
      if (!rpmBuckets.has(bucket)) {
        rpmBuckets.set(bucket, [])
      }
      rpmBuckets.get(bucket)!.push(efficiency)
    })

    // Find bucket with highest median efficiency
    let optimalRpm = 2000
    let maxMedianEfficiency = 0
    
    rpmBuckets.forEach((efficiencies, rpm) => {
      if (efficiencies.length >= 5) { // Need enough samples
        const sorted = [...efficiencies].sort((a, b) => a - b)
        const median = sorted[Math.floor(sorted.length / 2)]
        if (median > maxMedianEfficiency) {
          maxMedianEfficiency = median
          optimalRpm = rpm
        }
      }
    })

    // Calculate confidence based on data quality
    const dataPointsInOptimalRange = efficiencyData.filter(
      d => Math.abs(d.rpm - optimalRpm) <= 200
    ).length
    const confidence = Math.min(1, dataPointsInOptimalRange / 50)

    return {
      optimalRpm,
      confidence,
      predictedFuelEfficiency: maxMedianEfficiency,
      model: {
        trained: false,
        accuracy: confidence,
        features: ['statistical_analysis']
      },
      recommendations: {
        rpmRange: [optimalRpm - 200, optimalRpm + 200] as [number, number],
        targetSpeed: 60
      }
    }
  }

  /**
   * Calculate recommended shift point based on optimal RPM
   */
  private calculateShiftPoint(optimalRpm: number, currentGear: number): number {
    // Typical shift points relative to optimal RPM
    const shiftMultiplier = 1.3 + (currentGear * 0.1)
    return Math.round(optimalRpm * shiftMultiplier)
  }

  /**
   * Dispose of model and tensors
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose()
      this.model = null
    }
    
    Object.values(this.normalizers).forEach(tensor => {
      if (tensor) tensor.dispose()
    })
    
    this.normalizers = {
      inputMean: null,
      inputStd: null,
      outputMean: null,
      outputStd: null
    }
  }
}

// Singleton instance
export const mlOptimizationService = new MLOptimizationService()