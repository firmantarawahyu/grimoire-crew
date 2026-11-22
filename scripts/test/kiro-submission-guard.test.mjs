// Tests for scripts/kiro-submission-guard.mjs (Stop hook + CI check).
// Run with: pnpm test:scripts
//
// Every case builds a throwaway git repo in the OS temp folder. Env files are
// added to the git index only (no working-tree file is ever written).
import { after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GUARD = fileURLToPath(new URL('../kiro-submission-guard.mjs', import.meta.url));

const MIT_LICENSE = 'MIT License\n\nCopyright (c) 2026 test\n';
const CLEAN_GITIGNORE = 'node_modules/\ndist/\n.env\n.env.*\n!.env.example\n';
const CLEAN_MCP = JSON.stringify(
  {
    mcpServers: {
      local: { command: 'node', args: ['./mcp/server.js'], env: { API_TOKEN: '${API_TOKEN}' } },
      remote: { url: 'https://mcp.example.com/sse', headers: { Authorization: 'Bearer ${MCP_TOKEN}' } },
    },
  },
  null,
  2,
);
// Built at runtime so no secret-looking literal sits in the source file.
const FAKE_OPENROUTER_KEY = ['sk', 'or', 'v1', 'a'.repeat(40)].join('-');

const tempRoots = [];
after(() => {
  for (const root of tempRoots) rmSync(root, { recursive: true, force: true });
});

function cleanFiles(overrides = {}) {
  return {
    LICENSE: MIT_LICENSE,
    '.gitignore': CLEAN_GITIGNORE,
    '.kiro/steering/architecture.md': '---\ninclusion: always\n---\n# Architecture\n',
    '.kiro/hooks/example.json': '{ "version": "v1", "hooks": [] }\n',
    '.kiro/settings/mcp.json': CLEAN_MCP,
    ...overrides,
  };
}

function makeRepo(files, { git = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'grimoire-submission-'));
  tempRoots.push(root);
  if (git) execFileSync('git', ['init', '-q'], { cwd: root });
  for (const [relPath, content] of Object.entries(files)) {
    if (content === undefined) continue;
    const absPath = join(root, relPath);
    mkdirSync(dirname(absPath), { recursive: true });
    writeFileSync(absPath, content);
  }
  return root;
}

function trackInIndexOnly(root, relPath) {
  const blob = execFileSync('git', ['hash-object', '-w', '--stdin'], {
    cwd: root,
    input: 'PLACEHOLDER=1\n',
    encoding: 'utf8',
  }).trim();
  execFileSync('git', ['update-index', '--add', '--cacheinfo', `100644,${blob},${relPath}`], { cwd: root });
}

function runGuard(root, { useCwd = false } = {}) {
  const args = useCwd ? [GUARD] : [GUARD, '--root', root];
  return spawnSync(process.execPath, args, { cwd: useCwd ? root : undefined, encoding: 'utf8', timeout: 30_000 });
}

function assertViolation(result, pattern) {
  assert.equal(result.status, 1, `expected exit 1, got ${result.status}; stderr: ${result.stderr}`);
  assert.match(result.stderr, pattern);
  assert.equal(result.stdout, '');
}

describe('kiro-submission-guard passes a clean repo', () => {
  test('clean repo via --root: exit 0, silent', () => {
    const result = runGuard(makeRepo(cleanFiles()));
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
  });

  test('clean repo via current working directory: exit 0', () => {
    const result = runGuard(makeRepo(cleanFiles()), { useCwd: true });
    assert.equal(result.status, 0, result.stderr);
  });

  test('repo without .kiro/settings/mcp.json is still clean', () => {
    const result = runGuard(makeRepo(cleanFiles({ '.kiro/settings/mcp.json': undefined })));
    assert.equal(result.status, 0, result.stderr);
  });

  test('tracked .env.example is allowed', () => {
    const root = makeRepo(cleanFiles());
    trackInIndexOnly(root, '.env.example');
    assert.equal(runGuard(root).status, 0);
  });
});

