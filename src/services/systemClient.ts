import type { NpmPackageDetail, NpmSearchPackage, SystemProbeResult } from '../types/studio';
import { readJsonResponse } from './http';

export async function fetchSystemProbe(devPort: number, previewPort: number): Promise<SystemProbeResult> {
  const res = await fetch(
    `/api/system/probe?devPort=${encodeURIComponent(String(devPort))}&previewPort=${encodeURIComponent(
      String(previewPort)
    )}`
  );
  const data = await readJsonResponse<SystemProbeResult & { error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error || `System probe failed (HTTP ${res.status})`);
  }
  return data;
}

export async function searchNpmRegistry(query: string): Promise<NpmSearchPackage[]> {
  const res = await fetch(`/api/npm/search?q=${encodeURIComponent(query)}`);
  const data = await readJsonResponse<{ results?: NpmSearchPackage[]; error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error || `npm search failed (HTTP ${res.status})`);
  }
  return data.results ?? [];
}

export async function fetchNpmPackageMeta(name: string): Promise<NpmPackageDetail> {
  const res = await fetch(`/api/npm/package?name=${encodeURIComponent(name)}`);
  const data = await readJsonResponse<{ detail?: NpmPackageDetail; error?: string }>(res);
  if (!res.ok || !data.detail) {
    throw new Error(data.error || `Failed to inspect npm package "${name}"`);
  }
  return data.detail;
}
