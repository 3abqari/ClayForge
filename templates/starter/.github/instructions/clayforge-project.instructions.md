---
applyTo: "src/index.html,src/content.json,src/clayforge.json"
description: "How to mark up a Clayforge project so the editor discovers it."
---

# Clayforge markup and content contract

The site root is `src/`. The framework is vendored at `src/clayforge/` and is
referenced with root-absolute paths; the project's own files use `./`.

## index.html

- Load in this order: `/clayforge/theme/base.css`, `./design.css`,
  `./print.css` (if used), `/clayforge/engine/editor.css`.
- Boot with:
  ```html
  <script type="module">
    import { createClayforge } from "/clayforge/engine/clayforge.js";
    await createClayforge();
  </script>
  ```
- Mark each editable region with `data-edit="key"` plus `data-edit-label`.
  Add `data-edit-controls="..."` to widen or narrow what a client may change,
  and `data-edit-required` to stop the client hiding it.
- Put copy slots on **child** elements: `<span data-field="headline"></span>`.
  A `data-field` on the same element as `data-edit` is unsupported.
- Lists use `<ul data-field="services" data-field-type="list"></ul>`.
- Leave field elements empty in the HTML. The engine fills them from
  `content.json`; duplicate copy in markup will just be overwritten.
- A section that receives floating controls must be a flow container such as
  `div`/`section`/`article`, never a `<p>`.

Control ids: `background`, `color`, `accent`, `fontFamily`, `fontSize`,
`fontWeight`, `textAlign`, `textTransform`, `letterSpacing`, `padding`, `gap`,
`borderWidth`, `radius`.

## content.json

- Flat map of `key -> string | string[]`. Keys match `data-field` values.
- Inline HTML is limited to `br b i em strong u small sup sub`; anything else is
  stripped when rendered.

## clayforge.json

```jsonc
{
  "project": {
    "id": "acme-landing",          // storage namespace: clayforge:acme-landing
    "name": "Acme — Landing Page",
    "template": "landing",
    "templateVersion": "1.0.0",
    "print": false,                 // true adds a print/PDF button
    "allowDesignerMode": true       // false blocks ?mode=designer
  },
  "sections": {                     // optional overrides of the markup
    "hero": { "label": "Hero", "controls": ["background", "color"], "hideable": false }
  }
}
```

`project.id` is the localStorage key — keep it unique across clients.
