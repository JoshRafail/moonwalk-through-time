import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { events } from "@/data/events";

const IDLE_MS = 45_000;
const ATTRACT_STEP_MS = 6_000;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moonbound — A Lunar History Exhibit" },
      { name: "description", content: "Explore milestones of lunar exploration from Luna 2 to Chang'e 4 in this interactive museum timeline." },
      { property: "og:title", content: "Moonbound — A Lunar History Exhibit" },
      { property: "og:description", content: "An interactive timeline of humanity's journey to the Moon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Exhibit,
});

function useTone(volume: number, freq: number | null) {
  const ctxRef = useRef<{ ctx: AudioContext; gain: GainNode; oscs: OscillatorNode[] } | null>(null);
  useEffect(() => {
    if (freq === null) return;
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const oscs = [1, 1.5, 2.01].map((m, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = freq * m;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.5 : 0.12;
      o.connect(g).connect(gain);
      o.start();
      return o;
    });
    ctxRef.current = { ctx, gain, oscs };
    return () => { oscs.forEach((o) => o.stop()); ctx.close(); ctxRef.current = null; };
  }, [freq]);
  useEffect(() => {
    const c = ctxRef.current;
    if (c) c.gain.gain.setTargetAtTime((volume / 100) * 0.25, c.ctx.currentTime, 0.2);
  }, [volume, freq]);
}

function Exhibit() {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(50);
  const [attract, setAttract] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const go = useCallback((i: number) => setIndex((i + events.length) % events.length), []);

  const resetIdle = useCallback(() => {
    setAttract(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => { setOpen(false); setAttract(true); }, IDLE_MS);
  }, []);

  useEffect(() => {
    resetIdle();
    const h = () => resetIdle();
    window.addEventListener("pointerdown", h, true);
    window.addEventListener("keydown", h, true);
    return () => { window.removeEventListener("pointerdown", h, true); window.removeEventListener("keydown", h, true); clearTimeout(idleTimer.current); };
  }, [resetIdle]);

  useEffect(() => {
    if (!attract) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % events.length), ATTRACT_STEP_MS);
    return () => clearInterval(t);
  }, [attract]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [index, go]);

  useTone(volume, open ? events[index]!.tone : null);

  const ev = events[index]!;

  return (
    <main className="relative flex h-screen w-screen flex-col overflow-hidden">
      <header className="flex items-end justify-between px-10 pt-8">
        <div>
          <p className="font-display text-sm tracking-[0.4em] text-primary uppercase">Gallery 4 · Lunar Exploration</p>
          <h1 className="font-display metal-text text-5xl font-bold tracking-wide uppercase">Moonbound</h1>
        </div>
        <p className="max-w-sm text-right text-muted-foreground">Swipe the photos or tap a year. Tap a photo to learn more.</p>
      </header>

      <section className="flex min-h-0 flex-1 items-center gap-10 px-10 py-6">
        <Carousel index={index} onChange={go} onTap={() => setOpen(true)} />
        <aside className="w-[30%] shrink-0">
          <p className="font-display text-7xl font-bold text-primary">{ev.year}</p>
          <p className="mt-1 font-display tracking-widest text-muted-foreground uppercase">{ev.date}</p>
          <h2 className="mt-4 font-display text-3xl font-semibold">{ev.title}</h2>
          <p className="mt-3 text-lg leading-relaxed text-secondary-foreground">{ev.summary}</p>
          <button onClick={() => setOpen(true)} className="metal-plate mt-8 rounded-md px-6 py-3 font-display tracking-widest text-primary uppercase transition hover:brightness-125">
            Read more
          </button>
        </aside>
      </section>

      <Timeline index={index} onSelect={go} />

      {open && <Detail index={index} volume={volume} setVolume={setVolume} onClose={() => setOpen(false)} />}

      {attract && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center">
          <div className="metal-plate animate-pulse rounded-full px-10 py-4 font-display text-2xl tracking-[0.3em] text-primary uppercase">
            Touch anywhere to explore
          </div>
        </div>
      )}
    </main>
  );
}

