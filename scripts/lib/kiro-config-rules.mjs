// Validation rules for this repo's own .kiro/ configuration (zero dependencies).
// Used by scripts/test/kiro-config.test.mjs, which runs in `pnpm test` and CI.
//
// Hook schema: https://kiro.dev/docs/hooks/ (v1, verified 2026-11-22).
// Steering front matter: https://kiro.dev/docs/steering/.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { findSecretPattern } from './secret-patterns.mjs';

// Triggers that also run in Kiro Web cloud sessions. File-save triggers do not,
// so this repo never uses them (see docs/decisions.md).
export const CLOUD_TRIGGERS = new Set(['PreToolUse', 'PostToolUse', 'Stop', 'SessionStart']);
const TOOL_TRIGGERS = new Set(['PreToolUse', 'PostToolUse']);
const HOOK_KEYS = new Set(['name', 'description', 'trigger', 'matcher', 'action', 'timeout', 'enabled', 'confirm']);
const ACTION_KEYS = new Set(['type', 'command', 'prompt']);
const INCLUSION_MODES = new Set(['always', 'fileMatch', 'manual', 'auto']);
const SCRIPT_REFERENCE = /^node\s+(scripts\/\S+\.mjs)(?:\s|$)/;
const FILE_REFERENCE = /#\[\[(file|folder):([^\]]+?)(?::\d+(?:-\d+)?)?\]\]/g;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/** Validates one .kiro/hooks/*.json file. Returns a list of error strings (empty = valid). */
export function validateHookFile(relPath, text, root) {
  const secret = findSecretPattern(text);
  if (secret) return [`${relPath}: contains a secret-looking literal (${secret})`];

  let config;
  try {
    config = JSON.parse(text);
  } catch {
    return [`${relPath}: invalid JSON`];
  }
  const errors = [];
  if (config?.version !== 'v1') errors.push(`${relPath}: version must be "v1"`);
  if (!Array.isArray(config?.hooks) || config.hooks.length === 0) {
    errors.push(`${relPath}: hooks must be a non-empty array`);
    return errors;
  }

  config.hooks.forEach((hook, index) => {
    const at = `${relPath} hooks[${index}]`;
    if (hook === null || typeof hook !== 'object' || Array.isArray(hook)) {
      errors.push(`${at}: must be an object`);
      return;
    }
    for (const key of Object.keys(hook)) if (!HOOK_KEYS.has(key)) errors.push(`${at}: unknown field "${key}"`);
    if (!isNonEmptyString(hook.name)) errors.push(`${at}: name is required`);
    if (hook.description !== undefined && typeof hook.description !== 'string') {
      errors.push(`${at}: description must be a string`);
    }
    if (!CLOUD_TRIGGERS.has(hook.trigger)) {
      errors.push(`${at}: trigger "${hook.trigger}" is not one of ${[...CLOUD_TRIGGERS].join(', ')} (PascalCase, cloud-supported)`);
    }
    if (hook.matcher !== undefined) {
      if (!isNonEmptyString(hook.matcher)) errors.push(`${at}: matcher must be a non-empty string`);
      else if (!TOOL_TRIGGERS.has(hook.trigger)) errors.push(`${at}: matcher has no effect on ${hook.trigger}`);
    }
    if (hook.confirm !== undefined && hook.trigger !== 'Stop') errors.push(`${at}: confirm is only valid on Stop`);
    if (typeof hook.timeout !== 'number' || !Number.isFinite(hook.timeout) || hook.timeout < 0) {
      errors.push(`${at}: timeout must be a number of seconds (0 disables it)`);
    }
    if (hook.enabled !== undefined && typeof hook.enabled !== 'boolean') errors.push(`${at}: enabled must be a boolean`);

    const action = hook.action;
    if (action === null || typeof action !== 'object' || Array.isArray(action)) {
      errors.push(`${at}: action must be an object`);
      return;
    }
    for (const key of Object.keys(action)) if (!ACTION_KEYS.has(key)) errors.push(`${at}: unknown action field "${key}"`);
    if (action.type === 'command') {
      if (!isNonEmptyString(action.command)) errors.push(`${at}: command action needs a command`);
      const script = SCRIPT_REFERENCE.exec(action.command ?? '')?.[1];
      if (script && !existsSync(join(root, ...script.split('/')))) errors.push(`${at}: referenced script ${script} does not exist`);
    } else if (action.type === 'agent') {
      if (!isNonEmptyString(action.prompt)) errors.push(`${at}: agent action needs a prompt`);
    } else {
      errors.push(`${at}: action.type must be "command" or "agent"`);
    }
  });
  return errors;
}

function parseScalar(raw) {
  const value = raw.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.startsWith('[') || value.startsWith('"')) return JSON.parse(value);
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
  return value;
}

/**
 * Parses the small YAML subset used in this repo's steering front matter:
 * `key: value` lines whose value is a bare word, a quoted string, a boolean,
 * or a JSON-style array. Returns { data, body } or null without front matter.
 */
export function parseFrontMatter(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(normalized);
  if (!match) return null;
  const data = {};
  for (const line of match[1].split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const separator = line.indexOf(':');
    if (separator === -1) throw new Error(`front matter line without "key: value": ${line}`);
    data[line.slice(0, separator).trim()] = parseScalar(line.slice(separator + 1));
  }
  return { data, body: normalized.slice(match[0].length) };
}

/** Validates one .kiro/steering/*.md file. Returns a list of error strings. */
export function validateSteeringFile(relPath, text, root) {
  const errors = [];
  const secret = findSecretPattern(text);
  if (secret) errors.push(`${relPath}: contains a secret-looking literal (${secret})`);

  let parsed;
  try {
    parsed = parseFrontMatter(text);
  } catch (error) {
    return [...errors, `${relPath}: ${error.message}`];
  }
  if (!parsed) return [...errors, `${relPath}: missing front matter (--- inclusion: ... ---)`];

  const { data, body } = parsed;
  if (!INCLUSION_MODES.has(data.inclusion)) {
    errors.push(`${relPath}: inclusion must be one of ${[...INCLUSION_MODES].join(', ')}`);
  }
  if (data.inclusion === 'fileMatch') {
    const patterns = Array.isArray(data.fileMatchPattern) ? data.fileMatchPattern : [data.fileMatchPattern];
    if (patterns.length === 0 || !patterns.every(isNonEmptyString)) {
      errors.push(`${relPath}: fileMatch needs fileMatchPattern (string or array of strings)`);
    }
  }
  if (data.inclusion === 'auto' && !(isNonEmptyString(data.name) && isNonEmptyString(data.description))) {
    errors.push(`${relPath}: auto inclusion needs name and description`);
  }

  // Live references; code blocks and inline code spans are documentation, not references.
  const prose = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  for (const [, kind, target] of prose.matchAll(FILE_REFERENCE)) {
    if (!existsSync(join(root, ...target.trim().split('/')))) {
      errors.push(`${relPath}: #[[${kind}:${target}]] points to a missing path`);
    }
  }
  return errors;
}

/** Validates .kiro/settings/mcp.json structure (secrets are checked by the submission guard). */
export function validateMcpConfig(relPath, text) {
  let config;
  try {
    config = JSON.parse(text);
  } catch {
    return [`${relPath}: invalid JSON`];
  }
  const servers = config?.mcpServers;
  if (servers === null || typeof servers !== 'object' || Array.isArray(servers)) {
    return [`${relPath}: must contain an "mcpServers" object`];
  }
  return [];
}
