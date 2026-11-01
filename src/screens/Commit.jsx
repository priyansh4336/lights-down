import React from 'react';
import { motion } from 'framer-motion';
import DecryptedText from '../components/DecryptedText';
import { HoloCard, TearTicket } from '../components/MicroInteractions';

export default function Commit({ chosenFilm, backupFilm, onCommit, onBack }) {
  if (!chosenFilm) return null;

  return (
    <motion.section
      className="ld-screen ld-reveal-screen"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="ld-section-header">
        <span className="ld-eyebrow">LOCKED SELECTION // COMMIT RITUAL</span>
        <h2 className="ld-decrypted-headline">
          <DecryptedText
            text={chosenFilm.title.toUpperCase()}
            animateOn="view"
            speed={40}
            maxIterations={12}
            sequential
          />
        </h2>
      </div>

      <div className="ld-reveal-grid">
        <HoloCard film={chosenFilm} backupFilm={backupFilm} />

        <div className="ld-commit-column">
          <div className="ld-commit-explainer">
            <h3>Make It Official</h3>
            <p>
              No more second-guessing or opening another tab. Tear the ticket stub below to dim the booth lights and start your 90-second settling countdown.
            </p>
            {backupFilm && (
              <div className="ld-backup-assurance">
                <strong>🛡️ 20-Minute Rule Active:</strong> If <em>{chosenFilm.title}</em> doesn&apos;t grab you in 20 minutes, <strong>{backupFilm.title}</strong> ({backupFilm.runtime}m, {backupFilm.hookMinutes}m hook) is pre-loaded on standby.
              </div>
            )}
          </div>

          <TearTicket film={chosenFilm} onCommit={onCommit} />

          <button
            type="button"
            className="ld-back-link"
            onClick={onBack}
          >
            ← Wait, take me back to the 3-card shortlist
          </button>
        </div>
      </div>
    </motion.section>
  );
}
