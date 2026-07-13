"use client";

import dynamic from "next/dynamic";
import Hero3DFallback from "./hero3d/Hero3DFallback";

const QuestPayHeroCanvas = dynamic(() => import("./hero3d/QuestPayHeroCanvas"), {
  ssr: false,
  loading: () => <Hero3DFallback />,
});

export default function HeroOrbitalScene({ variant = "home" }: { variant?: "home" | "signin" }) {
  return <QuestPayHeroCanvas variant={variant} />;
}
