import { PostCard } from './PostCard';
import { useProject } from '../../contexts/ProjectContext';

export function ChannelGrid() {
  const { posts, currentProject } = useProject();

  if (!currentProject || posts.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Generated Content</h2>
          <p className="text-sm text-slate-400 mt-1">
            {posts.length} posts ready for {currentProject.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
