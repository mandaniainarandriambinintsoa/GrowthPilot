import type { Platform, ScrapedData, GeneratedPost } from '../types';
import { PLATFORMS } from '../lib/platforms';
import { geminiModel, isGeminiConfigured } from '../lib/gemini';
import { generateWithGroq, isGroqConfigured } from '../lib/groq';

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
  } else if (isGroqConfigured()) {
    content = await generateWithGroqAI(platform, data, config.maxLength, tone, language);
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
  // Generate posts sequentially with delay to avoid Gemini rate limits (15 RPM free tier)
  const posts: GeneratedPost[] = [];
  for (const p of PLATFORMS) {
    const post = await generatePostForPlatform(projectId, p.id, data, tone, language);
    posts.push(post);
    // Wait between calls to stay under rate limits
    if (isGeminiConfigured()) {
      await new Promise((r) => setTimeout(r, 4500));
    } else if (isGroqConfigured()) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return posts;
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
  const { title, description, features, keywords, content_blocks } = data;

  // Build rich context from all scraped data
  const featuresText = features.length > 0
    ? features.slice(0, 8).join('\n  - ')
    : 'Not specified (infer from the description)';

  const contentContext = content_blocks?.length
    ? content_blocks.slice(0, 5).map((b) => `[${b.type}] ${b.title}: ${b.text}`).join('\n  ')
    : '';

  const platformPrompts: Record<string, string> = {
    twitter: `Write a VIRAL tweet or thread (max 3 tweets separated by ---).
Rules:
- Start with a bold hook that stops the scroll (contrarian take, surprising stat, or relatable pain point)
- Short punchy sentences, 1-2 per line
- Use strategic emojis (not every line)
- End with a strong CTA or question
- Add 3-5 relevant hashtags at the end
- If doing a thread, first tweet must standalone and hook readers in`,

    linkedin: `Write a LinkedIn post that tells a STORY.
Rules:
- Open with a 1-line hook that creates curiosity (pattern interrupt)
- Use the "hook → story → lesson → CTA" framework
- Write in first person as if you discovered/used this product
- Use short paragraphs (1-2 sentences each) with line breaks
- Add data points or specific results when possible
- End with a thought-provoking question for engagement
- No hashtags in the body, add 3-5 at the very end
- Avoid corporate buzzwords — write like a real person`,

    reddit: `Write a Reddit post that provides GENUINE VALUE.
Rules:
- Title should be descriptive and helpful, NOT clickbait
- Write like a real user sharing their experience, NOT a marketer
- Use markdown: **bold** for emphasis, bullet points for lists
- Share the problem you had, how you found this tool, what it solved
- Be honest — mention pros AND what could be improved
- Add a "TL;DR" at the end
- Do NOT use emojis or marketing language
- Sound like you're helping a friend, not selling`,

    facebook: `Write an engaging Facebook post.
Rules:
- Start with a relatable problem or situation
- Be conversational and warm, like talking to a friend
- Use 1-2 emojis per paragraph (not more)
- Include a personal touch or mini-story
- End with a clear CTA (try it, check it out, share your experience)
- Keep paragraphs short for mobile reading`,

    instagram: `Write a scroll-stopping Instagram caption.
Rules:
- First line is THE hook — must be compelling enough to tap "more"
- Tell a micro-story or share a transformation
- Use line breaks and emojis strategically
- Include a clear CTA (save this, share with a friend, try it)
- End with exactly 20-25 relevant hashtags (mix of popular + niche)
- Separate hashtags from caption with a line of dots (. . .)`,

    tiktok: `Write a TikTok video script/caption.
Rules:
- Start with an IRRESISTIBLE hook (first 2 seconds): "Stop scrolling if...", "Nobody talks about this...", "I found a tool that..."
- Write the full script: [HOOK] → [PROBLEM] → [SOLUTION/DEMO] → [CTA]
- Keep it under 60 seconds of spoken content
- Use Gen-Z friendly language but don't try too hard
- End with "Follow for more" or "Link in bio"
- Add 5-8 trending + niche hashtags`,

    youtube: `Write a YouTube video title + description optimized for SEO.
Rules:
- Title: Compelling, keyword-rich, under 60 chars (put on first line)
- Description structure:
  - First 2 lines: Hook that appears in search results (include main keyword)
  - Paragraph: Detailed overview of what the video covers
  - Timestamps: 00:00 - Intro, then key sections
  - Links section
  - Keywords paragraph at the end
- Include a subscribe CTA with bell emoji
- Add relevant tags line at the end`,
  };

  const prompt = `You are a world-class growth marketer who creates content that goes VIRAL. You understand each platform's algorithm and culture deeply.

TASK: Create a ${tone} marketing post for ${config.name} in ${language}.

PRODUCT CONTEXT:
- Product: ${title}
- What it does: ${description}
- Key selling points:
  - ${featuresText}
- Target keywords: ${keywords.slice(0, 10).join(', ')}
${contentContext ? `- Page content:\n  ${contentContext}` : ''}

PLATFORM: ${config.name}
${platformPrompts[platform] || ''}

TONE: ${tone}
${tone === 'professional' ? '- Authoritative, data-driven, credible. Like a consultant recommending a tool.' : ''}
${tone === 'casual' ? '- Friendly, relatable, authentic. Like a friend sharing something cool they found.' : ''}
${tone === 'viral' ? '- Bold, provocative, shareable. Pattern-interrupting hooks, hot takes, surprising angles.' : ''}

CONSTRAINTS:
- MUST stay under ${maxLength} characters
- MUST feel like it was written by a real person, NOT an AI
- MUST focus on the TRANSFORMATION/VALUE, not just features
- NEVER use generic phrases like "game-changer", "revolutionary", "check this out"
- NEVER start with "Introducing..." or "Excited to announce..."
- Make it something people genuinely want to engage with

Return ONLY the post content. No explanations, no "Here's the post:", no markdown code blocks.`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim();
    // Clean up: remove markdown code blocks if Gemini wraps the output
    const cleaned = text.replace(/^```[\s\S]*?\n/m, '').replace(/\n```$/m, '').trim();
    return truncate(cleaned, maxLength);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('429')) {
      console.warn(`Gemini rate limited for ${platform}, retrying in 10s...`);
      // Retry once after waiting
      await new Promise((r) => setTimeout(r, 10000));
      try {
        const retry = await geminiModel.generateContent(prompt);
        const text = retry.response.text().trim();
        const cleaned = text.replace(/^```[\s\S]*?\n/m, '').replace(/\n```$/m, '').trim();
        return truncate(cleaned, maxLength);
      } catch {
        console.warn(`Gemini retry failed for ${platform}, using template`);
      }
    } else {
      console.warn('Gemini generation failed:', msg);
    }
    // Fallback to Groq if available
    if (isGroqConfigured()) {
      try {
        console.log(`Falling back to Groq for ${platform}...`);
        return await generateWithGroqAI(platform, data, maxLength, tone, language);
      } catch (groqErr) {
        console.warn('Groq fallback also failed:', groqErr);
      }
    }
    return generateWithTemplate(platform, data, maxLength);
  }
}

