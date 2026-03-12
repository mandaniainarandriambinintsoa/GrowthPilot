// AI generation is now handled server-side via Edge Functions (api/generate.ts).
// No API keys are exposed to the browser.

export function isGroqConfigured(): boolean {
  return true;
}
