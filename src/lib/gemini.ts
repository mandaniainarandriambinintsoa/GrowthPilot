import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(apiKey);

// Use Gemini Flash 2.0 for speed + low cost
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Use Gemini 2.0 Flash Experimental for image generation
export const geminiImageModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
  generationConfig: { responseModalities: ['text', 'image'] } as any,
});

export function isGeminiConfigured(): boolean {
  return apiKey.length > 0;
}

// Check if any AI provider is configured (Gemini or Groq)
export function isAIConfigured(): boolean {
  return apiKey.length > 0 || (import.meta.env.VITE_GROQ_API_KEY || '').length > 0;
}
