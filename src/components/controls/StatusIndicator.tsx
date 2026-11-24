import React from 'react';
import type { StatusTone } from '../../types/studio';

interface StatusIndicatorProps {
  tone: StatusTone;
  label?: string;
  compact?: boolean;
}

const TONE_MAP: Record<
  StatusTone,
  {
    defaultLabel: string;
    ledClass: string;
    textClass: string;
    glyph: string;
  }
> = {
  installed: {
    defaultLabel: 'Installed',
    ledClass: 'bg-[#70BD92] shadow-[0_0_6px_rgba(112,189,146,0.45)]',
    textClass: 'text-[#70BD92]',
    glyph: '■',
  },
  available: {
    defaultLabel: 'Available',
    ledClass: 'bg-[#77A9DC]',
    textClass: 'text-[#77A9DC]',
    glyph: '◆',
  },
  missing: {
    defaultLabel: 'Missing',
    ledClass: 'bg-[#626D78]',
    textClass: 'text-[#929BA5]',
    glyph: '□',
  },
  running: {
    defaultLabel: 'Running',
    ledClass: 'bg-[#65B9A5] shadow-[0_0_6px_rgba(101,185,165,0.55)]',
    textClass: 'text-[#65B9A5]',
    glyph: '▸',
  },
  failed: {
    defaultLabel: 'Failed',
    ledClass: 'bg-[#DF7777] shadow-[0_0_6px_rgba(223,119,119,0.45)]',
    textClass: 'text-[#DF7777]',
    glyph: '✕',
  },
  attention: {
    defaultLabel: 'Needs attention',
    ledClass: 'bg-[#E4AD63] shadow-[0_0_6px_rgba(228,173,99,0.45)]',
    textClass: 'text-[#E4AD63]',
    glyph: '▲',
  },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ tone, label, compact = false }) => {
  const cfg = TONE_MAP[tone];
  const displayLabel = label ?? cfg.defaultLabel;

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
      <span
        className={`inline-block rounded-[2px] ${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${cfg.ledClass}`}
        aria-hidden="true"
      />
      <span className={`font-mono text-[11px] font-medium tracking-tight ${cfg.textClass}`}>
        {displayLabel}
      </span>
    </span>
  );
};
