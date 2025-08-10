import type { VehicleMetadata } from './vehicle.js';
export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    message?: string;
    timestamp?: string;
}
export interface HealthResponse {
    status: 'ok' | 'error';
    timestamp: string;
}
export interface VehicleInfoResponse {
    vehicle: VehicleMetadata;
    dataRange: {
        minTime?: Date;
        maxTime?: Date;
        totalRecords?: number;
    };
    timestamp: string;
}
export interface TimeseriesDataRequest {
    startTime?: string;
    endTime?: string;
    vehicleId?: string;
    metrics?: string;
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
export interface AvailableMetricsResponse {
    rootMetrics: string[];
    measurements: string[];
    allMetrics: string[];
}
export interface ApiErrorResponse {
    error: string;
    message: string;
    statusCode?: number;
}
//# sourceMappingURL=api.d.ts.map