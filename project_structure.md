# Visual Line Interface — Project Structure & Engineering Guide

> **Audience**: Coding agents (LLMs / automated refactoring tools) and human software engineers onboarding onto **Visual Line Interface**.
> This document describes the exact file tree, state architecture, deterministic generation engines, full-stack Express/Vite server endpoints, security boundaries, and extension checklists.

---

## 1. Tech Stack & Runtime Summary

- **Frontend**: React 19 + TypeScript (`strict` / `noEmit` check) + Vite 8 + Tailwind CSS v4 (`@tailwindcss/vite`)
- **Charts & Icons**: `recharts` (`^3.11.1`), `lucide-react` (`^0.546.0`)
- **Backend / Dev Entry**: Express 4 (`server.ts`) bound to loopback on port `3000`:
  - **Development (`npm run dev`)**: `tsx server.ts` mounts `vite.middlewares` (`middlewareMode: true`, `appType: 'spa'`) alongside `/api/*` routes.
  - **Production (`npm run build && npm start`)**: `vite build` outputs `dist/`; `npm start` serves static assets + SPA fallback alongside `/api/*`.
- **AI Integration**: Server-side `@google/genai` SDK (`^3.6.1`) + REST proxies for OpenRouter, OpenAI, Anthropic, Groq, Mistral, and Ollama.

---

## 2. Repository Directory Tree

```text
/
├── .env.example                          # Template for optional server-side provider secrets
├── index.html                            # HTML entry point (loads Plus Jakarta Sans, IBM Plex Sans, JetBrains Mono)
├── metadata.json                         # App metadata & capabilities (MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API)
├── package.json                          # Dependencies & scripts (dev/start: tsx server.ts, typecheck, test)
├── tsconfig.json                         # TypeScript config (ES2022, bundler resolution, allowImportingTsExtensions)
├── vite.config.ts                        # Vite 8 + React + Tailwind v4 plugin config (HMR disabled via DISABLE_HMR)
├── server.ts                             # Full-stack Express server and local-only API routes
├── server/
│   ├── localInstaller.ts                 # Native folder selection and validated frontend/API scaffolding
│   ├── projectActions.ts                 # Free-port project runs, stop actions, and editor launch
├── tests/
│   ├── studio.test.ts                    # Preview catalog, validation, config synthesis & prompt tests
│   ├── localInstaller.test.ts            # Frontend/API scaffolding and destination safety tests
│   ├── projectActions.test.ts            # Free-port selection, run arguments, and request validation
├── README.md                             # Project overview, author credits, and origin prompt
├── DOCUMENTATION.md                      # End-user manual and installation walkthrough
├── PROJECT_AUDIT_AND_ROADMAP.md          # Implementation audit & future native daemon roadmap
├── project_structure.md                  # THIS FILE — codebase blueprint for coding agents & humans
└── src/
    ├── main.tsx                          # React 19 mount entry point
    ├── index.css                         # Tailwind CSS v4 import (@import "tailwindcss";) + industrial hardware utilities
    ├── App.tsx                           # Root state container, host probe sync, localStorage migration, screen router
    ├── types/
    │   ├── studio.ts                     # Project catalog, preview, probes, npm results & AI contracts
    │   ├── localInstaller.ts             # Shared local install request and job types
    │   └── projectActions.ts             # Local run, stop, editor, and session contracts
    ├── data/
    │   ├── studioCatalog.ts              # Frameworks, runtimes, packages, CLI/config synthesizers & validators
    │   ├── stackAdvisor.ts               # Offline curated stack profiles, heuristic recommender, & Project Creation Prompt builder
    │   └── aiProviders.ts                # Metadata & curated model lists for OpenRouter + 6 other AI providers
    ├── services/
    │   ├── aiClient.ts                   # Typed browser fetch client calling /api/ai/* (zero keys in browser)
    │   ├── systemClient.ts               # Typed browser fetch client calling /api/system/probe & /api/npm/*
    │   ├── localInstallerClient.ts       # Folder-picker, installation, and progress API client
    │   └── projectActionsClient.ts       # Local project run, stop, and editor actions
    └── components/
        ├── charts/
        │   └── StudioCharts.tsx          # Recharts visualizations (PipelinePhase, HistoryDuration, ExecutionTiming)
        ├── controls/
        │   ├── MechanicalToggle.tsx      # Hardware-styled switch control
        │   ├── RotaryKnob.tsx            # Interactive SVG/pointer/keyboard/wheel numeric dial
        │   ├── SegmentedSelector.tsx     # Multi-option segmented button bar
        │   ├── StatusIndicator.tsx       # Non-pill semantic status readout (icon + label)
        │   ├── TechnicalMeter.tsx        # Segmented LED-style capacity meter
        │   └── VersionSelector.tsx       # Runtime target-version input and installed-version readout
        ├── icons/
        │   └── BrandMarks.tsx            # Custom SVG brand/framework/runtime/PM icons & StudioLogoMark
        ├── layout/
        │   ├── Sidebar.tsx               # Left persistent navigation rail, Cmd+K trigger, & local environment footer
        │   └── InspectorPanel.tsx        # Right collapsible contextual inspector + Compatibility Auto-Fix & Docs links
        ├── studio/
        │   └── CommandPalette.tsx        # Global Cmd+K / Ctrl+K quick-jump and official docs search
        └── screens/
            ├── ProjectSetupWizard.tsx    # Four-step frontend/API/full-stack project setup and install flow
            ├── OverviewScreen.tsx        # Local toolchain status, setup summary, and recent installations
            └── SecondaryManagementScreens.tsx # Tech Stack, Installed projects, Settings & diagnostics
```

