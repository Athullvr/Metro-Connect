import transitData from '../data.json' with { type: 'json' };
import { getNode } from './transitGraph.js';

// No public real-time disruption API exists for Kochi Metro/Water Metro, so
// this generates plausible "live" disruptions from the real network entities
// in data.json (real jetties/routes, not fabricated place names) and rotates
// which ones are "active" on a time bucket, instead of a fixed set of demo
// presets. Reasons are cosmetic flavor text drawn from a small realistic pool.

const WATER_METRO_REASONS = [
  'due to shallow channels at low tide',
  'due to scheduled pontoon maintenance',
  'due to a mechanical fault on the vessel'
];

const FEEDER_DELAY_REASONS = [
  'due to traffic congestion on the feeder corridor',
  'due to a mechanical issue with the e-bus',
  'due to heavy monsoon rainfall'
];

const ROAD_LINK_REASONS = [
  'due to heavy traffic on the Goshree Bridges approach',
  'due to a vehicle breakdown blocking a lane',
  'due to waterlogging after monsoon rain'
];

// FNV-1a string hash, used once per candidate id (stable across calls).
function fnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Murmur3-style finalizer to combine an id hash with the time bucket so the
// same (id, bucket) pair always deterministically picks the same
// reason/order — reproducible and testable instead of relying on
// Math.random(). Plain `idHash + bucket` or appending the bucket to the
// string before hashing were tried first, but both barely reorder candidates
// between adjacent buckets since the bucket only nudges the last few bits/
// characters; this finalizer's shift-xor-multiply rounds fully avalanche
// a single-bit change in the input.
function mix(idHash, bucket) {
  let h = (idHash ^ Math.imul(bucket, 0x9e3779b1)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function pick(list, seed) {
  return list[seed % list.length];
}

function buildCandidates() {
  const candidates = [];

  transitData.water_metro.jetties.forEach((jettyData) => {
    const jetty = getNode(jettyData.id);
    if (!jetty) return;
    const servingRoute = transitData.water_metro.routes.find((r) => r.stops.includes(jettyData.id));
    const otherStopId = servingRoute?.stops.find((s) => s !== jettyData.id);
    const other = otherStopId ? getNode(otherStopId) : null;
    candidates.push({
      id: `live_wm_${jettyData.id}`,
      kind: 'water_metro',
      title: `${jetty.name} Disruption`,
      targetRoute: other?.name || jetty.name,
      buildEventText: (seed) =>
        `${jetty.name} Water Metro Jetty operations are suspended ${pick(WATER_METRO_REASONS, seed)}.`
    });
  });

  transitData.feeder_buses.forEach((route) => {
    const destStop = route.stops.slice(1).find((s) => s !== route.stops[0]) || route.stops[route.stops.length - 1];
    const codeMatch = route.name.match(/^([A-Z]{1,4}-?\d+)/i);
    const code = codeMatch ? codeMatch[1] : route.id;
    candidates.push({
      id: `live_fb_${route.id}`,
      kind: 'feeder_bus',
      title: `Feeder ${code} Delay`,
      targetRoute: destStop,
      buildEventText: (seed) =>
        `Feeder Bus ${code} is delayed by ${15 + (seed % 4) * 5} minutes ${pick(FEEDER_DELAY_REASONS, seed)}.`
    });
  });

  (transitData.road_links || []).forEach((link) => {
    const to = getNode(link.to);
    candidates.push({
      id: `live_rl_${link.id}`,
      kind: 'road_link',
      title: `${link.name} Disruption`,
      targetRoute: to?.name || link.name,
      buildEventText: (seed) => `${link.name} is congested ${pick(ROAD_LINK_REASONS, seed)}.`
    });
  });

  return candidates;
}

const TIME_BUCKET_MS = 15 * 60 * 1000;

/**
 * Returns `count` "currently active" disruptions, deterministically rotated
 * by a 15-minute time bucket so the feed changes over the course of a day
 * but is reproducible (and testable) for a given `now`.
 */
export function getLiveDisruptions(now = Date.now(), count = 3) {
  const bucket = Math.floor(now / TIME_BUCKET_MS);
  const candidates = buildCandidates();

  const ordered = candidates
    .map((c) => ({ candidate: c, order: mix(fnv1a(c.id), bucket) }))
    .sort((a, b) => a.order - b.order)
    .slice(0, Math.min(count, candidates.length));

  return ordered.map(({ candidate, order }) => ({
    id: candidate.id,
    kind: candidate.kind,
    title: candidate.title,
    targetRoute: candidate.targetRoute,
    eventText: candidate.buildEventText(order)
  }));
}
