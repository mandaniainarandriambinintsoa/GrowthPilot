import Groq from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';

const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

export function isGroqConfigured(): boolean {
  return apiKey.length > 0;
}

export async function generateWithGroq(prompt: string): Promise<string> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    max_tokens: 2000,
  });
  return response.choices[0]?.message?.content?.trim() || '';
}
