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
      const userId = url.searchParams.get('userId');
      if (!userId) return json({ error: 'userId required' }, 400);

      const id = url.searchParams.get('id');
      if (id) {
        const rows = await sql`SELECT * FROM projects WHERE id = ${id} LIMIT 1`;
        return json({ project: rows[0] || null });
      }

      const rows = await sql`SELECT * FROM projects WHERE user_id = ${userId} ORDER BY created_at DESC`;
      return json({ projects: rows });
    }

    if (req.method === 'POST') {
      const project = await req.json();
      await sql`INSERT INTO projects (id, user_id, name, url, description, logo_url, scraped_data)
        VALUES (${project.id}, ${project.user_id}, ${project.name}, ${project.url}, ${project.description || null}, ${project.logo_url || null}, ${JSON.stringify(project.scraped_data) || null})`;
      return json({ success: true });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: 'id required' }, 400);
      await sql`DELETE FROM projects WHERE id = ${id}`;
      return json({ success: true });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, 500);
  }
}
