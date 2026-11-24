import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Code2,
  Cpu,
  FileText,
  FolderTree,
  Keyboard,
  Layers,
  Terminal,
} from 'lucide-react';
import type { ScreenId } from '../../types/studio';

interface DocumentationScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

interface TutorialStep {
  id: string;
  stepNumber: string;
  title: string;
  workspace: string;
  screenId: ScreenId;
  duration: string;
  summary: string;
  instructions: string[];
  proTip: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'tut-1',
    stepNumber: '01',
    title: 'Select a Project Foundation & Runtime',
    workspace: 'Project Studio',
    screenId: 'project-studio',
    duration: '2 min',
    summary:
      'Choose a core framework scaffold (Vite, Next.js, Astro, Vue, or SvelteKit) and pair it with Node.js, Deno, or Bun plus your preferred package manager.',
    instructions: [
      'Open Project Studio and pick one of the five foundations in Section 01.',
      'In the Runtime Selector & Package Manager panels, switch between Node.js, Deno, or Bun and choose pnpm, npm, Yarn, or Bun.',
      'Click any card or toggle to update the Right Contextual Inspector with compatibility rules and official documentation links.',
    ],
    proTip:
      'If you pick Bun as package manager with Node.js or Deno mismatches, the Right Inspector surfaces an instant 1-click Auto-Fix button.',
  },
  {
    id: 'tut-2',
    stepNumber: '02',
    title: 'Use Stack Recommendations & Generate a Project Prompt',
    workspace: 'Stack & Prompt Studio',
    screenId: 'project-studio',
    duration: '2 min',
    summary:
      'Use curated stack profiles or describe your project goal to receive a tailored recommendation—then generate a complete Project Creation Prompt with or without an AI provider.',
    instructions: [
      'In the Stack Recommendations & Prompt Studio panel inside Project Studio, click a curated profile (e.g. High-Speed React SPA or Full-Stack Next.js SaaS) or type your goal.',
      'Click Recommend Stack (runs locally offline) or Recommend with AI (when a provider key like OPENROUTER_API_KEY or GEMINI_API_KEY is configured), then click Apply to Project Studio.',
      'Switch to the Project Creation Prompt tab (or the Create Prompt tab in Generated Execution Plan) to copy or export a Markdown blueprint prompt ready for any coding agent.',
    ],
    proTip:
      'The deterministic local blueprint generator always stays synchronized with your rotary ports, selected package versions, and bulk file rename mappings.',
  },
  {
    id: 'tut-3',
    stepNumber: '03',
    title: 'Calibrate Tooling, Rotary Dials & Pre-Execution Bulk Rename',
    workspace: 'Project Studio · Sections 02–03',
    screenId: 'project-studio',
    duration: '3 min',
    summary:
      'Fine-tune TypeScript, SWC/esbuild, styling, testing, server ports, memory limits, and bulk-rename scaffolded files to match your target directory layout.',
    instructions: [
      'Configure Language, Build Configuration, Styling, Testing, and Development Tools (ESLint, Prettier, or Biome).',
      'Drag the four precision rotary dials (or scroll / click the numeric readout) to calibrate Dev Port, Preview Port, Node Heap Limit, and Fetch Timeout.',
      'In Pre-Execution Bulk Rename, pick Standard src/, Feature-Sliced, or Domain-Scoped layout and enforce kebab-case, camelCase, PascalCase, or snake_case across selected files.',
    ],
    proTip:
      'Pending file renames automatically inject mkdir -p and mv commands (or PowerShell New-Item) into the Generated Execution Plan.',
  },
  {
    id: 'tut-4',
    stepNumber: '04',
    title: 'Curate Libraries & Inspect Synthesized Outputs',
    workspace: 'Package & Library Studio',
    screenId: 'packages',
    duration: '2 min',
    summary:
      'Add curated or live npm registry packages, pin versions, inspect synthesized config files, package.json, and File Tree tabs, and export a standalone .sh or .ps1 script.',
    instructions: [
      'Open Package & Library Studio to filter libraries or query registry.npmjs.org live and queue any npm package with pinned versions.',
      'Return to Project Studio Section 04 to inspect Commands, Config Files (vite.config.*, tsconfig.json, biome.json, vitest.config.*), package.json, File Tree, and Create Prompt.',
      'Export the executable bootstrap script (.sh / .ps1) or copy any config manifest directly.',
    ],
    proTip:
      'Press Cmd+K (macOS) or Ctrl+K (Windows/Linux) anywhere in Visual Line Interface to jump between workspaces or open official library documentation.',
  },
  {
    id: 'tut-5',
    stepNumber: '05',
    title: 'Compose Workflows & Monitor Operations Centre',
    workspace: 'Workflow Builder & Operations',
    screenId: 'workflows',
    duration: '3 min',
    summary:
      'Organize dependency-ordered pipeline steps, sync directly from Project Studio, and run a monitored dry-run sequence with live Recharts timing charts.',
    instructions: [
      'Open Workflow Builder and click Sync from Studio to import your exact configured commands as ordered workflow nodes.',
      'Reorder, enable/disable, or append reusable operation blocks, then click Execute Workflow.',
      'In Operations Centre, pause, resume, cancel, or toggle Fault Injection to test step recovery and inspect live timing charts and logs.',
    ],
    proTip:
      'Completed runs append automatically to Installation History and populate the Overview build duration trend chart.',
  },
  {
    id: 'tut-6',
    stepNumber: '06',
    title: 'Connect Optional AI Providers (OpenRouter & 6 Others)',
    workspace: 'Workstation Settings',
    screenId: 'settings',
    duration: '2 min',
    summary:
      'Configure optional server-side LLM routing across OpenRouter, Google Gemini, OpenAI, Anthropic Claude, Groq, Mistral, or local Ollama.',
    instructions: [
      'Open Settings and scroll to AI Provider & Model Routing (Optional).',
      'Select OpenRouter (or any supported provider), choose a preset model, fetch the live OpenRouter model catalog, or enter a custom model slug.',
      'Add the shown environment variable (such as OPENROUTER_API_KEY) in Settings -> Secrets or .env, then click Refresh Status and Test Provider Connection.',
    ],
    proTip:
      'API keys remain strictly server-side inside Express routes (/api/ai/*) and are never stored in browser storage or rendered as plaintext inputs.',
  },
];

