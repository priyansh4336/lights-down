/**
 * LIGHTS DOWN — POS (Platform Operating System) Decision-to-Action Engine
 *
 * Pipeline:
 * Vibe -> Brain Battery -> Time budget -> Crew -> Hard Filter (with graceful relaxation)
 * -> Score -> Group Least-Misery Aggregation -> Diversify (Rule of 3)
 * -> Veto / Reroll -> Backup Reel ("20-Minute Rule") -> Night Plan Timeline -> Night Log Learning
 */

const STORAGE_KEYS = {
  TASTE: 'lightsdown_taste_v2',
  PATIENCE: 'lightsdown_patience_v2',
  LOG: 'lightsdown_nightlog_v2'
};

export function loadPersistedState() {
  let tasteProfile = {};
  let patience = 0.65; // 0.1 (very impatient, needs instant hook) to 1.0 (patient cinephile)
  let nightLog = [];

  try {
    const rawTaste = localStorage.getItem(STORAGE_KEYS.TASTE);
    if (rawTaste) tasteProfile = JSON.parse(rawTaste);
  } catch {
    tasteProfile = {};
  }

  try {
    const rawPatience = localStorage.getItem(STORAGE_KEYS.PATIENCE);
    if (rawPatience !== null) patience = Number(JSON.parse(rawPatience));
  } catch {
    patience = 0.65;
  }

  try {
    const rawLog = localStorage.getItem(STORAGE_KEYS.LOG);
    if (rawLog) nightLog = JSON.parse(rawLog);
  } catch {
    nightLog = [];
  }

  return { tasteProfile, patience, nightLog };
}

export function savePersistedState({ tasteProfile, patience, nightLog }) {
  try {
    if (tasteProfile !== undefined) {
      localStorage.setItem(STORAGE_KEYS.TASTE, JSON.stringify(tasteProfile));
    }
    if (patience !== undefined) {
      localStorage.setItem(STORAGE_KEYS.PATIENCE, JSON.stringify(patience));
    }
    if (nightLog !== undefined) {
      localStorage.setItem(STORAGE_KEYS.LOG, JSON.stringify(nightLog));
    }
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Step 1: Hard Filter with Relaxation
 * - runtime <= timeBudget
 * - film.brainBattery <= userBattery
 * - film.crewFit includes crewType
 * - at least one mood overlap
 * Relaxation if < 6 candidates survive:
 * 1) Relax mood overlap first
 * 2) Relax brainBattery by +1
 * 3) Relax runtime by +25 mins if still < 6
 */
export function filterCandidates(allMovies, { mood, brainBattery, timeBudget, crewType, excludedIds = [] }) {
  const excludedSet = new Set(excludedIds);
  const pool = allMovies.filter((m) => !excludedSet.has(m.id));

  // Strict pass
  let survivors = pool.filter(
    (m) =>
      m.runtime <= timeBudget &&
      m.brainBattery <= brainBattery &&
      m.crewFit.includes(crewType) &&
      m.moods.includes(mood)
  );

  // Relax 1: drop mood requirement if < 6 survive
  if (survivors.length < 6) {
    survivors = pool.filter(
      (m) =>
        m.runtime <= timeBudget &&
        m.brainBattery <= brainBattery &&
        m.crewFit.includes(crewType)
    );
  }

  // Relax 2: allow brainBattery + 1 if still < 6
  if (survivors.length < 6) {
    survivors = pool.filter(
      (m) =>
        m.runtime <= timeBudget &&
        m.brainBattery <= brainBattery + 1 &&
        m.crewFit.includes(crewType)
    );
  }

  // Relax 3: fallback to runtime <= timeBudget + 30 if still < 6
  if (survivors.length < 6) {
    survivors = pool.filter((m) => m.runtime <= timeBudget + 30);
  }

  // Ultimate safety fallback
  if (survivors.length < 3) {
    survivors = pool.slice(0, 12);
  }

  return survivors;
}

