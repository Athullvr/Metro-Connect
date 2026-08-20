const STORAGE_KEY = 'metro-connect-trip-history';
const MAX_TRIPS = 10;

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persists a planned trip to localStorage, most recent first, deduplicating
 * a repeat of the same origin/destination pair and capping the list so it
 * doesn't grow unbounded across a long-lived browser session.
 */
export function saveTrip({ origin, destination, constraints, itinerary, timestamp }) {
  const trips = readRaw().filter(
    (t) => !(t.origin.toLowerCase() === origin.toLowerCase() && t.destination.toLowerCase() === destination.toLowerCase())
  );

  trips.unshift({
    id: `${timestamp}_${origin}_${destination}`,
    origin,
    destination,
    constraints,
    itinerary,
    timestamp
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips.slice(0, MAX_TRIPS)));
  } catch {
    // Storage full or unavailable (e.g. private browsing) — trip history is
    // a convenience feature, not critical, so fail silently.
  }
}

export function getTrips() {
  return readRaw();
}

export function clearTrips() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op — see saveTrip
  }
}
