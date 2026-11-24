import React, { useCallback, useEffect, useRef, useState } from 'react';

interface RotaryKnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  onInspect?: () => void;
  size?: number;
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  onInspect,
  size = 64,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const dragStartY = useRef<number>(0);
  const dragStartVal = useRef<number>(value);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const clampAndSnap = useCallback(
    (raw: number) => {
      const clamped = Math.min(max, Math.max(min, raw));
      const snapped = Math.round((clamped - min) / step) * step + min;
      return Math.min(max, Math.max(min, snapped));
    },
    [min, max, step]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: PointerEvent) => {
      const deltaY = dragStartY.current - e.clientY;
      const range = max - min;
      const deltaVal = (deltaY / 120) * range;
      onChange(clampAndSnap(dragStartVal.current + deltaVal));
    };
    const handleUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDragging, min, max, clampAndSnap, onChange]);

  const normalized = max === min ? 0 : (value - min) / (max - min);
  // Sweep from -135 deg to +135 deg
  const angleDeg = -135 + normalized * 270;

  const center = size / 2;
  const radius = size / 2 - 7;

  // Compute SVG arc for active range
  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const indicatorTip = polarToCartesian(center, center, radius - 7, angleDeg);
  const indicatorBase = polarToCartesian(center, center, 4, angleDeg);

  // Generate 11 tick marks along the -135..+135 sweep
  const ticks = Array.from({ length: 11 }, (_, idx) => {
    const tickAngle = -135 + (idx / 10) * 270;
    const outer = polarToCartesian(center, center, radius + 3, tickAngle);
    const inner = polarToCartesian(center, center, radius + 0.5, tickAngle);
    return { outer, inner, active: tickAngle <= angleDeg + 0.5 };
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      onChange(clampAndSnap(value + step));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(clampAndSnap(value - step));
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      onChange(clampAndSnap(value + step * 10));
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      onChange(clampAndSnap(value - step * 10));
    }
  };

  const commitDraft = () => {
    const parsed = Number(draft);
    if (!Number.isNaN(parsed)) {
      onChange(clampAndSnap(parsed));
    } else {
      setDraft(String(value));
    }
    setEditing(false);
  };

  return (
    <div
      onClick={onInspect}
      className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded border border-[#2C323A] bg-[#171A1E] hover:border-[#3A424C] transition-colors select-none"
    >
      <span className="text-[11px] font-medium text-[#929BA5] tracking-wide whitespace-nowrap">
        {label}
      </span>

      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onKeyDown={handleKeyDown}
        onPointerDown={(e) => {
          e.preventDefault();
          if (onInspect) onInspect();
          dragStartY.current = e.clientY;
          dragStartVal.current = value;
          setIsDragging(true);
        }}
        onWheel={(e) => {
          e.preventDefault();
          const dir = e.deltaY < 0 ? 1 : -1;
          onChange(clampAndSnap(value + dir * step));
        }}
        className={`relative cursor-ns-resize rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7A46A] ${
          isDragging ? 'ring-1 ring-[#C7A46A]/60' : ''
        }`}
        style={{ width: size, height: size }}
        title="Drag vertically, scroll, or use arrow keys to adjust"
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Tick marks */}
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.inner.x}
              y1={t.inner.y}
              x2={t.outer.x}
              y2={t.outer.y}
              stroke={t.active ? '#C7A46A' : '#3B434D'}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          ))}

          {/* Base arc track */}
          <path
            d={describeArc(center, center, radius - 3, -135, 135)}
            fill="none"
            stroke="#252A30"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Active brass arc */}
          {normalized > 0.01 && (
            <path
              d={describeArc(center, center, radius - 3, -135, angleDeg)}
              fill="none"
              stroke="#C7A46A"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Machined metallic cap */}
          <circle
            cx={center}
            cy={center}
            r={radius - 6}
            fill="#1D2126"
            stroke="#3B434E"
            strokeWidth="1.2"
          />
          <circle
            cx={center}
            cy={center}
            r={radius - 8}
            fill="#23282E"
            stroke="#101214"
            strokeWidth="1"
          />

          {/* Indicator needle */}
          <line
            x1={indicatorBase.x}
            y1={indicatorBase.y}
            x2={indicatorTip.x}
            y2={indicatorTip.y}
            stroke="#F1F3F5"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx={center} cy={center} r="2.2" fill="#C7A46A" />
        </svg>
      </div>

      {/* Numeric value readout + min/max bounds */}
      <div className="flex items-center justify-between w-full gap-2 pt-0.5">
        <span className="font-mono text-[10px] text-[#626D78] tabular-nums">{min}</span>
        {editing ? (
          <input
            type="text"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitDraft();
              if (e.key === 'Escape') {
                setDraft(String(value));
                setEditing(false);
              }
            }}
            className="w-16 text-center font-mono text-[12px] bg-[#101214] border border-[#C7A46A] rounded px-1 py-0.5 text-[#F1F3F5] outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="font-mono text-[12px] font-semibold text-[#F1F3F5] tabular-nums hover:text-[#C7A46A] transition-colors cursor-text"
            title="Click to enter exact numeric value"
          >
            {value}
            {unit && <span className="text-[10px] text-[#929BA5] ml-0.5 font-normal">{unit}</span>}
          </button>
        )}
        <span className="font-mono text-[10px] text-[#626D78] tabular-nums">{max}</span>
      </div>
    </div>
  );
};
