import { ADAPTER_SYSTEM_PROMPT } from './_lib/prompts.js';
import { callOpenAI } from './_lib/callOpenAI.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { itinerary, disruption } = req.body || {};
  if (!itinerary || !disruption) {
    res.status(400).json({ error: 'itinerary and disruption are required' });
    return;
  }

  try {
    const userPrompt = `Current Itinerary:\n${JSON.stringify(itinerary, null, 2)}\n\nDisruption Event:\n${disruption}`;
    const replan = await callOpenAI(ADAPTER_SYSTEM_PROMPT, userPrompt);
    res.status(200).json(replan);
  } catch (error) {
    console.error('Adapter proxy failed:', error);
    res.status(502).json({ error: 'Adapter agent is currently unavailable.' });
  }
}
