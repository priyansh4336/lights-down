import React from 'react';
import { motion } from 'framer-motion';
import PosterArtwork from '../components/PosterArtwork';
import { CrewLinkHostBox } from '../components/CrewLinkPanel';

export default function HotSeat({
  hotSeatInterstitial,
  setHotSeatInterstitial,
  hotSeatPlayerIndex,
  crewCount,
  hotSeatCardIdx,
  hotSeatPool,
  onVote,
  onMergeRemoteVotes,
  showToast
}) {
  const currentFilm = hotSeatPool[hotSeatCardIdx];

  return (
    <section className="ld-screen ld-hotseat-screen" aria-label="Group Hot Seat voting">
      {hotSeatInterstitial ? (
        <motion.div
          key={`interstitial-${hotSeatPlayerIndex}`}
          className="ld-hotseat-interstitial"
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <span className="ld-eyebrow">PRIVATE VOTING // NO PEEKING</span>
          <h2 className="ld-hotseat-title">
            Pass the phone to <span className="ld-accent-text">Player {hotSeatPlayerIndex + 1}</span>
          </h2>
          <p className="ld-hotseat-sub">
            Previous choices are hidden. We score the crew using <strong>Least-Misery</strong> (nobody being miserable beats one person being hyped).
          </p>
          <button
            type="button"
            className="ld-primary-cta"
            onClick={() => setHotSeatInterstitial(false)}
          >
            I AM PLAYER {hotSeatPlayerIndex + 1} — SHOW MY 5 CARDS →
          </button>
        </motion.div>
      ) : (
        <motion.div
          key={`vote-${hotSeatPlayerIndex}-${hotSeatCardIdx}`}
          className="ld-hotseat-card-box"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div className="ld-hotseat-top">
            <span>PLAYER {hotSeatPlayerIndex + 1} OF {crewCount}</span>
            <span>CARD {hotSeatCardIdx + 1} / {hotSeatPool.length}</span>
          </div>

          {currentFilm && (
            <PosterArtwork
              film={currentFilm}
              className="ld-hotseat-film-card"
            >
              <div className="ld-hotseat-film-meta">
                <span>{currentFilm.language} • {currentFilm.runtime}m</span>
                <span>⚡ {currentFilm.hookMinutes}m hook</span>
                <span>🔋 Battery {currentFilm.brainBattery}/5</span>
              </div>
              <h3>{currentFilm.title} ({currentFilm.year})</h3>
              <p>&ldquo;{currentFilm.desc}&rdquo;</p>
              <div className="ld-hotseat-genres">
                {currentFilm.genres.map((g) => (
                  <span key={g} className="ld-genre-tag">{g}</span>
                ))}
              </div>
            </PosterArtwork>
          )}

          <div className="ld-hotseat-actions">
            <button
              type="button"
              className="ld-veto-btn"
              onClick={() => onVote('no')}
            >
              👎 NAH / MEH
            </button>
            <button
              type="button"
              className="ld-yes-btn"
              onClick={() => onVote('yes')}
            >
              👍 DOWN FOR THIS
            </button>
          </div>
        </motion.div>
      )}

      {onMergeRemoteVotes && (
        <CrewLinkHostBox
          poolFilms={hotSeatPool}
          onMergeVotes={onMergeRemoteVotes}
          showToast={showToast}
        />
      )}
    </section>
  );
}
