# Visual Line Interface — Project Structure & Engineering Guide

> **Audience**: Coding agents (LLMs / automated refactoring tools) and human software engineers onboarding onto **Visual Line Interface**.
> This document describes the exact file tree, state architecture, deterministic generation engines, full-stack Express/Vite server endpoints, security boundaries, and extension checklists.

---

## 1. Tech Stack & Runtime Summary

- **Frontend**: React 19 + TypeScript (`strict` / `noEmit` check) + Vite 8 + Tailwind CSS v4 (`@tailwindcss/vite`)
- **Charts & Icons**: `recharts` (`^3.11.1`), `lucide-react` (`^0.546.0`)
- **Backend / Dev Entry**: Express 4 (`server.ts`) running on port `3000`:
  - **Development (`npm run dev`)**: `tsx server.ts` mounts `vite.middlewares` (`middlewareMode: true`, `appType: 'spa'`) alongside `/api/*` routes.
  - **Production (`npm run build && npm start`)**: `vite build` outputs `dist/`, and `node server.ts` (Node 22+ native TypeScript type stripping) serves static assets + SPA fallback alongside `/api/*`.
- **AI Integration**: Server-side `@google/genai` SDK (`^3.6.1`) + REST proxies for OpenRouter, OpenAI, Anthropic, Groq, Mistral, and Ollama.

---

## 2. Repository Directory Tree

```text
/
├── .env.example                          # Template for optional server-side provider secrets
├── index.html                            # HTML entry point (loads Plus Jakarta Sans, IBM Plex Sans, JetBrains Mono)
├── metadata.json                         # App metadata & capabilities (MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API)
├── package.json                          # Dependencies & scripts (dev: tsx server.ts, start: node server.ts, lint, test)
├── tsconfig.json                         # TypeScript config (ES2022, bundler resolution, allowImportingTsExtensions)
├── vite.config.ts                        # Vite 8 + React + Tailwind v4 plugin config (HMR disabled via DISABLE_HMR)
├── server.ts                             # Full-stack Express server: /api/system/probe, /api/npm/*, /api/ai/*
├── tests/
│   └── studio.test.ts                    # Node test suite verifying validators, renames, config synthesis & prompts
├── README.md                             # Project overview, author credits, and origin prompt
├── DOCUMENTATION.md                      # End-user manual & 6-chapter tutorial
├── PROJECT_AUDIT_AND_ROADMAP.md          # Implementation audit & future native daemon roadmap
├── project_structure.md                  # THIS FILE — codebase blueprint for coding agents & humans
└── src/
    ├── main.tsx                          # React 19 mount entry point
    ├── index.css                         # Tailwind CSS v4 import (@import "tailwindcss";) + industrial hardware utilities
    ├── App.tsx                           # Root state container, host probe sync, localStorage migration, screen router
    ├── types/
    │   └── studio.ts                     # Canonical TypeScript domain types, probes, npm results & AI contracts
    ├── data/
    │   ├── studioCatalog.ts              # Frameworks, runtimes, packages, CLI/config synthesizers & validators
    │   ├── stackAdvisor.ts               # Offline curated stack profiles, heuristic recommender, & Project Creation Prompt builder
    │   └── aiProviders.ts                # Metadata & curated model lists for OpenRouter + 6 other AI providers
    ├── services/
    │   ├── aiClient.ts                   # Typed browser fetch client calling /api/ai/* (zero keys in browser)
    │   └── systemClient.ts               # Typed browser fetch client calling /api/system/probe & /api/npm/*
    └── components/
        ├── charts/
        │   └── StudioCharts.tsx          # Recharts visualizations (PipelinePhase, HistoryDuration, ExecutionTiming, PMBenchmark)
        ├── controls/
        │   ├── MechanicalToggle.tsx      # Hardware-styled switch control
        │   ├── RotaryKnob.tsx            # Interactive SVG/pointer/keyboard/wheel numeric dial
        │   ├── SegmentedSelector.tsx     # Multi-option segmented button bar
        │   ├── StatusIndicator.tsx       # Non-pill semantic status readout (icon + label)
        │   ├── TechnicalMeter.tsx        # Segmented LED-style capacity meter
        │   └── VersionSelector.tsx       # Channel/version dropdown with installed vs. latest badge
        ├── icons/
        │   └── BrandMarks.tsx            # Custom SVG brand/framework/runtime/PM icons & StudioLogoMark
        ├── layout/
        │   ├── Sidebar.tsx               # Left persistent navigation rail, Cmd+K trigger, & local environment footer
        │   └── InspectorPanel.tsx        # Right collapsible contextual inspector + Compatibility Auto-Fix & Docs links
        ├── studio/
        │   ├── AiArchitectPanel.tsx      # Stack Recommendations (curated/offline/AI) + Project Creation Prompt Studio
        │   ├── BulkFileRenamePanel.tsx   # Pre-execution directory alignment, case transforms, regex/affix, & AI rename advisor
        │   └── CommandPalette.tsx        # Global Cmd+K / Ctrl+K quick-jump, action, and official docs search modal
        └── screens/
            ├── OverviewScreen.tsx        # Workstation readiness, Recharts phase/history charts, quick recipes, recent runs
            ├── ProjectStudioScreen.tsx   # Primary configuration workbench + Generated Execution Plan (4 tabs) + Initialise bar
            ├── PackageStudioScreen.tsx   # Searchable/filterable dependency catalog & version pinning
            ├── RuntimeManagerScreen.tsx  # Runtime version channels & PM Cold/Warm benchmark chart
            ├── WorkflowBuilderScreen.tsx # Dependency-ordered workflow DAG editor & Sync from Studio
            ├── OperationsCentreScreen.tsx# Live dry-run runner, timing chart, log stream, fault injection, & AI diagnostics
            ├── DocumentationScreen.tsx   # In-app interactive tutorial, control reference, & codebase map
            └── SecondaryManagementScreens.tsx # IntegrationRegistry, ProjectRecipes, InstallationHistory, Diagnostics, Settings
```

