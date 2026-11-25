import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  ExecutionCommandStep,
  ExecutionStepState,
  HistoryRecord,
} from '../../types/studio';

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#14171B',
  border: '1px solid #343B43',
  borderRadius: '4px',
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: '11.5px',
  color: '#F1F3F5',
  padding: '8px 10px',
};

export const PipelinePhaseChart: React.FC<{
  steps: ExecutionCommandStep[];
}> = ({ steps }) => {
  const data = useMemo(() => {
    const phases: Array<ExecutionCommandStep['phase']> = [
      'Scaffold',
      'Configure',
      'Dependencies',
      'Tooling',
      'Repository',
      'Verify',
    ];
    return phases.map((phase) => {
      const matching = steps.filter((s) => s.phase === phase);
      return {
        phase,
        seconds: matching.reduce((acc, s) => acc + s.estimatedSec, 0),
        ops: matching.length,
      };
    });
  }, [steps]);

  return (
    <div className="h-[196px] w-full min-w-0">
      <ResponsiveContainer width="100%" height={196} minWidth={0} initialDimension={{ width: 420, height: 196 }}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#23282E" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="phase"
            tick={{ fill: '#929BA5', fontSize: 10.5, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={{ stroke: '#2A3038' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#626D78', fontSize: 10.5, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={false}
            tickLine={false}
            unit="s"
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            cursor={{ fill: 'rgba(199, 164, 106, 0.08)' }}
            formatter={(value: unknown, name: unknown) => [
              name === 'seconds' ? `${value}s est.` : `${value} ops`,
              name === 'seconds' ? 'Est. Duration' : 'Operations',
            ]}
          />
          <Bar dataKey="seconds" radius={[3, 3, 0, 0]} maxBarSize={34}>
            {data.map((entry) => (
              <Cell
                key={entry.phase}
                fill={entry.ops > 0 ? '#C7A46A' : '#252A30'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
export const HistoryDurationChart: React.FC<{
  history: HistoryRecord[];
}> = ({ history }) => {
  const data = useMemo(
    () =>
      [...history]
        .slice(0, 8)
        .reverse()
        .map((item) => ({
          name: item.projectName.slice(0, 14),
          durationSec: item.durationSec,
          commands: item.commandCount,
          status: item.status,
        })),
    [history]
  );

  if (data.length === 0) {
    return (
      <div className="h-[196px] flex items-center justify-center text-[12px] font-mono text-[#626D78]">
        No pipeline executions recorded yet.
      </div>
    );
  }

  return (
    <div className="h-[196px] w-full min-w-0">
      <ResponsiveContainer width="100%" height={196} minWidth={0} initialDimension={{ width: 420, height: 196 }}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="cliGreenFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#65B9A5" stopOpacity={0.38} />
              <stop offset="95%" stopColor="#65B9A5" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#23282E" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#929BA5', fontSize: 10.5, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={{ stroke: '#2A3038' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#626D78', fontSize: 10.5, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={false}
            tickLine={false}
            unit="s"
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value: unknown) => [`${value}s`, 'Duration']}
          />
          <Area
            type="monotone"
            dataKey="durationSec"
            stroke="#65B9A5"
            strokeWidth={2}
            fill="url(#cliGreenFill)"
            dot={{ r: 3, fill: '#65B9A5', stroke: '#101214', strokeWidth: 1.5 }}
            activeDot={{ r: 4.5, fill: '#C7A46A' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ExecutionTimingChart: React.FC<{
  steps: ExecutionStepState[];
}> = ({ steps }) => {
  const data = useMemo(
    () =>
      steps.map((s, idx) => ({
        step: `${String(idx + 1).padStart(2, '0')} ${s.step.phase.slice(0, 4)}`,
        estimatedSec: s.step.estimatedSec,
        actualSec: Number((s.durationMs / 1000).toFixed(2)),
        status: s.status,
      })),
    [steps]
  );

  if (data.length === 0) return null;

  return (
    <div className="h-[175px] w-full min-w-0">
      <ResponsiveContainer width="100%" height={175} minWidth={0} initialDimension={{ width: 640, height: 175 }}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#23282E" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="step"
            tick={{ fill: '#929BA5', fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={{ stroke: '#2A3038' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#626D78', fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={false}
            tickLine={false}
            unit="s"
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            cursor={{ fill: 'rgba(119, 169, 220, 0.08)' }}
          />
          <Bar dataKey="estimatedSec" name="Baseline Est. (s)" fill="#343B43" radius={[2, 2, 0, 0]} maxBarSize={22} />
          <Bar dataKey="actualSec" name="Actual Dry-Run (s)" radius={[2, 2, 0, 0]} maxBarSize={22}>
            {data.map((entry) => (
              <Cell
                key={entry.step}
                fill={
                  entry.status === 'failed'
                    ? '#DF7777'
                    : entry.status === 'completed'
                    ? '#65B9A5'
                    : '#C7A46A'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
