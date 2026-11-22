---
inclusion: fileMatch
fileMatchPattern: ["packages/core/**", "apps/crew-app/**"]
---

# Kiro and Kiro Crew Output Schemas (Verified Reference)

The target formats for the GrimoireCrew compiler and importer. Verified on 2026-11-22 against the official docs listed under each section. This file supersedes `docs/brainstorming/kiro-crew-schemas.md`; the corrections are listed at the end. When a doc page and this file disagree, re-check the doc page, then update this file and `docs/decisions.md`.

## 1. Kiro Crew app manifest (`app.json`)

Sources: https://kiro.dev/docs/crew/apps/manifest/, https://kiro.dev/docs/crew/apps/

| Field | Type | Notes |
|---|---|---|
| `name` | string, required | Must match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` |
| `version` | string, required | Semver `X.Y.Z` |
| `displayName` | string, required | Shown in the App Store |
| `description` | string, required | The store derives a 200-character summary from the first sentence |
| `author`, `license`, `minKiroCrewVersion` | string | A manifest may not claim a reserved author such as "Kiro Crew" |
| `tags`, `jobFamilies`, `highlights` (max 10), `screenshots` (max 5) | string[] | |
| `iconPath` | string | PNG, square, at least 256x256 |
| `heroImage`, `heroImageDark` | string | 1200x675 |
| `agents` | string[] | Paths to agent JSON files, relative to the app root |
| `skills` | string[] | Paths to skill directories that contain `SKILL.md` |
| `sops` | string[] | Paths to SOP Markdown files |
| `mcpServers` | object | Same shape as `mcp.json` entries |
| `crons` | object[] | `name`, either `every` (seconds) or `cron_expr`, `message`, optional `agent`, `enabled` (JSON boolean, default true) |
| `ui` | object | `entry` (ESM bundle), `pages[]` (`route`, `label`, `icon` as a Lucide name, `entryPoint`, `mountFunction` defaults to `"mount"`), `sidebar` |
| `backend` | object | `entryPoint`, `port` (`"auto"`), `healthCheck`, `routes`, `type`, or in-gateway Python `hooks` |
| `permissions` | object | See below |
| `platform` | object | `os` defaults to `["macos", "linux"]`, so add `"windows"` explicitly. Also `arch`, `installMode` |
| `contributes` | object | `commands`, `sessionControls` (max 2), `panelTabs` (max 8), `fileMenuItems` (max 10) |
| `setup`, `dependencies`, `lifecycle`, `resources`, `agentReadOnlyDirs` | | Lifecycle scripts, required commands, management mode |

`permissions` fields: `api` (string[] of API path prefixes; the only field enforced today), `events` (string[] of WebSocket event types), `mcpTools` (string[]), `storage` (boolean), `cron` (boolean), `memory` (`""`, `"app-scoped"`, or `"shared"`), `network` (boolean), `jobs` (boolean).

Install-time validation:
- Paths in `agents`, `skills`, `sops`, `ui.entry`, `ui.pages[].entryPoint`, and `backend.entryPoint` must be relative and stay inside the app root. Absolute paths and `..` are rejected.
- Every cron needs `every` or `cron_expr`. Every UI page needs `route` and `label`.
- Unknown fields are preserved, not rejected.
- There is no field for Kiro hooks. A `ward_hook` node cannot ship as an app-level hook file.

Least-privilege defaults for compiled apps: `permissions.api: []`, `permissions.events: []`, and `network: true` only when a network relic or a remote MCP server exists.

## 2. Custom agent (`agents/<name>.json`, `.kiro/agents/<name>.json`, or `.md`)

Source: https://kiro.dev/docs/custom-agents/configuration-reference/

An agent can be a JSON file, or Markdown with YAML front matter whose body is the system prompt.

| Field | Notes |
|---|---|
| `name` | Optional; derived from the file name when missing |
| `description`, `welcomeMessage` | Strings |
| `prompt` | Inline text or a `file://` URI, resolved relative to the agent file |
| `model` | Must be a model ID that Kiro offers. If the model is unavailable, the first prompt fails, so omit the field rather than guess |
| `tools` | Selectors: `read`, `write`, `shell`, `web`, `subagent`, `@builtin`, `@mcp`, `@<server>`, `@<server>/<tool>`, `*`, or a tool ID |
| `excludedTools` | Removes tools even when `tools` allows them |
| `permissions.rules[]` | `{ capability, match: string[], exclude?: string[], effect }` |
| `resources` | `file://` (loaded at start: at most 32 files and 100,000 characters in total), `skill://` (metadata first, body on demand), or `{ type: "knowledgeBase", ... }` |
| `mcpServers` | Local: `command`, `args`, `env`. Remote: `url`, `headers`. Optional: `timeout`, `requestTimeout`, `oauth`, `oauthScopes` |
| `includeMcpJson`, `includePowers` | Booleans |
| `hooks` | Inline array with the same shape as standalone hooks (CLI V3) |