---

## 3. Core Architectural Principles & Data Flow

### 3.1 Unidirectional Deterministic Core (`src/App.tsx` + `src/data/studioCatalog.ts`)
Visual Line Interface treats `ProjectConfig` in `src/App.tsx` as the single source of truth. Every UI change triggers `handleUpdateConfig(patch)`, which synchronizes `selectedPackageIds` (for Tailwind, TypeScript, ESLint, Prettier, Biome, Vitest, Playwright) and recomputes derived outputs via pure functions in `src/data/studioCatalog.ts` and `src/data/stackAdvisor.ts`:

```text
User Interaction (Controls / Stack Advisor / Bulk Rename / Package Studio)
        │
        ▼
ProjectConfig (src/App.tsx state)
        ├──▶ validateProjectCompatibility(config)     -> CompatibilityIssue[] (Inspector & Preflight)
        ├──▶ buildScaffoldManifest(config)            -> ScaffoldFileEntry[] (Bulk Rename & File Tree tab)
        ├──▶ buildExecutionPlan(config, pkgs, shell)  -> ExecutionCommandStep[] (Commands tab & Operations)
        ├──▶ buildGeneratedPackageJson(config, pkgs)  -> JSON string (package.json tab)
        ├──▶ buildScaffoldConfigFiles(config, pkgs)   -> GeneratedConfigFile[] (Config Files tab)
        └──▶ buildProjectCreationPrompt(...)          -> Markdown string (Create Prompt tab & Prompt Studio)
```

### 3.2 `localStorage` Persistence Keys (`src/App.tsx`)
All four keys migrate transparently from legacy `visual_cli_studio_*_v1` keys via `readStorageWithMigration`:
- `visual_line_interface_recipes_v1`: Saved `SavedRecipe[]` (merged defensively with `DEFAULT_PROJECT_CONFIG` on load).
- `visual_line_interface_settings_v1`: `StudioSettings` (merged with `DEFAULT_SETTINGS`; validates `aiProvider` & `aiModel` on boot).
- `visual_line_interface_workflows_v1`: User-edited `WorkflowNode[]` pipeline.
- `visual_line_interface_history_v1`: Recorded `HistoryRecord[]` execution runs.

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
     - `'troubleshoot'`: Analyzes a failed step + terminal logs in Operations Centre.
   - All network calls gracefully fall back to deterministic local outputs if the provider is unavailable.

---

## 4. Module-by-Module Reference

