export type TrendPoint = {
  label: string;
  value: number;
  detail: string;
};

export function TrendLineChart({
  points,
  title,
  suffix = "",
  fixedMaximum,
}: {
  points: TrendPoint[];
  title: string;
  suffix?: string;
  fixedMaximum?: number;
}) {
  if (!points.length) {
    return <p className="py-12 text-center text-sm text-[#8993a7]">No data is available for this period.</p>;
  }

  const width = 760;
  const height = 260;
  const left = 48;
  const right = 20;
  const top = 18;
  const bottom = 46;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maximum = fixedMaximum ?? Math.max(1, ...points.map((point) => point.value));
  const roundedMaximum = fixedMaximum ?? Math.ceil(maximum / 10) * 10;
  const x = (index: number) =>
    points.length === 1 ? left + chartWidth / 2 : left + (index / (points.length - 1)) * chartWidth;
  const y = (value: number) => top + chartHeight - (value / roundedMaximum) * chartHeight;
  const coordinates = points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
  const area = `${left},${top + chartHeight} ${coordinates} ${x(points.length - 1)},${top + chartHeight}`;
  const labelStep = Math.max(1, Math.ceil(points.length / 6));
  const change = points.length > 1 ? points.at(-1)!.value - points[0].value : 0;
  const chartId = `trend-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[#8993a7]">Hover or tap a point for its service details.</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${change >= 0 ? "bg-[#edf8f1] text-[#2f7b50]" : "bg-[#fff1f0] text-[#b5524b]"}`}>
          {points.length === 1 ? "1 recorded data point" : <>{change > 0 ? "+" : ""}{change}{suffix} from first to latest</>}
        </span>
      </div>
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto min-h-56 w-full" role="img" aria-labelledby={`${chartId}-title ${chartId}-description`}>
          <title id={`${chartId}-title`}>{title}</title>
          <desc id={`${chartId}-description`}>{points.map((point) => `${point.label}: ${point.value}${suffix}`).join(", ")}</desc>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = Math.round(roundedMaximum * (1 - ratio));
            const lineY = top + chartHeight * ratio;
            return (
              <g key={ratio}>
                <line x1={left} x2={width - right} y1={lineY} y2={lineY} stroke="#e8edf6" strokeWidth="1" />
                <text x={left - 9} y={lineY + 4} textAnchor="end" fontSize="11" fill="#8993a7">{value}{suffix}</text>
              </g>
            );
          })}
          <polygon points={area} fill="#4f7df3" opacity="0.08" />
          <polyline points={coordinates} fill="none" stroke="#4f7df3" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((point, index) => (
            <g key={`${point.label}-${index}`}>
              <circle cx={x(index)} cy={y(point.value)} r="5" fill="white" stroke="#4f7df3" strokeWidth="3">
                <title>{point.detail}</title>
              </circle>
              {(index % labelStep === 0 || index === points.length - 1) && (
                <text x={x(index)} y={height - 17} textAnchor="middle" fontSize="11" fill="#758097">{point.label}</text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <details className="group mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)]">
          View chart data
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current transition group-open:rotate-180" strokeWidth="1.8"><path d="m7 10 5 5 5-5" /></svg>
        </summary>
        <div className="max-h-64 overflow-y-auto border-t border-[var(--color-border)] px-4">
          <ul className="divide-y divide-[var(--color-border)]">
            {points.map((point, index) => <li key={`${point.label}-data-${index}`} className="flex items-start justify-between gap-4 py-3 text-xs"><span className="leading-5 text-[var(--color-text-secondary)]">{point.detail}</span><strong className="shrink-0 text-[var(--color-text)]">{point.value}{suffix}</strong></li>)}
          </ul>
        </div>
      </details>
    </div>
  );
}
