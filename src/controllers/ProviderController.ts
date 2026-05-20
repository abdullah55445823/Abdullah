import { Request, Response } from 'express';
import { MockDbService } from '../services/MockDbService';

export class ProviderController {
  constructor(private mockDb: MockDbService) {}

  getProviders = (req: Request, res: Response): void => {
    const { service, location, area } = req.query;
    let providers = this.mockDb.getProviders();

    if (service && typeof service === 'string') {
      providers = providers.filter(p =>
        p.service_categories.some(c => c.toLowerCase().includes(service.toLowerCase()))
      );
    }
    if (location && typeof location === 'string') {
      providers = providers.filter(p =>
        p.areas.some(a => a.toLowerCase().includes(location.toLowerCase()))
      );
    }
    if (area && typeof area === 'string') {
      providers = providers.filter(p =>
        p.areas.some(a => a.toLowerCase().includes(area.toLowerCase()))
      );
    }

    res.json({ providers, total: providers.length });
  };

  getProviderById = (req: Request, res: Response): void => {
    const provider = this.mockDb.getProviderById(req.params.id);
    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }
    res.json(provider);
  };
}
