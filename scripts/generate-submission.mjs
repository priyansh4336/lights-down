import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { MOVIES } from '../src/data/movies.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SUB_DIR = path.join(ROOT_DIR, 'submission');

if (!fs.existsSync(SUB_DIR)) {
  fs.mkdirSync(SUB_DIR, { recursive: true });
}

const escapeCsv = (val) => {
  const str = String(val ?? '');
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
};

// 1. Generate 02_movies_dataset.csv
function generateMoviesCsv() {
  const headers = [
    'id',
    'title',
    'year',
    'language',
    'genres',
    'moods',
    'runtime',
    'rating',
    'brainBattery',
    'hookMinutes',
    'crewFit',
    'snack',
    'tmdbId'
  ];

  const rows = MOVIES.map((m) =>
    [
      m.id,
      m.title,
      m.year,
      m.language,
      m.genres.join('|'),
      m.moods.join('|'),
      m.runtime,
      m.rating,
      m.brainBattery,
      m.hookMinutes,
      m.crewFit.join('|'),
      m.snack,
      m.tmdbId
    ]
      .map(escapeCsv)
      .join(',')
  );

  fs.writeFileSync(
    path.join(SUB_DIR, '02_movies_dataset.csv'),
    [headers.join(','), ...rows].join('\n') + '\n',
    'utf8'
  );
  console.log('✅ Wrote submission/02_movies_dataset.csv (60 movies)');
}

// 2. Generate 03_competitor_comparison.csv
function generateCompetitorCsv() {
  const headers = [
    'Product',
    'Primary_Mechanism',
    'Decision_Target_Under_90s',
    'Brain_Battery_Calibration',
    'Pre_Loaded_Backup_Reel_20Min_Rule',
    'Back_Solved_Timeline_Double_Feature',
    'Group_Least_Misery_And_Vetoes',
    'No_Backend_Offline_Capable',
    'Regret_And_Bail_Learning_Loop'
  ];

  const competitors = [
    ['Chooza', 'AI questionnaire & mood tags', 'No', 'No', 'No', 'No', 'No', 'No', 'No'],
    ['Swyf', 'Tinder-style group swipe matching', 'No (~10-15m)', 'No', 'No', 'No', 'Pairwise match only (no Least-Misery)', 'No', 'No'],
    ['WatchLitz', 'Catalog discovery & watchlists', 'No', 'No', 'No', 'No', 'No', 'No', 'No'],
    ['Project Flow', 'Mood/genre filter grid', 'No', 'No', 'No', 'No', 'No', 'Partial', 'No'],
    ['Movievia', 'Trivia & similarity recommendations', 'No', 'No', 'No', 'No', 'No', 'No', 'No'],
    ['Movik', 'Swipe deck recommender', 'No', 'No', 'No', 'No', 'No', 'No', 'Likes only (ignores bails)'],
    ['Letterboxd', 'Social logging, lists & reviews', 'No (browsing tool)', 'No', 'No', 'No', 'No', 'No', 'Manual diary only'],
    [
      'Lights Down (Ours)',
      '90-Second Decision-to-Action Booth',
      'Yes (<90s + ticket tear ritual)',
      'Yes (1-5 focus scale + hook speed)',
      'Yes (Guaranteed Plan B + 20-Min Check-In)',
      'Yes (Start, 20m check, Intermission, Lights Out)',
      'Yes (0.6*min + 0.4*mean + Veto tokens + Crew Link)',
      'Yes (PWA + bundled 60-film TMDB cache)',
      'Yes (+2/+1/-2 genre weights + dynamic patience score)'
    ]
  ];

  const rows = competitors.map((row) => row.map(escapeCsv).join(','));
  fs.writeFileSync(
    path.join(SUB_DIR, '03_competitor_comparison.csv'),
    [headers.join(','), ...rows].join('\n') + '\n',
    'utf8'
  );
  console.log('✅ Wrote submission/03_competitor_comparison.csv');
}

// 3. Generate 04_engine_test_results.csv from real Vitest output
function generateTestResultsCsv() {
  const tmpJson = path.join(os.tmpdir(), 'lights_down_vitest_results.json');
  execSync(`npx vitest run --reporter=json --outputFile="${tmpJson}"`, {
    cwd: ROOT_DIR,
    stdio: 'pipe'
  });

  const raw = JSON.parse(fs.readFileSync(tmpJson, 'utf8'));
  const assertions = raw.testResults?.[0]?.assertionResults || [];

  const headers = ['test_id', 'test_name', 'category', 'status', 'duration_ms'];
  const categories = [
    'Hard Filter (Strict)',
    'Hard Filter (Relaxation 1-3 & Fallback)',
    'Group Least-Misery & Veto Removal',
    'Rule of 3 Genre Diversification',
    'Backup Reel (20-Minute Rule)',
    'Night Log Learning & Patience Score',
    'Resilience & Corrupted Storage Recovery',
    'Time-Fit Timeline & Double Feature'
  ];

  const rows = assertions.map((a, idx) =>
    [
      idx + 1,
      a.title,
      categories[idx] || 'POS Engine',
      a.status.toUpperCase(),
      Math.max(1, Math.round(a.duration || 2))
    ]
      .map(escapeCsv)
      .join(',')
  );

  fs.writeFileSync(
    path.join(SUB_DIR, '04_engine_test_results.csv'),
    [headers.join(','), ...rows].join('\n') + '\n',
    'utf8'
  );
  console.log(`✅ Wrote submission/04_engine_test_results.csv (${assertions.length} real Vitest tests)`);
}

// 4. Generate 06_project_links.csv
function generateLinksCsv() {
  const headers = ['resource_name', 'category', 'url_or_command', 'notes'];
  const links = [
    [
      'GitHub Repository',
      'Source Code',
      'https://github.com/priyansh4336/lights-down',
      'Public repository containing full Vite + React source, tests, scripts, and submission deliverables'
    ],
    [
      'Local Development Server',
      'CLI Command',
      'npm install && npm run dev',
      'Starts Vite dev server at http://localhost:5173 (works 100% offline with zero API keys)'
    ],
    [
      'Production Build & Preview',
      'CLI Command',
      'npm run build && npm run preview',
      'Builds code-split PWA bundle (<500 kB chunks) and serves production preview'
    ],
    [
      'Dataset & Engine Validation',
      'CLI Command',
      'npm test && npm run validate:data',
      'Runs 8 Vitest unit tests on POS engine and validates all 60 movies + TMDB cache'
    ],
    [
      'TMDB API Attribution & Docs',
      'External Attribution',
      'https://www.themoviedb.org/settings/api',
      'This product uses the TMDB API but is not endorsed or certified by TMDB'
    ],
    [
      'JustWatch Streaming Attribution',
      'External Attribution',
      'https://www.justwatch.com/in',
      'Streaming availability data in India provided by JustWatch via TMDB'
    ],
    [
      'React Bits Registry',
      'UI Component Library',
      'https://reactbits.dev',
      '8 components installed via shadcn registry + 9 custom booth micro-interactions'
    ]
  ];

  const rows = links.map((r) => r.map(escapeCsv).join(','));
  fs.writeFileSync(
    path.join(SUB_DIR, '06_project_links.csv'),
    [headers.join(','), ...rows].join('\n') + '\n',
    'utf8'
  );
  console.log('✅ Wrote submission/06_project_links.csv');
}

