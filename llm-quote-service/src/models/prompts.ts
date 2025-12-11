import { ConversationField, ExtractedData } from './types.js';

export const SYSTEM_PROMPT = `You are a friendly, professional insurance assistant helping customers get a quick quote for term life insurance in Morocco.

Your goal is to collect 7 pieces of information through natural conversation:
1. Gender (male/female)
2. Date of Birth (YYYY-MM-DD format)
3. Height (in centimeters)
4. Weight (in kilograms)
5. City (in Morocco)
6. Nicotine Usage (yes/no)
7. Term Length (10 or 20 years)

IMPORTANT RULES:
- Ask ONE question at a time
- Use conversational, friendly tone (never robotic)
- Validate inputs immediately
- Clarify ambiguous responses
- Never ask for unnecessary information
- Keep messages concise (1-2 sentences max)
- Use simple, jargon-free language
- Be patient and helpful with corrections

When extracting data:
- Gender: Accept variations like "man", "woman", "male", "female", "I'm a man", etc.
- Date of Birth: Accept multiple formats: "1990-01-15", "01/15/1990", "January 15, 1990", "15th of January 1990"
- Height: Accept "175", "175cm", "1.75m", convert imperial to metric if needed
- Weight: Accept "75", "75kg", "75 kilos"
- City: Match to Moroccan cities, handle misspellings with fuzzy matching
- Nicotine: Accept "yes", "no", "I smoke", "I don't smoke", "I quit", etc.
- Term: Accept "10", "10-year", "10 years", "20", "20-year", "20 years"

Validation ranges:
- Age: 18-80 years old
- Height: 140cm-230cm
- Weight: 40kg-200kg

If validation fails, ask politely for clarification (max 2 attempts per field).

When user corrects information, acknowledge and update gracefully.

IMPORTANT - When ALL 7 fields are collected:
- Say something brief like "Perfect! Let me calculate your personalized quote."
- DO NOT mention emailing quotes or waiting - the quote is calculated instantly
- DO NOT ask "Is there anything else?" - just acknowledge completion
- Keep it short (1 sentence)
- Set needsConfirmation: true in the JSON response`;

export interface FieldPrompt {
  question: string;
  validationHints: string;
  examples: string[];
}

export const FIELD_PROMPTS: Record<ConversationField, FieldPrompt> = {
  [ConversationField.GENDER]: {
    question: "To get started, are you male or female?",
    validationHints: "Accept 'male', 'female', 'man', 'woman', or natural variations.",
    examples: ["I'm a man", "female", "I'm male", "woman"]
  },

  [ConversationField.DATE_OF_BIRTH]: {
    question: "When were you born? Please provide your date of birth (for example, January 15, 1985).",
    validationHints: "Parse multiple date formats. Calculate age (18-80). Validate reasonable birth year.",
    examples: ["1990-01-15", "01/15/1990", "January 15, 1990", "15th of January 1990"]
  },

  [ConversationField.HEIGHT]: {
    question: "How tall are you? (Please provide in centimeters, for example 175cm)",
    validationHints: "Accept cm, m, or imperial units. Convert to cm. Valid range: 140-230cm.",
    examples: ["175", "175cm", "1.75m", "5'9\""]
  },

  [ConversationField.WEIGHT]: {
    question: "What's your weight? (Please provide in kilograms, for example 75kg)",
    validationHints: "Accept kg, lbs. Convert to kg. Valid range: 40-200kg.",
    examples: ["75", "75kg", "165 lbs"]
  },

  [ConversationField.CITY]: {
    question: "Which city in Morocco are you located in? (For example: Casablanca, Rabat, Fes)",
    validationHints: "Match to major Moroccan cities. Handle misspellings. Suggest alternatives if not found.",
    examples: ["Casablanca", "Rabat", "Fes", "Marrakech", "Tangier", "Agadir", "Meknes", "Oujda", "Kenitra", "Tetouan"]
  },

  [ConversationField.USES_NICOTINE]: {
    question: "One last health question: Do you currently use nicotine products (including cigarettes, cigars, or vaping)?",
    validationHints: "Accept yes/no variations. Clarify if 'quit' or 'occasionally'. Be sensitive.",
    examples: ["yes", "no", "I smoke", "I don't smoke", "I quit", "occasionally"]
  },

  [ConversationField.TERM_LENGTH]: {
    question: "One final question: How long would you like your coverage? A 10-year term or a 20-year term?",
    validationHints: "Accept 10 or 20 (with or without 'year'). Explain briefly if needed.",
    examples: ["10", "10-year", "10 years", "20", "20-year", "20 years"]
  }
};

export const CONFIRMATION_PROMPT = (extractedData: ExtractedData): string => {
  const age = extractedData.dateOfBirth
    ? new Date().getFullYear() - new Date(extractedData.dateOfBirth).getFullYear()
    : 'Unknown';

  return `Let me confirm the information I have:
- You're ${extractedData.gender === 'male' ? 'a male' : 'a female'}
- Born on ${extractedData.dateOfBirth} (age ${age})
- ${extractedData.height}cm tall
- ${extractedData.weight}kg
- From ${extractedData.city}
- ${extractedData.usesNicotine ? 'You use nicotine products' : 'Non-smoker'}
- ${extractedData.termLength}-year coverage

Does everything look correct?`;
};

export const WELCOME_MESSAGE = `Hello! I'm here to help you get a personalized life insurance quote.

This will take about 2-3 minutes. I'll ask you a few simple questions, and then I'll calculate your quote right away.

Ready to get started?`;

export const CALCULATING_MESSAGE = `Perfect! Let me calculate your personalized quote...`;

export const ERROR_MESSAGES = {
  SESSION_EXPIRED: "Your session has timed out. Let's start fresh! Would you like to begin a new quote?",
  PRICING_SERVICE_ERROR: "I'm having trouble calculating your quote right now. Please try again in a moment.",
  VALIDATION_FAILED: "I didn't quite catch that. Could you provide that information again?",
  MAX_RETRIES_EXCEEDED: "I'm having trouble understanding that information. Would you like to skip this for now and come back to it?",
  NETWORK_ERROR: "Connection lost. Please check your internet and try again."
};

export const MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Fes',
  'Marrakech',
  'Tangier',
  'Agadir',
  'Meknes',
  'Oujda',
  'Kenitra',
  'Tetouan',
  'Safi',
  'Temara',
  'Mohammedia',
  'Khouribga',
  'El Jadida',
  'Beni Mellal',
  'Nador',
  'Taza',
  'Settat',
  'Ksar El Kebir'
];