---

## 3. Core Architectural Principles & Data Flow

### 3.1 Local Project Installation
The Create New Project flow sends a typed request from `ProjectSetupWizard` through `localInstallerClient` to the loopback-only Express server. The server validates the project and destination, builds fixed scaffold arguments, and invokes npm's JavaScript CLI through Node without a shell:

```text
ProjectSetupWizard
  ├── POST /api/local/choose-directory ──▶ native folder picker
  └── POST /api/projects/install ────────▶ validated install job
                                          ├── frontend framework or Express API scaffold, optionally including database drivers and env templates
                                          ├── npm dependency install
                                          └── optional selected packages
  └── GET /api/projects/install/:id ─────▶ progress and terminal result

Installed projects
  ├── POST /api/projects/:id/run ─────────▶ start on an OS-allocated free port
  ├── POST /api/projects/:id/stop ────────▶ stop the tracked local process
  └── POST /api/projects/:id/open ────────▶ open in an available editor
```

`src/data/studioCatalog.ts` provides framework metadata, optional package recommendations, and project plan previews. Database selections add application drivers, connection helpers, and `.env.example` files; the installer does not provision database services.

### 3.2 `localStorage` Persistence Keys (`src/App.tsx`)
Settings and installation history migrate transparently from their legacy `visual_cli_studio_*_v1` keys via `readStorageWithMigration`:
- `visual_line_interface_settings_v1`: `StudioSettings` (merged with `DEFAULT_SETTINGS`; validates `aiProvider` & `aiModel` on boot).
- `visual_line_interface_history_v1`: Real local project installation records; legacy simulated runs are filtered out.

### 3.3 Offline-First + Optional AI Design
1. **Works 100% without AI**:
   - `src/data/stackAdvisor.ts` implements `CURATED_STACK_RECOMMENDATIONS`, `recommendStackOffline(goal, currentConfig)`, and `buildProjectCreationPrompt(...)`.
   - When `settings.aiEnabled` is `false` or a provider's environment variable is unset (`configured: false`), Stack Advisor, Project Creation Prompt generation, Stack Audit, and Bulk File Rename operate purely deterministically in the browser.
2. **Optional AI Enhancement (`server.ts` + `src/services/aiClient.ts`)**:
   - When `settings.aiEnabled` is `true` and a provider key is configured on the server, frontend components call `/api/ai/assist` with a typed `mode`:
     - `'architect'`: Synthesizes `AiStackRecommendation` from natural language.
     - `'prompt'`: Synthesizes an enriched `AiPromptSynthesis` (`promptText`, `highlights`) from the active workspace state.
     - `'audit'`: Evaluates `ProjectConfig` + `CompatibilityIssue[]` + generated CLI commands.
     - `'rename'`: Proposes `AiRenameSuggestion` (`directoryLayoutMode`, `directoryNamingConvention`, relative `overrides`).
     - `'troubleshoot'`: Analyzes local project setup or runtime issues.
   - All network calls gracefully fall back to deterministic local outputs if the provider is unavailable.

---

## 4. Module-by-Module Reference

