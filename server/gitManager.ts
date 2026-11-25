import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import type { GitSigningConfig, GitStatus } from '../src/types/projectActions.ts';

const execFileAsync = promisify(execFile);
const MAX_GIT_OUTPUT = 1024 * 1024;

async function validateDirectory(value: unknown): Promise<string> {
  if (typeof value !== 'string' || !path.isAbsolute(value)) {
    throw new Error('Choose a valid absolute project folder.');
  }
  try {
    const directory = await fs.realpath(value);
    if (!(await fs.stat(directory)).isDirectory()) throw new Error();
    return directory;
  } catch {
    throw new Error('Project folder does not exist or is not accessible.');
  }
}

async function git(directory: string, args: string[]): Promise<string> {
  try {
    const result = await execFileAsync('git', ['-C', directory, ...args], {
      timeout: 60_000,
      windowsHide: true,
      maxBuffer: MAX_GIT_OUTPUT,
    });
    return result.stdout.trim();
  } catch (error) {
    const detail = error && typeof error === 'object' && 'stderr' in error
      ? String(error.stderr || '').trim()
      : '';
    const message = (detail || (error instanceof Error ? error.message : String(error)))
      .replace(/https?:\/\/[^/\s@]+@/gi, 'https://[redacted]@')
      .replace(/\b(Bearer\s+)[^\s]+/gi, '$1[redacted]');
    if (/not recognized|not found|enoent/i.test(message)) {
      throw new Error('Git is not installed or is not available on PATH.');
    }
    throw new Error(`Git ${args[0]} failed: ${message}`);
  }
}

async function repositoryRoot(directory: string): Promise<string | null> {
  try {
    return await git(directory, ['rev-parse', '--show-toplevel']);
  } catch (error) {
    if (error instanceof Error && /not a git repository/i.test(error.message)) return null;
    throw error;
  }
}

function redactRemoteUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) {
      parsed.username = '';
      parsed.password = '';
    }
    if (parsed.search || parsed.hash) {
      parsed.search = '';
      parsed.hash = '';
    }
    return parsed.toString();
  } catch {
    // SCP-style SSH remotes do not use URL syntax.
  }
  return url;
}

