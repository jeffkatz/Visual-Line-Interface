import { execFile, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import type {
  FrameworkId,
  LanguageId,
  PackageManagerId,
  ViteUiFramework,
} from '../src/types/studio.ts';

const execFileAsync = promisify(execFile);
const PROJECT_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,99}$/i;
const PACKAGE_NAME_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i;
const PACKAGE_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const FRAMEWORKS = new Set<FrameworkId>(['vite', 'nextjs', 'astro', 'vue', 'sveltekit']);
const VITE_UI_FRAMEWORKS = new Set<ViteUiFramework>(['react', 'vue', 'svelte', 'solid', 'vanilla']);
const LANGUAGES = new Set<LanguageId>(['typescript', 'javascript']);

export interface InstallPackage {
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
  packages: InstallPackage[];
}

export interface InstallStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  durationMs: number;
  outputLines: string[];
}

export interface InstallJob {
  id: string;
  status: 'running' | 'completed' | 'failed';
  projectPath: string;
  currentStep: string | null;
  steps: InstallStep[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}

const installJobs = new Map<string, InstallJob>();
let activeInstallJobId: string | null = null;

export class InstallerBusyError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateProjectInstallInput(value: unknown): ProjectInstallInput {
  if (!isRecord(value)) {
    throw new Error('Installation request must be a JSON object.');
  }

  const { directory, projectName, framework, viteUiFramework, language, packageManager } = value;
  if (typeof directory !== 'string' || directory.trim().length === 0 || directory.length > 1024) {
    throw new Error('Choose a valid local destination folder.');
  }
  if (!path.isAbsolute(directory)) {
    throw new Error('The destination folder must be an absolute local path.');
  }
  if (typeof projectName !== 'string' || !PROJECT_NAME_PATTERN.test(projectName)) {
    throw new Error('Project name must use letters, numbers, dots, underscores, or hyphens.');
  }
  if (typeof framework !== 'string' || !FRAMEWORKS.has(framework as FrameworkId)) {
    throw new Error('Choose a supported project framework.');
  }
  if (
    typeof viteUiFramework !== 'string' ||
    !VITE_UI_FRAMEWORKS.has(viteUiFramework as ViteUiFramework)
  ) {
    throw new Error('Choose a supported UI template.');
  }
  if (typeof language !== 'string' || !LANGUAGES.has(language as LanguageId)) {
    throw new Error('Choose JavaScript or TypeScript.');
  }
  if (
    typeof packageManager !== 'string' ||
    packageManager !== 'npm'
  ) {
    throw new Error('The local installer currently supports npm only.');
  }
  if (!Array.isArray(value.packages) || value.packages.length > 50) {
    throw new Error('Choose no more than 50 additional packages.');
  }

  const packages = value.packages.map((item): InstallPackage => {
    if (!isRecord(item)) {
      throw new Error('Each package selection must be a JSON object.');
    }
    if (
      typeof item.name !== 'string' ||
      item.name.length > 214 ||
      !PACKAGE_NAME_PATTERN.test(item.name)
    ) {
      throw new Error('A selected package has an invalid npm package name.');
    }
    if (
      typeof item.version !== 'string' ||
      !PACKAGE_VERSION_PATTERN.test(item.version)
    ) {
      throw new Error(`Selected package "${item.name}" has an invalid pinned version.`);
    }
    if (typeof item.isDevDependency !== 'boolean') {
      throw new Error(`Selected package "${item.name}" has an invalid dependency type.`);
    }
    return {
      name: item.name,
      version: item.version,
      isDevDependency: item.isDevDependency,
    };
  });

  if (new Set(packages.map((item) => item.name)).size !== packages.length) {
    throw new Error('The selected package list contains duplicates.');
  }

