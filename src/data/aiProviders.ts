import type { AiProviderMeta } from '../types/studio';

export const AI_PROVIDERS: AiProviderMeta[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    shortName: 'OpenRouter',
    description:
      'Unified multi-model API gateway supporting Claude, Gemini, GPT-4o, DeepSeek, Qwen Coder, and Llama through one endpoint.',
    envVar: 'OPENROUTER_API_KEY',
    docsUrl: 'https://openrouter.ai/docs/quickstart',
    defaultModel: 'google/gemini-2.5-flash',
    supportsCustomModel: true,
    supportsCustomEndpoint: true,
    models: [
      {
        id: 'google/gemini-2.5-flash',
        label: 'Google: Gemini 2.5 Flash',
        contextWindow: '1M ctx',
        note: 'Fast structured JSON synthesis and stack planning',
      },
      {
        id: 'anthropic/claude-3.7-sonnet',
        label: 'Anthropic: Claude 3.7 Sonnet',
        contextWindow: '200K ctx',
        note: 'Deep architectural trade-offs and config diagnostics',
      },
      {
        id: 'openai/gpt-4o-mini',
        label: 'OpenAI: GPT-4o Mini',
        contextWindow: '128K ctx',
        note: 'Low-latency schema generation and troubleshooting',
      },
      {
        id: 'deepseek/deepseek-chat-v3-0324',
        label: 'DeepSeek: V3 0324',
        contextWindow: '128K ctx',
        note: 'High-accuracy developer tooling & script analysis',
      },
      {
        id: 'qwen/qwen-2.5-coder-32b-instruct',
        label: 'Qwen: 2.5 Coder 32B',
        contextWindow: '32K ctx',
        note: 'Code-specialized model for CLI flags and file layout',
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        label: 'Meta: Llama 3.3 70B Instruct',
        contextWindow: '128K ctx',
        note: 'Balanced open-weights reasoning model',
      },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    shortName: 'Gemini',
    description:
      'Official Google GenAI SDK provider running server-side with schema-constrained JSON output.',
    envVar: 'GEMINI_API_KEY',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    defaultModel: 'gemini-4-hydrogen',
    supportsCustomModel: false,
    models: [
      {
        id: 'gemini-4-hydrogen',
        label: 'Gemini 4 Hydrogen',
        contextWindow: '1M ctx',
        note: 'Default fast reasoning & structured stack architecture',
      },
      {
        id: 'gemini-3.1-flash-lite',
        label: 'Gemini 3.1 Flash Lite',
        contextWindow: '1M ctx',
        note: 'Ultra-low latency for quick stack & rename checks',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    shortName: 'OpenAI',
    description:
      'Direct OpenAI Chat Completions provider for GPT-4o and o3-mini reasoning models.',
    envVar: 'OPENAI_API_KEY',
    docsUrl: 'https://platform.openai.com/docs/api-reference',
    defaultModel: 'gpt-4o-mini',
    supportsCustomModel: true,
    supportsCustomEndpoint: true,
    models: [
      {
        id: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        contextWindow: '128K ctx',
        note: 'Fast JSON-mode CLI and scaffold assistant',
      },
      {
        id: 'gpt-4o',
        label: 'GPT-4o',
        contextWindow: '128K ctx',
        note: 'Flagship multimodal & architecture reasoning',
      },
      {
        id: 'o3-mini',
        label: 'o3-mini',
        contextWindow: '200K ctx',
        note: 'Structured reasoning for complex dependency graphs',
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    shortName: 'Anthropic',
    description:
      'Direct Anthropic Messages API provider for Claude Sonnet and Haiku models.',
    envVar: 'ANTHROPIC_API_KEY',
    docsUrl: 'https://docs.anthropic.com/en/api/getting-started',
    defaultModel: 'claude-3-7-sonnet-20250219',
    supportsCustomModel: true,
    models: [
      {
        id: 'claude-3-7-sonnet-20250219',
        label: 'Claude 3.7 Sonnet',
        contextWindow: '200K ctx',
        note: 'High-precision code & build toolchain guidance',
      },
      {
        id: 'claude-3-5-haiku-20241022',
        label: 'Claude 3.5 Haiku',
        contextWindow: '200K ctx',
        note: 'Rapid config linting & file convention suggestions',
      },
    ],
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    shortName: 'Groq',
    description:
      'Ultra-low latency LPU inference for Llama 3.3 and Mixtral open-weights models.',
    envVar: 'GROQ_API_KEY',
    docsUrl: 'https://console.groq.com/docs/overview',
    defaultModel: 'llama-3.3-70b-versatile',
    supportsCustomModel: true,
    supportsCustomEndpoint: true,
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        label: 'Llama 3.3 70B Versatile',
        contextWindow: '128K ctx',
        note: 'Sub-second structured responses on Groq LPUs',
      },
      {
        id: 'llama-3.1-8b-instant',
        label: 'Llama 3.1 8B Instant',
        contextWindow: '128K ctx',
        note: 'Instant lightweight stack and rename hints',
      },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    shortName: 'Mistral',
    description:
      'Codestral and Mistral models tuned for developer workflows and European hosting.',
    envVar: 'MISTRAL_API_KEY',
    docsUrl: 'https://docs.mistral.ai/api/',
    defaultModel: 'codestral-latest',
    supportsCustomModel: true,
    supportsCustomEndpoint: true,
    models: [
      {
        id: 'codestral-latest',
        label: 'Codestral Latest',
        contextWindow: '256K ctx',
        note: 'Specialized code, CLI, and config synthesis',
      },
      {
        id: 'mistral-small-latest',
        label: 'Mistral Small',
        contextWindow: '32K ctx',
        note: 'Fast structured diagnostics and package advice',
      },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    shortName: 'Ollama',
    description:
      'Private local model server configured via OLLAMA_BASE_URL for offline workstations.',
    envVar: 'OLLAMA_BASE_URL',
    docsUrl: 'https://github.com/ollama/ollama/blob/main/docs/api.md',
    defaultModel: 'qwen2.5-coder:7b',
    supportsCustomModel: true,
    supportsCustomEndpoint: true,
    models: [
      {
        id: 'qwen2.5-coder:7b',
        label: 'Qwen 2.5 Coder 7B',
        contextWindow: '32K ctx',
        note: 'Local code & CLI generation with zero external calls',
      },
      {
        id: 'llama3.2:latest',
        label: 'Llama 3.2',
        contextWindow: '128K ctx',
        note: 'Compact local general assistant',
      },
      {
        id: 'deepseek-r1:8b',
        label: 'DeepSeek R1 8B',
        contextWindow: '64K ctx',
        note: 'Local reasoning for troubleshooting pipeline failures',
      },
    ],
  },
];
