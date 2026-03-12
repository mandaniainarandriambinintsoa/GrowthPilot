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
      const projectId = url.searchParams.get('projectId');
      if (!projectId) return json({ error: 'projectId required' }, 400);
      const rows = await sql`SELECT * FROM landing_pages WHERE project_id = ${projectId} ORDER BY created_at DESC`;
      return json({ pages: rows });
    }

    if (req.method === 'POST') {
      const page = await req.json();
      await sql`
        INSERT INTO landing_pages (id, project_id, title, slug, sections, published)
        VALUES (${page.id}, ${page.project_id}, ${page.title}, ${page.slug}, ${JSON.stringify(page.sections)}, ${page.published})
        ON CONFLICT (id) DO UPDATE SET
          title = ${page.title}, slug = ${page.slug},
          sections = ${JSON.stringify(page.sections)}, published = ${page.published},
          updated_at = NOW()
      `;
      return json({ success: true });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      const projectId = url.searchParams.get('projectId');
      if (!id || !projectId) return json({ error: 'id and projectId required' }, 400);
      await sql`DELETE FROM landing_pages WHERE id = ${id} AND project_id = ${projectId}`;
      return json({ success: true });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, 500);
  }
}
