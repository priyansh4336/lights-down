import React from 'react';
import { MOODS, BRAIN_BATTERY_LEVELS, CREW_OPTIONS } from '../data/movies';
import Stepper, { Step } from '../components/Stepper';
import ElasticSlider from '../components/ElasticSlider';
import { OptionWheel, JellyRadio } from '../components/SetupControls';

export default function Setup({
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
  onFinishSetup
}) {
  return (
    <section className="ld-screen ld-setup-screen" aria-label="Setup tonight's screening">
      <div className="ld-section-header">
        <span className="ld-eyebrow">STEP {setupStep} OF 4 // CALIBRATE THE BOOTH</span>
        <h2 className="ld-section-title">Dial In Tonight&apos;s Screening</h2>
      </div>

      <Stepper
        step={setupStep}
        onStepChange={(s) => setSetupStep(s)}
        onFinalStepCompleted={onFinishSetup}
        accentColor={activeMoodObj.beamColor}
        backButtonText="← Back"
        nextButtonText="Next Step"
        completeButtonText={crewCount > 1 ? 'Start Hot Seat Rounds' : 'Deal Rule of 3'}
        width="100%"
        className="ld-stepper-box"
      >
        <Step title="Vibe">
          <div className="ld-step-inner">
            <h3 className="ld-step-question">
              1. Aaj ka mood kya bolta hai? <small>(Tints the booth beam)</small>
            </h3>
            <OptionWheel options={MOODS} value={mood} onChange={setMood} />
          </div>
        </Step>

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
  );
}
