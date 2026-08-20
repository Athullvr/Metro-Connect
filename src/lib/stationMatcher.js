import { getAllNodes, getLandmarks } from './transitGraph.js';

// Limited Malayalam aliases for a handful of well-known stops. Not a full
// translation layer — just enough to unblock a Malayalam-typed query for the
// stations visitors are most likely to search for.
const MALAYALAM_ALIASES = {
  Aluva: 'ആലുവ',
  Vyttila: 'വൈറ്റില',
  'Ernakulam South': 'എറണാകുളം സൗത്ത്',
  'Fort Kochi': 'ഫോർട്ട് കൊച്ചി',
  Kakkanad: 'കാക്കനാട്',
  'JLN Stadium': 'ജവഹർലാൽ നെഹ്റു സ്റ്റേഡിയം'
};

function normalize(s) {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function buildIndex() {
  const entries = [];
  for (const node of getAllNodes()) {
    entries.push({ query: node.name, nodeId: node.id });
  }
  for (const landmark of getLandmarks()) {
    entries.push({ query: landmark.query, nodeId: landmark.node_id });
  }
  for (const [english, malayalam] of Object.entries(MALAYALAM_ALIASES)) {
    const target = entries.find((e) => normalize(e.query) === normalize(english))
      || entries.find((e) => normalize(e.query).startsWith(normalize(english)));
    if (target) entries.push({ query: malayalam, nodeId: target.nodeId });
  }
  return entries;
}

let cachedIndex = null;
function getIndex() {
  if (!cachedIndex) cachedIndex = buildIndex();
  return cachedIndex;
}

/**
 * Resolves free-text user input (station/jetty/landmark name, with typos,
 * partial names, or one of a few known Malayalam aliases) to a graph node id.
 * Returns { nodeId, matchedName, exact } on success, or
 * { nodeId: null, suggestions: [...] } when nothing matches confidently.
 */
export function matchStation(input) {
  if (!input || !input.trim()) return { nodeId: null, suggestions: [] };
  const index = getIndex();
  const norm = normalize(input);

  const exact = index.find((e) => normalize(e.query) === norm);
  if (exact) return { nodeId: exact.nodeId, matchedName: exact.query, exact: true };

  const contains = index.find(
    (e) => normalize(e.query).includes(norm) || norm.includes(normalize(e.query))
  );
  if (contains) return { nodeId: contains.nodeId, matchedName: contains.query, exact: false };

  const scored = index
    .map((e) => ({ ...e, distance: levenshtein(norm, normalize(e.query)) }))
    .sort((a, b) => a.distance - b.distance);

  const best = scored[0];
  const threshold = Math.max(2, Math.floor(norm.length * 0.35));
  if (best && best.distance <= threshold) {
    return { nodeId: best.nodeId, matchedName: best.query, exact: false, fuzzy: true };
  }

  return {
    nodeId: null,
    suggestions: scored.slice(0, 3).map((e) => e.query)
  };
}
