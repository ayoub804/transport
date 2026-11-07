import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '../..');
const apiRequire = createRequire(resolve(rootDir, 'api/package.json'));
apiRequire('dotenv').config({ path: resolve(rootDir, '.env'), quiet: true });

const steps = [
  {
    name: 'Network',
    run: () => {
      const shell = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
      return spawnSync(
        shell,
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          resolve(scriptDir, 'test-network.ps1'),
        ],
        { cwd: rootDir, encoding: 'utf8' },
      );
    },
  },
  ...[
    { name: 'Database', script: 'test-db.js' },
    { name: 'Redis', script: 'test-redis.js' },
    { name: 'API', script: 'test-api.js' },
  ].map(({ name, script }) => ({
    name,
    run: () =>
      spawnSync(process.execPath, [resolve(scriptDir, script)], {
        cwd: rootDir,
        encoding: 'utf8',
      }),
  })),
];

const results = [];
for (const step of steps) {
  console.log(`\n=== ${step.name} connection test ===`);
  const result = step.run();
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  const passed = result.status === 0;
  results.push({ test: step.name, result: passed ? 'PASS' : 'FAIL' });
  if (!passed) {
    for (const remaining of steps.slice(results.length)) {
      results.push({ test: remaining.name, result: 'SKIPPED' });
    }
    break;
  }
}

console.log('\n=== Connection test summary ===');
console.table(results);
process.exitCode = results.some((result) => result.result === 'FAIL') ? 1 : 0;
