import React, { useState, useEffect } from 'react';

export default function PosterArtwork({
  film,
  className = '',
  children,
  showOverlayGradient = true
}) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [film?.id, film?.posterUrl]);

  if (!film) return null;

  const [colorA = '#222', colorB = '#111'] = film.gradient || [];
  const hasPoster = Boolean(film.posterUrl) && !imgFailed;

  return (
    <div
      className={`ld-poster-artwork ${className}`}
      style={{
        background: `linear-gradient(145deg, ${colorA}, ${colorB})`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {hasPoster && (
        <img
          src={film.posterUrl}
          alt={`${film.title} (${film.year}) official movie poster`}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          className="ld-poster-img"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            opacity: showOverlayGradient ? 0.52 : 0.88,
            transition: 'opacity 0.35s ease'
          }}
        />
      )}
      {hasPoster && showOverlayGradient && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(10,10,14,0.35) 0%, rgba(10,10,14,0.75) 60%, rgba(10,10,14,0.95) 100%)`,
            pointerEvents: 'none'
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {children}
      </div>
    </div>
  );
}
