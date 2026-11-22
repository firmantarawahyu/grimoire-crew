#!/usr/bin/env node
// grimoire-env-secret-ward: Kiro PreToolUse hook guard (zero dependencies).
//
// Kiro pipes the hook event JSON to STDIN:
//   { hook_event_name, cwd, session_id, tool_name, tool_input }
// Exit 2 blocks the tool call (stderr is shown to the agent). Exit 0 allows it.
//
// Rule A: block access to real .env files (.env, .env.local, ...). Allowed:
//         .env.example, .env.sample, .env.template.
// Rule B: block shell commands that dump the environment or read a
//         secret-named variable (API_KEY, TOKEN, SECRET, PASSWORD, ...).
//
// Fail-open: an internal error exits 0 with a warning, so a bug here can never
// lock the agent out. This is a guard rail, not a security boundary; see
// .kiro/steering/security-zero-secret.md for the full defense layers.
//
// Spec 01 task 15 regenerates this file from the packages/core ward template.

const HOOK_NAME = 'grimoire-env-secret-ward';

// Only these tool_input keys are inspected.
const PATH_KEY = /path|file|dir|uri|pattern|target|source|cwd/i;
const COMMAND_KEY = /^(?:command|script)$/i;

// Rule A
const SAFE_ENV_SUFFIXES = new Set(['example', 'sample', 'template']);
const TOKEN_DELIMITERS = /[\s'"`/\\=;|&()<>]+/;
const PROC_ENVIRON = /\/proc\/[^\s/]+\/environ\b/;

// Rule B
const SECRET_NAME = /^[A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD|PRIVATE_KEY|ACCESS_KEY)[A-Z0-9_]*$/;
const SEGMENT_SPLIT = /\r?\n|&&|\|\||[;|&]/;
const WRAPPER_COMMANDS = new Set(['sudo', 'exec', 'command', 'builtin', 'time', 'nohup']);
const NESTED_COMMAND = /(?:^|\s)(?:-c|-lc|-command|\/c)\s+(["'])([\s\S]*?)\1/gi;
const PWSH_ENV_DRIVE =
  /\b(?:get-childitem|gci|dir|ls|get-item|gi)\s+(?:-(?:literal)?path\s+)?["']?env:[\\/]?\*?["']?(?=$|[\s;|&)])/i;
const DOTNET_ENV_DUMP = /GetEnvironmentVariables\s*\(/i;
const SHELL_VAR = /\$\{?([A-Za-z_][A-Za-z0-9_]*)/g; // $NAME, ${NAME} (case-sensitive)
const PWSH_ENV_VAR = /env:([A-Za-z_][A-Za-z0-9_]*)/gi; // $env:NAME, env:NAME
const CMD_VAR = /%([A-Za-z_][A-Za-z0-9_]*)%/g; // %NAME%
const DOTNET_ENV_VAR = /GetEnvironmentVariable\s*\(\s*["']([A-Za-z_][A-Za-z0-9_]*)["']/gi;

const MESSAGES = {
  'env-file':
    `[WARD BLOCKED] Access to a ".env" file denied by ${HOOK_NAME}. ` +
    'Read .env.example for variable names; real secrets never enter agent context.',
  'env-dump':
    `[WARD BLOCKED] Dumping environment variables denied by ${HOOK_NAME}. ` +
    'Ask the user for the non-secret values you need instead.',
  'secret-var':
    `[WARD BLOCKED] Reading a secret-named environment variable denied by ${HOOK_NAME}. ` +
    'Secrets stay in the runtime, never in agent context. To find code that uses a variable, use the workspace search tool.',
};

function isEnvFileToken(token) {
  if (token === '.env') return true;
  if (/^\.env[*?[]/.test(token)) return true; // globs such as .env* or .env?
  if (token.startsWith('.env.')) return !SAFE_ENV_SUFFIXES.has(token.slice(5).toLowerCase());
  return false;
}

function mentionsEnvFile(text) {
  return text.split(TOKEN_DELIMITERS).some(isEnvFileToken);
}

function isSecretName(name, { caseInsensitive = false } = {}) {
  return SECRET_NAME.test(caseInsensitive ? name.toUpperCase() : name);
}

function referencesSecretVariable(command) {
  for (const match of command.matchAll(SHELL_VAR)) if (isSecretName(match[1])) return true;
  for (const pattern of [PWSH_ENV_VAR, CMD_VAR, DOTNET_ENV_VAR]) {
    for (const match of command.matchAll(pattern)) {
      if (isSecretName(match[1], { caseInsensitive: true })) return true;
    }
  }
  return false;
}

function commandName(word) {
  return word.split(/[\\/]/).pop().toLowerCase().replace(/\.exe$/, '');
}

function segmentWords(segment) {
  return segment
    .trim()
    .replace(/^[({!\s]+/, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.replace(/^["']+|["']+$/g, ''));
}

// `env` alone (or with only flags) prints the environment. `env A=b cmd` runs a command.
function envDumps(args) {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '-u' || arg === '--unset' || arg === '-C' || arg === '--chdir') {
      i += 1;
      continue;
    }
    if (arg.startsWith('-')) continue;
    return false;
  }
  return true;
}

function inspectSegment(segment) {
  let words = segmentWords(segment);
  while (words.length > 0 && WRAPPER_COMMANDS.has(commandName(words[0]))) words = words.slice(1);
  if (words.length === 0) return null;

  const [head, ...args] = words;
  const operands = args.filter((arg) => !arg.startsWith('-'));
  switch (commandName(head)) {
    case 'printenv':
      if (operands.length === 0) return 'env-dump';
      return operands.some((name) => isSecretName(name, { caseInsensitive: true })) ? 'secret-var' : null;
    case 'env':
      return envDumps(args) ? 'env-dump' : null;
    case 'export':
      return args.length === 0 || (args.length === 1 && args[0] === '-p') ? 'env-dump' : null;
    case 'declare':
    case 'typeset':
      return operands.length === 0 ? 'env-dump' : null;
    case 'set':
      return args.length === 0 ? 'env-dump' : null;
    default:
      return null;
  }
}

function inspectCommand(command, depth = 0) {
  if (mentionsEnvFile(command)) return 'env-file';
  if (PROC_ENVIRON.test(command) || PWSH_ENV_DRIVE.test(command) || DOTNET_ENV_DUMP.test(command)) {
    return 'env-dump';
  }
  if (referencesSecretVariable(command)) return 'secret-var';
  for (const segment of command.split(SEGMENT_SPLIT)) {
    const finding = inspectSegment(segment);
    if (finding) return finding;
  }
  // bash -c "...", pwsh -Command "...", cmd /c "..."
  if (depth < 2) {
    for (const match of command.matchAll(NESTED_COMMAND)) {
      const finding = inspectCommand(match[2], depth + 1);
      if (finding) return finding;
    }
  }
  return null;
}

function inspectPath(value) {
  if (mentionsEnvFile(value)) return 'env-file';
  if (PROC_ENVIRON.test(value)) return 'env-dump';
  return null;
}

function inspectValue(value, key) {
  if (typeof value === 'string') {
    if (key && COMMAND_KEY.test(key)) return inspectCommand(value);
    if (key && PATH_KEY.test(key)) return inspectPath(value);
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const finding = inspectValue(item, key);
      if (finding) return finding;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value)) {
      const finding = inspectValue(child, childKey);
      if (finding) return finding;
    }
  }
  return null;
}

function inspectEvent(event) {
  let toolInput = event?.tool_input;
  if (typeof toolInput === 'string') {
    try {
      toolInput = JSON.parse(toolInput);
    } catch {
      return inspectCommand(toolInput);
    }
  }
  return inspectValue(toolInput, null);
}

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  let finding;
  try {
    const raw = (await readStdin()).trim();
    if (raw === '') return 0;
    finding = inspectEvent(JSON.parse(raw));
  } catch (error) {
    // Never include error.message: JSON.parse errors quote the raw input.
    process.stderr.write(
      `[WARD WARNING] ${HOOK_NAME} could not inspect this tool call (${error?.name ?? 'Error'}); allowing it.\n`,
    );
    return 0;
  }
  if (!finding) return 0;
  process.stderr.write(`${MESSAGES[finding]}\n`);
  return 2;
}

process.exitCode = await main();
