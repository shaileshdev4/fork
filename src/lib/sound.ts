/**

 * Sound engine — CC0 samples from /public/sounds/, played via Web Audio API

 * (AudioContext + decoded buffers). Muted by default; unlocks on first user

 * gesture. Ambient respects prefers-reduced-motion.

 */



const MASTER_GAIN = 1;
const AMBIENT_FADE_IN_S = 1.5;
const AMBIENT_FADE_OUT_S = 0.8;

/** Per-cue gain (0–1). Master is full scale; tick stays softer than hits. */
const ONE_SHOTS = {
  tick: { file: "/sounds/tick.mp3", vol: 0.22 },
  confirm: { file: "/sounds/confirm.mp3", vol: 0.55 },
  decision: { file: "/sounds/decision.mp3", vol: 0.65 },
  positive: { file: "/sounds/positive.mp3", vol: 0.65 },
  negative: { file: "/sounds/negative.mp3", vol: 0.65 },
  celebrate: { file: "/sounds/celebrate.mp3", vol: 0.75 },
  eventCar: { file: "/sounds/event_car.mp3", vol: 0.65 },
  eventMedical: { file: "/sounds/event_medical.mp3", vol: 0.65 },
  verdict: { file: "/sounds/verdict.mp3", vol: 0.75 },
} as const;

const AMBIENT = { file: "/sounds/ambient.mp3", vol: 0.5 } as const;



type SfxKey = keyof typeof ONE_SHOTS;

type AmbientMode = "buffer" | "html" | null;



let ctx: AudioContext | null = null;

let master: GainNode | null = null;

let enabled = false;

let ambientEnabled = false;

let decodePromise: Promise<void> | null = null;

const buffers = new Map<string, AudioBuffer>();

let ambientSource: AudioBufferSourceNode | null = null;

let ambientGain: GainNode | null = null;

let ambientHtml: HTMLAudioElement | null = null;

let ambientHtmlFade: ReturnType<typeof setInterval> | null = null;

let ambientMode: AmbientMode = null;



function ensure(): AudioContext | null {

  if (typeof window === "undefined") return null;

  if (!ctx) {

    const AC =

      window.AudioContext ||

      (window as unknown as { webkitAudioContext: typeof AudioContext })

        .webkitAudioContext;

    if (!AC) return null;

    ctx = new AC();

    master = ctx.createGain();

    master.gain.value = MASTER_GAIN;

    master.connect(ctx.destination);

  }

  return ctx;

}



/** Resume context + finish decoding (call from a click handler). */

export async function resumeAudio(): Promise<void> {

  if (typeof window === "undefined") return;

  ensure();

  await unlock();

  if (ctx?.state === "suspended") await ctx.resume().catch(() => {});

}



async function loadBuffer(

  audioCtx: AudioContext,

  url: string,

): Promise<AudioBuffer | null> {

  try {

    const res = await fetch(url);

    if (!res.ok) return null;

    const data = await res.arrayBuffer();

    return await audioCtx.decodeAudioData(data);

  } catch {

    return null;

  }

}



/** Lazily decode all samples on first user gesture (autoplay policy). */

function unlock(): Promise<void> {

  if (typeof window === "undefined") return Promise.resolve();

  if (decodePromise) return decodePromise;

  decodePromise = (async () => {

    const c = ensure();

    if (!c) return;

    if (c.state === "suspended") await c.resume().catch(() => {});



    const jobs: Promise<void>[] = [];

    for (const [key, { file }] of Object.entries(ONE_SHOTS)) {

      jobs.push(

        loadBuffer(c, file).then((buf) => {

          if (buf) buffers.set(key, buf);

        }),

      );

    }

    jobs.push(

      loadBuffer(c, AMBIENT.file).then((buf) => {

        if (buf) buffers.set("ambient", buf);

      }),

    );

    await Promise.all(jobs);



    if (ambientEnabled && enabled && !reducedMotion()) {

      startAmbient();

    }

  })();

  return decodePromise;

}



function reducedMotion(): boolean {

  return (

    typeof window !== "undefined" &&

    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

  );

}



function playOneShot(key: SfxKey) {

  if (!enabled) return;

  void resumeAudio().then(() => {

    if (!enabled) return;

    const c = ctx;

    const m = master;

    const buffer = buffers.get(key);

    if (!c || !m || !buffer) return;



    const src = c.createBufferSource();

    const gain = c.createGain();

    src.buffer = buffer;

    gain.gain.value = ONE_SHOTS[key].vol;

    src.connect(gain);

    gain.connect(m);

    src.onended = () => {

      try {

        src.disconnect();

        gain.disconnect();

      } catch {

        /* already torn down */

      }

    };

    try {

      src.start();

    } catch {

      /* ignore */

    }

  });

}



export function setSoundEnabled(on: boolean) {

  enabled = on;

  if (on) {

    ensure();

    void unlock();

  } else {

    stopAmbient();

  }

}



export function isSoundEnabled() {

  return enabled;

}



