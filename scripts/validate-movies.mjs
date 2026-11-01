import { MOVIES, MOODS } from '../src/data/movies.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_PATH = path.resolve(__dirname, '../src/data/tmdb-cache.json');

const REQUIRED_FIELDS = [
  'id',
  'title',
  'year',
  'language',
  'genres',
  'moods',
  'runtime',
  'rating',
  'desc',
  'gradient',
  'brainBattery',
  'hookMinutes',
  'crewFit',
  'snack'
];

let errors = [];

// 1. Unique IDs & count
if (MOVIES.length !== 60) {
  errors.push(`Expected 60 movies, found ${MOVIES.length}`);
}

const seenIds = new Set();
const moodCounts = Object.fromEntries(MOODS.map((m) => [m.id, 0]));
const batteryCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

for (const film of MOVIES) {
  if (seenIds.has(film.id)) {
    errors.push(`Duplicate movie id: ${film.id}`);
  }
  seenIds.add(film.id);

  for (const field of REQUIRED_FIELDS) {
    if (film[field] === undefined || film[field] === null || film[field] === '') {
      errors.push(`Movie #${film.id} (${film.title}) missing required field: ${field}`);
    }
  }

  if (!Array.isArray(film.genres) || film.genres.length === 0) {
    errors.push(`Movie #${film.id} (${film.title}) must have at least 1 genre`);
  }

  if (!Array.isArray(film.moods) || film.moods.length === 0) {
    errors.push(`Movie #${film.id} (${film.title}) must have at least 1 mood`);
  } else {
    for (const m of film.moods) {
      if (moodCounts[m] === undefined) {
        errors.push(`Movie #${film.id} (${film.title}) has unknown mood: ${m}`);
      } else {
        moodCounts[m]++;
      }
    }
  }

  if (typeof film.brainBattery !== 'number' || film.brainBattery < 1 || film.brainBattery > 5) {
    errors.push(`Movie #${film.id} (${film.title}) brainBattery must be 1..5, got ${film.brainBattery}`);
  } else {
    batteryCounts[film.brainBattery]++;
  }

  if (typeof film.hookMinutes !== 'number' || film.hookMinutes < 1 || film.hookMinutes > 30) {
    errors.push(`Movie #${film.id} (${film.title}) hookMinutes must be 1..30, got ${film.hookMinutes}`);
  }

  if (!Array.isArray(film.gradient) || film.gradient.length !== 2) {
    errors.push(`Movie #${film.id} (${film.title}) gradient must be a 2-color hex tuple`);
  }
}

// Check >= 6 films per mood and per brainBattery level
for (const [moodId, count] of Object.entries(moodCounts)) {
  if (count < 6) {
    errors.push(`Mood "${moodId}" has only ${count} films (minimum required: 6)`);
  }
}

for (const [level, count] of Object.entries(batteryCounts)) {
  if (count < 6) {
    errors.push(`Brain Battery level ${level} has only ${count} films (minimum required: 6)`);
  }
}

// Check tmdb-cache.json exists and covers all movies
if (!fs.existsSync(CACHE_PATH)) {
  errors.push('src/data/tmdb-cache.json does not exist');
} else {
  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    for (const film of MOVIES) {
      if (!cache[film.id] || !cache[film.id].tmdbId) {
        errors.push(`src/data/tmdb-cache.json missing entry/tmdbId for movie #${film.id} (${film.title})`);
      }
    }
  } catch (e) {
    errors.push(`src/data/tmdb-cache.json is not valid JSON: ${e.message}`);
  }
}

if (errors.length > 0) {
  console.error('❌ Dataset validation failed:');
  for (const err of errors) {
    console.error('  - ' + err);
  }
  process.exit(1);
} else {
  console.log('✅ Dataset validation passed!');
  console.log(`   Total movies: ${MOVIES.length}`);
  console.log(`   Mood distribution:`, moodCounts);
  console.log(`   Brain Battery distribution:`, batteryCounts);
}
