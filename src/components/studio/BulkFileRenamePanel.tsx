import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckSquare,
  Cpu,
  FileCode2,
  FolderTree,
  RefreshCw,
  Replace,
  RotateCcw,
  Square,
  Wand2,
} from 'lucide-react';
import type {
  AiProviderStatus,
  DirectoryLayoutMode,
  FileNamingConvention,
  InspectorTarget,
  ProjectConfig,
  ScaffoldFileEntry,
  StudioSettings,
} from '../../types/studio';
import {
  buildScaffoldManifest,
  computeConventionTargetPath,
  matchesNamingConvention,
  splitStemAndCompoundExt,
  toCaseStyle,
} from '../../data/studioCatalog';
import { AI_PROVIDERS } from '../../data/aiProviders';
import { requestAiRenameAdvice } from '../../services/aiClient';
import { SegmentedSelector } from '../controls/SegmentedSelector';
import { MechanicalToggle } from '../controls/MechanicalToggle';
import { StatusIndicator } from '../controls/StatusIndicator';

interface BulkFileRenamePanelProps {
  config: ProjectConfig;
  onUpdateConfig: (patch: Partial<ProjectConfig>) => void;
  onInspect: (target: InspectorTarget) => void;
  settings?: StudioSettings;
  providerStatuses?: AiProviderStatus[];
}

type FileFilterCategory = 'all' | ScaffoldFileEntry['category'];

