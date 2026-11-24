# Visual Line Interface — Complete User Documentation & Tutorial

**Visual Line Interface** is a developer environment workstation that transforms command-line scaffolding, runtime management, dependency curation, directory restructuring, and workflow execution into an inspectable, hardware-inspired visual console.

Every visual control maps directly to deterministic CLI flags, manifests, and project creation prompts—and works **100% offline without AI** while offering **optional AI enhancements** across OpenRouter, Google Gemini, OpenAI, Anthropic Claude, Groq, Mistral, and local Ollama.

---

## Table of Contents

1. [Interface Anatomy](#1-interface-anatomy)
2. [Step-by-Step Tutorial: End-to-End Walkthrough](#2-step-by-step-tutorial-end-to-end-walkthrough)
3. [Stack Recommendations & Project Prompt Studio](#3-stack-recommendations--project-prompt-studio)
4. [Pre-Execution Bulk File Rename & Directory Alignment](#4-pre-execution-bulk-file-rename--directory-alignment)
5. [Workspaces Reference](#5-workspaces-reference)
6. [Hardware Controls & Keyboard Shortcuts](#6-hardware-controls--keyboard-shortcuts)
7. [Connecting Optional AI Providers](#7-connecting-optional-ai-providers)
8. [Troubleshooting & FAQ](#8-troubleshooting--faq)

---

## 1. Interface Anatomy

Visual Line Interface uses a persistent three-column desktop workstation layout:

```text
┌──────────────────┬─────────────────────────────────────────┬──────────────────────┐
│  LEFT SIDEBAR    │            MAIN WORKSPACE               │  RIGHT INSPECTOR     │
│                  │                                         │  (Collapsible)       │
│ • Command & Docs │ • Active Screen (12 workspaces)         │ • Live Context Help  │
│   (Cmd/Ctrl+K)   │ • Hardware Controls & Rotary Dials      │ • Compatibility      │
│ • Workspace Nav  │ • Stack & Prompt Studio                 │   Notices & Auto-Fix │
│ • Management Nav │ • Bulk Rename & Generated Execution     │ • Official Docs      │
│ • System Nav     │   Plan (Commands / Config Files / JSON /│   Quick Links        │
│ • Live Host Info │   File Tree / Create Prompt)            │                      │
└──────────────────┴─────────────────────────────────────────┴──────────────────────┘
```

- **Left Sidebar**: Navigate between **Workspace**, **Management**, and **System** views (`Overview`, `Project Studio`, `Package & Library Studio`, `Runtime Manager`, `Workflow Builder`, `Operations Centre`, `Integration Registry`, `Project Recipes`, `Installation History`, `Diagnostics`, `Docs & Tutorial`, `Settings`).
- **Main Workspace**: Renders the selected tool bench with live configuration state.
- **Right Contextual Inspector**: Updates automatically whenever you select a framework, runtime, package manager, rotary dial, package, workflow node, or bulk-rename file. Shows compatibility rules, 1-click **Auto-Fix** actions, and links to official vendor documentation.

---

## 2. Step-by-Step Tutorial: End-to-End Walkthrough

Follow this 6-step tutorial to go from an empty idea to a validated CLI script, `package.json`, directory tree, and ready-to-paste **Project Creation Prompt**.

### Step 1 — Pick Your Foundation & Runtime (`Project Studio`)
1. Open **Project Studio** from the left sidebar (or click **Open Project Studio** from **Overview**).
2. In **Section 01 · Project Foundation**, choose one of the five supported foundations:
   - **Vite** (supports React, Vue, Svelte, Solid, and Vanilla presets)
   - **Next.js** (App Router + React Server Components)
   - **Astro** (Content-driven islands architecture)
   - **Vue** (`create-vue` official scaffold)
   - **SvelteKit** (`sv create` scaffold)
3. Below the **Stack Recommendations & Prompt Studio** card, configure:
   - **Runtime Selector**: `Node.js`, `Deno`, or `Bun` + target version channel.
   - **Package Manager**: `pnpm`, `npm`, `Yarn`, or `Bun`.
4. Watch the **Right Inspector**—if you pair incompatible tools (for example, `Bun` package manager with `Node.js`, or `SWC` with a non-React framework), an advisory or error appears with a **1-click Auto-Fix** button.

### Step 2 — Get a Stack Recommendation & Generate a Project Prompt
You can configure controls manually or let the **Stack Recommendations & Prompt Studio** panel recommend a stack for you—**with or without an AI provider connected**:
1. In the **Stack Advisor** tab:
   - Click any of the **6 Curated Stack Profiles** (`High-Speed React SPA`, `Full-Stack Next.js SaaS`, `Content & Docs Portal`, `Vue 3 Enterprise Workspace`, `SvelteKit Edge Application`, or `UI Component & Design System`), **OR**
   - Type your project goal (e.g. `"Realtime analytics portal with TypeScript, Tailwind, Biome, and Vitest"`) and click **Recommend Stack** (offline heuristic matching) or **Recommend with AI** (if a provider key is configured).
2. Click **Apply to Project Studio** to populate framework, language, compiler, styling, testing, dev tools, packages, layout mode, naming convention, and dev port in one click—or click **Apply & Build Prompt** to jump straight to prompt synthesis.
3. In the **Project Creation Prompt** tab:
   - Optionally enter a brief description of your app's business logic.
   - Review the automatically generated Markdown prompt containing your exact stack, package versions, directory tree, bulk rename rules, and CLI execution steps.
   - If you have an AI provider connected (such as OpenRouter or Google Gemini), click **Enhance with Connected Provider** to enrich the prompt with tailored component and API architecture guidance.
   - Click **Copy Prompt** or **Export .md** to download `<project>-create-prompt.md`.

### Step 3 — Tune Compiler, Tooling & Rotary Dials (`Section 02`)
1. Choose **Language** (`TypeScript` / `JavaScript`), **Build Configuration** (`SWC` / `Standard`), **Styling** (`Tailwind CSS`, `Sass`, `CSS Modules`, `Plain CSS`), and **Testing** (`Vitest`, `Playwright`, `None`).
2. Toggle **Development Tools** (`ESLint`, `Prettier`, `Biome`) using the mechanical switches.
3. Calibrate numeric runtime settings with the four precision **Rotary Knobs**:
   - **Dev Server Port** (`3000–9000`)
   - **Preview Port** (`3000–9000`)
   - **Node Heap Limit** (`1024–8192 MB`)
   - **Fetch Timeout** (`15–180 s`)
   - *Tip*: Drag vertically, scroll your mouse wheel over a dial, or click the monospaced readout to type an exact number.

### Step 4 — Set Identity & Bulk-Rename Scaffold Files (`Section 03`)
1. Enter a valid npm package slug in **Project Name** (e.g. `my-awesome-app`) and choose or type an **Installation Directory**.
2. Toggle **Install Dependencies** and **Initialise Git Repository**.
3. Use **Pre-Execution Bulk Rename & Directory Alignment** to ensure the scaffolded file paths match your team's architecture before any command executes (see [Section 4](#4-pre-execution-bulk-file-rename--directory-alignment)).

### Step 5 — Inspect & Export (`Section 04 · Generated Execution Plan`)
Switch between the five live output tabs:
- **Commands**: View numbered phase-by-phase operations (`Scaffold`, `Configure`, `Dependencies`, `Tooling`, `Repository`, `Verify`) with per-step copy buttons and an **Env & Flags** drawer.
- **Config Files**: Inspect real synthesized configurations for your active framework (`vite.config.*`, `next.config.*`, `astro.config.mjs`, `svelte.config.js`), `tsconfig.json`/`jsconfig.json`, root CSS (using your bulk-renamed stylesheet target), `biome.json`/`eslint.config.js`/`.prettierrc`, and `vitest.config.*`/`playwright.config.*`.
- **package.json**: Inspect the live generated manifest with pinned versions and npm scripts.
- **File Tree**: View the final directory tree highlighting every renamed/moved file.
- **Create Prompt**: Copy the synchronized Project Creation Prompt directly from the execution bar.

Click **Export .sh** (or **Export .ps1** when PowerShell is selected in Settings) to download an executable bootstrap script, or click **Save as Recipe** to store the entire configuration locally.

### Step 6 — Execute & Monitor (`Workflow Builder` & `Operations Centre`)
1. Click **Initialise Project** in Project Studio (or **Sync from Studio → Execute Workflow** in **Workflow Builder**).
2. Watch the **Operations Centre** step-by-step execution timeline, live **Execution Timing Chart** (estimated vs. actual duration), and terminal log stream.
3. Toggle **Simulate Fault** to test failure recovery (`Retry Failed`) and optional **Diagnose Failure with AI** troubleshooting.
4. Completed runs are automatically recorded in **Installation History** and charted on **Overview**.

---

## 3. Stack Recommendations & Project Prompt Studio

Visual Line Interface separates deterministic engineering logic from optional LLM calls so you are **never blocked** when working offline or without API keys:

| Capability | Without Connected AI Provider (Offline) | With Connected AI Provider |
| :--- | :--- | :--- |
| **Stack Recommendations** | Uses `CURATED_STACK_RECOMMENDATIONS` + `recommendStackOffline()` keyword/constraint scoring | Calls `/api/ai/assist` (`mode: 'architect'`) with strict enum sanitization and automatic offline fallback |
| **Project Creation Prompt** | Uses `buildProjectCreationPrompt()` to deterministically assemble stack specs, packages, directory tree, rename mappings, and CLI sequence | Calls `/api/ai/assist` (`mode: 'prompt'`) to enrich the blueprint with tailored module architecture & API boundaries |
| **Stack Audit** | Runs `validateProjectCompatibility()` rule matrix across compilers, runtimes, ports, and file paths | Adds semantic dependency & build-pipeline risk analysis (`mode: 'audit'`) |
| **Bulk Rename Advice** | Applies layout presets (`standard`, `feature-sliced`, `domain-scoped`) + case transforms (`kebab-case`, `camelCase`, `PascalCase`, `snake_case`) | Suggests domain-aligned paths (`mode: 'rename'`) validated against safe relative path rules |
| **Failure Diagnostics** | Shows exact step error and retry controls | Analyzes failed step logs and emits recovery commands (`mode: 'troubleshoot'`) |

---

## 4. Pre-Execution Bulk File Rename & Directory Alignment

Located in **Project Studio → Section 03**, the Bulk Rename Workbench lets you normalize generated scaffold paths before running a single CLI command:

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
   - All pending moves automatically generate `mkdir -p` + `mv` (or PowerShell `New-Item`) steps inside **Generated Execution Plan**.

---

## 5. Workspaces Reference

| Workspace | Purpose |
| :--- | :--- |
| **Overview** | Active draft summary, runtime readiness meters, Recharts **Pipeline Phase Breakdown** & **Recorded Build Duration Trend**, quick-load recipes, and recent runs. |
| **Project Studio** | Core configuration workstation: Foundations, Stack & Prompt Studio, Runtimes, Package Managers, Tooling, Rotary Knobs, Bulk File Rename, Execution Preview, and Initialise bar. |
| **Package & Library Studio** | Searchable curated catalog + live `registry.npmjs.org` search, version pinning, peer dependency & license inspection, and official Docs & npm links. |
| **Runtime Manager** | Probes live host OS, CPU arch, `PATH` binaries (`node`, `deno`, `bun`, `npm`, `pnpm`, `yarn`), and compares Cold vs. Warm cache latency via Recharts. |
| **Workflow Builder** | Visual dependency-ordered pipeline editor. Reorder nodes, toggle steps, add library templates, **Sync from Studio**, persist locally, and execute. |
| **Operations Centre** | Live dry-run runner with pause/resume/cancel, fault simulation, Recharts step timing comparison, terminal log stream, and optional AI troubleshooter. |
| **Integration Registry** | Toggle deeply integrated tooling (`Tailwind CSS`, `TypeScript`, `ESLint`, `Prettier`, `Biome`, `Vitest`, `Playwright`, `React Router`, `shadcn/ui`). |
| **Project Recipes** | Save, inspect, reload, and delete reusable project configurations in `localStorage`. |
| **Installation History** | Audit log of past dry-run and simulated executions with duration and command counts. |
| **Diagnostics** | Runs `/api/system/probe` for live Node.js, package manager, Git CLI, and TCP port binding (`devPort` / `previewPort`) preflight verification. |
| **Docs & Tutorial** | Built-in interactive walkthrough checklist, control reference, and live codebase architecture viewer. |
| **Settings** | Workstation defaults (`defaultDirectory`, `shellTarget`, `knobSensitivity`, `confirmBeforeExecution`) and **AI Provider & Model Routing**. |

---

## 6. Hardware Controls & Keyboard Shortcuts

- **`⌘K` / `Ctrl+K`**: Open the **Command & Docs Palette** from anywhere to jump screens, switch frameworks, copy generated CLI scripts, or open official documentation.
- **Rotary Knobs**: Click-and-drag vertically, scroll mouse wheel, press `ArrowUp`/`ArrowDown`/`PageUp`/`PageDown`, or click the numeric value to enter an exact number. Knob sensitivity (`precision`, `standard`, `fast`) is configurable in **Settings**.
- **Collapsible Right Inspector**: Collapse or expand via the right-rail button; automatically collapses on viewports narrower than `1280px`.

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
  Yes. Every core workflow—scaffolding, package curation, bulk file renaming, workflow building, offline stack recommendations, deterministic Project Creation Prompt generation, and `.sh`/`.ps1` export—works without AI keys.
- **Why does OpenRouter or another provider show `Env Unset`?**
  The server did not detect a non-placeholder value for that provider's environment variable. Add the variable to your server environment / Secrets panel and click **Refresh Status** in Settings.
- **What happens if a connected provider is temporarily unavailable (e.g. HTTP 503 or timeout)?**
  The Stack Advisor and Prompt Studio catch the error, display a clear banner, and automatically fall back to the local deterministic heuristic and blueprint engines so your workflow continues uninterrupted.
