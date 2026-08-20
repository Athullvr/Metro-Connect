import { getNode, metroFare } from './transitGraph';

function groupIntoLegs(path) {
  const groups = [];
  for (const step of path) {
    const last = groups[groups.length - 1];
    if (last && last.mode === step.edge.mode && last.name === step.edge.name) {
      last.steps.push(step);
    } else {
      groups.push({ mode: step.edge.mode, name: step.edge.name, steps: [step] });
    }
  }
  return groups;
}

function buildLeg(group) {
  const first = group.steps[0];
  const last = group.steps[group.steps.length - 1];
  const from = getNode(first.from)?.name || first.from;
  const to = getNode(last.to)?.name || last.to;

  if (group.mode === 'metro') {
    const stopsApart = group.steps.length;
    const duration = Math.max(6, stopsApart * 2);
    return {
      mode: 'metro',
      name: group.name,
      from,
      to,
      duration,
      cost: metroFare(stopsApart),
      details: `${stopsApart} stop${stopsApart === 1 ? '' : 's'}. ${first.edge.details}`
    };
  }

  const duration = Math.round(group.steps.reduce((sum, s) => sum + s.edge.duration, 0));
  const cost = Math.round(group.steps.reduce((sum, s) => sum + s.edge.cost, 0));
  return {
    mode: group.mode,
    name: group.name,
    from,
    to,
    duration,
    cost,
    details: first.edge.details
  };
}

/**
 * Converts a raw Dijkstra path (list of {from, to, edge}) into the
 * {legs, total_duration, total_cost, explanation} shape the UI expects.
 */
export function formatItinerary(path, constraints = {}) {
  const legs = groupIntoLegs(path).map(buildLeg);
  const total_duration = legs.reduce((sum, l) => sum + l.duration, 0);
  const total_cost = legs.reduce((sum, l) => sum + l.cost, 0);

  const modes = [...new Set(legs.map((l) => l.mode))];
  const modeLabel = { metro: 'Metro', water_metro: 'Water Metro', feeder_bus: 'feeder bus', walk: 'walking' };
  const modeSummary = modes.map((m) => modeLabel[m] || m).join(' + ');

  let reason = 'Optimized for the fastest overall journey time.';
  if (constraints.lowCost) reason = 'Optimized for the lowest total fare across available connections.';
  else if (constraints.scenic) reason = 'Favors the scenic Water Metro crossing where it keeps the trip practical.';
  else if (constraints.luggage) reason = 'Minimizes walking and transfers to keep this comfortable with luggage.';

  return {
    legs,
    total_duration,
    total_cost,
    explanation: `Routed via ${modeSummary} across ${legs.length} leg${legs.length === 1 ? '' : 's'}. ${reason}`
  };
}
