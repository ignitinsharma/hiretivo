import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
if (!/^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL ?? '')) throw new Error('Hosted authentication requires PostgreSQL DATABASE_URL.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  await pool.query(await readFile(new URL('../prisma/hosted/auth.sql', import.meta.url), 'utf8'));
  console.log('Hosted authentication tables are ready.');
} finally { await pool.end(); }
