import { Request, Response } from 'express';
import { MockDbService } from '../services/MockDbService';
import { User } from '../types';

export class AuthController {
  constructor(private mockDb: MockDbService) {}

  login = (req: Request, res: Response): void => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = this.mockDb.getUserByEmail(email);

    if (!user || user.password !== password) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Don't send password back to client
    const { password: _, ...userWithoutPassword } = user;
    if (user.role === 'provider') {
      const provider = this.mockDb.getProviderById(user.id);
      if (provider && provider.service_categories?.length > 0) {
        (userWithoutPassword as any).category = provider.service_categories[0];
      }
    }
    res.json({ user: userWithoutPassword });
  };

  signup = (req: Request, res: Response): void => {
    const { name, email, phone, password, role, category } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const existingUser = this.mockDb.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'Email is already registered' });
      return;
    }

    const newUser: User = {
      id: 'user_' + Date.now(),
      name,
      email,
      phone: phone || '',
      password,
      avatar: '👤',
      role: role === 'provider' ? 'provider' : 'user',
      ...(role === 'provider' && { category: category || 'General Service' }),
    };

    this.mockDb.createUser(newUser);

    if (newUser.role === 'provider') {
      this.mockDb.createProvider({
        provider_id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        service_categories: category ? [category] : ['General Service'],
        areas: ['G-13', 'F-8', 'Bahria Town', 'Islamabad', 'Rawalpindi', 'Saddar', 'Blue Area', 'DHA'],
        distance_km: 2.5,
        estimated_travel_minutes: 15,
        base_rate: 1500,
        rating: 5.0,
        review_count: 0,
        last_review_days: 0,
        availability_slots: [],
        reliability_score: 1.0,
        on_time_score: 1.0,
        cancellation_risk: 0.0,
        complexity_supported: ['Basic', 'Intermediate', 'Complex'],
        is_available: true,
      });
    }

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ user: userWithoutPassword });
  };

  updateProfile = (req: Request, res: Response): void => {
    const { user_id, name, phone, category } = req.body;

    if (!user_id) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const updatedUser = this.mockDb.updateUser(user_id, {
      ...(name && { name }),
      ...(phone && { phone }),
    });

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (updatedUser.role === 'provider') {
      const updatedProvider = this.mockDb.updateProvider(user_id, {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(category && { service_categories: [category] }),
      });
      if (updatedProvider && updatedProvider.service_categories?.length > 0) {
        (updatedUser as any).category = updatedProvider.service_categories[0];
      }
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({ user: userWithoutPassword });
  };
}
