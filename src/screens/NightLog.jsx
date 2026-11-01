import React from 'react';
import { MOVIES } from '../data/movies';
import AnimatedList from '../components/AnimatedList';
import { SwipeRow, PeekRating } from '../components/MicroInteractions';

export default function NightLog({
  activePlayingFilm,
  logOutcome,
  setLogOutcome,
  logBailedEarly,
  setLogBailedEarly,
  logStars,
  setLogStars,
  onSubmitLog,
  tasteProfile,
  patience,
  nightLog,
  onDeleteEntry,
  onRequestClearAll,
  onExportCsv,
  onOpenStats
}) {
  const topGenres = Object.entries(tasteProfile)
    .filter(([, w]) => w !== 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <section className="ld-screen ld-log-screen" aria-label="Night Log and Taste Profile">
      <div className="ld-section-header">
        <span className="ld-eyebrow">REGRET-AWARE LEARNING // NIGHT LOG</span>
        <h2 className="ld-section-title">How Did Tonight&apos;s Screening Go?</h2>
      </div>

      <div className="ld-log-grid">
        <form className="ld-log-prompt-card" onSubmit={onSubmitLog}>
          <span className="ld-eyebrow">LOG TONIGHT&apos;S REEL</span>
          <h3>
            {activePlayingFilm ? activePlayingFilm.title : `${MOVIES[0].title} (Sample)`}
          </h3>

          <div className="ld-outcome-buttons" role="radiogroup" aria-label="Screening outcome">
            {[
              { id: 'loved', label: '❤️ LOVED IT', desc: '+2 genre affinity, boosts patience' },
              { id: 'finished', label: '✅ FINISHED', desc: '+1 genre affinity, steady patience' },
              { id: 'bailed', label: '🏃 BAILED', desc: '-2 genre penalty, speeds up future hooks' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`ld-outcome-choice ${logOutcome === opt.id ? 'is-selected' : ''}`}
                onClick={() => setLogOutcome(opt.id)}
              >
                <strong>{opt.label}</strong>
                <small>{opt.desc}</small>
              </button>
            ))}
          </div>

          {logOutcome === 'loved' && (
            <div className="ld-log-extra-box">
              <span>PEEK RATING:</span>
              <PeekRating value={logStars} onChange={setLogStars} />
            </div>
          )}

          {logOutcome === 'bailed' && (
            <label className="ld-bail-checkbox">
              <input
                type="checkbox"
                checked={logBailedEarly}
                onChange={(e) => setLogBailedEarly(e.target.checked)}
              />
              <span>Bailed within the first 20 minutes (lowers future hook patience score)</span>
            </label>
          )}

          <button type="submit" className="ld-primary-cta">
            SAVE TO NIGHT LOG &amp; UPDATE ENGINE
          </button>
        </form>

        <div className="ld-log-history-column">
          <div className="ld-taste-summary-card">
            <div className="ld-taste-header">
              <div>
                <span className="ld-eyebrow">ADAPTIVE TASTE ENGINE</span>
                <h4>Patience &amp; Genre Weights</h4>
              </div>
              <div className="ld-log-head-actions">
                {onOpenStats && (
                  <button
                    type="button"
                    className="ld-secondary-cta ld-tiny-btn"
                    onClick={onOpenStats}
                  >
                    📊 Booth Stats
                  </button>
                )}
                {onExportCsv && (
                  <button
                    type="button"
                    className="ld-secondary-cta ld-tiny-btn"
                    onClick={onExportCsv}
                  >
                    ⬇ Export my data (CSV)
                  </button>
                )}
                <button
                  type="button"
                  className="ld-wipe-btn"
                  onClick={onRequestClearAll}
                >
                  Reset all data
                </button>
              </div>
            </div>

            <div className="ld-patience-meter">
              <span>Hook Patience Score: <strong>{Math.round(patience * 100)}%</strong></span>
              <div className="ld-meter-bar">
                <div
                  className="ld-meter-fill"
                  style={{ width: `${Math.round(patience * 100)}%` }}
                />
              </div>
              <small>
                {patience < 0.5
                  ? 'Impatient mode active: heavily prioritizing <8m hooks.'
                  : 'Balanced mode: allowing slow-burn masterpieces.'}
              </small>
            </div>

            <div className="ld-genre-affinities">
              {topGenres.length === 0 ? (
                <span className="ld-muted-note">No genre biases recorded yet. Log a film to train!</span>
              ) : (
                topGenres.map(([genre, weight]) => (
                  <span
                    key={genre}
                    className={`ld-affinity-chip ${weight > 0 ? 'is-positive' : 'is-negative'}`}
                  >
                    {genre}: {weight > 0 ? `+${weight}` : weight}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="ld-history-list-box">
            <div className="ld-history-head">
              <span>SCREENING ARCHIVE ({nightLog.length})</span>
              <small>Swipe row left or tap ✕ to delete</small>
            </div>

            {nightLog.length === 0 ? (
              <div className="ld-empty-log">
                <p>No nights logged yet. Start a night and log whether you Finished, Bailed, or Loved it!</p>
              </div>
            ) : (
              <AnimatedList
                items={nightLog}
                height={310}
                showGradients={false}
                renderItem={(entry) => (
                  <SwipeRow
                    key={entry.id}
                    entry={entry}
                    onDelete={onDeleteEntry}
                  />
                )}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
