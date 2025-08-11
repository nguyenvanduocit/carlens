#!/usr/bin/env bun

import dotenv from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { MLOptimizationService } from './ml-service.js'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: resolve(__dirname, '../../../packages/server/.env') })

function parseArgs() {
  const args = process.argv.slice(2)
  const params: any = {}

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '')
    const value = args[i + 1]
    
    if (key && value) {
      params[key] = parseFloat(value) || value
    }
  }

  return params
}

function showUsage() {
  console.log(`
🚗 CarLens Optimal RPM Finder
============================

Usage: bun run find-optimal-rpm [options]

Options:
  --speed <number>         Current vehicle speed in km/h (default: 60)
  --load <number>          Engine load percentage (default: 50)
  --throttle <number>      Throttle position percentage (default: 50)
  --intake-pressure <number>  Intake pressure in kPa (default: 100)
  --coolant-temp <number>  Coolant temperature in °C (default: 90)
  --gear <number>          Current gear (default: 3)

Examples:
  # Find optimal RPM for highway cruising
  bun run find-optimal-rpm --speed 100 --load 30 --throttle 25

  # Find optimal RPM for city driving
  bun run find-optimal-rpm --speed 50 --load 45 --throttle 40

  # Find optimal RPM for current conditions
  bun run find-optimal-rpm
`)
}

async function main() {
  const params = parseArgs()

  if (params.help || params.h) {
    showUsage()
    return
  }

  console.log('🚗 CarLens Optimal RPM Finder')
  console.log('=============================')

  try {
    // Initialize ML service and load model
    const mlService = new MLOptimizationService()
    const modelLoaded = await mlService.loadModel()

    if (!modelLoaded) {
      console.error('❌ No trained model found!')
      console.log('💡 Train the model first with: bun run train')
      process.exit(1)
    }

    // Parse input conditions
    const conditions = {
      speed: params.speed ?? 60,
      engineLoad: params.load ?? 50,
      throttle: params.throttle ?? 50,
      intakePressure: params['intake-pressure'] ?? 100,
      coolantTemp: params['coolant-temp'] ?? 90,
      gear: params.gear ?? 3
    }

    console.log('📊 Current driving conditions:')
    console.log(`   Speed: ${conditions.speed} km/h`)
    console.log(`   Engine Load: ${conditions.engineLoad}%`)
    console.log(`   Throttle Position: ${conditions.throttle}%`)
    console.log(`   Intake Pressure: ${conditions.intakePressure} kPa`)
    console.log(`   Coolant Temperature: ${conditions.coolantTemp}°C`)
    console.log(`   Current Gear: ${conditions.gear}`)
    console.log('')

    // Find optimal RPM
    console.log('🔍 Analyzing optimal RPM...')
    const result = await mlService.findOptimalRpm(conditions)

    console.log('✅ Optimization Results:')
    console.log('========================')
    console.log(`🎯 Optimal RPM: ${Math.round(result.optimalRpm)} RPM`)
    console.log(`📈 Predicted Fuel Efficiency: ${result.predictedFuelEfficiency.toFixed(2)} km/L`)
    console.log(`🎪 Confidence Level: ${(result.confidence * 100).toFixed(1)}%`)
    console.log('')
    
    console.log('💡 AI Recommendations:')
    console.log(`   🔄 Efficient RPM Range: ${result.recommendations.rpmRange[0]} - ${result.recommendations.rpmRange[1]} RPM`)
    console.log(`   🚀 Target Speed: ${result.recommendations.targetSpeed.toFixed(0)} km/h`)
    
    if (result.recommendations.shiftPoint) {
      console.log(`   ⬆️  Shift to Next Gear at: ${result.recommendations.shiftPoint} RPM`)
    }

    console.log('')
    console.log('🎉 Analysis complete!')

    // Clean up
    mlService.dispose()

  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

main().catch(console.error)