# 🎬 LIGHTS DOWN — 90-Second Movie Night Decision-to-Action Engine

> **Stop spending 40 minutes scrolling and bailing 20 minutes in.**  
> **Lights Down** takes you (or your 2–4 person crew) from *"Kya dekhein?"* to *"lights are down, film is playing"* in under **90 seconds**—complete with a pre-loaded **Backup Reel ("The 20-Minute Rule")**, **Brain Battery** calibration, **Least-Misery** group consensus, and a back-solved screening timeline.

- **Repository:** [https://github.com/priyansh4336/lights-down](https://github.com/priyansh4336/lights-down)
- **Author:** Priyansh (ABES Engineering College — B.Tech Computer Science)

---

## ✨ SOP: What Makes Lights Down Different

1. **🛡️ Backup Reel ("The 20-Minute Rule"):** Every primary selection automatically ships with a deterministic **Plan B** that is shorter, has a faster opening hook (`hookMinutes`), demands equal or lower Brain Battery, and pivots to a different primary genre. At minute 20 of playback, a real session check-in asks *"20 minutes in. Still with it?"* with **Keep Watching** or **Bail to Backup** (plus optional background browser notifications).
2. **⏱️ Time-Fit & Double Feature Back-Solver:** Tell the booth how much time you have (`90` to `240` minutes). The engine rounds up to the next 5-minute mark + 10 minutes snack/settling buffer, computes your exact **20-Minute Bail Check** timestamp and **Split-Flap "Lights Out By"** clock, and unlocks a **Double Feature** (with a 10-minute intermission) when your time budget allows.
3. **🔋 Brain Battery Calibration (`1` to `5`):** Instead of abstract genre checkboxes, calibrate by cognitive energy—from `1 — Dead Battery` (zero-effort comfort watch) to `5 — Full Cinema Brain` (layered masterworks like *Primer*, *Coherence*, or *Stalker*).
4. **🍕 Group Consensus: Pass-the-Phone Hot Seat + Remote Crew Link:**
   - **Hot Seat (Same Room):** 2–4 players vote privately on 5 candidate cards without peeking.
   - **Crew Link (Remote, No Backend):** Share a `#crew=...` URL hash with friends; each friend votes on their device and sends back a compact `base64url` vote code that merges directly into the host's shortlist.
   - **Least-Misery Math + Veto Tokens:** Scored via `0.60 * min(playerScores) + 0.40 * mean(playerScores)` so nobody is miserable, with 1 hard **Veto Token** per player.
5. **🎟️ Rule of 3 Shortlist + Ticket Tear Commit Ritual:** Never renders more than 3 cards at once, enforcing 3 distinct primary genres whenever possible. Tearing the perforated ticket stub starts a **90-second settling countdown**.
6. **📊 Night Log, Booth Stats & Regret Report:** Log outcomes (*Loved*, *Finished*, *Bailed*) to train genre weights (`+2` / `+1` / `-2`) and dynamically adjust your **Hook Patience Score**. Unlock a real **Regret Report** after 5+ logged nights, export your history as CSV, or share a **1080×560 PNG Screening Ticket**.

---

## ⚙️ POS (Platform Operating System) Pipeline

```text
[1. Inputs: Mood Beam, Brain Battery (1..5), Time Budget (90..240m), Crew (1..4)]
       │
       ▼
[2. Hard Filter + 3-Step Graceful Relaxation (guarantees ≥ 6 candidates)]
       │
       ▼
[3. Single-Viewer Scoring: 0.35 Mood + 0.25 Genre + 0.15 Rating + 0.15 Hook + 0.10 Freshness - BailPenalty]
       │
       ▼
[4. Group Least-Misery Aggregation: 0.60 * min(scores) + 0.40 * mean(scores) (Vetoed removed)]
       │
       ▼
[5. Rule of 3 Diversifier: Top 3 candidates across distinct primary genres]
       │
       ▼
[6. Backup Reel Selector (20-Minute Rule)] ──► [7. Split-Flap Timeline] ──► [8. Night Log & Regret Report]
```

---

## 🧩 Honest Component Inventory: React Bits Registry vs. Custom Built

### A. Installed via Official `@react-bits` shadcn Registry
| Component | File | Purpose |
| :--- | :--- | :--- |
| **LightRays** | `src/components/LightRays.jsx` | Real WebGL2 fragment shader rendering volumetric overhead projector rays tinted by active mood |
| **Dock** | `src/components/Dock.jsx` | Floating bottom navigation bar (Tonight's Plan, Night Log, Booth Stats, Sound Toggle, Reset) |
| **Stepper** | `src/components/Stepper.jsx` | 4-step calibration wizard container |
| **ElasticSlider** | `src/components/ElasticSlider.jsx` | Tactile elastic slider for Brain Battery (1–5) and Time-Fit budget (90–240m) |
| **SpotlightCard** | `src/components/SpotlightCard.jsx` | Cursor-tracking radial spotlight containers on Night Plan and Booth Stats |
| **GlareHover** | `src/components/GlareHover.jsx` | Holographic glare hover wrapper on the Rule of 3 shortlist cards |
| **Stack** | `src/components/Stack.jsx` | Interactive flickable 3-card fan deck on the Shortlist sidebar |
| **Counter, DecryptedText, ShinyText, TargetCursor, ClickSpark, Noise, AnimatedList** | `src/components/*.jsx` | Mechanical digit counters, cipher title reveal, metallic CTA sheen, custom cursor, click sparks, 35mm film grain overlay, and animated log archive |

### B. Custom-Engineered Booth Components
| Component / Module | File | Purpose |
| :--- | :--- | :--- |
| **TearTicket, SlideCommit, HoloCard, PulseHeartButton, SwipeRow, PeekRating** | `src/components/MicroInteractions.jsx` | Perforated ticket stub tear ritual, drag-to-bail slider, 3D tilt collectible card, shortlist lock button, swipe-to-delete row, and 5-star Hinglish rating bar |
| **SplitFlapText & Grainient** | `src/components/SplitFlapAndGrainient.jsx` | Mechanical split-flap departure board for *"Lights Out By"* time and dual-color ambient mesh |
| **PosterArtwork & StreamingProviders** | `src/components/PosterArtwork.jsx`, `src/components/StreamingProviders.jsx` | Lazy-loaded TMDB poster renderer with automatic two-tone CSS gradient fallback + live Indian streaming provider badges |
| **CrewLinkHostBox & CrewLinkRemoteVoter** | `src/components/CrewLinkPanel.jsx` | No-backend `#crew=...` URL generator, remote voting UI, and `base64url` vote code merger |
| **Web Audio Booth Synth** | `src/utils/sound.js` | Pure Web Audio API synthesizer (58Hz projector hum, split-flap clack, paper-tear noise burst) |
| **Canvas Ticket PNG Exporter** | `src/utils/ticketPng.js` | Renders a 1080×560 PNG screening ticket for `navigator.share` or instant download |

---

## 🚀 Quick Start & Scripts

```bash
# 1. Install dependencies
npm install

# 2. Start local development server (http://localhost:5173)
# Works 100% offline out-of-the-box using src/data/tmdb-cache.json
npm run dev

# 3. Run Vitest unit tests (8/8 engine tests) & dataset validation
npm test
npm run validate:data

# 4. Build production PWA bundle
npm run build
npm run preview
```

### Optional: Live TMDB Sync & Indian Streaming Badges
Lights Down works out of the box with zero API keys thanks to `src/data/tmdb-cache.json`. To enable live Indian streaming provider badges on the Night Plan screen or re-sync posters from TMDB:
1. Copy `.env.example` to `.env`.
2. Add a free TMDB v4 Read Access Token from [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api):
   ```env
   TMDB_TOKEN=your_tmdb_v4_read_token
   VITE_TMDB_TOKEN=your_tmdb_v4_read_token
   ```
3. Run `npm run enrich:tmdb` (`node scripts/enrich-tmdb.mjs`).

---

## 📁 Submission Deliverables (`submission/`)

| File | Description |
| :--- | :--- |
| `submission/01_Lights_Down_Project_Report.pdf` | 10-page technical report covering problem statement, competitor matrix, SOP, POS math formulas, architecture, component provenance, UI walkthroughs, test results, 500-night simulation, and limitations |
| `submission/02_movies_dataset.csv` | Full 60-film curated dataset with `tmdbId`, `brainBattery`, `hookMinutes`, `crewFit`, and `snack` |
| `submission/03_competitor_comparison.csv` | Feature comparison across Chooza, Swyf, WatchLitz, Project Flow, Movievia, Movik, Letterboxd, and Lights Down |
| `submission/04_engine_test_results.csv` | Real Vitest unit test results for `src/utils/engine.test.js` |
| `submission/05_simulation_results.csv` | 500 simulated nights generated by `scripts/simulate.mjs` (*SIMULATION, not real user data*) |
| `submission/06_project_links.csv` | Index of repository links, CLI commands, and external attributions |

---

## 📜 Attribution

- **TMDB Attribution:** *This product uses the TMDB API but is not endorsed or certified by TMDB.*
- **Streaming Data Attribution:** *Streaming availability data provided by JustWatch via TMDB.*
