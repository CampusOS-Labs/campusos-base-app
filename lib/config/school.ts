const DEFAULT_LAT = 18.529818636311767;
const DEFAULT_LNG = 73.93450485314058;
const DEFAULT_RADIUS_M = 100;

export type SchoolGeofence = {
  lat: number;
  lng: number;
  radiusM: number;
};

export function getSchoolGeofence(): SchoolGeofence {
  const lat = parseEnvNumber(process.env.SCHOOL_LAT, DEFAULT_LAT);
  const lng = parseEnvNumber(process.env.SCHOOL_LNG, DEFAULT_LNG);
  const radiusM = parseEnvNumber(process.env.SCHOOL_GEOFENCE_RADIUS_M, DEFAULT_RADIUS_M);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusM)) {
    throw new Error("Invalid school geofence configuration");
  }

  return { lat, lng, radiusM };
}

function parseEnvNumber(value: string | undefined, fallback: number): number {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return Number(trimmed);
}
