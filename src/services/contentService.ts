import type { Platform, ScrapedData, GeneratedPost } from '../types';
import { PLATFORMS } from '../lib/platforms';
import { geminiModel, isGeminiConfigured } from '../lib/gemini';

/**
 * Generates marketing content for a specific platform based on scraped data.
 * Uses Gemini AI if configured, falls back to templates.
 */
export async function generatePostForPlatform(
  projectId: string,
  platform: Platform,
  data: ScrapedData,
  tone: 'professional' | 'casual' | 'viral' = 'casual',
  language: string = 'english'
): Promise<GeneratedPost> {
  const config = PLATFORMS.find((p) => p.id === platform)!;

  let content: string;
  if (isGeminiConfigured()) {
    content = await generateWithGemini(platform, data, config.maxLength, tone, language);
  } else {
    content = generateWithTemplate(platform, data, config.maxLength);
  }

  return {
    id: crypto.randomUUID(),
    project_id: projectId,
    platform,
    content,
    status: 'draft',
    created_at: new Date().toISOString(),
  };
}

export async function generateAllPosts(
  projectId: string,
  data: ScrapedData,
  tone: 'professional' | 'casual' | 'viral' = 'casual',
  language: string = 'english'
): Promise<GeneratedPost[]> {
  // Generate all posts in parallel
  const promises = PLATFORMS.map((p) =>
    generatePostForPlatform(projectId, p.id, data, tone, language)
  );
  return Promise.all(promises);
}

// ============= GEMINI AI GENERATION =============

async function generateWithGemini(
  platform: Platform,
  data: ScrapedData,
  maxLength: number,
  tone: string,
  language: string = 'english'
): Promise<string> {
  const config = PLATFORMS.find((p) => p.id === platform)!;
  const { title, description, features, keywords } = data;

  const prompt = `You are an expert growth marketer. Generate a ${tone} marketing post for ${config.name}.
Write the post in ${language}.

PRODUCT INFO:
- Name: ${title}
- Description: ${description}
- Key features: ${features.slice(0, 5).join(', ')}
- Keywords: ${keywords.slice(0, 8).join(', ')}

PLATFORM RULES for ${config.name}:
- Max length: ${maxLength} characters
- Style: ${config.description}
- Media type: ${config.mediaType}
${platform === 'twitter' ? '- Use short punchy sentences. Add relevant emojis. Include hashtags.' : ''}
${platform === 'linkedin' ? '- Write a storytelling hook. Use line breaks for readability. End with a question for engagement.' : ''}
${platform === 'reddit' ? '- Be authentic and helpful, NOT salesy. Write like a real user sharing a discovery. Use markdown formatting.' : ''}
${platform === 'facebook' ? '- Be engaging and conversational. Use emojis sparingly. Include a CTA.' : ''}
${platform === 'instagram' ? '- Write a compelling caption. Use emojis. Add 15-20 relevant hashtags at the end.' : ''}
${platform === 'tiktok' ? '- Write a video script/caption. Start with a hook. Keep it Gen-Z friendly.' : ''}
${platform === 'youtube' ? '- Write a video description with timestamps. Include keywords for SEO. Add a CTA to subscribe.' : ''}

IMPORTANT:
- Stay under ${maxLength} characters
- Make it feel authentic, not AI-generated
- Focus on the VALUE the product brings, not just features
- The post should be VIRAL-worthy — something people want to share

Return ONLY the post content, nothing else.`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim();
    return truncate(text, maxLength);
  } catch (error) {
    console.warn('Gemini generation failed, falling back to template:', error);
    return generateWithTemplate(platform, data, maxLength);
  }
}

// ============= TEMPLATE FALLBACK =============

function generateWithTemplate(
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