function Carousel({ index, onChange, onTap }: { index: number; onChange: (i: number) => void; onTap: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);

  const up = (e: React.PointerEvent) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    const w = ref.current?.offsetWidth ?? 1;
    start.current = null;
    setDrag(0);
    if (Math.abs(dx) < 10) onTap();
    else if (dx < -w * 0.15) onChange(index + 1);
    else if (dx > w * 0.15) onChange(index - 1);
  };

  return (
    <div className="metal-frame relative min-w-0 flex-1">
      <span className="rivet absolute top-1 left-1" /><span className="rivet absolute top-1 right-1" />
      <span className="rivet absolute bottom-1 left-1" /><span className="rivet absolute right-1 bottom-1" />
      <div
        ref={ref}
        className="relative aspect-[3/2] max-h-[58vh] w-full cursor-grab touch-none overflow-hidden rounded-md bg-background"
        onPointerDown={(e) => { start.current = e.clientX; (e.target as Element).setPointerCapture?.(e.pointerId); }}
        onPointerMove={(e) => start.current !== null && setDrag(e.clientX - start.current)}
        onPointerUp={up}
        onPointerCancel={() => { start.current = null; setDrag(0); }}
      >
        <div
          className="flex h-full"
          style={{ transform: `translateX(calc(${-index * 100}% + ${drag}px))`, transition: drag ? "none" : "transform 600ms cubic-bezier(.2,.8,.2,1)" }}
        >
          {events.map((e, i) => (
            <img key={e.id} src={e.image} alt={e.title} draggable={false} width={1536} height={1024}
              loading={i === 0 ? "eager" : "lazy"} className="h-full w-full shrink-0 object-cover" />
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {events.map((e, i) => (
          <span key={e.id} className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-primary" : "w-3 bg-border"}`} />
        ))}
      </div>
    </div>
  );
}

function Timeline({ index, onSelect }: { index: number; onSelect: (i: number) => void }) {
  return (
    <nav className="metal-plate relative mx-10 mb-8 rounded-xl px-10 py-6" aria-label="Lunar history timeline">
      <div className="absolute inset-x-16 top-1/2 h-0.5 -translate-y-3 bg-border" />
      <div
        className="absolute top-1/2 left-16 h-0.5 -translate-y-3 bg-primary transition-all duration-700"
        style={{ width: `calc((100% - 8rem) * ${index / (events.length - 1)})` }}
      />
      <ol className="relative flex justify-between">
        {events.map((e, i) => (
          <li key={e.id}>
            <button onClick={() => onSelect(i)} className="flex w-24 flex-col items-center gap-3 py-2" aria-current={i === index}>
              <span className={`h-5 w-5 rounded-full border-2 transition-all ${i <= index ? "border-primary bg-primary" : "border-muted-foreground bg-background"} ${i === index ? "scale-150 shadow-[0_0_20px_var(--primary)]" : ""}`} />
              <span className={`font-display text-xl font-semibold ${i === index ? "text-primary" : "text-muted-foreground"}`}>{e.year}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Detail({ index, volume, setVolume, onClose }: { index: number; volume: number; setVolume: (v: number) => void; onClose: () => void }) {
  const ev = events[index]!;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-overlay p-10 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="metal-frame flex max-h-full w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex w-full overflow-hidden rounded-md bg-card">
          <img src={ev.image} alt={ev.title} className="w-3/5 object-cover" width={1536} height={1024} />
          <div className="flex flex-1 flex-col p-8">
            <p className="font-display tracking-widest text-primary uppercase">{ev.date}</p>
            <h2 className="mt-2 font-display text-3xl font-bold">{ev.title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-secondary-foreground">{ev.description}</p>
            <div className="mt-auto pt-6">
              <label className="flex items-center gap-4 font-display text-sm tracking-widest text-muted-foreground uppercase">
                Volume
                <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(+e.target.value)} className="h-2 flex-1 accent-primary" aria-label="Volume" />
                <span className="w-10 text-right text-foreground">{volume}</span>
              </label>
              <button onClick={onClose} className="metal-plate mt-6 w-full rounded-md py-3 font-display tracking-widest text-primary uppercase">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
