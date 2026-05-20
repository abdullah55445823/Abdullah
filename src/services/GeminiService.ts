import { GoogleGenAI } from '@google/genai';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || 'dummy_key' });
  }

  async parseIntent(text: string) {
    const prompt = `
You are an AI assistant for a home services platform called ServeAi.
Extract the following information from the user's request. 
Reply ONLY in valid JSON format, with no markdown formatting and no extra text.

Required fields:
- service_type: string (e.g., 'ac_technician', 'plumber', 'electrician', 'mechanic', 'cleaner', 'carpenter', 'tutor', 'towing')
- location: string (the location where the service is needed, e.g., 'Bahria Town', 'G-13')
- urgency: string ('low', 'medium', 'high')
- preferred_time: string (e.g., 'morning', 'afternoon', 'tonight', 'not_specified')
- language_detected: string ('english', 'urdu', 'roman_urdu')

User request: "${text}"
`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const jsonStr = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
      return JSON.parse(jsonStr);
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      return null;
    }
  }
}
