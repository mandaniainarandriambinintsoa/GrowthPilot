import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { runtime: 'edge' };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const geminiKey = process.env.GEMINI_API_KEY || '';
  if (!geminiKey) return json({ error: 'Gemini API key not configured' }, 500);

  try {
    const { data, platform } = await req.json();

    const genAI = new GoogleGenerativeAI(geminiKey);
    const imageModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: { responseModalities: ['text', 'image'] } as any,
    });

    const prompt = `Create a professional marketing visual for ${platform} promoting ${data.title}. The product: ${data.description}. Style: modern, clean, eye-catching social media graphic. Do NOT include any text overlay.`;

    const response = await imageModel.generateContent(prompt);
    const result = response.response;
    const candidates = result.candidates;

    if (!candidates || candidates.length === 0) {
      return json({ image: null });
    }

    const parts = candidates[0].content.parts;
    const imagePart = parts.find((p: any) => p.inlineData);

    if (!imagePart || !(imagePart as any).inlineData) {
      return json({ image: null });
    }

    const inlineData = (imagePart as any).inlineData as { mimeType: string; data: string };
    return json({ image: `data:${inlineData.mimeType};base64,${inlineData.data}` });
  } catch (err) {
    console.error('Image generation error:', err);
    return json({ image: null, error: err instanceof Error ? err.message : 'Image generation failed' });
  }
}
