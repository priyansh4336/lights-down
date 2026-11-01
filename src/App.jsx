import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNightSession } from './hooks/useNightSession';
import { VisualEffectBoundary } from './components/ErrorBoundary';
import { Grainient } from './components/SplitFlapAndGrainient';
import Dock from './components/Dock';

// Code-split heavy visuals
const LazyLightRays = lazy(() => import('./components/LightRays'));
const LazyNoise = lazy(() => import('./components/Noise'));
const LazyTargetCursor = lazy(() => import('./components/TargetCursor'));
const LazyClickSpark = lazy(() => import('./components/ClickSpark'));

// Code-split screens
const Landing = lazy(() => import('./screens/Landing'));
const Setup = lazy(() => import('./screens/Setup'));
const HotSeat = lazy(() => import('./screens/HotSeat'));
const Shortlist = lazy(() => import('./screens/Shortlist'));
const Commit = lazy(() => import('./screens/Commit'));
const NightPlan = lazy(() => import('./screens/NightPlan'));
const NightLog = lazy(() => import('./screens/NightLog'));
const BoothStats = lazy(() => import('./screens/BoothStats'));

export default function App() {
  const session = useNightSession();
  const {
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
    nowPlayingElapsedSec,
    twentyMinPromptOpen,
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
  } = session;

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
      label: 'Booth Stats',
      icon: <span className="dock-emoji">📊</span>,
      active: screen === 'stats',
      onClick: () => setScreen('stats')
    },
    {
      label: 'Reset Night',
      icon: <span className="dock-emoji">↺</span>,
      active: false,
      onClick: () => handleResetTonight()
    }
  ];

  const boothContent = (
    <div
      className="ld-booth-shell"
      style={{
        '--beam-color': activeMoodObj.beamColor,
        '--accent-color': activeMoodObj.accentColor
      }}
    >
      {!useStaticBg && (
        <VisualEffectBoundary fallback={null}>
          <Suspense fallback={null}>
            <LazyTargetCursor
              targetSelector="button, .cursor-target, [role='radio']"
              cursorColor={activeMoodObj.beamColor}
              hideDefaultCursor={false}
              size={34}
              showLabel={false}
            />
          </Suspense>
        </VisualEffectBoundary>
      )}

      <div className="ld-projector-backdrop" aria-hidden="true">
        <VisualEffectBoundary fallback={<div className="ld-static-beam-fallback" />}>
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
        </VisualEffectBoundary>

        {screen === 'plan' && (
          <VisualEffectBoundary fallback={null}>
            <Grainient colorA={activeMoodObj.beamColor} colorB={activeMoodObj.accentColor} />
          </VisualEffectBoundary>
        )}
      </div>

      <VisualEffectBoundary fallback={null}>
        <Suspense fallback={null}>
          <LazyNoise
            opacity={0.09}
            fps={18}
            blendMode="overlay"
            dust={0.15}
            scratches={0.05}
            fixed
            zIndex={2}
          />
        </Suspense>
      </VisualEffectBoundary>

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

      <main className="ld-stage">
        <Suspense fallback={<div className="ld-screen-loader">Threading 35mm reel...</div>}>
          {screen === 'landing' && (
            <Landing
              activeMoodObj={activeMoodObj}
              chosenFilm={chosenFilm}
              onStartSetup={handleStartSetup}
              onResumePlan={() => setScreen('plan')}
            />
          )}

          {screen === 'setup' && (
            <Setup
              setupStep={setupStep}
              setSetupStep={setSetupStep}
              mood={mood}
              setMood={setMood}
              activeMoodObj={activeMoodObj}
              brainBattery={brainBattery}
              setBrainBattery={setBrainBattery}
              timeBudget={timeBudget}
              setTimeBudget={setTimeBudget}
              crewType={crewType}
              handleCrewTypeChange={handleCrewTypeChange}
              crewCount={crewCount}
              setCrewCount={setCrewCount}
              onFinishSetup={handleFinishSetup}
            />
          )}

          {screen === 'hotseat' && (
            <HotSeat
              hotSeatInterstitial={hotSeatInterstitial}
              setHotSeatInterstitial={setHotSeatInterstitial}
              hotSeatPlayerIndex={hotSeatPlayerIndex}
              crewCount={crewCount}
              hotSeatCardIdx={hotSeatCardIdx}
              hotSeatPool={hotSeatPool}
              onVote={handleHotSeatVote}
            />
          )}

          {screen === 'shortlist' && (
            <Shortlist
              shortlist={shortlist}
              activeShortlistIdx={activeShortlistIdx}
              setActiveShortlistIdx={setActiveShortlistIdx}
              crewCount={crewCount}
              soloRerollsLeft={soloRerollsLeft}
              playerVetoTokens={playerVetoTokens}
              onVeto={handleVetoCurrentCard}
              onPick={handlePickFromShortlist}
              showToast={showToast}
            />
          )}

          {screen === 'reveal' && (
            <Commit
              chosenFilm={chosenFilm}
              backupFilm={backupFilm}
              onCommit={handleCommitTicket}
              onBack={() => setScreen('shortlist')}
            />
          )}

          {screen === 'plan' && (
            <NightPlan
              activePlayingFilm={activePlayingFilm}
              chosenFilm={chosenFilm}
              backupFilm={backupFilm}
              doubleFeatureFilm={doubleFeatureFilm}
              useDoubleFeature={useDoubleFeature}
              setUseDoubleFeature={setUseDoubleFeature}
              swappedToBackup={swappedToBackup}
              timeline={timeline}
              countdownSeconds={countdownSeconds}
              nowPlayingElapsedSec={nowPlayingElapsedSec}
              twentyMinPromptOpen={twentyMinPromptOpen}
              notifPermission={notifPermission}
              onRequestNotificationPermission={handleRequestNotificationPermission}
              onSkipToMinute20Dev={handleSkipToMinute20Dev}
              onKeepAt20Min={handleKeepAt20Min}
              activeMoodObj={activeMoodObj}
              onBailToBackup={handleBailToBackup}
              onOpenLog={() => setScreen('log')}
            />
          )}

          {screen === 'log' && (
            <NightLog
              activePlayingFilm={activePlayingFilm}
              logOutcome={logOutcome}
              setLogOutcome={setLogOutcome}
              logBailedEarly={logBailedEarly}
              setLogBailedEarly={setLogBailedEarly}
              logStars={logStars}
              setLogStars={setLogStars}
              onSubmitLog={handleLogTonight}
              tasteProfile={tasteProfile}
              patience={patience}
              nightLog={nightLog}
              onDeleteEntry={handleDeleteLogEntry}
              onRequestClearAll={() => setConfirmClearModal(true)}
              onExportCsv={handleExportCsv}
              onOpenStats={() => setScreen('stats')}
            />
          )}

          {screen === 'stats' && (
            <BoothStats
              boothStats={boothStats}
              activeMoodObj={activeMoodObj}
              onExportCsv={handleExportCsv}
              onRequestClearAll={() => setConfirmClearModal(true)}
              onGoToLog={() => setScreen('log')}
            />
          )}
        </Suspense>
      </main>

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

      <div className="ld-attribution-footer">
        <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
        <span>Streaming availability data provided by JustWatch via TMDB.</span>
      </div>

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
  );

  if (useStaticBg) {
    return boothContent;
  }

  return (
    <VisualEffectBoundary fallback={boothContent}>
      <Suspense fallback={boothContent}>
        <LazyClickSpark
          sparkColor={[activeMoodObj.beamColor, '#ffffff', activeMoodObj.accentColor]}
          sparkSize={12}
          sparkRadius={26}
          sparkCount={10}
          className="ld-spark-root"
        >
          {boothContent}
        </LazyClickSpark>
      </Suspense>
    </VisualEffectBoundary>
  );
}
