export type ScreenId =
  | 'overview'
  | 'project-studio'
  | 'packages'
  | 'runtimes'
  | 'workflows'
  | 'operations'
  | 'integrations'
  | 'recipes'
  | 'history'
  | 'diagnostics'
  | 'docs'
  | 'settings';

export type FrameworkId = 'vite' | 'nextjs' | 'astro' | 'vue' | 'sveltekit';
export type ViteUiFramework = 'react' | 'vue' | 'svelte' | 'solid' | 'vanilla';
export type LanguageId = 'typescript' | 'javascript';
export type BuildCompilerId = 'swc' | 'standard';
export type DevToolId = 'eslint' | 'prettier' | 'biome';
export type StylingId = 'tailwind' | 'sass' | 'css-modules' | 'plain-css';
export type TestingId = 'vitest' | 'playwright' | 'none';
export type RuntimeId = 'node' | 'deno' | 'bun';
export type PackageManagerId = 'npm' | 'pnpm' | 'yarn' | 'bun';

export type StatusTone =
  | 'installed'
  | 'available'
  | 'missing'
  | 'running'
  | 'failed'
  | 'attention';

export type FileNamingConvention = 'kebab-case' | 'camelCase' | 'PascalCase' | 'snake_case';
export type DirectoryLayoutMode = 'standard' | 'feature-sliced' | 'domain-scoped';

export interface ScaffoldFileEntry {
  id: string;
  originalPath: string;
  targetPath: string;
  category: 'source' | 'style' | 'config' | 'test';
  conventionExempt?: boolean;
  description: string;
}

export interface GeneratedConfigFile {
  id: string;
  filePath: string;
  language: 'typescript' | 'json' | 'css' | 'javascript';
  summary: string;
  content: string;
}

export interface SystemProbeBinary {
  id: string;
  name: string;
  installed: boolean;
  version: string | null;
  binaryPath: string | null;
}

export interface SystemProbePort {
  port: number;
  available: boolean;
  note: string;
}

export interface SystemProbeResult {
  probedAt: string;
  osLabel: string;
  platform: string;
  release: string;
  arch: string;
  hostname: string;
  pathSummary: string;
  runtimes: SystemProbeBinary[];
  packageManagers: SystemProbeBinary[];
  git: {
    installed: boolean;
    version: string | null;
    userName: string | null;
  };
  ports: {
    dev: SystemProbePort;
    preview: SystemProbePort;
  };
}

export interface NpmSearchPackage {
  name: string;
  version: string;
  description: string;
  date?: string;
  homepage?: string;
  repository?: string;
  npmUrl: string;
  keywords?: string[];
}

export interface NpmPackageDetail {
  name: string;
  version: string;
  availableVersions: string[];
  description: string;
  license: string;
  homepage: string;
  npmUrl: string;
  peerDependencies: string[];
  deprecated?: string;
}

export interface ProjectConfig {
  framework: FrameworkId;
  viteUiFramework: ViteUiFramework;
  language: LanguageId;
  compiler: BuildCompilerId;
  devTools: DevToolId[];
  styling: StylingId;
  testing: TestingId;
  runtime: RuntimeId;
  runtimeVersion: string;
  packageManager: PackageManagerId;
  projectName: string;
  directory: string;
  installDependencies: boolean;
  initGit: boolean;
  strictTypeScript: boolean;
  tailwindVersion: '4.1' | '3.4';
  devPort: number;
  previewPort: number;
  memoryLimitMb: number;
  networkTimeoutSec: number;
  selectedPackageIds: string[];
  directoryNamingConvention: FileNamingConvention;
  directoryLayoutMode: DirectoryLayoutMode;
  autoAlignFileNaming: boolean;
  fileRenameOverrides: Record<string, string>;
  selectedRenameFilePaths: string[];
}

export interface CompatibilityIssue {
  id: string;
  severity: 'warning' | 'error' | 'info';
  title: string;
  detail: string;
  affectedControl: string;
  suggestedFix?: string;
}

export interface ExecutionCommandStep {
  id: string;
  phase: 'Scaffold' | 'Configure' | 'Dependencies' | 'Tooling' | 'Repository' | 'Verify';
  label: string;
  command: string;
  description: string;
  estimatedSec: number;
}

export interface FrameworkMeta {
  id: FrameworkId;
  name: string;
  tagline: string;
  latestVersion: string;
  compatibility: StatusTone;
  compatibilityLabel: string;
  defaultPort: number;
  supportsSwc: boolean;
  supportsReactVariant: boolean;
  docsUrl: string;
  summary: string;
  requirements: string[];
  cliPackage: string;
}

export interface RuntimeInfo {
  id: RuntimeId;
  name: string;
  installedVersion: string | null;
  selectedVersion: string;
  latestVersion: string;
  availableVersions: string[];
  status: StatusTone;
  binaryPath: string;
  manager: string;
  architecture: string;
  notes: string;
  docsUrl: string;
  releaseNotesUrl?: string;
}

