import type {
  EditorId,
  ProjectEditor,
  ProjectRunInput,
  ProjectRunSession,
} from '../types/projectActions';

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
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
