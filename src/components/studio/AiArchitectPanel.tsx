import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Cpu,
  Download,
  FileText,
  Layers,
  Play,
  RefreshCw,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import type {
  AiDiagnosticResponse,
  AiProviderStatus,
  AiStackRecommendation,
  CompatibilityIssue,
  ExecutionCommandStep,
  ProjectConfig,
  ScaffoldFileEntry,
  StudioPackage,
  StudioSettings,
} from '../../types/studio';
import { AI_PROVIDERS } from '../../data/aiProviders';
import {
  buildProjectCreationPrompt,
  CURATED_STACK_RECOMMENDATIONS,
  recommendStackOffline,
} from '../../data/stackAdvisor';
import {
  requestAiArchitect,
  requestAiAudit,
  requestAiProjectPrompt,
} from '../../services/aiClient';
import { StatusIndicator } from '../controls/StatusIndicator';

interface AiArchitectPanelProps {
  config: ProjectConfig;
  packages: StudioPackage[];
  manifest: ScaffoldFileEntry[];
  settings: StudioSettings;
  providerStatuses: AiProviderStatus[];
  issues: CompatibilityIssue[];
  executionPlan: ExecutionCommandStep[];
  onApplyRecommendation: (rec: AiStackRecommendation) => void;
  onOpenAiSettings: () => void;
}

const PRESET_PROMPTS = [
  'B2B SaaS dashboard with Next.js, TypeScript, Tailwind, Biome, and Playwright E2E',
  'Fast React + Vite SWC workstation with Tailwind v4, Vitest, Lucide icons, and kebab-case files',
  'Documentation & content portal using Astro, Bun, Prettier, and minimal runtime overhead',
];

