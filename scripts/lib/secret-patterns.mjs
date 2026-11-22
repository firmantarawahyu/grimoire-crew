// Secret-looking literal patterns shared by the repo's zero-dependency scripts
// (submission guard, .kiro config test). packages/core keeps its own copy for
// the compiler's security linter (Spec 01).
//
// Never put a full example secret in docs or tests: build fake values at
// runtime, e.g. ['sk', 'or', 'v1', 'a'.repeat(40)].join('-').

export const SECRET_PATTERNS = [
  { name: 'GrimoireCrew canary token', regex: /sk-kiro-CANARY-FAKE-[A-Za-z0-9]/ },
  { name: 'sk- style API key', regex: /\bsk-[A-Za-z0-9_-]{20,}/ },
  { name: 'GitHub token', regex: /\bgh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: 'GitHub fine-grained token', regex: /\bgithub_pat_[A-Za-z0-9_]{20,}/ },
  { name: 'AWS access key ID', regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { name: 'Slack token', regex: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'private key block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'Discord webhook URL', regex: /discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+/i },
];

/** Returns the name of the first matching pattern, or null. Never returns the match itself. */
export function findSecretPattern(text) {
  if (typeof text !== 'string' || text === '') return null;
  return SECRET_PATTERNS.find((pattern) => pattern.regex.test(text))?.name ?? null;
}
