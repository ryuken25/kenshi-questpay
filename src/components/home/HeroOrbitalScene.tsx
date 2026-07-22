"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Hero3DFallback from "./hero3d/Hero3DFallback";
import KitHeroCube from "./hero3d/KitHeroCube";

const QuestPayHeroCanvas = dynamic(() => import("./hero3d/QuestPayHeroCanvas"), {
  ssr: false,
  loading: () => <Hero3DFallback variant="signin" />,
});

export default function HeroOrbitalScene({ variant = "home" }: { variant?: "home" | "signin" }) {
  // Desktop-only gate for the ported CSS-3D cube. Start false so SSR + the first
  // client render both emit the fallback (no hydration mismatch); upgrade to the
  // cube only once we've confirmed a >=1024px viewport on the client.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  let content;
  if (variant === "home") {
    // Desktop → ported kit cube (cursor-follow, VERSE mark, deep-violet faces).
    // Below 1024px → keep the existing static mobile fallback.
    content = isDesktop ? <KitHeroCube /> : <Hero3DFallback variant="home" />;
  } else {
    // sign-in: unchanged — keep the existing WebGL canvas.
    content = <QuestPayHeroCanvas variant={variant} />;
  }

  return <div className={variant === "home" ? "qp-hero-scene-wrap" : undefined}>{content}</div>;
}
