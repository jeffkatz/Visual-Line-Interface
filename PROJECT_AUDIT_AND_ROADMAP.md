# Visual Line Interface — Codebase Audit, Fixes & Implementation Roadmap

> Historical audit notes describe earlier versions of the interface. The current workspace map is maintained in the README; the former Workflow Builder, Integration Registry, and Package & Library Studio are no longer active screens.

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

- **Create New Project**: Four-step frontend, Express API, or full-stack setup with framework and optional package selection; Angular is supported alongside the existing frontend templates.
- **Installed projects**: Persistent install history with run/stop actions on an OS-allocated free port and editor launch actions for supported local editors.
- **Analog controls**: UI SDK behavior primitives provide accessible switch and segmented-control interactions while preserving the custom workstation styling.

### Supporting Workspaces, Live Probing & Persistence
- **Overview**: Local workspace summary, setup guidance, recent installations, and one-click project creation.
- **Runtime Manager & Diagnostics**: Live host probing (`/api/system/probe`) for OS, CPU arch, and `PATH` binaries; update Node through nvm/fnm/Volta, Deno through its self-updater, and Bun through stable/canary channels.
- **Tech Stack & Settings**: Curated stack recommendations, theme controls, About information, and environment diagnostics in Settings.
- **Database integrations**: Generated API driver dependencies, connection helpers, and `.env.example` templates for PostgreSQL, MongoDB, MySQL, SQLite, and Redis. Database services are not provisioned.
- **Tests**: Automated unit tests (`npm test`) cover compatibility rules, installer safety, database scaffolding, project actions, runtime updates, config synthesis, and offline prompts.

---

## 3. Remaining Native Desktop Scope (Optional Production Extension)

Live host binary probing, TCP port checks, live npm registry search, config file synthesis, and automated unit tests are now implemented inside the full-stack workstation. Because Visual Line Interface currently executes inside a browser/hosted workspace rather than writing directly to arbitrary local user directories:

1. **Local Execution Daemon / Native Desktop Shell (Tauri or Electron Companion)**
   - Spawn real interactive child processes (`node-pty`) in user-chosen local paths (`~/Projects/...`) with streaming ANSI output and automatic AST/import-path rewriting on disk.
   - Add Playwright browser end-to-end UI tests alongside the existing unit suite (`npm test`).
