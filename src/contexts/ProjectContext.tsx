import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Project, ScrapedData, GeneratedPost } from '../types';
import { scrapeWithProxy } from '../services/scraperService';
import { generateAllPosts, generatePostForPlatform } from '../services/contentService';
import { useAuth } from './AuthContext';
import * as db from '../services/dbService';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  posts: GeneratedPost[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  tone: 'professional' | 'casual' | 'viral';
  setTone: (tone: 'professional' | 'casual' | 'viral') => void;
  language: string;
  setLanguage: (language: string) => void;
  variants: Record<string, string[]>;
  addProject: (url: string, name?: string) => Promise<void>;
  selectProject: (id: string) => void;
  regeneratePost: (postId: string) => Promise<void>;
  regenerateAll: () => Promise<void>;
  updatePost: (postId: string, content: string) => void;
  schedulePost: (postId: string, scheduledAt: string) => Promise<void>;
  generateVariant: (postId: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tone, setTone] = useState<'professional' | 'casual' | 'viral'>('casual');
  const [language, setLanguage] = useState<string>('english');
  const [variants, setVariants] = useState<Record<string, string[]>>({});

  // Load projects from DB on mount
  useEffect(() => {
    if (!user) return;
    db.getProjects(user.id)
      .then(setProjects)
      .catch(console.warn);
  }, [user]);

  const addProject = useCallback(async (url: string, name?: string) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Scrape the website
      const scrapedData: ScrapedData = await scrapeWithProxy(url);

      const project: Project = {
        id: crypto.randomUUID(),
        user_id: user.id,
        name: name || scrapedData.title || new URL(url).hostname,
        url,
        description: scrapedData.description,
        scraped_data: scrapedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setProjects((prev) => [...prev, project]);
      setCurrentProject(project);
      setIsLoading(false);

      // Step 2: Generate posts with AI (async, shows generating state)
      setIsGenerating(true);
      const generatedPosts = await generateAllPosts(project.id, scrapedData, tone, language);
      setPosts(generatedPosts);

      // Step 3: Persist to Neon (fire and forget)
      db.saveProject(project).catch(console.warn);
      db.savePosts(generatedPosts).catch(console.warn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process website');
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  }, [user, tone, language]);

  const selectProject = useCallback(
    async (id: string) => {
      const project = projects.find((p) => p.id === id) || null;
      setCurrentProject(project);
      if (project) {
        // Try loading existing posts from DB first
        try {
          const existingPosts = await db.getPostsByProject(project.id);
          if (existingPosts.length > 0) {
            setPosts(existingPosts);
            return;
          }
        } catch { /* fallback to regenerate */ }

        // Regenerate if no saved posts
        if (project.scraped_data) {
          setIsGenerating(true);
          try {
            const generatedPosts = await generateAllPosts(project.id, project.scraped_data, tone, language);
            setPosts(generatedPosts);
          } finally {
            setIsGenerating(false);
          }
        }
      }
    },
    [projects, tone, language]
  );

  const regeneratePost = useCallback(
    async (postId: string) => {
      if (!currentProject?.scraped_data) return;
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      setIsGenerating(true);
      try {
        const newPost = await generatePostForPlatform(
          currentProject.id,
          post.platform,
          currentProject.scraped_data,
          tone,
          language
        );
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...newPost, id: postId } : p))
        );
        // Update in DB
        db.updatePostContent(postId, newPost.content).catch(console.warn);
      } finally {
        setIsGenerating(false);
      }
    },
    [currentProject, posts, tone, language]
  );

  const regenerateAll = useCallback(async () => {
    if (!currentProject?.scraped_data) return;
    setIsGenerating(true);
    try {
      const newPosts = await generateAllPosts(currentProject.id, currentProject.scraped_data, tone, language);
      setPosts(newPosts);
      // Persist to DB (replace old posts)
      db.savePosts(newPosts).catch(console.warn);
    } finally {
      setIsGenerating(false);
    }
  }, [currentProject, tone, language]);

  const updatePost = useCallback((postId: string, content: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content } : p))
    );
    // Persist to DB
    db.updatePostContent(postId, content).catch(console.warn);
  }, []);

  const generateVariant = useCallback(
    async (postId: string) => {
      if (!currentProject?.scraped_data) return;
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      setIsGenerating(true);
      try {
        const variantPost = await generatePostForPlatform(
          currentProject.id,
          post.platform,
          currentProject.scraped_data,
          tone,
          language
        );
        setVariants((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), variantPost.content],
        }));
      } finally {
        setIsGenerating(false);
      }
    },
    [currentProject, posts, tone, language]
  );

  const schedulePost = useCallback(async (postId: string, scheduledAt: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, status: 'scheduled' as const, scheduled_at: scheduledAt } : p
      )
    );
    // Persist to DB
    try {
      await db.schedulePost(postId, scheduledAt);
    } catch (err) {
      console.warn('Failed to schedule post:', err);
    }
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        posts,
        isLoading,
        isGenerating,
        error,
        tone,
        setTone,
        language,
        setLanguage,
        variants,
        addProject,
        selectProject,
        regeneratePost,
        regenerateAll,
        updatePost,
        schedulePost,
        generateVariant,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
