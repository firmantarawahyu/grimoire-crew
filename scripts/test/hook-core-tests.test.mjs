// Tests for scripts/hook-core-tests.mjs, the Stop-hook runner for the
// packages/core test suite. Run with: pnpm test:scripts
//
// GRIMOIRE_HOOK_DRY_RUN=1 makes the runner print the command it would run
// instead of running it, so these tests never invoke pnpm.
import { after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RUNNER = fileURLToPath(new URL('../hook-core-tests.mjs', import.meta.url));
const EXPECTED_COMMAND = 'pnpm --filter @grimoire-crew/core test:hook';
const CORE_PACKAGE = JSON.stringify({ name: '@grimoire-crew/core', private: true, scripts: { 'test:hook': 'vitest run' } });

const tempRoots = [];
after(() => {
  for (const root of tempRoots) rmSync(root, { recursive: true, force: true });
});

function git(root, ...args) {
  execFileSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.invalid', ...args], { cwd: root });
}

function makeRepo(files) {
  const root = mkdtempSync(join(tmpdir(), 'grimoire-hook-core-'));
  tempRoots.push(root);
  git(root, 'init', '-q');
  writeFiles(root, files);
  return root;
}

function writeFiles(root, files) {
  for (const [relPath, content] of Object.entries(files)) {
    const absPath = join(root, relPath);
    if (content === null) {
      mkdirSync(absPath, { recursive: true });
      continue;
    }
    mkdirSync(dirname(absPath), { recursive: true });
    writeFileSync(absPath, content);
  }
}

function commitAll(root) {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'init');
}

function runRunner(root, { dryRun = true, useCwd = false } = {}) {
  const env = { ...process.env };
  if (dryRun) env.GRIMOIRE_HOOK_DRY_RUN = '1';
  else delete env.GRIMOIRE_HOOK_DRY_RUN;
  const args = useCwd ? [RUNNER] : [RUNNER, '--root', root];
  return spawnSync(process.execPath, args, { cwd: useCwd ? root : undefined, env, encoding: 'utf8', timeout: 30_000 });
}

function assertSilentPass(result) {
  assert.equal(result.status, 0, `expected exit 0, got ${result.status}; stderr: ${result.stderr}`);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
}

describe('hook-core-tests skips silently', () => {
  test('no packages/core yet (Day 1 state)', () => {
    assertSilentPass(runRunner(makeRepo({ 'README.md': '# x\n' })));
  });

  test('packages/core exists but has no uncommitted changes', () => {
    const root = makeRepo({ 'packages/core/package.json': CORE_PACKAGE, 'packages/core/src/index.ts': 'export {};\n' });
    commitAll(root);
    assertSilentPass(runRunner(root));
  });

  test('only files outside packages/core changed', () => {
    const root = makeRepo({ 'packages/core/package.json': CORE_PACKAGE, 'README.md': '# x\n' });
    commitAll(root);
    writeFiles(root, { 'README.md': '# changed\n' });
    assertSilentPass(runRunner(root));
  });
});

describe('hook-core-tests runs the suite when packages/core changed', () => {
  test('untracked source file: dry run prints the constant command', () => {
    const root = makeRepo({ 'packages/core/package.json': CORE_PACKAGE, 'packages/core/node_modules': null });
    commitAll(root);
    writeFiles(root, { 'packages/core/src/schema.ts': 'export const x = 1;\n' });
    const result = runRunner(root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), EXPECTED_COMMAND);
  });

  test('modified tracked file in a nested folder, run from the repo root as cwd', () => {
    const root = makeRepo({
      'packages/core/package.json': CORE_PACKAGE,
      'packages/core/node_modules': null,
      'packages/core/src/compiler/emit.ts': 'export const a = 1;\n',
    });
    commitAll(root);
    writeFiles(root, { 'packages/core/src/compiler/emit.ts': 'export const a = 2;\n' });
    const result = runRunner(root, { useCwd: true });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), EXPECTED_COMMAND);
  });

  test('dependencies not installed: exit 1 with an install hint', () => {
    const root = makeRepo({ 'packages/core/package.json': CORE_PACKAGE });
    commitAll(root);
    writeFiles(root, { 'packages/core/src/schema.ts': 'export const x = 1;\n' });
    const result = runRunner(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /pnpm install --frozen-lockfile/);
    assert.equal(result.stdout, '');
  });
});
