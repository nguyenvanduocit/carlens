#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { MongoClient } from 'mongodb';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, './.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.DATABASE_NAME || 'carlens';
const TIME_SERIES_COLLECTION = process.env.COLLECTION_NAME || 'vehicle_telemetry';

let client;
let db;

// Initialize Fastify with logging
const fastify = Fastify({
  logger: process.env.NODE_ENV === 'production' ? false : true
});

// Register CORS plugin
await fastify.register(cors, {
  origin: true, // Allow all origins in development
  credentials: true
});

// MongoDB connection
async function connectToMongoDB() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  request.log.info({ path: '/health' }, 'Health check');
  return { status: 'ok', timestamp: new Date() };
});

// Get basic vehicle info and data range
fastify.get('/api/vehicle/info', async (request, reply) => {
  try {
    request.log.info({ path: '/api/vehicle/info' }, 'Vehicle info requested');
    const collection = db.collection(TIME_SERIES_COLLECTION);

    const [dataRange, vehicleInfo] = await Promise.all([
      // Get time range
      collection.aggregate([
        {
          $group: {
            _id: null,
            minTime: { $min: '$timestamp' },
            maxTime: { $max: '$timestamp' },
            totalRecords: { $sum: 1 }
          }
        }
      ]).toArray(),

      // Get vehicle metadata
      collection.findOne(
        {},
        {
          projection: { 'metadata': 1 },
          sort: { timestamp: -1 }
        }
      )
    ]);

    const dataRangeConverted = dataRange[0] || {};

    const payload = {
      vehicle: vehicleInfo?.metadata || {},
      dataRange: dataRangeConverted,
      timestamp: new Date()
    };
    request.log.info({ path: '/api/vehicle/info', payloadSummary: { hasVehicle: !!payload.vehicle, hasRange: !!payload.dataRange } }, 'Vehicle info response');
    return payload;
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch vehicle info', message: error.message });
  }
});

// Metric name mapping from API names to CSV field names
const METRIC_MAPPING = {
  'speed': 'Vehicle speed (km/h)',
  'rpm': 'Engine RPM (RPM)', 
  'coolantTemp': 'Engine coolant temperature (°C)',
  'throttlePos': 'Throttle Position - Desired (%)',
  'throttle': 'Throttle Position - Desired (%)',
  'fuelRate': 'Engine fuel rate (l/hr)',
  'engineLoad': 'Calculated load value (%)',
  'power': 'Engine Power (PS)',
  'enginePower': 'Engine Power (PS)',
  'torque': 'Engine Torque (N•m)',
  'engineTorque': 'Engine Torque (N•m)',
  'intakePressure': 'Intake manifold absolute pressure (kPa)',
  'intakeTemp': 'Intake air temperature (°C)',
  'barometricPressure': 'Barometric pressure (kPa)',
  'airFlow': 'Mass air flow rate (g/s)',
  'gear': 'Transmission Gear Engaged',
  'latitude': 'Latitude (deg)',
  'longitude': 'Longitude (deg)'
};

