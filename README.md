<div align="center">

# VISUAL LINE INTERFACE

**A local-first, step-by-step project setup tool with real framework scaffolding and npm installs.**

[![React](https://img.shields.io/badge/React-19-1D2126?style=for-the-badge&logo=react&logoColor=65B9A5)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-1D2126?style=for-the-badge&logo=typescript&logoColor=77A9DC)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-1D2126?style=for-the-badge&logo=vite&logoColor=C7A46A)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-1D2126?style=for-the-badge&logo=tailwindcss&logoColor=65B9A5)](https://tailwindcss.com/)

---

</div>

## Overview & Purpose

**Visual Line Interface** guides developers through choosing a framework, selecting a local destination, reviewing packages, and creating a real project on their computer.

Instead of memorising framework CLI flags, hunting down compatibility notes across package managers, manually renaming scaffolded files to fit directory conventions, or piecing together multi-step setup scripts by hand, developers can configure every aspect of a new project visually—inspecting exact generated commands, synthesized framework config files, `package.json` manifests, and file trees before execution.

### Core Product Philosophy

- **Local execution** — The local server runs official frontend scaffolds, creates an Express API starter, and installs npm dependencies.
- **Guided setup** — Four steps cover frontend-only, API-only, and full-stack layouts, destination, relevant packages, and local installation.
- **Safe by default** — The server listens on loopback, accepts same-origin local actions, validates package specs, and refuses to overwrite an existing project folder.
- **Database integrations** — API and full-stack projects can include supported database drivers and environment templates; database services are not provisioned.
- **Precision over clutter** — Inspired by analogue synthesizers, audio mixing consoles, and industrial instrumentation without retro skeuomorphism.
- **Accessible analog controls** — UI SDK switch and segmented-control behavior is selectively styled to match the workstation's tactile hardware controls.

---

## Workspaces & Capabilities

| Workspace | Purpose | Key Capabilities |
| :--- | :--- | :--- |
| **Overview** | Local workspace status | Review runtime readiness, recommended Tech Stacks, recent installations, and project creation shortcuts. |
| **Create New Project** | Primary guided installer | Create Vite, Next.js, Astro, Vue, SvelteKit, or Angular frontends; Express APIs; or full-stack projects in a workspace or sibling folders. API and full-stack projects can include PostgreSQL, MongoDB, MySQL, SQLite, or Redis drivers and environment templates (database services are not provisioned). |
| **Installed projects** | Local project actions | Run frontend/API scripts on a free OS-allocated port, stop running processes, and open project folders in installed editors. |
| **Runtime Manager** | Live host probe & toolchain management | Probe real host OS, CPU arch, `PATH` binaries (`node`, `deno`, `bun`, `npm`, `pnpm`, `yarn`, `git`), and update supported runtime versions. |
| **Tech Stack** | Recommended project configurations | Explore and apply combinations including MERN, PERN, and MEAN. |
| **Settings & Providers** | Appearance, diagnostics, and optional AI routing | Customize theme mode, accent, fonts, and text size; run environment diagnostics; configure workstation defaults and optional AI providers (**OpenRouter**, **Google Gemini**, **OpenAI**, **Anthropic**, **Groq**, **Mistral**, **Ollama**). |
| **Command Palette (`⌘K` / `Ctrl+K`)** | Keyboard-first navigation & references | Search workspaces, switch frameworks, copy generated setup commands, and open official framework and toolchain references. |

---

## Design Language & Palette

Visual Line Interface starts with layered charcoal surfaces and a warm brass accent. Settings also provide semi-dark, midnight, forest, ocean, and light modes, plus custom accent, font, and text-size controls.

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
- **npm** (required for the current local installer)

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

- Open **http://localhost:3000**. Use **Create New Project** for the real local install flow.
- Folder selection opens a native picker on the machine running the server. Choose a project name and folder layout; full-stack setups can create a workspace or sibling frontend/API folders.
- Actual installs currently use npm. Node.js with npm is required. Existing project folders are never overwritten.
- Use **Installed projects** to start a local dev server on an OS-allocated free port, stop it, or open the project in an available editor.
- This feature requires the app to run locally on the same computer where the project should be created. A remotely hosted browser app cannot access your computer's folders or CLI.

- **User Manual & Tutorial**: [`DOCUMENTATION.md`](./DOCUMENTATION.md) — Step-by-step local setup, package selection, and advanced workspace notes.
- **Codebase Blueprint (Agents & Engineers)**: [`project_structure.md`](./project_structure.md) — Full module map, state/data flow, runtime updates, `/api/system/probe`, `/api/npm/*`, `/api/ai/*` endpoints, and extension recipes.
- **Audit & Roadmap**: [`PROJECT_AUDIT_AND_ROADMAP.md`](./PROJECT_AUDIT_AND_ROADMAP.md) — Implementation audit and completed engineering upgrades.

---

## Project Architecture

```text
server.ts                           # Loopback Express + Vite server and local project API routes
server/localInstaller.ts            # Native folder picker, validated frontend/API scaffolding and npm jobs
server/projectActions.ts            # Free-port project runs, process stops, and editor launch actions
server/runtimeManager.ts            # Validated local runtime version manager commands
tests/
├── studio.test.ts                  # Project config, scaffold preview, and prompt tests
├── localInstaller.test.ts          # Installer input, destination safety, and command argument tests
├── projectActions.test.ts          # Free-port selection, run arguments, and request validation
└── runtimeManager.test.ts           # Runtime update validation and command argument tests
src/
├── App.tsx                         # Root state, host probe sync, localStorage persistence & screen routing
├── index.css                       # Tailwind CSS v4 setup, theme tokens, hardware surface utilities
├── types/
│   └── studio.ts                   # Core TypeScript domain models for configs, probes, npm, AI, and runtime updates
├── data/
│   ├── studioCatalog.ts            # Frameworks, runtimes, packages, doc links, CLI & config file synthesizers
│   ├── stackAdvisor.ts             # Curated stack recommendations & deterministic Project Creation Prompt engine
│   └── aiProviders.ts              # OpenRouter, Gemini, OpenAI, Anthropic, Groq, Mistral & Ollama metadata
├── services/
│   ├── aiClient.ts                 # Typed frontend API client for /api/ai/*
│   ├── localInstallerClient.ts     # Typed client for local folder selection and install jobs
│   ├── systemClient.ts             # Typed frontend API client for /api/system/probe & /api/npm/*
│   └── runtimeClient.ts            # Local runtime update action client
└── components/
    ├── charts/                     # Recharts workstation visualizations (StudioCharts.tsx)
    ├── controls/                   # RotaryKnob, MechanicalToggle, SegmentedSelector, VersionSelector, Meters
    ├── icons/                      # Custom geometric brand & ecosystem marks
    ├── layout/                     # Persistent Sidebar & collapsible Contextual InspectorPanel
    ├── studio/                     # CommandPalette
    └── screens/                    # Project setup, installed projects, runtimes, operations, overview, docs, and settings
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
Yarn, Bun), install libraries, configure dependencies, and preview setup operations.

Aesthetic & Layout:
- Inspired by analogue synthesizers, industrial instrumentation, high-end audio mixing
  consoles, and modern developer workstations (not a generic SaaS template or terminal clone).
- Deep charcoal/graphite surfaces (#101214, #171A1E, #1D2126, #252A30), warm brass (#C7A46A),
  and technical green (#65B9A5) with Inter/Plus Jakarta Sans and JetBrains Mono typography.
- Persistent three-part desktop layout: Left Navigation Sidebar, Dynamic Main Workspace
  (Overview, Create New Project, Installed projects, Runtime Manager,
  Tech Stack, Settings with environment diagnostics),
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
