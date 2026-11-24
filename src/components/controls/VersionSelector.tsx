import React from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import type { StatusTone } from '../../types/studio';
import { StatusIndicator } from './StatusIndicator';

interface VersionSelectorProps {
  label: string;
  installedVersion: string | null;
  latestVersion: string;
  selectedVersion: string;
  options: string[];
  status: StatusTone;
  onChange: (version: string) => void;
  onUpgrade?: () => void;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  label,
  installedVersion,
  latestVersion,
  selectedVersion,
  options,
  status,
  onChange,
  onUpgrade,
}) => {
  const needsUpgrade = installedVersion !== null && !installedVersion.includes(latestVersion);

  return (
    <div className="flex flex-col gap-2 p-3 rounded bg-[#171A1E] border border-[#2C323A]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-[#929BA5] tracking-wide">{label}</span>
        <StatusIndicator tone={status} compact />
      </div>

      <div className="relative">
        <select
          aria-label={label}
          value={selectedVersion}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-[#101214] border border-[#343B43] hover:border-[#49535E] focus:border-[#C7A46A] rounded px-3 py-1.5 pr-8 font-mono text-[12px] text-[#F1F3F5] outline-none cursor-pointer transition-colors"
        >
          {options.map((ver) => (
            <option key={ver} value={ver} className="bg-[#171A1E] text-[#F1F3F5]">
              {ver}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[#929BA5] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-[#626D78]">
        <span>
          Installed:{' '}
          <span className="text-[#929BA5]">{installedVersion ?? 'None'}</span>
        </span>
        {needsUpgrade && onUpgrade ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex items-center gap-0.5 text-[#C7A46A] hover:underline cursor-pointer"
          >
            <span>Update to {latestVersion}</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        ) : (
          <span>
            Latest: <span className="text-[#65B9A5]">{latestVersion}</span>
          </span>
        )}
      </div>
    </div>
  );
};
