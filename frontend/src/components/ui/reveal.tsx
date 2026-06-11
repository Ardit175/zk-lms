'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

interface RevealProps extends HTMLMotionProps<'div'> {
  /** stagger offset in seconds when used in a list */
  delay?: number;
  /** translate distance in px */
  y?: number;
}

/**
 * Fade-and-rise a block into view on scroll. `delay` lets callers stagger a
 * sequence (e.g. cards animating in one after another). prefers-reduced-motion
 * is honored globally, but we also keep the initial offset tiny so it's gentle.
 */
export function Reveal({ delay = 0, y = 14, children, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
