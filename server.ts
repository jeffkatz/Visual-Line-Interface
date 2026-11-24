import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import net from 'net';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { Request, Response } from 'express';
import type {
  AiDiagnosticResponse,
  AiPromptSynthesis,
  AiProviderId,
  AiProviderStatus,
  AiRenameSuggestion,
  AiStackRecommendation,
  BuildCompilerId,
  DevToolId,
  DirectoryLayoutMode,
  FileNamingConvention,
  FrameworkId,
  LanguageId,
  NpmPackageDetail,
  NpmSearchPackage,
  PackageManagerId,
  RuntimeId,
  StylingId,
  SystemProbeBinary,
  SystemProbePort,
  SystemProbeResult,
  TestingId,
  ViteUiFramework,
} from './src/types/studio.ts';

const execFileAsync = promisify(execFile);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

interface ProviderConfig {
  id: AiProviderId;
  name: string;
  envVar: string;
  defaultModel: string;
}

const PROVIDERS: ProviderConfig[] = [
  { id: 'openrouter', name: 'OpenRouter', envVar: 'OPENROUTER_API_KEY', defaultModel: 'google/gemini-2.5-flash' },
  { id: 'gemini', name: 'Google Gemini', envVar: 'GEMINI_API_KEY', defaultModel: 'gemini-4-hydrogen' },
  { id: 'openai', name: 'OpenAI', envVar: 'OPENAI_API_KEY', defaultModel: 'gpt-4o-mini' },
  { id: 'anthropic', name: 'Anthropic Claude', envVar: 'ANTHROPIC_API_KEY', defaultModel: 'claude-3-7-sonnet-20250219' },
  { id: 'groq', name: 'Groq Cloud', envVar: 'GROQ_API_KEY', defaultModel: 'llama-3.3-70b-versatile' },
  { id: 'mistral', name: 'Mistral AI', envVar: 'MISTRAL_API_KEY', defaultModel: 'codestral-latest' },
  { id: 'ollama', name: 'Ollama (Local)', envVar: 'OLLAMA_BASE_URL', defaultModel: 'qwen2.5-coder:7b' },
];

const VALID_FRAMEWORKS = new Set<FrameworkId>(['vite', 'nextjs', 'astro', 'vue', 'sveltekit']);
const VALID_VITE_UIS = new Set<ViteUiFramework>(['react', 'vue', 'svelte', 'solid', 'vanilla']);
const VALID_LANGUAGES = new Set<LanguageId>(['typescript', 'javascript']);
const VALID_COMPILERS = new Set<BuildCompilerId>(['swc', 'standard']);
const VALID_STYLING = new Set<StylingId>(['tailwind', 'sass', 'css-modules', 'plain-css']);
const VALID_TESTING = new Set<TestingId>(['vitest', 'playwright', 'none']);
const VALID_DEVTOOLS = new Set<DevToolId>(['eslint', 'prettier', 'biome']);
const VALID_PMS = new Set<PackageManagerId>(['pnpm', 'npm', 'yarn', 'bun']);
const VALID_RUNTIMES = new Set<RuntimeId>(['node', 'deno', 'bun']);
const VALID_LAYOUTS = new Set<DirectoryLayoutMode>(['standard', 'feature-sliced', 'domain-scoped']);
const VALID_CONVENTIONS = new Set<FileNamingConvention>(['kebab-case', 'camelCase', 'PascalCase', 'snake_case']);

function getOllamaBaseUrl(): string | null {
  const raw = (process.env.OLLAMA_BASE_URL || '').trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.origin + parsed.pathname.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function isProviderConfigured(providerId: AiProviderId): boolean {
  if (providerId === 'ollama') {
    return getOllamaBaseUrl() !== null;
  }
  const meta = PROVIDERS.find((p) => p.id === providerId);
  if (!meta) return false;
  const val = (process.env[meta.envVar] || '').trim();
  return Boolean(val && !val.startsWith('MY_'));
}

function getProviderStatuses(): AiProviderStatus[] {
  return PROVIDERS.map((p) => ({
    id: p.id,
    name: p.name,
    envVar: p.envVar,
    configured: isProviderConfigured(p.id),
    defaultModel: p.defaultModel,
  }));
}

function extractJsonObject(rawText: string): unknown {
  const trimmed = rawText.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Model response did not contain valid JSON.');
  }
}

async function parseJsonSafely<T>(res: globalThis.Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function formatErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'Unknown upstream error.');
  try {
    const parsed = JSON.parse(raw) as {
      error?: { code?: number; message?: string; status?: string };
      message?: string;
    };
    if (parsed?.error?.message) {
      const prefix = [parsed.error.code, parsed.error.status].filter(Boolean).join(' ');
      return prefix ? `${prefix}: ${parsed.error.message}` : parsed.error.message;
    }
    if (parsed?.message) return parsed.message;
  } catch {
    // Not serialized JSON
  }
  return raw;
}

