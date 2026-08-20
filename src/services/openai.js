import { matchStation } from '../lib/stationMatcher.js';
import { findShortestPath, getNode } from '../lib/transitGraph.js';
import { formatItinerary } from '../lib/routeFormatter.js';
import { parseDisruption } from '../lib/disruptionParser.js';
import { assertValidItinerary } from '../lib/itinerarySchema.js';

const FETCH_TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 400;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries transient failures (network errors, timeouts, 5xx/429) with
// exponential backoff. 4xx client errors are not retried since a retry
// would return the same result.
async function fetchWithRetry(url, options) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (response.ok) return response;

      if (response.status < 500 && response.status !== 429) {
        throw new Error(`Request failed: ${response.status}`);
      }
      lastError = new Error(`Request failed: ${response.status}`);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
    }
  }
  throw lastError;
}

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
    const response = await fetchWithRetry('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, constraints })
    });

    return assertValidItinerary(await response.json());
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
    const response = await fetchWithRetry('/api/replan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itinerary: currentItinerary, disruption })
    });

    return assertValidItinerary(await response.json());
  } catch (error) {
    console.error('Adapter Agent failed, falling back to Simulator:', error);
    return getLocalReplannedRoute(currentItinerary, disruption);
  }
};
