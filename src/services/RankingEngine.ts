import { Provider, ExtractedIntent, RankedProvider, ProviderScores } from '../types';

const WEIGHTS = {
  travel_distance: 0.20,
  availability: 0.20,
  ratings: 0.18,
  reliability: 0.17,
  specialization: 0.15,
  cancellation_risk: 0.10,
};

export class RankingEngine {
  static rankProviders(providers: Provider[], intent: ExtractedIntent): RankedProvider[] {
    const maxDistance = Math.max(...providers.map(p => p.distance_km ?? 5), 1);
    const maxRating = 5.0;
    const maxReliability = 1.0;
    const maxCancellation = 1.0;

    return providers.map((provider) => {
      const travelDistanceScore = 1 - ((provider.distance_km ?? 5) / maxDistance);

      const hasAvailability = provider.availability_slots.some(slot =>
        slot.slots.some(s => !s.booked)
      );
      const availabilityScore = hasAvailability ? 1.0 : 0.2;

      const ratingsScore = provider.rating / maxRating;

      const reliabilityScore = provider.reliability_score / maxReliability;

      const specializationScore = provider.complexity_supported.includes(intent.complexity) ? 1.0 : 0.5;

      const cancellationScore = 1 - (provider.cancellation_risk / maxCancellation);

      const total =
        WEIGHTS.travel_distance * travelDistanceScore +
        WEIGHTS.availability * availabilityScore +
        WEIGHTS.ratings * ratingsScore +
        WEIGHTS.reliability * reliabilityScore +
        WEIGHTS.specialization * specializationScore +
        WEIGHTS.cancellation_risk * cancellationScore;

      const scores: ProviderScores = {
        total: Math.round(total * 1000) / 1000,
        travel_distance: Math.round(travelDistanceScore * 1000) / 1000,
        availability: Math.round(availabilityScore * 1000) / 1000,
        ratings: Math.round(ratingsScore * 1000) / 1000,
        reliability: Math.round(reliabilityScore * 1000) / 1000,
        specialization: Math.round(specializationScore * 1000) / 1000,
        cancellation_risk: Math.round(cancellationScore * 1000) / 1000,
      };

      return { provider, rank: 0, scores };
    }).sort((a, b) => b.scores.total - a.scores.total)
      .map((p, idx) => ({ ...p, rank: idx + 1 }));
  }
}
