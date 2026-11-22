// Validates this repo's own .kiro/ configuration against the official schemas,
// plus negative fixtures that prove the rules reject bad config.
// Run with: pnpm test:scripts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  parseFrontMatter,
  validateHookFile,
  validateMcpConfig,
  validateSteeringFile,
} from '../lib/kiro-config-rules.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const HOOKS_DIR = fileURLToPath(new URL('../../.kiro/hooks/', import.meta.url));
const STEERING_DIR = fileURLToPath(new URL('../../.kiro/steering/', import.meta.url));
const MCP_CONFIG = fileURLToPath(new URL('../../.kiro/settings/mcp.json', import.meta.url));
const EXPECTED_HOOK_FILES = ['compiler-schema-test.json', 'env-secret-ward.json', 'kiro-submission-guard.json'];
const EXPECTED_STEERING = {
  'alchemist-ui-audio.md': 'fileMatch',
  'architecture.md': 'always',
  'kiro-crew-schemas.md': 'fileMatch',
  'project-memory.md': 'always',
  'security-zero-secret.md': 'always',
  'session-handoff.md': 'manual',
};

function readHookFiles() {
  return readdirSync(HOOKS_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({ name, relPath: `.kiro/hooks/${name}`, text: readFileSync(`${HOOKS_DIR}${name}`, 'utf8') }));
}

function validHook(overrides = {}) {
  return {
    name: 'grimoire-example',
    description: 'example',
    trigger: 'Stop',
    action: { type: 'command', command: 'node scripts/kiro-submission-guard.mjs' },
    timeout: 30,
    enabled: true,
    ...overrides,
  };
}

function hookFileText(hooks, version = 'v1') {
  return JSON.stringify({ version, hooks });
}

describe('.kiro/hooks in this repo', () => {
  test('the three Day-1 hook files exist', () => {
    assert.ok(existsSync(HOOKS_DIR), '.kiro/hooks/ is missing');
    for (const name of EXPECTED_HOOK_FILES) assert.ok(existsSync(`${HOOKS_DIR}${name}`), `missing .kiro/hooks/${name}`);
  });

  for (const name of EXPECTED_HOOK_FILES) {
    test(`${name} is valid v1 and cloud-compatible`, () => {
      const text = readFileSync(`${HOOKS_DIR}${name}`, 'utf8');
      assert.deepEqual(validateHookFile(`.kiro/hooks/${name}`, text, ROOT), []);
    });
  }

  test('every hook name is unique and prefixed grimoire-', () => {
    const names = readHookFiles().flatMap(({ text }) => JSON.parse(text).hooks.map((hook) => hook.name));
    assert.equal(new Set(names).size, names.length, `duplicate hook names: ${names.join(', ')}`);
    for (const name of names) assert.match(name, /^grimoire-[a-z0-9-]+$/);
  });

  test('the ward covers read, shell and MCP tools with PreToolUse', () => {
    const ward = JSON.parse(readFileSync(`${HOOKS_DIR}env-secret-ward.json`, 'utf8'));
    const matchers = ward.hooks.filter((hook) => hook.trigger === 'PreToolUse').map((hook) => hook.matcher);
    assert.deepEqual(matchers.sort(), ['@mcp', 'read', 'shell']);
  });
});

