# QuestPay True 3D Hero — Implementation Report

**Status:** Production READY  
**Production:** https://kenshi-questpay.vercel.app  
**Feature commit:** `00b3293`  
**Production build SHA:** `4396e58fbe9f820b4cb6e733a25e1a5f8d09fee2`  
**Vercel deployment:** `dpl_8aN2Q55ZR3aBiSJomhKuxLygonkj`

## Architecture

- One dynamically imported, client-only React Three Fiber `Canvas`; no layered DOM/CSS depth simulation remains.
- `QuestPayHeroCanvas` owns WebGL detection, error boundary, intersection/visibility state, reduced-motion handling, DPR cap, and static fallback.
- `QuestPayScene` composes `VerseCube`, `OrbitSystem`, `TokenMedallion`, `ParticleField`, `EnergyShards`, and `SceneLights`.
- Cube is a real `BoxGeometry` with a dark core, invisible depth-writing occluder, physical outer shell, `Edges`, top facet meshes, and a dedicated front-face material.
- The VERSE mark is baked into the front-face texture and is not rendered as a floating badge/card.
- POL, USDT, VERSE, and USDC are real shallow cylinders with face textures, back faces, metallic rims, XYZ self-rotation, and independent inclined 3D orbits.
- Rear/front transitions use the WebGL depth buffer. No duplicate token copies, fake rear layers, or frame-by-frame z-index switching.
- Animation uses `useFrame` and refs only, with clamped delta and no React state updates per frame.

## Generated assets

| Asset | Size | Purpose |
|---|---:|---|
| `public/brand/verse/questpay-cube-front-verse.webp` | 1024×1024 | Integrated cube front face |
| `public/tokens/hero/pol-dark.webp` | 512×512 | POL medallion |
| `public/tokens/hero/usdt-dark.webp` | 512×512 | USDT medallion |
| `public/tokens/hero/verse-dark.webp` | 512×512 | VERSE medallion |
| `public/tokens/hero/usdc-dark.webp` | 512×512 | USDC medallion |
| `public/hero/questpay-hero-fallback.webp` | 1200×900 | No-WebGL/init-failure fallback |

Assets are reproducible with `scripts/generate-hero3d-assets.py`.

## QA evidence

- `npm run lint`: 0 errors; 4 pre-existing admin `<img>` warnings.
- `npm run typecheck`: passed.
- `npm run test`: 18/18 passed.
- `npm run build`: passed.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e`: 15/15 passed.
- Axe WCAG serious/critical contrast issues: 0 after correcting the broad `bg-verse-blue` override and subtle text token.
- Viewports: 1440×900, 1366×768, 390×844, 360×800 — one R3F canvas, no horizontal overflow, no console/page errors.
- Production verification: desktop and mobile each returned one live R3F canvas, no overflow, and no errors.
- Forced fallback: one loaded 640×480 optimized image, zero canvases, zero errors.
- Reduced motion: `frameloop="demand"`; before/after screenshot pixel delta after 3 seconds was exactly `0.0`.
- Simulated visibility loss: hidden for 10 seconds produced pixel delta `0.0`; restore advanced only one clamped frame (`2.6433` mean pixel delta), within ordinary 250 ms motion delta (`2.902`).
- CPU-throttled run: canvas remained mounted with zero JS/WebGL errors.
- 60-second samples: canvas remained mounted/active at 10, 20, 30, 40, 50, and 60 seconds with zero JS/WebGL errors or blank frames.
- Production health endpoint returned build SHA `4396e58fbe9f820b4cb6e733a25e1a5f8d09fee2`.

## Performance notes

- Particle count: 48 desktop / 26 mobile; 10 mid-depth motes desktop / 6 mobile.
- Mobile orbit radii are reduced by 18%; full scene scale is reduced separately.
- DPR is capped; transparent transmission framebuffer passes were removed after profiling while retaining physical clearcoat materials.
- Canvas switches to demand rendering when offscreen, hidden, or reduced-motion is enabled.
- The available CI browser used CPU-only SwiftShader. Unrecorded active-scene measurements were 8.8–9.4 FPS there; the 1440p video-encoding run measured 2.3 FPS. These are software-renderer baselines, not hardware-GPU claims. Offscreen/demand behavior measured ~46.5 FPS in the same environment.

## Evidence files

- Final desktop: `qa/screenshots/true3d/final/desktop-production-candidate-page.png`
- Final mobile: `qa/screenshots/true3d/final/mobile-production-candidate-page.png`
- Side-angle / rear occlusion frame: `qa/screenshots/true3d/final/orbit-8s.png`
- Reduced-motion and tab-restore captures: `qa/screenshots/true3d/final/`
- 60-second recording: `qa/videos/true3d/questpay-true3d-motion-60s.mp4`
- Structured results: `qa/true3d-qa-results.json`

## Backup / rollback

Backup: `/root/hermes_backup_20260713_185828/questpay-true-3d`

Revert all commits from this rebuild:

```bash
git revert --no-edit 4396e58 1143c91 ff78ea6 00b3293
```
