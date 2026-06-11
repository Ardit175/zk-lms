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

interface TopCoursesChartProps {
  data: Array<{ title: string; enrollmentCount: number }>;
  height?: number;
}

export function TopCoursesChart({ data, height = 300 }: TopCoursesChartProps) {
  const c = useChartColors();
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
          <XAxis type="number" tick={{ fontSize: 12, fill: c.axis }} stroke={c.grid} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="title"
            tick={{ fontSize: 12, fill: c.axis }}
            stroke={c.grid}
            width={150}
            tickFormatter={(value: string) =>
              value.length > 20 ? `${value.slice(0, 20)}...` : value
            }
          />
          <Tooltip
            cursor={{ fill: c.grid, opacity: 0.3 }}
            contentStyle={{
              backgroundColor: c.tooltipBg,
              border: `1px solid ${c.tooltipBorder}`,
              borderRadius: '12px',
              color: c.tooltipText,
            }}
            labelStyle={{ color: c.tooltipText }}
          />
          <Bar dataKey="enrollmentCount" fill={c.primary} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
