import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { PostCard } from './PostCard';
import { VideoGenerator } from '../video/VideoGenerator';
import { useProject } from '../../contexts/ProjectContext';
import { isAIConfigured } from '../../lib/gemini';

export function ChannelGrid() {
  const { posts, currentProject, regenerateAll, isGenerating } = useProject();

  if (!currentProject || posts.length === 0) return null;

  const videoPosts = posts.filter((p) => p.platform === 'tiktok' || p.platform === 'youtube');

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Generated Content</h2>
          <p className="text-sm text-slate-400 mt-1">
            {posts.length} posts ready for {currentProject.name}
          </p>
        </div>
        {isAIConfigured() && (
          <Button variant="secondary" size="sm" onClick={regenerateAll} loading={isGenerating}>
            <RefreshCw className="w-4 h-4" /> Regenerate All with AI
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Video generation section */}
      {videoPosts.length > 0 && currentProject.scraped_data && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Video Generation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videoPosts.map((post) => (
              <VideoGenerator
                key={`video-${post.id}`}
                data={currentProject.scraped_data!}
                platform={post.platform as 'tiktok' | 'youtube'}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
