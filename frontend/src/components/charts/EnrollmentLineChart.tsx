'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useChartColors } from '@/lib/hooks/useChartColors';

interface EnrollmentLineChartProps {
  data: Array<{ date: string; count: number }>;
  height?: number;
}

export function EnrollmentLineChart({ data, height = 300 }: EnrollmentLineChartProps) {
  const c = useChartColors();
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: c.axis }}
            stroke={c.grid}
            tickFormatter={(value) => {
              const d = new Date(value);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
          />
          <YAxis tick={{ fontSize: 12, fill: c.axis }} stroke={c.grid} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: c.tooltipBg,
              border: `1px solid ${c.tooltipBorder}`,
              borderRadius: '12px',
              color: c.tooltipText,
            }}
            labelStyle={{ color: c.tooltipText }}
          />
          <Line type="monotone" dataKey="count" stroke={c.primary} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
