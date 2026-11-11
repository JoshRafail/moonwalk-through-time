import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { events } from "@/data/events";

const IDLE_MS = 45_000;
const ATTRACT_STEP_MS = 6_000;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "U.S. Moon History — Lunar Exhibit" },
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

  const go = useCallback((i: number) => setIndex(Math.max(0, Math.min(events.length - 1, i))), []);

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
      {events.map((e, i) => (
        <img key={e.id} src={e.image} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-md transition-opacity duration-1000"
          style={{ opacity: i === index ? 0.28 : 0 }} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />

      <header className="relative z-10 flex justify-center pt-6">
        <div className="metal-frame relative px-1 py-1" style={{ clipPath: "polygon(0 0,100% 0,96% 100%,4% 100%)" }}>
          <div className="metal-plate px-24 py-3" style={{ clipPath: "polygon(0 0,100% 0,96% 100%,4% 100%)" }}>
            <h1 className="font-display metal-text text-4xl font-bold tracking-[0.3em] uppercase">U.S. Moon History</h1>
          </div>
        </div>
      </header>

      <section className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center">
        <Strip index={index} onSelect={go} onOpen={() => setOpen(true)} />
        <div className="mt-6 text-center">
          <p className="font-display text-sm tracking-[0.3em] text-primary uppercase">{ev.date}</p>
          <h2 className="font-display text-3xl font-semibold">{ev.title}</h2>
          <p className="mt-1 text-muted-foreground">Tap the picture to learn more</p>
        </div>
      </section>

      <Timeline index={index} onSelect={go} />

      {open && <Detail index={index} volume={volume} setVolume={setVolume} onClose={() => setOpen(false)} />}

      {attract && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 flex justify-center">
          <div className="metal-plate animate-pulse rounded-full px-10 py-4 font-display text-2xl tracking-[0.3em] text-primary uppercase">Touch anywhere to explore</div>
        </div>
      )}
    </main>
  );
}

function Strip({ index, onSelect, onOpen }: { index: number; onSelect: (i: number) => void; onOpen: () => void }) {
  const start = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);
  const up = (e: React.PointerEvent) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    start.current = null; setDrag(0);
    if (dx < -60) onSelect(index + 1);
    else if (dx > 60) onSelect(index - 1);
  };
  return (
    <div className="relative h-[44vh] w-full touch-none"
      onPointerDown={(e) => { start.current = e.clientX; }}
      onPointerMove={(e) => start.current !== null && setDrag(e.clientX - start.current)}
      onPointerUp={up} onPointerCancel={() => { start.current = null; setDrag(0); }}>
      <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 metal-plate" />
      {events.map((e, i) => {
        const off = i - index;
        const active = off === 0;
        return (
          <button key={e.id}
            onClick={() => { if (Math.abs(drag) > 8) return; active ? onOpen() : onSelect(i); }}
            aria-label={active ? `Open ${e.title}` : `Show ${e.year}`}
            className="metal-frame absolute top-1/2 left-1/2 transition-all duration-700 ease-out"
            style={{
              width: active ? "min(42vw, 60vh)" : "min(20vw, 28vh)",
              transform: `translate(calc(-50% + ${off * 26}vw + ${drag}px), -50%)`,
              opacity: Math.abs(off) > 2 ? 0 : active ? 1 : 0.7,
              zIndex: 10 - Math.abs(off),
              padding: active ? 10 : 6,
            }}>
            <span className="rivet absolute top-1 left-1" /><span className="rivet absolute top-1 right-1" />
            <span className="rivet absolute bottom-1 left-1" /><span className="rivet absolute right-1 bottom-1" />
            <img src={e.image} alt={e.title} draggable={false} className="aspect-[3/2] w-full rounded-sm object-cover" />
            {active && <span className="absolute -top-3 -right-3 grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground shadow-lg">+</span>}
          </button>
        );
      })}
    </div>
  );
}

function Timeline({ index, onSelect }: { index: number; onSelect: (i: number) => void }) {
  const max = events.length - 1;
  const [pos, setPos] = useState<number | null>(null);
  const value = pos ?? index;
  const pct = (v: number) => `${(v / max) * 100}%`;
  return (
    <nav className="relative z-10 mx-12 mb-8" aria-label="Lunar history timeline">
      <div className="relative h-14 rounded-sm bg-primary shadow-[0_0_30px_-8px_var(--primary)]">
        <div className="absolute inset-x-12 inset-y-0">
          {events.map((e, i) => (
            <button key={e.id} onClick={() => onSelect(i)} aria-current={i === index}
              className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: pct(i) }}>
              <span className="h-3 w-0.5 bg-primary-foreground/60" />
              <span className={`font-display text-xl font-bold text-primary-foreground transition ${i === index ? "scale-125" : "opacity-60"}`}>{e.year}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="metal-plate relative mt-3 h-12 rounded-md">
        <div className="absolute inset-x-12 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-background shadow-inner" />
        <div className="absolute inset-x-12 inset-y-0">
          <div className="metal-frame pointer-events-none absolute top-1/2 h-10 w-16 -translate-x-1/2 -translate-y-1/2 !p-0"
            style={{ left: pct(value), transition: pos === null ? "left 600ms cubic-bezier(.2,.8,.2,1)" : "none" }}>
            <div className="mx-auto mt-2 flex h-6 w-6 justify-between">
              <span className="w-0.5 bg-background/50" /><span className="w-0.5 bg-background/50" /><span className="w-0.5 bg-background/50" />
            </div>
          </div>
          <input type="range" min={0} max={max} step={0.01} value={value} aria-label="Timeline slider"
            className="absolute inset-0 h-full w-full cursor-grab opacity-0"
            onChange={(e) => { const v = +e.target.value; setPos(v); onSelect(Math.round(v)); }}
            onPointerUp={() => setPos(null)} onKeyUp={() => setPos(null)} onBlur={() => setPos(null)} />
        </div>
      </div>
    </nav>
  );
}

function Detail({ index, volume, setVolume, onClose }: { index: number; volume: number; setVolume: (v: number) => void; onClose: () => void }) {
  const ev = events[index]!;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-overlay p-10 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="metal-frame relative flex max-h-full w-full max-w-6xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute -top-4 -right-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground shadow-lg">×</button>
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
