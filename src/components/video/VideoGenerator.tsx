import { useState, useRef } from 'react';
import { Film, Play, Download, Image, Loader2, Check } from 'lucide-react';
import { type PlayerRef } from '@remotion/player';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { VideoPreview } from './VideoPreview';
import { exportVideoFromPlayer, downloadCanvasAsImage } from '../../lib/videoExport';
import type { ScrapedData } from '../../types';

interface VideoGeneratorProps {
  data: ScrapedData;
  platform: 'tiktok' | 'youtube';
}

const PLATFORM_INFO = {
  tiktok: { label: 'TikTok', ratio: '9:16', badge: 'bg-pink-500/20 text-pink-400', width: 1080, height: 1920 },
  youtube: { label: 'YouTube', ratio: '16:9', badge: 'bg-red-500/20 text-red-400', width: 1920, height: 1080 },
};

export function VideoGenerator({ data, platform }: VideoGeneratorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);

  const info = PLATFORM_INFO[platform];
  const filename = `${data.title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 40)}-${platform}`;

  const handleExportVideo = async () => {
    if (!containerRef.current || !showPreview) {
      // Need to show preview first
      setShowPreview(true);
      return;
    }

    setIsExporting(true);
    setExported(false);

    try {
      // Play the video from the start
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      }

      await exportVideoFromPlayer(containerRef.current, {
        duration: 5,
        fps: 30,
        width: info.width,
        height: info.height,
        filename,
      });
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
      // Fallback: try screenshot
      if (containerRef.current) {
        downloadCanvasAsImage(containerRef.current, filename);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleScreenshot = () => {
    if (!containerRef.current) return;
    downloadCanvasAsImage(containerRef.current, `${filename}-thumb`);
  };

  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Generate Video</h3>
            <p className="text-slate-400 text-xs">
              Create a promo video for {info.label}
            </p>
          </div>
        </div>

        {/* Platform badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${info.badge}`}
        >
          {info.label} {info.ratio}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowPreview((prev) => !prev)}
        >
          <Play className="w-4 h-4" />
          {showPreview ? 'Hide' : 'Preview'}
        </Button>

        <Button
          variant={exported ? 'primary' : 'ghost'}
          size="sm"
          onClick={handleExportVideo}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : exported ? (
            <Check className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isExporting ? 'Recording...' : exported ? 'Downloaded!' : 'Export WebM'}
        </Button>

        {showPreview && (
          <Button variant="ghost" size="sm" onClick={handleScreenshot}>
            <Image className="w-4 h-4" />
            Thumbnail
          </Button>
        )}
      </div>

      {/* Video preview */}
      {showPreview && (
        <div className="pt-2">
          <VideoPreview
            ref={containerRef}
            playerRef={playerRef}
            title={data.title}
            description={data.description}
            features={data.features}
            logo={data.logo}
            platform={platform}
          />
        </div>
      )}
    </Card>
  );
}
