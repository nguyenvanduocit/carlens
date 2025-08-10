# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This project is a vehicle analytics dashboard application that provides real-time telemetry data visualization from OBD-II (On-Board Diagnostics) systems. The application consists of:

- **Frontend Client**: Pure Vue 3 UI that calls server APIs for all data
- **Backend Server**: Fastify API server with MongoDB time-series data storage
- **Shared Types**: TypeScript definitions shared between client and server
- **Data Sync Utility**: MongoDB synchronization for OBD CSV data ingestion

### Architecture
- **Client (Pure UI)**: Vue 3 Composition API - No file access, only API calls
- **Server**: Fastify API server with MongoDB time-series collections
- **Database**: MongoDB with optimized time-series storage and indexing
- **Shared Types**: Workspace package with TypeScript interfaces

### Technology Stack
- **Frontend Framework**: Vue 3 with Composition API
- **Backend Framework**: Fastify server with MongoDB driver
- **Database**: MongoDB time-series collections
- **Build Tool**: Vite for fast development and optimized builds
- **Package Manager**: Bun (always use bun/bunx, never npm/npx)
- **UI Components**: Shadcn-Vue component library
- **Charts**: Vue ECharts for data visualization
- **Styling**: CSS Modules with Single File Components (SFC)

## Data Structure

### Directory Organization
- CSV logs are organized by vehicle ID (e.g., `/path/to/csv/data
- Each log file follows the naming pattern: `CSVLog_YYYYMMDD_HHMMSS.csv`

### CSV File Format
Each CSV file contains:
- Header row with start time comment (e.g., `# StartTime = 08/08/2025 09:02:52.6840 PM`)
- Column headers for various vehicle parameters
- Time-series data with readings at regular intervals

### Key Data Columns
- **Time (sec)**: Elapsed time since logging started
- **Engine parameters**: RPM, coolant temperature, load value, fuel rate
- **Vehicle dynamics**: Speed, acceleration, throttle position
- **Environmental**: Barometric pressure, intake air temperature
- **GPS coordinates**: Latitude and longitude in degrees
- **Transmission**: Gear engaged, fluid temperature
- **Performance metrics**: Engine power (PS), engine torque (N•m)

## API Architecture

### Client-Server Communication
The client is a **pure UI application** that communicates exclusively with the server via HTTP APIs:

1. **No File System Access**: Client never reads CSV files directly
2. **API-Only Data**: All vehicle data fetched from `/api/` endpoints
3. **Real-Time Updates**: Auto-refresh capabilities for live telemetry
4. **Shared Types**: Type-safe communication via `@carlens/shared-types`

### Server API Endpoints
- **GET /api/vehicle/info**: Vehicle metadata and data range
- **GET /api/timeseries/data**: Time-series telemetry data with filtering
- **GET /api/timeseries/aggregate**: Aggregated metrics over time intervals  
- **GET /api/timeseries/latest**: Latest vehicle readings
- **GET /api/metrics/available**: Available measurement fields

### MongoDB Time-Series Storage
- Optimized time-series collections with bucketing
- Performance indexes on timestamp and vehicle ID
- Efficient aggregation pipelines for analytics
- Automatic compression and retention policies

## Development Guidelines

### Client Development (Pure UI)
- **API-First**: Use `useApiVehicleData()` composable for all data
- **No File Access**: Never read files directly, always call server APIs
- **Real-Time UI**: Implement auto-refresh for live dashboard updates
- **Type Safety**: Use shared types from `@carlens/shared-types`

### Component Architecture
- Use Vue 3 Composition API exclusively
- API-based composables (e.g., `useApiVehicleData`, `useAggregatedData`)
- Real-time chart components with ECharts
- Responsive dashboard layouts with Tailwind

### Server Development
- **MongoDB Integration**: Time-series collections with optimized queries
- **API Design**: RESTful endpoints with filtering and pagination
- **Performance**: Efficient aggregation pipelines and indexing
- **Type Safety**: Shared types ensure client-server compatibility

## Important Notes
- Files are stored in iCloud and synced across devices
- CSV files can be large depending on logging duration
- All timestamps in filenames are in local time
- Application should handle large datasets efficiently
- **Always use Bun**: Use `bun` and `bunx` commands, never `npm` or `npx`
- **Never run dev server**: Do not run `bun run dev` or similar development commands
- **Use Vue ECharts**: All charts should use Vue ECharts library, not custom implementations
