export function sanitizeString(val, maxLen = 150) {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

export function validatePlanRequest(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object' };
  }

  const { origin, destination, constraints } = body;

  if (!origin || typeof origin !== 'string' || !origin.trim()) {
    return { valid: false, error: 'origin is required and must be a non-empty string' };
  }
  if (origin.trim().length > 120) {
    return { valid: false, error: 'origin must not exceed 120 characters' };
  }

  if (!destination || typeof destination !== 'string' || !destination.trim()) {
    return { valid: false, error: 'destination is required and must be a non-empty string' };
  }
  if (destination.trim().length > 120) {
    return { valid: false, error: 'destination must not exceed 120 characters' };
  }

  if (constraints !== undefined && (typeof constraints !== 'object' || Array.isArray(constraints))) {
    return { valid: false, error: 'constraints must be an object if provided' };
  }

  return {
    valid: true,
    data: {
      origin: sanitizeString(origin, 120),
      destination: sanitizeString(destination, 120),
      constraints: constraints || {}
    }
  };
}

export function validateReplanRequest(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object' };
  }

  const { itinerary, disruption } = body;

  if (!itinerary || typeof itinerary !== 'object' || !Array.isArray(itinerary.legs)) {
    return { valid: false, error: 'itinerary must be a valid object containing legs' };
  }

  if (!disruption || typeof disruption !== 'string' || !disruption.trim()) {
    return { valid: false, error: 'disruption is required and must be a non-empty string' };
  }
  if (disruption.trim().length > 600) {
    return { valid: false, error: 'disruption description must not exceed 600 characters' };
  }

  return {
    valid: true,
    data: {
      itinerary,
      disruption: sanitizeString(disruption, 600)
    }
  };
}
