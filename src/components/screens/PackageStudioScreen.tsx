import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Globe,
  Layers,
  PackagePlus,
  RefreshCw,
  RotateCcw,
  Search,
  Sliders,
} from 'lucide-react';
import type {
  FrameworkId,
  InspectorTarget,
  NpmSearchPackage,
  PackageCategory,
  PackageManagerId,
  StudioPackage,
} from '../../types/studio';
import { fetchNpmPackageMeta, searchNpmRegistry } from '../../services/systemClient';
import { StatusIndicator } from '../controls/StatusIndicator';

interface PackageStudioScreenProps {
  packages: StudioPackage[];
  selectedPackageIds: string[];
  activeFramework: FrameworkId;
  packageManager: PackageManagerId;
  onTogglePackage: (packageId: string) => void;
  onUpdatePackageVersion: (packageId: string, version: string) => void;
  onAddCustomPackage: (pkg: StudioPackage) => void;
  onInspect: (target: InspectorTarget) => void;
  onApplyToStudio: () => void;
}

const CATEGORIES: PackageCategory[] = [
  'All',
  'Styling & UI',
  'Language & Types',
  'Linting & Format',
  'Testing',
  'Routing & State',
];

export const PackageStudioScreen: React.FC<PackageStudioScreenProps> = ({
  packages,
  selectedPackageIds,
  activeFramework,
  packageManager,
  onTogglePackage,
  onUpdatePackageVersion,
  onAddCustomPackage,
  onInspect,
  onApplyToStudio,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PackageCategory>('All');
  const [setupMode, setSetupMode] = useState<'all' | 'integrations' | 'packages'>('all');

  // Live npm registry lookup state
  const [npmResults, setNpmResults] = useState<NpmSearchPackage[]>([]);
  const [searchingNpm, setSearchingNpm] = useState(false);
  const [npmError, setNpmError] = useState<string | null>(null);
  const [importingPkgName, setImportingPkgName] = useState<string | null>(null);
  const [importAsDev, setImportAsDev] = useState(false);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchesCat = category === 'All' || pkg.category === category;
      const matchesMode =
        setupMode === 'all' ||
        (setupMode === 'integrations' ? pkg.hasFullIntegration : !pkg.hasFullIntegration);
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        pkg.name.toLowerCase().includes(q) ||
        pkg.npmName.toLowerCase().includes(q) ||
        pkg.description.toLowerCase().includes(q);
      return matchesCat && matchesMode && matchesSearch;
    });
  }, [packages, category, setupMode, search]);

  const queuedPackages = useMemo(
    () => packages.filter((p) => selectedPackageIds.includes(p.id)),
    [packages, selectedPackageIds]
  );

  const handleSearchNpm = async () => {
    const q = search.trim();
    if (q.length < 2) {
      setNpmError('Enter at least 2 characters in the search bar to query registry.npmjs.org.');
      return;
    }
    setSearchingNpm(true);
    setNpmError(null);
    try {
      const list = await searchNpmRegistry(q);
      setNpmResults(list);
      if (list.length === 0) {
        setNpmError(`No npm packages matched "${q}".`);
      }
    } catch (err) {
      setNpmError(err instanceof Error ? err.message : 'Unable to reach npm registry.');
    } finally {
      setSearchingNpm(false);
    }
  };

  const handleImportNpmPackage = async (pkgName: string) => {
    const existing = packages.find((p) => p.npmName.toLowerCase() === pkgName.toLowerCase());
    if (existing) {
      if (!selectedPackageIds.includes(existing.id)) {
        onTogglePackage(existing.id);
      }
      onInspect({ type: 'package', id: existing.id });
      return;
    }

    setImportingPkgName(pkgName);
    setNpmError(null);
    try {
      const detail = await fetchNpmPackageMeta(pkgName);
      const safeId = `npm-${detail.name.replace(/[^a-z0-9_-]+/gi, '-')}`;
      const newPkg: StudioPackage = {
        id: safeId,
        name: detail.name,
        npmName: detail.name,
        category: importAsDev ? 'Linting & Format' : 'Routing & State',
        description: detail.description,
        version: detail.version,
        availableVersions: detail.availableVersions,
        isDevDependency: importAsDev,
        hasFullIntegration: false,
        integrationFiles: [],
        peerDependencies: detail.peerDependencies,
        compatibleFrameworks: ['vite', 'nextjs', 'astro', 'vue', 'sveltekit'],
        status: detail.deprecated ? 'attention' : 'available',
        configSummary: `${detail.license} · ${detail.deprecated ? 'Deprecated upstream' : 'Imported from npm registry'}`,
        docsUrl: detail.homepage || detail.npmUrl,
        license: detail.license,
        deprecated: detail.deprecated,
        isCustomNpm: true,
      };
      onAddCustomPackage(newPkg);
      onInspect({ type: 'package', id: safeId });
    } catch (err) {
      setNpmError(err instanceof Error ? err.message : `Failed to import "${pkgName}".`);
    } finally {
      setImportingPkgName(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b border-[#2A3038] bg-[#14171B] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-[#F1F3F5] uppercase">
            Package & Library Studio
          </h1>
          <p className="text-[13px] text-[#929BA5] mt-0.5">
            Curated framework integrations plus live registry.npmjs.org package lookup and version pinning.
          </p>
        </div>

        <button
          type="button"
          onClick={onApplyToStudio}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#C7A46A] hover:bg-[#D2B27C] text-[#101214] text-[12.5px] font-semibold uppercase tracking-wide cursor-pointer transition-colors"
        >
          <span>Sync Tray to Project Studio ({queuedPackages.length})</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[1060px] mx-auto flex flex-col gap-6">
          {/* Search & Category Controls */}
          <div className="flex flex-col gap-3 bg-[#1D2126] border border-[#343B43] rounded-[5px] p-4 hardware-bezel">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-[#626D78] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && search.trim().length >= 2 && filteredPackages.length === 0) {
                      handleSearchNpm();
                    }
                  }}
                  placeholder="Filter catalog or search registry.npmjs.org (e.g. zod, tanstack, pinia)..."
                  aria-label="Search packages"
                  className="w-full bg-[#101214] border border-[#343B43] focus:border-[#C7A46A] rounded-[4px] pl-9 pr-3 py-2 text-[13px] text-[#F1F3F5] outline-none"
                />
              </div>

              <button
                type="button"
                disabled={searchingNpm}
                onClick={handleSearchNpm}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#252A30] border border-[#C7A46A]/60 hover:border-[#C7A46A] disabled:opacity-50 text-[12px] font-medium text-[#F1F3F5] whitespace-nowrap cursor-pointer transition-colors"
              >
                {searchingNpm ? (
                  <RefreshCw className="w-3.5 h-3.5 text-[#C7A46A] animate-spin" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-[#C7A46A]" />
                )}
                <span>{searchingNpm ? 'Querying npm…' : 'Search npm Registry'}</span>
              </button>

              <div className="flex items-center gap-1 p-1 rounded-[5px] bg-[#101214] border border-[#2C3239]">
                {(
                  [
                    { id: 'all', label: 'All Capabilities' },
                    { id: 'integrations', label: 'Full Integration Setup' },
                    { id: 'packages', label: 'Package Install Only' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSetupMode(mode.id)}
                    className={`px-3 py-1.5 rounded-[3px] text-[12px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                      setupMode === mode.id
                        ? 'bg-[#252A30] text-[#F1F3F5] border border-[#C7A46A]/60'
                        : 'text-[#929BA5] hover:text-[#F1F3F5] border border-transparent'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#2A3038]">
              <div className="flex flex-wrap items-center gap-1.5">
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1 rounded-[3px] text-[12px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#252A30] text-[#C7A46A] border border-[#C7A46A]/50'
                          : 'bg-[#171A1E] text-[#929BA5] border border-[#2A3038] hover:text-[#F1F3F5]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              <label className="inline-flex items-center gap-2 text-[11.5px] font-mono text-[#929BA5] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={importAsDev}
                  onChange={(e) => setImportAsDev(e.target.checked)}
                  className="accent-[#C7A46A]"
                />
                <span>Import npm hits as devDependency</span>
              </label>
            </div>
          </div>

          {npmError && (
            <div className="bg-[#1D2126] border border-[#E4AD63]/60 rounded-[5px] px-4 py-3 flex items-center justify-between gap-3 text-[12px] text-[#E4AD63]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{npmError}</span>
              </div>
              <button
                type="button"
                onClick={() => setNpmError(null)}
                className="text-[11px] font-mono text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Live npm Registry Search Results */}
          {npmResults.length > 0 && (
            <div className="bg-[#171A1E] border border-[#C7A46A]/50 rounded-[5px] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 border-b border-[#2A3038] pb-2.5">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#C7A46A]" />
                  <span className="text-[12.5px] font-semibold uppercase tracking-wider text-[#F1F3F5]">
                    Live npm Registry Results
                  </span>
                  <span className="font-mono text-[11px] text-[#65B9A5]">
                    {npmResults.length} packages
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setNpmResults([])}
                  className="font-mono text-[11px] text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer"
                >
                  Clear Results
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {npmResults.map((hit) => {
                  const alreadyInCatalog = packages.find(
                    (p) => p.npmName.toLowerCase() === hit.name.toLowerCase()
                  );
                  const isQueued = alreadyInCatalog
                    ? selectedPackageIds.includes(alreadyInCatalog.id)
                    : false;
                  const busy = importingPkgName === hit.name;

                  return (
                    <div
                      key={hit.name}
                      className="bg-[#101214] border border-[#2C3239] rounded-[4px] p-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12.5px] font-semibold text-[#F1F3F5] truncate">
                            {hit.name}
                          </span>
                          <span className="font-mono text-[11px] text-[#C7A46A] shrink-0">
                            v{hit.version}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-[#929BA5] mt-1 line-clamp-2">
                          {hit.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 font-mono text-[10.5px]">
                          <a
                            href={hit.npmUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#77A9DC] hover:text-[#F1F3F5]"
                          >
                            <span>npm</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          {hit.homepage && (
                            <a
                              href={hit.homepage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#929BA5] hover:text-[#F1F3F5]"
                            >
                              <span>Docs</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleImportNpmPackage(hit.name)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border text-[11.5px] font-medium shrink-0 cursor-pointer transition-colors ${
                          isQueued
                            ? 'bg-[#252A30] border-[#65B9A5] text-[#65B9A5]'
                            : 'bg-[#1D2126] border-[#343B43] hover:border-[#C7A46A] text-[#F1F3F5]'
                        }`}
                      >
                        {busy ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-[#C7A46A]" />
                        ) : isQueued ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <PackagePlus className="w-3 h-3 text-[#C7A46A]" />
                        )}
                        <span>
                          {busy ? 'Importing…' : isQueued ? 'Queued' : 'Queue'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Configuration Tray */}
          <div className="bg-[#171A1E] border border-[#343B43] rounded-[5px] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C7A46A]" />
                <span className="text-[12.5px] font-semibold uppercase tracking-wider text-[#F1F3F5]">
                  Configuration Tray
                </span>
                <span className="font-mono text-[11px] text-[#626D78]">
                  {queuedPackages.length} selected for {packageManager} install
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#65B9A5]">
                Target framework: {activeFramework}
              </span>
            </div>

            {queuedPackages.length === 0 ? (
              <div className="text-[12px] text-[#626D78] py-2">
                No extra packages queued. Select tiles below or search registry.npmjs.org above.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {queuedPackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => onTogglePackage(pkg.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#252A30] border border-[#3E4752] hover:border-[#DF7777]/70 text-[12px] text-[#F1F3F5] cursor-pointer transition-colors"
                    title="Click to remove from configuration tray"
                  >
                    <span className="font-medium">{pkg.name}</span>
                    <span className="font-mono text-[11px] text-[#C7A46A]">v{pkg.version}</span>
                    <span className="text-[#626D78] text-[11px]">×</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Package Tiles Grid */}
          {filteredPackages.length === 0 ? (
            <div className="bg-[#171A1E] border border-[#2D333B] rounded-[5px] p-8 flex flex-col items-center justify-center text-center gap-3">
              <Search className="w-6 h-6 text-[#626D78]" />
              <div>
                <div className="text-[14px] font-medium text-[#F1F3F5]">
                  No curated libraries match your current filters
                </div>
                <p className="text-[12px] text-[#929BA5] mt-1">
                  Search live on registry.npmjs.org or reset category and capability filters.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {search.trim().length >= 2 && (
                  <button
                    type="button"
                    onClick={handleSearchNpm}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#C7A46A] hover:bg-[#D2B27C] text-[#101214] text-[12px] font-semibold cursor-pointer transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Search "{search.trim()}" on npm</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setCategory('All');
                    setSetupMode('all');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#252A30] border border-[#343B43] hover:border-[#C7A46A] text-[12px] font-medium text-[#F1F3F5] cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#C7A46A]" />
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPackages.map((pkg) => {
                const isQueued = selectedPackageIds.includes(pkg.id);
                const compatible = pkg.compatibleFrameworks.includes(activeFramework);

                return (
                  <div
                    key={pkg.id}
                    onClick={() => onInspect({ type: 'package', id: pkg.id })}
                    className={`bg-[#1D2126] border rounded-[5px] p-4 flex flex-col justify-between gap-4 transition-colors cursor-pointer ${
                      isQueued
                        ? 'border-[#C7A46A] hardware-bezel'
                        : 'border-[#343B43] hover:border-[#46505B]'
                    }`}
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-[15px] font-semibold text-[#F1F3F5]">{pkg.name}</h3>
                            <span className="font-mono text-[11px] text-[#626D78]">
                              {pkg.npmName}
                            </span>
                          </div>
                          <div className="text-[11.5px] text-[#929BA5] mt-0.5 flex items-center gap-1.5">
                            <span>{pkg.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className={pkg.hasFullIntegration ? 'text-[#C7A46A]' : 'text-[#929BA5]'}>
                              {pkg.hasFullIntegration ? 'Full Integration Setup' : 'Package Only'}
                            </span>
                          </div>
                        </div>

                        <StatusIndicator
                          tone={!compatible ? 'attention' : isQueued ? 'installed' : 'available'}
                          label={!compatible ? 'Check Framework' : isQueued ? 'Queued' : 'Compatible'}
                          compact
                        />
                      </div>

                      <p className="text-[12.5px] text-[#929BA5] leading-snug">{pkg.description}</p>

                      <div className="text-[11.5px] font-mono text-[#626D78] bg-[#14171B] border border-[#262B32] rounded px-2.5 py-1.5 flex items-center justify-between gap-2">
                        <span className="truncate">{pkg.configSummary}</span>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <a
                            href={pkg.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[#77A9DC] hover:text-[#F1F3F5] transition-colors"
                          >
                            <span>Docs</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <a
                            href={`https://www.npmjs.com/package/${pkg.npmName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[#929BA5] hover:text-[#F1F3F5] transition-colors"
                          >
                            <span>npm</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#2A3038]">
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-[#626D78]" htmlFor={`ver-${pkg.id}`}>
                          Version
                        </label>
                        <select
                          id={`ver-${pkg.id}`}
                          value={pkg.version}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdatePackageVersion(pkg.id, e.target.value)}
                          className="bg-[#101214] border border-[#343B43] rounded px-2 py-1 font-mono text-[11.5px] text-[#F1F3F5] outline-none cursor-pointer"
                        >
                          {pkg.availableVersions.map((v) => (
                            <option key={v} value={v}>
                              v{v}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePackage(pkg.id);
                          onInspect({ type: 'package', id: pkg.id });
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] border text-[12px] font-medium cursor-pointer transition-colors ${
                          isQueued
                            ? 'bg-[#252A30] border-[#65B9A5] text-[#65B9A5]'
                            : 'bg-[#171A1E] border-[#343B43] hover:border-[#C7A46A] text-[#F1F3F5]'
                        }`}
                      >
                        {isQueued ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Configured</span>
                          </>
                        ) : pkg.hasFullIntegration ? (
                          <>
                            <Sliders className="w-3.5 h-3.5 text-[#C7A46A]" />
                            <span>Install & Configure</span>
                          </>
                        ) : (
                          <>
                            <PackagePlus className="w-3.5 h-3.5 text-[#C7A46A]" />
                            <span>Add Package</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
