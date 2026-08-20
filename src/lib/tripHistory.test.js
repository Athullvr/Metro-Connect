import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveTrip, getTrips, clearTrips } from './tripHistory.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key)
  };
}

describe('tripHistory', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an empty list when nothing has been saved', () => {
    expect(getTrips()).toEqual([]);
  });

  it('saves a trip and returns it most-recent-first', () => {
    saveTrip({ origin: 'Aluva', destination: 'Vyttila', constraints: {}, itinerary: { legs: [] }, timestamp: 1 });
    saveTrip({ origin: 'MG Road', destination: 'Fort Kochi', constraints: {}, itinerary: { legs: [] }, timestamp: 2 });

    const trips = getTrips();
    expect(trips).toHaveLength(2);
    expect(trips[0].origin).toBe('MG Road');
    expect(trips[1].origin).toBe('Aluva');
  });

  it('deduplicates a repeated origin/destination pair (case-insensitive), keeping the latest', () => {
    saveTrip({ origin: 'Aluva', destination: 'Vyttila', constraints: {}, itinerary: { legs: [] }, timestamp: 1 });
    saveTrip({ origin: 'aluva', destination: 'VYTTILA', constraints: { lowCost: true }, itinerary: { legs: [] }, timestamp: 2 });

    const trips = getTrips();
    expect(trips).toHaveLength(1);
    expect(trips[0].timestamp).toBe(2);
  });

  it('caps history at 10 entries', () => {
    for (let i = 0; i < 15; i++) {
      saveTrip({ origin: `Origin${i}`, destination: `Dest${i}`, constraints: {}, itinerary: { legs: [] }, timestamp: i });
    }
    expect(getTrips()).toHaveLength(10);
    expect(getTrips()[0].origin).toBe('Origin14');
  });

  it('clears all trips', () => {
    saveTrip({ origin: 'Aluva', destination: 'Vyttila', constraints: {}, itinerary: { legs: [] }, timestamp: 1 });
    clearTrips();
    expect(getTrips()).toEqual([]);
  });
});
