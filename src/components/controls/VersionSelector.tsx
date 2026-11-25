import React from 'react';
import type { StatusTone } from '../../types/studio';
import { StatusIndicator } from './StatusIndicator';

interface VersionSelectorProps {
  label: string;
  installedVersion: string | null;
  selectedVersion: string;
  status: StatusTone;
  onChange: (version: string) => void;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  label,
  installedVersion,
  selectedVersion,
  status,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-2 p-3 rounded bg-[#171A1E] border border-[#2C323A]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-[#929BA5] tracking-wide">{label}</span>
        <StatusIndicator tone={status} compact />
      </div>

      <div>
        <input
          type="text"
          aria-label={label}
          value={selectedVersion}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Version (e.g. 22.14.0; latest for Deno, stable/canary for Bun)"
          className="w-full bg-[#101214] border border-[#343B43] hover:border-[#49535E] focus:border-[#C7A46A] rounded px-3 py-1.5 font-mono text-[12px] text-[#F1F3F5] outline-none transition-colors"
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-[#626D78]">
        <span>
          Installed:{' '}
          <span className="text-[#929BA5]">{installedVersion ?? 'None'}</span>
        </span>
        <span>Target version</span>
      </div>
    </div>
  );
};
