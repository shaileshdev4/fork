"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { track } from "@/lib/analytics";
import type { LifeProfile } from "@/lib/profile";
import { formatSalaryShort } from "@/lib/profile";
import { resolveCityMeta } from "@/lib/data/cityData";
import type { Persona } from "@/lib/persona";
import { DEFAULT_PERSONA } from "@/lib/persona";
import { simulate, type Choices } from "@/lib/simulation";
import { deckFor } from "@/lib/decisions";
import { synthesize } from "@/lib/synthesis";
import {
  DEFAULT_A,
  DEFAULT_B,
  DEFAULT_HORIZON,
  THEME_A,
  THEME_B,
  profileFromCity,
  scaleToHousehold,
  encodeRun,
  decodeRun,
} from "@/lib/scenario";
import Onboarding from "@/components/Onboarding";
import PersonaSetup from "@/components/PersonaSetup";
import Lane from "@/components/Lane";
import DecisionModal from "@/components/DecisionModal";
import ProfilePanel from "@/components/ProfilePanel";
import SynthesisPanel from "@/components/SynthesisPanel";
import TrustPanel from "@/components/TrustPanel";
import StressBar from "@/components/StressBar";
import StressHitBanner from "@/components/StressHitBanner";
import ShareCard from "@/components/ShareCard";
import { Logo } from "@/components/Logo";
import type { Perturbation } from "@/lib/stress";
import { normalizePerturbation, stressAtMonth } from "@/lib/stress";
import { saveRun, loadRun, clearRun, type SavedRun } from "@/lib/persistence";
import {
  sfx,
  setSoundEnabled,
  setAmbientEnabled,
  flashEventKind,
} from "@/lib/sound";
import { trackPendo } from "@/lib/pendo";

type Phase = "onboarding" | "persona" | "sim";

