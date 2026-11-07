import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const apiRequire = createRequire(resolve(scriptDir, '../../api/package.json'));
apiRequire('dotenv').config({ path: resolve(scriptDir, '../../.env'), quiet: true });

const baseUrl = (
  process.env.API_BASE_URL ||
  `http://localhost:${process.env.API_PORT || '3001'}`
).replace(/\/+$/, '');
let failed = false;

async function check(path, required) {
  const startedAt = performance.now();
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      signal: AbortSignal.timeout(5000),
    });
    const elapsedMs = Math.round(performance.now() - startedAt);
    if (response.status === 404 && !required) {
      console.log(`SKIP ${path}: route not found (HTTP 404, ${elapsedMs} ms)`);
      return;
    }
    const passed = response.ok;
    console.log(
      `${passed ? 'PASS' : 'FAIL'} ${path}: HTTP ${response.status} (${elapsedMs} ms)`,
    );
    if (!passed) {
      failed = true;
    }
  } catch (error) {
    const code = typeof error?.cause?.code === 'string' ? ` [${error.cause.code}]` : '';
    console.error(`FAIL ${path}: API request failed${code}. Check API_BASE_URL and that the API is running.`);
    failed = true;
  }
}

await check('/health', true);
await check('/api/docs', false);
process.exitCode = failed ? 1 : 0;
