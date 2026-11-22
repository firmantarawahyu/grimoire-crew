# Working with Kiro on GrimoireCrew

A short guide for working on this repository with Kiro, written for someone using Kiro for the first time.

## The four Kiro features this repo uses

Kiro reads the `.kiro/` folder at the root of the open workspace. Everything below lives there and is committed, so it works the same on your laptop and in a cloud session.

### Steering (`.kiro/steering/`)

Steering files are standing instructions that Kiro reads before it answers, so you don't have to repeat project rules in every chat. The `inclusion` line at the top of each file decides when it loads.

| File | Loads | What it tells Kiro |
|---|---|---|
| `architecture.md` | always | What GrimoireCrew is, the package layout and its boundaries, the toolchain, and the working rules |
| `security-zero-secret.md` | always | Never read or print secrets; how the protection layers fit together |
| `project-memory.md` | always | Read `docs/progress.md` and `docs/decisions.md` first, keep them updated, and talk to you in Bahasa Indonesia |
| `kiro-crew-schemas.md` | when a file in `packages/core/` or `apps/crew-app/` is involved | The verified Kiro and Kiro Crew file formats the compiler must produce |
| `alchemist-ui-audio.md` | when a UI file is involved | The look, animation, sound, performance, and accessibility rules |
| `session-handoff.md` | only when you type `/session-handoff` | The end-of-session checklist |

To change a rule, edit the Markdown file and commit it. It applies from the next message. You can also ask Kiro, for example: "Add a steering rule: always write tests before code".

### Hooks (`.kiro/hooks/`)

Hooks are small scripts Kiro runs automatically at certain moments.

| Hook file | When | What it does |
|---|---|---|
| `env-secret-ward.json` | Before Kiro reads a file, runs a shell command, or calls an MCP tool | Blocks the action if it would touch a real `.env` file or print secret environment variables. You will see `[WARD BLOCKED]` |
| `compiler-schema-test.json` | After every Kiro reply | Runs the `packages/core` tests if core files changed. It stays quiet when the tests pass |
| `kiro-submission-guard.json` | After every Kiro reply | Checks the hackathon rules: `.kiro/` is not ignored, the license is MIT, and no `.env` file is committed |

Kiro always asks for your approval before it writes into `.kiro/hooks/`. That is a Kiro safety feature, not an error.

### Specs (`.kiro/specs/`)

A spec turns a feature into three documents, written in order:

1. `requirements.md`: what the feature must do, as testable "WHEN ... THE SYSTEM SHALL ..." lines.
2. `design.md`: how it will be built.
3. `tasks.md`: a checklist of small coding tasks.

In Kiro IDE, open the Specs panel to see the tasks with Start buttons. Anywhere else, type a prompt such as "Execute task 1 of spec 01-core-schema-and-compiler".

### Slash commands

Type `/` in the chat box to list commands. This repo adds `/session-handoff`, which runs the tests, updates `docs/progress.md` and `docs/decisions.md`, and commits.

## Working locally (Kiro IDE on the laptop)

1. Open the `grimoire-crew` folder itself as the workspace, not its parent. Otherwise Kiro will not find `.kiro/`.
2. When Kiro asks whether to trust the workspace, choose Trust. Untrusted workspaces load no steering, hooks, or MCP servers.
3. Run `git pull` before you start, in case a cloud session changed something.
4. First time only: run `pnpm install`.
5. Optional: add the personal deny rule from `.kiro/steering/security-zero-secret.md` to `~/.kiro/settings/permissions.yaml`.
6. End with `/session-handoff`, then `git push`.

## Working from anywhere (Kiro Web cloud sessions)

Kiro Web runs Kiro in a cloud sandbox that you control from a browser or phone. It needs a Kiro Pro plan or higher; see Blockers in `docs/progress.md`.

One-time setup:

1. Sign in at https://app.kiro.dev and connect GitHub. Give access to the `grimoire-crew` repository only.
2. In Settings, then Environments, set network access to "Common dependencies" and add no secrets. Spec 04 will add a dedicated OpenRouter key later.
3. Smoke test in a new session with the repository attached:
   - Ask: "Run `pnpm install --frozen-lockfile && pnpm test:scripts`". It should pass.
   - Ask: "Run `printenv`". The ward should block it with `[WARD BLOCKED]`.
   - Ask: "What does docs/progress.md say is next?". The answer shows the project-memory steering loaded.
   - If the hooks did not run, add that to Blockers in `docs/progress.md`.

Each working session:

1. Start a session at app.kiro.dev with the `grimoire-crew` repository attached, or resume the previous session.
2. Give it one task, for example "Execute task 3 of spec 01-core-schema-and-compiler".
3. Finish with `/session-handoff`. The cloud agent opens a pull request; it never pushes to `main` directly.
4. On GitHub, wait for the green CI check, review the pull request, and merge it. This works from a phone.
5. Start the next session only after merging, so it clones the latest `main`.

Tips:

- Do not run two sessions on the same files at the same time; their pull requests will conflict.
- Anything that is not committed is lost when a sandbox goes away. That is why `docs/progress.md` matters.
- Never paste secrets into the chat.
