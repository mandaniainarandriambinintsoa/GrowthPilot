import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Project, ScrapedData, GeneratedPost } from '../types';
import { scrapeWithProxy } from '../services/scraperService';
import { generateAllPosts, generatePostForPlatform } from '../services/contentService';
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
  addProject: (url: string, name?: string) => Promise<void>;
  selectProject: (id: string) => void;
  regeneratePost: (postId: string) => Promise<void>;
  updatePost: (postId: string, content: string) => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tone, setTone] = useState<'professional' | 'casual' | 'viral'>('casual');

  const addProject = useCallback(async (url: string, name?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Scrape the website
      const scrapedData: ScrapedData = await scrapeWithProxy(url);

      const project: Project = {
        id: crypto.randomUUID(),
        user_id: 'local',
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
      const generatedPosts = await generateAllPosts(project.id, scrapedData, tone);
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
  }, [tone]);

  const selectProject = useCallback(
    async (id: string) => {
      const project = projects.find((p) => p.id === id) || null;
      setCurrentProject(project);
      if (project?.scraped_data) {
        setIsGenerating(true);
        try {
          const generatedPosts = await generateAllPosts(project.id, project.scraped_data, tone);
          setPosts(generatedPosts);
        } finally {
          setIsGenerating(false);
        }
      }
    },
    [projects, tone]
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
          tone
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
    [currentProject, posts, tone]
  );

  const updatePost = useCallback((postId: string, content: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content } : p))
    );
    // Persist to DB
    db.updatePostContent(postId, content).catch(console.warn);
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
        addProject,
        selectProject,
        regeneratePost,
        updatePost,
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
