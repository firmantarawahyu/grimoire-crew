# Kiroween 2026 Hackathon — Master Reference & Docs Pack

> **Collected:** November 22, 2026 (WIB / UTC+7)
> **Time Remaining:** ~13 days until submission deadline (**December 4, 2026, 2:00 PM PST** / **December 5, 2026, 5:00 AM WIB**)
> **Official Portal:** https://kiroween.devpost.com/ | https://kiro.dev/

---

## 1. Key Dates & Timeline

| Milestone | Date & Time (PT) | Local Time (WIB / UTC+7) | Notes |
|---|---|---|---|
| **Submissions Open** | Oct 30, 2026 | Oct 30–31, 2026 | Projects must be brand new & built within this window |
| **Kiro Credit Request Deadline** | **Dec 1, 2026** | Dec 1–2, 2026 | Claim **4,000 free Kiro credits** via Devpost Resources tab |
| **Submission Deadline** | **Dec 4, 2026, 2:00 PM PST** | **Dec 5, 2026, 5:00 AM WIB** | Hard deadline on Devpost |
| **Judging Period** | Dec 16, 2026 – Jan 29, 2027 | Dec 16, 2026 – Jan 29, 2027 | Panel evaluation across 5 criteria |
| **Winners Announced** | ~Feb 3, 2027 | ~Feb 3–4, 2027 | Announced on Devpost & Kiro channels |

---

## 2. Eligibility & Core Rules

- **Who Can Enter:** Individuals of legal age of majority, teams of up to **3 participants**, or registered organizations.
  - **Indonesia is eligible** (not on the excluded territories list; official rules include Bahasa Indonesia translations). Always verify the latest Official Rules tab on Devpost before submitting.
- **Multiple Entries:** An individual may join more than one team/organization and may also enter individually.
- **Brand New Work Only:** Must be a **new project built entirely during the submission window** (Oct 30 – Dec 4, 2026). Pre-existing or previously submitted projects are disqualified.
- **Must Be Built With Kiro:** Must actively use Kiro tools (IDE, CLI, Web, Kiro Crew, Specs, Steering, Hooks, MCP, Powers).

---

## 3. Prize Pool Breakdown ($100,000 Total Cash + Perks)

### Overall Prizes ($60,000)
| Prize | Cash Award |
|---|---|
| **1st Place (Grand Prize)** | $30,000 |
| **2nd Place** | $20,000 |
| **3rd Place** | $10,000 |

### Main Category Prizes ($20,000 — $5,000 each)
| Category | Award | What Judges Look For |
|---|---|---|
| **Resurrection** | $5,000 | Bring a dead or obsolete technology back to life, reimagined with modern innovations to solve today's/future problems. |
| **Frankenstein** | $5,000 | Stitch together a chimera of seemingly incompatible technologies, tools, or concepts into one unexpectedly powerful app. |
| **Skeleton Crew** | $5,000 | Build a clean, lean, flexible skeleton code template **AND** prove its versatility by powering **two distinct applications** from that same foundation. |
| **Costume Contest** | $5,000 | Build any application with a hauntingly polished, unforgettable, spooky UI whose visual craft actively enhances functionality. |

### Bonus & Special Prizes ($20,000 Cash + Credits/Subscriptions)
| Bonus Prize | Award | Eligibility / Specific Requirement |
|---|---|---|
| **Best Startup Project** | $10,000 | Highest-scoring eligible entry submitted with a valid Startup Profile (startup details, LinkedIn, website). |
| **Best Student Projects** *(×4 categories)* | $1,500 each + 1-yr Kiro Pro Max | Highest-scoring student teams across each of the 4 main categories (all team members must be students). |
| **Best Ghost of Kiroween Past** | $2,000 | Verified returning participants from Kiroween 2025. |
| **Best Kiro Crew App** | $1,000 | Newly created **Kiro Crew App** (public GitHub repo + write-up detailing its Kiro Crew features/functionality). |
| **Best Demo** | $1,000 | Top-scoring submission with an extraordinarily clear, compelling end-to-end demo video. |
| **Blog Post & Social Blitz Bonuses** | Kiro Credits / Pro+ | Publish a public write-up on approved platforms (e.g., `dev.to/kirodotdev`, `#KiroweenHackathon26`) mentioning Kiroween 2026 and link it in your Devpost form. |

---

## 4. Judging Criteria (50 Points Total — 5 Equal Pillars @ 20% Each)

