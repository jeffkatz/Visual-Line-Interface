import React, { useEffect, useState } from 'react';
import {
  Check,
  Cpu,
  Database,
  ExternalLink,
  History,
  Layers,
  Play,
  Palette,
  Square,
  RefreshCw,
  Settings,
  Stethoscope,
} from 'lucide-react';
import type {
  AiProviderId,
  AiProviderStatus,
  HistoryRecord,
  PackageManagerId,
  ProjectConfig,
  RuntimeId,
  StackPresetProfile,
  StudioPackage,
  StudioSettings,
  SystemProbeResult,
} from '../../types/studio';
import type { EditorId, ProjectRunSession, ProjectRunTarget } from '../../types/projectActions';
import { AI_PROVIDERS } from '../../data/aiProviders';
import { DATABASE_OPTIONS } from '../../data/databases';
import { CURATED_STACK_RECOMMENDATIONS } from '../../data/stackAdvisor';
import { fetchOpenRouterModels, testAiProvider } from '../../services/aiClient';
import {
  fetchProjectEditors,
  fetchProjectRuns,
  openProjectInEditor,
  startProjectRun,
  stopProjectRun,
} from '../../services/projectActionsClient';
import { StatusIndicator } from '../controls/StatusIndicator';
import { MechanicalToggle } from '../controls/MechanicalToggle';
import { SegmentedSelector } from '../controls/SegmentedSelector';

