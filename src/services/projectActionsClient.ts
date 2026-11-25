import type {
  EditorId,
  ProjectEditor,
  GitSigningConfig,
  GitStatus,
  GitCredentialHelper,
  InstalledProject,
  ProjectRunInput,
  ProjectRunSession,
} from '../types/projectActions';
import { readJsonResponse } from './http';

async function readJson<T>(response: Response): Promise<T> {
  const data = await readJsonResponse<T & { error?: string }>(response);
  if (!response.ok) {
    throw new Error(data.error || `Local project action failed (HTTP ${response.status}).`);
  }
  return data;
}

export async function fetchProjectRuns(): Promise<ProjectRunSession[]> {
  const response = await fetch('/api/projects/runs');
  const data = await readJson<{ runs: ProjectRunSession[] }>(response);
  return data.runs;
}

export async function fetchProjectEditors(): Promise<ProjectEditor[]> {
  const response = await fetch('/api/projects/editors');
  const data = await readJson<{ editors: ProjectEditor[] }>(response);
  return data.editors;
}

export async function startProjectRun(input: ProjectRunInput): Promise<ProjectRunSession> {
  const response = await fetch('/api/projects/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ session: ProjectRunSession }>(response);
  return data.session;
}

export async function stopProjectRun(id: string): Promise<ProjectRunSession> {
  const response = await fetch(`/api/projects/runs/${encodeURIComponent(id)}/stop`, {
    method: 'POST',
  });
  const data = await readJson<{ session: ProjectRunSession }>(response);
  return data.session;
}

export async function openProjectInEditor(directory: string, editor: EditorId): Promise<void> {
  const response = await fetch('/api/projects/open', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directory, editor }),
  });
  await readJson<{ ok: boolean }>(response);
}

export async function fetchInstalledProjects(): Promise<InstalledProject[]> {
  const response = await fetch('/api/projects');
  const data = await readJson<{ projects: InstalledProject[] }>(response);
  return data.projects;
}

export async function importProject(directory: string): Promise<InstalledProject> {
  const response = await fetch('/api/projects/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directory }),
  });
  const data = await readJson<{ project: InstalledProject }>(response);
  return data.project;
}

export async function removeInstalledProject(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await readJson<{ ok: boolean }>(response);
}

export async function openProjectFolder(directory: string): Promise<void> {
  const response = await fetch('/api/projects/open-folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directory }),
  });
  await readJson<{ ok: boolean }>(response);
}

async function gitRequest(
  action: string,
  input: Record<string, unknown>
): Promise<GitStatus> {
  const response = await fetch(`/api/projects/git/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ status: GitStatus }>(response);
  return data.status;
}

export const fetchGitStatus = (directory: string) => gitRequest('status', { directory });
export const initializeGit = (directory: string) => gitRequest('init', { directory });
export const connectGitRemote = (directory: string, url: string) =>
  gitRequest('remote', { directory, url });
export const disconnectGitRemote = (directory: string) =>
  gitRequest('disconnect', { directory });
export const saveGitAuthentication = (
  directory: string,
  username: string,
  token: string,
  helper: GitCredentialHelper
) => gitRequest('authentication', { directory, username, token, helper });
export const stageGitChanges = (directory: string) => gitRequest('stage', { directory });
export const commitGitChanges = (directory: string, message: string) =>
  gitRequest('commit', { directory, message });
export const pullGitChanges = (directory: string) => gitRequest('pull', { directory });
export const pushGitChanges = (directory: string) => gitRequest('push', { directory });
export async function configureGitSigning(
  directory: string,
  configuration: GitSigningConfig
): Promise<{ status: GitStatus }> {
  const response = await fetch('/api/projects/git/signing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directory, configuration }),
  });
  return readJson<{ status: GitStatus }>(response);
}
