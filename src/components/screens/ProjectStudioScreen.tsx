import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookmarkPlus,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  FolderOpen,
  FolderTree,
  ListOrdered,
  Maximize2,
  Minimize2,
  Play,
  Terminal,
} from 'lucide-react';
import type {
  AiProviderStatus,
  AiStackRecommendation,
  BuildCompilerId,
  CompatibilityIssue,
  DevToolId,
  ExecutionCommandStep,
  FrameworkId,
  InspectorTarget,
  LanguageId,
  PackageManagerId,
  PackageManagerInfo,
  ProjectConfig,
  RuntimeId,
  RuntimeInfo,
  StudioPackage,
  StudioSettings,
  StylingId,
  TestingId,
  ViteUiFramework,
} from '../../types/studio';
import {
  buildGeneratedPackageJson,
  buildScaffoldConfigFiles,
  buildScaffoldManifest,
  FRAMEWORKS,
  TOOLCHAIN_DOCS,
} from '../../data/studioCatalog';
import { buildProjectCreationPrompt } from '../../data/stackAdvisor';
import { FrameworkMark, PackageManagerMark, RuntimeMark } from '../icons/BrandMarks';
import { StatusIndicator } from '../controls/StatusIndicator';
import { SegmentedSelector } from '../controls/SegmentedSelector';
import { MechanicalToggle } from '../controls/MechanicalToggle';
import { VersionSelector } from '../controls/VersionSelector';
import { RotaryKnob } from '../controls/RotaryKnob';
import { TechnicalMeter } from '../controls/TechnicalMeter';
import { BulkFileRenamePanel } from '../studio/BulkFileRenamePanel';
import { AiArchitectPanel } from '../studio/AiArchitectPanel';

interface ProjectStudioScreenProps {
  config: ProjectConfig;
  onUpdateConfig: (patch: Partial<ProjectConfig>) => void;
  runtimes: RuntimeInfo[];
  onUpdateRuntimeVersion: (runtimeId: RuntimeId, version: string) => void;
  packageManagers: PackageManagerInfo[];
  packages: StudioPackage[];
  settings: StudioSettings;
  executionPlan: ExecutionCommandStep[];
  issues: CompatibilityIssue[];
  providerStatuses: AiProviderStatus[];
  onInspect: (target: InspectorTarget) => void;
  onSaveRecipe: (name: string, description: string) => void;
  onInitialiseProject: () => void;
  onOpenPackagesScreen: () => void;
  onOpenAiSettings: () => void;
  onApplyAiRecommendation: (rec: AiStackRecommendation) => void;
}

const DIRECTORY_PRESETS = [
  '~/Developer/workspaces',
  '~/Projects/frontend',
  '~/Code/sandbox',
  '/srv/apps',
];

