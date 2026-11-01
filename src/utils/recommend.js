/**
 * Content-based movie recommendation & live re-ranking engine.
 *
 * Scoring breakdown:
 * - Mood overlap with selected mood(s): +5.0 pts per matched mood
 * - Genre affinity from taste profile (likes boost genre +1.5, skips drop genre -1.0): added directly
 * - Base rating boost: rating * 0.35 (so an 8.8 rated film gets +3.08 pts)
 */

export function scoreMovie(movie, selectedMoods = [], genreWeights = {}) {
  const moodsArray = Array.isArray(selectedMoods) ? selectedMoods : [selectedMoods];

  // 1. Mood overlap score
  let moodScore = 0;
  moodsArray.forEach((m) => {
    if (movie.moods.includes(m)) {
      moodScore += 5.0;
    }
  });

  // 2. Genre taste profile score
  let genreScore = 0;
  movie.genres.forEach((genre) => {
    const weight = genreWeights[genre] || 0;
    genreScore += weight;
  });

  // 3. Rating boost (out of 10 -> ~2.5 to 3.2 boost)
  const ratingBoost = (movie.rating || 7.5) * 0.35;

  const totalScore = Number((moodScore + genreScore + ratingBoost).toFixed(2));

  return {
    ...movie,
    matchScore: totalScore,
    moodMatched: moodScore > 0
  };
}

/**
 * Get the Initial Top 10 recommendations for a picked mood (or array of moods).
 */
export function getInitialRecommendations(allMovies, selectedMoods, genreWeights = {}) {
  const scored = allMovies.map((movie) =>
    scoreMovie(movie, selectedMoods, genreWeights)
  );

  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored.slice(0, 10);
}

/**
 * Re-score and re-rank the remaining cards in the deck live after a Like or Skip.
 */
export function rerankRemainingDeck(remainingMovies, selectedMoods, updatedGenreWeights) {
  const rescored = remainingMovies.map((movie) =>
    scoreMovie(movie, selectedMoods, updatedGenreWeights)
  );

  rescored.sort((a, b) => b.matchScore - a.matchScore);
  return rescored;
}

/**
 * Update the user's genre weight profile when they like (+1.5) or skip (-1.0) a movie.
 */
export function updateTasteProfile(currentWeights, movie, action) {
  const delta = action === 'like' ? 1.5 : -1.0;
  const nextWeights = { ...currentWeights };

  movie.genres.forEach((genre) => {
    const prev = nextWeights[genre] || 0;
    nextWeights[genre] = Number((prev + delta).toFixed(2));
  });

  return nextWeights;
}

