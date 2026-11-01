import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import PosterArtwork from './PosterArtwork';

/**
 * Pulse Heart (micro/pulse-heart)
 * Used on the Rule of 3 Shortlist for "This One" selection.
 */
export function PulseHeartButton({ onClick, label = 'LOCK THIS REEL', sublabel = 'Yehi lagao →' }) {
  const [pulsing, setPulsing] = useState(false);

  const handleTrigger = () => {
    setPulsing(true);
    setTimeout(() => setPulsing(false), 450);
    if (onClick) onClick();
  };

  return (
    <motion.button
      type="button"
      className={`rb-pulse-heart-btn ${pulsing ? 'is-pulsing' : ''}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.94 }}
      onClick={handleTrigger}
    >
      <span className="rb-heart-icon-wrap" aria-hidden="true">
        <span className="rb-heart-glyph">♥</span>
        <span className="rb-heart-ring" />
      </span>
      <span className="rb-heart-copy">
        <strong>{label}</strong>
        <small>{sublabel}</small>
      </span>
    </motion.button>
  );
}

/**
 * Holo Card (components/holo-card)
 * 3D tilt + holographic foil reflection for the Reveal & Commit collectible film card.
 */
export function HoloCard({ film, backupFilm }) {
  const cardRef = useRef(null);
  const [glare, setGlare] = useState({ x: 50, y: 50, rx: 0, ry: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const ry = ((px - 50) / 50) * 10;
    const rx = -((py - 50) / 50) * 10;
    setGlare({ x: px, y: py, rx, ry });
  };

  const handleMouseLeave = () => {
    setGlare({ x: 50, y: 50, rx: 0, ry: 0 });
  };

  const [c1, c2] = film.gradient || ['#FF2A85', '#4B0082'];

  return (
    <div
      ref={cardRef}
      className="rb-holo-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        '--holo-x': `${glare.x}%`,
        '--holo-y': `${glare.y}%`,
        '--holo-rx': `${glare.rx}deg`,
        '--holo-ry': `${glare.ry}deg`,
        '--film-c1': c1,
        '--film-c2': c2
      }}
    >
      <div className="rb-holo-foil" aria-hidden="true" />
      <PosterArtwork film={film} className="rb-holo-poster">
        <div className="rb-holo-top-row">
          <span className="rb-holo-chip">{film.language.toUpperCase()} • {film.year}</span>
          <span className="rb-holo-rating">★ {film.rating.toFixed(1)}</span>
        </div>

        <div className="rb-holo-title-block">
          <span className="rb-holo-kicker">OFFICIAL SELECTION // REEL #{film.id}</span>
          <h2 className="rb-holo-title">{film.title}</h2>
          <p className="rb-holo-desc">&ldquo;{film.desc}&rdquo;</p>
        </div>

        <div className="rb-holo-specs">
          <div className="rb-spec-box">
            <small>RUNTIME</small>
            <strong>{film.runtime} min</strong>
          </div>
          <div className="rb-spec-box">
            <small>HOOK SPEED</small>
            <strong>{film.hookMinutes}m grab</strong>
          </div>
          <div className="rb-spec-box">
            <small>BRAIN BATTERY</small>
            <strong>Lvl {film.brainBattery}/5</strong>
          </div>
        </div>

        <div className="rb-holo-snack-bar">
          <span>🍿 SNACK PAIRING:</span>
          <strong>{film.snack}</strong>
        </div>

        {backupFilm && (
          <div className="rb-holo-backup-preview">
            <span>🛡️ PRE-LOADED PLAN B (20-Min Rule):</span>
            <strong>{backupFilm.title} ({backupFilm.runtime}m • {backupFilm.hookMinutes}m hook)</strong>
          </div>
        )}
      </PosterArtwork>
    </div>
  );
}

/**
 * Tear Ticket (micro/tear-ticket)
 * Interactive perforated ticket stub that tears apart when dragged or clicked to commit.
 */
export function TearTicket({ film, onCommit }) {
  const [torn, setTorn] = useState(false);
  const dragX = useMotionValue(0);
  const stubRotate = useTransform(dragX, [0, 180], [0, 18]);
  const stubOpacity = useTransform(dragX, [0, 200], [1, 0.2]);

  const triggerTear = () => {
    if (torn) return;
    setTorn(true);
    setTimeout(() => {
      if (onCommit) onCommit();
    }, 650);
  };

  return (
    <div className={`rb-tear-ticket-container ${torn ? 'is-torn' : ''}`}>
      <div className="rb-ticket-main-body">
        <div className="rb-ticket-serial">ADMIT ALL // NO GOING BACK</div>
        <div className="rb-ticket-film-line">
          <strong>{film.title.toUpperCase()}</strong>
          <span>{film.runtime} MIN • HOOK IN {film.hookMinutes}M</span>
        </div>
        <p className="rb-ticket-hinglish">
          Ticket phaad, no going back — 40-minute scrolling loop ends right here.
        </p>
      </div>

      <div className="rb-ticket-perforation-line" aria-hidden="true">
        <span>✂ TEAR ALONG PERFORATION</span>
      </div>

      <motion.div
        className="rb-ticket-detach-stub"
        style={{ x: dragX, rotate: stubRotate, opacity: stubOpacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 220 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 75 || info.velocity.x > 300) {
            triggerTear();
          }
        }}
        animate={torn ? { x: 240, y: 40, rotate: 24, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
      >
        <button
          type="button"
          className="rb-tear-trigger-btn"
          onClick={triggerTear}
          aria-label="Tear ticket stub to commit and start countdown"
        >
          <span className="rb-stub-cta">🎟️ TEAR STUB TO COMMIT</span>
          <small>Drag stub right or tap to rip →</small>
        </button>
      </motion.div>
    </div>
  );
}

/**
 * Slide Commit (micro/slide-commit)
 * Drag-to-unlock slider for "Bail to Backup" on the Night Plan screen.
 */
export function SlideCommit({
  onConfirm,
  disabled = false,
  label = 'SLIDE TO BAIL → SWAP TO BACKUP REEL',
  completedLabel = 'SWAPPED TO PLAN B — BAIL LOGGED'
}) {
  const [completed, setCompleted] = useState(false);
  const x = useMotionValue(0);

  const handleCommit = () => {
    if (disabled || completed) return;
    setCompleted(true);
    if (onConfirm) onConfirm();
  };

  return (
    <div className={`rb-slide-commit-track ${completed || disabled ? 'is-completed' : ''}`}>
      <div className="rb-slide-track-label">
        {completed || disabled ? completedLabel : label}
      </div>

      {!completed && !disabled && (
        <motion.button
          type="button"
          className="rb-slide-thumb"
          style={{ x }}
          drag="x"
          dragConstraints={{ left: 0, right: 240 }}
          dragElastic={0.08}
          onDragEnd={(_, info) => {
            if (info.offset.x > 135 || info.velocity.x > 450) {
              handleCommit();
            }
          }}
          onClick={handleCommit}
          aria-label="Activate Bail to Backup Reel"
        >
          <span>⚡ BAIL</span>
        </motion.button>
      )}
    </div>
  );
}

/**
 * Swipe Row (micro/swipe-row)
 * Swipe-to-delete row for Night Log entries.
 */
export function SwipeRow({ entry, onDelete }) {
  const x = useMotionValue(0);

  return (
    <div className="rb-swipe-row-wrapper">
      <div className="rb-swipe-row-bg" aria-hidden="true">
        <span>DELETE ENTRY ✕</span>
      </div>
      <motion.div
        className="rb-swipe-row-card"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -85) {
            onDelete(entry.id);
          }
        }}
      >
        <div
          className="rb-log-swatch"
          style={{
            background: `linear-gradient(135deg, ${entry.gradient?.[0] || '#FF2A85'}, ${entry.gradient?.[1] || '#4B0082'})`
          }}
        >
          {entry.outcome === 'loved' ? '❤️' : entry.outcome === 'finished' ? '✅' : '🏃'}
        </div>

        <div className="rb-log-details">
          <div className="rb-log-title-line">
            <strong>{entry.title}</strong>
            <span className={`rb-outcome-pill outcome-${entry.outcome}`}>
              {entry.outcome.toUpperCase()}
              {entry.outcome === 'loved' && entry.userStars ? ` (${entry.userStars}★)` : ''}
              {entry.bailedWithin20 ? ' (<20m)' : ''}
            </span>
          </div>
          <p className="rb-log-meta">
            {entry.genres?.join(' • ')} — {new Date(entry.timestamp).toLocaleDateString()}
          </p>
        </div>

        <button
          type="button"
          className="rb-log-delete-btn"
          onClick={() => onDelete(entry.id)}
          aria-label={`Delete ${entry.title} from night log`}
        >
          ✕
        </button>
      </motion.div>
    </div>
  );
}

/**
 * Peek Rating (micro/peek-rating)
 * Interactive star/reel rating selector when marking a film as "Loved".
 */
export function PeekRating({ value = 5, onChange }) {
  const [hovered, setHovered] = useState(null);
  const activeVal = hovered !== null ? hovered : value;

  const labels = {
    1: 'Barely survived',
    2: 'Decent timepass',
    3: 'Solid watch',
    4: 'Paisa vasool banger',
    5: 'All-time cult classic ★'
  };

  return (
    <div className="rb-peek-rating" role="radiogroup" aria-label="Rate how much you loved it">
      <div className="rb-peek-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            className={`rb-peek-star ${star <= activeVal ? 'is-lit' : ''}`}
            whileHover={{ y: -4, scale: 1.18 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChange(star)}
            aria-label={`${star} out of 5 stars`}
          >
            ★
          </motion.button>
        ))}
      </div>
      <span className="rb-peek-caption">{labels[activeVal]}</span>
    </div>
  );
}

