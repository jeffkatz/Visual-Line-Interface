# Visual Line Interface — Codebase Audit, Fixes & Implementation Roadmap

## 1. Constructive Codebase Criticism & Applied Fixes

During a full architectural and UX review of Visual Line Interface (originally launched as Visual CLI Studio), the following concrete gaps and rough edges were identified and resolved:

1. **Unwired Workstation Settings (`settings` state was persisted but largely unused)**
   - *Criticism*: `SettingsScreen` persisted `shellTarget` (`zsh` / `bash` / `powershell`), `verboseCommandPreview`, `confirmBeforeExecution`, `defaultDirectory`, `preferredPackageManager`, and `preferredRuntime` to `localStorage`, yet `ProjectStudioScreen` and `buildExecutionPlan` ignored them—hardcoding `shell: zsh`, exporting `.sh` even for PowerShell users, and skipping preflight confirmation.
   - *Fix Applied*:
     - Updated `buildExecutionPlan(config, packages, shellTarget)` to generate PowerShell-compatible chaining (`; `), `New-Item -ItemType Directory -Force`, and `$env:NODE_OPTIONS=...` when `shellTarget === 'powershell'`.
     - Updated `ProjectStudioScreen` to display the configured shell target, export `.ps1` vs `.sh` with matching headers, render inline step explanations automatically when `verboseCommandPreview` is enabled, and display a Preflight Confirmation modal when `confirmBeforeExecution` is enabled.
     - Added an **Apply Defaults to Active Project** action in `SettingsScreen`.

2. **Package Version Overrides Ignored in Generated Commands**
   - *Criticism*: Selecting an alternate version in `PackageStudioScreen` updated `StudioPackage.version`, but `buildExecutionPlan` omitted version pins and always emitted unpinned package names.
   - *Fix Applied*: Passed active `packages` into `buildExecutionPlan` and `buildGeneratedPackageJson` so non-default package versions are pinned directly in CLI commands (`pkg@version`) and reflected in the `package.json` manifest preview.

3. **Non-Persistent Workflows & Installation History**
   - *Criticism*: `WorkflowBuilderScreen`'s **Save Workflow** button only flashed a temporary toast, and `history` lived solely in React memory—losing user edits and run records on refresh. `WorkflowBuilder` also lacked a way to pull steps from the active `ProjectStudio` configuration.
   - *Fix Applied*: Added `localStorage` persistence for both `workflowNodes` and `history` in `App.tsx`, wired `onSaveWorkflow`, and added a **Sync from Studio** action in `WorkflowBuilderScreen` to materialize the active execution plan into editable, dependency-linked pipeline nodes.

4. **Incomplete Contextual Inspector & Missing Official Documentation References**
   - *Criticism*: Clicking `compiler`, `testing`, or `devtools` controls fell through to the generic fallback inspector view, and `docsUrl` was missing on runtimes, package managers, languages, styling systems, testing runners, and packages.
   - *Fix Applied*:
     - Added `docsUrl` (and `releaseNotesUrl` where applicable) across all runtimes, package managers, and library catalog entries, plus a dedicated `TOOLCHAIN_DOCS` catalog covering TypeScript, JavaScript, SWC, esbuild, Tailwind CSS, Sass, CSS Modules, MDN CSS, Vitest, Playwright, ESLint, Prettier, Biome, React, Vue, Svelte, Solid, and Vanilla Web APIs.
     - Built dedicated inspector views for `compiler`, `testing`, and `devtools` in `InspectorPanel` with direct external documentation links and npm registry references.
     - Added `Docs` / `npm` / `Release Notes` links directly inside `ProjectStudioScreen`, `PackageStudioScreen`, `RuntimeManagerScreen`, and `IntegrationRegistryScreen`.

5. **Missing Developer Ergonomics & Manifest Visibility**
   - *Criticism*: Developers needed to see the exact resulting `package.json` and post-rename file tree before executing, copy individual CLI steps, quickly jump across screens/docs via keyboard, and recover gracefully from empty package search results.
   - *Fix Applied*:
     - Added **Commands | package.json | File Tree** tabs and per-step copy buttons to `ProjectStudioScreen`'s Generated Execution Plan surface.
     - Added a keyboard-driven **Command & Documentation Palette (`Cmd+K` / `Ctrl+K`)** accessible from anywhere in the workstation and from the sidebar.
     - Added a clear **Reset Filters** empty state in `PackageStudioScreen`.

