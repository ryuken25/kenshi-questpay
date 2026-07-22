"use client";

/* eslint-disable @next/next/no-img-element -- tiny transform-driven orbiting
   coins + neon SVG marks; next/image's wrapper span breaks the absolute rig. */

// Ported from _work/kit/HeroCube.jsx (faithful TSX port): realistic glowing
// VERSE box (non-cubic 292x232x232), real token marks on dark bezel coins,
// depth-faded orbit trails, star particles, and cursor-follow easing of the
// whole rig. Desktop-only + reduced-motion aware (gated by HeroOrbitalScene /
// prefers-reduced-motion below).
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import "./kit-hero-cube.css";

type CoinToken = "verse" | "pol" | "usdt" | "usdc";

// Kit's ../../assets/* map onto the app's public/brand/* — real local paths.
const COIN_LOGOS: Record<CoinToken, string> = {
  verse: "/brand/tokens/verse/verse-mark.svg",
  pol: "/brand/tokens/polygon/polygon-pol-mark.svg",
  usdt: "/brand/tokens/tether/usdt-mark.svg",
  usdc: "/brand/tokens/circle/usdc-mark.svg",
};
// PNG fallbacks if an SVG fails to decode.
const COIN_FALLBACK: Record<CoinToken, string> = {
  verse: "/brand/tokens/verse/verse-mark-512.png",
  pol: "/brand/tokens/polygon/polygon-pol-mark-512.png",
  usdt: "/brand/tokens/tether/usdt-mark-512.png",
  usdc: "/brand/tokens/circle/usdc-mark-512.png",
};

const VERSE_MARK = "/brand/verse/verse-mark-neon.svg";

// wider-than-tall box, per the reference (not 1:1:1)
const W = 292;
const H = 232;
const D = 232;

type CoinDef = {
  token: CoinToken;
  a: number;
  b: number;
  phase: number;
  speed: number;
  size: number;
  trail: string;
};

// Same angular speed + fixed even phase spacing = coins can never collide.
const COINS: CoinDef[] = [
  { token: "verse", a: 258, b: 92, phase: 5.2, speed: 0.09, size: 64, trail: "rgba(190,140,255," },
  { token: "pol", a: 258, b: 92, phase: 2.06, speed: 0.09, size: 56, trail: "rgba(150,100,255," },
  { token: "usdt", a: 218, b: 148, phase: 0.5, speed: 0.09, size: 58, trail: "rgba(110,200,220," },
  { token: "usdc", a: 218, b: 148, phase: 3.64, speed: 0.09, size: 54, trail: "rgba(120,160,255," },
];

const grid = (px: number) =>
  `repeating-linear-gradient(0deg, rgba(196,158,255,.09) 0 1px, transparent 1px ${px}px),` +
  `repeating-linear-gradient(90deg, rgba(196,158,255,.09) 0 1px, transparent 1px ${px}px)`;

const face = (w: number, h: number, extra?: CSSProperties): CSSProperties => ({
  position: "absolute",
  width: w,
  height: h,
  left: (W - w) / 2,
  top: (H - h) / 2,
  borderRadius: 10,
  boxSizing: "border-box",
  border: "1.5px solid rgba(196,148,255,.5)",
  background: grid(24) + ", linear-gradient(155deg, rgba(52,20,110,.78), rgba(12,6,32,.92) 60%)",
  boxShadow: "inset 0 0 52px rgba(140,80,255,.38), 0 0 20px rgba(135,82,255,.28)",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  backfaceVisibility: "hidden",
  ...extra,
});

const vMark = (op: number, w: number, glow = 22) => (
  <img
    src={VERSE_MARK}
    alt=""
    style={{
      width: w,
      opacity: op,
      filter: `brightness(2.4) saturate(.7) drop-shadow(0 0 ${glow}px rgba(210,175,255,.95)) drop-shadow(0 0 ${glow * 2.2}px rgba(160,100,255,.6))`,
    }}
  />
);

function HeroCoin({ token, size }: { token: CoinToken; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        position: "relative",
        padding: size * 0.1,
        boxSizing: "border-box",
        background: "linear-gradient(160deg, #34344a, #0b0b14 52%, #23232f)",
        boxShadow:
          "inset 0 1px 2px rgba(255,255,255,.4), inset 0 -3px 8px rgba(0,0,0,.75), 0 14px 30px rgba(0,0,0,.6)",
      }}
    >
      <img
        src={COIN_LOGOS[token]}
        alt={token}
        onError={(e) => {
          const fb = COIN_FALLBACK[token];
          if (fb && !e.currentTarget.src.endsWith(fb)) e.currentTarget.src = fb;
        }}
        style={{ width: "100%", height: "100%", display: "block", borderRadius: "50%", objectFit: "cover" }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 32% 22%, rgba(255,255,255,.30), rgba(255,255,255,.05) 38%, transparent 50%)",
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 1,
          borderRadius: "50%",
          pointerEvents: "none",
          border: "1px solid rgba(255,255,255,.14)",
        }}
      />
    </div>
  );
}

