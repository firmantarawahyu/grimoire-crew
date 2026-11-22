# Requirements Document

## Introduction

This spec covers `@grimoire-crew/core` (`packages/core`): the platform-neutral heart of GrimoireCrew. It defines the Grimoire graph model that the studio edits, lints the graph for structural and security problems, compiles it into real Kiro and Kiro Crew files for two targets, and imports those files back into a graph. Later specs build on it: the studio UI (Spec 02), the curse engine (Spec 03), the server runtime and Vesper (Spec 04), and the Kiro Crew App (Spec 05).

The output formats follow `.kiro/steering/kiro-crew-schemas.md`, which was verified against the official Kiro documentation on 2026-11-22.

Out of scope for this spec: executing agents, the curse engine, UI, ZIP packaging, and writing files to disk. Merging compiled files into an existing workspace (for example an existing `.kiro/settings/mcp.json`) belongs to the export feature in Spec 02 and Spec 04, which will preview the changes and merge them safely.

## Glossary

- **Core**: the `@grimoire-crew/core` package.
- **Grimoire_Graph**: a workflow graph made of metadata, Nodes, and Edges.
- **Node**: one element of a Grimoire_Graph. It has a unique `id` and one of eight `type` values.
- **Trigger_Node**: a Node of type `manual_ritual` or `cron_ritual`.
- **Agent_Node**: a Node of type `conductor` or `worker_agent`.
- **Custom_Worker**: a `worker_agent` in `custom` mode, compiled into its own agent file.
- **Reuse_Worker**: a `worker_agent` in `reuse` mode, which points at an agent that already exists in Kiro and is never emitted.
- **Network_Relic**: a `builtin_relic` of kind `github_repo_reader` or `web_page_fetcher`, or a `custom_mcp_relic` with a remote URL.
- **Edge**: a directed link `{ id, source, target }` between two Nodes.
- **Edge_Matrix**: the table of allowed `(source type, target type)` pairs defined in Requirement 4.
- **Studio_Sidecar**: studio-only data with no Kiro equivalent (layout, viewport, runtime models, default ritual inputs), stored as `grimoire/<slug>.studio.json`.
- **FileMap**: a `Record<string, string>` from a POSIX relative path to UTF-8 file text.
- **Target**: the compile target, either `crew-app` (a Kiro Crew App package) or `kiro-workspace` (files for a Kiro workspace's `.kiro/` folder).
- **Linter**: the Core function `lint(graph, options)` that returns Diagnostics.
- **Compiler**: the Core function `compile(input, options)` that returns a FileMap and Diagnostics.
- **Importer**: the Core function `importFiles(files)` that returns a Grimoire_Graph, a Studio_Sidecar, an Inventory, a passthrough FileMap, and Diagnostics.
- **Diagnostic**: a finding `{ code, severity, message, nodeId?, edgeId?, path?, fix? }`.
- **Blocking_Diagnostic**: a Diagnostic with severity `error` or `security`.
- **Secret_Pattern**: one of the secret-looking literal patterns listed in Requirement 5.
- **Placeholder**: a `${VAR}` reference that Kiro expands at runtime.
- **Baseline_Deny_Rule**: the permission rule `{ capability: "fs_read", match: ["**/.env", "**/.env.*"], exclude: ["**/.env.example"], effect: "deny" }`.
- **Ward_Guard_Script**: the generated zero-dependency Node script `scripts/grimoire-ward-guard.mjs`.
- **Contract_Schema**: a Zod schema for one official output format (`app.json`, agent JSON, hooks v1, `mcp.json`, `SKILL.md` front matter, steering front matter).
- **Grimoire_File**: a file whose path and content follow the GrimoireCrew naming and layout rules, so the Importer can parse it strictly.
- **Foreign_File**: any input file that is not a Grimoire_File.
- **Inventory**: a summary of existing Kiro state found in Foreign_Files (agents, skills, MCP servers, hooks, steering), used by the studio palette.
- **Normalized_Graph**: a Grimoire_Graph with defaults applied and Nodes and Edges sorted by `id`.

## Requirements

### Requirement 1: Graph model

**User Story:** As a studio user, I want every workflow I draw to have one precise, validated shape, so that the linter, compiler, curse engine, and UI all agree on what a workflow is.

#### Acceptance Criteria

1. THE Core SHALL define a Grimoire_Graph schema with the fields `schemaVersion` (the literal `1`), `slug`, `displayName`, `description`, `author`, `version`, `nodes`, and `edges`.
2. THE Core SHALL accept `slug` and every Node `id` only when each matches `^[a-z0-9]+(?:-[a-z0-9]+)*$` and is at most 24 characters long.
3. THE Core SHALL accept `version` only when it matches semantic version `X.Y.Z`.
4. THE Core SHALL define Nodes as a union discriminated on `type` with exactly these types: `manual_ritual`, `cron_ritual`, `conductor`, `worker_agent`, `skill_tome`, `builtin_relic`, `custom_mcp_relic`, `ward_hook`.
5. THE Core SHALL define a `manual_ritual` with `label` and `inputKind` (`prompt`, `url`, or `text`).
6. THE Core SHALL define a `cron_ritual` with `label`, `message`, `enabledOnInstall` (default `false`), and exactly one of `cron` (a five-field cron expression) or `everySeconds` (an integer of at least 60).
7. THE Core SHALL define a `conductor` with `name`, `goal`, an optional `kiroModel`, and `maxSteps` (an integer from 3 to 10, default 6).
8. THE Core SHALL define a `worker_agent` in `reuse` mode with `existingAgentName`, and in `custom` mode with `name`, `persona`, `task`, an optional `kiroModel`, `maxSteps` (an integer from 3 to 5, default 3), and `outputFormat` (`markdown` or `json`, default `markdown`).
9. THE Core SHALL define a `skill_tome` with `slug` (kebab-case, at most 32 characters), `description`, `template` (a built-in template ID or `custom`), and `body`.
10. THE Core SHALL define a `builtin_relic` with `relic` (`github_repo_reader`, `web_page_fetcher`, or `webhook_notifier`), `retry` (`attempts` from 0 to 5, default 2; `backoffMs` from 0 to 60000, default 1000), `fallback` (`skip`, `abort`, or `cached`, default `skip`), and `allowedHosts` (host names, optionally with a leading `*.`).
11. THE Core SHALL define a `custom_mcp_relic` with `serverName`, `autoApprove`, `disabledTools`, and exactly one transport: local (`command`, `args`, `env`) or remote (`url`, `headers`).
12. THE Core SHALL define a `ward_hook` with `trigger` (`PreToolUse` or `PostToolUse`), `matcher`, and the boolean toggles `promptInjectionFilter`, `secretLeakBlocker`, and `permissionAllowlistGate`.
13. THE Core SHALL reject `persona`, `task`, and `goal` text that contains a line starting with `## `, so the compiled prompt headings stay parseable.
14. WHEN `parseGraph` receives input that violates the schema, THE Core SHALL return a failure result with one `GC-E000` Diagnostic per violation, each carrying the JSON path of the violation, and SHALL NOT throw.
15. WHEN `parseGraph` receives valid input with optional fields omitted, THE Core SHALL return the graph with every documented default applied.

### Requirement 2: Studio sidecar

**User Story:** As a studio user, I want my canvas layout and runtime-only settings to survive export and re-import, so that reopening a grimoire looks the way I left it.

#### Acceptance Criteria

1. THE Core SHALL define a Studio_Sidecar schema with `schemaVersion` (the literal `1`), `graphSlug`, `positions` (Node `id` to finite `{ x, y }`), `viewport` (`{ x, y, zoom }` with `zoom` greater than 0), `runtimeModels` (Node `id` to an OpenRouter model ID), and `ritualInputs` (Node `id` to default input text).
2. WHEN a Studio_Sidecar is passed to the Compiler, THE Compiler SHALL emit it as `grimoire/<slug>.studio.json` with keys sorted and entries for unknown Node `id`s removed.
3. THE Compiler SHALL never write Studio_Sidecar data (for example `runtimeModels`) into any agent, manifest, hook, or MCP file.
4. IF a Studio_Sidecar's `graphSlug` differs from the graph's `slug`, THEN THE Compiler SHALL report `GC-W008` and SHALL NOT emit the sidecar.

### Requirement 3: Diagnostics contract

**User Story:** As the Vesper meta-agent and the studio UI, I want every finding to have a stable code and an optional machine-readable fix, so that I can explain and auto-heal problems reliably.

#### Acceptance Criteria

1. THE Core SHALL represent every Diagnostic as `{ code, severity, message, nodeId?, edgeId?, path?, fix? }`, where `severity` is `error`, `security`, `warning`, or `info`.
2. THE Core SHALL use codes matching `^GC-[ESWI]\d{3}$`, where the letter matches the severity (`E` error, `S` security, `W` warning, `I` info).
3. THE Core SHALL export a `DIAGNOSTIC_CATALOG` that lists every code with its severity and a one-line meaning, and every emitted Diagnostic SHALL use a code from that catalog.
4. WHERE a deterministic repair exists, THE Core SHALL attach a `fix` with one operation (`delete_edge`, `delete_node`, `set_field`, or `connect_nodes`) and its arguments.
5. THE Core SHALL return Diagnostics sorted by severity (security, error, warning, info), then by code, then by `nodeId`, then by `path`.
6. THE Core SHALL never include a matched secret value in any Diagnostic `message`, `path`, or `fix`.

### Requirement 4: Structural linting

**User Story:** As a studio user, I want broken wiring caught before I export, so that every compiled workflow can actually run.

#### Acceptance Criteria

1. THE Linter SHALL allow only these Edges (the Edge_Matrix):
   - Trigger_Node to `conductor` or `worker_agent`.
   - `conductor` to `worker_agent`, `skill_tome`, `builtin_relic`, or `custom_mcp_relic`.
   - `worker_agent` to `skill_tome`, `builtin_relic`, or `custom_mcp_relic`.
   - `ward_hook` to `conductor` or `worker_agent`.
2. WHEN two Nodes share an `id`, THE Linter SHALL report `GC-E001`.
3. WHEN two Edges share an `id`, THE Linter SHALL report `GC-E002`.
4. WHEN an Edge references a Node `id` that does not exist, THE Linter SHALL report `GC-E003` with a `delete_edge` fix.
5. WHEN an Edge connects a pair of Node types that the Edge_Matrix does not allow, THE Linter SHALL report `GC-E004` with a `delete_edge` fix.
6. WHEN a graph has more than one `conductor`, THE Linter SHALL report `GC-E005`.
7. WHEN a graph has no Trigger_Node, THE Linter SHALL report `GC-E006`.
8. WHEN a graph has no Agent_Node, THE Linter SHALL report `GC-E007`.
9. WHEN an Agent_Node cannot be reached from any Trigger_Node by following Edges, THE Linter SHALL report `GC-E008` for that Node.
10. WHEN two `skill_tome` Nodes share a `slug`, THE Linter SHALL report `GC-E009`.
11. WHEN two `custom_mcp_relic` Nodes share a `serverName`, THE Linter SHALL report `GC-E010`.
12. WHEN a `conductor` has no Edge to a `worker_agent`, THE Linter SHALL report `GC-E011`.
13. WHEN two Edges have the same `source` and `target`, THE Linter SHALL report `GC-W001` with a `delete_edge` fix for the later Edge.
14. WHEN a `skill_tome`, relic, or `ward_hook` Node has no Edges, THE Linter SHALL report `GC-W002`.
15. WHEN a `skill_tome`, relic, or `ward_hook` is connected to a Reuse_Worker, THE Linter SHALL report `GC-W004`, because a Reuse_Worker's file is never emitted.
16. WHEN a `web_page_fetcher` or `webhook_notifier` relic has no `allowedHosts`, THE Linter SHALL report `GC-W007`.

### Requirement 5: Security linting and zero-secret output

**User Story:** As a security-minded builder, I want any secret I paste by mistake to stop the export, so that no real credential ever reaches a compiled file or a model prompt.

#### Acceptance Criteria

1. THE Core SHALL detect these Secret_Patterns:
   - `sk-` keys of at least 20 characters (including `sk-or-v1-`).
   - GitHub tokens (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_`, `github_pat_`).
   - AWS access key IDs (`AKIA` or `ASIA` followed by 16 characters).
   - Slack tokens (`xoxa-`, `xoxb-`, `xoxp-`, `xoxr-`, `xoxs-`).
   - PEM private-key headers.
   - Discord webhook URLs.
   - The GrimoireCrew canary prefix `sk-kiro-CANARY-FAKE-` followed by at least one alphanumeric character.
2. WHEN any string field of the graph or of any Node matches a Secret_Pattern, THE Linter SHALL report `GC-S001` with the `nodeId` and the field `path`.
3. WHEN a `custom_mcp_relic` `env` or `headers` value contains no Placeholder, THE Linter SHALL report `GC-S002`.
4. WHEN a remote `custom_mcp_relic` URL does not use `https`, and its host is not `localhost` or `127.0.0.1`, THE Linter SHALL report `GC-S003`.
5. WHEN an Agent_Node is connected to a Network_Relic and to no `ward_hook` with `permissionAllowlistGate` enabled, THE Linter SHALL report `GC-W005`.
6. WHEN a `ward_hook` with trigger `PostToolUse` enables `secretLeakBlocker` or `permissionAllowlistGate`, THE Linter SHALL report `GC-W006`, because `PostToolUse` hooks cannot block a tool call.
7. THE Compiler SHALL produce no file whose text matches a Secret_Pattern.

### Requirement 6: Compile API and blocking

**User Story:** As the studio and the server, I want one compile call that either returns a complete package or explains why it cannot, so that a half-valid workflow is never exported.

#### Acceptance Criteria

1. THE Compiler SHALL expose `compile(input, { target, studio? })`, returning `{ ok, files, diagnostics }`, where `files` is a FileMap.
2. WHEN `input` fails `parseGraph`, THE Compiler SHALL return `ok: false`, an empty FileMap, and the `GC-E000` Diagnostics.
3. WHEN linting reports any Blocking_Diagnostic, THE Compiler SHALL return `ok: false` and an empty FileMap.
4. WHEN linting reports no Blocking_Diagnostic, THE Compiler SHALL return `ok: true`, the complete FileMap for the target, and every lint Diagnostic, including warnings and info.
5. THE Linter SHALL take the target as an option and report target-specific Diagnostics only for that target.
6. THE Compiler SHALL not throw for any input.

### Requirement 7: Determinism

**User Story:** As a developer reviewing exports, I want the same workflow to compile to byte-identical files every time, so that diffs, golden tests, and ZIP hashes are meaningful.

#### Acceptance Criteria

1. WHEN `compile` runs twice on equal inputs, THE Compiler SHALL return byte-identical FileMaps.
2. WHEN the order of `nodes` or `edges` changes and nothing else does, THE Compiler SHALL return a byte-identical FileMap.
3. THE Compiler SHALL emit FileMap keys as POSIX relative paths without `..` segments or a leading `/`, inserted in ascending lexicographic order.
4. THE Compiler SHALL emit text with LF line endings and exactly one trailing newline, and JSON with 2-space indentation.
5. THE Compiler SHALL emit object keys in the order defined for each Contract_Schema in the design.
6. THE Compiler SHALL not read the clock, random numbers, the environment, or any external state.

### Requirement 8: Agent and skill files

**User Story:** As a Kiro user, I want each agent in my workflow to become a least-privilege Kiro agent with a readable prompt, so that I can run it in Kiro or Kiro Crew and trust what it may do.

#### Acceptance Criteria

1. THE Compiler SHALL emit one agent file for each `conductor` and each Custom_Worker, named `grimoire-<slug>-<id>`, and SHALL emit no file for a Reuse_Worker.
2. THE Compiler SHALL build a Custom_Worker prompt from a `# <name>` title followed by the headings `## Persona`, `## Task`, `## Output Format`, and `## Limits`, in that order, with `maxSteps` stated under `## Limits`.
3. THE Compiler SHALL build a `conductor` prompt from a `# <name>` title followed by the headings `## Goal`, `## Delegation`, `## Work Ledger`, and `## Limits`, in that order.
4. WHEN `kiroModel` is set, THE Compiler SHALL emit it as the agent `model`; otherwise THE Compiler SHALL omit `model`.
5. THE Compiler SHALL include the Baseline_Deny_Rule in every emitted agent's `permissions.rules`.
6. WHEN a `conductor` has Edges to workers, THE Compiler SHALL add `subagent/<agent name>` to its `tools` for each worker, plus one `subagent` allow rule that lists those names. The agent name is the compiled name for a Custom_Worker and `existingAgentName` for a Reuse_Worker.
7. WHEN an Agent_Node is connected to a `github_repo_reader` or `web_page_fetcher` relic, THE Compiler SHALL add `web_fetch` to its `tools` and one `web_fetch` allow rule for that relic's `allowedHosts`.
8. WHEN an Agent_Node is connected to a `custom_mcp_relic`, THE Compiler SHALL add `@<serverName>` to its `tools`.
9. WHEN an Agent_Node is connected to a `ward_hook` with `permissionAllowlistGate`, THE Compiler SHALL add a `web_fetch` deny rule that matches every URL and excludes the agent's allowed hosts.
10. WHEN an Agent_Node is connected to a `ward_hook` with `secretLeakBlocker`, THE Compiler SHALL add `fs_read` deny rules for private-key files (`**/*.pem`, `**/*.key`) and secret-named files (`**/*secret*`).
11. THE Compiler SHALL emit each `skill_tome` as `grimoire-<skill slug>/SKILL.md`, with YAML front matter `name: grimoire-<skill slug>` and `description`, followed by `body`.
12. THE Compiler SHALL emit `tools` in a canonical order: built-in tool IDs sorted, then `@<server>` selectors sorted, then `subagent/<name>` entries sorted.

### Requirement 9: SOP file

**User Story:** As a Kiro user reading an exported workflow, I want one human-readable procedure that explains the whole ritual, so that I can follow, audit, and re-import it.

#### Acceptance Criteria

1. THE Compiler SHALL emit one SOP per graph with a `# <displayName>` title and these sections in order: `## Grimoire`, `## Trigger`, `## Agents`, `## Topology`, `## Skills`, `## Relics`, `## Wards`, `## Deliverable`.
2. THE SOP `## Grimoire` section SHALL record `slug`, `version`, `author`, and `description`.
3. THE SOP SHALL list every Trigger_Node, Agent_Node (in handoff order), Edge, `skill_tome`, relic, and `ward_hook` in Markdown tables that include every field the Importer needs and that is not stored in another emitted file.
4. THE Compiler SHALL list agents in handoff order: a topological order from the triggers, with ties broken by `id`.
5. THE SOP `## Relics` table SHALL state each relic's retry attempts, backoff, fallback, and allowed hosts, and SHALL mark `webhook_notifier` relics as runtime-only.
6. THE Compiler SHALL escape `|` as `\|` and line breaks as `<br>` inside table cells.

### Requirement 10: Kiro Crew App target

**User Story:** As a Kiro Crew user, I want a workflow to export as an installable Kiro Crew App, so that I can run it inside my Crew gateway.

#### Acceptance Criteria

1. WHEN compiling for `crew-app`, THE Compiler SHALL emit:
   - `app.json`
   - `agents/grimoire-<slug>-<id>.json` for each emitted agent
   - `skills/grimoire-<skill slug>/SKILL.md` for each `skill_tome`
   - `sops/grimoire-<slug>.md`
2. THE Compiler SHALL emit `app.json` with:
   - `name: grimoire-<slug>`, plus `version`, `displayName`, `description`, and `author` from the graph.
   - `agents`, `skills`, and `sops` listing every emitted path.
   - `platform.os: ["macos", "linux", "windows"]`.
3. THE Compiler SHALL emit `app.json` `permissions` with `api: []`, `events: []`, and `network: true` only when the graph contains a Network_Relic, otherwise `network: false`.
4. WHEN the graph has a `cron_ritual`, THE Compiler SHALL emit an `app.json` `crons` entry with `name: grimoire-<slug>-<id>`, `cron_expr` or `every`, `message`, `agent` (the agent name of the cron's target Agent_Node), and `enabled` set from `enabledOnInstall`.
5. WHEN the graph has a `custom_mcp_relic`, THE Compiler SHALL emit it under `app.json` `mcpServers` with its transport fields, `autoApprove`, and `disabledTools`.
6. THE Compiler SHALL reference each agent's connected skills through the agent field `"skills": ["grimoire-<skill slug>", ...]` and SHALL set `includeMcpJson: false`.
7. THE Compiler SHALL omit `iconPath` and report `GC-I003`.
8. WHEN the graph has a `webhook_notifier`, THE Compiler SHALL report `GC-I001`; WHEN a `ward_hook` enables `promptInjectionFilter`, THE Compiler SHALL report `GC-I002`, because neither can be enforced by Kiro Crew.

### Requirement 11: Kiro workspace target

**User Story:** As a Kiro IDE or CLI user, I want a workflow to export as `.kiro/` files, so that I can drop it into any repository and run it with Kiro.

#### Acceptance Criteria

1. WHEN compiling for `kiro-workspace`, THE Compiler SHALL emit:
   - `.kiro/agents/grimoire-<slug>-<id>.json` for each emitted agent
   - `.kiro/skills/grimoire-<skill slug>/SKILL.md` for each `skill_tome`
   - `.kiro/steering/grimoire-<slug>-sop.md`
2. THE Compiler SHALL give the SOP steering file the front matter `inclusion: manual` and SHALL add `file://.kiro/steering/grimoire-<slug>-sop.md` to the `conductor`'s `resources`.
3. THE Compiler SHALL reference each agent's connected skills as `skill://.kiro/skills/grimoire-<skill slug>/SKILL.md` in `resources`.
4. WHEN the graph has a `custom_mcp_relic`, THE Compiler SHALL emit `.kiro/settings/mcp.json` containing only the graph's MCP servers, and SHALL set `includeMcpJson: true` on agents connected to an MCP relic and `false` on the others.
5. WHEN the graph has a `ward_hook` connected to at least one Agent_Node, THE Compiler SHALL emit:
   - `.kiro/hooks/grimoire-<slug>-wards.json`: a valid hooks v1 file with one hook per connected `ward_hook`, using its `trigger` and `matcher`.
   - `scripts/grimoire-ward-guard.mjs`.
6. THE Compiler SHALL build each ward hook command as `node scripts/grimoire-ward-guard.mjs` followed by `--secret` when `secretLeakBlocker` is set, `--injection` when `promptInjectionFilter` is set, and one `--allow-host <host>` per allowed host of the connected agents when `permissionAllowlistGate` is set.
7. WHEN the graph has a `cron_ritual`, THE Compiler SHALL report `GC-W003` and SHALL emit no schedule, because Kiro workspaces have no cron mechanism.
8. WHEN the graph has a `webhook_notifier`, THE Compiler SHALL report `GC-I001`.

### Requirement 12: Ward guard script

**User Story:** As a workspace owner, I want a generated guard script with no dependencies, so that the wards I design run anywhere Node runs.

#### Acceptance Criteria

1. THE Core SHALL expose `renderWardGuard()`, which returns the Ward_Guard_Script text, identical on every call.
2. THE Ward_Guard_Script SHALL read the Kiro hook event JSON from STDIN, exit `2` with a `[WARD BLOCKED]` reason on stderr when a check enabled by its flags matches, and exit `0` otherwise.
3. WHEN run with `--secret`, THE Ward_Guard_Script SHALL block tool inputs that reference real `.env` files or that dump or print secret-named environment variables, matching the behavior of the Day-1 guard tests in `scripts/test/grimoire-ward-guard.test.mjs`.
4. WHEN run with `--injection`, THE Ward_Guard_Script SHALL block tool inputs containing the prompt-injection markers defined in the design.
5. WHEN run with one or more `--allow-host` flags, THE Ward_Guard_Script SHALL block web-fetch tool calls whose URL host is not one of the allowed hosts.
6. IF the Ward_Guard_Script fails internally (for example on invalid JSON), THEN it SHALL exit `0` with a warning on stderr that does not echo the input.
7. THE Ward_Guard_Script SHALL never print a secret value, a full file path, or a variable name it blocked.

### Requirement 13: Target contracts

**User Story:** As a maintainer, I want every output format checked against the official schema, so that a compiled package never fails to load in Kiro or Kiro Crew.

#### Acceptance Criteria

1. THE Core SHALL define Contract_Schemas for `app.json`, agent JSON, hooks v1, `mcp.json`, `SKILL.md` front matter, and steering front matter, following `.kiro/steering/kiro-crew-schemas.md`.
2. THE Core SHALL test each Contract_Schema against the example documents from the official Kiro docs, copied verbatim with their source URLs.
3. WHEN `compile` returns `ok: true`, every emitted file SHALL validate against its Contract_Schema.
4. THE Core SHALL keep unknown fields when validating `app.json`, because Kiro Crew preserves them.

### Requirement 14: Presets

**User Story:** As a first-time user, I want ready-to-run example workflows, so that I can see a working grimoire within seconds.

#### Acceptance Criteria

1. THE Core SHALL export three preset graphs: `pr-exorcist-coven`, `thesis-alchemist`, and `bug-necromancer`.
2. Each preset SHALL contain at least one Trigger_Node, one `conductor`, two `worker_agent` Nodes, one `skill_tome`, one `builtin_relic`, and one `ward_hook`.
3. THE three presets together SHALL use all eight Node types.
4. WHEN a preset is linted for either target, THE Linter SHALL report no Blocking_Diagnostic.
5. THE Core SHALL keep golden snapshots of each preset compiled for both targets.

### Requirement 15: Strict import and round-trip

**User Story:** As a studio user, I want to re-open any package GrimoireCrew exported, so that I can keep editing a workflow from its files alone.

#### Acceptance Criteria

1. THE Importer SHALL expose `importFiles(files)`, returning `{ graph, studio, inventory, passthrough, diagnostics }`, and SHALL not throw for any input.
2. WHEN `files` contains a root `app.json`, THE Importer SHALL treat it as the `crew-app` target. WHEN `files` contains paths under `.kiro/`, THE Importer SHALL treat it as the `kiro-workspace` target. When neither applies, THE Importer SHALL report `GC-E100`.
3. WHEN `files` is the output of `compile(g, { target })` with `ok: true`, THE Importer SHALL return a `graph` equal to the Normalized_Graph of `g`, for both targets.
4. WHEN the compiled files include a Studio_Sidecar, THE Importer SHALL return it as `studio`. WHEN they do not, THE Importer SHALL return a `studio` whose `positions` come from a deterministic layered auto-layout.
5. IF a Grimoire_File is malformed (invalid JSON or front matter, a missing required heading, or a SOP row that references an unknown Node), THEN THE Importer SHALL report `GC-E101`, `GC-E102`, or `GC-E103` with the file path and return `graph: null`.
6. WHEN no Grimoire_File is present, THE Importer SHALL return `graph: null` without an error.

### Requirement 16: Best-effort import of existing Kiro state

**User Story:** As a Kiro user with existing agents, skills, and MCP servers, I want GrimoireCrew to discover them, so that I can reuse them instead of duplicating them.

#### Acceptance Criteria

1. THE Importer SHALL list Foreign_File agents (JSON, or Markdown with front matter) in `inventory.agents` with `name`, `description`, and source path, so the studio can offer them as Reuse_Worker targets.
2. THE Importer SHALL list foreign skills, MCP servers, hooks, and steering files in `inventory` by name and kind. For MCP servers it SHALL record `env` and `headers` key names only, never values.
3. THE Importer SHALL return every Foreign_File unchanged in `passthrough` and report `GC-I004`, except as stated in criteria 4 and 5.
4. WHEN a Foreign_File matches a Secret_Pattern, THE Importer SHALL report `GC-S004` with its path, and SHALL exclude it from `passthrough` and `inventory` details.
5. WHEN `files` contains a `.env` or `.env.*` file (other than `.env.example`), THE Importer SHALL ignore its content, report `GC-I006`, and exclude it from every output.
6. WHEN a Grimoire_File contains fields the Importer does not recognize, THE Importer SHALL report `GC-I005` and continue.

### Requirement 17: Platform-neutral core and public API

**User Story:** As the web app, the server, and the Crew app, I want to run the same core code, so that a preview in the browser matches the server export exactly.

#### Acceptance Criteria

1. THE Core SHALL not import Node built-in modules, and SHALL not use filesystem, network, DOM, timer, clock, or random APIs anywhere under `packages/core/src`.
2. THE Core SHALL compile with TypeScript `strict`, `lib: ["ES2023"]`, and `types: []` for `src`, so that a forbidden API fails typechecking.
3. THE Core SHALL have a test that fails when a file under `src` imports a module other than `zod`, `yaml`, or a relative path.
4. THE Core SHALL export from `src/index.ts`: `parseGraph`, `lint`, `compile`, `importFiles`, `renderWardGuard`, the presets, `DIAGNOSTIC_CATALOG`, the graph and Studio_Sidecar schemas, the Contract_Schemas, and their TypeScript types.
5. THE Core SHALL provide the scripts `test` (`vitest run`), `test:hook` (`vitest run --reporter=dot`), and `typecheck` (`tsc --noEmit`).
