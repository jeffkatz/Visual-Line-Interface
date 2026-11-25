import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AiProviderStatus,
  HistoryRecord,
  InspectorTarget,
  PackageManagerInfo,
  ProjectConfig,
  RuntimeId,
  RuntimeInfo,
  StackPresetProfile,
  ScreenId,
  StudioSettings,
  SystemProbeResult,
} from './types/studio';
import {
  buildExecutionPlan,
  DEFAULT_PROJECT_CONFIG,
  DEFAULT_SETTINGS,
  FRAMEWORKS,
  INITIAL_PACKAGE_MANAGERS,
  INITIAL_RUNTIMES,
  STUDIO_PACKAGES,
  validateProjectCompatibility,
} from './data/studioCatalog';
import { AI_PROVIDERS } from './data/aiProviders';
import { fetchAiStatus } from './services/aiClient';
import { fetchSystemProbe } from './services/systemClient';
import { updateRuntimeVersion } from './services/runtimeClient';
import { Sidebar } from './components/layout/Sidebar';
import { InspectorPanel } from './components/layout/InspectorPanel';
import { CommandPalette } from './components/studio/CommandPalette';
import { ProjectSetupWizard } from './components/screens/ProjectSetupWizard';
import type { ProjectInstallJob } from './types/localInstaller';

const OverviewScreen = lazy(() =>
  import('./components/screens/OverviewScreen').then((m) => ({ default: m.OverviewScreen }))
);
const RuntimeManagerScreen = lazy(() =>
  import('./components/screens/RuntimeManagerScreen').then((m) => ({ default: m.RuntimeManagerScreen }))
);
const InstallationHistoryScreen = lazy(() =>
  import('./components/screens/SecondaryManagementScreens').then((m) => ({ default: m.InstallationHistoryScreen }))
);
const TechStackScreen = lazy(() =>
  import('./components/screens/SecondaryManagementScreens').then((m) => ({ default: m.TechStackScreen }))
);
const SettingsScreen = lazy(() =>
  import('./components/screens/SecondaryManagementScreens').then((m) => ({ default: m.SettingsScreen }))
);

const SETTINGS_STORAGE_KEY = 'visual_line_interface_settings_v1';
const HISTORY_STORAGE_KEY = 'visual_line_interface_history_v1';