/**
 * Step 2: Score a single movie for a single viewer or profile
 * Score = 0.35 moodMatch + 0.25 genreAffinity(tasteProfile) + 0.15 (rating/10)
 *       + 0.15 hookScore (weighted up when battery is low or patience is low)
 *       + 0.10 freshness - bailPenalty
 */
export function scoreFilm(
  film,
  {
    mood,
    brainBattery = 3,
    tasteProfile = {},
    patience = 0.65,
    nightLog = [],
    playerMoodOverride = null
  }
) {
  const targetMood = playerMoodOverride || mood;
  const moodMatch = film.moods.includes(targetMood) ? 1.0 : 0.25;

  // Normalize genre affinity into [0, 1] range around 0.5 neutral
  const rawGenreSum = film.genres.reduce((acc, g) => acc + (tasteProfile[g] || 0), 0);
  const genreAffinity = Math.max(0, Math.min(1, 0.5 + rawGenreSum * 0.08));

  const ratingNorm = Math.max(0, Math.min(1, (film.rating || 7.5) / 10));

  // Faster hookMinutes (1..30) => higher hookScore (0..1)
  const rawHookScore = Math.max(0, Math.min(1, (30 - (film.hookMinutes || 10)) / 28));
  // Weight hook higher when brainBattery is low (1-2) or patience is low (< 0.5)
  const lowBatteryMultiplier = brainBattery <= 2 ? 1.35 : 1.0;
  const lowPatienceMultiplier = patience < 0.5 ? 1.35 : 1.0;
  const hookWeight = 0.15 * lowBatteryMultiplier * lowPatienceMultiplier;

  // Freshness: 1.0 if never logged, 0.2 if already watched/logged
  const loggedEntry = nightLog.find((entry) => entry.movieId === film.id);
  const freshness = loggedEntry ? 0.2 : 1.0;

  // Bail penalty: penalize films or genres the user previously bailed on
  let bailPenalty = 0;
  nightLog.forEach((entry) => {
    if (entry.outcome === 'bailed') {
      if (entry.movieId === film.id) {
        bailPenalty += 0.35;
      } else if (entry.genres && entry.genres.some((g) => film.genres.includes(g))) {
        bailPenalty += 0.06;
      }
    }
  });

  const rawScore =
    0.35 * moodMatch +
    0.25 * genreAffinity +
    0.15 * ratingNorm +
    hookWeight * rawHookScore +
    0.10 * freshness -
    bailPenalty;

  return Number((rawScore * 100).toFixed(1));
}

/**
 * Step 3: Group Least-Misery Score
 * Group score = 0.6 * min(playerScores) + 0.4 * mean(playerScores)
 * If any player vetoed the film in Hot Seat, it is removed for everyone.
 */
