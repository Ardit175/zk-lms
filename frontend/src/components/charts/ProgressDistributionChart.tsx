'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useChartColors } from '@/lib/hooks/useChartColors';

interface ProgressDistributionChartProps {
  data: Array<{ range: string; count: number }>;
  height?: number;
}

export function ProgressDistributionChart({
  data,
  height = 280,
}: ProgressDistributionChartProps) {
  const c = useChartColors();
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
          <XAxis dataKey="range" stroke={c.grid} tick={{ fontSize: 12, fill: c.axis }} />
          <YAxis stroke={c.grid} tick={{ fontSize: 12, fill: c.axis }} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: c.grid, opacity: 0.3 }}
            contentStyle={{
              backgroundColor: c.tooltipBg,
              border: `1px solid ${c.tooltipBorder}`,
              borderRadius: '12px',
              color: c.tooltipText,
            }}
            labelStyle={{ color: c.tooltipText }}
            formatter={(value) => [`${value} studente`, 'Studente']}
          />
          <Bar dataKey="count" fill={c.primary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
