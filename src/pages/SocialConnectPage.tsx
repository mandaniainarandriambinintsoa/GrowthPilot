import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Link2, Unlink, CheckCircle, ExternalLink, AlertCircle, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getSocialAccounts, connectAccount, disconnectAccount,
  PLATFORM_AUTH_INFO, type SocialAccount,
} from '../services/socialService';

const PLATFORMS = ['twitter', 'linkedin', 'facebook', 'reddit', 'instagram', 'tiktok', 'youtube'] as const;

const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#000000', linkedin: '#0A66C2', facebook: '#1877F2',
  reddit: '#FF4500', instagram: '#E4405F', tiktok: '#000000', youtube: '#FF0000',
};

const PLATFORM_ICONS: Record<string, string> = {
  twitter: '𝕏', linkedin: 'in', facebook: 'f', reddit: 'R',
  instagram: '📷', tiktok: '♪', youtube: '▶',
};

export default function SocialConnectPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [profileInput, setProfileInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getSocialAccounts(user.id);
      setAccounts(data);
    } catch {
      console.warn('Failed to load social accounts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const handleConnect = async (platform: string) => {
    if (!user || !tokenInput.trim()) return;
    setError(null);
    try {
      await connectAccount(user.id, platform, tokenInput.trim(), profileInput.trim() || undefined);
      setConnectingPlatform(null);
      setTokenInput('');
      setProfileInput('');
      await loadAccounts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!user) return;
    await disconnectAccount(user.id, platform);
    await loadAccounts();
  };

  const getAccount = (platform: string) => accounts.find((a) => a.platform === platform);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Link2 className="w-6 h-6 text-primary-light" />
          Social Integrations
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Connect your social media accounts to publish directly from GrowthPilot.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {PLATFORMS.map((platform) => {
            const account = getAccount(platform);
            const info = PLATFORM_AUTH_INFO[platform];
            const isConnecting = connectingPlatform === platform;

            return (
              <Card key={platform}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: PLATFORM_COLORS[platform] || '#6366f1' }}
                    >
                      {PLATFORM_ICONS[platform]}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{info.name}</h3>
                      {account ? (
                        <p className="text-xs text-success flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Connected{account.profile_name ? ` as ${account.profile_name}` : ''}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500">Not connected</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {account ? (
                      <Button variant="ghost" size="sm" onClick={() => handleDisconnect(platform)}>
                        <Unlink className="w-3.5 h-3.5" /> Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="secondary" size="sm"
                        onClick={() => {
                          setConnectingPlatform(isConnecting ? null : platform);
                          setTokenInput('');
                          setProfileInput('');
                          setError(null);
                        }}
                      >
                        <Link2 className="w-3.5 h-3.5" /> Connect
                      </Button>
                    )}
                  </div>
                </div>

                {/* Connect form */}
                {isConnecting && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    <div className="bg-surface rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-2">{info.instructions}</p>
                      <a
                        href={info.tokenUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-light hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Open Developer Portal
                      </a>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Access Token</label>
                      <div className="relative">
                        <input
                          type={showToken ? 'text' : 'password'}
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value)}
                          placeholder="Paste your access token..."
                          className="w-full px-3 py-2 pr-10 bg-surface border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50"
                        />
                        <button
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                        >
                          {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Profile Name (optional)</label>
                      <input
                        type="text"
                        value={profileInput}
                        onChange={(e) => setProfileInput(e.target.value)}
                        placeholder="@username"
                        className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    {error && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {error}
                      </p>
                    )}

                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setConnectingPlatform(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleConnect(platform)} disabled={!tokenInput.trim()}>
                        <CheckCircle className="w-3.5 h-3.5" /> Save Connection
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Info card */}
      <Card>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">How it works</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Each platform requires an API access token from their developer portal.
              GrowthPilot stores your tokens securely in the database and uses them to publish posts directly.
              For Instagram, TikTok, and YouTube, direct publishing requires video/image upload — use their native Creator tools.
              Twitter, LinkedIn, Facebook, and Reddit support text post publishing.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
