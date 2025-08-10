import type { VehicleMetadata } from './vehicle.js';

// Base API response structure
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

// Health check endpoint
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
}

// Vehicle info endpoint
export interface VehicleInfoResponse {
  vehicle: VehicleMetadata;
  dataRange: {
    minTime?: Date;
    maxTime?: Date;
    totalRecords?: number;
  };
  timestamp: string;
}

// Timeseries data endpoint
export interface TimeseriesDataRequest {
  startTime?: string;
  endTime?: string;
  vehicleId?: string;
  metrics?: string; // comma-separated list
  interval?: '1m' | '5m' | '15m' | '30m' | '1h';
  limit?: number;
}

export interface TimeseriesDataResponse {
  data: TimeseriesDataPoint[];
  metadata: {
    count: number;
    metrics: string[];
    timeRange: {
      start?: Date;
      end?: Date;
    };
  };
}

export interface TimeseriesDataPoint {
  timestamp: Date;
  metadata?: {
    vehicleId?: string;
  };
  // Dynamic properties based on requested metrics
  speed?: number;
  rpm?: number;
  coolantTemp?: number;
  throttlePos?: number;
  fuelRate?: number;
  enginePower?: number;
  engineTorque?: number;
  measurements?: Record<string, any>;
  [key: string]: any;
}

// Aggregate endpoint
export interface TimeseriesAggregateRequest {
  startTime?: string;
  endTime?: string;
  vehicleId?: string;
  metric?: string;
  interval?: '1m' | '5m' | '15m' | '30m' | '1h';
  operation?: 'avg' | 'max' | 'min' | 'sum';
}

export interface TimeseriesAggregateResponse {
  data: AggregateDataPoint[];
  metadata: {
    metric: string;
    operation: string;
    interval: string;
    count: number;
  };
}

export interface AggregateDataPoint {
  timestamp: Date;
  value: number;
  count: number;
}

// Latest readings endpoint
export interface LatestReadingsRequest {
  vehicleId?: string;
  limit?: number;
}

export interface LatestReadingsResponse {
  data: TimeseriesDataPoint[];
  metadata: {
    count: number;
    latestTimestamp?: Date;
  };
}

// Available metrics endpoint
export interface AvailableMetricsResponse {
  rootMetrics: string[];
  measurements: string[];
  allMetrics: string[];
}

// Error response
export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode?: number;
}