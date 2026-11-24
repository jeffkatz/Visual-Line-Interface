import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Cpu,
  FolderOpen,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Square,
  Terminal,
} from 'lucide-react';
import type {
  AiDiagnosticResponse,
  ExecutionStepState,
  OperationLogEntry,
  StudioSettings,
} from '../../types/studio';
import { requestAiAudit } from '../../services/aiClient';
import { AI_PROVIDERS } from '../../data/aiProviders';
import { StatusIndicator } from '../controls/StatusIndicator';
import { TechnicalMeter } from '../controls/TechnicalMeter';
import { MechanicalToggle } from '../controls/MechanicalToggle';
import { ExecutionTimingChart } from '../charts/StudioCharts';

interface OperationsCentreScreenProps {
  projectName: string;
  targetDirectory: string;
  steps: ExecutionStepState[];
  logs: OperationLogEntry[];
  isRunning: boolean;
  isPaused: boolean;
  elapsedSec: number;
  simulateFailure: boolean;
  settings: StudioSettings;
  onToggleSimulateFailure: (val: boolean) => void;
  onStartOrResume: () => void;
  onPause: () => void;
  onCancel: () => void;
  onRetryFailed: () => void;
  onBackToStudio: () => void;
}

export const OperationsCentreScreen: React.FC<OperationsCentreScreenProps> = ({
  projectName,
  targetDirectory,
  steps,
  logs,
  isRunning,
  isPaused,
  elapsedSec,
  simulateFailure,
  settings,
  onToggleSimulateFailure,
  onStartOrResume,
  onPause,
  onCancel,
  onRetryFailed,
  onBackToStudio,
}) => {
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [aiDiagnosing, setAiDiagnosing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDiagnosis, setAiDiagnosis] = useState<AiDiagnosticResponse | null>(null);

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const failedCount = steps.filter((s) => s.status === 'failed').length;
  const pendingCount = steps.filter((s) => s.status === 'pending' || s.status === 'paused').length;
  const runningStep = steps.find((s) => s.status === 'running');

  const overallTone =
    failedCount > 0
      ? 'failed'
      : isRunning
      ? 'running'
      : isPaused
      ? 'attention'
      : completedCount === steps.length && steps.length > 0
      ? 'installed'
      : 'available';

  const overallLabel =
    failedCount > 0
      ? 'Step Failed'
      : isRunning
      ? 'Executing Dry-Run'
      : isPaused
      ? 'Paused'
      : completedCount === steps.length && steps.length > 0
      ? 'Dry-Run Complete'
      : 'Standby';

  const handleCopyLogs = async () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLogs(true);
      setTimeout(() => setCopiedLogs(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const triggerUtilityNotice = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2600);
  };

  const handleDiagnoseFailure = async () => {
    const failedStep = steps.find((s) => s.status === 'failed');
    if (!failedStep) return;
    const providerMeta =
      AI_PROVIDERS.find((p) => p.id === settings.aiProvider) ?? AI_PROVIDERS[0];
    const activeModel =
      (settings.aiCustomModel || '').trim() || settings.aiModel || providerMeta.defaultModel;

    setAiDiagnosing(true);
    setAiError(null);
    try {
      const res = await requestAiAudit({
        provider: settings.aiProvider,
        model: activeModel,
        mode: 'troubleshoot',
        prompt: `Diagnose failed CLI step "${failedStep.step.label}"`,
        context: {
          projectName,
          targetDirectory,
          failedStep: failedStep.step,
          recentLogs: logs.slice(-12),
        },
      });
      setAiDiagnosis(res.result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to diagnose failure.');
    } finally {
      setAiDiagnosing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
              Operations Centre
            </h1>
            <StatusIndicator tone={overallTone} label={overallLabel} />
          </div>
          <p className="text-[13px] text-[#929BA5] mt-0.5">
            Simulated dry-run execution pipeline for{' '}
            <span className="font-mono text-[#F1F3F5]">
              {targetDirectory}/{projectName}
            </span>{' '}
            (browser sandbox — export script for local disk execution).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBackToStudio}
            className="px-3 py-2 rounded-[4px] bg-[#171A1E] border border-[#343B43] hover:border-[#49535E] text-[12px] font-medium text-[#F1F3F5] cursor-pointer"
          >
            ← Project Studio
          </button>

          {isRunning ? (
            <button
              type="button"
              onClick={onPause}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#252A30] border border-[#E4AD63]/60 text-[12.5px] font-medium text-[#E4AD63] cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartOrResume}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#C7A46A] hover:bg-[#D2B27C] text-[#101214] text-[12.5px] font-semibold cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPaused ? 'Resume' : 'Run Pipeline'}</span>
            </button>
          )}

          {failedCount > 0 && (
            <button
              type="button"
              onClick={onRetryFailed}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#252A30] border border-[#65B9A5] text-[12.5px] font-medium text-[#65B9A5] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Failed</span>
            </button>
          )}

          <button
            type="button"
            disabled={!isRunning && !isPaused}
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] bg-[#171A1E] border border-[#343B43] hover:border-[#DF7777] disabled:opacity-35 text-[12.5px] font-medium text-[#DF7777] cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[1060px] mx-auto flex flex-col gap-6">
          {/* Telemetry & Progress Summary */}
          <div className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 flex flex-col gap-4 hardware-bezel">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <div className="text-[11px] text-[#626D78]">Current Operation</div>
                <div className="text-[13px] font-medium text-[#F1F3F5] mt-0.5 truncate">
                  {runningStep?.step.label ??
                    (failedCount > 0
                      ? 'Halted on error'
                      : completedCount === steps.length && steps.length > 0
                      ? 'All steps verified'
                      : 'Ready')}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#626D78]">Completed</div>
                <div className="font-mono text-[15px] font-semibold text-[#70BD92] tabular-nums mt-0.5">
                  {completedCount}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#626D78]">Pending</div>
                <div className="font-mono text-[15px] font-semibold text-[#929BA5] tabular-nums mt-0.5">
                  {pendingCount}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#626D78]">Failed</div>
                <div
                  className={`font-mono text-[15px] font-semibold tabular-nums mt-0.5 ${
                    failedCount > 0 ? 'text-[#DF7777]' : 'text-[#626D78]'
                  }`}
                >
                  {failedCount}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#626D78]">Execution Duration</div>
                <div className="font-mono text-[15px] font-semibold text-[#F1F3F5] tabular-nums mt-0.5">
                  {elapsedSec.toFixed(1)}s
                </div>
              </div>
            </div>

            <TechnicalMeter
              label="Overall Pipeline Progress"
              value={completedCount}
              max={Math.max(steps.length, 1)}
              unit="steps"
              tone={failedCount > 0 ? 'error' : 'green'}
              segments={24}
            />

            <div className="pt-2 border-t border-[#2A3038]">
              <div className="flex items-center justify-between mb-2 text-[11px] font-mono text-[#626D78]">
                <span>STEP TIMING PROFILE (BASELINE VS. ACTUAL DRY-RUN)</span>
                <span>{steps.length} steps</span>
              </div>
              <ExecutionTimingChart steps={steps} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#2A3038]">
              <div className="w-72">
                <MechanicalToggle
                  checked={simulateFailure}
                  onChange={onToggleSimulateFailure}
                  label="Fault Injection Test"
                  description="Simulate transient network failure on step 3 to test retry."
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {failedCount > 0 && settings.aiEnabled && (
                  <button
                    type="button"
                    disabled={aiDiagnosing}
                    onClick={handleDiagnoseFailure}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] bg-[#252A30] border border-[#C7A46A]/70 hover:border-[#C7A46A] disabled:opacity-50 text-[12px] font-medium text-[#F1F3F5] cursor-pointer"
                  >
                    {aiDiagnosing ? (
                      <RefreshCw className="w-3.5 h-3.5 text-[#C7A46A] animate-spin" />
                    ) : (
                      <Cpu className="w-3.5 h-3.5 text-[#C7A46A]" />
                    )}
                    <span>{aiDiagnosing ? 'Diagnosing...' : 'Diagnose Failure with AI'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    triggerUtilityNotice(
                      `Directory path copied: ${targetDirectory}/${projectName}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] bg-[#171A1E] border border-[#343B43] hover:border-[#C7A46A] text-[12px] text-[#F1F3F5] cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#C7A46A]" />
                  <span>Open Project Directory</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    triggerUtilityNotice(
                      `CLI command ready: code ${targetDirectory}/${projectName}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] bg-[#171A1E] border border-[#343B43] hover:border-[#77A9DC] text-[12px] text-[#F1F3F5] cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5 text-[#77A9DC]" />
                  <span>Open in VS Code</span>
                </button>
              </div>
            </div>

            {actionToast && (
              <div className="px-3 py-2 rounded bg-[#101214] border border-[#65B9A5]/60 font-mono text-[11.5px] text-[#65B9A5]">
                {actionToast}
              </div>
            )}

            {aiError && (
              <div className="px-3 py-2 rounded bg-[#14171B] border border-[#DF7777]/60 text-[12px] text-[#DF7777] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {aiDiagnosis && (
              <div className="bg-[#14171B] border border-[#C7A46A]/50 rounded-[4px] p-3.5 flex flex-col gap-2.5 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#C7A46A]">
                    AI Failure Troubleshooting
                  </span>
                  <button
                    type="button"
                    onClick={() => setAiDiagnosis(null)}
                    className="text-[11px] text-[#626D78] hover:text-[#F1F3F5] cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="text-[#F1F3F5]">{aiDiagnosis.assessment}</div>
                {aiDiagnosis.findings.map((f, idx) => (
                  <div key={`${f.title}-${idx}`} className="p-2 rounded bg-[#101214] border border-[#262B32]">
                    <div className="font-medium text-[#F1F3F5]">{f.title}</div>
                    <div className="text-[#929BA5] mt-0.5">{f.detail}</div>
                    {f.action && <div className="font-mono text-[11px] text-[#65B9A5] mt-1">{f.action}</div>}
                  </div>
                ))}
                {aiDiagnosis.suggestedCommands.length > 0 && (
                  <div className="font-mono text-[11px] bg-[#101214] border border-[#262B32] rounded p-2 text-[#C7A46A]">
                    {aiDiagnosis.suggestedCommands.map((c, idx) => (
                      <div key={`${c}-${idx}`}>$ {c}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step Checklist */}
          <div className="bg-[#171A1E] border border-[#2D333B] rounded-[5px] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#14171B] border-b border-[#2A3038] flex items-center justify-between text-[11.5px] font-semibold uppercase tracking-wider text-[#929BA5]">
              <span>Operation Sequence</span>
              <span className="font-mono text-[#626D78]">{steps.length} operations</span>
            </div>
            <div className="divide-y divide-[#23282E]">
              {steps.map((item, idx) => (
                <div
                  key={item.step.id}
                  className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#1A1E23]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[11px] text-[#626D78] w-6 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[#F1F3F5]">
                        {item.step.label}
                      </div>
                      <div className="font-mono text-[11.5px] text-[#626D78] truncate">
                        $ {item.step.command}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono text-[11.5px] text-[#626D78] tabular-nums">
                      {item.durationMs > 0 ? `${(item.durationMs / 1000).toFixed(2)}s` : '—'}
                    </span>
                    <StatusIndicator
                      tone={
                        item.status === 'completed'
                          ? 'installed'
                          : item.status === 'running'
                          ? 'running'
                          : item.status === 'failed'
                          ? 'failed'
                          : item.status === 'paused'
                          ? 'attention'
                          : 'missing'
                      }
                      label={
                        item.status === 'completed'
                          ? 'Done'
                          : item.status === 'running'
                          ? 'Running'
                          : item.status === 'failed'
                          ? 'Failed'
                          : item.status === 'paused'
                          ? 'Paused'
                          : 'Pending'
                      }
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collapsible Live Terminal Output */}
          <div className="bg-[#101214] border border-[#343B43] rounded-[5px] overflow-hidden hardware-recessed">
            <div className="px-4 py-2.5 bg-[#171A1E] border-b border-[#2A3038] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTerminalCollapsed((v) => !v)}
                className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[#F1F3F5] cursor-pointer"
              >
                <Terminal className="w-4 h-4 text-[#C7A46A]" />
                <span>Live Terminal Output</span>
                {terminalCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-[#929BA5]" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-[#929BA5]" />
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyLogs}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#252A30] border border-[#343B43] text-[11px] font-medium text-[#F1F3F5] cursor-pointer"
              >
                {copiedLogs ? (
                  <>
                    <Check className="w-3 h-3 text-[#70BD92]" />
                    <span className="text-[#70BD92]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-[#C7A46A]" />
                    <span>Copy Logs</span>
                  </>
                )}
              </button>
            </div>

            {!terminalCollapsed && (
              <div className="p-4 max-h-[320px] overflow-y-auto font-mono text-[12px] leading-relaxed flex flex-col gap-1">
                {logs.length === 0 ? (
                  <div className="text-[#626D78]">Waiting for execution trigger...</div>
                ) : (
                  logs.map((entry) => {
                    const levelColor =
                      entry.level === 'error'
                        ? 'text-[#DF7777]'
                        : entry.level === 'warn'
                        ? 'text-[#E4AD63]'
                        : entry.level === 'success'
                        ? 'text-[#70BD92]'
                        : entry.level === 'cmd'
                        ? 'text-[#C7A46A]'
                        : 'text-[#77A9DC]';

                    return (
                      <div key={entry.id} className="flex items-baseline gap-3">
                        <span className="text-[#626D78] text-[11px] shrink-0 tabular-nums">
                          {entry.timestamp}
                        </span>
                        <span className={`text-[10.5px] uppercase w-11 shrink-0 ${levelColor}`}>
                          [{entry.level}]
                        </span>
                        <span className="text-[#F1F3F5] break-all">{entry.message}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