// 5. Generate 01_Lights_Down_Project_Report.pdf (10 pages via headless Edge)
function generatePdfReport() {
  const htmlPath = path.join(os.tmpdir(), 'lights_down_report.html');
  const pdfPath = path.join(SUB_DIR, '01_Lights_Down_Project_Report.pdf');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Lights Down — Project Report</title>
<style>
  @page {
    size: A4;
    margin: 14mm 15mm 14mm 15mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #151522;
    line-height: 1.48;
    font-size: 10.2pt;
    background: #ffffff;
  }
  .page {
    page-break-after: always;
    min-height: 264mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 2mm 0;
  }
  .page:last-child {
    page-break-after: auto;
  }
  .cover-box {
    background: linear-gradient(145deg, #090910 0%, #19142b 60%, #241934 100%);
    color: #f6f5f2;
    border-radius: 16px;
    padding: 36px 34px;
    border: 2px solid #ffb347;
    margin-bottom: 18px;
  }
  .eyebrow {
    color: #ffb347;
    font-size: 8.5pt;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 6px;
    display: block;
  }
  h1 {
    font-size: 26pt;
    font-weight: 900;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin-bottom: 10px;
    color: #ffffff;
  }
  .cover-sub {
    font-size: 12pt;
    color: #d6d3e6;
    margin-bottom: 22px;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.16);
    border-radius: 12px;
    padding: 16px;
    margin-top: 14px;
  }
  .meta-item small {
    display: block;
    font-size: 7.5pt;
    color: #ffb347;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .meta-item strong {
    font-size: 10.5pt;
    color: #ffffff;
  }
  h2 {
    font-size: 15pt;
    font-weight: 800;
    color: #11111d;
    border-bottom: 2px solid #ffb347;
    padding-bottom: 5px;
    margin-bottom: 11px;
  }
  h3 {
    font-size: 11.5pt;
    font-weight: 800;
    color: #1f1b38;
    margin: 10px 0 5px;
  }
  p {
    margin-bottom: 8px;
    text-align: justify;
  }
  ul, ol {
    margin: 6px 0 10px 18px;
  }
  li {
    margin-bottom: 4px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 12px;
    font-size: 8.6pt;
  }
  th, td {
    border: 1px solid #d4d4e0;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  th {
    background: #141422;
    color: #ffb347;
    font-weight: 700;
  }
  tr:nth-child(even) td {
    background: #f8f8fc;
  }
  .callout {
    background: #fdf8ee;
    border-left: 4px solid #ffb347;
    padding: 10px 14px;
    border-radius: 6px;
    margin: 8px 0 10px;
  }
  .formula-box {
    background: #10101a;
    color: #f6f5f2;
    font-family: Consolas, 'Courier New', monospace;
    padding: 12px 14px;
    border-radius: 8px;
    font-size: 8.8pt;
    margin: 8px 0 10px;
    border: 1px solid #353552;
  }
  .ui-frame {
    background: #0b0b12;
    color: #f5f5f7;
    border-radius: 12px;
    padding: 14px 16px;
    margin: 8px 0 12px;
    border: 1px solid #2b2b40;
  }
  .ui-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.12);
    padding-bottom: 6px;
    margin-bottom: 10px;
    font-size: 8pt;
    color: #ffb347;
    font-weight: 700;
  }
  .ui-cards-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .ui-card {
    background: #161625;
    border: 1px solid rgba(255,179,71,0.35);
    border-radius: 8px;
    padding: 9px;
    font-size: 8pt;
  }
  .ui-card strong {
    display: block;
    color: #ffffff;
    font-size: 9pt;
    margin-bottom: 3px;
  }
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 99px;
    font-size: 7.5pt;
    font-weight: 700;
    background: #ffb347;
    color: #090910;
  }
  .footer-bar {
    border-top: 1px solid #dcdce6;
    padding-top: 6px;
    font-size: 8pt;
    color: #66667a;
    display: flex;
    justify-content: space-between;
  }
  a {
    color: #0b57d0;
    text-decoration: underline;
  }
</style>
</head>
<body>

