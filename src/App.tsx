import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AiProviderStatus,
  AiStackRecommendation,
  ExecutionCommandStep,
  ExecutionStepState,
  HistoryRecord,
  InspectorTarget,
  OperationLogEntry,
  PackageManagerInfo,
  ProjectConfig,
  RuntimeId,
  RuntimeInfo,
  SavedRecipe,
  ScreenId,
  StudioPackage,
  StudioSettings,
  SystemProbeResult,
  WorkflowNode,
} from './types/studio';
import {
  buildExecutionPlan,
  DEFAULT_PROJECT_CONFIG,
  DEFAULT_SETTINGS,
  FRAMEWORKS,
  INITIAL_HISTORY,
  INITIAL_PACKAGE_MANAGERS,
  INITIAL_RECIPES,
  INITIAL_RUNTIMES,
  INITIAL_WORKFLOW_NODES,
  STUDIO_PACKAGES,
  validateProjectCompatibility,
} from './data/studioCatalog';
import { AI_PROVIDERS } from './data/aiProviders';
import { fetchAiStatus } from './services/aiClient';
import { fetchSystemProbe } from './services/systemClient';
import { Sidebar } from './components/layout/Sidebar';
import { InspectorPanel } from './components/layout/InspectorPanel';
import { CommandPalette } from './components/studio/CommandPalette';
import { ProjectStudioScreen } from './components/screens/ProjectStudioScreen';

const OverviewScreen = lazy(() =>
  import('./components/screens/OverviewScreen').then((m) => ({ default: m.OverviewScreen }))
);
const RuntimeManagerScreen = lazy(() =>
  import('./components/screens/RuntimeManagerScreen').then((m) => ({ default: m.RuntimeManagerScreen }))
);
const PackageStudioScreen = lazy(() =>
  import('./components/screens/PackageStudioScreen').then((m) => ({ default: m.PackageStudioScreen }))
);
const WorkflowBuilderScreen = lazy(() =>
  import('./components/screens/WorkflowBuilderScreen').then((m) => ({ default: m.WorkflowBuilderScreen }))
);
const OperationsCentreScreen = lazy(() =>
  import('./components/screens/OperationsCentreScreen').then((m) => ({ default: m.OperationsCentreScreen }))
);
const DocumentationScreen = lazy(() =>
  import('./components/screens/DocumentationScreen').then((m) => ({ default: m.DocumentationScreen }))
);
const DiagnosticsScreen = lazy(() =>
  import('./components/screens/SecondaryManagementScreens').then((m) => ({ default: m.DiagnosticsScreen }))
);
const InstallationHistoryScreen = lazy(() =>
  import('./components/screens/SecondaryManagementScreens').then((m) => ({ default: m.InstallationHistoryScreen }))
);
const IntegrationRegistryScreen = lazy(() =>
  import('./components/screens/SecondaryManagementScreens').then((m) => ({ default: m.IntegrationRegistryScreen }))
);
const ProjectRecipesScreen = lazy(() =>
  import('./components/screens/SecondaryManagementScreens').then((m) => ({ default: m.ProjectRecipesScreen }))
);
const SettingsScreen = lazy(() =>
  import('./components/screens/SecondaryManagementScreens').then((m) => ({ default: m.SettingsScreen }))
);

const RECIPES_STORAGE_KEY = 'visual_line_interface_recipes_v1';
const SETTINGS_STORAGE_KEY = 'visual_line_interface_settings_v1';
const WORKFLOWS_STORAGE_KEY = 'visual_line_interface_workflows_v1';
const HISTORY_STORAGE_KEY = 'visual_line_interface_history_v1';

const LEGACY_STORAGE_KEYS: Record<string, string> = {
  [RECIPES_STORAGE_KEY]: 'visual_cli_studio_recipes_v1',
  [SETTINGS_STORAGE_KEY]: 'visual_cli_studio_settings_v1',
  [WORKFLOWS_STORAGE_KEY]: 'visual_cli_studio_workflows_v1',
  [HISTORY_STORAGE_KEY]: 'visual_cli_studio_history_v1',
};

