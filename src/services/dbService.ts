import { sql } from '../lib/neon';
import type { Project, GeneratedPost } from '../types';

// ============= PROJECTS =============

export async function saveProject(project: Project): Promise<void> {
  await sql`INSERT INTO projects (id, user_id, name, url, description, logo_url, scraped_data)
    VALUES (${project.id}, ${project.user_id}, ${project.name}, ${project.url}, ${project.description || null}, ${project.logo_url || null}, ${JSON.stringify(project.scraped_data) || null})`;
}

export async function getProjects(userId: string): Promise<Project[]> {
  const rows = await sql`SELECT * FROM projects WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return rows as unknown as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const rows = await sql`SELECT * FROM projects WHERE id = ${id} LIMIT 1`;
  return (rows[0] as unknown as Project) || null;
}

export async function deleteProject(id: string): Promise<void> {
  await sql`DELETE FROM projects WHERE id = ${id}`;
}

// ============= POSTS =============

export async function savePosts(posts: GeneratedPost[]): Promise<void> {
  for (const post of posts) {
    await sql`INSERT INTO posts (id, project_id, platform, content, media_url, video_url, status)
      VALUES (${post.id}, ${post.project_id}, ${post.platform}, ${post.content}, ${post.media_url || null}, ${post.video_url || null}, ${post.status})`;
  }
}

export async function getPostsByProject(projectId: string): Promise<GeneratedPost[]> {
  const rows = await sql`SELECT * FROM posts WHERE project_id = ${projectId} ORDER BY created_at DESC`;
  return rows as unknown as GeneratedPost[];
}

export async function updatePostContent(id: string, content: string): Promise<void> {
  await sql`UPDATE posts SET content = ${content} WHERE id = ${id}`;
}

export async function updatePostStatus(id: string, status: string): Promise<void> {
  await sql`UPDATE posts SET status = ${status} WHERE id = ${id}`;
}

export async function deletePost(id: string): Promise<void> {
  await sql`DELETE FROM posts WHERE id = ${id}`;
}
