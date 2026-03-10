import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Key, Bot, Plug, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { isGeminiConfigured } from '../lib/gemini';

export function SettingsPage() {
  const [geminiKey, setGeminiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [saved, setSaved] = useState(false);

  const handleSaveGemini = () => {
    // In a real app, this would be stored securely in the DB
    // For MVP, we show a notice about .env.local
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* AI Provider */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bot className="w-5 h-5 text-primary-light" />
          <h2 className="text-base font-semibold text-white">AI Provider</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Gemini Flash 2.0 — fast, cheap, great for content generation.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Gemini Flash 2.0', active: true, desc: '15 RPM free tier' },
            { name: 'Claude (Anthropic)', active: false, desc: 'Coming soon' },
            { name: 'GPT-4o (OpenAI)', active: false, desc: 'Coming soon' },
            { name: 'Templates (offline)', active: !isGeminiConfigured(), desc: 'No API key needed' },
          ].map(({ name, active, desc }) => (
            <div
              key={name}
              className={`p-3 rounded-xl border text-sm text-left transition-all ${
                active
                  ? 'border-primary/50 bg-primary/5 text-white'
                  : 'border-white/10 bg-surface text-slate-400'
              }`}
            >
              {name}
              <span className={`block text-xs mt-1 ${active ? 'text-primary-light' : 'text-slate-500'}`}>
                {active ? 'Active' : desc}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Gemini API Key */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-warning" />
          <h2 className="text-base font-semibold text-white">Gemini API Key</h2>
          {isGeminiConfigured() ? (
            <span className="flex items-center gap-1 text-xs text-success">
              <CheckCircle className="w-3 h-3" /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-warning">
              <AlertCircle className="w-3 h-3" /> Not configured
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Get your free API key from{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-light hover:underline"
          >
            Google AI Studio
          </a>
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">API Key</label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="bg-surface rounded-lg p-3 text-xs text-slate-400">
            <strong className="text-slate-300">For development:</strong> Add your key to{' '}
            <code className="bg-surface-lighter px-1.5 py-0.5 rounded text-primary-light">.env.local</code> as{' '}
            <code className="bg-surface-lighter px-1.5 py-0.5 rounded text-primary-light">VITE_GEMINI_API_KEY=your_key</code>
          </div>
        </div>
        <Button className="mt-4" size="sm" onClick={handleSaveGemini}>
          {saved ? '✓ Saved' : 'Save Key'}
        </Button>
      </Card>

      {/* Database */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-accent" />
          <h2 className="text-base font-semibold text-white">Database</h2>
          <span className="flex items-center gap-1 text-xs text-success">
            <CheckCircle className="w-3 h-3" /> Neon PostgreSQL
          </span>
        </div>
        <p className="text-sm text-slate-400 mb-2">
          Serverless PostgreSQL — projects and posts are persisted automatically.
        </p>
        <div className="bg-surface rounded-lg p-3 text-xs text-slate-500">
          Project: growthpilot | Region: us-west-2 | Tables: users, projects, posts, api_keys, sessions
        </div>
      </Card>

      {/* Integrations */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Plug className="w-5 h-5 text-accent" />
          <h2 className="text-base font-semibold text-white">Social Media Integrations</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Connect your accounts for direct publishing (coming soon).
        </p>
        <div className="space-y-2">
          {[
            'Twitter/X', 'LinkedIn', 'Reddit', 'Facebook',
            'Instagram', 'TikTok', 'YouTube',
          ].map((name) => (
            <div
              key={name}
              className="flex items-center justify-between p-3 bg-surface rounded-xl"
            >
              <span className="text-sm text-white">{name}</span>
              <span className="text-xs text-slate-500">Coming soon</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
