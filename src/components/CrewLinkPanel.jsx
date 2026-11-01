import React, { useState } from 'react';
import { buildCrewLinkUrl, decodeVoteBallot, encodeVoteBallot } from '../utils/crewLink';
import PosterArtwork from './PosterArtwork';

/**
 * Host panel shown on HotSeat & Shortlist for crews of 2–4:
 * - Generates shareable #crew=... link
 * - Accepts comma/newline-separated vote codes from friends and merges them via Least-Misery
 */
export function CrewLinkHostBox({ poolFilms = [], onMergeVotes, showToast }) {
  const [open, setOpen] = useState(false);
  const [codesInput, setCodesInput] = useState('');

  const shareUrl = buildCrewLinkUrl(poolFilms);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      if (showToast) showToast('Crew Link URL copied! Send it to your group chat.');
    } catch {
      if (showToast) showToast(`Copy link: ${shareUrl}`);
    }
  };

  const handleMerge = () => {
    const rawTokens = codesInput
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const decoded = rawTokens
      .map((token, idx) => decodeVoteBallot(token, idx + 2))
      .filter(Boolean);

    if (decoded.length === 0) {
      if (showToast) showToast('Paste at least one valid Crew Link vote code.');
      return;
    }
    onMergeVotes(decoded);
    setCodesInput('');
    setOpen(false);
  };

  return (
    <div className="ld-crewlink-box">
      <div className="ld-crewlink-bar">
        <div>
          <span className="ld-eyebrow">NO-BACKEND REMOTE VOTING // CREW LINK</span>
          <p className="ld-crewlink-sub">
            Same room? Use Pass-the-Phone Hot Seat. Friends on another couch? Send a Crew Link URL &amp; merge their vote codes.
          </p>
        </div>
        <button
          type="button"
          className="ld-secondary-cta ld-tiny-btn"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Hide Crew Link ▲' : '🔗 Open Crew Link (Remote)'}
        </button>
      </div>

      {open && (
        <div className="ld-crewlink-drawer">
          <div className="ld-crewlink-col">
            <label htmlFor="crew-share-url-input" className="ld-stat-label">
              1. SHARE THIS SHORTLIST URL WITH CREW
            </label>
            <div className="ld-crewlink-input-row">
              <input
                id="crew-share-url-input"
                type="text"
                readOnly
                value={shareUrl}
                className="ld-text-input"
              />
              <button type="button" className="ld-secondary-cta" onClick={handleCopyLink}>
                Copy Link
              </button>
            </div>
          </div>

          <div className="ld-crewlink-col">
            <label htmlFor="crew-merge-codes-input" className="ld-stat-label">
              2. MERGE CREW VOTES (PASTE FRIEND VOTE CODES)
            </label>
            <div className="ld-crewlink-input-row">
              <input
                id="crew-merge-codes-input"
                type="text"
                placeholder="Paste base64url code(s) separated by spaces or commas..."
                value={codesInput}
                onChange={(e) => setCodesInput(e.target.value)}
                className="ld-text-input"
              />
              <button type="button" className="ld-primary-cta" onClick={handleMerge}>
                Merge crew votes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Friend remote voting view when opening a #crew=... link
 */
export function CrewLinkRemoteVoter({ films = [], onExitRemoteMode, showToast }) {
  const [idx, setIdx] = useState(0);
  const [likes, setLikes] = useState([]);
  const [passes, setPasses] = useState([]);
  const [vetoes, setVetoes] = useState([]);
  const [finishedCode, setFinishedCode] = useState('');

  const currentFilm = films[idx];

  const recordChoice = (type) => {
    if (!currentFilm) return;
    const nextLikes = type === 'yes' ? [...likes, currentFilm.id] : likes;
    const nextPasses = type === 'no' ? [...passes, currentFilm.id] : passes;
    const nextVetoes = type === 'veto' ? [...vetoes, currentFilm.id] : vetoes;

    setLikes(nextLikes);
    setPasses(nextPasses);
    setVetoes(nextVetoes);

    if (idx + 1 < films.length) {
      setIdx(idx + 1);
    } else {
      const code = encodeVoteBallot({
        likes: nextLikes,
        passes: nextPasses,
        vetoes: nextVetoes
      });
      setFinishedCode(code);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(finishedCode);
      if (showToast) showToast('Vote code copied! Send it back to the host.');
    } catch {
      if (showToast) showToast(`Vote code: ${finishedCode}`);
    }
  };

  return (
    <section className="ld-screen ld-hotseat-screen" aria-label="Crew Link Remote Ballot">
      <div className="ld-hotseat-card-box">
        <div className="ld-hotseat-top">
          <span>🔗 CREW LINK REMOTE BALLOT</span>
          <button type="button" className="ld-back-link" onClick={onExitRemoteMode}>
            ✕ Exit Remote Ballot
          </button>
        </div>

        {finishedCode ? (
          <div className="ld-hotseat-interstitial">
            <span className="ld-eyebrow">BALLOT COMPLETE // SEND TO HOST</span>
            <h3>Your Crew Vote Code is Ready</h3>
            <p>
              Copy this compact code and send it to the host to merge into tonight&apos;s Least-Misery shortlist:
            </p>
            <div className="ld-crewlink-input-row" style={{ width: '100%', justifyContent: 'center' }}>
              <input
                type="text"
                readOnly
                value={finishedCode}
                aria-label="Generated Crew Link vote code"
                className="ld-text-input"
                style={{ textAlign: 'center', fontWeight: 800, letterSpacing: '0.06em' }}
              />
              <button type="button" className="ld-primary-cta" onClick={handleCopyCode}>
                📋 Copy Vote Code
              </button>
            </div>
            <button type="button" className="ld-secondary-cta" onClick={onExitRemoteMode}>
              Return to Lights Down Home
            </button>
          </div>
        ) : currentFilm ? (
          <>
            <PosterArtwork film={currentFilm} className="ld-hotseat-film-card">
              <div className="ld-hotseat-film-meta">
                <span>CARD {idx + 1} OF {films.length}</span>
                <span>{currentFilm.language} • {currentFilm.runtime}m</span>
                <span>⚡ {currentFilm.hookMinutes}m hook</span>
              </div>
              <h3>{currentFilm.title} ({currentFilm.year})</h3>
              <p>&ldquo;{currentFilm.desc}&rdquo;</p>
            </PosterArtwork>

            <div className="ld-hotseat-actions">
              <button type="button" className="ld-veto-btn" onClick={() => recordChoice('no')}>
                👎 PASS
              </button>
              {vetoes.length === 0 && (
                <button type="button" className="ld-danger-cta" onClick={() => recordChoice('veto')}>
                  🪙 SPEND 1 VETO
                </button>
              )}
              <button type="button" className="ld-yes-btn" onClick={() => recordChoice('yes')}>
                👍 YES, DOWN!
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
