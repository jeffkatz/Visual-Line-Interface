import { execFile, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import type {
  ApiFrameworkId,
  DatabaseId,
  FrameworkId,
  FullStackLayout,
  LanguageId,
  PackageManagerId,
  ProjectType,
  ViteUiFramework,
} from '../src/types/studio.ts';

const execFileAsync = promisify(execFile);
const PROJECT_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,99}$/i;
const PACKAGE_NAME_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i;
const PACKAGE_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const FRAMEWORKS = new Set<FrameworkId>(['vite', 'nextjs', 'astro', 'vue', 'sveltekit', 'angular']);
const VITE_UI_FRAMEWORKS = new Set<ViteUiFramework>(['react', 'vue', 'svelte', 'solid', 'vanilla']);
const LANGUAGES = new Set<LanguageId>(['typescript', 'javascript']);
const PROJECT_TYPES = new Set<ProjectType>(['frontend', 'api', 'fullstack']);
const FULL_STACK_LAYOUTS = new Set<FullStackLayout>(['workspace', 'separate']);
const API_FRAMEWORKS = new Set<ApiFrameworkId>(['express']);
const DATABASES = new Set<DatabaseId>(['postgresql', 'mongodb', 'mysql', 'sqlite', 'redis']);

export interface InstallPackage {
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
  projectName: string;
  projectType: ProjectType;
  databases: DatabaseId[];
  fullStackLayout: FullStackLayout;
  apiFramework: ApiFrameworkId;
  framework: FrameworkId;
  packageManager: PackageManagerId;
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

