# 🎬 LIGHTS DOWN — The 90-Second Decision-to-Action Film Engine

Most movie pickers fail because people spend **40 minutes scrolling** and then **bail 20 minutes into the film**. **Lights Down** is a midnight projection-booth engine that takes you (or a 1–4 person crew on one device) from *"I don't know what to watch"* to *"lights are down, film is playing"* in under **90 seconds**—complete with a pre-loaded **Backup Reel** in case tonight's pick is a dud.

## 🚀 How to Run

From the project root:

```bash
npm install && npm run dev
```

Then open **http://localhost:5173** in your browser.

To test the production bundle:

```bash
npm run build
```

---

## ⚡ Why Lights Down Is Different (SOP & POS Architecture)

### 1. Standard Operating Pillars (SOP)
1. **Backup Reel ("The 20-Minute Rule")**: Every pick ships with an automatically selected Plan B that is shorter, has a faster hook (`hookMinutes`), demands equal or lower brain battery, and pivots to a different primary genre. A **Slide to Bail** control on the Night Plan swaps reels immediately and logs a 20-minute bail signal.
2. **Time-Fit & Double Feature Back-Solver**: Tell the booth how much time you have. It adds 10 minutes of snack/settling buffer, back-solves your exact **"Lights Out By HH:MM"** schedule, and unlocks a **Double Feature + 10-min Intermission** when your budget is 200+ minutes.
3. **Brain Battery (1–5)**: Instead of interrogating you about 20 genres when you're exhausted, Lights Down asks how much mental focus you have left (`1 = Dead Battery comfort watch` to `5 = Full Cinema Brain`) and weights fast-hook films (`hookMinutes`) accordingly.
4. **Group "Hot Seat" + Least-Misery + Veto Tokens**: For crews of 2–4 on a single phone, pass-the-device rounds collect private votes and rank films by **Least-Misery** (`0.6 * min + 0.4 * mean`—nobody being miserable beats average happiness). Every player gets **1 Veto Token** on the shortlist.
5. **Commit Ritual (Tear the Stub)**: Analysis paralysis ends when you physically tear the perforated ticket stub, triggering a 90-second settling-in countdown.
6. **Regret-Aware Night Log & Patience Score**: Logging an outcome as **Loved** (`+2` genre weight), **Finished** (`+1`), or **Bailed** (`-2` + lowers your **Hook Patience** index if bailed within 20 minutes) continuously adapts future recommendations in `localStorage`.

### 2. Platform Operating System (POS Pipeline in `src/utils/engine.js`)
`Vibe -> Brain Battery -> Time Budget -> Crew -> Hard Filter (with graceful relaxation) -> Multi-factor Score -> Group Least-Misery -> Genre-Diversified Rule of 3 Shortlist -> Veto/Commit -> Night Plan (Pick + Backup + Timeline) -> Night Log Learning.`