type MouseState = { tx: number; ty: number; x: number; y: number; boost: number; b: number };

export default function KitHeroCube() {
  const cubeRef = useRef<HTMLDivElement>(null);
  const coinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLCanvasElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<MouseState>({ tx: 0, ty: 0, x: 0, y: 0, boost: 0, b: 0 });

  const [reduced, setReduced] = useState(false);

  // prefers-reduced-motion → static frame, no rAF / no cursor-follow.
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // scale the fixed 660px stage to the available column width (layout, not motion)
  useEffect(() => {
    const fit = () => {
      if (!wrapRef.current || !stageRef.current) return;
      const s = Math.min(1, wrapRef.current.clientWidth / 660);
      stageRef.current.style.transform = `translate(-50%,-50%) scale(${s})`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // cursor-follow: whole 3D stage eases toward the pointer when it's near
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: MouseEvent) => {
      const m = mouseRef.current;
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (r.width / 2);
      const dy = (e.clientY - cy) / (r.height / 2);
      const dist = Math.hypot(dx, dy);
      const near = Math.max(0, 1 - Math.max(0, dist - 0.55) / 0.9); // full inside, fades out beyond
      m.tx = Math.max(-1, Math.min(1, dx)) * near;
      m.ty = Math.max(-1, Math.min(1, dy)) * near;
      m.boost = near;
    };
    const onLeave = () => {
      const m = mouseRef.current;
      m.tx = 0;
      m.ty = 0;
      m.boost = 0;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, [reduced]);

  // rAF layout loop (skipped under reduced-motion — one static frame instead)
  useEffect(() => {
    const layout = (t: number) => {
      // ease the whole rig toward the cursor (critically-damped-ish lerp)
      const m = mouseRef.current;
      m.x += (m.tx - m.x) * 0.045;
      m.y += (m.ty - m.y) * 0.045;
      m.b += (m.boost - m.b) * 0.045;
      if (cubeRef.current) {
        // floating, not spinning — slow levitation + breathing tilt (eased sines)
        const bobY = Math.sin(t * 0.5) * 11;
        const rx = -16 + Math.sin(t * 0.4) * 2.5 + m.y * -10;
        const ry = -14 + Math.sin(t * 0.27) * 3 + m.x * 14;
        cubeRef.current.style.transform = `translateY(${bobY}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
      if (rigRef.current) {
        // parallax shift of the whole scene toward the cursor
        rigRef.current.style.transform = `translate(${m.x * 16}px, ${m.y * 12}px)`;
      }
      // motion trails
      const cv = trailRef.current;
      const ctx = cv ? cv.getContext("2d") : null;
      if (ctx) ctx.clearRect(0, 0, 660, 480);
      COINS.forEach((c, i) => {
        const el = coinRefs.current[i];
        const ang = c.phase + t * c.speed * Math.PI;
        const pos = (a: number) => ({ x: Math.cos(a) * c.a, y: Math.sin(a) * c.b, depth: Math.sin(a) });
        if (ctx) {
          const STEPS = 30;
          const GAP = 0.052;
          for (let k = 1; k <= STEPS; k++) {
            const p1 = pos(ang - (k - 1) * GAP);
            const p2 = pos(ang - k * GAP);
            const fade = 1 - k / STEPS;
            const fr = (p2.depth + 1) / 2;
            ctx.strokeStyle = c.trail + fade * fade * 0.55 * (0.25 + fr * 0.75) + ")";
            ctx.lineWidth = 1.2 + fade * 1.6;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(330 + p1.x, 240 + p1.y);
            ctx.lineTo(330 + p2.x, 240 + p2.y);
            ctx.stroke();
          }
        }
        if (!el) return;
        const { x, y, depth } = pos(ang); // front of the orbit passes BELOW the box
        const front = (depth + 1) / 2;
        const behind = depth < 0;
        const scale = 0.58 + front * 0.5;
        // parallax: front coins move more with the cursor than back ones
        const px = m.x * (10 + front * 16);
        const py = m.y * (8 + front * 12);
        // slow pseudo-random eased self-rotation (sum of slow sines ~ easy-ease)
        const rotZ = Math.sin(t * 0.23 + i * 2.1) * 16 + Math.sin(t * 0.11 + i) * 9;
        const rotY = Math.sin(t * 0.17 + i * 1.7) * 18 + Math.sin(t * 0.31 + i * 0.6) * 8;
        const bob = Math.sin(t * 0.6 + i) * 4;
        el.style.transform = `translate(-50%,-50%) translate(${x + px}px, ${y + bob + py}px) scale(${scale}) perspective(600px) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
        el.style.zIndex = behind ? String(Math.round(front * 30)) : String(60 + Math.round(front * 40));
        el.style.opacity = behind ? String(0.28 + front * 0.5) : String(0.78 + front * 0.22);
        el.style.filter = `blur(${(1 - front) * (behind ? 2.4 : 1)}px) drop-shadow(0 12px 24px rgba(0,0,0,.55))`;
      });
    };

    layout(0); // paint a good static frame immediately
    if (reduced) return; // static-only: no animation loop

    const t0 = performance.now();
    const tick = (now: number) => {
      layout((now - t0) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reduced]);

  // seeded star particles
  const parts = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => {
        const r = (n: number) => {
          const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
          return x - Math.floor(x);
        };
        return {
          left: r(1) * 100,
          top: r(2) * 100,
          s: 1 + r(3) * 2.4,
          d: 2.4 + r(4) * 4.5,
          delay: r(5) * 5,
          violet: r(6) > 0.55,
        };
      }),
    [],
  );

  return (
    <div ref={wrapRef} className="kit-hero-cube">
      <div
        ref={stageRef}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: 660,
          height: 480,
          transformOrigin: "center center",
        }}
      >
        <div ref={rigRef} data-hero-rig style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", willChange: "transform" }}>
          {/* star particles */}
          {parts.map((p, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.s,
                height: p.s,
                borderRadius: "50%",
                background: p.violet ? "#c9a6ff" : "#e8e4f5",
                boxShadow: p.violet ? "0 0 6px rgba(180,130,255,.9)" : "0 0 4px rgba(255,255,255,.7)",
                animation: reduced ? "none" : `kitCubeTwinkle ${p.d}s ease-in-out ${p.delay}s infinite`,
                zIndex: 1,
              }}
            />
          ))}

          {/* violet bloom */}
          <div
            style={{
              position: "absolute",
              width: 600,
              height: 480,
              borderRadius: "50%",
              zIndex: 2,
              background:
                "radial-gradient(ellipse at center, rgba(126,72,242,.36), rgba(90,35,195,.15) 44%, transparent 72%)",
              filter: "blur(48px)",
            }}
          />

          {/* orbit guide rings + motion-trail canvas */}
          <canvas ref={trailRef} width={660} height={480} style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none" }} />
          <div
            style={{
              position: "absolute",
              width: 530,
              height: 296,
              borderRadius: "50%",
              zIndex: 3,
              border: "1px solid rgba(170,125,255,.20)",
              boxShadow: "0 0 14px rgba(140,90,255,.12) inset",
              transform: "rotateX(72deg) rotateZ(5deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 450,
              height: 336,
              borderRadius: "50%",
              zIndex: 3,
              border: "1px solid rgba(130,170,235,.14)",
              transform: "rotateX(64deg) rotateZ(-22deg)",
            }}
          />

          {/* the box (z between back and front coins) */}
          <div style={{ perspective: 1300, width: W, height: H, position: "relative", zIndex: 45 }}>
            <div
              ref={cubeRef}
              style={{
                position: "relative",
                width: W,
                height: H,
                transformStyle: "preserve-3d",
                transform: "rotateX(-16deg) rotateY(-14deg)",
                willChange: "transform",
              }}
            >
              {/* front — brightest, big V */}
              <div
                style={face(W, H, {
                  transform: `translateZ(${D / 2}px)`,
                  border: "2px solid rgba(216,176,255,.85)",
                  background:
                    "radial-gradient(circle at 50% 46%, rgba(150,84,255,.5), rgba(40,16,92,.55) 62%), " + grid(24),
                  boxShadow: "inset 0 0 64px rgba(160,95,255,.55), 0 0 34px rgba(150,90,255,.5)",
                })}
              >
                {vMark(1, 116, 26)}
              </div>
              {/* back — no mark, just faint volume */}
              <div style={face(W, H, { transform: `rotateY(180deg) translateZ(${D / 2}px)`, opacity: 0.9 })} />
              {/* right / left */}
              <div style={face(D, H, { transform: `rotateY(90deg) translateZ(${W / 2}px)`, opacity: 0.96 })}>{vMark(0.2, 74, 10)}</div>
              <div style={face(D, H, { transform: `rotateY(-90deg) translateZ(${W / 2}px)`, opacity: 0.96 })}>{vMark(0.2, 74, 10)}</div>
              {/* top — bright edge glow, V mark like reference */}
              <div
                style={face(W, D, {
                  transform: `rotateX(90deg) translateZ(${H / 2}px)`,
                  border: "2px solid rgba(222,186,255,.9)",
                  boxShadow: "inset 0 0 70px rgba(180,120,255,.6), 0 0 30px rgba(160,100,255,.55)",
                })}
              >
                {vMark(0.9, 96)}
              </div>
              {/* bottom */}
              <div style={face(W, D, { transform: `rotateX(-90deg) translateZ(${H / 2}px)`, opacity: 0.7 })} />
            </div>
            {/* ground glow under the box */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: -66,
                transform: "translateX(-50%)",
                width: W * 1.25,
                height: 60,
                borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(130,70,240,.30), transparent 70%)",
                filter: "blur(18px)",
              }}
            />
          </div>

          {/* orbiting coins */}
          {COINS.map((c, i) => (
            <div
              key={i}
              ref={(el) => {
                coinRefs.current[i] = el;
              }}
              style={{ position: "absolute", left: "50%", top: "50%", willChange: "transform, opacity" }}
            >
              <HeroCoin token={c.token} size={c.size} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
