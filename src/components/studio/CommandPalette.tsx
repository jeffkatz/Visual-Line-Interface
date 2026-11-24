import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Copy,
  ExternalLink,
  FolderKanban,
  Search,
  Terminal,
} from 'lucide-react';
import type { ScreenId, StudioPackage } from '../../types/studio';
import { FRAMEWORKS, INITIAL_PACKAGE_MANAGERS, INITIAL_RUNTIMES, TOOLCHAIN_DOCS } from '../../data/studioCatalog';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  packages: StudioPackage[];
  onNavigate: (screen: ScreenId) => void;
  onCopyCommands: () => void;
  onSelectFramework: (frameworkId: 'vite' | 'nextjs' | 'astro' | 'vue' | 'sveltekit') => void;
}

interface PaletteAction {
  id: string;
  group: 'Navigation' | 'Quick Action' | 'Framework Docs' | 'Language & Toolchain Docs' | 'Library Docs';
  title: string;
  subtitle: string;
  href?: string;
  onSelect?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  packages,
  onNavigate,
  onCopyCommands,
  onSelectFramework,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const actions = useMemo<PaletteAction[]>(() => {
    const navItems: PaletteAction[] = [
      { id: 'nav-studio', group: 'Navigation', title: 'Create project', subtitle: 'Choose a framework, folder, and packages; install locally', onSelect: () => onNavigate('project-studio') },
      { id: 'nav-overview', group: 'Navigation', title: 'Overview', subtitle: 'Workstation readiness and quick recipes', onSelect: () => onNavigate('overview') },
      { id: 'nav-packages', group: 'Navigation', title: 'Package & Library Studio', subtitle: 'Browse and configure dependencies', onSelect: () => onNavigate('packages') },
      { id: 'nav-runtimes', group: 'Navigation', title: 'Runtime Manager', subtitle: 'Manage Node.js, Deno, and Bun channels', onSelect: () => onNavigate('runtimes') },
      { id: 'nav-workflows', group: 'Navigation', title: 'Workflow Builder', subtitle: 'Edit dependency-ordered operation blocks', onSelect: () => onNavigate('workflows') },
      { id: 'nav-operations', group: 'Navigation', title: 'Operations Centre', subtitle: 'Monitor live dry-run execution and logs', onSelect: () => onNavigate('operations') },
      { id: 'nav-docs', group: 'Navigation', title: 'Documentation & Tutorial', subtitle: 'Guided walkthrough, prompt guide & codebase map', onSelect: () => onNavigate('docs') },
      { id: 'nav-settings', group: 'Navigation', title: 'Workstation Settings', subtitle: 'Shell target, defaults, and AI provider routing', onSelect: () => onNavigate('settings') },
    ];

    const quickItems: PaletteAction[] = [
      { id: 'act-copy', group: 'Quick Action', title: 'Copy Generated Execution Plan', subtitle: 'Copy full shell command sequence to clipboard', onSelect: onCopyCommands },
      ...FRAMEWORKS.map((fw) => ({
        id: `sw-${fw.id}`,
        group: 'Quick Action' as const,
        title: `Switch Foundation to ${fw.name}`,
        subtitle: fw.tagline,
        onSelect: () => {
          onSelectFramework(fw.id);
          onNavigate('project-studio');
        },
      })),
    ];

    const fwDocs: PaletteAction[] = FRAMEWORKS.map((fw) => ({
      id: `doc-fw-${fw.id}`,
      group: 'Framework Docs',
      title: `${fw.name} Official Documentation`,
      subtitle: fw.docsUrl,
      href: fw.docsUrl,
    }));

    const toolchainDocs: PaletteAction[] = [
      ...Object.values(TOOLCHAIN_DOCS).map((doc) => ({
        id: `doc-tc-${doc.id}`,
        group: 'Language & Toolchain Docs' as const,
        title: doc.label,
        subtitle: `${doc.category} · ${doc.docsUrl}`,
        href: doc.docsUrl,
      })),
      ...INITIAL_RUNTIMES.map((rt) => ({
        id: `doc-rt-${rt.id}`,
        group: 'Language & Toolchain Docs' as const,
        title: `${rt.name} Runtime Docs`,
        subtitle: rt.docsUrl,
        href: rt.docsUrl,
      })),
      ...INITIAL_PACKAGE_MANAGERS.map((pm) => ({
        id: `doc-pm-${pm.id}`,
        group: 'Language & Toolchain Docs' as const,
        title: `${pm.name} CLI Documentation`,
        subtitle: pm.docsUrl,
        href: pm.docsUrl,
      })),
    ];

    const libDocs: PaletteAction[] = packages.map((pkg) => ({
      id: `doc-pkg-${pkg.id}`,
      group: 'Library Docs',
      title: `${pkg.name} (${pkg.npmName})`,
      subtitle: pkg.docsUrl,
      href: pkg.docsUrl,
    }));

    return [...navItems, ...quickItems, ...fwDocs, ...toolchainDocs, ...libDocs];
  }, [packages, onNavigate, onCopyCommands, onSelectFramework]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions.slice(0, 14);
    return actions
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.subtitle.toLowerCase().includes(q) ||
          a.group.toLowerCase().includes(q)
      )
      .slice(0, 18);
  }, [actions, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) =>
        filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length
      );
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault();
      const chosen = filtered[activeIndex];
      if (chosen.onSelect) {
        chosen.onSelect();
        onClose();
      } else if (chosen.href) {
        // Trigger anchor click programmatically instead of window.open
        const link = document.getElementById(`palette-link-${chosen.id}`);
        link?.click();
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Workstation Command Palette"
    >
      <div
        className="w-full max-w-[620px] bg-[#171A1E] border border-[#3B434D] rounded-[6px] shadow-[0_24px_60px_rgba(0,0,0,0.75)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="px-4 py-3 border-b border-[#2A3038] flex items-center gap-3 bg-[#14171B]">
          <Search className="w-4 h-4 text-[#C7A46A] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to workspace, switch stack, or open library/language docs..."
            className="flex-1 bg-transparent text-[13.5px] text-[#F1F3F5] placeholder:text-[#626D78] outline-none"
          />
          <kbd className="font-mono text-[10.5px] text-[#626D78] px-1.5 py-0.5 rounded bg-[#101214] border border-[#2C323A]">
            ESC
          </kbd>
        </div>

        <div className="max-h-[380px] overflow-y-auto divide-y divide-[#23282E]">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-[13px] text-[#626D78]">
              No matching commands or documentation references.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const active = idx === activeIndex;
              const icon =
                item.group === 'Navigation' ? (
                  <FolderKanban className="w-4 h-4 text-[#C7A46A]" />
                ) : item.group === 'Quick Action' ? (
                  item.id === 'act-copy' ? (
                    <Copy className="w-4 h-4 text-[#65B9A5]" />
                  ) : (
                    <Terminal className="w-4 h-4 text-[#77A9DC]" />
                  )
                ) : (
                  <BookOpen className="w-4 h-4 text-[#77A9DC]" />
                );

              if (item.href) {
                return (
                  <a
                    key={item.id}
                    id={`palette-link-${item.id}`}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex items-center justify-between gap-3 px-4 py-2.5 transition-colors ${
                      active ? 'bg-[#252A30]' : 'hover:bg-[#1D2126]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-[#F1F3F5] truncate">
                          {item.title}
                        </div>
                        <div className="font-mono text-[11px] text-[#626D78] truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#929BA5] shrink-0">
                      <span>{item.group}</span>
                      <ExternalLink className="w-3 h-3 text-[#C7A46A]" />
                    </span>
                  </a>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    item.onSelect?.();
                    onClose();
                  }}
                  className={`w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    active ? 'bg-[#252A30]' : 'hover:bg-[#1D2126]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{icon}</span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[#F1F3F5] truncate">
                        {item.title}
                      </div>
                      <div className="text-[11.5px] text-[#626D78] truncate">{item.subtitle}</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#929BA5] shrink-0">
                    <span>{item.group}</span>
                    <ArrowRight className="w-3 h-3 text-[#C7A46A]" />
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-[#14171B] border-t border-[#2A3038] flex items-center justify-between text-[11px] font-mono text-[#626D78]">
          <span>↑↓ navigate · ↵ select</span>
          <span>Visual Line Interface Command Palette</span>
        </div>
      </div>
    </div>
  );
};
