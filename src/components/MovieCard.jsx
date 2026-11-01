import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export default function MovieCard({
  movie,
  isTop,
  stackIndex,
  onSwipe,
  forcedStamp
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-16, stackIndex % 2 === 0 ? -1.5 : 1.5, 16]);

  // Stamp opacities while dragging
  const watchOpacity = useTransform(x, [25, 110], [0, 1]);
  const nopeOpacity = useTransform(x, [-25, -110], [0, 1]);

  const handleDragEnd = (_, info) => {
    const threshold = 95;
    if (info.offset.x > threshold || info.velocity.x > 500) {
      onSwipe('like');
    } else if (info.offset.x < -threshold || info.velocity.x < -500) {
      onSwipe('skip');
    }
  };

  const [colorA, colorB] = movie.posterGradient || ['#FF2A85', '#4B0082'];

  // Visual stacking offsets for cards underneath
  const scaleOffset = 1 - stackIndex * 0.045;
  const yOffset = stackIndex * 12;
  const baseRotation = stackIndex === 0 ? -1 : stackIndex === 1 ? 2.5 : -2.5;

  return (
    <motion.article
      className={`movie-ticket-card ${isTop ? 'is-top-card' : 'is-back-card'}`}
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : baseRotation,
        zIndex: 20 - stackIndex,
      }}
      initial={{ scale: 0.9, opacity: 0, y: 30 }}
      animate={{
        scale: scaleOffset,
        opacity: stackIndex > 2 ? 0 : 1,
        y: yOffset,
      }}
      exit={{
        x: forcedStamp === 'skip' ? -420 : forcedStamp === 'like' ? 420 : 0,
        rotate: forcedStamp === 'skip' ? -24 : 24,
        opacity: 0,
        transition: { duration: 0.28, ease: 'easeIn' }
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={isTop ? handleDragEnd : undefined}
      aria-label={`${movie.title} (${movie.year})`}
    >
      {/* Ticket top notches */}
      <div className="ticket-notch ticket-notch-left" aria-hidden="true" />
      <div className="ticket-notch ticket-notch-right" aria-hidden="true" />

      {/* SWIPE STAMPS */}
      {isTop && (
        <>
          <motion.div
            className="swipe-stamp stamp-watch"
            style={{ opacity: forcedStamp === 'like' ? 1 : watchOpacity }}
          >
            WATCH IT ★
          </motion.div>
          <motion.div
            className="swipe-stamp stamp-nope"
            style={{ opacity: forcedStamp === 'skip' ? 1 : nopeOpacity }}
          >
            NOPE ✕
          </motion.div>
        </>
      )}

      {/* Polaroid / Gradient Poster Frame */}
      <div
        className="poster-art"
        style={{
          background: `linear-gradient(135deg, ${colorA} 0%, ${colorB} 100%)`
        }}
      >
        <div className="poster-noise-overlay" />

        <div className="poster-top-stickers">
          <span className="origin-pill">{movie.origin || 'WORLD CINEMA'}</span>
          <span className="rating-sticker" title="IMDb / Zine Rating">
            ★ {movie.rating.toFixed(1)}/10
          </span>
        </div>

        <div className="poster-center-graphic">
          <span className="poster-year-watermark">{movie.year}</span>
          <h2 className="poster-big-title">{movie.title}</h2>
        </div>

        <div className="poster-bottom-bar">
          <span className="meta-chip">⏱ {movie.runtime}</span>
          <span className="meta-chip">📅 {movie.year}</span>
          {movie.matchScore !== undefined && (
            <span className="meta-chip match-score-chip">
              ⚡ {movie.matchScore} PTS
            </span>
          )}
        </div>
      </div>

      {/* Perforated tear line */}
      <div className="ticket-perforation" aria-hidden="true">
        <span>ADMIT ONE // MIDNIGHT SCREENING // NO REFUNDS</span>
      </div>

      {/* Card Zine Copy & Genres */}
      <div className="card-zine-body">
        <p className="movie-punchline">&ldquo;{movie.description}&rdquo;</p>

        <div className="card-tags-row">
          {movie.genres.map((genre) => (
            <span key={genre} className="genre-sticker">
              #{genre.toUpperCase()}
            </span>
          ))}
          {movie.moods.map((m) => (
            <span key={m} className="mood-mini-pill">
              {m}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

