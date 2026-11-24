import type {
  AiDiagnosticResponse,
  AiPromptSynthesis,
  AiProviderId,
  AiProviderStatus,
  AiRenameSuggestion,
  AiStackRecommendation,
} from '../types/studio';

export async function fetchAiStatus(): Promise<AiProviderStatus[]> {
  const res = await fetch('/api/ai/status');
  if (!res.ok) {
    throw new Error('Failed to load AI provider status.');
  }
  const data = (await res.json()) as { providers: AiProviderStatus[] };
  return data.providers;
}

export async function fetchOpenRouterModels(): Promise<
  Array<{ id: string; name: string; context_length?: number }>
> {
  const res = await fetch('/api/ai/openrouter/models');
  const data = (await res.json()) as {
    models?: Array<{ id: string; name: string; context_length?: number }>;
    error?: string;
  };
  if (!res.ok || !data.models) {
    throw new Error(data.error || 'Could not retrieve OpenRouter models.');
  }
  return data.models;
}

export async function testAiProvider(
  provider: AiProviderId,
  model: string
): Promise<{ ok: boolean; provider: AiProviderId; model?: string; latencyMs: number; reply?: string; error?: string }> {
  const res = await fetch('/api/ai/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model }),
  });
  const data = (await res.json()) as {
    ok: boolean;
    provider: AiProviderId;
    model?: string;
    latencyMs: number;
    reply?: string;
    error?: string;
  };
  return data;
}

export async function requestAiArchitect(params: {
  provider: AiProviderId;
  model: string;
  prompt: string;
  currentConfig: unknown;
}): Promise<{ provider: AiProviderId; model: string; result: AiStackRecommendation }> {
  const res = await fetch('/api/ai/assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'architect',
      provider: params.provider,
      model: params.model,
      prompt: params.prompt,
      payload: { currentConfig: params.currentConfig },
    }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    provider: AiProviderId;
    model: string;
    result?: AiStackRecommendation;
    error?: string;
  };
  if (!res.ok || !data.result) {
    throw new Error(data.error || 'AI Stack Architect request failed.');
  }
  return { provider: data.provider, model: data.model, result: data.result };
}

export async function requestAiAudit(params: {
  provider: AiProviderId;
  model: string;
  mode: 'audit' | 'troubleshoot';
  prompt?: string;
  context: Record<string, unknown>;
}): Promise<{ provider: AiProviderId; model: string; result: AiDiagnosticResponse }> {
  const res = await fetch('/api/ai/assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: params.mode,
      provider: params.provider,
      model: params.model,
      prompt: params.prompt || '',
      payload: params.context,
    }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    provider: AiProviderId;
    model: string;
    result?: AiDiagnosticResponse;
    error?: string;
  };
  if (!res.ok || !data.result) {
    throw new Error(data.error || 'AI analysis failed.');
  }
  return { provider: data.provider, model: data.model, result: data.result };
}

export async function requestAiRenameAdvice(params: {
  provider: AiProviderId;
  model: string;
  prompt: string;
  files: string[];
  currentLayout: string;
  currentConvention: string;
}): Promise<{ provider: AiProviderId; model: string; result: AiRenameSuggestion }> {
  const res = await fetch('/api/ai/assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'rename',
      provider: params.provider,
      model: params.model,
      prompt: params.prompt,
      payload: {
        files: params.files,
        currentLayout: params.currentLayout,
        currentConvention: params.currentConvention,
      },
    }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    provider: AiProviderId;
    model: string;
    result?: AiRenameSuggestion;
    error?: string;
  };
  if (!res.ok || !data.result) {
    throw new Error(data.error || 'AI rename advisor failed.');
  }
  return { provider: data.provider, model: data.model, result: data.result };
}

export async function requestAiProjectPrompt(params: {
  provider: AiProviderId;
  model: string;
  goal: string;
  workspace: Record<string, unknown>;
}): Promise<{ provider: AiProviderId; model: string; result: AiPromptSynthesis }> {
  const res = await fetch('/api/ai/assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'prompt',
      provider: params.provider,
      model: params.model,
      prompt: params.goal,
      payload: params.workspace,
    }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    provider: AiProviderId;
    model: string;
    result?: AiPromptSynthesis;
    error?: string;
  };
  if (!res.ok || !data.result) {
    throw new Error(data.error || 'AI project prompt synthesis failed.');
  }
  return { provider: data.provider, model: data.model, result: data.result };
}