Permission rules:
- Capability names: `fs_read`, `fs_write`, `shell`, `web_fetch`, `web_search`, `mcp`, `subagent`, `skill`, `power`, `context`, `diagnostics`, `sandbox_network`, plus the meta-capabilities `all`, `builtin`, and `filesystem`. Source: https://kiro.dev/docs/permissions/
- Effects: `allow`, `ask`, `deny` (and `evaluate`, which is preset-only). Deny overrides everything, in any scope.
- Glob syntax: filesystem rules support `*`, `**`, `{a,b}`, and `[abc]`. Shell, web, and MCP rules support only `*`.
- `tools` takes selectors while `permissions` takes capability names. They are different vocabularies.
- Delegation: list `subagent/<name>` in `tools` and add `{ capability: "subagent", match: ["<name>"], effect: "allow" }`. A sub-agent never gets more than its parent session allows.

Observed in the first-party Crew app `personal-shopper` 0.1.2 (`agents/advisor.json`, read locally on 2026-11-22). These details are not in the docs:
- `"skills": ["personal-shopper"]` is a top-level agent field that names a bundled skill by slug.
- `"tools": ["web_search", "web_fetch"]` uses plain tool IDs.
- `"model": "auto"`, `"includeMcpJson": false`, and `"mcpServers": {}`.
- There is no `permissions` block, and the prompt states hard rules in prose.

## 3. Hooks (`.kiro/hooks/<id>.json`)

