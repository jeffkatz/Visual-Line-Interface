import React, { useEffect, useState } from 'react';
import {
  Activity,
  Blocks,
  BookMarked,
  BookOpen,
  ChevronDown,
  Cpu,
  FolderKanban,
  GitBranch,
  History,
  LayoutGrid,
  MoreHorizontal,
  Package,
  PlaySquare,
  Search,
  Settings,
  Stethoscope,
  User,
} from 'lucide-react';
import type { RuntimeInfo, ScreenId, SystemProbeResult } from '../../types/studio';
import { StudioLogoMark } from '../icons/BrandMarks';
import { StatusIndicator } from '../controls/StatusIndicator';

interface SidebarProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  activeRuntime: RuntimeInfo;
  systemProbe: SystemProbeResult | null;
  isExecutionActive: boolean;
  selectedPackageCount: number;
  recipeCount: number;
  onOpenCommandPalette: () => void;
}

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  meta?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  activeRuntime,
  systemProbe,
  isExecutionActive,
  selectedPackageCount,
  recipeCount,
  onOpenCommandPalette,
}) => {
  const primaryItems: NavItem[] = [
    { id: 'project-studio', label: 'Create project', icon: FolderKanban },
    {
      id: 'packages',
      label: 'Packages',
      icon: Package,
      meta: selectedPackageCount > 0 ? String(selectedPackageCount) : undefined,
    },
    {
      id: 'history',
      label: 'Install history',
      icon: History,
    },
  ];

  const moreItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'runtimes', label: 'Runtime manager', icon: Cpu },
    { id: 'workflows', label: 'Workflow builder', icon: GitBranch },
    {
      id: 'operations',
      label: 'Dry-run simulator',
      icon: PlaySquare,
      meta: isExecutionActive ? 'LIVE' : undefined,
    },
    { id: 'integrations', label: 'Integration registry', icon: Blocks },
    { id: 'recipes', label: 'Project recipes', icon: BookMarked, meta: String(recipeCount) },
    { id: 'diagnostics', label: 'Diagnostics', icon: Stethoscope },
    { id: 'docs', label: 'Docs & tutorial', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const [moreOpen, setMoreOpen] = useState(false);
  const primaryIds: ScreenId[] = ['project-studio', 'packages', 'history'];
  const moreIsActive = !primaryIds.includes(activeScreen);

  useEffect(() => {
    if (moreIsActive) setMoreOpen(true);
  }, [moreIsActive]);

  const renderGroup = (title: string, items: NavItem[]) => (
    <div className="flex flex-col gap-1">
      <div className="px-3 pb-1 text-[10.5px] font-semibold tracking-[0.08em] text-[#626D78] uppercase">
        {title}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeScreen === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectScreen(item.id)}
            className={`group flex items-center justify-between gap-2.5 w-full px-3 py-2 rounded-[4px] text-left transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C7A46A] ${
              active
                ? 'bg-[#252A30] text-[#F1F3F5] border border-[#3B434D] hardware-bezel'
                : 'text-[#929BA5] border border-transparent hover:bg-[#1D2126] hover:text-[#F1F3F5]'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active
                    ? 'text-[#C7A46A]'
                    : 'text-[#626D78] group-hover:text-[#929BA5]'
                }`}
              />
              <span className="text-[13px] font-medium truncate whitespace-nowrap">
                {item.label}
              </span>
            </span>

            {item.meta && (
              <span
                className={`font-mono text-[10.5px] tabular-nums shrink-0 ${
                  item.meta === 'LIVE'
                    ? 'text-[#65B9A5]'
                    : active
                    ? 'text-[#C7A46A]'
                    : 'text-[#626D78]'
                }`}
              >
                {item.meta}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="w-[248px] shrink-0 bg-[#171A1E] border-r border-[#343B43] flex flex-col justify-between h-full select-none">
      {/* Top Brand Wordmark */}
      <div>
        <div className="h-14 px-4 flex items-center gap-3 border-b border-[#2A3038]">
          <StudioLogoMark className="w-7 h-7 shrink-0" />
          <div className="min-w-0">
            <div className="font-['Plus_Jakarta_Sans'] text-[14px] font-semibold tracking-tight text-[#F1F3F5] whitespace-nowrap">
              Visual Line Interface
            </div>
            <div className="text-[11px] text-[#626D78] font-mono whitespace-nowrap">
              Workstation Console
            </div>
          </div>
        </div>

        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[4px] bg-[#101214] border border-[#2C323A] hover:border-[#C7A46A]/60 text-[12px] text-[#929BA5] hover:text-[#F1F3F5] cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-[#C7A46A] shrink-0" />
              <span className="truncate">Command & Docs...</span>
            </span>
            <kbd className="font-mono text-[10px] text-[#626D78] px-1.5 py-0.5 rounded bg-[#171A1E] border border-[#2A3038] shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav aria-label="Primary workspace navigation" className="p-3 flex flex-col gap-4 overflow-y-auto">
          {renderGroup('Workspace', primaryItems)}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              aria-expanded={moreOpen}
              className={`flex items-center justify-between rounded-[4px] border px-3 py-2 text-left text-[13px] transition-colors ${
                moreIsActive
                  ? 'border-[#3B434D] bg-[#252A30] text-[#F1F3F5]'
                  : 'border-transparent text-[#929BA5] hover:bg-[#1D2126] hover:text-[#F1F3F5]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MoreHorizontal className="h-4 w-4 text-[#626D78]" />
                <span>More tools</span>
              </span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreOpen && (
              <div className="mt-1 flex flex-col gap-4 border-l border-[#2A3038] pl-2">
                {renderGroup('Other workspaces', moreItems)}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Bottom Machine Status & Profile */}
      <div className="border-t border-[#2A3038] bg-[#14171A] p-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 px-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-[#929BA5] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#626D78]" />
              Local Environment
            </span>
            <StatusIndicator
              tone={activeRuntime.status}
              label={isExecutionActive ? 'Running' : 'Ready'}
              compact
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#626D78] tabular-nums">
            <span className="truncate">
              {systemProbe ? `${systemProbe.osLabel} · ${systemProbe.arch}` : 'Probing host…'}
            </span>
            <span className="text-[#929BA5] shrink-0">
              {activeRuntime.name} {activeRuntime.installedVersion ?? 'N/A'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#23282E]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-[4px] bg-[#252A30] border border-[#343B43] flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-[#C7A46A]" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-[#F1F3F5] truncate">
                Developer Bench
              </div>
              <div className="text-[10.5px] font-mono text-[#626D78] truncate">
                local · zsh
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectScreen('settings')}
            aria-label="Open Studio Settings"
            className="p-1.5 rounded-[4px] text-[#929BA5] hover:text-[#F1F3F5] hover:bg-[#252A30] border border-transparent hover:border-[#343B43] transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
