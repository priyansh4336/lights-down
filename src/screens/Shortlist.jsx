import React from 'react';
import GlareHover from '../components/GlareHover';
import Stack from '../components/Stack';
import { PulseHeartButton } from '../components/MicroInteractions';
import PosterArtwork from '../components/PosterArtwork';
import { CrewLinkHostBox } from '../components/CrewLinkPanel';

export default function Shortlist({
  shortlist,
  activeShortlistIdx,
  setActiveShortlistIdx,
  crewCount,
  soloRerollsLeft,
  playerVetoTokens,
  onVeto,
  onPick,
  onMergeRemoteVotes,
  showToast
}) {
  return (
    <section className="ld-screen ld-shortlist-screen" aria-label="Rule of 3 Shortlist">
      <div className="ld-shortlist-header">
        <div>
          <span className="ld-eyebrow">
            RULE OF 3 SHORTLIST // {crewCount > 1 ? 'LEAST-MISERY GROUP CONSENSUS' : 'GENRE-DIVERSIFIED TOP 3'}
          </span>
          <h2 className="ld-section-title">Three Reels. Zero Analysis Paralysis.</h2>
        </div>

        <div className="ld-token-bank">
          {crewCount === 1 ? (
            <span className="ld-token-pill">
              🎲 SOLO REROLL TOKENS: <strong>{soloRerollsLeft}</strong> LEFT
            </span>
          ) : (
            playerVetoTokens.map((hasToken, idx) => (
              <button
                key={idx}
                type="button"
                disabled={!hasToken}
                className={`ld-player-veto-chip ${hasToken ? 'is-ready' : 'is-spent'}`}
                onClick={() => onVeto(idx)}
                title={hasToken ? `Click to spend Player ${idx + 1}'s Veto on active card` : 'Veto spent'}
              >
                P{idx + 1} VETO {hasToken ? '🪙' : '✕'}
              </button>
            ))
          )}
        </div>
      </div>

      {crewCount > 1 && onMergeRemoteVotes && (
        <CrewLinkHostBox
          poolFilms={shortlist}
          onMergeVotes={onMergeRemoteVotes}
          showToast={showToast}
        />
      )}

      <div className="ld-shortlist-layout">
        <div className="ld-rule-of-3-grid">
          {shortlist.map((film, idx) => {
            const isFocused = idx === activeShortlistIdx;
            const [c1, c2] = film.gradient || ['#FF2A85', '#4B0082'];
            return (
              <GlareHover
                key={film.id}
                borderRadius="18px"
                glareOpacity={0.35}
                className={`ld-shortlist-glare-wrap ${isFocused ? 'is-focused' : ''}`}
              >
                <article
                  className={`ld-shortlist-card ${isFocused ? 'is-focused' : ''}`}
                  tabIndex={0}
                  role="region"
                  aria-label={`Reel ${idx + 1}: ${film.title} (${film.year}), ${film.matchScore}% match`}
                  onClick={() => setActiveShortlistIdx(idx)}
                  onFocus={() => setActiveShortlistIdx(idx)}
                  style={{ '--card-c1': c1, '--card-c2': c2 }}
                >
                  <div className="ld-card-ribbon">
                    <span className="ld-slot-num">REEL 0{idx + 1} // {film.primaryGenre.toUpperCase()}</span>
                    <span className="ld-match-badge">{film.matchScore}% FIT</span>
                  </div>

                  <PosterArtwork film={film} className="ld-card-gradient-banner">
                    <span className="ld-banner-lang">{film.language} • {film.year}</span>
                    <h3 className="ld-banner-title">{film.title}</h3>
                    <div className="ld-banner-metrics">
                      <span>⏱ {film.runtime}m</span>
                      <span>⚡ Hook: {film.hookMinutes}m</span>
                      <span>🔋 Battery: {film.brainBattery}/5</span>
                      <span>★ {film.rating}</span>
                    </div>
                  </PosterArtwork>

                  <p className="ld-card-desc">&ldquo;{film.desc}&rdquo;</p>

                  <div className="ld-card-snack">
                    <span>🍿 {film.snack}</span>
                  </div>

                  <div className="ld-card-actions">
                    <button
                      type="button"
                      className="ld-card-veto-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveShortlistIdx(idx);
                        const pIdx = crewCount === 1 ? 0 : playerVetoTokens.findIndex(Boolean);
                        if (pIdx !== -1) onVeto(pIdx);
                        else showToast('All veto tokens spent! Pick one of the 3 reels.');
                      }}
                    >
                      ✕ VETO
                    </button>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <PulseHeartButton
                        label="THIS ONE"
                        sublabel="Lock reel →"
                        onClick={() => onPick(film)}
                      />
                    </div>
                  </div>
                </article>
              </GlareHover>
            );
          })}
        </div>

        {shortlist.length > 0 && (
          <div className="ld-stack-sidebar">
            <span className="ld-stack-label">TACTILE REEL STACK (FLICK TO CYCLE)</span>
            <div className="ld-stack-holder">
              <Stack
                layout="fan"
                spread={0.55}
                depth={0.45}
                sendToBackOnClick
                cards={shortlist.map((film, i) => (
                  <div
                    key={film.id}
                    className="ld-mini-stack-card"
                    style={{
                      background: `linear-gradient(135deg, ${film.gradient[0]}, ${film.gradient[1]})`
                    }}
                  >
                    <span className="ld-mini-kicker">0{i + 1} // {film.genres[0]}</span>
                    <strong>{film.title}</strong>
                    <small>{film.runtime}m • Hook in {film.hookMinutes}m</small>
                  </div>
                ))}
              />
            </div>
            <p className="ld-keyboard-tip">
              Keyboard: <kbd>←</kbd> Veto active card • <kbd>→</kbd> Lock active reel
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
