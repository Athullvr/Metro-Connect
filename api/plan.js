import { PLANNER_SYSTEM_PROMPT } from './_lib/prompts.js';
import { callOpenAI } from './_lib/callOpenAI.js';
import { validatePlanRequest } from './_lib/validateRequest.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { valid, error, data } = validatePlanRequest(req.body);
  if (!valid) {
    res.status(400).json({ error });
    return;
  }

  try {
    const { origin, destination, constraints } = data;
    const userPrompt = `Origin: ${origin}\nDestination: ${destination}\nConstraints: ${JSON.stringify(constraints)}`;
    const plan = await callOpenAI(PLANNER_SYSTEM_PROMPT, userPrompt);
    res.status(200).json(plan);
  } catch (err) {
    console.error('Planner proxy failed:', err);
    res.status(502).json({ error: 'Planner agent is currently unavailable.' });
  }
}
