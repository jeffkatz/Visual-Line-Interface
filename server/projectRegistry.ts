import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { FrameworkId, PackageManagerId, ProjectType } from '../src/types/studio.ts';
import type { InstalledProject } from '../src/types/projectActions.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function registryPath(): string {
  const userDirectory = process.env.APPDATA || process.env.LOCALAPPDATA || os.homedir();
  const dataDirectory = process.env.VLI_DATA_DIR || path.join(userDirectory, '.visual-line-interface');
  return path.join(dataDirectory, 'projects.json');
}

function detectFramework(packageJson: Record<string, unknown>): FrameworkId {
  const dependencies = {
    ...(isRecord(packageJson.dependencies) ? packageJson.dependencies : {}),
    ...(isRecord(packageJson.devDependencies) ? packageJson.devDependencies : {}),
  };
  if (dependencies.next) return 'nextjs';
  if (dependencies.astro) return 'astro';
  if (dependencies['@angular/core']) return 'angular';
  if (dependencies['@sveltejs/kit']) return 'sveltekit';
  if (dependencies.vue) return 'vue';
  return 'vite';
}

function detectPackageManager(directory: string): PackageManagerId | undefined {
  if (['bun.lockb', 'bun.lock'].some((file) => fileExists(path.join(directory, file)))) return 'bun';
  if (fileExists(path.join(directory, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fileExists(path.join(directory, 'yarn.lock'))) return 'yarn';
  if (fileExists(path.join(directory, 'package-lock.json'))) return 'npm';
  return undefined;
}

function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

async function realProjectDirectory(value: unknown): Promise<string> {
  if (typeof value !== 'string' || !path.isAbsolute(value)) {
    throw new Error('Choose a valid absolute project folder.');
  }
  let directory: string;
  try {
    directory = await fs.realpath(value);
  } catch {
    throw new Error('Project folder does not exist or is not accessible.');
  }
  if (!(await fs.stat(directory)).isDirectory()) {
    throw new Error('Project location must be a folder.');
  }
  return directory;
}

export class ProjectRegistry {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath = registryPath()) {}

  private async read(): Promise<InstalledProject[]> {
    try {
      const parsed: unknown = JSON.parse(await fs.readFile(this.filePath, 'utf8'));
      if (!Array.isArray(parsed)) throw new Error('Project registry has an invalid format.');
      return parsed as InstalledProject[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw new Error(`Unable to read the local project registry: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async update(
    transform: (projects: InstalledProject[]) => InstalledProject[]
  ): Promise<InstalledProject[]> {
    const operation = this.writeQueue.then(async () => {
      const projects = transform(await this.read());
      await fs.mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
      const temporaryPath = `${this.filePath}.${randomUUID()}.tmp`;
      await fs.writeFile(temporaryPath, JSON.stringify(projects, null, 2), { mode: 0o600 });
      await fs.rename(temporaryPath, this.filePath);
      return projects;
    });
    this.writeQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  async list(): Promise<InstalledProject[]> {
    await this.writeQueue;
    return this.read();
  }

  async registerCreated(project: Omit<InstalledProject, 'id' | 'origin' | 'addedAt'>): Promise<InstalledProject> {
    const directory = await realProjectDirectory(project.directory);
    const updated = await this.update((projects) => {
      const previous = projects.find((item) => item.directory === directory);
      const registered: InstalledProject = {
        ...project,
        id: previous?.id ?? randomUUID(),
        directory,
        origin: 'created',
        addedAt: previous?.addedAt ?? new Date().toISOString(),
      };
      return [...projects.filter((item) => item.directory !== directory), registered];
    });
    const registered = updated.find((item) => item.directory === directory);
    if (!registered) throw new Error('Failed to register the created project.');
    return registered;
  }

  async importDirectory(value: unknown): Promise<InstalledProject> {
    const directory = await realProjectDirectory(value);
    let packageJson: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(await fs.readFile(path.join(directory, 'package.json'), 'utf8'));
      if (!isRecord(parsed)) throw new Error('package.json must contain a JSON object.');
      packageJson = parsed;
    } catch (error) {
      throw new Error(`Could not import this folder: ${error instanceof Error ? error.message : String(error)}`);
    }

    const dependencyNames = [
      ...(isRecord(packageJson.dependencies) ? Object.keys(packageJson.dependencies) : []),
      ...(isRecord(packageJson.devDependencies) ? Object.keys(packageJson.devDependencies) : []),
    ];
    const apiOnly =
      dependencyNames.includes('express') &&
      !dependencyNames.some((name) => ['next', 'astro', '@angular/core', '@sveltejs/kit', 'vue', 'vite'].includes(name));
    const projectName = typeof packageJson.name === 'string' && packageJson.name.trim()
      ? packageJson.name.trim()
      : path.basename(directory);
    const updated = await this.update((projects) => {
      const previous = projects.find((item) => item.directory === directory);
      const imported: InstalledProject = {
        id: previous?.id ?? randomUUID(),
        projectName,
        projectType: apiOnly ? 'api' as ProjectType : 'frontend' as ProjectType,
        framework: detectFramework(packageJson),
        packageManager: detectPackageManager(directory),
        directory,
        origin: 'imported',
        addedAt: previous?.addedAt ?? new Date().toISOString(),
      };
      return [...projects.filter((item) => item.directory !== directory), imported];
    });
    const imported = updated.find((item) => item.directory === directory);
    if (!imported) throw new Error('Failed to register the imported project.');
    return imported;
  }

  async remove(id: string): Promise<boolean> {
    let found = false;
    await this.update((projects) => {
      found = projects.some((project) => project.id === id);
      return projects.filter((project) => project.id !== id);
    });
    return found;
  }
}

export const projectRegistry = new ProjectRegistry();
