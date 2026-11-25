import React from 'react';
import { ArrowRight, Database, FolderKanban, History, Layers } from 'lucide-react';
import type {
  HistoryRecord,
  PackageManagerInfo,
  ProjectConfig,
  RuntimeInfo,
  StackPresetProfile,
  ScreenId,
} from '../../types/studio';
import { FRAMEWORKS } from '../../data/studioCatalog';
import { CURATED_STACK_RECOMMENDATIONS } from '../../data/stackAdvisor';
import { DATABASE_OPTIONS } from '../../data/databases';
import { FrameworkMark, RuntimeMark } from '../icons/BrandMarks';
import { StatusIndicator } from '../controls/StatusIndicator';
import { TechnicalMeter } from '../controls/TechnicalMeter';

interface OverviewScreenProps {
  config: ProjectConfig;
  runtimes: RuntimeInfo[];
  packageManagers: PackageManagerInfo[];
  history: HistoryRecord[];
  onNavigate: (screen: ScreenId) => void;
  onApplyStack: (profile: StackPresetProfile) => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  config,
  runtimes,
  packageManagers,
  history,
  onNavigate,
  onApplyStack,
}) => {
  const activeFramework = FRAMEWORKS.find((f) => f.id === config.framework) ?? FRAMEWORKS[0];
  const installedRuntimesCount = runtimes.filter((r) => r.installedVersion !== null).length;
  const installedPackageManagersCount = packageManagers.filter((pm) => pm.status === 'installed').length;
  const draftReady = Boolean(config.projectName.trim() && config.directory.trim());
  const projectTypeLabel =
    config.projectType === 'api'
      ? 'API only'
      : config.projectType === 'fullstack'
        ? 'Full-stack'
        : 'Frontend only';
  const includesFrontend = config.projectType !== 'api';
  const includesApi = config.projectType !== 'frontend';

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
            Workstation Overview
          </h1>
          <p className="text-[13px] text-[#929BA5] mt-0.5">
            Check your local toolchain, create frontend or API projects, and return to installed workspaces.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('project-studio')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#C7A46A] hover:bg-[#D2B27C] text-[#101214] text-[12.5px] font-semibold uppercase tracking-wide cursor-pointer transition-colors"
        >
          <FolderKanban className="w-4 h-4" />
          <span>Create New Project</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[1060px] mx-auto flex flex-col gap-7">
          {/* Active Configuration Summary & Environment Readiness */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 flex flex-col justify-between gap-4 hardware-bezel">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[4px] bg-[#252A30] border border-[#C7A46A]/50 flex items-center justify-center">
                    {includesFrontend ? (
                      <FrameworkMark id={activeFramework.id} active className="w-5 h-5" />
                    ) : (
                      <FolderKanban className="w-5 h-5 text-[#C7A46A]" />
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
                      Current project setup
                    </div>
                    <h2 className="text-[17px] font-semibold text-[#F1F3F5]">
                      {config.projectName || 'Name your project'}
                    </h2>
                  </div>
                </div>
                <StatusIndicator
                  tone={draftReady ? 'installed' : 'attention'}
                  label={draftReady ? 'Ready to install' : 'Setup needed'}
                  compact
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-3 border-y border-[#2A3038] text-[12px]">
                <div>
                  <div className="text-[#626D78] text-[11px]">Project type</div>
                  <div className="font-mono text-[#F1F3F5] mt-0.5">{projectTypeLabel}</div>
                </div>
                <div>
                  <div className="text-[#626D78] text-[11px]">Frontend</div>
                  <div className="font-mono text-[#F1F3F5] mt-0.5">
                    {includesFrontend ? activeFramework.name : 'Not included'}
                  </div>
                </div>
                <div>
                  <div className="text-[#626D78] text-[11px]">API</div>
                  <div className="font-mono text-[#F1F3F5] mt-0.5">
                    {includesApi ? 'Express' : 'Not included'}
                  </div>
                </div>
                <div>
                  <div className="text-[#626D78] text-[11px]">Language</div>
                  <div className="font-mono text-[#F1F3F5] mt-0.5 capitalize">
                    {includesApi ? 'TypeScript' : config.language}
                  </div>
                </div>
                <div>
                  <div className="text-[#626D78] text-[11px]">Frontend add-ons</div>
                  <div className="font-mono text-[#65B9A5] mt-0.5 tabular-nums">
                    {includesFrontend ? `${config.selectedPackageIds.length} selected` : 'Not applicable'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[11.5px] text-[#929BA5]">
                  {config.directory ? `Destination: ${config.directory}` : 'Choose a destination when creating the project'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('project-studio')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#252A30] border border-[#C7A46A]/60 text-[12px] font-medium text-[#F1F3F5] cursor-pointer"
                  >
                    <span>Configure</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C7A46A]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Readiness Meter Panel */}
            <div className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 flex flex-col justify-between gap-4 hardware-bezel">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#F1F3F5]">
                  System Readiness
                </h2>
              </div>

              <div className="flex flex-col gap-3.5">
                <TechnicalMeter
                  label="Detected Runtimes"
                  value={installedRuntimesCount}
                  max={runtimes.length}
                  tone="green"
                  segments={12}
                />
                <TechnicalMeter
                  label="Detected Package Managers"
                  value={installedPackageManagersCount}
                  max={packageManagers.length}
                  tone="brass"
                  segments={12}
                />
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#2A3038]">
                {runtimes.map((rt) => (
                  <div key={rt.id} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2 text-[#929BA5]">
                      <RuntimeMark id={rt.id} className="w-3.5 h-3.5" />
                      <span>{rt.name}</span>
                    </span>
                    <span className="font-mono text-[#F1F3F5] tabular-nums">
                      {rt.installedVersion ?? 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Tech Stacks */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#262B32] pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C7A46A]" />
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
                  Recommended Tech Stacks
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tech-stack')}
                className="text-[12px] text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer"
              >
                Explore stacks →
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {CURATED_STACK_RECOMMENDATIONS.slice(-3).map((profile) => (
                <div
                  key={profile.id}
                  className="flex flex-col justify-between gap-3 rounded-[5px] border border-[#2D333B] bg-[#171A1E] p-4"
                >
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#F1F3F5]">{profile.title}</h3>
                    <p className="mt-1 text-[10px] font-mono text-[#C7A46A]">{profile.audience}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-[#929BA5]">{profile.recommendation.summary}</p>
                    {profile.databases && profile.databases.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#929BA5]">
                        <Database className="h-3 w-3 text-[#65B9A5]" />
                        {profile.databases.map((database) => DATABASE_OPTIONS.find((option) => option.id === database)?.name).filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onApplyStack(profile)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-[4px] border border-[#C7A46A]/60 bg-[#252A30] px-3 py-1.5 text-[11px] font-medium text-[#F1F3F5] hover:border-[#C7A46A]"
                  >
                    <span>Use stack</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Recent installations */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#262B32] pb-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#65B9A5]" />
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
                  Recent installations
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('history')}
                className="text-[12px] text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer"
              >
                View installed projects →
              </button>
            </div>

            <div className="bg-[#171A1E] border border-[#2D333B] rounded-[5px] overflow-hidden">
              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-[#2A3038] bg-[#14171B] text-[11px] font-mono uppercase text-[#626D78]">
                    <th className="py-2.5 px-4 font-medium">Project</th>
                    <th className="py-2.5 px-4 font-medium">Stack</th>
                    <th className="py-2.5 px-4 font-medium">Mode</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium text-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-5 px-4 text-center text-[#929BA5]">
                        No installed projects yet. Create a project to see it here.
                      </td>
                    </tr>
                  ) : history.slice(0, 4).map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#23282E] last:border-b-0 hover:bg-[#1D2126]"
                    >
                      <td className="py-2.5 px-4 font-mono text-[#F1F3F5]">{item.projectName}</td>
                      <td className="py-2.5 px-4 text-[#929BA5]">
                        {item.framework} · {item.packageManager}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11.5px] text-[#929BA5]">
                        {item.mode}
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
                          label={item.status === 'completed' ? 'Completed' : item.status === 'failed' ? 'Failed' : 'Cancelled'}
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
