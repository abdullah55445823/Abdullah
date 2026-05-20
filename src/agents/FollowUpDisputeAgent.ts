import { Booking, Dispute, DisputeType, AgentLog } from '../types';
import { generateDisputeId, getCurrentTimestamp, generateLogId } from '../utils/helpers';
import { MockDbService } from '../services/MockDbService';

export interface FollowUpInput {
  transaction_id: string;
  user_id: string;
  booking: Booking;
  action: 'none' | 'dispute' | 'cancellation';
  dispute_type?: DisputeType;
  dispute_reason?: string;
}

export interface FollowUpOutput {
  follow_up_action: Record<string, unknown>;
  dispute: Dispute | null;
  agent_trace: AgentLog[];
}

export function runFollowUpDispute(
  input: FollowUpInput,
  mockDb: MockDbService
): FollowUpOutput {
  const logs: AgentLog[] = [];
  const timestamp = getCurrentTimestamp();

  if (input.action === 'dispute' && input.dispute_type) {
    const dispute: Dispute = {
      dispute_id: generateDisputeId(),
      booking_id: input.booking.booking_id,
      user_id: input.user_id,
      provider_id: input.booking.provider_id,
      type: input.dispute_type,
      reason: input.dispute_reason || 'No reason provided',
      status: 'open',
      resolution: '',
      compensation_amount: 0,
      created_at: timestamp,
      updated_at: timestamp,
    };

    mockDb.addDispute(dispute);

    const logEntry: AgentLog = {
      log_id: generateLogId(),
      transaction_id: input.transaction_id,
      agent: 'FollowUpDisputeAgent',
      step: 6,
      input: { dispute_type: input.dispute_type, reason: input.dispute_reason },
      decision: 'dispute_created',
      action: 'open_dispute_ticket',
      output: { dispute_id: dispute.dispute_id, status: 'open' },
      timestamp,
    };
    logs.push(logEntry);

    mockDb.logAgentTrace(logEntry);
    mockDb.addNotification({
      notification_id: 'notif_' + generateLogId().substring(4),
      user_id: input.user_id,
      type: 'dispute_update',
      title: 'Dispute Registered',
      body: `Your dispute regarding ${input.dispute_type} has been registered. Ticket #${dispute.dispute_id}`,
      data: { dispute_id: dispute.dispute_id },
      read: false,
      created_at: timestamp,
    });

    return {
      follow_up_action: {
        type: 'dispute_opened',
        dispute_id: dispute.dispute_id,
        message: 'Your dispute has been registered. Our team will review it shortly.',
      },
      dispute,
      agent_trace: logs,
    };
  }

  if (input.action === 'cancellation') {
    mockDb.updateBookingStatus(input.booking.booking_id, 'cancelled');

    const logEntry: AgentLog = {
      log_id: generateLogId(),
      transaction_id: input.transaction_id,
      agent: 'FollowUpDisputeAgent',
      step: 6,
      input: { action: 'cancellation' },
      decision: 'booking_cancelled',
      action: 'cancel_booking',
      output: { booking_id: input.booking.booking_id, new_status: 'cancelled' },
      timestamp,
    };
    logs.push(logEntry);

    mockDb.logAgentTrace(logEntry);
    mockDb.addNotification({
      notification_id: 'notif_' + generateLogId().substring(4),
      user_id: input.user_id,
      type: 'cancellation',
      title: 'Booking Cancelled',
      body: `Your ${input.booking.service_type} booking has been cancelled.`,
      data: { booking_id: input.booking.booking_id },
      read: false,
      created_at: timestamp,
    });

    return {
      follow_up_action: {
        type: 'cancellation_processed',
        booking_id: input.booking.booking_id,
        message: 'Your booking has been cancelled successfully.',
      },
      dispute: null,
      agent_trace: logs,
    };
  }

  return {
    follow_up_action: {
      type: 'no_action_needed',
      message: 'Follow-up not required. Booking in progress.',
    },
    dispute: null,
    agent_trace: logs,
  };
}
