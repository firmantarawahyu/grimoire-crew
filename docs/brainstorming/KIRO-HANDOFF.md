# Kiro IDE / CLI Handoff Context — GrimoireCrew (Kiroween 2026)

> **Usage:** Place this file in your project root (or reference it in Kiro IDE/CLI chat) and run the **Kickoff Prompt** at the bottom so Kiro immediately has 100% project context, architecture rules, verified schemas, and Day-1 Spec tasks.
> **Related Reference Files in Workspace:**
> - `1. Brainstorming-Idea/kiroween-2026-docs.md` (Hackathon rules, prizes, judging rubric, deadlines)
> - `1. Brainstorming-Idea/kiro-crew-schemas.md` (Verified official Kiro & Kiro Crew file schemas)

---

## 1. Mission & Hackathon Constraints (Kiroween 2026)

- **Project Name:** **GrimoireCrew**
- **Event:** **Kiroween 2026** (Hosted by Kiro / AWS on Devpost)
- **Deadline:** **December 4, 2026 at 2:00 PM PST** (**December 5, 2026 at 05:00 WIB**) — ~13 days solo build.
- **Target Tracks & Prize Stacking:**
  - Primary Category: **Frankenstein** ($5,000) + Overall ($10k–$30k)
  - Stackable Bonuses: **Best Student Project — Frankenstein** ($1,500 + 1-yr Kiro Pro Max), **Best Kiro Crew App** ($1,000), **Best Demo** ($1,000), **Blog Post Bonus** (`dev.to/kirodotdev`, `#KiroweenHackathon26`).
- **CRITICAL SUBMISSION RULES (NEVER VIOLATE):**
  1. Brand-new code built entirely within the hackathon window.
  2. Public **GitHub** repository with an OSI-approved **MIT License** (`LICENSE` at root).
  3. **`.kiro/` directory MUST be committed at the repository root — NEVER add `.kiro/` or its subfolders to `.gitignore`!**
  4. Never commit real API keys or `.env` files (use `.env.example` and `${ENV_VAR}` placeholders).
  5. Judging is 5 equal pillars (20% each): *Potential Impact*, *Technological Implementation (deep Kiro usage)*, *Design*, *Innovation/Idea*, and *Presentation (<= 3-min public video demo)*.

---

## 2. Product Concept & Positioning

- **One-Line Summary:**
  *A lightweight 2D Dark-Alchemy Visual Studio, Red-Team Curse Testing Sandbox, and Deterministic Compiler for designing, running, stress-testing, and exporting real Kiro & Kiro Crew multi-agent workflows.*
- **Companion, NOT a Duplicate/Wrapper:**
  - Kiro & Kiro Crew remain the execution OS; **GrimoireCrew** is the visual authoring studio, permission compiler, and security red-team lab built on top of it.
  - Always **bootstrap from existing Kiro / Kiro Crew state first** (reuse existing agents/skills/MCPs instead of duplicating them) and namespace all compiled outputs cleanly (`grimoire-*`).

---

## 3. Locked Technical Decisions

| Decision | Final Choice | Rationale |
|---|---|---|
| **Language & Repo** | **Full TypeScript `pnpm` Monorepo** | Single Zod schema & compiler shared across browser (0ms live preview/ZIP) and server; native match for `@kirocrew/app-sdk`. |
| **Frontend UI** | **Lightweight 2D Alchemist GUI** (Vite + React + `@xyflow/react` + Tailwind + Animated SVG + CSS Candlelight) | **NO 3D WebGL (Three.js)** and **NO Rust/GPUI**. Keeps RAM ~50–80 MB, 60fps everywhere, sharp code readability, and 100% compatible with Kiro Crew Dashboard tabs. |
| **Audio** | **Procedural WebAudio API DSP** | Zero static MP3/WAV files; lightweight synthesized ambience (hearth/rain) + event sonification (`agent_thinking`, `tool_called`, `ward_blocked`, `curse_breached`, `ritual_complete`) with mute/volume control. |
| **Backend Server** | **Node.js + Hono + TypeScript + SSE** (`apps/server`) | Lightweight real agent runner & Server-Sent Events telemetry stream for Mode A standalone web demo. |
| **LLM Provider** | **OpenRouter (Free Tier Models)** + BYOK option + **Deterministic Demo Replay Fallback** | Zero-cost live agent execution + rate-limit-proof fallback for hackathon judges. |
| **Kiro Crew App** | **Native Kiro Crew App (`apps/crew-app`)** using `@kirocrew/app-sdk` | Reuses 90% shared UI (`packages/ui`) + `app.json` + built-in Arch-Familiar agent. |

