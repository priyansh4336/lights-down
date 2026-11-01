import { useState, useCallback, useEffect, useRef } from 'react';
import { MOODS, MOVIES } from '../data/movies';
import {
  filterCandidates,
  scoreCandidatesForCrew,
  buildRuleOf3Shortlist,
  selectBackupReel,
  selectDoubleFeatureSecondReel,
  buildNightTimeline,
  recordNightOutcome,
  computeBoothStats
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

  // Decision timing telemetry
  const [decisionStartedAt, setDecisionStartedAt] = useState(() => Date.now());
  const [lastTimeToDecideSec, setLastTimeToDecideSec] = useState(45);

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

  // Real 20-Minute Rule session timer state
  const [nowPlayingStartedAt, setNowPlayingStartedAt] = useState(null);
  const [nowPlayingElapsedSec, setNowPlayingElapsedSec] = useState(0);
  const [twentyMinPromptOpen, setTwentyMinPromptOpen] = useState(false);
  const [twentyMinChecked, setTwentyMinChecked] = useState(false);
  const [notifPermission, setNotifPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const firedNotifRef = useRef(false);

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

  const handleStartSetup = useCallback(() => {
    setDecisionStartedAt(Date.now());
    setSetupStep(1);
    setScreen('setup');
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

  const handleMergeRemoteCrewVotes = useCallback(
    (remoteVoteObjects = []) => {
      if (!Array.isArray(remoteVoteObjects) || remoteVoteObjects.length === 0) return;
      const survivors = filterCandidates(MOVIES, {
        mood,
        brainBattery,
        timeBudget,
        crewType,
        excludedIds: vetoedIds
      });
      const mergedVotes = [...hotSeatVotes, ...remoteVoteObjects];
      setHotSeatVotes(mergedVotes);
      launchShortlist(survivors, mergedVotes);
      showToast(`Merged ${remoteVoteObjects.length} remote Crew Link ballot(s) using Least-Misery consensus!`);
    },
    [mood, brainBattery, timeBudget, crewType, vetoedIds, hotSeatVotes, launchShortlist, showToast]
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
    const elapsedSec = Math.max(5, Math.round((Date.now() - decisionStartedAt) / 1000));
    setLastTimeToDecideSec(elapsedSec);
    setNowPlayingStartedAt(null);
    setNowPlayingElapsedSec(0);
    setTwentyMinPromptOpen(false);
    setTwentyMinChecked(false);
    firedNotifRef.current = false;
    startCountdown(90);
    setScreen('plan');
    showToast(`Ticket torn in ${elapsedSec}s! Lights going down in 90 seconds.`);
  }, [decisionStartedAt, startCountdown, showToast]);

  // Start the real "Now Playing" session timer once the 90s countdown reaches 0 on NightPlan
  useEffect(() => {
    if (screen === 'plan' && countdownSeconds === 0 && !nowPlayingStartedAt) {
      setNowPlayingStartedAt(Date.now());
    }
  }, [screen, countdownSeconds, nowPlayingStartedAt]);

  // Tick the "Now Playing" timer every second and trigger the 20-Minute Check-in at 1200s (20 min)
  useEffect(() => {
    if (screen !== 'plan' || !nowPlayingStartedAt) return undefined;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - nowPlayingStartedAt) / 1000);
      setNowPlayingElapsedSec(elapsed);
      if (elapsed >= 20 * 60 && !twentyMinChecked && !swappedToBackup) {
        setTwentyMinPromptOpen(true);
        setTwentyMinChecked(true);
        if (
          !firedNotifRef.current &&
          typeof document !== 'undefined' &&
          document.hidden &&
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          firedNotifRef.current = true;
          try {
            new Notification('Lights Down — 20 minutes in. Still with it?', {
              body: `Keep watching "${chosenFilm?.title || 'your pick'}" or bail to Backup Reel "${backupFilm?.title || 'Plan B'}" now.`
            });
          } catch {
            // ignore notification errors
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, nowPlayingStartedAt, twentyMinChecked, swappedToBackup, chosenFilm, backupFilm]);

  const handleSkipToMinute20Dev = useCallback(() => {
    const twentyMinsAgo = Date.now() - 20 * 60 * 1000;
    stopCountdown();
    setNowPlayingStartedAt(twentyMinsAgo);
    setNowPlayingElapsedSec(20 * 60);
    setTwentyMinPromptOpen(true);
    setTwentyMinChecked(true);
    if (
      typeof document !== 'undefined' &&
      document.hidden &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification('Lights Down — 20 minutes in. Still with it?', {
          body: `Keep watching "${chosenFilm?.title || 'your pick'}" or bail to Backup Reel.`
        });
      } catch {
        // ignore
      }
    }
  }, [stopCountdown, chosenFilm]);

  const handleRequestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Browser notifications are not supported in this environment.');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
      if (result === 'granted') {
        showToast('20-Minute background alert enabled!');
      } else {
        showToast('Notification permission declined — in-app prompt will still appear.');
      }
    } catch {
      showToast('Could not request notification permission.');
    }
  }, [showToast]);

  const handleBailToBackup = useCallback(() => {
    if (!chosenFilm || !backupFilm || swappedToBackup) return;
    const updated = recordNightOutcome({
      movie: chosenFilm,
      outcome: 'bailed',
      bailedWithin20: true,
      rating: 1,
      currentTaste: tasteProfile,
      currentPatience: patience,
      currentLog: nightLog,
      timeToDecideSeconds: lastTimeToDecideSec,
      vetoesUsed: vetoedIds.length,
      crewSize: crewCount,
      backupSaved: true,
      brainBattery,
      mood
    });
    setPersisted(updated);
    setSwappedToBackup(true);
    setTwentyMinPromptOpen(false);
    showToast(
      `Bailed on "${chosenFilm.title}"! Swapped to Backup Reel "${backupFilm.title}" & updated patience score.`
    );
  }, [
    chosenFilm,
    backupFilm,
    swappedToBackup,
    tasteProfile,
    patience,
    nightLog,
    lastTimeToDecideSec,
    vetoedIds.length,
    crewCount,
    brainBattery,
    mood,
    setPersisted,
    showToast
  ]);

  const handleKeepAt20Min = useCallback(() => {
    if (!chosenFilm) return;
    const updated = recordNightOutcome({
      movie: chosenFilm,
      outcome: 'finished',
      bailedWithin20: false,
      rating: 4,
      currentTaste: tasteProfile,
      currentPatience: patience,
      currentLog: nightLog,
      timeToDecideSeconds: lastTimeToDecideSec,
      vetoesUsed: vetoedIds.length,
      crewSize: crewCount,
      backupSaved: false,
      brainBattery,
      mood
    });
    setPersisted(updated);
    setTwentyMinPromptOpen(false);
    showToast(`20-Minute check passed! "${chosenFilm.title}" logged as locked-in (+patience).`);
  }, [
    chosenFilm,
    tasteProfile,
    patience,
    nightLog,
    lastTimeToDecideSec,
    vetoedIds.length,
    crewCount,
    brainBattery,
    mood,
    setPersisted,
    showToast
  ]);

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
        currentLog: nightLog,
        timeToDecideSeconds: lastTimeToDecideSec,
        vetoesUsed: vetoedIds.length,
        crewSize: crewCount,
        backupSaved: swappedToBackup && logOutcome !== 'bailed',
        brainBattery,
        mood
      });
      setPersisted(updated);
      showToast(`Logged "${targetMovie.title}" as ${logOutcome.toUpperCase()}!`);
    },
    [
      activePlayingFilm,
      logOutcome,
      logBailedEarly,
      logStars,
      tasteProfile,
      patience,
      nightLog,
      lastTimeToDecideSec,
      vetoedIds.length,
      crewCount,
      swappedToBackup,
      brainBattery,
      mood,
      setPersisted,
      showToast
    ]
  );

  const handleDeleteLogEntry = useCallback(
    (entryId) => {
      const nextLog = nightLog.filter((item) => item.id !== entryId);
      setPersisted({ ...persisted, nightLog: nextLog });
    },
    [nightLog, persisted, setPersisted]
  );

  const handleResetTonight = useCallback(() => {
    setDecisionStartedAt(Date.now());
    setSetupStep(1);
    setChosenFilm(null);
    setBackupFilm(null);
    setDoubleFeatureFilm(null);
    setSwappedToBackup(false);
    setNowPlayingStartedAt(null);
    setNowPlayingElapsedSec(0);
    setTwentyMinPromptOpen(false);
    setTwentyMinChecked(false);
    stopCountdown();
    setScreen('setup');
    showToast('Current night reset. Ready for a fresh setup.');
  }, [stopCountdown, showToast]);

  const handleWipeNightLog = useCallback(() => {
    try {
      localStorage.removeItem('lights_down_v2_state');
    } catch {
      // ignore
    }
    setPersisted({ tasteProfile: {}, patience: 0.65, nightLog: [] });
    setConfirmClearModal(false);
    showToast('All data, Night Log, and taste profile reset to factory defaults.');
  }, [setPersisted, showToast]);

  const handleExportCsv = useCallback(() => {
    const headers = [
      'id',
      'timestamp',
      'movieId',
      'title',
      'year',
      'genres',
      'outcome',
      'userStars',
      'bailedEarly',
      'backupSaved',
      'timeToDecideSeconds',
      'vetoesUsed',
      'crewSize',
      'brainBattery',
      'mood'
    ];
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const rows = nightLog.map((e) =>
      [
        e.id,
        e.timestamp,
        e.movieId,
        e.title,
        e.year,
        (e.genres || []).join('|'),
        e.outcome,
        e.userStars ?? '',
        Boolean(e.bailedEarly || e.bailedWithin20),
        Boolean(e.backupSaved),
        e.timeToDecideSeconds ?? '',
        e.vetoesUsed ?? 0,
        e.crewSize ?? 1,
        e.brainBattery ?? '',
        e.mood ?? ''
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lights-down-night-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${nightLog.length} logged night(s) to CSV.`);
  }, [nightLog, showToast]);

  const timeline = activePlayingFilm
    ? buildNightTimeline(
        activePlayingFilm,
        useDoubleFeature && !swappedToBackup ? doubleFeatureFilm : null
      )
    : null;

  const boothStats = computeBoothStats(nightLog, patience);

  return {
    persisted,
    setPersisted,
    tasteProfile,
    patience,
    nightLog,
    boothStats,
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
    handleStartSetup,
    hotSeatPlayerIndex,
    hotSeatInterstitial,
    setHotSeatInterstitial,
    hotSeatPool,
    hotSeatCardIdx,
    handleHotSeatVote,
    handleMergeRemoteCrewVotes,
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
    nowPlayingStartedAt,
    nowPlayingElapsedSec,
    twentyMinPromptOpen,
    setTwentyMinPromptOpen,
    notifPermission,
    handleRequestNotificationPermission,
    handleSkipToMinute20Dev,
    handleKeepAt20Min,
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
    handleExportCsv,
    toastMessage,
    showToast,
    confirmClearModal,
    setConfirmClearModal
  };
}