function isTransientUpstreamError(err: unknown): boolean {
  const msg = formatErrorMessage(err);
  return /\b(503|502|504|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|timed?\s*out)\b/i.test(
    msg
  );
}

const delayMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface CompletionRequest {
  provider: AiProviderId;
  model: string;
  systemInstruction: string;
  userPrompt: string;
  expectJson: boolean;
  geminiSchema?: Record<string, unknown>;
}

async function runProviderCompletion(req: CompletionRequest): Promise<{ text: string; modelUsed: string }> {
  const providerMeta = PROVIDERS.find((p) => p.id === req.provider);
  if (!providerMeta) {
    throw new Error(`Unsupported AI provider: ${req.provider}`);
  }
  const model = (req.model || providerMeta.defaultModel).trim().slice(0, 140);

  if (!isProviderConfigured(req.provider)) {
    throw new Error(
      `${providerMeta.name} is not configured on the server. Set ${providerMeta.envVar} in Settings -> Secrets or .env.`
    );
  }

  if (req.provider === 'gemini') {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    const allowedGeminiModels = new Set(['gemini-4-hydrogen', 'gemini-3.1-flash-lite']);
    const primaryModel = allowedGeminiModels.has(model) ? model : 'gemini-4-hydrogen';

    const invokeGemini = async (targetModel: string) => {
      const config: Record<string, unknown> = {
        systemInstruction: req.systemInstruction,
      };
      if (targetModel === 'gemini-4-hydrogen') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }
      if (req.expectJson) {
        config.responseMimeType = 'application/json';
        if (req.geminiSchema) {
          config.responseSchema = req.geminiSchema;
        }
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: req.userPrompt,
        config,
      });

      const text = (response.text ?? '').trim();
      if (!text) {
        throw new Error('Gemini returned an empty response.');
      }
      return { text, modelUsed: targetModel };
    };

    try {
      return await invokeGemini(primaryModel);
    } catch (firstErr) {
      if (isTransientUpstreamError(firstErr)) {
        await delayMs(650);
        try {
          const fallbackModel =
            primaryModel === 'gemini-4-hydrogen' ? 'gemini-3.1-flash-lite' : primaryModel;
          return await invokeGemini(fallbackModel);
        } catch (secondErr) {
          throw new Error(formatErrorMessage(secondErr));
        }
      }
      throw new Error(formatErrorMessage(firstErr));
    }
  }

  if (req.provider === 'anthropic') {
    const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        system: req.systemInstruction,
        messages: [{ role: 'user', content: req.userPrompt }],
      }),
      signal: AbortSignal.timeout(25000),
    });
    const payload = await parseJsonSafely<{
      content?: Array<{ type: string; text?: string }>;
      error?: { message?: string };
    }>(res);
    if (!res.ok) {
      throw new Error(payload?.error?.message || `Anthropic HTTP ${res.status}`);
    }
    const text = payload?.content?.find((c) => c.type === 'text')?.text?.trim() || '';
    if (!text) throw new Error('Anthropic returned an empty response.');
    return { text, modelUsed: model };
  }

  if (req.provider === 'ollama') {
    const baseUrl = getOllamaBaseUrl();
    if (!baseUrl) {
      throw new Error('OLLAMA_BASE_URL is not configured or invalid.');
    }
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: req.expectJson ? 'json' : undefined,
        messages: [
          { role: 'system', content: req.systemInstruction },
          { role: 'user', content: req.userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });
    const payload = await parseJsonSafely<{
      message?: { content?: string };
      error?: string;
    }>(res);
    if (!res.ok) {
      throw new Error(payload?.error || `Ollama HTTP ${res.status}`);
    }
    const text = payload?.message?.content?.trim() || '';
    if (!text) throw new Error('Ollama returned an empty response.');
    return { text, modelUsed: model };
  }

  // OpenAI-compatible providers: OpenRouter, OpenAI, Groq, Mistral
  const endpointMap: Record<'openrouter' | 'openai' | 'groq' | 'mistral', { url: string; key: string }> = {
    openrouter: {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: (process.env.OPENROUTER_API_KEY || '').trim(),
    },
    openai: {
      url: 'https://api.openai.com/v1/chat/completions',
      key: (process.env.OPENAI_API_KEY || '').trim(),
    },
    groq: {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: (process.env.GROQ_API_KEY || '').trim(),
    },
    mistral: {
      url: 'https://api.mistral.ai/v1/chat/completions',
      key: (process.env.MISTRAL_API_KEY || '').trim(),
    },
  };

  const target = endpointMap[req.provider];
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${target.key}`,
  };
  if (req.provider === 'openrouter') {
    headers['HTTP-Referer'] = process.env.APP_URL || `http://localhost:${PORT}`;
    headers['X-Title'] = 'Visual Line Interface';
  }

  const sendOpenAiCompat = async (withJsonFormat: boolean) => {
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: req.systemInstruction },
        { role: 'user', content: req.userPrompt },
      ],
      max_tokens: 1400,
    };
    if (withJsonFormat) {
      body.response_format = { type: 'json_object' };
    }
    const res = await fetch(target.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });
    const data = await parseJsonSafely<{
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
      message?: string;
    }>(res);
    return { res, data };
  };

  let { res, data } = await sendOpenAiCompat(req.expectJson);
  // Some OpenRouter upstream models reject response_format: json_object — retry cleanly without it
  if (!res.ok && req.expectJson && res.status === 400) {
    ({ res, data } = await sendOpenAiCompat(false));
  }

  if (!res.ok) {
    const errMsg = data?.error?.message || data?.message || `${providerMeta.name} HTTP ${res.status}`;
    throw new Error(errMsg);
  }

  const text = data?.choices?.[0]?.message?.content?.trim() || '';
  if (!text) {
    throw new Error(`${providerMeta.name} returned an empty completion.`);
  }
  return { text, modelUsed: model };
}

