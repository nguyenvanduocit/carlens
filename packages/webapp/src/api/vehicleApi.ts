import type {
  VehicleInfoResponse,
  TimeseriesDataRequest,
  TimeseriesDataResponse,
  TimeseriesAggregateRequest,
  TimeseriesAggregateResponse,
  LatestReadingsRequest,
  LatestReadingsResponse,
  HealthResponse
} from '@carlens/shared-types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiDebugContext = {
  reason?: string;
  source?: string;
  details?: unknown;
};

type RequestInitWithDebug = RequestInit & { debug?: ApiDebugContext };

async function fetchApi<T>(endpoint: string, options?: RequestInitWithDebug): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const startedAt = performance.now();
  const method = (options?.method || 'GET').toUpperCase();
  const debug = options?.debug;
  const logPrefix = `[API ${method}]`;
  // Log request start with context
  // Use console.debug to avoid noisy production logs; can be filtered in DevTools

  console.debug(logPrefix, '→', url, debug ? { debug } : '');

  try {
    const headers: HeadersInit = {
      Accept: 'application/json',
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    };
    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const durationMs = Math.round(performance.now() - startedAt);

      console.debug(logPrefix, '✖', url, {
        status: response.status,
        durationMs,
        error: errorData,
        debug,
      });
      throw new ApiError(response.status, errorData.error || errorData.message || 'Request failed');
    }

    const json = await response.json();
    const durationMs = Math.round(performance.now() - startedAt);

    console.debug(logPrefix, '✔', url, { status: response.status, durationMs, debug });
    return json as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    const durationMs = Math.round(performance.now() - startedAt);

    console.debug(logPrefix, '‼', url, { durationMs, error, debug });
    throw new ApiError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const vehicleApi = {
  // Health check
  async getHealth(debug?: ApiDebugContext): Promise<HealthResponse> {
    return fetchApi<HealthResponse>('/health', { debug });
  },

  // Vehicle info
  async getVehicleInfo(debug?: ApiDebugContext): Promise<VehicleInfoResponse> {
    return fetchApi<VehicleInfoResponse>('/api/vehicle/info', { debug });
  },

  // Timeseries data
  async getTimeseriesData(
    params: TimeseriesDataRequest = {},
    debug?: ApiDebugContext
  ): Promise<TimeseriesDataResponse> {
    console.log(debug)
    const searchParams = new URLSearchParams();

    if (params.startTime) searchParams.append('startTime', params.startTime);
    if (params.endTime) searchParams.append('endTime', params.endTime);
    if (params.vehicleId) searchParams.append('vehicleId', params.vehicleId);
    if (params.metrics) searchParams.append('metrics', params.metrics);
    if (params.interval) searchParams.append('interval', params.interval);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/timeseries/data${queryString ? `?${queryString}` : ''}`;

    return fetchApi<TimeseriesDataResponse>(endpoint, { debug });
  },

  // Aggregated data
  async getAggregateData(
    params: TimeseriesAggregateRequest = {},
    debug?: ApiDebugContext
  ): Promise<TimeseriesAggregateResponse> {
    const searchParams = new URLSearchParams();

    if (params.startTime) searchParams.append('startTime', params.startTime);
    if (params.endTime) searchParams.append('endTime', params.endTime);
    if (params.vehicleId) searchParams.append('vehicleId', params.vehicleId);
    if (params.metric) searchParams.append('metric', params.metric);
    if (params.interval) searchParams.append('interval', params.interval);
    if (params.operation) searchParams.append('operation', params.operation);

    const queryString = searchParams.toString();
    const endpoint = `/api/timeseries/aggregate${queryString ? `?${queryString}` : ''}`;

    return fetchApi<TimeseriesAggregateResponse>(endpoint, { debug });
  },

  // Latest readings
  async getLatestReadings(
    params: LatestReadingsRequest = {},
    debug?: ApiDebugContext
  ): Promise<LatestReadingsResponse> {
    const searchParams = new URLSearchParams();

    if (params.vehicleId) searchParams.append('vehicleId', params.vehicleId);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/timeseries/latest${queryString ? `?${queryString}` : ''}`;

    return fetchApi<LatestReadingsResponse>(endpoint, { debug });
  },

};

export { ApiError };