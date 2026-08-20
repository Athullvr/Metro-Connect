import { matchStation } from '../lib/stationMatcher.js';
import { findShortestPath, getNode } from '../lib/transitGraph.js';
import { formatItinerary } from '../lib/routeFormatter.js';
import { parseDisruption } from '../lib/disruptionParser.js';

export class UnresolvedStationError extends Error {
  constructor(message, suggestions = []) {
    super(message);
    this.name = 'UnresolvedStationError';
    this.suggestions = suggestions;
  }
}

export class NoRouteFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NoRouteFoundError';
  }
}

// Local Simulator: real Dijkstra shortest-path over the network in data.json,
// so it handles any valid origin/destination pair rather than a handful of
// hardcoded demo routes.
const getLocalPlannedRoute = (origin, destination, constraints = {}) => {
  const originMatch = matchStation(origin);
  if (!originMatch.nodeId) {
    throw new UnresolvedStationError(
      `Couldn't find a station, jetty, or landmark matching "${origin}".`,
      originMatch.suggestions
    );
  }

  const destMatch = matchStation(destination);
  if (!destMatch.nodeId) {
    throw new UnresolvedStationError(
      `Couldn't find a station, jetty, or landmark matching "${destination}".`,
      destMatch.suggestions
    );
  }

  if (originMatch.nodeId === destMatch.nodeId) {
    throw new NoRouteFoundError('Origin and destination resolve to the same stop.');
  }

  const path = findShortestPath(originMatch.nodeId, destMatch.nodeId, { constraints });
  if (!path) {
    throw new NoRouteFoundError(
      `No connecting route found between ${getNode(originMatch.nodeId).name} and ${getNode(destMatch.nodeId).name}.`
    );
  }

  return formatItinerary(path, constraints);
};

const getLocalReplannedRoute = (currentItinerary, disruptionType) => {
  if (!currentItinerary?.legs?.length) {
    throw new NoRouteFoundError('No active itinerary to reroute.');
  }

  const originMatch = matchStation(currentItinerary.legs[0].from);
  const destMatch = matchStation(currentItinerary.legs[currentItinerary.legs.length - 1].to);
  if (!originMatch.nodeId || !destMatch.nodeId) {
    throw new NoRouteFoundError('Could not re-anchor the current itinerary to the network.');
  }

  const { blockedNodeIds, blockedRouteIds } = parseDisruption(disruptionType);
  const path = findShortestPath(originMatch.nodeId, destMatch.nodeId, {
    constraints: {},
    blockedNodeIds,
    blockedRouteIds
  });

  if (!path) {
    throw new NoRouteFoundError('No alternative route avoids the reported disruption.');
  }

  const replanned = formatItinerary(path, {});
  replanned.explanation = `Rerouted to avoid the disruption: "${disruptionType}". ${replanned.explanation}`;
  return replanned;
};

/**
 * Plans a route from origin to destination.
 * Can use the live Copilot proxy if useSimulator is false. The proxy holds the
 * OpenAI API key server-side — the browser never sees or sends it.
 */
export const planRoute = async (origin, destination, constraints = '', useSimulator = true) => {
  if (useSimulator) {
    // Artificial latency for visual feel
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getLocalPlannedRoute(origin, destination, constraints);
  }

  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, constraints })
    });

    if (!response.ok) {
      throw new Error(`Planner proxy error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Planner Agent failed, falling back to Simulator:', error);
    return getLocalPlannedRoute(origin, destination, constraints);
  }
};

/**
 * Reroutes an itinerary in response to a disruption.
 */
export const replanRoute = async (currentItinerary, disruption, useSimulator = true) => {
  if (useSimulator) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getLocalReplannedRoute(currentItinerary, disruption);
  }

  try {
    const response = await fetch('/api/replan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itinerary: currentItinerary, disruption })
    });

    if (!response.ok) {
      throw new Error(`Adapter proxy error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Adapter Agent failed, falling back to Simulator:', error);
    return getLocalReplannedRoute(currentItinerary, disruption);
  }
};
