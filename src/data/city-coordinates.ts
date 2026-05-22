/**
 * Mock city coordinates for map centering.
 * Used by Browse map view and location picker cities.
 */

export interface CityCoordinates {
  latitude: number;
  longitude: number;
}

export const CITY_COORDINATES: Record<string, CityCoordinates> = {
  "Mexico City": { latitude: 19.4326, longitude: -99.1332 },
  Monterrey: { latitude: 25.6866, longitude: -100.3161 },
  Guadalajara: { latitude: 20.6597, longitude: -103.3496 },
  Oberlin: { latitude: 41.2932, longitude: -82.2174 },
};

const DEFAULT_CITY = "Mexico City";

export function getCityCoordinates(cityName: string): CityCoordinates {
  return CITY_COORDINATES[cityName] ?? CITY_COORDINATES[DEFAULT_CITY];
}
