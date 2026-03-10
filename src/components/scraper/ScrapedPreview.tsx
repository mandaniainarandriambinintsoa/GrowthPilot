import { Globe, Tag, Layers, Image } from 'lucide-react';
import { Card } from '../ui/Card';
import { useProject } from '../../contexts/ProjectContext';

export function ScrapedPreview() {
  const { currentProject } = useProject();

  if (!currentProject?.scraped_data) return null;

  const { title, description, keywords, features, screenshots } =
    currentProject.scraped_data;

  return (
    <Card className="mt-8">
      <div className="flex items-start gap-4 mb-6">
        {currentProject.scraped_data.logo && (
          <img
            src={currentProject.scraped_data.logo}
            alt=""
            className="w-12 h-12 rounded-xl bg-surface-lighter object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{title}</h3>
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{description}</p>
          <a
            href={currentProject.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-light hover:underline mt-1 inline-flex items-center gap-1"
          >
            <Globe className="w-3 h-3" />
            {currentProject.url}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Keywords */}
        <div className="bg-surface rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
            <Tag className="w-4 h-4 text-primary-light" />
            Keywords ({keywords.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.slice(0, 8).map((k) => (
              <span
                key={k}
                className="px-2 py-0.5 bg-primary/10 text-primary-light text-xs rounded-full"
              >
                {k}
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-surface rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
            <Layers className="w-4 h-4 text-accent" />
            Features ({features.length})
          </div>
          <ul className="space-y-1">
            {features.slice(0, 5).map((f) => (
              <li key={f} className="text-xs text-slate-400 truncate">
                • {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Screenshots */}
        <div className="bg-surface rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
            <Image className="w-4 h-4 text-success" />
            Media ({screenshots.length})
          </div>
          <div className="flex gap-2">
            {screenshots.slice(0, 3).map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                className="w-16 h-16 rounded-lg object-cover bg-surface-lighter"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ))}
            {screenshots.length === 0 && (
              <span className="text-xs text-slate-500">No images found</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
