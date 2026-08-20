import transitData from '../data.json' with { type: 'json' };
import { getAllNodes } from './transitGraph.js';

/**
 * Scans free-text disruption copy (e.g. "High Court Water Metro Jetty is
 * closed") for known station/jetty names and route names, and treats any
 * match as something to route around. This generalizes disruption handling
 * to any station/route in the network instead of a fixed set of presets —
 * "delayed" is treated the same as "closed" (avoid it) since the simulator's
 * job is to demonstrate a reroute, not to model partial degradation.
 */
// Strips generic suffix words so "High Court Jetty" still matches disruption
// copy phrased as "High Court Water Metro Jetty" (the distinguishing part is
// "High Court" — "jetty"/"metro"/"station" alone would match too much).
function coreName(name) {
  return name
    .toLowerCase()
    .replace(/\b(water metro|jetty|metro station|metro|station|terminal)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// After suffix-stripping, a place like "Vyttila" (metro station) and
// "Vyttila Jetty" (water metro) collapse to the same core name "vyttila" —
// stripping loses which facility the text actually meant. Use whether the
// text mentions water-metro vs. rail-metro vocabulary to disambiguate.
const WATER_METRO_HINTS = /\b(jetty|water metro|ferry|sailing|catamaran)\b/;
const RAIL_METRO_HINTS = /\b(metro station|blue line|train)\b/;

export function parseDisruption(disruptionText) {
  const text = (disruptionText || '').toLowerCase();
  const blockedNodeIds = new Set();
  const blockedRouteIds = new Set();

  const mentionsWaterMetro = WATER_METRO_HINTS.test(text);
  const mentionsRailMetro = RAIL_METRO_HINTS.test(text);

  for (const node of getAllNodes()) {
    const core = coreName(node.name);
    if (core.length < 4 || !text.includes(core)) continue;
    if (node.kind === 'metro' && mentionsWaterMetro && !mentionsRailMetro) continue;
    if (node.kind === 'water_metro' && mentionsRailMetro && !mentionsWaterMetro) continue;
    blockedNodeIds.add(node.id);
  }

  const routes = [...transitData.water_metro.routes, ...transitData.feeder_buses];
  for (const route of routes) {
    const label = route.name.toLowerCase();
    const shortCode = route.id.toLowerCase();
    if (text.includes(label) || (shortCode.length >= 3 && text.includes(shortCode))) {
      blockedRouteIds.add(route.id);
    }
    // e.g. "MC-3" style short codes embedded in the route name, like "MC-1: Vyttila Hub Loop"
    const codeMatch = route.name.match(/^([A-Z]{1,4}-?\d+)/i);
    if (codeMatch && text.includes(codeMatch[1].toLowerCase())) {
      blockedRouteIds.add(route.id);
    }
  }

  return { blockedNodeIds, blockedRouteIds };
}
