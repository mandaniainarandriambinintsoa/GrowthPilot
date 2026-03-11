import { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, FileText, Download, Clock, CheckCircle, PenLine } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { getPostStats, getAllPostsByUser } from '../services/dbService';
import { getPlatform, PLATFORMS } from '../lib/platforms';
import type { GeneratedPost } from '../types';

type PostStat = { platform: string; status: string; count: number };
type PostWithProject = GeneratedPost & { project_name: string };

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PostStat[]>([]);
  const [recentPosts, setRecentPosts] = useState<PostWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([getPostStats(user.id), getAllPostsByUser(user.id)])
      .then(([s, posts]) => {
        setStats(s);
        setRecentPosts(posts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // Derived counts
  const totalPosts = useMemo(() => stats.reduce((sum, s) => sum + s.count, 0), [stats]);
  const publishedCount = useMemo(() => stats.filter(s => s.status === 'published').reduce((sum, s) => sum + s.count, 0), [stats]);
  const scheduledCount = useMemo(() => stats.filter(s => s.status === 'scheduled').reduce((sum, s) => sum + s.count, 0), [stats]);
  const draftCount = useMemo(() => stats.filter(s => s.status === 'draft').reduce((sum, s) => sum + s.count, 0), [stats]);

  // Platform breakdown
  const platformCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of stats) {
      map[s.platform] = (map[s.platform] || 0) + s.count;
    }
    return PLATFORMS.map(p => ({ ...p, count: map[p.id] || 0 })).filter(p => p.count > 0);
  }, [stats]);

  const maxPlatformCount = useMemo(() => Math.max(...platformCounts.map(p => p.count), 1), [platformCounts]);

  // CSV export
  function exportCSV() {
    const header = 'Platform,Status,Date,Content Preview,Project\n';
    const rows = recentPosts.map(p => {
      const preview = p.content.replace(/"/g, '""').slice(0, 100);
      const date = new Date(p.created_at).toLocaleDateString();
      return `"${p.platform}","${p.status}","${date}","${preview}","${p.project_name}"`;
    });
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growthpilot-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Status badge
  function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
      published: 'bg-emerald-500/15 text-emerald-400',
      scheduled: 'bg-yellow-500/15 text-yellow-400',
      draft: 'bg-slate-500/15 text-slate-400',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.draft}`}>
        {status}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Analytics
          </h1>
          <p className="text-slate-400 mt-1">Overview of your content performance</p>
        </div>
        <Button variant="secondary" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Posts</p>
              <p className="text-2xl font-bold text-white">{totalPosts}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Published</p>
              <p className="text-2xl font-bold text-emerald-400">{publishedCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/10">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Scheduled</p>
              <p className="text-2xl font-bold text-yellow-400">{scheduledCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-500/10">
              <PenLine className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Drafts</p>
              <p className="text-2xl font-bold text-slate-300">{draftCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <Card>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Posts by Platform</h2>
        </div>

        {platformCounts.length === 0 ? (
          <p className="text-slate-400 text-sm">No posts yet. Generate content to see platform stats.</p>
        ) : (
          <div className="space-y-4">
            {platformCounts.map(p => (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: p.color === '#000000' ? '#6b7280' : p.color }}
                    />
                    {p.name}
                  </span>
                  <span className="text-slate-400 font-medium">{p.count}</span>
                </div>
                <div className="w-full h-3 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(p.count / maxPlatformCount) * 100}%`,
                      backgroundColor: p.color === '#000000' ? '#6b7280' : p.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        </div>

        {recentPosts.length === 0 ? (
          <p className="text-slate-400 text-sm">No activity yet.</p>
        ) : (
          <div className="space-y-3">
            {recentPosts.slice(0, 20).map(post => {
              const platform = getPlatform(post.platform);
              return (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-surface hover:bg-surface-light/50 transition-colors"
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{
                      backgroundColor:
                        platform?.color === '#000000' ? '#374151' : (platform?.color ?? '#374151'),
                    }}
                  >
                    {platform?.icon ?? '?'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{post.content.slice(0, 80)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {post.project_name} &middot; {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <StatusBadge status={post.status} />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
