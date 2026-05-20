import axios from 'axios';

export class MapsService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.Maps_API_KEY || '';
  }

  async calculateDistance(origin: string, destination: string): Promise<number> {
    try {
      const apiKey = process.env.Maps_API_KEY || this.apiKey;
      if (!apiKey || apiKey === 'dummy_key') {
        console.warn('[MapsService] No Maps_API_KEY found in env, falling back to 5 km.');
        return 5;
      }

      console.log(`[MapsService] Querying Google Maps Distance Matrix API: origin="${origin}", destination="${destination}"`);
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;
      const response = await axios.get(url);

      if (response.data && response.data.status === 'OK') {
        const row = response.data.rows?.[0];
        const element = row?.elements?.[0];
        if (element && element.status === 'OK' && element.distance) {
          const distanceValueMeters = element.distance.value;
          const realDistanceKm = distanceValueMeters / 1000;
          console.log(`[MapsService] Successfully fetched distance: ${realDistanceKm} km`);
          return realDistanceKm;
        } else {
          throw new Error(element?.status || 'No distance element status OK');
        }
      } else {
        throw new Error(response.data?.status || 'Invalid response status');
      }
    } catch (error: any) {
      console.error('[MapsService] Google Maps API failed. Defaulting to 5 km fallback. Error:', error.message || error);
      return 5; // Fallback to 5 km on error
    }
  }
}
