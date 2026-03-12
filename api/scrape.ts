export const config = { runtime: 'edge' };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Lightweight HTML meta/content extraction using regex (Edge-compatible, no DOMParser needed)
function parseHTML(html: string, url: string) {
  const getMeta = (name: string): string => {
    const re = new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i');
    const re2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, 'i');
    return re.exec(html)?.[1] || re2.exec(html)?.[1] || '';
  };

  const title =
    getMeta('og:title') ||
    (/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] || '').trim() ||
    new URL(url).hostname;

  const description = getMeta('og:description') || getMeta('description') || '';

  const keywordsRaw = getMeta('keywords');
  const keywords = keywordsRaw
    ? keywordsRaw.split(',').map((k: string) => k.trim()).filter(Boolean)
    : [];

  // Extract headings + next paragraph text
  const features: string[] = [];
  const headingRe = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi;
  let match;
  while ((match = headingRe.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text.length > 3 && text.length < 200) {
      // Try to grab next <p> sibling
      const afterHeading = html.slice(match.index + match[0].length, match.index + match[0].length + 1000);
      const nextP = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(afterHeading);
      const siblingText = nextP ? nextP[1].replace(/<[^>]*>/g, '').trim() : '';
      const combined = siblingText ? `${text}: ${siblingText}` : text;
      if (!features.includes(combined)) features.push(combined);
    }
  }

  // Extract body text paragraphs for richer context
  const bodyTexts: string[] = [];
  const pRe = /<(?:p|li)[^>]*>([\s\S]*?)<\/(?:p|li)>/gi;
  while ((match = pRe.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text.length > 20 && text.length < 500) {
      if (!bodyTexts.some((t) => t.includes(text) || text.includes(t))) {
        bodyTexts.push(text);
      }
    }
  }

  if (features.length < 5) {
    bodyTexts.slice(0, 10 - features.length).forEach((t) => {
      if (!features.includes(t)) features.push(t);
    });
  }

  // Content blocks
  const content_blocks: { type: string; title: string; text: string }[] = [];
  const h1Match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  if (h1Match) {
    const h1Text = h1Match[1].replace(/<[^>]*>/g, '').trim();
    content_blocks.push({ type: 'hero', title: h1Text, text: description });
  }
  features.slice(0, 8).forEach((f) => {
    const parts = f.split(':');
    content_blocks.push({
      type: 'feature',
      title: parts[0],
      text: parts.length > 1 ? parts.slice(1).join(':').trim() : '',
    });
  });

  // Extract images
  const screenshots: string[] = [];
  const ogImage = getMeta('og:image');
  if (ogImage) screenshots.push(ogImage);

  const imgRe = /<img[^>]*src=["']([^"']+)["']/gi;
  while ((match = imgRe.exec(html)) !== null) {
    const src = match[1];
    if (!src.includes('icon') && !src.includes('logo') && !src.includes('svg')) {
      try {
        const fullUrl = new URL(src, url).href;
        if (!screenshots.includes(fullUrl)) screenshots.push(fullUrl);
      } catch { /* skip */ }
    }
  }

  // Logo
  const logoMatch = /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i.exec(html);
  let logo: string | undefined;
  if (logoMatch) {
    try { logo = new URL(logoMatch[1], url).href; } catch { /* skip */ }
  }

  return {
    title: title || '',
    description: description || '',
    keywords,
    features: features.slice(0, 10),
    screenshots: screenshots.slice(0, 5),
    colors: [] as string[],
    logo,
    content_blocks,
  };
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { url } = await req.json();
    if (!url) return json({ error: 'url required' }, 400);

    // Server-side fetch — no CORS restrictions!
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GrowthPilot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return json({ error: `Failed to fetch: ${res.status}` }, 502);
    }

    const html = await res.text();
    if (!html || html.length < 100) {
      return json({ error: 'Empty or too short response' }, 502);
    }

    const data = parseHTML(html, url);
    return json(data);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Scrape failed' }, 500);
  }
}