describe('hook rules reject bad config', () => {
  const cases = [
    ['file-save trigger (not run in cloud sessions)', hookFileText([validHook({ trigger: 'PostFileSave' })]), /trigger "PostFileSave"/],
    ['camelCase trigger', hookFileText([validHook({ trigger: 'preToolUse' })]), /trigger "preToolUse"/],
    ['wrong version', hookFileText([validHook()], 'v2'), /version must be "v1"/],
    ['empty hooks array', hookFileText([]), /non-empty array/],
    ['missing name', hookFileText([validHook({ name: '' })]), /name is required/],
    ['missing timeout', hookFileText([validHook({ timeout: undefined })]), /timeout/],
    ['unknown field (typo)', hookFileText([{ ...validHook(), timout: 30 }]), /unknown field "timout"/],
    ['bad action type', hookFileText([validHook({ action: { type: 'script', command: 'x' } })]), /action\.type/],
    ['agent action without prompt', hookFileText([validHook({ action: { type: 'agent' } })]), /needs a prompt/],
    ['missing referenced script', hookFileText([validHook({ action: { type: 'command', command: 'node scripts/nope.mjs' } })]), /does not exist/],
    ['matcher on a Stop hook', hookFileText([validHook({ matcher: 'shell' })]), /matcher has no effect/],
    ['invalid JSON', '{ "version": "v1", ', /invalid JSON/],
  ];
  for (const [label, text, pattern] of cases) {
    test(label, () => {
      const errors = validateHookFile('.kiro/hooks/fixture.json', text, ROOT);
      assert.ok(errors.some((error) => pattern.test(error)), `expected ${pattern}, got: ${JSON.stringify(errors)}`);
    });
  }

  test('a secret-looking literal anywhere in a hook file', () => {
    const fakeToken = ['ghp', 'A'.repeat(36)].join('_');
    const errors = validateHookFile('.kiro/hooks/fixture.json', hookFileText([validHook({ description: fakeToken })]), ROOT);
    assert.ok(errors.some((error) => /secret-looking/.test(error)));
    assert.ok(errors.every((error) => !error.includes(fakeToken)), 'errors must not echo the secret');
  });

  test('a valid PreToolUse command hook passes', () => {
    const text = hookFileText([
      validHook({ trigger: 'PreToolUse', matcher: '@mcp', action: { type: 'command', command: 'node scripts/grimoire-ward-guard.mjs' } }),
    ]);
    assert.deepEqual(validateHookFile('.kiro/hooks/fixture.json', text, ROOT), []);
  });
});

describe('.kiro/steering in this repo', () => {
  test('exactly the expected steering files exist', () => {
    const files = readdirSync(STEERING_DIR).filter((name) => name.endsWith('.md')).sort();
    assert.deepEqual(files, Object.keys(EXPECTED_STEERING).sort());
  });

  for (const [name, inclusion] of Object.entries(EXPECTED_STEERING)) {
    test(`${name} is valid with inclusion: ${inclusion}`, () => {
      const text = readFileSync(`${STEERING_DIR}${name}`, 'utf8');
      assert.deepEqual(validateSteeringFile(`.kiro/steering/${name}`, text, ROOT), []);
      assert.equal(parseFrontMatter(text).data.inclusion, inclusion);
    });
  }
});

describe('steering rules reject bad config', () => {
  const cases = [
    ['no front matter', '# Title\n', /missing front matter/],
    ['unknown inclusion mode', '---\ninclusion: sometimes\n---\n', /inclusion must be one of/],
    ['fileMatch without a pattern', '---\ninclusion: fileMatch\n---\n', /fileMatchPattern/],
    ['auto without a description', '---\ninclusion: auto\nname: x\n---\n', /name and description/],
    ['broken file reference', '---\ninclusion: always\n---\nSee #[[file:docs/does-not-exist.md]]\n', /missing path/],
  ];
  for (const [label, text, pattern] of cases) {
    test(label, () => {
      const errors = validateSteeringFile('.kiro/steering/fixture.md', text, ROOT);
      assert.ok(errors.some((error) => pattern.test(error)), `expected ${pattern}, got: ${JSON.stringify(errors)}`);
    });
  }

  test('file references inside inline code are documentation, not references', () => {
    const text = '---\ninclusion: always\n---\nSyntax: `#[[file:docs/does-not-exist.md]]`\n';
    assert.deepEqual(validateSteeringFile('.kiro/steering/fixture.md', text, ROOT), []);
  });

  test('a secret-looking literal in steering', () => {
    const fakeKey = ['AKIA', 'Q'.repeat(16)].join('');
    const errors = validateSteeringFile('.kiro/steering/fixture.md', `---\ninclusion: always\n---\n${fakeKey}\n`, ROOT);
    assert.ok(errors.some((error) => /secret-looking/.test(error)));
  });

  test('fileMatchPattern as a JSON-style array parses', () => {
    const parsed = parseFrontMatter('---\ninclusion: fileMatch\nfileMatchPattern: ["a/**", "b/**"]\n---\nbody\n');
    assert.deepEqual(parsed.data.fileMatchPattern, ['a/**', 'b/**']);
    assert.equal(parsed.body, 'body\n');
  });
});

describe('.kiro/settings/mcp.json', () => {
  test('exists and has an mcpServers object', () => {
    assert.ok(existsSync(MCP_CONFIG), '.kiro/settings/mcp.json is missing');
    assert.deepEqual(validateMcpConfig('.kiro/settings/mcp.json', readFileSync(MCP_CONFIG, 'utf8')), []);
  });

  test('rejects a config without mcpServers', () => {
    assert.match(validateMcpConfig('x', '{"servers": {}}')[0], /mcpServers/);
  });
});
