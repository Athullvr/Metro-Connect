import transitData from '../data.json';

// System prompts for the OpenAI API
const PLANNER_SYSTEM_PROMPT = `
You are the Kochi Metro Connect Copilot, a multimodal transit planning agent.
You are given the following static transit data for Kochi Metro (Blue Line), Water Metro, and MetroConnect Feeder Buses:
${JSON.stringify(transitData, null, 2)}

Your task is to plan an optimal, step-by-step multimodal itinerary for the user.
You MUST respond with a valid JSON object matching the schema below. Do not output markdown, preambles, or explanations outside the JSON object.

JSON Schema:
{
  "legs": [
    {
      "mode": "metro" | "water_metro" | "feeder_bus" | "walk",
      "name": "Line or Route Name",
      "from": "Origin Stop Name",
      "to": "Destination Stop Name",
      "duration": 15, // in minutes
      "cost": 30, // in INR
      "details": "Details about stops, frequency, or directions"
    }
  ],
  "total_duration": 45, // sum of leg durations in minutes
  "total_cost": 65, // sum of leg costs in INR
  "explanation": "A concise, 1-2 sentence explanation of why this route was chosen and its benefits (e.g., speed, avoiding congestion, beautiful views)."
}
`;

const ADAPTER_SYSTEM_PROMPT = `
You are the Kochi Metro Connect Adapter Agent.
You are given the following static transit data:
${JSON.stringify(transitData, null, 2)}

The user has an active itinerary and has encountered a disruption.
You must re-plan the itinerary starting from their current location, avoiding the disrupted route or station.
You MUST respond with a valid JSON object matching the schema below. Do not output markdown or explanation text outside the JSON.

JSON Schema:
{
  "legs": [
    {
      "mode": "metro" | "water_metro" | "feeder_bus" | "walk",
      "name": "Line or Route Name",
      "from": "Origin Stop Name",
      "to": "Destination Stop Name",
      "duration": 15,
      "cost": 30,
      "details": "Details about stops, frequency, or directions"
    }
  ],
  "total_duration": 50,
  "total_cost": 80,
  "explanation": "What changed due to the disruption, why this new route was selected, and how much delay/extra cost is incurred."
}
`;

