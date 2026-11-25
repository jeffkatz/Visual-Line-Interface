# Visual Line Interface — Complete User Documentation & Tutorial

**Visual Line Interface** is a developer environment workstation that transforms project scaffolding, runtime management, and local project actions into an inspectable, hardware-inspired visual console.

Every visual control maps directly to deterministic CLI flags, manifests, and project creation prompts—and works **100% offline without AI** while offering **optional AI enhancements** across OpenRouter, Google Gemini, OpenAI, Anthropic Claude, Groq, Mistral, and local Ollama.

---

## Table of Contents

1. [Interface Anatomy](#1-interface-anatomy)
2. [Step-by-Step Tutorial: End-to-End Walkthrough](#2-step-by-step-tutorial-end-to-end-walkthrough)
3. [Archived Stack and Prompt Features](#3-archived-stack-and-prompt-features)
4. [Archived Bulk File Rename Details](#4-archived-bulk-file-rename-details)
5. [Workspaces Reference](#5-workspaces-reference)
6. [Hardware Controls & Keyboard Shortcuts](#6-hardware-controls--keyboard-shortcuts)
7. [Connecting Optional AI Providers](#7-connecting-optional-ai-providers)
8. [Troubleshooting & FAQ](#8-troubleshooting--faq)

---

## 1. Interface Anatomy

Visual Line Interface places **Overview**, **Create New Project**, and **Installed projects** at the top of the primary navigation. Less frequently used tools are grouped under **More tools**.

```text
┌──────────────────┬─────────────────────────────────────────┬──────────────────────┐
│  LEFT SIDEBAR    │            MAIN WORKSPACE               │  RIGHT INSPECTOR     │
│                  │                                         │  (Collapsible)       │
│ • Overview       │ • Frontend, API, or full-stack setup     │ • Local host status  │
│ • Create New     │ • Framework, destination, packages      │ • Advanced tools     │
│ • Installed      │ • Install progress and project actions  │   under More tools  │
│ • More tools     │                                         │                      │
└──────────────────┴─────────────────────────────────────────┴──────────────────────┘
```

- **Left Sidebar**: Keeps Overview, project creation, and installed-project actions visible; opens secondary workspaces from **More tools**.
- **Main Workspace**: The project setup flow is the default screen. Advanced previews and settings remain available separately.
- **Local execution**: A local Node.js server launches allowlisted npm CLI operations. Browser JavaScript does not receive arbitrary shell access.

> **Scope note:** Real installation currently uses npm and creates projects with official framework scaffolds. Optional packages are installed at their pinned versions; bulk-rename/configuration previews are not applied by the real installer.

---

## 2. Step-by-Step Tutorial: End-to-End Walkthrough

Create and install a project locally in four steps:

### Step 1 — Choose a project and framework
Open **Create New Project** and choose frontend-only, API-only, or full-stack. Frontend options include Vite, Next.js, Astro, Vue, SvelteKit, and Angular. API projects use Express + TypeScript; full-stack offers a single workspace or sibling project folders.

### Step 2 — Select the destination
Enter a project name and click **Select a local folder**. The app opens the operating system's folder picker and shows the exact resulting paths. It will not overwrite an existing destination.

### Step 3 — Review packages
The installer uses **npm**. Choose optional packages compatible with the selected frontend framework; Express API starters include Express, CORS, and dotenv. Node.js with npm must be available to the local server.

### Step 4 — Review and install
Review the stack, optional packages, and destination, then click **Install project**. The local server runs the scaffold and npm install steps, streams bounded process output into the progress panel, and records the result in **Installed projects**.

The app must be running on the same computer where the project should be created. A remote browser cannot select a local absolute path or start a local CLI. The local server binds to loopback and accepts same-origin local install actions only.

Optional database selections add drivers, connection helpers, and a `.env.example` to API/full-stack projects. No database service is installed or provisioned; configure and start the database separately. Installed projects start on an OS-allocated local port; the chosen port is shown in the project run controls.

---

## 3. Archived Stack and Prompt Features

The previous Stack Advisor and Prompt Studio are not part of the current primary setup flow. The notes below are retained for reference and do not describe an active installer step:

| Capability | Without Connected AI Provider (Offline) | With Connected AI Provider |
| :--- | :--- | :--- |
| **Stack Recommendations** | Uses `CURATED_STACK_RECOMMENDATIONS` + `recommendStackOffline()` keyword/constraint scoring | Calls `/api/ai/assist` (`mode: 'architect'`) with strict enum sanitization and automatic offline fallback |
| **Project Creation Prompt** | Uses `buildProjectCreationPrompt()` to deterministically assemble stack specs, packages, directory tree, rename mappings, and CLI sequence | Calls `/api/ai/assist` (`mode: 'prompt'`) to enrich the blueprint with tailored module architecture & API boundaries |
| **Stack Audit** | Runs `validateProjectCompatibility()` rule matrix across compilers, runtimes, ports, and file paths | Adds semantic dependency & build-pipeline risk analysis (`mode: 'audit'`) |
| **Bulk Rename Advice** | Applies layout presets (`standard`, `feature-sliced`, `domain-scoped`) + case transforms (`kebab-case`, `camelCase`, `PascalCase`, `snake_case`) | Suggests domain-aligned paths (`mode: 'rename'`) validated against safe relative path rules |
| **Failure Diagnostics** | Shows exact step error and retry controls | Analyzes failed step logs and emits recovery commands (`mode: 'troubleshoot'`) |

---

## 4. Archived Bulk File Rename Details

The legacy Bulk Rename Workbench is not available in the current setup flow. The following notes describe its previous behavior for historical reference only; none of these changes are applied during installation.

1. **Target Directory Structure**:
   - **Standard `src/`**: Keeps standard framework folders (`src/components/...`).
   - **Feature-Sliced**: Maps `src/...` into `src/features/<project-slug>/...`.
   - **Domain-Scoped**: Maps `src/...` into `src/modules/<project-slug>/...`.
2. **File Naming Convention**:
   - Enforce `kebab-case`, `camelCase`, `PascalCase`, or `snake_case` across non-exempt files (while protecting compound extensions like `.test.tsx`, `.module.css`, `.config.ts`, `.d.ts`).
3. **Bulk Transform Workbench**:
   - Check files (or filter by `All`, `Source`, `Styles`, `Tests`, `Config` and select all visible).
   - Apply one-click case conversions (`kebab`, `camel`, `Pascal`, `snake`), **Align to Directory Convention**, **Find & Replace** (with optional `.*` RegExp toggle), or **Prefix / Suffix** affixes.
   - Click **Suggest Layout & Renames** (when AI is enabled) for automated layout advice.
4. **Collision & Convention Validation**:
   - Duplicate target paths are flagged as `Collision`; non-conforming filenames are flagged as `Mismatch`.
   - Pending moves appear in the generated command preview.

These rename operations are not applied by the real local installer yet; the official framework scaffold creates its default file tree.

---

## 5. Workspaces Reference

| Workspace | Purpose |
| :--- | :--- |
| **Overview** | Runtime readiness, recommended Tech Stacks, project setup entry points, and recent installations. |
| **Create New Project** | Four-step wizard for frontend, API, and full-stack scaffolds; Angular and other frontend frameworks; optional PostgreSQL, MongoDB, MySQL, SQLite, or Redis driver integrations and environment templates. Database services are not provisioned. |
| **Installed projects** | Interactive local project list with run/stop controls, free-port URLs, and available editor launch options. |
| **Runtime Manager** | Probes live host OS, CPU arch, and `PATH` binaries (`node`, `deno`, `bun`, `npm`, `pnpm`, `yarn`). Node updates require nvm, fnm, or Volta; Deno accepts pinned versions; Bun supports stable/canary updates. |
| **Tech Stack** | Browse and apply recommended combinations such as MERN, PERN, and MEAN. |
| **Settings** | Configure theme mode, accent, fonts, text size, workstation defaults, AI providers, and environment diagnostics. Diagnostics run `/api/system/probe` for runtime, package manager, Git CLI, and port availability. |

---

## 6. Hardware Controls & Keyboard Shortcuts

- **`⌘K` / `Ctrl+K`**: Open the **Command & Docs Palette** from anywhere to jump screens, switch frameworks, copy generated CLI scripts, or open official framework and toolchain references.
- **Rotary Knobs**: Click-and-drag vertically, scroll mouse wheel, press `ArrowUp`/`ArrowDown`/`PageUp`/`PageDown`, or click the numeric value to enter an exact number. Knob sensitivity (`precision`, `standard`, `fast`) is configurable in **Settings**.
- **Collapsible Right Inspector**: Starts collapsed to reduce setup clutter; expand it via the right-rail button when needed.

---

## 7. Connecting Optional AI Providers

All AI credentials are configured **strictly on the server** via environment variables (never entered or stored in the browser).

| Provider | Environment Variable | Default Model | Notes |
| :--- | :--- | :--- | :--- |
| **OpenRouter** | `OPENROUTER_API_KEY` | `google/gemini-2.5-flash` | Supports live model catalog fetch (`/api/ai/openrouter/models`), custom slugs, and automatic JSON-format fallback. |
| **Google Gemini** | `GEMINI_API_KEY` | `gemini-4-hydrogen` | Uses official `@google/genai` SDK with schema-constrained JSON output (`gemini-4-hydrogen`, `gemini-3.1-flash-lite`). |
| **OpenAI** | `OPENAI_API_KEY` | `gpt-4o-mini` | Supports `gpt-4o-mini`, `gpt-4o`, `o3-mini`, and custom model slugs. |
| **Anthropic Claude** | `ANTHROPIC_API_KEY` | `claude-3-7-sonnet-20250219` | Uses Anthropic Messages API (`claude-3-7-sonnet-20250219`, `claude-3-5-haiku-20241022`). |
| **Groq Cloud** | `GROQ_API_KEY` | `llama-3.3-70b-versatile` | High-speed LPU inference for Llama 3.3 / 3.1 models. |
| **Mistral AI** | `MISTRAL_API_KEY` | `codestral-latest` | Specialized `codestral-latest` and `mistral-small-latest`. |
| **Ollama (Local)** | `OLLAMA_BASE_URL` | `qwen2.5-coder:7b` | Local inference server (e.g. `http://127.0.0.1:11434`). |

### Setup Steps
1. Set the desired key(s) in your environment (`.env` locally or **Settings → Secrets** in AI Studio).
2. Open **Settings** inside Visual Line Interface and click **Refresh Status**.
3. Select a configured provider (`Ready`), pick or fetch a model, and click **Test Provider Connection** to verify round-trip latency.

---

## 8. Troubleshooting & FAQ

- **Can I use Visual Line Interface without any API keys?**
  Yes. Project scaffolding and npm package installation do not require AI credentials.
- **Why does OpenRouter or another provider show `Env Unset`?**
  The server did not detect a non-placeholder value for that provider's environment variable. Add the variable to your server environment / Secrets panel and click **Refresh Status** in Settings.
- **What happens if a connected provider is temporarily unavailable (e.g. HTTP 503 or timeout)?**
  The Stack Advisor and Prompt Studio catch the error, display a clear banner, and automatically fall back to the local deterministic heuristic and blueprint engines so your workflow continues uninterrupted.
