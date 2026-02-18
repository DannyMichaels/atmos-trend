import countriesJson from '@/data/globe-countries.json';
import polygonsJson from '@/data/globe-polygons.json';

function pointInRing(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; // GeoJSON uses [lng, lat]
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lat: number, lng: number, coords: number[][][]): boolean {
  if (!pointInRing(lat, lng, coords[0])) return false;
  // Check holes
  for (let i = 1; i < coords.length; i++) {
    if (pointInRing(lat, lng, coords[i])) return false;
  }
  return true;
}

/** Returns the Alpha-2 country code (e.g. "US") for a given lat/lng, or null. */
export default function findCountryAtPoint(
  lat: number,
  lng: number
): string | null {
  for (const feature of (polygonsJson as any).features) {
    const { type, coordinates } = feature.geometry;
    let found = false;

    if (type === 'Polygon') {
      found = pointInPolygon(lat, lng, coordinates);
    } else if (type === 'MultiPolygon') {
      found = coordinates.some((poly: number[][][]) =>
        pointInPolygon(lat, lng, poly)
      );
    }

    if (found) {
      const alpha3: string = feature.properties['ADM0_A3'];
      const match = countriesJson.find((c) => c['Alpha-3 code'] === alpha3);
      return match?.['Alpha-2 code'] ?? null;
    }
  }
  return null;
}
