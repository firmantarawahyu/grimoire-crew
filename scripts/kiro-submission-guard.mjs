#!/usr/bin/env node
// kiro-submission-guard: checks the Kiroween 2026 submission invariants.
// Runs from the Stop hook (.kiro/hooks/kiro-submission-guard.json) and in CI.
//
//   1. .kiro/ and its key subfolders and files are not git-ignored.
//   2. LICENSE exists and is the MIT License.
//   3. No real .env file is tracked by git (.env.example is fine).
//   4. .kiro/settings/mcp.json (if present) uses ${VAR} placeholders only.
//
// Usage: node scripts/kiro-submission-guard.mjs [--root <dir>]
// Exit 0 and print nothing when all checks pass. Otherwise print one stderr
// line per violation and exit 1. Messages never echo secret values.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { findSecretPattern } from './lib/secret-patterns.mjs';

const PREFIX = '[SUBMISSION GUARD]';
const KIRO_PATHS = [
  '.kiro/',
  '.kiro/specs/',
  '.kiro/steering/',
  '.kiro/hooks/',
  '.kiro/settings/',
  '.kiro/settings/mcp.json',
];
const LICENSE_FILES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'];
const SAFE_ENV_SUFFIXES = new Set(['example', 'sample', 'template']);
const PLACEHOLDER = /\$\{[A-Za-z_][A-Za-z0-9_]*\}/;
const MCP_CONFIG = '.kiro/settings/mcp.json';

function parseRoot(argv) {
  const index = argv.indexOf('--root');
  if (index !== -1 && argv[index + 1]) return resolve(argv[index + 1]);
  return process.cwd();
}

function runGit(root, args, input) {
  return spawnSync('git', args, { cwd: root, input, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isEnvFileName(name) {
  if (name === '.env') return true;
  return name.startsWith('.env.') && !SAFE_ENV_SUFFIXES.has(name.slice(5).toLowerCase());
}

function listKiroFiles(root) {
  const base = join(root, '.kiro');
  if (!existsSync(base)) return [];
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const absPath = join(dir, entry.name);
      if (entry.isDirectory()) walk(absPath);
      else if (entry.isFile()) files.push(relative(root, absPath).split(sep).join('/'));
    }
  };
  walk(base);
  return files;
}

function checkKiroNotIgnored(root) {
  const paths = [...new Set([...KIRO_PATHS, ...listKiroFiles(root)])].sort();
  // --no-index: a rule matters even when the files are already tracked,
  // because it would silently drop every new .kiro/ file.
  const result = runGit(root, ['check-ignore', '--no-index', '--verbose', '-z', '--stdin'], `${paths.join('\0')}\0`);
  if (result.status === 1) return [];
  if (result.status !== 0) return [`${PREFIX} git check-ignore failed; could not verify that .kiro/ is committed.`];

  const fields = result.stdout.split('\0');
  const ignored = [];
  for (let i = 0; i + 3 < fields.length; i += 4) {
    const [source, line, pattern, path] = fields.slice(i, i + 4);
    if (pattern.startsWith('!')) continue; // a negated rule re-includes the path
    ignored.push({ path, where: `${source}:${line}`, pattern });
  }
  ignored.sort((a, b) => a.path.localeCompare(b.path));

  // Report the shallowest ignored path only; its children follow from it.
  const reported = [];
  for (const entry of ignored) {
    if (reported.some((parent) => parent.path.endsWith('/') && entry.path.startsWith(parent.path))) continue;
    reported.push(entry);
  }
  return reported.map(
    ({ path, where, pattern }) =>
      `${PREFIX} ${path} is git-ignored by ${where} ("${pattern}"); Kiroween requires .kiro/ to be committed, so remove that rule.`,
  );
}

function checkLicense(root) {
  const file = LICENSE_FILES.find((name) => existsSync(join(root, name)));
  if (!file) return [`${PREFIX} LICENSE file is missing; add the MIT License text at the repository root.`];
  if (!readFileSync(join(root, file), 'utf8').includes('MIT License')) {
    return [`${PREFIX} ${file} does not contain "MIT License"; GrimoireCrew ships under the MIT License.`];
  }
  return [];
}

function checkNoTrackedEnvFiles(root) {
  const result = runGit(root, ['ls-files', '-z']);
  if (result.status !== 0) return [`${PREFIX} git ls-files failed; could not verify that no .env file is tracked.`];
  return result.stdout
    .split('\0')
    .filter((path) => path && isEnvFileName(path.split('/').pop()))
    .map(
      (path) =>
        `${PREFIX} tracked env file: ${path}; untrack it with "git rm --cached -- ${path}" and rotate any secret it held.`,
    );
}

function checkMcpConfig(root) {
  const absPath = join(root, ...MCP_CONFIG.split('/'));
  if (!existsSync(absPath)) return [];
  let config;
  try {
    config = JSON.parse(readFileSync(absPath, 'utf8'));
  } catch {
    return [`${PREFIX} ${MCP_CONFIG} is not valid JSON.`];
  }
  if (!isPlainObject(config?.mcpServers)) return [`${PREFIX} ${MCP_CONFIG} must contain an "mcpServers" object.`];

  const violations = [];
  for (const [name, server] of Object.entries(config.mcpServers)) {
    const at = `${MCP_CONFIG}: server "${name}"`;
    if (!isPlainObject(server)) {
      violations.push(`${PREFIX} ${at} must be an object.`);
      continue;
    }
    for (const field of ['env', 'headers']) {
      if (server[field] === undefined) continue;
      if (!isPlainObject(server[field])) {
        violations.push(`${PREFIX} ${at} ${field} must be an object.`);
        continue;
      }
      for (const [key, value] of Object.entries(server[field])) {
        const where = `${at} ${field}.${key}`;
        const secret = findSecretPattern(value);
        if (typeof value !== 'string') violations.push(`${PREFIX} ${where} must be a string with a \${VAR} placeholder.`);
        else if (secret) violations.push(`${PREFIX} ${where} contains a secret-looking literal (${secret}); use only \${VAR} placeholders.`);
        else if (!PLACEHOLDER.test(value)) violations.push(`${PREFIX} ${where} must use a \${VAR} placeholder, not a literal value.`);
      }
    }
    const loose = [server.url, ...(Array.isArray(server.args) ? server.args : [])];
    const secret = loose.map(findSecretPattern).find(Boolean);
    if (secret) violations.push(`${PREFIX} ${at} url/args contain a secret-looking literal (${secret}); use \${VAR} placeholders.`);
  }
  return violations;
}

function main() {
  const root = parseRoot(process.argv.slice(2));
  const probe = runGit(root, ['rev-parse', '--is-inside-work-tree']);
  if (probe.error) {
    process.stderr.write(`${PREFIX} git is not available on PATH; install git to run this check.\n`);
    return 1;
  }
  if (probe.status !== 0 || probe.stdout.trim() !== 'true') {
    process.stderr.write(`${PREFIX} not a git repository: run git init in ${root}.\n`);
    return 1;
  }
  const violations = [
    ...checkKiroNotIgnored(root),
    ...checkLicense(root),
    ...checkNoTrackedEnvFiles(root),
    ...checkMcpConfig(root),
  ];
  for (const violation of violations) process.stderr.write(`${violation}\n`);
  return violations.length === 0 ? 0 : 1;
}

process.exitCode = main();
