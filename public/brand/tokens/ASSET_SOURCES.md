# Official Token Asset Sources

All assets downloaded locally. No remote hotlinks in production.

## VERSE
- **File:** `verse/verse-mark.svg`, `verse/verse-mark-512.png`
- **Source:** Bitcoin.com / Verse ecosystem (already in repository at `public/brand/verse/`)
- **Date:** 2026-07-17
- **Format:** SVG original, 512×512 transparent PNG
- **License:** Verse/Bitcoin.com brand assets — used with QuestPay partnership context
- **Notes:** Purple V mark on transparent background. Official Verse identity.

## POL (Polygon)
- **File:** `polygon/polygon-pol-mark.svg`, `polygon/polygon-pol-mark-512.png`
- **Source:** `https://github.com/spothq/cryptocurrency-icons` (Polygon/POL identity)
- **Date:** 2026-07-17
- **Format:** SVG (32×32 viewBox), rendered to 512×512 transparent PNG via qlmanage
- **License:** MIT — cryptocurrency-icons project
- **Notes:** Official Polygon purple (#6F41D8) circular logo. Post-rebrand POL identity.

## USDT (Tether)
- **File:** `tether/usdt-mark.svg`, `tether/usdt-mark-512.png`
- **Source:** `https://github.com/spothq/cryptocurrency-icons` (Tether official colors)
- **Date:** 2026-07-17
- **Format:** SVG (32×32 viewBox), rendered to 512×512 transparent PNG via qlmanage
- **License:** MIT — cryptocurrency-icons project
- **Notes:** Official Tether green (#26A17B) circular logo with USD₮ symbol.

## USDC (Circle)
- **File:** `circle/usdc-mark.svg`, `circle/usdc-mark-512.png`
- **Source:** `https://github.com/spothq/cryptocurrency-icons` (Circle official colors)
- **Date:** 2026-07-17
- **Format:** SVG (32×32 viewBox), rendered to 512×512 transparent PNG via qlmanage
- **License:** MIT — cryptocurrency-icons project
- **Notes:** Official Circle blue (#3E73C4) circular logo with USDC symbol.

## Asset Structure
```
public/brand/tokens/
├── verse/
│   ├── verse-mark.svg
│   └── verse-mark-512.png
├── polygon/
│   ├── polygon-pol-mark.svg
│   └── polygon-pol-mark-512.png
├── tether/
│   ├── usdt-mark.svg
│   └── usdt-mark-512.png
├── circle/
│   ├── usdc-mark.svg
│   └── usdc-mark-512.png
└── ASSET_SOURCES.md (this file)
```

## Conversion
All SVGs rendered to 512×512 transparent PNG using macOS `qlmanage` (Quick Look).
No black backgrounds. No stretching. Aspect ratio preserved with transparent padding.
