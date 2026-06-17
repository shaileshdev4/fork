# Fork - live the decision before you make it

Say one sentence - _"I might move from Toronto to Austin for a job paying $140k"_ - and Fork builds **both futures with your real numbers**, lets you **live them month by month** (payday, rent, the surprises real life throws), and gives you a **decision-grade verdict**. Not a cost-of-living index. Your actual lives, side by side, before you choose.

**Built for World Product Day: "Everyone Ships Now."**

## What makes it different

- **Personal, not generic.** You don't compare a canned example - you describe _your_ fork (voice or text), and the AI turns it into your two lives.
- **Real & sourced.** Validated 2025 tax (US IRS + Canada CRA, federal + state/province + FICA/CPP/EI), live market rent (RentCast), per-category costs - each number shows its source. Trust comes from transparency, not a hidden multiplier.
- **Lived, not calculated.** Press play; a character in each home, a savings balance ticking, a runway meter that drains when a shock lands. You _watch_ the bigger paycheck lose to the cheaper city.
- **AI where it helps.** Parsing your sentence, narrating your specific result, scaling life-events to your income. The math stays deterministic; AI does understanding and storytelling - never invents a number.

## Interactive decisions (the "steer it" layer)

The outcome isn't set by salary - it's set by how you respond to what life throws at you. The simulation pauses at forks and asks you to choose, in your actual situation:

- **Settling in** - roommate vs your own place vs splurge; how to furnish.
- **The first shock** - your car dies: cheap used, finance a reliable one, or (transit cities only) go car-free.
- **An opportunity** - a raise with longer hours, a risky side gig, or protect your time.
- **Lifestyle creep** - enjoy the extra room, balance, or hold the line.
- **A real-life cost** - a wedding + family need: show up, do what you can, or sit it out.

Each option trades money against time, comfort, security, or values - there's no "right" answer. Crucially, **the same fork plays differently in each city**: the roommate choice saves far more in San Francisco than in Austin, so you _feel_ how much housing dominates an expensive city. Choices compound - skipping a cushion early bites when a shock lands later.

## Architecture (a platform, built to extend)

```
Voice/text → /api/parse (Groq/Llama)     sentence → structured fork
           → data layer                  tax engine (per country) + /api/rent (RentCast, cached, fallback)
           → simulate()                  pure month-by-month engine
           → diorama renderer            generated isometric art + live SVG layer (Motion)
           → /api/narrate (Groq/Llama)   plain-language personalized verdict
```

- `src/lib/countries/` - one module per country (US, CA). Adding a country = adding a module; engine + UI unchanged.
- `src/lib/simulation.ts` - scenario-agnostic time-stepped engine.
- `src/lib/data/` - city cost layer with bundled 2025 snapshot + provenance.
- `src/app/api/` - parse, narrate, rent (all server-side; all degrade gracefully).
- `src/components/` - Onboarding (voice+text), Lane (living diorama), ProfilePanel (inline personalization), EventCard, Verdict.

## Run

```bash
npm install
cp .env.example .env.local   # add keys to unlock voice/AI/live-rent (optional)
npm run dev
npm run build && npm start
```

**Works without keys** (typed input + bundled 2025 data + templated verdict) so it never breaks in a demo. **With keys**, it upgrades to AI parsing, live rent, and AI narration.

## Deploy (Vercel)

Push to GitHub → import at vercel.com/new → add `GROQ_API_KEY` (and optional `RENTCAST_API_KEY`) in project settings → deploy.

## Novus (required for submission)

Connect the repo early, approve the instrumentation PR. The app is interaction-rich - voice onboarding, play/scrub, per-lane sliders, cost expanders, city swaps, share - so Novus captures real behavior. Likely drop-off to surface in the demo: the onboarding-to-sim transition.

## Data validated

- **US:** 2025 IRS federal + state brackets, FICA. Cross-checked against published take-home calculators.
- **Canada:** 2025 CRA federal (blended 14.5% lowest), provincial (ON/BC/AB/QC), CPP + EI. Cross-checked against Talent.com.
- **Rent:** RentCast live (US) + 2025 metro snapshot fallback. Costs: per-category, sourced, user-overridable.

An estimate to compare options - not financial advice.

## What I learned shipping it

The realism isn't fidelity - it's cohesion (one locked art style) plus a _real_ engine underneath. And the trust isn't precision - it's showing every source and letting the user correct any number. Going 2 countries deep beats 5 shallow: a number a judge can't poke a hole in is worth more than breadth.
