import { ExtractedIntent, PricingBreakdown, RankedProvider, AgentLog } from '../types';
import { PricingEngine } from '../services/PricingEngine';
import { generateLogId, getCurrentTimestamp } from '../utils/helpers';
import { MapsService } from '../services/MapsService';

export interface PricingInput {
  transaction_id: string;
  intent: ExtractedIntent;
  provider: RankedProvider;
  userLocation?: {
    lat: number;
    lng: number;
  };
}

export interface PricingOutput {
  pricing: PricingBreakdown;
  agent_trace: AgentLog[];
}

const mapsService = new MapsService();

export async function runPricing(input: PricingInput): Promise<PricingOutput> {
  const logs: AgentLog[] = [];
  const timestamp = getCurrentTimestamp();

  // Rule 2: Origin using coordinates if available, fallback to central Islamabad
  let origin = '33.6844,73.0479';
  if (input.userLocation && input.userLocation.lat && input.userLocation.lng) {
    origin = `${input.userLocation.lat},${input.userLocation.lng}`;
  } else if (input.intent.location) {
    // If text location is available, we can use it as string query origin
    origin = input.intent.location;
  }

  // Rule 3: Destination using primary area + city + country for accuracy
  const primaryArea = input.provider.provider.areas?.[0] || 'F-8';
  const destination = `${primaryArea}, Islamabad, Pakistan`;

  // Rule 4: Axios request handled inside mapsService
  console.log(`[PricingAgent] Origin set to: "${origin}", Destination set to: "${destination}"`);
  const realDistance = await mapsService.calculateDistance(origin, destination);

  // Rule 6: Recalculate dynamic pricing
  const base_rate = input.provider.provider.base_rate;
  const distance_fee = Math.round(realDistance * 50);
  const total_amount = base_rate + distance_fee;

  // Let PricingEngine calculate standard multipliers
  const pricing = PricingEngine.calculatePricing(
    input.provider.provider,
    input.intent,
    realDistance
  );

  // Rule 7: Inject dynamic pricing and override dummy data
  pricing.real_distance_km = realDistance;
  pricing.distance_fee = distance_fee;
  pricing.total_amount = total_amount;
  pricing.travel_fee = distance_fee; // Override standard travel fee
  pricing.total_pkr = total_amount; // Override total to match exact formula

  // Override recommended provider distance and minutes
  input.provider.provider.distance_km = realDistance;
  input.provider.provider.estimated_travel_minutes = Math.round(realDistance * 2.5);

  const logEntry: AgentLog = {
    log_id: generateLogId(),
    transaction_id: input.transaction_id,
    agent: 'PricingAgent',
    step: 4,
    input: {
      base_rate,
      urgency: input.intent.urgency,
      complexity: input.intent.complexity,
      real_distance: realDistance,
      origin,
      destination
    },
    decision: 'pricing_calculated',
    action: 'apply_dynamic_pricing',
    output: pricing,
    timestamp,
  };
  logs.push(logEntry);

  return { pricing, agent_trace: logs };
}