function sanitizeRecommendation(raw: unknown): AiStackRecommendation {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const cfg = (
    obj.suggestedConfig && typeof obj.suggestedConfig === 'object' ? obj.suggestedConfig : {}
  ) as Record<string, unknown>;

  const framework = VALID_FRAMEWORKS.has(cfg.framework as FrameworkId)
    ? (cfg.framework as FrameworkId)
    : 'vite';
  const viteUiFramework = VALID_VITE_UIS.has(cfg.viteUiFramework as ViteUiFramework)
    ? (cfg.viteUiFramework as ViteUiFramework)
    : 'react';
  const language = VALID_LANGUAGES.has(cfg.language as LanguageId)
    ? (cfg.language as LanguageId)
    : 'typescript';
  const compiler = VALID_COMPILERS.has(cfg.compiler as BuildCompilerId)
    ? (cfg.compiler as BuildCompilerId)
    : framework === 'vite' && viteUiFramework === 'react'
    ? 'swc'
    : 'standard';
  const styling = VALID_STYLING.has(cfg.styling as StylingId)
    ? (cfg.styling as StylingId)
    : 'tailwind';
  const testing = VALID_TESTING.has(cfg.testing as TestingId)
    ? (cfg.testing as TestingId)
    : 'vitest';
  const packageManager = VALID_PMS.has(cfg.packageManager as PackageManagerId)
    ? (cfg.packageManager as PackageManagerId)
    : 'pnpm';
  const runtime = VALID_RUNTIMES.has(cfg.runtime as RuntimeId)
    ? (cfg.runtime as RuntimeId)
    : 'node';
  const directoryLayoutMode = VALID_LAYOUTS.has(cfg.directoryLayoutMode as DirectoryLayoutMode)
    ? (cfg.directoryLayoutMode as DirectoryLayoutMode)
    : 'standard';
  const directoryNamingConvention = VALID_CONVENTIONS.has(
    cfg.directoryNamingConvention as FileNamingConvention
  )
    ? (cfg.directoryNamingConvention as FileNamingConvention)
    : 'kebab-case';

  const devTools = Array.isArray(cfg.devTools)
    ? (cfg.devTools.filter((d) => VALID_DEVTOOLS.has(d as DevToolId)) as DevToolId[])
    : (['eslint', 'prettier'] as DevToolId[]);

  const allowedExtraPackages = new Set([
    'tailwindcss',
    'typescript',
    'eslint',
    'prettier',
    'biome',
    'vitest',
    'playwright',
    'react-router',
    'lucide-react',
    'shadcn-ui',
  ]);
  const selectedPackageIds = Array.isArray(cfg.selectedPackageIds)
    ? cfg.selectedPackageIds.filter(
        (id): id is string => typeof id === 'string' && allowedExtraPackages.has(id)
      )
    : [];

  const rawName = typeof cfg.projectName === 'string' ? cfg.projectName.toLowerCase().trim() : '';
  const projectName = rawName.replace(/[^a-z0-9._-]+/g, '-').replace(/^[^a-z0-9]+|-+$/g, '') || 'studio-app';
  const rawPort = Number(cfg.devPort);
  const devPort = Number.isFinite(rawPort) && rawPort >= 3000 && rawPort <= 9000 ? Math.round(rawPort) : framework === 'nextjs' ? 3000 : 5173;

  return {
    summary: typeof obj.summary === 'string' && obj.summary.trim() ? obj.summary.trim() : 'Recommended configuration generated.',
    rationale: Array.isArray(obj.rationale)
      ? obj.rationale.filter((x): x is string => typeof x === 'string').slice(0, 5)
      : [],
    warnings: Array.isArray(obj.warnings)
      ? obj.warnings.filter((x): x is string => typeof x === 'string').slice(0, 4)
      : [],
    suggestedConfig: {
      framework,
      viteUiFramework,
      language,
      compiler,
      styling,
      testing,
      devTools,
      packageManager,
      runtime,
      projectName,
      selectedPackageIds,
      directoryLayoutMode,
      directoryNamingConvention,
      devPort,
    },
  };
}

