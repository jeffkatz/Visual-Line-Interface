import type { RuntimeId } from '../types/studio';

export async function updateRuntimeVersion(runtime: RuntimeId, version: string): Promise<void> {
  const response = await fetch('/api/local/runtime/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runtime, version }),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error || `Runtime update failed (HTTP ${response.status})`);
  }
}
