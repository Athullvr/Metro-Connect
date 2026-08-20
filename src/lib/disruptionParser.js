import transitData from '../data.json';
import { getAllNodes } from './transitGraph';

/**
 * Scans free-text disruption copy (e.g. "High Court Water Metro Jetty is
 * closed") for known station/jetty names and route names, and treats any
 * match as something to route around. This generalizes disruption handling
 * to any station/route in the network instead of a fixed set of presets —
 * "delayed" is treated the same as "closed" (avoid it) since the simulator's
 * job is to demonstrate a reroute, not to model partial degradation.
 */
export function parseDisruption(disruptionText) {
  const text = (disruptionText || '').toLowerCase();
  const blockedNodeIds = new Set();
  const blockedRouteIds = new Set();

  for (const node of getAllNodes()) {
    if (node.name.length >= 4 && text.includes(node.name.toLowerCase())) {
      blockedNodeIds.add(node.id);
    }
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