/* TECH STACK */
export const TechStackScreen: React.FC<{
  onApplyStack: (profile: StackPresetProfile) => void;
}> = ({ onApplyStack }) => (
  <div className="flex flex-col h-full">
    <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B]">
      <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
        Tech Stack
      </h1>
      <p className="text-[13px] text-[#929BA5] mt-0.5">
        Explore practical combinations of the frontend, API, and database technologies this builder can create.
      </p>
    </header>
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto grid max-w-[1060px] gap-4 md:grid-cols-2">
        {CURATED_STACK_RECOMMENDATIONS.map((profile) => (
            <div
              key={profile.id}
              className="flex flex-col gap-4 rounded-[5px] border border-[#343B43] bg-[#1D2126] p-5 hardware-bezel"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4 text-[#C7A46A]" />
                  <h2 className="text-[15px] font-semibold text-[#F1F3F5]">{profile.title}</h2>
                </div>
                <p className="mt-1 text-[11px] font-mono text-[#C7A46A]">{profile.audience}</p>
                <p className="mt-3 text-[12px] leading-relaxed text-[#929BA5]">
                  {profile.recommendation.summary}
                </p>
                {profile.databases && profile.databases.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-[#929BA5]">
                    <Database className="h-3.5 w-3.5 text-[#65B9A5]" />
                    {profile.databases.map((database) => DATABASE_OPTIONS.find((option) => option.id === database)?.name).filter(Boolean).join(', ')}
                  </div>
                )}
                <ul className="mt-3 space-y-1.5 text-[11px] text-[#929BA5]">
                  {profile.recommendation.rationale.slice(0, 2).map((reason) => (
                    <li key={reason} className="flex gap-2">
                      <span className="text-[#65B9A5]">•</span><span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onApplyStack(profile)}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#C7A46A] px-3.5 py-2 text-[12px] font-semibold text-[#101214] hover:bg-[#D2B27C]"
              >
                Use this stack
              </button>
            </div>
          ))}
      </div>
    </div>
  </div>
);

/* 3. INSTALLATION HISTORY */
export const InstallationHistoryScreen: React.FC<{
  history: HistoryRecord[];
  onClearHistory: () => void;
}> = ({ history, onClearHistory }) => {
  const [runs, setRuns] = useState<ProjectRunSession[]>([]);
  const [editors, setEditors] = useState<Array<{ id: EditorId; label: string; available: boolean }>>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refreshRuns = async () => {
      try {
        const projectRuns = await fetchProjectRuns();
        if (active) setRuns(projectRuns);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load local project runs.');
        }
      }
    };
    void refreshRuns();
    fetchProjectEditors()
      .then((projectEditors) => {
        if (active) setEditors(projectEditors);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to detect installed editors.');
        }
      });
    const timer = window.setInterval(() => void refreshRuns(), 1500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const runTarget = async (item: HistoryRecord, target: ProjectRunTarget) => {
    const directory =
      target === 'api'
        ? item.apiPath ?? (item.projectType === 'api' ? item.directory : undefined)
        : item.frontendPath ?? (item.projectType !== 'api' ? item.directory : undefined);
    if (!directory) throw new Error(`No ${target} project folder is recorded for ${item.projectName}.`);
    const session = await startProjectRun({ directory, framework: item.framework, target });
    setRuns((previous) => [
      session,
      ...previous.filter((run) => !(run.directory === session.directory && run.target === session.target)),
    ]);
  };

  const handleRun = async (item: HistoryRecord, targets: ProjectRunTarget[]) => {
    setBusyId(item.id);
    setError(null);
    const results = await Promise.allSettled(targets.map((target) => runTarget(item, target)));
    const failures = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => result.reason instanceof Error ? result.reason.message : String(result.reason));
    if (failures.length) setError(failures.join(' '));
    setBusyId(null);
  };

  const handleStop = async (run: ProjectRunSession) => {
    setError(null);
    try {
      const session = await stopProjectRun(run.id);
      setRuns((previous) => previous.map((item) => item.id === session.id ? session : item));
    } catch (stopError) {
      setError(stopError instanceof Error ? stopError.message : 'Unable to stop project.');
    }
  };

  const handleOpen = async (directory: string, value: string) => {
    const [editorId] = value.split(':');
    const editor = editors.find((item) => item.id === editorId);
    if (!editor || !editor.available) {
      setError(`${editor?.label ?? 'Selected editor'} is not available on PATH.`);
      return;
    }
    setError(null);
    try {
      await openProjectInEditor(directory, editor.id);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'Unable to open project in editor.');
    }
  };

  const openOptions = (item: HistoryRecord) => {
    const targets = item.projectType === 'fullstack'
      ? [
          ...(item.workspacePath && item.fullStackLayout === 'workspace'
            ? [{ key: 'workspace', label: 'Workspace', directory: item.workspacePath }]
            : []),
          ...(item.frontendPath ? [{ key: 'frontend', label: 'Frontend', directory: item.frontendPath }] : []),
          ...(item.apiPath ? [{ key: 'api', label: 'API', directory: item.apiPath }] : []),
        ]
      : [{ key: 'project', label: 'Project', directory: item.directory }];
    return targets;
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B] flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
            Installed projects
          </h1>
          <p className="text-[13px] text-[#929BA5] mt-0.5">
            Run, stop, and open local projects. Each run gets a free port selected by the operating system.
          </p>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="px-3 py-1.5 rounded-[4px] bg-[#171A1E] border border-[#343B43] hover:border-[#DF7777] text-[12px] text-[#929BA5] hover:text-[#DF7777] cursor-pointer"
          >
            Clear list
          </button>
        )}
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[1060px] mx-auto flex flex-col gap-3">
          {error && <div role="alert" className="rounded border border-[#DF7777]/50 bg-[#DF7777]/5 p-3 text-[12px] text-[#DF7777]">{error}</div>}
          {history.length === 0 ? (
            <div className="rounded-[5px] border border-[#2D333B] bg-[#171A1E] p-8 text-center text-[13px] text-[#929BA5]">
              <History className="w-6 h-6 mx-auto mb-2 text-[#626D78]" />
              No installed projects yet. Create a frontend, API, or full-stack project to see it here.
            </div>
          ) : history.map((item) => {
            const isExpanded = expandedId === item.id;
            const projectRuns = runs.filter((run) =>
              run.directory === item.directory ||
              run.directory === item.frontendPath ||
              run.directory === item.apiPath
            );
            const projectType = item.projectType ?? 'frontend';
            const stackLabel = projectType === 'api'
              ? 'Express API · TypeScript'
              : `${item.framework}${projectType === 'fullstack' ? ' + Express API' : ''}`;
            const targets: ProjectRunTarget[] = projectType === 'fullstack' ? ['frontend', 'api'] : [projectType === 'api' ? 'api' : 'frontend'];
            return (
              <article key={item.id} className="rounded-[5px] border border-[#2D333B] bg-[#171A1E] hardware-bezel">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="font-mono text-left text-[14px] font-semibold text-[#F1F3F5] hover:text-[#C7A46A]"
                    >
                      {item.projectName}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#929BA5]">
                      <span>{stackLabel}</span>
                      <span>{item.timestamp}</span>
                      <StatusIndicator
                        tone={item.status === 'completed' ? 'installed' : item.status === 'failed' ? 'failed' : 'attention'}
                        label={item.status}
                        compact
                      />
                    </div>
                    <div className="mt-1 break-all font-mono text-[11px] text-[#626D78]">{item.directory}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {targets.map((target) => (
                      <button
                        key={target}
                        type="button"
                        disabled={busyId === item.id || item.status !== 'completed'}
                        onClick={() => void handleRun(item, [target])}
                        className="inline-flex items-center gap-1.5 rounded border border-[#C7A46A]/60 bg-[#252A30] px-3 py-2 text-[11px] font-medium text-[#F1F3F5] hover:border-[#C7A46A] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Play className="h-3 w-3 fill-current text-[#C7A46A]" />
                        {projectType === 'fullstack' ? `Run ${target}` : 'Run project'}
                      </button>
                    ))}
                    {projectType === 'fullstack' && (
                      <button
                        type="button"
                        disabled={busyId === item.id || item.status !== 'completed'}
                        onClick={() => void handleRun(item, ['frontend', 'api'])}
                        className="inline-flex items-center gap-1.5 rounded border border-[#343B43] px-3 py-2 text-[11px] text-[#929BA5] hover:border-[#65B9A5] hover:text-[#F1F3F5] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Run both
                      </button>
                    )}
                    <select
                      aria-label={`Open ${item.projectName} in an editor`}
                      defaultValue=""
                      onChange={(event) => {
                        if (!event.target.value) return;
                        const [targetKey, editorId] = event.target.value.split(':');
                        const target = openOptions(item).find((option) => option.key === targetKey);
                        if (target) void handleOpen(target.directory, `${editorId}:`);
                        event.target.value = '';
                      }}
                      className="max-w-[190px] rounded border border-[#343B43] bg-[#101214] px-2.5 py-2 text-[11px] text-[#F1F3F5]"
                    >
                      <option value="">Open with…</option>
                      {openOptions(item).map((target) => (
                        <optgroup key={target.key} label={`Open ${target.label} with`}>
                          {editors.map((editor) => (
                            <option key={editor.id} value={`${target.key}:${editor.id}`} disabled={!editor.available}>
                              {editor.label}{editor.available ? '' : ' (not found)'}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-[#2A3038] px-4 py-3">
                    <div className="grid gap-3 text-[11px] text-[#929BA5] sm:grid-cols-2">
                      <div><span className="text-[#626D78]">Installation duration</span><div className="mt-1 font-mono text-[#F1F3F5]">{item.durationSec.toFixed(1)}s</div></div>
                      <div><span className="text-[#626D78]">Layout</span><div className="mt-1 text-[#F1F3F5]">{item.fullStackLayout === 'separate' ? 'Separate sibling folders' : item.fullStackLayout === 'workspace' && projectType === 'fullstack' ? 'Single workspace folder' : 'Single project'}</div></div>
                    </div>
                    {projectRuns.length > 0 && (
                      <div className="mt-3 flex flex-col gap-2">
                        {projectRuns.map((run) => (
                          <div key={run.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#2A3038] bg-[#101214] px-3 py-2">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="capitalize text-[#F1F3F5]">{run.target}</span>
                              <span className="font-mono text-[#65B9A5]">:{run.port}</span>
                              {run.status === 'running' ? (
                                <a href={run.url} target="_blank" rel="noreferrer" className="text-[#C7A46A] underline">{run.url}</a>
                              ) : (
                                <span className="text-[#929BA5]">{run.error ?? run.status}</span>
                              )}
                            </div>
                            {run.status === 'running' && (
                              <button type="button" onClick={() => void handleStop(run)} className="inline-flex items-center gap-1 rounded border border-[#343B43] px-2 py-1 text-[10px] text-[#DF7777] hover:border-[#DF7777]">
                                <Square className="h-3 w-3" /> Stop
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ENVIRONMENT DIAGNOSTICS */
export const DiagnosticsSettingsSection: React.FC<{
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
    <section className="rounded-[5px] border border-[#343B43] bg-[#1D2126] p-5 hardware-bezel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A3038] pb-3">
        <div>
          <h2 className="text-[13.5px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
            Environment Diagnostics
          </h2>
          <p className="mt-0.5 text-[12px] text-[#929BA5]">
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
      </div>
      <div className="mt-4 flex flex-col gap-4">
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
    </section>
  );
};

/* 5. SETTINGS */
export const SettingsScreen: React.FC<{
  settings: StudioSettings;
  providerStatuses: AiProviderStatus[];
  systemProbe: SystemProbeResult | null;
  config: ProjectConfig;
  onProbeSystem: () => Promise<void>;
  onRefreshAiStatus: () => void;
  onUpdateSettings: (patch: Partial<StudioSettings>) => void;
  onApplyDefaultsToStudio?: () => void;
}> = ({
  settings,
  providerStatuses,
  systemProbe,
  config,
  onProbeSystem,
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
            Settings
          </h1>
          <p className="text-[13px] text-[#929BA5] mt-0.5">
            Personalize the interface and manage your local development environment.
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
          <section className="rounded-[5px] border border-[#343B43] bg-[#1D2126] p-5 hardware-bezel">
            <div className="mb-4 flex items-center gap-2">
              <Palette className="h-4 w-4 text-[#C7A46A]" />
              <div>
                <h2 className="text-[13.5px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">Theme & appearance</h2>
                <p className="mt-0.5 text-[12px] text-[#929BA5]">Choose a color mode, accent, typefaces, and interface text size.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-[12px] text-[#F1F3F5]">
                Color mode
                <select
                  value={settings.themeMode}
                  onChange={(event) => onUpdateSettings({ themeMode: event.target.value as StudioSettings['themeMode'] })}
                  className="rounded border border-[#343B43] bg-[#101214] px-3 py-2 text-[12px] text-[#F1F3F5]"
                >
                  <option value="dark">Dark graphite</option>
                  <option value="semi-dark">Semi-dark charcoal</option>
                  <option value="midnight">Midnight blue</option>
                  <option value="forest">Forest</option>
                  <option value="ocean">Ocean</option>
                  <option value="light">Light</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[12px] text-[#F1F3F5]">
                Interface font
                <select
                  value={settings.bodyFont}
                  onChange={(event) => onUpdateSettings({ bodyFont: event.target.value as StudioSettings['bodyFont'] })}
                  className="rounded border border-[#343B43] bg-[#101214] px-3 py-2 text-[12px] text-[#F1F3F5]"
                >
                  <option value="IBM Plex Sans">IBM Plex Sans</option>
                  <option value="Inter">Inter</option>
                  <option value="system-ui">System UI</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[12px] text-[#F1F3F5]">
                Heading / accent font
                <select
                  value={settings.accentFont}
                  onChange={(event) => onUpdateSettings({ accentFont: event.target.value as StudioSettings['accentFont'] })}
                  className="rounded border border-[#343B43] bg-[#101214] px-3 py-2 text-[12px] text-[#F1F3F5]"
                >
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="Space Grotesk">Space Grotesk</option>
                  <option value="Inter">Inter</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[12px] text-[#F1F3F5]">
                Interface text size · {settings.fontSize}px
                <input
                  type="range"
                  min={13}
                  max={17}
                  step={1}
                  value={settings.fontSize}
                  onChange={(event) => onUpdateSettings({ fontSize: Number(event.target.value) as StudioSettings['fontSize'] })}
                  className="mt-2 accent-[#C7A46A]"
                  aria-label="Interface text size"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-[12px] text-[#F1F3F5]">
                Accent color
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(event) => onUpdateSettings({ accentColor: event.target.value })}
                  className="h-8 w-12 cursor-pointer rounded border border-[#343B43] bg-[#101214] p-1"
                />
              </label>
              {['#C7A46A', '#65B9A5', '#77A9DC', '#C98AA7', '#A78BFA'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onUpdateSettings({ accentColor: color })}
                  aria-label={`Set accent color ${color}`}
                  aria-pressed={settings.accentColor.toLowerCase() === color.toLowerCase()}
                  className="h-6 w-6 rounded-full border border-white/30 focus-visible:outline-2 focus-visible:outline-white"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </section>

          <DiagnosticsSettingsSection
            systemProbe={systemProbe}
            config={config}
            onProbeSystem={onProbeSystem}
          />

          <section className="rounded-[5px] border border-[#343B43] bg-[#1D2126] p-5 hardware-bezel">
            <h2 className="text-[13.5px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">About</h2>
            <p className="mt-3 text-[14px] font-semibold text-[#F1F3F5]">Jeffrey Katlego Monamodi</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#929BA5]">
              Software Developer and UI/UX Designer with over 12 years of experience, now Agentic Prompter.
            </p>
            <a
              href="https://www.beyondcuriouslabs.co.za"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#77A9DC] hover:text-[#F1F3F5]"
            >
              beyondcuriouslabs.co.za <ExternalLink className="h-3 w-3" />
            </a>
          </section>

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

            {onApplyDefaultsToStudio && (
              <div className="pt-3 border-t border-[#2A3038] flex flex-wrap items-center justify-between gap-3">
                <div className="text-[12px] text-[#929BA5]">
                  Apply preview defaults. Choose the actual install folder in Create New Project.
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