| Criterion | Weight | Points | Exact Judge Questions |
|---|---|---|---|
| **1. Potential Impact** | 20% | 10 pts | Does it make a credible case for solving a real problem for a real audience? Does the demo prove it? Is it useful, intuitive, accessible — would someone actually use it? |
| **2. Technological Implementation** | 20% | 10 pts | How thoroughly & skillfully was Kiro used? Thoughtful AI development strategy? Variety of Kiro features used impactfully (specs, hooks, steering, MCP, powers, Kiro Crew, vibe coding)? Deep understanding & experimentation? |
| **3. Design** | 20% | 10 pts | Complete, coherent product experience (not just a rough technical PoC)? Intuitive, polished, and intentional UX/UI? |
| **4. Innovation / Idea** | 20% | 10 pts | How creative and novel is the concept? Does it stand apart? Are unusual technologies or public datasets combined creatively? |
| **5. Presentation** | 20% | 10 pts | Does the video clearly demonstrate the project working end-to-end? Does the pitch clearly explain problem, audience, and why it matters? Easy to follow, creative, and memorable? |

> **Strategic Takeaway:** Technological Implementation (20%) specifically grades **how deeply you leverage Kiro's feature set**, while Potential Impact (20%) + Design (20%) + Innovation (20%) + Presentation (20%) punish raw toy prototypes. Winning projects feel like **real, usable products with a strong hook and clean Kiro engineering discipline**.

---

## 5. Mandatory Submission Checklist

Do **NOT** risk disqualification on technicalities:

1. **Public GitHub Repository** (GitHub specifically — avoid GitLab/Bitbucket for the main judging URL).
2. **OSI-Approved Open Source License** (e.g., `LICENSE` with MIT License) detectable in GitHub's "About" section.
3. **`.kiro/` Directory Committed at Repo Root:**
   - **CRITICAL:** Do **NOT** add `.kiro/` or its subfolders to `.gitignore`. Hiding or omitting `.kiro/` can disqualify your entry.
   - Include clean, genuine `.kiro/specs/`, `.kiro/steering/`, `.kiro/hooks/`, and `.kiro/settings/mcp.json` (with no leaked secrets!).
4. **Runnable Instructions & Complete Assets:** Clear `README.md` with setup/run steps and working live demo URL if web-based.
5. **Demo Video (<= 3 Minutes):**
   - Judges are not required to watch past **3 minutes**.
   - Hosted **publicly** on YouTube, Vimeo, or Facebook Video so it embeds on Devpost.
   - Show the working app **end-to-end** + clear problem/audience/Kiro-workflow story.
6. **Written Kiro Usage Write-Up:** Detail concretely how Kiro (Specs, Steering, Hooks, MCP, Powers, CLI, Kiro Crew) accelerated or structured your build.
7. **Category + Optional Bonus Selections:** Pick **1** main category + check any applicable bonus tracks (Student, Startup, Ghost of Kiroween Past, Kiro Crew App, Blog Post).

---

## 6. Kiro & Kiro Crew Technical Capabilities (Leverage for Judging!)

Using multiple Kiro capabilities authentically directly boosts the **Technological Implementation (20%)** score and makes your `.kiro/` directory impressive to judges:

### Core Kiro IDE / CLI Features (`https://kiro.dev/docs/`)
- **Specs (`.kiro/specs/<feature>/`):** Spec-driven development using `requirements.md` (user stories + acceptance criteria), `design.md` (architecture), and `tasks.md` (dependency-ordered executable tasks run in waves).
- **Steering (`.kiro/steering/` + `AGENTS.md`):** Persistent project conventions, architecture rules, and coding standards with `always`, `auto`, `fileMatch`, or `manual` inclusion modes.
- **Agent Hooks (`.kiro/hooks/`):** JSON event-driven automations triggered on `PostFileSave`, `PreToolUse`, `PostToolUse`, `Stop` (e.g., auto-linting, auto-test generation, security/secret guardrails, spec-to-code drift checks).
- **MCP (`.kiro/settings/mcp.json`):** Connect Kiro agents to external tools, databases, APIs, or custom local MCP servers.
- **Powers (`POWER.md`):** Dynamic, on-demand bundles combining MCP servers + Agent Skills + steering docs to avoid context bloat.
- **Kiro CLI V3:** Unified terminal agent harness sharing the same `.kiro/` workspace configuration.

### Kiro Crew (`https://kiro.dev/crew/` | `https://github.com/kirodotdev/KiroCrew`)
- Open-source, persistent autonomous AI agent workspace/orchestrator powered by `kiro-cli` (runs locally via `kirocrew gateway` at `http://localhost:5476`, desktop app, Docker, or connected to Slack/Discord/Telegram).
- **Key Features:** Persistent semantic memory across sessions, **Conductor Mode** (goal planning + parallel sub-workers + self-correction), scheduled cron/background jobs, event-driven monitors, and local/Bedrock knowledge ingestion.
- **Kiro Crew App Kit (`@kirocrew/app-sdk` & `kirodotdev/KiroCrewApps`):** Build custom **Kiro Crew Apps** bundling:
  - Specialized Agents & `SKILL.md` skills
  - MCP Servers
  - Scheduled Cron / Background Jobs
  - Custom React UI pages & side-panel tabs rendered inside the Kiro Crew dashboard
  - *Note: Eligible for the dedicated **$1,000 Best Kiro Crew App** bonus prize!*

