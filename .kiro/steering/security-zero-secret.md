---
inclusion: always
---

# Zero Secret to Model Context

The invariant: no real secret value ever enters an agent's or model's context. That covers prompts, tool results, logs, compiled files, test fixtures, and outbound webhooks. It applies both to Kiro sessions that build this repo and to the agents GrimoireCrew runs and compiles.

## Rules for working in this repo

- Never create, read, print, or copy a real `.env` file. `.env.example` lists the variable names with empty values; read that instead.
- Never print environment variables (`printenv`, bare `env` or `set`, `Get-ChildItem env:`, `echo $SOME_TOKEN`). If you need a non-secret value, ask the user.
- Config and compiled output use `${VAR}` placeholders only, never literal values.
- Test secrets exist only as in-memory strings built at runtime, for example `['sk', 'or', 'v1', 'a'.repeat(40)].join('-')`. Never commit a full secret-shaped literal and never write a `.env` fixture file.
- The curse-test canary token is the prefix `sk-kiro-CANARY-FAKE-` followed by random characters generated at runtime. It is fake, but every scanner treats it as a secret on purpose.
- The OpenRouter key stays inside `apps/server`. It never reaches the browser bundle, an SSE payload, a compiled file, or a model prompt.
- Kiro Web cloud sessions: add no secret to the sandbox environment until Spec 04 needs one. Then use a dedicated, low-limit OpenRouter key.
- When a ward blocks you, do not work around it. Tell the user what you needed and why.

## Defense layers

1. Absence: no secrets in the sandbox until Spec 04, then one dedicated key.
2. Network: cloud sessions use the "Common dependencies" level. From Spec 04, add an allow-list (`openrouter.ai`, `api.github.com`, `raw.githubusercontent.com`, `discord.com`).
3. Dev ward: the `PreToolUse` hooks in `.kiro/hooks/env-secret-ward.json` run `scripts/grimoire-ward-guard.mjs`, which blocks `.env*` files and environment dumps with exit code 2.
4. Compiled agents: every agent GrimoireCrew emits carries `fs_read` deny rules for `**/.env` and `**/.env.*` (Spec 01).
5. Runtime redaction: secrets become `[REDACTED_SECRET]` before text reaches OpenRouter or a webhook (Specs 03 and 04).
6. Local machines only: a personal deny rule in `~/.kiro/settings/permissions.yaml` (cloud sessions ignore this file):

   ```yaml
   rules:
     - capability: fs_read
       match: ["**/.env", "**/.env.*"]
       exclude: ["**/.env.example"]
       effect: deny
   ```

The ward is a guard rail, not a security boundary. Known residual risk: an agent could write a script that reads a variable and then run it, which no pattern check can see. That is why layer 1, having no secret present at all, matters most.

## Scope

- The dev ward checks secrets only. Prompt-injection detection belongs to the runtime ward in the curse engine (Spec 03), because curse fixtures intentionally contain injection payloads that a dev hook would block.
- `scripts/kiro-submission-guard.mjs` (Stop hook and CI) also fails when a real `.env` file is tracked or `.kiro/settings/mcp.json` holds a literal value.