describe('kiro-submission-guard flags violations (exit 1)', () => {
  test('.kiro/ listed in .gitignore', () => {
    const result = runGuard(makeRepo(cleanFiles({ '.gitignore': `${CLEAN_GITIGNORE}.kiro/\n` })));
    assertViolation(result, /\.kiro\/ .*git-ignored/);
  });

  test('broad .* pattern in .gitignore', () => {
    const result = runGuard(makeRepo(cleanFiles({ '.gitignore': `${CLEAN_GITIGNORE}.*\n` })));
    assertViolation(result, /git-ignored/);
  });

  test('only .kiro/hooks/ ignored', () => {
    const result = runGuard(makeRepo(cleanFiles({ '.gitignore': `${CLEAN_GITIGNORE}.kiro/hooks/\n` })));
    assertViolation(result, /\.kiro\/hooks\//);
  });

  test('a real file under .kiro/ ignored by an extension pattern', () => {
    const result = runGuard(makeRepo(cleanFiles({ '.gitignore': `${CLEAN_GITIGNORE}*.json\n` })));
    assertViolation(result, /\.kiro\/hooks\/example\.json/);
  });

  test('missing LICENSE', () => {
    const result = runGuard(makeRepo(cleanFiles({ LICENSE: undefined })));
    assertViolation(result, /LICENSE file is missing/);
  });

  test('LICENSE that is not MIT', () => {
    const result = runGuard(makeRepo(cleanFiles({ LICENSE: 'Apache License\nVersion 2.0\n' })));
    assertViolation(result, /MIT License/);
  });

  test('tracked .env', () => {
    const root = makeRepo(cleanFiles());
    trackInIndexOnly(root, '.env');
    assertViolation(runGuard(root), /tracked env file: \.env\b/);
  });

  test('tracked nested .env.local', () => {
    const root = makeRepo(cleanFiles());
    trackInIndexOnly(root, 'apps/server/.env.local');
    assertViolation(runGuard(root), /tracked env file: apps\/server\/\.env\.local/);
  });

  test('literal value without ${VAR} placeholder in mcp.json env', () => {
    const mcp = JSON.stringify({ mcpServers: { local: { command: 'node', env: { API_TOKEN: 'plain-literal' } } } });
    const result = runGuard(makeRepo(cleanFiles({ '.kiro/settings/mcp.json': mcp })));
    assertViolation(result, /mcp\.json.*local.*env\.API_TOKEN.*placeholder/);
    assert.doesNotMatch(result.stderr, /plain-literal/);
  });

  test('secret-looking literal in mcp.json headers, even next to a placeholder', () => {
    const mcp = JSON.stringify({
      mcpServers: { remote: { url: 'https://x.example', headers: { Authorization: `\${PREFIX}${FAKE_OPENROUTER_KEY}` } } },
    });
    const result = runGuard(makeRepo(cleanFiles({ '.kiro/settings/mcp.json': mcp })));
    assertViolation(result, /mcp\.json.*remote.*headers\.Authorization.*secret/);
    assert.doesNotMatch(result.stderr, /aaaaaaaa/);
  });

  test('invalid mcp.json', () => {
    const result = runGuard(makeRepo(cleanFiles({ '.kiro/settings/mcp.json': '{ not json' })));
    assertViolation(result, /mcp\.json is not valid JSON/);
  });

  test('several violations produce one line each', () => {
    const root = makeRepo(cleanFiles({ LICENSE: undefined, '.gitignore': `${CLEAN_GITIGNORE}.kiro/\n` }));
    trackInIndexOnly(root, '.env');
    const result = runGuard(root);
    assert.equal(result.status, 1);
    const lines = result.stderr.trim().split('\n');
    assert.ok(lines.length >= 3, `expected at least 3 lines, got: ${result.stderr}`);
    assert.ok(lines.every((line) => line.startsWith('[SUBMISSION GUARD]')));
  });

  test('not a git repository', () => {
    const result = runGuard(makeRepo(cleanFiles(), { git: false }));
    assertViolation(result, /not a git repository: run git init/);
  });
});