function validateRemoteUrl(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Enter a Git remote URL.');
  const remote = value.trim();
  if (!remote || remote.length > 2048 || /[\r\n]/.test(remote)) {
    throw new Error('Enter a valid Git remote URL.');
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(remote)) {
    let parsed: URL;
    try {
      parsed = new URL(remote);
    } catch {
      throw new Error('Enter a valid Git remote URL.');
    }
    if (
      !['https:', 'ssh:', 'git:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error('Use an HTTPS or SSH remote URL without embedded credentials. Configure authentication with your system Git credential helper or SSH agent.');
    }
    return remote;
  }
  if (!/^[\w.-]+@[\w.-]+:[\w./-]+(?:\.git)?$/.test(remote)) {
    throw new Error('Use a valid HTTPS URL or SSH remote such as git@host:owner/repository.git.');
  }
  return remote;
}

export async function getGitStatus(value: unknown): Promise<GitStatus> {
  const directory = await validateDirectory(value);
  const root = await repositoryRoot(directory);
  if (!root) return { isRepository: false, staged: [], modified: [], untracked: [], remotes: [] };

  const [status, remoteOutput] = await Promise.all([
    git(root, ['status', '--porcelain=v1', '--branch']),
    git(root, ['remote', '-v']),
  ]);
  const lines = status.split(/\r?\n/).filter(Boolean);
  const branchLine = lines.shift() ?? '';
  const branch = branchLine.startsWith('## ')
    ? branchLine.slice(3).split('...')[0].replace(/ \[.*$/, '')
    : undefined;
  const staged: string[] = [];
  const modified: string[] = [];
  const untracked: string[] = [];
  for (const line of lines) {
    const indexStatus = line[0];
    const worktreeStatus = line[1];
    const file = line.slice(3);
    if (indexStatus === '?' && worktreeStatus === '?') untracked.push(file);
    else {
      if (indexStatus !== ' ') staged.push(file);
      if (worktreeStatus !== ' ') modified.push(file);
    }
  }
  const remotes = new Map<string, string>();
  for (const line of remoteOutput.split(/\r?\n/).filter(Boolean)) {
    const match = line.match(/^(\S+)\s+(.+?)\s+\((?:fetch|push)\)$/);
    if (match && !remotes.has(match[1])) remotes.set(match[1], redactRemoteUrl(match[2]));
  }
  return {
    isRepository: true,
    root,
    branch,
    staged,
    modified,
    untracked,
    remotes: Array.from(remotes, ([name, url]) => ({ name, url })),
  };
}

export async function initializeGitRepository(value: unknown): Promise<GitStatus> {
  const directory = await validateDirectory(value);
  if (!(await repositoryRoot(directory))) await git(directory, ['init']);
  return getGitStatus(directory);
}

export async function connectGitRemote(value: unknown, remoteValue: unknown): Promise<GitStatus> {
  const directory = await validateDirectory(value);
  const remote = validateRemoteUrl(remoteValue);
  const root = await repositoryRoot(directory);
  if (!root) throw new Error('Initialize a Git repository before connecting a remote.');
  const remotes = (await git(root, ['remote'])).split(/\r?\n/).filter(Boolean);
  if (remotes.includes('origin')) await git(root, ['remote', 'set-url', 'origin', remote]);
  else await git(root, ['remote', 'add', 'origin', remote]);
  return getGitStatus(root);
}

export async function disconnectGitRemote(value: unknown): Promise<GitStatus> {
  const directory = await validateDirectory(value);
  const root = await repositoryRoot(directory);
  if (!root) throw new Error('This folder is not a Git repository.');
  const remotes = (await git(root, ['remote'])).split(/\r?\n/).filter(Boolean);
  if (!remotes.includes('origin')) throw new Error('No origin remote is configured.');
  await git(root, ['remote', 'remove', 'origin']);
  return getGitStatus(root);
}

export async function saveGitAuthentication(
  value: unknown,
  usernameValue: unknown,
  tokenValue: unknown,
  helperValue: unknown
): Promise<GitStatus> {
  const directory = await validateDirectory(value);
  const username = typeof usernameValue === 'string' ? usernameValue.trim() : '';
  const token = typeof tokenValue === 'string' ? tokenValue : '';
  const allowedHelpers = ['manager', 'osxkeychain', 'libsecret', 'cache'];
  if (!username || username.length > 256 || /[\r\n]/.test(username)) {
    throw new Error('Enter a valid Git account name.');
  }
  if (!token || token.length > 8192 || /[\r\n]/.test(token)) {
    throw new Error('Enter a single-line access token or password of at most 8192 characters.');
  }
  if (typeof helperValue !== 'string' || !allowedHelpers.includes(helperValue)) {
    throw new Error('Choose a supported system Git credential helper.');
  }
  const root = await repositoryRoot(directory);
  if (!root) throw new Error('Initialize a Git repository before configuring authentication.');
  const remote = (await git(root, ['remote', 'get-url', 'origin'])).trim();
  let parsedRemote: URL;
  try {
    parsedRemote = new URL(remote);
  } catch {
    throw new Error('HTTPS authentication requires an HTTPS origin remote. SSH remotes use your SSH agent instead.');
  }
  if (parsedRemote.protocol !== 'https:' || parsedRemote.username || parsedRemote.password) {
    throw new Error('HTTPS authentication requires an HTTPS origin without embedded credentials. SSH remotes use your SSH agent instead.');
  }

  await git(root, ['config', '--local', '--replace-all', 'credential.helper', helperValue]);
  const child = spawn('git', ['-C', root, 'credential', 'approve'], {
    stdio: ['pipe', 'ignore', 'pipe'],
    windowsHide: true,
  });
  let stderr = '';
  child.stderr?.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8');
  });
  const finished = new Promise<void>((resolve, reject) => {
    child.once('error', (error) => reject(new Error(`Could not save credentials through Git: ${error.message}`)));
    child.once('close', (code) => {
      if (code === 0) resolve();
      else {
        const detail = stderr.trim().replaceAll(token, '[redacted]');
        reject(new Error(detail || `Git credential helper exited with code ${code ?? 'unknown'}.`));
      }
    });
  });
  child.stdin?.end(`protocol=https\nhost=${parsedRemote.host}\nusername=${username}\npassword=${token}\n\n`);
  try {
    await finished;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(message.replaceAll(token, '[redacted]'));
  }
  return getGitStatus(root);
}

