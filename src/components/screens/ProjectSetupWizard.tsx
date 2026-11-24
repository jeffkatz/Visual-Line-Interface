import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FolderOpen,
  LoaderCircle,
  Package,
  Play,
} from 'lucide-react';
import type {
  FrameworkId,
  LanguageId,
  PackageManagerInfo,
  ProjectConfig,
  StudioPackage,
} from '../../types/studio';
import type { ProjectInstallJob } from '../../types/localInstaller';
import { FRAMEWORKS } from '../../data/studioCatalog';
import { chooseLocalDirectory, fetchProjectInstall, startProjectInstall } from '../../services/localInstallerClient';
import { FrameworkMark } from '../icons/BrandMarks';

interface ProjectSetupWizardProps {
  config: ProjectConfig;
  packageManagers: PackageManagerInfo[];
  packages: StudioPackage[];
  onUpdateConfig: (patch: Partial<ProjectConfig>) => void;
  onInstallationComplete: (job: ProjectInstallJob) => void;
}

const STEPS = ['Choose stack', 'Project location', 'Add packages', 'Review & install'];

function StepStatus({ status }: { status: ProjectInstallJob['steps'][number]['status'] }) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-[#65B9A5]" />;
  if (status === 'running') return <LoaderCircle className="h-4 w-4 animate-spin text-[#C7A46A]" />;
  if (status === 'failed') return <AlertCircle className="h-4 w-4 text-[#DF7777]" />;
  return <span className="h-4 w-4 rounded-full border border-[#48525E]" />;
}

