import type { Platform, ScrapedData, GeneratedPost } from '../types';
import { PLATFORMS } from '../lib/platforms';

/**
 * Generates marketing content for a specific platform via the Edge API.
 */
export async function generatePostForPlatform(
  projectId: string,
  platform: Platform,
  data: ScrapedData,
  tone: 'professional' | 'casual' | 'viral' = 'casual',
  language: string = 'english'
): Promise<GeneratedPost> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, data, tone, language, projectId }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Generation failed');
  }

  const result = await res.json();
  return result.post;
}

/**
 * Generates posts for all platforms sequentially (one API call per platform).
 * This avoids Vercel Edge timeout (30s) by splitting into individual requests.
 */
export async function generateAllPosts(
  projectId: string,
  data: ScrapedData,
  tone: 'professional' | 'casual' | 'viral' = 'casual',
  language: string = 'english'
): Promise<GeneratedPost[]> {
  const posts: GeneratedPost[] = [];

  for (const p of PLATFORMS) {
    try {
      const post = await generatePostForPlatform(projectId, p.id, data, tone, language);
      posts.push(post);
    } catch (err) {
      console.warn(`Failed to generate for ${p.id}:`, err);
      // Continue with remaining platforms
    }
  }

  return posts;
}
