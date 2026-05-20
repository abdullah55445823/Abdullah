const URDU_SERVICE_KEYWORDS: Record<string, string[]> = {
  electrician: ['bijli', 'electrician', 'biji', 'electrical', 'wiring', 'bijli ka masla', 'switch', 'light'],
  plumber: ['plumber', 'plumbar', 'pape', 'pipes', 'naal', 'leakage', 'pani', 'nalka'],
  tutor: ['tutor', 'teacher', 'padhai', 'tution', 'math', 'maths', 'homework', 'student'],
  ac_technician: ['ac', 'air conditioner', 'a c', 'cooler', 'thanda', 'ac repair', 'ac technician', 'ac laga'],
  cleaner: ['cleaner', 'safai', 'safai wala', 'cleaning', 'house clean', 'office clean', 'jhadu'],
  carpenter: ['carpenter', 'bari', 'wood', 'furniture', 'almari', 'khat', 'darwaza', 'carpentry'],
  mechanic: ['mechanic', 'car', 'gari', 'bike', 'motorcycle', 'repair', 'car mechanic', 'tire'],
};

const LOCATION_KEYWORDS: Record<string, string[]> = {
  'G-13': ['g-13', 'g13', 'jee terah'],
  'F-8': ['f-8', 'f8', 'ef eight'],
  'Bahria Town': ['bahria', 'bahria town', 'bahria phase'],
  DHA: ['dha', 'defence', 'defence housing'],
  'Blue Area': ['blue area', 'blue'],
  Saddar: ['saddar', 'saddar rawalpindi'],
  Islamabad: ['islamabad', 'isl', 'capital'],
  Rawalpindi: ['rawalpindi', 'pindi', 'rwp'],
};

const URGENCY_KEYWORDS: Record<string, string[]> = {
  high: ['urgent', 'fauran', 'jaldi', 'immediately', 'abhi', 'emergency', 'critical', 'fast', 'asap'],
  medium: ['today', 'aaj', 'kal', 'evening', 'sham'],
  low: ['next week', 'agla hafta', 'next month', 'anytime', 'koi time'],
};

const TIME_PATTERNS = [
  { regex: /kal\s*(subah|morning)/i, value: 'tomorrow_morning' },
  { regex: /kal\s*(sham|evening)/i, value: 'tomorrow_evening' },
  { regex: /kal/i, value: 'tomorrow' },
  { regex: /aaj|today/i, value: 'today' },
  { regex: /subah|morning/i, value: 'morning' },
  { regex: /shaam|evening/i, value: 'evening' },
  { regex: /raat|night/i, value: 'night' },
  { regex: /(\d+)\s*baje/i, value: (m: RegExpExecArray) => `${m[1]}_oclock` },
];

export function detectLanguage(text: string): string {
  const urduChars = text.match(/[\u0600-\u06FF]/g);
  if (urduChars && urduChars.length > 2) return 'urdu';
  const romanUrduWords = ['mujhe', 'chahiye', 'hai', 'kal', 'aaj', 'subah', 'shaam', 'mein', 'ka', 'ki', 'se', 'ko', 'ne', 'ho', 'tha', 'raha', 'jao', 'ao', 'do', 'lo', 'hoga', 'mera', 'tera', 'hain', 'hun', 'hoon', 'nahi', 'bahut', 'thoda', 'karo', 'kar', 'rahe', 'rahi', 'aa', 'ja', 'le', 'de'];
  const words = text.toLowerCase().split(/\s+/);
  const romanMatches = words.filter(w => romanUrduWords.includes(w));
  if (romanMatches.length > 0) return 'roman_urdu';
  return 'english';
}

export function extractServiceType(text: string): { service_type: string; confidence: number } | null {
  const lower = text.toLowerCase();
  let bestMatch: { service_type: string; confidence: number } | null = null;

  for (const [service, keywords] of Object.entries(URDU_SERVICE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        const confidence = keyword.length > 3 ? 0.85 : 0.7;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { service_type: service, confidence };
        }
      }
    }
  }

  return bestMatch;
}

export function extractLocation(text: string): { location: string; confidence: number } | null {
  const lower = text.toLowerCase();
  let bestMatch: { location: string; confidence: number } | null = null;

  for (const [location, keywords] of Object.entries(LOCATION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        const confidence = 0.9;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { location, confidence };
        }
      }
    }
  }

  return bestMatch;
}

export function extractUrgency(text: string): 'low' | 'medium' | 'high' {
  const lower = text.toLowerCase();

  for (const word of URGENCY_KEYWORDS.high) {
    if (lower.includes(word)) return 'high';
  }
  for (const word of URGENCY_KEYWORDS.medium) {
    if (lower.includes(word)) return 'medium';
  }

  return 'low';
}

export function extractPreferredTime(text: string): string {
  const lower = text.toLowerCase();

  for (const pattern of TIME_PATTERNS) {
    if (pattern.regex instanceof RegExp) {
      const match = pattern.regex.exec(lower);
      if (match) {
        if (typeof pattern.value === 'function') {
          return pattern.value(match);
        }
        return pattern.value;
      }
    }
  }

  return 'not_specified';
}

export function generateClarificationPrompt(field: string): string {
  const prompts: Record<string, string> = {
    service_type: 'What service do you need? (e.g., electrician, plumber, tutor, AC technician)',
    location: 'Please tell me your location (e.g., G-13, F-8, Bahria Town, DHA)',
    time: 'When do you need this service? (e.g., kal subah, aaj shaam)',
    ambiguous: 'I did not fully understand your request. Please specify: (1) What service you need (2) Your location (3) When you need it',
  };

  return prompts[field] || prompts.ambiguous;
}
