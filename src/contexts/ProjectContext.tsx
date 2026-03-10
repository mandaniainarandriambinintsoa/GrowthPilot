import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Project, ScrapedData, GeneratedPost } from '../types';
import { scrapeWithProxy } from '../services/scraperService';
import { generateAllPosts } from '../services/contentService';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  posts: GeneratedPost[];
  isLoading: boolean;
  error: string | null;
  addProject: (url: string, name?: string) => Promise<void>;
  selectProject: (id: string) => void;
  regeneratePost: (postId: string) => void;
  updatePost: (postId: string, content: string) => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addProject = useCallback(async (url: string, name?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Scrape the website
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

      // Generate posts for all platforms
      const generatedPosts = generateAllPosts(project.id, scrapedData);
      setPosts(generatedPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape website');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectProject = useCallback(
    (id: string) => {
      const project = projects.find((p) => p.id === id) || null;
      setCurrentProject(project);
      if (project?.scraped_data) {
        const generatedPosts = generateAllPosts(project.id, project.scraped_data);
        setPosts(generatedPosts);
      }
    },
    [projects]
  );

  const regeneratePost = useCallback(
    (postId: string) => {
      if (!currentProject?.scraped_data) return;
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const newPosts = generateAllPosts(currentProject.id, currentProject.scraped_data!);
          const replacement = newPosts.find((np) => np.platform === p.platform);
          return replacement || p;
        })
      );
    },
    [currentProject]
  );

  const updatePost = useCallback((postId: string, content: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content } : p))
    );
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        posts,
        isLoading,
        error,
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
