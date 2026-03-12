import { neon } from '@neondatabase/serverless';

export const config = { runtime: 'edge' };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req: Request) {
  const sql = neon(process.env.NEON_CONNECTION_STRING!);
  const url = new URL(req.url);

  try {
    if (req.method === 'GET') {
      const action = url.searchParams.get('action');

      if (action === 'stats') {
        const userId = url.searchParams.get('userId');
        if (!userId) return json({ error: 'userId required' }, 400);
        const rows = await sql`
          SELECT p.platform, p.status, COUNT(*)::int as count
          FROM posts p
          JOIN projects pr ON pr.id = p.project_id
          WHERE pr.user_id = ${userId}
          GROUP BY p.platform, p.status
        `;
        return json({ stats: rows });
      }

      if (action === 'all') {
        const userId = url.searchParams.get('userId');
        if (!userId) return json({ error: 'userId required' }, 400);
        const rows = await sql`
          SELECT p.*, pr.name AS project_name
          FROM posts p
          JOIN projects pr ON p.project_id = pr.id
          WHERE pr.user_id = ${userId}
          ORDER BY p.created_at DESC
        `;
        return json({ posts: rows });
      }

      const projectId = url.searchParams.get('projectId');
      if (!projectId) return json({ error: 'projectId required' }, 400);
      const rows = await sql`SELECT * FROM posts WHERE project_id = ${projectId} ORDER BY created_at DESC`;
      return json({ posts: rows });
    }

    if (req.method === 'POST') {
      const { posts } = await req.json();
      for (const post of posts) {
        await sql`INSERT INTO posts (id, project_id, platform, content, media_url, video_url, status)
          VALUES (${post.id}, ${post.project_id}, ${post.platform}, ${post.content}, ${post.media_url || null}, ${post.video_url || null}, ${post.status})`;
      }
      return json({ success: true });
    }

    if (req.method === 'PATCH') {
      const body = await req.json();
      const { id, content, status, scheduledAt } = body;
      if (!id) return json({ error: 'id required' }, 400);

      if (scheduledAt) {
        await sql`UPDATE posts SET status = 'scheduled', scheduled_at = ${scheduledAt} WHERE id = ${id}`;
      } else if (content !== undefined) {
        await sql`UPDATE posts SET content = ${content} WHERE id = ${id}`;
      } else if (status !== undefined) {
        await sql`UPDATE posts SET status = ${status} WHERE id = ${id}`;
      }
      return json({ success: true });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: 'id required' }, 400);
      await sql`DELETE FROM posts WHERE id = ${id}`;
      return json({ success: true });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, 500);
  }
}
