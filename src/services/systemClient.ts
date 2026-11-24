import type { NpmPackageDetail, NpmSearchPackage, SystemProbeResult } from '../types/studio';

export async function fetchSystemProbe(devPort: number, previewPort: number): Promise<SystemProbeResult> {
  const res = await fetch(
    `/api/system/probe?devPort=${encodeURIComponent(String(devPort))}&previewPort=${encodeURIComponent(
      String(previewPort)
    )}`
  );
  const data = (await res.json()) as SystemProbeResult & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `System probe failed (HTTP ${res.status})`);
  }
  return data;
}

export async function searchNpmRegistry(query: string): Promise<NpmSearchPackage[]> {
  const res = await fetch(`/api/npm/search?q=${encodeURIComponent(query)}`);
  const data = (await res.json()) as { results?: NpmSearchPackage[]; error?: string };
  if (!res.ok) {
    throw new Error(data.error || `npm search failed (HTTP ${res.status})`);
  }
  return data.results ?? [];
}

export async function fetchNpmPackageMeta(name: string): Promise<NpmPackageDetail> {
  const res = await fetch(`/api/npm/package?name=${encodeURIComponent(name)}`);
  const data = (await res.json()) as { detail?: NpmPackageDetail; error?: string };
  if (!res.ok || !data.detail) {
    throw new Error(data.error || `Failed to inspect npm package "${name}"`);
  }
  return data.detail;
}
