import type { FrameworkId } from './studio';

export type ProjectRunTarget = 'frontend' | 'api';
export type ProjectRunStatus = 'running' | 'stopped' | 'failed';
export type EditorId = 'vscode' | 'antigravity' | 'codex' | 'opencode' | 'cursor';

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
