import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { runtime: 'edge' };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface PlatformConfig {
  id: string;
  name: string;
  maxLength: number;
}

const PLATFORMS: PlatformConfig[] = [
  { id: 'twitter', name: 'X / Twitter', maxLength: 280 },
  { id: 'linkedin', name: 'LinkedIn', maxLength: 3000 },
  { id: 'reddit', name: 'Reddit', maxLength: 10000 },
  { id: 'facebook', name: 'Facebook', maxLength: 5000 },
  { id: 'instagram', name: 'Instagram', maxLength: 2200 },
  { id: 'tiktok', name: 'TikTok', maxLength: 2200 },
  { id: 'youtube', name: 'YouTube', maxLength: 5000 },
];

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '...';
}

function cleanAIOutput(text: string): string {
  return text.replace(/^```[\s\S]*?\n/m, '').replace(/\n```$/m, '').trim();
}

function buildPrompt(platform: string, platformName: string, data: any, maxLength: number, tone: string, language: string): string {
  const { title, description, features, keywords, content_blocks } = data;

  const featuresText = features?.length > 0
    ? features.slice(0, 8).join('\n  - ')
    : 'Not specified (infer from the description)';

  const contentContext = content_blocks?.length
    ? content_blocks.slice(0, 5).map((b: any) => `[${b.type}] ${b.title}: ${b.text}`).join('\n  ')
    : '';

  const platformPrompts: Record<string, string> = {
    twitter: `Write a VIRAL tweet or thread (max 3 tweets separated by ---).
Rules:
- Start with a bold hook that stops the scroll
- Short punchy sentences, 1-2 per line
- Use strategic emojis (not every line)
- End with a strong CTA or question
- Add 3-5 relevant hashtags at the end`,
    linkedin: `Write a LinkedIn post that tells a STORY.
Rules:
- Open with a 1-line hook that creates curiosity
- Use the "hook → story → lesson → CTA" framework
- Write in first person as if you discovered/used this product
- Use short paragraphs with line breaks
- End with a thought-provoking question
- No hashtags in the body, add 3-5 at the very end`,
    reddit: `Write a Reddit post that provides GENUINE VALUE.
Rules:
- Title should be descriptive and helpful, NOT clickbait
- Write like a real user sharing their experience
- Use markdown: **bold** for emphasis, bullet points for lists
- Be honest — mention pros AND what could be improved
- Add a "TL;DR" at the end
- Do NOT use emojis or marketing language`,
    facebook: `Write an engaging Facebook post.
Rules:
- Start with a relatable problem or situation
- Be conversational and warm
- Use 1-2 emojis per paragraph
- End with a clear CTA`,
    instagram: `Write a scroll-stopping Instagram caption.
Rules:
- First line is THE hook
- Tell a micro-story or share a transformation
- Include a clear CTA
- End with exactly 20-25 relevant hashtags
- Separate hashtags from caption with dots`,
    tiktok: `Write a TikTok video script/caption.
Rules:
- Start with an IRRESISTIBLE hook
- Write the full script: [HOOK] → [PROBLEM] → [SOLUTION/DEMO] → [CTA]
- Keep it under 60 seconds of spoken content
- End with "Follow for more" or "Link in bio"
- Add 5-8 hashtags`,
    youtube: `Write a YouTube video title + description optimized for SEO.
Rules:
- Title: Compelling, keyword-rich, under 60 chars (first line)
- Description: Hook, overview, timestamps, links, keywords
- Include a subscribe CTA`,
  };

  return `You are a world-class growth marketer who creates content that goes VIRAL.

TASK: Create a ${tone} marketing post for ${platformName} in ${language}.

PRODUCT CONTEXT:
- Product: ${title}
- What it does: ${description}
- Key selling points:
  - ${featuresText}
- Target keywords: ${(keywords || []).slice(0, 10).join(', ')}
${contentContext ? `- Page content:\n  ${contentContext}` : ''}

PLATFORM: ${platformName}
${platformPrompts[platform] || ''}

TONE: ${tone}
${tone === 'professional' ? '- Authoritative, data-driven, credible.' : ''}
${tone === 'casual' ? '- Friendly, relatable, authentic.' : ''}
${tone === 'viral' ? '- Bold, provocative, shareable.' : ''}

CONSTRAINTS:
- MUST stay under ${maxLength} characters
- MUST feel like it was written by a real person, NOT an AI
- MUST focus on the TRANSFORMATION/VALUE, not just features
- NEVER use generic phrases like "game-changer", "revolutionary"
- NEVER start with "Introducing..." or "Excited to announce..."

Return ONLY the post content. No explanations, no markdown code blocks.`;
}

async function generateWithGemini(geminiModel: any, prompt: string): Promise<string> {
  const result = await geminiModel.generateContent(prompt);
  return cleanAIOutput(result.response.text().trim());
}

