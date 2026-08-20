# Metro Connect

Metro Connect is a mobile-first Kochi multimodal transit copilot. It brings together the Kochi Metro Blue Line, operational Kochi Water Metro routes, and practical feeder-bus connections in one calm, shareable journey planner.

## What it does

- Plans station-to-station and landmark-to-landmark journeys across Metro, Water Metro, walking/auto transfers, and feeder buses.
- Uses the complete 25-station Kochi Metro Blue Line and the six operational Water Metro routes as local, maintainable data.
- Calculates Kochi Metro fare estimates from the published F1–F6 distance-zone logic.
- Explains interchange steps plainly, including Vyttila Mobility Hub and the Ernakulam South → High Court jetty connection.
- Offers a "Copilot" reasoning layer (planner + disruption-adapter agents) that can run entirely offline via a local simulator, or against a live LLM through a server-side proxy — no end-user API key required.
- Works as an installable PWA and preserves the most recently planned journey for reopening with patchy connectivity.

## Architecture

- `src/` — React + Vite frontend (planner UI, itinerary view, disruption simulator).
- `src/data.json` — the transit network: Metro stations, Water Metro jetties/routes, feeder bus stops. Single source of truth for both the frontend and the server-side agent prompts.
- `src/services/openai.js` — client-side planning service. In simulator mode it runs a local route generator entirely offline. In live mode it calls this project's own `/api/plan` and `/api/replan` endpoints — it never talks to OpenAI directly from the browser.
- `api/` — Vercel serverless functions that hold the OpenAI API key server-side (`OPENAI_API_KEY` env var) and proxy planner/adapter requests. The frontend has no access to this key at any point.

## Local development

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

This runs the frontend only — the local simulator (offline, no API key) works out of the box. To exercise the live Copilot proxy endpoints locally, use the Vercel CLI instead so `/api/*` routes are served:

```bash
npx vercel dev
```

Create a production build with:

```bash
npm run build
```

Run static checks with:

```bash
npm run lint
```

## Live Copilot configuration

To enable the live LLM-backed Copilot (planner + disruption adapter agents) instead of the offline simulator, set an environment variable — never commit this value or expose it to the client:

```bash
OPENAI_API_KEY=sk-...
```

Locally, put it in `.env.local` (already gitignored). On Vercel, set it as a Project Environment Variable. The key is only ever read inside `api/_lib/callOpenAI.js` on the server; if it's missing, live requests fail closed with a generic error and the UI falls back to the simulator.

## Deployment

The project is configured as a Vite static application with Vercel serverless functions, and can be deployed directly to Vercel. The `build` script produces the `dist/` output used for production; the `api/` directory is picked up automatically as serverless functions.

## Notes on fare estimates

Kochi Metro estimates use the F1–F6 zone bands: ₹10 (up to 2 km), ₹20 (2–5 km), ₹30 (5–10 km), ₹40 (10–15 km), ₹50 (15–20 km), and ₹60 (over 20 km). Water Metro and feeder amounts are presented as planning estimates; check the operator's current fare notice before travel.

## License

Private project. All rights reserved.
