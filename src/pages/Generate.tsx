import { UrlInput } from '../components/scraper/UrlInput';
import { ScrapedPreview } from '../components/scraper/ScrapedPreview';
import { ChannelGrid } from '../components/channels/ChannelGrid';
import { useProject } from '../contexts/ProjectContext';

export function Generate() {
  const { error, currentProject } = useProject();

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-2">Generate Content</h1>
        <p className="text-sm text-slate-400">
          Enter a URL and we'll create marketing content for every platform
        </p>
      </div>

      <UrlInput />

      {error && (
        <div className="max-w-2xl mx-auto bg-danger/10 border border-danger/20 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {currentProject && (
        <>
          <ScrapedPreview />
          <ChannelGrid />
        </>
      )}
    </div>
  );
}
