import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOODS, BRAIN_BATTERY_LEVELS, CREW_OPTIONS, MOVIES } from './data/movies';
import {
  loadPersistedState,
  savePersistedState,
  filterCandidates,
  scoreCandidatesForCrew,
  buildRuleOf3Shortlist,
  selectBackupReel,
  selectDoubleFeatureSecondReel,
  buildNightTimeline,
  recordNightOutcome
} from './utils/engine';

// Official React Bits Registry Components
import ShinyText from './components/ShinyText';
import DecryptedText from './components/DecryptedText';
import Counter from './components/Counter';
import ClickSpark from './components/ClickSpark';
import Noise from './components/Noise';
import Stepper, { Step } from './components/Stepper';
import ElasticSlider from './components/ElasticSlider';
import Stack from './components/Stack';
import GlareHover from './components/GlareHover';
import SpotlightCard from './components/SpotlightCard';
import AnimatedList from './components/AnimatedList';
import Dock from './components/Dock';
import TargetCursor from './components/TargetCursor';

// Custom / Fallback React Bits Components
import { SplitFlapText, Grainient } from './components/SplitFlapAndGrainient';
import { OptionWheel, JellyRadio } from './components/SetupControls';
import {
  PulseHeartButton,
  HoloCard,
  TearTicket,
  SlideCommit,
  SwipeRow,
  PeekRating
} from './components/MicroInteractions';

const LazyLightRays = lazy(() => import('./components/LightRays'));