### `server.ts`
- **Port & Middleware**: Reads `PORT` (default `3000`), parses JSON (`limit: '512kb'`), mounts Vite dev middleware when `NODE_ENV !== 'production'` or serves `dist/` in production.
- **Endpoints**:
  - `GET /api/health` — Returns `{ ok: true, timestamp }`.
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
Defines every domain union and interface (`ScreenId`, `FrameworkId`, `RuntimeId`, `PackageManagerId`, `FileNamingConvention`, `DirectoryLayoutMode`, `ProjectConfig`, `CompatibilityIssue`, `ExecutionCommandStep`, `GeneratedConfigFile`, `SystemProbeResult`, `NpmSearchPackage`, `NpmPackageDetail`, `StudioPackage`, `WorkflowNode`, `InspectorTarget`, `AiProviderId`, `AiStackRecommendation`, `AiDiagnosticResponse`, `AiRenameSuggestion`, `AiPromptSynthesis`, `StudioSettings`).
*Important naming note*: Use `FileNamingConvention` (`'kebab-case' | 'camelCase' | 'PascalCase' | 'snake_case'`) and `DirectoryLayoutMode` (`'standard' | 'feature-sliced' | 'domain-scoped'`).

### `src/data/studioCatalog.ts`
- **Catalogs**: `FRAMEWORKS`, `INITIAL_RUNTIMES`, `INITIAL_PACKAGE_MANAGERS`, `STUDIO_PACKAGES`, `TOOLCHAIN_DOCS`, `INITIAL_RECIPES`, `INITIAL_WORKFLOW_NODES`, `OPERATION_LIBRARY_TEMPLATES`, `INITIAL_HISTORY`, `DEFAULT_PROJECT_CONFIG`, `DEFAULT_SETTINGS`.
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
Four Recharts components styled to match `#101214` / `#1D2126` / `#C7A46A` / `#65B9A5`:
- `PipelinePhaseChart` (bar chart of estimated duration by execution phase)
- `HistoryDurationChart` (area chart of recorded execution durations)
- `ExecutionTimingChart` (grouped bar chart comparing baseline estimate vs. actual dry-run duration)
- `PackageManagerBenchmarkChart` (cold vs. warm install profile highlighting active package manager)

---

## 5. Rules & Guardrails for Coding Agents

1. **No Browser API Key Inputs or Client Secrets**: Never add UI inputs for API keys, never import `@google/genai` in `src/`, and never read private env vars via `VITE_*`. All keys stay in server `process.env`.
2. **Preserve Non-AI Baseline**: Every core workflow (`ProjectStudioScreen`, `BulkFileRenamePanel`, `PackageStudioScreen`, `WorkflowBuilderScreen`, `OperationsCentreScreen`, `buildProjectCreationPrompt`, `recommendStackOffline`) must continue working cleanly when `settings.aiEnabled === false` or when backend providers are unconfigured.
3. **Node ESM Type Imports in `server.ts`**: Keep explicit `.ts` extensions on `import type` statements in `server.ts` (e.g. `import type { ... } from './src/types/studio.ts'`) so both `tsc --noEmit` (`allowImportingTsExtensions: true`) and Node v22+ native type stripping work.
4. **Styling & Design System Rules**:
   - Use Tailwind CSS v4 utility classes; keep the `#101214` / `#171A1E` / `#1D2126` / `#252A30` + `#C7A46A` (brass) + `#65B9A5` (technical green) palette.
   - Avoid static pill badges (`rounded-full` chips on metadata), thick left accent borders (`border-l-4`), pulsing dots, and generic AI slop copy.
   - Use `JetBrains Mono` (`font-mono tabular-nums`) for commands, paths, versions, and numeric readouts.

---

## 6. Common Extension Recipes

### Adding a New Library to `Package & Library Studio`
1. Add a `StudioPackage` entry to `STUDIO_PACKAGES` in `src/data/studioCatalog.ts` (include `docsUrl`, `availableVersions`, `compatibleFrameworks`, `integrationFiles`).
2. If the package needs dedicated install flags or init commands, handle its `id` in `buildExecutionPlan` and `buildGeneratedPackageJson` in `src/data/studioCatalog.ts`, and add its `id` to `allowedExtraPackages` in `server.ts` (`sanitizeRecommendation`).

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
