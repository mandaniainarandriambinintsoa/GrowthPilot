import type { ScrapedData, Platform } from '../types';

const VISUAL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'linkedin', 'twitter'];

export async function generateImageForPlatform(
  data: ScrapedData,
  platform: Platform
): Promise<string | null> {
  try {
    const res = await fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, platform }),
    });

    if (!res.ok) return null;

    const result = await res.json();
    return result.image || null;
  } catch {
    return null;
  }
}

export async function generateAllImages(
  data: ScrapedData,
  platforms: Platform[]
): Promise<Record<Platform, string | null>> {
  const result = {} as Record<Platform, string | null>;
  const visualPlatforms = platforms.filter((p) => VISUAL_PLATFORMS.includes(p));

  for (const platform of visualPlatforms) {
    result[platform] = await generateImageForPlatform(data, platform);
  }

  return result;
}
