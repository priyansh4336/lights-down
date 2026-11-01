import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Watchlist({
  isOpen,
  onClose,
  watchlist,
  onRemove,
  onClearAll
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="watchlist-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            aria-label="Your Watchlist"
          >
            <div className="drawer-header">
              <div>
                <span className="drawer-kicker">SAVED STUBS // LOCALSTORAGE</span>
                <h2 className="drawer-title">THE WATCH PILE ({watchlist.length})</h2>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={onClose}
                aria-label="Close watchlist"
              >
                ✕
              </button>
            </div>

            <div className="drawer-content">
              {watchlist.length === 0 ? (
                <div className="drawer-empty">
                  <span className="drawer-empty-emoji">🕸️</span>
                  <p className="drawer-empty-title">Your watch pile is ghost town empty.</p>
                  <p className="drawer-empty-sub">
                    Swipe right or smash the ♥ button on any ticket stub to stash it here for tonight.
                  </p>
                </div>
              ) : (
                <ul className="watchlist-items">
                  {watchlist.map((movie) => {
                    const [c1, c2] = movie.posterGradient || ['#FF2A85', '#4B0082'];
                    return (
                      <motion.li
                        key={movie.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="watchlist-ticket-item"
                      >
                        <div
                          className="watchlist-mini-swatch"
                          style={{
                            background: `linear-gradient(135deg, ${c1}, ${c2})`
                          }}
                        >
                          <span>★ {movie.rating}</span>
                        </div>

                        <div className="watchlist-item-info">
                          <h3 className="watchlist-item-title">
                            {movie.title} <span className="watchlist-year">({movie.year})</span>
                          </h3>
                          <p className="watchlist-item-meta">
                            {movie.runtime} • {movie.genres.join(' / ')}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="watchlist-remove-btn"
                          onClick={() => onRemove(movie.id)}
                          title="Toss from watch pile"
                          aria-label={`Remove ${movie.title} from watchlist`}
                        >
                          TOSS ✕
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>

            {watchlist.length > 0 && (
              <div className="drawer-footer">
                <button
                  type="button"
                  className="zine-btn zine-btn-danger"
                  onClick={onClearAll}
                >
                  🗑️ NUKE ENTIRE PILE
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