// ============= GROQ FALLBACK (Llama 3.3 70B) =============

async function generateWithGroqAI(
  platform: Platform,
  data: ScrapedData,
  maxLength: number,
  tone: string,
  language: string = 'english'
): Promise<string> {
  const config = PLATFORMS.find((p) => p.id === platform)!;
  const { title, description, features, keywords, content_blocks } = data;

  const featuresText = features.length > 0
    ? features.slice(0, 8).join('\n  - ')
    : 'Not specified';

  const contentContext = content_blocks?.length
    ? content_blocks.slice(0, 5).map((b) => `[${b.type}] ${b.title}: ${b.text}`).join('\n  ')
    : '';

  const prompt = `You are a world-class growth marketer. Create a ${tone} marketing post for ${config.name} in ${language}.

PRODUCT: ${title}
DESCRIPTION: ${description}
FEATURES: ${featuresText}
KEYWORDS: ${keywords.slice(0, 10).join(', ')}
${contentContext ? `CONTENT: ${contentContext}` : ''}

PLATFORM: ${config.name} (max ${maxLength} chars)
TONE: ${tone}

Write an authentic, engaging post that feels human-written. Focus on value and transformation.
Stay under ${maxLength} characters. Return ONLY the post content.`;

  const text = await generateWithGroq(prompt);
  const cleaned = text.replace(/^```[\s\S]*?\n/m, '').replace(/\n```$/m, '').trim();
  return truncate(cleaned, maxLength);
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