// Helper: Local Simulator for offline capability
const getLocalPlannedRoute = (origin, destination, constraints = {}) => {
  const normOrigin = origin.toLowerCase().trim();
  const normDest = destination.toLowerCase().trim();

  // Route 1: Aluva to Fort Kochi
  if (normOrigin.includes('aluva') && normDest.includes('fort kochi')) {
    return {
      legs: [
        {
          mode: 'metro',
          name: 'Blue Line Metro',
          from: 'Aluva Metro Station',
          to: 'MG Road Metro Station',
          duration: 32,
          cost: 40,
          details: '14 stops, boarding platform 2. Trains depart every 7 minutes.'
        },
        {
          mode: 'walk',
          name: 'Walk Transfer',
          from: 'MG Road Metro Station',
          to: 'High Court Jetty',
          duration: 15,
          cost: 0,
          details: 'Walk 1.2 km west along MG Road and Marine Drive Walkway.'
        },
        {
          mode: 'water_metro',
          name: 'High Court - Fort Kochi Water Metro',
          from: 'High Court Jetty',
          to: 'Fort Kochi Jetty',
          duration: 20,
          cost: 40,
          details: 'Direct electric catamaran. Departures every 15 minutes.'
        },
        {
          mode: 'walk',
          name: 'Walk to Destination',
          from: 'Fort Kochi Jetty',
          to: 'Fort Kochi Beach',
          duration: 8,
          cost: 0,
          details: 'Walk 600m along Beach Road.'
        }
      ],
      total_duration: 75,
      total_cost: 80,
      explanation: 'Optimized via high-speed Metro to avoid Salem-Ernakulam highway traffic, transitioning to the scenic, air-conditioned Water Metro at High Court.'
    };
  }

  // Route 2: Vyttila to Kakkanad Jetty
  if (normOrigin.includes('vyttila') && normDest.includes('kakkanad')) {
    return {
      legs: [
        {
          mode: 'walk',
          name: 'Walk to Jetty',
          from: 'Vyttila Metro Station',
          to: 'Vyttila Water Metro Jetty',
          duration: 4,
          cost: 0,
          details: 'Walk 300 meters through the sheltered terminal walk.'
        },
        {
          mode: 'water_metro',
          name: 'Vyttila - Kakkanad Water Metro',
          from: 'Vyttila Jetty',
          to: 'Kakkanad Jetty',
          duration: 25,
          cost: 30,
          details: 'Scenic backwater crossing. Departures every 20 minutes.'
        }
      ],
      total_duration: 29,
      total_cost: 30,
      explanation: 'Direct Water Metro route bypasses the heavily congested Vyttila-Kakkanad road corridor, saving at least 25 minutes during peak hours.'
    };
  }

  // Route 3: Kalamassery to Infopark
  if (normOrigin.includes('kalamassery') && normDest.includes('infopark')) {
    return {
      legs: [
        {
          mode: 'feeder_bus',
          name: 'MC-3: Kalamassery IT Expressway',
          from: 'Kalamassery Metro Station',
          to: 'Infopark Phase 1',
          duration: 20,
          cost: 20,
          details: 'MetroConnect e-bus. Connects directly outside Exit B of Kalamassery Metro.'
        }
      ],
      total_duration: 20,
      total_cost: 20,
      explanation: 'MetroConnect e-bus MC-3 offers a direct, low-carbon link from the Metro network to the IT hub gate.'
    };
  }

  // Route 4: Edapally to Civil Station Kakkanad
  if (normOrigin.includes('edapally') && normDest.includes('civil station')) {
    return {
      legs: [
        {
          mode: 'feeder_bus',
          name: 'MC-4: Edapally - Kakkanad Link',
          from: 'Edapally Metro Station',
          to: 'Civil Station Kakkanad',
          duration: 20,
          cost: 25,
          details: 'Direct feeder bus, departing outside Lulu Mall Metro Exit.'
        }
      ],
      total_duration: 20,
      total_cost: 25,
      explanation: 'Direct e-bus feeder avoids transfer changes, taking the shortest arterial link to Kakkanad Civil Station.'
    };
  }

  // Generic Default fallback planner (using metro list search)
  return {
    legs: [
      {
        mode: 'metro',
        name: 'Blue Line Metro',
        from: origin,
        to: destination,
        duration: 25,
        cost: 30,
        details: 'Direct or single-transfer metro connection. Runs every 7 minutes.'
      }
    ],
    total_duration: 25,
    total_cost: 30,
    explanation: 'Standard metro connection selected as default. Highly reliable and traffic-free.'
  };
};