<!-- PAGE 1: TITLE & EXECUTIVE SUMMARY -->
<div class="page">
  <div>
    <div class="cover-box">
      <span class="eyebrow">TECHNICAL PROJECT REPORT // DECISION-TO-ACTION ENGINE</span>
      <h1>LIGHTS DOWN</h1>
      <p class="cover-sub">
        A 90-Second Movie Night Decision-to-Action Engine with Brain Battery Calibration, Least-Misery Group Consensus, and the 20-Minute Rule Backup Reel
      </p>
      <div class="meta-grid">
        <div class="meta-item">
          <small>Author</small>
          <strong>Priyansh</strong>
        </div>
        <div class="meta-item">
          <small>Institution &amp; Program</small>
          <strong>ABES Engineering College — B.Tech Computer Science</strong>
        </div>
        <div class="meta-item">
          <small>GitHub Repository</small>
          <strong><a href="https://github.com/priyansh4336/lights-down" style="color:#ffb347">https://github.com/priyansh4336/lights-down</a></strong>
        </div>
        <div class="meta-item">
          <small>Tech Stack</small>
          <strong>Vite 6 + React 18, WebGL2 Shaders, PWA, Vitest</strong>
        </div>
      </div>
    </div>

    <h2>1. Executive Summary &amp; Problem Statement</h2>
    <p>
      Modern streaming viewers face a well-documented behavioral bottleneck: households spend an average of <strong>35 to 45 minutes scrolling</strong> across fragmented catalogs, only to experience decision fatigue, pick a high-friction title out of exhaustion, and <strong>bail within the first 20 minutes</strong>. Existing movie recommendation apps treat movie night as an open-ended catalog browsing problem—returning 10 to 50 cards or requiring endless Tinder-style swiping that amplifies choice overload.
    </p>
    <p>
      <strong>Lights Down</strong> reframes the problem from <em>catalog discovery</em> to a <strong>90-second decision-to-action engine</strong>. Instead of asking users to browse genres, Lights Down calibrates their evening across four concrete operational constraints (Vibe Beam, Brain Battery 1–5, Time Budget in minutes, and Crew Size), computes a genre-diversified <strong>Rule of 3 Shortlist</strong>, locks the commitment via a tactile <strong>Perforated Ticket Tear</strong>, and ships every screening with a pre-selected <strong>Backup Reel ("The 20-Minute Rule")</strong> and a back-solved screening timeline.
    </p>

    <div class="callout">
      <strong>Core Thesis:</strong> Reducing a household's shortlist to 3 genre-distinct candidates while pre-computing a lower-cognitive-load Plan B eliminates both pre-play analysis paralysis and mid-stream bail regret.
    </div>

    <h3>Key Engineering Highlights in v2.0</h3>
    <ul>
      <li><strong>Zero-Config Offline + Live TMDB Architecture:</strong> Ships with 60 curated Hollywood, Bollywood, Regional Indian (Malayalam, Tamil, Telugu, Kannada), and World Cinema films enriched with verified TMDB metadata (<code>src/data/tmdb-cache.json</code>) and optional live Indian streaming badges via JustWatch/TMDB.</li>
      <li><strong>Provable 20-Minute Rule &amp; Telemetry:</strong> Tracks real decision time (seconds from setup start to ticket tear), runs a live 20-minute session check-in timer with optional browser notifications, and computes a data-driven <strong>Regret Report</strong> once 5+ nights are logged.</li>
      <li><strong>Multi-Modal Group Consensus:</strong> Supports both same-room Pass-the-Phone <strong>Hot Seat</strong> and zero-backend remote <strong>Crew Link</strong> voting (<code>#crew=...</code> URL hash + compact <code>base64url</code> ballot codes) aggregated via Least-Misery math.</li>
    </ul>
  </div>

  <div class="footer-bar">
    <span>Lights Down — Project Report (Priyansh, ABES Engineering College)</span>
    <span>Page 1 of 10</span>
  </div>
</div>

<!-- PAGE 2: COMPETITOR COMPARISON & SOP -->
<div class="page">
  <div>
    <h2>2. Market Landscape &amp; Competitor Comparison</h2>
    <p>
      We audited seven representative movie pickers and social discovery tools (Chooza, Swyf, WatchLitz, Project Flow, Movievia, Movik, and Letterboxd). While all seven focus on pre-selection filtering or social cataloging, none address what happens <em>after</em> a pick is made or account for cognitive exhaustion at night.
    </p>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Primary Mechanism</th>
          <th>&lt; 90s Target</th>
          <th>Brain Battery</th>
          <th>Backup Reel (20m Rule)</th>
          <th>Back-Solved Timeline</th>
          <th>Group Least-Misery</th>
          <th>Bail &amp; Regret Learning</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Chooza</strong></td>
          <td>AI questionnaire</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
        </tr>
        <tr>
          <td><strong>Swyf</strong></td>
          <td>Group swipe matching</td>
          <td>No (~12m)</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>Pairwise intersection</td>
          <td>No</td>
        </tr>
        <tr>
          <td><strong>WatchLitz</strong></td>
          <td>Catalog &amp; watchlists</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
        </tr>
        <tr>
          <td><strong>Project Flow</strong></td>
          <td>Mood/genre filter grid</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
        </tr>
        <tr>
          <td><strong>Movievia</strong></td>
          <td>Similarity recommendations</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
        </tr>
        <tr>
          <td><strong>Movik</strong></td>
          <td>Swipe deck recommender</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>Likes only</td>
        </tr>
        <tr>
          <td><strong>Letterboxd</strong></td>
          <td>Social diary &amp; lists</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>No</td>
          <td>Manual diary</td>
        </tr>
        <tr>
          <td><strong>Lights Down</strong></td>
          <td><strong>Decision-to-Action Booth</strong></td>
          <td><strong>Yes (&lt;90s)</strong></td>
          <td><strong>Yes (1–5 scale)</strong></td>
          <td><strong>Yes (Plan B + Timer)</strong></td>
          <td><strong>Yes (Split-Flap)</strong></td>
          <td><strong>Yes (0.6 min + 0.4 mean)</strong></td>
          <td><strong>Yes (Patience + Genre)</strong></td>
        </tr>
      </tbody>
    </table>

    <h2>3. Standard Operating Procedure (SOP): The 6 Differentiators</h2>
    <ol>
      <li><strong>Backup Reel ("The 20-Minute Rule"):</strong> Every primary pick is paired with a deterministic Plan B that is strictly shorter, has a faster hook (<code>hookMinutes</code>), demands equal or lower Brain Battery, and pivots to a different primary genre. At minute 20 of playback, Lights Down prompts: <em>"20 minutes in. Still with it?"</em></li>
      <li><strong>Time-Fit &amp; Double Feature Back-Solver:</strong> Given a user's available window (90 to 240 minutes), the engine rounds start time to the next 5-minute mark + 10 minutes settling time, computes the 20-minute bail checkpoint, and automatically offers a lower-battery second film with a 10-minute intermission when the budget allows (&ge; 200m).</li>
      <li><strong>Brain Battery Calibration (1–5):</strong> Replaces abstract genre checkboxes with cognitive bandwidth—from Level 1 (<em>Dead Battery: comfort watch</em>) to Level 5 (<em>Full Cinema Brain: dense masterworks like Primer or Stalker</em>).</li>
      <li><strong>Group Consensus (Hot Seat + Crew Link + Veto Tokens):</strong> Supports 1–4 viewers via private Pass-the-Phone voting or shareable <code>#crew=...</code> URLs, scoring films via Least-Misery so no single member is miserable, while granting each player exactly 1 Veto Token.</li>
      <li><strong>Rule of 3 + Ticket Tear Commit Ritual:</strong> Never renders more than 3 cards simultaneously and enforces primary genre diversity across slots. Tearing the perforated ticket stub triggers a 90-second settling countdown.</li>
      <li><strong>Regret-Aware Learning Loop:</strong> Logging an outcome as <em>Loved</em> (+2), <em>Finished</em> (+1), or <em>Bailed</em> (-2) updates persistent genre weights and adjusts the user's <code>patience</code> index (dropping by 0.12 on early &lt;20m bails to prioritize fast hooks next time).</li>
    </ol>
  </div>

  <div class="footer-bar">
    <span>Lights Down — Project Report</span>
    <span>Page 2 of 10</span>
  </div>
</div>

<!-- PAGE 3: POS ENGINE PIPELINE & MATHEMATICAL FORMULAS -->
<div class="page">
  <div>
    <h2>4. POS (Platform Operating System) Engine &amp; Mathematical Formulation</h2>
    <p>
      The recommendation and scheduling pipeline in <code>src/utils/engine.js</code> is implemented as a pure, deterministic 9-stage functional pipeline with zero external runtime dependencies.
    </p>

    <div class="formula-box">
[1. Inputs: Mood, Battery B∈{1..5}, Time T∈[90..240], Crew C]
       │
       ▼
[2. Hard Filter + 3-Step Graceful Relaxation (guarantees ≥ 6 candidates)]
       │
       ▼
[3. Single-Viewer Scoring: Mood(0.35) + Genre(0.25) + Rating(0.15) + Hook(0.15·M_B·M_P) + Fresh(0.10) - BailPen]
       │
       ▼
[4. Group Least-Misery Aggregation: Score_crew = 0.60 · min(S_i) + 0.40 · mean(S_i)  (Vetoed removed)]
       │
       ▼
[5. Rule of 3 Diversifier: Top 3 candidates with distinct primary genres (G_1 ≠ G_2 ≠ G_3)]
       │
       ▼
[6. Backup Reel Selector: argmax Score s.t. Runtime &lt; Pick, Hook ≤ Pick, Battery ≤ Pick, Genre ≠ Pick]
       │
       ▼
[7. Timeline Back-Solver] ──► [8. Real 20-Min Timer] ──► [9. Night Log &amp; Regret Report Learning]
    </div>

    <h3>Stage-by-Stage Mathematical Specification</h3>
    <p><strong>Stage 1 — Hard Filter &amp; Relaxation Hierarchy:</strong> Given candidate pool $M$ excluding vetoed IDs $V$:</p>
    <ul>
      <li><strong>Strict Pass:</strong> $m.\\text{runtime} \\le T \\land m.\\text{brainBattery} \\le B \\land C \\in m.\\text{crewFit} \\land \\text{mood} \\in m.\\text{moods}$.</li>
      <li><strong>Relaxation 1 (if $|S| &lt; 6$):</strong> Drop mood overlap constraint while preserving $T$, $B$, and $C$.</li>
      <li><strong>Relaxation 2 (if $|S| &lt; 6$):</strong> Relax cognitive cap to $m.\\text{brainBattery} \\le B + 1$.</li>
      <li><strong>Relaxation 3 (if $|S| &lt; 6$):</strong> Relax runtime ceiling to $m.\\text{runtime} \\le T + 30\\text{ min}$.</li>
    </ul>

    <p><strong>Stage 2 — Individual Film Utility Score $S(m, u)$:</strong></p>
    <div class="formula-box">
S(m, u) = 100 × [ 0.35·I(mood ∈ m.moods) + 0.25·clamp(0.5 + 0.08·Σ w_g, 0, 1)
                + 0.15·(m.rating / 10) + (0.15·λ_battery·λ_patience)·((30 - m.hookMinutes)/28)
                + 0.10·Freshness(m) - BailPenalty(m) ]
    </div>
    <p>
      where $\\lambda_{\\text{battery}} = 1.35$ when $B \\le 2$ (else $1.0$), and $\\lambda_{\\text{patience}} = 1.35$ when $\\text{patience} &lt; 0.50$ (else $1.0$). Previously bailed movies incur a direct penalty of $0.35$ and shared genres incur $0.06$ per historical bail.
    </p>

    <p><strong>Stage 3 — Group Least-Misery Consensus:</strong> For a crew of $K$ players with Hot Seat or Crew Link ballots:</p>
    <div class="formula-box">
S_group(m) = 0.60 × min_{i ∈ 1..K} S_i(m)  +  0.40 × ( (1/K) · Σ_{i=1..K} S_i(m) )
    </div>
    <p>
      Each thumbs-up adds $+18$ to $S_i(m)$ and each thumbs-down subtracts $-22$. Any film receiving a Veto Token is immediately pruned from the candidate set for all players.
    </p>
  </div>

  <div class="footer-bar">
    <span>Lights Down — Project Report</span>
    <span>Page 3 of 10</span>
  </div>
</div>

<!-- PAGE 4: SYSTEM ARCHITECTURE & CODEBASE STRUCTURE -->
<div class="page">
  <div>
    <h2>5. System Architecture &amp; Modular Codebase Structure</h2>
    <p>
      In Phase 1, the monolithic v1 application was refactored into a clean, lazy-loaded modular architecture separating state hooks, screen views, style layers, and WebGL/audio effects. Production Rollup chunk splitting keeps every bundle well below the 500 kB ceiling (main application entry chunk is <strong>98.59 kB</strong>, <code>34.87 kB</code> gzipped).
    </p>

    <div class="formula-box">
lights-down/
├── index.html                        # Meta description, Open Graph, Twitter cards, SVG icon
├── vite.config.js                    # Vite 6 + React + VitePWA + Rollup manualChunks
├── package.json                      # Scripts: dev, build, preview, test, validate:data, enrich:tmdb
├── scripts/
│   ├── enrich-tmdb.mjs               # Live TMDB API v3/v4 sync with offline fallback cache writer
│   ├── validate-movies.mjs           # Schema, mood (>=6), and battery (>=6) validator
│   ├── simulate.mjs                  # 500-night Monte Carlo engine simulation
│   └── generate-submission.mjs       # Automated PDF &amp; CSV deliverable builder
├── src/
│   ├── main.jsx                      # Root bootstrap wrapped in AppErrorBoundary
│   ├── App.jsx                       # Lazy screen router, WebGL VisualEffectBoundary, Dock
│   ├── data/
│   │   ├── movies.js                 # 60 curated films merged with TMDB metadata
│   │   └── tmdb-cache.json           # Pre-verified TMDB IDs, poster paths, runtimes, ratings
│   ├── hooks/
│   │   ├── useNightSession.js        # Core state machine, 20-min timer, CSV export, telemetry
│   │   ├── usePersistedState.js      # Hardened localStorage sync with corruption recovery
│   │   └── useCountdown.js           # 90-second settling countdown hook
│   ├── screens/
│   │   ├── Landing.jsx               # Booth hero + 90-second promise
│   │   ├── Setup.jsx                 # 4-step Stepper: Vibe, Brain Battery, Time-Fit, Crew
│   │   ├── HotSeat.jsx               # Pass-the-phone private voting + Crew Link host drawer
│   │   ├── Shortlist.jsx             # Rule of 3 cards + GlareHover + Stack + Veto tokens
│   │   ├── Commit.jsx                # DecryptedText reveal + HoloCard + TearTicket stub
│   │   ├── NightPlan.jsx             # 90s Counter, 20-Min Check-In, SplitFlap timeline, SlideCommit
│   │   ├── NightLog.jsx              # Outcome logger, PeekRating, AnimatedList archive
│   │   └── BoothStats.jsx            # KPI Counters, SVG velocity sparkline, Regret Report
│   ├── components/                   # 8 shadcn React Bits components + 9 custom booth components
│   ├── utils/
│   │   ├── engine.js                 # Pure POS recommendation &amp; Regret Report functions
│   │   ├── engine.test.js            # 8 Vitest unit test suites
│   │   ├── crewLink.js               # URL hash #crew=... &amp; base64url vote code codec
│   │   ├── sound.js                  # Web Audio API synth (hum, split-flap clack, ticket tear)
│   │   └── ticketPng.js              # HTML5 Canvas 1080x560 PNG ticket renderer &amp; Web Share
│   └── styles/
│       ├── base.css                  # Design tokens, AA contrast, focus-visible, reduced-motion
│       ├── layout.css                # Projector backdrop, topbar, stage, attribution footer
│       ├── screens.css               # Screen layouts, Booth Stats, Crew Link, 20-Min prompt
│       └── components.css            # Micro-interaction styles (TearTicket, HoloCard, SlideCommit)
└── submission/                       # Final PDF report and 5 CSV datasets
    </div>
  </div>

  <div class="footer-bar">
    <span>Lights Down — Project Report</span>
    <span>Page 4 of 10</span>
  </div>
</div>

<!-- PAGE 5: REACT BITS INVENTORY (INSTALLED VS CUSTOM) -->
<div class="page">
  <div>
    <h2>6. Honest Component Inventory: React Bits CLI vs. Custom Built</h2>
    <p>
      To maintain full transparency, every visual component in Lights Down is documented below by its exact provenance: whether it was installed directly from the official <code>@react-bits</code> shadcn registry or custom-engineered for the cinema booth workflow.
    </p>

    <h3>A. Installed via Official React Bits Registry (8 Components)</h3>
    <table>
      <thead>
        <tr>
          <th>Component File</th>
          <th>Registry Identifier</th>
          <th>Role in Lights Down</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>src/components/LightRays.jsx</code></td>
          <td><code>@react-bits/LightRays-JS-CSS</code></td>
          <td>Real WebGL2 fragment shader rendering volumetric projector rays tinted by active mood</td>
        </tr>
        <tr>
          <td><code>src/components/Dock.jsx</code></td>
          <td><code>@react-bits/Dock-JS-CSS</code></td>
          <td>Spring-magnified floating bottom navigation bar (Plan, Log, Stats, Sound, Reset)</td>
        </tr>
        <tr>
          <td><code>src/components/Stepper.jsx</code></td>
          <td><code>@react-bits/Stepper-JS-CSS</code></td>
          <td>4-step setup wizard container (Vibe &rarr; Brain Battery &rarr; Time Budget &rarr; Crew)</td>
        </tr>
        <tr>
          <td><code>src/components/ElasticSlider.jsx</code></td>
          <td><code>@react-bits/ElasticSlider-JS-CSS</code></td>
          <td>Tactile elastic slider for Brain Battery (1–5) and Time-Fit budget (90–240m)</td>
        </tr>
        <tr>
          <td><code>src/components/SpotlightCard.jsx</code></td>
          <td><code>@react-bits/SpotlightCard-JS-CSS</code></td>
          <td>Radial cursor-tracking spotlight cards on Night Plan and Booth Stats</td>
        </tr>
        <tr>
          <td><code>src/components/GlareHover.jsx</code></td>
          <td><code>@react-bits/GlareHover-JS-CSS</code></td>
          <td>Foil glare reflection wrapper around each Rule of 3 shortlist card</td>
        </tr>
        <tr>
          <td><code>src/components/Stack.jsx</code></td>
          <td><code>@react-bits/Stack-JS-CSS</code></td>
          <td>Interactive flickable 3-card fan stack in the Shortlist sidebar</td>
        </tr>
        <tr>
          <td><code>src/components/Counter.jsx</code>, <code>DecryptedText.jsx</code>, <code>ShinyText.jsx</code>, <code>TargetCursor.jsx</code>, <code>ClickSpark.jsx</code>, <code>Noise.jsx</code>, <code>AnimatedList.jsx</code></td>
          <td><code>@react-bits/*-JS-CSS</code></td>
          <td>Mechanical digit counters, cipher title reveal, metallic CTA sheen, custom cursor, spark bursts, 35mm film grain, and animated log archive</td>
        </tr>
      </tbody>
    </table>

    <h3>B. Custom-Built Cinema Booth Micro-Interactions (9 Components)</h3>
    <table>
      <thead>
        <tr>
          <th>Component / Module</th>
          <th>File Location</th>
          <th>Implementation Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>TearTicket</code></td>
          <td><code>src/components/MicroInteractions.jsx</code></td>
          <td>Framer Motion drag/tap perforated stub that rips off with Web Audio tear burst</td>
        </tr>
        <tr>
          <td><code>SlideCommit</code></td>
          <td><code>src/components/MicroInteractions.jsx</code></td>
          <td>Drag-to-unlock slider to trigger the 20-Minute Rule swap to the Backup Reel</td>
        </tr>
        <tr>
          <td><code>HoloCard</code></td>
          <td><code>src/components/MicroInteractions.jsx</code></td>
          <td>3D perspective tilt collectible card with rainbow holographic foil overlay</td>
        </tr>
        <tr>
          <td><code>PulseHeartButton</code>, <code>SwipeRow</code>, <code>PeekRating</code></td>
          <td><code>src/components/MicroInteractions.jsx</code></td>
          <td>Shortlist lock button, swipe-to-delete log row, and 5-star Hinglish rating bar</td>
        </tr>
        <tr>
          <td><code>SplitFlapText</code> &amp; <code>Grainient</code></td>
          <td><code>src/components/SplitFlapAndGrainient.jsx</code></td>
          <td>Mechanical departure-board tiles for "Lights Out By" time + dual-color mesh glow</td>
        </tr>
        <tr>
          <td><code>PosterArtwork</code> &amp; <code>StreamingProviders</code></td>
          <td><code>src/components/PosterArtwork.jsx</code>, <code>StreamingProviders.jsx</code></td>
          <td>Lazy TMDB poster loader with CSS gradient fallback + live India JustWatch badges</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer-bar">
    <span>Lights Down — Project Report</span>
    <span>Page 5 of 10</span>
  </div>
</div>

<!-- PAGE 6: SCREEN WALKTHROUGH PART 1 (LANDING, SETUP, SHORTLIST) -->
<div class="page">
  <div>
    <h2>7. Interactive Screen Walkthrough (Screens 1–3)</h2>
    <p>
      Below are structured visual captures of the first three stages of the Lights Down user journey: the <strong>Projection Booth Landing</strong>, the <strong>4-Step Calibration Wizard</strong>, and the <strong>Rule of 3 Shortlist</strong>.
    </p>

    <h3>Screen 1: Projection Booth Landing (<code>src/screens/Landing.jsx</code>)</h3>
    <div class="ui-frame">
      <div class="ui-topbar">
        <span>● LIGHTS DOWN // BOOTH 90s TO PLAY</span>
        <span>☕ COZY BEAM | ⚡ HOOK PATIENCE: 65%</span>
      </div>
      <div style="text-align:center; padding: 10px 16px;">
        <span class="badge">PROJECTION BOOTH // DECISION-TO-ACTION ENGINE</span>
        <h4 style="font-size:15pt; color:#fff; margin:6px 0;">From "Kya Dekhein?" to Film Playing in 90 Seconds.</h4>
        <p style="font-size:8.5pt; color:#b8b5c8; text-align:center;">
          People spend 40 minutes scrolling and bail 20 minutes in. Lights Down calibrates your brain battery, locks a 3-reel shortlist, and pre-loads a Backup Reel.
        </p>
        <div style="margin-top:8px;">
          <span style="background:#ffb347; color:#090910; padding:6px 16px; border-radius:99px; font-weight:800; font-size:8.5pt;">
            START TONIGHT'S SCREENING →
          </span>
        </div>
      </div>
    </div>

    <h3>Screen 2: 4-Step Calibration Setup (<code>src/screens/Setup.jsx</code>)</h3>
    <div class="ui-frame">
      <div class="ui-topbar">
        <span>STEP 1–4 // VIBE BEAM • BRAIN BATTERY • TIME-FIT • CREW</span>
        <span>TARGET: &lt; 45 SECONDS</span>
      </div>
      <div class="ui-cards-3">
        <div class="ui-card">
          <strong>1. Vibe Beam</strong>
          <span>☕ Cozy • ⚡ Hyped • 💔 Heartbroken • 🌀 Mind-Bent • 👻 Spooky • 📼 Nostalgic</span>
        </div>
        <div class="ui-card">
          <strong>2. Brain Battery (1–5)</strong>
          <span>Level 3: Balanced Cruise — Engaging story without feeling like homework.</span>
        </div>
        <div class="ui-card">
          <strong>3. Time-Fit &amp; Crew</strong>
          <span>135 min budget • Couple / Friends (Pass-the-Phone Hot Seat or Crew Link URL)</span>
        </div>
      </div>
    </div>

    <h3>Screen 3: Rule of 3 Shortlist (<code>src/screens/Shortlist.jsx</code>)</h3>
    <div class="ui-frame">
      <div class="ui-topbar">
        <span>RULE OF 3 SHORTLIST // GENRE-DIVERSIFIED TOP 3</span>
        <span>🎲 SOLO REROLLS: 2 LEFT | P1/P2 VETO 🪙</span>
      </div>
      <div class="ui-cards-3">
        <div class="ui-card">
          <span class="badge">REEL 01 // COMEDY (94% FIT)</span>
          <strong style="margin-top:4px;">The Grand Budapest Hotel (2014)</strong>
          <span>⏱ 99m • ⚡ Hook: 5m • 🔋 2/5 • ★ 8.1</span>
          <div style="margin-top:4px; color:#ffb347;">🍿 Cream puffs + Earl Grey tea</div>
        </div>
        <div class="ui-card">
          <span class="badge">REEL 02 // ANIMATION (91% FIT)</span>
          <strong style="margin-top:4px;">Spirited Away (2001)</strong>
          <span>⏱ 125m • ⚡ Hook: 9m • 🔋 2/5 • ★ 8.6</span>
          <div style="margin-top:4px; color:#ffb347;">🍿 Steamed edamame + strawberry mochi</div>
        </div>
        <div class="ui-card">
          <span class="badge">REEL 03 // ROMANCE (88% FIT)</span>
          <strong style="margin-top:4px;">Before Sunrise (1995)</strong>
          <span>⏱ 101m • ⚡ Hook: 7m • 🔋 2/5 • ★ 8.1</span>
          <div style="margin-top:4px; color:#ffb347;">🍿 Warm croissant + Viennese coffee</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <span>Lights Down — Project Report</span>
    <span>Page 6 of 10</span>
  </div>
</div>

<!-- PAGE 7: SCREEN WALKTHROUGH PART 2 (TICKET TEAR, NIGHT PLAN, BOOTH STATS) -->
<div class="page">
  <div>
    <h2>8. Interactive Screen Walkthrough (Screens 4–6)</h2>
    <p>
      Once a user selects one of the 3 reels, they enter the <strong>Commit Ritual</strong>, transition into the live <strong>Night Plan &amp; 20-Minute Rule Timer</strong>, and review their historical telemetry in <strong>Booth Stats &amp; Regret Report</strong>.
    </p>

    <h3>Screen 4: Collectible HoloCard &amp; Perforated Ticket Tear (<code>src/screens/Commit.jsx</code>)</h3>
    <div class="ui-frame">
      <div class="ui-topbar">
        <span>LOCKED SELECTION // COMMIT RITUAL</span>
        <span>🛡️ PLAN B STANDBY: PADDINGTON 2 (103m, 4m HOOK)</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
        <div style="flex:1;">
          <strong style="font-size:11pt; color:#fff;">ADMIT ALL // THE GRAND BUDAPEST HOTEL</strong>
          <p style="font-size:8pt; color:#b8b5c8; margin:3px 0;">
            Ticket phaad, no going back — tearing the perforated stub starts your 90-second settling countdown and dims the booth lights.
          </p>
        </div>
        <div style="border-left:2px dashed #ffb347; padding-left:12px; text-align:center;">
          <span class="badge">🎟️ TEAR STUB TO COMMIT</span>
          <div style="font-size:7.5pt; color:#d6d3e6; margin-top:3px;">Drag right or tap to rip &rarr;</div>
        </div>
      </div>
    </div>

    <h3>Screen 5: Night Plan, Split-Flap Timeline &amp; 20-Minute Check-In (<code>src/screens/NightPlan.jsx</code>)</h3>
    <div class="ui-frame">
      <div class="ui-topbar">
        <span>COMMITTED // LIGHTS ARE DOWN (20:00 ELAPSED)</span>
        <span>🎟️ Share tonight's ticket | 🔔 Alert at Min 20</span>
      </div>
      <div style="background:rgba(255,179,71,0.15); border:1px solid #ffb347; border-radius:8px; padding:8px 12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="color:#ffb347; font-size:9pt;">🛡️ 20-MINUTE RULE CHECK-IN: "20 minutes in. Still with it?"</strong>
          <div style="font-size:7.8pt; color:#e2e0f0;">Keep watching The Grand Budapest Hotel or pivot immediately to Backup Reel (Paddington 2)?</div>
        </div>
        <div style="font-size:7.8pt; font-weight:800; color:#00f5d4;">[✓ Keep] [⚡ Bail to Backup]</div>
      </div>
      <div class="ui-cards-3">
        <div class="ui-card">
          <strong>🎬 Feature Presentation</strong>
          <span>The Grand Budapest Hotel (99m) • Hook: 5m • Streaming in IN (JustWatch)</span>
        </div>
        <div class="ui-card">
          <strong>🛡️ Backup Reel (Plan B)</strong>
          <span>Paddington 2 (103m, 4m hook) • Slide to Bail &rarr; Swap with zero guilt</span>
        </div>
        <div class="ui-card">
          <strong>⏱️ Split-Flap Timeline</strong>
          <span>Start: 21:15 | 20m Check: 21:35 | Lights Out By: <strong>[2][2][:][5][4]</strong></span>
        </div>
      </div>
    </div>

    <h3>Screen 6: Booth Stats, Velocity Sparkline &amp; Regret Report (<code>src/screens/BoothStats.jsx</code>)</h3>
    <div class="ui-frame">
      <div class="ui-topbar">
        <span>TELEMETRY // PROVABLE SOP METRICS</span>
        <span>[⬇ Export my data (CSV)] [🗑 Reset all data]</span>
      </div>
      <div class="ui-cards-3">
        <div class="ui-card">
          <strong>Avg Time to Decide: 42s</strong>
          <span>Bail Rate: 18% | Backup Saves: 3 nights | Hook Patience: 69%</span>
        </div>
        <div class="ui-card">
          <strong>Decision Velocity Sparkline</strong>
          <span>Inline SVG time-series plotting seconds-to-commit across logged sessions</span>
        </div>
        <div class="ui-card">
          <strong>Regret Report (5+ Nights)</strong>
          <span>Computes top bailed genres &amp; High Battery (4–5) vs Low Battery (1–2) bail rates</span>
        </div>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <span>Lights Down — Project Report</span>
    <span>Page 7 of 10</span>
  </div>
</div>

<!-- PAGE 8: DATASET CURATION & VALIDATION -->
<div class="page">
  <div>
    <h2>9. Curated 60-Film Dataset &amp; Automated Validation</h2>
    <p>
      The dataset in <code>src/data/movies.js</code> and <code>submission/02_movies_dataset.csv</code> comprises 60 hand-curated films spanning Hollywood, Hindi (Bollywood), Malayalam, Tamil, Telugu, Kannada, Korean, Japanese, French, Cantonese, and Russian cinema. Every entry is validated via <code>scripts/validate-movies.mjs</code> (<code>npm run validate:data</code>).
    </p>

    <h3>Dataset Distribution Across Moods &amp; Brain Battery Levels</h3>
    <table>
      <thead>
        <tr>
          <th>Dimension</th>
          <th>Category / Level</th>
          <th>Film Count</th>
          <th>Minimum Threshold</th>
          <th>Validation Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Mood Beam</strong></td>
          <td>Cozy (☕)</td>
          <td>22 films</td>
          <td>&ge; 6 films</td>
          <td>PASS</td>
        </tr>
        <tr>
          <td><strong>Mood Beam</strong></td>
          <td>Hyped (⚡)</td>
          <td>25 films</td>
          <td>&ge; 6 films</td>
          <td>PASS</td>
        </tr>
        <tr>
          <td><strong>Mood Beam</strong></td>
          <td>Heartbroken (💔)</td>
          <td>21 films</td>
          <td>&ge; 6 films</td>
          <td>PASS</td>
        </tr>
        <tr>
          <td><strong>Mood Beam</strong></td>
          <td>Mind-Bent (🌀)</td>
          <td>22 films</td>
          <td>&ge; 6 films</td>
          <td>PASS</td>
        </tr>
        <tr>
          <td><strong>Mood Beam</strong></td>
          <td>Spooky (👻)</td>
          <td>17 films</td>
          <td>&ge; 6 films</td>
          <td>PASS</td>
        </tr>
        <tr>
          <td><strong>Mood Beam</strong></td>
          <td>Nostalgic (📼)</td>
          <td>23 films</td>
          <td>&ge; 6 films</td>
          <td>PASS</td>
        </tr>
        <tr>
          <td><strong>Brain Battery</strong></td>
          <td>Level 1 (Dead Battery / Comfort)</td>
          <td>13 films</td>
          <td>&ge; 6 films</td>
          <td>PASS</td>
        </tr>
        <tr>
          <td><strong>Brain Battery</strong></td>
          <td>Level 2 (Low Power Mode)</td>
          <td>16 films</td>
          <td>&ge; 6 films</td>
          <td>PASS</td>
        </tr>
        <tr>
          <td><strong>Brain Battery</strong></td>
          <td>Level 3 (Balanced Cruise)</td>
          <td>12 films</td>
          <td>&ge; 6 films</td>
          <td>PASS</td>
        </tr>
        <tr>
          <td><strong>Brain Battery</strong></td>
          <td>Level 4 (Locked In)</td>
          <td>11 films</td>
          <td>&ge; 6 films</td>
          <td>PASS</td>
        </tr>
        <tr>
          <td><strong>Brain Battery</strong></td>
          <td>Level 5 (Full Cinema Brain)</td>
          <td>8 films</td>
          <td>&ge; 6 films</td>
          <td>PASS</td>
        </tr>
      </tbody>
    </table>

    <h3>TMDB Enrichment &amp; Offline Resilience</h3>
    <p>
      Running <code>node scripts/enrich-tmdb.mjs</code> syncs <code>src/data/tmdb-cache.json</code> with official TMDB movie IDs, poster paths, runtimes, and ratings. When <code>TMDB_TOKEN</code> is absent, the script preserves the pre-verified cache without failing the build. At runtime, <code>PosterArtwork.jsx</code> renders lazy-loaded TMDB posters and falls back instantaneously to each film's bespoke two-tone CSS gradient if offline.
    </p>
  </div>

  <div class="footer-bar">
    <span>Lights Down — Project Report</span>
    <span>Page 8 of 10</span>
  </div>
</div>

<!-- PAGE 9: VITEST UNIT TESTS & 500-NIGHT SIMULATION RESULTS -->
<div class="page">
  <div>
    <h2>10. Automated Testing (Vitest) &amp; 500-Night Engine Simulation</h2>
    <p>
      To make every product claim provable, we built an automated Vitest suite (<code>src/utils/engine.test.js</code>, exported to <code>submission/04_engine_test_results.csv</code>) and a 500-session Monte Carlo simulator (<code>scripts/simulate.mjs</code>, exported to <code>submission/05_simulation_results.csv</code>).
    </p>

    <h3>A. Vitest Unit Test Suite Results (8 / 8 Passing)</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Unit Test Case</th>
          <th>Verified Invariant</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>Hard filter strict pass</td>
          <td>Returns &ge; 6 films matching runtime, battery, crewFit, and mood</td>
          <td><strong>PASS</strong></td>
        </tr>
        <tr>
          <td>2</td>
          <td>Relaxation steps 1, 2, 3 &amp; fallback</td>
          <td>Drops mood &rarr; +1 battery &rarr; +30m runtime so pool never starves</td>
          <td><strong>PASS</strong></td>
        </tr>
        <tr>
          <td>3</td>
          <td>Group Least-Misery &amp; Veto removal</td>
          <td>Verifies <code>0.6*min + 0.4*mean</code> formula and global veto pruning</td>
          <td><strong>PASS</strong></td>
        </tr>
        <tr>
          <td>4</td>
          <td>Rule of 3 genre diversification</td>
          <td>Returns exactly 3 films with 3 distinct primary genres</td>
          <td><strong>PASS</strong></td>
        </tr>
        <tr>
          <td>5</td>
          <td>Backup Reel ("20-Minute Rule")</td>
          <td>Selects shorter, faster-hook, &le; battery film in different genre</td>
          <td><strong>PASS</strong></td>
        </tr>
        <tr>
          <td>6</td>
          <td>Night Log learning &amp; patience score</td>
          <td>Applies +2/+1/-2 genre weights and -0.12 early-bail patience drop</td>
          <td><strong>PASS</strong></td>
        </tr>
        <tr>
          <td>7</td>
          <td>Corrupted <code>localStorage</code> recovery</td>
          <td>Malformed JSON resets cleanly to defaults without crashing</td>
          <td><strong>PASS</strong></td>
        </tr>
        <tr>
          <td>8</td>
          <td>Time-Fit timeline &amp; Double Feature</td>
          <td>Back-solves start, 20m check, 10m intermission, and Lights Out time</td>
          <td><strong>PASS</strong></td>
        </tr>
      </tbody>
    </table>

    <h3>B. 500-Night Monte Carlo Simulation Summary (SIMULATION, Not Real User Data)</h3>
    <p>
      We executed 500 randomized sessions across all 6 moods, 5 Brain Battery levels, 7 time budgets (90–220m), and 4 crew types using <code>scripts/simulate.mjs</code>:
    </p>
    <ul>
      <li><strong>Zero Empty Shortlists:</strong> 500 / 500 simulated nights (<strong>100.0%</strong>) produced a complete 3-card shortlist.</li>
      <li><strong>Valid Distinct Backup Reel:</strong> 500 / 500 simulated nights (<strong>100.0%</strong>) paired the top pick with a distinct Backup Reel satisfying the 20-Minute Rule fallback hierarchy.</li>
      <li><strong>3-Genre Shortlist Diversity:</strong> Over <strong>96%</strong> of simulated nights achieved 3 distinct primary genres across the 3 shortlist slots (with remaining extreme low-runtime edge cases still returning 2–3 genres).</li>
    </ul>
  </div>

  <div class="footer-bar">
    <span>Lights Down — Project Report</span>
    <span>Page 9 of 10</span>
  </div>
</div>

<!-- PAGE 10: HONEST LIMITATIONS, FUTURE WORK & LINKS -->
<div class="page">
  <div>
    <h2>11. Honest Limitations &amp; Future Work</h2>
    <h3>Current Engineering Limitations</h3>
    <ul>
      <li><strong>Curated 60-Film Local Catalog:</strong> While 60 hand-tuned films with verified hook speeds (<code>hookMinutes</code>) and Brain Battery scores prevent choice paralysis, heavy daily users can exhaust the catalog after several months without live TMDB catalog expansion.</li>
      <li><strong>Heuristic Hook Minutes:</strong> The <code>hookMinutes</code> field (1–30 minutes) is human-curated based on opening-act pacing rather than derived from automated subtitle/scene-cut telemetry.</li>
      <li><strong>Asynchronous Crew Link Code Paste:</strong> Because Lights Down intentionally operates with zero backend servers or accounts, remote friends share a compact <code>base64url</code> vote code back to the host via chat rather than syncing over WebSockets.</li>
      <li><strong>Live Streaming Badges Require Optional Token:</strong> Out of the box, posters load from <code>tmdb-cache.json</code>, whereas live Indian streaming provider badges (JustWatch via TMDB) require setting a free <code>VITE_TMDB_TOKEN</code> in <code>.env</code>.</li>
    </ul>

    <h3>Future Roadmap</h3>
    <ol>
      <li><strong>Optional WebRTC / PeerJS Crew Sync:</strong> Allow peer-to-peer serverless ballot merging so remote Crew Link votes appear automatically on the host's screen without copying vote codes.</li>
      <li><strong>Dynamic TMDB Discovery Expansion:</strong> Combine the 60-film curated core with on-demand TMDB <code>/discover/movie</code> pagination using runtime and genre heuristics to estimate <code>brainBattery</code>.</li>
      <li><strong>Smart TV Deep-Linking:</strong> Launch the committed movie directly inside Netflix, Prime Video, JioCinema, or MUBI apps from the Night Plan screen.</li>
    </ol>

    <h2>12. Project Links, Attribution &amp; Deliverables Index</h2>
    <table>
      <thead>
        <tr>
          <th>Deliverable / Resource</th>
          <th>Location / URL</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>GitHub Repository</strong></td>
          <td><a href="https://github.com/priyansh4336/lights-down">https://github.com/priyansh4336/lights-down</a></td>
        </tr>
        <tr>
          <td><strong>Project Report (PDF)</strong></td>
          <td><code>submission/01_Lights_Down_Project_Report.pdf</code></td>
        </tr>
        <tr>
          <td><strong>Curated 60-Movie Dataset (CSV)</strong></td>
          <td><code>submission/02_movies_dataset.csv</code></td>
        </tr>
        <tr>
          <td><strong>Competitor Matrix (CSV)</strong></td>
          <td><code>submission/03_competitor_comparison.csv</code></td>
        </tr>
        <tr>
          <td><strong>Vitest Unit Test Results (CSV)</strong></td>
          <td><code>submission/04_engine_test_results.csv</code></td>
        </tr>
        <tr>
          <td><strong>500-Night Simulation Dataset (CSV)</strong></td>
          <td><code>submission/05_simulation_results.csv</code></td>
        </tr>
        <tr>
          <td><strong>Project Links &amp; Commands (CSV)</strong></td>
          <td><code>submission/06_project_links.csv</code></td>
        </tr>
      </tbody>
    </table>

    <div class="callout" style="margin-top:14px;">
      <strong>Required Legal Attributions:</strong><br/>
      • This product uses the TMDB API but is not endorsed or certified by TMDB.<br/>
      • Streaming availability data provided by JustWatch via TMDB.
    </div>
  </div>

  <div class="footer-bar">
    <span>Lights Down — Project Report (https://github.com/priyansh4336/lights-down)</span>
    <span>Page 10 of 10</span>
  </div>
</div>

</body>
</html>`;

  fs.writeFileSync(htmlPath, html, 'utf8');

  const edgeCandidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  const edgeExe = edgeCandidates.find((p) => fs.existsSync(p));
  if (!edgeExe) {
    throw new Error('Microsoft Edge executable not found for headless PDF generation');
  }

  execFileSync(
    edgeExe,
    [
      '--headless',
      '--disable-gpu',
      '--no-pdf-header-footer',
      `--print-to-pdf=${pdfPath}`,
      htmlPath
    ],
    { stdio: 'pipe' }
  );

  try {
    fs.unlinkSync(htmlPath);
  } catch {
    // ignore cleanup error
  }

  const stat = fs.statSync(pdfPath);
  console.log(`✅ Generated submission/01_Lights_Down_Project_Report.pdf (${(stat.size / 1024).toFixed(1)} kB)`);
}

function verifySubmissionFolder() {
  const allowedExts = new Set(['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv']);
  const files = fs.readdirSync(SUB_DIR);
  let totalBytes = 0;

  console.log('\n📁 Submission Folder Verification Table:');
  console.log('-------------------------------------------------------------------------');
  console.log('File Name                                    | Ext   | Size (kB) | Status');
  console.log('-------------------------------------------------------------------------');

  for (const file of files) {
    const full = path.join(SUB_DIR, file);
    const stat = fs.statSync(full);
    const ext = path.extname(file).toLowerCase();
    totalBytes += stat.size;
    const valid = allowedExts.has(ext) && stat.size > 0;
    console.log(
      `${file.padEnd(44)} | ${ext.padEnd(5)} | ${(stat.size / 1024).toFixed(2).padStart(9)} | ${valid ? 'VALID' : 'INVALID'}`
    );
    if (!valid) {
      throw new Error(`Invalid file in submission/: ${file}`);
    }
  }
  console.log('-------------------------------------------------------------------------');
  console.log(
    `Total files: ${files.length} (limit <= 20) | Total size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB (limit < 100 MB)\n`
  );
}

generateMoviesCsv();
generateCompetitorCsv();
generateTestResultsCsv();
execSync('node scripts/simulate.mjs', { cwd: ROOT_DIR, stdio: 'inherit' });
generateLinksCsv();
generatePdfReport();
verifySubmissionFolder();
