import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const apiRequire = createRequire(resolve(scriptDir, '../../api/package.json'));
apiRequire('dotenv').config({ path: resolve(scriptDir, '../../.env'), quiet: true });
const Redis = apiRequire('ioredis');

if (!process.env.REDIS_URL) {
  console.log('SKIP Redis tests: REDIS_URL is not configured.');
  process.exit(0);
}

const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  connectTimeout: 2000,
  commandTimeout: 2500,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
  enableOfflineQueue: false,
});
const key = `connection-test:${process.pid}:${randomUUID()}`;
let failure;
redis.on('error', (error) => {
  if (!failure) {
    failure = error;
  }
});

try {
  await redis.connect();
  const ping = await redis.ping();
  if (ping !== 'PONG') {
    throw new Error('Redis PING returned an unexpected response.');
  }
  console.log('PASS Redis PING');

  await redis.set(key, 'ok', 'EX', 10);
  const value = await redis.get(key);
  if (value !== 'ok') {
    throw new Error('Redis GET did not return the written value.');
  }
  console.log('PASS Redis SET/GET with 10-second expiry');
} catch (error) {
  if (!failure) {
    failure = error;
  }
} finally {
  if (redis.status === 'ready') {
    try {
      const deleted = await redis.del(key);
      if (deleted !== 1 && !failure) {
        failure = new Error('Temporary Redis key was not deleted.');
      }
    } catch (error) {
      if (!failure) {
        failure = error;
      }
    }
  }
  redis.disconnect();
}

if (failure) {
  const pending = [failure];
  const visited = new Set();
  let code = '';
  while (pending.length > 0 && !code) {
    const error = pending.shift();
    if (!error || visited.has(error)) {
      continue;
    }
    visited.add(error);
    if (typeof error.code === 'string') {
      code = error.code;
    }
    if (Array.isArray(error.errors)) {
      pending.push(...error.errors);
    }
    if (error.cause) {
      pending.push(error.cause);
    }
  }
  const codeText = code ? ` [${code}]` : '';
  const diagnosis =
    code === 'ECONNREFUSED'
      ? 'Redis refused the connection. Check that Redis is running and reachable at REDIS_URL.'
      : code === 'ETIMEDOUT'
        ? 'Redis connection timed out. Check VPN, firewall, routing, and REDIS_URL.'
        : 'Check REDIS_URL, Redis availability, authentication, and network access.';
  console.error(`FAIL Redis connection${codeText}: ${diagnosis}`);
  process.exitCode = 1;
} else {
  console.log('PASS Redis temporary key deleted');
}
