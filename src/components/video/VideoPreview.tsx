import { forwardRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { PromoVideo } from './PromoVideo';

interface VideoPreviewProps {
  title: string;
  description: string;
  features: string[];
  logo?: string;
  platform: 'tiktok' | 'youtube';
  className?: string;
  playerRef?: React.RefObject<PlayerRef | null>;
}

const DIMENSIONS = {
  tiktok: { width: 1080, height: 1920 },
  youtube: { width: 1920, height: 1080 },
};

export const VideoPreview = forwardRef<HTMLDivElement, VideoPreviewProps>(
  function VideoPreview(
    { title, description, features, logo, platform, className = '', playerRef },
    ref
  ) {
    const { width, height } = DIMENSIONS[platform];

    return (
      <div className={className} ref={ref}>
        <Player
          ref={playerRef}
          component={PromoVideo}
          inputProps={{
            title,
            description,
            features,
            logo,
            platform,
          }}
          durationInFrames={150}
          fps={30}
          compositionWidth={width}
          compositionHeight={height}
          controls
          autoPlay={false}
          style={{
            width: platform === 'tiktok' ? 200 : '100%',
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.05)',
            background: '#0f172a',
          }}
        />
      </div>
    );
  }
);
