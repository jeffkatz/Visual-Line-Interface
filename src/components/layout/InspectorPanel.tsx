import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Info,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react';
import type {
  CompatibilityIssue,
  InspectorTarget,
  PackageManagerInfo,
  ProjectConfig,
  RuntimeInfo,
  StudioPackage,
} from '../../types/studio';
import {
  buildScaffoldManifest,
  FRAMEWORKS,
  getPendingFileRenames,
  matchesNamingConvention,
  TOOLCHAIN_DOCS,
} from '../../data/studioCatalog';
import { StatusIndicator } from '../controls/StatusIndicator';
import { MechanicalToggle } from '../controls/MechanicalToggle';
import { SegmentedSelector } from '../controls/SegmentedSelector';

const DocReferenceLinks: React.FC<{
  links: Array<{ label: string; url: string; sub?: string }>;
}> = ({ links }) => (
  <div className="border-t border-[#2A3038] pt-3 flex flex-col gap-1.5">
    <div className="text-[11px] font-medium text-[#929BA5] flex items-center gap-1.5">
      <BookOpen className="w-3.5 h-3.5 text-[#C7A46A]" />
      <span>Official Documentation</span>
    </div>
    <div className="flex flex-col gap-1.5">
      {links.map((item) => (
        <a
          key={item.url}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-[4px] bg-[#14171B] border border-[#2C323A] hover:border-[#C7A46A]/65 text-[12px] text-[#F1F3F5] transition-colors group"
        >
          <div className="min-w-0">
            <div className="font-medium truncate group-hover:text-[#C7A46A] transition-colors">
              {item.label}
            </div>
            {item.sub && (
              <div className="font-mono text-[10.5px] text-[#626D78] truncate">{item.sub}</div>
            )}
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#626D78] group-hover:text-[#C7A46A] shrink-0" />
        </a>
      ))}
    </div>
  </div>
);

interface InspectorPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  target: InspectorTarget;
  config: ProjectConfig;
  onUpdateConfig: (patch: Partial<ProjectConfig>) => void;
  issues: CompatibilityIssue[];
  runtimes: RuntimeInfo[];
  packageManagers: PackageManagerInfo[];
  packages: StudioPackage[];
  onApplyFix: (issueId: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  collapsed,
  onToggleCollapse,
  target,
  config,
  onUpdateConfig,
  issues,
  runtimes,
  packageManagers,
  packages,
  onApplyFix,
}) => {
  if (collapsed) {
    return (
      <div className="w-11 shrink-0 bg-[#171A1E] border-l border-[#343B43] flex flex-col items-center py-3 gap-4 select-none">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand Inspector Panel"
          title="Expand Contextual Inspector"
          className="p-2 rounded-[4px] bg-[#1D2126] border border-[#343B43] text-[#929BA5] hover:text-[#F1F3F5] hover:border-[#C7A46A]/60 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
        <div className="writing-mode-vertical text-[10.5px] font-mono tracking-[0.14em] text-[#626D78] uppercase rotate-180 [writing-mode:vertical-rl]">
          Inspector
        </div>
        {issues.length > 0 && (
          <span
            className="font-mono text-[10px] text-[#E4AD63] tabular-nums"
            title={`${issues.length} compatibility notice(s)`}
          >
            {issues.length}
          </span>
        )}
      </div>
    );
  }

  const renderTargetDetails = () => {
    if (target.type === 'framework') {
      const fw = FRAMEWORKS.find((f) => f.id === target.id) ?? FRAMEWORKS[0];
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
                Framework Foundation
              </div>
              <h3 className="text-[16px] font-semibold text-[#F1F3F5] mt-0.5">{fw.name}</h3>
            </div>
            <StatusIndicator tone={fw.compatibility} label={fw.compatibilityLabel} compact />
          </div>

          <p className="text-[12.5px] text-[#929BA5] leading-relaxed">{fw.summary}</p>

          <div className="border-t border-[#2A3038] pt-3 flex flex-col gap-2">
            <div className="text-[11px] font-medium text-[#929BA5]">Technical Metadata</div>
            <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
              <dt className="text-[#626D78]">Latest Release</dt>
              <dd className="font-mono text-[#F1F3F5] text-right">v{fw.latestVersion}</dd>
              <dt className="text-[#626D78]">Scaffold CLI</dt>
              <dd className="font-mono text-[#C7A46A] text-right truncate">{fw.cliPackage}</dd>
              <dt className="text-[#626D78]">Default Dev Port</dt>
              <dd className="font-mono text-[#F1F3F5] text-right">:{fw.defaultPort}</dd>
              <dt className="text-[#626D78]">SWC Preset</dt>
              <dd className="font-mono text-right text-[#929BA5]">
                {fw.supportsSwc ? 'Supported' : 'Built-in / N/A'}
              </dd>
            </dl>
          </div>

          <div className="border-t border-[#2A3038] pt-3 flex flex-col gap-1.5">
            <div className="text-[11px] font-medium text-[#929BA5]">System Requirements</div>
            <ul className="flex flex-col gap-1 text-[12px] text-[#929BA5]">
              {fw.requirements.map((req) => (
                <li key={req} className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-[#65B9A5]">›</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <DocReferenceLinks
            links={[
              { label: `${fw.name} Documentation`, url: fw.docsUrl, sub: fw.docsUrl },
              ...(fw.id === 'vite' && config.viteUiFramework
                ? [
                    {
                      label: TOOLCHAIN_DOCS[config.viteUiFramework]?.label ?? 'UI Library Docs',
                      url: TOOLCHAIN_DOCS[config.viteUiFramework]?.docsUrl ?? fw.docsUrl,
                      sub: TOOLCHAIN_DOCS[config.viteUiFramework]?.docsUrl,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      );
    }

    if (target.type === 'runtime') {
      const rt = runtimes.find((r) => r.id === target.id) ?? runtimes[0];
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
                Execution Runtime
              </div>
              <h3 className="text-[16px] font-semibold text-[#F1F3F5] mt-0.5">{rt.name}</h3>
            </div>
            <StatusIndicator tone={rt.status} compact />
          </div>

          <p className="text-[12.5px] text-[#929BA5] leading-relaxed">{rt.notes}</p>

          <dl className="grid grid-cols-2 gap-y-2 text-[12px] border-t border-[#2A3038] pt-3">
            <dt className="text-[#626D78]">Installed Version</dt>
            <dd className="font-mono text-[#F1F3F5] text-right">{rt.installedVersion ?? 'Not detected'}</dd>
            <dt className="text-[#626D78]">Target Version</dt>
            <dd className="font-mono text-[#65B9A5] text-right">{rt.selectedVersion || 'Not set'}</dd>
            <dt className="text-[#626D78]">Version Manager</dt>
            <dd className="font-mono text-[#929BA5] text-right">{rt.manager}</dd>
            <dt className="text-[#626D78]">Architecture</dt>
            <dd className="font-mono text-[#929BA5] text-right truncate">{rt.architecture}</dd>
          </dl>

          <div className="border-t border-[#2A3038] pt-3">
            <div className="text-[11px] text-[#626D78] mb-1">Binary Location</div>
            <div className="font-mono text-[11.5px] bg-[#101214] border border-[#2A3038] rounded px-2.5 py-1.5 text-[#929BA5] break-all">
              {rt.binaryPath}
            </div>
          </div>

          <DocReferenceLinks
            links={[
              { label: `${rt.name} Official Docs`, url: rt.docsUrl, sub: rt.docsUrl },
              ...(rt.releaseNotesUrl
                ? [{ label: `${rt.name} Release Notes`, url: rt.releaseNotesUrl }]
                : []),
            ]}
          />
        </div>
      );
    }

    if (target.type === 'package-manager') {
      const pm = packageManagers.find((p) => p.id === target.id) ?? packageManagers[0];
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
                Package Manager
              </div>
              <h3 className="text-[16px] font-semibold text-[#F1F3F5] mt-0.5">{pm.name}</h3>
            </div>
            <StatusIndicator tone={pm.status} compact />
          </div>

          <p className="text-[12.5px] text-[#929BA5] leading-relaxed">{pm.notes}</p>

          <dl className="grid grid-cols-2 gap-y-2 text-[12px] border-t border-[#2A3038] pt-3">
            <dt className="text-[#626D78]">Detected Version</dt>
            <dd className="font-mono text-[#F1F3F5] text-right">v{pm.version}</dd>
            <dt className="text-[#626D78]">Lockfile Format</dt>
            <dd className="font-mono text-[#C7A46A] text-right">{pm.lockfile}</dd>
            <dt className="text-[#626D78]">Compatible Runtimes</dt>
            <dd className="font-mono text-[#929BA5] text-right">
              {pm.compatibleRuntimes.join(' · ')}
            </dd>
          </dl>

          <DocReferenceLinks
            links={[{ label: `${pm.name} CLI Reference`, url: pm.docsUrl, sub: pm.docsUrl }]}
          />
        </div>
      );
    }

    if (target.type === 'language') {
      const doc = TOOLCHAIN_DOCS[config.language];
      return (
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
              Language Toolchain
            </div>
            <h3 className="text-[16px] font-semibold text-[#F1F3F5] mt-0.5">
              {config.language === 'typescript' ? 'TypeScript 5.8' : 'JavaScript ES2024'}
            </h3>
          </div>
          <p className="text-[12.5px] text-[#929BA5] leading-relaxed">
            {config.language === 'typescript'
              ? 'Generates tsconfig.json with bundler module resolution, strict JSX transforms, and typed Vite client definitions.'
              : 'Uses standard ECMAScript modules without a compilation type-checking step.'}
          </p>
          {config.language === 'typescript' && (
            <div className="border-t border-[#2A3038] pt-3">
              <MechanicalToggle
                checked={config.strictTypeScript}
                onChange={(next) => onUpdateConfig({ strictTypeScript: next })}
                label="Strict Compiler Mode"
                description="Enables strict, noUnusedLocals, and noFallthroughCasesInSwitch."
              />
            </div>
          )}
          {doc && (
            <DocReferenceLinks
              links={[
                { label: doc.label, url: doc.docsUrl, sub: doc.docsUrl },
                ...(doc.apiUrl
                  ? [{ label: 'Compiler / API Reference', url: doc.apiUrl, sub: doc.apiUrl }]
                  : []),
              ]}
            />
          )}
        </div>
      );
    }

    if (target.type === 'compiler') {
      const doc = TOOLCHAIN_DOCS[config.compiler];
      return (
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
              Build Compiler
            </div>
            <h3 className="text-[16px] font-semibold text-[#F1F3F5] mt-0.5">
              {config.compiler === 'swc' ? 'SWC (Rust Compiler)' : 'Standard (esbuild / Babel)'}
            </h3>
          </div>
          <p className="text-[12.5px] text-[#929BA5] leading-relaxed">{doc?.summary}</p>
          {doc && (
            <DocReferenceLinks
              links={[
                { label: doc.label, url: doc.docsUrl, sub: doc.docsUrl },
                ...(doc.apiUrl ? [{ label: 'Vite Plugin Reference', url: doc.apiUrl }] : []),
              ]}
            />
          )}
        </div>
      );
    }

    if (target.type === 'styling') {
      const doc = TOOLCHAIN_DOCS[config.styling];
      return (
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
              Styling Architecture
            </div>
            <h3 className="text-[16px] font-semibold text-[#F1F3F5] mt-0.5">
              {config.styling === 'tailwind'
                ? 'Tailwind CSS'
                : config.styling === 'sass'
                ? 'Sass / SCSS'
                : config.styling === 'css-modules'
                ? 'CSS Modules'
                : 'Plain CSS'}
            </h3>
          </div>
          <p className="text-[12.5px] text-[#929BA5] leading-relaxed">
            {config.styling === 'tailwind'
              ? 'Zero-runtime utility CSS framework. Version 4.1 integrates directly via @tailwindcss/vite without a legacy PostCSS pipeline.'
              : config.styling === 'sass'
              ? 'Installs sass-embedded for native .scss modules, mixins, and nested variables.'
              : config.styling === 'css-modules'
              ? 'Scoped *.module.css stylesheets supported natively by Vite and Next.js.'
              : 'Standard cascading stylesheets with modern CSS nesting and custom properties.'}
          </p>
          {config.styling === 'tailwind' && (
            <div className="border-t border-[#2A3038] pt-3 flex flex-col gap-2">
              <div className="text-[11px] font-medium text-[#929BA5]">Engine Version</div>
              <SegmentedSelector
                ariaLabel="Tailwind Engine Version"
                size="sm"
                fullWidth
                value={config.tailwindVersion}
                onChange={(v) => onUpdateConfig({ tailwindVersion: v })}
                options={[
                  { value: '4.1', label: 'v4.1 Vite Plugin' },
                  { value: '3.4', label: 'v3.4 PostCSS' },
                ]}
              />
            </div>
          )}
          {doc && (
            <DocReferenceLinks
              links={[
                { label: doc.label, url: doc.docsUrl, sub: doc.docsUrl },
                ...(doc.apiUrl ? [{ label: 'Theme & API Reference', url: doc.apiUrl }] : []),
              ]}
            />
          )}
        </div>
      );
    }

    if (target.type === 'testing' || target.type === 'devtools') {
      const key = target.type === 'testing' ? config.testing : target.id;
      const doc = TOOLCHAIN_DOCS[key];
      return (
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
              {target.type === 'testing' ? 'Testing Toolchain' : 'Code Quality Tool'}
            </div>
            <h3 className="text-[16px] font-semibold text-[#F1F3F5] mt-0.5">
              {doc?.label ?? 'None selected'}
            </h3>
          </div>
          <p className="text-[12.5px] text-[#929BA5] leading-relaxed">
            {doc?.summary ?? 'No automated testing suite configured for this project scaffold.'}
          </p>
          {doc && (
            <DocReferenceLinks
              links={[
                { label: doc.label, url: doc.docsUrl, sub: doc.docsUrl },
                ...(doc.apiUrl ? [{ label: 'API Reference', url: doc.apiUrl }] : []),
              ]}
            />
          )}
        </div>
      );
    }

    if (target.type === 'package') {
      const pkg = packages.find((p) => p.id === target.id) ?? packages[0];
      const isSelected = config.selectedPackageIds.includes(pkg.id);
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
                {pkg.category}
              </div>
              <h3 className="text-[16px] font-semibold text-[#F1F3F5] mt-0.5">{pkg.name}</h3>
            </div>
            <StatusIndicator
              tone={isSelected ? 'installed' : pkg.status}
              label={isSelected ? 'Queued' : undefined}
              compact
            />
          </div>

          <p className="text-[12.5px] text-[#929BA5] leading-relaxed">{pkg.description}</p>

          <dl className="grid grid-cols-2 gap-y-2 text-[12px] border-t border-[#2A3038] pt-3">
            <dt className="text-[#626D78]">NPM Package</dt>
            <dd className="font-mono text-[#F1F3F5] text-right">{pkg.npmName}</dd>
            <dt className="text-[#626D78]">Target Version</dt>
            <dd className="font-mono text-[#C7A46A] text-right">v{pkg.version}</dd>
            <dt className="text-[#626D78]">Scope</dt>
            <dd className="font-mono text-[#929BA5] text-right">
              {pkg.isDevDependency ? 'devDependencies' : 'dependencies'}
            </dd>
          </dl>

          {pkg.integrationFiles.length > 0 && (
            <div className="border-t border-[#2A3038] pt-3">
              <div className="text-[11px] font-medium text-[#929BA5] mb-1.5">
                Generated / Modified Files
              </div>
              <div className="flex flex-col gap-1">
                {pkg.integrationFiles.map((file) => (
                  <div
                    key={file}
                    className="font-mono text-[11px] text-[#929BA5] bg-[#101214] border border-[#2A3038] rounded px-2 py-1"
                  >
                    {file}
                  </div>
                ))}
              </div>
            </div>
          )}

          {pkg.peerDependencies.length > 0 && (
            <div className="border-t border-[#2A3038] pt-3">
              <div className="text-[11px] font-medium text-[#929BA5] mb-1">Peer Dependencies</div>
              <div className="font-mono text-[11.5px] text-[#77A9DC]">
                {pkg.peerDependencies.join(' · ')}
              </div>
            </div>
          )}

          <DocReferenceLinks
            links={[
              { label: `${pkg.name} Documentation`, url: pkg.docsUrl, sub: pkg.docsUrl },
              {
                label: `npm Registry (${pkg.npmName})`,
                url: `https://www.npmjs.com/package/${pkg.npmName}`,
                sub: `npmjs.com/package/${pkg.npmName}`,
              },
            ]}
          />
        </div>
      );
    }

    if (target.type === 'file-rename') {
      const manifest = buildScaffoldManifest(config);
      const pending = getPendingFileRenames(config);
      const nonCompliant = manifest.filter(
        (f) =>
          !matchesNamingConvention(
            f.targetPath,
            config.directoryNamingConvention,
            f.conventionExempt
          )
      );
      const focusedEntry = target.filePath
        ? manifest.find((m) => m.originalPath === target.filePath)
        : undefined;

      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
                Directory & File Naming
              </div>
              <h3 className="text-[16px] font-semibold text-[#F1F3F5] mt-0.5">
                {config.directoryNamingConvention}
              </h3>
            </div>
            <StatusIndicator
              tone={nonCompliant.length === 0 ? 'installed' : 'attention'}
              label={nonCompliant.length === 0 ? 'Compliant' : `${nonCompliant.length} mismatch`}
              compact
            />
          </div>

          <p className="text-[12.5px] text-[#929BA5] leading-relaxed">
            Pre-execution bulk renaming transforms scaffolded source, style, and test files to
            conform with the target{' '}
            <span className="text-[#F1F3F5] font-medium">{config.directoryLayoutMode}</span>{' '}
            directory structure before dependencies and verification run.
          </p>

          <dl className="grid grid-cols-2 gap-y-2 text-[12px] border-t border-[#2A3038] pt-3">
            <dt className="text-[#626D78]">Directory Layout</dt>
            <dd className="font-mono text-[#F1F3F5] text-right">{config.directoryLayoutMode}</dd>
            <dt className="text-[#626D78]">Convention Rule</dt>
            <dd className="font-mono text-[#C7A46A] text-right">
              {config.directoryNamingConvention}
            </dd>
            <dt className="text-[#626D78]">Total Scaffold Files</dt>
            <dd className="font-mono text-[#F1F3F5] text-right tabular-nums">
              {manifest.length}
            </dd>
            <dt className="text-[#626D78]">Queued Renames</dt>
            <dd className="font-mono text-[#65B9A5] text-right tabular-nums">
              {pending.length} mv ops
            </dd>
          </dl>

          {focusedEntry && (
            <div className="border-t border-[#2A3038] pt-3 flex flex-col gap-1.5">
              <div className="text-[11px] font-medium text-[#929BA5]">Selected File Entry</div>
              <div className="bg-[#101214] border border-[#2A3038] rounded p-2.5 font-mono text-[11px] flex flex-col gap-1">
                <div className="text-[#626D78]">src: {focusedEntry.originalPath}</div>
                <div className="text-[#C7A46A]">dst: {focusedEntry.targetPath}</div>
              </div>
              <p className="text-[11.5px] text-[#929BA5]">{focusedEntry.description}</p>
            </div>
          )}
        </div>
      );
    }

    // Default / rotary / compiler / testing / execution summary
    return (
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#C7A46A]">
            Configuration Signal
          </div>
          <h3 className="text-[16px] font-semibold text-[#F1F3F5] mt-0.5">
            {config.projectName || 'Name your project'}
          </h3>
        </div>
        <p className="text-[12.5px] text-[#929BA5] leading-relaxed">
          Active workstation profile combines{' '}
          <span className="text-[#F1F3F5] font-medium">
            {FRAMEWORKS.find((f) => f.id === config.framework)?.name}
          </span>{' '}
          with <span className="text-[#F1F3F5] font-medium">{config.packageManager}</span> on{' '}
          <span className="text-[#F1F3F5] font-medium">{config.runtime}</span>.
        </p>

        <dl className="grid grid-cols-2 gap-y-2 text-[12px] border-t border-[#2A3038] pt-3">
          <dt className="text-[#626D78]">Dev Server Port</dt>
          <dd className="font-mono text-[#F1F3F5] text-right">:{config.devPort}</dd>
          <dt className="text-[#626D78]">Preview Port</dt>
          <dd className="font-mono text-[#F1F3F5] text-right">:{config.previewPort}</dd>
          <dt className="text-[#626D78]">Heap Limit</dt>
          <dd className="font-mono text-[#F1F3F5] text-right">{config.memoryLimitMb} MB</dd>
          <dt className="text-[#626D78]">Fetch Timeout</dt>
          <dd className="font-mono text-[#F1F3F5] text-right">{config.networkTimeoutSec} s</dd>
        </dl>
      </div>
    );
  };

  return (
    <aside className="w-[320px] shrink-0 bg-[#171A1E] border-l border-[#343B43] flex flex-col h-full">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#2A3038] shrink-0">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#C7A46A]" />
          <span className="text-[13px] font-semibold text-[#F1F3F5]">Contextual Inspector</span>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Collapse Inspector Panel"
          className="p-1.5 rounded-[4px] text-[#929BA5] hover:text-[#F1F3F5] hover:bg-[#252A30] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {renderTargetDetails()}

        {/* Compatibility & Validation Diagnostics */}
        <div className="border-t border-[#2A3038] pt-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#929BA5]">
              Compatibility Matrix
            </span>
            <span className="font-mono text-[11px] text-[#626D78]">
              {issues.length === 0 ? '0 conflicts' : `${issues.length} notice(s)`}
            </span>
          </div>

          {issues.length === 0 ? (
            <div className="flex items-start gap-2.5 p-3 rounded bg-[#1D2126] border border-[#2C343C]">
              <CheckCircle2 className="w-4 h-4 text-[#70BD92] shrink-0 mt-0.5" />
              <div>
                <div className="text-[12px] font-medium text-[#F1F3F5]">
                  Configuration Verified
                </div>
                <p className="text-[11.5px] text-[#929BA5] mt-0.5">
                  All selected framework, runtime, and toolchain options are mutually compatible.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3 rounded border bg-[#1D2126] ${
                    issue.severity === 'error'
                      ? 'border-[#DF7777]/60'
                      : issue.severity === 'warning'
                      ? 'border-[#E4AD63]/55'
                      : 'border-[#77A9DC]/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {issue.severity === 'info' ? (
                      <Info className="w-4 h-4 text-[#77A9DC] shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          issue.severity === 'error' ? 'text-[#DF7777]' : 'text-[#E4AD63]'
                        }`}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-[#F1F3F5]">{issue.title}</div>
                      <p className="text-[11.5px] text-[#929BA5] leading-snug mt-0.5">
                        {issue.detail}
                      </p>
                      {issue.suggestedFix && (
                        <button
                          type="button"
                          onClick={() => onApplyFix(issue.id)}
                          className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#252A30] border border-[#3B434D] hover:border-[#C7A46A] text-[11px] font-medium text-[#C7A46A] transition-colors cursor-pointer"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Apply recommended fix</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
