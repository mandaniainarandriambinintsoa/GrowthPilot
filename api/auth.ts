import { neon } from '@neondatabase/serverless';

export const config = { runtime: 'edge' };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, existingSalt?: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = existingSalt
    ? Uint8Array.from(existingSalt.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );

  const saltHex = Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits), (b) => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

async function legacyHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const sql = neon(process.env.NEON_CONNECTION_STRING!);

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'register') {
      const { email, password, name } = body;
      const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existing.length > 0) {
        return json({ error: 'An account with this email already exists' }, 400);
      }

      const passwordHash = await hashPassword(password);
      const userId = crypto.randomUUID();

      await sql`INSERT INTO users (id, email, name, password_hash)
        VALUES (${userId}, ${email}, ${name || null}, ${passwordHash})`;

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await sql`INSERT INTO sessions (user_id, token, expires_at)
        VALUES (${userId}, ${token}, ${expiresAt})`;

      return json({
        user: { id: userId, email, name: name || null, avatar_url: null },
        token,
      });
    }

    if (action === 'login') {
      const { email, password } = body;
      const userRows = await sql`SELECT id, email, name, avatar_url, password_hash FROM users WHERE email = ${email}`;
      if (userRows.length === 0) {
        return json({ error: 'Invalid email or password' }, 401);
      }

      const row = userRows[0] as Record<string, string | null>;
      let matched = false;

      if (row.password_hash?.includes(':')) {
        const [salt] = row.password_hash.split(':');
        const computed = await hashPassword(password, salt);
        matched = computed === row.password_hash;
      } else {
        const legacy = await legacyHash(password);
        matched = legacy === row.password_hash;
        if (matched) {
          const newHash = await hashPassword(password);
          sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${row.id}`.catch(() => {});
        }
      }

      if (!matched) return json({ error: 'Invalid email or password' }, 401);

      const user = { id: row.id, email: row.email, name: row.name, avatar_url: row.avatar_url };
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await sql`INSERT INTO sessions (user_id, token, expires_at)
        VALUES (${user.id}, ${token}, ${expiresAt})`;

      return json({ user, token });
    }

    if (action === 'session') {
      const { token } = body;
      const rows = await sql`
        SELECT s.id, s.user_id, s.token, s.expires_at, u.email, u.name, u.avatar_url
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ${token} AND s.expires_at > NOW()
      `;

      if (rows.length === 0) return json({ user: null });

      const row = rows[0] as Record<string, string | null>;
      return json({
        user: {
          id: row.user_id,
          email: row.email,
          name: row.name,
          avatar_url: row.avatar_url,
        },
      });
    }

    if (action === 'logout') {
      const { token } = body;
      await sql`DELETE FROM sessions WHERE token = ${token}`;
      return json({ success: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, 500);
  }
}
