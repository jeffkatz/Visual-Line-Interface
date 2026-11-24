import React from 'react';
import { ArrowRight, BarChart3, BookMarked, FolderKanban, History, Package, Play } from 'lucide-react';
import type {
  ExecutionCommandStep,
  HistoryRecord,
  PackageManagerInfo,
  ProjectConfig,
  RuntimeInfo,
  SavedRecipe,
  ScreenId,
} from '../../types/studio';
import { FRAMEWORKS } from '../../data/studioCatalog';
import { FrameworkMark, RuntimeMark } from '../icons/BrandMarks';
import { StatusIndicator } from '../controls/StatusIndicator';
import { TechnicalMeter } from '../controls/TechnicalMeter';
import { HistoryDurationChart, PipelinePhaseChart } from '../charts/StudioCharts';

interface OverviewScreenProps {
  config: ProjectConfig;
  runtimes: RuntimeInfo[];
  packageManagers: PackageManagerInfo[];
  executionPlan: ExecutionCommandStep[];
  recipes: SavedRecipe[];
  history: HistoryRecord[];
  onNavigate: (screen: ScreenId) => void;
  onLoadRecipe: (recipe: SavedRecipe) => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  config,
  runtimes,
  packageManagers,
  executionPlan,
  recipes,
  history,
  onNavigate,
  onLoadRecipe,
}) => {
  const activeFramework = FRAMEWORKS.find((f) => f.id === config.framework) ?? FRAMEWORKS[0];
  const installedRuntimesCount = runtimes.filter((r) => r.installedVersion !== null).length;

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
            Workstation Overview
          </h1>
          <p className="text-[13px] text-[#929BA5] mt-0.5">
            Local toolchain readiness, active project profile, and reproducible recipes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('project-studio')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#C7A46A] hover:bg-[#D2B27C] text-[#101214] text-[12.5px] font-semibold uppercase tracking-wide cursor-pointer transition-colors"
        >
          <FolderKanban className="w-4 h-4" />
          <span>Open Project Studio</span>
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
                    <FrameworkMark id={activeFramework.id} active className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
                      Active Draft Configuration
                    </div>
                    <h2 className="text-[17px] font-semibold text-[#F1F3F5]">
                      {config.projectName || 'my-awesome-app'}
                    </h2>
                  </div>
                </div>
                <StatusIndicator tone="installed" label="Ready to scaffold" compact />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-[#2A3038] text-[12px]">
                <div>
                  <div className="text-[#626D78] text-[11px]">Foundation</div>
                  <div className="font-mono text-[#F1F3F5] mt-0.5">{activeFramework.name}</div>
                </div>
                <div>
                  <div className="text-[#626D78] text-[11px]">Language</div>
                  <div className="font-mono text-[#F1F3F5] mt-0.5 capitalize">{config.language}</div>
                </div>
                <div>
                  <div className="text-[#626D78] text-[11px]">Package Manager</div>
                  <div className="font-mono text-[#C7A46A] mt-0.5">{config.packageManager}</div>
                </div>
                <div>
                  <div className="text-[#626D78] text-[11px]">Queued Libraries</div>
                  <div className="font-mono text-[#65B9A5] mt-0.5 tabular-nums">
                    {config.selectedPackageIds.length} packages
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[11.5px] text-[#929BA5]">
                  Target: {config.directory}/{config.projectName}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('packages')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#171A1E] border border-[#343B43] hover:border-[#49535E] text-[12px] text-[#F1F3F5] cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5 text-[#C7A46A]" />
                    <span>Packages</span>
                  </button>
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
                <button
                  type="button"
                  onClick={() => onNavigate('runtimes')}
                  className="text-[11.5px] text-[#C7A46A] hover:underline cursor-pointer"
                >
                  Inspect →
                </button>
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
                  label="Package Managers"
                  value={packageManagers.length}
                  max={4}
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

          {/* Pipeline & Execution Visualizations */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 flex flex-col gap-3 hardware-bezel">
              <div className="flex items-center justify-between border-b border-[#2A3038] pb-2.5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#C7A46A]" />
                  <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[#F1F3F5]">
                    Active Pipeline Phase Breakdown
                  </h2>
                </div>
                <span className="font-mono text-[11px] text-[#626D78] tabular-nums">
                  {executionPlan.length} ops · ~{executionPlan.reduce((a, b) => a + b.estimatedSec, 0)}s
                </span>
              </div>
              <PipelinePhaseChart steps={executionPlan} />
            </div>

            <div className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 flex flex-col gap-3 hardware-bezel">
              <div className="flex items-center justify-between border-b border-[#2A3038] pb-2.5">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#65B9A5]" />
                  <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[#F1F3F5]">
                    Recorded Build Duration Trend
                  </h2>
                </div>
                <span className="font-mono text-[11px] text-[#626D78] tabular-nums">
                  {history.length} run{history.length === 1 ? '' : 's'}
                </span>
              </div>
              <HistoryDurationChart history={history} />
            </div>
          </section>

          {/* Saved Project Recipes */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#262B32] pb-2">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-[#C7A46A]" />
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
                  Quick-Load Project Recipes
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('recipes')}
                className="text-[12px] text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer"
              >
                All recipes ({recipes.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recipes.slice(0, 3).map((rec) => (
                <div
                  key={rec.id}
                  className="bg-[#171A1E] border border-[#2D333B] hover:border-[#3E4752] rounded-[5px] p-4 flex flex-col justify-between gap-4 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <FrameworkMark id={rec.config.framework} className="w-4.5 h-4.5" />
                      <span className="font-mono text-[11px] text-[#626D78]">
                        {rec.stepCount} ops · {rec.config.packageManager}
                      </span>
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#F1F3F5]">{rec.name}</h3>
                    <p className="text-[12px] text-[#929BA5] mt-1 leading-snug">{rec.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onLoadRecipe(rec)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#252A30] border border-[#343B43] hover:border-[#C7A46A] text-[12px] font-medium text-[#F1F3F5] cursor-pointer transition-colors"
                  >
                    <Play className="w-3 h-3 text-[#C7A46A]" />
                    <span>Load into Project Studio</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Installation Runs */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#262B32] pb-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#65B9A5]" />
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
                  Recent Operations
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('history')}
                className="text-[12px] text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer"
              >
                View history →
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
                  {history.slice(0, 4).map((item) => (
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
