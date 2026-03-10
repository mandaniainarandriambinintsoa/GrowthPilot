export interface Project {
  id: string;
  user_id: string;
  name: string;
  url: string;
  description?: string;
  logo_url?: string;
  scraped_data?: ScrapedData;
  created_at: string;
  updated_at: string;
}

export interface ScrapedData {
  title: string;
  description: string;
  keywords: string[];
  features: string[];
  pricing?: string;
  screenshots: string[];
  colors: string[];
  logo?: string;
  content_blocks: ContentBlock[];
}

export interface ContentBlock {
  type: 'hero' | 'feature' | 'testimonial' | 'pricing' | 'cta' | 'faq';
  title?: string;
  text: string;
  image?: string;
}

export type Platform =
  | 'twitter'
  | 'linkedin'
  | 'reddit'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube';

export interface GeneratedPost {
  id: string;
  project_id: string;
  platform: Platform;
  content: string;
  media_url?: string;
  video_url?: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_at?: string;
  published_at?: string;
  created_at: string;
}

export interface PlatformConfig {
  id: Platform;
  name: string;
  icon: string;
  color: string;
  maxLength: number;
  mediaType: 'image' | 'video' | 'both';
  description: string;
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  duration: number; // seconds
  type: 'product-demo' | 'feature-highlight' | 'testimonial' | 'launch';
}
