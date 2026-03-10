import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_NEON_CONNECTION_STRING || '';

export const sql = neon(connectionString);
