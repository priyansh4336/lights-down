import { useState, useCallback, useEffect } from 'react';
import { MOODS, MOVIES } from '../data/movies';
import {
  filterCandidates,
  scoreCandidatesForCrew,
  buildRuleOf3Shortlist,
  selectBackupReel,
  selectDoubleFeatureSecondReel,
  buildNightTimeline,
  recordNightOutcome
} from '../utils/engine';
import { usePersistedState } from './usePersistedState';
import { useCountdown } from './useCountdown';

export function useNightSession() {
  const [persisted, setPersisted] = usePersistedState();
  const { tasteProfile, patience, nightLog } = persisted;

  const [screen, setScreen] = useState('landing');
  const [setupStep, setSetupStep] = useState(1);
  const [mood, setMood] = useState('cozy');
  const [brainBattery, setBrainBattery] = useState(3);
  const [timeBudget, setTimeBudget] = useState(135);
  const [crewType, setCrewType] = useState('solo');
  const [crewCount, setCrewCount] = useState(1);

  // Hot Seat state
  const [hotSeatPlayerIndex, setHotSeatPlayerIndex] = useState(0);
  const [hotSeatInterstitial, setHotSeatInterstitial] = useState(true);
  const [hotSeatPool, setHotSeatPool] = useState([]);
  const [hotSeatCardIdx, setHotSeatCardIdx] = useState(0);
  const [hotSeatVotes, setHotSeatVotes] = useState([]);

  // Shortlist state
  const [scoredPool, setScoredPool] = useState([]);
  const [shortlist, setShortlist] = useState([]);
  const [activeShortlistIdx, setActiveShortlistIdx] = useState(0);
  const [vetoedIds, setVetoedIds] = useState([]);
  const [soloRerollsLeft, setSoloRerollsLeft] = useState(2);
  const [playerVetoTokens, setPlayerVetoTokens] = useState([true]);

  // Chosen Film & Plan state
  const [chosenFilm, setChosenFilm] = useState(null);
  const [backupFilm, setBackupFilm] = useState(null);
  const [doubleFeatureFilm, setDoubleFeatureFilm] = useState(null);
  const [useDoubleFeature, setUseDoubleFeature] = useState(false);
  const [swappedToBackup, setSwappedToBackup] = useState(false);

  const { countdownSeconds, countdownRunning, startCountdown, stopCountdown } = useCountdown(90);

  // Log form & UI state
  const [logOutcome, setLogOutcome] = useState('loved');
  const [logBailedEarly, setLogBailedEarly] = useState(false);
  const [logStars, setLogStars] = useState(5);
  const [toastMessage, setToastMessage] = useState('');
  const [confirmClearModal, setConfirmClearModal] = useState(false);

  const activeMoodObj = MOODS.find((m) => m.id === mood) || MOODS[0];

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 3600);
  }, []);

  const handleCrewTypeChange = useCallback((nextType) => {
    setCrewType(nextType);
    if (nextType === 'solo') setCrewCount(1);
    else if (nextType === 'couple') setCrewCount(2);
    else if (nextType === 'friends') setCrewCount(3);
    else if (nextType === 'family') setCrewCount(4);
  }, []);

  const launchShortlist = useCallback(
    (candidatesPool, votes) => {
      const scored = scoreCandidatesForCrew(
        candidatesPool,
        { mood, brainBattery, tasteProfile, patience, nightLog },
        votes
      );
      const ruleOf3 = buildRuleOf3Shortlist(scored);
      setScoredPool(scored);
      setShortlist(ruleOf3);
      setActiveShortlistIdx(0);
      setVetoedIds([]);
      setScreen('shortlist');
    },
    [mood, brainBattery, tasteProfile, patience, nightLog]
  );

  const handleFinishSetup = useCallback(() => {
    const survivors = filterCandidates(MOVIES, {
      mood,
      brainBattery,
      timeBudget,
      crewType,
      excludedIds: []
    });

    if (crewCount > 1) {
      const initialScored = scoreCandidatesForCrew(survivors, {
        mood,
        brainBattery,
        tasteProfile,
        patience,
        nightLog
      });
      setHotSeatPool(initialScored.slice(0, 5));
      setHotSeatPlayerIndex(0);
      setHotSeatCardIdx(0);
      setHotSeatInterstitial(true);
      setHotSeatVotes(
        Array.from({ length: crewCount }, (_, i) => ({
          player: i + 1,
          likes: [],
          passes: [],
          vetoes: []
        }))
      );
      setPlayerVetoTokens(Array.from({ length: crewCount }, () => true));
      setScreen('hotseat');
    } else {
      launchShortlist(survivors, []);
      setSoloRerollsLeft(2);
    }
  }, [mood, brainBattery, timeBudget, crewType, crewCount, tasteProfile, patience, nightLog, launchShortlist]);

  const handleHotSeatVote = useCallback(
    (choice) => {
      const currentFilm = hotSeatPool[hotSeatCardIdx];
      if (!currentFilm) return;

      const updatedVotes = hotSeatVotes.map((entry, idx) => {
        if (idx !== hotSeatPlayerIndex) return entry;
        return {
          ...entry,
          likes: choice === 'yes' ? [...entry.likes, currentFilm.id] : entry.likes,
          passes: choice === 'no' ? [...entry.passes, currentFilm.id] : entry.passes
        };
      });
      setHotSeatVotes(updatedVotes);

      if (hotSeatCardIdx + 1 < hotSeatPool.length) {
        setHotSeatCardIdx(hotSeatCardIdx + 1);
      } else if (hotSeatPlayerIndex + 1 < crewCount) {
        setHotSeatPlayerIndex(hotSeatPlayerIndex + 1);
        setHotSeatCardIdx(0);
        setHotSeatInterstitial(true);
      } else {
        const survivors = filterCandidates(MOVIES, {
          mood,
          brainBattery,
          timeBudget,
          crewType,
          excludedIds: []
        });
        launchShortlist(survivors, updatedVotes);
      }
    },
    [hotSeatPool, hotSeatCardIdx, hotSeatVotes, hotSeatPlayerIndex, crewCount, mood, brainBattery, timeBudget, crewType, launchShortlist]
  );

  const handlePickFromShortlist = useCallback(
    (film) => {
      if (!film) return;
      const backup = selectBackupReel(film, scoredPool, MOVIES);
      const secondReel = selectDoubleFeatureSecondReel(film, backup, scoredPool, timeBudget);
      setChosenFilm(film);
      setBackupFilm(backup);
      setDoubleFeatureFilm(secondReel);
      setUseDoubleFeature(false);
      setSwappedToBackup(false);
      setScreen('reveal');
    },
    [scoredPool, timeBudget]
  );

  const handleVetoCurrentCard = useCallback(
    (playerIdx = 0) => {
      const targetFilm = shortlist[activeShortlistIdx];
      if (!targetFilm) return;

      if (crewCount === 1) {
        if (soloRerollsLeft <= 0) {
          showToast('No rerolls left! Pick from the remaining reels.');
          return;
        }
        setSoloRerollsLeft((r) => r - 1);
      } else {
        if (!playerVetoTokens[playerIdx]) {
          showToast(`Player ${playerIdx + 1} already spent their Veto Token!`);
          return;
        }
        setPlayerVetoTokens((prev) => prev.map((t, i) => (i === playerIdx ? false : t)));
      }

      const nextVetoed = [...vetoedIds, targetFilm.id];
      setVetoedIds(nextVetoed);

      const currentIds = new Set([...shortlist.map((m) => m.id), ...nextVetoed]);
      const replacement =
        scoredPool.find((m) => !currentIds.has(m.id)) ||
        MOVIES.find((m) => !currentIds.has(m.id));

      if (replacement) {
        setShortlist(shortlist.map((item, idx) => (idx === activeShortlistIdx ? replacement : item)));
        showToast(
          crewCount === 1
            ? `Vetoed "${targetFilm.title}" — swapped in "${replacement.title}"`
            : `Player ${playerIdx + 1} vetoed "${targetFilm.title}"! Swapped in "${replacement.title}".`
        );
      } else {
        setShortlist(shortlist.filter((item) => item.id !== targetFilm.id));
        setActiveShortlistIdx(0);
      }
    },
    [shortlist, activeShortlistIdx, crewCount, soloRerollsLeft, playerVetoTokens, vetoedIds, scoredPool, showToast]
  );

  useEffect(() => {
    if (screen !== 'shortlist') return undefined;
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlePickFromShortlist(shortlist[activeShortlistIdx]);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const availablePlayer = crewCount === 1 ? 0 : playerVetoTokens.findIndex(Boolean);
        if (availablePlayer !== -1) handleVetoCurrentCard(availablePlayer);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveShortlistIdx((prev) => (prev + 1) % Math.max(1, shortlist.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveShortlistIdx(
          (prev) => (prev - 1 + Math.max(1, shortlist.length)) % Math.max(1, shortlist.length)
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, shortlist, activeShortlistIdx, crewCount, playerVetoTokens, handlePickFromShortlist, handleVetoCurrentCard]);

  const handleCommitTicket = useCallback(() => {
    startCountdown(90);
    setScreen('plan');
    showToast('Ticket torn! Lights going down in 90 seconds.');
  }, [startCountdown, showToast]);

  const handleBailToBackup = useCallback(() => {
    if (!chosenFilm || !backupFilm || swappedToBackup) return;
    const updated = recordNightOutcome({
      movie: chosenFilm,
      outcome: 'bailed',
      bailedWithin20: true,
      rating: 1,
      currentTaste: tasteProfile,
      currentPatience: patience,
      currentLog: nightLog
    });
    setPersisted(updated);
    setSwappedToBackup(true);
    showToast(
      `Bailed on "${chosenFilm.title}"! Swapped to Backup Reel "${backupFilm.title}" & updated patience score.`
    );
  }, [chosenFilm, backupFilm, swappedToBackup, tasteProfile, patience, nightLog, setPersisted, showToast]);

  const activePlayingFilm = swappedToBackup && backupFilm ? backupFilm : chosenFilm;

  const handleLogTonight = useCallback(
    (e) => {
      e.preventDefault();
      const targetMovie = activePlayingFilm || MOVIES[0];
      const updated = recordNightOutcome({
        movie: targetMovie,
        outcome: logOutcome,
        bailedWithin20: logOutcome === 'bailed' ? logBailedEarly : false,
        rating: logOutcome === 'loved' ? logStars : 4,
        currentTaste: tasteProfile,
        currentPatience: patience,
        currentLog: nightLog
      });
      setPersisted(updated);
      showToast(`Logged "${targetMovie.title}" as ${logOutcome.toUpperCase()}!`);
    },
    [activePlayingFilm, logOutcome, logBailedEarly, logStars, tasteProfile, patience, nightLog, setPersisted, showToast]
  );

  const handleDeleteLogEntry = useCallback(
    (entryId) => {
      const nextLog = nightLog.filter((item) => item.id !== entryId);
      setPersisted({ ...persisted, nightLog: nextLog });
    },
    [nightLog, persisted, setPersisted]
  );

  const handleResetTonight = useCallback(() => {
    setSetupStep(1);
    setChosenFilm(null);
    setBackupFilm(null);
    setDoubleFeatureFilm(null);
    setSwappedToBackup(false);
    stopCountdown();
    setScreen('setup');
    showToast('Current night reset. Ready for a fresh setup.');
  }, [stopCountdown, showToast]);

  const handleWipeNightLog = useCallback(() => {
    setPersisted({ tasteProfile: {}, patience: 0.65, nightLog: [] });
    setConfirmClearModal(false);
    showToast('Night Log and taste profile cleared.');
  }, [setPersisted, showToast]);

  const timeline = activePlayingFilm
    ? buildNightTimeline(
        activePlayingFilm,
        useDoubleFeature && !swappedToBackup ? doubleFeatureFilm : null
      )
    : null;

  return {
    persisted,
    setPersisted,
    tasteProfile,
    patience,
    nightLog,
    screen,
    setScreen,
    setupStep,
    setSetupStep,
    mood,
    setMood,
    activeMoodObj,
    brainBattery,
    setBrainBattery,
    timeBudget,
    setTimeBudget,
    crewType,
    handleCrewTypeChange,
    crewCount,
    setCrewCount,
    hotSeatPlayerIndex,
    hotSeatInterstitial,
    setHotSeatInterstitial,
    hotSeatPool,
    hotSeatCardIdx,
    handleHotSeatVote,
    shortlist,
    activeShortlistIdx,
    setActiveShortlistIdx,
    soloRerollsLeft,
    playerVetoTokens,
    handleFinishSetup,
    handlePickFromShortlist,
    handleVetoCurrentCard,
    chosenFilm,
    backupFilm,
    doubleFeatureFilm,
    useDoubleFeature,
    setUseDoubleFeature,
    swappedToBackup,
    activePlayingFilm,
    timeline,
    countdownSeconds,
    countdownRunning,
    handleCommitTicket,
    handleBailToBackup,
    logOutcome,
    setLogOutcome,
    logBailedEarly,
    setLogBailedEarly,
    logStars,
    setLogStars,
    handleLogTonight,
    handleDeleteLogEntry,
    handleResetTonight,
    handleWipeNightLog,
    toastMessage,
    showToast,
    confirmClearModal,
    setConfirmClearModal
  };
}
