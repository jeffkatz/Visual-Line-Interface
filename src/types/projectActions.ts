import type {
  FrameworkId,
  FullStackLayout,
  PackageManagerId,
  ProjectTechnologyConfig,
  ProjectType,
} from './studio';

export type ProjectRunTarget = 'frontend' | 'api';
export type ProjectRunStatus = 'running' | 'stopped' | 'failed';
export type EditorId =
  | 'vscode'
  | 'visual-studio'
  | 'antigravity'
  | 'codex'
  | 'claude-code'
  | 'opencode'
  | 'cursor'
  | 'webstorm'
  | 'idea'
  | 'zed';

export interface ProjectRunInput {
  directory: string;
  framework: FrameworkId;
  target: ProjectRunTarget;
}

export interface ProjectRunSession {
  id: string;
  projectName: string;
  directory: string;
  target: ProjectRunTarget;
  framework: FrameworkId;
  port: number;
  url: string;
  status: ProjectRunStatus;
  startedAt: string;
  error?: string;
}

export interface ProjectEditor {
  id: EditorId;
  label: string;
  available: boolean;
}

export interface InstalledProject {
  id: string;
  projectName: string;
  projectType: ProjectType;
  fullStackLayout?: FullStackLayout;
  framework: FrameworkId;
  packageManager?: PackageManagerId;
  technology?: ProjectTechnologyConfig;
  directory: string;
  frontendPath?: string;
  apiPath?: string;
  workspacePath?: string;
  origin: 'created' | 'imported';
  addedAt: string;
}

export interface GitRemote {
  name: string;
  url: string;
}

export interface GitStatus {
  isRepository: boolean;
  root?: string;
  branch?: string;
  staged: string[];
  modified: string[];
  untracked: string[];
  remotes: GitRemote[];
}

export interface GitSigningConfig {
  name: string;
  email: string;
  enabled: boolean;
  format: 'openpgp' | 'ssh';
  signingKey?: string;
}

export type GitCredentialHelper = 'manager' | 'osxkeychain' | 'libsecret' | 'cache';
