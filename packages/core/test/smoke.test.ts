// Spec 00 smoke test: proves the core toolchain (Vitest, Zod 4, yaml, fast-check) loads.
import { describe, expect, test } from 'vitest';
import fc from 'fast-check';
import { parse, stringify } from 'yaml';
import { z } from 'zod';
import { CORE_PACKAGE_NAME } from '../src/index.ts';

describe('core toolchain', () => {
  test('exports its package name', () => {
    expect(CORE_PACKAGE_NAME).toBe('@grimoire-crew/core');
  });

  test('zod 4 parses and reports issues', () => {
    const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(Slug.safeParse('pr-exorcist').success).toBe(true);
    expect(Slug.safeParse('Not A Slug').success).toBe(false);
  });

  test('yaml round-trips front matter values', () => {
    const data = { name: 'grimoire-owasp-audit', description: 'Audit: "OWASP" checks' };
    expect(parse(stringify(data))).toEqual(data);
  });

  test('fast-check runs a property', () => {
    fc.assert(fc.property(fc.string(), (text) => text.split('').join('') === text));
  });
});
