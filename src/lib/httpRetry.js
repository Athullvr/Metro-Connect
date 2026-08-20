const FETCH_TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 400;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries transient failures (network errors, timeouts, 5xx/429) with
// exponential backoff. 4xx client errors are not retried since a retry
// would return the same result.
export async function fetchWithRetry(url, options) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const isLastAttempt = attempt === MAX_RETRIES;

    let response;
    let networkError;
    try {
      response = await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      networkError = error;
    } finally {
      clearTimeout(timeout);
    }

    if (response?.ok) return response;
    if (response && response.status < 500 && response.status !== 429) {
      throw new Error(`Request failed: ${response.status}`);
    }
    if (isLastAttempt) {
      throw networkError || new Error(`Request failed: ${response.status}`);
    }

    await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
  }
}