const CODEBASE_MODULES = [
  {
    path: 'server.ts',
    layer: 'Backend / Express + Vite',
    summary:
      'Serves Vite middleware in dev (port 3000) and dist/ in production; exposes /api/health, /api/system/probe, /api/npm/*, and /api/ai/* routes.',
  },
  {
    path: 'src/App.tsx',
    layer: 'Root State Orchestrator',
    summary:
      'Holds ProjectConfig, live host probe telemetry, packages (curated + npm imports), workflows, recipes, history, settings, and Operations Centre execution loop.',
  },
  {
    path: 'src/types/studio.ts',
    layer: 'Domain Contracts',
    summary:
      'Central TypeScript definitions for frameworks, host probes, npm registry packages, synthesized config files, bulk renames, AI providers, and studio settings.',
  },
  {
    path: 'src/data/studioCatalog.ts',
    layer: 'Deterministic CLI & Config Engine',
    summary:
      'Catalog data plus pure engines: validateProjectCompatibility, buildExecutionPlan, buildScaffoldManifest, buildGeneratedPackageJson, and buildScaffoldConfigFiles.',
  },
  {
    path: 'src/data/stackAdvisor.ts',
    layer: 'Offline Stack & Prompt Engine',
    summary:
      'Provides CURATED_STACK_RECOMMENDATIONS, recommendStackOffline heuristic matching, and buildProjectCreationPrompt deterministic Markdown prompt generation.',
  },
  {
    path: 'src/services/aiClient.ts & systemClient.ts',
    layer: 'Typed Backend API Clients',
    summary:
      'Typed fetch wrappers for /api/ai/* (OpenRouter + 6 AI providers), /api/system/probe (OS/PATH/port probing), and /api/npm/* registry search.',
  },
  {
    path: 'src/components/studio/*',
    layer: 'Workbench Modules',
    summary:
      'AiArchitectPanel (Stack Advisor + Project Creation Prompt Studio), BulkFileRenamePanel (directory alignment + regex/affix tools), and CommandPalette (Cmd+K).',
  },
  {
    path: 'tests/studio.test.ts',
    layer: 'Automated Unit Tests',
    summary:
      'Node test runner suite (npm test) verifying validation checks, bulk-rename path alignment, execution plans, config synthesis, and offline prompts.',
  },
];

