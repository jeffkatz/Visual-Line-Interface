import type { RuntimeId } from '../types/studio';
import { readJsonResponse } from './http';

export async function updateRuntimeVersion(runtime: RuntimeId, version: string): Promise<void> {
  const response = await fetch('/api/local/runtime/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runtime, version }),
  });
  const data = await readJsonResponse<{ error?: string }>(response);
  if (!response.ok) {
    throw new Error(data.error || `Runtime update failed (HTTP ${response.status})`);
  }
}
