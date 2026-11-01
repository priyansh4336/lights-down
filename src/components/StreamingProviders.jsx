import React, { useState, useEffect } from 'react';

export default function StreamingProviders({ tmdbId, title }) {
  const token = import.meta.env?.VITE_TMDB_TOKEN;
  const [providers, setProviders] = useState(null);

  useEffect(() => {
    if (!token || !tmdbId) {
      setProviders(null);
      return;
    }

    const cacheKey = `ld_providers_IN_${tmdbId}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setProviders(JSON.parse(cached));
        return;
      }
    } catch {
      // ignore sessionStorage error
    }

    let cancelled = false;
    fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.results) return;
        const inRegion = data.results.IN || {};
        const merged = [
          ...(inRegion.flatrate || []),
          ...(inRegion.rent || []),
          ...(inRegion.ads || [])
        ];
        // Deduplicate by provider_id
        const seen = new Set();
        const unique = [];
        for (const p of merged) {
          if (!seen.has(p.provider_id)) {
            seen.add(p.provider_id);
            unique.push({
              id: p.provider_id,
              name: p.provider_name,
              logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null
            });
          }
        }
        setProviders(unique.slice(0, 4));
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(unique.slice(0, 4)));
        } catch {
          // ignore
        }
      })
      .catch(() => {
        if (!cancelled) setProviders([]);
      });

    return () => {
      cancelled = true;
    };
  }, [token, tmdbId]);

  if (!token || !providers || providers.length === 0) {
    return null;
  }

  return (
    <div className="ld-streaming-row" aria-label={`Streaming providers in India for ${title}`}>
      <small className="ld-streaming-label">STREAMING IN INDIA (JUSTWATCH):</small>
      <div className="ld-streaming-badges">
        {providers.map((p) => (
          <span key={p.id} className="ld-provider-badge">
            {p.logo && (
              <img
                src={p.logo}
                alt={`${p.name} logo`}
                loading="lazy"
                width="18"
                height="18"
                style={{ borderRadius: '4px', marginRight: '6px', verticalAlign: 'middle' }}
              />
            )}
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