// Get timeseries data with filters and aggregation
fastify.get('/api/timeseries/data', async (request, reply) => {
  try {
    const {
      startTime,
      endTime,
      vehicleId,
      metrics = 'speed,rpm,coolantTemp,throttlePos', // Default metrics
      interval = null, // Aggregation interval - if null, return raw data
      operation = 'avg', // avg, max, min, sum for aggregated data
      limit = 1000
    } = request.query;

    request.log.info({
      path: '/api/timeseries/data',
      query: { startTime, endTime, vehicleId, metrics, interval, operation, limit }
    }, 'Timeseries data requested');

    const collection = db.collection(TIME_SERIES_COLLECTION);

    // Build match conditions
    const matchConditions = {};

    if (startTime || endTime) {
      matchConditions.timestamp = {};
      if (startTime) matchConditions.timestamp.$gte = new Date(startTime);
      if (endTime) matchConditions.timestamp.$lte = new Date(endTime);
    }

    if (vehicleId) {
      matchConditions['metadata.vehicleId'] = vehicleId;
    }

    // Parse requested metrics and map to CSV field names
    const requestedApiMetrics = metrics.split(',').map(m => m.trim());
    const requestedMetrics = requestedApiMetrics.map(metric => METRIC_MAPPING[metric] || metric);

    let data;

    if (interval && interval !== 'raw') {
      // Use aggregation for interval-based data

      // Parse interval to MongoDB date expression
      const intervalMap = {
        '1m': { minute: { $minute: '$timestamp' }, hour: { $hour: '$timestamp' }, day: { $dayOfMonth: '$timestamp' }, month: { $month: '$timestamp' }, year: { $year: '$timestamp' } },
        '5m': { minute: { $subtract: [{ $minute: '$timestamp' }, { $mod: [{ $minute: '$timestamp' }, 5] }] }, hour: { $hour: '$timestamp' }, day: { $dayOfMonth: '$timestamp' }, month: { $month: '$timestamp' }, year: { $year: '$timestamp' } },
        '15m': { minute: { $subtract: [{ $minute: '$timestamp' }, { $mod: [{ $minute: '$timestamp' }, 15] }] }, hour: { $hour: '$timestamp' }, day: { $dayOfMonth: '$timestamp' }, month: { $month: '$timestamp' }, year: { $year: '$timestamp' } },
        '30m': { minute: { $subtract: [{ $minute: '$timestamp' }, { $mod: [{ $minute: '$timestamp' }, 30] }] }, hour: { $hour: '$timestamp' }, day: { $dayOfMonth: '$timestamp' }, month: { $month: '$timestamp' }, year: { $year: '$timestamp' } },
        '1h': { hour: { $hour: '$timestamp' }, day: { $dayOfMonth: '$timestamp' }, month: { $month: '$timestamp' }, year: { $year: '$timestamp' } },
        '6h': { hour: { $subtract: [{ $hour: '$timestamp' }, { $mod: [{ $hour: '$timestamp' }, 6] }] }, day: { $dayOfMonth: '$timestamp' }, month: { $month: '$timestamp' }, year: { $year: '$timestamp' } },
        '12h': { hour: { $subtract: [{ $hour: '$timestamp' }, { $mod: [{ $hour: '$timestamp' }, 12] }] }, day: { $dayOfMonth: '$timestamp' }, month: { $month: '$timestamp' }, year: { $year: '$timestamp' } },
        '1d': { day: { $dayOfMonth: '$timestamp' }, month: { $month: '$timestamp' }, year: { $year: '$timestamp' } }
      };

      const dateGroup = intervalMap[interval] || intervalMap['1h'];

      // Build aggregation operations for multiple metrics
      const operationMap = {
        'avg': (metric) => ({ $avg: `$measurements.${metric}` }),
        'max': (metric) => ({ $max: `$measurements.${metric}` }),
        'min': (metric) => ({ $min: `$measurements.${metric}` }),
        'sum': (metric) => ({ $sum: `$measurements.${metric}` }),
        'first': (metric) => ({ $first: `$measurements.${metric}` }),
        'last': (metric) => ({ $last: `$measurements.${metric}` })
      };

      const groupFields = {
        _id: dateGroup,
        count: { $sum: 1 },
        timestamp: { $first: '$timestamp' }
      };

      // Add each requested metric to the group fields
      requestedMetrics.forEach(metric => {
        groupFields[metric] = operationMap[operation] ? operationMap[operation](metric) : operationMap['avg'](metric);
      });

      const aggregation = [
        { $match: matchConditions },
        {
          $group: groupFields
        },
        { $sort: { timestamp: 1 } },
        { $limit: parseInt(limit) }
      ];

      const aggregatedData = await collection.aggregate(aggregation).toArray();

      // Transform aggregated data to match expected format
      data = aggregatedData.map(item => {
        const measurements = {};
        requestedMetrics.forEach((csvFieldName, index) => {
          const apiFieldName = requestedApiMetrics[index];
          measurements[apiFieldName] = item[csvFieldName];
        });

        return {
          timestamp: item.timestamp,
          metadata: { vehicleId },
          measurements,
          _aggregated: {
            interval,
            operation,
            count: item.count
          }
        };
      });

    } else {
      // Return raw data (original behavior)
      const projection = {
        timestamp: 1,
        'metadata.vehicleId': 1
      };

      requestedMetrics.forEach(csvFieldName => {
        projection[`measurements.${csvFieldName}`] = 1;
      });

      const rawData = await collection
        .find(matchConditions, { projection })
        .sort({ timestamp: 1 })
        .limit(parseInt(limit))
        .toArray();

      // Transform raw data to map CSV field names back to API field names
      data = rawData.map(item => {
        const measurements = {};
        requestedMetrics.forEach((csvFieldName, index) => {
          const apiFieldName = requestedApiMetrics[index];
          measurements[apiFieldName] = item.measurements?.[csvFieldName];
        });

        return {
          timestamp: item.timestamp,
          metadata: item.metadata,
          measurements
        };
      });
    }

    const payload = {
      data: data,
      metadata: {
        count: data.length,
        metrics: requestedApiMetrics,
        interval: interval || 'raw',
        operation: interval ? operation : null,
        timeRange: {
          start: data[0]?.timestamp,
          end: data[data.length - 1]?.timestamp
        }
      }
    };

    request.log.info({
      path: '/api/timeseries/data',
      resultSummary: { count: payload.metadata.count, interval: payload.metadata.interval }
    }, 'Timeseries data response');

    return payload;

  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch timeseries data', message: error.message });
  }
});

// Get latest readings
fastify.get('/api/timeseries/latest', async (request, reply) => {
  try {
    const { vehicleId, limit = 10 } = request.query;

    request.log.info({ path: '/api/timeseries/latest', query: { vehicleId, limit } }, 'Latest readings requested');

    const collection = db.collection(TIME_SERIES_COLLECTION);

    const matchConditions = {};
    if (vehicleId) {
      matchConditions['metadata.vehicleId'] = vehicleId;
    }

    const data = await collection
      .find(matchConditions)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();

    const payload = {
      data,
      metadata: {
        count: data.length,
        latestTimestamp: data[0]?.timestamp
      }
    };
    request.log.info({ path: '/api/timeseries/latest', resultSummary: { count: payload.metadata.count } }, 'Latest readings response');
    return payload;

  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch latest data', message: error.message });
  }
});
// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

  try {
    await fastify.close();
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start server
const start = async () => {
  try {
    await connectToMongoDB();

    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`🚀 Vehicle Analytics Server running on http://${host}:${port}`);
    console.log(`📊 API endpoints available at http://${host}:${port}/api/`);

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

start();