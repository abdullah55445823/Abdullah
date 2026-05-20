import { Provider, ExtractedIntent, AgentLog } from '../types';
import { MockDbService } from '../services/MockDbService';
import { generateLogId, getCurrentTimestamp } from '../utils/helpers';

export interface ProviderDiscoveryInput {
  transaction_id: string;
  intent: ExtractedIntent;
}

export interface ProviderDiscoveryOutput {
  matched_providers: Provider[];
  total_matches: number;
  agent_trace: AgentLog[];
}

export function runProviderDiscovery(
  input: ProviderDiscoveryInput,
  mockDb: MockDbService
): ProviderDiscoveryOutput {
  const logs: AgentLog[] = [];
  const timestamp = getCurrentTimestamp();

  const allProviders = mockDb.getProviders();

  let matched = allProviders.filter((p: Provider) => {
    const categoryMatch = p.service_categories.includes(input.intent.service_type);
    const areaMatch = p.areas.some(a =>
      a.toLowerCase().includes(input.intent.location.toLowerCase()) ||
      input.intent.location.toLowerCase().includes(a.toLowerCase())
    );
    const availabilityMatch = p.is_available;
    const complexityMatch = p.complexity_supported.includes(input.intent.complexity);

    return categoryMatch && areaMatch && availabilityMatch && complexityMatch;
  });

  // Broaden search if no exact area match is found
  if (matched.length === 0) {
    matched = allProviders.filter((p: Provider) => {
      const categoryMatch = p.service_categories.includes(input.intent.service_type);
      const availabilityMatch = p.is_available;
      const complexityMatch = p.complexity_supported.includes(input.intent.complexity);

      return categoryMatch && availabilityMatch && complexityMatch;
    });
  }

  const logEntry: AgentLog = {
    log_id: generateLogId(),
    transaction_id: input.transaction_id,
    agent: 'ProviderDiscoveryAgent',
    step: 2,
    input: { service_type: input.intent.service_type, location: input.intent.location },
    decision: matched.length > 0 ? 'providers_found' : 'no_providers_found',
    action: matched.length > 0 ? 'filter_providers' : 'broaden_search',
    output: { total_matched: matched.length, provider_ids: matched.map(p => p.provider_id) },
    timestamp,
  };
  logs.push(logEntry);

  return {
    matched_providers: matched,
    total_matches: matched.length,
    agent_trace: logs,
  };
}
