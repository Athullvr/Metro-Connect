import { describe, it, expect, vi, afterEach } from 'vitest';
import { haversineDistanceMeters, findNearestNode, detectNearestStation, GeolocationUnavailableError } from './geolocation.js';

describe('haversineDistanceMeters', () => {
  it('returns ~0 for the same point', () => {
    expect(haversineDistanceMeters(10.1, 76.3, 10.1, 76.3)).toBeCloseTo(0, 3);
  });

  it('returns a plausible distance between two known Kochi stations', () => {
    // Aluva to Thrippunithura spans the whole Blue Line (~25km corridor).
    const distance = haversineDistanceMeters(10.1098, 76.3496, 9.9503, 76.3516);
    expect(distance).toBeGreaterThan(15000);
    expect(distance).toBeLessThan(30000);
  });
});

describe('findNearestNode', () => {
  it('finds the nearest station to a coordinate close to a known station', () => {
    // Just off Vyttila metro station's real coordinates.
    const result = findNearestNode(9.9676, 76.3206);
    expect(result.node.id).toBe('vyttila');
    expect(result.distanceMeters).toBeLessThan(500);
  });

  it('only considers nodes with coordinates (metro stations and jetties)', () => {
    const result = findNearestNode(10.1098, 76.3496);
    expect(['metro', 'water_metro']).toContain(result.node.kind);
  });
});

describe('detectNearestStation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves the nearest station from the browser geolocation API', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (success) => {
          success({ coords: { latitude: 9.9676, longitude: 76.3206 } });
        }
      }
    });

    const result = await detectNearestStation();
    expect(result.node.id).toBe('vyttila');
  });

  it('rejects with GeolocationUnavailableError when geolocation is unsupported', async () => {
    vi.stubGlobal('navigator', {});
    await expect(detectNearestStation()).rejects.toThrow(GeolocationUnavailableError);
  });

  it('rejects with GeolocationUnavailableError when the user denies permission', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (_success, error) => {
          error({ message: 'User denied Geolocation' });
        }
      }
    });

    await expect(detectNearestStation()).rejects.toThrow(GeolocationUnavailableError);
  });
});
