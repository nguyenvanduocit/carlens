# Vehicle Analytics API Server

This server provides REST API access to MongoDB timeseries vehicle telemetry data.

## Quick Start

```bash
# Install dependencies
bun install

# Start server
bun run server
```

Server runs on `http://localhost:3001` by default.

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Vehicle Information
- `GET /api/vehicle/info` - Get vehicle metadata and data range

### Timeseries Data
- `GET /api/timeseries/data` - Query raw timeseries data
  - Query params:
    - `startTime` (ISO string) - Start time filter
    - `endTime` (ISO string) - End time filter 
    - `vehicleId` (string) - Vehicle ID filter
    - `metrics` (comma-separated) - Metrics to return (default: speed,rpm,coolantTemp,throttlePos)
    - `limit` (number) - Max records (default: 1000)

- `GET /api/timeseries/aggregate` - Get aggregated metrics
  - Query params:
    - `startTime`, `endTime`, `vehicleId` - Same as above
    - `metric` (string) - Single metric to aggregate (default: speed)
    - `interval` (string) - Time interval: 1m, 5m, 15m, 30m, 1h (default: 1h)
    - `operation` (string) - Aggregation: avg, max, min, sum (default: avg)

- `GET /api/timeseries/latest` - Get latest readings
  - Query params:
    - `vehicleId` (string) - Vehicle ID filter
    - `limit` (number) - Max records (default: 10)

### Metrics
- `GET /api/metrics/available` - List available metrics

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (required)
- `DATABASE_NAME` - Database name (default: carlens_vehicle_data)
- `PORT` - Server port (default: 3001)
- `HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Environment (development/production)

## Example Usage

```bash
# Get vehicle info
curl http://localhost:3001/api/vehicle/info

# Get speed data for last hour
curl "http://localhost:3001/api/timeseries/data?metrics=speed&limit=100"

# Get hourly average speed
curl "http://localhost:3001/api/timeseries/aggregate?metric=speed&interval=1h&operation=avg"

# Get latest 5 readings
curl "http://localhost:3001/api/timeseries/latest?limit=5"

# List available metrics
curl http://localhost:3001/api/metrics/available
```