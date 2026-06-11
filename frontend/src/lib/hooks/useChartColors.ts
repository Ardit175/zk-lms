'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';

export interface ChartColors {
  grid: string;
  axis: string;
  primary: string;
  series: string[];
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
}

// Sensible SSR/first-paint defaults (dark-ish) until the effect reads real tokens.
const FALLBACK: ChartColors = {
  grid: 'hsl(217 33% 20%)',
  axis: 'hsl(217 20% 65%)',
  primary: 'hsl(235 89% 68%)',
  series: ['hsl(235 89% 68%)', 'hsl(142 69% 50%)', 'hsl(38 92% 55%)', 'hsl(199 89% 60%)', 'hsl(280 70% 68%)'],
  tooltipBg: 'hsl(222 44% 11%)',
  tooltipBorder: 'hsl(217 33% 20%)',
  tooltipText: 'hsl(210 40% 98%)',
};

/**
 * Reads the active theme's CSS variables and returns concrete `hsl(...)` strings
 * recharts can use for SVG strokes/fills. Recomputes whenever the theme toggles
 * so charts recolor with light/dark.
 */
export function useChartColors(): ChartColors {
  const { theme } = useTheme();
  const [colors, setColors] = useState<ChartColors>(FALLBACK);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const v = (name: string) => `hsl(${styles.getPropertyValue(name).trim()})`;
    setColors({
      grid: v('--border'),
      axis: v('--muted-foreground'),
      primary: v('--chart-1'),
      series: [v('--chart-1'), v('--chart-2'), v('--chart-3'), v('--chart-4'), v('--chart-5')],
      tooltipBg: v('--popover'),
      tooltipBorder: v('--border'),
      tooltipText: v('--popover-foreground'),
    });
  }, [theme]);

  return colors;
}