function sanitizeDiagnostic(raw: unknown): AiDiagnosticResponse {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const status =
    obj.status === 'optimal' || obj.status === 'advisory' || obj.status === 'risk'
      ? obj.status
      : 'advisory';

  const findings = Array.isArray(obj.findings)
    ? obj.findings
        .filter((f): f is Record<string, unknown> => Boolean(f && typeof f === 'object'))
        .slice(0, 5)
        .map((f) => ({
          title: typeof f.title === 'string' ? f.title : 'Observation',
          detail: typeof f.detail === 'string' ? f.detail : '',
          action: typeof f.action === 'string' ? f.action : '',
        }))
    : [];

  const suggestedCommands = Array.isArray(obj.suggestedCommands)
    ? obj.suggestedCommands.filter((c): c is string => typeof c === 'string').slice(0, 5)
    : [];

  return {
    assessment:
      typeof obj.assessment === 'string' && obj.assessment.trim()
        ? obj.assessment.trim()
        : 'Audit completed.',
    status,
    findings,
    suggestedCommands,
  };
}

function sanitizeRenameSuggestion(raw: unknown, allowedOrigPaths: string[]): AiRenameSuggestion {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const directoryLayoutMode = VALID_LAYOUTS.has(obj.directoryLayoutMode as DirectoryLayoutMode)
    ? (obj.directoryLayoutMode as DirectoryLayoutMode)
    : 'standard';
  const directoryNamingConvention = VALID_CONVENTIONS.has(
    obj.directoryNamingConvention as FileNamingConvention
  )
    ? (obj.directoryNamingConvention as FileNamingConvention)
    : 'kebab-case';

  const allowedSet = new Set(allowedOrigPaths);
  const overrides: Record<string, string> = {};
  const addOverride = (k: unknown, v: unknown) => {
    if (
      typeof k === 'string' &&
      allowedSet.has(k) &&
      typeof v === 'string' &&
      v.trim() &&
      !v.startsWith('/') &&
      !v.includes('..') &&
      !/\s/.test(v)
    ) {
      overrides[k] = v.trim();
    }
  };

  if (Array.isArray(obj.overrides)) {
    for (const item of obj.overrides) {
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        addOverride(rec.originalPath, rec.targetPath);
      }
    }
  } else if (obj.overrides && typeof obj.overrides === 'object') {
    for (const [k, v] of Object.entries(obj.overrides as Record<string, unknown>)) {
      addOverride(k, v);
    }
  }

  return {
    summary:
      typeof obj.summary === 'string' && obj.summary.trim()
        ? obj.summary.trim()
        : 'Directory naming layout suggested.',
    directoryLayoutMode,
    directoryNamingConvention,
    overrides,
  };
}

function sanitizePromptSynthesis(raw: unknown): AiPromptSynthesis {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const promptText =
    typeof obj.promptText === 'string' && obj.promptText.trim()
      ? obj.promptText.trim()
      : '';
  if (!promptText) {
    throw new Error('Model response did not include a valid promptText field.');
  }
  const highlights = Array.isArray(obj.highlights)
    ? obj.highlights.filter((h): h is string => typeof h === 'string' && h.trim().length > 0).slice(0, 5)
    : [];
  return { promptText, highlights };
}

let openRouterModelsCache: { fetchedAt: number; models: Array<{ id: string; name: string; context_length?: number }> } | null = null;
const npmDetailCache = new Map<string, { fetchedAt: number; detail: NpmPackageDetail }>();

function formatOsLabel(platform: string, release: string): string {
  if (platform === 'darwin') return `macOS (${release})`;
  if (platform === 'win32') return `Windows (${release})`;
  if (platform === 'linux') return `Linux ${release.split('-')[0]}`;
  return `${platform} ${release}`;
}

