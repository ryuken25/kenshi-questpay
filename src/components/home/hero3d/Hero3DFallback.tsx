import Image from "next/image";

export default function Hero3DFallback({ variant = "home" }: { variant?: "home" | "signin" }) {
  return (
    <div className={`qp-hero3d qp-hero3d--${variant} qp-hero3d--fallback`} data-hero3d-fallback>
      <Image
        src="/hero/questpay-hero-fallback.webp"
        alt="QuestPay violet cube with VERSE, POL, USDT and USDC medallions"
        fill
        priority={variant === "home"}
        sizes={variant === "signin" ? "360px" : "(max-width: 768px) 100vw, 640px"}
        className="object-contain"
      />
    </div>
  );
}