export const BulkFileRenamePanel: React.FC<BulkFileRenamePanelProps> = ({
  config,
  onUpdateConfig,
  onInspect,
  settings,
  providerStatuses = [],
}) => {
  const [filterCat, setFilterCat] = useState<FileFilterCategory>('all');
  const [findPattern, setFindPattern] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [prefixInput, setPrefixInput] = useState('');
  const [suffixInput, setSuffixInput] = useState('');
  const [regexError, setRegexError] = useState<string | null>(null);
  const [aiGoal, setAiGoal] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const manifest = useMemo(() => buildScaffoldManifest(config), [config]);

  const filteredManifest = useMemo(
    () =>
      filterCat === 'all'
        ? manifest
        : manifest.filter((entry) => entry.category === filterCat),
    [manifest, filterCat]
  );

  const selectedSet = useMemo(() => {
    const validOriginalPaths = new Set(manifest.map((m) => m.originalPath));
    return new Set(config.selectedRenameFilePaths.filter((p) => validOriginalPaths.has(p)));
  }, [config.selectedRenameFilePaths, manifest]);

  const targetCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of manifest) {
      map.set(item.targetPath, (map.get(item.targetPath) ?? 0) + 1);
    }
    return map;
  }, [manifest]);

  const pendingRenameCount = useMemo(
    () => manifest.filter((f) => f.targetPath !== f.originalPath).length,
    [manifest]
  );

  const nonCompliantCount = useMemo(
    () =>
      manifest.filter(
        (f) =>
          !matchesNamingConvention(
            f.targetPath,
            config.directoryNamingConvention,
            f.conventionExempt
          )
      ).length,
    [manifest, config.directoryNamingConvention]
  );

  const projectSlug = toCaseStyle(config.projectName.trim() || 'my-awesome-app', 'kebab-case');
  const targetSrcRoot =
    config.directoryLayoutMode === 'feature-sliced'
      ? `src/features/${projectSlug}/`
      : config.directoryLayoutMode === 'domain-scoped'
      ? `src/modules/${projectSlug}/`
      : 'src/';

  const toggleSelectFile = (originalPath: string) => {
    const next = new Set(selectedSet);
    if (next.has(originalPath)) next.delete(originalPath);
    else next.add(originalPath);
    onUpdateConfig({ selectedRenameFilePaths: Array.from(next) });
    onInspect({ type: 'file-rename', filePath: originalPath });
  };

  const handleSelectAllFiltered = () => {
    const allFilteredSelected =
      filteredManifest.length > 0 &&
      filteredManifest.every((f) => selectedSet.has(f.originalPath));
    const next = new Set(selectedSet);
    if (allFilteredSelected) {
      filteredManifest.forEach((f) => next.delete(f.originalPath));
    } else {
      filteredManifest.forEach((f) => next.add(f.originalPath));
    }
    onUpdateConfig({ selectedRenameFilePaths: Array.from(next) });
  };

  const applyTransformToSelected = (
    transformFn: (currentTargetPath: string, entry: ScaffoldFileEntry) => string
  ) => {
    if (selectedSet.size === 0) return;
    const nextOverrides = { ...config.fileRenameOverrides };
    for (const entry of manifest) {
      if (!selectedSet.has(entry.originalPath)) continue;
      const nextPath = transformFn(entry.targetPath, entry);
      const defaultPath = computeConventionTargetPath(entry.originalPath, config);
      if (nextPath === defaultPath && !config.autoAlignFileNaming) {
        delete nextOverrides[entry.originalPath];
      } else {
        nextOverrides[entry.originalPath] = nextPath;
      }
    }
    onUpdateConfig({ fileRenameOverrides: nextOverrides });
    onInspect({ type: 'file-rename' });
  };

  const handleBulkFindReplace = () => {
    setRegexError(null);
    if (!findPattern) return;
    let matcher: RegExp | null = null;
    if (useRegex) {
      try {
        matcher = new RegExp(findPattern, 'g');
      } catch {
        setRegexError('Invalid regular expression pattern.');
        return;
      }
    }
    applyTransformToSelected((currentPath) => {
      if (matcher) {
        return currentPath.replace(matcher, replaceValue);
      }
      return currentPath.split(findPattern).join(replaceValue);
    });
  };

  const handleBulkAffix = () => {
    if (!prefixInput && !suffixInput) return;
    applyTransformToSelected((currentPath) => {
      const slashIdx = currentPath.lastIndexOf('/');
      const dir = slashIdx === -1 ? '' : currentPath.slice(0, slashIdx);
      const filename = slashIdx === -1 ? currentPath : currentPath.slice(slashIdx + 1);
      if (filename.startsWith('.')) return currentPath;

      const { stem, ext } = splitStemAndCompoundExt(filename);
      const nextStem = `${prefixInput}${stem}${suffixInput}`;
      const normalizedStem = config.autoAlignFileNaming
        ? toCaseStyle(nextStem, config.directoryNamingConvention)
        : nextStem;
      const nextFile = `${normalizedStem}${ext}`;
      return dir ? `${dir}/${nextFile}` : nextFile;
    });
  };

  const handleBulkCaseTransform = (targetCase: FileNamingConvention) => {
    applyTransformToSelected((currentPath, entry) => {
      if (entry.conventionExempt) return currentPath;
      const slashIdx = currentPath.lastIndexOf('/');
      const dir = slashIdx === -1 ? '' : currentPath.slice(0, slashIdx);
      const filename = slashIdx === -1 ? currentPath : currentPath.slice(slashIdx + 1);
      if (filename.startsWith('.')) return currentPath;
      const { stem, ext } = splitStemAndCompoundExt(filename);
      const transformed = `${toCaseStyle(stem, targetCase)}${ext}`;
      return dir ? `${dir}/${transformed}` : transformed;
    });
  };

  const handleAlignSelectedToConvention = () => {
    applyTransformToSelected((currentPath, entry) => {
      if (entry.conventionExempt) return currentPath;
      const slashIdx = currentPath.lastIndexOf('/');
      const dir = slashIdx === -1 ? '' : currentPath.slice(0, slashIdx);
      const filename = slashIdx === -1 ? currentPath : currentPath.slice(slashIdx + 1);
      if (filename.startsWith('.')) return currentPath;
      const { stem, ext } = splitStemAndCompoundExt(filename);
      const aligned = `${toCaseStyle(stem, config.directoryNamingConvention)}${ext}`;
      // Also align directory root to target layout
      const layoutTarget = computeConventionTargetPath(entry.originalPath, {
        ...config,
        autoAlignFileNaming: true,
      });
      const layoutDirIdx = layoutTarget.lastIndexOf('/');
      const layoutDir = layoutDirIdx === -1 ? dir : layoutTarget.slice(0, layoutDirIdx);
      return layoutDir ? `${layoutDir}/${aligned}` : aligned;
    });
  };

  const handleInlineTargetChange = (originalPath: string, nextValue: string) => {
    const nextOverrides = { ...config.fileRenameOverrides };
    const defaultTarget = computeConventionTargetPath(originalPath, config);
    if (nextValue === defaultTarget) {
      delete nextOverrides[originalPath];
    } else {
      nextOverrides[originalPath] = nextValue;
    }
    onUpdateConfig({ fileRenameOverrides: nextOverrides });
  };

  const handleResetSingle = (originalPath: string) => {
    const nextOverrides = { ...config.fileRenameOverrides };
    delete nextOverrides[originalPath];
    onUpdateConfig({ fileRenameOverrides: nextOverrides });
  };

  const handleResetAll = () => {
    onUpdateConfig({ fileRenameOverrides: {} });
  };

  const handleAiRenameAdvice = async () => {
    if (!settings?.aiEnabled) return;
    const targetFiles =
      selectedSet.size > 0
        ? Array.from(selectedSet)
        : manifest.filter((m) => !m.conventionExempt).map((m) => m.originalPath);
    if (targetFiles.length === 0) return;

    const provMeta =
      AI_PROVIDERS.find((p) => p.id === settings.aiProvider) ?? AI_PROVIDERS[0];
    const effectiveModel =
      (settings.aiCustomModel || '').trim() || settings.aiModel || provMeta.defaultModel;

    setAiLoading(true);
    setAiError(null);
    setAiNote(null);
    try {
      const res = await requestAiRenameAdvice({
        provider: settings.aiProvider,
        model: effectiveModel,
        prompt:
          aiGoal.trim() ||
          `Align ${config.framework} files cleanly with consistent domain naming`,
        files: targetFiles,
        currentLayout: config.directoryLayoutMode,
        currentConvention: config.directoryNamingConvention,
      });

      onUpdateConfig({
        directoryLayoutMode: res.result.directoryLayoutMode,
        directoryNamingConvention: res.result.directoryNamingConvention,
        autoAlignFileNaming: true,
        fileRenameOverrides: {
          ...config.fileRenameOverrides,
          ...res.result.overrides,
        },
      });
      setAiNote(
        `${res.result.summary} (${res.result.directoryLayoutMode} · ${res.result.directoryNamingConvention})`
      );
      onInspect({ type: 'file-rename' });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate rename advice.');
    } finally {
      setAiLoading(false);
    }
  };

  const activeAiReady = settings?.aiEnabled
    ? providerStatuses.find((s) => s.id === settings.aiProvider)?.configured ?? false
    : false;

  const overrideCount = Object.keys(config.fileRenameOverrides).length;
  const allFilteredChecked =
    filteredManifest.length > 0 &&
    filteredManifest.every((f) => selectedSet.has(f.originalPath));

  return (
    <div
      onClick={() => onInspect({ type: 'file-rename' })}
      className="bg-[#1D2126] border border-[#343B43] rounded-[5px] p-5 flex flex-col gap-5 hardware-bezel"
    >
      {/* Header & Directory Structure Alignment Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#2A3038] pb-4">
        <div className="flex items-start gap-2.5">
          <FolderTree className="w-4 h-4 text-[#C7A46A] mt-0.5 shrink-0" />
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F3F5]">
              Pre-Execution Bulk Rename & Directory Alignment
            </h3>
            <p className="text-[12px] text-[#929BA5] mt-0.5">
              Bulk-rename selected scaffold files and enforce naming conventions matching{' '}
              <span className="font-mono text-[#C7A46A]">{targetSrcRoot}</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusIndicator
            tone={nonCompliantCount === 0 ? 'installed' : 'attention'}
            label={
              nonCompliantCount === 0
                ? `${config.directoryNamingConvention} aligned`
                : `${nonCompliantCount} convention mismatch`
            }
            compact
          />
          <span className="font-mono text-[11px] text-[#626D78] tabular-nums">
            {pendingRenameCount} rename{pendingRenameCount === 1 ? '' : 's'} queued
          </span>
        </div>
      </div>

      {/* Directory Structure & Convention Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11.5px] font-medium text-[#929BA5]">
            Target Directory Structure
          </span>
          <SegmentedSelector<DirectoryLayoutMode>
            ariaLabel="Target Directory Structure"
            size="sm"
            fullWidth
            value={config.directoryLayoutMode}
            onChange={(mode) => {
              onUpdateConfig({ directoryLayoutMode: mode });
              onInspect({ type: 'file-rename' });
            }}
            options={[
              { value: 'standard', label: 'Standard src/' },
              { value: 'feature-sliced', label: 'Feature-Sliced' },
              { value: 'domain-scoped', label: 'Domain-Scoped' },
            ]}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11.5px] font-medium text-[#929BA5]">
            File Naming Convention
          </span>
          <SegmentedSelector<FileNamingConvention>
            ariaLabel="File Naming Convention"
            size="sm"
            fullWidth
            value={config.directoryNamingConvention}
            onChange={(conv) => {
              onUpdateConfig({ directoryNamingConvention: conv });
              onInspect({ type: 'file-rename' });
            }}
            options={[
              { value: 'kebab-case', label: 'kebab-case' },
              { value: 'camelCase', label: 'camelCase' },
              { value: 'PascalCase', label: 'PascalCase' },
              { value: 'snake_case', label: 'snake_case' },
            ]}
          />
        </div>

        <MechanicalToggle
          checked={config.autoAlignFileNaming}
          onChange={(val) => onUpdateConfig({ autoAlignFileNaming: val })}
          label="Auto-Align Naming"
          description="Automatically format scaffold filenames to match convention."
          onFocusInspect={() => onInspect({ type: 'file-rename' })}
        />
      </div>

      {/* Bulk Transformation Workbench */}
      <div className="bg-[#14171B] border border-[#2C323A] rounded-[4px] p-3.5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#23282E]">
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#929BA5]">
              Bulk Transform Selected
            </span>
            <span className="font-mono text-[11px] text-[#C7A46A] tabular-nums">
              ({selectedSet.size} selected)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'kebab-case', label: 'kebab' },
                { id: 'camelCase', label: 'camel' },
                { id: 'PascalCase', label: 'Pascal' },
                { id: 'snake_case', label: 'snake' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                disabled={selectedSet.size === 0}
                onClick={() => handleBulkCaseTransform(btn.id)}
                className="px-2.5 py-1 rounded-[3px] bg-[#1D2126] border border-[#343B43] hover:border-[#C7A46A] disabled:opacity-35 font-mono text-[11px] text-[#F1F3F5] cursor-pointer transition-colors"
                title={`Convert selected filenames to ${btn.id}`}
              >
                {btn.label}
              </button>
            ))}

            <button
              type="button"
              disabled={selectedSet.size === 0}
              onClick={handleAlignSelectedToConvention}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#252A30] border border-[#65B9A5]/60 hover:border-[#65B9A5] disabled:opacity-35 text-[11px] font-medium text-[#65B9A5] cursor-pointer transition-colors"
            >
              <Wand2 className="w-3 h-3" />
              <span>Align to Directory Convention</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Find & Replace */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={findPattern}
                onChange={(e) => {
                  setFindPattern(e.target.value);
                  setRegexError(null);
                }}
                placeholder="Find (e.g. AppShell)"
                aria-label="Find pattern in selected file paths"
                className="flex-1 min-w-0 bg-[#101214] border border-[#343B43] focus:border-[#C7A46A] rounded-[3px] px-2.5 py-1.5 font-mono text-[11.5px] text-[#F1F3F5] outline-none"
              />
              <input
                type="text"
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                placeholder="Replace with"
                aria-label="Replace pattern in selected file paths"
                className="flex-1 min-w-0 bg-[#101214] border border-[#343B43] focus:border-[#C7A46A] rounded-[3px] px-2.5 py-1.5 font-mono text-[11.5px] text-[#F1F3F5] outline-none"
              />
              <button
                type="button"
                onClick={() => setUseRegex((v) => !v)}
                className={`px-2 py-1.5 rounded-[3px] border font-mono text-[11px] cursor-pointer transition-colors ${
                  useRegex
                    ? 'bg-[#252A30] border-[#C7A46A] text-[#C7A46A]'
                    : 'bg-[#101214] border-[#343B43] text-[#626D78] hover:text-[#929BA5]'
                }`}
                title="Toggle regular expression matching"
              >
                .*
              </button>
              <button
                type="button"
                disabled={selectedSet.size === 0 || !findPattern}
                onClick={handleBulkFindReplace}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] bg-[#252A30] border border-[#343B43] hover:border-[#C7A46A] disabled:opacity-35 text-[11.5px] font-medium text-[#F1F3F5] whitespace-nowrap cursor-pointer"
              >
                <Replace className="w-3.5 h-3.5 text-[#C7A46A]" />
                <span>Replace</span>
              </button>
            </div>
            {regexError && (
              <span className="font-mono text-[11px] text-[#DF7777]">{regexError}</span>
            )}
          </div>

          {/* Prefix & Suffix */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={prefixInput}
              onChange={(e) => setPrefixInput(e.target.value)}
              placeholder="Prefix (e.g. core-)"
              aria-label="Filename prefix"
              className="flex-1 min-w-0 bg-[#101214] border border-[#343B43] focus:border-[#C7A46A] rounded-[3px] px-2.5 py-1.5 font-mono text-[11.5px] text-[#F1F3F5] outline-none"
            />
            <input
              type="text"
              value={suffixInput}
              onChange={(e) => setSuffixInput(e.target.value)}
              placeholder="Suffix (e.g. -view)"
              aria-label="Filename suffix"
              className="flex-1 min-w-0 bg-[#101214] border border-[#343B43] focus:border-[#C7A46A] rounded-[3px] px-2.5 py-1.5 font-mono text-[11.5px] text-[#F1F3F5] outline-none"
            />
            <button
              type="button"
              disabled={selectedSet.size === 0 || (!prefixInput && !suffixInput)}
              onClick={handleBulkAffix}
              className="px-3 py-1.5 rounded-[3px] bg-[#252A30] border border-[#343B43] hover:border-[#C7A46A] disabled:opacity-35 text-[11.5px] font-medium text-[#F1F3F5] whitespace-nowrap cursor-pointer"
            >
              Apply Affix
            </button>
          </div>
        </div>

        {settings?.aiEnabled && (
          <div className="pt-2.5 border-t border-[#23282E] flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <Cpu className="w-3.5 h-3.5 text-[#C7A46A]" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#929BA5]">
                  AI Layout Advisor
                </span>
              </div>
              <input
                type="text"
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !aiLoading) {
                    e.preventDefault();
                    handleAiRenameAdvice();
                  }
                }}
                placeholder="Optional goal (e.g. Feature-sliced auth & dashboard modules with PascalCase components)..."
                aria-label="AI directory layout goal"
                className="flex-1 min-w-0 bg-[#101214] border border-[#343B43] focus:border-[#C7A46A] rounded-[3px] px-2.5 py-1.5 text-[11.5px] text-[#F1F3F5] outline-none"
              />
              <button
                type="button"
                disabled={aiLoading}
                onClick={handleAiRenameAdvice}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#252A30] border border-[#C7A46A]/60 hover:border-[#C7A46A] disabled:opacity-45 text-[11.5px] font-medium text-[#F1F3F5] whitespace-nowrap cursor-pointer"
                title={
                  activeAiReady
                    ? 'Ask active AI provider to propose directory layout & renames'
                    : 'Requires configured AI provider secret in server environment'
                }
              >
                <RefreshCw
                  className={`w-3 h-3 text-[#C7A46A] ${aiLoading ? 'animate-spin' : ''}`}
                />
                <span>{aiLoading ? 'Analysing...' : 'Suggest Layout & Renames'}</span>
              </button>
            </div>
            {aiNote && (
              <div className="font-mono text-[11px] text-[#65B9A5]">{aiNote}</div>
            )}
            {aiError && (
              <div className="font-mono text-[11px] text-[#DF7777]">{aiError}</div>
            )}
          </div>
        )}
      </div>

      {/* Filter Tabs & File Manifest Table */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'all', label: `All (${manifest.length})` },
                { id: 'source', label: 'Source' },
                { id: 'style', label: 'Styles' },
                { id: 'test', label: 'Tests' },
                { id: 'config', label: 'Config' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCat(tab.id)}
                className={`px-2.5 py-1 rounded-[3px] text-[11.5px] font-medium cursor-pointer transition-colors ${
                  filterCat === tab.id
                    ? 'bg-[#252A30] text-[#C7A46A] border border-[#C7A46A]/50'
                    : 'bg-[#171A1E] text-[#929BA5] border border-[#2A3038] hover:text-[#F1F3F5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {overrideCount > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#171A1E] border border-[#343B43] hover:border-[#DF7777]/60 text-[11.5px] text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset {overrideCount} Custom Override{overrideCount > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>

        <div className="bg-[#101214] border border-[#2E343C] rounded-[4px] overflow-hidden hardware-recessed">
          <div className="max-h-[280px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="sticky top-0 bg-[#14171B] border-b border-[#2A3038] z-10">
                <tr className="text-[10.5px] font-mono uppercase text-[#626D78]">
                  <th className="py-2 px-3 w-9">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      aria-label={allFilteredChecked ? 'Deselect visible files' : 'Select visible files'}
                      className="text-[#929BA5] hover:text-[#C7A46A] cursor-pointer flex items-center"
                    >
                      {allFilteredChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#C7A46A]" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </th>
                  <th className="py-2 px-2 w-14 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium">Scaffold Source Path</th>
                  <th className="py-2 px-1 w-6" aria-hidden="true" />
                  <th className="py-2 px-3 font-medium">Target Output Path</th>
                  <th className="py-2 px-3 w-28 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2126]">
                {filteredManifest.map((entry) => {
                  const isSelected = selectedSet.has(entry.originalPath);
                  const isRenamed = entry.targetPath !== entry.originalPath;
                  const isOverridden = Boolean(config.fileRenameOverrides[entry.originalPath]);
                  const hasCollision = (targetCounts.get(entry.targetPath) ?? 0) > 1;
                  const isCompliant = matchesNamingConvention(
                    entry.targetPath,
                    config.directoryNamingConvention,
                    entry.conventionExempt
                  );

                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-[#191D22]' : 'hover:bg-[#15191D]'
                      }`}
                    >
                      <td className="py-2 px-3">
                        <button
                          type="button"
                          onClick={() => toggleSelectFile(entry.originalPath)}
                          aria-label={`Select ${entry.originalPath}`}
                          className="text-[#929BA5] hover:text-[#C7A46A] cursor-pointer flex items-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-[#C7A46A]" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-2 font-mono text-[10.5px] uppercase text-[#626D78]">
                        {entry.category}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11.5px] text-[#929BA5]">
                        <span className="inline-flex items-center gap-1.5">
                          <FileCode2 className="w-3.5 h-3.5 text-[#626D78] shrink-0" />
                          <span>{entry.originalPath}</span>
                        </span>
                      </td>
                      <td className="py-2 px-1 text-center text-[#626D78]">
                        <ArrowRight
                          className={`w-3.5 h-3.5 inline ${
                            isRenamed ? 'text-[#C7A46A]' : 'text-[#343B43]'
                          }`}
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={entry.targetPath}
                            aria-label={`Target path for ${entry.originalPath}`}
                            onChange={(e) =>
                              handleInlineTargetChange(entry.originalPath, e.target.value)
                            }
                            onFocus={() =>
                              onInspect({ type: 'file-rename', filePath: entry.originalPath })
                            }
                            className={`w-full bg-[#14171B] border rounded-[3px] px-2 py-1 font-mono text-[11.5px] outline-none transition-colors ${
                              hasCollision
                                ? 'border-[#DF7777] text-[#DF7777]'
                                : !isCompliant
                                ? 'border-[#E4AD63]/70 text-[#E4AD63]'
                                : isRenamed
                                ? 'border-[#C7A46A]/55 text-[#C7A46A]'
                                : 'border-[#262B32] text-[#F1F3F5] focus:border-[#C7A46A]'
                            }`}
                          />
                          {isOverridden && (
                            <button
                              type="button"
                              onClick={() => handleResetSingle(entry.originalPath)}
                              title="Reset to directory convention default"
                              aria-label={`Reset ${entry.originalPath}`}
                              className="p-1 text-[#626D78] hover:text-[#F1F3F5] cursor-pointer shrink-0"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {hasCollision ? (
                          <StatusIndicator tone="failed" label="Collision" compact />
                        ) : !isCompliant ? (
                          <StatusIndicator tone="attention" label="Mismatch" compact />
                        ) : isRenamed ? (
                          <StatusIndicator tone="installed" label="Renamed" compact />
                        ) : (
                          <span className="font-mono text-[11px] text-[#626D78]">Unchanged</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
