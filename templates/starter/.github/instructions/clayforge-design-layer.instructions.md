---
applyTo: "src/**/*.css"
description: "Every project stylesheet rule must live in @layer design."
---

# Project CSS belongs to the design layer

- Begin every project stylesheet with `@layer base, design, client;` then put all
  rules inside `@layer design { ... }`.
- Never write `@layer client` by hand. The engine generates that layer from the
  client's saved tweaks; hand-written rules there would be wiped on the next edit.
- Do not use `!important`. Layer order already guarantees
  `client` beats `design` beats `base`.
- The one exception is `print.css`: page geometry stays unlayered inside
  `@media print` / `@page` so it survives client edits.
- When hiding a section could leave an empty grid or flex track, add a
  `:has(> [data-edit-hidden])` reflow rule next to the layout rule it fixes.
- Style sections through their semantic classes, not through `[data-edit="..."]`
  selectors — that attribute selector is reserved for the generated client layer.
- `src/clayforge/**` is vendored framework code and is never edited here.
