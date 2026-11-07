import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const apiRequire = createRequire(resolve(scriptDir, '../../api/package.json'));
apiRequire('dotenv').config({ path: resolve(scriptDir, '../../.env'), quiet: true });
const { PrismaClient } = apiRequire('@prisma/client');
const prisma = new PrismaClient();

class RollbackProbe extends Error {}

function diagnose(error) {
  const code = typeof error?.code === 'string' ? error.code : '';
  const message =
    typeof error?.message === 'string' ? error.message.toLowerCase() : '';

  if (message.includes('database_url is not configured')) {
    return 'DATABASE_URL is not configured. Set it in the root .env file or process environment.';
  }
  if (code === 'P1000' || code === '28P01' || message.includes('password authentication failed')) {
    return 'Authentication failed. Check the database username and password.';
  }
  if (code === 'P1003' || code === '3D000' || message.includes('database') && message.includes('does not exist')) {
    return 'Database does not exist. Check the database name and create it on the server.';
  }
  if (code === 'P1011' || message.includes('ssl') || message.includes('tls')) {
    return 'SSL error. Check the server SSL policy and the SSL options in DATABASE_URL.';
  }
  if (code === 'ECONNREFUSED' || message.includes('econnrefused')) {
    return 'ECONNREFUSED. Check that PostgreSQL is running, listening on the configured port, and allowed by the firewall.';
  }
  if (
    code === 'ETIMEDOUT' ||
    code === 'P1001' ||
    message.includes('timed out') ||
    message.includes("can't reach database server")
  ) {
    return 'Database unreachable (Prisma P1001 / ETIMEDOUT). Check VPN, SSH tunnel, routing, firewall rules, and the database port.';
  }
  if (code === 'ENOTFOUND' || message.includes('enotfound')) {
    return 'ENOTFOUND. Check the database hostname and DNS/VPN configuration.';
  }
  return 'Unexpected database error. Check DATABASE_URL and the PostgreSQL server logs.';
}

let failed = false;
let elapsedMs = 0;
try {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const startedAt = performance.now();
  const [timeRows, databaseRows] = await Promise.all([
    prisma.$queryRaw`SELECT NOW() AS current_time`,
    prisma.$queryRaw`SELECT current_database() AS database_name`,
  ]);
  elapsedMs = Math.round(performance.now() - startedAt);
  console.log(`PASS PostgreSQL queries (${elapsedMs} ms)`);
  console.log(`Database time: ${timeRows[0].current_time.toISOString()}`);
  console.log(`Current database: ${databaseRows[0].database_name}`);

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`
        CREATE TEMPORARY TABLE connection_test (
          id INTEGER PRIMARY KEY,
          value TEXT NOT NULL
        ) ON COMMIT DROP
      `;
      await transaction.$executeRaw`
        INSERT INTO connection_test (id, value) VALUES (1, 'connection-check')
      `;
      const rows = await transaction.$queryRaw`
        SELECT value FROM connection_test WHERE id = 1
      `;
      if (rows.length !== 1 || rows[0].value !== 'connection-check') {
        throw new Error('Temporary table read did not return the written row.');
      }
      const deleted = await transaction.$executeRaw`
        DELETE FROM connection_test WHERE id = 1
      `;
      if (deleted !== 1) {
        throw new Error('Temporary table row was not deleted.');
      }
      throw new RollbackProbe();
    });
  } catch (error) {
    if (!(error instanceof RollbackProbe)) {
      throw error;
    }
  }
  console.log('PASS Temporary table write/read/delete (transaction rolled back)');

  const tables = await prisma.$queryRaw`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  console.log(`Public tables (${tables.length}): ${tables.map((row) => row.tablename).join(', ') || '(none)'}`);
} catch (error) {
  failed = true;
  const code = typeof error?.code === 'string' ? ` [${error.code}]` : '';
  console.error(`FAIL Database connection${code}: ${diagnose(error)}`);
} finally {
  await prisma.$disconnect();
}

process.exitCode = failed ? 1 : 0;
