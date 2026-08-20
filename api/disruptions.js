import { getLiveDisruptions } from '../src/lib/disruptionFeed.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    res.status(200).json({ disruptions: getLiveDisruptions() });
  } catch (error) {
    console.error('Disruption feed failed:', error);
    res.status(502).json({ error: 'Disruption feed is currently unavailable.' });
  }
}
