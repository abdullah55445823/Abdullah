import { ExtractedIntent, PricingBreakdown, RankedProvider, Booking, AgentLog } from '../types';
import { generateBookingId, getCurrentTimestamp, generateLogId } from '../utils/helpers';
import { MockDbService } from '../services/MockDbService';

export interface BookingInput {
  transaction_id: string;
  user_id: string;
  intent: ExtractedIntent;
  provider: RankedProvider;
  pricing: PricingBreakdown;
}

export interface BookingOutput {
  booking: Booking;
  agent_trace: AgentLog[];
}

export function runBookingExecution(
  input: BookingInput,
  mockDb: MockDbService
): BookingOutput {
  const logs: AgentLog[] = [];
  const timestamp = getCurrentTimestamp();

  const booking: Booking = {
    booking_id: generateBookingId(),
    transaction_id: input.transaction_id,
    user_id: input.user_id,
    provider_id: input.provider.provider.provider_id,
    service_type: input.intent.service_type,
    location: input.intent.location,
    preferred_time: input.intent.preferred_time,
    status: 'pending',
    pricing: input.pricing,
    created_at: timestamp,
    updated_at: timestamp,
  };

  mockDb.addBooking(booking);
  mockDb.logAgentTrace({
    log_id: generateLogId(),
    transaction_id: input.transaction_id,
    agent: 'BookingExecutionAgent',
    step: 5,
    input: {
      provider_id: input.provider.provider.provider_id,
      service_type: input.intent.service_type,
    },
    decision: 'booking_pending',
    action: 'create_booking_and_update_db',
    output: { booking_id: booking.booking_id, status: 'pending' },
    timestamp,
  });

  const providerAlertLog: AgentLog = {
    log_id: generateLogId(),
    transaction_id: input.transaction_id,
    agent: 'BookingExecutionAgent',
    step: 5,
    input: {},
    decision: 'provider_notified',
    action: 'send_provider_alert',
    output: {
      provider_id: input.provider.provider.provider_id,
      provider_name: input.provider.provider.name,
      booking_id: booking.booking_id,
      message: `New booking assigned: ${input.intent.service_type} at ${input.intent.location}`,
    },
    timestamp,
  };

  logs.push(providerAlertLog);
  mockDb.logAgentTrace(providerAlertLog);

  mockDb.addNotification({
    notification_id: 'notif_' + generateLogId().substring(4),
    user_id: input.provider.provider.provider_id,
    type: 'booking_confirmed',
    title: 'New Booking Request',
    body: `New request: ${input.intent.service_type} at ${input.intent.location} for PKR ${input.pricing.total_pkr}. Please accept or reject.`,
    data: { booking_id: booking.booking_id },
    read: false,
    created_at: timestamp,
  });

  return { booking, agent_trace: logs };
}
