import { getAllNodes } from './transitGraph.js';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Finds the closest metro station or water metro jetty to a coordinate.
 * Feeder bus stops and walk-only nodes have no coordinates in data.json (the
 * source data doesn't publish them), so they're not candidates here.
 */
export function findNearestNode(lat, lng) {
  const candidates = getAllNodes().filter(
    (n) => typeof n.lat === 'number' && typeof n.lng === 'number'
  );
  if (candidates.length === 0) return null;

  let nearest = null;
  let nearestDistance = Infinity;
  for (const node of candidates) {
    const distance = haversineDistanceMeters(lat, lng, node.lat, node.lng);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = node;
    }
  }

  return { node: nearest, distanceMeters: nearestDistance };
}

export class GeolocationUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GeolocationUnavailableError';
  }
}

/**
 * Wraps the browser Geolocation API in a promise and resolves it to the
 * nearest known station/jetty.
 */
export function detectNearestStation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new GeolocationUnavailableError('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result = findNearestNode(position.coords.latitude, position.coords.longitude);
        if (!result) {
          reject(new GeolocationUnavailableError('No geocoded stations available to match against.'));
          return;
        }
        resolve(result);
      },
      (error) => {
        reject(new GeolocationUnavailableError(error.message || 'Location access was denied.'));
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  });
}
