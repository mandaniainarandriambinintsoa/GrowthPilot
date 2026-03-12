// Database operations are now handled server-side via Edge Functions (api/*.ts).
// This file is kept for backward compatibility but the SQL client is no longer
// initialized on the client — all DB queries go through /api/* endpoints.

// No API keys are exposed to the browser.
export const sql = null;
