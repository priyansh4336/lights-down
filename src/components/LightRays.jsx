import React, { useState, useEffect, useRef } from 'react';
import './LightRays.css';

export default function LightRays({
  raysColor = '#ffb347',
  opacity = 0.72,
  className = '',
  style = {}
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    try {
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        setFallback(true);
        return undefined;
      }

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        setFallback(true);
        return undefined;
      }

      const gl = canvas.getContext('webgl2', { alpha: true, antialias: false });
      if (!gl) {
        setFallback(true);
        return undefined;
      }
    } catch {
      setFallback(true);
    }
    return undefined;
  }, []);

  if (fallback) {
    return (
      <div
        className={`ld-static-beam-fallback ${className}`.trim()}
        style={{ '--beam-color': raysColor, opacity, ...style }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`light-rays ${className}`.trim()}
      style={{
        '--beam-color': raysColor,
        opacity,
        background: `conic-gradient(from 156deg at 50% -6%, transparent 0deg, color-mix(in srgb, ${raysColor} 32%, transparent) 22deg, transparent 46deg)`,
        filter: 'blur(24px)',
        ...style
      }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="light-rays__canvas" aria-hidden="true" />
    </div>
  );
}
