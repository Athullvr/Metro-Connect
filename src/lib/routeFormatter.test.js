import { describe, it, expect } from 'vitest';
import { findShortestPath } from './transitGraph.js';
import { formatItinerary } from './routeFormatter.js';
import { validateItinerary } from './itinerarySchema.js';

describe('formatItinerary', () => {
  it('produces a schema-valid itinerary for a metro-only path', () => {
    const path = findShortestPath('aluva', 'vyttila');
    const itinerary = formatItinerary(path);
    expect(validateItinerary(itinerary).valid).toBe(true);
    expect(itinerary.legs[0].from).toBe('Aluva');
    expect(itinerary.legs[itinerary.legs.length - 1].to).toBe('Vyttila');
    expect(itinerary.total_duration).toBeGreaterThan(0);
  });

  it('merges consecutive same-mode/same-route steps into one leg', () => {
    const path = findShortestPath('aluva', 'thrippunithura');
    const itinerary = formatItinerary(path);
    // The whole line is one metro route, so it should collapse to a single leg.
    expect(itinerary.legs.filter((l) => l.mode === 'metro').length).toBe(1);
  });

  it('changes the explanation text based on constraints', () => {
    const path = findShortestPath('aluva', 'vyttila');
    const fastest = formatItinerary(path, {});
    const cheapest = formatItinerary(path, { lowCost: true });
    expect(fastest.explanation).not.toBe(cheapest.explanation);
  });
});