export function setAmbientEnabled(on: boolean) {

  ambientEnabled = on;

  if (on && enabled) void resumeAudio().then(() => startAmbient());

  else stopAmbient();

}



export function isAmbientEnabled() {

  return ambientEnabled;

}



export const sfx = {

  tick: () => playOneShot("tick"),

  confirm: () => playOneShot("confirm"),

  decision: () => playOneShot("decision"),

  positive: () => playOneShot("positive"),

  negative: () => playOneShot("negative"),

  celebrate: () => playOneShot("celebrate"),

  eventCar: () => playOneShot("eventCar"),

  eventMedical: () => playOneShot("eventMedical"),

  verdict: () => playOneShot("verdict"),

};



function startAmbientBuffer(buffer: AudioBuffer) {

  const c = ctx;

  const m = master;

  if (!c || !m || ambientSource) return;



  ambientGain = c.createGain();

  const now = c.currentTime;

  ambientGain.gain.setValueAtTime(0, now);

  ambientGain.gain.linearRampToValueAtTime(AMBIENT.vol, now + AMBIENT_FADE_IN_S);

  ambientGain.connect(m);



  const src = c.createBufferSource();

  src.buffer = buffer;

  src.loop = true;

  src.connect(ambientGain);

  try {

    src.start();

    ambientSource = src;

    ambientMode = "buffer";

  } catch {

    ambientGain.disconnect();

    ambientGain = null;

    startAmbientHtml();

  }

}



function fadeHtmlVolume(

  el: HTMLAudioElement,

  from: number,

  to: number,

  ms: number,

) {

  if (ambientHtmlFade) clearInterval(ambientHtmlFade);

  const target = Math.min(1, to * MASTER_GAIN);

  const steps = Math.max(1, Math.round(ms / 40));

  let step = 0;

  el.volume = from;

  ambientHtmlFade = setInterval(() => {

    step += 1;

    el.volume = from + (target - from) * (step / steps);

    if (step >= steps) {

      if (ambientHtmlFade) clearInterval(ambientHtmlFade);

      ambientHtmlFade = null;

      el.volume = target;

    }

  }, 40);

}



function startAmbientHtml() {

  if (typeof window === "undefined" || ambientMode === "html") return;

  if (!ambientHtml) {

    ambientHtml = new Audio(AMBIENT.file);

    ambientHtml.loop = true;

    ambientHtml.preload = "auto";

  }

  ambientHtml.volume = 0;

  void ambientHtml.play().catch(() => {});

  fadeHtmlVolume(ambientHtml, 0, AMBIENT.vol, AMBIENT_FADE_IN_S * 1000);

  ambientMode = "html";

}



function startAmbient() {

  if (!enabled || !ambientEnabled || reducedMotion()) return;

  if (ambientMode) return;



  void resumeAudio().then(() => {

    if (!enabled || !ambientEnabled || reducedMotion() || ambientMode) return;



    const buffer = buffers.get("ambient");

    if (buffer && ctx && master) {

      startAmbientBuffer(buffer);

    } else {

      startAmbientHtml();

    }

  });

}



function stopAmbient() {

  if (ambientHtmlFade) {

    clearInterval(ambientHtmlFade);

    ambientHtmlFade = null;

  }



  if (ambientMode === "html" && ambientHtml) {

    const el = ambientHtml;

    const from = el.volume;

    const steps = Math.max(1, Math.round((AMBIENT_FADE_OUT_S * 1000) / 40));

    let step = 0;

    const fade = setInterval(() => {

      step += 1;

      el.volume = from * (1 - step / steps);

      if (step >= steps) {

        clearInterval(fade);

        el.pause();

        el.volume = 0;

      }

    }, 40);

    ambientMode = null;

    return;

  }



  if (!ambientSource || !ambientGain || !ctx) {

    ambientSource = null;

    ambientGain = null;

    ambientMode = null;

    return;

  }



  const c = ctx;

  const src = ambientSource;

  const gain = ambientGain;

  ambientSource = null;

  ambientGain = null;

  ambientMode = null;



  const now = c.currentTime;

  try {

    gain.gain.cancelScheduledValues(now);

    gain.gain.setValueAtTime(gain.gain.value, now);

    gain.gain.linearRampToValueAtTime(0, now + AMBIENT_FADE_OUT_S);

  } catch {

    /* ignore */

  }



  window.setTimeout(() => {

    try {

      src.stop();

    } catch {

      /* already stopped */

    }

    try {

      src.disconnect();

      gain.disconnect();

    } catch {

      /* ignore */

    }

  }, AMBIENT_FADE_OUT_S * 1000 + 80);

}



/** Match flash copy to themed one-shots (car / medical micro-events & forks). */

export function flashEventKind(flash: string): "car" | "medical" | null {

  const f = flash.toLowerCase();

  if (

    /\bcar\b|vehicle|beater|car-free|car payment|second car|no car/.test(f)

  ) {

    return "car";

  }

  if (

    /dental|medical|out-of-pocket|insurance didn't cover|procedure|braces|vet bill|vet/.test(

      f,

    )

  ) {

    return "medical";

  }

  return null;

}


