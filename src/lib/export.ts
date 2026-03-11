import type { GeneratedPost } from '../types';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportAsCSV(posts: GeneratedPost[]): void {
  const header = 'platform,content,status,created_at';
  const rows = posts.map((post) =>
    [
      escapeCSV(post.platform),
      escapeCSV(post.content),
      escapeCSV(post.status),
      escapeCSV(post.created_at),
    ].join(',')
  );
  const csv = [header, ...rows].join('\n');
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `growthpilot-posts-${timestamp}.csv`, 'text/csv;charset=utf-8;');
}

export function exportAsJSON(posts: GeneratedPost[]): void {
  const json = JSON.stringify(posts, null, 2);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadFile(json, `growthpilot-posts-${timestamp}.json`, 'application/json');
}
