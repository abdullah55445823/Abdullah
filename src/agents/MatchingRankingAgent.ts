import { Provider, ExtractedIntent, RankedProvider, ProviderScores, AgentLog } from '../types';
import { RankingEngine } from '../services/RankingEngine';
import { generateLogId, getCurrentTimestamp } from '../utils/helpers';

export interface RankingInput {
  transaction_id: string;
  intent: ExtractedIntent;
  providers: Provider[];
}

export interface RankingOutput {
  rankings: RankedProvider[];
  top_3: RankedProvider[];
  recommended: RankedProvider | null;
  agent_trace: AgentLog[];
}

export function runMatchingRanking(input: RankingInput): RankingOutput {
  const logs: AgentLog[] = [];
  const timestamp = getCurrentTimestamp();

  if (input.providers.length === 0) {
    const logEntry: AgentLog = {
      log_id: generateLogId(),
      transaction_id: input.transaction_id,
      agent: 'MatchingRankingAgent',
      step: 3,
      input: { provider_count: 0 },
      decision: 'no_providers_to_rank',
      action: 'skip_ranking',
      output: { message: 'No providers available for matching' },
      timestamp,
    };
    logs.push(logEntry);
    return { rankings: [], top_3: [], recommended: null, agent_trace: logs };
  }

  const rankings = RankingEngine.rankProviders(input.providers, input.intent);
  const sorted = [...rankings].sort((a, b) => b.scores.total - a.scores.total);
  const top3 = sorted.slice(0, 3);

  const logEntry: AgentLog = {
    log_id: generateLogId(),
    transaction_id: input.transaction_id,
    agent: 'MatchingRankingAgent',
    step: 3,
    input: { provider_count: input.providers.length },
    decision: 'ranking_complete',
    action: 'select_top_providers',
    output: {
      top_3_ids: top3.map(p => p.provider.provider_id),
      top_3_scores: top3.map(p => p.scores.total),
    },
    timestamp,
  };
  logs.push(logEntry);

  return {
    rankings: sorted,
    top_3: top3,
    recommended: top3[0] || null,
    agent_trace: logs,
  };
}
