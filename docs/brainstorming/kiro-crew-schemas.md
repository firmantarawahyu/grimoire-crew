# Official Kiro & Kiro Crew Output Schemas (Verified Reference)

> **Purpose:** Exact target schemas for **GrimoireCrew's Deterministic Compiler (`packages/core/compiler`)** so every exported file (`app.json`, `agents/*.json`, `skills/*/SKILL.md`, `sops/*.md`, `.kiro/hooks/*.json`, `.kiro/settings/mcp.json`) is 100% compliant with Kiro IDE, Kiro CLI V3, and Kiro Crew.
> **Verified from:** `kiro.dev/docs`, `kiro.dev/crew`, `github.com/kirodotdev/KiroCrew`, and `github.com/kirodotdev/KiroCrewApps`.

---

## 1. Kiro Crew App Manifest (`app.json`)

Located at the root of an exported Kiro Crew App package.

```json
{
  "name": "grimoire-pr-exorcist",
  "version": "1.0.0",
  "displayName": "PR Exorcist Coven",
  "description": "Automated PR security & code review crew compiled by GrimoireCrew.",
  "author": "grimoire-user",
  "iconPath": "assets/icon.png",
  "agents": [
    "agents/grimoire-auditor.json"
  ],
  "skills": [
    "skills/owasp-audit"
  ],
  "sops": [
    "sops/pr-exorcist.md"
  ],
  "mcpServers": {
    "github-reader": {
      "command": "node",
      "args": ["./mcp/server.js"]
    }
  },
  "ui": {
    "entry": "dist/index.mjs",
    "pages": [
      {
        "route": "/apps/grimoire-pr-exorcist",
        "label": "PR Exorcist",
        "icon": "Shield"
      }
    ]
  },
  "permissions": {
    "api": ["/api/status"],
    "events": ["notification"]
  }
}
```

### Required & Key Fields:
- `name` *(string, required)*: Unique kebab-case identifier.
- `version` *(string, required)*: Semver (`"1.0.0"`).
- `displayName`, `description`, `author`, `iconPath` *(string)*.
- `agents` *(string[])*: Relative paths to agent JSON/MD files.
- `skills` *(string[])*: Relative paths to skill directories containing `SKILL.md`.
- `sops` *(string[])*: Relative paths to SOP Markdown workflow files.
- `mcpServers` *(object)*: App-owned MCP server declarations (same structure as `mcp.json`).
- `ui` *(object, optional)*: Included when the app ships a custom React dashboard bundle built with `@kirocrew/app-sdk`.
- `permissions` *(object)*: Capability allowlist enforced by Kiro Crew Gateway:
  - `permissions.api` *(string[])*: Allowed API paths for `useAppApi()`.
  - `permissions.events` *(string[])*: Allowed WebSocket event channels for `useAppEvents()`.

---

## 2. Custom Agent Schema (`agents/<name>.json` or `.kiro/agents/<name>.json`)

```json
{
  "name": "grimoire-security-auditor",
  "description": "Audits pull requests for OWASP vulnerabilities and hardcoded secrets.",
  "prompt": "You are a senior AppSec engineer. Analyze code strictly based on evidence.",
  "model": "claude-sonnet-4.6",
  "tools": ["read", "web", "@github-reader"],
  "excludedTools": ["shell"],
  "permissions": {
    "rules": [
      {
        "capability": "fs_read",
        "match": [".env", ".env.*", "**/*.pem", "**/*secret*"],
        "effect": "deny"
      },
      {
        "capability": "shell",
        "match": ["rm -rf *", "sudo *"],
        "effect": "deny"
      }
    ]
  },
  "resources": [
    "skill://owasp-audit",
    "file://sops/pr-exorcist.md"
  ],
  "includeMcpJson": true,
  "welcomeMessage": "Security Auditor ready. Share a PR or repository to begin."
}
```

### Key Fields:
- `name` *(string, required)*, `description`, `prompt`, `model`.
- `tools` *(string[])*: Allowed tool categories/selectors (`read`, `write`, `shell`, `web`, `@builtin`, `@server-name`).
- `excludedTools` *(string[])*: Explicitly blocked tools.
- `permissions.rules` *(array)*: Capability-based rules (`capability`, `match: string[]`, `effect: "allow" | "deny"`).
- `resources` *(string[])*: Context URIs (`file://...`, `skill://...`).
- `mcpServers`, `includeMcpJson`, `includePowers`, `welcomeMessage`.

---

## 3. Kiro Hooks v1 Schema (`.kiro/hooks/<name>.json`)

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "grimoire-env-secret-ward",
      "description": "Blocks reading .env files and detects prompt-injection/secret leaks before tool execution.",
      "trigger": "PreToolUse",
      "matcher": "read|shell|@mcp",
      "action": {
        "type": "command",
        "command": "node scripts/grimoire-ward-guard.mjs"
      },
      "timeout": 30,
      "enabled": true
    }
  ]
}
```

### Official Rules to Enforce in Compiler:
- `version`: MUST be `"v1"`.
- `hooks`: Array of hook objects:
  - `name` *(string, required)*, `description` *(optional)*.
  - `trigger` *(required, PascalCase)*: `"PreToolUse"`, `"PostToolUse"`, `"PostFileSave"`, `"Stop"`.
  - `matcher` *(optional)*: Tool selector / regex (e.g., `"shell|execute_cmd"`, `"@mcp"`).
  - `action`:
    - `{ "type": "command", "command": "..." }` — receives tool payload on `STDIN`.
    - `{ "type": "agent", "prompt": "..." }` — injects prompt.
  - `timeout` *(number, seconds, default 60)*, `enabled` *(boolean, default true)*.
- **Blocking Semantics:**
  - `PreToolUse` **can block** tool invocation when the command exits with **exit code `2`** (without leaking raw `.env` values into agent context!).
  - `PostToolUse` is **non-blocking** (for auditing, logging, or safe metadata notifications).

---

## 4. MCP Configuration Schema (`.kiro/settings/mcp.json`)

```json
{
  "mcpServers": {
    "local-server-name": {
      "command": "node",
      "args": ["./mcp/server.js"],
      "env": {
        "API_TOKEN": "${API_TOKEN}"
      },
      "disabled": false,
      "autoApprove": ["read_file"],
      "disabledTools": ["delete_file"]
    },
    "remote-server-name": {
      "url": "https://mcp.example.com/sse",
      "headers": {
        "Authorization": "Bearer ${MCP_TOKEN}"
      },
      "disabled": false,
      "autoApprove": [],
      "disabledTools": []
    }
  }
}
```

> **Security Rule for Compiler:** Never emit literal secrets in `env` or `headers` — always emit `${ENV_VAR}` placeholders!

---

## 5. Skill File Format (`skills/<slug>/SKILL.md`)

```markdown
---
name: owasp-audit
description: Checklist and evidence-based procedure for auditing code against OWASP Top 10 and secret exposure.
---

# OWASP Security Audit Skill

## Steps
1. Inspect input handling, authentication boundaries, and outbound HTTP calls.
2. Flag hardcoded credentials without printing raw secret values.
3. Return findings grouped by severity (Critical, High, Medium, Low).
```

---

## 6. SOP File Format (`sops/<ritual-slug>.md`)

Structured Markdown Standard Operating Procedure describing:
- Trigger conditions (Manual / Cron schedule)
- Step-by-step agent handoff order (Conductor -> Workers -> Relics)
- Error/timeout retry & fallback rules (compiled from Modul 3 resilience settings!)
- Expected final deliverable format
