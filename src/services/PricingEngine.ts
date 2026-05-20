import { Provider, ExtractedIntent, PricingBreakdown } from '../types';

const URGENCY_MULTIPLIERS: Record<string, number> = {
  low: 1.0,
  medium: 1.2,
  high: 1.5,
};

const COMPLEXITY_ADJUSTMENTS: Record<string, number> = {
  Basic: 1.0,
  Intermediate: 1.3,
  Complex: 1.6,
};

const SURGE_HOURS = { start: 18, end: 22 };

export class PricingEngine {
  static calculatePricing(provider: Provider, intent: ExtractedIntent, distance_km?: number): PricingBreakdown {
    const base_rate = provider.base_rate;

    const finalDistance = distance_km ?? provider.distance_km ?? 5; // Fallback to 5km if both are undefined
    const travel_fee = Math.round(finalDistance * 50);

    const urgency_multiplier = URGENCY_MULTIPLIERS[intent.urgency] || 1.0;

    const complexity_adjustment = COMPLEXITY_ADJUSTMENTS[intent.complexity] || 1.0;

    const currentHour = new Date().getHours();
    const isSurgeTime = currentHour >= SURGE_HOURS.start || currentHour < SURGE_HOURS.end;
    const surge_pricing = isSurgeTime ? Math.round(base_rate * 0.2) : 0;

    const subtotal = base_rate + travel_fee;
    const withUrgency = subtotal * urgency_multiplier;
    const withComplexity = withUrgency * complexity_adjustment;
    const total_pkr = Math.round(withComplexity + surge_pricing);

    return {
      base_rate,
      travel_fee,
      urgency_multiplier,
      complexity_adjustment,
      surge_pricing,
      total_pkr,
    };
  }
}
