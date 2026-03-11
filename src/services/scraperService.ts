import type { ScrapedData } from '../types';

/**
 * Scrapes a website URL and extracts structured marketing data.
 * In production, this would call a Supabase Edge Function running Puppeteer/Cheerio.
 * For the MVP, we use a proxy approach via a serverless function.
 */
export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  // Call our edge function that handles the actual scraping
  const response = await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('Failed to scrape website');
  }

  return response.json();
}

/**
 * Demo scraper that extracts data from meta tags and visible content
 * using the browser's fetch + DOMParser (works for CORS-enabled sites).
 * Falls back to basic extraction for CORS-blocked sites.
 */
export async function scrapeWithProxy(url: string): Promise<ScrapedData> {
  try {
    // Try via AllOrigins proxy for CORS
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    const html = await res.text();
    return parseHTML(html, url);
  } catch {
    // Fallback: return basic data from URL
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

  const description =
    getMeta('og:description') ||
    getMeta('description') ||
    '';

  const keywordsRaw = getMeta('keywords');
  const keywords = keywordsRaw
    ? keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean)
    : [];

  // Extract headings + their nearby text as features
  const features: string[] = [];
  doc.querySelectorAll('h1, h2, h3, h4').forEach((el) => {
    const text = el.textContent?.trim();
    if (text && text.length > 3 && text.length < 200) {
      // Also grab the next sibling paragraph for context
      const sibling = el.nextElementSibling;
      const siblingText = sibling?.tagName === 'P' ? sibling.textContent?.trim() : '';
      const combined = siblingText ? `${text}: ${siblingText}` : text;
      if (!features.includes(combined)) features.push(combined);
    }
  });

  // Extract ALL visible text paragraphs for richer context
  const bodyTexts: string[] = [];
  doc.querySelectorAll('p, li, span, strong').forEach((el) => {
    const text = el.textContent?.trim();
    if (text && text.length > 20 && text.length < 500) {
      if (!bodyTexts.some((t) => t.includes(text) || text.includes(t))) {
        bodyTexts.push(text);
      }
    }
  });

  // Use body texts as extra features if headings are sparse
  if (features.length < 5) {
    bodyTexts.slice(0, 10 - features.length).forEach((t) => {
      if (!features.includes(t)) features.push(t);
    });
  }

  // Extract content blocks
  const content_blocks: ScrapedData['content_blocks'] = [];

  // Hero section (first h1 + nearby p)
  const h1 = doc.querySelector('h1');
  if (h1) {
    const heroP = h1.parentElement?.querySelector('p');
    content_blocks.push({
      type: 'hero',
      title: h1.textContent?.trim() || '',
      text: heroP?.textContent?.trim() || description,
    });
  }

  // Feature blocks from headings + text
  features.slice(0, 8).forEach((f) => {
    content_blocks.push({ type: 'feature', title: f.split(':')[0], text: f.includes(':') ? f.split(':').slice(1).join(':').trim() : '' });
  });

  // Extract images
  const screenshots: string[] = [];
  const ogImage = getMeta('og:image');
  if (ogImage) screenshots.push(ogImage);

  doc.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.includes('icon') && !src.includes('logo') && !src.includes('svg')) {
      try {
        const fullUrl = new URL(src, url).href;
        if (!screenshots.includes(fullUrl)) screenshots.push(fullUrl);
      } catch { /* skip invalid URLs */ }
    }
  });

  // Extract logo
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
