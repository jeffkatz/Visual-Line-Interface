import React, { useState } from 'react';
import { BarChart3, Check, ExternalLink, RefreshCw, Terminal } from 'lucide-react';
import type {
  InspectorTarget,
  PackageManagerId,
  PackageManagerInfo,
  RuntimeId,
  RuntimeInfo,
  SystemProbeResult,
} from '../../types/studio';
import { PackageManagerMark, RuntimeMark } from '../icons/BrandMarks';
import { StatusIndicator } from '../controls/StatusIndicator';
import { VersionSelector } from '../controls/VersionSelector';
import { TechnicalMeter } from '../controls/TechnicalMeter';
import { PackageManagerBenchmarkChart } from '../charts/StudioCharts';

interface RuntimeManagerScreenProps {
  runtimes: RuntimeInfo[];
  systemProbe: SystemProbeResult | null;
  activeRuntimeId: RuntimeId;
  activePackageManagerId?: PackageManagerId;
  onSelectActiveRuntime: (id: RuntimeId) => void;
  onUpdateRuntimeVersion: (id: RuntimeId, version: string) => void;
  onUpgradeRuntime: (id: RuntimeId) => void;
  onProbeSystem: () => Promise<void>;
  packageManagers: PackageManagerInfo[];
  onInspect: (target: InspectorTarget) => void;
}

