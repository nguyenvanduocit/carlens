/**
 * Timezone utilities for consistent date/time formatting across the webapp
 * Server sends GMT+7 timestamps with timezone info (+07:00 suffix)
 * Client works directly with these timestamps without conversion
 */

/**
 * Application timezone - GMT+7 (Asia/Bangkok)
 */
export const APP_TIMEZONE = 'Asia/Bangkok'

/**
 * Get the application timezone (GMT+7)
 */
export const getAppTimeZone = (): string => {
  return APP_TIMEZONE
}

/**
 * Format a GMT+7 timestamp string for display
 * Server already sends GMT+7 timestamps, so no timezone conversion needed
 * @param timestamp GMT+7 timestamp string from server (with +07:00 suffix)
 * @param options Optional formatting options
 */
export const formatLocalDateTime = (
  timestamp: Date | string | number, 
  options?: Intl.DateTimeFormatOptions
): string => {
  // If it's already a GMT+7 timestamp string from server, parse it directly
  const dateObj = new Date(timestamp)
  
  // Ensure we display in GMT+7 timezone to preserve server's timezone context
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: APP_TIMEZONE, // Force GMT+7 display
    ...options
  }
  return dateObj.toLocaleString('en-US', defaultOptions)
}

/**
 * Parse a datetime string assuming it's in GMT+7 timezone and convert to UTC
 * Used for CSV parsing where timestamps don't specify timezone but are GMT+7
 * @param dateTimeString DateTime string in format like "08/08/2025 09:02:52.6840 PM"
 * @returns UTC Date object
 */
export const parseGMT7DateTimeToUTC = (dateTimeString: string): Date => {
  // Parse the date string assuming it's in GMT+7
  const localDate = new Date(dateTimeString)
  
  // If the date is invalid, return it as-is
  if (isNaN(localDate.getTime())) {
    return localDate
  }
  
  // Create a new date by manually adjusting for GMT+7 offset
  // GMT+7 means local time is 7 hours ahead of UTC
  // So to convert to UTC, we subtract 7 hours
  const utcDate = new Date(localDate.getTime() - (7 * 60 * 60 * 1000))
  
  return utcDate
}

/**
 * Format timestamp for chart tooltips
 * Converts UTC timestamp to GMT+7 for display
 */
export const formatChartTime = (timestamp: Date | string | number): string => {
  return formatLocalDateTime(timestamp, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Format timestamp for chart axis labels
 * Converts UTC timestamp to GMT+7 for display
 */
export const formatChartAxisTime = (timestamp: Date | string | number): string => {
  return formatLocalDateTime(timestamp, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Create a GMT+7 date string for sending to server
 * @param date Date object in local time
 * @returns GMT+7 ISO string with timezone suffix
 */
export const createGMT7DateString = (date: Date): string => {
  // Create ISO string and replace Z with +07:00 to indicate GMT+7
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+07:00`
}

/**
 * Convert a UTC Date to GMT+7 timezone for display
 * @param utcDate UTC Date object
 * @returns Date object adjusted to GMT+7 for display purposes
 */
export const utcToGMT7 = (utcDate: Date): Date => {
  // Add 7 hours to UTC to get GMT+7
  return new Date(utcDate.getTime() + (7 * 60 * 60 * 1000))
}