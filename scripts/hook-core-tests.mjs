#!/usr/bin/env node
// grimoire-compiler-schema-test: Stop-hook runner for the packages/core suite.
//
// Kiro runs this after every agent turn (.kiro/hooks/compiler-schema-test.json).
// It uses the Stop trigger because Kiro Web cloud sessions do not run file-save
// hooks. To keep turns fast it only runs when packages/core has uncommitted
// changes:
//
//   - no packages/core/package.json      -> exit 0, silent (before Spec 01)
//   - no uncommitted change in core      -> exit 0, silent
//   - core dependencies not installed    -> exit 1, install hint on stderr
//   - otherwise run `vitest run` via pnpm -> exit 0 silent when green,
//                                           exit 1 with the output tail when red
//
// Usage: node scripts/hook-core-tests.mjs [--root <dir>]
// GRIMOIRE_HOOK_DRY_RUN=1 prints the command instead of running it (tests).

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PREFIX = '[CORE TESTS]';
const COMMAND = 'pnpm --filter @grimoire-crew/core test:hook';
const TAIL_LINES = 60;
const RUN_TIMEOUT_MS = 170_000; // stays under the hook's 180 s timeout

function parseRoot(argv) {
  const index = argv.indexOf('--root');
  if (index !== -1 && argv[index + 1]) return resolve(argv[index + 1]);
  return process.cwd();
}

function coreHasUncommittedChanges(root) {
  const result = spawnSync('git', ['status', '--porcelain', '--untracked-files=all', '--', 'packages/core'], {
    cwd: root,
    encoding: 'utf8',
  });
  // If git cannot answer (no repo, git missing), run the suite rather than skip it.
  if (result.error || result.status !== 0) return true;
  return result.stdout
    .split('\n')
    .some((line) => line.trim() !== '' && !/(^|\/)node_modules\//.test(line));
}

function tail(text, lines) {
  const all = text.replace(/\r\n/g, '\n').trimEnd().split('\n');
  return all.slice(-lines).join('\n');
}

function main() {
  const root = parseRoot(process.argv.slice(2));
  const core = join(root, 'packages', 'core');
  if (!existsSync(join(core, 'package.json'))) return 0;
  if (!coreHasUncommittedChanges(root)) return 0;
  if (!existsSync(join(core, 'node_modules'))) {
    process.stderr.write(`${PREFIX} packages/core dependencies are missing: run pnpm install --frozen-lockfile first.\n`);
    return 1;
  }
  if (process.env.GRIMOIRE_HOOK_DRY_RUN === '1') {
    process.stdout.write(`${COMMAND}\n`);
    return 0;
  }

  // Constant command string, no user input: shell: true lets Windows resolve pnpm.cmd.
  const result = spawnSync(COMMAND, {
    cwd: root,
    shell: true,
    encoding: 'utf8',
    timeout: RUN_TIMEOUT_MS,
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, CI: '1', FORCE_COLOR: '0' },
  });
  if (result.error) {
    const reason = result.error.code === 'ETIMEDOUT' ? 'timed out' : 'could not start';
    process.stderr.write(`${PREFIX} "${COMMAND}" ${reason}.\n`);
    return 1;
  }
  if (result.status === 0) return 0;
  process.stderr.write(
    `${PREFIX} packages/core tests failed (exit ${result.status}). Last ${TAIL_LINES} lines:\n` +
      `${tail(`${result.stdout ?? ''}\n${result.stderr ?? ''}`, TAIL_LINES)}\n`,
  );
  return 1;
}

process.exitCode = main();
