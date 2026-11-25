import React from 'react';
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from '@ui-sdk/react/segmented-control';

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
    <SegmentedControl
      value={value}
      onValueChange={(next) => {
        const selected = options.find((option) => option.value === next);
        if (selected) onChange(selected.value);
      }}
      aria-label={ariaLabel}
      className={`relative inline-flex items-center gap-1 p-1 rounded-[5px] bg-[#101214] border border-[#2C3239] hardware-recessed ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      <SegmentedControlIndicator
        className="pointer-events-none absolute z-0 top-[var(--segmented-control-indicator-top)] left-[var(--segmented-control-indicator-left)] h-[var(--segmented-control-indicator-height)] w-[var(--segmented-control-indicator-width)] rounded-[3px] border border-[#C7A46A]/65 bg-[#252A30] shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition-[top,left,width,height] duration-200 data-[activation-direction=none]:transition-none"
      />
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <SegmentedControlItem
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
            className={`relative z-10 flex items-center justify-center gap-2 rounded-[3px] border border-transparent bg-transparent transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#C7A46A] disabled:opacity-40 disabled:cursor-not-allowed ${
              fullWidth ? 'flex-1' : ''
            } ${size === 'sm' ? 'px-2.5 py-1.5 text-[12px]' : 'px-3.5 py-2 text-[12.5px]'} ${
              active
                ? 'text-[#F1F3F5] font-medium'
                : 'text-[#929BA5] hover:text-[#F1F3F5] hover:bg-[#1A1E23]'
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
          </SegmentedControlItem>
        );
      })}
    </SegmentedControl>
  );
}
