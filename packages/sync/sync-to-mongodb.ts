#!/usr/bin/env bun

import dotenv from 'dotenv';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../packages/server/.env') });
import { MongoClient, Db } from 'mongodb';
import { isKnownMetric, CSV_METRICS, type CsvMetricValue } from '@carlens/shared-types';

/**
 * TIMEZONE HANDLING:
 * - CSV files contain timestamps without timezone information
 * - All CSV timestamps are assumed to be in GMT+7 (Asia/Bangkok) timezone
 * - Timestamps are converted to UTC when storing in MongoDB
 * - Client displays timestamps in GMT+7 for user consistency
 */

// Load environment variables from .env file
const CSV_DATA_PATH = process.env.CSV_DATA_PATH || '/path/to/csv/data';
const VEHICLE_ID = process.env.VEHICLE_ID || 'RL2UMFC50RYR87488';
const CSV_DIR = join(CSV_DATA_PATH, VEHICLE_ID);

// MongoDB configuration from .env file
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.DATABASE_NAME || 'carlens';
const TIME_SERIES_COLLECTION = process.env.COLLECTION_NAME || 'vehicle_telemetry';

interface VehicleDocument {
  timestamp: Date;
  metadata: {
    vehicleId: string;
    fileName: string;
    dataSource: string;
    vehicleType: string;
  };
  measurements: Record<string, string | number>;
}

interface FileInfo {
  name: string;
  path: string;
}

interface ParsedCSVData {
  startTime: Date | null;
  data: VehicleDocument[];
}

interface SyncOptions {
  force: boolean;
}

let client: MongoClient;
let db: Db;


function parseStartTime(headerLine: string): Date {
  const match = headerLine.match(/# StartTime = (.+)/);
  if (!match) throw new Error('Could not parse start time from header');
  const localDate = new Date(match[1]);
  const utcDate = new Date(localDate.getTime());
  return utcDate;
}

function parseCSVData(content: string, fileName: string): ParsedCSVData {
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length < 3) return { startTime: null, data: [] };

  const startTime = parseStartTime(lines[0]);
  const headers = lines[1].split(',').map(h => h.trim());
  const data: VehicleDocument[] = [];

  // Use vehicle ID from environment or extract from directory path
  const vinMatch = CSV_DIR.match(/([A-HJ-NPR-Z0-9]{17})$/);
  const vehicleId = VEHICLE_ID || (vinMatch ? vinMatch[1] : 'RL2UMFC50RYR87488');

  // Validate and log unknown metrics
  const unknownMetrics = headers.filter(header => !isKnownMetric(header) && header !== CSV_METRICS.TIME);
  if (unknownMetrics.length > 0) {
    console.log(`  ⚠️  Unknown metrics in ${fileName}:`, unknownMetrics);
  }

  for (let i = 2; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) continue;

    const timeOffset = parseFloat(values[0]);
    if (isNaN(timeOffset)) continue;

    const absoluteTime = new Date(startTime.getTime() + (timeOffset * 1000));

    // Parse all measurements
    const measurements: Record<string, string | number> = {};
    let hasValidGPS = true;

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const value = values[j].trim();

      // Skip time field (already processed) and unknown metrics
      if (header === CSV_METRICS.TIME || !isKnownMetric(header)) {
        continue;
      }

      let numValue = parseFloat(value);

      // Keep raw values without rounding
      if (!isNaN(numValue)) {
        // Check for invalid GPS coordinates (0 values)
        if (header === CSV_METRICS.LATITUDE_DEG || header === CSV_METRICS.LONGITUDE_DEG) {
          if (numValue === 0) {
            hasValidGPS = false;
          }
        }
      }

      const finalValue: string | number = isNaN(numValue) ? value : numValue;

      // Store all measurements in the measurements object
      measurements[header] = finalValue;
    }

    // Skip datapoints with invalid GPS coordinates (0 values)
    if (!hasValidGPS) {
      continue;
    }

    // Skip datapoints with 0 RPM (engine not running)
    const rpmValue = measurements[CSV_METRICS.ENGINE_RPM];
    if (typeof rpmValue === 'number' && rpmValue === 0) {
      continue;
    }

    // Create document structure with all measurements in the measurements object
    const document: VehicleDocument = {
      timestamp: absoluteTime,
      metadata: {
        vehicleId: vehicleId,
        fileName: fileName,
        dataSource: 'OBD-II',
        vehicleType: 'passenger'
      },
      measurements
    };

    data.push(document);
  }

  return { startTime, data };
}


async function dropExistingCollection(): Promise<void> {
  console.log('🗑️ Dropping existing collection for fresh start...');
  try {
    await db.collection(TIME_SERIES_COLLECTION).drop();
    console.log('🗑️ Collection dropped successfully');
  } catch (error: any) {
    if (error.code === 26) { // NamespaceNotFound
      console.log('🗑️ Collection does not exist, nothing to drop');
    } else {
      throw error;
    }
  }
}

