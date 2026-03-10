import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(apiKey);

// Use Gemini Flash 2.0 for speed + low cost
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export function isGeminiConfigured(): boolean {
  return apiKey.length > 0;
}
