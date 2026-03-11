import React from 'react';
import { Composition } from 'remotion';
import { PromoVideo } from '../components/video/PromoVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PromoVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={PromoVideo as any}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'Your Product',
          description: 'The best solution for your needs',
          features: ['Fast', 'Secure', 'Simple'],
          platform: 'youtube',
        }}
      />
      <Composition
        id="PromoVideoVertical"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={PromoVideo as any}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Your Product',
          description: 'The best solution for your needs',
          features: ['Fast', 'Secure', 'Simple'],
          platform: 'tiktok',
        }}
      />
    </>
  );
};