const LEGACY_STORAGE_KEYS: Record<string, string> = {
  [SETTINGS_STORAGE_KEY]: 'visual_cli_studio_settings_v1',
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

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('overview');
  const [inspectorCollapsed, setInspectorCollapsed] = useState(true);
  const [inspectorTarget, setInspectorTarget] = useState<InspectorTarget>({
    type: 'framework',
    id: 'vite',
  });

  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [runtimes, setRuntimes] = useState<RuntimeInfo[]>(INITIAL_RUNTIMES);
  const [packageManagers, setPackageManagers] = useState<PackageManagerInfo[]>(INITIAL_PACKAGE_MANAGERS);
  const [systemProbe, setSystemProbe] = useState<SystemProbeResult | null>(null);
  const packages = STUDIO_PACKAGES;
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

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
        if (Array.isArray(parsed)) {
          return parsed.filter((record) => record.mode === 'Local Installation');
        }
      }
    } catch {
      // Ignore storage error
    }
    return [];
  });

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

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.themeMode;
    root.style.fontSize = `${settings.fontSize}px`;
    root.style.setProperty('--font-sans', `"${settings.bodyFont}", -apple-system, BlinkMacSystemFont, sans-serif`);
    root.style.setProperty('--font-display', `"${settings.accentFont}", "${settings.bodyFont}", sans-serif`);
    root.style.setProperty('--theme-accent', settings.accentColor);
  }, [settings.accentColor, settings.accentFont, settings.bodyFont, settings.fontSize, settings.themeMode]);

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

  const refreshSystemProbe = useCallback(async (reportFailure = false) => {
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
            selectedVersion: match.version ?? '',
            binaryPath: match.binaryPath ?? 'not found on PATH',
            architecture: probe.arch,
            status: match.installed ? 'installed' : 'missing',
          };
        })
      );
      const activeRuntimeVersion = probe.runtimes.find((rt) => rt.id === config.runtime)?.version;
      if (activeRuntimeVersion) {
        setConfig((prev) =>
          prev.runtime === config.runtime
            ? { ...prev, runtimeVersion: activeRuntimeVersion }
            : prev
        );
      }
      setPackageManagers((prev) =>
        prev.map((pm) => {
          const match = probe.packageManagers.find((m) => m.id === pm.id);
          if (!match) return pm;
          return {
            ...pm,
            version: match.version ?? '',
            status: match.installed ? 'installed' : 'missing',
          };
        })
      );
    } catch (error) {
      if (seq === probeSeqRef.current) {
        console.error('Unable to probe the local runtime environment.', error);
      }
      if (reportFailure) throw error;
    }
  }, [config.devPort, config.previewPort, config.runtime]);

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
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

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

  // Keep the setup's optional package selections aligned with its stack.
  const handleUpdateConfig = useCallback((patch: Partial<ProjectConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      // Keep selectedPackageIds synced with project setup selectors
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

      const compatiblePackageIds = new Set(
        packages
          .filter((pkg) => pkg.compatibleFrameworks.includes(next.framework))
          .map((pkg) => pkg.id)
      );
      for (const id of pkgSet) {
        const packageInfo = packages.find((pkg) => pkg.id === id);
        if (packageInfo && !compatiblePackageIds.has(id)) pkgSet.delete(id);
      }

      next.selectedPackageIds = Array.from(pkgSet);
      return next;
    });
  }, [packages]);

  const handleApplyFix = useCallback(
    (issueId: string) => {
      if (issueId === 'invalid-name') {
        handleUpdateConfig({ projectName: `project-${Date.now()}` });
      } else if (issueId === 'swc-non-react' || issueId === 'swc-unsupported-framework') {
        handleUpdateConfig({ compiler: 'standard' });
      } else if (issueId === 'bun-yarn-mismatch') {
        handleUpdateConfig({ packageManager: 'bun' });
      } else if (issueId === 'deno-pnpm-mismatch') {
        const nodeRuntime = runtimes.find((rt) => rt.id === 'node');
        handleUpdateConfig({
          runtime: 'node',
          runtimeVersion: nodeRuntime?.installedVersion ?? '',
        });
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
    [config.devPort, config.selectedPackageIds, handleUpdateConfig, runtimes]
  );

  const handleUpdateRuntimeVersion = (id: RuntimeId, version: string) => {
    setRuntimes((prev) =>
      prev.map((rt) => (rt.id === id ? { ...rt, selectedVersion: version } : rt))
    );
    if (config.runtime === id) {
      handleUpdateConfig({ runtimeVersion: version });
    }
  };

  const handleUpgradeRuntime = async (id: RuntimeId, version: string) => {
    await updateRuntimeVersion(id, version);
    await refreshSystemProbe(true);
  };

  const renderMainScreen = () => {
    switch (activeScreen) {
      case 'overview':
        return (
          <OverviewScreen
            config={config}
            runtimes={runtimes}
            packageManagers={packageManagers}
            history={history}
            onNavigate={setActiveScreen}
            onApplyStack={(profile: StackPresetProfile) => {
              const suggested = profile.recommendation.suggestedConfig;
              const framework = FRAMEWORKS.find((item) => item.id === suggested.framework);
              handleUpdateConfig({
                ...suggested,
                projectType: profile.projectType ?? 'frontend',
                apiFramework: 'express',
                databases: profile.databases ?? [],
                devPort: framework?.defaultPort ?? suggested.devPort,
                compiler: framework?.supportsSwc ? suggested.compiler : 'standard',
              });
              setActiveScreen('project-studio');
            }}
          />
        );
      case 'project-studio':
        return (
          <ProjectSetupWizard
            config={config}
            packageManagers={packageManagers}
            packages={packages}
            onUpdateConfig={handleUpdateConfig}
            onInstallationComplete={(job: ProjectInstallJob) => {
              const started = Date.parse(job.startedAt);
              const completed = Date.parse(job.completedAt ?? new Date().toISOString());
              setHistory((previous) => [
                {
                  id: `hist-${job.id}`,
                  projectName: job.projectName,
                  projectType: job.projectType,
                  fullStackLayout: job.fullStackLayout,
                  frontendPath: job.frontendPath,
                  apiPath: job.apiPath,
                  workspacePath: job.workspacePath,
                  apiFramework: job.apiFramework,
                  framework: job.framework,
                  databases: job.databases,
                  packageManager: job.packageManager,
                  directory: job.projectPath,
                  timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
                  status: job.status === 'completed' ? 'completed' : 'failed',
                  durationSec: Number(Math.max(0, (completed - started) / 1000).toFixed(1)),
                  commandCount: job.steps.length,
                  mode: 'Local Installation',
                },
                ...previous,
              ]);
            }}
          />
        );
      case 'runtimes':
        return (
          <RuntimeManagerScreen
            runtimes={runtimes}
            systemProbe={systemProbe}
            activeRuntimeId={config.runtime}
            onSelectActiveRuntime={(id) => {
              const found = runtimes.find((r) => r.id === id);
              handleUpdateConfig({
                runtime: id,
                runtimeVersion: found?.selectedVersion || found?.installedVersion || '',
              });
            }}
            onUpdateRuntimeVersion={handleUpdateRuntimeVersion}
            onUpgradeRuntime={handleUpgradeRuntime}
            onProbeSystem={refreshSystemProbe}
            packageManagers={packageManagers}
            onInspect={(target) => setInspectorTarget(target)}
          />
        );
      case 'history':
        return (
          <InstallationHistoryScreen
            history={history}
            onClearHistory={() => setHistory([])}
          />
        );
      case 'tech-stack':
        return (
          <TechStackScreen
            onApplyStack={(profile: StackPresetProfile) => {
              const suggested = profile.recommendation.suggestedConfig;
              const framework = FRAMEWORKS.find((item) => item.id === suggested.framework);
              handleUpdateConfig({
                ...suggested,
                projectType: profile.projectType ?? 'frontend',
                apiFramework: 'express',
                databases: profile.databases ?? [],
                devPort: framework?.defaultPort ?? suggested.devPort,
                compiler: framework?.supportsSwc ? suggested.compiler : 'standard',
              });
              setActiveScreen('project-studio');
            }}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            settings={settings}
            providerStatuses={providerStatuses}
            onRefreshAiStatus={refreshAiStatus}
            systemProbe={systemProbe}
            config={config}
            onProbeSystem={refreshSystemProbe}
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
