import { AgentLog } from '../types';

export interface TraceLoggerOutput {
  full_trace: AgentLog[];
  summary: TraceSummary;
}

export interface TraceSummary {
  total_agents_invoked: number;
  agents: string[];
  total_duration_ms: number;
  decisions: string[];
  start_time: string;
  end_time: string;
}

export function compileTrace(allLogs: AgentLog[]): TraceLoggerOutput {
  const sorted = [...allLogs].sort((a, b) => a.step - b.step);

  const decisions = sorted.map(l => l.decision);
  const agents = [...new Set(sorted.map(l => l.agent))];
  const timestamps = sorted.map(l => l.timestamp).filter(Boolean);
  const startTime = timestamps[0] || '';
  const endTime = timestamps[timestamps.length - 1] || '';

  const durationMs = startTime && endTime
    ? Math.abs(new Date(endTime).getTime() - new Date(startTime).getTime())
    : 0;

  return {
    full_trace: sorted,
    summary: {
      total_agents_invoked: agents.length,
      agents,
      total_duration_ms: durationMs,
      decisions,
      start_time: startTime,
      end_time: endTime,
    },
  };
}
