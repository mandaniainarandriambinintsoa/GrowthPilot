import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bot, Plug, CheckCircle, Database, ExternalLink, Shield } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Security Status */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">Security</h2>
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle className="w-3 h-3" /> API Keys Secured
          </span>
        </div>
        <p className="text-sm text-slate-400">
          All API keys (Neon DB, Gemini AI, Groq AI) are securely stored server-side
          and never exposed to the browser. All operations go through Edge Functions.
        </p>
      </Card>

      {/* AI Provider */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bot className="w-5 h-5 text-primary-light" />
          <h2 className="text-base font-semibold text-white">AI Provider</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Content generation uses Gemini Flash 2.0 with Groq Llama 3.3 70B fallback.
          API keys are configured via Vercel environment variables (server-side only).
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Gemini Flash 2.0', active: true, desc: 'Primary AI' },
            { name: 'Groq Llama 3.3 70B', active: true, desc: 'Fallback AI' },
            { name: 'Templates (offline)', active: true, desc: 'Last resort' },
            { name: 'Edge Functions', active: true, desc: 'Server-side only' },
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
                {desc}
              </span>
            </div>
          ))}
        </div>
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
          Serverless PostgreSQL via Neon Edge Functions. Connection string is server-side only.
        </p>
        <div className="bg-surface rounded-lg p-3 text-xs text-slate-500">
          Project: growthpilot | Region: us-west-2 | Tables: users, projects, posts, sessions, social_accounts, landing_pages
        </div>
      </Card>

      {/* Integrations */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Plug className="w-5 h-5 text-accent" />
            <h2 className="text-base font-semibold text-white">Social Media Integrations</h2>
          </div>
          <Link to="/social">
            <Button variant="secondary" size="sm">
              <ExternalLink className="w-3.5 h-3.5" /> Manage Connections
            </Button>
          </Link>
        </div>
        <p className="text-sm text-slate-400">
          Connect your social accounts to publish posts directly from GrowthPilot.
          Social API calls are routed through Edge Functions (no CORS issues).
        </p>
      </Card>
    </div>
  );
}
