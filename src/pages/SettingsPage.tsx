import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Key, Bot, Plug } from 'lucide-react';

export function SettingsPage() {
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
          Choose the AI model for generating marketing content.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {['Claude (Anthropic)', 'Gemini (Google)', 'GPT-4 (OpenAI)', 'Local (Templates)'].map(
            (provider) => (
              <button
                key={provider}
                className={`p-3 rounded-xl border text-sm text-left transition-all ${
                  provider === 'Local (Templates)'
                    ? 'border-primary/50 bg-primary/5 text-white'
                    : 'border-white/10 bg-surface text-slate-400 hover:border-white/20'
                }`}
              >
                {provider}
                {provider === 'Local (Templates)' && (
                  <span className="block text-xs text-primary-light mt-1">Active</span>
                )}
              </button>
            )
          )}
        </div>
      </Card>

      {/* API Keys */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-warning" />
          <h2 className="text-base font-semibold text-white">API Keys</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Add your API keys to enable AI generation and social media publishing.
        </p>
        <div className="space-y-3">
          {[
            { label: 'Anthropic API Key', placeholder: 'sk-ant-...' },
            { label: 'Google Gemini Key', placeholder: 'AI...' },
            { label: 'Meta (Facebook/Instagram)', placeholder: 'Coming soon', disabled: true },
            { label: 'Twitter/X API Key', placeholder: 'Coming soon', disabled: true },
          ].map(({ label, placeholder, disabled }) => (
            <div key={label}>
              <label className="text-xs text-slate-400 mb-1 block">{label}</label>
              <input
                type="password"
                placeholder={placeholder}
                disabled={disabled}
                className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 disabled:opacity-40"
              />
            </div>
          ))}
        </div>
        <Button className="mt-4" size="sm">
          Save Keys
        </Button>
      </Card>

      {/* Integrations */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Plug className="w-5 h-5 text-accent" />
          <h2 className="text-base font-semibold text-white">Integrations</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Connect your social media accounts for direct publishing.
        </p>
        <div className="space-y-2">
          {[
            { name: 'Twitter/X', status: 'Coming soon' },
            { name: 'LinkedIn', status: 'Coming soon' },
            { name: 'Reddit', status: 'Coming soon' },
            { name: 'Facebook', status: 'Coming soon' },
            { name: 'Instagram', status: 'Coming soon' },
            { name: 'TikTok', status: 'Coming soon' },
            { name: 'YouTube', status: 'Coming soon' },
          ].map(({ name, status }) => (
            <div
              key={name}
              className="flex items-center justify-between p-3 bg-surface rounded-xl"
            >
              <span className="text-sm text-white">{name}</span>
              <span className="text-xs text-slate-500">{status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
