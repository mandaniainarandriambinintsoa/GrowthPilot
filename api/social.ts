import { neon } from '@neondatabase/serverless';

export const config = { runtime: 'edge' };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req: Request) {
  const sql = neon(process.env.NEON_CONNECTION_STRING!);
  const url = new URL(req.url);

  try {
    if (req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) return json({ error: 'userId required' }, 400);
      const rows = await sql`SELECT * FROM social_accounts WHERE user_id = ${userId} ORDER BY platform`;
      return json({ accounts: rows });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action } = body;

      if (action === 'connect') {
        const { userId, platform, accessToken, profileName, profileUrl, refreshToken } = body;
        const rows = await sql`
          INSERT INTO social_accounts (user_id, platform, access_token, refresh_token, profile_name, profile_url)
          VALUES (${userId}, ${platform}, ${accessToken}, ${refreshToken || null}, ${profileName || null}, ${profileUrl || null})
          ON CONFLICT (user_id, platform)
          DO UPDATE SET access_token = ${accessToken}, refresh_token = ${refreshToken || null},
            profile_name = ${profileName || null}, profile_url = ${profileUrl || null}, connected_at = NOW()
          RETURNING *
        `;
        return json({ account: rows[0] });
      }

      if (action === 'disconnect') {
        const { userId, platform } = body;
        await sql`DELETE FROM social_accounts WHERE user_id = ${userId} AND platform = ${platform}`;
        return json({ success: true });
      }

      if (action === 'publish') {
        const { platform, token, content, profileName } = body;
        const result = await publishPost(platform, token, content, profileName);
        return json(result);
      }

      return json({ error: 'Unknown action' }, 400);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, 500);
  }
}

// ============= Platform Publishing (server-side, no CORS issues) =============

interface PublishResult {
  success: boolean;
  url?: string;
  error?: string;
}

async function publishToTwitter(token: string, content: string): Promise<PublishResult> {
  try {
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content }),
    });
    if (!res.ok) throw new Error(`Twitter API: ${res.status}`);
    const data = await res.json();
    return { success: true, url: `https://twitter.com/i/web/status/${data.data?.id}` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Twitter publish failed' };
  }
}

async function publishToLinkedIn(token: string, content: string): Promise<PublishResult> {
  try {
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!profileRes.ok) throw new Error('Failed to get LinkedIn profile');
    const profile = await profileRes.json();

    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${profile.sub}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });
    if (!res.ok) throw new Error(`LinkedIn API: ${res.status}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'LinkedIn publish failed' };
  }
}

async function publishToFacebook(token: string, content: string): Promise<PublishResult> {
  try {
    const res = await fetch('https://graph.facebook.com/v19.0/me/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content, access_token: token }),
    });
    if (!res.ok) throw new Error(`Facebook API: ${res.status}`);
    const data = await res.json();
    return { success: true, url: `https://facebook.com/${data.id}` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Facebook publish failed' };
  }
}

async function publishToReddit(token: string, content: string, subreddit?: string): Promise<PublishResult> {
  if (!subreddit) {
    return { success: false, error: 'No subreddit specified' };
  }
  try {
    const lines = content.split('\n');
    const title = lines[0].replace(/^#+\s*/, '').slice(0, 300);
    const body = lines.slice(1).join('\n').trim();

    const res = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        kind: 'self',
        sr: subreddit.replace(/^r\//, ''),
        title,
        text: body || title,
      }),
    });
    if (!res.ok) throw new Error(`Reddit API: ${res.status}`);
    const data = await res.json();
    return { success: true, url: data.json?.data?.url };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Reddit publish failed' };
  }
}

async function publishPost(platform: string, token: string, content: string, profileName?: string): Promise<PublishResult> {
  switch (platform) {
    case 'twitter': return publishToTwitter(token, content);
    case 'linkedin': return publishToLinkedIn(token, content);
    case 'facebook': return publishToFacebook(token, content);
    case 'reddit': return publishToReddit(token, content, profileName);
    case 'instagram': return { success: false, error: 'Instagram requires Business API with media upload — use Creator Studio' };
    case 'tiktok': return { success: false, error: 'TikTok requires video upload — use TikTok Creator Portal' };
    case 'youtube': return { success: false, error: 'YouTube requires video upload — use YouTube Studio' };
    default: return { success: false, error: `Unsupported platform: ${platform}` };
  }
}
