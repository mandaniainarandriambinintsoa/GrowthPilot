import type { Platform, ScrapedData, GeneratedPost } from '../types';
import { PLATFORMS } from '../lib/platforms';

/**
 * Generates marketing content for a specific platform based on scraped data.
 * In production, this calls an AI API (Claude/Gemini). For MVP, uses templates.
 */
export function generatePostForPlatform(
  projectId: string,
  platform: Platform,
  data: ScrapedData
): GeneratedPost {
  const config = PLATFORMS.find((p) => p.id === platform)!;
  const content = generateContent(platform, data, config.maxLength);

  return {
    id: crypto.randomUUID(),
    project_id: projectId,
    platform,
    content,
    status: 'draft',
    created_at: new Date().toISOString(),
  };
}

export function generateAllPosts(
  projectId: string,
  data: ScrapedData
): GeneratedPost[] {
  return PLATFORMS.map((p) =>
    generatePostForPlatform(projectId, p.id, data)
  );
}

function generateContent(
  platform: Platform,
  data: ScrapedData,
  maxLength: number
): string {
  const { title, description, features, keywords } = data;
  const featureList = features.slice(0, 3);
  const tags = keywords.slice(0, 5).map((k) => `#${k.replace(/\s+/g, '')}`).join(' ');

  const templates: Record<Platform, () => string> = {
    twitter: () => {
      const lines = [
        `🚀 Just discovered ${title}`,
        '',
        description.slice(0, 150),
        '',
        featureList.map((f) => `✅ ${f}`).join('\n'),
        '',
        tags,
      ];
      return truncate(lines.join('\n'), maxLength);
    },

    linkedin: () => {
      return truncate(
        [
          `I've been looking for a tool like this for months.`,
          '',
          `${title} — ${description}`,
          '',
          `Here's what stands out:`,
          '',
          ...featureList.map((f, i) => `${i + 1}. ${f}`),
          '',
          `If you're a freelancer or small business owner, this is worth checking out.`,
          '',
          `What tools do you use for this? 👇`,
          '',
          tags,
        ].join('\n'),
        maxLength
      );
    },

    reddit: () => {
      return truncate(
        [
          `${title} - ${description}`,
          '',
          `I've been using this tool and wanted to share my experience:`,
          '',
          `**Key features:**`,
          ...featureList.map((f) => `- ${f}`),
          '',
          `**What I like:** It's free and actually works well for what I need.`,
          '',
          `Has anyone else tried something similar? Would love to hear alternatives.`,
        ].join('\n'),
        maxLength
      );
    },

    facebook: () => {
      return truncate(
        [
          `🔥 ${title}`,
          '',
          description,
          '',
          featureList.map((f) => `👉 ${f}`).join('\n'),
          '',
          `Check it out — it's free! Link in comments 👇`,
          '',
          tags,
        ].join('\n'),
        maxLength
      );
    },

    instagram: () => {
      return truncate(
        [
          `${title} ✨`,
          '',
          description,
          '',
          featureList.map((f) => `💡 ${f}`).join('\n'),
          '',
          '---',
          `Follow for more tools & tips!`,
          '',
          tags,
          '#saas #startup #freelance #tools #productivity',
        ].join('\n'),
        maxLength
      );
    },

    tiktok: () => {
      return truncate(
        [
          `POV: You just found the tool you've been looking for 🤯`,
          '',
          `${title}`,
          '',
          featureList.map((f) => `✅ ${f}`).join('\n'),
          '',
          `Link in bio!`,
          tags,
        ].join('\n'),
        maxLength
      );
    },

    youtube: () => {
      return truncate(
        [
          `${title} — Complete Walkthrough & Review`,
          '',
          `In this video, I'll show you everything about ${title}.`,
          '',
          `📋 What's covered:`,
          ...featureList.map((f, i) => `${String(i + 1).padStart(2, '0')}:00 - ${f}`),
          '',
          `🔗 Links:`,
          `Website: [link]`,
          '',
          `If this was helpful, like & subscribe! 🔔`,
          '',
          `Tags: ${tags}`,
        ].join('\n'),
        maxLength
      );
    },
  };

  return templates[platform]();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '...';
}

/**
 * In production, this would call Claude/Gemini API for AI-generated content.
 * Placeholder for the AI integration.
 */
export async function generateWithAI(
  platform: Platform,
  data: ScrapedData,
  _tone: 'professional' | 'casual' | 'viral' = 'casual'
): Promise<string> {
  // TODO: Call Claude API or Gemini API
  // const response = await fetch('/api/generate', {
  //   method: 'POST',
  //   body: JSON.stringify({ platform, data, tone }),
  // });
  // return response.json();

  // For now, use template-based generation
  const config = PLATFORMS.find((p) => p.id === platform)!;
  return generateContent(platform, data, config.maxLength);
}