  return {
    directory: directory.trim(),
    projectName,
    framework: framework as FrameworkId,
    viteUiFramework: viteUiFramework as ViteUiFramework,
    language: language as LanguageId,
    packageManager: packageManager as PackageManagerId,
    packages,
  };
}

export function buildScaffoldArgs(input: Pick<
  ProjectInstallInput,
  'framework' | 'viteUiFramework' | 'language' | 'projectName'
>): string[] {
  const name = input.projectName;
  const languageSuffix = input.language === 'typescript' ? '-ts' : '';

  if (input.framework === 'vite') {
    const swcSuffix =
      input.viteUiFramework === 'react' && input.language === 'typescript' ? '-swc' : '';
    const template = `${input.viteUiFramework}${swcSuffix}${languageSuffix}`;
    return ['create', 'vite@latest', name, '--', '--template', template];
  }
  if (input.framework === 'nextjs') {
    return [
      'create',
      'next-app@latest',
      name,
      '--',
      '--yes',
      input.language === 'typescript' ? '--ts' : '--js',
      '--app',
      '--skip-install',
    ];
  }
  if (input.framework === 'astro') {
    return [
      'create',
      'astro@latest',
      name,
      '--',
      '--template',
      'minimal',
      '--yes',
      '--no-install',
      '--typescript',
      input.language === 'typescript' ? 'strict' : 'none',
    ];
  }
  if (input.framework === 'vue') {
    return ['create', 'vue@latest', name, '--', '--default'];
  }
  return [
    'exec',
    '--yes',
    '--package',
    'sv',
    '--',
    'sv',
    'create',
    name,
    '--template',
    'minimal',
    '--types',
    input.language === 'typescript' ? 'ts' : 'jsdoc',
    '--no-add-ons',
    '--no-install',
  ];
}

export async function chooseLocalDirectory(): Promise<string | null> {
  if (process.platform === 'win32') {
    const script =
      "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; $dialog.Description = 'Choose a parent folder for the new project'; $dialog.ShowNewFolderButton = $true; if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::WriteLine($dialog.SelectedPath) }";
    try {
      const { stdout } = await execFileAsync(
        'powershell.exe',
        ['-NoProfile', '-STA', '-Command', script],
        { timeout: 120000, windowsHide: false, maxBuffer: 1024 * 16 }
      );
      return stdout.trim() || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not open the Windows folder picker: ${message}`);
    }
  }

  if (process.platform === 'darwin') {
    try {
      const { stdout } = await execFileAsync(
        'osascript',
        ['-e', 'POSIX path of (choose folder with prompt "Choose a parent folder for the new project")'],
        { timeout: 120000, maxBuffer: 1024 * 16 }
      );
      return stdout.trim() || null;
    } catch (error) {
      if (isPickerCancelled(error)) return null;
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not open the macOS folder picker: ${message}`);
    }
  }

