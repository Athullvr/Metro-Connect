import { describe, it, expect } from 'vitest';
import { validateItinerary, assertValidItinerary, InvalidItineraryError } from './itinerarySchema.js';

const VALID_ITINERARY = {
  legs: [
    { mode: 'metro', name: 'Blue Line Metro', from: 'Aluva', to: 'Vyttila', duration: 30, cost: 20, details: '10 stops.' }
  ],
  total_duration: 30,
  total_cost: 20,
  explanation: 'Routed via Metro across 1 leg.'
};

describe('validateItinerary', () => {
  it('accepts a well-formed itinerary', () => {
    expect(validateItinerary(VALID_ITINERARY)).toEqual({ valid: true, errors: [] });
  });

  it('rejects a non-object response', () => {
    expect(validateItinerary(null).valid).toBe(false);
    expect(validateItinerary('a string').valid).toBe(false);
    expect(validateItinerary(undefined).valid).toBe(false);
  });

  it('rejects an empty or missing legs array', () => {
    expect(validateItinerary({ ...VALID_ITINERARY, legs: [] }).valid).toBe(false);
    expect(validateItinerary({ ...VALID_ITINERARY, legs: undefined }).valid).toBe(false);
  });

  it('rejects an invalid mode', () => {
    const bad = { ...VALID_ITINERARY, legs: [{ ...VALID_ITINERARY.legs[0], mode: 'spaceship' }] };
    const { valid, errors } = validateItinerary(bad);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('mode'))).toBe(true);
  });

  it('rejects negative or non-numeric duration/cost', () => {
    expect(validateItinerary({ ...VALID_ITINERARY, total_duration: -1 }).valid).toBe(false);
    expect(validateItinerary({ ...VALID_ITINERARY, total_cost: 'free' }).valid).toBe(false);
  });

  it('rejects a missing explanation', () => {
    expect(validateItinerary({ ...VALID_ITINERARY, explanation: '' }).valid).toBe(false);
  });
});

describe('assertValidItinerary', () => {
  it('returns the itinerary unchanged when valid', () => {
    expect(assertValidItinerary(VALID_ITINERARY)).toBe(VALID_ITINERARY);
  });

  it('throws InvalidItineraryError with the field errors when invalid', () => {
    expect(() => assertValidItinerary({})).toThrow(InvalidItineraryError);
  });
});
