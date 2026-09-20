---
applyTo: "theme/**,engine/**"
description: "ClayForge framework files: locked baseline and shared engine."
---

# Framework files

- `theme/base.css` must not be modified. It declares `@layer base, design, client;`
  and the reset-safe defaults every project falls back to. Changing it breaks
  "reset to original" for every existing client snapshot.
- `engine/**` is the shared editor. A change here reaches every project on its
  next `tools/sync.ps1`, so treat it as a public API.
- Any new design control must be added to `engine/controls.js` with a validator,
  because control values are compiled into CSS and may arrive from an imported file.
- Bump `ENGINE_VERSION` in `engine/store.js` for any behaviour change, and bump
  `FORMAT_VERSION` plus add a migration in `adoptEnvelope` if the snapshot shape
  changes.
- Keep it build-free: plain ES modules and CSS, no bundler, no `node_modules`.
