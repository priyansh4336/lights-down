import React from 'react';
import { motion } from 'framer-motion';
import ShinyText from '../components/ShinyText';
import { SplitFlapText } from '../components/SplitFlapAndGrainient';

export default function Landing({ activeMoodObj, chosenFilm, onStartSetup, onResumePlan }) {
  return (
    <motion.section
      className="ld-screen ld-landing-screen"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="ld-landing-kicker">
        <span>PROJECTION BOOTH READY // Aaj ki raat ka plan</span>
      </div>

      <h1 className="ld-hero-headline">
        <SplitFlapText
          text="TONIGHT'S PROGRAMME"
          accentColor={activeMoodObj.beamColor}
        />
      </h1>

      <div className="ld-hero-sub-wrap">
        <ShinyText
          text="Stop scrolling for 40 minutes only to bail 20 minutes in. From 'I don't know' to 'lights down, film playing' in under 90 seconds—with a pre-loaded Plan B."
          color="#c8c8d4"
          shineColor="#ffffff"
          speed={3}
          className="ld-hero-shiny"
        />
      </div>

      <div className="ld-sop-badges">
        <div className="ld-sop-pill">
          <strong>🛡️ 20-MIN BACKUP REEL</strong>
          <span>Bakwaas nikli? Instant Plan B ready.</span>
        </div>
        <div className="ld-sop-pill">
          <strong>🔋 BRAIN BATTERY FIT</strong>
          <span>Match your actual focus level (1–5).</span>
        </div>
        <div className="ld-sop-pill">
          <strong>🎟️ RULE OF 3 + VETO</strong>
          <span>Zero paradox of choice. Tear stub to commit.</span>
        </div>
      </div>

      <div className="ld-landing-cta-row">
        <button
          type="button"
          className="ld-primary-cta cursor-target"
          onClick={onStartSetup}
        >
          <span>START THE NIGHT</span>
          <span className="ld-cta-arrow">→</span>
        </button>

        {chosenFilm && (
          <button
            type="button"
            className="ld-secondary-cta cursor-target"
            onClick={onResumePlan}
          >
            RESUME ACTIVE PLAN ({chosenFilm.title})
          </button>
        )}
      </div>
    </motion.section>
  );
}
