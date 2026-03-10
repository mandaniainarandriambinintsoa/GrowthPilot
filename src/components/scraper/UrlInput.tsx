import { useState, type FormEvent } from 'react';
import { Globe, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useProject } from '../../contexts/ProjectContext';

export function UrlInput() {
  const [url, setUrl] = useState('');
  const { addProject, isLoading } = useProject();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http')) {
      finalUrl = `https://${finalUrl}`;
    }

    addProject(finalUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <Globe className="absolute left-4 w-5 h-5 text-slate-500" />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter your website URL (e.g. factumation.vercel.app)"
          className="w-full pl-12 pr-36 py-4 bg-surface-light border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
          disabled={isLoading}
        />
        <div className="absolute right-2">
          <Button type="submit" loading={isLoading} size="md">
            {isLoading ? 'Scraping...' : 'Analyze'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </form>
  );
}
