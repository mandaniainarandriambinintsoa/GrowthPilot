import { sql } from '../lib/neon';

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: string;
  access_token: string;
  refresh_token?: string;
  profile_name?: string;
  profile_url?: string;
  connected_at: string;
}

// ============= DB Operations =============

export async function getSocialAccounts(userId: string): Promise<SocialAccount[]> {
  const rows = await sql`SELECT * FROM social_accounts WHERE user_id = ${userId} ORDER BY platform`;
  return rows as unknown as SocialAccount[];
}

export async function connectAccount(
  userId: string,
  platform: string,
  accessToken: string,
  profileName?: string,
  profileUrl?: string,
  refreshToken?: string
): Promise<SocialAccount> {
  const rows = await sql`
    INSERT INTO social_accounts (user_id, platform, access_token, refresh_token, profile_name, profile_url)
    VALUES (${userId}, ${platform}, ${accessToken}, ${refreshToken || null}, ${profileName || null}, ${profileUrl || null})
    ON CONFLICT (user_id, platform)
    DO UPDATE SET access_token = ${accessToken}, refresh_token = ${refreshToken || null},
      profile_name = ${profileName || null}, profile_url = ${profileUrl || null}, connected_at = NOW()
    RETURNING *
  `;
  return rows[0] as unknown as SocialAccount;
}

export async function disconnectAccount(userId: string, platform: string): Promise<void> {
  await sql`DELETE FROM social_accounts WHERE user_id = ${userId} AND platform = ${platform}`;
}

// ============= Platform Publishing =============

interface PublishResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Twitter/X — uses v2 API
async function publishToTwitter(token: string, content: string): Promise<PublishResult> {
  try {
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content }),
    });
    if (!res.ok) throw new Error(`Twitter API: ${res.status}`);
    const data = await res.json();
    return { success: true, url: `https://twitter.com/i/web/status/${data.data?.id}` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Twitter publish failed' };
  }
}

// LinkedIn — uses v2 API
async function publishToLinkedIn(token: string, content: string): Promise<PublishResult> {
  try {
    // Get user profile
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

// Facebook — uses Graph API
async function publishToFacebook(token: string, content: string): Promise<PublishResult> {
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me/feed`, {
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

// Reddit — uses OAuth API
async function publishToReddit(token: string, content: string, subreddit?: string): Promise<PublishResult> {
  if (!subreddit) {
    return { success: false, error: 'No subreddit specified — set it in your Social account profile name (e.g., "r/SaaS")' };
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

// Generic publish dispatcher
// NOTE: Social API calls from the browser will be blocked by CORS.
// For production, route these through a serverless function (Vercel API route).
// Current implementation works for testing with CORS-disabled browser or proxy.
export async function publishPost(
  platform: string,
  token: string,
  content: string,
  profileName?: string
): Promise<PublishResult> {
  switch (platform) {
    case 'twitter':
      return publishToTwitter(token, content);
    case 'linkedin':
      return publishToLinkedIn(token, content);
    case 'facebook':
      return publishToFacebook(token, content);
    case 'reddit':
      return publishToReddit(token, content, profileName || undefined);
    case 'instagram':
      return { success: false, error: 'Instagram requires Business API with media upload — use Creator Studio' };
    case 'tiktok':
      return { success: false, error: 'TikTok requires video upload — use TikTok Creator Portal' };
    case 'youtube':
      return { success: false, error: 'YouTube requires video upload — use YouTube Studio' };
    default:
      return { success: false, error: `Unsupported platform: ${platform}` };
  }
}

// Platform OAuth config (for reference / instructions)
export const PLATFORM_AUTH_INFO: Record<string, { name: string; instructions: string; tokenUrl: string }> = {
  twitter: {
    name: 'Twitter / X',
    instructions: 'Create a Twitter Developer App at developer.twitter.com, generate a Bearer Token or use OAuth 2.0 with PKCE.',
    tokenUrl: 'https://developer.twitter.com/en/portal/dashboard',
  },
  linkedin: {
    name: 'LinkedIn',
    instructions: 'Create a LinkedIn App at linkedin.com/developers, request w_member_social scope, get an OAuth 2.0 access token.',
    tokenUrl: 'https://www.linkedin.com/developers/apps',
  },
  facebook: {
    name: 'Facebook',
    instructions: 'Create a Facebook App at developers.facebook.com, get a Page Access Token with pages_manage_posts permission.',
    tokenUrl: 'https://developers.facebook.com/tools/explorer/',
  },
  reddit: {
    name: 'Reddit',
    instructions: 'Create a Reddit App at reddit.com/prefs/apps (script type), use OAuth to get an access token.',
    tokenUrl: 'https://www.reddit.com/prefs/apps',
  },
  instagram: {
    name: 'Instagram',
    instructions: 'Requires a Facebook Business account linked to Instagram. Use Graph API with instagram_content_publish permission.',
    tokenUrl: 'https://developers.facebook.com/tools/explorer/',
  },
  tiktok: {
    name: 'TikTok',
    instructions: 'Register at developers.tiktok.com, create an app with Content Posting API access.',
    tokenUrl: 'https://developers.tiktok.com/',
  },
  youtube: {
    name: 'YouTube',
    instructions: 'Create a Google Cloud project, enable YouTube Data API v3, create OAuth 2.0 credentials.',
    tokenUrl: 'https://console.cloud.google.com/apis/credentials',
  },
};