async function connectToMongoDB(options: SyncOptions): Promise<void> {
  console.log('🔌 Connecting to MongoDB...');
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DATABASE_NAME);

  // Drop existing collection if force flag is used
  if (options.force) {
    await dropExistingCollection();
  }

  // Create time series collection with optimized settings
  try {
    await db.createCollection(TIME_SERIES_COLLECTION, {
      timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        // Use custom bucketing for better performance with OBD data (~1-5 sec intervals)
        bucketMaxSpanSeconds: 300,  // 5 minutes bucket span
        bucketRoundingSeconds: 300  // Must equal bucketMaxSpanSeconds
      }
    });
    console.log('📊 Created optimized time series collection');

    // Create performance indexes
    console.log('📊 Creating performance indexes...');
    await db.collection(TIME_SERIES_COLLECTION).createIndex({
      'metadata.vehicleId': 1,
      'timestamp': 1
    });
    await db.collection(TIME_SERIES_COLLECTION).createIndex({
      'metadata.fileName': 1,
      'timestamp': 1
    });
    console.log('📊 Performance indexes created');

  } catch (error: any) {
    if (error.code !== 48) { // Collection already exists
      throw error;
    }
    console.log('📊 Time series collection already exists');
  }

  console.log('✅ Connected to MongoDB');
}

async function getLastSyncedFile(): Promise<string | null> {
  // Query the timeseries collection directly to find the last synced file
  const lastRecord = await db.collection(TIME_SERIES_COLLECTION).findOne(
    {},
    {
      sort: { timestamp: -1 },
      projection: { 'metadata.fileName': 1 }
    }
  );

  return lastRecord ? lastRecord.metadata.fileName : null;
}

async function getAllCSVFiles(): Promise<FileInfo[]> {
  try {
    const files = await readdir(CSV_DIR);
    return files
      .filter(file => file.startsWith('CSVLog_') && file.endsWith('.csv'))
      .sort() // Sort to ensure chronological order
      .map(file => ({
        name: file,
        path: join(CSV_DIR, file)
      }));
  } catch (error: any) {
    throw new Error(`Could not read CSV directory: ${error.message}`);
  }
}

function getFilesToSync(allFiles: FileInfo[], lastSyncedFile: string | null, force: boolean): FileInfo[] {
  if (force) {
    console.log('🔥 Force flag enabled, syncing all files');
    return allFiles;
  }

  if (!lastSyncedFile) {
    console.log('📂 No previous sync found, syncing all files');
    return allFiles;
  }

  console.log(`📂 Last synced file: ${lastSyncedFile}`);
  const lastSyncIndex = allFiles.findIndex(file => file.name === lastSyncedFile);

  if (lastSyncIndex === -1) {
    console.log('⚠️  Last synced file not found, syncing all files');
    return allFiles;
  }

  // Return files after the last synced file
  const filesToSync = allFiles.slice(lastSyncIndex + 1);
  console.log(`📂 Found ${filesToSync.length} new files to sync`);
  return filesToSync;
}

async function syncDataToMongodb(options: SyncOptions = { force: false }): Promise<void> {
  console.log('🚗 Starting MongoDB sync...');
  if (options.force) {
    console.log('🔥 Force mode enabled - will delete existing data');
  }

  try {
    await connectToMongoDB(options);

    const allFiles = await getAllCSVFiles();
    console.log(`📁 Found ${allFiles.length} total CSV files`);

    const lastSyncedFile = options.force ? null : await getLastSyncedFile();
    const filesToSync = getFilesToSync(allFiles, lastSyncedFile, options.force);

    if (filesToSync.length === 0) {
      console.log('✨ No new files to sync!');
      return;
    }

    let totalRecordsInserted = 0;
    let processedFiles = 0;
    let lastProcessedFile: string | null = null;

    for (const fileInfo of filesToSync) {
      try {
        console.log(`📄 Processing: ${fileInfo.name}`);
        const content = await readFile(fileInfo.path, 'utf-8');
        const { startTime, data } = parseCSVData(content, fileInfo.name);

        if (data.length === 0) {
          console.log(`  ⚠️  No valid data found in ${fileInfo.name}`);
          continue;
        }

        // Insert documents in optimized batches
        const batchSize = 5000; // Larger batches for better performance
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          await db.collection<VehicleDocument>(TIME_SERIES_COLLECTION).insertMany(batch, {
            ordered: false,  // Better performance for time series
            retryWrites: false  // Disable for better multi-client performance
          });
        }

        totalRecordsInserted += data.length;
        processedFiles++;
        lastProcessedFile = fileInfo.name;

        console.log(`  ✅ Inserted ${data.length} records from ${startTime?.toLocaleString()}`);

      } catch (error: any) {
        console.error(`  ❌ Error processing ${fileInfo.name}: ${error.message}`);
        // Continue with next file instead of stopping
      }
    }

    console.log(`\n📊 Sync Summary:`);
    console.log(`  Files processed: ${processedFiles}/${filesToSync.length}`);
    console.log(`  Total records inserted: ${totalRecordsInserted}`);
    console.log(`  Last synced file: ${lastProcessedFile}`);

    console.log('✨ MongoDB sync complete!');

  } catch (error: any) {
    console.error('❌ Sync failed:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Parse command line arguments
function parseArgs(): SyncOptions {
  const args = process.argv.slice(2);
  return {
    force: args.includes('--force')
  };
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();

  // Show help
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🚗 MongoDB CSV Sync Tool

Usage: bun run sync-to-mongodb.ts [options]

Options:
  --force     Delete all existing data and sync from scratch
  --help, -h  Show this help message

Examples:
  bun run sync-to-mongodb.ts         # Incremental sync
  bun run sync-to-mongodb.ts --force # Full resync

Note: For CSV metrics discovery, use: bun run packages/scripts/discover-csv-metrics.ts
`);
    process.exit(0);
  }

  if (options.force) {
    console.log('⚠️  WARNING: --force flag detected. This will delete ALL existing data before sync!');
    console.log('⏳ Starting in 3 seconds... Press Ctrl+C to cancel');

    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  syncDataToMongodb(options).catch(error => {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  });
}

export { syncDataToMongodb };