import React from 'react';
import Counter from '../components/Counter';
import SpotlightCard from '../components/SpotlightCard';

export default function BoothStats({
  boothStats,
  activeMoodObj,
  onExportCsv,
  onRequestClearAll,
  onGoToLog
}) {
  const {
    hasData,
    totalNights,
    avgTimeToDecideSeconds,
    bailRatePercent,
    backupSavedCount,
    patiencePercent,
    decideHistory = [],
    regretInsights = []
  } = boothStats || {};

  // Build SVG sparkline points from real decideHistory
  const buildSparkline = () => {
    if (!decideHistory || decideHistory.length === 0) return null;
    const width = 460;
    const height = 96;
    const pad = 16;
    const values = decideHistory.map((d) => d.seconds || 60);
    const maxVal = Math.max(90, ...values);
    const minVal = Math.min(5, ...values);
    const span = Math.max(1, maxVal - minVal);

    const pts = decideHistory.map((d, i) => {
      const x =
        decideHistory.length === 1
          ? width / 2
          : pad + (i / (decideHistory.length - 1)) * (width - pad * 2);
      const y = height - pad - ((d.seconds - minVal) / span) * (height - pad * 2);
      return { x, y, ...d };
    });

    const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="ld-sparkline-svg"
        role="img"
        aria-label="Time to decide in seconds across logged nights"
      >
        <line
          x1={pad}
          y1={height / 2}
          x2={width - pad}
          y2={height / 2}
          stroke="rgba(255,255,255,0.12)"
          strokeDasharray="4 4"
        />
        {pts.length > 1 && (
          <polyline
            fill="none"
            stroke={activeMoodObj?.beamColor || '#FFB347'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polyline}
          />
        )}
        {pts.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill={p.outcome === 'bailed' ? '#EF4444' : activeMoodObj?.beamColor || '#FFB347'}
            />
            <title>{`Night #${p.index}: ${p.title} (${p.seconds}s to decide, ${p.outcome})`}</title>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <section className="ld-screen ld-stats-screen" aria-label="Booth Stats and Regret Report">
      <div className="ld-shortlist-header">
        <div>
          <span className="ld-eyebrow">TELEMETRY // PROVABLE SOP METRICS</span>
          <h2 className="ld-section-title">Booth Stats &amp; Regret Report</h2>
        </div>

        <div className="ld-stats-top-actions">
          <button
            type="button"
            className="ld-secondary-cta"
            onClick={onExportCsv}
          >
            ⬇ Export my data (CSV)
          </button>
          <button
            type="button"
            className="ld-danger-cta"
            onClick={onRequestClearAll}
          >
            🗑 Reset all data
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="ld-empty-stats-card">
          <span className="ld-eyebrow">NO TELEMETRY RECORDED YET</span>
          <h3>Log a few nights to unlock your stats.</h3>
          <p>
            Lights Down never displays fake numbers. Complete a screening or log an outcome in the Night Log to track your real decision speed, bail rate, and Backup Reel rescues.
          </p>
          {onGoToLog && (
            <button type="button" className="ld-primary-cta" onClick={onGoToLog}>
              OPEN NIGHT LOG →
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="ld-stats-kpi-grid">
            <SpotlightCard spotlightColor={activeMoodObj?.beamColor || '#FFB347'} className="ld-stat-card">
              <small className="ld-stat-label">AVG TIME TO DECIDE</small>
              <div className="ld-stat-counter">
                <Counter
                  value={avgTimeToDecideSeconds}
                  fontSize={36}
                  suffix="s"
                  textColor={activeMoodObj?.beamColor || '#FFB347'}
                  fontWeight={800}
                />
              </div>
              <span className="ld-stat-sub">Target: &lt; 90s from start to ticket tear</span>
            </SpotlightCard>

            <SpotlightCard spotlightColor="#EF4444" className="ld-stat-card">
              <small className="ld-stat-label">BAIL RATE</small>
              <div className="ld-stat-counter">
                <Counter
                  value={bailRatePercent}
                  fontSize={36}
                  suffix="%"
                  textColor="#F87171"
                  fontWeight={800}
                />
              </div>
              <span className="ld-stat-sub">Across {totalNights} logged night(s)</span>
            </SpotlightCard>

            <SpotlightCard spotlightColor="#00F5D4" className="ld-stat-card">
              <small className="ld-stat-label">BACKUP REEL SAVES</small>
              <div className="ld-stat-counter">
                <Counter
                  value={backupSavedCount}
                  fontSize={36}
                  textColor="#00F5D4"
                  fontWeight={800}
                />
              </div>
              <span className="ld-stat-sub">Nights rescued by the 20-Minute Rule</span>
            </SpotlightCard>

            <SpotlightCard spotlightColor="#A855F7" className="ld-stat-card">
              <small className="ld-stat-label">HOOK PATIENCE SCORE</small>
              <div className="ld-stat-counter">
                <Counter
                  value={patiencePercent}
                  fontSize={36}
                  suffix="%"
                  textColor="#C084FC"
                  fontWeight={800}
                />
              </div>
              <span className="ld-stat-sub">Learned tolerance for slow-burn openings</span>
            </SpotlightCard>
          </div>

          <div className="ld-stats-bottom-grid">
            <div className="ld-sparkline-card">
              <div className="ld-taste-header">
                <div>
                  <span className="ld-eyebrow">DECISION VELOCITY SPARKLINE</span>
                  <h4>Seconds to Tear Ticket ({decideHistory.length} session{decideHistory.length === 1 ? '' : 's'})</h4>
                </div>
              </div>
              {buildSparkline()}
            </div>

            <div className="ld-regret-report-card">
              <span className="ld-eyebrow">REGRET REPORT // REAL LOG INSIGHTS</span>
              <h4>Behavioral Breakdown</h4>
              {totalNights < 5 ? (
                <p className="ld-muted-note">
                  Log {5 - totalNights} more night(s) ({totalNights}/5 logged) to unlock your automated Regret Report comparing bailed genres and Brain Battery levels.
                </p>
              ) : (
                <ul className="ld-regret-list">
                  {regretInsights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
