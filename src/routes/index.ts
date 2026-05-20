import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { BookingController } from '../controllers/BookingController';
import { DisputeController } from '../controllers/DisputeController';
import { ProviderController } from '../controllers/ProviderController';
import { AuthController } from '../controllers/AuthController';
import { PricingController } from '../controllers/PricingController';
import { AgentOrchestrator } from '../services/AgentOrchestrator';
import { MockDbService } from '../services/MockDbService';

export function createRouter(orchestrator: AgentOrchestrator, mockDb: MockDbService): Router {
  const router = Router();
  const requestController = new RequestController(orchestrator);
  const bookingController = new BookingController(mockDb);
  const disputeController = new DisputeController(mockDb);
  const providerController = new ProviderController(mockDb);
  const authController = new AuthController(mockDb);
  const pricingController = new PricingController(mockDb);

  router.post('/auth/signup', authController.signup);
  router.post('/auth/login', authController.login);
  router.post('/auth/profile', authController.updateProfile);

  router.get('/categories', (_req, res) => {
    res.json({
      categories: [
        { label: 'Mechanic', value: 'mechanic' },
        { label: 'Electrician', value: 'electrician' },
        { label: 'Plumber', value: 'plumber' },
        { label: 'AC Technician', value: 'ac_technician' },
        { label: 'Cleaner', value: 'cleaner' },
        { label: 'Carpenter', value: 'carpenter' },
        { label: 'Tutor', value: 'tutor' },
        { label: 'Towing', value: 'towing' },
      ]
    });
  });

  router.post('/request', requestController.handleRequest);

  router.get('/bookings', bookingController.getBookings);
  router.post('/bookings', bookingController.createBooking);
  router.get('/bookings/:id', bookingController.getBookingById);
  router.post('/bookings/:id/status', bookingController.updateBookingStatus);
  router.post('/bookings/cancel', bookingController.cancelBooking);

  router.post('/pricing/calculate', pricingController.calculateDynamicPricing);

  router.post('/dispute', disputeController.createDispute);
  router.get('/disputes', disputeController.getDisputes);

  router.get('/providers', providerController.getProviders);
  router.get('/providers/:id', providerController.getProviderById);

  router.get('/agent-logs', (_req, res) => {
    res.json({ logs: mockDb.getAgentLogs() });
  });

  router.get('/notifications', (req, res) => {
    const userId = req.query.user_id as string;
    let notifications = mockDb.getNotifications();
    if (userId) {
      notifications = notifications.filter(n => n.user_id === userId);
    }
    res.json({ notifications });
  });

  router.post('/notifications/read', (req, res) => {
    const { notification_id } = req.body;
    if (!notification_id) {
      res.status(400).json({ error: 'notification_id is required' });
      return;
    }
    mockDb.markNotificationRead(notification_id);
    res.json({ message: 'Notification marked as read' });
  });

  router.get('/reviews', (req, res) => {
    const providerId = req.query.provider_id as string;
    const reviews = mockDb.getReviews(providerId);
    res.json({ reviews });
  });

  router.post('/reviews', (req, res) => {
    const { provider_id, user_id, rating, comment } = req.body;
    if (!provider_id || !rating) {
      res.status(400).json({ error: 'provider_id and rating are required' });
      return;
    }
    const review = mockDb.addReview({ provider_id, user_id: user_id || 'user_default', rating, comment });
    res.json({ review });
  });

  router.get('/payments', (_req, res) => {
    res.json({ methods: mockDb.getPaymentMethods() });
  });

  router.post('/payments/add', (req, res) => {
    const { type, details } = req.body;
    if (!type) {
      res.status(400).json({ error: 'payment type is required' });
      return;
    }
    const method = mockDb.addPaymentMethod({ type, details: details || {} });
    res.json({ method });
  });

  router.delete('/payments/:id', (req, res) => {
    mockDb.removePaymentMethod(req.params.id);
    res.json({ message: 'Payment method removed' });
  });

  router.get('/favorites', (_req, res) => {
    res.json({ favorites: mockDb.getFavorites() });
  });

  router.post('/favorites/toggle', (req, res) => {
    const { provider_id } = req.body;
    if (!provider_id) {
      res.status(400).json({ error: 'provider_id is required' });
      return;
    }
    const result = mockDb.toggleFavorite(provider_id);
    res.json(result);
  });

  return router;
}
