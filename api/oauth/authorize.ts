import { neon } from '@neondatabase/serverless';

export const config = { runtime: 'edge' };

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } });
}

function error(msg: string) {
  return new Response(`<html><body><h2>Error</h2><p>${msg}</p><script>setTimeout(()=>window.close(),3000)</script></body></html>`, {
    status: 400,
    headers: { 'Content-Type': 'text/html' },
  });
}

// Generate random string for state and PKCE
function randomString(length: number): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, length);
}

// PKCE: generate code_challenge from code_verifier
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const REDIRECT_BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL}`
  : 'https://growthpilot-nine.vercel.app';

const REDIRECT_URI = `${REDIRECT_BASE}/api/oauth/callback`;

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const platform = url.searchParams.get('platform');
  const token = url.searchParams.get('token');

  if (!platform || !token) return error('Missing platform or token');

  // Verify session
  const sql = neon(process.env.NEON_CONNECTION_STRING!);
  const sessions = await sql`
    SELECT s.user_id FROM sessions s WHERE s.token = ${token} AND s.expires_at > NOW()
  `;
  if (sessions.length === 0) return error('Invalid or expired session');

  const userId = sessions[0].user_id as string;
  const state = randomString(32);

  // Platform-specific OAuth URLs
  if (platform === 'twitter') {
    const clientId = process.env.TWITTER_CLIENT_ID;
    if (!clientId) return error('Twitter OAuth not configured. Add TWITTER_CLIENT_ID to Vercel env vars.');

    const codeVerifier = randomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    await sql`INSERT INTO oauth_states (state, user_id, platform, code_verifier) VALUES (${state}, ${userId}, ${platform}, ${codeVerifier})`;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      scope: 'tweet.read tweet.write users.read offline.access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    return redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
  }

  if (platform === 'linkedin') {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) return error('LinkedIn OAuth not configured. Add LINKEDIN_CLIENT_ID to Vercel env vars.');

    await sql`INSERT INTO oauth_states (state, user_id, platform) VALUES (${state}, ${userId}, ${platform})`;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      scope: 'openid profile w_member_social',
      state,
    });
    return redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
  }

  if (platform === 'facebook') {
    const appId = process.env.FACEBOOK_APP_ID;
    if (!appId) return error('Facebook OAuth not configured. Add FACEBOOK_APP_ID to Vercel env vars.');

    await sql`INSERT INTO oauth_states (state, user_id, platform) VALUES (${state}, ${userId}, ${platform})`;

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: REDIRECT_URI,
      scope: 'pages_manage_posts,pages_read_engagement',
      state,
    });
    return redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params}`);
  }

  if (platform === 'reddit') {
    const clientId = process.env.REDDIT_CLIENT_ID;
    if (!clientId) return error('Reddit OAuth not configured. Add REDDIT_CLIENT_ID to Vercel env vars.');

    await sql`INSERT INTO oauth_states (state, user_id, platform) VALUES (${state}, ${userId}, ${platform})`;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      state,
      redirect_uri: REDIRECT_URI,
      duration: 'permanent',
      scope: 'submit identity',
    });
    return redirect(`https://www.reddit.com/api/v1/authorize?${params}`);
  }

  return error(`OAuth not supported for ${platform}`);
}