async function resolveBinaryPath(bin: string): Promise<string | null> {
  const lookupCmd = process.platform === 'win32' ? 'where' : 'which';
  try {
    const { stdout } = await execFileAsync(lookupCmd, [bin], { timeout: 2500 });
    const firstLine = stdout.trim().split(/\r?\n/)[0]?.trim();
    return firstLine || null;
  } catch {
    return null;
  }
}

async function probeCliVersion(bin: string, args: string[]): Promise<string | null> {
  try {
    const { stdout, stderr } = await execFileAsync(bin, args, { timeout: 2500 });
    const combined = `${stdout}\n${stderr}`.trim();
    const match = combined.match(/\d+\.\d+\.\d+/);
    return match ? match[0] : combined.split(/\r?\n/)[0]?.slice(0, 32) || null;
  } catch {
    return null;
  }
}

async function probeBinaryEntry(id: string, name: string, bin: string, args: string[]): Promise<SystemProbeBinary> {
  const [binaryPath, version] = await Promise.all([
    resolveBinaryPath(bin),
    probeCliVersion(bin, args),
  ]);
  return {
    id,
    name,
    installed: Boolean(binaryPath || version),
    version,
    binaryPath,
  };
}

function checkTcpPortAvailable(port: number): Promise<SystemProbePort> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', (err: NodeJS.ErrnoException) => {
      resolve({
        port,
        available: false,
        note: err.code === 'EADDRINUSE' ? `Port :${port} is currently in use` : err.message,
      });
    });
    server.once('listening', () => {
      server.close(() => {
        resolve({
          port,
          available: true,
          note: `TCP :${port} unbound and available`,
        });
      });
    });
    server.listen(port, '127.0.0.1');
  });
}