const getLocalReplannedRoute = (currentItinerary, disruptionType) => {
  const normDisruption = disruptionType.toLowerCase();

  // Disruption 1: High Court Water Metro Jetty Closed (affects Aluva -> Fort Kochi route)
  if (normDisruption.includes('high court') || normDisruption.includes('jetty closed') || normDisruption.includes('hc_fk')) {
    return {
      legs: [
        {
          mode: 'metro',
          name: 'Blue Line Metro',
          from: 'Aluva Metro Station',
          to: 'Ernakulam South Metro',
          duration: 36,
          cost: 50,
          details: 'Rerouted path. Board train from Aluva, proceed past MG Road to Ernakulam South.'
        },
        {
          mode: 'walk',
          name: 'Transfer',
          from: 'Ernakulam South Metro',
          to: 'Ernakulam South Railway Terminal',
          duration: 5,
          cost: 0,
          details: 'Walk to the KSRTC feeder terminal.'
        },
        {
          mode: 'feeder_bus',
          name: 'MC-1: Vyttila Hub Loop (Rerouted)',
          from: 'Ernakulam South Terminal',
          to: 'Vyttila Mobility Hub',
          duration: 15,
          cost: 15,
          details: 'Emergency feeder shuttle bypassing closed water transport lanes.'
        },
        {
          mode: 'walk',
          name: 'Pedestrian Connection',
          from: 'Vyttila Mobility Hub',
          to: 'Fort Kochi (Via Local Bridge Bus)',
          duration: 35,
          cost: 20,
          details: 'Transfer to KSRTC low-floor bridge bus directly to Fort Kochi.'
        }
      ],
      total_duration: 91,
      total_cost: 85,
      explanation: 'CRITICAL ALERT: High Court Water Metro is closed. Rerouted via Metro to Ernakulam South, connected to Vyttila bus lanes, and utilizing road link. Expect +16 min delay.'
    };
  }

  // Disruption 2: Feeder Bus MC-3 Delayed (affects Kalamassery -> Infopark)
  if (normDisruption.includes('mc-3') || normDisruption.includes('delayed') || normDisruption.includes('bus')) {
    return {
      legs: [
        {
          mode: 'metro',
          name: 'Blue Line Metro (Alternative)',
          from: 'Kalamassery Metro Station',
          to: 'Edapally Metro Station',
          duration: 8,
          cost: 20,
          details: 'Take Blue Line Metro south for 3 stops to Edapally.'
        },
        {
          mode: 'feeder_bus',
          name: 'MC-4: Edapally - Kakkanad Link',
          from: 'Edapally Metro Station',
          to: 'Kakkanad Junction',
          duration: 20,
          cost: 25,
          details: 'Feeder bus MC-4 running normally. Board from Edapally station bay.'
        },
        {
          mode: 'walk',
          name: 'Walk to Hub',
          from: 'Kakkanad Junction',
          to: 'Infopark Phase 1',
          duration: 10,
          cost: 0,
          details: 'Walk 800m east or take a quick local feeder auto.'
        }
      ],
      total_duration: 38,
      total_cost: 45,
      explanation: 'ALERT: MC-3 e-bus delayed 25 minutes. Rerouted via Edapally Metro using the MC-4 feeder bus. Avoids waiting at Kalamassery, saving 7 mins overall.'
    };
  }

  // Disruption 3: Vyttila Jetty Closed
  if (normDisruption.includes('vyttila jetty') || normDisruption.includes('water metro jetty closed')) {
    return {
      legs: [
        {
          mode: 'metro',
          name: 'Blue Line Metro',
          from: 'Vyttila Metro Station',
          to: 'Edapally Metro Station',
          duration: 12,
          cost: 30,
          details: 'Take metro northbound.'
        },
        {
          mode: 'feeder_bus',
          name: 'MC-4: Edapally - Kakkanad Link',
          from: 'Edapally Metro Station',
          to: 'Civil Station Kakkanad',
          duration: 20,
          cost: 25,
          details: 'Board feeder bus MC-4 outside station entrance.'
        }
      ],
      total_duration: 32,
      total_cost: 55,
      explanation: 'ALERT: Vyttila Water Metro Jetty closed. Rerouted via Edapally Metro station to board the MC-4 Feeder Bus to Kakkanad. Total transit time increased by 3 minutes.'
    };
  }

  // Generic fallback disruption route
  return {
    legs: [
      {
        mode: 'walk',
        name: 'Detour Walkway',
        from: currentItinerary?.legs[0]?.from || 'Current Station',
        to: currentItinerary?.legs[0]?.to || 'Alternative Hub',
        duration: 15,
        cost: 0,
        details: 'Walk detour due to disruption. Follow green signs.'
      },
      ...((currentItinerary?.legs || []).slice(1))
    ],
    total_duration: (currentItinerary?.total_duration || 30) + 15,
    total_cost: currentItinerary?.total_cost || 30,
    explanation: 'Disruption replanning complete. Route updated with walk detours to bypass blocked zone.'
  };
};

/**
 * Plans a route from origin to destination.
 * Can use live OpenAI API if key is provided and useSimulator is false.
 */
export const planRoute = async (origin, destination, constraints = '', apiKey = '', useSimulator = true) => {
  if (useSimulator || !apiKey) {
    // Artificial latency for visual feel
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getLocalPlannedRoute(origin, destination, constraints);
  }

  try {
    const userPrompt = `Origin: ${origin}\nDestination: ${destination}\nConstraints: ${JSON.stringify(constraints)}`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: PLANNER_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content;
    return JSON.parse(resultText);
  } catch (error) {
    console.error('Planner Agent failed, falling back to Simulator:', error);
    return getLocalPlannedRoute(origin, destination, constraints);
  }
};

/**
 * Reroutes an itinerary in response to a disruption.
 */
export const replanRoute = async (currentItinerary, disruption, apiKey = '', useSimulator = true) => {
  if (useSimulator || !apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getLocalReplannedRoute(currentItinerary, disruption);
  }

  try {
    const userPrompt = `Current Itinerary:\n${JSON.stringify(currentItinerary, null, 2)}\n\nDisruption Event:\n${disruption}`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: ADAPTER_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content;
    return JSON.parse(resultText);
  } catch (error) {
    console.error('Adapter Agent failed, falling back to Simulator:', error);
    return getLocalReplannedRoute(currentItinerary, disruption);
  }
};