Sources: https://kiro.dev/docs/hooks/, https://kiro.dev/docs/hooks/types/, https://kiro.dev/docs/hooks/actions/

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "grimoire-example",
      "description": "Documentation only",
      "trigger": "PreToolUse",
      "matcher": "shell",
      "action": { "type": "command", "command": "node scripts/grimoire-ward-guard.mjs" },
      "timeout": 10,
      "enabled": true
    }
  ]
}
```

- Required: `version` (`"v1"`), `hooks[].name`, `hooks[].trigger` (PascalCase), `hooks[].action.type` (`"command"` or `"agent"`), and `action.command` or `action.prompt` to match the type.
- Optional:
  - `description`.
  - `matcher`: a tool selector or a regex against the tool ID, or `*` and `?` wildcards. File triggers match a regex against the file path.
  - `timeout`: seconds, default 60, and 0 disables it.
  - `enabled`: default true.
  - `confirm`: Stop hooks only.
- Triggers:

  | Trigger | Surfaces |
  |---|---|
  | `PromptSubmit`, `Stop`, `SessionStart`, `PreToolUse`, `PostToolUse` | IDE, CLI, and Web |
  | `PermissionRequest`, `PreCompact`, `PostCompact`, `SessionEnd` | IDE and CLI V3 only |
  | `FileCreate`, `PostFileSave`, `FileDelete`, `PreTaskExecution`, `PostTaskExecution` | IDE and CLI V3 only |

  This repo uses only triggers that run on Web.
- A command action receives the event JSON on STDIN: `hook_event_name`, `cwd`, `session_id`, `tool_name`, `tool_input`. MCP tools appear as `mcp_<server>_<tool>`.
- Exit codes:
  - Exit 0: stdout is added to the agent's context.
  - Any other exit code: stderr goes to the agent. On `PreToolUse` the tool call is blocked; on `PromptSubmit` the prompt is blocked.
  - Exit 2 is the conventional "block" code, but any non-zero exit blocks. Guards must therefore fail open (exit 0) on their own bugs.
- `PreToolUse` command hooks can return `hookSpecificOutput.updatedInput` to rewrite tool input (IDE 1.4.236+, CLI 3.4.0+).

## 4. MCP configuration (`.kiro/settings/mcp.json`)

Source: https://kiro.dev/docs/custom-agents/configuration-reference/ (mcpServers)

```json
{
  "mcpServers": {
    "local-server": {
      "command": "node",
      "args": ["./mcp/server.js"],
      "env": { "API_TOKEN": "${API_TOKEN}" },
      "disabled": false,
      "autoApprove": ["read_file"],
      "disabledTools": ["delete_file"]
    },
    "remote-server": {
      "url": "https://mcp.example.com/sse",
      "headers": { "Authorization": "Bearer ${MCP_TOKEN}" }
    }
  }
}
```

- Values in `env` and `headers` must be `${VAR}` placeholders, which Kiro expands at runtime. The compiler never emits literal values.
- Kiro always denies agent writes to the active workspace's `.kiro/settings/`. Compiled `mcp.json` files therefore reach disk through a ZIP download or the server's workspace sync, never through a Kiro agent's write tool.

## 5. Skills (`SKILL.md`)

Source: https://kiro.dev/docs/skills/

- Workspace skills live in `.kiro/skills/<name>/SKILL.md`. A skill folder may also contain `scripts/`, `references/`, and `assets/`.
- Front matter requires `name` and `description`; the body holds the instructions. The description decides when Kiro activates the skill, so make it specific.
- Agents load skills with `"resources": ["skill://.kiro/skills/<name>/SKILL.md"]`. Crew apps use the observed `"skills": ["<slug>"]` agent field (section 2).

## 6. Steering (`.kiro/steering/*.md`)

Source: https://kiro.dev/docs/steering/

- Front matter `inclusion` takes one of four values:
  - `always`
  - `fileMatch`, with `fileMatchPattern` as a string or an array
  - `manual`, which also appears as a `/<file-name>` slash command
  - `auto`, with `name` and `description`
- Live file references use the `#[[file:<path>]]` syntax, with paths relative to the workspace root.
- Custom agents do not load steering automatically. Add `file://.kiro/steering/**/*.md` to their resources when needed.

## 7. SOPs (`sops/<ritual>.md`)

There is no official SOP schema. The manifest only lists SOP paths. GrimoireCrew defines its own SOP format in Spec 01 (Trigger, Handoff Order, Topology, Relics, Wards, Deliverable). The importer reads it back, so it must stay stable. In the `kiro-workspace` target, the SOP becomes `.kiro/steering/grimoire-<ritual>-sop.md` with `inclusion: manual`.

## Corrections to the brainstorming schema doc

- Agent permission effects include `ask`, and rules accept `exclude`.
- `app.json` has `crons[]` and a larger `permissions` object (`mcpTools`, `storage`, `cron`, `memory`, `network`, `jobs`). `platform.os` defaults to macOS and Linux only.
- `app.json` has no hooks field.
- On `PreToolUse`, any non-zero exit blocks the tool, not only exit 2.
- Hook triggers differ by surface; file-save triggers do not run on Kiro Web.
- Agent `tools` selectors and `permissions` capability names are different vocabularies (`web` against `web_fetch`, `read` against `fs_read`).
- Crew agents reference bundled skills with a top-level `skills` field (observed, not documented).

## Unverified (resolve in Spec 05 against the local Kiro Crew install)

- Whether Kiro Crew enforces agent `permissions.rules` for app-bundled agents.
- Whether inline agent `hooks` run under Kiro Crew, and from which working directory.
- Whether `skill://` URIs resolve for app-bundled skills, or only the `skills` field does.
- How Crew resolves relative `resources` and `prompt` `file://` paths for app-bundled agents.
- Whether hooks in a workspace's `.kiro/hooks/` load in Kiro Web cloud sessions without a workspace-trust step.
