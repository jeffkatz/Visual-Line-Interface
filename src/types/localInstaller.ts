import type { FrameworkId, LanguageId, PackageManagerId, ViteUiFramework } from './studio';

export interface ProjectInstallPackage {
  name: string;
  version: string;
  isDevDependency: boolean;
}

export interface ProjectInstallInput {
  directory: string;
  projectName: string;
  framework: FrameworkId;
  viteUiFramework: ViteUiFramework;
  language: LanguageId;
  packageManager: PackageManagerId;
  packages: ProjectInstallPackage[];
}

export interface ProjectInstallStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  durationMs: number;
  outputLines: string[];
}

export interface ProjectInstallJob {
  id: string;
  status: 'running' | 'completed' | 'failed';
  projectPath: string;
  currentStep: string | null;
  steps: ProjectInstallStep[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}
