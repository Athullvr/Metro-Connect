# Metro Connect

Metro Connect is a mobile-first Kochi multimodal transit copilot. It brings together the Kochi Metro Blue Line, operational Kochi Water Metro routes, and practical feeder-bus connections in one calm, shareable journey planner.

## What it does

- Plans station-to-station and landmark-to-landmark journeys across Metro, Water Metro, walking/auto transfers, and feeder buses.
- Uses the complete 25-station Kochi Metro Blue Line and the six operational Water Metro routes as local, maintainable data.
- Calculates Kochi Metro fare estimates from the published F1–F6 distance-zone logic.
- Explains interchange steps plainly, including Vyttila Mobility Hub and the Ernakulam South → High Court jetty connection.
- Offers 1-day and 2-day first-time visitor loops, Kochi1 card guidance, a Malayalam display toggle, shareable routes, and a demo service-disruption reroute control.
- Works as an installable PWA and preserves the most recently planned journey for reopening with patchy connectivity.

## Transit data

The operational network lives in [`transit-data.js`](./transit-data.js), separate from interface code so new terminals, feeder connections, or future lines can be added without rewriting the planner.

The data includes:

- Kochi Metro Blue Line: Aluva → Thrippunithura Terminal (25 stations)
- Water Metro: Vypin, High Court, Vyttila Mobility Hub, Kakkanad, South Chittoor, Cheranelloor, Fort Kochi, Willingdon Island, and Mattancherry operational connections
- Known landmarks: Fort Kochi, Mattancherry Palace, Marine Drive, Infopark, and Kochi Airport

## Local development

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

Run static checks with:

```bash
npm run lint
```

## Project structure

```text
index.html          Landing page and planner markup
app.js              Routing, UI state, sharing, language and disruption logic
transit-data.js     Local Kochi transit network and fare data
styles.css          Responsive editorial visual system
public/images/      Original editorial transit imagery
public/sw.js        PWA service worker
```

## Deployment

The project is configured as a Vite static application and can be deployed directly to Vercel. The `build` script produces the `dist/` output used for production.

## Notes on fare estimates

Kochi Metro estimates use the F1–F6 zone bands: ₹10 (up to 2 km), ₹20 (2–5 km), ₹30 (5–10 km), ₹40 (10–15 km), ₹50 (15–20 km), and ₹60 (over 20 km). Water Metro and feeder amounts are presented as planning estimates; check the operator’s current fare notice before travel.

## License

Private project. All rights reserved.
