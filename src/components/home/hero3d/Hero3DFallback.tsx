import Image from "next/image";

const MARK = "/brand/questpay/questpay-mark-white.svg";

// Cube faces (84px cube → translateZ 42px). Front + back carry the QuestPay mark.
const FACES: { t: string; mark?: boolean }[] = [
  { t: "rotateY(0deg) translateZ(42px)", mark: true },
  { t: "rotateY(90deg) translateZ(42px)" },
  { t: "rotateY(180deg) translateZ(42px)", mark: true },
  { t: "rotateY(270deg) translateZ(42px)" },
  { t: "rotateX(90deg) translateZ(42px)" },
  { t: "rotateX(-90deg) translateZ(42px)" },
];

// Orbiting token coins, staggered a quarter-period (18s / 4 = 4.5s) apart.
const COINS = [
  { sym: "USDT", src: "/brand/tokens/tether/usdt-mark.svg", delay: "0s" },
  { sym: "USDC", src: "/brand/tokens/circle/usdc-mark.svg", delay: "-4.5s" },
  { sym: "POL", src: "/brand/tokens/polygon/polygon-pol-mark.svg", delay: "-9s" },
  { sym: "VERSE", src: "/brand/tokens/verse/verse-mark.svg", delay: "-13.5s" },
];

/**
 * Mobile / Android hero. Desktop keeps the WebGL cube (KitHeroCube); below 1024px
 * this pure-CSS 3D cube + orbiting coins gives Android real motion without WebGL.
 * Static (no WebGL, no image) so it can't jank; reduced-motion pins it still (CSS).
 */
export default function Hero3DFallback({ variant = "home" }: { variant?: "home" | "signin" }) {
  if (variant === "signin") {
    return (
      <div className="qp-hero3d qp-hero3d--signin qp-hero3d--fallback" data-hero3d-fallback>
        <Image
          src="/hero/questpay-hero-fallback.webp"
          alt="QuestPay violet cube with VERSE, POL, USDT and USDC medallions"
          fill
          sizes="360px"
          className="object-contain"
        />
      </div>
    );
  }

  return (
    <div className="qp-hero3d qp-hero3d--home qp-hero3d--fallback" data-hero3d-fallback>
      <div className="qp-cube3d" role="img" aria-label="QuestPay cube with orbiting POL, USDT, USDC and VERSE tokens">
        <div className="qp-cube3d__glow" aria-hidden="true" />
        {COINS.map((c) => (
          <div
            key={c.sym}
            className="qp-cube3d__coin"
            style={{ backgroundImage: `url(${c.src})`, animationDelay: c.delay }}
            aria-hidden="true"
          />
        ))}
        <div className="qp-cube3d__float" aria-hidden="true">
          <div className="qp-cube3d__cube">
            {FACES.map((f, i) => (
              <div key={i} className="qp-cube3d__face" style={{ transform: f.t }}>
                {f.mark ? <span className="qp-cube3d__glyph" style={{ backgroundImage: `url(${MARK})` }} /> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
