import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { planRoute, replanRoute, UnresolvedStationError } from './openai.js';

const VALID_ITINERARY = {
  legs: [
    { mode: 'metro', name: 'Blue Line Metro', from: 'Aluva', to: 'Vyttila', duration: 30, cost: 20, details: '10 stops.' }
  ],
  total_duration: 30,
  total_cost: 20,
  explanation: 'Live agent response.'
};

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('planRoute (simulator mode)', () => {
  it('resolves a real route between two known stations', async () => {
    const itinerary = await planRoute('Aluva', 'Vyttila', {}, true);
    expect(itinerary.legs.length).toBeGreaterThan(0);
    expect(itinerary.total_duration).toBeGreaterThan(0);
  });

  it('throws UnresolvedStationError for an unmatchable station', async () => {
    await expect(planRoute('Aluva', 'xyzzyqqqqqq123', {}, true)).rejects.toThrow(UnresolvedStationError);
  });
});

describe('planRoute (live mode)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns the live response when it is well-formed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(VALID_ITINERARY)));

    const result = await planRoute('Aluva', 'Vyttila', {}, false);
    expect(result).toEqual(VALID_ITINERARY);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on a 500 then succeeds', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'boom' }, 500))
      .mockResolvedValueOnce(jsonResponse(VALID_ITINERARY));
    vi.stubGlobal('fetch', fetchMock);

    const promise = planRoute('Aluva', 'Vyttila', {}, false);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual(VALID_ITINERARY);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a 4xx and falls back to the simulator', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'bad request' }, 400));
    vi.stubGlobal('fetch', fetchMock);

    const promise = planRoute('Aluva', 'Vyttila', {}, false);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.legs.length).toBeGreaterThan(0); // simulator fallback still returns a real route
  });

  it('falls back to the simulator when the response fails schema validation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ nonsense: true })));

    const promise = planRoute('Aluva', 'Vyttila', {}, false);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.legs.length).toBeGreaterThan(0);
    expect(result.explanation).not.toBe(undefined);
  });

  it('falls back to the simulator after exhausting retries on repeated failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'down' }, 503));
    vi.stubGlobal('fetch', fetchMock);

    const promise = planRoute('Aluva', 'Vyttila', {}, false);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(3); // initial + 2 retries
    expect(result.legs.length).toBeGreaterThan(0);
  });
});

describe('replanRoute (simulator mode)', () => {
  it('reroutes around a blocked intermediate jetty via the road-link backup', async () => {
    const original = await planRoute('MG Road', 'Fort Kochi', {}, true);
    expect(original.legs.some((l) => l.mode === 'water_metro')).toBe(true);

    const replanned = await replanRoute(
      original,
      'High Court Water Metro Jetty operations are closed due to shallow channels.',
      true
    );
    expect(replanned.legs.length).toBeGreaterThan(0);
    expect(replanned.legs.some((l) => l.mode === 'water_metro' && l.from === 'High Court Jetty')).toBe(false);
    expect(replanned.explanation).toContain('Rerouted');
  });
});
