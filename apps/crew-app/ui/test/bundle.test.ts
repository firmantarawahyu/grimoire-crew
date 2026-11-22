// @vitest-environment node
// Contract checks for the committed Crew bundle and the app manifest (Spec 00 requirement 6).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vitest';

import { HOST_MODULES } from '../host-modules.ts';

const APP_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUNDLE = fileURLToPath(new URL('../dist/index.mjs', import.meta.url));

function importedSpecifiers(code: string): string[] {
  const specifiers = new Set<string>();
  const patterns = [
    /\bimport\s+(?:[\w*{}\s,$]+\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+(?:\*|\{[^}]*\})\s+from\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) for (const match of code.matchAll(pattern)) specifiers.add(match[1]!);
  return [...specifiers].sort();
}

describe('committed Crew bundle', () => {
  test('dist/index.mjs exists (run pnpm --filter @grimoire-crew/crew-app-ui build)', () => {
    expect(existsSync(BUNDLE)).toBe(true);
  });

  test('imports only host modules', () => {
    const imports = importedSpecifiers(readFileSync(BUNDLE, 'utf8'));
    const allowed = new Set<string>(HOST_MODULES);
    expect(imports.filter((specifier) => !allowed.has(specifier))).toEqual([]);
    expect(imports).toContain('react');
  });

  test('contains no machine-specific dependency paths', () => {
    const code = readFileSync(BUNDLE, 'utf8');
    expect(code).not.toMatch(/node_modules[\\/]\.pnpm/);
    expect(code).not.toContain('\r\n');
  });

  test('has a default export and carries no preflight reset', () => {
    const code = readFileSync(BUNDLE, 'utf8');
    expect(code).toMatch(/export\s*\{[^}]*\bas default\b[^}]*\}|export default/);
    // Tailwind's preflight starts with a universal reset on `*, ::after, ::before`.
    // Minifiers may shorten `::after` to `:after`, so match both forms.
    expect(code).not.toMatch(/\*,\s*::?after,\s*::?before/);
    expect(code).toContain('--gc-candle');
  });
});

describe('app.json', () => {
  const manifest = JSON.parse(readFileSync(join(APP_ROOT, 'app.json'), 'utf8'));

  test('passes the Kiro Crew install-time rules', () => {
    expect(manifest.name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    for (const field of ['name', 'version', 'displayName', 'description']) {
      expect(typeof manifest[field] === 'string' && manifest[field].length > 0).toBe(true);
    }
    expect(manifest.ui.entry).toBe('dist/index.mjs');
    for (const page of manifest.ui.pages) {
      expect(page.route).toBeTruthy();
      expect(page.label).toBeTruthy();
    }
  });

  test('is least-privilege and lists Windows', () => {
    expect(manifest.permissions).toEqual({ api: [], events: [], network: false });
    expect(manifest.platform.os).toEqual(['macos', 'linux', 'windows']);
  });

  test('the app root has no package.json, so Crew installs it without a build step', () => {
    expect(existsSync(join(APP_ROOT, 'package.json'))).toBe(false);
  });
});
