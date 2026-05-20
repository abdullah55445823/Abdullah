import { ExtractedIntent, UserRequest, AgentLog } from '../types';
import { generateTransactionId, getCurrentTimestamp, generateLogId } from '../utils/helpers';
import { generateClarificationPrompt } from '../utils/transliteration';
import { GeminiService } from '../services/GeminiService';

export interface IntentParserOutput {
  transaction_id: string;
  extracted_intent: ExtractedIntent | null;
  confidence_score: number;
  clarification_required: boolean;
  clarification_prompt: string;
  agent_trace: AgentLog[];
}

const geminiService = new GeminiService();

export async function runIntentParser(request: UserRequest): Promise<IntentParserOutput> {
  const transaction_id = generateTransactionId();
  const logs: AgentLog[] = [];
  const timestamp = getCurrentTimestamp();

  // Call Gemini API to parse intent
  const parsedData = await geminiService.parseIntent(request.text);

  let confidence = 1.0;
  let clarification_required = false;
  let clarification_prompt = '';
  const missingFields: string[] = [];

  let extracted_intent: ExtractedIntent | null = null;
  let language_detected = 'english';

  if (!parsedData) {
    confidence = 0;
    clarification_required = true;
    clarification_prompt = "I couldn't process your request at the moment. Please try again.";
  } else {
    language_detected = parsedData.language_detected || 'english';
    const serviceType = parsedData.service_type;
    const location = parsedData.location;
    const preferredTime = parsedData.preferred_time || 'not_specified';
    const urgency = parsedData.urgency || 'medium';

    if (!serviceType) { missingFields.push('service_type'); confidence -= 0.3; }
    if (!location) { missingFields.push('location'); confidence -= 0.25; }

    if (missingFields.length > 0) {
      clarification_required = true;
      clarification_prompt = generateClarificationPrompt(missingFields.length > 1 ? 'ambiguous' : missingFields[0]);
      confidence = Math.max(confidence, 0.15);
    }

    const complexity: 'Basic' | 'Intermediate' | 'Complex' = (() => {
      if (urgency === 'high' && !serviceType) return 'Complex';
      if (serviceType && ['ac_technician', 'mechanic', 'carpenter'].includes(serviceType)) return 'Intermediate';
      return 'Basic';
    })();

    if (serviceType || location) {
      extracted_intent = {
        service_type: serviceType || 'unknown',
        location: location || 'unknown',
        urgency,
        preferred_time: preferredTime,
        constraints: [],
        language_detected,
        complexity,
        confidence: Math.max(confidence, 0.5),
      };
    }
  }

  const logEntry: AgentLog = {
    log_id: generateLogId(),
    transaction_id,
    agent: 'IntentParserAgent',
    step: 1,
    input: { text: request.text },
    decision: language_detected === 'urdu' || language_detected === 'roman_urdu'
      ? 'code_switched_detected' : 'english_detected',
    action: clarification_required ? 'request_clarification' : 'intent_extracted',
    output: { extracted_intent, confidence_score: confidence, clarification_required },
    timestamp,
  };
  logs.push(logEntry);

  return {
    transaction_id,
    extracted_intent,
    confidence_score: Math.round(confidence * 100) / 100,
    clarification_required,
    clarification_prompt,
    agent_trace: logs,
  };
}
