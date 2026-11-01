import { describe, it, expect, beforeEach } from 'vitest';
import { MOVIES } from '../data/movies.js';
import {
  filterCandidates,
  scoreFilm,
  scoreCandidatesForCrew,
  buildRuleOf3Shortlist,
  selectBackupReel,
  selectDoubleFeatureSecondReel,
  buildNightTimeline,
  recordNightOutcome,
  loadPersistedState,
  computeBoothStats
} from './engine.js';

describe('Lights Down POS Engine — Unit Test Suite', () => {
  beforeEach(() => {
    const store = {};
    globalThis.window = {
      localStorage: {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => {
          store[k] = String(v);
        },
        removeItem: (k) => {
          delete store[k];
        }
      }
    };
    globalThis.localStorage = globalThis.window.localStorage;
  });

  it('1. Hard filter strict pass returns >= 6 candidates matching runtime, brainBattery, crewFit, and mood', () => {
    const survivors = filterCandidates(MOVIES, {
      mood: 'cozy',
      brainBattery: 3,
      timeBudget: 145,
      crewType: 'couple',
      excludedIds: []
    });
    expect(survivors.length).toBeGreaterThanOrEqual(6);
    for (const film of survivors) {
      expect(film.runtime).toBeLessThanOrEqual(145);
      expect(film.brainBattery).toBeLessThanOrEqual(3);
      expect(film.crewFit).toContain('couple');
      expect(film.moods).toContain('cozy');
    }
  });

  it('2. Relaxation steps 1, 2, 3 and < 6 survivors fallback always return a playable candidate pool', () => {
    // Relax 1: drop mood when mood+battery+crew+runtime < 6
    const relax1 = filterCandidates(MOVIES, {
      mood: 'spooky',
      brainBattery: 1,
      timeBudget: 130,
      crewType: 'family',
      excludedIds: []
    });
    expect(relax1.length).toBeGreaterThanOrEqual(6);

    // Relax 2 & 3: ultra-tight timeBudget (80m) triggers runtime relaxation and fallback
    const ultraTight = filterCandidates(MOVIES, {
      mood: 'mind-bent',
      brainBattery: 1,
      timeBudget: 80,
      crewType: 'family',
      excludedIds: []
    });
    expect(ultraTight.length).toBeGreaterThanOrEqual(3);
  });

  it('3. Group Least-Misery scoring applies 0.6 * min + 0.4 * mean and removes vetoed films for all players', () => {
    const sample = MOVIES.slice(0, 6);
    const setupConfig = {
      mood: 'hyped',
      brainBattery: 3,
      tasteProfile: {},
      patience: 0.65,
      nightLog: []
    };

    const filmA = sample[0];
    const filmVetoed = sample[1];

    const votes = [
      { player: 1, likes: [filmA.id], passes: [], vetoes: [filmVetoed.id] },
      { player: 2, likes: [], passes: [filmA.id], vetoes: [] }
    ];

    const scored = scoreCandidatesForCrew(sample, setupConfig, votes);
    // Vetoed film is completely excluded for everyone
    expect(scored.some((f) => f.id === filmVetoed.id)).toBe(false);

    // Check Least-Misery math on filmA:
    const baseScore = scoreFilm(filmA, setupConfig);
    const p1 = baseScore + 18;
    const p2 = baseScore - 22;
    const expectedLeastMisery = Number((0.6 * Math.min(p1, p2) + 0.4 * ((p1 + p2) / 2)).toFixed(1));
    const scoredFilmA = scored.find((f) => f.id === filmA.id);
    expect(scoredFilmA.matchScore).toBeCloseTo(expectedLeastMisery, 1);
  });

  it('4. Rule of 3 returns at most 3 films with 3 distinct primary genres when possible', () => {
    const scored = scoreCandidatesForCrew(MOVIES, {
      mood: 'cozy',
      brainBattery: 3,
      tasteProfile: {},
      patience: 0.65,
      nightLog: []
    });
    const shortlist = buildRuleOf3Shortlist(scored);
    expect(shortlist.length).toBe(3);
    const genres = new Set(shortlist.map((m) => m.genres[0]));
    expect(genres.size).toBe(3);
  });

  it('5. Backup Reel ("20-Minute Rule") picks a shorter, faster-hook, lower-or-equal battery film in a different primary genre', () => {
    const mainPick = MOVIES.find((m) => m.title === 'Inception') || MOVIES[0];
    const scored = scoreCandidatesForCrew(MOVIES, {
      mood: 'mind-bent',
      brainBattery: 4,
      tasteProfile: {},
      patience: 0.65,
      nightLog: []
    });
    const backup = selectBackupReel(mainPick, scored, MOVIES);
    expect(backup).toBeDefined();
    expect(backup.id).not.toBe(mainPick.id);
    expect(backup.runtime).toBeLessThan(mainPick.runtime);
    expect(backup.hookMinutes).toBeLessThanOrEqual(mainPick.hookMinutes);
    expect(backup.brainBattery).toBeLessThanOrEqual(mainPick.brainBattery);
    expect(backup.genres[0]).not.toBe(mainPick.genres[0]);
  });

  it('6. Night Log learning updates genre weights (+2 loved, +1 finished, -2 bailed) and drops patience on early bail', () => {
    const film = MOVIES[0]; // Sci-Fi, Action, Comedy
    const resLoved = recordNightOutcome({
      movie: film,
      outcome: 'loved',
      bailedWithin20: false,
      rating: 5,
      currentTaste: {},
      currentPatience: 0.65,
      currentLog: [],
      timeToDecideSeconds: 42
    });
    expect(resLoved.tasteProfile[film.genres[0]]).toBe(2);
    expect(resLoved.patience).toBeCloseTo(0.69, 2);

    const resFinished = recordNightOutcome({
      movie: film,
      outcome: 'finished',
      bailedWithin20: false,
      rating: 4,
      currentTaste: resLoved.tasteProfile,
      currentPatience: resLoved.patience,
      currentLog: resLoved.nightLog,
      timeToDecideSeconds: 38
    });
    expect(resFinished.tasteProfile[film.genres[0]]).toBe(3);
    expect(resFinished.patience).toBeCloseTo(0.71, 2);

    const resBailedEarly = recordNightOutcome({
      movie: film,
      outcome: 'bailed',
      bailedWithin20: true,
      rating: 1,
      currentTaste: resFinished.tasteProfile,
      currentPatience: resFinished.patience,
      currentLog: resFinished.nightLog,
      timeToDecideSeconds: 51,
      backupSaved: true
    });
    expect(resBailedEarly.tasteProfile[film.genres[0]]).toBe(1);
    expect(resBailedEarly.patience).toBeCloseTo(0.59, 2);

    const stats = computeBoothStats(resBailedEarly.nightLog, resBailedEarly.patience);
    expect(stats.hasData).toBe(true);
    expect(stats.totalNights).toBe(3);
    expect(stats.backupSavedCount).toBe(1);
  });

  it('7. Corrupted localStorage JSON recovers gracefully to factory defaults without throwing', () => {
    globalThis.localStorage.setItem('lightsdown_taste_v2', '{corrupted_json!!');
    globalThis.localStorage.setItem('lightsdown_patience_v2', 'not_a_number');
    globalThis.localStorage.setItem('lightsdown_nightlog_v2', '{"not":"an_array"}');

    const state = loadPersistedState();
    expect(state.tasteProfile).toEqual({});
    expect(state.patience).toBe(0.65);
    expect(state.nightLog).toEqual([]);
  });

  it('8. Time-Fit back-solved timeline and Double Feature selection respect runtime budgets', () => {
    const pick = MOVIES.find((m) => m.runtime <= 105);
    const scored = scoreCandidatesForCrew(MOVIES, {
      mood: 'cozy',
      brainBattery: 3,
      tasteProfile: {},
      patience: 0.65,
      nightLog: []
    });
    const backup = selectBackupReel(pick, scored, MOVIES);
    const second = selectDoubleFeatureSecondReel(pick, backup, scored, 220);
    expect(second).not.toBeNull();
    const timeline = buildNightTimeline(pick, second, new Date('2026-11-01T21:02:00'));
    expect(timeline.totalRuntimeMinutes).toBe(pick.runtime + 10 + second.runtime);
  });
});
