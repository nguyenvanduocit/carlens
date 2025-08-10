import { describe, it, expect } from 'vitest'
import { getAppTimeZone, formatLocalDateTime, formatChartTime, formatChartAxisTime, parseGMT7DateTimeToUTC, APP_TIMEZONE } from '../timezone'

describe('Timezone utilities', () => {
  it('should get GMT+7 timezone', () => {
    const timezone = getAppTimeZone()
    expect(timezone).toBe('Asia/Bangkok')
    expect(timezone).toBe(APP_TIMEZONE)
  })

  it('should format date in GMT+7 timezone', () => {
    const testDate = new Date('2025-01-01T12:00:00Z') // Noon UTC
    const formatted = formatLocalDateTime(testDate)
    expect(formatted).toBeTruthy()
    expect(typeof formatted).toBe('string')
    // Should show 7:00 PM in GMT+7 (12:00 UTC + 7 hours)
    expect(formatted).toMatch(/7:00|19:00/)
  })

  it('should format chart time with full details in GMT+7', () => {
    const testDate = new Date('2025-01-01T12:00:00Z')
    const formatted = formatChartTime(testDate)
    expect(formatted).toBeTruthy()
    expect(typeof formatted).toBe('string')
    // Should include year, month, day, hour, minute, second in GMT+7
    expect(formatted).toMatch(/2025/)
    expect(formatted).toMatch(/7:00|19:00/) // GMT+7 time
  })

  it('should format chart axis time with shortened format in GMT+7', () => {
    const testDate = new Date('2025-01-01T12:00:00Z')
    const formatted = formatChartAxisTime(testDate)
    expect(formatted).toBeTruthy()
    expect(typeof formatted).toBe('string')
    // Should not include year or seconds but should show GMT+7 time
    expect(formatted).not.toMatch(/2025/)
    expect(formatted).toMatch(/7:00|19:00/) // GMT+7 time
  })

  it('should parse GMT+7 datetime to UTC', () => {
    const gmtPlus7Time = '08/08/2025 09:02:52 PM' // 9:02 PM GMT+7
    const utcDate = parseGMT7DateTimeToUTC(gmtPlus7Time)
    
    expect(utcDate).toBeInstanceOf(Date)
    expect(utcDate.getHours()).toBe(14) // Should be 2:02 PM UTC (9:02 PM - 7 hours)
  })

  it('should handle string timestamps in GMT+7', () => {
    const testTimestamp = '2025-01-01T12:00:00Z'
    const formatted = formatLocalDateTime(testTimestamp)
    expect(formatted).toBeTruthy()
    expect(formatted).toMatch(/7:00|19:00/) // GMT+7 time
  })

  it('should handle numeric timestamps in GMT+7', () => {
    const testTimestamp = new Date('2025-01-01T12:00:00Z').getTime()
    const formatted = formatLocalDateTime(testTimestamp)
    expect(formatted).toBeTruthy()
    expect(formatted).toMatch(/7:00|19:00/) // GMT+7 time
  })

  it('should handle invalid dates gracefully', () => {
    const invalidDate = parseGMT7DateTimeToUTC('invalid-date')
    expect(isNaN(invalidDate.getTime())).toBe(true)
  })
})