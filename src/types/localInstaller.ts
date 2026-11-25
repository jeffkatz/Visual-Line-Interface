import type {
  ApiFrameworkId,
  DatabaseId,
  FrameworkId,
  FullStackLayout,
  LanguageId,
  PackageManagerId,
  ProjectType,
  ProjectTechnologyConfig,
  ViteUiFramework,
} from './studio';

export interface ProjectInstallPackage {
  name: string;
  version: string;
  isDevDependency: boolean;
}

export interface ProjectInstallInput {
  directory: string;
  projectName: string;
  projectType: ProjectType;
  databases: DatabaseId[];
  fullStackLayout: FullStackLayout;
  apiFramework: ApiFrameworkId;
  framework: FrameworkId;
  viteUiFramework: ViteUiFramework;
  language: LanguageId;
  packageManager: PackageManagerId;
  initGit: boolean;
  technology: ProjectTechnologyConfig;
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
  projectName: string;
  projectType: ProjectType;
  databases: DatabaseId[];
  fullStackLayout: FullStackLayout;
  apiFramework: ApiFrameworkId;
  framework: FrameworkId;
  packageManager: PackageManagerId;
  technology: ProjectTechnologyConfig;
  projectPath: string;
  frontendPath?: string;
  apiPath?: string;
  workspacePath?: string;
  currentStep: string | null;
  steps: ProjectInstallStep[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}
