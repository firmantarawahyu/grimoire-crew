// Tests for scripts/grimoire-ward-guard.mjs, the PreToolUse "env secret ward".
// Run with: pnpm test:scripts
//
// Each case pipes a Kiro hook event (JSON on STDIN) into the guard as a child
// process and checks the exit code: 2 = block the tool call, 0 = allow it.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const GUARD = fileURLToPath(new URL('../grimoire-ward-guard.mjs', import.meta.url));

function runGuard(stdin) {
  return spawnSync(process.execPath, [GUARD], {
    input: stdin,
    encoding: 'utf8',
    timeout: 10_000,
  });
}

function hookEvent(toolName, toolInput) {
  return JSON.stringify({
    hook_event_name: 'PreToolUse',
    cwd: '/workspace/grimoire-crew',
    session_id: 'test-session',
    tool_name: toolName,
    tool_input: toolInput,
  });
}

// [label, tool_name, tool_input]
const MUST_BLOCK = [
  // Rule A: real .env files
  ['read .env', 'read_file', { path: '.env' }],
  ['read nested .env.local', 'read_file', { path: 'apps/server/.env.local' }],
  ['read several files incl. .env', 'read_multiple_files', { paths: ['README.md', 'apps/web/.env'] }],
  ['bash cat .env', 'execute_bash', { command: 'cat .env' }],
  ['pwsh Get-Content .\\.env', 'execute_pwsh', { command: 'Get-Content .\\.env' }],
  ['node --env-file=.env', 'execute_bash', { command: 'node --env-file=.env x.js' }],
  ['MCP file .env.production', 'mcp_files_read_file', { file: '.env.production' }],
  ['glob .env*', 'file_search', { includePattern: '**/.env*' }],
  // Rule B: environment dumps
  ['bare printenv', 'execute_bash', { command: 'printenv' }],
  ['env piped to grep', 'execute_bash', { command: 'env | grep KEY' }],
  ['bare set', 'execute_bash', { command: 'set' }],
  ['export -p', 'execute_bash', { command: 'export -p' }],
  ['/proc/self/environ via shell', 'execute_bash', { command: 'cat /proc/self/environ' }],
  ['/proc/self/environ via read', 'read_file', { path: '/proc/self/environ' }],
  ['pwsh Get-ChildItem env:', 'execute_pwsh', { command: 'Get-ChildItem env:' }],
  ['pwsh gci env:', 'execute_pwsh', { command: 'gci env:' }],
  ['.NET GetEnvironmentVariables()', 'execute_pwsh', { command: '[Environment]::GetEnvironmentVariables()' }],
  ['printenv hidden in bash -c', 'execute_bash', { command: 'bash -c "printenv | sort"' }],
  // Rule B: secret-named variables
  ['printenv secret name', 'execute_bash', { command: 'printenv OPENROUTER_API_KEY' }],
  ['echo $SECRET', 'execute_bash', { command: 'echo $OPENROUTER_API_KEY' }],
  ['echo "${TOKEN}"', 'execute_bash', { command: 'echo "${GITHUB_TOKEN}"' }],
  ['pwsh $env:SECRET', 'execute_pwsh', { command: '$env:OPENROUTER_API_KEY' }],
  ['pwsh lower-case $env:secret', 'execute_pwsh', { command: 'Write-Output $env:openrouter_api_key' }],
  ['cmd %SECRET%', 'execute_pwsh', { command: 'cmd /c echo %GITHUB_TOKEN%' }],
];

const MUST_ALLOW = [
  ['read .env.example', 'read_file', { path: '.env.example' }],
  ['read .env.sample', 'read_file', { path: 'apps/server/.env.sample' }],
  ['read config.env.ts', 'read_file', { path: 'src/config.env.ts' }],
  ['process.env.FOO in a command', 'execute_bash', { command: 'node -e "console.log(process.env.FOO)"' }],
  ['grep query mentioning .env', 'grep_search', { query: '.env' }],
  ['env with assignment', 'execute_bash', { command: 'env NODE_ENV=test pnpm test' }],
  ['set with options', 'execute_bash', { command: 'set -euo pipefail' }],
  ['echo $HOME', 'execute_bash', { command: 'echo $HOME' }],
  ['lower-case shell loop variable', 'execute_bash', { command: 'for token in a b; do echo $token; done' }],
  ['commit message containing "set"', 'execute_bash', { command: 'git commit -m "set up ward"' }],
  ['pnpm test', 'execute_pwsh', { command: 'pnpm test' }],
  ['no tool_input', 'read_file', undefined],
];

describe('grimoire-ward-guard blocks (exit 2)', () => {
  for (const [label, toolName, toolInput] of MUST_BLOCK) {
    test(label, () => {
      const result = runGuard(hookEvent(toolName, toolInput));
      assert.equal(result.status, 2, `expected exit 2, got ${result.status}; stderr: ${result.stderr}`);
      assert.match(result.stderr, /\[WARD BLOCKED\]/);
      assert.match(result.stderr, /grimoire-env-secret-ward/);
      assert.equal(result.stdout, '', 'a blocked call must not print to stdout');
    });
  }

  test('block message never echoes the full path or the variable name', () => {
    const pathResult = runGuard(hookEvent('read_file', { path: 'apps/server/.env.local' }));
    assert.equal(pathResult.status, 2);
    assert.doesNotMatch(pathResult.stderr, /apps\/server/);

    const varResult = runGuard(hookEvent('execute_bash', { command: 'echo $OPENROUTER_API_KEY' }));
    assert.equal(varResult.status, 2);
    assert.doesNotMatch(varResult.stderr, /OPENROUTER_API_KEY/);
  });
});

describe('grimoire-ward-guard allows (exit 0, silent)', () => {
  for (const [label, toolName, toolInput] of MUST_ALLOW) {
    test(label, () => {
      const result = runGuard(hookEvent(toolName, toolInput));
      assert.equal(result.status, 0, `expected exit 0, got ${result.status}; stderr: ${result.stderr}`);
      assert.equal(result.stdout, '');
      assert.equal(result.stderr, '');
    });
  }
});

describe('grimoire-ward-guard fails open', () => {
  test('invalid JSON: exit 0 with a warning that does not echo the input', () => {
    const result = runGuard('not json {"path": ".env.secretvalue"');
    assert.equal(result.status, 0);
    assert.match(result.stderr, /\[WARD WARNING\]/);
    assert.doesNotMatch(result.stderr, /secretvalue/);
    assert.equal(result.stdout, '');
  });

  test('empty STDIN: exit 0, silent', () => {
    const result = runGuard('');
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
  });
});
