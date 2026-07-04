import React from 'react';

interface ChartBarProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  showValues?: boolean;
}

export function BarChart({ data, height = 160, color = '#3b82f6', showValues = false }: ChartBarProps) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end gap-1.5 h-full pb-6 relative">
        {data.map((d, i) => {
          const pct = max > 0 ? (d.value / max) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
              <div className="relative w-full flex justify-center">
                <div
                  className="w-full rounded-t-md transition-all duration-500 cursor-pointer opacity-80 hover:opacity-100 relative"
                  style={{ height: `${pct}%`, backgroundColor: color, minHeight: 4, maxHeight: height - 24 }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 text-white text-xs px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {d.value.toLocaleString()}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 absolute bottom-0">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export function LineChart({ data, height = 160, color = '#3b82f6' }: LineChartProps) {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  const w = 100 / (data.length - 1);

  const points = data.map((d, i) => {
    const x = i * w;
    const y = 100 - ((d.value - min) / range) * 85 - 5;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="w-full relative" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ height: height - 24 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={areaPoints}
          fill={`url(#grad-${color.replace('#', '')})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((d, i) => {
          const [x, y] = (points.split(' ')[i] || '0,0').split(',').map(Number);
          return (
            <circle key={i} cx={x} cy={y} r="1.5" fill={color} vectorEffect="non-scaling-stroke" className="hover:r-2" />
          );
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-gray-500 text-center" style={{ width: `${w}%` }}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ data, size = 120 }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;
  const r = 40;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = pct * circ;
          const el = (
            <circle
              key={i}
              cx="50" cy="50" r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset * circ}
              transform="rotate(-90 50 50)"
              strokeLinecap="butt"
              className="transition-all duration-500"
            />
          );
          offset += pct;
          return el;
        })}
        <circle cx="50" cy="50" r="28" fill="#111827" />
        <text x="50" y="54" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{total}</text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-gray-400">{d.label}</span>
            <span className="text-white font-medium ml-auto pl-2">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
