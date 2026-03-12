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

// ============= DB Operations (via Edge API) =============

export async function getSocialAccounts(userId: string): Promise<SocialAccount[]> {
  const res = await fetch(`/api/social?userId=${encodeURIComponent(userId)}`);
  const data = await res.json();
  return data.accounts || [];
}

export async function connectAccount(
  userId: string,
  platform: string,
  accessToken: string,
  profileName?: string,
  profileUrl?: string,
  refreshToken?: string
): Promise<SocialAccount> {
  const res = await fetch('/api/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'connect',
      userId, platform, accessToken, profileName, profileUrl, refreshToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to connect account');
  return data.account;
}

export async function disconnectAccount(userId: string, platform: string): Promise<void> {
  await fetch('/api/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'disconnect', userId, platform }),
  });
}

// ============= Platform Publishing (via Edge API, no CORS issues) =============

interface PublishResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function publishPost(
  platform: string,
  token: string,
  content: string,
  profileName?: string
): Promise<PublishResult> {
  const res = await fetch('/api/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'publish', platform, token, content, profileName }),
  });
  return res.json();
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