export const ProjectStudioScreen: React.FC<ProjectStudioScreenProps> = ({
  config,
  onUpdateConfig,
  runtimes,
  onUpdateRuntimeVersion,
  packageManagers,
  packages,
  settings,
  executionPlan,
  issues,
  providerStatuses,
  onInspect,
  onSaveRecipe,
  onInitialiseProject,
  onOpenPackagesScreen,
  onOpenAiSettings,
  onApplyAiRecommendation,
}) => {
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'commands' | 'configs' | 'package-json' | 'file-tree' | 'prompt'>('commands');
  const [activeConfigId, setActiveConfigId] = useState<string>('cfg-package-json');
  const [expandedPreview, setExpandedPreview] = useState(false);
  const [showSequence, setShowSequence] = useState(true);
  const [showAdvancedInspect, setShowAdvancedInspect] = useState(false);
  const [showDirPicker, setShowDirPicker] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeSavedToast, setRecipeSavedToast] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const sec1Ref = useRef<HTMLElement>(null);
  const sec2Ref = useRef<HTMLElement>(null);
  const sec3Ref = useRef<HTMLElement>(null);
  const sec4Ref = useRef<HTMLElement>(null);
  const sec5Ref = useRef<HTMLElement>(null);

  const selectedFramework = FRAMEWORKS.find((f) => f.id === config.framework) ?? FRAMEWORKS[0];
  const selectedRuntime = runtimes.find((r) => r.id === config.runtime) ?? runtimes[0];
  const selectedPm =
    packageManagers.find((p) => p.id === config.packageManager) ?? packageManagers[0];

  const isProjectNameValid = /^[a-z0-9][a-z0-9._-]*$/i.test(config.projectName.trim());
  const errorCount = issues.filter((i) => i.severity === 'error').length;

  const fullCommandScript = useMemo(
    () => executionPlan.map((step) => step.command).join('\n'),
    [executionPlan]
  );

  const generatedPackageJson = useMemo(
    () => buildGeneratedPackageJson(config, packages),
    [config, packages]
  );

  const scaffoldManifest = useMemo(() => buildScaffoldManifest(config), [config]);

  const synthesizedConfigFiles = useMemo(
    () => buildScaffoldConfigFiles(config, packages),
    [config, packages]
  );

  const selectedConfigFile =
    synthesizedConfigFiles.find((f) => f.id === activeConfigId) ?? synthesizedConfigFiles[0];

  const generatedProjectPrompt = useMemo(
    () =>
      buildProjectCreationPrompt({
        config,
        packages,
        executionPlan,
        manifest: scaffoldManifest,
      }),
    [config, packages, executionPlan, scaffoldManifest]
  );

  const estimatedTotalSec = useMemo(
    () => executionPlan.reduce((acc, s) => acc + s.estimatedSec, 0),
    [executionPlan]
  );

  const scrollToSection = (index: number, ref: React.RefObject<HTMLElement | null>) => {
    setActivePhaseIndex(index);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleToggleDevTool = (tool: DevToolId) => {
    onInspect({ type: 'devtools', id: tool });
    const exists = config.devTools.includes(tool);
    const next = exists
      ? config.devTools.filter((t) => t !== tool)
      : [...config.devTools, tool];
    onUpdateConfig({ devTools: next });
  };

  const handleCopyPreview = async () => {
    try {
      const payload =
        previewTab === 'package-json'
          ? generatedPackageJson
          : previewTab === 'configs'
          ? selectedConfigFile?.content ?? generatedPackageJson
          : previewTab === 'file-tree'
          ? scaffoldManifest.map((f) => f.targetPath).join('\n')
          : previewTab === 'prompt'
          ? generatedProjectPrompt
          : fullCommandScript;
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const handleCopySingleStep = async (stepId: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedStepId(stepId);
      setTimeout(() => setCopiedStepId(null), 1400);
    } catch {
      // Fallback ignored
    }
  };

  const handleDownloadScript = () => {
    const isPs = settings.shellTarget === 'powershell';
    const content = isPs
      ? `$ErrorActionPreference = "Stop"\n# Generated by Visual Line Interface (PowerShell)\n${fullCommandScript}\n`
      : `#!/usr/bin/env ${settings.shellTarget}\nset -euo pipefail\n\n# Generated by Visual Line Interface (${settings.shellTarget})\n${fullCommandScript}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.projectName || 'setup'}-bootstrap.${isPs ? 'ps1' : 'sh'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRequestInitialise = () => {
    if (settings.confirmBeforeExecution) {
      setConfirmModalOpen(true);
    } else {
      onInitialiseProject();
    }
  };

  const handleCommitRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = recipeName.trim() || `${selectedFramework.name} · ${config.projectName}`;
    onSaveRecipe(
      trimmed,
      `${selectedFramework.name} (${config.language}), ${config.packageManager}, ${config.styling}, ${executionPlan.length} operations`
    );
    setRecipeName('');
    setSavingRecipe(false);
    setRecipeSavedToast(true);
    setTimeout(() => setRecipeSavedToast(false), 2400);
  };

  const progressSteps = [
    { num: '01', label: 'Foundation', ref: sec1Ref },
    { num: '02', label: 'Configuration', ref: sec3Ref },
    { num: '03', label: 'Dependencies', ref: sec4Ref },
    { num: '04', label: 'Review & Execute', ref: sec5Ref },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Top Page Header + Progress Indicator */}
      <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B] shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
              Project Studio
            </h1>
            <span className="font-mono text-[11px] text-[#626D78]">·</span>
            <span className="font-mono text-[11.5px] text-[#929BA5]">
              {selectedFramework.name} / {config.packageManager} / {config.projectName || 'untitled'}
            </span>
          </div>
          <p className="text-[13px] text-[#929BA5] mt-0.5">
            Configure your next development environment.
          </p>
        </div>

        {/* Compact Progress Indicator */}
        <nav aria-label="Configuration Stages" className="flex items-center gap-1 bg-[#101214] p-1 rounded-[5px] border border-[#2C3239]">
          {progressSteps.map((step, idx) => {
            const active = activePhaseIndex === idx;
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => scrollToSection(idx, step.ref)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-[12px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#252A30] text-[#F1F3F5] border border-[#C7A46A]/60'
                    : 'text-[#929BA5] hover:text-[#F1F3F5] border border-transparent'
                }`}
              >
                <span className={`font-mono text-[11px] ${active ? 'text-[#C7A46A]' : 'text-[#626D78]'}`}>
                  {step.num}
                </span>
                <span className="text-[#626D78]">—</span>
                <span className="font-medium">{step.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Scrollable Main Studio Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[1060px] mx-auto flex flex-col gap-8 pb-8">
          {/* SECTION 1: PROJECT FOUNDATION */}
          <section
            ref={sec1Ref}
            onMouseEnter={() => setActivePhaseIndex(0)}
            className="flex flex-col gap-3.5"
          >
            <div className="flex items-baseline justify-between gap-4 border-b border-[#262B32] pb-2">
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
                  Section 01 · Project Foundation
                </h2>
                <p className="text-[12px] text-[#929BA5] mt-0.5">
                  Select a primary application scaffold. Changing the foundation adapts compiler and template options.
                </p>
              </div>
              <span className="font-mono text-[11px] text-[#626D78] whitespace-nowrap">
                {FRAMEWORKS.length} foundations
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {FRAMEWORKS.map((fw) => {
                const selected = config.framework === fw.id;
                return (
                  <div
                    key={fw.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onUpdateConfig({
                        framework: fw.id as FrameworkId,
                        devPort: fw.defaultPort,
                        compiler: fw.supportsSwc ? config.compiler : 'standard',
                      });
                      onInspect({ type: 'framework', id: fw.id });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onUpdateConfig({
                          framework: fw.id as FrameworkId,
                          devPort: fw.defaultPort,
                          compiler: fw.supportsSwc ? config.compiler : 'standard',
                        });
                        onInspect({ type: 'framework', id: fw.id });
                      }
                    }}
                    className={`group flex flex-col justify-between text-left p-3.5 rounded-[5px] border transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C7A46A] ${
                      selected
                        ? 'bg-[#1D2126] border-[#C7A46A] hardware-bezel shadow-[0_0_0_1px_rgba(199,164,106,0.25)]'
                        : 'bg-[#171A1E] border-[#2D333B] hover:border-[#434C57] hover:bg-[#1A1E23]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div
                          className={`w-8 h-8 rounded-[4px] border flex items-center justify-center ${
                            selected
                              ? 'bg-[#252A30] border-[#C7A46A]/50'
                              : 'bg-[#101214] border-[#2C323A]'
                          }`}
                        >
                          <FrameworkMark id={fw.id} active={selected} className="w-4.5 h-4.5" />
                        </div>
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            selected
                              ? 'border-[#C7A46A] bg-[#C7A46A]/20'
                              : 'border-[#434C57] bg-[#101214]'
                          }`}
                          aria-hidden="true"
                        >
                          {selected && <span className="w-1.5 h-1.5 rounded-full bg-[#C7A46A]" />}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-[14px] font-semibold text-[#F1F3F5]">{fw.name}</span>
                        <span className="font-mono text-[10.5px] text-[#626D78]">
                          v{fw.latestVersion}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-[#929BA5] leading-snug mt-1 line-clamp-2">
                        {fw.tagline}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#262B32] flex items-center justify-between gap-2">
                      <StatusIndicator tone={fw.compatibility} label={fw.compatibilityLabel} compact />
                      <a
                        href={fw.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={`${fw.name} official documentation`}
                        className="inline-flex items-center gap-1 font-mono text-[10.5px] text-[#77A9DC] hover:text-[#F1F3F5] transition-colors shrink-0"
                      >
                        <span>Docs</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <AiArchitectPanel
            config={config}
            packages={packages}
            manifest={scaffoldManifest}
            settings={settings}
            providerStatuses={providerStatuses}
            issues={issues}
            executionPlan={executionPlan}
            onApplyRecommendation={onApplyAiRecommendation}
            onOpenAiSettings={onOpenAiSettings}
          />

          {/* SECTION 2: RUNTIME & PACKAGE MANAGER */}
          <section
            ref={sec2Ref}
            onMouseEnter={() => setActivePhaseIndex(0)}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          >
            {/* Runtime Selector Panel */}
            <div className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-4 flex flex-col gap-4 hardware-bezel">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
                    Runtime Selector
                  </h2>
                  <p className="text-[11.5px] text-[#929BA5]">
                    Target JavaScript execution engine
                  </p>
                </div>
                <StatusIndicator tone={selectedRuntime.status} compact />
              </div>

              <SegmentedSelector<RuntimeId>
                ariaLabel="Runtime Selector"
                fullWidth
                value={config.runtime}
                onChange={(rtId) => {
                  const found = runtimes.find((r) => r.id === rtId);
                  onUpdateConfig({
                    runtime: rtId,
                    runtimeVersion: found?.selectedVersion ?? '',
                  });
                  onInspect({ type: 'runtime', id: rtId });
                }}
                options={runtimes.map((rt) => ({
                  value: rt.id,
                  label: rt.name,
                  sublabel: rt.installedVersion ?? 'N/A',
                  icon: <RuntimeMark id={rt.id} className="w-4 h-4" />,
                }))}
              />

              <VersionSelector
                label={`${selectedRuntime.name} Version Channel`}
                installedVersion={selectedRuntime.installedVersion}
                latestVersion={selectedRuntime.latestVersion}
                selectedVersion={selectedRuntime.selectedVersion}
                options={selectedRuntime.availableVersions}
                status={selectedRuntime.status}
                onChange={(ver) => {
                  onUpdateRuntimeVersion(selectedRuntime.id, ver);
                  onUpdateConfig({ runtimeVersion: ver });
                  onInspect({ type: 'runtime', id: selectedRuntime.id });
                }}
              />

              <div className="flex items-center justify-between gap-2 text-[11.5px] text-[#929BA5] pt-1 border-t border-[#2A3038]">
                <span className="font-mono text-[#626D78] truncate">
                  {selectedRuntime.binaryPath}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[#65B9A5] whitespace-nowrap">
                    {selectedRuntime.manager}
                  </span>
                  <a
                    href={selectedRuntime.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-[#77A9DC] hover:text-[#F1F3F5] transition-colors"
                  >
                    <span>Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Package Manager Panel */}
            <div className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-4 flex flex-col gap-4 hardware-bezel">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
                    Package Manager
                  </h2>
                  <p className="text-[11.5px] text-[#929BA5]">
                    Dependency installer and workspace runner
                  </p>
                </div>
                <StatusIndicator tone={selectedPm.status} compact />
              </div>

              <SegmentedSelector<PackageManagerId>
                ariaLabel="Package Manager Selector"
                fullWidth
                value={config.packageManager}
                onChange={(pmId) => {
                  onUpdateConfig({ packageManager: pmId });
                  onInspect({ type: 'package-manager', id: pmId });
                }}
                options={packageManagers.map((pm) => ({
                  value: pm.id,
                  label: pm.name,
                  sublabel: `v${pm.version.split('.')[0]}`,
                  icon: <PackageManagerMark id={pm.id} className="w-3.5 h-3.5" />,
                }))}
              />

              <div className="p-3 rounded bg-[#171A1E] border border-[#2C323A] flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#929BA5]">Detected Version</span>
                  <span className="font-mono text-[#F1F3F5]">v{selectedPm.version}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#929BA5]">Lockfile Format</span>
                  <span className="font-mono text-[#C7A46A]">{selectedPm.lockfile}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#929BA5]">Runtime Compatibility</span>
                  <span className="font-mono text-[#65B9A5]">
                    {selectedPm.compatibleRuntimes.includes(config.runtime)
                      ? `Verified on ${selectedRuntime.name}`
                      : `Requires Node.js shim`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#2A3038]">
                <p className="text-[11.5px] text-[#929BA5] leading-snug truncate">
                  {selectedPm.notes}
                </p>
                <a
                  href={selectedPm.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-[#77A9DC] hover:text-[#F1F3F5] transition-colors shrink-0"
                >
                  <span>Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </section>

          {/* SECTION 3: FRAMEWORK CONFIGURATION */}
          <section
            ref={sec3Ref}
            onMouseEnter={() => setActivePhaseIndex(1)}
            className="flex flex-col gap-4"
          >
            <div className="flex items-baseline justify-between gap-4 border-b border-[#262B32] pb-2">
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
                  Section 02 · Framework Configuration
                </h2>
                <p className="text-[12px] text-[#929BA5] mt-0.5">
                  Tailored compiler, language, styling, linting, and numeric server tuning for{' '}
                  <span className="text-[#F1F3F5] font-medium">{selectedFramework.name}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenPackagesScreen}
                className="text-[12px] font-medium text-[#C7A46A] hover:underline whitespace-nowrap cursor-pointer"
              >
                Browse Library Tray ({config.selectedPackageIds.length}) →
              </button>
            </div>

            <div className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 flex flex-col gap-5 hardware-bezel">
              {/* Row 1: Framework Variant (if Vite), Language, Build Config */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {config.framework === 'vite' ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] font-medium text-[#929BA5]">
                        UI Framework Preset
                      </span>
                      {TOOLCHAIN_DOCS[config.viteUiFramework] && (
                        <a
                          href={TOOLCHAIN_DOCS[config.viteUiFramework].docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[10.5px] text-[#77A9DC] hover:text-[#F1F3F5] transition-colors"
                        >
                          <span>{config.viteUiFramework} docs</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <SegmentedSelector<ViteUiFramework>
                      ariaLabel="Vite UI Framework"
                      size="sm"
                      fullWidth
                      value={config.viteUiFramework}
                      onChange={(v) => {
                        onUpdateConfig({ viteUiFramework: v });
                        onInspect({ type: 'framework', id: 'vite' });
                      }}
                      options={[
                        { value: 'react', label: 'React' },
                        { value: 'vue', label: 'Vue' },
                        { value: 'svelte', label: 'Svelte' },
                        { value: 'solid', label: 'Solid' },
                        { value: 'vanilla', label: 'Vanilla' },
                      ]}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] font-medium text-[#929BA5]">
                        Framework Target
                      </span>
                      <a
                        href={selectedFramework.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[10.5px] text-[#77A9DC] hover:text-[#F1F3F5] transition-colors"
                      >
                        <span>Docs</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div className="px-3.5 py-2 rounded-[5px] bg-[#101214] border border-[#2C3239] flex items-center justify-between text-[12.5px]">
                      <span className="text-[#F1F3F5] font-medium">{selectedFramework.name}</span>
                      <span className="font-mono text-[11px] text-[#C7A46A]">
                        v{selectedFramework.latestVersion}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-medium text-[#929BA5]">Language</span>
                    {TOOLCHAIN_DOCS[config.language] && (
                      <a
                        href={TOOLCHAIN_DOCS[config.language].docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[10.5px] text-[#77A9DC] hover:text-[#F1F3F5] transition-colors"
                      >
                        <span>Docs</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <SegmentedSelector<LanguageId>
                    ariaLabel="Language Selector"
                    size="sm"
                    fullWidth
                    value={config.language}
                    onChange={(lang) => {
                      onUpdateConfig({ language: lang });
                      onInspect({ type: 'language', id: lang });
                    }}
                    options={[
                      { value: 'typescript', label: 'TypeScript', sublabel: 'TSX' },
                      { value: 'javascript', label: 'JavaScript', sublabel: 'JSX' },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-medium text-[#929BA5]">
                      Build Configuration
                    </span>
                    {TOOLCHAIN_DOCS[config.compiler] && (
                      <a
                        href={TOOLCHAIN_DOCS[config.compiler].docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[10.5px] text-[#77A9DC] hover:text-[#F1F3F5] transition-colors"
                      >
                        <span>Docs</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <SegmentedSelector<BuildCompilerId>
                    ariaLabel="Build Configuration"
                    size="sm"
                    fullWidth
                    value={config.compiler}
                    onChange={(comp) => {
                      onUpdateConfig({ compiler: comp });
                      onInspect({ type: 'compiler', id: comp });
                    }}
                    options={[
                      { value: 'swc', label: 'SWC', sublabel: 'Rust' },
                      { value: 'standard', label: 'Standard', sublabel: 'esbuild' },
                    ]}
                  />
                </div>
              </div>

              <div className="border-t border-[#2A3038]" />

              {/* Row 2: Styling & Testing */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-medium text-[#929BA5]">Styling</span>
                    {TOOLCHAIN_DOCS[config.styling] && (
                      <a
                        href={TOOLCHAIN_DOCS[config.styling].docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[10.5px] text-[#77A9DC] hover:text-[#F1F3F5] transition-colors"
                      >
                        <span>{TOOLCHAIN_DOCS[config.styling].label}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <SegmentedSelector<StylingId>
                    ariaLabel="Styling System"
                    size="sm"
                    fullWidth
                    value={config.styling}
                    onChange={(st) => {
                      onUpdateConfig({ styling: st });
                      onInspect({ type: 'styling', id: st });
                    }}
                    options={[
                      { value: 'tailwind', label: 'Tailwind CSS' },
                      { value: 'sass', label: 'Sass' },
                      { value: 'css-modules', label: 'CSS Modules' },
                      { value: 'plain-css', label: 'Plain CSS' },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-medium text-[#929BA5]">Testing</span>
                    {config.testing !== 'none' && TOOLCHAIN_DOCS[config.testing] && (
                      <a
                        href={TOOLCHAIN_DOCS[config.testing].docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[10.5px] text-[#77A9DC] hover:text-[#F1F3F5] transition-colors"
                      >
                        <span>{TOOLCHAIN_DOCS[config.testing].label}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <SegmentedSelector<TestingId>
                    ariaLabel="Testing Framework"
                    size="sm"
                    fullWidth
                    value={config.testing}
                    onChange={(tst) => {
                      onUpdateConfig({ testing: tst });
                      onInspect({ type: 'testing', id: tst });
                    }}
                    options={[
                      { value: 'vitest', label: 'Vitest' },
                      { value: 'playwright', label: 'Playwright' },
                      { value: 'none', label: 'None' },
                    ]}
                  />
                </div>
              </div>

              <div className="border-t border-[#2A3038]" />

              {/* Row 3: Development Tools (Mechanical Toggles) */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-medium text-[#929BA5]">
                    Development Tools
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    {(['eslint', 'prettier', 'biome'] as const).map((tool) => (
                      <a
                        key={tool}
                        href={TOOLCHAIN_DOCS[tool].docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[#77A9DC] hover:text-[#F1F3F5] transition-colors"
                      >
                        <span>{tool}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                    <span className="text-[#626D78]">{config.devTools.length} active</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <MechanicalToggle
                    checked={config.devTools.includes('eslint')}
                    onChange={() => handleToggleDevTool('eslint')}
                    label="ESLint"
                    description="Flat config rules & React Hooks checks"
                    onFocusInspect={() => onInspect({ type: 'devtools', id: 'eslint' })}
                  />
                  <MechanicalToggle
                    checked={config.devTools.includes('prettier')}
                    onChange={() => handleToggleDevTool('prettier')}
                    label="Prettier"
                    description="Deterministic formatting & class sorting"
                    onFocusInspect={() => onInspect({ type: 'devtools', id: 'prettier' })}
                  />
                  <MechanicalToggle
                    checked={config.devTools.includes('biome')}
                    onChange={() => handleToggleDevTool('biome')}
                    label="Biome"
                    description="Unified Rust linter & code formatter"
                    onFocusInspect={() => onInspect({ type: 'devtools', id: 'biome' })}
                  />
                </div>
              </div>

              <div className="border-t border-[#2A3038]" />

              {/* Row 4: Precision Analogue Rotary Controls for Numeric Parameters */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-medium text-[#929BA5]">
                    Server & Resource Calibration
                  </span>
                  <span className="font-mono text-[11px] text-[#626D78]">
                    Drag dial, scroll, or click readout to edit
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <RotaryKnob
                    label="Dev Server Port"
                    value={config.devPort}
                    min={3000}
                    max={9000}
                    step={1}
                    onChange={(val) => onUpdateConfig({ devPort: val })}
                    onInspect={() => onInspect({ type: 'rotary', key: 'devPort' })}
                  />
                  <RotaryKnob
                    label="Preview Port"
                    value={config.previewPort}
                    min={3000}
                    max={9000}
                    step={1}
                    onChange={(val) => onUpdateConfig({ previewPort: val })}
                    onInspect={() => onInspect({ type: 'rotary', key: 'previewPort' })}
                  />
                  <RotaryKnob
                    label="Node Heap Limit"
                    value={config.memoryLimitMb}
                    min={1024}
                    max={8192}
                    step={512}
                    unit="MB"
                    onChange={(val) => onUpdateConfig({ memoryLimitMb: val })}
                    onInspect={() => onInspect({ type: 'rotary', key: 'memoryLimitMb' })}
                  />
                  <RotaryKnob
                    label="Fetch Timeout"
                    value={config.networkTimeoutSec}
                    min={15}
                    max={180}
                    step={5}
                    unit="s"
                    onChange={(val) => onUpdateConfig({ networkTimeoutSec: val })}
                    onInspect={() => onInspect({ type: 'rotary', key: 'networkTimeoutSec' })}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: PROJECT PARAMETERS */}
          <section
            ref={sec4Ref}
            onMouseEnter={() => setActivePhaseIndex(2)}
            className="flex flex-col gap-3.5"
          >
            <div className="flex items-baseline justify-between gap-4 border-b border-[#262B32] pb-2">
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
                  Section 03 · Project Parameters
                </h2>
                <p className="text-[12px] text-[#929BA5] mt-0.5">
                  Define workspace identity, local target path, and initialisation hooks.
                </p>
              </div>
              <span className="font-mono text-[11px] text-[#626D78]">
                Target: {config.directory}/{config.projectName || '…'}
              </span>
            </div>

            <div className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 hardware-bezel">
              {/* Project Name */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="project-name-input" className="text-[12px] font-medium text-[#F1F3F5]">
                    Project Name
                  </label>
                  <StatusIndicator
                    tone={isProjectNameValid ? 'installed' : 'failed'}
                    label={isProjectNameValid ? 'Valid identifier' : 'Invalid name'}
                    compact
                  />
                </div>
                <input
                  id="project-name-input"
                  type="text"
                  value={config.projectName}
                  onChange={(e) => onUpdateConfig({ projectName: e.target.value })}
                  placeholder="my-awesome-app"
                  className={`w-full bg-[#101214] border rounded-[4px] px-3 py-2 font-mono text-[13px] text-[#F1F3F5] outline-none transition-colors ${
                    isProjectNameValid
                      ? 'border-[#343B43] focus:border-[#C7A46A]'
                      : 'border-[#DF7777] focus:border-[#DF7777]'
                  }`}
                />
                <span className="text-[11px] text-[#626D78]">
                  Lowercase npm package slug used for folder and package.json name.
                </span>
              </div>

              {/* Installation Directory */}
              <div className="flex flex-col gap-1.5 relative">
                <div className="flex items-center justify-between">
                  <label htmlFor="project-dir-input" className="text-[12px] font-medium text-[#F1F3F5]">
                    Installation Directory
                  </label>
                  <span className="font-mono text-[11px] text-[#65B9A5]">Writable</span>
                </div>
                <div className="flex gap-2">
                  <input
                    id="project-dir-input"
                    type="text"
                    value={config.directory}
                    onChange={(e) => onUpdateConfig({ directory: e.target.value })}
                    className="flex-1 bg-[#101214] border border-[#343B43] focus:border-[#C7A46A] rounded-[4px] px-3 py-2 font-mono text-[13px] text-[#F1F3F5] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDirPicker((v) => !v)}
                    className="px-3 py-2 rounded-[4px] bg-[#252A30] border border-[#343B43] hover:border-[#C7A46A] text-[12px] font-medium text-[#F1F3F5] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-[#C7A46A]" />
                    <span>Select</span>
                  </button>
                </div>

                {showDirPicker && (
                  <div className="mt-1 p-2 rounded bg-[#171A1E] border border-[#3B434D] flex flex-wrap gap-1.5">
                    {DIRECTORY_PRESETS.map((dir) => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => {
                          onUpdateConfig({ directory: dir });
                          setShowDirPicker(false);
                        }}
                        className={`px-2.5 py-1 rounded-[3px] font-mono text-[11px] border cursor-pointer ${
                          config.directory === dir
                            ? 'bg-[#252A30] border-[#C7A46A] text-[#F1F3F5]'
                            : 'bg-[#101214] border-[#2A3038] text-[#929BA5] hover:text-[#F1F3F5]'
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[11px] text-[#626D78]">
                  Base workspace directory on local filesystem.
                </span>
              </div>

              {/* Toggles Row */}
              <MechanicalToggle
                checked={config.installDependencies}
                onChange={(val) => onUpdateConfig({ installDependencies: val })}
                label="Install Dependencies"
                description={`Execute "${config.packageManager} install" immediately after scaffolding.`}
              />

              <MechanicalToggle
                checked={config.initGit}
                onChange={(val) => onUpdateConfig({ initGit: val })}
                label="Initialise Git Repository"
                description="Run git init and stage baseline project files."
              />
            </div>

            <BulkFileRenamePanel
              config={config}
              onUpdateConfig={onUpdateConfig}
              onInspect={onInspect}
              settings={settings}
              providerStatuses={providerStatuses}
            />
          </section>

          {/* SECTION 5: COMMAND PREVIEW */}
          <section
            ref={sec5Ref}
            onMouseEnter={() => setActivePhaseIndex(3)}
            className="flex flex-col gap-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262B32] pb-2">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-[#C7A46A]" />
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
                  Generated Execution Plan
                </h2>
                <span className="font-mono text-[11px] text-[#626D78]">
                  {executionPlan.length} operations · ~{estimatedTotalSec}s est.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Preview Surface Tabs */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-[4px] bg-[#101214] border border-[#2C3239]">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('commands')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11.5px] font-medium cursor-pointer transition-colors ${
                      previewTab === 'commands'
                        ? 'bg-[#252A30] text-[#F1F3F5] border border-[#C7A46A]/50'
                        : 'text-[#929BA5] hover:text-[#F1F3F5] border border-transparent'
                    }`}
                  >
                    <Terminal className="w-3 h-3 text-[#C7A46A]" />
                    <span>Commands</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('configs')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11.5px] font-medium cursor-pointer transition-colors ${
                      previewTab === 'configs'
                        ? 'bg-[#252A30] text-[#F1F3F5] border border-[#C7A46A]/50'
                        : 'text-[#929BA5] hover:text-[#F1F3F5] border border-transparent'
                    }`}
                  >
                    <Code2 className="w-3 h-3 text-[#C7A46A]" />
                    <span>Config Files ({synthesizedConfigFiles.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('package-json')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11.5px] font-medium cursor-pointer transition-colors ${
                      previewTab === 'package-json'
                        ? 'bg-[#252A30] text-[#F1F3F5] border border-[#C7A46A]/50'
                        : 'text-[#929BA5] hover:text-[#F1F3F5] border border-transparent'
                    }`}
                  >
                    <FileCode2 className="w-3 h-3 text-[#65B9A5]" />
                    <span>package.json</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('file-tree')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11.5px] font-medium cursor-pointer transition-colors ${
                      previewTab === 'file-tree'
                        ? 'bg-[#252A30] text-[#F1F3F5] border border-[#C7A46A]/50'
                        : 'text-[#929BA5] hover:text-[#F1F3F5] border border-transparent'
                    }`}
                  >
                    <FolderTree className="w-3 h-3 text-[#77A9DC]" />
                    <span>File Tree ({scaffoldManifest.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('prompt')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11.5px] font-medium cursor-pointer transition-colors ${
                      previewTab === 'prompt'
                        ? 'bg-[#252A30] text-[#F1F3F5] border border-[#C7A46A]/50'
                        : 'text-[#929BA5] hover:text-[#F1F3F5] border border-transparent'
                    }`}
                  >
                    <FileText className="w-3 h-3 text-[#C7A46A]" />
                    <span>Create Prompt</span>
                  </button>
                </div>

                {previewTab === 'commands' && (
                  <button
                    type="button"
                    onClick={() => setShowSequence((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-[11.5px] font-medium cursor-pointer transition-colors ${
                      showSequence
                        ? 'bg-[#252A30] border-[#3E4752] text-[#F1F3F5]'
                        : 'bg-[#171A1E] border-[#2C323A] text-[#929BA5] hover:text-[#F1F3F5]'
                    }`}
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-[#C7A46A]" />
                    <span>Sequence</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowAdvancedInspect((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-[11.5px] font-medium cursor-pointer transition-colors ${
                    showAdvancedInspect
                      ? 'bg-[#252A30] border-[#3E4752] text-[#F1F3F5]'
                      : 'bg-[#171A1E] border-[#2C323A] text-[#929BA5] hover:text-[#F1F3F5]'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-[#77A9DC]" />
                  <span>Env & Flags</span>
                  {showAdvancedInspect ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setExpandedPreview((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border border-[#2C323A] bg-[#171A1E] hover:border-[#3E4752] text-[11.5px] font-medium text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer transition-colors"
                >
                  {expandedPreview ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                  <span>{expandedPreview ? 'Compact' : 'Expand'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadScript}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border border-[#2C323A] bg-[#171A1E] hover:border-[#3E4752] text-[11.5px] font-medium text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export {settings.shellTarget === 'powershell' ? '.ps1' : '.sh'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPreview}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] border border-[#C7A46A]/60 bg-[#252A30] hover:bg-[#2C3239] text-[11.5px] font-medium text-[#F1F3F5] cursor-pointer transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#70BD92]" />
                      <span className="text-[#70BD92]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#C7A46A]" />
                      <span>
                        {previewTab === 'package-json'
                          ? 'Copy JSON'
                          : previewTab === 'configs'
                          ? 'Copy File'
                          : previewTab === 'file-tree'
                          ? 'Copy Paths'
                          : previewTab === 'prompt'
                          ? 'Copy Prompt'
                          : 'Copy Script'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Compatibility warning inline callout if issues exist */}
            {issues.length > 0 && (
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-[4px] bg-[#1D2126] border border-[#E4AD63]/50 text-[12px]">
                <div className="flex items-center gap-2.5 text-[#E4AD63]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    {issues.length} configuration notice{issues.length > 1 ? 's' : ''} detected —{' '}
                    <span className="text-[#F1F3F5]">{issues[0].title}</span>
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#929BA5]">
                  Review in right inspector
                </span>
              </div>
            )}

            {/* Terminal Command / Manifest Surface */}
            <div className="bg-[#101214] border border-[#343B43] rounded-[5px] overflow-hidden hardware-recessed">
              <div className="px-4 py-2 bg-[#171A1E] border-b border-[#262B32] flex items-center justify-between text-[11px] font-mono text-[#626D78]">
                <span>
                  {config.directory}/{config.projectName || 'my-awesome-app'} · {config.runtime} ({config.runtimeVersion})
                </span>
                <span>
                  {previewTab === 'commands'
                    ? `shell: ${settings.shellTarget}`
                    : previewTab === 'configs'
                    ? `file: ${selectedConfigFile?.filePath ?? 'config'}`
                    : previewTab === 'package-json'
                    ? 'manifest: package.json'
                    : previewTab === 'prompt'
                    ? 'format: project-creation-prompt.md'
                    : `layout: ${config.directoryLayoutMode} · ${config.directoryNamingConvention}`}
                </span>
              </div>

              <div className={`p-4 font-mono text-[12.5px] leading-relaxed ${expandedPreview ? 'max-h-[520px]' : 'max-h-[320px]'} overflow-y-auto`}>
                {previewTab === 'configs' ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-1.5 pb-2.5 border-b border-[#1E2329]">
                      {synthesizedConfigFiles.map((file) => {
                        const active = (selectedConfigFile?.id ?? '') === file.id;
                        return (
                          <button
                            key={file.id}
                            type="button"
                            onClick={() => setActiveConfigId(file.id)}
                            className={`px-2.5 py-1 rounded-[3px] font-mono text-[11.5px] border cursor-pointer transition-colors ${
                              active
                                ? 'bg-[#252A30] border-[#C7A46A] text-[#F1F3F5]'
                                : 'bg-[#171A1E] border-[#2A3038] text-[#929BA5] hover:text-[#F1F3F5]'
                            }`}
                          >
                            {file.filePath}
                          </button>
                        );
                      })}
                    </div>
                    {selectedConfigFile && (
                      <>
                        <div className="flex items-center justify-between text-[11px] text-[#65B9A5]">
                          <span>{selectedConfigFile.summary}</span>
                          <span className="uppercase text-[#626D78]">{selectedConfigFile.language}</span>
                        </div>
                        <pre className="text-[#F1F3F5] whitespace-pre overflow-x-auto text-[12px] bg-[#14171B] border border-[#23282E] rounded-[4px] p-3">
                          {selectedConfigFile.content}
                        </pre>
                      </>
                    )}
                  </div>
                ) : previewTab === 'package-json' ? (
                  <pre className="text-[#F1F3F5] whitespace-pre overflow-x-auto text-[12px]">
                    {generatedPackageJson}
                  </pre>
                ) : previewTab === 'prompt' ? (
                  <pre className="text-[#F1F3F5] whitespace-pre-wrap text-[12px]">
                    {generatedProjectPrompt}
                  </pre>
                ) : previewTab === 'file-tree' ? (
                  <div className="flex flex-col gap-1.5 text-[12px]">
                    <div className="text-[#C7A46A] font-semibold pb-1 border-b border-[#1E2329]">
                      {config.projectName || 'my-awesome-app'}/
                    </div>
                    {scaffoldManifest.map((file) => {
                      const renamed = file.targetPath !== file.originalPath;
                      return (
                        <div
                          key={file.id}
                          className="grid grid-cols-[1fr_auto] items-center gap-3 py-1 border-b border-[#181C22] last:border-b-0"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[#626D78] select-none">├─</span>
                            <span className={renamed ? 'text-[#65B9A5]' : 'text-[#F1F3F5]'}>
                              {file.targetPath}
                            </span>
                            {renamed && (
                              <span className="text-[10.5px] text-[#626D78] truncate">
                                (from {file.originalPath})
                              </span>
                            )}
                          </div>
                          <span className="text-[10.5px] uppercase text-[#626D78]">{file.category}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : showSequence ? (
                  <div className="flex flex-col gap-2">
                    {executionPlan.map((step, i) => (
                      <div
                        key={step.id}
                        className="group grid grid-cols-[26px_86px_1fr_auto] items-start gap-3 py-1.5 border-b border-[#1A1E23] last:border-b-0"
                      >
                        <span className="text-[#626D78] text-[11px] tabular-nums pt-0.5">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[#C7A46A] text-[11px] uppercase tracking-wider pt-0.5">
                          {step.phase}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[#F1F3F5] break-all">
                            <span className="text-[#65B9A5] select-none mr-2">$</span>
                            {step.command}
                          </div>
                          {(expandedPreview || settings.verboseCommandPreview) && (
                            <div className="text-[11px] text-[#626D78] mt-0.5">
                              {step.description}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopySingleStep(step.id, step.command)}
                          aria-label={`Copy command for ${step.label}`}
                          className="opacity-70 group-hover:opacity-100 p-1 rounded-[3px] bg-[#171A1E] border border-[#2C323A] hover:border-[#C7A46A] text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer transition-all shrink-0"
                        >
                          {copiedStepId === step.id ? (
                            <Check className="w-3 h-3 text-[#70BD92]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="text-[#F1F3F5] whitespace-pre-wrap break-all">
                    {executionPlan.map((s) => `$ ${s.command}`).join('\n')}
                  </pre>
                )}
              </div>

              {showAdvancedInspect && (
                <div className="border-t border-[#262B32] bg-[#14171A] px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-[11.5px] font-mono">
                  <div>
                    <div className="text-[#626D78] mb-1">Environment Variables</div>
                    <div className="text-[#929BA5]">NODE_OPTIONS=--max-old-space-size={config.memoryLimitMb}</div>
                    <div className="text-[#929BA5]">PORT={config.devPort}</div>
                  </div>
                  <div>
                    <div className="text-[#626D78] mb-1">Toolchain Flags</div>
                    <div className="text-[#929BA5]">--strict={String(config.strictTypeScript)}</div>
                    <div className="text-[#929BA5]">--tailwind={config.styling === 'tailwind' ? config.tailwindVersion : 'disabled'}</div>
                  </div>
                  <div>
                    <div className="text-[#626D78] mb-1">Output Manifests</div>
                    <div className="text-[#929BA5]">package.json · {selectedPm.lockfile}</div>
                    <div className="text-[#929BA5]">
                      {config.language === 'typescript' ? 'tsconfig.json' : 'jsconfig.json'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 6: EXECUTION BAR */}
          <section className="bg-[#1D2126] border border-[#3B434D] rounded-[5px] p-5 flex flex-col gap-4 hardware-bezel">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-semibold text-[#F1F3F5]">
                    Ready to Initialise {config.projectName || 'Project'}
                  </span>
                  <StatusIndicator
                    tone={errorCount > 0 ? 'failed' : issues.length > 0 ? 'attention' : 'installed'}
                    label={
                      errorCount > 0
                        ? `${errorCount} blocking error`
                        : issues.length > 0
                        ? `${issues.length} advisory`
                        : 'Preflight passed'
                    }
                    compact
                  />
                </div>
                <div className="text-[12px] text-[#929BA5] font-mono">
                  {selectedFramework.name} ({config.language}) · {config.packageManager} ·{' '}
                  {executionPlan.length} planned operations · ~{estimatedTotalSec}s dry-run sequence
                </div>
                <div className="max-w-md pt-1">
                  <TechnicalMeter
                    label="Configuration Completeness"
                    value={executionPlan.length}
                    max={Math.max(executionPlan.length, 8)}
                    unit="ops"
                    tone={errorCount > 0 ? 'error' : 'brass'}
                    segments={16}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {savingRecipe ? (
                  <form onSubmit={handleCommitRecipe} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      placeholder="Recipe name..."
                      autoFocus
                      className="bg-[#101214] border border-[#C7A46A] rounded-[4px] px-3 py-2 text-[12.5px] text-[#F1F3F5] outline-none w-52"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-[4px] bg-[#252A30] border border-[#C7A46A] text-[12.5px] font-medium text-[#F1F3F5] cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setSavingRecipe(false)}
                      className="px-2.5 py-2 text-[12px] text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSavingRecipe(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-[#171A1E] border border-[#343B43] hover:border-[#49535E] text-[13px] font-medium text-[#F1F3F5] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <BookmarkPlus className="w-4 h-4 text-[#C7A46A]" />
                    <span>{recipeSavedToast ? 'Recipe Saved' : 'Save as Recipe'}</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={errorCount > 0}
                  onClick={handleRequestInitialise}
                  className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-[4px] bg-[#C7A46A] hover:bg-[#D2B27C] disabled:opacity-40 disabled:cursor-not-allowed text-[#101214] font-semibold text-[13px] tracking-[0.04em] uppercase transition-colors whitespace-nowrap cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Initialise Project</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Preflight Confirmation Modal (when confirmBeforeExecution is enabled in Settings) */}
      {confirmModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preflight-confirm-title"
        >
          <div className="w-full max-w-[480px] bg-[#1D2126] border border-[#3B434D] rounded-[6px] p-5 shadow-2xl flex flex-col gap-4 hardware-bezel">
            <div className="flex items-center justify-between border-b border-[#2A3038] pb-3">
              <div>
                <h3 id="preflight-confirm-title" className="text-[15px] font-semibold text-[#F1F3F5] uppercase tracking-wide">
                  Confirm Pipeline Execution
                </h3>
                <p className="text-[12px] text-[#929BA5] mt-0.5">
                  Preflight acknowledgement required by Workstation Settings.
                </p>
              </div>
              <StatusIndicator tone={issues.length > 0 ? 'attention' : 'installed'} compact />
            </div>

            <div className="bg-[#14171B] border border-[#2A3038] rounded-[4px] p-3.5 flex flex-col gap-2 text-[12px] font-mono">
              <div className="flex justify-between gap-2">
                <span className="text-[#626D78]">Target Path</span>
                <span className="text-[#F1F3F5] truncate">
                  {config.directory}/{config.projectName || 'my-awesome-app'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#626D78]">Stack</span>
                <span className="text-[#C7A46A]">
                  {selectedFramework.name} · {config.language} · {config.packageManager}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#626D78]">Shell / Runtime</span>
                <span className="text-[#65B9A5]">
                  {settings.shellTarget} · {config.runtime} ({config.runtimeVersion})
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#626D78]">Planned Operations</span>
                <span className="text-[#F1F3F5]">{executionPlan.length} dry-run steps</span>
              </div>
            </div>

            {issues.length > 0 && (
              <div className="text-[12px] text-[#E4AD63] bg-[#171A1E] border border-[#E4AD63]/40 rounded px-3 py-2">
                {issues.length} advisory notice{issues.length > 1 ? 's' : ''} active ({issues[0].title}).
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#2A3038]">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-[4px] bg-[#171A1E] border border-[#343B43] hover:border-[#49535E] text-[12.5px] font-medium text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmModalOpen(false);
                  onInitialiseProject();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#C7A46A] hover:bg-[#D2B27C] text-[#101214] text-[12.5px] font-semibold uppercase tracking-wide cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Dry-Run Pipeline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
