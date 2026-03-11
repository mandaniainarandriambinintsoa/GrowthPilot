import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';

export interface PromoVideoProps {
  title: string;
  description: string;
  features: string[];
  logo?: string;
  colors?: string[];
  platform: 'tiktok' | 'youtube';
}

const COLORS = {
  bg: '#0f172a',
  primary: '#6366f1',
  accent: '#22d3ee',
  text: '#ffffff',
  textMuted: '#94a3b8',
};

export function PromoVideo({
  title,
  description,
  features,
  logo,
  colors,
  platform,
}: PromoVideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gradientStart = colors?.[0] || COLORS.primary;
  const gradientEnd = colors?.[1] || COLORS.accent;

  const isPortrait = platform === 'tiktok';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Sequence 1: Title with spring animation (0-45 frames) */}
      <Sequence from={0} durationInFrames={150}>
        <TitleSlide
          title={title}
          gradientStart={gradientStart}
          gradientEnd={gradientEnd}
          frame={frame}
          fps={fps}
          isPortrait={isPortrait}
        />
      </Sequence>

      {/* Sequence 2: Description + features (45-100 frames) */}
      <Sequence from={45} durationInFrames={105}>
        <FeaturesSlide
          description={description}
          features={features}
          frame={frame - 45}
          fps={fps}
          isPortrait={isPortrait}
        />
      </Sequence>

      {/* Sequence 3: CTA + logo (100-150 frames) */}
      <Sequence from={100} durationInFrames={50}>
        <CTASlide
          logo={logo}
          gradientStart={gradientStart}
          gradientEnd={gradientEnd}
          frame={frame - 100}
          fps={fps}
          isPortrait={isPortrait}
        />
      </Sequence>
    </AbsoluteFill>
  );
}

function TitleSlide({
  title,
  gradientStart,
  gradientEnd,
  frame,
  fps,
  isPortrait,
}: {
  title: string;
  gradientStart: string;
  gradientEnd: string;
  frame: number;
  fps: number;
  isPortrait: boolean;
}) {
  const slideUp = spring({ frame, fps, config: { damping: 12, mass: 0.5 } });
  const translateY = interpolate(slideUp, [0, 1], [200, 0]);

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Fade out after frame 35
  const fadeOut = interpolate(frame, [35, 45], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeOut,
      }}
    >
      {/* Gradient background orb */}
      <div
        style={{
          position: 'absolute',
          width: isPortrait ? 600 : 800,
          height: isPortrait ? 600 : 800,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${gradientStart}40, ${gradientEnd}10, transparent)`,
          filter: 'blur(80px)',
        }}
      />

      <div
        style={{
          transform: `translateY(${translateY}px)`,
          opacity,
          textAlign: 'center',
          padding: isPortrait ? '0 60px' : '0 120px',
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontSize: isPortrait ? 72 : 80,
            fontWeight: 800,
            color: COLORS.text,
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h1>

        {/* Accent underline */}
        <div
          style={{
            width: interpolate(slideUp, [0, 1], [0, 200]),
            height: 4,
            background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})`,
            margin: '30px auto 0',
            borderRadius: 2,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

function FeaturesSlide({
  description,
  features,
  frame,
  fps,
  isPortrait,
}: {
  description: string;
  features: string[];
  frame: number;
  fps: number;
  isPortrait: boolean;
}) {
  const descOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Fade out near the end of this sequence
  const fadeOut = interpolate(frame, [45, 55], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: isPortrait ? 'center' : 'flex-start',
        padding: isPortrait ? '0 80px' : '0 160px',
        opacity: fadeOut,
      }}
    >
      {/* Description */}
      <p
        style={{
          fontSize: isPortrait ? 36 : 32,
          color: COLORS.textMuted,
          opacity: descOpacity,
          lineHeight: 1.5,
          margin: 0,
          marginBottom: 40,
          maxWidth: isPortrait ? '100%' : 800,
          textAlign: isPortrait ? 'center' : 'left',
        }}
      >
        {description}
      </p>

      {/* Features list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          width: '100%',
          maxWidth: isPortrait ? '100%' : 700,
        }}
      >
        {features.slice(0, 4).map((feature, i) => {
          const delay = 10 + i * 8;
          const featureSpring = spring({
            frame: frame - delay,
            fps,
            config: { damping: 12, mass: 0.4 },
          });
          const featureOpacity = interpolate(
            frame,
            [delay, delay + 10],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          const translateX = interpolate(featureSpring, [0, 1], [60, 0]);

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: featureOpacity,
                transform: `translateX(${translateX}px)`,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: isPortrait ? 32 : 28,
                  color: COLORS.text,
                  fontWeight: 500,
                }}
              >
                {feature}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function CTASlide({
  logo,
  gradientStart,
  gradientEnd,
  frame,
  fps,
  isPortrait,
}: {
  logo?: string;
  gradientStart: string;
  gradientEnd: string;
  frame: number;
  fps: number;
  isPortrait: boolean;
}) {
  const scaleSpring = spring({
    frame,
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 100 },
  });
  const scale = interpolate(scaleSpring, [0, 1], [0.8, 1]);

  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Subtle pulsing scale on the CTA
  const pulse = interpolate(frame, [20, 30, 40, 50], [1, 1.03, 1, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: isPortrait ? 500 : 700,
          height: isPortrait ? 500 : 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${gradientStart}30, transparent)`,
          filter: 'blur(100px)',
        }}
      />

      <div
        style={{
          transform: `scale(${scale * pulse})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
          zIndex: 1,
        }}
      >
        {/* Logo */}
        {logo && (
          <img
            src={logo}
            alt="Logo"
            style={{
              width: isPortrait ? 100 : 80,
              height: isPortrait ? 100 : 80,
              borderRadius: 20,
              objectFit: 'contain',
            }}
          />
        )}

        {/* CTA Button */}
        <div
          style={{
            background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
            padding: isPortrait ? '28px 64px' : '24px 56px',
            borderRadius: 20,
            boxShadow: `0 20px 60px ${gradientStart}50`,
          }}
        >
          <span
            style={{
              fontSize: isPortrait ? 44 : 40,
              fontWeight: 700,
              color: COLORS.text,
              letterSpacing: '-0.01em',
            }}
          >
            Try it free!
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: isPortrait ? 24 : 20,
            color: COLORS.textMuted,
            margin: 0,
          }}
        >
          No credit card required
        </p>
      </div>
    </AbsoluteFill>
  );
}
