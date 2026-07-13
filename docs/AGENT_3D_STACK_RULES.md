# Persistent QuestPay 3D Stack Rules

Copy this file into the repo root as `AGENTS.md` or merge it into the agent instruction file already used by the project.

## Always remember

QuestPay uses:

```text
Three.js + React Three Fiber v8 + Drei v9
GSAP + ScrollTrigger only for entrance and scroll sequences
```

## Responsibilities

### Three.js
- scene graph;
- geometry;
- material;
- lighting;
- camera;
- curves;
- textures;
- real depth/occlusion.

### React Three Fiber
- declarative JSX scene;
- `Canvas`;
- `useFrame`;
- refs and cleanup;
- React/Next integration.

### Drei
- `AdaptiveDpr`;
- `PerformanceMonitor`;
- texture/preload helpers;
- inexpensive scene helpers.

### GSAP
- DOM hero entrance;
- ScrollTrigger story;
- camera movement tied to scroll;
- section transitions.

## Forbidden

- CSS fake-3D replacement;
- DOM z-index orbit;
- React `setState` every animation frame;
- recurring GSAP `power2.inOut` orbit loops;
- remounting tokens at front/back crossing;
- disabling depth testing to force visibility;
- using random values every frame;
- full cube spin;
- OrbitControls on the public hero;
- mobile canvas intercepting touch.

## Continuous motion rule

Use R3F `useFrame` and mutate Three refs.

Use arc-length movement:

```ts
progress.current = (progress.current + delta / duration) % 1;
curve.getPointAt(progress.current, point.current);
node.position.copy(point.current);
```

The medallion rotates independently on X/Y/Z.

## Mobile rule

Keep all four tokens, real occlusion, and the same visual identity. Reduce particles, radius, and DPR—not product meaning.
