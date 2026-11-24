import React, { useState } from 'react';
import {
  Blocks,
  BookMarked,
  Check,
  Cpu,
  ExternalLink,
  History,
  Play,
  RefreshCw,
  Settings,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import type {
  AiProviderId,
  AiProviderStatus,
  HistoryRecord,
  PackageManagerId,
  ProjectConfig,
  RuntimeId,
  SavedRecipe,
  StudioPackage,
  StudioSettings,
  SystemProbeResult,
} from '../../types/studio';
import { AI_PROVIDERS } from '../../data/aiProviders';
import { fetchOpenRouterModels, testAiProvider } from '../../services/aiClient';
import { StatusIndicator } from '../controls/StatusIndicator';
import { MechanicalToggle } from '../controls/MechanicalToggle';
import { SegmentedSelector } from '../controls/SegmentedSelector';

/* 1. INTEGRATION REGISTRY */
export const IntegrationRegistryScreen: React.FC<{
  packages: StudioPackage[];
  selectedIds: string[];
  onToggleIntegration: (id: string) => void;
}> = ({ packages, selectedIds, onToggleIntegration }) => {
  const integrations = packages.filter((p) => p.hasFullIntegration);
  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B]">
        <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
          Integration Registry
        </h1>
        <p className="text-[13px] text-[#929BA5] mt-0.5">
          Automated configuration recipes that scaffold config files and Vite/framework plugins.
        </p>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[1060px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((item) => {
            const active = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-4 flex flex-col justify-between gap-4 hardware-bezel"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Blocks className="w-4 h-4 text-[#C7A46A]" />
                      <h3 className="text-[15px] font-semibold text-[#F1F3F5]">{item.name}</h3>
                    </div>
                    <StatusIndicator
                      tone={active ? 'installed' : 'available'}
                      label={active ? 'Active in Studio' : 'Available'}
                      compact
                    />
                  </div>
                  <p className="text-[12.5px] text-[#929BA5] mt-2">{item.configSummary}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-[#626D78]">
                      {item.integrationFiles.map((f) => (
                        <span key={f} className="px-2 py-0.5 rounded bg-[#101214] border border-[#262B32]">
                          {f}
                        </span>
                      ))}
                    </div>
                    <a
                      href={item.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-[#77A9DC] hover:text-[#F1F3F5] transition-colors shrink-0"
                    >
                      <span>Docs</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleIntegration(item.id)}
                  className={`px-3 py-2 rounded-[4px] border text-[12px] font-medium cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#252A30] border-[#65B9A5] text-[#65B9A5]'
                      : 'bg-[#171A1E] border-[#343B43] hover:border-[#C7A46A] text-[#F1F3F5]'
                  }`}
                >
                  {active ? 'Enabled in Active Project' : 'Enable Integration'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* 2. PROJECT RECIPES */
export const ProjectRecipesScreen: React.FC<{
  recipes: SavedRecipe[];
  onLoadRecipe: (recipe: SavedRecipe) => void;
  onDeleteRecipe: (id: string) => void;
}> = ({ recipes, onLoadRecipe, onDeleteRecipe }) => (
  <div className="flex flex-col h-full">
    <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B]">
      <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
        Project Recipes
      </h1>
      <p className="text-[13px] text-[#929BA5] mt-0.5">
        Saved environment presets ready to load into Project Studio.
      </p>
    </header>
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-[1060px] mx-auto flex flex-col gap-3">
        {recipes.length === 0 ? (
          <div className="p-8 text-center bg-[#171A1E] border border-[#2D333B] rounded-[5px] text-[#929BA5]">
            No saved recipes yet. Use “Save as Recipe” in Project Studio to store a configuration.
          </div>
        ) : (
          recipes.map((rec) => (
            <div
              key={rec.id}
              className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-4 flex flex-wrap items-center justify-between gap-4 hardware-bezel"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <BookMarked className="w-4 h-4 text-[#C7A46A]" />
                  <h3 className="text-[15px] font-semibold text-[#F1F3F5]">{rec.name}</h3>
                  <span className="font-mono text-[11px] text-[#626D78]">{rec.createdAt}</span>
                </div>
                <p className="text-[12.5px] text-[#929BA5] mt-1">{rec.description}</p>
                <div className="font-mono text-[11.5px] text-[#626D78] mt-1.5">
                  {rec.config.framework} · {rec.config.language} · {rec.config.packageManager} ·{' '}
                  {rec.stepCount} operations
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onLoadRecipe(rec)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#C7A46A] hover:bg-[#D2B27C] text-[#101214] text-[12px] font-semibold cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Load Recipe</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRecipe(rec.id)}
                  aria-label={`Delete ${rec.name}`}
                  className="p-2 rounded-[4px] bg-[#171A1E] border border-[#343B43] hover:border-[#DF7777] text-[#929BA5] hover:text-[#DF7777] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

/* 3. INSTALLATION HISTORY */
export const InstallationHistoryScreen: React.FC<{
  history: HistoryRecord[];
  onClearHistory: () => void;
}> = ({ history, onClearHistory }) => (
  <div className="flex flex-col h-full">
    <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B] flex items-center justify-between gap-4">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
          Installation History
        </h1>
        <p className="text-[13px] text-[#929BA5] mt-0.5">
          Audit log of scaffold dry-runs and executed command sequences.
        </p>
      </div>
      {history.length > 0 && (
        <button
          type="button"
          onClick={onClearHistory}
          className="px-3 py-1.5 rounded-[4px] bg-[#171A1E] border border-[#343B43] hover:border-[#DF7777] text-[12px] text-[#929BA5] hover:text-[#DF7777] cursor-pointer"
        >
          Clear Log
        </button>
      )}
    </header>
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-[1060px] mx-auto bg-[#171A1E] border border-[#2D333B] rounded-[5px] overflow-hidden">
        {history.length === 0 ? (
          <div className="p-8 text-center text-[#929BA5] text-[13px]">
            <History className="w-6 h-6 mx-auto mb-2 text-[#626D78]" />
            No installation runs recorded yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-[#2A3038] bg-[#14171B] text-[11px] font-mono uppercase text-[#626D78]">
                <th className="py-2.5 px-4 font-medium">Timestamp</th>
                <th className="py-2.5 px-4 font-medium">Project</th>
                <th className="py-2.5 px-4 font-medium">Target Directory</th>
                <th className="py-2.5 px-4 font-medium">Stack</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium text-right">Duration</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b border-[#23282E] last:border-b-0 hover:bg-[#1D2126]">
                  <td className="py-2.5 px-4 font-mono text-[11.5px] text-[#626D78]">{item.timestamp}</td>
                  <td className="py-2.5 px-4 font-mono text-[#F1F3F5]">{item.projectName}</td>
                  <td className="py-2.5 px-4 font-mono text-[11.5px] text-[#929BA5]">{item.directory}</td>
                  <td className="py-2.5 px-4 text-[#929BA5]">
                    {item.framework} · {item.packageManager}
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusIndicator
                      tone={
                        item.status === 'completed'
                          ? 'installed'
                          : item.status === 'failed'
                          ? 'failed'
                          : 'attention'
                      }
                      label={item.status}
                      compact
                    />
                  </td>
                  <td className="py-2.5 px-4 font-mono text-right text-[#929BA5] tabular-nums">
                    {item.durationSec.toFixed(1)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </div>
);

/* 4. DIAGNOSTICS */
export const DiagnosticsScreen: React.FC<{
  systemProbe: SystemProbeResult | null;
  config: ProjectConfig;
  onProbeSystem: () => Promise<void>;
}> = ({ systemProbe, config, onProbeSystem }) => {
  const [probing, setProbing] = useState(false);

  const handleRunSweep = async () => {
    setProbing(true);
    try {
      await onProbeSystem();
    } finally {
      setProbing(false);
    }
  };

  const nodeBin = systemProbe?.runtimes.find((r) => r.id === 'node');
  const activePmBin = systemProbe?.packageManagers.find((pm) => pm.id === config.packageManager);
  const denoBin = systemProbe?.runtimes.find((r) => r.id === 'deno');
  const bunBin = systemProbe?.runtimes.find((r) => r.id === 'bun');

  const checks = [
    {
      name: 'Node.js Runtime Binary',
      detail: nodeBin?.installed
        ? `${nodeBin.binaryPath ?? 'PATH'} (v${nodeBin.version ?? 'detected'})`
        : 'node binary not found on server PATH',
      status: nodeBin?.installed ? ('installed' as const) : ('failed' as const),
      label: nodeBin?.installed ? 'Nominal' : 'Missing',
    },
    {
      name: `Selected Package Manager (${config.packageManager})`,
      detail: activePmBin?.installed
        ? `${activePmBin.binaryPath ?? 'PATH'} (v${activePmBin.version ?? 'detected'})`
        : `${config.packageManager} not detected on server PATH — install locally before executing exported script`,
      status: activePmBin?.installed ? ('installed' as const) : ('attention' as const),
      label: activePmBin?.installed ? 'Nominal' : 'Not on PATH',
    },
    {
      name: 'Git CLI & User Identity',
      detail: systemProbe?.git.installed
        ? `${systemProbe.git.version}${systemProbe.git.userName ? ` · user.name=${systemProbe.git.userName}` : ' · user.name unset'}`
        : 'git binary not detected on server PATH',
      status: systemProbe?.git.installed ? ('installed' as const) : ('attention' as const),
      label: systemProbe?.git.installed ? 'Nominal' : 'Missing',
    },
    {
      name: `Configured Dev Port :${systemProbe?.ports.dev.port ?? config.devPort}`,
      detail: systemProbe?.ports.dev.note ?? `Pending live TCP bind check on :${config.devPort}`,
      status: systemProbe?.ports.dev.available ? ('installed' as const) : ('attention' as const),
      label: systemProbe?.ports.dev.available ? 'Available' : 'In Use',
    },
    {
      name: `Configured Preview Port :${systemProbe?.ports.preview.port ?? config.previewPort}`,
      detail: systemProbe?.ports.preview.note ?? `Pending live TCP bind check on :${config.previewPort}`,
      status: systemProbe?.ports.preview.available ? ('installed' as const) : ('attention' as const),
      label: systemProbe?.ports.preview.available ? 'Available' : 'In Use',
    },
    {
      name: 'Secondary Runtimes (Bun / Deno)',
      detail: `Bun: ${bunBin?.installed ? `v${bunBin.version}` : 'not installed'} · Deno: ${
        denoBin?.installed ? `v${denoBin.version}` : 'not installed'
      }`,
      status: bunBin?.installed || denoBin?.installed ? ('installed' as const) : ('available' as const),
      label: bunBin?.installed || denoBin?.installed ? 'Detected' : 'Optional',
    },
  ];

  const checkedAt = systemProbe
    ? `${new Date(systemProbe.probedAt).toLocaleTimeString([], { hour12: false })} · ${systemProbe.osLabel} (${systemProbe.arch})`
    : 'Awaiting initial system probe…';

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B] flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
            Environment Diagnostics
          </h1>
          <p className="text-[13px] text-[#929BA5] mt-0.5">
            Live host CLI binary resolution, Git checks, PATH summary, and TCP port binding tests.
          </p>
        </div>
        <button
          type="button"
          disabled={probing}
          onClick={handleRunSweep}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[4px] bg-[#252A30] border border-[#343B43] hover:border-[#C7A46A] disabled:opacity-50 text-[12px] font-medium text-[#F1F3F5] cursor-pointer"
        >
          <Stethoscope className={`w-4 h-4 text-[#C7A46A] ${probing ? 'animate-pulse' : ''}`} />
          <span>{probing ? 'Probing Host…' : 'Run Preflight Check'}</span>
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[900px] mx-auto flex flex-col gap-4">
          <div className="text-[11.5px] font-mono text-[#626D78] flex flex-wrap items-center justify-between gap-2">
            <span>Last diagnostic sweep: {checkedAt}</span>
            {systemProbe && <span>Host: {systemProbe.hostname}</span>}
          </div>
          <div className="bg-[#1D2126] border border-[#343B43] rounded-[5px] divide-y divide-[#2A3038] hardware-bezel">
            {checks.map((c) => (
              <div key={c.name} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[13.5px] font-medium text-[#F1F3F5]">{c.name}</div>
                  <div className="font-mono text-[11.5px] text-[#929BA5] mt-0.5">{c.detail}</div>
                </div>
                <StatusIndicator tone={c.status} label={c.label} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* 5. SETTINGS */
export const SettingsScreen: React.FC<{
  settings: StudioSettings;
  providerStatuses: AiProviderStatus[];
  onRefreshAiStatus: () => void;
  onUpdateSettings: (patch: Partial<StudioSettings>) => void;
  onApplyDefaultsToStudio?: () => void;
}> = ({
  settings,
  providerStatuses,
  onRefreshAiStatus,
  onUpdateSettings,
  onApplyDefaultsToStudio,
}) => {
  const [saved, setSaved] = useState(false);
  const [appliedToStudio, setAppliedToStudio] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    latencyMs: number;
  } | null>(null);
  const [openRouterLiveModels, setOpenRouterLiveModels] = useState<
    Array<{ id: string; name: string; context_length?: number }>
  >([]);
  const [loadingOpenRouterModels, setLoadingOpenRouterModels] = useState(false);
  const [openRouterModelError, setOpenRouterModelError] = useState<string | null>(null);

  const selectedProvider =
    AI_PROVIDERS.find((p) => p.id === settings.aiProvider) ?? AI_PROVIDERS[0];
  const selectedProviderStatus = providerStatuses.find((s) => s.id === settings.aiProvider);
  const effectiveModel =
    (settings.aiCustomModel || '').trim() ||
    settings.aiModel ||
    selectedProvider.defaultModel;

  const handleSelectProvider = (providerId: AiProviderId) => {
    const meta = AI_PROVIDERS.find((p) => p.id === providerId) ?? AI_PROVIDERS[0];
    setTestResult(null);
    onUpdateSettings({
      aiProvider: providerId,
      aiModel: meta.defaultModel,
      aiCustomModel: '',
    });
  };

  const handleTestProvider = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testAiProvider(settings.aiProvider, effectiveModel);
      if (res.ok) {
        setTestResult({
          ok: true,
          latencyMs: res.latencyMs,
          message: `Connected (${res.model ?? effectiveModel}) · Reply: "${res.reply}"`,
        });
      } else {
        setTestResult({
          ok: false,
          latencyMs: res.latencyMs,
          message: res.error || 'Connection test failed.',
        });
      }
      onRefreshAiStatus();
    } catch (err) {
      setTestResult({
        ok: false,
        latencyMs: 0,
        message: err instanceof Error ? err.message : 'Unable to reach server proxy.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleFetchOpenRouterCatalog = async () => {
    setLoadingOpenRouterModels(true);
    setOpenRouterModelError(null);
    try {
      const list = await fetchOpenRouterModels();
      setOpenRouterLiveModels(list);
    } catch (err) {
      setOpenRouterModelError(
        err instanceof Error ? err.message : 'Could not load OpenRouter catalog.'
      );
    } finally {
      setLoadingOpenRouterModels(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B] flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
            Workstation Settings
          </h1>
          <p className="text-[13px] text-[#929BA5] mt-0.5">
            Default workspace paths, preferred CLI tools, shell syntax, and optional AI providers.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[12px] text-[#70BD92]">
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Preferences Saved</span>
            </>
          ) : (
            <span className="font-mono text-[#626D78] flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Auto-persisted locally
            </span>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[920px] mx-auto flex flex-col gap-6">
          {/* Core Workstation Calibration */}
          <section className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 flex flex-col gap-5 hardware-bezel">
            <div>
              <label className="block text-[12px] font-medium text-[#F1F3F5] mb-1.5">
                Default Installation Directory
              </label>
              <input
                type="text"
                value={settings.defaultDirectory}
                onChange={(e) => {
                  onUpdateSettings({ defaultDirectory: e.target.value });
                  setSaved(true);
                  setTimeout(() => setSaved(false), 1200);
                }}
                className="w-full bg-[#101214] border border-[#343B43] focus:border-[#C7A46A] rounded-[4px] px-3 py-2 font-mono text-[13px] text-[#F1F3F5] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-[12px] font-medium text-[#F1F3F5] mb-1.5">
                  Preferred Package Manager
                </span>
                <SegmentedSelector<PackageManagerId>
                  ariaLabel="Preferred Package Manager"
                  size="sm"
                  fullWidth
                  value={settings.preferredPackageManager}
                  onChange={(v) => onUpdateSettings({ preferredPackageManager: v })}
                  options={[
                    { value: 'pnpm', label: 'pnpm' },
                    { value: 'npm', label: 'npm' },
                    { value: 'yarn', label: 'Yarn' },
                    { value: 'bun', label: 'Bun' },
                  ]}
                />
              </div>

              <div>
                <span className="block text-[12px] font-medium text-[#F1F3F5] mb-1.5">
                  Preferred Runtime
                </span>
                <SegmentedSelector<RuntimeId>
                  ariaLabel="Preferred Runtime"
                  size="sm"
                  fullWidth
                  value={settings.preferredRuntime}
                  onChange={(v) => onUpdateSettings({ preferredRuntime: v })}
                  options={[
                    { value: 'node', label: 'Node.js' },
                    { value: 'deno', label: 'Deno' },
                    { value: 'bun', label: 'Bun' },
                  ]}
                />
              </div>
            </div>

            <div>
              <span className="block text-[12px] font-medium text-[#F1F3F5] mb-1.5">
                Target Shell Syntax
              </span>
              <SegmentedSelector<StudioSettings['shellTarget']>
                ariaLabel="Target Shell Syntax"
                size="sm"
                value={settings.shellTarget}
                onChange={(v) => onUpdateSettings({ shellTarget: v })}
                options={[
                  { value: 'zsh', label: 'zsh' },
                  { value: 'bash', label: 'bash' },
                  { value: 'powershell', label: 'PowerShell' },
                ]}
              />
            </div>

            <MechanicalToggle
              checked={settings.verboseCommandPreview}
              onChange={(v) => onUpdateSettings({ verboseCommandPreview: v })}
              label="Verbose Command Explanations"
              description="Include inline descriptions for each step in the execution sequence."
            />

            <MechanicalToggle
              checked={settings.confirmBeforeExecution}
              onChange={(v) => onUpdateSettings({ confirmBeforeExecution: v })}
              label="Confirm Before Running Pipeline"
              description="Require explicit preflight acknowledgement before starting Operations Centre."
            />

            {onApplyDefaultsToStudio && (
              <div className="pt-3 border-t border-[#2A3038] flex flex-wrap items-center justify-between gap-3">
                <div className="text-[12px] text-[#929BA5]">
                  Sync default directory, package manager, and runtime to the active Project Studio workspace.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onApplyDefaultsToStudio();
                    setAppliedToStudio(true);
                    setTimeout(() => setAppliedToStudio(false), 1800);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#252A30] border border-[#C7A46A]/70 hover:bg-[#2C323A] text-[12px] font-medium text-[#F1F3F5] cursor-pointer transition-colors"
                >
                  {appliedToStudio ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#70BD92]" />
                      <span className="text-[#70BD92]">Applied to Studio</span>
                    </>
                  ) : (
                    <span>Apply Defaults to Active Project</span>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* Optional AI Providers & Model Routing */}
          <section className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 flex flex-col gap-5 hardware-bezel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A3038] pb-3">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-[#C7A46A]" />
                <div>
                  <h2 className="text-[13.5px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
                    AI Provider & Model Routing (Optional)
                  </h2>
                  <p className="text-[12px] text-[#929BA5] mt-0.5">
                    Route optional Stack Architect, Rename Advisor, and Diagnostics via OpenRouter, Gemini, OpenAI, Anthropic, Groq, Mistral, or Ollama.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onRefreshAiStatus}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] bg-[#171A1E] border border-[#343B43] hover:border-[#C7A46A] text-[11.5px] text-[#F1F3F5] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#C7A46A]" />
                <span>Refresh Status</span>
              </button>
            </div>

            <MechanicalToggle
              checked={settings.aiEnabled}
              onChange={(v) => onUpdateSettings({ aiEnabled: v })}
              label="Enable AI Workstation Features"
              description="All scaffolding, bulk renaming, and CLI export features continue working normally when disabled."
            />

            {/* Provider Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {AI_PROVIDERS.map((prov) => {
                const active = settings.aiProvider === prov.id;
                const status = providerStatuses.find((s) => s.id === prov.id);
                const ready = status?.configured ?? false;

                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleSelectProvider(prov.id)}
                    className={`p-3 rounded-[4px] border text-left transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                      active
                        ? 'bg-[#252A30] border-[#C7A46A]'
                        : 'bg-[#171A1E] border-[#2C323A] hover:border-[#434C57]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-[#F1F3F5]">
                        {prov.shortName}
                      </span>
                      <StatusIndicator
                        tone={ready ? 'installed' : 'available'}
                        label={ready ? 'Ready' : 'Env Unset'}
                        compact
                      />
                    </div>
                    <div className="font-mono text-[10.5px] text-[#626D78] truncate">
                      {prov.envVar}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Provider Details & Model Picker */}
            <div className="bg-[#14171B] border border-[#2C323A] rounded-[4px] p-4 flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-[#F1F3F5]">
                      {selectedProvider.name}
                    </h3>
                    <a
                      href={selectedProvider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-[#77A9DC] hover:text-[#F1F3F5]"
                    >
                      <span>API Docs</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[12px] text-[#929BA5] mt-1">{selectedProvider.description}</p>
                </div>

                <StatusIndicator
                  tone={selectedProviderStatus?.configured ? 'installed' : 'attention'}
                  label={
                    selectedProviderStatus?.configured
                      ? `Server secret ${selectedProvider.envVar} active`
                      : `Set ${selectedProvider.envVar} in Secrets`
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="ai-model-select"
                      className="text-[12px] font-medium text-[#F1F3F5]"
                    >
                      Curated Model Preset
                    </label>
                    {selectedProvider.id === 'openrouter' && (
                      <button
                        type="button"
                        disabled={loadingOpenRouterModels}
                        onClick={handleFetchOpenRouterCatalog}
                        className="font-mono text-[11px] text-[#77A9DC] hover:text-[#F1F3F5] cursor-pointer"
                      >
                        {loadingOpenRouterModels
                          ? 'Loading catalog...'
                          : openRouterLiveModels.length > 0
                          ? `Loaded ${openRouterLiveModels.length} live models`
                          : 'Fetch Live OpenRouter Models'}
                      </button>
                    )}
                  </div>
                  <select
                    id="ai-model-select"
                    value={settings.aiModel}
                    onChange={(e) =>
                      onUpdateSettings({ aiModel: e.target.value, aiCustomModel: '' })
                    }
                    className="w-full bg-[#101214] border border-[#343B43] focus:border-[#C7A46A] rounded-[4px] px-3 py-2 font-mono text-[12.5px] text-[#F1F3F5] outline-none cursor-pointer"
                  >
                    {selectedProvider.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} ({m.contextWindow})
                      </option>
                    ))}
                    {selectedProvider.id === 'openrouter' &&
                      openRouterLiveModels
                        .filter((lm) => !selectedProvider.models.some((pm) => pm.id === lm.id))
                        .map((lm) => (
                          <option key={lm.id} value={lm.id}>
                            {lm.id}
                            {lm.context_length ? ` (${Math.round(lm.context_length / 1000)}K)` : ''}
                          </option>
                        ))}
                  </select>
                  {openRouterModelError && (
                    <div className="font-mono text-[11px] text-[#E4AD63] mt-1">
                      {openRouterModelError}
                    </div>
                  )}
                </div>

                {selectedProvider.supportsCustomModel ? (
                  <div>
                    <label
                      htmlFor="ai-custom-model"
                      className="block text-[12px] font-medium text-[#F1F3F5] mb-1.5"
                    >
                      Custom Model Slug (Optional Override)
                    </label>
                    <input
                      id="ai-custom-model"
                      type="text"
                      value={settings.aiCustomModel}
                      onChange={(e) => onUpdateSettings({ aiCustomModel: e.target.value })}
                      placeholder={
                        selectedProvider.id === 'openrouter'
                          ? 'e.g. openrouter/auto or anthropic/claude-sonnet-4'
                          : `e.g. ${selectedProvider.defaultModel}`
                      }
                      className="w-full bg-[#101214] border border-[#343B43] focus:border-[#C7A46A] rounded-[4px] px-3 py-2 font-mono text-[12.5px] text-[#F1F3F5] outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col justify-end text-[11.5px] text-[#929BA5]">
                    <span>
                      Server calls use the official <span className="font-mono text-[#F1F3F5]">@google/genai</span> SDK with schema-validated JSON output.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#262B32]">
                <div className="text-[11.5px] font-mono text-[#626D78]">
                  Active route: /api/ai/assist → {selectedProvider.id} ({effectiveModel})
                </div>
                <button
                  type="button"
                  disabled={testingConnection}
                  onClick={handleTestProvider}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#C7A46A] hover:bg-[#D2B27C] disabled:opacity-50 text-[#101214] text-[12px] font-semibold cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>{testingConnection ? 'Probing Provider...' : 'Test Provider Connection'}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`px-3.5 py-2.5 rounded-[4px] border font-mono text-[11.5px] flex items-center justify-between gap-3 ${
                    testResult.ok
                      ? 'bg-[#101214] border-[#70BD92]/60 text-[#70BD92]'
                      : 'bg-[#101214] border-[#DF7777]/60 text-[#DF7777]'
                  }`}
                >
                  <span className="break-all">{testResult.message}</span>
                  {testResult.latencyMs > 0 && (
                    <span className="shrink-0 text-[#929BA5]">{testResult.latencyMs}ms</span>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
