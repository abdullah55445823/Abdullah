import { Request, Response } from 'express';
import { MockDbService } from '../services/MockDbService';

export class BookingController {
  constructor(private mockDb: MockDbService) {}

  getBookings = (req: Request, res: Response): void => {
    let bookings = this.mockDb.getBookings();
    
    if (req.query.user_id) {
      const targetUserId = req.query.user_id as string;
      bookings = bookings.filter(b => 
        b.user_id === targetUserId || 
        (targetUserId === 'user_1770000000001' && b.user_id === 'user_default')
      );
    }
    if (req.query.provider_id) {
      bookings = bookings.filter(b => b.provider_id === req.query.provider_id);
    }
    
    const enrichedBookings = bookings.map(b => {
      const provider = this.mockDb.getProviderById(b.provider_id);
      const customer = this.mockDb.getUsers().find(u => u.id === b.user_id);
      
      return {
        ...b,
        provider_name: provider?.name || 'Service Provider',
        provider_phone: provider?.phone || 'N/A',
        user_name: customer?.name || (b.user_id === 'user_default' ? 'Ahmed Hassan' : 'Customer'),
        user_phone: customer?.phone || (b.user_id === 'user_default' ? '0300-1111101' : 'N/A'),
      };
    });
    
    res.json({ bookings: enrichedBookings });
  };

  getBookingById = (req: Request, res: Response): void => {
    const booking = this.mockDb.getBookingById(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json(booking);
  };

  cancelBooking = (req: Request, res: Response): void => {
    const { booking_id } = req.body;
    if (!booking_id) {
      res.status(400).json({ error: 'booking_id is required' });
      return;
    }
    const booking = this.mockDb.getBookingById(booking_id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    this.mockDb.updateBookingStatus(booking_id, 'cancelled');
    res.json({ message: 'Booking cancelled', booking_id });
  };

  createBooking = (req: Request, res: Response): void => {
    const { user_id, provider_id, service_type, location, preferred_time, pricing } = req.body;
    
    if (!provider_id || !service_type || !preferred_time) {
      res.status(400).json({ error: 'provider_id, service_type, and preferred_time are required' });
      return;
    }

    const provider = this.mockDb.getProviderById(provider_id);
    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    const timestamp = new Date().toISOString();
    const newBooking = {
      booking_id: 'bk_' + Date.now() + Math.floor(Math.random() * 1000),
      transaction_id: 'txn_' + Date.now(),
      user_id: user_id || 'user_default',
      provider_id,
      service_type,
      location: location || 'Provided Location',
      preferred_time,
      status: 'pending' as const,
      pricing: pricing || {
        base_rate: provider.base_rate,
        travel_fee: 0,
        urgency_multiplier: 1,
        complexity_adjustment: 0,
        surge_pricing: 0,
        total_pkr: provider.base_rate,
      },
      created_at: timestamp,
      updated_at: timestamp,
    };

    this.mockDb.addBooking(newBooking);

    // Notify Provider about the pending request
    this.mockDb.addNotification({
      notification_id: 'notif_' + Date.now() + '_p',
      user_id: provider_id, // Sent to Provider!
      type: 'booking_confirmed',
      title: 'New Booking Request 📅',
      body: `You have a new manual booking request for ${service_type} at ${preferred_time}.`,
      data: { booking_id: newBooking.booking_id },
      read: false,
      created_at: timestamp,
    });

    // Notify Customer about the submitted request
    this.mockDb.addNotification({
      notification_id: 'notif_' + Date.now() + '_c',
      user_id: newBooking.user_id, // Sent to Customer!
      type: 'booking_confirmed',
      title: 'Booking Request Sent',
      body: `Your booking request for ${provider.name} at ${preferred_time} has been sent and is awaiting confirmation.`,
      data: { booking_id: newBooking.booking_id },
      read: false,
      created_at: timestamp,
    });

    res.status(201).json({ booking: newBooking });
  };

  updateBookingStatus = (req: Request, res: Response): void => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['confirmed', 'cancelled', 'rejected', 'completed'].includes(status)) {
      res.status(400).json({ error: 'Valid status is required' });
      return;
    }

    const booking = this.mockDb.getBookingById(id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    this.mockDb.updateBookingStatus(id, status as any);

    // Notify the user about the decision
    const title = status === 'confirmed' ? 'Booking Accepted!' : 'Booking Declined';
    const body = status === 'confirmed' 
      ? `Your booking for ${booking.service_type} has been accepted by the provider.`
      : `Your booking for ${booking.service_type} has been declined. Please try another provider.`;

    this.mockDb.addNotification({
      notification_id: 'notif_' + Date.now(),
      user_id: booking.user_id,
      type: 'booking_confirmed',
      title,
      body,
      data: { booking_id: id },
      read: false,
      created_at: new Date().toISOString(),
    });

    res.json({ message: `Booking ${status}`, booking_id: id });
  };
}
