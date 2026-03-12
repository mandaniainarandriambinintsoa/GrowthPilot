import { neon } from '@neondatabase/serverless';

export const config = { runtime: 'edge' };

const REDIRECT_BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL}`
  : 'https://growthpilot-nine.vercel.app';

const REDIRECT_URI = `${REDIRECT_BASE}/api/oauth/callback`;

function html(body: string, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function successPage(platform: string, profileName: string) {
  return html(`<!DOCTYPE html><html><head><title>Connected!</title>
<style>body{font-family:system-ui;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{text-align:center;padding:40px;background:#1e293b;border-radius:16px;max-width:400px}
.check{font-size:48px;margin-bottom:16px}h2{margin:0 0 8px}p{color:#94a3b8;font-size:14px}</style></head>
<body><div class="card"><div class="check">✅</div><h2>${platform} Connected!</h2>
<p>${profileName ? `Logged in as <strong>${profileName}</strong>` : 'Account linked successfully'}</p>
<p style="margin-top:16px;color:#64748b">This window will close automatically...</p></div>
<script>
window.opener && window.opener.postMessage({ type: 'oauth-success', platform: '${platform.toLowerCase()}' }, '*');
setTimeout(() => window.close(), 2000);
</script></body></html>`);
}

function errorPage(msg: string) {
  return html(`<!DOCTYPE html><html><head><title>OAuth Error</title>
<style>body{font-family:system-ui;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{text-align:center;padding:40px;background:#1e293b;border-radius:16px;max-width:400px}
.x{font-size:48px;margin-bottom:16px}h2{margin:0 0 8px;color:#f87171}p{color:#94a3b8;font-size:14px}</style></head>
<body><div class="card"><div class="x">❌</div><h2>Connection Failed</h2><p>${msg}</p>
<p style="margin-top:16px;color:#64748b">This window will close in 5 seconds...</p></div>
<script>
window.opener && window.opener.postMessage({ type: 'oauth-error', error: '${msg.replace(/'/g, "\\'")}' }, '*');
setTimeout(() => window.close(), 5000);
</script></body></html>`, 400);
}

// Exchange code for token per platform
async function exchangeTwitter(code: string, codeVerifier: string): Promise<{ access_token: string; refresh_token?: string; username?: string }> {
  const clientId = process.env.TWITTER_CLIENT_ID!;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!;

  const res = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twitter token exchange failed: ${err}`);
  }
  const data = await res.json();

  // Get username
  let username = '';
  try {
    const userRes = await fetch('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      username = userData.data?.username || '';
    }
  } catch { /* skip */ }

  return { access_token: data.access_token, refresh_token: data.refresh_token, username };
}

async function exchangeLinkedIn(code: string): Promise<{ access_token: string; name?: string; profileUrl?: string }> {
  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error('LinkedIn token exchange failed');
  const data = await res.json();

  // Get profile info
  let name = '';
  let profileUrl = '';
  try {
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (profileRes.ok) {
      const profile = await profileRes.json();
      name = profile.name || '';
      profileUrl = `https://www.linkedin.com/in/${profile.sub || ''}`;
    }
  } catch { /* skip */ }

  return { access_token: data.access_token, name, profileUrl };
}

async function exchangeFacebook(code: string): Promise<{ access_token: string; name?: string; profileUrl?: string }> {
  const appId = process.env.FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;

  const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${appSecret}&code=${code}`;
  const res = await fetch(tokenUrl);
  if (!res.ok) throw new Error('Facebook token exchange failed');
  const data = await res.json();

  // Get profile
  let name = '';
  let profileUrl = '';
  try {
    const profileRes = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${data.access_token}&fields=name,link`);
    if (profileRes.ok) {
      const profile = await profileRes.json();
      name = profile.name || '';
      profileUrl = profile.link || '';
    }
  } catch { /* skip */ }

  return { access_token: data.access_token, name, profileUrl };
}

async function exchangeReddit(code: string): Promise<{ access_token: string; refresh_token?: string; username?: string }> {
  const clientId = process.env.REDDIT_CLIENT_ID!;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET!;

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'User-Agent': 'GrowthPilot/1.0',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  if (!res.ok) throw new Error('Reddit token exchange failed');
  const data = await res.json();

  // Get username
  let username = '';
  try {
    const userRes = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        'User-Agent': 'GrowthPilot/1.0',
      },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      username = userData.name || '';
    }
  } catch { /* skip */ }

  return { access_token: data.access_token, refresh_token: data.refresh_token, username };
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (oauthError) return errorPage(`Authorization denied: ${oauthError}`);
  if (!code || !state) return errorPage('Missing code or state parameter');

  const sql = neon(process.env.NEON_CONNECTION_STRING!);

  // Look up state
  const states = await sql`SELECT * FROM oauth_states WHERE state = ${state}`;
  if (states.length === 0) return errorPage('Invalid or expired state. Please try again.');

  const oauthState = states[0] as { user_id: string; platform: string; code_verifier: string | null };

  // Delete state (one-time use)
  await sql`DELETE FROM oauth_states WHERE state = ${state}`;

  // Also clean up old states (> 10 minutes)
  await sql`DELETE FROM oauth_states WHERE created_at < NOW() - INTERVAL '10 minutes'`;

  try {
    const { platform, user_id: userId, code_verifier: codeVerifier } = oauthState;

    let accessToken = '';
    let refreshToken = '';
    let profileName = '';
    let profileUrl = '';

    if (platform === 'twitter') {
      if (!codeVerifier) return errorPage('Missing PKCE code_verifier');
      const result = await exchangeTwitter(code, codeVerifier);
      accessToken = result.access_token;
      refreshToken = result.refresh_token || '';
      profileName = result.username ? `@${result.username}` : '';
      profileUrl = result.username ? `https://twitter.com/${result.username}` : '';
    } else if (platform === 'linkedin') {
      const result = await exchangeLinkedIn(code);
      accessToken = result.access_token;
      profileName = result.name || '';
      profileUrl = result.profileUrl || '';
    } else if (platform === 'facebook') {
      const result = await exchangeFacebook(code);
      accessToken = result.access_token;
      profileName = result.name || '';
      profileUrl = result.profileUrl || '';
    } else if (platform === 'reddit') {
      const result = await exchangeReddit(code);
      accessToken = result.access_token;
      refreshToken = result.refresh_token || '';
      profileName = result.username ? `u/${result.username}` : '';
      profileUrl = result.username ? `https://reddit.com/user/${result.username}` : '';
    } else {
      return errorPage(`Unknown platform: ${platform}`);
    }

    // Save to social_accounts
    await sql`
      INSERT INTO social_accounts (user_id, platform, access_token, refresh_token, profile_name, profile_url)
      VALUES (${userId}, ${platform}, ${accessToken}, ${refreshToken || null}, ${profileName || null}, ${profileUrl || null})
      ON CONFLICT (user_id, platform)
      DO UPDATE SET access_token = ${accessToken}, refresh_token = ${refreshToken || null},
        profile_name = ${profileName || null}, profile_url = ${profileUrl || null}, connected_at = NOW()
    `;

    const platformNames: Record<string, string> = {
      twitter: 'Twitter / X',
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      reddit: 'Reddit',
    };

    return successPage(platformNames[platform] || platform, profileName);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Token exchange failed';
    console.error('OAuth callback error:', err);
    return errorPage(msg);
  }
}