export const ProjectSetupWizard: React.FC<ProjectSetupWizardProps> = ({
  config,
  packageManagers,
  packages,
  onUpdateConfig,
  onInstallationComplete,
}) => {
  const [step, setStep] = useState(0);
  const [directory, setDirectory] = useState('');
  const [choosingDirectory, setChoosingDirectory] = useState(false);
  const [startingInstall, setStartingInstall] = useState(false);
  const [job, setJob] = useState<ProjectInstallJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportedJobRef = useRef<string | null>(null);

  const selectedFramework = FRAMEWORKS.find((item) => item.id === config.framework) ?? FRAMEWORKS[0];
  const selectedManager = packageManagers.find((item) => item.id === 'npm');
  const isProjectNameValid = /^[a-z0-9][a-z0-9._-]{0,99}$/i.test(config.projectName.trim());
  const selectedPackages = useMemo(
    () => packages.filter((pkg) => config.selectedPackageIds.includes(pkg.id)),
    [packages, config.selectedPackageIds]
  );
  const projectPath =
    directory && config.projectName.trim()
      ? `${directory.replace(/[\\/]+$/, '')}${directory.includes('\\') ? '\\' : '/'}${config.projectName.trim()}`
      : '';

  useEffect(() => {
    if (!job || job.status === 'running' || reportedJobRef.current === job.id) return;
    reportedJobRef.current = job.id;
    onInstallationComplete(job);
  }, [job, onInstallationComplete]);

  useEffect(() => {
    if (!job || job.status !== 'running') return;
    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const latest = await fetchProjectInstall(job.id);
        if (cancelled) return;
        setJob(latest);
        if (latest.status === 'running') {
          timer = window.setTimeout(poll, 800);
        }
      } catch (pollError) {
        if (!cancelled) {
          setError(pollError instanceof Error ? pollError.message : 'Unable to read installation progress.');
        }
      }
    };

    timer = window.setTimeout(poll, 500);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [job?.id, job?.status]);

  const handleChooseDirectory = async () => {
    setChoosingDirectory(true);
    setError(null);
    try {
      const selected = await chooseLocalDirectory();
      if (selected) {
        setDirectory(selected);
        onUpdateConfig({ directory: selected });
      }
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : 'Unable to choose a destination folder.');
    } finally {
      setChoosingDirectory(false);
    }
  };

  const handleStartInstall = async () => {
    setStartingInstall(true);
    setError(null);
    setJob(null);
    reportedJobRef.current = null;
    try {
      const started = await startProjectInstall(directory, config, packages);
      setJob(started);
    } catch (installError) {
      setError(installError instanceof Error ? installError.message : 'Unable to start installation.');
    } finally {
      setStartingInstall(false);
    }
  };

  const togglePackage = (pkg: StudioPackage) => {
    const selected = config.selectedPackageIds.includes(pkg.id);
    const selectedPackageIds = selected
      ? config.selectedPackageIds.filter((id) => id !== pkg.id)
      : [...config.selectedPackageIds, pkg.id];
    onUpdateConfig({ selectedPackageIds });
  };

  const canContinue =
    step === 0
      ? true
      : step === 1
      ? isProjectNameValid && Boolean(directory)
      : step === 2
      ? Boolean(selectedManager?.status === 'installed')
      : true;

  return (
    <div className="flex h-full flex-col bg-[#101214]">
      <header className="shrink-0 border-b border-[#2A3038] bg-[#14171B] px-6 py-5">
        <div className="mx-auto max-w-[920px]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C7A46A]">
            Local project setup
          </div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-[#F1F3F5]">
            Create a project
          </h1>
          <p className="mt-1 text-[13px] text-[#929BA5]">
            Choose a stack, select a folder, review packages, then install on this computer.
          </p>
          <nav aria-label="Project setup steps" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STEPS.map((label, index) => {
              const active = step === index;
              const complete = index < step;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={index > step || Boolean(job?.status === 'running')}
                  onClick={() => setStep(index)}
                  aria-current={active ? 'step' : undefined}
                  className={`flex items-center gap-2 rounded border px-3 py-2 text-left text-[12px] transition-colors disabled:cursor-not-allowed ${
                    active
                      ? 'border-[#C7A46A] bg-[#252A30] text-[#F1F3F5]'
                      : complete
                      ? 'border-[#65B9A5]/50 text-[#65B9A5]'
                      : 'border-[#2A3038] text-[#626D78]'
                  }`}
                >
                  <span className="font-mono">{complete ? <Check className="h-3.5 w-3.5" /> : `0${index + 1}`}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-[920px] flex-col gap-5">
          {step === 0 && (
            <section aria-labelledby="stack-title" className="flex flex-col gap-4">
              <div>
                <h2 id="stack-title" className="text-[16px] font-semibold text-[#F1F3F5]">
                  1. Choose your framework
                </h2>
                <p className="mt-1 text-[12px] text-[#929BA5]">
                  Start with a familiar template. You can add libraries in the next step.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {FRAMEWORKS.map((framework) => {
                  const active = config.framework === framework.id;
                  return (
                    <button
                      key={framework.id}
                      type="button"
                      onClick={() => onUpdateConfig({ framework: framework.id as FrameworkId })}
                      aria-pressed={active}
                      className={`rounded border p-4 text-left transition-colors ${
                        active
                          ? 'border-[#C7A46A] bg-[#1D2126]'
                          : 'border-[#2D333B] bg-[#171A1E] hover:border-[#48525E]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <FrameworkMark id={framework.id} active={active} className="h-5 w-5" />
                        {active && <CheckCircle2 className="h-4 w-4 text-[#C7A46A]" />}
                      </div>
                      <div className="mt-3 text-[14px] font-semibold text-[#F1F3F5]">{framework.name}</div>
                      <div className="mt-1 text-[12px] leading-relaxed text-[#929BA5]">{framework.tagline}</div>
                    </button>
                  );
                })}
              </div>

              {config.framework === 'vite' && (
                <div className="rounded border border-[#2D333B] bg-[#171A1E] p-4">
                  <label htmlFor="vite-ui" className="mb-2 block text-[12px] font-medium text-[#F1F3F5]">
                    Vite template
                  </label>
                  <select
                    id="vite-ui"
                    value={config.viteUiFramework}
                    onChange={(event) => onUpdateConfig({ viteUiFramework: event.target.value as ProjectConfig['viteUiFramework'] })}
                    className="w-full rounded border border-[#343B43] bg-[#101214] px-3 py-2 text-[13px] text-[#F1F3F5]"
                  >
                    {(['react', 'vue', 'svelte', 'solid', 'vanilla'] as const).map((value) => (
                      <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>
                    ))}
                  </select>
                </div>
              )}
              <fieldset className="rounded border border-[#2D333B] bg-[#171A1E] p-4">
                <legend className="px-1 text-[12px] font-medium text-[#F1F3F5]">Language</legend>
                <div className="flex gap-2">
                  {(['typescript', 'javascript'] as const).map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => onUpdateConfig({ language: language as LanguageId })}
                      aria-pressed={config.language === language}
                      className={`rounded border px-3 py-2 text-[12px] capitalize ${
                        config.language === language
                          ? 'border-[#C7A46A] bg-[#252A30] text-[#F1F3F5]'
                          : 'border-[#343B43] text-[#929BA5]'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </fieldset>
            </section>
          )}

          {step === 1 && (
            <section aria-labelledby="location-title" className="flex flex-col gap-4">
              <div>
                <h2 id="location-title" className="text-[16px] font-semibold text-[#F1F3F5]">
                  2. Choose the project location
                </h2>
                <p className="mt-1 text-[12px] text-[#929BA5]">
                  The project will be created as a new folder inside the location you select.
                </p>
              </div>
              <label className="flex flex-col gap-1.5 text-[12px] font-medium text-[#F1F3F5]">
                Project folder name
                <input
                  value={config.projectName}
                  onChange={(event) => onUpdateConfig({ projectName: event.target.value })}
                  autoComplete="off"
                  spellCheck={false}
                  className="rounded border border-[#343B43] bg-[#101214] px-3 py-2.5 font-mono text-[13px] text-[#F1F3F5] outline-none focus:border-[#C7A46A]"
                  aria-invalid={!isProjectNameValid}
                />
                {!isProjectNameValid && (
                  <span className="text-[11px] text-[#DF7777]">
                    Use letters, numbers, dots, underscores, or hyphens; start with a letter or number.
                  </span>
                )}
              </label>
              <div className="rounded border border-[#2D333B] bg-[#171A1E] p-4">
                <div className="text-[12px] font-medium text-[#F1F3F5]">Parent folder</div>
                <div className="mt-1 break-all font-mono text-[12px] text-[#929BA5]">
                  {directory || 'No folder selected'}
                </div>
                <button
                  type="button"
                  onClick={handleChooseDirectory}
                  disabled={choosingDirectory || Boolean(job?.status === 'running')}
                  className="mt-3 inline-flex items-center gap-2 rounded border border-[#C7A46A]/70 bg-[#252A30] px-3.5 py-2 text-[12px] font-medium text-[#F1F3F5] hover:border-[#C7A46A] disabled:opacity-50"
                >
                  {choosingDirectory ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4 text-[#C7A46A]" />}
                  {choosingDirectory ? 'Waiting for folder selection…' : directory ? 'Choose another folder' : 'Select a local folder'}
                </button>
                <p className="mt-2 text-[11px] leading-relaxed text-[#626D78]">
                  A system folder picker opens on this computer. Existing project folders are never overwritten.
                </p>
              </div>
              {projectPath && (
                <div className="rounded border border-[#65B9A5]/40 bg-[#65B9A5]/5 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-[#65B9A5]">Project will be created at</div>
                  <div className="mt-1 break-all font-mono text-[12px] text-[#F1F3F5]">{projectPath}</div>
                </div>
              )}
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="packages-title" className="flex flex-col gap-4">
              <div>
                <h2 id="packages-title" className="text-[16px] font-semibold text-[#F1F3F5]">
                  3. Add optional packages
                </h2>
                <p className="mt-1 text-[12px] text-[#929BA5]">
                  The installer currently uses npm through the Node.js runtime without opening a shell.
                </p>
              </div>
              <div className="flex items-center justify-between rounded border border-[#2D333B] bg-[#171A1E] p-4">
                <div>
                  <div className="text-[13px] font-medium text-[#F1F3F5]">npm</div>
                  <div className="mt-0.5 font-mono text-[10px] text-[#626D78]">
                    {selectedManager?.status === 'installed'
                      ? selectedManager.version
                        ? `v${selectedManager.version}`
                        : 'Installed'
                      : 'Not detected'}
                  </div>
                </div>
                <span className={`text-[11px] ${selectedManager?.status === 'installed' ? 'text-[#65B9A5]' : 'text-[#DF7777]'}`}>
                  {selectedManager?.status === 'installed' ? 'Ready to install' : 'Node.js + npm required'}
                </span>
              </div>

              <div className="rounded border border-[#2D333B] bg-[#171A1E]">
                <div className="flex items-center justify-between border-b border-[#2A3038] px-4 py-3">
                  <div>
                    <div className="text-[13px] font-medium text-[#F1F3F5]">Optional packages</div>
                    <div className="mt-0.5 text-[11px] text-[#929BA5]">Pinned to the versions shown</div>
                  </div>
                  <span className="font-mono text-[11px] text-[#C7A46A]">{selectedPackages.length} selected</span>
                </div>
                <div className="divide-y divide-[#242A30]">
                  {packages.map((pkg) => {
                    const checked = config.selectedPackageIds.includes(pkg.id);
                    return (
                      <label key={pkg.id} className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-[#1D2126]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePackage(pkg)}
                          className="mt-0.5 accent-[#C7A46A]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12px] font-medium text-[#F1F3F5]">{pkg.name}</span>
                          <span className="block truncate font-mono text-[10.5px] text-[#626D78]">
                            {pkg.npmName}@{pkg.version} · {pkg.isDevDependency ? 'development' : 'runtime'}
                          </span>
                        </span>
                        <Package className="h-3.5 w-3.5 shrink-0 text-[#626D78]" />
                      </label>
                    );
                  })}
                </div>
              </div>
              {!selectedManager || selectedManager.status !== 'installed' ? (
                <div role="alert" className="rounded border border-[#DF7777]/50 bg-[#DF7777]/5 p-3 text-[12px] text-[#DF7777]">
                  Install Node.js with npm on this computer, then refresh system detection before continuing.
                </div>
              ) : null}
            </section>
          )}

          {step === 3 && (
            <section aria-labelledby="review-title" className="flex flex-col gap-4">
              <div>
                <h2 id="review-title" className="text-[16px] font-semibold text-[#F1F3F5]">
                  4. Review and install
                </h2>
                <p className="mt-1 text-[12px] text-[#929BA5]">
                  The local installer runs the framework scaffold and package manager steps shown below.
                </p>
              </div>
              <div className="grid gap-3 rounded border border-[#2D333B] bg-[#171A1E] p-4 sm:grid-cols-2">
                <div><div className="text-[11px] text-[#626D78]">Framework</div><div className="mt-1 text-[13px] text-[#F1F3F5]">{selectedFramework.name} · {config.language}</div></div>
                <div><div className="text-[11px] text-[#626D78]">Package manager</div><div className="mt-1 text-[13px] text-[#F1F3F5]">npm</div></div>
                <div className="sm:col-span-2"><div className="text-[11px] text-[#626D78]">Destination</div><div className="mt-1 break-all font-mono text-[12px] text-[#F1F3F5]">{projectPath}</div></div>
                <div className="sm:col-span-2"><div className="text-[11px] text-[#626D78]">Selected packages</div><div className="mt-1 text-[12px] text-[#F1F3F5]">{selectedPackages.length ? selectedPackages.map((pkg) => `${pkg.npmName}@${pkg.version}`).join(', ') : 'None'}</div></div>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded border border-[#DF7777]/50 bg-[#DF7777]/5 p-3 text-[12px] text-[#DF7777]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {job && (
                <div aria-live="polite" className="rounded border border-[#2D333B] bg-[#171A1E]">
                  <div className="flex items-center justify-between border-b border-[#2A3038] px-4 py-3">
                    <div className="text-[13px] font-medium text-[#F1F3F5]">
                      {job.status === 'running' ? 'Installing project…' : job.status === 'completed' ? 'Installation complete' : 'Installation failed'}
                    </div>
                    <span className="font-mono text-[11px] text-[#929BA5]">{job.steps.filter((item) => item.status === 'completed').length}/{job.steps.length} steps</span>
                  </div>
                  <div className="divide-y divide-[#242A30]">
                    {job.steps.map((item) => (
                      <div key={item.id} className="px-4 py-3">
                        <div className="flex items-center gap-2 text-[12px] text-[#F1F3F5]">
                          <StepStatus status={item.status} />
                          <span className="flex-1">{item.label}</span>
                          {item.durationMs > 0 && <span className="font-mono text-[10px] text-[#626D78]">{(item.durationMs / 1000).toFixed(1)}s</span>}
                        </div>
                        {item.outputLines.length > 0 && (
                          <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap break-words rounded bg-[#101214] p-2 font-mono text-[10.5px] leading-relaxed text-[#929BA5]">
                            {item.outputLines.slice(-6).join('\n')}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                  {job.error && <div role="alert" className="border-t border-[#DF7777]/30 px-4 py-3 text-[12px] text-[#DF7777]">{job.error}</div>}
                  {job.status === 'completed' && (
                    <div className="border-t border-[#65B9A5]/30 px-4 py-3 text-[12px] text-[#65B9A5]">
                      Created at <span className="font-mono">{job.projectPath}</span>. Open it in your editor and run the project’s dev script to start working.
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          <div className="flex items-center justify-between border-t border-[#2A3038] pt-4">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0 || Boolean(job?.status === 'running')}
              className="inline-flex items-center gap-2 rounded border border-[#343B43] px-3.5 py-2 text-[12px] text-[#929BA5] hover:text-[#F1F3F5] disabled:invisible"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((current) => Math.min(3, current + 1))}
                disabled={!canContinue}
                className="inline-flex items-center gap-2 rounded bg-[#C7A46A] px-4 py-2 text-[12px] font-semibold text-[#101214] hover:bg-[#D2B27C] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartInstall}
                disabled={!directory || !isProjectNameValid || !selectedManager || selectedManager.status !== 'installed' || startingInstall || job?.status === 'running'}
                className="inline-flex items-center gap-2 rounded bg-[#C7A46A] px-4 py-2 text-[12px] font-semibold text-[#101214] hover:bg-[#D2B27C] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {startingInstall || job?.status === 'running' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                {startingInstall || job?.status === 'running' ? 'Installing…' : job?.status === 'completed' ? 'Install another project' : 'Install project'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
