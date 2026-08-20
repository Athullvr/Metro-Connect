export type TransitMode = 'metro' | 'water_metro' | 'feeder_bus' | 'walk';

export interface Leg {
  mode: TransitMode;
  name: string;
  from: string;
  to: string;
  duration: number;
  cost: number;
  details: string;
}

export interface Itinerary {
  legs: Leg[];
  total_duration: number;
  total_cost: number;
  explanation: string;
}

export interface TripConstraints {
  luggage?: boolean;
  scenic?: boolean;
  lowCost?: boolean;
  speed?: boolean;
}

export interface PlanError {
  message: string;
  suggestions: string[];
}

export interface Disruption {
  id: string;
  kind: string;
  title: string;
  targetRoute: string;
  eventText: string;
}
