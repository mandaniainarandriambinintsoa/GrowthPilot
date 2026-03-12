import type { Project, GeneratedPost } from '../types';

// ============= PROJECTS =============

export async function saveProject(project: Project): Promise<void> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to save project');
  }
}

export async function getProjects(userId: string): Promise<Project[]> {
  const res = await fetch(`/api/projects?userId=${encodeURIComponent(userId)}`);
  const data = await res.json();
  return data.projects || [];
}

export async function getProject(id: string): Promise<Project | null> {
  const res = await fetch(`/api/projects?userId=_&id=${encodeURIComponent(id)}`);
  const data = await res.json();
  return data.project || null;
}

export async function deleteProject(id: string): Promise<void> {
  await fetch(`/api/projects?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ============= POSTS =============

export async function savePosts(posts: GeneratedPost[]): Promise<void> {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ posts }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to save posts');
  }
}

export async function getPostsByProject(projectId: string): Promise<GeneratedPost[]> {
  const res = await fetch(`/api/posts?projectId=${encodeURIComponent(projectId)}`);
  const data = await res.json();
  return data.posts || [];
}

export async function updatePostContent(id: string, content: string): Promise<void> {
  await fetch('/api/posts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, content }),
  });
}

export async function updatePostStatus(id: string, status: string): Promise<void> {
  await fetch('/api/posts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
}

export async function schedulePost(id: string, scheduledAt: string): Promise<void> {
  await fetch('/api/posts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, scheduledAt }),
  });
}

export async function deletePost(id: string): Promise<void> {
  await fetch(`/api/posts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ============= ANALYTICS =============

export async function getPostStats(userId: string): Promise<{platform: string, status: string, count: number}[]> {
  const res = await fetch(`/api/posts?action=stats&userId=${encodeURIComponent(userId)}`);
  const data = await res.json();
  return data.stats || [];
}

export async function getAllPostsByUser(userId: string): Promise<(GeneratedPost & { project_name: string })[]> {
  const res = await fetch(`/api/posts?action=all&userId=${encodeURIComponent(userId)}`);
  const data = await res.json();
  return data.posts || [];
}
