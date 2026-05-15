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

interface TopCoursesChartProps {
  data: Array<{ title: string; enrollmentCount: number }>;
  height?: number;
}

export function TopCoursesChart({ data, height = 300 }: TopCoursesChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis
            type="category"
            dataKey="title"
            tick={{ fontSize: 12 }}
            stroke="#94a3b8"
            width={150}
            tickFormatter={(value: string) =>
              value.length > 20 ? `${value.slice(0, 20)}...` : value
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="enrollmentCount" fill="#4f46e5" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
