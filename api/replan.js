import { ADAPTER_SYSTEM_PROMPT } from './_lib/prompts.js';
import { callOpenAI } from './_lib/callOpenAI.js';
import { validateReplanRequest } from './_lib/validateRequest.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { valid, error, data } = validateReplanRequest(req.body);
  if (!valid) {
    res.status(400).json({ error });
    return;
  }

  try {
    const { itinerary, disruption } = data;
    const userPrompt = `Current Itinerary:\n${JSON.stringify(itinerary, null, 2)}\n\nDisruption Event:\n${disruption}`;
    const replan = await callOpenAI(ADAPTER_SYSTEM_PROMPT, userPrompt);
    res.status(200).json(replan);
  } catch (err) {
    console.error('Adapter proxy failed:', err);
    res.status(502).json({ error: 'Adapter agent is currently unavailable.' });
  }
}
