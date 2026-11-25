import { spawn, execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { constants as fsConstants } from 'node:fs';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { promisify } from 'node:util';
import type { FrameworkId, PackageManagerId } from '../src/types/studio.ts';
import type {
  EditorId,
  ProjectEditor,
  ProjectRunInput,
  ProjectRunSession,
} from '../src/types/projectActions.ts';
import { resolveNpmCliPath } from './localInstaller.ts';

const execFileAsync = promisify(execFile);
const EDITOR_CATALOG: Array<{
  id: EditorId;
  label: string;
  commands: string[];
  launchMode: 'folder' | 'terminal';
}> = [
  { id: 'vscode', label: 'Visual Studio Code', commands: ['code', 'Code.exe'], launchMode: 'folder' },
  { id: 'visual-studio', label: 'Visual Studio', commands: ['devenv'], launchMode: 'folder' },
  { id: 'antigravity', label: 'Antigravity', commands: ['antigravity'], launchMode: 'folder' },
  { id: 'codex', label: 'Codex', commands: ['codex'], launchMode: 'terminal' },
  { id: 'claude-code', label: 'Claude Code', commands: ['claude'], launchMode: 'terminal' },
  { id: 'opencode', label: 'OpenCode', commands: ['opencode'], launchMode: 'terminal' },
  { id: 'cursor', label: 'Cursor', commands: ['cursor', 'Cursor.exe'], launchMode: 'folder' },
  { id: 'webstorm', label: 'WebStorm', commands: ['webstorm'], launchMode: 'folder' },
  { id: 'idea', label: 'IntelliJ IDEA', commands: ['idea'], launchMode: 'folder' },
  { id: 'zed', label: 'Zed', commands: ['zed'], launchMode: 'folder' },
];
const FRAMEWORKS = new Set<FrameworkId>([
  'vite',
  'nextjs',
  'astro',
  'vue',
  'sveltekit',
  'angular',
]);
const runningProjects = new Map<string, { session: ProjectRunSession; child: ReturnType<typeof spawn> }>();

async function findEditorExecutable(commands: string[]): Promise<string | null> {
  for (const command of commands) {
    try {
      const lookup = process.platform === 'win32' ? 'where.exe' : 'which';
      const { stdout } = await execFileAsync(lookup, [command], { windowsHide: true });
      const executable = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.length > 0);
      if (executable) return executable;
    } catch {
      // Try the next command or a known application installation path.
    }
  }

  if (process.platform === 'win32') {
    const roots = [
      process.env.LOCALAPPDATA,
      process.env.PROGRAMFILES,
      process.env['PROGRAMFILES(X86)'],
    ].filter((root): root is string => Boolean(root));
    const candidates = [
      path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
      path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'cursor', 'Cursor.exe'),
      path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Antigravity', 'Antigravity.exe'),
    ];
    for (const root of roots) {
      candidates.push(path.join(root, 'Microsoft VS Code', 'Code.exe'));
      candidates.push(path.join(root, 'Cursor', 'Cursor.exe'));
      candidates.push(path.join(root, 'Antigravity', 'Antigravity.exe'));
    }
    for (const candidate of candidates) {
      if (candidate && existsSync(candidate)) return candidate;
    }
  }

  if (process.platform === 'darwin' && editor.launchMode === 'folder') {
    const appName =
      editor.id === 'vscode'
        ? 'Visual Studio Code'
        : editor.id === 'cursor'
          ? 'Cursor'
          : editor.id === 'antigravity'
            ? 'Antigravity'
            : editor.id === 'zed'
              ? 'Zed'
              : null;
    if (appName) {
      const child = spawn('open', ['-a', appName, directory], {
        detached: true,
        stdio: 'ignore',
      });
      await once(child, 'spawn');
      child.unref();
      return;
    }
  }

  if (process.platform === 'darwin') {
    const appCandidates = [
      '/Applications/Visual Studio Code.app/Contents/MacOS/Electron',
      '/Applications/Cursor.app/Contents/MacOS/Cursor',
      '/Applications/Antigravity.app/Contents/MacOS/Antigravity',
      '/Applications/Zed.app/Contents/MacOS/Zed',
    ];
    for (const candidate of appCandidates) {
      if (existsSync(candidate)) {
        if (commands.includes('code')) return '/usr/bin/open';
        if (commands.includes('cursor')) return '/usr/bin/open';
        if (commands.includes('antigravity')) return '/usr/bin/open';
        if (commands.includes('zed')) return '/usr/bin/open';
      }
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function detectPackageManager(directory: string, packageJson: { packageManager?: unknown }): PackageManagerId {
  if (typeof packageJson.packageManager === 'string') {
    const declared = packageJson.packageManager.split('@')[0];
    if (['npm', 'pnpm', 'yarn', 'bun'].includes(declared)) return declared as PackageManagerId;
  }
  if (['bun.lockb', 'bun.lock'].some((name) => existsSync(path.join(directory, name)))) return 'bun';
  if (existsSync(path.join(directory, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(path.join(directory, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

export function validateProjectRunInput(value: unknown): ProjectRunInput {
  if (!isRecord(value)) throw new Error('Run request must be a JSON object.');
  if (typeof value.directory !== 'string' || !path.isAbsolute(value.directory)) {
    throw new Error('Choose a valid absolute project folder.');
  }
  if (value.target !== 'frontend' && value.target !== 'api') {
    throw new Error('Choose a supported project target.');
  }
  if (typeof value.framework !== 'string' || !FRAMEWORKS.has(value.framework as FrameworkId)) {
    throw new Error('Choose a supported frontend framework.');
  }
  return {
    directory: value.directory,
    target: value.target,
    framework: value.framework as FrameworkId,
  };
}

export function buildPackageManagerRunArgs(
  packageManager: PackageManagerId,
  framework: FrameworkId,
  target: ProjectRunInput['target'],
  port: number
): string[] {
  const args = buildProjectRunArgs(framework, target, port);
  if (packageManager === 'npm' || packageManager === 'pnpm' || target === 'api') return args;
  return args.filter((_, index) => index !== 2);
}

export function buildProjectRunArgs(
  framework: FrameworkId,
  target: ProjectRunInput['target'],
  port: number
): string[] {
  if (target === 'api') return ['run', 'dev'];
  const hostArgs = framework === 'nextjs' ? ['--hostname', '127.0.0.1'] : ['--host', '127.0.0.1'];
  const args = ['run', 'dev', '--', ...hostArgs, '--port', String(port)];
  if (framework === 'vite' || framework === 'vue' || framework === 'sveltekit') {
    args.push('--strictPort');
  }
  return args;
}

export async function findAvailableProjectPort(): Promise<number> {
  const server = net.createServer();
  server.unref();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('The operating system did not assign a usable project port.');
  }
  const { port } = address;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
}

async function validateProjectDirectory(directoryInput: string): Promise<string> {
  let directory: string;
  try {
    directory = await fs.realpath(directoryInput);
  } catch {
    throw new Error('Project folder no longer exists. Choose the project again.');
  }
  const stats = await fs.stat(directory);
  if (!stats.isDirectory()) throw new Error('Project location must be a folder.');
  try {
    await fs.access(directory, fsConstants.R_OK);
  } catch {
    throw new Error('Project folder is not readable.');
  }
  return directory;
}

export async function startProjectRun(value: unknown): Promise<ProjectRunSession> {
  const input = validateProjectRunInput(value);
  const directory = await validateProjectDirectory(input.directory);
  let packageJson: { name?: unknown; packageManager?: unknown; scripts?: Record<string, unknown> };
  try {
    packageJson = JSON.parse(await fs.readFile(path.join(directory, 'package.json'), 'utf8')) as typeof packageJson;
  } catch (error) {
    throw new Error(`Could not read the project's package.json: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (typeof packageJson.scripts?.dev !== 'string' || !packageJson.scripts.dev.trim()) {
    throw new Error('This project does not define a "dev" script.');
  }

  const name = typeof packageJson.name === 'string' ? packageJson.name : path.basename(directory);
  const packageManager = detectPackageManager(directory, packageJson);
  const existing = Array.from(runningProjects.values()).find(
    ({ session }) => session.directory === directory && session.target === input.target && session.status === 'running'
  );
  if (existing) return existing.session;

  const port = await findAvailableProjectPort();
  const runArgs = buildPackageManagerRunArgs(packageManager, input.framework, input.target, port);
  let command: string = packageManager;
  let args = runArgs;
  if (packageManager === 'npm') {
    command = process.execPath;
    args = [resolveNpmCliPath(), ...runArgs];
  } else if (process.platform === 'win32') {
    command = process.env.ComSpec || 'cmd.exe';
    args = ['/d', '/s', '/c', `${packageManager} ${runArgs.join(' ')}`];
  }
  const child = spawn(command, args, {
      cwd: directory,
      env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
  });
  const session: ProjectRunSession = {
    id: randomUUID(),
    projectName: name,
    directory,
    target: input.target,
    framework: input.framework,
    port,
    url: `http://127.0.0.1:${port}`,
    status: 'running',
    startedAt: new Date().toISOString(),
  };
  runningProjects.set(session.id, { session, child });
  let outputBuffer = '';
  const collectOutput = (chunk: Buffer) => {
    outputBuffer += chunk.toString('utf8');
    const lines = outputBuffer.split(/\r?\n/);
    outputBuffer = lines.pop() ?? '';
    for (const line of lines) {
      const actualPort = line.match(/https?:\/\/(?:localhost|127\.0\.0\.1):(\d+)/)?.[1];
      if (actualPort) {
        session.port = Number(actualPort);
        session.url = `http://127.0.0.1:${session.port}`;
      }
    }
  };
  child.stdout?.on('data', collectOutput);
  child.stderr?.on('data', collectOutput);
  child.once('error', (error) => {
    session.status = 'failed';
    session.error = `Could not start project: ${error.message}`;
  });
  child.once('exit', (code) => {
    if (session.status === 'running') {
      session.status = code === 0 ? 'stopped' : 'failed';
      if (code !== 0) session.error = `Project process exited with code ${code ?? 'unknown'}.`;
    }
  });
  return session;
}

export function listProjectRuns(): ProjectRunSession[] {
  return Array.from(runningProjects.values(), ({ session }) => session);
}

export function stopProjectRun(id: string): ProjectRunSession | undefined {
  const running = runningProjects.get(id);
  if (!running) return undefined;
  if (running.session.status === 'running') {
    running.child.kill();
    running.session.status = 'stopped';
  }
  return running.session;
}

export async function listProjectEditors(): Promise<ProjectEditor[]> {
  return Promise.all(
    EDITOR_CATALOG.map(async ({ id, label, commands }) => {
      const available = await findEditorExecutable(commands);
      return { id, label, available: Boolean(available) };
    })
  );
}

export async function openProjectInEditor(value: unknown): Promise<void> {
  if (!isRecord(value)) throw new Error('Open request must be a JSON object.');
  if (typeof value.directory !== 'string' || !path.isAbsolute(value.directory)) {
    throw new Error('Choose a valid absolute project folder.');
  }
  const editor = EDITOR_CATALOG.find((item) => item.id === value.editor);
  if (!editor) throw new Error('Choose a supported editor.');
  const directory = await validateProjectDirectory(value.directory);
  const executable = await findEditorExecutable(editor.commands);
  if (!executable) throw new Error(`${editor.label} was not found on PATH.`);

  if (process.platform === 'win32') {
    const script = editor.launchMode === 'terminal'
      ? "$ErrorActionPreference = 'Stop'; Start-Process -FilePath 'powershell.exe' -WorkingDirectory $env:VLI_PROJECT_PATH -ArgumentList '-NoExit', '-Command', ('& \"' + $env:VLI_EDITOR_PATH + '\"')"
      : "$ErrorActionPreference = 'Stop'; $argument = '\"' + $env:VLI_PROJECT_PATH + '\"'; Start-Process -FilePath $env:VLI_EDITOR_PATH -ArgumentList $argument";
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
      {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          VLI_EDITOR_PATH: executable,
          VLI_PROJECT_PATH: directory,
        },
        windowsHide: true,
      }
    );
    await once(child, 'spawn');
    child.unref();
    return;
  }

  const child = spawn(executable, editor.launchMode === 'folder' ? [directory] : [], {
    detached: true,
    stdio: 'ignore',
    cwd: editor.launchMode === 'terminal' ? directory : undefined,
  });
  await once(child, 'spawn');
  child.unref();
}

export async function openProjectFolder(value: unknown): Promise<void> {
  if (!isRecord(value) || typeof value.directory !== 'string' || !path.isAbsolute(value.directory)) {
    throw new Error('Choose a valid absolute project folder.');
  }
  const directory = await validateProjectDirectory(value.directory);
  const command = process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const child = spawn(command, [directory], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  await once(child, 'spawn');
  child.unref();
}

export const supportedProjectEditors = EDITOR_CATALOG.map(({ id, label }) => ({ id, label }));