async function generateWithGroq(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 2000,
    }),
  });
  if (!res.ok) throw new Error(`Groq API: ${res.status}`);
  const data = await res.json();
  return cleanAIOutput(data.choices?.[0]?.message?.content?.trim() || '');
}

function generateWithTemplate(platform: string, data: any, maxLength: number): string {
  const { title, description, features, keywords } = data;
  const featureList = (features || []).slice(0, 3);
  const tags = (keywords || []).slice(0, 5).map((k: string) => `#${k.replace(/\s+/g, '')}`).join(' ');

  const templates: Record<string, () => string> = {
    twitter: () => truncate(`🚀 Just discovered ${title}\n\n${(description || '').slice(0, 150)}\n\n${featureList.map((f: string) => `✅ ${f}`).join('\n')}\n\n${tags}`, maxLength),
    linkedin: () => truncate(`I've been looking for a tool like this for months.\n\n${title} — ${description}\n\nHere's what stands out:\n\n${featureList.map((f: string, i: number) => `${i + 1}. ${f}`).join('\n')}\n\nWhat tools do you use for this? 👇\n\n${tags}`, maxLength),
    reddit: () => truncate(`${title} - ${description}\n\nI've been using this tool:\n\n**Key features:**\n${featureList.map((f: string) => `- ${f}`).join('\n')}\n\nHas anyone else tried something similar?`, maxLength),
    facebook: () => truncate(`🔥 ${title}\n\n${description}\n\n${featureList.map((f: string) => `👉 ${f}`).join('\n')}\n\nCheck it out — it's free! 👇\n\n${tags}`, maxLength),
    instagram: () => truncate(`${title} ✨\n\n${description}\n\n${featureList.map((f: string) => `💡 ${f}`).join('\n')}\n\n---\nFollow for more!\n\n${tags}`, maxLength),
    tiktok: () => truncate(`POV: You just found the tool you've been looking for 🤯\n\n${title}\n\n${featureList.map((f: string) => `✅ ${f}`).join('\n')}\n\nLink in bio!\n${tags}`, maxLength),
    youtube: () => truncate(`${title} — Complete Walkthrough & Review\n\nIn this video, I'll show you everything about ${title}.\n\n📋 What's covered:\n${featureList.map((f: string, i: number) => `${String(i + 1).padStart(2, '0')}:00 - ${f}`).join('\n')}\n\nIf this was helpful, like & subscribe! 🔔\n\nTags: ${tags}`, maxLength),
  };

  return (templates[platform] || templates.twitter)();
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const { platform, platforms, data, tone = 'casual', language = 'english', projectId } = body;

    const geminiKey = process.env.GEMINI_API_KEY || '';
    const groqKey = process.env.GROQ_API_KEY || '';
    const hasGemini = geminiKey.length > 0;
    const hasGroq = groqKey.length > 0;

    let geminiModel: any = null;
    if (hasGemini) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }

    // Generate for single platform
    async function generateForPlatform(platformId: string): Promise<{ id: string; project_id: string; platform: string; content: string; status: string; created_at: string }> {
      const config = PLATFORMS.find((p) => p.id === platformId) || PLATFORMS[0];
      const prompt = buildPrompt(platformId, config.name, data, config.maxLength, tone, language);

      let content: string;
      if (hasGemini) {
        try {
          content = await generateWithGemini(geminiModel, prompt);
          content = truncate(content, config.maxLength);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('429')) {
            // Retry once after wait
            await new Promise((r) => setTimeout(r, 10000));
            try {
              content = await generateWithGemini(geminiModel, prompt);
              content = truncate(content, config.maxLength);
            } catch {
              content = hasGroq
                ? truncate(await generateWithGroq(groqKey, prompt), config.maxLength)
                : generateWithTemplate(platformId, data, config.maxLength);
            }
          } else {
            content = hasGroq
              ? truncate(await generateWithGroq(groqKey, prompt), config.maxLength)
              : generateWithTemplate(platformId, data, config.maxLength);
          }
        }
      } else if (hasGroq) {
        content = truncate(await generateWithGroq(groqKey, prompt), config.maxLength);
      } else {
        content = generateWithTemplate(platformId, data, config.maxLength);
      }

      return {
        id: crypto.randomUUID(),
        project_id: projectId,
        platform: platformId,
        content,
        status: 'draft',
        created_at: new Date().toISOString(),
      };
    }

    // Generate for all platforms or a single one
    if (platforms === 'all' || !platform) {
      const posts = [];
      for (const p of PLATFORMS) {
        const post = await generateForPlatform(p.id);
        posts.push(post);
        // Rate limit delays
        if (hasGemini) await new Promise((r) => setTimeout(r, 4500));
        else if (hasGroq) await new Promise((r) => setTimeout(r, 2000));
      }
      return json({ posts });
    }

    const post = await generateForPlatform(platform);
    return json({ post });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Generation failed' }, 500);
  }
}
