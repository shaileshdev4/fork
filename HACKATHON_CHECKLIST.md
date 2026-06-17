# Fork — Hackathon submission checklist

**Event:** [Mind the Product — Everyone Ships Now](https://mindtheproduct.devpost.com/)  
**Deadline:** Jun 20, 2026 @ 5:00pm BST  
**Prize eligibility:** New project (started on/after May 20), public deployed URL, **Novus.ai installed**, demo video, Novus dashboard screenshot.

Work through sections in order. Check boxes as you go.

---

## Readiness snapshot (as of checklist creation)

| Area | Status |
|------|--------|
| App builds (`npm run build`) | ✅ Passes |
| Core product (sim, decisions, share URL) | ✅ Implemented |
| Art assets (`public/assets/`, 15 PNGs) | ✅ Present |
| Git repo + GitHub | ❌ Not initialized |
| Public deploy (Vercel URL) | ❌ Not deployed |
| Novus.ai | ❌ Not installed |
| Demo video | ❌ Not recorded |
| Devpost submission | ❌ Not submitted |

**Verdict:** Fork is **not submission-ready yet** — the product works locally, but hackathon requirements (live URL, Novus, video, Devpost) are still open.

---

## 1. GitHub & repository

> **You are here.** Fork is not a git repo yet — complete this section first.

### 1.1 Local git setup

- [ ] Add `.env` to `.gitignore` (currently only `.env*.local` is ignored — `.env` can leak keys)
- [ ] Confirm `.gitignore` excludes `node_modules`, `.next`, `.env`, `.env.local`
- [ ] Confirm `.env` and `.env.local` are **not** tracked (only `.env.example` is committed)
- [ ] Initialize git in the `fork` folder:
  ```bash
  cd fork-decision-simulator/fork
  git init
  git add .
  git status
  ```
- [ ] Verify `git status` does **not** list `.env`, `.env.local`, `node_modules`, or `.next`
- [ ] First commit:
  ```bash
  git commit -m "Initial commit: Fork decision simulator"
  ```

### 1.2 Create GitHub remote

- [ ] Create a new **public** repo on GitHub (e.g. `fork` or `fork-decision-simulator`)
- [ ] Do **not** add a README/license on GitHub if you already have a local README (avoid merge conflicts)
- [ ] Add remote and push:
  ```bash
  git branch -M main
  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
  git push -u origin main
  ```
- [ ] Open the repo on GitHub and confirm source files are visible (no `.env`)

### 1.3 Repo hygiene (before judges / Novus)

- [ ] README describes what Fork is and how to run locally
- [ ] `.env.example` lists all env vars (no real keys)
- [ ] No `GROQ_API_KEY` or `RENTCAST_API_KEY` in committed files
- [ ] Optional: add `LICENSE` if you want open source

**Done when:** GitHub repo is public, pushed, and contains no secrets.

---

## 2. Environment & API keys (optional but recommended for demo)

Fork **works without keys** (typed input + bundled 2025 data + templated verdict). Keys unlock the full experience for judges.

- [ ] Copy `.env.example` → `.env.local` locally
- [ ] **Groq** (`GROQ_API_KEY`) — AI sentence parsing, narration, what-if
  - Get key: https://console.groq.com/keys
- [ ] **RentCast** (`RENTCAST_API_KEY`) — live US rent lookup (optional; has bundled fallback)
  - Get key: https://app.rentcast.io/app/api
- [ ] Smoke test locally with keys:
  - [ ] Onboarding: type or voice a decision sentence → parses into two paths
  - [ ] Persona setup → sim loads
  - [ ] Play / scrub timeline
  - [ ] Answer at least one interactive decision fork
  - [ ] View synthesis / verdict
  - [ ] Share URL copies and reloads state

**Done when:** Full AI path works locally (or you accept demoing without keys).

---

## 3. Deploy (public URL)

Hackathon requires a **clickable live URL** — not “clone and run locally.”

- [ ] Import GitHub repo into [Vercel](https://vercel.com)
- [ ] Set environment variables in Vercel (from `.env.example`):
  - `GROQ_API_KEY` (recommended for demo)
  - `GROQ_MODEL` (optional, default `llama-3.3-70b-versatile`)
  - `RENTCAST_API_KEY` (optional)
- [ ] Deploy succeeds (`npm run build` passes on Vercel)
- [ ] Smoke test production:
  - [ ] Home / onboarding loads
  - [ ] Complete onboarding → persona → simulation
  - [ ] Images load (`/assets/city-austin.png`, etc.)
  - [ ] Play / pause / scrub works
  - [ ] Decision modal appears and choices affect outcome
  - [ ] Share URL works on production domain
  - [ ] AI parse + narrate work (if keys set)

**Done when:** You have a stable public URL to put on Devpost.

---

## 4. Novus.ai (required for prizes)

[Novus](https://www.novus.ai/) auto-instruments your app from the GitHub repo. Sign up: [novus.pendo.io](https://novus.pendo.io).

- [ ] Sign up for Novus (free open beta)
- [ ] Connect the **Fork GitHub repo** to Novus
- [ ] Grant Novus permission to open PRs on the repo
- [ ] Review Novus instrumentation PR → merge
- [ ] Redeploy Vercel after merge
- [ ] Generate real usage on production (you + 1–2 friends):
  - [ ] Land on `/`
  - [ ] Complete onboarding (voice or text)
  - [ ] Set persona
  - [ ] Play simulation for 2+ minutes
  - [ ] Answer at least one decision fork
  - [ ] Open cost breakdown / profile panel
  - [ ] Copy share link
- [ ] Open Novus dashboard — confirm events/flows appear
- [ ] **Screenshot Novus dashboard** (required for Devpost submission)

**Tip for demo:** Novus README notes likely drop-off at **onboarding → sim** — instrument and mention that insight in your video.

**Done when:** Novus is installed on deployed app and dashboard shows behavior.

---

## 5. Privacy & compliance

Novus/Pendo collects behavioral analytics — users should be informed.

- [ ] Add a `/privacy` page (or footer link) mentioning product analytics (Novus/Pendo)
- [ ] If using voice input, note microphone usage in privacy copy
- [ ] Confirm no API keys are exposed client-side

**Done when:** Privacy page reflects analytics; production is safe to share publicly.

---

## 6. Demo & polish

- [ ] Favicon / app icon (optional but nice for Devpost thumbnail)
- [ ] Record **2–3 minute demo video** (YouTube, Vimeo, or Loom — public or unlisted)
  - [ ] Hook: “You have two job offers — which life wins?”
  - [ ] Show sentence input → two futures side by side
  - [ ] Play month-by-month; show a shock event + decision choice
  - [ ] Show verdict / synthesis with real numbers
  - [ ] Optional: 30s showing one Novus insight (e.g. onboarding drop-off)
- [ ] Write short project description:
  - **What:** Fork — live the decision before you make it
  - **Who:** Anyone facing a real fork (move, job offer, city change)
  - **Tools:** Cursor, Next.js 15, TypeScript, Motion, Groq, RentCast
  - **Learnings:** What you learned shipping it (cohesion, sourced numbers, interactive decisions)
- [ ] Optional: post progress with `#EveryoneShipsNow` and tag @MindTheProduct

**Done when:** Video URL ready; description drafted.

---

## 7. Devpost submission

Submit at [mindtheproduct.devpost.com](https://mindtheproduct.devpost.com/) before **Jun 20, 2026 @ 5:00pm BST**.

- [ ] **Public URL** to deployed Fork
- [ ] **Demo video** link (2–3 min)
- [ ] **Novus dashboard screenshot** (installed + tracking)
- [ ] **Written description** (what / who / tools / learnings)
- [ ] Confirm project started on or after **May 20, 2026**
- [ ] Optional: LinkedIn / blog link showing build journey

**Done when:** Submission is live on Devpost.

---

## Quick reference

| Item | Location |
|------|----------|
| Product name | **Fork** (package: `financial-fork-simulator`) |
| Env template | `.env.example` |
| Art assets | `public/assets/` (15 PNGs) |
| API routes | `src/app/api/parse`, `narrate`, `rent`, `whatif` |
| Novus signup | https://novus.pendo.io |
| Hackathon rules | https://mindtheproduct.devpost.com/ |
| Sibling project checklist | `tally/HACKATHON_CHECKLIST.md` |

---

## Judging criteria (what to optimize for)

| Criterion | Weight | Fork angle |
|-----------|--------|------------|
| Product thinking | 25% | Real problem: life forks are gut-feel; Fork makes consequences visible |
| Craft & execution | 25% | End-to-end sim, interactive decisions, sourced tax/rent data, diorama UI |
| Originality & ambition | 25% | “Live both futures” vs static COL calculators; life-stage-aware decision deck |
| Shippedness | 25% | Live URL + Novus measurable behavior (onboarding → sim is key funnel) |

---

*Last updated: checklist created — start with section 1 (GitHub).*
