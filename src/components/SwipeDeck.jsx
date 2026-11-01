import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import MovieCard from './MovieCard';

export default function SwipeDeck({
  deck,
  activeMood,
  tasteProfile,
  lastActionToast,
  onChoice,
  onStartOver,
  onOpenWatchlist
}) {
  const [forcedStamp, setForcedStamp] = useState(null);

  const topMovie = deck[0];

  const triggerChoice = useCallback(
    (action) => {
      if (!topMovie || forcedStamp) return;
      setForcedStamp(action);
      setTimeout(() => {
        onChoice(topMovie, action);
        setForcedStamp(null);
      }, 220);
    },
    [topMovie, forcedStamp, onChoice]
  );

  // Keyboard accessibility: Left Arrow = Skip, Right Arrow = Watch
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        triggerChoice('like');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        triggerChoice('skip');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerChoice]);

  // Compute top boosted genres for the live learning loop ticker
  const sortedTaste = Object.entries(tasteProfile)
    .filter(([, weight]) => weight !== 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <section className="swipe-deck-stage" aria-label="Movie recommendations swipe deck">
      {/* Top status bar */}
      <div className="deck-status-bar">
        <div className="current-vibe-pill">
          <span className="vibe-emoji">{activeMood.emoji}</span>
          <span>VIBE: <strong>{activeMood.label.toUpperCase()}</strong></span>
        </div>

        <div className="cards-left-counter">
          {deck.length > 0 ? (
            <span>🎟 {deck.length} {deck.length === 1 ? 'REEL' : 'REELS'} LEFT IN STACK</span>
          ) : (
            <span>🎟 STACK CLEARED</span>
          )}
        </div>
      </div>

      {/* Live Taste Profile Bar (Learning Loop Feedback) */}
      <div className="taste-radar-strip" aria-live="polite">
        <span className="radar-label">🧠 LIVE TASTE RADAR:</span>
        {sortedTaste.length === 0 ? (
          <span className="radar-empty">Swipe cards to train the algorithm live...</span>
        ) : (
          <div className="radar-pills">
            {sortedTaste.slice(0, 5).map(([genre, weight]) => (
              <span
                key={genre}
                className={`taste-chip ${weight > 0 ? 'taste-up' : 'taste-down'}`}
              >
                {genre} {weight > 0 ? `+${weight}` : weight}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Card Stack or Empty State */}
      {deck.length > 0 ? (
        <>
          <div className="card-stack-container">
            <AnimatePresence mode="popLayout">
              {deck.slice(0, 3).map((movie, index) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isTop={index === 0}
                  stackIndex={index}
                  forcedStamp={index === 0 ? forcedStamp : null}
                  onSwipe={(action) => triggerChoice(action)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Live rerank feedback toast */}
          <div className="microcopy-toast-row" aria-live="polite">
            {lastActionToast ? (
              <span className="action-toast-pill">{lastActionToast}</span>
            ) : (
              <span className="keyboard-hint">
                💡 Drag card or hit <kbd>←</kbd> / <kbd>→</kbd> arrow keys
              </span>
            )}
          </div>

          {/* Neo-brutalist Action Controls */}
          <div className="deck-action-buttons">
            <button
              type="button"
              className="action-btn btn-skip"
              onClick={() => triggerChoice('skip')}
              aria-label="Skip, not your type (Left Arrow)"
            >
              <span className="btn-icon">✕</span>
              <span className="btn-text">
                <strong>NAH, SKIP</strong>
                <small>Not my type</small>
              </span>
            </button>

            <button
              type="button"
              className="action-btn btn-watch"
              onClick={() => triggerChoice('like')}
              aria-label="Add to the watch pile (Right Arrow)"
            >
              <span className="btn-icon">♥</span>
              <span className="btn-text">
                <strong>WATCH IT!</strong>
                <small>Add to watch pile</small>
              </span>
            </button>
          </div>
        </>
      ) : (
        /* Fun Empty State */
        <div className="empty-deck-zine-card">
          <div className="empty-sticker">FIN // END OF REEL</div>
          <h2 className="empty-headline">
            You&apos;ve seen it all. Touch grass, then come back. 🌱
          </h2>
          <p className="empty-subtext">
            You chewed through all 10 curated midnight picks for <strong>{activeMood.label}</strong>.
            Check your Watch Pile or flip the vibe for a fresh stack!
          </p>
          <div className="empty-actions">
            <button
              type="button"
              className="zine-btn zine-btn-primary"
              onClick={onOpenWatchlist}
            >
              🍿 OPEN WATCH PILE
            </button>
            <button
              type="button"
              className="zine-btn zine-btn-secondary"
              onClick={onStartOver}
            >
              🔄 PICK A NEW VIBE
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