  if (process.platform === 'linux') {
    try {
      const { stdout } = await execFileAsync(
        'zenity',
        ['--file-selection', '--directory', '--title=Choose a parent folder for the new project'],
        { timeout: 120000, maxBuffer: 1024 * 16 }
      );
      return stdout.trim() || null;
    } catch (error) {
      if (isPickerCancelled(error)) return null;
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not open a Linux folder picker. Install zenity or use a supported desktop environment: ${message}`);
    }
  }

  throw new Error(`Native folder selection is not supported on ${process.platform}.`);
}

function isPickerCancelled(error: unknown): boolean {
  return isRecord(error) && (error.code === 1 || error.code === -128);
}

function appendOutput(step: InstallStep, text: string): void {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;
    step.outputLines.push(trimmed.slice(0, 1000));
    if (step.outputLines.length > 80) step.outputLines.shift();
  }
}

export function resolveNpmCliPath(): string {
  const candidates = [
    path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.resolve(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    process.env.npm_execpath,
  ];
  const cliPath = candidates.find(
    (candidate) =>
      typeof candidate === 'string' &&
      path.isAbsolute(candidate) &&
      path.basename(candidate) === 'npm-cli.js' &&
      existsSync(candidate)
  );
  if (!cliPath) {
    throw new Error('Could not locate npm next to Node.js. Install Node.js with npm and try again.');
  }
  return cliPath;
}

const NPM_NETWORK_OPTIONS = [
  '--fetch-retries=4',
  '--fetch-retry-mintimeout=10000',
  '--fetch-retry-maxtimeout=120000',
  '--maxsockets=8',
];

function runNpm(
  args: string[],
  cwd: string,
  step: InstallStep
): Promise<void> {
  return new Promise((resolve, reject) => {
    let npmCliPath: string;
    try {
      npmCliPath = resolveNpmCliPath();
    } catch (error) {
      step.status = 'failed';
      reject(error);
      return;
    }

    const child = spawn(process.execPath, [npmCliPath, ...NPM_NETWORK_OPTIONS, ...args], {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`"${step.label}" exceeded the 10-minute time limit.`));
    }, 10 * 60 * 1000);
    const started = Date.now();
    step.status = 'running';
    const collect = (chunk: Buffer) => appendOutput(step, chunk.toString('utf8'));
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.once('error', (error) => {
      clearTimeout(timer);
      step.durationMs = Date.now() - started;
      step.status = 'failed';
      reject(new Error(`Could not start npm: ${error.message}`));
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      step.durationMs = Date.now() - started;
      if (code === 0) {
        step.status = 'completed';
        resolve();
      } else {
        step.status = 'failed';
        reject(new Error(`"${step.label}" failed with exit code ${code ?? 'unknown'}.`));
      }
    });
  });
}

export function npmPackageArgs(packages: InstallPackage[]): string[][] {
  const groups = [
    { selected: packages.filter((item) => !item.isDevDependency), dev: false },
    { selected: packages.filter((item) => item.isDevDependency), dev: true },
  ];
  const result: string[][] = [];

  for (const group of groups) {
    if (group.selected.length === 0) continue;
    const specs = group.selected.map((item) => `${item.name}@${item.version}`);
    result.push(['install', ...(group.dev ? ['--save-dev'] : []), ...specs]);
  }
  return result;
}

function makeSteps(input: ProjectInstallInput): InstallStep[] {
  const steps: InstallStep[] = [
    { id: 'scaffold', label: `Create ${input.framework} project`, status: 'pending', durationMs: 0, outputLines: [] },
    { id: 'dependencies', label: `Install dependencies with ${input.packageManager}`, status: 'pending', durationMs: 0, outputLines: [] },
  ];
  for (const [index] of npmPackageArgs(input.packages).entries()) {
    steps.push({
      id: `packages-${index + 1}`,
      label: `Install selected ${index === 0 && input.packages.some((item) => !item.isDevDependency) ? 'runtime' : 'development'} packages`,
      status: 'pending',
      durationMs: 0,
      outputLines: [],
    });
  }
  return steps;
}

export async function prepareProjectPath(input: ProjectInstallInput): Promise<string> {
  let directory: string;
  try {
    directory = await fs.realpath(input.directory);
  } catch {
    throw new Error('The selected destination folder no longer exists. Choose it again.');
  }
  const stat = await fs.stat(directory);
  if (!stat.isDirectory()) {
    throw new Error('The selected destination must be a folder.');
  }
  try {
    await fs.access(directory, fsConstants.W_OK);
  } catch {
    throw new Error('The selected destination folder is not writable.');
  }

  const projectPath = path.resolve(directory, input.projectName);
  if (path.dirname(projectPath) !== directory) {
    throw new Error('The project path must stay inside the selected destination folder.');
  }
  try {
    await fs.lstat(projectPath);
    throw new Error(`"${projectPath}" already exists. Choose another project name or destination.`);
  } catch (error) {
    if (isRecord(error) && error.code === 'ENOENT') return projectPath;
    throw error;
  }
}

export async function startProjectInstall(value: unknown): Promise<InstallJob> {
  if (activeInstallJobId) {
    throw new InstallerBusyError('Another project installation is already running. Wait for it to finish.');
  }
  const input = validateProjectInstallInput(value);
  const projectPath = await prepareProjectPath(input);
  const job: InstallJob = {
    id: randomUUID(),
    status: 'running',
    projectPath,
    currentStep: null,
    steps: makeSteps(input),
    startedAt: new Date().toISOString(),
  };
  installJobs.set(job.id, job);
  activeInstallJobId = job.id;

  void runInstallJob(job, input).finally(() => {
    if (activeInstallJobId === job.id) activeInstallJobId = null;
  });
  return job;
}

async function runInstallJob(job: InstallJob, input: ProjectInstallInput): Promise<void> {
  try {
    job.currentStep = 'scaffold';
    await runNpm(buildScaffoldArgs(input), path.dirname(job.projectPath), job.steps[0]);

    job.currentStep = 'dependencies';
    await runNpm(['install'], job.projectPath, job.steps[1]);

    const packageArgs = npmPackageArgs(input.packages);
    for (const [index, args] of packageArgs.entries()) {
      const step = job.steps[index + 2];
      job.currentStep = step.id;
      await runNpm(args, job.projectPath, step);
    }
    job.status = 'completed';
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : String(error);
    const failedStep = job.steps.find((step) => step.status === 'running');
    if (failedStep) failedStep.status = 'failed';
  } finally {
    job.currentStep = null;
    job.completedAt = new Date().toISOString();
    pruneJobs();
  }
}

function pruneJobs(): void {
  const staleBefore = Date.now() - 6 * 60 * 60 * 1000;
  for (const [id, job] of installJobs) {
    if (Date.parse(job.startedAt) < staleBefore && job.status !== 'running') {
      installJobs.delete(id);
    }
  }
}

export function getInstallJob(id: string): InstallJob | undefined {
  return installJobs.get(id);
}

