import { Request, Response } from 'express';
import { MockDbService } from '../services/MockDbService';
import { MapsService } from '../services/MapsService';

export class PricingController {
  private mapsService: MapsService;

  constructor(private mockDb: MockDbService) {
    this.mapsService = new MapsService();
  }

  calculateDynamicPricing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userLocation, provider_id } = req.body;

      if (!provider_id) {
        res.status(400).json({ error: 'provider_id is required' });
        return;
      }

      const provider = this.mockDb.getProviderById(provider_id);
      if (!provider) {
        res.status(404).json({ error: 'Provider not found' });
        return;
      }

      let origin = '33.6844,73.0479'; // Fallback to central Islamabad
      if (userLocation && userLocation.lat && userLocation.lng) {
        origin = `${userLocation.lat},${userLocation.lng}`;
      }

      const destination = `${provider.areas[0] || 'Unknown'}, Islamabad, Pakistan`;

      const distance_km = await this.mapsService.calculateDistance(origin, destination);
      const distance_fee = Math.round(distance_km * 50);
      const total_amount = provider.base_rate + distance_fee;

      res.json({
        base_rate: provider.base_rate,
        distance_km,
        distance_fee,
        total_amount,
        origin,
        destination,
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to calculate pricing', message: error.message });
    }
  };
}
