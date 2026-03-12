import type { ScrapedData } from '../types';

/**
 * Scrapes a website URL via the Edge API (server-side, no CORS issues).
 * Falls back to client-side proxy scraping if API is unavailable.
 */
export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  const response = await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    // Try client-side proxy fallback for dev mode
    return scrapeWithProxy(url);
  }

  return response.json();
}

/**
 * Client-side proxy fallback (for local dev without Vercel functions).
 */
export async function scrapeWithProxy(url: string): Promise<ScrapedData> {
  const encodedUrl = encodeURIComponent(url);

  const proxies = [
    `https://api.allorigins.win/raw?url=${encodedUrl}`,
    `https://corsproxy.io/?${encodedUrl}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodedUrl}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const html = await res.text();
      if (!html || html.length < 100) continue;

      const data = parseHTML(html, url);
      if (data.title && data.title !== new URL(url).hostname && (data.keywords.length > 0 || data.features.length > 0 || data.description.length > 20)) {
        return data;
      }
      if (data.title) return data;
    } catch {
      continue;
    }
  }

  try {
    const res = await fetch(url);
    const html = await res.text();
    if (html && html.length > 100) return parseHTML(html, url);
  } catch { /* CORS blocked */ }

  return {
    title: new URL(url).hostname.replace('www.', ''),
    description: `Website at ${url}`,
    keywords: [],
    features: [],
    screenshots: [],
    colors: [],
    content_blocks: [],
  };
}

function parseHTML(html: string, url: string): ScrapedData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const getMeta = (name: string) =>
    doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ||
    doc.querySelector(`meta[property="${name}"]`)?.getAttribute('content') ||
    '';

  const title =
    getMeta('og:title') ||
    doc.querySelector('title')?.textContent ||
    new URL(url).hostname;

  const description = getMeta('og:description') || getMeta('description') || '';

  const keywordsRaw = getMeta('keywords');
  const keywords = keywordsRaw
    ? keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean)
    : [];

  const features: string[] = [];
  doc.querySelectorAll('h1, h2, h3, h4').forEach((el) => {
    const text = el.textContent?.trim();
    if (text && text.length > 3 && text.length < 200) {
      const sibling = el.nextElementSibling;
      const siblingText = sibling?.tagName === 'P' ? sibling.textContent?.trim() : '';
      const combined = siblingText ? `${text}: ${siblingText}` : text;
      if (!features.includes(combined)) features.push(combined);
    }
  });

  const bodyTexts: string[] = [];
  doc.querySelectorAll('p, li, span, strong').forEach((el) => {
    const text = el.textContent?.trim();
    if (text && text.length > 20 && text.length < 500) {
      if (!bodyTexts.some((t) => t.includes(text) || text.includes(t))) {
        bodyTexts.push(text);
      }
    }
  });

  if (features.length < 5) {
    bodyTexts.slice(0, 10 - features.length).forEach((t) => {
      if (!features.includes(t)) features.push(t);
    });
  }

  const content_blocks: ScrapedData['content_blocks'] = [];
  const h1 = doc.querySelector('h1');
  if (h1) {
    const heroP = h1.parentElement?.querySelector('p');
    content_blocks.push({
      type: 'hero',
      title: h1.textContent?.trim() || '',
      text: heroP?.textContent?.trim() || description,
    });
  }

  features.slice(0, 8).forEach((f) => {
    content_blocks.push({ type: 'feature', title: f.split(':')[0], text: f.includes(':') ? f.split(':').slice(1).join(':').trim() : '' });
  });

  const screenshots: string[] = [];
  const ogImage = getMeta('og:image');
  if (ogImage) screenshots.push(ogImage);

  doc.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.includes('icon') && !src.includes('logo') && !src.includes('svg')) {
      try {
        const fullUrl = new URL(src, url).href;
        if (!screenshots.includes(fullUrl)) screenshots.push(fullUrl);
      } catch { /* skip */ }
    }
  });

  const logo =
    doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
    doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
    undefined;

  return {
    title: title || '',
    description: description || '',
    keywords,
    features: features.slice(0, 10),
    screenshots: screenshots.slice(0, 5),
    colors: [],
    logo: logo ? new URL(logo, url).href : undefined,
    content_blocks,
  };
}
