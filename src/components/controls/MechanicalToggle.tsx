import React from 'react';

interface MechanicalToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  onFocusInspect?: () => void;
}

export const MechanicalToggle: React.FC<MechanicalToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  onFocusInspect,
}) => {
  return (
    <div
      onClick={() => {
        if (onFocusInspect) onFocusInspect();
      }}
      className={`flex items-center justify-between gap-4 px-3.5 py-2.5 rounded border transition-colors ${
        checked
          ? 'bg-[#1D2126] border-[#3E4752]'
          : 'bg-[#171A1E] border-[#2A3038] hover:border-[#343B43]'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-[#F1F3F5] truncate">{label}</span>
          <span
            className={`font-mono text-[10px] tracking-wider ${
              checked ? 'text-[#65B9A5]' : 'text-[#626D78]'
            }`}
          >
            {checked ? 'ON' : 'OFF'}
          </span>
        </div>
        {description && (
          <p className="text-[11.5px] text-[#929BA5] leading-snug mt-0.5">{description}</p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (onFocusInspect) onFocusInspect();
          onChange(!checked);
        }}
        className={`relative inline-flex items-center w-12 h-6 rounded-[4px] border transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7A46A] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed hardware-recessed ${
          checked
            ? 'bg-[#252A30] border-[#65B9A5]/70'
            : 'bg-[#101214] border-[#343B43]'
        }`}
      >
        {/* Recessed track engravings */}
        <span
          className={`absolute left-1.5 text-[9px] font-mono select-none ${
            checked ? 'text-[#65B9A5]' : 'text-transparent'
          }`}
          aria-hidden="true"
        >
          I
        </span>
        <span
          className={`absolute right-1.5 text-[9px] font-mono select-none ${
            !checked ? 'text-[#626D78]' : 'text-transparent'
          }`}
          aria-hidden="true"
        >
          O
        </span>

        {/* Machined metal shuttle */}
        <span
          className={`inline-flex items-center justify-center w-5 h-4 rounded-[3px] border transition-transform duration-150 ${
            checked
              ? 'translate-x-[23px] bg-[#313840] border-[#65B9A5] shadow-[0_1px_3px_rgba(0,0,0,0.6)]'
              : 'translate-x-[3px] bg-[#22272D] border-[#434C57] shadow-[0_1px_2px_rgba(0,0,0,0.6)]'
          }`}
        >
          <span
            className={`w-1 h-2 rounded-[1px] ${checked ? 'bg-[#65B9A5]' : 'bg-[#626D78]'}`}
            aria-hidden="true"
          />
        </span>
      </button>
    </div>
  );
};