function readStorageWithMigration(key: string): string | null {
  try {
    const current = localStorage.getItem(key);
    if (current) return current;
    const legacyKey = LEGACY_STORAGE_KEYS[key];
    return legacyKey ? localStorage.getItem(legacyKey) : null;
  } catch {
    return null;
  }
}

function nowTimestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('project-studio');
  const [inspectorCollapsed, setInspectorCollapsed] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1340 : false
  );
  const [inspectorTarget, setInspectorTarget] = useState<InspectorTarget>({
    type: 'framework',
    id: 'vite',
  });

  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [runtimes, setRuntimes] = useState<RuntimeInfo[]>(INITIAL_RUNTIMES);
  const [packageManagers, setPackageManagers] = useState<PackageManagerInfo[]>(INITIAL_PACKAGE_MANAGERS);
  const [systemProbe, setSystemProbe] = useState<SystemProbeResult | null>(null);
  const [packages, setPackages] = useState<StudioPackage[]>(STUDIO_PACKAGES);
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>(() => {
    try {
      const raw = readStorageWithMigration(WORKFLOWS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WorkflowNode[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return INITIAL_WORKFLOW_NODES;
  });
  const [selectedWorkflowNodeId, setSelectedWorkflowNodeId] = useState<string | null>(
    () => workflowNodes[0]?.id ?? null
  );
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [recipes, setRecipes] = useState<SavedRecipe[]>(() => {
    try {
      const raw = readStorageWithMigration(RECIPES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedRecipe[];
        return parsed.map((rec) => ({
          ...rec,
          config: { ...DEFAULT_PROJECT_CONFIG, ...rec.config },
        }));
      }
    } catch {
      // Ignore storage error
    }
    return INITIAL_RECIPES;
  });

  const [settings, setSettings] = useState<StudioSettings>(() => {
    try {
      const raw = readStorageWithMigration(SETTINGS_STORAGE_KEY);
      if (raw) {
        const merged = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<StudioSettings>) };
        const providerValid = AI_PROVIDERS.some((p) => p.id === merged.aiProvider);
        if (!providerValid) {
          merged.aiProvider = DEFAULT_SETTINGS.aiProvider;
          merged.aiModel = DEFAULT_SETTINGS.aiModel;
        }
        if (!merged.aiModel) {
          const prov = AI_PROVIDERS.find((p) => p.id === merged.aiProvider);
          merged.aiModel = prov?.defaultModel ?? DEFAULT_SETTINGS.aiModel;
        }
        return merged;
      }
    } catch {
      // Ignore storage error
    }
    return DEFAULT_SETTINGS;
  });

  const [providerStatuses, setProviderStatuses] = useState<AiProviderStatus[]>(() =>
    AI_PROVIDERS.map((p) => ({
      id: p.id,
      name: p.name,
      envVar: p.envVar,
      configured: false,
      defaultModel: p.defaultModel,
    }))
  );

  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const raw = readStorageWithMigration(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryRecord[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return INITIAL_HISTORY;
  });

  // Operations Centre execution state
  const [execSteps, setExecSteps] = useState<ExecutionStepState[]>([]);
  const [execLogs, setExecLogs] = useState<OperationLogEntry[]>([]);
  const [execRunning, setExecRunning] = useState(false);
  const [execPaused, setExecPaused] = useState(false);
  const [execElapsedSec, setExecElapsedSec] = useState(0);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const execTimerRef = useRef<number | null>(null);
  const failTriggeredOnceRef = useRef(false);

  // Global Cmd/Ctrl+K shortcut for Command & Docs Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Collapse inspector automatically when crossing 1280px width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setInspectorCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshAiStatus = useCallback(() => {
    fetchAiStatus()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setProviderStatuses(list);
        }
      })
      .catch(() => {
        // Offline or backend booting; keep safe defaults so app works without AI
      });
  }, []);

  const probeSeqRef = useRef(0);
  const initialProbeDoneRef = useRef(false);

  const refreshSystemProbe = useCallback(async () => {
    const seq = ++probeSeqRef.current;
    try {
      const probe = await fetchSystemProbe(config.devPort, config.previewPort);
      if (seq !== probeSeqRef.current) return;
      setSystemProbe(probe);
      setRuntimes((prev) =>
        prev.map((rt) => {
          const match = probe.runtimes.find((r) => r.id === rt.id);
          if (!match) return rt;
          return {
            ...rt,
            installedVersion: match.version,
            binaryPath: match.binaryPath ?? 'not found on PATH',
            architecture: probe.arch,
            status: match.installed ? 'installed' : 'missing',
          };
        })
      );
      setPackageManagers((prev) =>
        prev.map((pm) => {
          const match = probe.packageManagers.find((m) => m.id === pm.id);
          if (!match) return pm;
          return {
            ...pm,
            version: match.version ?? pm.version,
            status: match.installed ? 'installed' : 'missing',
          };
        })
      );
    } catch {
      // Keep fallback static metadata when offline
    }
  }, [config.devPort, config.previewPort]);

  useEffect(() => {
    refreshAiStatus();
  }, [refreshAiStatus]);

  useEffect(() => {
    if (!initialProbeDoneRef.current) {
      initialProbeDoneRef.current = true;
      void refreshSystemProbe();
      return;
    }
    const timer = window.setTimeout(() => {
      void refreshSystemProbe();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [refreshSystemProbe]);

  useEffect(() => {
    try {
      localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
    } catch {
      // Ignore
    }
  }, [recipes]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflowNodes));
    } catch {
      // Ignore
    }
  }, [workflowNodes]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore
    }
  }, [history]);

  const compatibilityIssues = useMemo(() => validateProjectCompatibility(config), [config]);
  const executionPlan = useMemo(
    () => buildExecutionPlan(config, packages, settings.shellTarget),
    [config, packages, settings.shellTarget]
  );

  const activeRuntime = useMemo(
    () => runtimes.find((r) => r.id === config.runtime) ?? runtimes[0],
    [runtimes, config.runtime]
  );

  // Sync ProjectConfig fields cleanly when package tray toggles
  const handleTogglePackage = useCallback((packageId: string) => {
    setConfig((prev) => {
      const exists = prev.selectedPackageIds.includes(packageId);
      const nextIds = exists
        ? prev.selectedPackageIds.filter((id) => id !== packageId)
        : [...prev.selectedPackageIds, packageId];

      const patch: Partial<ProjectConfig> = { selectedPackageIds: nextIds };

      if (packageId === 'tailwindcss') {
        patch.styling = exists ? 'plain-css' : 'tailwind';
      } else if (packageId === 'typescript') {
        patch.language = exists ? 'javascript' : 'typescript';
      } else if (packageId === 'eslint') {
        patch.devTools = exists
          ? prev.devTools.filter((d) => d !== 'eslint')
          : Array.from(new Set([...prev.devTools, 'eslint']));
      } else if (packageId === 'prettier') {
        patch.devTools = exists
          ? prev.devTools.filter((d) => d !== 'prettier')
          : Array.from(new Set([...prev.devTools, 'prettier']));
      } else if (packageId === 'biome') {
        patch.devTools = exists
          ? prev.devTools.filter((d) => d !== 'biome')
          : Array.from(new Set([...prev.devTools, 'biome']));
      } else if (packageId === 'vitest') {
        patch.testing = exists ? 'none' : 'vitest';
      } else if (packageId === 'playwright') {
        patch.testing = exists ? 'none' : 'playwright';
      }

      return { ...prev, ...patch };
    });
  }, []);

  const handleAddCustomPackage = useCallback((newPkg: StudioPackage) => {
    setPackages((prev) => {
      if (prev.some((p) => p.id === newPkg.id)) return prev;
      return [newPkg, ...prev];
    });
    setConfig((prev) => ({
      ...prev,
      selectedPackageIds: prev.selectedPackageIds.includes(newPkg.id)
        ? prev.selectedPackageIds
        : [...prev.selectedPackageIds, newPkg.id],
    }));
  }, []);

  const handleUpdateConfig = useCallback((patch: Partial<ProjectConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      // Keep selectedPackageIds synced with Project Studio selectors
      const pkgSet = new Set(next.selectedPackageIds);
      if (next.styling === 'tailwind') pkgSet.add('tailwindcss');
      else pkgSet.delete('tailwindcss');

      if (next.language === 'typescript') pkgSet.add('typescript');
      else pkgSet.delete('typescript');

      if (next.devTools.includes('eslint')) pkgSet.add('eslint');
      else pkgSet.delete('eslint');

      if (next.devTools.includes('prettier')) pkgSet.add('prettier');
      else pkgSet.delete('prettier');

      if (next.devTools.includes('biome')) pkgSet.add('biome');
      else pkgSet.delete('biome');

      if (next.testing === 'vitest') {
        pkgSet.add('vitest');
        pkgSet.delete('playwright');
      } else if (next.testing === 'playwright') {
        pkgSet.add('playwright');
        pkgSet.delete('vitest');
      } else {
        pkgSet.delete('vitest');
        pkgSet.delete('playwright');
      }

      next.selectedPackageIds = Array.from(pkgSet);
      return next;
    });
  }, []);

  const handleApplyFix = useCallback(
    (issueId: string) => {
      if (issueId === 'invalid-name') {
        handleUpdateConfig({ projectName: 'my-awesome-app' });
      } else if (issueId === 'swc-non-react' || issueId === 'swc-unsupported-framework') {
        handleUpdateConfig({ compiler: 'standard' });
      } else if (issueId === 'bun-yarn-mismatch') {
        handleUpdateConfig({ packageManager: 'bun' });
      } else if (issueId === 'deno-pnpm-mismatch') {
        handleUpdateConfig({ runtime: 'node', runtimeVersion: '22.14.0 LTS' });
      } else if (issueId === 'biome-eslint-overlap') {
        handleUpdateConfig({ devTools: ['biome'] });
      } else if (issueId === 'port-collision') {
        handleUpdateConfig({ previewPort: config.devPort === 4173 ? 4174 : 4173 });
      } else if (issueId === 'nextjs-react-router') {
        handleUpdateConfig({
          selectedPackageIds: config.selectedPackageIds.filter((id) => id !== 'react-router'),
        });
      } else if (
        issueId === 'naming-convention-mismatch' ||
        issueId === 'rename-path-collision' ||
        issueId === 'invalid-rename-path'
      ) {
        handleUpdateConfig({
          autoAlignFileNaming: true,
          fileRenameOverrides: {},
        });
      }
    },
    [config.devPort, config.selectedPackageIds, handleUpdateConfig]
  );

  const handleApplyAiRecommendation = useCallback(
    (rec: AiStackRecommendation) => {
      const sc = rec.suggestedConfig;
      const rt = runtimes.find((r) => r.id === sc.runtime);
      handleUpdateConfig({
        framework: sc.framework,
        viteUiFramework: sc.viteUiFramework ?? 'react',
        language: sc.language,
        compiler: sc.compiler,
        styling: sc.styling,
        testing: sc.testing,
        devTools: sc.devTools,
        packageManager: sc.packageManager,
        runtime: sc.runtime,
        runtimeVersion: rt?.selectedVersion ?? config.runtimeVersion,
        projectName: sc.projectName,
        selectedPackageIds: sc.selectedPackageIds,
        directoryLayoutMode: sc.directoryLayoutMode,
        directoryNamingConvention: sc.directoryNamingConvention,
        autoAlignFileNaming: true,
        fileRenameOverrides: {},
        devPort: sc.devPort,
      });
      setInspectorTarget({ type: 'framework', id: sc.framework });
    },
    [config.runtimeVersion, handleUpdateConfig, runtimes]
  );

  const handleUpdateRuntimeVersion = (id: RuntimeId, version: string) => {
    setRuntimes((prev) =>
      prev.map((rt) => (rt.id === id ? { ...rt, selectedVersion: version } : rt))
    );
  };

  const handleUpgradeRuntime = (id: RuntimeId) => {
    setRuntimes((prev) =>
      prev.map((rt) =>
        rt.id === id
          ? {
              ...rt,
              installedVersion: rt.latestVersion,
              selectedVersion: `${rt.latestVersion} Latest`,
              status: 'installed',
            }
          : rt
      )
    );
  };

  const handleSaveRecipe = (name: string, description: string) => {
    const newRecipe: SavedRecipe = {
      id: `rec-${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      config: { ...config },
      stepCount: executionPlan.length,
    };
    setRecipes((prev) => [newRecipe, ...prev]);
  };

  const handleLoadRecipe = (recipe: SavedRecipe) => {
    setConfig({ ...recipe.config });
    setActiveScreen('project-studio');
    setInspectorTarget({ type: 'framework', id: recipe.config.framework });
  };

  // Start Operations Centre Dry-Run Execution
  const startPipelineExecution = useCallback(
    (stepsToRun: ExecutionCommandStep[], projectLabel: string) => {
      if (execTimerRef.current) {
        window.clearInterval(execTimerRef.current);
      }
      failTriggeredOnceRef.current = false;

      const initialStates: ExecutionStepState[] = stepsToRun.map((s, idx) => ({
        step: s,
        status: idx === 0 ? 'running' : 'pending',
        durationMs: 0,
        outputLines: [],
      }));

      setExecSteps(initialStates);
      setExecElapsedSec(0);
      setExecPaused(false);
      setExecRunning(true);
      setExecLogs([
        {
          id: `log-start-${Date.now()}`,
          timestamp: nowTimestamp(),
          level: 'info',
          stepId: 'preflight',
          message: `Initialising dry-run execution pipeline for "${projectLabel}" (${stepsToRun.length} operations)`,
        },
        ...(stepsToRun[0]
          ? [
              {
                id: `log-cmd-0-${Date.now()}`,
                timestamp: nowTimestamp(),
                level: 'cmd' as const,
                stepId: stepsToRun[0].id,
                message: `$ ${stepsToRun[0].command}`,
              },
            ]
          : []),
      ]);
      setActiveScreen('operations');
    },
    []
  );

  // Tick Operations Centre simulation cleanly
  useEffect(() => {
    if (!execRunning || execPaused) {
      if (execTimerRef.current) {
        window.clearInterval(execTimerRef.current);
        execTimerRef.current = null;
      }
      return;
    }

    execTimerRef.current = window.setInterval(() => {
      setExecElapsedSec((prev) => prev + 0.5);

      setExecSteps((prevSteps) => {
        const runningIndex = prevSteps.findIndex((s) => s.status === 'running');
        if (runningIndex === -1) {
          setExecRunning(false);
          return prevSteps;
        }

        const current = prevSteps[runningIndex];
        const nextDuration = current.durationMs + 500;
        const targetMs = Math.max(1000, Math.min(2000, current.step.estimatedSec * 250));

        // Optional fault injection on step index 2
        if (
          simulateFailure &&
          !failTriggeredOnceRef.current &&
          runningIndex === Math.min(2, prevSteps.length - 1) &&
          nextDuration >= 700
        ) {
          failTriggeredOnceRef.current = true;
          const updated = prevSteps.map((st, idx) =>
            idx === runningIndex ? { ...st, status: 'failed' as const, durationMs: nextDuration } : st
          );
          setExecRunning(false);
          setExecLogs((logs) => [
            ...logs,
            {
              id: `log-err-${Date.now()}`,
              timestamp: nowTimestamp(),
              level: 'error',
              stepId: current.step.id,
              message: `ERR_REGISTRY_TIMEOUT: Simulated failure during "${current.step.label}". Click "Retry Failed" to recover.`,
            },
          ]);
          return updated;
        }

        if (nextDuration < targetMs) {
          return prevSteps.map((st, idx) =>
            idx === runningIndex ? { ...st, durationMs: nextDuration } : st
          );
        }

        // Complete current step & advance next
        const nextIdx = runningIndex + 1;
        const hasNext = nextIdx < prevSteps.length;

        const updated = prevSteps.map((st, idx) => {
          if (idx === runningIndex) {
            return { ...st, status: 'completed' as const, durationMs: nextDuration };
          }
          if (idx === nextIdx) {
            return { ...st, status: 'running' as const };
          }
          return st;
        });

        setExecLogs((logs) => {
          const nextLogs: OperationLogEntry[] = [
            ...logs,
            {
              id: `log-ok-${runningIndex}-${Date.now()}`,
              timestamp: nowTimestamp(),
              level: 'success',
              stepId: current.step.id,
              message: `Completed "${current.step.label}" in ${(nextDuration / 1000).toFixed(2)}s`,
            },
          ];
          if (hasNext) {
            nextLogs.push({
              id: `log-cmd-${nextIdx}-${Date.now()}`,
              timestamp: nowTimestamp(),
              level: 'cmd',
              stepId: prevSteps[nextIdx].step.id,
              message: `$ ${prevSteps[nextIdx].step.command}`,
            });
          } else {
            nextLogs.push({
              id: `log-done-${Date.now()}`,
              timestamp: nowTimestamp(),
              level: 'info',
              stepId: 'done',
              message: `Dry-run sequence verified (${prevSteps.length} steps). Export setup script or copy commands to run locally.`,
            });
          }
          return nextLogs;
        });

        if (!hasNext) {
          setExecRunning(false);
          setHistory((h) => [
            {
              id: `hist-${Date.now()}`,
              projectName: config.projectName || 'my-awesome-app',
              framework: config.framework,
              packageManager: config.packageManager,
              directory: `${config.directory}/${config.projectName || 'my-awesome-app'}`,
              timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
              status: 'completed',
              durationSec: Number((execElapsedSec + 0.5).toFixed(1)),
              commandCount: prevSteps.length,
              mode: 'Simulated Execution',
            },
            ...h,
          ]);
        }

        return updated;
      });
    }, 500);

    return () => {
      if (execTimerRef.current) {
        window.clearInterval(execTimerRef.current);
      }
    };
  }, [execRunning, execPaused, simulateFailure, config, execElapsedSec]);

  const handleRetryFailed = () => {
    const failedIdx = execSteps.findIndex((s) => s.status === 'failed');
    if (failedIdx === -1) return;
    setExecSteps((prev) =>
      prev.map((s, idx) => (idx === failedIdx ? { ...s, status: 'running', durationMs: 0 } : s))
    );
    setExecLogs((logs) => [
      ...logs,
      {
        id: `log-retry-${Date.now()}`,
        timestamp: nowTimestamp(),
        level: 'warn',
        stepId: execSteps[failedIdx].step.id,
        message: `Retrying step: ${execSteps[failedIdx].step.label}`,
      },
    ]);
    setExecPaused(false);
    setExecRunning(true);
  };

  const handleCancelExecution = () => {
    setExecRunning(false);
    setExecPaused(false);
    setExecSteps((prev) =>
      prev.map((s) => (s.status === 'running' ? { ...s, status: 'paused' } : s))
    );
    setExecLogs((logs) => [
      ...logs,
      {
        id: `log-cancel-${Date.now()}`,
        timestamp: nowTimestamp(),
        level: 'warn',
        stepId: 'cancel',
        message: 'Execution pipeline cancelled by operator.',
      },
    ]);
  };

  const renderMainScreen = () => {
    switch (activeScreen) {
      case 'overview':
        return (
          <OverviewScreen
            config={config}
            runtimes={runtimes}
            packageManagers={packageManagers}
            recipes={recipes}
            history={history}
            executionPlan={executionPlan}
            onNavigate={setActiveScreen}
            onLoadRecipe={handleLoadRecipe}
          />
        );
      case 'project-studio':
        return (
          <ProjectStudioScreen
            config={config}
            onUpdateConfig={handleUpdateConfig}
            runtimes={runtimes}
            onUpdateRuntimeVersion={handleUpdateRuntimeVersion}
            packageManagers={packageManagers}
            packages={packages}
            settings={settings}
            executionPlan={executionPlan}
            issues={compatibilityIssues}
            providerStatuses={providerStatuses}
            onInspect={(target) => {
              setInspectorTarget(target);
            }}
            onSaveRecipe={handleSaveRecipe}
            onInitialiseProject={() =>
              startPipelineExecution(executionPlan, config.projectName || 'my-awesome-app')
            }
            onOpenPackagesScreen={() => setActiveScreen('packages')}
            onOpenAiSettings={() => setActiveScreen('settings')}
            onApplyAiRecommendation={handleApplyAiRecommendation}
          />
        );
      case 'packages':
        return (
          <PackageStudioScreen
            packages={packages}
            selectedPackageIds={config.selectedPackageIds}
            activeFramework={config.framework}
            packageManager={config.packageManager}
            onTogglePackage={handleTogglePackage}
            onUpdatePackageVersion={(id, version) =>
              setPackages((prev) =>
                prev.map((p) => (p.id === id ? { ...p, version } : p))
              )
            }
            onAddCustomPackage={handleAddCustomPackage}
            onInspect={(target) => setInspectorTarget(target)}
            onApplyToStudio={() => setActiveScreen('project-studio')}
          />
        );
      case 'runtimes':
        return (
          <RuntimeManagerScreen
            runtimes={runtimes}
            systemProbe={systemProbe}
            activeRuntimeId={config.runtime}
            activePackageManagerId={config.packageManager}
            onSelectActiveRuntime={(id) => {
              const found = runtimes.find((r) => r.id === id);
              handleUpdateConfig({
                runtime: id,
                runtimeVersion: found?.selectedVersion ?? '',
              });
            }}
            onUpdateRuntimeVersion={handleUpdateRuntimeVersion}
            onUpgradeRuntime={handleUpgradeRuntime}
            onProbeSystem={refreshSystemProbe}
            packageManagers={packageManagers}
            onInspect={(target) => setInspectorTarget(target)}
          />
        );
      case 'workflows':
        return (
          <WorkflowBuilderScreen
            nodes={workflowNodes}
            selectedNodeId={selectedWorkflowNodeId}
            onSelectNode={setSelectedWorkflowNodeId}
            onAddNode={(tpl) => {
              const newId = `wf-${Date.now().toString().slice(-4)}`;
              const prevId = workflowNodes[workflowNodes.length - 1]?.id;
              const newNode: WorkflowNode = {
                ...tpl,
                id: newId,
                dependsOn: prevId ? [prevId] : [],
              };
              setWorkflowNodes((prev) => [...prev, newNode]);
              setSelectedWorkflowNodeId(newId);
              setInspectorTarget({ type: 'workflow-node', id: newId });
            }}
            onMoveNode={(nodeId, dir) => {
              setWorkflowNodes((prev) => {
                const idx = prev.findIndex((n) => n.id === nodeId);
                if (idx === -1) return prev;
                const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
                if (targetIdx < 0 || targetIdx >= prev.length) return prev;
                const copy = [...prev];
                const [item] = copy.splice(idx, 1);
                copy.splice(targetIdx, 0, item);
                return copy;
              });
            }}
            onRemoveNode={(nodeId) =>
              setWorkflowNodes((prev) => prev.filter((n) => n.id !== nodeId))
            }
            onToggleNode={(nodeId) =>
              setWorkflowNodes((prev) =>
                prev.map((n) => (n.id === nodeId ? { ...n, enabled: !n.enabled } : n))
              )
            }
            onInspect={(target) => setInspectorTarget(target)}
            onSaveWorkflow={() => {
              try {
                localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflowNodes));
              } catch {
                // Ignore
              }
            }}
            onSyncFromStudio={() => {
              const synced: WorkflowNode[] = executionPlan.map((step, idx) => ({
                id: `wf-sync-${idx + 1}`,
                operationId: step.id,
                title: step.label,
                phase: step.phase,
                command: step.command,
                description: step.description,
                enabled: true,
                dependsOn: idx > 0 ? [`wf-sync-${idx}`] : [],
                timeoutSec: Math.max(30, step.estimatedSec * 10),
                continueOnError: false,
              }));
              setWorkflowNodes(synced);
              setSelectedWorkflowNodeId(synced[0]?.id ?? null);
              if (synced[0]) {
                setInspectorTarget({ type: 'workflow-node', id: synced[0].id });
              }
            }}
            onExecuteWorkflow={() => {
              const steps: ExecutionCommandStep[] = workflowNodes
                .filter((n) => n.enabled)
                .map((n) => ({
                  id: n.id,
                  phase: n.phase,
                  label: n.title,
                  command: n.command,
                  description: n.description,
                  estimatedSec: 4,
                }));
              startPipelineExecution(steps, 'workflow-pipeline');
            }}
          />
        );
      case 'operations':
        return (
          <OperationsCentreScreen
            projectName={config.projectName || 'my-awesome-app'}
            targetDirectory={config.directory}
            settings={settings}
            steps={
              execSteps.length > 0
                ? execSteps
                : executionPlan.map((s) => ({
                    step: s,
                    status: 'pending',
                    durationMs: 0,
                    outputLines: [],
                  }))
            }
            logs={execLogs}
            isRunning={execRunning}
            isPaused={execPaused}
            elapsedSec={execElapsedSec}
            simulateFailure={simulateFailure}
            onToggleSimulateFailure={setSimulateFailure}
            onStartOrResume={() => {
              if (execPaused) {
                setExecPaused(false);
                setExecRunning(true);
              } else {
                startPipelineExecution(executionPlan, config.projectName || 'my-awesome-app');
              }
            }}
            onPause={() => {
              setExecPaused(true);
              setExecRunning(false);
            }}
            onCancel={handleCancelExecution}
            onRetryFailed={handleRetryFailed}
            onBackToStudio={() => setActiveScreen('project-studio')}
          />
        );
      case 'integrations':
        return (
          <IntegrationRegistryScreen
            packages={packages}
            selectedIds={config.selectedPackageIds}
            onToggleIntegration={handleTogglePackage}
          />
        );
      case 'recipes':
        return (
          <ProjectRecipesScreen
            recipes={recipes}
            onLoadRecipe={handleLoadRecipe}
            onDeleteRecipe={(id) =>
              setRecipes((prev) => prev.filter((r) => r.id !== id))
            }
          />
        );
      case 'history':
        return (
          <InstallationHistoryScreen
            history={history}
            onClearHistory={() => setHistory([])}
          />
        );
      case 'diagnostics':
        return (
          <DiagnosticsScreen
            systemProbe={systemProbe}
            config={config}
            onProbeSystem={refreshSystemProbe}
          />
        );
      case 'docs':
        return <DocumentationScreen onNavigate={setActiveScreen} />;
      case 'settings':
        return (
          <SettingsScreen
            settings={settings}
            providerStatuses={providerStatuses}
            onRefreshAiStatus={refreshAiStatus}
            onUpdateSettings={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
            onApplyDefaultsToStudio={() => {
              const rt = runtimes.find((r) => r.id === settings.preferredRuntime);
              handleUpdateConfig({
                directory: settings.defaultDirectory,
                packageManager: settings.preferredPackageManager,
                runtime: settings.preferredRuntime,
                runtimeVersion: rt?.selectedVersion ?? config.runtimeVersion,
              });
            }}
          />
        );
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#101214] text-[#F1F3F5] flex">
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        activeRuntime={activeRuntime}
        systemProbe={systemProbe}
        isExecutionActive={execRunning}
        selectedPackageCount={config.selectedPackageIds.length}
        recipeCount={recipes.length}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Dynamic Main Workspace */}
      <main className="flex-1 min-w-0 h-full bg-[#101214] flex flex-col overflow-hidden">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center font-mono text-[12px] text-[#626D78]">
              Loading workstation module…
            </div>
          }
        >
          {renderMainScreen()}
        </Suspense>
      </main>

      {/* Collapsible Right Contextual Inspector */}
      <InspectorPanel
        collapsed={inspectorCollapsed}
        onToggleCollapse={() => setInspectorCollapsed((v) => !v)}
        target={inspectorTarget}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        issues={compatibilityIssues}
        runtimes={runtimes}
        packageManagers={packageManagers}
        packages={packages}
        workflowNodes={workflowNodes}
        onUpdateWorkflowNode={(nodeId, patch) =>
          setWorkflowNodes((prev) =>
            prev.map((n) => (n.id === nodeId ? { ...n, ...patch } : n))
          )
        }
        onApplyFix={handleApplyFix}
      />

      {/* Quick Command & Documentation Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        packages={packages}
        onNavigate={(screen) => setActiveScreen(screen)}
        onCopyCommands={() => {
          const script = executionPlan.map((s) => s.command).join('\n');
          navigator.clipboard?.writeText(script).catch(() => {});
        }}
        onSelectFramework={(fwId) => {
          const fw = FRAMEWORKS.find((f) => f.id === fwId);
          handleUpdateConfig({
            framework: fwId,
            devPort: fw?.defaultPort ?? config.devPort,
            compiler: fw?.supportsSwc ? config.compiler : 'standard',
          });
          setInspectorTarget({ type: 'framework', id: fwId });
        }}
      />
    </div>
  );
}
