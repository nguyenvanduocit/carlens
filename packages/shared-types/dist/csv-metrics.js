// CSV Metrics Constants - Single source of truth for all metric field names
export const CSV_METRICS = {
    // Time and core fields
    TIME: 'Time (sec)',
    // Engine performance
    ENGINE_RPM: 'Engine RPM (RPM)',
    CALCULATED_LOAD_VALUE_PCT: 'Calculated load value (%)',
    ABSOLUTE_LOAD_VALUE_PCT: 'Absolute load value (%)',
    ACTUAL_ENGINE_TORQUE_PCT: 'Actual engine - percent torque (%)',
    ENGINE_TORQUE_IDLE_PCT: 'Engine percent torque at idle (%)',
    ENGINE_POWER_PS: 'Engine Power (PS)',
    ENGINE_TORQUE_NM: 'Engine Torque (N•m)',
    // Temperature sensors
    ENGINE_COOLANT_TEMP_C: 'Engine coolant temperature (°C)',
    INTAKE_AIR_TEMP_C: 'Intake air temperature (°C)',
    ENGINE_OIL_TEMP_C: 'Engine oil temperature (°C)',
    TRANSMISSION_FLUID_TEMP_C: 'Raw Transmission Fluid Temperature (TFT) (°C)',
    // Pressure sensors
    INTAKE_MANIFOLD_PRESSURE_KPA: 'Intake manifold absolute pressure (kPa)',
    BAROMETRIC_PRESSURE_KPA: 'Barometric pressure (kPa)',
    FUEL_RAIL_PRESSURE_KPA: 'Fuel rail pressure (absolute) (kPa)',
    FUEL_PRESSURE_SENSOR_B_KPA: 'Fuel Pressure Sensor B - Absolute Pressure - Raw (kPa)',
    BOOST_KPA: 'Boost (kPa)',
    // Vehicle dynamics
    VEHICLE_SPEED_KMH: 'Vehicle speed (km/h)',
    ACCELERATION_MS2: 'Acceleration (m/s²)',
    STEERING_ANGLE_DEG: 'Steering Pinion Angle (deg)',
    // Throttle and pedal positions
    ACCELERATOR_PEDAL_POSITION_PCT: 'Accelerator pedal position D (%)',
    THROTTLE_POSITION_DESIRED_PCT: 'Throttle Position - Desired (%)',
    // Fuel system
    MASS_AIR_FLOW_RATE_GS: 'Mass air flow rate (g/s)',
    ENGINE_FUEL_RATE_LH: 'Engine fuel rate (l/hr)',
    FUEL_RATE_ENGINE_GS: 'Fuel Rate - Engine Fuel Rate (g/s)',
    FUEL_INJECTION_TIMING_DEG: 'Fuel injection timing (deg)',
    // Transmission
    TRANSMISSION_GEAR: 'Transmission Gear Engaged',
    // GPS coordinates
    LATITUDE_DEG: 'Latitude (deg)',
    LONGITUDE_DEG: 'Longitude (deg)'
};
// All available metric field names as array (generated from CSV_METRICS)
export const AVAILABLE_METRICS = Object.values(CSV_METRICS);
// Helper function to check if a header is a known metric
export function isKnownMetric(header) {
    return AVAILABLE_METRICS.includes(header);
}
// Helper function to generate constant names for new metrics
export function generateMetricConstantName(metricValue) {
    return metricValue
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}