export async function stageGitChanges(value: unknown): Promise<GitStatus> {
  const directory = await validateDirectory(value);
  const root = await repositoryRoot(directory);
  if (!root) throw new Error('Initialize a Git repository before staging changes.');
  await git(root, ['add', '--all']);
  return getGitStatus(root);
}

export async function commitGitChanges(value: unknown, messageValue: unknown): Promise<GitStatus> {
  const directory = await validateDirectory(value);
  const message = typeof messageValue === 'string' ? messageValue.trim() : '';
  if (!message || message.length > 2000 || /[\0]/.test(message)) {
    throw new Error('Enter a commit message between 1 and 2000 characters.');
  }
  const root = await repositoryRoot(directory);
  if (!root) throw new Error('Initialize a Git repository before committing changes.');
  await git(root, ['commit', '-m', message]);
  return getGitStatus(root);
}

export async function pullGitChanges(value: unknown): Promise<GitStatus> {
  const directory = await validateDirectory(value);
  const root = await repositoryRoot(directory);
  if (!root) throw new Error('Initialize a Git repository before pulling changes.');
  await git(root, ['pull', '--ff-only']);
  return getGitStatus(root);
}

export async function pushGitChanges(value: unknown): Promise<GitStatus> {
  const directory = await validateDirectory(value);
  const root = await repositoryRoot(directory);
  if (!root) throw new Error('Initialize a Git repository before pushing changes.');
  await git(root, ['push', '--set-upstream', 'origin', 'HEAD']);
  return getGitStatus(root);
}

export async function configureGitSigning(
  value: unknown,
  configuration: unknown
): Promise<GitSigningConfig & { status: GitStatus }> {
  const directory = await validateDirectory(value);
  if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)) {
    throw new Error('Git signing configuration must be an object.');
  }
  const input = configuration as Record<string, unknown>;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim() : '';
  const enabled = input.enabled === true;
  const format = input.format === 'ssh' ? 'ssh' : input.format === 'openpgp' ? 'openpgp' : undefined;
  const signingKey = typeof input.signingKey === 'string' ? input.signingKey.trim() : '';
  if (!name || name.length > 200 || /[\r\n]/.test(name)) throw new Error('Enter a valid Git author name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Enter a valid Git author email.');
  if (!format) throw new Error('Choose OpenPGP or SSH signing.');
  if (enabled && (!signingKey || signingKey.length > 1024 || /[\r\n]/.test(signingKey))) {
    throw new Error('Provide a signing key ID or SSH public-key file path. Private keys must remain in your local key agent.');
  }
  const root = await repositoryRoot(directory);
  if (!root) throw new Error('Initialize a Git repository before configuring signing.');
  await git(root, ['config', '--local', 'user.name', name]);
  await git(root, ['config', '--local', 'user.email', email]);
  await git(root, ['config', '--local', 'commit.gpgsign', enabled ? 'true' : 'false']);
  if (enabled) {
    await git(root, ['config', '--local', 'gpg.format', format]);
    await git(root, ['config', '--local', 'user.signingkey', signingKey]);
  }
  return {
    name,
    email,
    enabled,
    format,
    ...(enabled ? { signingKey } : {}),
    status: await getGitStatus(root),
  };
}
