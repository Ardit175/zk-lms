'use client';

import { useEffect, useRef } from 'react';

interface ConfettiProps {
  /** how many pieces to launch */
  count?: number;
  /** total run time in ms before the canvas clears */
  duration?: number;
}

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
}

// Indigo / emerald / amber / sky / violet — matches the chart palette mood.
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#0ea5e9', '#a855f7', '#ec4899'];

/**
 * Lightweight canvas confetti burst, no dependencies. Fires once on mount and
 * cleans itself up. Renders nothing (and never animates) under
 * prefers-reduced-motion, so the dramatic moment stays accessible.
 */
export function Confetti({ count = 160, duration = 2600 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const W = window.innerWidth;
    const originX = W / 2;
    const pieces: Piece[] = Array.from({ length: count }, () => {
      const angle = (Math.random() - 0.5) * Math.PI; // upward-ish spread
      const speed = 6 + Math.random() * 9;
      return {
        x: originX + (Math.random() - 0.5) * 120,
        y: window.innerHeight * 0.32,
        vx: Math.sin(angle) * speed,
        vy: -Math.abs(Math.cos(angle) * speed) - 4,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        size: 6 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });

    const start = performance.now();
    let raf = 0;
    const gravity = 0.22;

    const frame = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fade = Math.max(0, 1 - elapsed / duration);

      for (const p of pieces) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
        ctx.restore();
      }

      if (elapsed < duration) {
        raf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [count, duration]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
    />
  );
}
