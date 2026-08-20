import { describe, it, expect } from 'vitest';
import { getLiveDisruptions } from './disruptionFeed.js';

describe('getLiveDisruptions', () => {
  it('returns the requested number of disruptions with the expected shape', () => {
    const disruptions = getLiveDisruptions(1700000000000, 3);
    expect(disruptions).toHaveLength(3);
    disruptions.forEach((d) => {
      expect(typeof d.id).toBe('string');
      expect(typeof d.title).toBe('string');
      expect(typeof d.targetRoute).toBe('string');
      expect(typeof d.eventText).toBe('string');
    });
  });

  it('returns unique candidate ids (no duplicate jetty/route entries)', () => {
    const disruptions = getLiveDisruptions(1700000000000, 3);
    const ids = disruptions.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is deterministic for the same timestamp within a time bucket', () => {
    const a = getLiveDisruptions(1700000000000, 3);
    const b = getLiveDisruptions(1700000000000 + 60_000, 3);
    expect(a).toEqual(b);
  });

  it('varies the selection or wording across a wide time range', () => {
    const snapshots = Array.from({ length: 10 }, (_, i) =>
      getLiveDisruptions(1700000000000 + i * 20 * 60 * 1000, 3).map((d) => d.eventText).join('|')
    );
    expect(new Set(snapshots).size).toBeGreaterThan(1);
  });
});
