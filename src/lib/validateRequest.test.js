import { describe, it, expect } from 'vitest';
import { validatePlanRequest, validateReplanRequest, sanitizeString } from '../../../api/_lib/validateRequest.js';

describe('sanitizeString', () => {
  it('trims and caps max length', () => {
    expect(sanitizeString('  hello world  ', 5)).toBe('hello');
  });

  it('handles non-string inputs safely', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(123)).toBe('');
  });
});

describe('validatePlanRequest', () => {
  it('accepts valid origin and destination', () => {
    const res = validatePlanRequest({ origin: 'Aluva', destination: 'Fort Kochi' });
    expect(res.valid).toBe(true);
    expect(res.data.origin).toBe('Aluva');
    expect(res.data.destination).toBe('Fort Kochi');
  });

  it('rejects missing or empty origin/destination', () => {
    expect(validatePlanRequest({ origin: '', destination: 'Fort Kochi' }).valid).toBe(false);
    expect(validatePlanRequest({ destination: 'Fort Kochi' }).valid).toBe(false);
    expect(validatePlanRequest({ origin: 'Aluva' }).valid).toBe(false);
  });

  it('rejects overly long strings', () => {
    const longStr = 'a'.repeat(150);
    expect(validatePlanRequest({ origin: longStr, destination: 'Fort Kochi' }).valid).toBe(false);
  });
});

describe('validateReplanRequest', () => {
  it('accepts valid itinerary and disruption text', () => {
    const res = validateReplanRequest({
      itinerary: { legs: [] },
      disruption: 'Vyttila water metro is closed'
    });
    expect(res.valid).toBe(true);
    expect(res.data.disruption).toBe('Vyttila water metro is closed');
  });

  it('rejects missing or invalid itinerary shape', () => {
    expect(validateReplanRequest({ itinerary: null, disruption: 'closed' }).valid).toBe(false);
    expect(validateReplanRequest({ itinerary: {}, disruption: 'closed' }).valid).toBe(false);
  });

  it('rejects empty disruption text', () => {
    expect(validateReplanRequest({ itinerary: { legs: [] }, disruption: '   ' }).valid).toBe(false);
  });
});