### Target Monorepo Layout
```text
grimoire-crew/
├── .kiro/
│   ├── specs/                      # 01 to 05 structured specs (requirements.md, design.md, tasks.md)
│   ├── steering/                   # architecture.md, kiro-crew-schemas.md, security-zero-secret.md, alchemist-ui-audio.md
│   ├── hooks/                      # compiler-schema-test.json, env-secret-ward.json, kiro-submission-guard.json
│   └── settings/
│       └── mcp.json
├── packages/
│   ├── core/                       # Zod Graph Schema, Official Kiro/Crew Compiler, Static Linter, Curse Engine, .kiro/ Importer, Vitest tests
│   └── ui/                         # Shared 2D Alchemist GUI (React Flow, SVG animations, Candlelight, Arch-Familiar panel, WebAudio DSP, Transmutation Inspector)
├── apps/
│   ├── web/                        # Mode A: Standalone Web Demo entry (Vite)
│   ├── server/                     # Mode A: Hono backend (OpenRouter runner, Built-in Relics, Curse middleware, SSE stream)
│   └── crew-app/                   # Mode B: Native Kiro Crew App (app.json, agents/, skills/, dist/index.mjs via @kirocrew/app-sdk)
├── LICENSE                         # MIT License
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 4. Detailed Module Scope (Modules 1–6)

### Module 1 — Buku Grimoire (Nodes, Arch-Familiar, Kiro State Bootstrap)
- **3-Tier Bootstrap:**
  1. *Kiro Crew Host (`@kirocrew/app-sdk`):* read live gateway agents/skills/status via `useAppApi()`.
  2. *Local `.kiro/` Repo:* parse `.kiro/settings/mcp.json`, `.kiro/hooks/*.json`, `.kiro/steering/*.md`, `app.json`.
  3. *Public Web Demo:* load *Default Kiro Workspace Snapshot* + manual *Import `.kiro/` / `app.json`* upload button.
- **8 Core MVP Node Types:**
  1. `manual_ritual` (Trigger: prompt/URL/text input)
  2. `cron_ritual` (Trigger: cron expression)
  3. `conductor` (Agent: breaks goal into Work Ledger & delegates to workers)
  4. `worker_agent` (Agent: supports **Reuse Existing Kiro Agent** OR **Specialist Custom** — `name`, `persona`, `task`, `model`, `maxSteps: 3–5`, `outputFormat`)
  5. `skill_tome` (`SKILL.md` module — 4 built-in templates + custom Markdown)
  6. `builtin_relic` (Real executable tools: `GitHub Public Repo Reader`, `Web Page Fetcher`, `Webhook / Discord Notifier`)
  7. `custom_mcp_relic` (Local/Remote MCP server definition matching `mcp.json`)
  8. `ward_hook` (`PreToolUse` / `PostToolUse` guardrail with 3 toggles: *Prompt Injection Filter*, *Secret/.env Leak Blocker*, *Permission Allowlist Gate*)
- **Zero-Friction Authoring:**
  - **3 Ready-to-Run Presets:** *PR Exorcist Coven*, *Thesis Alchemist*, *Bug Necromancer*.
  - **Built-in Arch-Familiar** (Default Meta-Agent like Dr. Eggbot): Conversational architect with 6 structured graph commands (`generate_full_grimoire`, `upsert_node`, `delete_node`, `connect_nodes`, `diagnose_and_patch_curse`, `explain_current_workflow`).

### Module 2 — Lightweight 2D Alchemist GUI & Procedural WebAudio
- 3-column layout: Left (**Grimoire Palette** — Existing Kiro State, Presets, Core Nodes), Center (**Living Rune Canvas** via `@xyflow/react` with animated SVG mana pulses & shield deflect VFX), Right (**Arch-Familiar Chat / Node Inspector / Live Work Ledger & Output**).
- Header **Candlelight Status Indicator** (warm gold = idle, cyan/violet = active Conductor, red + subtle shake = Curse/Breach).
- **Procedural WebAudio DSP** with Mute/Volume toggle (ambience + event SFX).

### Module 3 — Curse / Red-Team Chaos Engine (The Killer Twist)
- **4 Deterministic Curses:**
  1. `prompt_injection` — injects adversarial payload into input/tool context -> tested against `PreToolUse` Prompt Injection Filter.
  2. `secret_leak` — injects **dummy canary token** (`sk-kiro-CANARY-FAKE-...`) -> checks if token leaks into LLM prompt, final output, or outbound webhook.
  3. `rogue_permission` — attempts tool/endpoint call outside `app.json` allowlist -> tested against Permission Allowlist Gate.
  4. `tool_timeout` — simulates `503`/timeout on a Relic -> tests `retry` & `graceful fallback` configuration.
- **ABSOLUTE SECURITY INVARIANT (*Zero Raw Secret to Model Context*):**
  - Never read the user's real `.env` into agent/LLM context!
  - `PreToolUse` blocks `.env*` access before opening (`exit code 2`) and returns only safe metadata (`[WARD BLOCKED] Access to ".env" denied`).
  - `PostToolUse`/middleware redacts secrets locally (`[REDACTED_SECRET]`) before text reaches OpenRouter or any webhook.
- **UX Modes:** *Single Curse Attack* + *Full Gauntlet (0–100% Resilience Score)* + `BreachReport` + **1-Click Auto-Heal** by Arch-Familiar.

### Module 4 — Transmutation Circle (Verified Official Kiro & Kiro Crew Compiler)
- Pure deterministic TypeScript compiler in `packages/core` + Static Linter (Errors & Security Warnings).
- **MUST conform strictly to official schemas in `1. Brainstorming-Idea/kiro-crew-schemas.md`:**
  - `app.json`: `name`, `version`, `displayName`, `description`, `author`, `iconPath`, `agents[]`, `skills[]`, `sops[]`, `mcpServers{}`, optional `ui{}`, and **auto-calculated least-privilege `permissions: { api[], events[] }`**.
  - `agents/<name>.json`: `name`, `description`, `prompt`, `model`, `tools[]`, `excludedTools[]`, `permissions: { rules: [{ capability, match[], effect: "allow" | "deny" }] }`, `resources[]` (`skill://...`, `file://...`), `includeMcpJson`, `welcomeMessage`.
  - `skills/<slug>/SKILL.md`: YAML frontmatter (`name`, `description`) + Markdown instructions.
  - `sops/<ritual>.md`: Step-by-step workflow + retry/fallback procedures.
  - `.kiro/hooks/<name>.json`: Official `version: "v1"` with `hooks[]` (`name`, `description`, `trigger`, `matcher`, `action: { type: "command" | "agent", ... }`, `timeout`, `enabled`) — `PreToolUse` guard scripts exit with **code `2`** to block!
  - `scripts/grimoire-ward-guard.mjs`: Runnable Node guard script reading `STDIN` and exiting `2` on `.env`/secret/injection violations.
  - `.kiro/settings/mcp.json`: Official `mcpServers` local/remote schema using `${ENV_VAR}` placeholders only.
- Export via **Live Code Inspector**, **Instant `.zip` Download (`jszip`)**, and optional **Local Workspace Sync**.

### Module 5 — Dual Execution Runtime (Mode A & Mode B)
- **Mode A (`apps/web` + `apps/server`):** Real execution! Calls real tools (GitHub Public API, Web Fetch, Webhook) + OpenRouter LLM -> produces **real agent Markdown/JSON responses** + SSE telemetry + Resilience Reports + `.zip` package export. Includes **Demo Replay Fallback** if free-tier OpenRouter rate-limits.
- **Mode B (`apps/crew-app`):** Native Kiro Crew App (`dist/index.mjs` + `app.json`) built with `@kirocrew/app-sdk` (`useAppApi`, `useAppEvents`, `useChatLauncher`, `useTheme`, `useNotify`) + bundled `agents/grimoire-arch-familiar.json` and `skills/grimoire-architect/SKILL.md`.

### Module 6 — `.kiro/` Discipline (Dogfooding!)
- Commit `.kiro/specs/` (5 specs), `.kiro/steering/` (4 steering files), `.kiro/hooks/` (3 active hooks: compiler test on save, `.env` PreToolUse ward, `.gitignore` `.kiro/` submission guard), and `.kiro/settings/mcp.json`.

---

## 5. Immediate Next Steps for Kiro IDE / CLI (Day 1 — Nov 22, 2026)

1. Confirm the **Arch-Familiar's name** (if not yet chosen by user, default to **Vesper** and keep configurable).
2. Create project directory `grimoire-crew/` with `LICENSE` (MIT), `.gitignore` (explicitly NOT ignoring `.kiro/`), `pnpm-workspace.yaml`, and root `package.json`.
3. Create `.kiro/steering/` files (`architecture.md`, `kiro-crew-schemas.md`, `security-zero-secret.md`, `alchemist-ui-audio.md`) and `.kiro/hooks/` (`compiler-schema-test.json`, `env-secret-ward.json`, `kiro-submission-guard.json`).
4. Generate Spec 01 (`.kiro/specs/01-core-schema-and-compiler/` with `requirements.md`, `design.md`, `tasks.md`) and begin building `packages/core` first with full Vitest schema validation tests!