export const AiArchitectPanel: React.FC<AiArchitectPanelProps> = ({
  config,
  packages,
  manifest,
  settings,
  providerStatuses,
  issues,
  executionPlan,
  onApplyRecommendation,
  onOpenAiSettings,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [workbenchTab, setWorkbenchTab] = useState<'recommend' | 'prompt'>('recommend');
  const [prompt, setPrompt] = useState('');
  const [loadingMode, setLoadingMode] = useState<'architect' | 'audit' | 'prompt' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [engineLabel, setEngineLabel] = useState<string>('Local Heuristic Engine');
  const [recommendation, setRecommendation] = useState<AiStackRecommendation | null>(
    () => CURATED_STACK_RECOMMENDATIONS[0].recommendation
  );
  const [auditResult, setAuditResult] = useState<AiDiagnosticResponse | null>(null);
  const [appliedNotice, setAppliedNotice] = useState(false);

  const [aiEnhancedPrompt, setAiEnhancedPrompt] = useState<string | null>(null);
  const [promptHighlights, setPromptHighlights] = useState<string[]>([]);
  const [promptSourceLabel, setPromptSourceLabel] = useState<string>('Deterministic Blueprint');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const activeProviderMeta =
    AI_PROVIDERS.find((p) => p.id === settings.aiProvider) ?? AI_PROVIDERS[0];
  const activeStatus = providerStatuses.find((s) => s.id === settings.aiProvider);
  const activeModel =
    (settings.aiCustomModel || '').trim() ||
    settings.aiModel ||
    activeProviderMeta.defaultModel;
  const isProviderReady = settings.aiEnabled && (activeStatus?.configured ?? false);

  const deterministicPrompt = useMemo(
    () =>
      buildProjectCreationPrompt({
        config,
        packages,
        executionPlan,
        manifest,
        goal: prompt,
      }),
    [config, packages, executionPlan, manifest, prompt]
  );

  const displayedPrompt = aiEnhancedPrompt ?? deterministicPrompt;

  const handleRecommend = async (overridePrompt?: string, forceOffline = false) => {
    const query = (overridePrompt ?? prompt).trim();
    if (!query) {
      setError('Describe your target application or pick a curated stack profile below.');
      return;
    }

    setError(null);
    setAuditResult(null);

    if (!forceOffline && isProviderReady) {
      setLoadingMode('architect');
      try {
        const res = await requestAiArchitect({
          provider: settings.aiProvider,
          model: activeModel,
          prompt: query,
          currentConfig: {
            framework: config.framework,
            language: config.language,
            packageManager: config.packageManager,
            runtime: config.runtime,
          },
        });
        setRecommendation(res.result);
        setEngineLabel(`${activeProviderMeta.shortName} · ${res.model}`);
        setLoadingMode(null);
        return;
      } catch (err) {
        const fallback = recommendStackOffline(query, config);
        setRecommendation(fallback);
        setEngineLabel('Local Heuristic Fallback');
        setError(
          `${err instanceof Error ? err.message : 'Provider unavailable'} — loaded local heuristic recommendation instead.`
        );
        setLoadingMode(null);
        return;
      }
    }

    const offlineRec = recommendStackOffline(query, config);
    setRecommendation(offlineRec);
    setEngineLabel('Local Heuristic Engine');
  };

  const handleAudit = async () => {
    setError(null);
    setRecommendation(null);

    if (isProviderReady) {
      setLoadingMode('audit');
      try {
        const res = await requestAiAudit({
          provider: settings.aiProvider,
          model: activeModel,
          mode: 'audit',
          context: {
            config,
            compatibilityIssues: issues,
            executionCommands: executionPlan.map((s) => s.command),
          },
        });
        setAuditResult(res.result);
        setEngineLabel(`${activeProviderMeta.shortName} · ${res.model}`);
        setLoadingMode(null);
        return;
      } catch (err) {
        setError(
          `${err instanceof Error ? err.message : 'AI audit unavailable'} — showing deterministic preflight audit.`
        );
        setLoadingMode(null);
      }
    }

    // Deterministic offline audit fallback
    setEngineLabel('Deterministic Preflight Auditor');
    const errorIssues = issues.filter((i) => i.severity === 'error');
    const warnIssues = issues.filter((i) => i.severity !== 'error');
    setAuditResult({
      assessment:
        errorIssues.length > 0
          ? `${errorIssues.length} blocking compatibility error(s) detected in the current stack.`
          : warnIssues.length > 0
          ? `Configuration is runnable with ${warnIssues.length} advisory observation(s).`
          : `All ${executionPlan.length} planned operations pass local compatibility and naming checks.`,
      status: errorIssues.length > 0 ? 'risk' : warnIssues.length > 0 ? 'advisory' : 'optimal',
      findings:
        issues.length > 0
          ? issues.map((iss) => ({
              title: iss.title,
              detail: iss.detail,
              action: iss.suggestedFix ?? 'Inspect right contextual panel to apply fix.',
            }))
          : [
              {
                title: 'Toolchain alignment verified',
                detail: `${config.framework} (${config.language}) paired cleanly with ${config.packageManager} on ${config.runtime}.`,
                action: 'Ready to export script or generate project creation prompt.',
              },
            ],
      suggestedCommands: executionPlan.slice(0, 3).map((s) => s.command),
    });
  };

  const handleGenerateEnhancedPrompt = async () => {
    if (!isProviderReady) {
      setAiEnhancedPrompt(null);
      setPromptHighlights([]);
      setPromptSourceLabel('Deterministic Blueprint (Offline)');
      return;
    }

    setLoadingMode('prompt');
    setError(null);
    try {
      const res = await requestAiProjectPrompt({
        provider: settings.aiProvider,
        model: activeModel,
        goal: prompt.trim() || `Production ${config.framework} application named ${config.projectName}`,
        workspace: {
          config,
          selectedPackages: packages
            .filter((p) => config.selectedPackageIds.includes(p.id))
            .map((p) => ({ id: p.id, name: p.npmName, version: p.version })),
          targetFiles: manifest.map((m) => m.targetPath),
          executionCommands: executionPlan.map((s) => s.command),
        },
      });
      setAiEnhancedPrompt(res.result.promptText);
      setPromptHighlights(res.result.highlights);
      setPromptSourceLabel(`${activeProviderMeta.shortName} · ${res.model}`);
    } catch (err) {
      setAiEnhancedPrompt(null);
      setPromptSourceLabel('Deterministic Blueprint (Fallback)');
      setError(
        `${err instanceof Error ? err.message : 'Prompt enhancement failed'} — generated local blueprint prompt instead.`
      );
    } finally {
      setLoadingMode(null);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(displayedPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleDownloadPrompt = () => {
    const slug = (config.projectName || 'project').replace(/[^a-z0-9._-]+/gi, '-');
    const blob = new Blob([displayedPrompt], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-create-prompt.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bg-[#1D2126] border border-[#343B43] rounded-[5px] overflow-hidden hardware-bezel">
      <div className="px-4 py-3 bg-[#171A1E] border-b border-[#2A3038] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Cpu className="w-4 h-4 text-[#C7A46A] shrink-0" />
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5] whitespace-nowrap">
            Stack Recommendations & Prompt Studio
          </span>
          <span className="font-mono text-[11px] text-[#626D78] truncate">
            {isProviderReady
              ? `${activeProviderMeta.shortName} / ${activeModel}`
              : 'Offline Engine Active'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 p-0.5 rounded-[4px] bg-[#101214] border border-[#2C323A]">
            <button
              type="button"
              onClick={() => setWorkbenchTab('recommend')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11.5px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
                workbenchTab === 'recommend'
                  ? 'bg-[#252A30] text-[#F1F3F5] border border-[#C7A46A]/55'
                  : 'text-[#929BA5] hover:text-[#F1F3F5] border border-transparent'
              }`}
            >
              <Layers className="w-3 h-3 text-[#C7A46A]" />
              <span>Stack Advisor</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkbenchTab('prompt')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11.5px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
                workbenchTab === 'prompt'
                  ? 'bg-[#252A30] text-[#F1F3F5] border border-[#65B9A5]/55'
                  : 'text-[#929BA5] hover:text-[#F1F3F5] border border-transparent'
              }`}
            >
              <FileText className="w-3 h-3 text-[#65B9A5]" />
              <span>Project Creation Prompt</span>
            </button>
          </div>

          <StatusIndicator
            tone={isProviderReady ? 'installed' : 'available'}
            label={isProviderReady ? 'Provider Connected' : 'Local Mode Ready'}
            compact
          />

          <button
            type="button"
            onClick={onOpenAiSettings}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#101214] border border-[#2C323A] hover:border-[#C7A46A] text-[11px] text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer transition-colors whitespace-nowrap"
          >
            <Settings className="w-3 h-3 text-[#C7A46A]" />
            <span>Providers</span>
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand Stack & Prompt Studio' : 'Collapse Stack & Prompt Studio'}
            className="p-1 rounded-[3px] bg-[#101214] border border-[#2C323A] text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer"
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!collapsed && workbenchTab === 'recommend' && (
        <div className="p-4 flex flex-col gap-3.5">
          {/* Curated Expert Profiles (1-click inspect, works offline & online) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#626D78]">
              <span>CURATED STACK RECOMMENDATIONS</span>
              <span>{engineLabel}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {CURATED_STACK_RECOMMENDATIONS.map((profile) => {
                const isSelected =
                  recommendation?.suggestedConfig.projectName ===
                    profile.recommendation.suggestedConfig.projectName &&
                  recommendation?.suggestedConfig.framework ===
                    profile.recommendation.suggestedConfig.framework;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => {
                      setRecommendation(profile.recommendation);
                      setAuditResult(null);
                      setError(null);
                      setEngineLabel(`Curated Profile · ${profile.title}`);
                    }}
                    className={`p-2.5 rounded-[4px] border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#252A30] border-[#C7A46A]/70'
                        : 'bg-[#14171B] border-[#2A3038] hover:border-[#434C57]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-semibold text-[#F1F3F5] truncate">
                        {profile.title}
                      </span>
                      <span className="font-mono text-[10.5px] text-[#C7A46A] shrink-0">
                        {profile.recommendation.suggestedConfig.framework}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#929BA5] mt-0.5 truncate">
                      {profile.audience}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loadingMode) {
                  e.preventDefault();
                  handleRecommend();
                }
              }}
              placeholder="Describe your app goal to match or architect a stack (works offline or with connected AI)..."
              aria-label="Describe project for stack recommendation"
              className="flex-1 bg-[#101214] border border-[#343B43] focus:border-[#C7A46A] rounded-[4px] px-3 py-2 text-[12.5px] text-[#F1F3F5] outline-none"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={loadingMode !== null}
                onClick={() => handleRecommend()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#C7A46A] hover:bg-[#D2B27C] disabled:opacity-50 text-[#101214] text-[12px] font-semibold cursor-pointer whitespace-nowrap transition-colors"
              >
                {loadingMode === 'architect' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>
                  {loadingMode === 'architect'
                    ? 'Designing...'
                    : isProviderReady
                    ? 'Recommend with AI'
                    : 'Recommend Stack'}
                </span>
              </button>

              {isProviderReady && (
                <button
                  type="button"
                  disabled={loadingMode !== null}
                  onClick={() => handleRecommend(undefined, true)}
                  className="px-3 py-2 rounded-[4px] bg-[#14171B] border border-[#343B43] hover:border-[#C7A46A] text-[#929BA5] hover:text-[#F1F3F5] text-[12px] font-medium cursor-pointer whitespace-nowrap transition-colors"
                  title="Run local deterministic matching without external API call"
                >
                  Local Match
                </button>
              )}

              <button
                type="button"
                disabled={loadingMode !== null}
                onClick={handleAudit}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] bg-[#252A30] border border-[#343B43] hover:border-[#65B9A5] disabled:opacity-50 text-[#F1F3F5] text-[12px] font-medium cursor-pointer whitespace-nowrap transition-colors"
              >
                {loadingMode === 'audit' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#65B9A5]" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#65B9A5]" />
                )}
                <span>{loadingMode === 'audit' ? 'Auditing...' : 'Audit Stack'}</span>
              </button>
            </div>
          </div>

          {/* Preset Prompts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#626D78] mr-1">Goal Ideas:</span>
            {PRESET_PROMPTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setPrompt(preset);
                  handleRecommend(preset);
                }}
                className="px-2.5 py-1 rounded-[3px] bg-[#14171B] border border-[#2A3038] hover:border-[#C7A46A]/60 text-[11px] text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer transition-colors text-left truncate max-w-[300px]"
                title={preset}
              >
                {preset}
              </button>
            ))}
          </div>

          {error && (
            <div className="px-3 py-2 rounded-[4px] bg-[#14171B] border border-[#E4AD63]/60 text-[12px] text-[#E4AD63] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {recommendation && (
            <div className="bg-[#14171B] border border-[#C7A46A]/50 rounded-[4px] p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
                    Recommended Stack · {engineLabel}
                  </div>
                  <p className="text-[12.5px] text-[#F1F3F5] mt-1">{recommendation.summary}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onApplyRecommendation(recommendation);
                      setAppliedNotice(true);
                      setTimeout(() => setAppliedNotice(false), 1800);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] bg-[#65B9A5] hover:bg-[#75C5B2] text-[#101214] text-[12px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{appliedNotice ? 'Applied to Studio' : 'Apply to Project Studio'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onApplyRecommendation(recommendation);
                      setAiEnhancedPrompt(null);
                      setPromptSourceLabel('Deterministic Blueprint');
                      setWorkbenchTab('prompt');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#252A30] border border-[#343B43] hover:border-[#C7A46A] text-[#F1F3F5] text-[12px] font-medium cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#C7A46A]" />
                    <span>Apply & Build Prompt</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-2.5 border-y border-[#23282E] font-mono text-[11.5px]">
                <div>
                  <span className="text-[#626D78] block text-[10.5px]">Framework</span>
                  <span className="text-[#F1F3F5]">
                    {recommendation.suggestedConfig.framework}
                    {recommendation.suggestedConfig.framework === 'vite' &&
                    recommendation.suggestedConfig.viteUiFramework
                      ? ` (${recommendation.suggestedConfig.viteUiFramework})`
                      : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[#626D78] block text-[10.5px]">Language / Compiler</span>
                  <span className="text-[#F1F3F5]">
                    {recommendation.suggestedConfig.language} /{' '}
                    {recommendation.suggestedConfig.compiler}
                  </span>
                </div>
                <div>
                  <span className="text-[#626D78] block text-[10.5px]">Styling / Testing</span>
                  <span className="text-[#C7A46A]">
                    {recommendation.suggestedConfig.styling} /{' '}
                    {recommendation.suggestedConfig.testing}
                  </span>
                </div>
                <div>
                  <span className="text-[#626D78] block text-[10.5px]">Runtime / PM</span>
                  <span className="text-[#65B9A5]">
                    {recommendation.suggestedConfig.runtime} /{' '}
                    {recommendation.suggestedConfig.packageManager}
                  </span>
                </div>
              </div>

              {recommendation.rationale.length > 0 && (
                <ul className="flex flex-col gap-1 text-[12px] text-[#929BA5]">
                  {recommendation.rationale.map((r, idx) => (
                    <li key={`${r}-${idx}`} className="flex items-start gap-2">
                      <span className="text-[#65B9A5] font-mono">·</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {auditResult && (
            <div className="bg-[#14171B] border border-[#343B43] rounded-[4px] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[12.5px] font-medium text-[#F1F3F5]">
                  {auditResult.assessment}
                </div>
                <StatusIndicator
                  tone={
                    auditResult.status === 'optimal'
                      ? 'installed'
                      : auditResult.status === 'risk'
                      ? 'failed'
                      : 'attention'
                  }
                  label={auditResult.status}
                  compact
                />
              </div>

              {auditResult.findings.length > 0 && (
                <div className="flex flex-col gap-2">
                  {auditResult.findings.map((f, idx) => (
                    <div
                      key={`${f.title}-${idx}`}
                      className="p-2.5 rounded bg-[#101214] border border-[#262B32] text-[12px]"
                    >
                      <div className="font-medium text-[#F1F3F5]">{f.title}</div>
                      <div className="text-[#929BA5] mt-0.5">{f.detail}</div>
                      {f.action && (
                        <div className="font-mono text-[11px] text-[#65B9A5] mt-1">
                          Action: {f.action}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {auditResult.suggestedCommands.length > 0 && (
                <div className="font-mono text-[11.5px] bg-[#101214] border border-[#262B32] rounded p-2.5 text-[#C7A46A]">
                  {auditResult.suggestedCommands.map((cmd, idx) => (
                    <div key={`${cmd}-${idx}`}>$ {cmd}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!collapsed && workbenchTab === 'prompt' && (
        <div className="p-4 flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[12px] font-medium text-[#F1F3F5]">
                Master Project Creation Prompt ({config.projectName || 'my-awesome-app'})
              </div>
              <div className="text-[11.5px] text-[#929BA5]">
                Synthesizes a complete build prompt reflecting your stack, packages, bulk file rename layout, and CLI sequence. Works offline or enhanced by your connected provider.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {aiEnhancedPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    setAiEnhancedPrompt(null);
                    setPromptHighlights([]);
                    setPromptSourceLabel('Deterministic Blueprint');
                  }}
                  className="px-2.5 py-1.5 rounded-[4px] bg-[#14171B] border border-[#343B43] hover:border-[#C7A46A] text-[11.5px] text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer"
                >
                  Use Local Blueprint
                </button>
              )}

              <button
                type="button"
                disabled={loadingMode !== null || !isProviderReady}
                onClick={handleGenerateEnhancedPrompt}
                title={
                  isProviderReady
                    ? `Refine prompt using ${activeProviderMeta.name}`
                    : `Configure ${activeProviderMeta.envVar} or enable AI in Settings to refine via LLM`
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#252A30] border border-[#C7A46A]/65 hover:border-[#C7A46A] disabled:opacity-40 text-[11.5px] font-medium text-[#F1F3F5] cursor-pointer whitespace-nowrap transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#C7A46A] ${
                    loadingMode === 'prompt' ? 'animate-spin' : ''
                  }`}
                />
                <span>
                  {loadingMode === 'prompt'
                    ? 'Synthesizing...'
                    : 'Enhance with Connected Provider'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPrompt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#14171B] border border-[#343B43] hover:border-[#49535E] text-[11.5px] text-[#F1F3F5] cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-[#929BA5]" />
                <span>Export .md</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#65B9A5] hover:bg-[#75C5B2] text-[#101214] text-[11.5px] font-semibold cursor-pointer whitespace-nowrap transition-colors"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied Prompt</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Optional project brief to embed into the creation prompt (e.g. Multi-tenant analytics dashboard with role permissions)..."
            aria-label="Optional project brief for creation prompt"
            className="w-full bg-[#101214] border border-[#343B43] focus:border-[#C7A46A] rounded-[4px] px-3 py-2 text-[12px] text-[#F1F3F5] outline-none"
          />

          {error && (
            <div className="px-3 py-2 rounded-[4px] bg-[#14171B] border border-[#E4AD63]/60 text-[12px] text-[#E4AD63] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {promptHighlights.length > 0 && (
            <div className="flex flex-wrap gap-3 text-[11.5px] font-mono text-[#65B9A5] bg-[#14171B] border border-[#2A3038] rounded-[4px] px-3 py-2">
              {promptHighlights.map((h) => (
                <span key={h}>· {h}</span>
              ))}
            </div>
          )}

          <div className="bg-[#101214] border border-[#2E343C] rounded-[4px] overflow-hidden hardware-recessed">
            <div className="px-3.5 py-2 bg-[#14171B] border-b border-[#262B32] flex items-center justify-between text-[11px] font-mono text-[#626D78]">
              <span>Source: {promptSourceLabel}</span>
              <span>{displayedPrompt.split('\n').length} lines</span>
            </div>
            <pre className="p-4 font-mono text-[11.5px] leading-relaxed text-[#F1F3F5] whitespace-pre-wrap max-h-[300px] overflow-y-auto">
              {displayedPrompt}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
};
