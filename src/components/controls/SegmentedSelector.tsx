import React from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface SegmentedSelectorProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

export function SegmentedSelector<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  fullWidth = false,
}: SegmentedSelectorProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1 p-1 rounded-[5px] bg-[#101214] border border-[#2C3239] hardware-recessed ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center justify-center gap-2 rounded-[3px] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#C7A46A] disabled:opacity-40 disabled:cursor-not-allowed ${
              fullWidth ? 'flex-1' : ''
            } ${size === 'sm' ? 'px-2.5 py-1.5 text-[12px]' : 'px-3.5 py-2 text-[12.5px]'} ${
              active
                ? 'bg-[#252A30] text-[#F1F3F5] border border-[#C7A46A]/65 shadow-[0_1px_2px_rgba(0,0,0,0.5)] font-medium'
                : 'bg-transparent text-[#929BA5] border border-transparent hover:text-[#F1F3F5] hover:bg-[#1A1E23]'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
            {opt.sublabel && (
              <span
                className={`font-mono text-[10.5px] ${
                  active ? 'text-[#C7A46A]' : 'text-[#626D78]'
                }`}
              >
                {opt.sublabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
