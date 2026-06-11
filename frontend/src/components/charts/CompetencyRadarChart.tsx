'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useChartColors } from '@/lib/hooks/useChartColors';

interface CompetencyRadarChartProps {
  data: Array<{ category: string; score: number }>;
  height?: number;
}

export function CompetencyRadarChart({ data, height = 320 }: CompetencyRadarChartProps) {
  const c = useChartColors();
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke={c.grid} />
          <PolarAngleAxis dataKey="category" tick={{ fill: c.axis, fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: c.axis, fontSize: 10 }} />
          <Radar
            name="Rezultati"
            dataKey="score"
            stroke={c.primary}
            fill={c.primary}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