export function scoreCandidatesForCrew(candidates, setupConfig, hotSeatVotes = []) {
  const { mood, brainBattery, tasteProfile, patience, nightLog } = setupConfig;

  return candidates
    .filter((film) => {
      // Remove if vetoed during Hot Seat
      const wasVetoed = hotSeatVotes.some(
        (playerVote) => playerVote.vetoes && playerVote.vetoes.includes(film.id)
      );
      return !wasVetoed;
    })
    .map((film) => {
      const baseScore = scoreFilm(film, { mood, brainBattery, tasteProfile, patience, nightLog });

      if (!hotSeatVotes || hotSeatVotes.length <= 1) {
        return {
          ...film,
          matchScore: baseScore,
          primaryGenre: film.genres[0] || 'Drama'
        };
      }

      // Compute individual player scores based on each player's Hot Seat thumbs-up/down
      const playerScores = hotSeatVotes.map((player) => {
        let pScore = scoreFilm(film, {
          mood: player.mood || mood,
          brainBattery: player.brainBattery || brainBattery,
          tasteProfile,
          patience,
          nightLog
        });
        if (player.likes && player.likes.includes(film.id)) pScore += 18;
        if (player.passes && player.passes.includes(film.id)) pScore -= 22;
        return pScore;
      });

      const minScore = Math.min(...playerScores);
      const meanScore = playerScores.reduce((a, b) => a + b, 0) / playerScores.length;
      const groupScore = Number((0.6 * minScore + 0.4 * meanScore).toFixed(1));

      return {
        ...film,
        matchScore: groupScore,
        primaryGenre: film.genres[0] || 'Drama'
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Step 4: Diversify into Rule of 3 Shortlist
 * Never show more than 3 films. No two with the same primary genre when avoidable.
 */
export function buildRuleOf3Shortlist(scoredCandidates) {
  const shortlist = [];
  const usedPrimaryGenres = new Set();

  for (const film of scoredCandidates) {
    if (shortlist.length === 3) break;
    const primary = film.genres[0] || 'Drama';
    if (!usedPrimaryGenres.has(primary)) {
      shortlist.push(film);
      usedPrimaryGenres.add(primary);
    }
  }

  // Fill remaining slots if strict genre diversity left fewer than 3
  for (const film of scoredCandidates) {
    if (shortlist.length === 3) break;
    if (!shortlist.some((s) => s.id === film.id)) {
      shortlist.push(film);
    }
  }

  return shortlist;
}

/**
 * Step 5: Select the BACKUP REEL ("The 20-Minute Rule")
 * Best-scoring film that is:
 * - shorter than the pick (film.runtime < pick.runtime)
 * - faster or equal hook (film.hookMinutes <= pick.hookMinutes)
 * - lower or equal brainBattery (film.brainBattery <= pick.brainBattery)
 * - different primary genre (film.genres[0] !== pick.genres[0])
 * Gradually relaxes constraints if no exact match exists so a Backup is ALWAYS guaranteed.
 */
export function selectBackupReel(pick, allScoredPool, allMovies) {
  const pool = allScoredPool.length > 3 ? allScoredPool : allMovies;
  const others = pool.filter((m) => m.id !== pick.id);
  const pickPrimaryGenre = pick.genres[0];

  // Strict 4-criterion match
  let backup = others.find(
    (m) =>
      m.runtime < pick.runtime &&
      m.hookMinutes <= pick.hookMinutes &&
      m.brainBattery <= pick.brainBattery &&
      m.genres[0] !== pickPrimaryGenre
  );

  // Relax 1: allow hookMinutes <= pick.hookMinutes + 3
  if (!backup) {
    backup = others.find(
      (m) =>
        m.runtime <= pick.runtime &&
        m.hookMinutes <= pick.hookMinutes + 3 &&
        m.brainBattery <= pick.brainBattery &&
        m.genres[0] !== pickPrimaryGenre
    );
  }

  // Relax 2: prioritize lower brain battery + faster hook + different genre
  if (!backup) {
    backup = others.find(
      (m) =>
        m.brainBattery <= pick.brainBattery &&
        m.genres[0] !== pickPrimaryGenre
    );
  }

  // Fallback: shortest, fastest-hook film in pool
  if (!backup) {
    const sortedByEase = [...others].sort(
      (a, b) => a.brainBattery * 20 + a.hookMinutes - (b.brainBattery * 20 + b.hookMinutes)
    );
    backup = sortedByEase[0] || allMovies[0];
  }

  return backup;
}

/**
 * Step 6: Select an optional Double Feature Second Reel when timeBudget >= 200 min
 */
export function selectDoubleFeatureSecondReel(pick, backup, scoredPool, timeBudget) {
  const intermission = 10;
  const remainingMinutes = timeBudget - pick.runtime - intermission;
  if (remainingMinutes < 75) return null;

  const candidate = scoredPool.find(
    (m) =>
      m.id !== pick.id &&
      (!backup || m.id !== backup.id) &&
      m.runtime <= remainingMinutes &&
      m.brainBattery <= Math.max(1, pick.brainBattery - 1)
  );

  return candidate || null;
}

/**
 * Step 7: Build the Night Plan Timeline
 * - Start = now rounded up to next 5 min + 10 min settling time
 * - Bail check = Start + 20 min ("20-Minute Rule" checkpoint)
 * - End = Start + runtime (+ 10m intermission + second film if Double Feature active)
 */
export function buildNightTimeline(pick, doubleFeatureFilm = null, now = new Date()) {
  const msPerMin = 60 * 1000;
  const currentMins = now.getMinutes();
  const remainder = currentMins % 5;
  const roundUpMins = remainder === 0 ? 0 : 5 - remainder;
  const settlingMins = 10;

  const startTime = new Date(now.getTime() + (roundUpMins + settlingMins) * msPerMin);
  startTime.setSeconds(0, 0);

  const bailCheckTime = new Date(startTime.getTime() + 20 * msPerMin);
  const firstFilmEnd = new Date(startTime.getTime() + pick.runtime * msPerMin);

  let intermissionEnd = null;
  let finalEndTime = firstFilmEnd;

  if (doubleFeatureFilm) {
    intermissionEnd = new Date(firstFilmEnd.getTime() + 10 * msPerMin);
    finalEndTime = new Date(intermissionEnd.getTime() + doubleFeatureFilm.runtime * msPerMin);
  }

  const fmt = (dateObj) =>
    dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return {
    startFormatted: fmt(startTime),
    bailCheckFormatted: fmt(bailCheckTime),
    firstFilmEndFormatted: fmt(firstFilmEnd),
    intermissionEndFormatted: intermissionEnd ? fmt(intermissionEnd) : null,
    lightsOutFormatted: fmt(finalEndTime),
    totalRuntimeMinutes: doubleFeatureFilm
      ? pick.runtime + 10 + doubleFeatureFilm.runtime
      : pick.runtime
  };
}

/**
 * Step 8: Night Log Learning Loop
 * - Loved: +2 to its genres, +0.04 patience
 * - Finished: +1 to its genres, +0.02 patience
 * - Bailed: -2 to its genres; if bailedWithin20Min, patience drops by -0.10
 */
export function recordNightOutcome({
  movie,
  outcome, // 'loved' | 'finished' | 'bailed'
  bailedWithin20 = false,
  rating = 5,
  currentTaste = {},
  currentPatience = 0.65,
  currentLog = []
}) {
  const delta = outcome === 'loved' ? 2 : outcome === 'finished' ? 1 : -2;
  const nextTaste = { ...currentTaste };

  movie.genres.forEach((genre) => {
    nextTaste[genre] = Number(((nextTaste[genre] || 0) + delta).toFixed(2));
  });

  let nextPatience = currentPatience;
  if (outcome === 'bailed') {
    nextPatience = Math.max(0.15, Number((currentPatience - (bailedWithin20 ? 0.12 : 0.06)).toFixed(2)));
  } else if (outcome === 'loved') {
    nextPatience = Math.min(1.0, Number((currentPatience + 0.04).toFixed(2)));
  } else if (outcome === 'finished') {
    nextPatience = Math.min(1.0, Number((currentPatience + 0.02).toFixed(2)));
  }

  const newEntry = {
    id: `${Date.now()}-${movie.id}`,
    movieId: movie.id,
    title: movie.title,
    year: movie.year,
    genres: movie.genres,
    runtime: movie.runtime,
    gradient: movie.gradient,
    outcome,
    bailedWithin20,
    userStars: rating,
    timestamp: new Date().toISOString()
  };

  const nextLog = [newEntry, ...currentLog];
  savePersistedState({
    tasteProfile: nextTaste,
    patience: nextPatience,
    nightLog: nextLog
  });

  return {
    tasteProfile: nextTaste,
    patience: nextPatience,
    nightLog: nextLog
  };
}