export const RuntimeManagerScreen: React.FC<RuntimeManagerScreenProps> = ({
  runtimes,
  systemProbe,
  activeRuntimeId,
  activePackageManagerId,
  onSelectActiveRuntime,
  onUpdateRuntimeVersion,
  onUpgradeRuntime,
  onProbeSystem,
  packageManagers,
  onInspect,
}) => {
  const [rescanning, setRescanning] = useState(false);

  const handleRescan = async () => {
    setRescanning(true);
    try {
      await onProbeSystem();
    } finally {
      setRescanning(false);
    }
  };

  const lastScanTime = systemProbe
    ? `Probed at ${new Date(systemProbe.probedAt).toLocaleTimeString([], { hour12: false })}`
    : 'Awaiting probe…';

  const healthyCount = runtimes.filter((r) => r.status === 'installed').length;

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
            Runtime Manager
          </h1>
          <p className="text-[13px] text-[#929BA5] mt-0.5">
            Inspect detected JavaScript runtimes, active toolchain versions, and PATH binaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11.5px] text-[#626D78]">{lastScanTime}</span>
          <button
            type="button"
            onClick={handleRescan}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[4px] bg-[#252A30] border border-[#343B43] hover:border-[#C7A46A] text-[12.5px] font-medium text-[#F1F3F5] cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C7A46A] ${rescanning ? 'animate-spin' : ''}`} />
            <span>Probe Local PATH</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[1060px] mx-auto flex flex-col gap-6">
          {/* System Environment Summary */}
          <section className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 flex flex-col gap-4 hardware-bezel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A3038] pb-3">
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
                  System Environment Summary
                </h2>
                <p className="text-[12px] text-[#929BA5] mt-0.5">
                  Host hardware profile and resolved PATH availability
                </p>
              </div>
              <StatusIndicator
                tone={healthyCount === runtimes.length ? 'installed' : 'attention'}
                label={
                  healthyCount === runtimes.length
                    ? 'Environment Healthy'
                    : '1 Runtime Update Available'
                }
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-[12px]">
              <div>
                <div className="text-[#626D78] text-[11px]">Operating System</div>
                <div className="font-mono text-[#F1F3F5] mt-0.5 truncate">
                  {systemProbe ? systemProbe.osLabel : 'Detecting…'}
                </div>
              </div>
              <div>
                <div className="text-[#626D78] text-[11px]">Architecture</div>
                <div className="font-mono text-[#F1F3F5] mt-0.5">
                  {systemProbe ? systemProbe.arch : '—'}
                </div>
              </div>
              <div>
                <div className="text-[#626D78] text-[11px]">Detected Runtimes</div>
                <div className="font-mono text-[#65B9A5] mt-0.5 tabular-nums">
                  {healthyCount} / {runtimes.length} active
                </div>
              </div>
              <div>
                <div className="text-[#626D78] text-[11px]">Package Managers</div>
                <div className="font-mono text-[#C7A46A] mt-0.5 tabular-nums">
                  {packageManagers.filter((pm) => pm.status === 'installed').length} / {packageManagers.length} verified
                </div>
              </div>
              <div>
                <div className="text-[#626D78] text-[11px]">PATH Resolution</div>
                <div
                  className="font-mono text-[#70BD92] mt-0.5 truncate"
                  title={systemProbe?.pathSummary}
                >
                  {systemProbe?.pathSummary || 'Resolving PATH…'}
                </div>
              </div>
            </div>

            <TechnicalMeter
              label="Environment Health Index"
              value={healthyCount}
              max={runtimes.length}
              unit="nominal"
              tone={healthyCount === runtimes.length ? 'green' : 'warning'}
              segments={18}
            />
          </section>

          {/* Runtime Panels */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {runtimes.map((rt) => {
              const isActive = activeRuntimeId === rt.id;
              const needsUpdate = rt.installedVersion !== rt.latestVersion;

              return (
                <div
                  key={rt.id}
                  onClick={() => onInspect({ type: 'runtime', id: rt.id })}
                  className={`bg-[#1D2126] border rounded-[5px] p-5 flex flex-col justify-between gap-4 transition-colors hardware-bezel ${
                    isActive ? 'border-[#C7A46A]' : 'border-[#343B43] hover:border-[#46505B]'
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[4px] bg-[#101214] border border-[#2C323A] flex items-center justify-center">
                          <RuntimeMark id={rt.id} className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-semibold text-[#F1F3F5]">{rt.name}</h3>
                          <div className="font-mono text-[11px] text-[#626D78]">{rt.manager}</div>
                        </div>
                      </div>

                      <StatusIndicator tone={rt.status} compact />
                    </div>

                    <VersionSelector
                      label="Managed Version"
                      installedVersion={rt.installedVersion}
                      latestVersion={rt.latestVersion}
                      selectedVersion={rt.selectedVersion}
                      options={rt.availableVersions}
                      status={rt.status}
                      onChange={(v) => onUpdateRuntimeVersion(rt.id, v)}
                      onUpgrade={() => onUpgradeRuntime(rt.id)}
                    />

                    <div className="bg-[#14171B] border border-[#262B32] rounded p-3 flex flex-col gap-1.5 text-[11.5px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#626D78]">Binary Path</span>
                        <span className="font-mono text-[#929BA5] truncate max-w-[170px]">
                          {rt.binaryPath}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#626D78]">Target Arch</span>
                        <span className="font-mono text-[#929BA5]">{rt.architecture}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#626D78]">Active Default</span>
                        <span className="font-mono text-[#F1F3F5]">
                          {isActive ? 'Primary Studio Target' : 'Standby'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[12px] text-[#929BA5] leading-snug">{rt.notes}</p>

                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <a
                        href={rt.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[#77A9DC] hover:text-[#F1F3F5] transition-colors"
                      >
                        <span>Official Docs</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {rt.releaseNotesUrl && (
                        <a
                          href={rt.releaseNotesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[#929BA5] hover:text-[#F1F3F5] transition-colors"
                        >
                          <span>Release Notes</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#2A3038]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectActiveRuntime(rt.id);
                      }}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border text-[12px] font-medium cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#252A30] border-[#C7A46A] text-[#C7A46A]'
                          : 'bg-[#171A1E] border-[#343B43] hover:border-[#49535E] text-[#F1F3F5]'
                      }`}
                    >
                      {isActive && <Check className="w-3.5 h-3.5" />}
                      <span>{isActive ? 'Active Environment' : 'Set as Active'}</span>
                    </button>

                    {needsUpdate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpgradeRuntime(rt.id);
                        }}
                        className="px-3 py-2 rounded-[4px] bg-[#C7A46A] hover:bg-[#D2B27C] text-[#101214] text-[12px] font-semibold cursor-pointer transition-colors"
                      >
                        Update
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Detected Package Managers Table */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-[#262B32] pb-2">
              <Terminal className="w-4 h-4 text-[#C7A46A]" />
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
                Detected Package Managers
              </h2>
            </div>

            <div className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-4 flex flex-col gap-3 hardware-bezel">
              <div className="flex items-center justify-between border-b border-[#2A3038] pb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#C7A46A]" />
                  <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[#F1F3F5]">
                    Install Latency Profile (Cold vs. Warm Cache)
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#626D78]">
                  Active PM highlighted in brass
                </span>
              </div>
              <PackageManagerBenchmarkChart
                packageManagers={packageManagers}
                activePmId={activePackageManagerId}
              />
            </div>

            <div className="bg-[#171A1E] border border-[#2D333B] rounded-[5px] overflow-hidden">
              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-[#2A3038] bg-[#14171B] text-[11px] font-mono uppercase text-[#626D78]">
                    <th className="py-2.5 px-4 font-medium">Manager</th>
                    <th className="py-2.5 px-4 font-medium">Installed</th>
                    <th className="py-2.5 px-4 font-medium">Latest</th>
                    <th className="py-2.5 px-4 font-medium">Lockfile</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium text-right">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {packageManagers.map((pm) => (
                    <tr
                      key={pm.id}
                      onClick={() => onInspect({ type: 'package-manager', id: pm.id })}
                      className="border-b border-[#23282E] last:border-b-0 hover:bg-[#1D2126] cursor-pointer"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5 font-medium text-[#F1F3F5]">
                          <PackageManagerMark id={pm.id} className="w-4 h-4" />
                          <span>{pm.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[#F1F3F5]">v{pm.version}</td>
                      <td className="py-2.5 px-4 font-mono text-[#929BA5]">v{pm.latestVersion}</td>
                      <td className="py-2.5 px-4 font-mono text-[#C7A46A]">{pm.lockfile}</td>
                      <td className="py-2.5 px-4">
                        <StatusIndicator tone={pm.status} compact />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <a
                          href={pm.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-[#77A9DC] hover:text-[#F1F3F5] transition-colors"
                        >
                          <span>Docs</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
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
