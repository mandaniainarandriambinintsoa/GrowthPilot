// AI generation is now handled server-side via Edge Functions (api/generate.ts, api/image.ts).
// No API keys are exposed to the browser.

export function isGeminiConfigured(): boolean {
  // Server-side check — always assume configured in production
  return true;
}

export function isAIConfigured(): boolean {
  return true;
}