export const DocumentationScreen: React.FC<DocumentationScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'tutorial' | 'reference' | 'architecture'>('tutorial');
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const toggleCompleted = (id: string) => {
    setCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B] shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#C7A46A]" />
            <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
              Documentation & Guided Tutorial
            </h1>
          </div>
          <p className="text-[13px] text-[#929BA5] mt-0.5">
            Step-by-step workstation walkthrough, prompt engineering workflow, and codebase architecture guide.
          </p>
        </div>

        <nav
          aria-label="Documentation Sections"
          className="flex items-center gap-1 bg-[#101214] p-1 rounded-[5px] border border-[#2C3239]"
        >
          {(
            [
              { id: 'tutorial', label: 'Interactive Tutorial', icon: Terminal },
              { id: 'reference', label: 'Controls & Prompt Guide', icon: Keyboard },
              { id: 'architecture', label: 'Codebase Structure', icon: FolderTree },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-[12px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#252A30] text-[#F1F3F5] border border-[#C7A46A]/60'
                    : 'text-[#929BA5] hover:text-[#F1F3F5] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#C7A46A]' : 'text-[#626D78]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[1040px] mx-auto flex flex-col gap-6 pb-8">
          {activeTab === 'tutorial' && (
            <>
              <div className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-4 flex flex-wrap items-center justify-between gap-4 hardware-bezel">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
                    Guided Walkthrough Progress
                  </div>
                  <div className="text-[14px] font-medium text-[#F1F3F5] mt-0.5">
                    {completedIds.length} of {TUTORIAL_STEPS.length} workstation chapters completed
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('project-studio')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#C7A46A] hover:bg-[#D2B27C] text-[#101214] text-[12px] font-semibold cursor-pointer"
                  >
                    <span>Launch Project Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {TUTORIAL_STEPS.map((step) => {
                  const done = completedIds.includes(step.id);
                  return (
                    <section
                      key={step.id}
                      className={`bg-[#1D2126] border rounded-[5px] p-5 flex flex-col gap-3.5 hardware-bezel transition-colors ${
                        done ? 'border-[#65B9A5]/60' : 'border-[#343B43]'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#2A3038] pb-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleCompleted(step.id)}
                            aria-label={`Mark chapter ${step.stepNumber} complete`}
                            className="mt-0.5 text-[#929BA5] hover:text-[#65B9A5] cursor-pointer"
                          >
                            {done ? (
                              <CheckCircle2 className="w-5 h-5 text-[#65B9A5]" />
                            ) : (
                              <Circle className="w-5 h-5 text-[#626D78]" />
                            )}
                          </button>
                          <div>
                            <div className="flex items-center gap-2 font-mono text-[11px] text-[#C7A46A]">
                              <span>CHAPTER {step.stepNumber}</span>
                              <span className="text-[#626D78]">·</span>
                              <span className="text-[#929BA5]">{step.workspace}</span>
                              <span className="text-[#626D78]">·</span>
                              <span className="text-[#65B9A5]">{step.duration}</span>
                            </div>
                            <h2 className="text-[15.5px] font-semibold text-[#F1F3F5] mt-0.5">
                              {step.title}
                            </h2>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onNavigate(step.screenId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#252A30] border border-[#343B43] hover:border-[#C7A46A] text-[12px] font-medium text-[#F1F3F5] cursor-pointer whitespace-nowrap"
                        >
                          <span>Open {step.workspace.split('·')[0].trim()}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#C7A46A]" />
                        </button>
                      </div>

                      <p className="text-[13px] text-[#929BA5] leading-relaxed">{step.summary}</p>

                      <ol className="flex flex-col gap-1.5 text-[12.5px] text-[#F1F3F5] pl-1">
                        {step.instructions.map((line, i) => (
                          <li key={line} className="flex items-start gap-2.5">
                            <span className="font-mono text-[11px] text-[#C7A46A] pt-0.5 tabular-nums">
                              {i + 1}.
                            </span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ol>

                      <div className="bg-[#14171B] border border-[#2A3038] rounded-[4px] px-3.5 py-2.5 text-[12px] text-[#929BA5]">
                        <span className="font-mono text-[#65B9A5] mr-2">Tip:</span>
                        {step.proTip}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'reference' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <section className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 flex flex-col gap-3 hardware-bezel">
                <div className="flex items-center gap-2 border-b border-[#2A3038] pb-2.5">
                  <Layers className="w-4 h-4 text-[#C7A46A]" />
                  <h2 className="text-[13.5px] font-semibold uppercase tracking-wider text-[#F1F3F5]">
                    Hardware Control Mechanics
                  </h2>
                </div>
                <dl className="flex flex-col gap-3 text-[12.5px]">
                  <div className="bg-[#14171B] border border-[#2A3038] rounded p-3">
                    <dt className="font-semibold text-[#F1F3F5]">Analogue Rotary Knobs</dt>
                    <dd className="text-[#929BA5] mt-1">
                      Drag vertically, scroll your mouse wheel, use arrow keys, or click the monospaced readout to type exact values for Dev Port, Preview Port, Node Heap Limit, and Fetch Timeout.
                    </dd>
                  </div>
                  <div className="bg-[#14171B] border border-[#2A3038] rounded p-3">
                    <dt className="font-semibold text-[#F1F3F5]">Segmented & Mechanical Switches</dt>
                    <dd className="text-[#929BA5] mt-1">
                      Every switch maps directly to CLI template flags (--ts, --tailwind, --biome, --vitest) and updates the live Execution Plan, package.json, and Create Prompt views in real time.
                    </dd>
                  </div>
                  <div className="bg-[#14171B] border border-[#2A3038] rounded p-3">
                    <dt className="font-semibold text-[#F1F3F5]">Command & Docs Palette (⌘K / Ctrl+K)</dt>
                    <dd className="text-[#929BA5] mt-1">
                      Search across all 12 workspaces, switch framework foundations, copy the generated CLI script, or launch official documentation for any language or package.
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 flex flex-col gap-3 hardware-bezel">
                <div className="flex items-center gap-2 border-b border-[#2A3038] pb-2.5">
                  <FileText className="w-4 h-4 text-[#65B9A5]" />
                  <h2 className="text-[13.5px] font-semibold uppercase tracking-wider text-[#F1F3F5]">
                    Stack Recommendations & Prompt Synthesis
                  </h2>
                </div>
                <dl className="flex flex-col gap-3 text-[12.5px]">
                  <div className="bg-[#14171B] border border-[#2A3038] rounded p-3">
                    <dt className="font-semibold text-[#F1F3F5]">Offline Mode (Zero API Keys)</dt>
                    <dd className="text-[#929BA5] mt-1">
                      Uses curated stack profiles + deterministic keyword matching (recommendStackOffline) and builds a complete Markdown specification via buildProjectCreationPrompt directly in the browser.
                    </dd>
                  </div>
                  <div className="bg-[#14171B] border border-[#2A3038] rounded p-3">
                    <dt className="font-semibold text-[#F1F3F5]">Connected Provider Mode</dt>
                    <dd className="text-[#929BA5] mt-1">
                      When any provider (OpenRouter, Gemini, OpenAI, Anthropic, Groq, Mistral, or Ollama) is configured in server environment secrets, Stack Advisor and Prompt Studio enrich architecture rationale and custom build instructions via /api/ai/assist.
                    </dd>
                  </div>
                  <div className="bg-[#14171B] border border-[#2A3038] rounded p-3">
                    <dt className="font-semibold text-[#F1F3F5]">Export Formats</dt>
                    <dd className="text-[#929BA5] mt-1">
                      Export shell bootstrap scripts (.sh / .ps1), live package.json manifests, renamed file path lists, and *-create-prompt.md blueprints.
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          )}

          {activeTab === 'architecture' && (
            <section className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 flex flex-col gap-4 hardware-bezel">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A3038] pb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#C7A46A]" />
                  <h2 className="text-[13.5px] font-semibold uppercase tracking-wider text-[#F1F3F5]">
                    Codebase Structure Reference (Human & Coding Agent Map)
                  </h2>
                </div>
                <span className="font-mono text-[11px] text-[#65B9A5]">
                  Full spec in /project_structure.md & /DOCUMENTATION.md
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CODEBASE_MODULES.map((mod) => (
                  <div
                    key={mod.path}
                    className="bg-[#14171B] border border-[#2A3038] rounded-[4px] p-3.5 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] font-semibold text-[#C7A46A]">
                        {mod.path}
                      </span>
                      <span className="font-mono text-[10.5px] text-[#65B9A5]">{mod.layer}</span>
                    </div>
                    <p className="text-[12px] text-[#929BA5] leading-relaxed">{mod.summary}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#101214] border border-[#2C323A] rounded-[4px] p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-mono text-[11.5px] text-[#F1F3F5]">
                  <Cpu className="w-3.5 h-3.5 text-[#C7A46A]" />
                  <span>Unidirectional Data Flow</span>
                </div>
                <pre className="font-mono text-[11.5px] text-[#929BA5] whitespace-pre-wrap leading-relaxed">
{`ProjectConfig (src/App.tsx)
  ├── validateProjectCompatibility(config)  ──▶ Right Contextual Inspector & Preflight Status
  ├── buildScaffoldManifest(config)         ──▶ BulkFileRenamePanel & File Tree Preview
  ├── buildExecutionPlan(config, pkgs, sh)  ──▶ Commands Preview, Workflow Sync & Operations Centre
  ├── buildGeneratedPackageJson(config)     ──▶ package.json Live Preview Tab
  └── buildProjectCreationPrompt(...)       ──▶ Project Creation Prompt (Offline + Optional /api/ai/assist)`}
                </pre>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
