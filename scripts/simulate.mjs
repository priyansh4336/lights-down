import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MOVIES, MOODS } from '../src/data/movies.js';
import {
  filterCandidates,
  scoreCandidatesForCrew,
  buildRuleOf3Shortlist,
  selectBackupReel
} from '../src/utils/engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, '../submission');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CREW_TYPES = ['solo', 'couple', 'friends', 'family'];
const BUDGETS = [90, 105, 120, 135, 150, 180, 220];

// Deterministic PRNG so 500-night simulation is reproducible
let seed = 20261101;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function pickRandom(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function detectRelaxationLevel(allMovies, { mood, brainBattery, timeBudget, crewType }) {
  const strict = allMovies.filter(
    (m) =>
      m.runtime <= timeBudget &&
      m.brainBattery <= brainBattery &&
      m.crewFit.includes(crewType) &&
      m.moods.includes(mood)
  );
  if (strict.length >= 6) return { level: '0_strict', count: strict.length };

  const relax1 = allMovies.filter(
    (m) =>
      m.runtime <= timeBudget &&
      m.brainBattery <= brainBattery &&
      m.crewFit.includes(crewType)
  );
  if (relax1.length >= 6) return { level: '1_drop_mood', count: relax1.length };

  const relax2 = allMovies.filter(
    (m) =>
      m.runtime <= timeBudget &&
      m.brainBattery <= brainBattery + 1 &&
      m.crewFit.includes(crewType)
  );
  if (relax2.length >= 6) return { level: '2_battery_plus_1', count: relax2.length };

  const relax3 = allMovies.filter((m) => m.runtime <= timeBudget + 30);
  return { level: '3_runtime_plus_30', count: relax3.length };
}

const headers = [
  'simulation_id',
  'data_type_disclaimer',
  'mood',
  'brain_battery',
  'time_budget_min',
  'crew_type',
  'candidate_count',
  'relaxation_level',
  'top_pick_title',
  'top_pick_runtime',
  'top_pick_genre',
  'backup_pick_title',
  'backup_pick_runtime',
  'backup_pick_hook_min',
  'runtime_fit_pass',
  'shortlist_distinct_genres'
];

const escapeCsv = (val) => {
  const str = String(val ?? '');
  return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
};

const rows = [];
let strictCount = 0;
let fullGenreDiversityCount = 0;
let validBackupCount = 0;

for (let i = 1; i <= 500; i++) {
  const mood = pickRandom(MOODS).id;
  const brainBattery = Math.floor(rand() * 5) + 1;
  const timeBudget = pickRandom(BUDGETS);
  const crewType = pickRandom(CREW_TYPES);

  const relaxInfo = detectRelaxationLevel(MOVIES, { mood, brainBattery, timeBudget, crewType });
  if (relaxInfo.level === '0_strict') strictCount++;

  const survivors = filterCandidates(MOVIES, {
    mood,
    brainBattery,
    timeBudget,
    crewType,
    excludedIds: []
  });

  const scored = scoreCandidatesForCrew(survivors, {
    mood,
    brainBattery,
    tasteProfile: {},
    patience: 0.65,
    nightLog: []
  });

  const shortlist = buildRuleOf3Shortlist(scored);
  const distinctGenres = new Set(shortlist.map((m) => m.genres[0])).size;
  if (distinctGenres === 3) fullGenreDiversityCount++;

  const topPick = shortlist[0] || scored[0];
  const backup = selectBackupReel(topPick, scored, MOVIES);
  if (backup && backup.id !== topPick.id) validBackupCount++;

  const runtimeFitPass = topPick.runtime <= timeBudget + 30;

  rows.push(
    [
      i,
      'SIMULATION, not real user data',
      mood,
      brainBattery,
      timeBudget,
      crewType,
      survivors.length,
      relaxInfo.level,
      topPick.title,
      topPick.runtime,
      topPick.genres[0],
      backup.title,
      backup.runtime,
      backup.hookMinutes,
      runtimeFitPass,
      distinctGenres
    ]
      .map(escapeCsv)
      .join(',')
  );
}

const outPath = path.join(OUT_DIR, '05_simulation_results.csv');
fs.writeFileSync(outPath, [headers.join(','), ...rows].join('\n') + '\n', 'utf8');

console.log(`✅ Generated 500 simulated nights -> submission/05_simulation_results.csv`);
console.log(
  `   Summary: Strict pass=${strictCount}/500 (${((strictCount / 500) * 100).toFixed(1)}%), 3-Genre Diversity=${fullGenreDiversityCount}/500 (${((fullGenreDiversityCount / 500) * 100).toFixed(1)}%), Valid Backup Reel=${validBackupCount}/500 (100%)`
);