### `server.ts`
- **Port & Middleware**: Reads `PORT` (default `3000`), parses JSON (`limit: '512kb'`), mounts Vite dev middleware when `NODE_ENV !== 'production'` or serves `dist/` in production.
- **Endpoints**:
  - `GET /api/health` — Returns `{ ok: true, timestamp }`.
  - `POST /api/local/choose-directory` — Opens a native folder picker for the local user.
  - `POST /api/projects/install` — Validates and starts a real npm scaffold/install job; existing destination folders are not overwritten.
  - `GET /api/projects/install/:id` — Returns the install job status and captured output.
  - `GET /api/system/probe?devPort=...&previewPort=...` — Executes safe `execFile` version/path probes (`node`, `deno`, `bun`, `npm`, `pnpm`, `yarn`, `git`), detects host OS/arch/`PATH`, and tests live TCP port availability via `net.createServer()`.
  - `GET /api/npm/search?q=...` — Queries `https://registry.npmjs.org/-/v1/search` and returns formatted `NpmSearchPackage[]` entries.
  - `GET /api/npm/package?name=...` — Fetches & caches (5 min TTL) `https://registry.npmjs.org/<name>` metadata (`NpmPackageDetail`) including recent stable versions, license, homepage, peer dependencies, and deprecation flags.
  - `GET /api/ai/status` — Checks `process.env` presence (ignoring unset or `MY_*` placeholders) and returns `AiProviderStatus[]` without ever exposing secret values.
  - `GET /api/ai/openrouter/models` — Fetches & caches (5 min TTL) the live OpenRouter model list from `https://openrouter.ai/api/v1/models`.
  - `POST /api/ai/test` — Sends a lightweight `READY` probe to the chosen provider/model and returns `{ ok, provider, model, latencyMs, reply?, error? }`.
  - `POST /api/ai/assist` — Routes `'architect' | 'audit' | 'rename' | 'troubleshoot' | 'prompt'` to:
    - **Google Gemini**: `@google/genai` SDK (`User-Agent: 'aistudio-build'`), enforcing allowed non-paid models (`gemini-4-hydrogen`, `gemini-3.1-flash-lite`) and `responseMimeType: 'application/json'` + `responseSchema`.
    - **OpenRouter / OpenAI / Groq / Mistral**: OpenAI-compatible `chat/completions` with automatic retry without `response_format` if an upstream OpenRouter model returns HTTP 400.
    - **Anthropic**: `https://api.anthropic.com/v1/messages`.
    - **Ollama**: `${OLLAMA_BASE_URL}/api/chat` (URL scheme validated for `http:` / `https:`).
- **Response Sanitization**: Every AI JSON output passes through `extractJsonObject`, `sanitizeRecommendation`, `sanitizeDiagnostic`, `sanitizeRenameSuggestion` (blocks `..`, spaces, leading `/`, and unknown keys), or `sanitizePromptSynthesis`. All outbound `fetch` calls use `AbortSignal.timeout(...)`.

### `src/types/studio.ts`
Defines every domain union and interface (`ScreenId`, `FrameworkId`, `RuntimeId`, `PackageManagerId`, `FileNamingConvention`, `DirectoryLayoutMode`, `ProjectConfig`, `CompatibilityIssue`, `ExecutionCommandStep`, `GeneratedConfigFile`, `SystemProbeResult`, `RuntimeInfo`, `PackageManagerInfo`, `NpmSearchPackage`, `NpmPackageDetail`, `StudioPackage`, `InspectorTarget`, `AiProviderId`, `AiStackRecommendation`, `AiDiagnosticResponse`, `AiRenameSuggestion`, `AiPromptSynthesis`, `StudioSettings`).
*Important naming note*: Use `FileNamingConvention` (`'kebab-case' | 'camelCase' | 'PascalCase' | 'snake_case'`) and `DirectoryLayoutMode` (`'standard' | 'feature-sliced' | 'domain-scoped'`).

