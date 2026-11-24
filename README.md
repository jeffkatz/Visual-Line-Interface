<div align="center">

# VISUAL LINE INTERFACE

**Precision visual software installation, project scaffolding, and development environment configuration workstation.**

[![React](https://img.shields.io/badge/React-19-1D2126?style=for-the-badge&logo=react&logoColor=65B9A5)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-1D2126?style=for-the-badge&logo=typescript&logoColor=77A9DC)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-1D2126?style=for-the-badge&logo=vite&logoColor=C7A46A)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-1D2126?style=for-the-badge&logo=tailwindcss&logoColor=65B9A5)](https://tailwindcss.com/)

---

</div>

## Overview & Purpose

**Visual Line Interface** transforms traditionally command-line-driven developer operations into a cohesive, precision-engineered visual workstation.

Instead of memorising framework CLI flags, hunting down compatibility notes across package managers, manually renaming scaffolded files to fit directory conventions, or piecing together multi-step setup scripts by hand, developers can configure every aspect of a new project visually—inspecting exact generated commands, synthesized framework config files, `package.json` manifests, and file trees before execution.

### Core Product Philosophy

- **Visual first, terminal accessible** — Every visual switch, segmented selector, and rotary dial maps directly to real CLI flags and environment configuration.
- **Configuration before execution** — Validate stack compatibility, naming conventions, and port assignments before a single command runs.
- **Beginner friendly, expert capable** — Clear documentation links and contextual inspection alongside low-level heap, timeout, compiler, and shell controls.
- **Precision over clutter** — Inspired by analogue synthesizers, audio mixing consoles, and industrial instrumentation without retro skeuomorphism.

---

## Workspaces & Capabilities

| Workspace | Purpose | Key Capabilities |
| :--- | :--- | :--- |
| **Project Studio** | Primary project scaffolding bench | Framework selection (`Vite`, `Next.js`, `Astro`, `Vue`, `SvelteKit`), runtime & package manager pairing, language/compiler/styling/testing selectors, analogue rotary dials (`devPort`, `previewPort`, `memoryLimitMb`, `networkTimeoutSec`), and preflight validation. |
| **Stack & Prompt Studio** | Stack recommendations & prompt generation | 6 curated stack profiles + offline goal matching (`recommendStackOffline`), optional AI Stack Architect, and a **Project Creation Prompt** generator (works offline or enhanced via connected AI) with `.md` export. |
| **Bulk File Rename** | Pre-execution file structure alignment | Directory layout modes (`standard`, `feature-sliced`, `domain-scoped`), naming conventions (`kebab-case`, `camelCase`, `PascalCase`, `snake_case`), prefix/suffix & find/replace rules, inline overrides, and collision checks. |
| **Execution Preview** | Transparent pre-run inspection | Toggle between **Commands** (`Sequence` or raw script with per-step copy), synthesized **Config Files** (`vite.config.*`, `next.config.*`, `tsconfig.json`, `biome.json`, `eslint.config.js`, `vitest.config.*`, CSS), **`package.json`**, post-rename **`File Tree`**, and **`Create Prompt`**; export as `.sh` or `.ps1`. |
| **Package & Library Studio** | Dependency & live npm registry | Filter curated libraries (`Full Integration Setup` vs `Package Only`), search live `registry.npmjs.org` for any package, pin versions reflected in CLI commands, and jump to official Docs & npm. |
| **Runtime Manager & Diagnostics** | Live host probe & toolchain telemetry | Probe real host OS, CPU arch, `PATH` binaries (`node`, `deno`, `bun`, `npm`, `pnpm`, `yarn`, `git`), and TCP port availability via `/api/system/probe`, plus compare PM cache latency with Recharts. |
| **Workflow Builder & Operations** | Dependency-ordered automation & live monitor | Compose/reorder operation blocks, **Sync from Studio**, monitor live dry-run execution with Recharts timing charts, fault injection, and optional AI failure diagnostics. |
| **Docs & Tutorial** | In-app interactive guide | 6-chapter interactive walkthrough, hardware control reference, prompt guide, and live codebase map. |
| **Settings & Providers** | Workstation defaults & optional AI routing | Configure shell syntax, knob sensitivity, and optional AI providers (**OpenRouter**, **Google Gemini**, **OpenAI**, **Anthropic**, **Groq**, **Mistral**, **Ollama**). |
| **Command Palette (`⌘K` / `Ctrl+K`)** | Keyboard-first navigation & docs | Instant search across workspaces, quick foundation switching, script copying, and official documentation for every language, framework, and tool. |

---

## Design Language & Palette

Visual Line Interface pairs layered charcoal and graphite surfaces with restrained warm brass and technical green accents:

| Token | Hex | Role |
| :--- | :--- | :--- |
| **Primary Background** | `#101214` | Recessed workstation canvas & terminal surfaces |
| **Secondary Background** | `#171A1E` | Sidebar, secondary panels, recessed containers |
| **Panel Surface** | `#1D2126` | Hardware-bezel module panels & cards |
| **Elevated Surface** | `#252A30` | Active selectors, modals, hover states |
| **Primary Accent (Brass)** | `#C7A46A` | Active controls, primary actions, telemetry meters |
| **Secondary Accent (Green)** | `#65B9A5` | Nominal states, active runtimes, verified paths |
| **Typography** | `Plus Jakarta Sans` · `IBM Plex Sans` · `JetBrains Mono` | Workspace headings, readable labels, tabular technical readouts |

---

## Getting Started

### Prerequisites

- **Node.js** `20+` (or `22.x LTS`)
- **npm** or **pnpm**

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (runs on http://localhost:3000)
npm run dev

# 3. Run the automated unit test suite
npm test

# 4. Type-check the codebase
npm run lint

# 5. Build for production
npm run build
```

- **User Manual & Tutorial**: [`DOCUMENTATION.md`](./DOCUMENTATION.md) — Step-by-step walkthrough, stack recommendation guide, prompt synthesis, and AI provider setup.
- **Codebase Blueprint (Agents & Engineers)**: [`project_structure.md`](./project_structure.md) — Full module map, state/data flow, `/api/system/probe`, `/api/npm/*`, `/api/ai/*` endpoints, and extension recipes.
- **Audit & Roadmap**: [`PROJECT_AUDIT_AND_ROADMAP.md`](./PROJECT_AUDIT_AND_ROADMAP.md) — Implementation audit and completed engineering upgrades.

---

## Project Architecture

```text
server.ts                           # Express + Vite server (port 3000): /api/system/probe, /api/npm/*, /api/ai/*
tests/
└── studio.test.ts                  # Node test suite verifying validators, renames, config synthesis & prompts
src/
├── App.tsx                         # Root state, host probe sync, localStorage persistence & Cmd+K palette
├── index.css                       # Tailwind CSS v4 setup, theme tokens, hardware surface utilities
├── types/
│   └── studio.ts                   # Core TypeScript domain models for configs, probes, npm, AI & pipelines
├── data/
│   ├── studioCatalog.ts            # Frameworks, runtimes, packages, doc links, CLI & config file synthesizers
│   ├── stackAdvisor.ts             # Curated stack recommendations & deterministic Project Creation Prompt engine
│   └── aiProviders.ts              # OpenRouter, Gemini, OpenAI, Anthropic, Groq, Mistral & Ollama metadata
├── services/
│   ├── aiClient.ts                 # Typed frontend API client for /api/ai/*
│   └── systemClient.ts             # Typed frontend API client for /api/system/probe & /api/npm/*
└── components/
    ├── charts/                     # Recharts workstation visualizations (StudioCharts.tsx)
    ├── controls/                   # RotaryKnob, MechanicalToggle, SegmentedSelector, VersionSelector, Meters
    ├── icons/                      # Custom geometric brand & ecosystem marks
    ├── layout/                     # Persistent Sidebar & collapsible Contextual InspectorPanel
    ├── studio/                     # AiArchitectPanel (Stack & Prompt Studio), BulkFileRenamePanel, CommandPalette
    └── screens/                    # ProjectStudio, PackageStudio, RuntimeManager, WorkflowBuilder,
                                    # OperationsCentre, Overview, DocumentationScreen, & Management/Settings
```

---

## Prompt That Created This Project

<details open>
<summary><strong>Origin & Iterative Prompts</strong> — View the specification used to design and refine Visual Line Interface</summary>

```text
1. Core Application Brief:
Design a premium, high-fidelity desktop application called Visual Line Interface (originally prototyped as Visual CLI Studio) — a visual
software installation, project scaffolding, and development environment configuration platform.
Transform traditionally command-line-driven developer operations into intuitive, highly
configurable visual experiences where developers can create Vite, Next.js, Astro, Vue, and
SvelteKit projects, manage Node.js/Deno/Bun runtimes, select package managers (pnpm, npm,
Yarn, Bun), install libraries, configure dependencies, and execute development workflows.

Aesthetic & Layout:
- Inspired by analogue synthesizers, industrial instrumentation, high-end audio mixing
  consoles, and modern developer workstations (not a generic SaaS template or terminal clone).
- Deep charcoal/graphite surfaces (#101214, #171A1E, #1D2126, #252A30), warm brass (#C7A46A),
  and technical green (#65B9A5) with Inter/Plus Jakarta Sans and JetBrains Mono typography.
- Persistent three-part desktop layout: Left Navigation Sidebar, Dynamic Main Workspace
  (Project Studio, Package & Library Studio, Runtime Manager, Workflow Builder, Operations
  Centre, Integration Registry, Project Recipes, Installation History, Diagnostics, Settings),
  and a collapsible Right Contextual Inspector Panel.
- Precision hardware controls: segmented selectors, mechanical toggle switches, version
  selectors, technical meters, and rotary dials for numeric port/memory/timeout calibration.

2. Bulk File Rename Extension:
Add a feature to bulk-rename the selected project files before execution, ensuring the project
naming conventions match the target directory structure (supporting directory layouts, case
conventions, prefix/suffix & find/replace rules, inline overrides, and mkdir/mv CLI steps).

3. Codebase Audit, Documentation & Developer Enhancements:
Constructively criticize the codebase, apply fixes, and generate a Markdown report detailing
what is implemented vs. what still needs to be implemented. Enhance the UI, add official
documentation references for every library and language, and add developer-loved improvements
(Cmd+K Command & Docs Palette, live package.json & File Tree previews, per-step command copy,
shell-target-aware .sh/.ps1 export, persistent workflows/history, and preflight confirmation).
```

</details>

---

## Author & Studio

<div align="center">

**Katlego Monamodi**
*UI/UX Designer & Software Developer*

[www.beyondcuriouslabs.co.za](https://www.beyondcuriouslabs.co.za)

</div>