export default function App() {
  // Persisted state: tasteProfile, patience, nightLog
  const [persisted, setPersisted] = useState(() => loadPersistedState());
  const { tasteProfile, patience, nightLog } = persisted;

  // Screen flow: 'landing' | 'setup' | 'hotseat' | 'shortlist' | 'reveal' | 'plan' | 'log'
  const [screen, setScreen] = useState('landing');

  // Setup Stepper state
  const [setupStep, setSetupStep] = useState(1);
  const [mood, setMood] = useState('cozy');
  const [brainBattery, setBrainBattery] = useState(3);
  const [timeBudget, setTimeBudget] = useState(135);
  const [crewType, setCrewType] = useState('solo');
  const [crewCount, setCrewCount] = useState(1);

  // Hot Seat multi-player pass-the-phone state
  const [hotSeatPlayerIndex, setHotSeatPlayerIndex] = useState(0);
  const [hotSeatInterstitial, setHotSeatInterstitial] = useState(true);
  const [hotSeatPool, setHotSeatPool] = useState([]);
  const [hotSeatCardIdx, setHotSeatCardIdx] = useState(0);
  const [hotSeatVotes, setHotSeatVotes] = useState([]); // [{ player: 1, likes: [], passes: [], vetoes: [] }]

  // Shortlist (Rule of 3) state
  const [scoredPool, setScoredPool] = useState([]);
  const [shortlist, setShortlist] = useState([]);
  const [activeShortlistIdx, setActiveShortlistIdx] = useState(0);
  const [vetoedIds, setVetoedIds] = useState([]);
  const [soloRerollsLeft, setSoloRerollsLeft] = useState(2);
  const [playerVetoTokens, setPlayerVetoTokens] = useState([true]); // boolean per player

  // Chosen Film, Backup Reel, Double Feature & Night Plan
  const [chosenFilm, setChosenFilm] = useState(null);
  const [backupFilm, setBackupFilm] = useState(null);
  const [doubleFeatureFilm, setDoubleFeatureFilm] = useState(null);
  const [useDoubleFeature, setUseDoubleFeature] = useState(false);
  const [swappedToBackup, setSwappedToBackup] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(90);
  const [countdownRunning, setCountdownRunning] = useState(false);

  // Night Log form state
  const [logOutcome, setLogOutcome] = useState('loved');
  const [logBailedEarly, setLogBailedEarly] = useState(false);
  const [logStars, setLogStars] = useState(5);
  const [toastMessage, setToastMessage] = useState('');
  const [confirmClearModal, setConfirmClearModal] = useState(false);

  // Performance / Accessibility detection (mobile or prefers-reduced-motion)
  const [useStaticBg, setUseStaticBg] = useState(false);
  useEffect(() => {
    const checkPerf = () => {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const smallScreen = window.innerWidth < 768;
      setUseStaticBg(Boolean(reduced || smallScreen));
    };
    checkPerf();
    window.addEventListener('resize', checkPerf);
    return () => window.removeEventListener('resize', checkPerf);
  }, []);

  // Sync crewCount when crewType changes
  const handleCrewTypeChange = (nextType) => {
    setCrewType(nextType);
    if (nextType === 'solo') setCrewCount(1);
    else if (nextType === 'couple') setCrewCount(2);
    else if (nextType === 'friends') setCrewCount(3);
    else if (nextType === 'family') setCrewCount(4);
  };

  const activeMoodObj = MOODS.find((m) => m.id === mood) || MOODS[0];

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 3600);
  }, []);

  // Build candidates and launch either Hot Seat (crew > 1) or Rule of 3 Shortlist (solo)
  const handleFinishSetup = () => {
    const survivors = filterCandidates(MOVIES, {
      mood,
      brainBattery,
      timeBudget,
      crewType,
      excludedIds: []
    });

    if (crewCount > 1) {
      // Pick top 5 candidates for lightning Hot Seat rounds
      const initialScored = scoreCandidatesForCrew(survivors, {
        mood,
        brainBattery,
        tasteProfile,
        patience,
        nightLog
      });
      const top5 = initialScored.slice(0, 5);
      setHotSeatPool(top5);
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
  };

  const launchShortlist = (candidatesPool, votes) => {
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
  };

  // Hot Seat swipe handler for current player
  const handleHotSeatVote = (choice) => {
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
      // Next player's turn
      setHotSeatPlayerIndex(hotSeatPlayerIndex + 1);
      setHotSeatCardIdx(0);
      setHotSeatInterstitial(true);
    } else {
      // All players done -> aggregate by Least-Misery & show Rule of 3 Shortlist
      const survivors = filterCandidates(MOVIES, {
        mood,
        brainBattery,
        timeBudget,
        crewType,
        excludedIds: []
      });
      launchShortlist(survivors, updatedVotes);
    }
  };

  // Shortlist: Pick "This One"
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

  // Shortlist: Veto / Reroll current card
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

      // Replace vetoed card from scoredPool or MOVIES
      const currentIds = new Set([...shortlist.map((m) => m.id), ...nextVetoed]);
      const replacement =
        scoredPool.find((m) => !currentIds.has(m.id)) ||
        MOVIES.find((m) => !currentIds.has(m.id));

      if (replacement) {
        const updatedList = shortlist.map((item, idx) =>
          idx === activeShortlistIdx ? replacement : item
        );
        setShortlist(updatedList);
        showToast(
          crewCount === 1
            ? `Vetoed "${targetFilm.title}" — swapped in "${replacement.title}"`
            : `Player ${playerIdx + 1} vetoed "${targetFilm.title}"! Swapped in "${replacement.title}".`
        );
      } else {
        const filtered = shortlist.filter((item) => item.id !== targetFilm.id);
        setShortlist(filtered);
        setActiveShortlistIdx(0);
      }
    },
    [
      shortlist,
      activeShortlistIdx,
      crewCount,
      soloRerollsLeft,
      playerVetoTokens,
      vetoedIds,
      scoredPool,
      showToast
    ]
  );

  // Keyboard support on Shortlist screen (ArrowRight = Pick, ArrowLeft = Veto, Up/Down = cycle 3 cards)
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
      } else if (e.key === 'ArrowDown' || e.key === 'Tab') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveShortlistIdx((prev) => (prev + 1) % Math.max(1, shortlist.length));
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveShortlistIdx(
          (prev) => (prev - 1 + Math.max(1, shortlist.length)) % Math.max(1, shortlist.length)
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    screen,
    shortlist,
    activeShortlistIdx,
    crewCount,
    playerVetoTokens,
    handlePickFromShortlist,
    handleVetoCurrentCard
  ]);

  // Ticket Tear Commit -> starts 90s Lights Down countdown and transitions to Night Plan
  const handleCommitTicket = () => {
    setCountdownSeconds(90);
    setCountdownRunning(true);
    setScreen('plan');
    showToast('Ticket torn! Lights going down in 90 seconds.');
  };

  // Countdown timer effect on Night Plan screen
  useEffect(() => {
    if (screen !== 'plan' || !countdownRunning) return undefined;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          setCountdownRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, countdownRunning]);

  // SOP #1: "Bail to Backup" Slide Control during the night
  const handleBailToBackup = () => {
    if (!chosenFilm || !backupFilm || swappedToBackup) return;
    // Log a 20-minute bail signal on the primary film immediately
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
  };

  // Night Log submission for tonight's active film
  const activePlayingFilm = swappedToBackup && backupFilm ? backupFilm : chosenFilm;

  const handleLogTonight = (e) => {
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
  };

  const handleDeleteLogEntry = (entryId) => {
    const nextLog = nightLog.filter((item) => item.id !== entryId);
    const nextState = { ...persisted, nightLog: nextLog };
    setPersisted(nextState);
    savePersistedState(nextState);
  };

  const handleResetTonight = () => {
    setSetupStep(1);
    setChosenFilm(null);
    setBackupFilm(null);
    setDoubleFeatureFilm(null);
    setSwappedToBackup(false);
    setCountdownRunning(false);
    setScreen('setup');
    showToast('Current night reset. Ready for a fresh setup.');
  };

  const handleWipeNightLog = () => {
    const nextState = { tasteProfile: {}, patience: 0.65, nightLog: [] };
    setPersisted(nextState);
    savePersistedState(nextState);
    setConfirmClearModal(false);
    showToast('Night Log and taste profile cleared.');
  };

  // Compute timeline for Night Plan
  const timeline = activePlayingFilm
    ? buildNightTimeline(
        activePlayingFilm,
        useDoubleFeature && !swappedToBackup ? doubleFeatureFilm : null
      )
    : null;

  // Dock items (Plan | Log | Reset)
  const dockItems = [
    {
      label: 'Tonight’s Plan',
      icon: <span className="dock-emoji">🎬</span>,
      active: ['landing', 'setup', 'hotseat', 'shortlist', 'reveal', 'plan'].includes(screen),
      onClick: () => {
        if (chosenFilm) setScreen('plan');
        else setScreen('setup');
      }
    },
    {
      label: 'Night Log',
      icon: <span className="dock-emoji">📓</span>,
      badge: nightLog.length || undefined,
      active: screen === 'log',
      onClick: () => setScreen('log')
    },
    {
      label: 'Reset Night',
      icon: <span className="dock-emoji">↺</span>,
      active: false,
      onClick: () => handleResetTonight()
    }
  ];

  // Top sorted genre affinities for Night Log summary
  const topGenres = Object.entries(tasteProfile)
    .filter(([, w]) => w !== 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <ClickSpark
      sparkColor={[activeMoodObj.beamColor, '#ffffff', activeMoodObj.accentColor]}
      sparkSize={12}
      sparkRadius={26}
      sparkCount={10}
      className="ld-spark-root"
    >
      <div
        className="ld-booth-shell"
        style={{
          '--beam-color': activeMoodObj.beamColor,
          '--accent-color': activeMoodObj.accentColor
        }}
      >
        {/* Desktop Viewfinder Target Cursor */}
        <TargetCursor
          targetSelector="button, .cursor-target, [role='radio']"
          cursorColor={activeMoodObj.beamColor}
          hideDefaultCursor={false}
          size={34}
          showLabel={false}
        />

        {/* Projector Beam Background (WebGL LightRays or mobile/reduced-motion CSS fallback) */}
        <div className="ld-projector-backdrop" aria-hidden="true">
          {!useStaticBg ? (
            <Suspense fallback={<div className="ld-static-beam-fallback" />}>
              <LazyLightRays
                raysOrigin="top-center"
                raysColor={activeMoodObj.beamColor}
                raysSpeed={0.7}
                lightSpread={0.55}
                rayLength={2.6}
                rayDensity={1.1}
                glow={0.65}
                haze={0.3}
                opacity={0.72}
              />
            </Suspense>
          ) : (
            <div className="ld-static-beam-fallback" />
          )}

          {/* Grainient mesh exclusively on Night Plan screen */}
          {screen === 'plan' && (
            <Grainient colorA={activeMoodObj.beamColor} colorB={activeMoodObj.accentColor} />
          )}
        </div>

        {/* 35mm Film Grain Overlay (React Bits Noise) */}
        <Noise
          opacity={0.09}
          fps={18}
          blendMode="overlay"
          dust={0.15}
          scratches={0.05}
          fixed
          zIndex={2}
        />

        {/* Top Projection Booth Status Bar */}
        <header className="ld-topbar">
          <button
            type="button"
            className="ld-brand-mark cursor-target"
            onClick={() => setScreen('landing')}
          >
            <span className="ld-projector-dot" />
            <span className="ld-brand-title">LIGHTS DOWN</span>
            <span className="ld-brand-tag">BOOTH // 90s TO PLAY</span>
          </button>

          <div className="ld-topbar-right">
            <span className="ld-vibe-indicator">
              {activeMoodObj.emoji} {activeMoodObj.label.toUpperCase()} BEAM
            </span>
            <span className="ld-patience-pill" title="Patience index adjusts how heavily fast hooks are weighted">
              ⚡ HOOK PATIENCE: {Math.round(patience * 100)}%
            </span>
          </div>
        </header>

        {/* Live Toast Banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              className="ld-toast-banner"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              role="status"
              aria-live="polite"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN STAGE SCREENS */}
        <main className="ld-stage">
          {/* ============================================================
              SCREEN 0: LANDING ("TONIGHT'S PROGRAMME")
          ============================================================ */}
          {screen === 'landing' && (
            <motion.section
              className="ld-screen ld-landing-screen"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="ld-landing-kicker">
                <span>PROJECTION BOOTH READY // Aaj ki raat ka plan</span>
              </div>

              <h1 className="ld-hero-headline">
                <SplitFlapText
                  text="TONIGHT'S PROGRAMME"
                  accentColor={activeMoodObj.beamColor}
                />
              </h1>

              <div className="ld-hero-sub-wrap">
                <ShinyText
                  text="Stop scrolling for 40 minutes only to bail 20 minutes in. From 'I don't know' to 'lights down, film playing' in under 90 seconds—with a pre-loaded Plan B."
                  color="#c8c8d4"
                  shineColor="#ffffff"
                  speed={3}
                  className="ld-hero-shiny"
                />
              </div>

              <div className="ld-sop-badges">
                <div className="ld-sop-pill">
                  <strong>🛡️ 20-MIN BACKUP REEL</strong>
                  <span>Bakwaas nikli? Instant Plan B ready.</span>
                </div>
                <div className="ld-sop-pill">
                  <strong>🔋 BRAIN BATTERY FIT</strong>
                  <span>Match your actual focus level (1–5).</span>
                </div>
                <div className="ld-sop-pill">
                  <strong>🎟️ RULE OF 3 + VETO</strong>
                  <span>Zero paradox of choice. Tear stub to commit.</span>
                </div>
              </div>

              <div className="ld-landing-cta-row">
                <button
                  type="button"
                  className="ld-primary-cta cursor-target"
                  onClick={() => {
                    setSetupStep(1);
                    setScreen('setup');
                  }}
                >
                  <span>START THE NIGHT</span>
                  <span className="ld-cta-arrow">→</span>
                </button>

                {chosenFilm && (
                  <button
                    type="button"
                    className="ld-secondary-cta cursor-target"
                    onClick={() => setScreen('plan')}
                  >
                    RESUME ACTIVE PLAN ({chosenFilm.title})
                  </button>
                )}
              </div>
            </motion.section>
          )}

          {/* ============================================================
              SCREEN 1: 4-STEP SETUP (Vibe -> Brain Battery -> Time -> Crew)
          ============================================================ */}
          {screen === 'setup' && (
            <section className="ld-screen ld-setup-screen" aria-label="Setup tonight's screening">
              <div className="ld-section-header">
                <span className="ld-eyebrow">STEP {setupStep} OF 4 // CALIBRATE THE BOOTH</span>
                <h2 className="ld-section-title">Dial In Tonight&apos;s Screening</h2>
              </div>

              <Stepper
                step={setupStep}
                onStepChange={(s) => setSetupStep(s)}
                onFinalStepCompleted={handleFinishSetup}
                accentColor={activeMoodObj.beamColor}
                backButtonText="← Back"
                nextButtonText="Next Step"
                completeButtonText={crewCount > 1 ? 'Start Hot Seat Rounds' : 'Deal Rule of 3'}
                width="100%"
                className="ld-stepper-box"
              >
                {/* STEP 1: VIBE (Option Wheel) */}
                <Step title="Vibe">
                  <div className="ld-step-inner">
                    <h3 className="ld-step-question">
                      1. Aaj ka mood kya bolta hai? <small>(Tints the booth beam)</small>
                    </h3>
                    <OptionWheel options={MOODS} value={mood} onChange={setMood} />
                  </div>
                </Step>

                {/* STEP 2: BRAIN BATTERY (Elastic Slider) */}
                <Step title="Brain Battery">
                  <div className="ld-step-inner">
                    <h3 className="ld-step-question">
                      2. Dimaag ki battery kitni bachi hai?
                    </h3>
                    <p className="ld-step-helper">
                      Low battery automatically boosts fast-hook comfort films and filters out dense puzzle-boxes.
                    </p>

                    <div className="ld-slider-box">
                      <ElasticSlider
                        value={brainBattery}
                        startingValue={1}
                        maxValue={5}
                        isStepped
                        stepSize={1}
                        ticks
                        thumb
                        onChange={(val) => setBrainBattery(Math.round(val))}
                        leftIcon={<span className="ld-slider-emoji">😴</span>}
                        rightIcon={<span className="ld-slider-emoji">🧠</span>}
                        formatValue={(v) => `Battery Level ${v} / 5`}
                        accentColor={activeMoodObj.beamColor}
                      />
                    </div>

                    <div className="ld-battery-cards">
                      {BRAIN_BATTERY_LEVELS.map((b) => (
                        <button
                          key={b.level}
                          type="button"
                          className={`ld-battery-chip ${brainBattery === b.level ? 'is-selected' : ''}`}
                          onClick={() => setBrainBattery(b.level)}
                        >
                          <strong>{b.label}</strong>
                          <span>{b.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </Step>

                {/* STEP 3: TIME BUDGET (Elastic Slider + Back-solved preview) */}
                <Step title="Time Fit">
                  <div className="ld-step-inner">
                    <h3 className="ld-step-question">
                      3. Kitna time hai sone se pehle?
                    </h3>
                    <p className="ld-step-helper">
                      We add 10 minutes for snacks &amp; settling in, then back-solve your exact &ldquo;Lights Out&rdquo; time.
                    </p>

                    <div className="ld-slider-box">
                      <ElasticSlider
                        value={timeBudget}
                        startingValue={90}
                        maxValue={240}
                        isStepped
                        stepSize={15}
                        ticks
                        thumb
                        onChange={(val) => setTimeBudget(Math.round(val))}
                        leftIcon={<span className="ld-slider-emoji">⏱️</span>}
                        rightIcon={<span className="ld-slider-emoji">🌙</span>}
                        formatValue={(v) => `${v} mins (${(v / 60).toFixed(1)} hrs)`}
                        accentColor={activeMoodObj.beamColor}
                      />
                    </div>

                    <div className="ld-time-presets">
                      {[
                        { mins: 105, label: 'Quick Night (1h 45m)' },
                        { mins: 135, label: 'Standard Feature (2h 15m)' },
                        { mins: 165, label: 'Epic Cut (2h 45m)' },
                        { mins: 220, label: 'Double Feature Night (3h 40m)' }
                      ].map((preset) => (
                        <button
                          key={preset.mins}
                          type="button"
                          className={`ld-preset-btn ${timeBudget === preset.mins ? 'is-selected' : ''}`}
                          onClick={() => setTimeBudget(preset.mins)}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {timeBudget >= 200 && (
                      <div className="ld-double-feature-notice">
                        🎟️ <strong>Double Feature Unlocked!</strong> With {timeBudget} mins, we&apos;ll also curate a second reel + a 10-minute intermission.
                      </div>
                    )}
                  </div>
                </Step>

                {/* STEP 4: CREW (Jelly Radio + Player Count) */}
                <Step title="Crew">
                  <div className="ld-step-inner">
                    <h3 className="ld-step-question">
                      4. Kaun-kaun dekh raha hai?
                    </h3>
                    <p className="ld-step-helper">
                      Groups of 2–4 unlock pass-the-phone <strong>Hot Seat</strong> rounds with Least-Misery scoring and Veto Tokens.
                    </p>

                    <JellyRadio
                      options={CREW_OPTIONS}
                      value={crewType}
                      onChange={handleCrewTypeChange}
                    />

                    {crewType !== 'solo' && (
                      <div className="ld-crew-count-selector">
                        <span>NUMBER OF PLAYERS ON THIS PHONE:</span>
                        <div className="ld-crew-count-pills">
                          {[2, 3, 4].map((num) => (
                            <button
                              key={num}
                              type="button"
                              className={`ld-count-pill ${crewCount === num ? 'is-selected' : ''}`}
                              onClick={() => setCrewCount(num)}
                            >
                              {num} Players
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Step>
              </Stepper>
            </section>
          )}

          {/* ============================================================
              SCREEN 2: GROUP HOT SEAT (Pass-the-phone private rounds)
          ============================================================ */}
          {screen === 'hotseat' && (
            <section className="ld-screen ld-hotseat-screen" aria-label="Group Hot Seat voting">
              {hotSeatInterstitial ? (
                <motion.div
                  key={`interstitial-${hotSeatPlayerIndex}`}
                  className="ld-hotseat-interstitial"
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <span className="ld-eyebrow">PRIVATE VOTING // NO PEEKING</span>
                  <h2 className="ld-hotseat-title">
                    Pass the phone to <span className="ld-accent-text">Player {hotSeatPlayerIndex + 1}</span>
                  </h2>
                  <p className="ld-hotseat-sub">
                    Previous choices are hidden. We score the crew using <strong>Least-Misery</strong> (nobody being miserable beats one person being hyped).
                  </p>
                  <button
                    type="button"
                    className="ld-primary-cta"
                    onClick={() => setHotSeatInterstitial(false)}
                  >
                    I AM PLAYER {hotSeatPlayerIndex + 1} — SHOW MY 5 CARDS →
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key={`vote-${hotSeatPlayerIndex}-${hotSeatCardIdx}`}
                  className="ld-hotseat-card-box"
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                >
                  <div className="ld-hotseat-top">
                    <span>PLAYER {hotSeatPlayerIndex + 1} OF {crewCount}</span>
                    <span>CARD {hotSeatCardIdx + 1} / {hotSeatPool.length}</span>
                  </div>

                  {hotSeatPool[hotSeatCardIdx] && (
                    <div
                      className="ld-hotseat-film-card"
                      style={{
                        '--c1': hotSeatPool[hotSeatCardIdx].gradient[0],
                        '--c2': hotSeatPool[hotSeatCardIdx].gradient[1]
                      }}
                    >
                      <div className="ld-hotseat-film-meta">
                        <span>{hotSeatPool[hotSeatCardIdx].language} • {hotSeatPool[hotSeatCardIdx].runtime}m</span>
                        <span>⚡ {hotSeatPool[hotSeatCardIdx].hookMinutes}m hook</span>
                        <span>🔋 Battery {hotSeatPool[hotSeatCardIdx].brainBattery}/5</span>
                      </div>
                      <h3>{hotSeatPool[hotSeatCardIdx].title} ({hotSeatPool[hotSeatCardIdx].year})</h3>
                      <p>&ldquo;{hotSeatPool[hotSeatCardIdx].desc}&rdquo;</p>
                      <div className="ld-hotseat-genres">
                        {hotSeatPool[hotSeatCardIdx].genres.map((g) => (
                          <span key={g} className="ld-genre-tag">{g}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="ld-hotseat-actions">
                    <button
                      type="button"
                      className="ld-veto-btn"
                      onClick={() => handleHotSeatVote('no')}
                    >
                      👎 NAH / MEH
                    </button>
                    <button
                      type="button"
                      className="ld-yes-btn"
                      onClick={() => handleHotSeatVote('yes')}
                    >
                      👍 DOWN FOR THIS
                    </button>
                  </div>
                </motion.div>
              )}
            </section>
          )}

          {/* ============================================================
              SCREEN 3: RULE OF 3 SHORTLIST (Stack + GlareHover + Veto Tokens + PulseHeart)
          ============================================================ */}
          {screen === 'shortlist' && (
            <section className="ld-screen ld-shortlist-screen" aria-label="Rule of 3 Shortlist">
              <div className="ld-shortlist-header">
                <div>
                  <span className="ld-eyebrow">
                    RULE OF 3 SHORTLIST // {crewCount > 1 ? 'LEAST-MISERY GROUP CONSENSUS' : 'GENRE-DIVERSIFIED TOP 3'}
                  </span>
                  <h2 className="ld-section-title">Three Reels. Zero Analysis Paralysis.</h2>
                </div>

                {/* Veto / Reroll Token Bank */}
                <div className="ld-token-bank">
                  {crewCount === 1 ? (
                    <span className="ld-token-pill">
                      🎲 SOLO REROLL TOKENS: <strong>{soloRerollsLeft}</strong> LEFT
                    </span>
                  ) : (
                    playerVetoTokens.map((hasToken, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={!hasToken}
                        className={`ld-player-veto-chip ${hasToken ? 'is-ready' : 'is-spent'}`}
                        onClick={() => handleVetoCurrentCard(idx)}
                        title={hasToken ? `Click to spend Player ${idx + 1}'s Veto on active card` : 'Veto spent'}
                      >
                        P{idx + 1} VETO {hasToken ? '🪙' : '✕'}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* 3 Diversified Cards with React Bits GlareHover + Stack preview */}
              <div className="ld-shortlist-layout">
                <div className="ld-rule-of-3-grid">
                  {shortlist.map((film, idx) => {
                    const isFocused = idx === activeShortlistIdx;
                    const [c1, c2] = film.gradient || ['#FF2A85', '#4B0082'];
                    return (
                      <GlareHover
                        key={film.id}
                        borderRadius="18px"
                        glareOpacity={0.35}
                        className={`ld-shortlist-glare-wrap ${isFocused ? 'is-focused' : ''}`}
                      >
                        <article
                          className={`ld-shortlist-card ${isFocused ? 'is-focused' : ''}`}
                          onClick={() => setActiveShortlistIdx(idx)}
                          style={{ '--card-c1': c1, '--card-c2': c2 }}
                        >
                          <div className="ld-card-ribbon">
                            <span className="ld-slot-num">REEL 0{idx + 1} // {film.primaryGenre.toUpperCase()}</span>
                            <span className="ld-match-badge">{film.matchScore}% FIT</span>
                          </div>

                          <div className="ld-card-gradient-banner">
                            <span className="ld-banner-lang">{film.language} • {film.year}</span>
                            <h3 className="ld-banner-title">{film.title}</h3>
                            <div className="ld-banner-metrics">
                              <span>⏱ {film.runtime}m</span>
                              <span>⚡ Hook: {film.hookMinutes}m</span>
                              <span>🔋 Battery: {film.brainBattery}/5</span>
                              <span>★ {film.rating}</span>
                            </div>
                          </div>

                          <p className="ld-card-desc">&ldquo;{film.desc}&rdquo;</p>

                          <div className="ld-card-snack">
                            <span>🍿 {film.snack}</span>
                          </div>

                          <div className="ld-card-actions">
                            <button
                              type="button"
                              className="ld-card-veto-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveShortlistIdx(idx);
                                const pIdx = crewCount === 1 ? 0 : playerVetoTokens.findIndex(Boolean);
                                if (pIdx !== -1) handleVetoCurrentCard(pIdx);
                                else showToast('All veto tokens spent! Pick one of the 3 reels.');
                              }}
                            >
                              ✕ VETO
                            </button>

                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <PulseHeartButton
                                label="THIS ONE"
                                sublabel="Lock reel →"
                                onClick={() => handlePickFromShortlist(film)}
                              />
                            </div>
                          </div>
                        </article>
                      </GlareHover>
                    );
                  })}
                </div>

                {/* React Bits Stack Interactive Deck Preview */}
                {shortlist.length > 0 && (
                  <div className="ld-stack-sidebar">
                    <span className="ld-stack-label">TACTILE REEL STACK (FLICK TO CYCLE)</span>
                    <div className="ld-stack-holder">
                      <Stack
                        layout="fan"
                        spread={0.55}
                        depth={0.45}
                        sendToBackOnClick
                        cards={shortlist.map((film, i) => (
                          <div
                            key={film.id}
                            className="ld-mini-stack-card"
                            style={{
                              background: `linear-gradient(135deg, ${film.gradient[0]}, ${film.gradient[1]})`
                            }}
                          >
                            <span className="ld-mini-kicker">0{i + 1} // {film.genres[0]}</span>
                            <strong>{film.title}</strong>
                            <small>{film.runtime}m • Hook in {film.hookMinutes}m</small>
                          </div>
                        ))}
                      />
                    </div>
                    <p className="ld-keyboard-tip">
                      Keyboard: <kbd>←</kbd> Veto active card • <kbd>→</kbd> Lock active reel
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ============================================================
              SCREEN 4: REVEAL + COMMIT RITUAL (DecryptedText + HoloCard + TearTicket)
          ============================================================ */}
          {screen === 'reveal' && chosenFilm && (
            <motion.section
              className="ld-screen ld-reveal-screen"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="ld-section-header">
                <span className="ld-eyebrow">LOCKED SELECTION // COMMIT RITUAL</span>
                <h2 className="ld-decrypted-headline">
                  <DecryptedText
                    text={chosenFilm.title.toUpperCase()}
                    animateOn="view"
                    speed={40}
                    maxIterations={12}
                    sequential
                  />
                </h2>
              </div>

              <div className="ld-reveal-grid">
                <HoloCard film={chosenFilm} backupFilm={backupFilm} />

                <div className="ld-commit-column">
                  <div className="ld-commit-explainer">
                    <h3>Make It Official</h3>
                    <p>
                      No more second-guessing or opening another tab. Tear the ticket stub below to dim the booth lights and start your 90-second settling countdown.
                    </p>
                    {backupFilm && (
                      <div className="ld-backup-assurance">
                        <strong>🛡️ 20-Minute Rule Active:</strong> If <em>{chosenFilm.title}</em> doesn&apos;t grab you in 20 minutes, <strong>{backupFilm.title}</strong> ({backupFilm.runtime}m, {backupFilm.hookMinutes}m hook) is pre-loaded on standby.
                      </div>
                    )}
                  </div>

                  <TearTicket film={chosenFilm} onCommit={handleCommitTicket} />

                  <button
                    type="button"
                    className="ld-back-link"
                    onClick={() => setScreen('shortlist')}
                  >
                    ← Wait, take me back to the 3-card shortlist
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {/* ============================================================
              SCREEN 5: NIGHT PLAN (SpotlightCard + Counter + SplitFlap + SlideCommit)
          ============================================================ */}
          {screen === 'plan' && activePlayingFilm && timeline && (
            <section className="ld-screen ld-plan-screen" aria-label="Tonight's screening plan">
              {/* Countdown Banner (aria-live) */}
              <div className="ld-countdown-banner" aria-live="polite">
                <div className="ld-countdown-left">
                  <span className="ld-eyebrow">COMMITTED // LIGHTS DOWN COUNTDOWN</span>
                  <h3>
                    {countdownSeconds > 0
                      ? 'Grab your snacks & silence phones — reel starts in:'
                      : 'LIGHTS ARE DOWN // FEATURE IS ROLLING 🎬'}
                  </h3>
                </div>
                <div className="ld-countdown-digits">
                  <Counter
                    value={countdownSeconds}
                    fontSize={38}
                    suffix="s"
                    textColor={activeMoodObj.beamColor}
                    fontWeight={800}
                  />
                </div>
              </div>

              {/* 3 Spotlight Cards: Tonight's Pick | Backup Reel (20-Min Rule) | Night Timeline */}
              <div className="ld-plan-grid">
                {/* CARD 1: ACTIVE PICK */}
                <SpotlightCard
                  spotlightColor={activeMoodObj.beamColor}
                  intensity={0.22}
                  className="ld-plan-spotlight"
                >
                  <div className="ld-plan-card-inner">
                    <div className="ld-plan-badge-row">
                      <span className="ld-pill-primary">
                        {swappedToBackup ? '⚡ NOW PLAYING (BACKUP REEL)' : '🎬 FEATURE PRESENTATION'}
                      </span>
                      <span>★ {activePlayingFilm.rating}</span>
                    </div>

                    <h3 className="ld-plan-film-title">{activePlayingFilm.title}</h3>
                    <p className="ld-plan-film-sub">
                      {activePlayingFilm.year} • {activePlayingFilm.language} • {activePlayingFilm.runtime} min • {activePlayingFilm.genres.join(' / ')}
                    </p>
                    <p className="ld-plan-film-desc">&ldquo;{activePlayingFilm.desc}&rdquo;</p>

                    <div className="ld-plan-stats-grid">
                      <div>
                        <small>HOOK SPEED</small>
                        <strong>Grabs you in {activePlayingFilm.hookMinutes}m</strong>
                      </div>
                      <div>
                        <small>BRAIN BATTERY</small>
                        <strong>Level {activePlayingFilm.brainBattery} / 5</strong>
                      </div>
                    </div>

                    <div className="ld-snack-callout">
                      <span>🍿 TONIGHT&apos;S SNACK PAIRING</span>
                      <strong>{activePlayingFilm.snack}</strong>
                    </div>
                  </div>
                </SpotlightCard>

                {/* CARD 2: BACKUP REEL (THE 20-MINUTE RULE) */}
                <SpotlightCard
                  spotlightColor="#00F5D4"
                  intensity={0.22}
                  className="ld-plan-spotlight"
                >
                  <div className="ld-plan-card-inner">
                    <div className="ld-plan-badge-row">
                      <span className="ld-pill-backup">🛡️ BACKUP REEL // 20-MINUTE RULE</span>
                      <span>SHORTER &amp; FASTER HOOK</span>
                    </div>

                    {backupFilm ? (
                      <>
                        <h3 className="ld-plan-film-title">{backupFilm.title}</h3>
                        <p className="ld-plan-film-sub">
                          {backupFilm.year} • {backupFilm.runtime} min • Hook in {backupFilm.hookMinutes}m • Battery {backupFilm.brainBattery}/5
                        </p>
                        <p className="ld-plan-film-desc">
                          Bakwaas nikli? Give the main pick until <strong>{timeline.bailCheckFormatted}</strong> (20 mins). If it&apos;s not clicking, slide below to swap immediately with zero guilt.
                        </p>

                        <div className="ld-backup-comparison">
                          <span>⚡ {Math.max(0, chosenFilm.runtime - backupFilm.runtime)}m shorter</span>
                          <span>🎯 {backupFilm.genres[0]} pivot</span>
                          <span>🍿 {backupFilm.snack}</span>
                        </div>

                        <SlideCommit
                          disabled={swappedToBackup}
                          onConfirm={handleBailToBackup}
                        />
                      </>
                    ) : (
                      <p>Backup reel ready.</p>
                    )}
                  </div>
                </SpotlightCard>

                {/* CARD 3: TIME-FIT & LIGHTS OUT SCHEDULE */}
                <SpotlightCard
                  spotlightColor="#A855F7"
                  intensity={0.22}
                  className="ld-plan-spotlight"
                >
                  <div className="ld-plan-card-inner">
                    <div className="ld-plan-badge-row">
                      <span className="ld-pill-timeline">⏱️ BACK-SOLVED TIMELINE</span>
                      <span>{timeline.totalRuntimeMinutes} MIN TOTAL</span>
                    </div>

                    <div className="ld-lights-out-box">
                      <small>LIGHTS OUT BY</small>
                      <div className="ld-lights-out-flap">
                        <SplitFlapText
                          text={timeline.lightsOutFormatted}
                          accentColor={activeMoodObj.beamColor}
                        />
                      </div>
                    </div>

                    <ul className="ld-timeline-steps">
                      <li>
                        <span>🍿 Snack &amp; Settle (+10m)</span>
                        <strong>Now → {timeline.startFormatted}</strong>
                      </li>
                      <li>
                        <span>🎬 Reel Starts</span>
                        <strong>{timeline.startFormatted}</strong>
                      </li>
                      <li>
                        <span>🛡️ 20-Minute Bail Check</span>
                        <strong>{timeline.bailCheckFormatted}</strong>
                      </li>
                      {useDoubleFeature && doubleFeatureFilm && !swappedToBackup && (
                        <>
                          <li>
                            <span>☕ 10-Min Intermission</span>
                            <strong>{timeline.firstFilmEndFormatted} → {timeline.intermissionEndFormatted}</strong>
                          </li>
                          <li>
                            <span>🎞️ 2nd Feature: {doubleFeatureFilm.title}</span>
                            <strong>{timeline.intermissionEndFormatted} → {timeline.lightsOutFormatted}</strong>
                          </li>
                        </>
                      )}
                      <li className="ld-timeline-final">
                        <span>🌙 Credits Roll / Lights Out</span>
                        <strong>{timeline.lightsOutFormatted}</strong>
                      </li>
                    </ul>

                    {doubleFeatureFilm && !swappedToBackup && (
                      <button
                        type="button"
                        className={`ld-double-toggle ${useDoubleFeature ? 'is-on' : ''}`}
                        onClick={() => setUseDoubleFeature((v) => !v)}
                      >
                        {useDoubleFeature
                          ? `✓ Double Feature ON (+ ${doubleFeatureFilm.title})`
                          : `+ Add Double Feature: ${doubleFeatureFilm.title} (${doubleFeatureFilm.runtime}m)`}
                      </button>
                    )}

                    <button
                      type="button"
                      className="ld-primary-cta ld-finish-night-btn"
                      onClick={() => setScreen('log')}
                    >
                      MARK OUTCOME IN NIGHT LOG →
                    </button>
                  </div>
                </SpotlightCard>
              </div>
            </section>
          )}

          {/* ============================================================
              SCREEN 6: NIGHT LOG (PeekRating + AnimatedList + SwipeRow + Regret-Aware Taste)
          ============================================================ */}
          {screen === 'log' && (
            <section className="ld-screen ld-log-screen" aria-label="Night Log and Taste Profile">
              <div className="ld-section-header">
                <span className="ld-eyebrow">REGRET-AWARE LEARNING // NIGHT LOG</span>
                <h2 className="ld-section-title">How Did Tonight&apos;s Screening Go?</h2>
              </div>

              <div className="ld-log-grid">
                {/* Outcome Prompt Card */}
                <form className="ld-log-prompt-card" onSubmit={handleLogTonight}>
                  <span className="ld-eyebrow">LOG TONIGHT&apos;S REEL</span>
                  <h3>
                    {activePlayingFilm ? activePlayingFilm.title : `${MOVIES[0].title} (Sample)`}
                  </h3>

                  <div className="ld-outcome-buttons" role="radiogroup" aria-label="Screening outcome">
                    {[
                      { id: 'loved', label: '❤️ LOVED IT', desc: '+2 genre affinity, boosts patience' },
                      { id: 'finished', label: '✅ FINISHED', desc: '+1 genre affinity, steady patience' },
                      { id: 'bailed', label: '🏃 BAILED', desc: '-2 genre penalty, speeds up future hooks' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`ld-outcome-choice ${logOutcome === opt.id ? 'is-selected' : ''}`}
                        onClick={() => setLogOutcome(opt.id)}
                      >
                        <strong>{opt.label}</strong>
                        <small>{opt.desc}</small>
                      </button>
                    ))}
                  </div>

                  {logOutcome === 'loved' && (
                    <div className="ld-log-extra-box">
                      <span>PEEK RATING:</span>
                      <PeekRating value={logStars} onChange={setLogStars} />
                    </div>
                  )}

                  {logOutcome === 'bailed' && (
                    <label className="ld-bail-checkbox">
                      <input
                        type="checkbox"
                        checked={logBailedEarly}
                        onChange={(e) => setLogBailedEarly(e.target.checked)}
                      />
                      <span>Bailed within the first 20 minutes (lowers future hook patience score)</span>
                    </label>
                  )}

                  <button type="submit" className="ld-primary-cta">
                    SAVE TO NIGHT LOG &amp; UPDATE ENGINE
                  </button>
                </form>

                {/* Regret-Aware Taste Profile & History */}
                <div className="ld-log-history-column">
                  <div className="ld-taste-summary-card">
                    <div className="ld-taste-header">
                      <div>
                        <span className="ld-eyebrow">ADAPTIVE TASTE ENGINE</span>
                        <h4>Patience &amp; Genre Weights</h4>
                      </div>
                      {nightLog.length > 0 && (
                        <button
                          type="button"
                          className="ld-wipe-btn"
                          onClick={() => setConfirmClearModal(true)}
                        >
                          Clear Log
                        </button>
                      )}
                    </div>

                    <div className="ld-patience-meter">
                      <span>Hook Patience Score: <strong>{Math.round(patience * 100)}%</strong></span>
                      <div className="ld-meter-bar">
                        <div
                          className="ld-meter-fill"
                          style={{ width: `${Math.round(patience * 100)}%` }}
                        />
                      </div>
                      <small>
                        {patience < 0.5
                          ? 'Impatient mode active: heavily prioritizing <8m hooks.'
                          : 'Balanced mode: allowing slow-burn masterpieces.'}
                      </small>
                    </div>

                    <div className="ld-genre-affinities">
                      {topGenres.length === 0 ? (
                        <span className="ld-muted-note">No genre biases recorded yet. Log a film to train!</span>
                      ) : (
                        topGenres.map(([genre, weight]) => (
                          <span
                            key={genre}
                            className={`ld-affinity-chip ${weight > 0 ? 'is-positive' : 'is-negative'}`}
                          >
                            {genre}: {weight > 0 ? `+${weight}` : weight}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* History List (AnimatedList + SwipeRow) */}
                  <div className="ld-history-list-box">
                    <div className="ld-history-head">
                      <span>SCREENING ARCHIVE ({nightLog.length})</span>
                      <small>Swipe row left or tap ✕ to delete</small>
                    </div>

                    {nightLog.length === 0 ? (
                      <div className="ld-empty-log">
                        <p>No nights logged yet. Start a night and log whether you Finished, Bailed, or Loved it!</p>
                      </div>
                    ) : (
                      <AnimatedList
                        items={nightLog}
                        height={310}
                        showGradients={false}
                        renderItem={(entry) => (
                          <SwipeRow
                            key={entry.id}
                            entry={entry}
                            onDelete={handleDeleteLogEntry}
                          />
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Confirm Clear Night Log Modal */}
        <AnimatePresence>
          {confirmClearModal && (
            <motion.div
              className="ld-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="ld-modal-card" role="dialog" aria-modal="true">
                <h3>Wipe Entire Night Log &amp; Taste Profile?</h3>
                <p>
                  This will reset your learned genre weights, bail history, and hook patience score back to factory defaults.
                </p>
                <div className="ld-modal-actions">
                  <button
                    type="button"
                    className="ld-secondary-cta"
                    onClick={() => setConfirmClearModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="ld-danger-cta"
                    onClick={handleWipeNightLog}
                  >
                    Yes, Wipe History
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Persistent Bottom Navigation Dock (Plan | Log | Reset) */}
        <footer className="ld-dock-footer">
          <Dock
            items={dockItems}
            theme="dark"
            magnification={58}
            baseItemSize={46}
            panelHeight={60}
            showLabels
          />
        </footer>
      </div>
    </ClickSpark>
  );
}
