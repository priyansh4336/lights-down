import React from 'react';
import { motion } from 'framer-motion';
import { MOODS } from '../data/movies';

export default function MoodPicker({ onSelectMood }) {
  return (
    <section className="mood-picker-screen" aria-label="Pick your movie mood">
      <div className="zine-hero">
        <div className="zine-stickers-row">
          <span className="sticker-tag sticker-rotate-left">ISSUE #04 // LATE NIGHT</span>
          <span className="sticker-tag sticker-yellow sticker-rotate-right">NO BORING GRIDS ★</span>
        </div>

        <h1 className="hero-title">
          WHAT&apos;S YOUR <span className="highlight-stroke">VIBE</span> TONIGHT?
        </h1>
        <p className="hero-subtitle">
          Pick a mood below. We&apos;ll deal you a 10-card stack of cult classics, Bollywood bangers &amp; midnight mind-melters.
        </p>
      </div>

      <div className="mood-grid">
        {MOODS.map((mood, idx) => (
          <motion.button
            key={mood.id}
            type="button"
            className={`mood-card mood-shape-${mood.shape}`}
            style={{
              '--mood-card-bg': mood.bgColor,
              '--mood-card-accent': mood.accentColor,
              '--mood-rotation': mood.rotation,
            }}
            initial={{ opacity: 0, y: 24, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: parseFloat(mood.rotation) }}
            transition={{ delay: idx * 0.06, type: 'spring', stiffness: 260, damping: 18 }}
            whileHover={{
              scale: 1.04,
              rotate: 0,
              transition: { duration: 0.15 }
            }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelectMood(mood)}
          >
            <div className="mood-card-top">
              <span className="mood-badge">{mood.badgeText}</span>
              <span className="mood-emoji" role="img" aria-label={mood.label}>
                {mood.emoji}
              </span>
            </div>

            <div className="mood-card-body">
              <h2 className="mood-name">{mood.label}</h2>
              <p className="mood-tagline">{mood.tagline}</p>
            </div>

            <div className="mood-card-footer">
              <span className="mood-cta">DEAL ME IN →</span>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

