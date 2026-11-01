import React from 'react';
import Counter from '../components/Counter';
import SpotlightCard from '../components/SpotlightCard';
import { SplitFlapText } from '../components/SplitFlapAndGrainient';
import { SlideCommit } from '../components/MicroInteractions';
import PosterArtwork from '../components/PosterArtwork';
import StreamingProviders from '../components/StreamingProviders';

export default function NightPlan({
  activePlayingFilm,
  chosenFilm,
  backupFilm,
  doubleFeatureFilm,
  useDoubleFeature,
  setUseDoubleFeature,
  swappedToBackup,
  timeline,
  countdownSeconds,
  activeMoodObj,
  onBailToBackup,
  onOpenLog
}) {
  if (!activePlayingFilm || !timeline) return null;

  return (
    <section className="ld-screen ld-plan-screen" aria-label="Tonight's screening plan">
      <div className="ld-countdown-banner" aria-live="polite">
        <div className="ld-countdown-left">
          <span className="ld-eyebrow">COMMITTED // LIGHTS DOWN COUNTDOWN</span>
          <h3>
            {countdownSeconds > 0
              ? 'Grab your snacks & silence phones — reel starts in:'
              : 'LIGHTS ARE DOWN // FEATURE IS ROLLING 🎬'}
          </h3>
        </div>
        <div className="ld-countdown-digits">
          <Counter
            value={countdownSeconds}
            fontSize={38}
            suffix="s"
            textColor={activeMoodObj.beamColor}
            fontWeight={800}
          />
        </div>
      </div>

      <div className="ld-plan-grid">
        <SpotlightCard
          spotlightColor={activeMoodObj.beamColor}
          intensity={0.22}
          className="ld-plan-spotlight"
        >
          <div className="ld-plan-card-inner">
            <PosterArtwork film={activePlayingFilm} className="ld-plan-poster-banner">
              <div className="ld-plan-badge-row">
                <span className="ld-pill-primary">
                  {swappedToBackup ? '⚡ NOW PLAYING (BACKUP REEL)' : '🎬 FEATURE PRESENTATION'}
                </span>
                <span>★ {activePlayingFilm.rating}</span>
              </div>

              <h3 className="ld-plan-film-title">{activePlayingFilm.title}</h3>
              <p className="ld-plan-film-sub">
                {activePlayingFilm.year} • {activePlayingFilm.language} • {activePlayingFilm.runtime} min • {activePlayingFilm.genres.join(' / ')}
              </p>
            </PosterArtwork>

            <p className="ld-plan-film-desc">&ldquo;{activePlayingFilm.desc}&rdquo;</p>

            <StreamingProviders tmdbId={activePlayingFilm.tmdbId} title={activePlayingFilm.title} />

            <div className="ld-plan-stats-grid">
              <div>
                <small>HOOK SPEED</small>
                <strong>Grabs you in {activePlayingFilm.hookMinutes}m</strong>
              </div>
              <div>
                <small>BRAIN BATTERY</small>
                <strong>Level {activePlayingFilm.brainBattery} / 5</strong>
              </div>
            </div>

            <div className="ld-snack-callout">
              <span>🍿 TONIGHT&apos;S SNACK PAIRING</span>
              <strong>{activePlayingFilm.snack}</strong>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard
          spotlightColor="#00F5D4"
          intensity={0.22}
          className="ld-plan-spotlight"
        >
          <div className="ld-plan-card-inner">
            <div className="ld-plan-badge-row">
              <span className="ld-pill-backup">🛡️ BACKUP REEL // 20-MINUTE RULE</span>
              <span>SHORTER &amp; FASTER HOOK</span>
            </div>

            {backupFilm ? (
              <>
                <h3 className="ld-plan-film-title">{backupFilm.title}</h3>
                <p className="ld-plan-film-sub">
                  {backupFilm.year} • {backupFilm.runtime} min • Hook in {backupFilm.hookMinutes}m • Battery {backupFilm.brainBattery}/5
                </p>
                <p className="ld-plan-film-desc">
                  Bakwaas nikli? Give the main pick until <strong>{timeline.bailCheckFormatted}</strong> (20 mins). If it&apos;s not clicking, slide below to swap immediately with zero guilt.
                </p>

                <div className="ld-backup-comparison">
                  <span>⚡ {Math.max(0, chosenFilm.runtime - backupFilm.runtime)}m shorter</span>
                  <span>🎯 {backupFilm.genres[0]} pivot</span>
                  <span>🍿 {backupFilm.snack}</span>
                </div>

                <SlideCommit
                  disabled={swappedToBackup}
                  onConfirm={onBailToBackup}
                />
              </>
            ) : (
              <p>Backup reel ready.</p>
            )}
          </div>
        </SpotlightCard>

        <SpotlightCard
          spotlightColor="#A855F7"
          intensity={0.22}
          className="ld-plan-spotlight"
        >
          <div className="ld-plan-card-inner">
            <div className="ld-plan-badge-row">
              <span className="ld-pill-timeline">⏱️ BACK-SOLVED TIMELINE</span>
              <span>{timeline.totalRuntimeMinutes} MIN TOTAL</span>
            </div>

            <div className="ld-lights-out-box">
              <small>LIGHTS OUT BY</small>
              <div className="ld-lights-out-flap">
                <SplitFlapText
                  text={timeline.lightsOutFormatted}
                  accentColor={activeMoodObj.beamColor}
                />
              </div>
            </div>

            <ul className="ld-timeline-steps">
              <li>
                <span>🍿 Snack &amp; Settle (+10m)</span>
                <strong>Now → {timeline.startFormatted}</strong>
              </li>
              <li>
                <span>🎬 Reel Starts</span>
                <strong>{timeline.startFormatted}</strong>
              </li>
              <li>
                <span>🛡️ 20-Minute Bail Check</span>
                <strong>{timeline.bailCheckFormatted}</strong>
              </li>
              {useDoubleFeature && doubleFeatureFilm && !swappedToBackup && (
                <>
                  <li>
                    <span>☕ 10-Min Intermission</span>
                    <strong>{timeline.firstFilmEndFormatted} → {timeline.intermissionEndFormatted}</strong>
                  </li>
                  <li>
                    <span>🎞️ 2nd Feature: {doubleFeatureFilm.title}</span>
                    <strong>{timeline.intermissionEndFormatted} → {timeline.lightsOutFormatted}</strong>
                  </li>
                </>
              )}
              <li className="ld-timeline-final">
                <span>🌙 Credits Roll / Lights Out</span>
                <strong>{timeline.lightsOutFormatted}</strong>
              </li>
            </ul>

            {doubleFeatureFilm && !swappedToBackup && (
              <button
                type="button"
                className={`ld-double-toggle ${useDoubleFeature ? 'is-on' : ''}`}
                onClick={() => setUseDoubleFeature((v) => !v)}
              >
                {useDoubleFeature
                  ? `✓ Double Feature ON (+ ${doubleFeatureFilm.title})`
                  : `+ Add Double Feature: ${doubleFeatureFilm.title} (${doubleFeatureFilm.runtime}m)`}
              </button>
            )}

            <button
              type="button"
              className="ld-primary-cta ld-finish-night-btn"
              onClick={onOpenLog}
            >
              MARK OUTCOME IN NIGHT LOG →
            </button>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}