  const {
    directory,
    projectName,
    projectType,
    databases,
    fullStackLayout,
    apiFramework,
    framework,
    viteUiFramework,
    language,
    packageManager,
  } = value;
  if (typeof directory !== 'string' || directory.trim().length === 0 || directory.length > 1024) {
    throw new Error('Choose a valid local destination folder.');
  }
  if (!path.isAbsolute(directory)) {
    throw new Error('The destination folder must be an absolute local path.');
  }
  if (typeof projectName !== 'string' || !PROJECT_NAME_PATTERN.test(projectName)) {
    throw new Error('Project name must use letters, numbers, dots, underscores, or hyphens.');
  }
  if (typeof projectType !== 'string' || !PROJECT_TYPES.has(projectType as ProjectType)) {
    throw new Error('Choose a supported project type.');
  }
  if (
    !Array.isArray(databases) ||
    databases.length > DATABASES.size ||
    databases.some((database) => typeof database !== 'string' || !DATABASES.has(database as DatabaseId))
  ) {
    throw new Error('Choose only supported databases.');
  }
  if (new Set(databases).size !== databases.length) {
    throw new Error('The selected database list contains duplicates.');
  }
  if (databases.length > 0 && projectType === 'frontend') {
    throw new Error('Databases require an API project. Choose API-only or full-stack.');
  }
  if (typeof fullStackLayout !== 'string' || !FULL_STACK_LAYOUTS.has(fullStackLayout as FullStackLayout)) {
    throw new Error('Choose a supported full-stack folder layout.');
  }
  if (typeof apiFramework !== 'string' || !API_FRAMEWORKS.has(apiFramework as ApiFrameworkId)) {
    throw new Error('Choose a supported API framework.');
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
  if (framework === 'angular' && language !== 'typescript') {
    throw new Error('Angular projects require TypeScript.');
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
    projectType: projectType as ProjectType,
    databases: databases as DatabaseId[],
    fullStackLayout: fullStackLayout as FullStackLayout,
    apiFramework: apiFramework as ApiFrameworkId,
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
    return ['create', 'vue@latest', name, '--', '--default', '--no-install'];
  }
  if (input.framework === 'angular') {
    return [
      'exec',
      '--yes',
      '--package',
      '@angular/cli@latest',
      '--',
      'ng',
      'new',
      name,
      '--defaults',
      '--skip-install',
      '--skip-git',
      '--routing',
      '--style=css',
      '--analytics=false',
      '--package-manager=npm',
    ];
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
  const steps: InstallStep[] = [];
  if (input.projectType !== 'api') {
    steps.push({
      id: 'frontend-scaffold',
      label: `Create ${input.framework} frontend`,
      status: 'pending',
      durationMs: 0,
      outputLines: [],
    });
  }
  if (input.projectType !== 'frontend') {
    steps.push({
      id: 'api-scaffold',
      label: `Create ${input.apiFramework} API${input.databases.length ? ' with database integrations' : ''}`,
      status: 'pending',
      durationMs: 0,
      outputLines: [],
    });
  }
  if (input.projectType === 'fullstack' && input.fullStackLayout === 'workspace') {
    steps.push({
      id: 'workspace',
      label: 'Configure npm workspace',
      status: 'pending',
      durationMs: 0,
      outputLines: [],
    });
  }
  steps.push({
    id: 'dependencies',
    label: `Install dependencies with ${input.packageManager}`,
    status: 'pending',
    durationMs: 0,
    outputLines: [],
  });
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

export interface ProjectInstallPaths {
  projectPath: string;
  frontendPath?: string;
  apiPath?: string;
  workspacePath?: string;
  workspaceRoot?: string;
}

async function validateInstallDirectory(directoryInput: string): Promise<string> {
  let directory: string;
  try {
    directory = await fs.realpath(directoryInput);
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
  return directory;
}

async function assertPathDoesNotExist(targetPath: string): Promise<void> {
  try {
    await fs.lstat(targetPath);
    throw new Error(`"${targetPath}" already exists. Choose another project name or destination.`);
  } catch (error) {
    if (isRecord(error) && error.code === 'ENOENT') return;
    throw error;
  }
}

export async function prepareProjectPaths(input: ProjectInstallInput): Promise<ProjectInstallPaths> {
  if (input.projectType === 'fullstack' && input.fullStackLayout === 'separate') {
    const directory = await validateInstallDirectory(input.directory);
    const frontendPath = path.resolve(directory, `${input.projectName}-frontend`);
    const apiPath = path.resolve(directory, `${input.projectName}-api`);
    await assertPathDoesNotExist(frontendPath);
    await assertPathDoesNotExist(apiPath);
    return {
      projectPath: frontendPath,
      frontendPath,
      apiPath,
      workspacePath: directory,
    };
  }

  const projectPath = await prepareProjectPath(input);
  if (input.projectType === 'fullstack') {
    return {
      projectPath,
      frontendPath: path.join(projectPath, 'frontend'),
      apiPath: path.join(projectPath, 'api'),
      workspacePath: projectPath,
      workspaceRoot: projectPath,
    };
  }
  if (input.projectType === 'api') {
    return { projectPath, apiPath: projectPath };
  }
  return { projectPath, frontendPath: projectPath };
}

export async function prepareProjectPath(input: ProjectInstallInput): Promise<string> {
  const directory = await validateInstallDirectory(input.directory);
  const projectPath = path.resolve(directory, input.projectName);
  if (path.dirname(projectPath) !== directory) {
    throw new Error('The project path must stay inside the selected destination folder.');
  }
  await assertPathDoesNotExist(projectPath);
  return projectPath;
}

function packageSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[^a-z0-9]+|-+$/g, '') || 'project-api';
}

const DATABASE_DEPENDENCIES: Record<DatabaseId, { dependencies: Record<string, string>; devDependencies?: Record<string, string> }> = {
  postgresql: {
    dependencies: { pg: '^8.16.0' },
    devDependencies: { '@types/pg': '^8.15.5' },
  },
  mongodb: { dependencies: { mongodb: '^6.17.0' } },
  mysql: { dependencies: { mysql2: '^3.14.1' } },
  sqlite: {
    dependencies: { 'better-sqlite3': '^12.2.0' },
    devDependencies: { '@types/better-sqlite3': '^7.6.13' },
  },
  redis: { dependencies: { redis: '^5.5.6' } },
};

const DATABASE_ENV: Record<DatabaseId, (projectName: string) => string> = {
  postgresql: (name) => `DATABASE_URL=postgres://postgres:password@127.0.0.1:5432/${name}`,
  mongodb: (name) => `MONGODB_URI=mongodb://127.0.0.1:27017/${name}`,
  mysql: (name) => `MYSQL_URL=mysql://root:password@127.0.0.1:3306/${name}`,
  sqlite: (name) => `SQLITE_PATH=./data/${name}.sqlite`,
  redis: () => 'REDIS_URL=redis://127.0.0.1:6379',
};

const DATABASE_SOURCE: Record<DatabaseId, {
  imports: string[];
  declarations: string[];
  connect: string[];
  members: string[];
}> = {
  postgresql: {
    imports: ["import { Pool } from 'pg';"],
    declarations: ["export const postgresql = new Pool({ connectionString: process.env.DATABASE_URL });"],
    connect: ["await postgresql.query('SELECT 1');"],
    members: ['postgresql'],
  },
  mongodb: {
    imports: ["import { MongoClient } from 'mongodb';"],
    declarations: [
      "export const mongodbClient = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017');",
    ],
    connect: [
      'await mongodbClient.connect();',
      "await mongodbClient.db().command({ ping: 1 });",
    ],
    members: ['mongodbClient'],
  },
  mysql: {
    imports: ["import mysql from 'mysql2/promise';"],
    declarations: [
      "export const mysqlPool = mysql.createPool(process.env.MYSQL_URL ?? 'mysql://root:password@127.0.0.1:3306/app');",
    ],
    connect: ["await mysqlPool.query('SELECT 1');"],
    members: ['mysqlPool'],
  },
  sqlite: {
    imports: [
      "import Database from 'better-sqlite3';",
      "import { mkdirSync } from 'node:fs';",
      "import { dirname } from 'node:path';",
    ],
    declarations: [
      "const sqlitePath = process.env.SQLITE_PATH ?? './data/app.sqlite';",
      'mkdirSync(dirname(sqlitePath), { recursive: true });',
      'export const sqlite = new Database(sqlitePath);',
    ],
    connect: ["sqlite.prepare('SELECT 1').get();"],
    members: ['sqlite'],
  },
  redis: {
    imports: ["import { createClient } from 'redis';"],
    declarations: [
      "export const redisClient = createClient({ url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379' });",
      "redisClient.on('error', (error) => console.error('Redis client error:', error));",
    ],
    connect: [
      'await redisClient.connect();',
      'await redisClient.ping();',
    ],
    members: ['redisClient'],
  },
};

export interface DatabaseScaffold {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  envExample: string;
  source: string;
}

export function buildDatabaseScaffold(databases: DatabaseId[], projectName: string): DatabaseScaffold {
  const name = packageSlug(projectName);
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};
  const imports = new Set<string>();
  const declarations: string[] = [];
  const connect: string[] = [];
  const members: string[] = [];

  for (const database of databases) {
    Object.assign(dependencies, DATABASE_DEPENDENCIES[database].dependencies);
    Object.assign(devDependencies, DATABASE_DEPENDENCIES[database].devDependencies);
    for (const statement of DATABASE_SOURCE[database].imports) imports.add(statement);
    declarations.push(...DATABASE_SOURCE[database].declarations);
    connect.push(...DATABASE_SOURCE[database].connect);
    members.push(...DATABASE_SOURCE[database].members);
  }

  const source = [
    ...imports,
    '',
    ...declarations,
    '',
    `export const databases = { ${members.join(', ')} };`,
    '',
    'export async function connectDatabases(): Promise<void> {',
    ...connect.map((line) => `  ${line}`),
    '}',
    '',
  ].join('\n');

  return {
    dependencies,
    devDependencies,
    envExample: databases.map((database) => DATABASE_ENV[database](name)).join('\n') + '\n',
    source,
  };
}

async function createExpressApiProject(
  directory: string,
  projectName: string,
  databases: DatabaseId[]
): Promise<void> {
  const databaseScaffold = buildDatabaseScaffold(databases, projectName);
  await fs.mkdir(path.join(directory, 'src'), { recursive: true });
  const packageJson = {
    name: packageSlug(projectName),
    private: true,
    type: 'module',
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
    },
    dependencies: {
      cors: '^2.8.5',
      dotenv: '^17.2.3',
      express: '^4.21.2',
      ...databaseScaffold.dependencies,
    },
    devDependencies: {
      '@types/cors': '^2.8.17',
      '@types/express': '^4.17.21',
      '@types/node': '^22.14.0',
      tsx: '^4.21.0',
      typescript: '^5.9.3',
      ...databaseScaffold.devDependencies,
    },
  };
  await fs.writeFile(path.join(directory, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
  await fs.writeFile(
    path.join(directory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          rootDir: 'src',
          outDir: 'dist',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ['src/**/*.ts'],
      },
      null,
      2
    )}\n`
  );
  await fs.writeFile(
    path.join(directory, 'src', 'index.ts'),
    [
      "import 'dotenv/config';",
      "import cors from 'cors';",
      "import express from 'express';",
      ...(databases.length ? ["import { connectDatabases } from './database.js';"] : []),
      '',
      'const app = express();',
      'app.use(cors());',
      'app.use(express.json());',
      '',
      "app.get('/api/health', (_request, response) => {",
      "  response.json({ ok: true });",
      '});',
      '',
      'const port = Number(process.env.PORT) || 4000;',
      ...(databases.length
        ? [
            'async function start(): Promise<void> {',
            '  await connectDatabases();',
            "  app.listen(port, '127.0.0.1', () => {",
            '    console.log(`API listening at http://127.0.0.1:${port}`);',
            '  });',
            '}',
            '',
            "void start().catch((error: unknown) => {",
            "  console.error('Unable to connect to the configured databases:', error);",
            '  process.exitCode = 1;',
            '});',
          ]
        : [
            "app.listen(port, '127.0.0.1', () => {",
            '  console.log(`API listening at http://127.0.0.1:${port}`);',
            '});',
          ]),
      '',
    ].join('\n')
  );
  if (databases.length) {
    await fs.writeFile(path.join(directory, 'src', 'database.ts'), databaseScaffold.source);
    await fs.writeFile(path.join(directory, '.env.example'), databaseScaffold.envExample);
  }
  await fs.writeFile(path.join(directory, '.gitignore'), 'node_modules\ndist\n.env\ndata/\n');
}