function isValidNpmPackageName(name: string): boolean {
  return /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i.test(name) && name.length <= 214;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));
  app.use((err: unknown, _req: Request, res: Response, next: (err?: unknown) => void) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ ok: false, error: 'Malformed JSON request payload.' });
      return;
    }
    next(err);
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/api/system/probe', async (req: Request, res: Response) => {
    const rawDev = Number(req.query.devPort);
    const rawPreview = Number(req.query.previewPort);
    const devPort = Number.isFinite(rawDev) && rawDev >= 3000 && rawDev <= 9000 ? Math.round(rawDev) : 5173;
    const previewPort =
      Number.isFinite(rawPreview) && rawPreview >= 3000 && rawPreview <= 9000 ? Math.round(rawPreview) : 4173;

    const [
      nodeBin,
      denoBin,
      bunBin,
      npmBin,
      pnpmBin,
      yarnBin,
      gitVer,
      gitUser,
      devPortStatus,
      previewPortStatus,
    ] = await Promise.all([
      probeBinaryEntry('node', 'Node.js', 'node', ['-v']),
      probeBinaryEntry('deno', 'Deno', 'deno', ['--version']),
      probeBinaryEntry('bun', 'Bun', 'bun', ['-v']),
      probeBinaryEntry('npm', 'npm', 'npm', ['-v']),
      probeBinaryEntry('pnpm', 'pnpm', 'pnpm', ['-v']),
      probeBinaryEntry('yarn', 'Yarn', 'yarn', ['-v']),
      probeCliVersion('git', ['--version']),
      probeCliVersion('git', ['config', '--get', 'user.name']),
      checkTcpPortAvailable(devPort),
      checkTcpPortAvailable(previewPort),
    ]);

    const rawPath = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
    const pathSummary = rawPath.slice(0, 3).join(' · ') || '/usr/local/bin';

    const probeResult: SystemProbeResult = {
      probedAt: new Date().toISOString(),
      osLabel: formatOsLabel(os.platform(), os.release()),
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      hostname: os.hostname(),
      pathSummary,
      runtimes: [nodeBin, denoBin, bunBin],
      packageManagers: [
        pnpmBin,
        npmBin,
        yarnBin,
        {
          id: 'bun',
          name: 'Bun',
          installed: bunBin.installed,
          version: bunBin.version,
          binaryPath: bunBin.binaryPath,
        },
      ],
      git: {
        installed: Boolean(gitVer),
        version: gitVer,
        userName: gitUser,
      },
      ports: {
        dev: devPortStatus,
        preview: previewPortStatus,
      },
    };

    res.json(probeResult);
  });

  app.get('/api/npm/search', async (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
    if (q.length < 2) {
      res.status(400).json({ error: 'Query parameter "q" must be at least 2 characters.' });
      return;
    }

    try {
      const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=10`;
      const upstream = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: `npm registry returned HTTP ${upstream.status}` });
        return;
      }
      const data = (await upstream.json()) as {
        objects?: Array<{
          package?: {
            name?: string;
            version?: string;
            description?: string;
            date?: string;
            keywords?: string[];
            links?: { homepage?: string; repository?: string; npm?: string };
          };
        }>;
      };

      const results: NpmSearchPackage[] = (data.objects || [])
        .filter((o) => o.package?.name)
        .map((o) => {
          const pkg = o.package!;
          return {
            name: pkg.name!,
            version: pkg.version || '0.0.0',
            description: pkg.description || 'npm package',
            date: pkg.date,
            homepage: pkg.links?.homepage,
            repository: pkg.links?.repository,
            npmUrl: pkg.links?.npm || `https://www.npmjs.com/package/${pkg.name!}`,
            keywords: (pkg.keywords || []).slice(0, 5),
          };
        });

      res.json({ query: q, results });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Unable to reach npm registry.',
      });
    }
  });

  app.get('/api/npm/package', async (req: Request, res: Response) => {
    const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
    if (!isValidNpmPackageName(name)) {
      res.status(400).json({ error: 'Invalid npm package name.' });
      return;
    }

    const cached = npmDetailCache.get(name);
    if (cached && Date.now() - cached.fetchedAt < 5 * 60 * 1000) {
      res.json({ detail: cached.detail, cached: true });
      return;
    }

    try {
      const upstream = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: `npm registry returned HTTP ${upstream.status}` });
        return;
      }

      const data = (await upstream.json()) as {
        name?: string;
        description?: string;
        license?: string | { type?: string };
        homepage?: string;
        'dist-tags'?: Record<string, string>;
        versions?: Record<
          string,
          {
            peerDependencies?: Record<string, string>;
            deprecated?: string;
          }
        >;
      };

      const latest = data['dist-tags']?.latest || '0.0.0';
      const allVersions = Object.keys(data.versions || {});
      const stableVersions = allVersions
        .filter((v) => !v.includes('-'))
        .slice(-5)
        .reverse();
      const availableVersions = stableVersions.length > 0 ? stableVersions : [latest];
      if (!availableVersions.includes(latest)) {
        availableVersions.unshift(latest);
      }

      const latestMeta = data.versions?.[latest];
      const peerDependencies = Object.entries(latestMeta?.peerDependencies || {}).map(
        ([k, v]) => `${k} ${v}`
      );
      const licenseText =
        typeof data.license === 'string'
          ? data.license
          : data.license?.type || 'MIT';

      const detail: NpmPackageDetail = {
        name: data.name || name,
        version: latest,
        availableVersions,
        description: data.description || 'npm package',
        license: licenseText,
        homepage: data.homepage || `https://www.npmjs.com/package/${name}`,
        npmUrl: `https://www.npmjs.com/package/${name}`,
        peerDependencies,
        deprecated: latestMeta?.deprecated,
      };

      npmDetailCache.set(name, { fetchedAt: Date.now(), detail });
      res.json({ detail, cached: false });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Unable to fetch npm package metadata.',
      });
    }
  });

  app.get('/api/ai/status', (_req: Request, res: Response) => {
    res.json({ providers: getProviderStatuses() });
  });

  app.get('/api/ai/openrouter/models', async (_req: Request, res: Response) => {
    try {
      const now = Date.now();
      if (openRouterModelsCache && now - openRouterModelsCache.fetchedAt < 5 * 60 * 1000) {
        res.json({ models: openRouterModelsCache.models, cached: true });
        return;
      }

      const headers: Record<string, string> = {};
      const key = (process.env.OPENROUTER_API_KEY || '').trim();
      if (key) {
        headers.Authorization = `Bearer ${key}`;
      }
      const upstream = await fetch('https://openrouter.ai/api/v1/models', {
        headers,
        signal: AbortSignal.timeout(15000),
      });
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: `OpenRouter models endpoint returned HTTP ${upstream.status}` });
        return;
      }
      const data = (await upstream.json()) as {
        data?: Array<{ id: string; name?: string; context_length?: number }>;
      };
      const models = (data.data || [])
        .slice(0, 80)
        .map((m) => ({
          id: m.id,
          name: m.name || m.id,
          context_length: m.context_length,
        }));
      openRouterModelsCache = { fetchedAt: now, models };
      res.json({ models, cached: false });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Failed to reach OpenRouter models directory.',
      });
    }
  });

  app.post('/api/ai/test', async (req: Request, res: Response) => {
    const body = (req.body || {}) as { provider?: AiProviderId; model?: string };
    const provider = body.provider || 'openrouter';
    const model = typeof body.model === 'string' ? body.model : '';
    const started = Date.now();
    try {
      const result = await runProviderCompletion({
        provider,
        model,
        systemInstruction: 'You are a connectivity probe for Visual Line Interface. Reply concisely.',
        userPrompt: 'Respond with exactly: READY',
        expectJson: false,
      });
      res.json({
        ok: true,
        provider,
        model: result.modelUsed,
        latencyMs: Date.now() - started,
        reply: result.text.slice(0, 120),
      });
    } catch (err) {
      res.status(400).json({
        ok: false,
        provider,
        latencyMs: Date.now() - started,
        error: err instanceof Error ? err.message : 'Provider connection failed.',
      });
    }
  });

  app.post('/api/ai/assist', async (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      mode?: 'architect' | 'audit' | 'rename' | 'troubleshoot' | 'prompt';
      provider?: AiProviderId;
      model?: string;
      prompt?: string;
      payload?: Record<string, unknown>;
    };

    const mode = body.mode;
    const provider = body.provider || 'openrouter';
    const model = typeof body.model === 'string' ? body.model : '';
    const userText = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 2000) : '';
    const payload = (body.payload && typeof body.payload === 'object' ? body.payload : {}) as Record<
      string,
      unknown
    >;

    if (!mode || !['architect', 'audit', 'rename', 'troubleshoot', 'prompt'].includes(mode)) {
      res.status(400).json({ error: 'Invalid AI assist mode.' });
      return;
    }

    try {
      if (mode === 'prompt') {
        const systemInstruction = `You are a Principal Software Architect writing a ready-to-execute Project Creation Prompt for a coding agent or senior developer.
Given the user's project goal, stack configuration, selected packages, file layout, and CLI bootstrap steps, return strictly valid JSON:
{
  "promptText": "Complete well-structured Markdown prompt that specifies architecture, modules, state/API boundaries, directory & file naming rules, exact CLI setup steps, and verification checks.",
  "highlights": ["short highlight 1", "short highlight 2", "short highlight 3"]
}
Preserve exact framework, package manager, runtime, directory layout, naming conventions, and ports from the input payload.`;

        const geminiSchema = {
          type: Type.OBJECT,
          properties: {
            promptText: { type: Type.STRING },
            highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        };

        const completion = await runProviderCompletion({
          provider,
          model,
          systemInstruction,
          userPrompt: JSON.stringify({ goal: userText, workspace: payload }).slice(0, 7500),
          expectJson: true,
          geminiSchema,
        });

        const parsed = extractJsonObject(completion.text);
        res.json({
          ok: true,
          provider,
          model: completion.modelUsed,
          result: sanitizePromptSynthesis(parsed),
        });
        return;
      }
      if (mode === 'architect') {
        if (!userText) {
          res.status(400).json({ error: 'Please describe the project you want to architect.' });
          return;
        }
        const systemInstruction = `You are the Stack Architect inside Visual Line Interface.
Respond strictly with valid JSON matching this schema:
{
  "summary": "1-2 sentence summary of the recommended stack",
  "rationale": ["short technical reason 1", "short technical reason 2"],
  "warnings": ["optional trade-off warning if any"],
  "suggestedConfig": {
    "framework": "vite" | "nextjs" | "astro" | "vue" | "sveltekit",
    "viteUiFramework": "react" | "vue" | "svelte" | "solid" | "vanilla",
    "language": "typescript" | "javascript",
    "compiler": "swc" | "standard",
    "styling": "tailwind" | "sass" | "css-modules" | "plain-css",
    "testing": "vitest" | "playwright" | "none",
    "devTools": ["eslint" | "prettier" | "biome"],
    "packageManager": "pnpm" | "npm" | "yarn" | "bun",
    "runtime": "node" | "deno" | "bun",
    "projectName": "lowercase-kebab-slug",
    "selectedPackageIds": ["tailwindcss", "typescript", "eslint", "prettier", "biome", "vitest", "playwright", "react-router", "lucide-react", "shadcn-ui"],
    "directoryLayoutMode": "standard" | "feature-sliced" | "domain-scoped",
    "directoryNamingConvention": "kebab-case" | "camelCase" | "PascalCase" | "snake_case",
    "devPort": 5173
  }
}
Do not combine biome with eslint/prettier unless necessary. Do not add react-router when framework is nextjs. Use swc only when framework is vite + react.`;

        const geminiSchema = {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            rationale: { type: Type.ARRAY, items: { type: Type.STRING } },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedConfig: {
              type: Type.OBJECT,
              properties: {
                framework: { type: Type.STRING },
                viteUiFramework: { type: Type.STRING },
                language: { type: Type.STRING },
                compiler: { type: Type.STRING },
                styling: { type: Type.STRING },
                testing: { type: Type.STRING },
                devTools: { type: Type.ARRAY, items: { type: Type.STRING } },
                packageManager: { type: Type.STRING },
                runtime: { type: Type.STRING },
                projectName: { type: Type.STRING },
                selectedPackageIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                directoryLayoutMode: { type: Type.STRING },
                directoryNamingConvention: { type: Type.STRING },
                devPort: { type: Type.INTEGER },
              },
            },
          },
        };

        const completion = await runProviderCompletion({
          provider,
          model,
          systemInstruction,
          userPrompt: `Project goal: ${userText}\nCurrent workspace config JSON: ${JSON.stringify(payload.currentConfig || {})}`,
          expectJson: true,
          geminiSchema,
        });

        const parsed = extractJsonObject(completion.text);
        res.json({
          ok: true,
          provider,
          model: completion.modelUsed,
          result: sanitizeRecommendation(parsed),
        });
        return;
      }

      if (mode === 'rename') {
        const files = Array.isArray(payload.files)
          ? payload.files.filter((f): f is string => typeof f === 'string').slice(0, 30)
          : [];
        if (files.length === 0) {
          res.status(400).json({ error: 'No selected scaffold files supplied for rename advisory.' });
          return;
        }
        const systemInstruction = `You are a project directory structure advisor.
Return strictly valid JSON:
{
  "summary": "Brief explanation of the proposed layout",
  "directoryLayoutMode": "standard" | "feature-sliced" | "domain-scoped",
  "directoryNamingConvention": "kebab-case" | "camelCase" | "PascalCase" | "snake_case",
  "overrides": [{ "originalPath": "<originalPath>", "targetPath": "<newRelativeTargetPath>" }]
}
Only include originalPath values from the input files list. Target paths must be clean relative paths with no spaces, no leading slashes, and no "..".`;

        const geminiSchema = {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            directoryLayoutMode: { type: Type.STRING },
            directoryNamingConvention: { type: Type.STRING },
            overrides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalPath: { type: Type.STRING },
                  targetPath: { type: Type.STRING },
                },
              },
            },
          },
        };

        const completion = await runProviderCompletion({
          provider,
          model,
          systemInstruction,
          userPrompt: `Goal: ${userText || 'Align files cleanly for scalable frontend maintenance'}\nFiles: ${JSON.stringify(files)}\nCurrent layout: ${String(payload.currentLayout || 'standard')}, convention: ${String(payload.currentConvention || 'kebab-case')}`,
          expectJson: true,
          geminiSchema,
        });

        const parsed = extractJsonObject(completion.text);
        res.json({
          ok: true,
          provider,
          model: completion.modelUsed,
          result: sanitizeRenameSuggestion(parsed, files),
        });
        return;
      }

      // audit or troubleshoot
      const isTroubleshoot = mode === 'troubleshoot';
      const systemInstruction = isTroubleshoot
        ? `You are a senior DevOps & CLI troubleshooter. Analyze the failed execution step and log lines, then return strictly valid JSON:
{
  "assessment": "Concise root-cause summary",
  "status": "risk" | "advisory" | "optimal",
  "findings": [{ "title": "...", "detail": "...", "action": "..." }],
  "suggestedCommands": ["command 1", "command 2"]
}`
        : `You are a build & dependency auditor for Visual Line Interface. Audit the user's stack configuration and CLI execution plan, then return strictly valid JSON:
{
  "assessment": "Overall engineering assessment in 1-2 sentences",
  "status": "optimal" | "advisory" | "risk",
  "findings": [{ "title": "...", "detail": "...", "action": "..." }],
  "suggestedCommands": ["optional verification command"]
}`;

      const geminiSchema = {
        type: Type.OBJECT,
        properties: {
          assessment: { type: Type.STRING },
          status: { type: Type.STRING },
          findings: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                detail: { type: Type.STRING },
                action: { type: Type.STRING },
              },
            },
          },
          suggestedCommands: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      };

      const completion = await runProviderCompletion({
        provider,
        model,
        systemInstruction,
        userPrompt: JSON.stringify({ prompt: userText, context: payload }).slice(0, 6000),
        expectJson: true,
        geminiSchema,
      });

      const parsed = extractJsonObject(completion.text);
      res.json({
        ok: true,
        provider,
        model: completion.modelUsed,
        result: sanitizeDiagnostic(parsed),
      });
    } catch (err) {
      const msg = formatErrorMessage(err);
      const status = isTransientUpstreamError(err) ? 503 : 400;
      res.status(status).json({
        ok: false,
        error: msg,
      });
    }
  });

  // Dev Vite middleware or Prod static assets
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Production build not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Visual Line Interface server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
