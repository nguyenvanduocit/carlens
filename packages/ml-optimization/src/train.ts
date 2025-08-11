#!/usr/bin/env bun

import dotenv from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { MLOptimizationService } from './ml-service.js'
import { readAllCsvFiles } from './csv-reader.js'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: resolve(__dirname, '../../../packages/server/.env') })

async function main() {
  console.log('🚗 CarLens ML Training Script')
  console.log('=============================')
  
  const CSV_DATA_PATH = process.env.CSV_DATA_PATH || '/Users/firegroup/Library/Mobile Documents/iCloud~net~obdsoftware~obdfusion/Documents/CsvLogs'
  const VEHICLE_ID = process.env.VEHICLE_ID || 'RL2UMFC50RYR87488'

  try {
    // Read all CSV files
    console.log('📂 Loading vehicle data from CSV files...')
    const dataPoints = await readAllCsvFiles({
      csvDataPath: CSV_DATA_PATH,
      vehicleId: VEHICLE_ID,
      maxFiles: 10 // Limit to recent files for faster training
    })

    if (dataPoints.length === 0) {
      throw new Error('No data points loaded from CSV files')
    }

    // Initialize ML service
    const mlService = new MLOptimizationService()

    // Train the model
    console.log('')
    console.log('🧠 Starting neural network training...')
    await mlService.trainModel(dataPoints)

    console.log('')
    console.log('✅ Training completed successfully!')
    console.log('💾 Model saved to packages/ml-optimization/models/')
    console.log('')
    console.log('🔧 You can now use the trained model with:')
    console.log('   bun run find-optimal-rpm')

    // Clean up
    mlService.dispose()

  } catch (error) {
    console.error('❌ Training failed:', error)
    process.exit(1)
  }
}

// Handle interruption gracefully
process.on('SIGINT', () => {
  console.log('\n⏹️  Training interrupted by user')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n⏹️  Training terminated')
  process.exit(0)
})

main().catch(console.error)