export interface PackageManagerInfo {
  id: PackageManagerId;
  name: string;
  version: string;
  latestVersion: string;
  lockfile: string;
  status: StatusTone;
  compatibleRuntimes: RuntimeId[];
  notes: string;
  docsUrl: string;
}

export type PackageCategory =
  | 'All'
  | 'Styling & UI'
  | 'Language & Types'
  | 'Linting & Format'
  | 'Testing'
  | 'Routing & State';

export interface StudioPackage {
  id: string;
  name: string;
  npmName: string;
  category: Exclude<PackageCategory, 'All'>;
  description: string;
  version: string;
  availableVersions: string[];
  isDevDependency: boolean;
  hasFullIntegration: boolean;
  integrationFiles: string[];
  peerDependencies: string[];
  compatibleFrameworks: FrameworkId[];
  status: StatusTone;
  configSummary: string;
  docsUrl: string;
  license?: string;
  deprecated?: string;
  isCustomNpm?: boolean;
}

export interface WorkflowNode {
  id: string;
  operationId: string;
  title: string;
  phase: ExecutionCommandStep['phase'];
  command: string;
  description: string;
  dependsOn: string[];
  enabled: boolean;
  timeoutSec: number;
  continueOnError: boolean;
}

export interface SavedRecipe {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  config: ProjectConfig;
  stepCount: number;
}

export interface OperationLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'cmd' | 'success' | 'warn' | 'error';
  stepId: string;
  message: string;
}

export interface ExecutionStepState {
  step: ExecutionCommandStep;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  durationMs: number;
  outputLines: string[];
}

export interface HistoryRecord {
  id: string;
  projectName: string;
  framework: FrameworkId;
  packageManager: PackageManagerId;
  directory: string;
  timestamp: string;
  status: 'completed' | 'failed' | 'cancelled';
  durationSec: number;
  commandCount: number;
  mode: 'Dry-Run Plan' | 'Simulated Execution' | 'Local Installation';
}

export type InspectorTarget =
  | { type: 'framework'; id: FrameworkId }
  | { type: 'vite-ui'; id: ViteUiFramework }
  | { type: 'runtime'; id: RuntimeId }
  | { type: 'package-manager'; id: PackageManagerId }
  | { type: 'compiler'; id: BuildCompilerId }
  | { type: 'language'; id: LanguageId }
  | { type: 'styling'; id: StylingId }
  | { type: 'testing'; id: TestingId }
  | { type: 'devtools'; id: DevToolId }
  | { type: 'rotary'; key: 'devPort' | 'previewPort' | 'memoryLimitMb' | 'networkTimeoutSec' }
  | { type: 'package'; id: string }
  | { type: 'workflow-node'; id: string }
  | { type: 'file-rename'; filePath?: string }
  | { type: 'execution' };

export type AiProviderId =
  | 'openrouter'
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'groq'
  | 'mistral'
  | 'ollama';

export interface AiModelOption {
  id: string;
  label: string;
  contextWindow: string;
  note: string;
}

export interface AiProviderMeta {
  id: AiProviderId;
  name: string;
  shortName: string;
  description: string;
  envVar: string;
  docsUrl: string;
  defaultModel: string;
  models: AiModelOption[];
  supportsCustomModel: boolean;
}

export interface AiProviderStatus {
  id: AiProviderId;
  name: string;
  envVar: string;
  configured: boolean;
  defaultModel: string;
}

export interface AiStackRecommendation {
  summary: string;
  rationale: string[];
  warnings: string[];
  suggestedConfig: {
    framework: FrameworkId;
    viteUiFramework?: ViteUiFramework;
    language: LanguageId;
    compiler: BuildCompilerId;
    styling: StylingId;
    testing: TestingId;
    devTools: DevToolId[];
    packageManager: PackageManagerId;
    runtime: RuntimeId;
    projectName: string;
    selectedPackageIds: string[];
    directoryLayoutMode: DirectoryLayoutMode;
    directoryNamingConvention: FileNamingConvention;
    devPort: number;
  };
}

export interface AiDiagnosticResponse {
  assessment: string;
  status: 'optimal' | 'advisory' | 'risk';
  findings: Array<{ title: string; detail: string; action: string }>;
  suggestedCommands: string[];
}

export interface AiRenameSuggestion {
  summary: string;
  directoryLayoutMode: DirectoryLayoutMode;
  directoryNamingConvention: FileNamingConvention;
  overrides: Record<string, string>;
}

export interface StackPresetProfile {
  id: string;
  title: string;
  audience: string;
  keywords: string[];
  recommendation: AiStackRecommendation;
}

export interface AiPromptSynthesis {
  promptText: string;
  highlights: string[];
}

export interface StudioSettings {
  defaultDirectory: string;
  preferredPackageManager: PackageManagerId;
  preferredRuntime: RuntimeId;
  shellTarget: 'zsh' | 'bash' | 'powershell';
  verboseCommandPreview: boolean;
  knobSensitivity: 'precision' | 'standard' | 'fast';
  confirmBeforeExecution: boolean;
  aiEnabled: boolean;
  aiProvider: AiProviderId;
  aiModel: string;
  aiCustomModel: string;
}
