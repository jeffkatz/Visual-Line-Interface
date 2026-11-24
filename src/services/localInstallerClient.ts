import type { ProjectConfig, StudioPackage } from '../types/studio';
import type { ProjectInstallInput, ProjectInstallJob } from '../types/localInstaller';

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || `Local project action failed (HTTP ${response.status}).`);
  }
  return data;
}

export async function chooseLocalDirectory(): Promise<string | null> {
  const response = await fetch('/api/local/choose-directory', { method: 'POST' });
  const data = await readJson<{ directory?: string; cancelled?: boolean }>(response);
  return data.directory ?? null;
}

export async function startProjectInstall(
  directory: string,
  config: ProjectConfig,
  packages: StudioPackage[]
): Promise<ProjectInstallJob> {
  const selectedPackages: ProjectInstallInput['packages'] = packages
    .filter((pkg) => config.selectedPackageIds.includes(pkg.id))
    .map((pkg) => ({
      name: pkg.npmName,
      version: pkg.version,
      isDevDependency: pkg.isDevDependency,
    }));

  const input: ProjectInstallInput = {
    directory,
    projectName: config.projectName.trim(),
    framework: config.framework,
    viteUiFramework: config.viteUiFramework,
    language: config.language,
    packageManager: 'npm',
    packages: selectedPackages,
  };
  const response = await fetch('/api/projects/install', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ job: ProjectInstallJob }>(response);
  return data.job;
}

export async function fetchProjectInstall(jobId: string): Promise<ProjectInstallJob> {
  const response = await fetch(`/api/projects/install/${encodeURIComponent(jobId)}`);
  const data = await readJson<{ job: ProjectInstallJob }>(response);
  return data.job;
}
