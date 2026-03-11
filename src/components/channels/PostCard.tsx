import { useState, useRef, useEffect } from 'react';
import { Copy, RefreshCw, Check, Edit3, Save, Calendar, GitBranch, ImagePlus, Loader2, Send } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { GeneratedPost } from '../../types';
import { getPlatform } from '../../lib/platforms';
import { useProject } from '../../contexts/ProjectContext';
import { generateImageForPlatform } from '../../services/imageService';
import { isGeminiConfigured } from '../../lib/gemini';
import { getSocialAccounts, publishPost } from '../../services/socialService';
import { useAuth } from '../../contexts/AuthContext';

interface PostCardProps {
  post: GeneratedPost;
}

export function PostCard({ post }: PostCardProps) {
  const platform = getPlatform(post.platform);
  const { regeneratePost, updatePost, schedulePost, generateVariant, variants, isGenerating, currentProject } = useProject();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [activeVariant, setActiveVariant] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const schedulerRef = useRef<HTMLDivElement>(null);

  const postVariants = variants[post.id] || [];
  const hasVariants = postVariants.length > 0;
  const displayContent = activeVariant === 0 ? post.content : postVariants[activeVariant - 1] || post.content;

  // Close scheduler when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (schedulerRef.current && !schedulerRef.current.contains(e.target as Node)) {
        setShowScheduler(false);
      }
    }
    if (showScheduler) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showScheduler]);

  if (!platform) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateVariant = async () => {
    await generateVariant(post.id);
    // Switch to the newly generated variant
    setActiveVariant(postVariants.length + 1);
  };

  const handleSave = () => {
    updatePost(post.id, editContent);
    setEditing(false);
  };

  const handleSchedule = async () => {
    if (!scheduleDate) return;
    await schedulePost(post.id, new Date(scheduleDate).toISOString());
    setShowScheduler(false);
    setScheduleDate('');
  };

  const handleGenerateImage = async () => {
    if (!currentProject?.scraped_data || !isGeminiConfigured()) return;
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateImageForPlatform(currentProject.scraped_data, post.platform);
      setGeneratedImage(imageUrl);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePublish = async () => {
    if (!user) return;
    setIsPublishing(true);
    setPublishStatus(null);
    try {
      const accounts = await getSocialAccounts(user.id);
      const account = accounts.find((a) => a.platform === post.platform);
      if (!account) {
        setPublishStatus({ ok: false, msg: 'No account connected — go to Social page' });
        return;
      }
      const result = await publishPost(post.platform, account.access_token, displayContent, account.profile_name || undefined);
      if (result.success) {
        setPublishStatus({ ok: true, msg: result.url ? `Published! ${result.url}` : 'Published successfully!' });
      } else {
        setPublishStatus({ ok: false, msg: result.error || 'Publish failed' });
      }
    } catch (e) {
      setPublishStatus({ ok: false, msg: e instanceof Error ? e.message : 'Publish failed' });
    } finally {
      setIsPublishing(false);
    }
  };

  const isVisualPlatform = !['tiktok', 'youtube'].includes(post.platform);

  // Get minimum datetime (now) for the picker
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const formatScheduledDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="group">
      {/* Platform header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 min-w-11 rounded-xl flex items-center justify-center text-white font-bold text-base"
            style={{ backgroundColor: platform.color || '#6366f1' }}
          >
            {platform.icon}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white">{platform.name}</h4>
            <p className="text-xs text-slate-500 truncate">{platform.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerateVariant}
            title="Generate Variant"
            disabled={isGenerating}
          >
            <GitBranch className="w-3.5 h-3.5" />
          </Button>
          {isVisualPlatform && isGeminiConfigured() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateImage}
              title="Generate Image"
              disabled={isGeneratingImage}
            >
              {isGeneratingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImagePlus className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
          <div className="relative" ref={schedulerRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScheduler(!showScheduler)}
              title="Schedule"
              className={post.status === 'scheduled' ? 'text-warning' : ''}
            >
              <Calendar className="w-3.5 h-3.5" />
            </Button>

            {/* Schedule popover */}
            {showScheduler && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-surface border border-white/10 rounded-xl p-4 shadow-2xl min-w-[260px]">
                <p className="text-xs font-medium text-slate-400 mb-3">Schedule post</p>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={getMinDateTime()}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 [color-scheme:dark]"
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowScheduler(false);
                      setScheduleDate('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSchedule}
                    disabled={!scheduleDate}
                    className="flex-1"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Schedule
                  </Button>
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePublish}
            title="Publish now"
            disabled={isPublishing}
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Variant tabs */}
      {hasVariants && (
        <div className="flex items-center gap-1 mb-3">
          <button
            onClick={() => setActiveVariant(0)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeVariant === 0
                ? 'bg-primary/20 text-primary-light border border-primary/30'
                : 'bg-surface-light text-slate-400 border border-white/5 hover:border-white/10'
            }`}
          >
            Variant A
          </button>
          {postVariants.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveVariant(i + 1)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeVariant === i + 1
                  ? 'bg-primary/20 text-primary-light border border-primary/30'
                  : 'bg-surface-light text-slate-400 border border-white/5 hover:border-white/10'
              }`}
            >
              Variant {String.fromCharCode(66 + i)}
            </button>
          ))}
        </div>
      )}

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
            {displayContent}
          </pre>
        </div>
      )}

      {/* Generated image */}
      {generatedImage && (
        <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
          <img src={generatedImage} alt="AI generated visual" className="w-full h-auto" />
        </div>
      )}

      {/* Publish status */}
      {publishStatus && (
        <div className={`mt-3 px-3 py-2 rounded-lg text-xs ${
          publishStatus.ok ? 'bg-success/10 text-success' : 'bg-red-500/10 text-red-400'
        }`}>
          {publishStatus.msg}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <span className="text-xs text-slate-500">
          {displayContent.length} / {getPlatform(post.platform)?.maxLength} chars
        </span>
        <div className="flex items-center gap-2">
          {post.status === 'scheduled' && post.scheduled_at && (
            <span className="text-xs text-warning flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatScheduledDate(post.scheduled_at)}
            </span>
          )}
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
      </div>
    </Card>
  );
}
