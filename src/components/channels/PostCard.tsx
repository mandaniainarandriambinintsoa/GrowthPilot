import { useState } from 'react';
import { Copy, RefreshCw, Check, Edit3, Save } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { GeneratedPost } from '../../types';
import { getPlatform } from '../../lib/platforms';
import { useProject } from '../../contexts/ProjectContext';

interface PostCardProps {
  post: GeneratedPost;
}

export function PostCard({ post }: PostCardProps) {
  const platform = getPlatform(post.platform);
  const { regeneratePost, updatePost } = useProject();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  if (!platform) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    updatePost(post.id, editContent);
    setEditing(false);
  };

  return (
    <Card className="group">
      {/* Platform header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: platform.color || '#6366f1' }}
          >
            {platform.icon}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{platform.name}</h4>
            <p className="text-xs text-slate-500">{platform.description.slice(0, 50)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => regeneratePost(post.id)}
            title="Regenerate"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(!editing);
              setEditContent(post.content);
            }}
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy">
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-48 bg-surface border border-white/10 rounded-xl p-3 text-sm text-slate-300 resize-none focus:outline-none focus:border-primary/50"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-xl p-4 max-h-64 overflow-y-auto">
          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
            {post.content}
          </pre>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <span className="text-xs text-slate-500">
          {post.content.length} / {getPlatform(post.platform)?.maxLength} chars
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            post.status === 'draft'
              ? 'bg-slate-700 text-slate-400'
              : post.status === 'scheduled'
                ? 'bg-warning/10 text-warning'
                : 'bg-success/10 text-success'
          }`}
        >
          {post.status}
        </span>
      </div>
    </Card>
  );
}
