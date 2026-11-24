import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GitBranch,
  Play,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import type { InspectorTarget, WorkflowNode } from '../../types/studio';
import { OPERATION_LIBRARY_TEMPLATES } from '../../data/studioCatalog';
import { StatusIndicator } from '../controls/StatusIndicator';

interface WorkflowBuilderScreenProps {
  nodes: WorkflowNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onAddNode: (template: Omit<WorkflowNode, 'id' | 'dependsOn'>) => void;
  onMoveNode: (nodeId: string, direction: 'up' | 'down') => void;
  onRemoveNode: (nodeId: string) => void;
  onToggleNode: (nodeId: string) => void;
  onInspect: (target: InspectorTarget) => void;
  onSaveWorkflow: (name: string) => void;
  onSyncFromStudio: () => void;
  onExecuteWorkflow: () => void;
}

export const WorkflowBuilderScreen: React.FC<WorkflowBuilderScreenProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onMoveNode,
  onRemoveNode,
  onToggleNode,
  onInspect,
  onSaveWorkflow,
  onSyncFromStudio,
  onExecuteWorkflow,
}) => {
  const [workflowName, setWorkflowName] = useState('standard-vite-react-pipeline');
  const [savedNotice, setSavedNotice] = useState(false);

  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];
    const enabledNodes = nodes.filter((n) => n.enabled);
    if (enabledNodes.length === 0) {
      warnings.push('No active operation blocks enabled in pipeline.');
      return warnings;
    }

    const scaffoldIdx = enabledNodes.findIndex((n) => n.phase === 'Scaffold');
    const depsIdx = enabledNodes.findIndex((n) => n.phase === 'Dependencies');
    const verifyIdx = enabledNodes.findIndex((n) => n.phase === 'Verify');

    if (scaffoldIdx === -1) {
      warnings.push('Pipeline has no Scaffold operation before dependency steps.');
    }
    if (depsIdx !== -1 && scaffoldIdx > depsIdx) {
      warnings.push('Dependency installation appears before project Scaffold.');
    }
    if (verifyIdx !== -1 && verifyIdx < enabledNodes.length - 1) {
      warnings.push('Verification / dev server block should run at the end of the pipeline.');
    }

    return warnings;
  }, [nodes]);

  const handleSave = () => {
    onSaveWorkflow(workflowName);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
                Workflow Builder
              </h1>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                aria-label="Workflow Name"
                className="bg-[#101214] border border-[#2C323A] focus:border-[#C7A46A] rounded px-2.5 py-0.5 font-mono text-[12px] text-[#C7A46A] outline-none"
              />
            </div>
            <p className="text-[13px] text-[#929BA5] mt-0.5">
              Construct reusable, dependency-ordered automation sequences.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <StatusIndicator
            tone={validationWarnings.length === 0 ? 'installed' : 'attention'}
            label={
              validationWarnings.length === 0
                ? 'Pipeline Valid'
                : `${validationWarnings.length} Validation Notice`
            }
          />

          <button
            type="button"
            onClick={onSyncFromStudio}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] bg-[#171A1E] border border-[#343B43] hover:border-[#65B9A5] text-[12.5px] font-medium text-[#F1F3F5] cursor-pointer"
            title="Rebuild workflow blocks from the current project setup plan"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#65B9A5]" />
            <span>Sync from Studio</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#171A1E] border border-[#343B43] hover:border-[#49535E] text-[12.5px] font-medium text-[#F1F3F5] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#C7A46A]" />
            <span>{savedNotice ? 'Workflow Saved' : 'Save Workflow'}</span>
          </button>

          <button
            type="button"
            onClick={onExecuteWorkflow}
            disabled={nodes.filter((n) => n.enabled).length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#C7A46A] hover:bg-[#D2B27C] disabled:opacity-40 text-[#101214] text-[12.5px] font-semibold uppercase tracking-wide cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Execute Workflow</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Operation Library */}
        <div className="w-[268px] shrink-0 border-r border-[#2A3038] bg-[#15181C] flex flex-col">
          <div className="px-4 py-3 border-b border-[#262B32] flex items-center justify-between">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#929BA5]">
              Operation Library
            </span>
            <span className="font-mono text-[11px] text-[#626D78]">
              {OPERATION_LIBRARY_TEMPLATES.length} blocks
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {OPERATION_LIBRARY_TEMPLATES.map((tpl) => (
              <div
                key={tpl.operationId}
                className="p-3 rounded-[4px] bg-[#1A1E23] border border-[#2C323A] hover:border-[#3E4752] flex flex-col gap-2 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#C7A46A]">
                      {tpl.phase}
                    </div>
                    <div className="text-[12.5px] font-semibold text-[#F1F3F5] mt-0.5">
                      {tpl.title}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddNode(tpl)}
                    aria-label={`Add ${tpl.title} to workflow`}
                    className="p-1.5 rounded-[3px] bg-[#252A30] border border-[#343B43] hover:border-[#C7A46A] text-[#F1F3F5] cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C7A46A]" />
                  </button>
                </div>
                <div className="font-mono text-[10.5px] text-[#626D78] truncate">
                  {tpl.command}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Workflow Canvas */}
        <div className="flex-1 instrument-grid-bg overflow-y-auto p-6">
          <div className="max-w-[680px] mx-auto flex flex-col gap-2">
            {/* Validation banner */}
            {validationWarnings.length > 0 ? (
              <div className="mb-3 p-3 rounded-[4px] bg-[#1D2126] border border-[#E4AD63]/60 flex flex-col gap-1">
                {validationWarnings.map((w) => (
                  <div key={w} className="flex items-center gap-2 text-[12px] text-[#E4AD63]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-3 px-3 py-2 rounded-[4px] bg-[#171A1E] border border-[#2C343C] flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-[#70BD92]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Execution order verified — {nodes.filter((n) => n.enabled).length} active blocks</span>
                </span>
                <span className="font-mono text-[11px] text-[#626D78]">
                  Click any block to edit in Inspector
                </span>
              </div>
            )}

            {/* Nodes */}
            {nodes.map((node, index) => {
              const selected = selectedNodeId === node.id;
              return (
                <React.Fragment key={node.id}>
                  <div
                    onClick={() => {
                      onSelectNode(node.id);
                      onInspect({ type: 'workflow-node', id: node.id });
                    }}
                    className={`relative rounded-[5px] border p-4 transition-all cursor-pointer ${
                      !node.enabled
                        ? 'bg-[#15181C]/80 border-[#262B32] opacity-60'
                        : selected
                        ? 'bg-[#1D2126] border-[#C7A46A] hardware-bezel shadow-[0_0_0_1px_rgba(199,164,106,0.25)]'
                        : 'bg-[#171A1E] border-[#343B43] hover:border-[#49535E] hardware-bezel'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-[4px] border flex items-center justify-center font-mono text-[11.5px] font-semibold shrink-0 mt-0.5 ${
                            selected
                              ? 'bg-[#252A30] border-[#C7A46A] text-[#C7A46A]'
                              : 'bg-[#101214] border-[#2C323A] text-[#929BA5]'
                          }`}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#C7A46A]">
                              {node.phase}
                            </span>
                            {node.dependsOn.length > 0 && (
                              <span className="font-mono text-[10.5px] text-[#626D78] inline-flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                after {node.dependsOn.join(', ')}
                              </span>
                            )}
                          </div>
                          <h3 className="text-[14px] font-semibold text-[#F1F3F5] mt-0.5">
                            {node.title}
                          </h3>
                        </div>
                      </div>

                      {/* Block Actions */}
                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleNode(node.id)}
                          className={`px-2 py-1 rounded-[3px] font-mono text-[10.5px] border cursor-pointer ${
                            node.enabled
                              ? 'bg-[#252A30] border-[#65B9A5]/60 text-[#65B9A5]'
                              : 'bg-[#101214] border-[#343B43] text-[#626D78]'
                          }`}
                        >
                          {node.enabled ? 'ON' : 'OFF'}
                        </button>
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => onMoveNode(node.id, 'up')}
                          aria-label="Move block up"
                          className="p-1.5 rounded-[3px] bg-[#101214] border border-[#2C323A] text-[#929BA5] hover:text-[#F1F3F5] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === nodes.length - 1}
                          onClick={() => onMoveNode(node.id, 'down')}
                          aria-label="Move block down"
                          className="p-1.5 rounded-[3px] bg-[#101214] border border-[#2C323A] text-[#929BA5] hover:text-[#F1F3F5] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveNode(node.id)}
                          aria-label="Remove block"
                          className="p-1.5 rounded-[3px] bg-[#101214] border border-[#2C323A] text-[#929BA5] hover:text-[#DF7777] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 px-3 py-2 rounded bg-[#101214] border border-[#262B32] font-mono text-[11.5px] text-[#F1F3F5] break-all">
                      <span className="text-[#65B9A5] mr-2">$</span>
                      {node.command}
                    </div>
                  </div>

                  {/* Connector pipe between nodes */}
                  {index < nodes.length - 1 && (
                    <div className="flex justify-center py-0.5" aria-hidden="true">
                      <svg width="24" height="22" viewBox="0 0 24 22" fill="none">
                        <line x1="12" y1="0" x2="12" y2="17" stroke="#434C57" strokeWidth="1.5" />
                        <path d="M8 14L12 19L16 14" stroke="#C7A46A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
