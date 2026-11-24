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
    title: 'Choose a project framework',
    workspace: 'Create project · Step 1',
    screenId: 'project-studio',
    duration: '2 min',
    summary:
      'Choose an official framework scaffold and a JavaScript or TypeScript template.',
    instructions: [
      'Open Create project and choose Vite, Next.js, Astro, Vue, or SvelteKit.',
      'For Vite, select React, Vue, Svelte, Solid, or Vanilla; choose JavaScript or TypeScript.',
      'Continue to project location when the framework and language are set.',
    ],
    proTip:
      'The real installer uses npm; the other package-manager controls belong to advanced preview tools.',
  },
  {
    id: 'tut-2',
    stepNumber: '02',
    title: 'Select a local project destination',
    workspace: 'Create project · Step 2',
    screenId: 'project-studio',
    duration: '2 min',
    summary:
      'Choose a project name and the parent folder where the new project should be created.',
    instructions: [
      'Enter a valid project folder name.',
      'Click Select a local folder to open the operating system folder picker.',
      'Review the complete target path; the installer refuses to overwrite an existing folder.',
    ],
    proTip:
      'The browser cannot expose local absolute paths, so the folder picker is opened by the local server.',
  },
  {
    id: 'tut-3',
    stepNumber: '03',
    title: 'Add optional packages',
    workspace: 'Create project · Step 3',
    screenId: 'project-studio',
    duration: '3 min',
    summary:
      'Review the packages you want installed alongside the framework scaffold.',
    instructions: [
      'Select optional packages in the setup flow.',
      'Review each pinned package version and whether it is a runtime or development dependency.',
      'The installer currently uses npm and does not apply custom package configuration files.',
    ],
    proTip:
      'Only packages explicitly selected in this step are installed as extra dependencies.',
  },
  {
    id: 'tut-4',
    stepNumber: '04',
    title: 'Review and install',
    workspace: 'Create project · Step 4',
    screenId: 'packages',
    duration: '2 min',
    summary:
      'Review the framework, packages, and destination, then run the actual local installation.',
    instructions: [
      'Confirm the target path and package list.',
      'Click Install project and follow the scaffold, dependency-install, and optional-package progress.',
      'When complete, find the result in Install history and open the project folder in your editor.',
    ],
    proTip:
      'The local installer is for the same computer that runs this server; remote browser sessions cannot install files locally.',
  },
  {
    id: 'tut-5',
    stepNumber: '05',
    title: 'Compose Workflows & Monitor Operations Centre',
    workspace: 'Workflow Builder & Operations',
    screenId: 'workflows',
    duration: '3 min',
    summary:
      'Organize dependency-ordered operation previews; this feature is separate from project installation.',
    instructions: [
      'Open Workflow Builder under More tools to inspect and organize preview operations.',
      'Use the Dry-run simulator to view simulated progress and logs.',
      'These tools do not execute the displayed shell commands.',
    ],
    proTip:
      'Use Install history for real project installations.',
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
      'Serves the local UI and API, including loopback-only native folder selection and npm project-install routes.',
  },
  {
    path: 'server/localInstaller.ts',
    layer: 'Local project installer',
    summary:
      'Validates project requests, builds fixed scaffold arguments, runs npm without a shell, and records install progress.',
  },
  {
    path: 'src/components/screens/ProjectSetupWizard.tsx',
    layer: 'Primary workflow',
    summary:
      'Guides framework, destination, optional packages, review, and actual local installation in four steps.',
  },
  {
    path: 'src/App.tsx',
    layer: 'Root State Orchestrator',
    summary:
      'Routes the main workspaces and stores project configuration, packages, install history, workflows, and settings.',
  },
  {
    path: 'src/types/localInstaller.ts',
    layer: 'Domain Contracts',
    summary: 'Shared request and job-status contracts for the local installer.',
  },
  {
    path: 'src/data/studioCatalog.ts',
    layer: 'Catalog and preview data',
    summary:
      'Provides framework/package metadata and legacy command/config previews used by advanced tooling; it does not run installation.',
  },
  {
    path: 'src/services/localInstallerClient.ts',
    layer: 'Browser-to-local API',
    summary:
      'Calls the local folder-picker, install-job, and progress endpoints and reports API failures to the setup flow.',
  },
  {
    path: 'src/components/layout/Sidebar.tsx',
    layer: 'Navigation',
    summary:
      'Keeps Create project, Packages, and Install history primary; less-used preview and configuration tools are under More tools.',
  },
  {
    path: 'tests/localInstaller.test.ts',
    layer: 'Automated Unit Tests',
    summary:
      'Verifies installer request validation, fixed scaffold arguments, package specs, and refusal to overwrite destinations.',
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
                    <span>Start project setup</span>
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
{`Create project wizard (browser)
  ├── choose framework, folder, and optional packages
  ├── POST /api/projects/install
  │     └── validate request and destination
  │           └── spawn Node + npm-cli.js with fixed arguments (no shell)
  └── poll install job and display step output

Workflow Builder and Operations Centre are separate dry-run previews.`}
                </pre>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
