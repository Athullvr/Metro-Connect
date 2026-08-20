import transitData from '../data.json';

// Fare zones match the F1-F6 bands published by Kochi Metro, applied by
// station-count (not raw distance) — this is the same formula the project's
// original (now-retired) transit-data.js used, kept for consistency.
export function metroFare(stopsApart) {
  if (stopsApart <= 2) return 10;
  if (stopsApart <= 5) return 20;
  if (stopsApart <= 10) return 30;
  if (stopsApart <= 15) return 40;
  if (stopsApart <= 20) return 50;
  return 60;
}

const METRO_HOP_MINUTES = 2;
const METRO_HOP_MIN_FLOOR = 6;
// Feeder routes only publish a flat fare and headway, not per-stop timing —
// this fixed per-segment duration is an assumption, not sourced data.
const FEEDER_SEGMENT_MINUTES = 6;

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function humanize(id) {
  return id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function normalize(name) {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Builds the full multimodal graph once from data.json.
 * Nodes are deduplicated across metro/water/feeder data — e.g. the feeder
 * stop "Vyttila Metro" resolves to the same node as metro station "vyttila"
 * rather than becoming a disconnected duplicate.
 */
export function buildGraph() {
  const nodes = new Map(); // id -> { id, name, kind }
  const adjacency = new Map(); // id -> [{ to, mode, name, duration, cost, details, routeId }]

  const addNode = (id, name, kind) => {
    if (!nodes.has(id)) {
      nodes.set(id, { id, name, kind });
      adjacency.set(id, []);
    }
    return id;
  };

  const addEdge = (fromId, toId, edge) => {
    adjacency.get(fromId).push({ to: toId, ...edge });
    adjacency.get(toId).push({ to: fromId, ...edge });
  };

  // 1. Metro stations
  const stations = [...transitData.metro_line.stations].sort((a, b) => a.order - b.order);
  stations.forEach((s) => addNode(s.id, s.name, 'metro'));
  for (let i = 0; i < stations.length - 1; i++) {
    addEdge(stations[i].id, stations[i + 1].id, {
      mode: 'metro',
      name: `${transitData.metro_line.name} Metro`,
      duration: METRO_HOP_MINUTES,
      cost: 0, // real fare computed at leg-merge time via metroFare()
      details: `${transitData.metro_line.name}. Trains every ${transitData.metro_line.frequency_min} min, ${transitData.metro_line.first_train}–${transitData.metro_line.last_train}.`
    });
  }

  // 2. Water Metro jetties
  transitData.water_metro.jetties.forEach((j) => addNode(j.id, j.name, 'water_metro'));

  const jettyMatchForms = (jetty) => {
    const base = normalize(jetty.name).replace(/ jetty$/, '');
    return new Set([
      normalize(jetty.name),
      base,
      `${base} jetty`,
      `${base} water metro jetty`,
      `${base} terminal`
    ]);
  };

  transitData.water_metro.routes.forEach((route) => {
    for (let i = 0; i < route.stops.length - 1; i++) {
      const segments = route.stops.length - 1;
      addEdge(route.stops[i], route.stops[i + 1], {
        mode: 'water_metro',
        name: route.name,
        routeId: route.id,
        duration: route.duration_min / segments,
        cost: route.price_inr / segments,
        details: `${route.name} Water Metro. Sailings every ${route.frequency_min} min, ${route.operating_hours}.`
      });
    }
  });

  // 3. Feeder buses — stop names are free text, so resolve them onto an
  // existing metro/jetty node when they clearly refer to the same place,
  // and only mint a new node when they don't.
  const resolveFeederStop = (stopName) => {
    const norm = normalize(stopName);

    const metroMatch = stations.find((s) => {
      const base = normalize(s.name);
      return [base, `${base} metro`, `${base} metro station`, `${base} station`].includes(norm);
    });
    if (metroMatch) return metroMatch.id;

    const jettyMatch = transitData.water_metro.jetties.find((j) => jettyMatchForms(j).has(norm));
    if (jettyMatch) return jettyMatch.id;

    const id = slugify(stopName);
    addNode(id, stopName, 'feeder_bus');
    return id;
  };

  transitData.feeder_buses.forEach((route) => {
    const stopIds = route.stops.map(resolveFeederStop);
    const segments = stopIds.length - 1;
    for (let i = 0; i < segments; i++) {
      if (stopIds[i] === stopIds[i + 1]) continue; // loop closes back onto the same node
      addEdge(stopIds[i], stopIds[i + 1], {
        mode: 'feeder_bus',
        name: route.name,
        routeId: route.id,
        duration: FEEDER_SEGMENT_MINUTES,
        cost: route.price_inr / segments,
        details: `${route.name}. Buses every ${route.frequency_min} min.`
      });
    }
  });

  // 4. Walk connections
  (transitData.walk_connections || []).forEach((walk) => {
    if (!nodes.has(walk.from)) addNode(walk.from, humanize(walk.from), 'walk');
    if (!nodes.has(walk.to)) addNode(walk.to, humanize(walk.to), 'walk');
    addEdge(walk.from, walk.to, {
      mode: 'walk',
      name: 'Walk Connection',
      duration: walk.duration_min,
      cost: 0,
      details: `Walk ~${walk.distance_meters}m.`
    });
  });

  return { nodes, adjacency };
}

let cachedGraph = null;
export function getGraph() {
  if (!cachedGraph) cachedGraph = buildGraph();
  return cachedGraph;
}

function edgeWeight(edge, constraints = {}) {
  let weight = constraints.lowCost ? (edge.cost || 0) + 0.1 : edge.duration;
  if (constraints.scenic && edge.mode === 'water_metro') weight *= 0.5;
  if (constraints.luggage) {
    if (edge.mode === 'walk') weight *= 3;
    if (edge.mode === 'feeder_bus') weight *= 1.3;
  }
  return weight;
}

/**
 * Dijkstra shortest path over the multimodal graph.
 * blockedNodeIds / blockedRouteIds let disruption replanning exclude a
 * closed station/jetty or a specific disrupted service.
 */
export function findShortestPath(startId, endId, {
  constraints = {},
  blockedNodeIds = new Set(),
  blockedRouteIds = new Set()
} = {}) {
  const { nodes, adjacency } = getGraph();
  if (!nodes.has(startId) || !nodes.has(endId)) return null;
  if (blockedNodeIds.has(startId) || blockedNodeIds.has(endId)) return null;

  const dist = new Map();
  const prevNode = new Map();
  const prevEdge = new Map();
  const visited = new Set();

  for (const id of nodes.keys()) dist.set(id, Infinity);
  dist.set(startId, 0);

  while (visited.size < nodes.size) {
    let current = null;
    let currentDist = Infinity;
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < currentDist) {
        current = id;
        currentDist = d;
      }
    }
    if (current === null) break;
    if (current === endId) break;
    visited.add(current);
    if (blockedNodeIds.has(current)) continue;

    for (const edge of adjacency.get(current)) {
      if (blockedNodeIds.has(edge.to)) continue;
      if (edge.routeId && blockedRouteIds.has(edge.routeId)) continue;
      const next = currentDist + edgeWeight(edge, constraints);
      if (next < dist.get(edge.to)) {
        dist.set(edge.to, next);
        prevNode.set(edge.to, current);
        prevEdge.set(edge.to, edge);
      }
    }
  }

  if (dist.get(endId) === Infinity) return null;

  const path = [];
  let cursor = endId;
  while (cursor !== startId) {
    const edge = prevEdge.get(cursor);
    if (!edge) return null;
    path.unshift({ from: prevNode.get(cursor), to: cursor, edge });
    cursor = prevNode.get(cursor);
  }
  return path;
}

export function getNode(id) {
  return getGraph().nodes.get(id);
}

export function getAllNodes() {
  return [...getGraph().nodes.values()];
}

export function getLandmarks() {
  return transitData.landmarks || [];
}