async function ensureFrontendDevScript(frontendPath: string, framework: FrameworkId): Promise<void> {
  const packagePath = path.join(frontendPath, 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8')) as {
    scripts?: Record<string, string>;
  };
  packageJson.scripts = packageJson.scripts ?? {};
  if (!packageJson.scripts.dev) {
    packageJson.scripts.dev = framework === 'angular' ? 'ng serve' : packageJson.scripts.start ?? '';
  }
  if (!packageJson.scripts.dev) {
    throw new Error(`The generated ${framework} project does not define a dev or start script.`);
  }
  await fs.writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

async function createWorkspacePackage(rootPath: string, projectName: string): Promise<void> {
  const packageJson = {
    name: packageSlug(projectName),
    private: true,
    workspaces: ['frontend', 'api'],
    scripts: {
      dev: 'concurrently -k -n frontend,api "npm run dev --workspace frontend" "npm run dev --workspace api"',
      'dev:frontend': 'npm run dev --workspace frontend',
      'dev:api': 'npm run dev --workspace api',
    },
    devDependencies: {
      concurrently: '^9.1.2',
    },
  };
  await fs.writeFile(path.join(rootPath, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
}

export async function startProjectInstall(value: unknown): Promise<InstallJob> {
  if (activeInstallJobId) {
    throw new InstallerBusyError('Another project installation is already running. Wait for it to finish.');
  }
  const input = validateProjectInstallInput(value);
  const paths = await prepareProjectPaths(input);
  const job: InstallJob = {
    id: randomUUID(),
    status: 'running',
    projectName: input.projectName,
    projectType: input.projectType,
    databases: input.databases,
    fullStackLayout: input.fullStackLayout,
    apiFramework: input.apiFramework,
    framework: input.framework,
    packageManager: input.packageManager,
    ...paths,
    currentStep: null,
    steps: makeSteps(input),
    startedAt: new Date().toISOString(),
  };
  installJobs.set(job.id, job);
  activeInstallJobId = job.id;

  void runInstallJob(job, input, paths).finally(() => {
    if (activeInstallJobId === job.id) activeInstallJobId = null;
  });
  return job;
}

async function runInstallJob(
  job: InstallJob,
  input: ProjectInstallInput,
  paths: ProjectInstallPaths
): Promise<void> {
  try {
    if (paths.workspaceRoot) await fs.mkdir(paths.workspaceRoot, { recursive: true });
    const frontendStep = job.steps.find((step) => step.id === 'frontend-scaffold');
    if (frontendStep && paths.frontendPath) {
      job.currentStep = frontendStep.id;
      const scaffoldInput = {
        ...input,
        projectName: path.basename(paths.frontendPath),
      };
      await runNpm(
        buildScaffoldArgs(scaffoldInput),
        path.dirname(paths.frontendPath),
        frontendStep
      );
      await ensureFrontendDevScript(paths.frontendPath, input.framework);
    }

    const apiStep = job.steps.find((step) => step.id === 'api-scaffold');
    if (apiStep && paths.apiPath) {
      job.currentStep = apiStep.id;
      apiStep.status = 'running';
      const started = Date.now();
      await createExpressApiProject(
        paths.apiPath,
        input.projectType === 'api'
          ? input.projectName
          : input.fullStackLayout === 'separate'
          ? `${input.projectName}-api`
          : 'api',
        input.databases
      );
      apiStep.durationMs = Date.now() - started;
      apiStep.status = 'completed';
    }

    const workspaceStep = job.steps.find((step) => step.id === 'workspace');
    if (workspaceStep && paths.workspaceRoot) {
      job.currentStep = workspaceStep.id;
      workspaceStep.status = 'running';
      const started = Date.now();
      await createWorkspacePackage(paths.workspaceRoot, input.projectName);
      workspaceStep.durationMs = Date.now() - started;
      workspaceStep.status = 'completed';
    }

    const dependencyStep = job.steps.find((step) => step.id === 'dependencies');
    if (!dependencyStep) throw new Error('Dependency installation step was not prepared.');
    job.currentStep = dependencyStep.id;
    if (paths.workspaceRoot) {
      await runNpm(['install'], paths.workspaceRoot, dependencyStep);
    } else {
      if (paths.frontendPath) {
        await runNpm(['install'], paths.frontendPath, dependencyStep);
      }
      if (paths.apiPath) {
        await runNpm(['install'], paths.apiPath, dependencyStep);
      }
    }

    const packageArgs = npmPackageArgs(input.packages);
    for (const [index, args] of packageArgs.entries()) {
      const step = job.steps.find((item) => item.id === `packages-${index + 1}`);
      if (!step) throw new Error('A selected-package installation step was not prepared.');
      job.currentStep = step.id;
      const packageDirectory = paths.apiPath && !paths.frontendPath ? paths.apiPath : paths.frontendPath;
      if (!packageDirectory) throw new Error('No package installation target was prepared.');
      const npmArgs =
        paths.workspaceRoot && packageDirectory === paths.frontendPath
          ? ['install', '--workspace', 'frontend', ...args.slice(1)]
          : args;
      await runNpm(npmArgs, packageDirectory, step);
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

