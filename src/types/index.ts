export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string; // Optional for security on responses, but stored in DB
  avatar: string;
  role: 'user' | 'provider';
}

export interface Provider {
  provider_id: string;
  name: string;
  phone: string;
  service_categories: string[];
  areas: string[];
  distance_km?: number;
  estimated_travel_minutes?: number;
  base_rate: number;
  rating: number;
  review_count: number;
  last_review_days: number;
  availability_slots: AvailabilitySlot[];
  reliability_score: number;
  on_time_score: number;
  cancellation_risk: number;
  complexity_supported: string[];
  is_available: boolean;
}

export interface AvailabilitySlot {
  date: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
  booked: boolean;
}

export interface Booking {
  booking_id: string;
  transaction_id: string;
  user_id: string;
  provider_id: string;
  service_type: string;
  location: string;
  preferred_time: string;
  status: BookingStatus;
  pricing: PricingBreakdown;
  created_at: string;
  updated_at: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'en_route'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface PricingBreakdown {
  base_rate: number;
  travel_fee: number;
  urgency_multiplier: number;
  complexity_adjustment: number;
  surge_pricing: number;
  total_pkr: number;
  real_distance_km?: number;
  distance_fee?: number;
  total_amount?: number;
}

export interface Notification {
  notification_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export type NotificationType =
  | 'booking_confirmed'
  | 'provider_assigned'
  | 'provider_en_route'
  | 'service_completed'
  | 'payment_receipt'
  | 'reminder'
  | 'cancellation'
  | 'dispute_update'
  | 'price_update';

export interface Dispute {
  dispute_id: string;
  booking_id: string;
  user_id: string;
  provider_id: string;
  type: DisputeType;
  reason: string;
  status: DisputeStatus;
  resolution: string;
  compensation_amount: number;
  created_at: string;
  updated_at: string;
}

export type DisputeType =
  | 'user_price_dispute'
  | 'quality_complaint'
  | 'provider_cancelled'
  | 'no_show'
  | 'other';

export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'resolved'
  | 'escalated'
  | 'closed';

export interface AgentLog {
  log_id: string;
  transaction_id: string;
  agent: string;
  step: number;
  input: unknown;
  decision: string;
  action: string;
  output: unknown;
  timestamp: string;
}

export interface ExtractedIntent {
  service_type: string;
  location: string;
  urgency: 'low' | 'medium' | 'high';
  preferred_time: string;
  constraints: string[];
  language_detected: string;
  complexity: 'Basic' | 'Intermediate' | 'Complex';
  confidence: number;
}

export interface RankedProvider {
  provider: Provider;
  rank: number;
  scores: ProviderScores;
}

export interface ProviderScores {
  total: number;
  travel_distance: number;
  availability: number;
  ratings: number;
  reliability: number;
  specialization: number;
  cancellation_risk: number;
}

export interface OrchestratorResponse {
  transaction_id: string;
  workflow_stage: string;
  confidence_score: number;
  clarification_required: boolean;
  clarification_prompt: string;
  extracted_intent: ExtractedIntent | null;
  provider_rankings: RankedProvider[];
  recommended_provider: RankedProvider | null;
  dynamic_pricing: PricingBreakdown | null;
  execution_payload: Booking | null;
  follow_up_action: Record<string, unknown>;
  agent_trace: AgentLog[];
  ui_display_message: string;
}

export interface UserRequest {
  text: string;
  user_id?: string;
  preferred_language?: string;
  userLocation?: {
    lat: number;
    lng: number;
  };
}

export interface Review {
  review_id: string;
  provider_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  details: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
}
