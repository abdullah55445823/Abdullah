import { UserRequest, OrchestratorResponse } from '../types';
import { MockDbService } from './MockDbService';
import { runIntentParser } from '../agents/IntentParserAgent';
import { runProviderDiscovery } from '../agents/ProviderDiscoveryAgent';
import { runMatchingRanking } from '../agents/MatchingRankingAgent';
import { runPricing } from '../agents/PricingAgent';
import { runBookingExecution } from '../agents/BookingExecutionAgent';
import { runFollowUpDispute } from '../agents/FollowUpDisputeAgent';
import { compileTrace } from '../agents/TraceLoggerAgent';
import { getCurrentTimestamp } from '../utils/helpers';

export class AgentOrchestrator {
  private mockDb: MockDbService;

  constructor(mockDb: MockDbService) {
    this.mockDb = mockDb;
  }

  async processRequest(request: UserRequest): Promise<OrchestratorResponse> {
    const allTrace: any[] = [];

    const intentResult = await runIntentParser(request);
    allTrace.push(...intentResult.agent_trace);

    if (intentResult.clarification_required) {
      return {
        transaction_id: intentResult.transaction_id,
        workflow_stage: 'clarification_needed',
        confidence_score: intentResult.confidence_score,
        clarification_required: true,
        clarification_prompt: intentResult.clarification_prompt,
        extracted_intent: intentResult.extracted_intent,
        provider_rankings: [],
        recommended_provider: null,
        dynamic_pricing: null,
        execution_payload: null,
        follow_up_action: {
          type: 'awaiting_clarification',
          prompt: intentResult.clarification_prompt,
        },
        agent_trace: allTrace,
        ui_display_message: intentResult.clarification_prompt,
      };
    }

    if (!intentResult.extracted_intent) {
      return {
        transaction_id: intentResult.transaction_id,
        workflow_stage: 'intent_parsing_failed',
        confidence_score: 0,
        clarification_required: true,
        clarification_prompt: 'I could not understand your request. Please try again with more details.',
        extracted_intent: null,
        provider_rankings: [],
        recommended_provider: null,
        dynamic_pricing: null,
        execution_payload: null,
        follow_up_action: { type: 'retry' },
        agent_trace: allTrace,
        ui_display_message: 'Could not understand your request. Please try again.',
      };
    }

    const discoveryResult = runProviderDiscovery(
      { transaction_id: intentResult.transaction_id, intent: intentResult.extracted_intent },
      this.mockDb
    );
    allTrace.push(...discoveryResult.agent_trace);

    if (discoveryResult.total_matches === 0) {
      return {
        transaction_id: intentResult.transaction_id,
        workflow_stage: 'no_providers_found',
        confidence_score: intentResult.confidence_score,
        clarification_required: false,
        clarification_prompt: '',
        extracted_intent: intentResult.extracted_intent,
        provider_rankings: [],
        recommended_provider: null,
        dynamic_pricing: null,
        execution_payload: null,
        follow_up_action: { type: 'broaden_search' },
        agent_trace: allTrace,
        ui_display_message: 'No providers found matching your criteria. Try a different location.',
      };
    }

    const rankingResult = runMatchingRanking({
      transaction_id: intentResult.transaction_id,
      intent: intentResult.extracted_intent,
      providers: discoveryResult.matched_providers,
    });
    allTrace.push(...rankingResult.agent_trace);

    if (!rankingResult.recommended) {
      return {
        transaction_id: intentResult.transaction_id,
        workflow_stage: 'no_recommendation',
        confidence_score: intentResult.confidence_score,
        clarification_required: false,
        clarification_prompt: '',
        extracted_intent: intentResult.extracted_intent,
        provider_rankings: [],
        recommended_provider: null,
        dynamic_pricing: null,
        execution_payload: null,
        follow_up_action: { type: 'no_match' },
        agent_trace: allTrace,
        ui_display_message: 'Could not find a suitable provider. Please modify your request.',
      };
    }

    const pricingResult = await runPricing({
      transaction_id: intentResult.transaction_id,
      intent: intentResult.extracted_intent,
      provider: rankingResult.recommended,
      userLocation: request.userLocation,
    });
    allTrace.push(...pricingResult.agent_trace);

    const bookingResult = runBookingExecution(
      {
        transaction_id: intentResult.transaction_id,
        user_id: request.user_id || 'user_default',
        intent: intentResult.extracted_intent,
        provider: rankingResult.recommended,
        pricing: pricingResult.pricing,
      },
      this.mockDb
    );
    allTrace.push(...bookingResult.agent_trace);

    const followUpResult = runFollowUpDispute(
      {
        transaction_id: intentResult.transaction_id,
        user_id: request.user_id || 'user_default',
        booking: bookingResult.booking,
        action: 'none',
      },
      this.mockDb
    );
    allTrace.push(...followUpResult.agent_trace);

    const traced = compileTrace(allTrace);

    return {
      transaction_id: intentResult.transaction_id,
      workflow_stage: 'completed',
      confidence_score: intentResult.confidence_score,
      clarification_required: false,
      clarification_prompt: '',
      extracted_intent: intentResult.extracted_intent,
      provider_rankings: rankingResult.top_3,
      recommended_provider: rankingResult.recommended,
      dynamic_pricing: pricingResult.pricing,
      execution_payload: bookingResult.booking,
      follow_up_action: followUpResult.follow_up_action,
      agent_trace: traced.full_trace,
      ui_display_message: `Found and requested ${rankingResult.recommended.provider.name} for ${intentResult.extracted_intent.service_type} at ${intentResult.extracted_intent.location}. Total: PKR ${pricingResult.pricing.total_pkr}. Awaiting provider confirmation.`,
    };
  }
}
