import { describe, it, expect } from 'vitest';
import { matchStation } from './stationMatcher.js';

describe('matchStation', () => {
  it('resolves an exact station name', () => {
    const result = matchStation('Aluva');
    expect(result.nodeId).toBe('aluva');
    expect(result.exact).toBe(true);
  });

  it('is case- and whitespace-insensitive', () => {
    const result = matchStation('  aLuVa  ');
    expect(result.nodeId).toBe('aluva');
  });

  it('resolves a substring match', () => {
    const result = matchStation('Fort Kochi');
    expect(result.nodeId).toBeTruthy();
  });

  it('resolves a typo via fuzzy matching', () => {
    const result = matchStation('Alwua'); // transposed letters
    expect(result.nodeId).toBe('aluva');
    expect(result.fuzzy).toBe(true);
  });

  it('resolves a known Malayalam alias', () => {
    const result = matchStation('ആലുവ');
    expect(result.nodeId).toBe('aluva');
  });

  it('returns no match with suggestions for gibberish input', () => {
    const result = matchStation('xyzzyqqqqqq123');
    expect(result.nodeId).toBeNull();
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('returns no match for empty input', () => {
    expect(matchStation('')).toEqual({ nodeId: null, suggestions: [] });
    expect(matchStation('   ')).toEqual({ nodeId: null, suggestions: [] });
  });
});
