import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import type { VehicleDataPoint } from './ml-service.js'

export interface CsvReaderOptions {
  csvDataPath: string
  vehicleId?: string
  filePattern?: RegExp
  maxFiles?: number
}

/**
 * Parse start time from CSV header
 */
function parseStartTime(headerLine: string): Date {
  const match = headerLine.match(/# StartTime = (.+)/)
  if (!match) throw new Error('Could not parse start time from header')
  return new Date(match[1])
}

/**
 * Map CSV field names to our data structure
 */
function mapCsvField(header: string, value: string): { field: keyof VehicleDataPoint | null, value: number } {
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return { field: null, value: 0 }

  const mapping: Record<string, keyof VehicleDataPoint> = {
    'Engine RPM (RPM)': 'rpm',
    'Vehicle speed (km/h)': 'speed', 
    'Engine fuel rate (l/hr)': 'fuelRate',
    'Calculated load value (%)': 'engineLoad',
    'Engine Power (PS)': 'power',
    'Throttle Position - Desired (%)': 'throttle',
    'Intake manifold absolute pressure (kPa)': 'intakePressure',
    'Engine coolant temperature (°C)': 'coolantTemp',
    'Mass air flow rate (g/s)': 'airFlow',
    'Transmission Gear Engaged': 'gear'
  }

  return {
    field: mapping[header] || null,
    value: numValue
  }
}

/**
 * Parse a single CSV file
 */
async function parseCSVFile(filePath: string): Promise<VehicleDataPoint[]> {
  const content = await readFile(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())

  if (lines.length < 3) return []

  const startTime = parseStartTime(lines[0])
  const headers = lines[1].split(',').map(h => h.trim())
  const dataPoints: VehicleDataPoint[] = []

  for (let i = 2; i < lines.length; i++) {
    const values = lines[i].split(',')
    if (values.length !== headers.length) continue

    const timeOffset = parseFloat(values[0])
    if (isNaN(timeOffset)) continue

    const timestamp = new Date(startTime.getTime() + (timeOffset * 1000))
    const point: Partial<VehicleDataPoint> = { timestamp }

    // Parse all fields
    for (let j = 1; j < headers.length; j++) {
      const { field, value } = mapCsvField(headers[j], values[j])
      if (field && value > 0) {
        ;(point as any)[field] = value
      }
    }

    // Only include points with essential data
    if (point.rpm && point.speed !== undefined && point.fuelRate && point.engineLoad && point.power) {
      // Skip points with zero RPM (engine not running) or invalid GPS
      if (point.rpm > 0 && point.fuelRate > 0) {
        dataPoints.push(point as VehicleDataPoint)
      }
    }
  }

  return dataPoints
}

/**
 * Read all CSV files from a directory
 */
export async function readAllCsvFiles(options: CsvReaderOptions): Promise<VehicleDataPoint[]> {
  const { csvDataPath, vehicleId, filePattern = /CSVLog_\d{8}_\d{6}\.csv$/, maxFiles } = options
  
  let csvDir = csvDataPath
  if (vehicleId) {
    csvDir = join(csvDataPath, vehicleId)
  }

  console.log(`📁 Reading CSV files from: ${csvDir}`)

  try {
    const files = await readdir(csvDir)
    const csvFiles = files
      .filter(file => filePattern.test(file))
      .sort()
      .slice(0, maxFiles || files.length)

    if (csvFiles.length === 0) {
      throw new Error(`No CSV files found matching pattern in ${csvDir}`)
    }

    console.log(`📋 Found ${csvFiles.length} CSV files:`)
    csvFiles.forEach(file => console.log(`   - ${file}`))

    const allDataPoints: VehicleDataPoint[] = []

    for (const file of csvFiles) {
      const filePath = join(csvDir, file)
      console.log(`📖 Reading ${file}...`)
      
      try {
        const dataPoints = await parseCSVFile(filePath)
        allDataPoints.push(...dataPoints)
        console.log(`   ✅ Loaded ${dataPoints.length} data points`)
      } catch (error) {
        console.error(`   ❌ Error reading ${file}:`, error)
        continue
      }
    }

    console.log(`🎯 Total data points loaded: ${allDataPoints.length}`)
    
    // Sort by timestamp
    allDataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return allDataPoints

  } catch (error) {
    throw new Error(`Failed to read CSV files from ${csvDir}: ${error}`)
  }
}