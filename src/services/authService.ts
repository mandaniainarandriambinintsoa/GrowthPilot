import { sql } from '../lib/neon';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

interface SessionRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

// PBKDF2 hash with salt (browser-native, much stronger than SHA-256)
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

// Legacy SHA-256 hash for backward compatibility with existing accounts
async function legacyHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<{ user: AuthUser; token: string }> {
  // Check if email already exists
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();

  await sql`INSERT INTO users (id, email, name, password_hash)
    VALUES (${userId}, ${email}, ${name || null}, ${passwordHash})`;

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  await sql`INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})`;

  return {
    user: { id: userId, email, name: name || null, avatar_url: null },
    token,
  };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  // Fetch user with password hash to check both PBKDF2 and legacy SHA-256
  const userRows = await sql`SELECT id, email, name, avatar_url, password_hash FROM users WHERE email = ${email}`;
  if (userRows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const row = userRows[0] as unknown as AuthUser & { password_hash: string };
  let matched = false;

  if (row.password_hash.includes(':')) {
    // PBKDF2 format: salt:hash
    const [salt] = row.password_hash.split(':');
    const computed = await hashPassword(password, salt);
    matched = computed === row.password_hash;
  } else {
    // Legacy SHA-256
    const legacy = await legacyHash(password);
    matched = legacy === row.password_hash;

    // Migrate to PBKDF2 on successful legacy login
    if (matched) {
      const newHash = await hashPassword(password);
      sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${row.id}`.catch(console.warn);
    }
  }

  if (!matched) {
    throw new Error('Invalid email or password');
  }

  const user: AuthUser = { id: row.id, email: row.email, name: row.name, avatar_url: row.avatar_url };
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await sql`INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${user.id}, ${token}, ${expiresAt})`;

  return { user, token };
}

export async function getSession(token: string): Promise<AuthUser | null> {
  const rows = await sql`
    SELECT s.id, s.user_id, s.token, s.expires_at, u.email, u.name, u.avatar_url
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > NOW()
  `;

  if (rows.length === 0) return null;

  const row = rows[0] as unknown as SessionRow;
  return {
    id: row.user_id,
    email: row.email,
    name: row.name,
    avatar_url: row.avatar_url,
  };
}

export async function logout(token: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}
