# Fork — Hackathon submission checklist

**Event:** [Mind the Product — Everyone Ships Now](https://mindtheproduct.devpost.com/)  
**Deadline:** Jun 20, 2026 @ 5:00pm BST  
**Prize eligibility:** New project (started on/after May 20), public deployed URL, **Novus.ai installed**, demo video, Novus dashboard screenshot.

Work through sections in order. Check boxes as you go.

---

## Readiness snapshot

| Area | Status |
|------|--------|
| App builds (`npm run build`) | ✅ |
| Core product (sim, decisions, share URL) | ✅ |
| Art assets (`public/assets/`, 15 PNGs) | ✅ |
| Git repo + GitHub (`shaileshdev4/fork`) | ✅ |
| Public deploy (Vercel) | ✅ |
| Novus.ai installed | ✅ |
| Novus usage + dashboard screenshot | ⬜ |
| Privacy page (Novus/Pendo) | ⬜ |
| Demo video (2–3 min) | ⬜ |
| Devpost submission | ⬜ |

**Verdict:** Fork is **almost submission-ready** — finish Novus screenshot, privacy page, demo video, then submit on Devpost.

---

## 1. GitHub & repository ✅

### 1.1 Local git setup

- [x] Add `.env` to `.gitignore`
- [x] Confirm `.gitignore` excludes `node_modules`, `.next`, `.env`, `.env.local`
- [x] Confirm `.env` and `.env.local` are **not** tracked (only `.env.example` is committed)
- [x] Initialize git in the `fork` folder
- [x] Verify `git status` does **not** list `.env`, `.env.local`, `node_modules`, or `.next`
- [x] 15 progressive commits on `main`

### 1.2 Create GitHub remote

- [x] Public repo: `shaileshdev4/fork`
- [x] Pushed to `origin/main`

### 1.3 Repo hygiene

- [x] README describes what Fork is and how to run locally
- [x] `.env.example` lists all env vars (no real keys)
- [x] No API keys in committed files
- [ ] Optional: add `LICENSE`

**Done when:** GitHub repo is public, pushed, and contains no secrets. ✅

---

## 2. Environment & API keys

Fork **works without keys** (typed input + bundled 2025 data + templated verdict). Keys unlock the full experience for judges.

- [x] Copy `.env.example` → `.env.local` locally
- [x] **Groq** (`GROQ_API_KEY`) — AI sentence parsing, narration, what-if
- [ ] **RentCast** (`RENTCAST_API_KEY`) — optional; bundled fallback exists
- [ ] Smoke test **production** with keys:
  - [ ] Onboarding: type or voice a decision sentence → parses into two paths
  - [ ] Persona setup → sim loads
  - [ ] Play / scrub timeline
  - [ ] Answer at least one interactive decision fork
  - [ ] View synthesis / verdict
  - [ ] Share URL copies and reloads state

**Done when:** Full AI path works on your live Vercel URL.

---

## 3. Deploy (public URL) ✅

- [x] Import GitHub repo into [Vercel](https://vercel.com)
- [x] Set environment variables in Vercel (`GROQ_API_KEY`, etc.)
- [x] Deploy succeeds
- [ ] Smoke test production (run through once on live URL):
  - [ ] Home / onboarding loads
  - [ ] Complete onboarding → persona → simulation
  - [ ] Images load (`/assets/city-austin.png`, etc.)
  - [ ] Play / pause / scrub works
  - [ ] Decision modal appears and choices affect outcome
  - [ ] Share URL works on production domain
  - [ ] AI parse + narrate work (if keys set)

**Done when:** Stable public URL ready for Devpost. ✅ (verify smoke test above)

---

## 4. Novus.ai (required for prizes)

> **You are here.** Novus is installed — generate usage and grab the screenshot.

- [x] Sign up for Novus
- [x] Connect Fork GitHub repo to Novus
- [x] Grant Novus permission to open PRs
- [x] Review Novus instrumentation PR → merge
- [x] Redeploy Vercel after merge
- [ ] Generate real usage on **production** (you + 1–2 friends):
  - [ ] Land on `/`
  - [ ] Complete onboarding (voice or text)
  - [ ] Set persona
  - [ ] Play simulation for 2+ minutes
  - [ ] Answer at least one decision fork
  - [ ] Open cost breakdown / profile panel
  - [ ] Copy share link
- [ ] Open Novus dashboard — confirm events/flows appear
- [ ] **Screenshot Novus dashboard** (required for Devpost submission)

**Tip for demo:** Likely drop-off at **onboarding → sim** — mention that insight in your video.

**Done when:** Novus dashboard screenshot saved.

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
  - **Learnings:** What you learned shipping it
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
| GitHub | `shaileshdev4/fork` |
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

_Last updated: GitHub pushed, Vercel deployed, Novus installed._
