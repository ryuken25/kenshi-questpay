export const SITE = {
  name: "Kenshi QuestPay",
  tagline: "Crypto-native service checkout and delivery workspace",
  edition: "VIBE CODING WITH VERSE — July 2026",
  realNetwork: "Polygon Mainnet",
  disclaimer: "Community-built project; not an official Bitcoin.com product.",
  creator: {
    github: process.env.NEXT_PUBLIC_CREATOR_GITHUB || "https://github.com/ryuken25",
    x: process.env.NEXT_PUBLIC_CREATOR_X || "https://x.com/Atttar4",
    discord: process.env.NEXT_PUBLIC_CREATOR_DISCORD || "kenshiwassleepy",
    email: process.env.NEXT_PUBLIC_CREATOR_EMAIL || "winayaarya@gmail.com",
  },
} as const;
