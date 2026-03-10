import { Sparkles } from 'lucide-react';
import { UrlInput } from '../components/scraper/UrlInput';
import { ScrapedPreview } from '../components/scraper/ScrapedPreview';
import { ChannelGrid } from '../components/channels/ChannelGrid';
import { useProject } from '../contexts/ProjectContext';
import { isGeminiConfigured } from '../lib/gemini';

const TONES = [
  { value: 'casual', label: 'Casual', emoji: '😎' },
  { value: 'professional', label: 'Pro', emoji: '💼' },
  { value: 'viral', label: 'Viral', emoji: '🔥' },
] as const;

export function Generate() {
  const { error, currentProject, isGenerating, tone, setTone } = useProject();

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-2">Generate Content</h1>
        <p className="text-sm text-slate-400">
          Enter a URL and we'll create marketing content for every platform
        </p>
        {isGeminiConfigured() ? (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-success/10 border border-success/20 rounded-full text-xs text-success">
            <Sparkles className="w-3 h-3" /> Gemini AI active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-warning/10 border border-warning/20 rounded-full text-xs text-warning">
            Template mode — add Gemini API key in Settings for AI generation
          </span>
        )}
      </div>

      {/* Tone selector */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-slate-500 mr-2">Tone:</span>
        {TONES.map(({ value, label, emoji }) => (
          <button
            key={value}
            onClick={() => setTone(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tone === value
                ? 'bg-primary/20 text-primary-light border border-primary/30'
                : 'bg-surface-light text-slate-400 border border-white/5 hover:border-white/10'
            }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      <UrlInput />

      {error && (
        <div className="max-w-2xl mx-auto bg-danger/10 border border-danger/20 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {isGenerating && !currentProject && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-slate-400">Generating content with AI...</p>
        </div>
      )}

      {currentProject && (
        <>
          <ScrapedPreview />
          {isGenerating ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-slate-400">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Gemini is crafting your posts...
              </p>
            </div>
          ) : (
            <ChannelGrid />
          )}
        </>
      )}
    </div>
  );
}
