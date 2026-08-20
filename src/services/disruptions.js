import { getLiveDisruptions } from '../lib/disruptionFeed.js';
import { fetchWithRetry } from '../lib/httpRetry.js';

function isValidDisruption(d) {
  return d
    && typeof d.id === 'string'
    && typeof d.title === 'string'
    && typeof d.targetRoute === 'string'
    && typeof d.eventText === 'string';
}

/**
 * Fetches the "currently active" disruption feed. In simulator mode (or on
 * any network/validation failure in live mode) falls back to the same
 * deterministic local generator the server endpoint uses, so the UI always
 * has something to show.
 */
export async function fetchDisruptions(useSimulator = true) {
  if (useSimulator) {
    return getLiveDisruptions();
  }

  try {
    const response = await fetchWithRetry('/api/disruptions', { method: 'GET' });
    const data = await response.json();
    if (!Array.isArray(data.disruptions) || !data.disruptions.every(isValidDisruption)) {
      throw new Error('Malformed disruption feed response.');
    }
    return data.disruptions;
  } catch (error) {
    console.error('Live disruption feed failed, falling back to local feed:', error);
    return getLiveDisruptions();
  }
}
