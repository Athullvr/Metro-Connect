import { PLANNER_SYSTEM_PROMPT } from './_lib/prompts.js';
import { callOpenAI } from './_lib/callOpenAI.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { origin, destination, constraints } = req.body || {};
  if (!origin || !destination) {
    res.status(400).json({ error: 'origin and destination are required' });
    return;
  }

  try {
    const userPrompt = `Origin: ${origin}\nDestination: ${destination}\nConstraints: ${JSON.stringify(constraints || {})}`;
    const plan = await callOpenAI(PLANNER_SYSTEM_PROMPT, userPrompt);
    res.status(200).json(plan);
  } catch (error) {
    console.error('Planner proxy failed:', error);
    res.status(502).json({ error: 'Planner agent is currently unavailable.' });
  }
}
