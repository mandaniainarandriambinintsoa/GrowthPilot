import type { PlatformConfig } from '../types';

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'twitter',
    name: 'X / Twitter',
    icon: '𝕏',
    color: '#000000',
    maxLength: 280,
    mediaType: 'both',
    description: 'Short viral threads, hot takes, product launches',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'in',
    color: '#0A66C2',
    maxLength: 3000,
    mediaType: 'both',
    description: 'Professional storytelling, founder journey, case studies',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: 'R',
    color: '#FF4500',
    maxLength: 10000,
    mediaType: 'both',
    description: 'Value-first posts in relevant subreddits',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'f',
    color: '#1877F2',
    maxLength: 5000,
    mediaType: 'both',
    description: 'Community engagement, groups, storytelling',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: '#E4405F',
    maxLength: 2200,
    mediaType: 'both',
    description: 'Visual carousels, reels, product showcases',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '♪',
    color: '#000000',
    maxLength: 2200,
    mediaType: 'video',
    description: 'Short-form video, trends, product demos',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶',
    color: '#FF0000',
    maxLength: 5000,
    mediaType: 'video',
    description: 'Long-form tutorials, product walkthroughs, launch videos',
  },
];

export const getPlatform = (id: string) => PLATFORMS.find((p) => p.id === id);
