const VALID_MODES = new Set(['metro', 'water_metro', 'feeder_bus', 'walk']);

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateLeg(leg, index) {
  if (typeof leg !== 'object' || leg === null) {
    return [`leg ${index} is not an object`];
  }

  const errors = [];
  if (!VALID_MODES.has(leg.mode)) errors.push(`leg ${index}.mode is invalid: ${leg.mode}`);
  if (typeof leg.name !== 'string' || !leg.name) errors.push(`leg ${index}.name is missing`);
  if (typeof leg.from !== 'string' || !leg.from) errors.push(`leg ${index}.from is missing`);
  if (typeof leg.to !== 'string' || !leg.to) errors.push(`leg ${index}.to is missing`);
  if (!isFiniteNumber(leg.duration) || leg.duration < 0) errors.push(`leg ${index}.duration is invalid`);
  if (!isFiniteNumber(leg.cost) || leg.cost < 0) errors.push(`leg ${index}.cost is invalid`);
  if (typeof leg.details !== 'string') errors.push(`leg ${index}.details is missing`);
  return errors;
}

/**
 * Validates the {legs, total_duration, total_cost, explanation} shape the UI
 * expects, so a malformed live-LLM response is rejected before it reaches
 * Itinerary.jsx/DisruptionSimulator.jsx instead of crashing them.
 */
export function validateItinerary(data) {
  const errors = [];

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['response is not an object'] };
  }

  if (!Array.isArray(data.legs) || data.legs.length === 0) {
    errors.push('legs must be a non-empty array');
  } else {
    data.legs.forEach((leg, i) => errors.push(...validateLeg(leg, i)));
  }

  if (!isFiniteNumber(data.total_duration) || data.total_duration < 0) {
    errors.push('total_duration is invalid');
  }
  if (!isFiniteNumber(data.total_cost) || data.total_cost < 0) {
    errors.push('total_cost is invalid');
  }
  if (typeof data.explanation !== 'string' || !data.explanation) {
    errors.push('explanation is missing');
  }

  return { valid: errors.length === 0, errors };
}

export class InvalidItineraryError extends Error {
  constructor(errors) {
    super(`Malformed itinerary response: ${errors.join('; ')}`);
    this.name = 'InvalidItineraryError';
    this.errors = errors;
  }
}

export function assertValidItinerary(data) {
  const { valid, errors } = validateItinerary(data);
  if (!valid) throw new InvalidItineraryError(errors);
  return data;
}
