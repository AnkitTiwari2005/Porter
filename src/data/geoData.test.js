import { describe, it, expect } from 'vitest';
import { CITIES, POPULAR_LOCATIONS } from './mockData';
import { CITY_COORDINATES, getCoordinatesForAddress, calculateGeoDistance } from './geoData';

describe('address -> coordinates', () => {
  for (const [cityId, list] of Object.entries(POPULAR_LOCATIONS)) {
    const city = CITIES.find((c) => c.id === cityId);
    for (const loc of list) {
      it(`${cityId}: suggestion "${loc.name}" resolves to its own lat/lng`, () => {
        const got = getCoordinatesForAddress(`${loc.name}, ${city.name}`, cityId);
        expect(calculateGeoDistance(got, [loc.lat, loc.lng])).toBeLessThan(3);
      });
    }
  }

  for (const city of CITIES) {
    it(`${city.id}: has a coordinate table`, () => {
      expect(CITY_COORDINATES[city.id]).toBeDefined();
    });
  }

  it('is deterministic: a trailing space does not move the pin', () => {
    expect(getCoordinatesForAddress('12 Some Lane, Mumbai', 'mumbai'))
      .toEqual(getCoordinatesForAddress('12 Some Lane, Mumbai ', 'mumbai'));
  });

  it('uses the GPS coordinates when the text carries them', () => {
    const [lat, lng] = getCoordinatesForAddress('Current GPS Location (30.9010, 75.8573)', 'chandigarh');
    expect(lat).toBeCloseTo(30.901, 3);
    expect(lng).toBeCloseTo(75.8573, 3);
  });
});