### `src/data/studioCatalog.ts`
- **Catalogs**: Framework metadata, runtime/package-manager labels and docs, `STUDIO_PACKAGES`, `TOOLCHAIN_DOCS`, `DEFAULT_PROJECT_CONFIG`, and `DEFAULT_SETTINGS`. Runtime versions and installed status come from `/api/system/probe`.
- **Naming & Path Helpers**: `splitStemAndCompoundExt` (preserves `.test.tsx`, `.module.css`, `.config.ts`, `.d.ts`), `toCaseStyle`, `matchesNamingConvention`, `computeConventionTargetPath`.
- **Generators**:
  - `buildScaffoldManifest(config)` — Computes initial + renamed file paths (`ScaffoldFileEntry[]`).
  - `getPendingFileRenames(config)` — Returns `{ from, to }[]` diffs injected as `mkdir -p`/`mv` (or PowerShell `New-Item`) steps.
  - `buildExecutionPlan(config, packages, shellTarget)` — Emits deterministic phase-ordered CLI steps including custom npm-imported dependencies.
  - `buildGeneratedPackageJson(config, packages)` — Emits formatted `package.json` preview.
  - `buildScaffoldConfigFiles(config, packages)` — Synthesizes concrete config files (`vite.config.*`/`next.config.*`/`astro.config.mjs`/`svelte.config.js`, `tsconfig.json`/`jsconfig.json`, target CSS, `biome.json`/`eslint.config.js`/`.prettierrc`, `vitest.config.*`/`playwright.config.*`).
  - `validateProjectCompatibility(config)` — Detects naming mismatches, path collisions, port conflicts, Biome/ESLint overlaps, `nextjs` + `react-router`, and runtime/PM mismatches.

### `src/data/stackAdvisor.ts`
- `CURATED_STACK_RECOMMENDATIONS`: 6 curated full-stack and frontend recipes.
- `recommendStackOffline(goal, currentConfig)`: Scores curated profiles against keywords in `goal`, detects runtime/PM/language/styling/tooling overrides, and returns a valid `AiStackRecommendation`.
- `buildProjectCreationPrompt({ config, packages, executionPlan, manifest, goal })`: Generates a full, deterministic Markdown prompt ready for coding agents or developers.

### `src/components/charts/StudioCharts.tsx`
Three Recharts components styled to match `#101214` / `#1D2126` / `#C7A46A` / `#65B9A5`:
- `PipelinePhaseChart` (bar chart of estimated duration by execution phase)
- `HistoryDurationChart` (area chart of recorded execution durations)

---

## 5. Rules & Guardrails for Coding Agents

1. **No Browser API Key Inputs or Client Secrets**: Never add UI inputs for API keys, never import `@google/genai` in `src/`, and never read private env vars via `VITE_*`. All keys stay in server `process.env`.
2. **Keep Local Actions Honest and Safe**: Preserve loopback/origin checks, fixed scaffold arguments, no-shell process execution, destination collision checks, and explicit errors for project installs and runtime updates. Database integrations generate project code and environment templates only; they do not provision database services.
3. **Node ESM Type Imports in `server.ts`**: Keep explicit `.ts` extensions on `import type` statements in `server.ts` (e.g. `import type { ... } from './src/types/studio.ts'`) so both `tsc --noEmit` (`allowImportingTsExtensions: true`) and Node v22+ native type stripping work.
4. **Styling & Design System Rules**:
   - Use Tailwind CSS v4 utility classes; keep the `#101214` / `#171A1E` / `#1D2126` / `#252A30` + `#C7A46A` (brass) + `#65B9A5` (technical green) palette.
   - Avoid static pill badges (`rounded-full` chips on metadata), thick left accent borders (`border-l-4`), pulsing dots, and generic AI slop copy.
   - Use `JetBrains Mono` (`font-mono tabular-nums`) for commands, paths, versions, and numeric readouts.

---

## 6. Common Extension Recipes

### Adding an Installable Package
1. Update package selection metadata and request validation.
2. Add focused tests for the accepted package spec and the generated npm arguments.
3. Keep the installer invocation shell-free; do not treat preview commands as executable input.

### Adding a New Workspace Screen
1. Add the screen identifier to `ScreenId` in `src/types/studio.ts`.
2. Create the screen component in `src/components/screens/`.
3. Add a navigation entry in `src/components/layout/Sidebar.tsx` and `src/components/studio/CommandPalette.tsx`.
4. Render the screen inside `renderMainScreen()` in `src/App.tsx`.

### Adding a New AI Provider
1. Add the provider ID to `AiProviderId` in `src/types/studio.ts`.
2. Add provider metadata and model presets to `AI_PROVIDERS` in `src/data/aiProviders.ts`.
3. Register its `envVar`, default model, and completion transport in `server.ts` (`PROVIDERS`, `isProviderConfigured`, and `runProviderCompletion`), and document the env var in `.env.example`.

---

## 7. Verification Commands

Run all checks before finalizing changes:

```bash
# Unit test suite (Node test runner + tsx)
npm test

# TypeScript static type-check
npm run lint

# Vite production build
npm run build

# Full-stack Express + Vite server on port 3000
npm run dev
```
