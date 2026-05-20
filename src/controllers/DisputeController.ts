import { Request, Response } from 'express';
import { MockDbService } from '../services/MockDbService';
import { runFollowUpDispute } from '../agents/FollowUpDisputeAgent';
import { DisputeType } from '../types';

export class DisputeController {
  constructor(private mockDb: MockDbService) {}

  createDispute = (req: Request, res: Response): void => {
    const { booking_id, user_id, dispute_type, reason } = req.body;

    if (!booking_id || !user_id || !dispute_type) {
      res.status(400).json({ error: 'booking_id, user_id, and dispute_type are required' });
      return;
    }

    if (!['user_price_dispute', 'quality_complaint', 'provider_cancelled', 'no_show', 'other'].includes(dispute_type)) {
      res.status(400).json({ error: 'Invalid dispute_type' });
      return;
    }

    const booking = this.mockDb.getBookingById(booking_id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const result = runFollowUpDispute(
      {
        transaction_id: booking.transaction_id,
        user_id,
        booking,
        action: 'dispute',
        dispute_type: dispute_type as DisputeType,
        dispute_reason: reason,
      },
      this.mockDb
    );

    res.json(result);
  };

  getDisputes = (_req: Request, res: Response): void => {
    res.json({ disputes: this.mockDb.getDisputes() });
  };
}
