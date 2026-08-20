import { describe, it, expect } from 'vitest';
import { parseDisruption } from './disruptionParser.js';

describe('parseDisruption', () => {
  it('blocks a water metro jetty mentioned by name', () => {
    const { blockedNodeIds } = parseDisruption(
      'High Court Water Metro Jetty operations are closed due to shallow channels.'
    );
    expect(blockedNodeIds.has('high_court')).toBe(true);
  });

  it('does not block the rail metro station sharing a name with a jetty', () => {
    const { blockedNodeIds } = parseDisruption('Vyttila Water Metro Jetty is closed for servicing.');
    expect(blockedNodeIds.has('vyttila_jetty')).toBe(true);
    expect(blockedNodeIds.has('vyttila')).toBe(false);
  });

  it('does not block the jetty when the text refers to the rail metro station', () => {
    const { blockedNodeIds } = parseDisruption('Vyttila Metro Station is closed due to a signal fault.');
    expect(blockedNodeIds.has('vyttila')).toBe(true);
    expect(blockedNodeIds.has('vyttila_jetty')).toBe(false);
  });

  it('blocks a feeder route by its short code', () => {
    const { blockedRouteIds } = parseDisruption('Feeder Bus MC-3 is delayed by 25 minutes due to gridlock.');
    expect(blockedRouteIds.size).toBeGreaterThan(0);
  });

  it('returns empty sets when nothing in the network is mentioned', () => {
    const { blockedNodeIds, blockedRouteIds } = parseDisruption('There is a citywide power outage.');
    expect(blockedNodeIds.size).toBe(0);
    expect(blockedRouteIds.size).toBe(0);
  });

  it('handles empty/undefined input without throwing', () => {
    expect(() => parseDisruption('')).not.toThrow();
    expect(() => parseDisruption(undefined)).not.toThrow();
  });
});
