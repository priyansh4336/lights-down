import React from 'react';
import { motion } from 'framer-motion';

/**
 * Option Wheel (components/option-wheel)
 * Dial-style interactive wheel/grid for picking tonight's Vibe in Step 1.
 */
export function OptionWheel({ options = [], value, onChange }) {
  const activeIndex = Math.max(0, options.findIndex((o) => o.id === value));
  const activeOption = options[activeIndex] || options[0];

  return (
    <div className="rb-option-wheel" role="radiogroup" aria-label="Select tonight's vibe">
      <div className="rb-wheel-dial">
        {options.map((item, idx) => {
          const isSelected = item.id === value;
          return (
            <motion.button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`rb-wheel-spoke ${isSelected ? 'is-selected' : ''}`}
              style={{
                '--spoke-color': item.beamColor,
                '--spoke-accent': item.accentColor
              }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(item.id)}
            >
              <span className="rb-spoke-index">0{idx + 1}</span>
              <span className="rb-spoke-emoji" aria-hidden="true">{item.emoji}</span>
              <span className="rb-spoke-label">{item.label}</span>
              <span className="rb-spoke-hinglish">{item.hinglish}</span>
            </motion.button>
          );
        })}
      </div>

      {activeOption && (
        <motion.div
          key={activeOption.id}
          className="rb-wheel-readout"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ '--readout-color': activeOption.beamColor }}
        >
          <span className="rb-readout-badge">PROJECTOR FILTER: {activeOption.label.toUpperCase()}</span>
          <p className="rb-readout-desc">{activeOption.tagline}</p>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Jelly Radio (micro/jelly-radio)
 * Elastic spring radio cards for selecting Who's Watching (Crew Fit).
 */
export function JellyRadio({ options = [], value, onChange }) {
  return (
    <div className="rb-jelly-radio-group" role="radiogroup" aria-label="Who is watching tonight">
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <motion.button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`rb-jelly-pill ${selected ? 'is-active' : ''}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.92, scaleX: 1.06, scaleY: 0.94 }}
            animate={
              selected
                ? { scale: [0.94, 1.05, 0.98, 1], transition: { duration: 0.38 } }
                : { scale: 1 }
            }
            onClick={() => onChange(opt.id)}
          >
            <div className="rb-jelly-dot">
              {selected && <motion.span layoutId="jellyCore" className="rb-jelly-core" />}
            </div>
            <span className="rb-jelly-emoji" aria-hidden="true">{opt.emoji}</span>
            <div className="rb-jelly-text">
              <strong>{opt.label}</strong>
              <small>{opt.sub}</small>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

