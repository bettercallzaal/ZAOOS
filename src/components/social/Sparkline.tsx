'use client';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}

export function Sparkline({ data, width = 120, height = 32, color = '#f5a623', showArea = true }: SparklineProps) {
  if (!data.length) return <svg width={width} height={height} />;
  if (data.length === 1) {
    return (
      <svg width={width} height={height}>
        <circle cx={width / 2} cy={height / 2} r={2} fill={color} />
      </svg>
    );
  }

  const pad = 2;
  const h = height - pad * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + h - ((v - min) / range) * h,
  }));

  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = `M${points[0].x},${height} L${line} L${points[points.length - 1].x},${height} Z`;

  const minPt = points.reduce((a, b) => (a.y > b.y ? a : b));
  const maxPt = points.reduce((a, b) => (a.y < b.y ? a : b));

  const gradId = `sg-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {showArea && <path d={areaPath} fill={`url(#${gradId})`} />}
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={minPt.x} cy={minPt.y} r={1.5} fill={color} opacity={0.6} />
      <circle cx={maxPt.x} cy={maxPt.y} r={1.5} fill={color} opacity={0.6} />
    </svg>
  );
}
