import type { RouteLocationRaw, Router } from 'vue-router'

export interface DashboardRouteParams {
  vehicleId?: string
  startDate?: string
  endDate?: string
}

/**
 * Helper function to navigate to dashboard with vehicle and date range parameters
 * Provides debugging information when enabled
 */
export function navigateToDashboard(
  router: Router, 
  params: DashboardRouteParams, 
  _debug = false
): Promise<void> {
  const { vehicleId, startDate, endDate } = params
  
  let route: RouteLocationRaw
  
  if (vehicleId) {
    const query: Record<string, string> = {}
    if (startDate) query.startDate = startDate
    if (endDate) query.endDate = endDate
    
    route = {
      name: 'dashboard-vehicle',
      params: { vehicleId },
      query
    }
  } else {
    // Navigate to root dashboard
    const query: Record<string, string> = {}
    if (vehicleId) query.vehicle = vehicleId
    if (startDate) query.startDate = startDate
    if (endDate) query.endDate = endDate
    
    route = {
      name: 'dashboard',
      query
    }
  }
  
  
  return router.push(route).then(() => {})
}

/**
 * Generate a shareable URL for the current dashboard state
 */
export function generateDashboardUrl(
  baseUrl: string,
  params: DashboardRouteParams
): string {
  const { vehicleId, startDate, endDate } = params
  
  if (vehicleId) {
    let url = `${baseUrl}/dashboard/${encodeURIComponent(vehicleId)}`
    const queryParams = []
    
    if (startDate) queryParams.push(`startDate=${encodeURIComponent(startDate)}`)
    if (endDate) queryParams.push(`endDate=${encodeURIComponent(endDate)}`)
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`
    }
    
    return url
  }
  
  const queryParams = []
  if (vehicleId) queryParams.push(`vehicle=${encodeURIComponent(vehicleId)}`)
  if (startDate) queryParams.push(`startDate=${encodeURIComponent(startDate)}`)
  if (endDate) queryParams.push(`endDate=${encodeURIComponent(endDate)}`)
  
  return queryParams.length > 0 ? `${baseUrl}/?${queryParams.join('&')}` : baseUrl
}