---

## 2. What Is Implemented

### Core Workstation Shell & Navigation
- Persistent three-pane desktop layout (`Sidebar`, `Main Workspace`, collapsible `InspectorPanel`).
- Industrial dark palette (`#101214` / `#171A1E` / `#1D2126` / `#C7A46A` brass / `#65B9A5` green) with `Plus Jakarta Sans`, `IBM Plex Sans`, and `JetBrains Mono` typography.
- Global `Cmd+K` / `Ctrl+K` **Command & Documentation Palette** for instant navigation, framework switching, command copying, and opening official documentation.

### Project Studio & Bulk File Renaming
- Foundation selector (`Vite`, `Next.js`, `Astro`, `Vue`, `SvelteKit`) with live compatibility checks and official doc links.
- Segmented selectors and rotary dial controls (`RotaryKnob`) for Dev Port, Preview Port, Node Heap Limit, and Fetch Timeout.
- **Bulk File Rename** engine (`BulkFileRenamePanel`) supporting directory layout modes (`standard`, `feature-sliced`, `src-flat`), naming conventions (`kebab-case`, `camelCase`, `PascalCase`, `snake_case`), bulk prefix/suffix rules, find/replace regex/text transforms, per-file inline overrides, collision/invalid-path validation, and automated `mkdir` + `mv` CLI generation.
- Generated Execution Plan surface with **Commands** (sequence or raw), synthesized **Config Files** (`vite.config.*`, `next.config.*`, `astro.config.mjs`, `svelte.config.js`, `tsconfig.json`/`jsconfig.json`, target CSS, `biome.json`, `eslint.config.js`, `.prettierrc`, `vitest.config.*`, `playwright.config.*`), live **`package.json`**, post-rename **`File Tree`**, and **`Create Prompt`** preview tabs, per-step copy, `.sh`/`.ps1` script export, and optional preflight confirmation modal.

### Supporting Workspaces, Live Probing & Persistence
- **Overview**: Workstation readiness summary, Recharts pipeline breakdown & duration trend charts, and one-click recipe loading.
- **Package & Library Studio**: Search, capability-mode filtering (`Full Integration Setup` vs `Package Only`), category filters, **live `registry.npmjs.org` search & metadata import** (`/api/npm/search`, `/api/npm/package`) with version pinning, official Docs & npm links, and empty-filter reset.
- **Runtime Manager & Diagnostics**: Live host probing (`/api/system/probe`) for OS, CPU arch, `PATH` binaries (`node`, `deno`, `bun`, `npm`, `pnpm`, `yarn`, `git`), and real TCP port binding checks for `devPort` and `previewPort`.
- **Workflow Builder**: Dependency-ordered pipeline editor with block reordering, enable/disable toggles, validation warnings, **Sync from Studio**, and persistent saving.
- **Operations Centre**: Simulated dry-run step runner with pause/resume/cancel, simulated failure injection & retry recovery, Recharts step timing comparison, live log console, optional AI troubleshooting, and persistent history logging.
- **Secondary Screens & Tests**: Integration Registry, Project Recipes, Installation History, Live Environment Diagnostics, Docs & Tutorial, Workstation Settings (7 AI providers), and an automated unit test suite (`npm test` covering compatibility rules, bulk-rename alignment, config file synthesis, and offline prompts).

---

## 3. Remaining Native Desktop Scope (Optional Production Extension)

Live host binary probing, TCP port checks, live npm registry search, config file synthesis, and automated unit tests are now implemented inside the full-stack workstation. Because Visual Line Interface currently executes inside a browser/hosted workspace rather than writing directly to arbitrary local user directories:

1. **Local Execution Daemon / Native Desktop Shell (Tauri or Electron Companion)**
   - Spawn real interactive child processes (`node-pty`) in user-chosen local paths (`~/Projects/...`) with streaming ANSI output and automatic AST/import-path rewriting on disk.
   - Add Playwright browser end-to-end UI tests alongside the existing unit suite (`npm test`).
