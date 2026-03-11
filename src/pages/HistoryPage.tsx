import { useState, useEffect, useMemo } from 'react';
import { Download, Filter, Copy, ExternalLink, Loader2, History } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { getAllPostsByUser, getProjects } from '../services/dbService';
import { PLATFORMS, getPlatform } from '../lib/platforms';
import { exportAsCSV, exportAsJSON } from '../lib/export';
import type { GeneratedPost, Project } from '../types';

type PostWithProject = GeneratedPost & { project_name: string };

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-300',
  scheduled: 'bg-amber-500/20 text-amber-400',
  published: 'bg-emerald-500/20 text-emerald-400',
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([getAllPostsByUser(user.id), getProjects(user.id)])
      .then(([postsData, projectsData]) => {
        setPosts(postsData);
        setProjects(projectsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (platformFilter !== 'all' && p.platform !== platformFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (projectFilter !== 'all' && p.project_id !== projectFilter) return false;
      return true;
    });
  }, [posts, platformFilter, statusFilter, projectFilter]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-white">Post History</h1>
          <span className="text-sm text-slate-400">({filtered.length} posts)</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportAsCSV(filtered)}
            disabled={filtered.length === 0}
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportAsJSON(filtered)}
            disabled={filtered.length === 0}
          >
            <Download className="w-4 h-4" />
            JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap items-center gap-4">
        <Filter className="w-4 h-4 text-slate-400" />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 uppercase tracking-wider">Platform</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-surface border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50"
          >
            <option value="all">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 uppercase tracking-wider">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 uppercase tracking-wider">Project</label>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-surface border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50"
          >
            <option value="all">All projects</option>
            {projects.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Posts table */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-400 text-lg">No posts found matching your filters.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-slate-400">
                  <th className="px-5 py-3 font-medium">Platform</th>
                  <th className="px-5 py-3 font-medium">Content</th>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => {
                  const platform = getPlatform(post.platform);
                  return (
                    <tr
                      key={post.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Platform */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: platform?.color + '20', color: platform?.color }}
                          >
                            {platform?.icon}
                          </span>
                          <span className="text-white text-sm">{platform?.name}</span>
                        </div>
                      </td>

                      {/* Content preview */}
                      <td className="px-5 py-3 max-w-xs">
                        <p className="text-slate-300 truncate" title={post.content}>
                          {post.content.length > 100
                            ? post.content.slice(0, 100) + '...'
                            : post.content}
                        </p>
                      </td>

                      {/* Project */}
                      <td className="px-5 py-3">
                        <span className="text-slate-400 text-xs">{post.project_name}</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[post.status]}`}
                        >
                          {post.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3 text-slate-400 whitespace-nowrap text-xs">
                        {formatDate(post.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => copyToClipboard(post.content)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                            title="Copy content"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <a
                            href={`/generate?project=${post.project_id}&post=${post.id}`}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                            title="Edit post"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
