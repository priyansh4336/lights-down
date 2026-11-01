import React from 'react';
import { motion } from 'framer-motion';

export function SplitFlapText({ text = '', className = '', accentColor = '#FFB347' }) {
  const chars = String(text).split('');
  return (
    <span className={`rb-split-flap ${className}`} aria-label={text}>
      {chars.map((ch, idx) => (
        <motion.span
          key={`${idx}-${ch}`}
          className={`rb-flap-tile ${ch === ' ' ? 'rb-flap-space' : ''}`}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{
            delay: idx * 0.025,
            type: 'spring',
            stiffness: 320,
            damping: 22
          }}
          style={{ '--flap-accent': accentColor }}
          aria-hidden="true"
        >
          <span className="rb-flap-char">{ch === ' ' ? '\u00A0' : ch}</span>
          <span className="rb-flap-hinge" />
        </motion.span>
      ))}
    </span>
  );
}

export function Grainient({ colorA = '#FFB347', colorB = '#8B5CF6' }) {
  return (
    <div
      className="rb-grainient-bg"
      style={{
        '--grain-a': colorA,
        '--grain-b': colorB
      }}
      aria-hidden="true"
    >
      <div className="rb-grainient-mesh" />
      <div className="rb-grainient-vignette" />
    </div>
  );
}

