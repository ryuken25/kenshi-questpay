# QuestPay Mobile Polish Report

## Before issues
- Hero explained the flow, but product purpose was still too abstract on mobile.
- No dedicated “What is this?” section near top.
- No visible contract proof panel despite deployed/tested Base Sepolia contract.
- Package cards were compact and less service-focused.
- Checkout package selector used 5 tiny columns on mobile.

## Files changed
- `src/components/Hero.tsx`
- `src/components/WhatIsThis.tsx`
- `src/components/ContractProof.tsx`
- `src/components/Packages.tsx`
- `src/components/Checkout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/lib/config.ts`
- `src/data/brand-assets.ts`
- `public/brand/**`

## Mobile fixes
- Mobile-first hero order: badge → title → explanation → CTA → trust row → QuestPass card.
- Added plain-language “What is this?” section.
- Added full contract proof panel with truncated hashes and explorer links.
- Package cards are vertical, larger, and thumb-friendly.
- Checkout stepper added.
- Checkout package selector stacks on mobile.
- Added global overflow-x prevention and tap target baseline.

## Desktop fixes
- Stronger hero composition and proof section.
- Clearer service package labels/descriptions.

## Build result
Pending after patch.

## Deploy URL
https://kenshi-questpay.vercel.app

## Known limitations
- Browser wallet popup still needs manual real-wallet testing; CLI test buy already succeeded previously.
