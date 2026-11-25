import { execFile } from 'child_process';
import { promisify } from 'util';
import type { RuntimeId } from '../src/types/studio';

const execFileAsync = promisify(execFile);

export interface RuntimeUpdateCommand {
  command: string;
  args: string[];
}

const NODE_VERSION_MANAGERS = ['volta', 'fnm', 'nvm'] as const;

function isRuntimeId(value: unknown): value is RuntimeId {
  return value === 'node' || value === 'deno' || value === 'bun';
}

export function validateRuntimeUpdateRequest(value: unknown): {
  runtime: RuntimeId;
  version: string;
} {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Runtime update request must be an object.');
  }

  const request = value as { runtime?: unknown; version?: unknown };
  if (!isRuntimeId(request.runtime)) {
    throw new Error('Unsupported runtime.');
  }
  if (typeof request.version !== 'string') {
    throw new Error('A runtime version is required.');
  }

  const version = request.version.trim();
  if (version.length > 50) {
    throw new Error('Runtime version is too long.');
  }
  const isChannel =
    (request.runtime === 'deno' && version === 'latest') ||
    (request.runtime === 'bun' && ['latest', 'stable', 'canary'].includes(version));
  if (!isChannel && !/^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('Enter a semantic version such as 22.14.0.');
  }

  return {
    runtime: request.runtime,
    version: version.replace(/^v/, ''),
  };
}

export function buildRuntimeUpdateCommands(
  runtime: RuntimeId,
  version: string,
  nodeVersionManager?: (typeof NODE_VERSION_MANAGERS)[number]
): RuntimeUpdateCommand[] {
  if (runtime === 'node') {
    if (!nodeVersionManager) {
      throw new Error('Node.js updates require nvm, fnm, or Volta to be installed and available on PATH.');
    }
    if (nodeVersionManager === 'volta') {
      return [{ command: 'volta', args: ['install', `node@${version}`] }];
    }
    if (nodeVersionManager === 'fnm') {
      return [
        { command: 'fnm', args: ['install', version] },
        { command: 'fnm', args: ['default', version] },
      ];
    }
    return [
      { command: 'nvm', args: ['install', version] },
      { command: 'nvm', args: ['use', version] },
    ];
  }

  if (runtime === 'deno') {
    return version === 'latest'
      ? [{ command: 'deno', args: ['upgrade'] }]
      : [{ command: 'deno', args: ['upgrade', '--version', version] }];
  }

  if (version === 'latest' || version === 'stable') {
    return [{ command: 'bun', args: ['upgrade', '--stable'] }];
  }
  if (version === 'canary') {
    return [{ command: 'bun', args: ['upgrade', '--canary'] }];
  }
  throw new Error('Bun supports latest stable or canary updates, not pinned versions.');
}

async function executableExists(name: string): Promise<boolean> {
  const lookup = process.platform === 'win32' ? 'where' : 'which';
  try {
    await execFileAsync(lookup, [name], { timeout: 2500, windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

export async function updateRuntime(runtime: RuntimeId, version: string): Promise<void> {
  let nodeVersionManager: (typeof NODE_VERSION_MANAGERS)[number] | undefined;
  if (runtime === 'node') {
    for (const manager of NODE_VERSION_MANAGERS) {
      if (await executableExists(manager)) {
        nodeVersionManager = manager;
        break;
      }
    }
  }

  const commands = buildRuntimeUpdateCommands(runtime, version, nodeVersionManager);
  for (const { command, args } of commands) {
    try {
      await execFileAsync(command, args, {
        timeout: 5 * 60 * 1000,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${command} failed while updating ${runtime}: ${message}`);
    }
  }
}