---

## 7. Benchmarks: Notable Kiroween 2025 Winners & Standouts

Studying last year's winners reveals what judges actually reward:

| Project | Award / Track | What Made It Stand Out |
|---|---|---|
| **Kiro-InteractionKit** *(Harpita Pandian)* | **Grand Prize ($30,000)** *(Skeleton Crew)* | Clean Python/MediaPipe starter skeleton removing CV complexity to enable webcam hand/face/head gestures — proven with two distinct apps (*Holo-Board* glassboard recorder & *Math-O-Lantern*). **Lesson:** High reusability + visual "wow" demo + real accessibility/creator utility. |
| **Faxi** | **Resurrection Highlight** | Resurrected fax machines for digitally excluded seniors — handwritten faxes become two-way emails, bookings, or online orders via AI. **Lesson:** Real human empathy + clever revival of "dead" tech. |
| **ELIZA EXHUMED** | **Resurrection Highlight** | Revived the 1966 ELIZA chatbot inside a haunted CRT terminal comparing vintage symbolic AI vs. modern LLM side-by-side. **Lesson:** Strong theme alignment + educational/nostalgic charm. |
| **UnitSet** | **Frankenstein Highlight** | Fused infinite canvases, AI agents, code generation, and live sandboxes into a UI creation chimera. **Lesson:** Bold architectural mashup that feels cohesive. |
| **SpookBnB** | **Costume Contest Highlight** | A vacation rental app that transforms in dark mode into a flashlight-guided horror escape room with puzzles. **Lesson:** Delightful interactive UI twist where the spooky aesthetic *is* the experience. |
| **SpecMem / GhostKeys / ntomb** | Community Standouts | Developer utilities (spec cognitive memory + MCP, Rust Windows keyboard layout interceptor, Rust Ratatui haunted network TUI) showcasing deep `.kiro/` discipline. |

---

## 8. Approved Tech Stack & Agent Tooling (GrimoireCrew)

| Layer | Approved Choice | Rationale |
|---|---|---|
| **Runtime & Tooling** | **Bun** (dev, `bun install`, `bun test`) + **Node.js >= 22.12** compatibility | Fast dev loop & low baseline RAM; all compiled artifacts (`packages/core/compiler`, MCP servers, `.kiro/hooks/`) remain pure standard JS/TS (`"command": "node"`) so judges and Kiro Crew can run them without Bun. |
| **Frontend Framework** | **React + TypeScript + Vite** | Low RAM vs. Next.js, instant HMR, and directly aligned with Kiro Crew's `@kirocrew/app-sdk` Vite ESM bundle (`dist/index.mjs`). |
| **Styling & Components** | **Tailwind CSS v4 + shadcn/ui (Radix UI)** | Rapid UI assembly with full code ownership so `impeccable` + `DESIGN.md` can craft a distinct Grimoire theme without generic AI slop. |
| **Icons** | **Lucide React** | Standard companion to shadcn/ui and matches Kiro Crew manifest icon names (e.g., `"Shield"`). |
| **Visual Builder & Preview** *(optional)* | **React Flow (`@xyflow/react`) + Shiki / CodeMirror** | Interactive visual node builder (*Conductor -> Workers -> Hooks*) with live JSON/Markdown compiler output preview for the demo video. |
| **Backend API** | **Hono + Zod (Hono RPC)** | Ultra-lightweight, zero-dependency, end-to-end type-safe REST/SSE API that runs identically on Bun and Node.js. |
| **Agent Workflow & Skills** | **Native Kiro (Specs, Steering, Hooks, MCP, Powers)** + **`impeccable`** + **`principle-prove-it-works`** (in `.kiro/steering/`) | Maximizes the 20% *Technological Implementation* and 20% *Design* judging pillars without heavy external workflow conflicts. |

---

## 9. Official Links & Resources

- **Hackathon Portal & Rules:** https://kiroween.devpost.com/
- **Kiro Official Site & Docs:** https://kiro.dev/
- **Kiro Crew Docs:** https://kiro.dev/crew/
- **Kiro Crew Repo:** https://github.com/kirodotdev/KiroCrew
- **Kiro Crew Apps Registry:** https://github.com/kirodotdev/KiroCrewApps
- **Community Dev.to Hub:** https://dev.to/kirodotdev (tag `#KiroweenHackathon26`)
