---
applyTo: "src/clayforge/**"
description: "Vendored Clayforge framework copy — do not edit in this project."
---

# Vendored framework — read only

`src/clayforge/` is a copy of the Clayforge framework, placed here by
`tools/new-project.ps1` and refreshed by `tools/sync.ps1`.

- Never edit anything under `src/clayforge/`. The next sync overwrites it.
- If this project needs behaviour the engine does not have, first try solving it
  in `src/design.css`. If that genuinely cannot work, say so and change the
  framework source repository, then re-sync.
- `src/clayforge/theme/base.css` is doubly locked: it defines the cascade layer
  order and the reset baseline for every client snapshot.
