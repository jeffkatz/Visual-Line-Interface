import React from 'react';

interface TechnicalMeterProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  tone?: 'brass' | 'green' | 'info' | 'warning' | 'error';
  segments?: number;
  sublabel?: string;
}

const TONE_COLORS: Record<NonNullable<TechnicalMeterProps['tone']>, string> = {
  brass: 'bg-[#C7A46A]',
  green: 'bg-[#65B9A5]',
  info: 'bg-[#77A9DC]',
  warning: 'bg-[#E4AD63]',
  error: 'bg-[#DF7777]',
};

export const TechnicalMeter: React.FC<TechnicalMeterProps> = ({
  label,
  value,
  max,
  unit = '',
  tone = 'green',
  segments = 20,
  sublabel,
}) => {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const activeSegments = Math.round(ratio * segments);
  const percent = Math.round(ratio * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11.5px] font-medium text-[#929BA5]">{label}</span>
        <div className="flex items-baseline gap-2 font-mono tabular-nums">
          {sublabel && <span className="text-[11px] text-[#626D78]">{sublabel}</span>}
          <span className="text-[12px] font-semibold text-[#F1F3F5]">
            {value}
            {unit ? ` ${unit}` : ` / ${max}`}
          </span>
          <span className="text-[11px] text-[#929BA5]">({percent}%)</span>
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="grid gap-[3px] p-1 rounded-[3px] bg-[#101214] border border-[#2A3038] hardware-recessed"
        style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: segments }, (_, i) => {
          const isLit = i < activeSegments;
          return (
            <div
              key={i}
              className={`h-2 rounded-[1px] transition-colors duration-150 ${
                isLit ? TONE_COLORS[tone] : 'bg-[#1D2126]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
