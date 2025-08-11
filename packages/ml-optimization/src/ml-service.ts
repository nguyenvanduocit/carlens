import * as tf from '@tensorflow/tfjs-node'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface VehicleDataPoint {
  timestamp: Date
  rpm: number
  speed: number
  fuelRate: number
  engineLoad: number
  power: number
  throttle: number
  intakePressure?: number
  coolantTemp?: number
  airFlow?: number
  gear?: number
}

export interface OptimizationResult {
  optimalRpm: number
  confidence: number
  predictedFuelEfficiency: number
  recommendations: {
    rpmRange: [number, number]
    targetSpeed: number
    shiftPoint?: number
  }
}

export class MLOptimizationService {
  private model: tf.LayersModel | null = null
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

  private readonly modelPath = join(__dirname, '../models/fuel-efficiency-model')
  private readonly normalizersPath = join(__dirname, '../models/normalizers.json')

  /**
   * Train the neural network model with vehicle data
   */
  async trainModel(dataPoints: VehicleDataPoint[]): Promise<void> {
    console.log(`🧠 Starting ML training with ${dataPoints.length} data points...`)

    // Filter valid data points
    const validData = dataPoints.filter(point => 
      point.rpm > 0 && 
      point.speed > 0 && 
      point.fuelRate > 0 && 
      point.engineLoad > 0 && 
      point.power > 0
    )

    if (validData.length < 100) {
      throw new Error(`Need at least 100 valid data points for training, got ${validData.length}`)
    }

    console.log(`✅ Using ${validData.length} valid data points for training`)

    // Prepare training data
    const { features, labels, normalizers } = await this.prepareTrainingData(validData)
    this.normalizers = normalizers

    // Create neural network model
    this.model = tf.sequential({
      layers: [
        // Input layer: [rpm, speed, load, throttle, intakePressure, coolantTemp]
        tf.layers.dense({
          inputShape: [6],
          units: 64,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        
        tf.layers.dense({
          units: 16,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.1 }),
        
        // Output layer: fuel efficiency prediction
        tf.layers.dense({
          units: 1,
          activation: 'linear'
        })
      ]
    })

    // Compile model
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    })

    console.log('📊 Model architecture:')
    this.model.summary()

    // Train the model
    console.log('🚀 Starting training...')
    const history = await this.model.fit(features, labels, {
      epochs: 100,
      batchSize: 32,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0 && logs) {
            console.log(`Epoch ${epoch + 1}/100: loss=${logs.loss?.toFixed(4)}, val_loss=${logs.val_loss?.toFixed(4)}, mae=${logs.mae?.toFixed(4)}`)
          }
        }
      }
    })

    // Clean up training tensors
    features.dispose()
    labels.dispose()

    console.log('💾 Saving trained model and normalizers...')
    await this.saveModel()

    // Get final metrics
    const finalLoss = history.history.loss[history.history.loss.length - 1] as number
    const finalValLoss = history.history.val_loss[history.history.val_loss.length - 1] as number
    const finalMae = history.history.mae[history.history.mae.length - 1] as number

    console.log('✅ Training completed!')
    console.log(`📈 Final metrics:`)
    console.log(`   - Training Loss: ${finalLoss.toFixed(4)}`)
    console.log(`   - Validation Loss: ${finalValLoss.toFixed(4)}`)
    console.log(`   - Mean Absolute Error: ${finalMae.toFixed(4)}`)
  }

  /**
   * Load saved model and normalizers
   */
  async loadModel(): Promise<boolean> {
    try {
      console.log('🔄 Loading saved model...')
      this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`)
      
      const normalizersData = await readFile(this.normalizersPath, 'utf-8')
      const normalizers = JSON.parse(normalizersData)
      
      // Recreate tensors from saved arrays
      this.normalizers = {
        inputMean: tf.tensor(normalizers.inputMean),
        inputStd: tf.tensor(normalizers.inputStd),
        outputMean: tf.tensor(normalizers.outputMean),
        outputStd: tf.tensor(normalizers.outputStd)
      }
      
      console.log('✅ Model and normalizers loaded successfully')
      return true
    } catch (error) {
      console.log('⚠️  No saved model found, need to train first')
      return false
    }
  }

  /**
   * Save model and normalizers to disk
   */
  private async saveModel(): Promise<void> {
    if (!this.model) throw new Error('No model to save')

    // Ensure models directory exists
    await mkdir(join(__dirname, '../models'), { recursive: true })

    // Save TensorFlow model
    await this.model.save(`file://${this.modelPath}`)

    // Save normalizers as JSON
    const normalizersData = {
      inputMean: await this.normalizers.inputMean?.array(),
      inputStd: await this.normalizers.inputStd?.array(),
      outputMean: await this.normalizers.outputMean?.array(),
      outputStd: await this.normalizers.outputStd?.array()
    }

    await writeFile(this.normalizersPath, JSON.stringify(normalizersData, null, 2))
  }

  /**
   * Find optimal RPM for given conditions
   */
  async findOptimalRpm(currentConditions: Partial<VehicleDataPoint>): Promise<OptimizationResult> {
    if (!this.model || !this.normalizers.inputMean) {
      throw new Error('Model not loaded. Run loadModel() first.')
    }

    // Default values for current conditions
    const conditions = {
      speed: currentConditions.speed ?? 60,
      engineLoad: currentConditions.engineLoad ?? 50,
      throttle: currentConditions.throttle ?? 50,
      intakePressure: currentConditions.intakePressure ?? 100,
      coolantTemp: currentConditions.coolantTemp ?? 90,
      gear: currentConditions.gear ?? 3
    }

    // Test RPM range from 800 to 4000 in steps of 50
    const rpmRange: number[] = []
    for (let rpm = 800; rpm <= 4000; rpm += 50) {
      rpmRange.push(rpm)
    }

    // Create test data
    const testData = rpmRange.map(rpm => [
      rpm,
      conditions.speed,
      conditions.engineLoad,
      conditions.throttle,
      conditions.intakePressure,
      conditions.coolantTemp
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

    // Find optimal RPM
    const efficiencyValues = await denormalizedPredictions.array() as number[][]
    let maxEfficiency = -Infinity
    let optimalRpm = 2000

    efficiencyValues.forEach((value, index) => {
      if (value[0] > maxEfficiency) {
        maxEfficiency = value[0]
        optimalRpm = rpmRange[index]
      }
    })

    // Calculate confidence based on prediction variance
    const mean = efficiencyValues.reduce((sum, val) => sum + val[0], 0) / efficiencyValues.length
    const variance = efficiencyValues.reduce((sum, val) => sum + Math.pow(val[0] - mean, 2), 0) / efficiencyValues.length
    const confidence = Math.max(0.1, Math.min(1, 1 - Math.sqrt(variance) / mean))

    // Find efficient RPM range (within 90% of max efficiency)
    const threshold = maxEfficiency * 0.9
    const efficientRpmIndices = efficiencyValues
      .map((val, idx) => ({ efficiency: val[0], index: idx }))
      .filter(item => item.efficiency >= threshold)
      .map(item => item.index)

    const efficientRpmRange: [number, number] = [
      Math.min(...efficientRpmIndices.map(i => rpmRange[i])),
      Math.max(...efficientRpmIndices.map(i => rpmRange[i]))
    ]

    // Clean up tensors
    testTensor.dispose()
    normalizedTest.dispose()
    predictions.dispose()
    denormalizedPredictions.dispose()

    return {
      optimalRpm,
      confidence,
      predictedFuelEfficiency: maxEfficiency,
      recommendations: {
        rpmRange: efficientRpmRange,
        targetSpeed: conditions.speed,
        shiftPoint: this.calculateShiftPoint(optimalRpm, conditions.gear)
      }
    }
  }

  /**
   * Prepare and normalize training data
   */
  private async prepareTrainingData(dataPoints: VehicleDataPoint[]) {
    // Extract features: [rpm, speed, load, throttle, intakePressure, coolantTemp]
    const featuresArray = dataPoints.map(point => [
      point.rpm,
      point.speed,
      point.engineLoad,
      point.throttle ?? 0, // Default to 0 if throttle is missing
      point.intakePressure ?? 100,
      point.coolantTemp ?? 90
    ])

    // Calculate fuel efficiency (km/L) as labels - handle edge cases
    const labelsArray = dataPoints.map(point => {
      const efficiency = point.speed / point.fuelRate
      // Clamp efficiency to reasonable bounds to avoid extreme values
      return [Math.max(0, Math.min(50, efficiency))]
    })

    // Log some sample data for debugging
    console.log('Sample features:', featuresArray.slice(0, 3))
    console.log('Sample labels:', labelsArray.slice(0, 3))

    // Convert to tensors
    const features = tf.tensor2d(featuresArray)
    const labels = tf.tensor2d(labelsArray)

    // Check for NaN values before normalization
    const featuresHasNaN = await features.isNaN().any().data()
    const labelsHasNaN = await labels.isNaN().any().data()
    
    if (featuresHasNaN[0]) {
      throw new Error('Features contain NaN values')
    }
    
    if (labelsHasNaN[0]) {
      throw new Error('Labels contain NaN values')
    }

    // Normalize features using z-score normalization
    const inputMean = features.mean(0)
    const inputStd = features.sub(inputMean).square().mean(0).sqrt().add(1e-7)
    const normalizedFeatures = features.sub(inputMean).div(inputStd)

    // Normalize labels
    const outputMean = labels.mean(0)
    const outputStd = labels.sub(outputMean).square().mean(0).sqrt().add(1e-7)
    const normalizedLabels = labels.sub(outputMean).div(outputStd)

    // Check normalized data
    const normalizedFeaturesHasNaN = await normalizedFeatures.isNaN().any().data()
    const normalizedLabelsHasNaN = await normalizedLabels.isNaN().any().data()
    
    if (normalizedFeaturesHasNaN[0] || normalizedLabelsHasNaN[0]) {
      throw new Error('Normalized data contains NaN values')
    }

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
   * Calculate recommended shift point based on optimal RPM
   */
  private calculateShiftPoint(optimalRpm: number, currentGear: number): number {
    const shiftMultiplier = 1.3 + (currentGear * 0.05)
    return Math.round(optimalRpm * shiftMultiplier)
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose()
    }
    
    Object.values(this.normalizers).forEach(tensor => {
      if (tensor) tensor.dispose()
    })
  }
}