type StressSnapshot = {
  choicesA: Choices;
  choicesB: Choices;
  month: number;
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>("onboarding");
  const [parsing, setParsing] = useState(false);
  const [persona, setPersona] = useState<Persona>(DEFAULT_PERSONA);
  const [a, setA] = useState<LifeProfile>(DEFAULT_A);
  const [b, setB] = useState<LifeProfile>(DEFAULT_B);
  const [horizon] = useState(DEFAULT_HORIZON);
  const [month, setMonth] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [choicesA, setChoicesA] = useState<Choices>({});
  const [choicesB, setChoicesB] = useState<Choices>({});
  const [activeDecision, setActiveDecision] = useState<{
    lane: "A" | "B";
    decisionId: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [narration, setNarration] = useState("");
  const [stress, setStress] = useState<Perturbation>({ kind: "none" });
  const [showCard, setShowCard] = useState(false);
  const [sound, setSound] = useState(false);
  const pendingText = useRef<string>("");
  const [resumable, setResumable] = useState<SavedRun | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const preStress = useRef<StressSnapshot | null>(null);
  const lastStressHitMonth = useRef(0);

  useEffect(() => {
    const r = decodeRun(window.location.search);
    if (r) {
      setA(r.a);
      setB(r.b);
      setPhase("sim");
      track("shared_run_loaded", { cityA: r.a.city, cityB: r.b.city });
      return;
    }
    const saved = loadRun();
    if (saved) setResumable(saved);
  }, []);

  const resume = useCallback(() => {
    if (!resumable) return;
    track("session_resumed", {
      cityA: resumable.a.city,
      cityB: resumable.b.city,
      savedMinsAgo: Math.round((Date.now() - resumable.savedAt) / 60000),
    });
    setA(resumable.a);
    setB(resumable.b);
    setPersona(resumable.persona);
    setChoicesA(resumable.choicesA);
    setChoicesB(resumable.choicesB);
    setMonth(1);
    setPhase("sim");
    setResumable(null);
  }, [resumable]);

  useEffect(() => {
    if (phase === "sim") saveRun({ a, b, persona, choicesA, choicesB });
  }, [phase, a, b, persona, choicesA, choicesB]);

  const lifeA = useMemo(
    () => simulate(a, persona, choicesA, horizon, stress, "play"),
    [a, persona, choicesA, horizon, stress],
  );
  const lifeB = useMemo(
    () => simulate(b, persona, choicesB, horizon, stress, "play"),
    [b, persona, choicesB, horizon, stress],
  );
  const lifeAProbe = useMemo(
    () =>
      stress.kind === "none"
        ? lifeA
        : simulate(a, persona, choicesA, horizon, stress, "probe"),
    [a, persona, choicesA, horizon, stress, lifeA],
  );
  const lifeBProbe = useMemo(
    () =>
      stress.kind === "none"
        ? lifeB
        : simulate(b, persona, choicesB, horizon, stress, "probe"),
    [b, persona, choicesB, horizon, stress, lifeB],
  );
  const synthesis = useMemo(
    () => synthesize(a, b, lifeAProbe, lifeBProbe, persona),
    [a, b, lifeAProbe, lifeBProbe, persona],
  );

  // Keep simStateRef current so the setInterval closure can read the latest values.
  useEffect(() => {
    simStateRef.current = { a, b, lifeA, lifeB, synthesis, persona };
  }, [a, b, lifeA, lifeB, synthesis, persona]);

  const stateA =
    lifeA.months[Math.min(month, lifeA.months.length) - 1] ?? lifeA.months[0];
  const stateB =
    lifeB.months[Math.min(month, lifeB.months.length) - 1] ?? lifeB.months[0];
  const winnerNow =
    stateA && stateB ? (stateA.balance >= stateB.balance ? "A" : "B") : "A";

  useEffect(() => {
    if (phase !== "sim" || activeDecision) return;
    const pa = lifeA.months[lifeA.months.length - 1]?.pendingDecision;
    const pb = lifeB.months[lifeB.months.length - 1]?.pendingDecision;
    if (pa && month >= pa.month) {
      setPlaying(false);
      if (sound) sfx.decision();
      setActiveDecision({ lane: "A", decisionId: pa.id });
    } else if (pb && month >= pb.month) {
      setPlaying(false);
      if (sound) sfx.decision();
      setActiveDecision({ lane: "B", decisionId: pb.id });
    }
  }, [phase, month, lifeA.months, lifeB.months, activeDecision, sound]);

  const handleChoose = useCallback(
    (optionId: string) => {
      if (!activeDecision) return;
      const { lane, decisionId } = activeDecision;
      const decision = deckFor(persona.stage).find((d) => d.id === decisionId);
      track("life_decision_made", {
        decisionId,
        lane,
        optionId,
        chapter: decision?.chapter,
        lifeStage: persona.stage,
        cityA: a.city,
        cityB: b.city,
      });
      if (lane === "A") setChoicesA((c) => ({ ...c, [decisionId]: optionId }));
      else setChoicesB((c) => ({ ...c, [decisionId]: optionId }));
      if (sound) sfx.confirm();
      trackPendo("fork_decision_made", {
        lane,
        decision_id: decisionId,
        option_id: optionId,
      });
      setActiveDecision(null);
    },
    [activeDecision, sound],
  );

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setMonth((m) => {
        if (m >= horizon) {
          setPlaying(false);
          const s = simStateRef.current;
          track("simulation_completed", {
            cityA: s.a?.city,
            cityB: s.b?.city,
            lifeStage: s.persona?.stage,
            finalBalanceA: s.lifeA?.finalBalance,
            finalBalanceB: s.lifeB?.finalBalance,
            recommendation: s.synthesis?.recommendation,
          });
          return m;
        }
        if (sound) sfx.tick();
        return m + 1;
      });
    }, 420);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, horizon, sound]);

  // Onboarding sentence -> parse (store, then go to persona step)
  const handleOnboard = useCallback(async (text: string) => {
    setParsing(true);
    pendingText.current = text;
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const p = await res.json();
      const cr = (city: string) => resolveCityMeta(city);
      const ca = cr(p.optionA.city),
        cb = cr(p.optionB.city);
      const defaultSalary = (country: typeof ca.country) =>
        country === "IN" ? 2500000 : 130000;
      let pa = profileFromCity(
        p.optionA.label || p.optionA.city,
        ca.country,
        p.optionA.city,
        ca.region,
        p.optionA.salary || defaultSalary(ca.country),
        0.55,
      );
      let pb = profileFromCity(
        p.optionB.label || p.optionB.city,
        cb.country,
        p.optionB.city,
        cb.region,
        p.optionB.salary || (cb.country === "IN" ? 1800000 : 160000),
        0.5,
      );
      await Promise.all(
        [pa, pb].map(async (pr) => {
          try {
            const rr = await fetch(
              `/api/rent?city=${encodeURIComponent(pr.city)}&region=${pr.region}&country=${pr.country}`,
            );
            if (rr.ok) {
              const d = await rr.json();
              pr.rentMonthly = d.rentMonthly;
              pr.rentSource = d.rentSource;
            }
          } catch {}
        }),
      );
      setA(pa);
      setB(pb);
      track("decision_sentence_submitted", {
        cityA: p.optionA.city,
        cityB: p.optionB.city,
        salaryA: p.optionA.salary,
        salaryB: p.optionB.salary,
        inputLength: text.length,
        aiParsed: res.ok,
      });
      setPhase("persona");
      trackPendo("onboarding_parsed", {
        city_a: pa.city,
        city_b: pb.city,
        country_a: pa.country,
        country_b: pb.country,
      });
    } catch {
      setPhase("persona");
    } finally {
      setParsing(false);
    }
  }, []);

  // Persona chosen -> scale costs to household -> enter sim
  const handlePersona = useCallback((pp: Persona) => {
    setPersona(pp);
    setA((prev) => scaleToHousehold(prev, pp));
    setB((prev) => scaleToHousehold(prev, pp));
    setChoicesA({});
    setChoicesB({});
    setMonth(1);
    setStress({ kind: "none" });
    preStress.current = null;
    setActiveDecision(null);
    setPhase("sim");
    trackPendo("persona_selected", {
      stage: pp.stage,
      kids: pp.kids,
      top_value: pp.values[0],
    });
  }, []);

  // AI narration of the synthesis (speaks to their values)
  useEffect(() => {
    if (phase !== "sim" || !stateA || !stateB) return;
    const id = setTimeout(async () => {
      const housing = Math.abs(a.rentMonthly - b.rentMonthly);
      const sal = Math.abs(a.salary - b.salary) / 12;
      const driver = housing >= sal ? "housing" : "salary";
      try {
        const res = await fetch("/api/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aLabel: a.label,
            bLabel: b.label,
            aLeftover: stateA.leftover,
            bLeftover: stateB.leftover,
            aFinal: lifeA.finalBalance,
            bFinal: lifeB.finalBalance,
            aMinRunway: lifeA.minRunway,
            bMinRunway: lifeB.minRunway,
            currency: a.currency,
            topDriver: driver,
            topValue: persona.values[0],
            recommendation: synthesis.recommendation,
          }),
        });
        const d = await res.json();
        if (d.text) {
          setNarration(d.text);
          track("ai_narration_generated", {
            cityA: a.label,
            cityB: b.label,
            topValue: persona.values[0],
            recommendation: synthesis.recommendation,
          });
        }
      } catch {}
    }, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    phase,
    a,
    b,
    lifeA.finalBalance,
    lifeB.finalBalance,
    choicesA,
    choicesB,
    persona,
  ]);

  const beginStressReplay = useCallback(
    (p: Perturbation) => {
      setStress((cur) => {
        if (cur.kind === "none") {
          preStress.current = { choicesA, choicesB, month };
        }
        return p;
      });
      setChoicesA({});
      setChoicesB({});
      setMonth(1);
      setActiveDecision(null);
      setPlaying(false);
      lastFlashMonth.current = 0;
      lastStressHitMonth.current = 0;
      trackPendo("stress_test_applied", {
        kind: p.kind,
        at_month: "atMonth" in p ? p.atMonth : null,
      });
    },
    [choicesA, choicesB, month],
  );

  const clearStress = useCallback(() => {
    const snap = preStress.current;
    if (snap) {
      setChoicesA(snap.choicesA);
      setChoicesB(snap.choicesB);
      setMonth(snap.month);
      preStress.current = null;
    }
    setStress({ kind: "none" });
    setActiveDecision(null);
    setPlaying(false);
    lastFlashMonth.current = 0;
    lastStressHitMonth.current = 0;
  }, []);

  const restartRun = useCallback(() => {
    setPlaying(false);
    setMonth(1);
    setChoicesA({});
    setChoicesB({});
    setActiveDecision(null);
    lastFlashMonth.current = 0;
    lastStressHitMonth.current = 0;
  }, []);

  const askWhatIf = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/whatif", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const p = normalizePerturbation(await res.json());
        if (p) {
          beginStressReplay(p);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [beginStressReplay],
  );

  const toggleSound = useCallback(() => {
    setSound((on) => {
      const next = !on;
      setSoundEnabled(next);
      setAmbientEnabled(next);
      if (next) sfx.confirm();
      return next;
    });
  }, []);

  const lastFlashMonth = useRef(0);
  const verdictPlayed = useRef(false);

  useEffect(() => {
    if (month < horizon) verdictPlayed.current = false;
  }, [month, horizon]);

  useEffect(() => {
    if (phase !== "sim" || !sound || month < horizon) return;
    if (!verdictPlayed.current) {
      verdictPlayed.current = true;
      sfx.verdict();
    }
  }, [phase, month, horizon, sound]);

  useEffect(() => {
    if (!sound || stress.kind === "none") return;
    const hitMonth = stressAtMonth(stress);
    if (
      hitMonth &&
      month === hitMonth &&
      month !== lastStressHitMonth.current
    ) {
      lastStressHitMonth.current = month;
      sfx.negative();
    }
  }, [month, sound, stress]);

  useEffect(() => {
    if (!sound || !playing) return;
    if (stateA?.stressHit || stateB?.stressHit) return;
    const flash = stateA?.flash || stateB?.flash;
    if (!flash || month === lastFlashMonth.current) return;
    lastFlashMonth.current = month;

    const eventKind = flashEventKind(flash);
    if (eventKind === "car") {
      sfx.eventCar();
      return;
    }
    if (eventKind === "medical") {
      sfx.eventMedical();
      return;
    }

    const celebrating =
      stateA?.mood === "celebrating" || stateB?.mood === "celebrating";
    const stressed =
      stateA?.mood === "stressed" || stateB?.mood === "stressed";
    if (celebrating) sfx.celebrate();
    else if (stressed) sfx.negative();
  }, [month, sound, playing, stateA, stateB]);

  const share = useCallback(() => {
    const qs = encodeRun(a, b, horizon);
    const url = `${window.location.origin}${window.location.pathname}?${qs}`;
    window.history.replaceState(null, "", `?${qs}`);
    navigator.clipboard?.writeText(url);
    track("share_link_copied", {
      cityA: a.city,
      cityB: b.city,
      recommendation: synthesis.recommendation,
    });
    setCopied(true);
    trackPendo("share_link_copied", { city_a: a.city, city_b: b.city });
    setTimeout(() => setCopied(false), 1800);
  }, [a, b, horizon, synthesis.recommendation]);

  if (phase === "onboarding")
    return (
      <Onboarding
        onSubmit={handleOnboard}
        loading={parsing}
        resumable={resumable}
        onResume={resume}
        onDismissResume={() => {
          track("session_dismissed", {});
          clearRun();
          setResumable(null);
        }}
      />
    );
  if (phase === "persona") return <PersonaSetup onDone={handlePersona} />;

  const yearLabel = (month / 12).toFixed(month % 12 === 0 ? 0 : 1);
  const sameCurrency = a.currency === b.currency;
  const totalForks = deckFor(persona.stage).length * 2;
  const answered = Object.keys(choicesA).length + Object.keys(choicesB).length;

  const activeProfile = activeDecision?.lane === "A" ? a : b;
  const activeTheme = activeDecision?.lane === "A" ? THEME_A : THEME_B;
  const activeDecisionObj = activeDecision
    ? deckFor(persona.stage).find((d) => d.id === activeDecision.decisionId)
    : null;

  const stressMonth = stressAtMonth(stress);
  const stressFlashNow = stateA?.stressHit || stateB?.stressHit;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Logo
            variant="eyebrow"
            size={18}
            accentA={THEME_A.accent}
            accentB={THEME_B.accent}
            className="mb-2"
          />
          <h1 className="font-display text-2xl md:text-3xl leading-tight text-ink">
            {a.city} vs {b.city}: live both, then choose.
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0 mt-1">
          <button
            onClick={toggleSound}
            aria-label={sound ? "Mute sound" : "Enable sound"}
            title={sound ? "Sound on" : "Sound off"}
            className="text-muted hover:text-ink"
          >
            {sound ? (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2.5L4.5 5.5H2v5h2.5L8 13.5v-11z" />
                <path
                  d="M10.5 5.5a3 3 0 0 1 0 5M12.5 3.5a6 6 0 0 1 0 9"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2.5L4.5 5.5H2v5h2.5L8 13.5v-11z" />
                <path
                  d="M11 6l3 3M14 6l-3 3"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>
            )}
          </button>
          <button
            onClick={() => {
              setPhase("onboarding");
              setNarration("");
            }}
            className="text-xs text-muted hover:text-ink underline underline-offset-4"
          >
            New decision
          </button>
        </div>
      </header>

      {persona.current && (
        <p className="text-xs text-muted mb-3 rounded-lg bg-paper border border-line px-3 py-2">
          Comparing against your life today in{" "}
          <b className="text-ink">{persona.current.city}</b> (rent{" "}
          {persona.current.rentMonthly.toLocaleString("en-US", {
            style: "currency",
            currency: a.currency,
            maximumFractionDigits: 0,
          })}
          /mo). {a.label} rent is{" "}
          {a.rentMonthly > persona.current.rentMonthly ? "higher" : "lower"} by{" "}
          {Math.abs(a.rentMonthly - persona.current.rentMonthly).toLocaleString(
            "en-US",
            {
              style: "currency",
              currency: a.currency,
              maximumFractionDigits: 0,
            },
          )}
          ; {b.label} by{" "}
          {Math.abs(b.rentMonthly - persona.current.rentMonthly).toLocaleString(
            "en-US",
            {
              style: "currency",
              currency: b.currency,
              maximumFractionDigits: 0,
            },
          )}
          .
        </p>
      )}

      {!sameCurrency && (
        <p className="text-xs text-muted mb-3 rounded-lg bg-pathAsoft/40 px-3 py-2">
          {a.label} is in {a.currency}, {b.label} in {b.currency} - shown in
          each currency; convert before comparing totals.
        </p>
      )}

      <div className="space-y-3">
        <Lane
          theme={THEME_A}
          label={`${a.label} · ${formatSalaryShort(a.salary, a.currency)}`}
          cityLabel={a.city}
          currency={a.currency}
          state={stateA}
          comfortable={
            a.currency === "INR" ? a.rentMonthly > 25000 : a.rentMonthly > 2200
          }
          isWinner={winnerNow === "A"}
        />
        <Lane
          theme={THEME_B}
          label={`${b.label} · ${formatSalaryShort(b.salary, b.currency)}`}
          cityLabel={b.city}
          currency={b.currency}
          state={stateB}
          comfortable={
            b.currency === "INR" ? b.rentMonthly > 25000 : b.rentMonthly > 2200
          }
          isWinner={winnerNow === "B"}
        />
      </div>

      {stress.kind !== "none" && (
        <StressHitBanner stress={stress} month={month} />
      )}

      <div className="mt-5 rounded-xl border border-line bg-paper p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const atEnd = month >= horizon;
              if (atEnd) setMonth(1);
              setPlaying((p) => {
                if (!p) {
                  track("simulation_playback_started", {
                    cityA: a.city,
                    cityB: b.city,
                    lifeStage: persona.stage,
                    month: atEnd ? 1 : month,
                    isRestart: atEnd,
                  });
                }
                return !p;
              });
            }}
            className="rounded-full bg-ink text-paper w-11 h-11 flex items-center justify-center hover:opacity-90 shrink-0"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <rect x="3" y="2" width="4" height="12" rx="1" />
                <rect x="9" y="2" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M4 2.5v11a.5.5 0 0 0 .77.42l8.5-5.5a.5.5 0 0 0 0-.84l-8.5-5.5A.5.5 0 0 0 4 2.5z" />
              </svg>
            )}
          </button>
          <div className="flex-1">
            <div className="relative h-2 rounded-full bg-ink/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-ink transition-all"
                style={{ width: `${(month / horizon) * 100}%` }}
              />
              {stressMonth && (
                <div
                  className="absolute top-0 w-0.5 h-full -translate-x-1/2 pointer-events-none"
                  style={{
                    left: `${(stressMonth / horizon) * 100}%`,
                    background: "#8c3f2c",
                  }}
                  title={`Stress shock at month ${stressMonth}`}
                />
              )}
            </div>
            <div className="flex justify-between text-[11px] text-muted mt-1 tnum">
              <span>Month {month}</span>
              <span>
                {answered}/{totalForks} choices · Year {yearLabel} of{" "}
                {horizon / 12}
              </span>
            </div>
          </div>
          <button
            onClick={restartRun}
            className="text-sm text-muted hover:text-ink underline underline-offset-4 shrink-0"
            title={
              stress.kind !== "none"
                ? "Replay forks from month 1 under this stress test"
                : "Replay forks from month 1"
            }
          >
            Restart
          </button>
        </div>
        <div className="mt-3 min-h-[40px] flex items-center">
          {stateA?.flash || stateB?.flash ? (
            <p
              className={`text-xs px-1 rounded-lg w-full py-1.5 ${
                stressFlashNow
                  ? "text-[#8c3f2c] font-medium"
                  : "text-ink/80"
              }`}
              style={
                stressFlashNow
                  ? { background: "#b0593f14" }
                  : undefined
              }
            >
              {stateA?.flash && (
                <span className="mr-3">
                  <b style={{ color: THEME_A.accent }}>{a.label}:</b>{" "}
                  {stateA.flash}
                </span>
              )}
              {stateB?.flash && (
                <span>
                  <b style={{ color: THEME_B.accent }}>{b.label}:</b>{" "}
                  {stateB.flash}
                </span>
              )}
            </p>
          ) : (
            <p className="text-xs text-muted px-1">
              {playing
                ? "Time is passing…"
                : stress.kind !== "none"
                  ? "Press play - make your forks again under this stress test."
                  : "Press play - life will ask you to choose."}
            </p>
          )}
        </div>
      </div>

      <StressBar
        active={stress}
        onApply={beginStressReplay}
        onClear={clearStress}
        askWhatIf={askWhatIf}
      />

      <section className="mt-6">
        <SynthesisPanel
          synthesis={synthesis}
          aLabel={a.label}
          bLabel={b.label}
          themeA={THEME_A}
          themeB={THEME_B}
          orderedValues={persona.values}
          narration={narration}
        />
      </section>

      <section className="mt-6 grid md:grid-cols-2 gap-4">
        <ProfilePanel profile={a} theme={THEME_A} onChange={setA} cityScope="play" />
        <ProfilePanel profile={b} theme={THEME_B} onChange={setB} cityScope="play" />
      </section>

      <section className="mt-4">
        <TrustPanel a={a} b={b} />
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={() => {
            setShowCard(true);
            track("share_card_viewed", {
              cityA: a.city,
              cityB: b.city,
              recommendation: synthesis.recommendation,
            });
          }}
          className="bg-ink text-paper px-5 py-2.5 rounded-lg text-sm hover:opacity-90"
        >
          Share decision
        </button>
        <button
          onClick={share}
          className="border border-line px-5 py-2.5 rounded-lg text-sm hover:border-ink"
        >
          {copied ? "Link copied" : "Copy link"}
        </button>
        <span className="text-xs text-muted">
          A simulator, not financial advice.
        </span>
      </section>

      <footer className="text-xs text-muted border-t border-line pt-6 mt-10">
        Fork · live the decision before you make it · United States, Canada
        &amp; India · 2025 tax year · a simulator, not financial advice ·{" "}
        <Link href="/calculator" className="text-ink underline underline-offset-4">
          City calculator
        </Link>
      </footer>

      {showCard && (
        <ShareCard
          a={a}
          b={b}
          persona={persona}
          synthesis={synthesis}
          lifeA={lifeA}
          lifeB={lifeB}
          themeA={THEME_A}
          themeB={THEME_B}
          narration={narration}
          onClose={() => setShowCard(false)}
        />
      )}

      {activeDecision && activeDecisionObj && (
        <DecisionModal
          decision={activeDecisionObj}
          profile={activeProfile}
          persona={persona}
          theme={activeTheme}
          laneLabel={activeProfile.label}
          onChoose={handleChoose}
        />
      )}
    </main>
  );
}
