import { geminiImageModel, isGeminiConfigured } from '../lib/gemini';
import type { ScrapedData, Platform } from '../types';

const VISUAL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'linkedin', 'twitter'];

export async function generateImageForPlatform(
  data: ScrapedData,
  platform: Platform
): Promise<string | null> {
  if (!isGeminiConfigured()) {
    return null;
  }

  try {
    const prompt = `Create a professional marketing visual for ${platform} promoting ${data.title}. The product: ${data.description}. Style: modern, clean, eye-catching social media graphic. Do NOT include any text overlay.`;

    const response = await geminiImageModel.generateContent(prompt);
    const result = response.response;

    const candidates = result.candidates;
    if (!candidates || candidates.length === 0) {
      return null;
    }

    const parts = candidates[0].content.parts;
    const imagePart = parts.find((p: any) => p.inlineData);

    if (!imagePart || !(imagePart as any).inlineData) {
      return null;
    }

    const inlineData = (imagePart as any).inlineData as { mimeType: string; data: string };
    return `data:${inlineData.mimeType};base64,${inlineData.data}`;
  } catch (error) {
    console.error(`Failed to generate image for ${platform}:`, error);
    return null;
  }
}

export async function generateAllImages(
  data: ScrapedData,
  platforms: Platform[]
): Promise<Record<Platform, string | null>> {
  const result = {} as Record<Platform, string | null>;

  // Filter to only visual platforms (skip tiktok/youtube which are video platforms)
  const visualPlatforms = platforms.filter((p) => VISUAL_PLATFORMS.includes(p));

  // Run sequentially to avoid rate limits
  for (const platform of visualPlatforms) {
    result[platform] = await generateImageForPlatform(data, platform);
  }

  return result;
}
